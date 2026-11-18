import asyncio
import json
from fastapi import FastAPI, Request
from pymongo import MongoClient

app = FastAPI()

cliente_mongo = MongoClient("mongodb://mongodb:27017/")
db = cliente_mongo["zenith_telemetria"]
coleccion = db["paquetes_crudos"]

HOST_BROADCASTER = "broadcaster"
PUERTO_BROADCASTER = 8766

async def enviar_a_broadcaster(paquete_str: str):
    try:
        reader, writer = await asyncio.open_connection(HOST_BROADCASTER, PUERTO_BROADCASTER)
        writer.write((paquete_str + "\n").encode("utf-8"))
        await writer.drain()
        writer.close()
        await writer.wait_closed()
    except ConnectionRefusedError:
        print("Aviso: Broadcaster no disponible.")

@app.post("/")
@app.post("/telemetria")
async def recibir_telemetria(request: Request):
    datos_dict = await request.json()
    coleccion.insert_one(datos_dict.copy())
    await enviar_a_broadcaster(json.dumps(datos_dict))
    return {"estado": "ok", "mensaje": "Paquete almacenado y retransmitido"}