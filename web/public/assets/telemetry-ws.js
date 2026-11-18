// ==========================================================
// TELEMETRÍA EN TIEMPO REAL - WEBSOCKET CON RECONEXIÓN SILENCIOSA
// ==========================================================

const MAX_CHART_POINTS = 8;
let receivedPacketsCount = 0;
let crcErrorsCount = 0;

let wsSocket = null;
let wasConnected = false;
let reconnectAttempts = 0;
const MAX_VISIBLE_RETRIES = 5;
const SILENT_RETRY_INTERVAL_MS = 5000;
let reconnectTimer = null;

function setSourceConnectionState(sourceId, isConnected, statusClass, labelText, lastPacketTime = null) {
    const nodeItem = document.querySelector(`.nodos-barra li[data-antena="${sourceId}"]`);
    if (nodeItem) {
        nodeItem.classList.toggle('nodo-ok', isConnected);
        nodeItem.classList.toggle('nodo-fallo', !isConnected);
    }

    if (typeof estadoFuentes !== 'undefined' && estadoFuentes[sourceId]) {
        estadoFuentes[sourceId].conectada = isConnected;
        estadoFuentes[sourceId].tipoEstado = statusClass;
        estadoFuentes[sourceId].estadoTexto = labelText;
        if (lastPacketTime !== null) {
            estadoFuentes[sourceId].ultimoPaquete = lastPacketTime;
        }
    }

    if (typeof fuenteActiva !== 'undefined' && fuenteActiva === sourceId && typeof actualizarVistaEstadoSuperior === 'function') {
        actualizarVistaEstadoSuperior();
    }
}

// Mapea node_id (1, 2, 3, 4...) al identificador de pestaña del panel
function resolveAntennaSource(rawPayload) {
    if (rawPayload.antena) return rawPayload.antena;
    if (rawPayload.node_id !== undefined) {
        const nodeMap = { 1: 'estacion1', 2: 'estacion2', 3: 'estacion3', 4: 'sonda' };
        return nodeMap[Number(rawPayload.node_id)] || 'estacion1';
    }
    return 'estacion1';
}

function connectWebSocket() {
    if (wsSocket && (wsSocket.readyState === WebSocket.OPEN || wsSocket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const host = window.location.hostname || 'localhost';
    const wsUrl = `ws://${host}:8765`;
    wsSocket = new WebSocket(wsUrl);

    wsSocket.onopen = () => {
        console.log("Zenith WebSocket connected on port 8765");
        wasConnected = true;
        reconnectAttempts = 0;
        setSourceConnectionState('estacion1', true, 'estado-ok', 'Conectado');
    };

    wsSocket.onmessage = (event) => {
        if (typeof pausado !== 'undefined' && pausado) return;

        let rawPayload;
        try {
            rawPayload = JSON.parse(event.data);
        } catch (err) {
            console.error("Invalid JSON packet received:", event.data);
            return;
        }

        receivedPacketsCount++;

        const currentTimeStr = rawPayload.timestamp
            ? new Date(rawPayload.timestamp).toLocaleTimeString()
            : new Date().toLocaleTimeString();

        // 1. Extracción y escalado de todos los campos de la trama[cite: 11, 12]
        const antennaSource = resolveAntennaSource(rawPayload);
        const packetSeq = rawPayload.packet_seq ?? rawPayload.paquete_id ?? receivedPacketsCount;
        const batteryMv = rawPayload.v_bat_mv !== undefined
            ? `${rawPayload.v_bat_mv} mV`
            : (rawPayload.voltaje_bateria !== undefined ? `${rawPayload.voltaje_bateria} V` : '--');

        // Los 7 valores subrayados en azul (con su escala real aplicada)[cite: 11, 12]
        const tempC = rawPayload.temp_c_x100 !== undefined ? Number((rawPayload.temp_c_x100 / 100).toFixed(2)) : rawPayload.temperatura;
        const humRh = rawPayload.hum_rh_x100 !== undefined ? Number((rawPayload.hum_rh_x100 / 100).toFixed(2)) : rawPayload.humedad;
        const pressHpa = rawPayload.press_pa !== undefined ? Number((rawPayload.press_pa / 100).toFixed(2)) : rawPayload.presion;
        const pm1 = rawPayload.pm1_0_x10 !== undefined ? Number((rawPayload.pm1_0_x10 / 10).toFixed(1)) : rawPayload.pm1;
        const pm25 = rawPayload.pm2_5_x10 !== undefined ? Number((rawPayload.pm2_5_x10 / 10).toFixed(1)) : rawPayload.pm2_5;
        const pm4 = rawPayload.pm4_0_x10 !== undefined ? Number((rawPayload.pm4_0_x10 / 10).toFixed(1)) : rawPayload.pm4;
        const pm10 = rawPayload.pm10_0_x10 !== undefined ? Number((rawPayload.pm10_0_x10 / 10).toFixed(1)) : rawPayload.pm10;

        // Validación CRC / Estado
        const hasCrcError = rawPayload.crc_valido === false || (rawPayload.estado_sensor && rawPayload.estado_sensor !== 'OK');
        if (hasCrcError) crcErrorsCount++;

        setSourceConnectionState(antennaSource, true, 'estado-ok', 'Conectado', currentTimeStr);

        // 2. Guardar paquete completo para la consola desplegable (incluye batería y secuencia)
        const formattedPacket = {
            antena: antennaSource,
            hora: currentTimeStr,
            id: `#${packetSeq}`,
            temp: tempC !== undefined ? `${tempC} °C` : '--',
            pm25: pm25 !== undefined ? `${pm25} µg/m³` : '--',
            estado: hasCrcError ? 'Error CRC' : 'OK',
            tipoEstado: hasCrcError ? 'fallo' : 'ok',
            humedad: humRh !== undefined ? `${humRh} % HR` : '--',
            presion: pressHpa !== undefined ? `${pressHpa} hPa` : '--',
            bateria: batteryMv,
            pm1: pm1 !== undefined ? `${pm1} µg/m³` : '--',
            pm4: pm4 !== undefined ? `${pm4} µg/m³` : '--',
            pm10: pm10 !== undefined ? `${pm10} µg/m³` : '--'
        };

        if (typeof paquetesActuales !== 'undefined' && typeof pintarPaquetes === 'function') {
            paquetesActuales.unshift(formattedPacket);
            if (paquetesActuales.length > 200) paquetesActuales.pop();
            pintarPaquetes();
        }

        if (typeof recibidoEl !== 'undefined' && recibidoEl) {
            recibidoEl.textContent = `Recibidos ${receivedPacketsCount}`;
        }
        if (typeof crcEl !== 'undefined' && crcEl) {
            crcEl.textContent = `CRC ${rawPayload.crc_errores ?? crcErrorsCount}`;
        }

        // 3. Pintar en la gráfica superior ÚNICAMENTE los 7 campos subrayados en azul[cite: 11, 12]
        if (typeof lineChart !== 'undefined') {
            lineChart.data.labels.push(currentTimeStr);
            lineChart.data.datasets[0].data.push(tempC ?? null);
            lineChart.data.datasets[1].data.push(humRh ?? null);
            lineChart.data.datasets[2].data.push(pm1 ?? null);
            lineChart.data.datasets[3].data.push(pm25 ?? null);
            lineChart.data.datasets[4].data.push(pm4 ?? null);
            lineChart.data.datasets[5].data.push(pm10 ?? null);
            lineChart.data.datasets[6].data.push(pressHpa ?? null);

            if (lineChart.data.labels.length > MAX_CHART_POINTS) {
                lineChart.data.labels.shift();
                lineChart.data.datasets.forEach(ds => ds.data.shift());
            }
            lineChart.update('none');
        }

        // 4. Actualizar gráfica inferior de barras con las 4 partículas
        if (typeof barChart !== 'undefined' && pm1 !== undefined) {
            barChart.data.labels = ['PM 1.0', 'PM 2.5', 'PM 4.0', 'PM 10.0'];
            barChart.data.datasets[0].data = [
                pm1 ?? 0,
                pm25 ?? 0,
                pm4 ?? 0,
                pm10 ?? 0
            ];
            barChart.update('none');
        }
    };

    wsSocket.onclose = () => {
        clearTimeout(reconnectTimer);

        if (wasConnected && reconnectAttempts < MAX_VISIBLE_RETRIES) {
            reconnectAttempts++;
            console.warn(`WebSocket disconnected. Visible retry ${reconnectAttempts}/${MAX_VISIBLE_RETRIES}...`);
            setSourceConnectionState('estacion1', false, 'estado-revisar', 'Reconectando...');
            reconnectTimer = setTimeout(connectWebSocket, 3000);
        } else {
            console.debug("WebSocket in silent background retry mode...");
            setSourceConnectionState('estacion1', false, 'estado-fallo', 'Desconectado');
            reconnectTimer = setTimeout(connectWebSocket, SILENT_RETRY_INTERVAL_MS);
        }
    };

    wsSocket.onerror = () => {};
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (!wsSocket || wsSocket.readyState === WebSocket.CLOSED) {
            clearTimeout(reconnectTimer);
            connectWebSocket();
        }
    }
});

connectWebSocket();