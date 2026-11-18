// ==========================================================
// TELEMETRÍA EN TIEMPO REAL - WEBSOCKET CON RECONEXIÓN SILENCIOSA
// ==========================================================

const MAX_CHART_POINTS = 30;
let receivedPacketsCount = 0;

let wsSocket = null;
let wasConnected = false; // Indica si alguna vez hubo conexión en esta sesión
let reconnectAttempts = 0;
const MAX_VISIBLE_RETRIES = 5; // Intentos visibles ("Reconectando...") antes de pasar a modo silencioso
const SILENT_RETRY_INTERVAL_MS = 5000; // Reintento silencioso cada 5 segundos
let reconnectTimer = null;

function setConnectionStatus(statusType, labelText) {
    if (!estadoConexion || !estadoTexto || (typeof pausado !== 'undefined' && pausado)) return;
    estadoConexion.className = `insignia ${statusType}`;
    estadoTexto.textContent = labelText;
}

function connectWebSocket() {
    if (wsSocket && (wsSocket.readyState === WebSocket.OPEN || wsSocket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const host = window.location.hostname || 'localhost';
    const wsUrl = `ws://${host}:8765`;
    wsSocket = new WebSocket(wsUrl);

    // 1. CONEXIÓN ESTABLECIDA
    wsSocket.onopen = () => {
        console.log("Zenith WebSocket connected on port 8765");
        wasConnected = true;
        reconnectAttempts = 0;
        setConnectionStatus('estado-ok', 'Conectado');
    };

    // 2. RECEPCIÓN DE DATOS EN VIVO
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

        const antennaSource = rawPayload.antena || 'sonda';
        const hasSensorError = rawPayload.estado_sensor && rawPayload.estado_sensor !== 'OK';

        const formattedPacket = {
            antena: antennaSource,
            hora: currentTimeStr,
            id: rawPayload.paquete_id ? `#${rawPayload.paquete_id}` : `#${receivedPacketsCount}`,
            temp: rawPayload.temperatura !== undefined ? `${rawPayload.temperatura} °C` : '--',
            pm25: rawPayload.pm2_5 !== undefined ? `${rawPayload.pm2_5} µg/m³` : '--',
            estado: rawPayload.estado_sensor || 'OK',
            tipoEstado: hasSensorError ? 'fallo' : 'ok',
            humedad: rawPayload.humedad !== undefined ? `${rawPayload.humedad} % HR` : '--',
            presion: rawPayload.presion !== undefined ? `${rawPayload.presion} hPa` : '--',
            bateria: rawPayload.voltaje_bateria !== undefined ? `${rawPayload.voltaje_bateria} V` : '--',
            pm1: rawPayload.pm1 !== undefined ? `${rawPayload.pm1} µg/m³` : '--',
            pm4: rawPayload.pm4 !== undefined ? `${rawPayload.pm4} µg/m³` : '--',
            pm10: rawPayload.pm10 !== undefined ? `${rawPayload.pm10} µg/m³` : '--'
        };

        if (typeof paquetesActuales !== 'undefined' && typeof pintarPaquetes === 'function') {
            if (receivedPacketsCount === 1) {
                paquetesActuales = [];
            }
            paquetesActuales.unshift(formattedPacket);
            if (paquetesActuales.length > 100) paquetesActuales.pop();
            pintarPaquetes();
        }

        if (typeof ultimoPaqueteEl !== 'undefined' && ultimoPaqueteEl) {
            ultimoPaqueteEl.textContent = `Último paquete: ${currentTimeStr} (en vivo)`;
        }
        if (typeof recibidoEl !== 'undefined' && recibidoEl) {
            recibidoEl.textContent = `Recibidos ${receivedPacketsCount}`;
        }
        if (typeof perdidosEl !== 'undefined' && perdidosEl) {
            perdidosEl.textContent = `Perdidos ${rawPayload.perdidos ?? 0}`;
        }
        if (typeof crcEl !== 'undefined' && crcEl) {
            crcEl.textContent = `CRC ${rawPayload.crc_errores ?? 0}`;
        }

        // Actualizar Gráfica de Líneas
        if (typeof lineChart !== 'undefined' && rawPayload.temperatura !== undefined) {
            if (lineChart.data.datasets[0].label === 'Evolución (Principal)') {
                lineChart.data.datasets[0].label = 'Temperatura (°C)';
                lineChart.data.datasets[1].label = 'Humedad (%)';
            }

            lineChart.data.labels.push(currentTimeStr);
            lineChart.data.datasets[0].data.push(rawPayload.temperatura);
            lineChart.data.datasets[1].data.push(rawPayload.humedad ?? null);

            if (lineChart.data.labels.length > MAX_CHART_POINTS) {
                lineChart.data.labels.shift();
                lineChart.data.datasets.forEach(ds => ds.data.shift());
            }
            lineChart.update('none');
        }

        // Actualizar Gráfica de Barras
        if (typeof barChart !== 'undefined' && rawPayload.pm1 !== undefined) {
            barChart.data.labels = ['PM 1.0', 'PM 2.5', 'PM 4.0', 'PM 10'];
            barChart.data.datasets[0].data = [
                rawPayload.pm1 ?? 0,
                rawPayload.pm2_5 ?? 0,
                rawPayload.pm4 ?? 0,
                rawPayload.pm10 ?? 0
            ];
            barChart.update('none');
        }
    };

    // 3. GESTIÓN DE CIERRE Y RECONEXIÓN SILENCIOSA
    wsSocket.onclose = () => {
        clearTimeout(reconnectTimer);

        if (wasConnected && reconnectAttempts < MAX_VISIBLE_RETRIES) {
            reconnectAttempts++;
            console.warn(`WebSocket disconnected. Visible retry ${reconnectAttempts}/${MAX_VISIBLE_RETRIES}...`);
            setConnectionStatus('estado-revisar', 'Reconectando...');
            reconnectTimer = setTimeout(connectWebSocket, 3000);
        } else {
            console.debug("WebSocket in silent background retry mode...");
            setConnectionStatus('estado-fallo', 'Desconectado');
            reconnectTimer = setTimeout(connectWebSocket, SILENT_RETRY_INTERVAL_MS);
        }
    };

    wsSocket.onerror = () => {
        // Silenciamos el error en consola durante los reintentos en segundo plano
    };
}

// 4. SI LA PESTAÑA SE CONGELA Y VUELVE A ACTIVARSE
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (!wsSocket || wsSocket.readyState === WebSocket.CLOSED) {
            clearTimeout(reconnectTimer);
            connectWebSocket();
        }
    }
});

// Arrancar conexión inicial
connectWebSocket();
