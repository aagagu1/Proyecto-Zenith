import asyncio
import logging
import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

CLIENTES = set()

async def gestor_navegadores(websocket):
    CLIENTES.add(websocket)
    logging.info(f"Navegador conectado. Total: {len(CLIENTES)}")
    try:
        await websocket.wait_closed()
    finally:
        CLIENTES.remove(websocket)
        logging.info(f"Navegador desconectado. Total: {len(CLIENTES)}")

async def receptor_catcher(reader, writer):
    while True:
        linea = await reader.readline()
        if not linea:
            break
        paquete_crudo = linea.decode().strip()
        if paquete_crudo and CLIENTES:
            websockets.broadcast(CLIENTES, paquete_crudo)
    writer.close()
    await writer.wait_closed()

async def main():
    servidor_ws = await websockets.serve(gestor_navegadores, "0.0.0.0", 8765)
    servidor_interno = await asyncio.start_server(receptor_catcher, "0.0.0.0", 8766)
    logging.info("Broadcaster activo en puertos 8765 (WS) y 8766 (Interno)")
    async with servidor_ws, servidor_interno:
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())