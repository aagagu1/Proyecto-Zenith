// ==========================================================
// 1. INICIALIZACIÓN DE LAS GRÁFICAS
// ==========================================================

// Gráfica de Líneas
const ctxLine = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(ctxLine, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { 
                label: 'Evolución (Principal)', 
                data: [], 
                borderColor: '#C59366', 
                backgroundColor: '#C59366', 
                borderWidth: 2, 
                tension: 0.3 
            },
            { 
                label: 'R1 Baseline', 
                data: [], 
                borderColor: '#E9E7F5', 
                backgroundColor: '#616161', 
                borderDash: [5, 5],
                borderWidth: 2, 
                tension: 0.3 
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#E9E7F5', font: { size: 11 } } }
        },
        scales: {
            x: { 
                ticks: { color: '#908E9C', font: { size: 11 } }, 
                grid: { color: 'rgba(233, 231, 245, 0.12)' }
            },
            y: { 
                ticks: { color: '#908E9C', font: { size: 11 } }, 
                grid: { color: 'rgba(233, 231, 245, 0.12)' } 
            }
        }
    }
});

// Gráfica de Barras
const ctxBar = document.getElementById('barChart').getContext('2d');
const barChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [
            { 
                label: 'Antena (Principal)', 
                data: [], 
                backgroundColor: '#E9E7F5',
                borderWidth: 1 
            },
            { 
                label: 'R1 Baseline', 
                data: [], 
                backgroundColor: '#908E9C', 
                borderWidth: 1 
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
                ticks: { color: '#908E9C', font: { size: 11 } }, 
                grid: { display: false } 
            },
            y: { 
                ticks: { color: '#908E9C', font: { size: 11 } }, 
                grid: { color: 'rgba(233, 231, 245, 0.12)' } 
            }
        }
    }
});

function actualizarGraficasDesdePython(nuevosDatos) {
    if (!nuevosDatos) return;

    if (nuevosDatos.labels) {
        lineChart.data.labels = nuevosDatos.labels;
        barChart.data.labels = nuevosDatos.labels;
    }
    if (nuevosDatos.lineR2) {
        lineChart.data.datasets[0].data = nuevosDatos.lineR2;
    }
    if (nuevosDatos.lineR1) {
        lineChart.data.datasets[1].data = nuevosDatos.lineR1;
    }
    lineChart.update();

    if (nuevosDatos.barAntena) {
        barChart.data.datasets[0].data = nuevosDatos.barAntena;
    }
    if (nuevosDatos.barBaseline) {
        barChart.data.datasets[1].data = nuevosDatos.barBaseline;
    }
    barChart.update();
}

// ==========================================================
// 2. PANEL DE CONTROL Y SELECTOR DE ESTACIONES
// ==========================================================

let pausado = false;
let fuenteActiva = 'sonda';
let paquetesActuales = [];
let mostrarTodoHistorial = false;
let snapshotLimpiado = '';
const avisosDescartados = new Set();

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
const calidadValorEl = document.getElementById('calidad-valor');
const contadoresEl = document.getElementById('contadores-paquetes');
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
    sonda: 'sonda'
};

function seleccionarFuente(idPanel) {
    fuenteActiva = idPanel;
    const idSelector = mapaPanelASelector[idPanel] || idPanel;

    // 1. Marcar el botón superior activo
    antennaBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-antena') === idSelector);
    });

    // 2. Marcar la barra de nodos del panel activa
    nodosItems.forEach(n => {
        const esActiva = n.getAttribute('data-antena') === idPanel;
        n.classList.toggle('nodo-activo', esActiva);
        if (esActiva) {
            n.setAttribute('aria-current', 'true');
        } else {
            n.removeAttribute('aria-current');
        }
    });

    // 3. Cambiar el texto de "Antena: ..." en la consola
    if (antenaSeleccionadaEl) {
        antenaSeleccionadaEl.textContent = nombresFuente[idPanel] || idPanel;
    }

    // 4. Filtrar y repintar los paquetes de esa estación
    pintarPaquetes();
}

// Eventos de clic en los botones superiores (Estación 1, 2, 3, Sonda)
antennaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const idSelector = btn.getAttribute('data-antena');
        seleccionarFuente(mapaSelectorAPanel[idSelector] || idSelector);
    });
});

// Eventos de clic en la mini-barra de nodos dentro del panel
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

        if (estadoConexion && estadoTexto) {
            estadoConexion.className = pausado ? 'insignia estado-revisar' : 'insignia estado-ok';
            estadoTexto.textContent = pausado ? 'Pausado' : 'Conectado';
        }
    });
}

if (btnLimpiar && consolaListaEl) {
    btnLimpiar.addEventListener('click', () => {
        snapshotLimpiado = JSON.stringify(paquetesActuales);
        paquetesActuales = [];
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
        descargarArchivo([cabecera, ...lineas].join('\n'), 'zenith_telemetria.csv', 'text/csv;charset=utf-8;');
        if (desplegableExportar) desplegableExportar.open = false;
    });
}

if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
        const filas = obtenerPaquetesVisibles();
        descargarArchivo(JSON.stringify(filas, null, 2), 'zenith_telemetria.json', 'application/json');
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
    return paquetesActuales.filter(p => !p.antena || p.antena === fuenteActiva);
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
            <span>Batería: <strong>${p.bateria}</strong></span>
            <span>PM1.0: <strong>${p.pm1}</strong></span>
            <span>PM4.0: <strong>${p.pm4}</strong></span>
            <span>PM10: <strong>${p.pm10}</strong></span>
        `;

        details.appendChild(summary);
        details.appendChild(detalle);
        consolaListaEl.appendChild(details);
    });
}

function pintarAvisos(avisos) {
    if (!avisosListaEl || !Array.isArray(avisos)) return;
    avisosListaEl.innerHTML = '';

    avisos.forEach(a => {
        if (avisosDescartados.has(a.id)) return;

        const div = document.createElement('div');
        div.className = 'aviso';
        div.setAttribute('role', a.tipo === 'fallo' ? 'alert' : 'status');

        const iconoSvg = a.tipo === 'fallo'
            ? '<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>'
            : '<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3L2 21h20L12 3zM12 10v5M12 18h.01" /></svg>';

        div.innerHTML = `
            ${iconoSvg}
            <p><strong class="${clasePorTipo(a.tipo)}">${a.titulo}</strong> ${a.mensaje}</p>
            <button type="button" class="btn btn-cerrar" aria-label="Descartar aviso">✕</button>
        `;

        const btnCerrar = div.querySelector('.btn-cerrar');
        btnCerrar.addEventListener('click', () => {
            avisosDescartados.add(a.id);
            div.remove();
        });

        avisosListaEl.appendChild(div);
    });
}

document.querySelectorAll('#avisos-lista .btn-cerrar').forEach(btn => {
    btn.addEventListener('click', () => {
        const aviso = btn.closest('.aviso');
        if (aviso) aviso.remove();
    });
});

// Arrancar la consola limpia desde el primer momento
pintarPaquetes();