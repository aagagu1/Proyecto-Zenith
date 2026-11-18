// ==========================================================
// 1. INICIALIZACIÓN DE LAS GRÁFICAS
// ==========================================================

// Gráfica de Líneas
// Gráfica de Líneas (Solo los 7 campos subrayados en azul)
// Gráfica de Líneas (Clara, con ejes etiquetados y 8 puntos en horizontal)
const ctxLine = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(ctxLine, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { 
                label: 'Temp. (°C)', 
                data: [], 
                borderColor: '#C59366', 
                backgroundColor: '#C59366', 
                borderWidth: 2.5,
                pointRadius: 3,
                tension: 0.3,
                yAxisID: 'y'
            },
            { 
                label: 'Humedad (% HR)', 
                data: [], 
                borderColor: '#339AF0', 
                backgroundColor: '#339AF0', 
                borderWidth: 2.5,
                pointRadius: 3,
                tension: 0.3,
                yAxisID: 'y'
            },
            { 
                label: 'PM 1.0', 
                data: [], 
                borderColor: '#5FBF8F', 
                backgroundColor: '#5FBF8F', 
                borderWidth: 2,
                pointRadius: 2.5,
                tension: 0.3,
                yAxisID: 'y'
            },
            { 
                label: 'PM 2.5', 
                data: [], 
                borderColor: '#94D82D', 
                backgroundColor: '#94D82D', 
                borderWidth: 2,
                pointRadius: 2.5,
                tension: 0.3,
                yAxisID: 'y'
            },
            { 
                label: 'PM 4.0', 
                data: [], 
                borderColor: '#E0B85C', 
                backgroundColor: '#E0B85C', 
                borderWidth: 2,
                pointRadius: 2.5,
                tension: 0.3,
                yAxisID: 'y'
            },
            { 
                label: 'PM 10.0', 
                data: [], 
                borderColor: '#FF922B', 
                backgroundColor: '#FF922B', 
                borderWidth: 2,
                pointRadius: 2.5,
                tension: 0.3,
                yAxisID: 'y'
            },
            { 
                label: 'Presión (hPa)', 
                data: [], 
                borderColor: '#20C997', 
                backgroundColor: '#20C997', 
                borderDash: [5, 4],
                borderWidth: 1.5,
                pointRadius: 2,
                tension: 0.3,
                yAxisID: 'yPresion'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: { 
                labels: { 
                    color: '#E9E7F5', 
                    font: { family: 'Inter', size: 11 },
                    boxWidth: 10,
                    padding: 12
                } 
            },
            tooltip: {
                backgroundColor: 'rgba(17, 22, 31, 0.95)',
                titleColor: '#C59366',
                bodyColor: '#E9E7F5',
                borderColor: 'rgba(197, 147, 102, 0.4)',
                borderWidth: 1
            }
        },
        scales: {
            x: { 
                ticks: { 
                    color: '#9BA3B4', 
                    font: { family: 'Inter', size: 11 },
                    maxRotation: 0, // Horas horizontales sin inclinarse
                    autoSkip: false
                }, 
                grid: { color: 'rgba(233, 231, 245, 0.08)' },
                title: {
                    display: true,
                    text: 'Hora de recepción (últimos 8 paquetes)',
                    color: '#9BA3B4',
                    font: { family: 'Inter', size: 11, weight: '600' }
                }
            },
            y: { 
                type: 'linear',
                position: 'left',
                ticks: { color: '#E9E7F5', font: { family: 'Inter', size: 11 } }, 
                grid: { color: 'rgba(233, 231, 245, 0.08)' },
                title: {
                    display: true,
                    text: 'Temp (°C) · Hum (%) · PM (µg/m³)',
                    color: '#E9E7F5',
                    font: { family: 'Inter', size: 11, weight: '600' }
                }
            },
            yPresion: {
                type: 'linear',
                position: 'right',
                ticks: { color: '#20C997', font: { family: 'Inter', size: 11 } },
                grid: { drawOnChartArea: false },
                title: {
                    display: true,
                    text: 'Presión atmosférica (hPa)',
                    color: '#20C997',
                    font: { family: 'Inter', size: 11, weight: '600' }
                }
            }
        }
    }
});

// Gráfica de Barras
const ctxBar = document.getElementById('barChart').getContext('2d');
const barChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
        labels: ['PM 1.0', 'PM 2.5', 'PM 4.0', 'PM 10'],
        datasets: [
            { 
                label: 'Concentración (µg/m³)', 
                data: [0, 0, 0, 0], 
                backgroundColor: '#C59366',
                borderRadius: 4,
                borderWidth: 0
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: { 
                ticks: { color: '#9BA3B4', font: { family: 'Inter', size: 11 } }, 
                grid: { display: false } 
            },
            y: { 
                ticks: { color: '#9BA3B4', font: { family: 'Inter', size: 11 } }, 
                grid: { color: 'rgba(233, 231, 245, 0.1)' } 
            }
        }
    }
});

// ==========================================================
// 2. PANEL DE CONTROL Y SELECTOR DE ESTACIONES
// ==========================================================

let pausado = false;
let fuenteActiva = 'estacion1'; // Estación 1 seleccionada por defecto
let paquetesActuales = [];
let mostrarTodoHistorial = false;
const avisosDescartados = new Set();

// Estado independiente de conexión y último paquete por cada sonda/estación
const estadoFuentes = {
    estacion1: { conectada: true,  estadoTexto: 'Conectando...', tipoEstado: 'estado-revisar', ultimoPaquete: '--' },
    estacion2: { conectada: false, estadoTexto: 'Desconectado',  tipoEstado: 'estado-fallo',   ultimoPaquete: '--' },
    estacion3: { conectada: false, estadoTexto: 'Desconectado',  tipoEstado: 'estado-fallo',   ultimoPaquete: '--' },
    sonda:     { conectada: false, estadoTexto: 'Desconectado',  tipoEstado: 'estado-fallo',   ultimoPaquete: '--' }
};

const antennaBtns = document.querySelectorAll('.antenna-btn');
const panelControl = document.querySelector('.panel[aria-labelledby="titulo-panel"]');
const btnPantallaCompleta = document.getElementById('btn-pantalla-completa');
const btnPausar = document.getElementById('btn-pausar');
const btnLimpiar = document.getElementById('btn-limpiar');
const btnExportCsv = document.getElementById('btn-export-csv');
const btnExportJson = document.getElementById('btn-export-json');
const btnHistorial = document.getElementById('btn-historial');
const desplegableExportar = document.querySelector('.desplegable');

const estadoConexion = document.getElementById('estado-conexion');
const estadoTexto = document.getElementById('estado-texto');
const ultimoPaqueteEl = document.getElementById('ultimo-paquete');
const recibidoEl = document.querySelector('.recibido');
const crcEl = document.querySelector('.crc');
const antenaSeleccionadaEl = document.getElementById('antena-seleccionada');
const consolaListaEl = document.getElementById('consola-lista');
const avisosListaEl = document.getElementById('avisos-lista');
const nodosItems = document.querySelectorAll('.nodos-barra li[data-antena]');

if (panelControl && btnPantallaCompleta) {
    btnPantallaCompleta.addEventListener('click', () => {
        const activa = panelControl.classList.toggle('panel-pantalla-completa');
        btnPantallaCompleta.textContent = activa ? 'Cerrar pantalla completa' : 'Pantalla completa';
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && panelControl.classList.contains('panel-pantalla-completa')) {
            panelControl.classList.remove('panel-pantalla-completa');
            btnPantallaCompleta.textContent = 'Pantalla completa';
        }
    });
}

document.addEventListener('click', e => {
    if (desplegableExportar && desplegableExportar.open && !desplegableExportar.contains(e.target)) {
        desplegableExportar.open = false;
    }
});

const nombresFuente = {
    estacion1: 'Estación 1',
    estacion2: 'Estación 2',
    estacion3: 'Estación 3',
    sonda: 'Sonda'
};

const mapaSelectorAPanel = {
    antena1: 'estacion1',
    antena2: 'estacion2',
    antena3: 'estacion3',
    sonda: 'sonda'
};

const mapaPanelASelector = {
    estacion1: 'antena1',
    estacion2: 'antena2',
    estacion3: 'antena3',
    sonda: 'antena3' && 'sonda'
};

// Refresca la caja superior izquierda ("Estado" y "Último paquete") según la sonda activa
function actualizarVistaEstadoSuperior() {
    const info = estadoFuentes[fuenteActiva];
    const nodoLi = document.querySelector(`.nodos-barra li[data-antena="${fuenteActiva}"]`);
    const tienePilotoVerde = nodoLi && nodoLi.classList.contains('nodo-ok');

    // Sincronizar si el piloto ya está en verde pero seguía el texto inicial
    if (tienePilotoVerde && info && info.estadoTexto === 'Conectando...') {
        info.conectada = true;
        info.tipoEstado = 'estado-ok';
        info.estadoTexto = 'Conectado';
    }

    if (!pausado && estadoConexion && estadoTexto && info) {
        estadoConexion.className = `insignia ${info.tipoEstado}`;
        estadoTexto.textContent = info.estadoTexto;
    }

    if (ultimoPaqueteEl && info) {
        ultimoPaqueteEl.textContent = `Último paquete: ${info.ultimoPaquete}`;
    }
}

function seleccionarFuente(idPanel) {
    fuenteActiva = idPanel;
    const idSelector = mapaPanelASelector[idPanel] || idPanel;

    antennaBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-antena') === idSelector);
    });

    nodosItems.forEach(n => {
        const esActiva = n.getAttribute('data-antena') === idPanel;
        n.classList.toggle('nodo-activo', esActiva);
        if (esActiva) {
            n.setAttribute('aria-current', 'true');
        } else {
            n.removeAttribute('aria-current');
        }
    });

    if (antenaSeleccionadaEl) {
        antenaSeleccionadaEl.textContent = nombresFuente[idPanel] || idPanel;
    }

    actualizarVistaEstadoSuperior();
    pintarPaquetes();
}

antennaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const idSelector = btn.getAttribute('data-antena');
        seleccionarFuente(mapaSelectorAPanel[idSelector] || idSelector);
    });
});

nodosItems.forEach(item => {
    item.addEventListener('click', () => {
        seleccionarFuente(item.getAttribute('data-antena'));
    });
});

if (btnPausar) {
    btnPausar.addEventListener('click', () => {
        pausado = !pausado;
        btnPausar.setAttribute('aria-pressed', String(pausado));
        btnPausar.textContent = pausado ? 'Reanudar' : 'Pausar';

        if (pausado && estadoConexion && estadoTexto) {
            estadoConexion.className = 'insignia estado-revisar';
            estadoTexto.textContent = 'Pausado';
        } else {
            actualizarVistaEstadoSuperior();
        }
    });
}

if (btnLimpiar && consolaListaEl) {
    btnLimpiar.addEventListener('click', () => {
        paquetesActuales = paquetesActuales.filter(p => p.antena !== fuenteActiva);
        pintarPaquetes();
    });
}

if (btnHistorial && consolaListaEl) {
    btnHistorial.addEventListener('click', () => {
        mostrarTodoHistorial = !mostrarTodoHistorial;
        consolaListaEl.style.maxHeight = mostrarTodoHistorial ? 'none' : '';
        btnHistorial.textContent = mostrarTodoHistorial ? 'Ver menos' : 'Ver historial completo';
    });
}

function descargarArchivo(contenido, nombre, tipo) {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
}

if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
        const filas = obtenerPaquetesVisibles();
        const cabecera = 'Antena,Hora,Paquete,Temp,PM2.5,Estado,Humedad,Presion,Bateria,PM1.0,PM4.0,PM10';
        const lineas = filas.map(p => [
            p.antena, p.hora, p.id, p.temp, p.pm25, p.estado,
            p.humedad, p.presion, p.bateria, p.pm1, p.pm4, p.pm10
        ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
        descargarArchivo([cabecera, ...lineas].join('\n'), `zenith_${fuenteActiva}.csv`, 'text/csv;charset=utf-8;');
        if (desplegableExportar) desplegableExportar.open = false;
    });
}

if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
        const filas = obtenerPaquetesVisibles();
        descargarArchivo(JSON.stringify(filas, null, 2), `zenith_${fuenteActiva}.json`, 'application/json');
        if (desplegableExportar) desplegableExportar.open = false;
    });
}

function clasePorTipo(tipo) {
    if (tipo === 'fallo') return 'estado-fallo';
    if (tipo === 'revisar') return 'estado-revisar';
    if (tipo === 'activa') return 'antena-activa';
    return 'estado-ok';
}

function obtenerPaquetesVisibles() {
    return paquetesActuales.filter(p => p.antena === fuenteActiva);
}

function pintarPaquetes() {
    if (!consolaListaEl) return;
    const visibles = obtenerPaquetesVisibles();
    consolaListaEl.innerHTML = '';

    if (visibles.length === 0) {
        consolaListaEl.innerHTML = '<p class="consola-vacia">Sin paquetes en la vista actual.</p>';
        return;
    }

    visibles.forEach((p, indice) => {
        const details = document.createElement('details');
        details.className = 'fila-paquete';
        if (indice === 0) details.open = true;

        const summary = document.createElement('summary');
        summary.className = 'fila-resumen';
        summary.innerHTML = `
            <span>${p.hora}</span>
            <span>${p.id}</span>
            <span>${p.temp}</span>
            <span>${p.pm25}</span>
            <span class="${clasePorTipo(p.tipoEstado)}">${p.estado}</span>
        `;

        const detalle = document.createElement('div');
        detalle.className = 'fila-detalle';
        detalle.innerHTML = `
            <span>Humedad: <strong>${p.humedad}</strong></span>
            <span>Presión: <strong>${p.presion}</strong></span>
            <span>PM 1.0: <strong>${p.pm1}</strong></span>
            <span>PM 2.5: <strong>${p.pm25}</strong></span>
            <span>PM 4.0: <strong>${p.pm4}</strong></span>
            <span>PM 10.0: <strong>${p.pm10}</strong></span>
        `;

        details.appendChild(summary);
        details.appendChild(detalle);
        consolaListaEl.appendChild(details);
    });
}

actualizarVistaEstadoSuperior();
pintarPaquetes();