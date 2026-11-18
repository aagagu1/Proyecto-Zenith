import asyncio
import json
import logging
import random
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from pymongo import MongoClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# ==========================================================
# CONFIGURACIÓN DE API METEOROLÓGICA ABIERTA (SIN API KEY)
# ==========================================================
LATITUD = 39.3350   # Parque Natural de l'Albufera (Valencia)
LONGITUD = -0.3414
INTERVALO_CONSULTA_SEG = 3  # Actualiza el panel cada 3 segundos

CLAVE_SECRETA_POST = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"

cliente_mongo = MongoClient("mongodb://mongodb:27017/")
db = cliente_mongo["zenith_telemetria"]
coleccion = db["paquetes_crudos"]

HOST_BROADCASTER = "broadcaster"
PUERTO_BROADCASTER = 8766


async def enviar_a_broadcaster(paquete_str: str):
    """Envía el paquete JSON al microservicio Broadcaster (:8766) para su emisión WebSocket."""
    try:
        reader, writer = await asyncio.open_connection(HOST_BROADCASTER, PUERTO_BROADCASTER)
        writer.write((paquete_str + "\n").encode("utf-8"))
        await writer.drain()
        writer.close()
        await writer.wait_closed()
    except ConnectionRefusedError:
        logging.warning("Broadcaster no disponible en este momento.")


async def obtener_datos_reales(client: httpx.AsyncClient) -> dict | None:
    """Consulta condiciones meteorológicas y calidad del aire reales sin necesidad de clave."""
    url_meteo = (
        f"https://api.open-meteo.com/v1/forecast?latitude={LATITUD}&longitude={LONGITUD}"
        "&current=temperature_2m,relative_humidity_2m,surface_pressure"
    )
    url_aire = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={LATITUD}&longitude={LONGITUD}"
        "&current=pm2_5,pm10"
    )

    resp_meteo, resp_aire = await asyncio.gather(
        client.get(url_meteo, timeout=10.0),
        client.get(url_aire, timeout=10.0)
    )
    resp_meteo.raise_for_status()
    resp_aire.raise_for_status()

    actual_meteo = resp_meteo.json().get("current", {})
    actual_aire = resp_aire.json().get("current", {})

    if not actual_meteo:
        return None

    temp = float(actual_meteo.get("temperature_2m", 20.0))
    hum = float(actual_meteo.get("relative_humidity_2m", 50.0))
    pres = float(actual_meteo.get("surface_pressure", 1013.25))
    pm25 = float(actual_aire.get("pm2_5", 5.0))
    pm10 = float(actual_aire.get("pm10", 10.0))

    # Estimación proporcional para PM1.0 y PM4.0 basada en los valores reales de PM2.5 y PM10
    pm1 = round(pm25 * 0.65, 1)
    pm4 = round((pm25 + pm10) / 2, 1)

    return {
        "temp": temp,
        "hum": hum,
        "pres": pres,
        "pm1": pm1,
        "pm25": pm25,
        "pm4": pm4,
        "pm10": pm10
    }


async def bucle_ingesta_real():
    """Tarea en segundo plano que consulta datos reales y alimenta MongoDB + Broadcaster."""
    secuencia = 1
    async with httpx.AsyncClient() as client:
        while True:
            try:
                datos = await obtener_datos_reales(client)
                if datos:
                    # Micro-fluctuaciones realistas de sensor físico sobre el dato real de l'Albufera
                    temp_sensor = round(datos["temp"] + random.uniform(-0.18, 0.18), 2)
                    hum_sensor = round(max(0.0, min(100.0, datos["hum"] + random.uniform(-0.45, 0.45))), 2)
                    pres_sensor = round(datos["pres"] + random.uniform(-0.15, 0.15), 2)
                    pm1_sensor = round(max(0.1, datos["pm1"] + random.uniform(-0.3, 0.3)), 1)
                    pm25_sensor = round(max(0.2, datos["pm25"] + random.uniform(-0.5, 0.5)), 1)
                    pm4_sensor = round(max(0.3, datos["pm4"] + random.uniform(-0.6, 0.6)), 1)
                    pm10_sensor = round(max(0.5, datos["pm10"] + random.uniform(-0.8, 0.8)), 1)

                    paquete = {
                        "node_id": 1,  # Estación 1
                        "packet_seq": secuencia,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "fuente": "Albufera (Valencia)",
                        "v_bat_mv": 3850,
                        "temp_c_x100": int(round(temp_sensor * 100)),
                        "hum_rh_x100": int(round(hum_sensor * 100)),
                        "press_pa": int(round(pres_sensor * 100)),
                        "pm1_0_x10": int(round(pm1_sensor * 10)),
                        "pm2_5_x10": int(round(pm25_sensor * 10)),
                        "pm4_0_x10": int(round(pm4_sensor * 10)),
                        "pm10_0_x10": int(round(pm10_sensor * 10)),
                        "crc_valido": True
                    }

                    coleccion.insert_one(paquete.copy())
                    await enviar_a_broadcaster(json.dumps(paquete))

                    logging.info(
                        f"[Real #{secuencia}] Temp: {temp_sensor}°C | Hum: {hum_sensor}% | "
                        f"Pres: {pres_sensor} hPa | PM2.5: {pm25_sensor} µg/m³"
                    )
                    secuencia += 1

            except Exception as e:
                logging.error(f"Error consultando datos meteorológicos: {e}")

            await asyncio.sleep(INTERVALO_CONSULTA_SEG)


@asynccontextmanager
async def lifespan(app: FastAPI):
    tarea_ingesta = asyncio.create_task(bucle_ingesta_real())
    yield
    tarea_ingesta.cancel()


app = FastAPI(lifespan=lifespan)


@app.post("/")
@app.post("/telemetria")
async def recibir_telemetria(request: Request, x_api_key: str = Header(None)):
    if x_api_key != CLAVE_SECRETA_POST:
        raise HTTPException(status_code=401, detail="Acceso denegado: clave invalida")

    datos_dict = await request.json()
    coleccion.insert_one(datos_dict.copy())
    await enviar_a_broadcaster(json.dumps(datos_dict))
    return {"estado": "ok", "mensaje": "Paquete almacenado y retransmitido"}