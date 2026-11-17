// 1. Inicializar Gráfica de Líneas
const ctxLine = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(ctxLine, {
    type: 'line',
    data: {
        labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        datasets: [
            {
                label: 'R2 Data',
                data: [45, 60, 52, 40, 75, 105, 78, 85, 50, 98, 70],
                borderColor: '#C59366',
                backgroundColor: '#C59366',
                borderWidth: 2,
                tension: 0.3
            },
            {
                label: 'R1 Baseline',
                data: [50, 48, 65, 42, 60, 95, 108, 75, 82, 68, 100],
                borderColor: '#00ff33',
                backgroundColor: '#3f4c84',
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
            x: { ticks: { color: '#908E9C' }, grid: { color: 'rgba(144, 142, 156, 0.1)' } },
            y: { ticks: { color: '#908E9C' }, grid: { color: 'rgba(144, 142, 156, 0.1)' } }
        }
    }
});

// 2. Inicializar Gráfica de Barras
const ctxBar = document.getElementById('barChart').getContext('2d');
const barChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
        datasets: [{
            label: 'Volumen R2',
            data: [60, 85, 80, 110, 50, 75, 105, 140],
            backgroundColor: '#908E9C',
            borderColor: '#C59366',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: { ticks: { color: '#908E9C' }, grid: { display: false } },
            y: { ticks: { color: '#908E9C' }, grid: { color: 'rgba(144, 142, 156, 0.1)' } }
        }
    }
});

// ========================================================
// 3. DATOS POR ANTENA Y EVENTOS DE LOS BOTONES
// ========================================================

const datosPorAntena = {
    antena1: {
        lineR2: [45, 60, 52, 40, 75, 105, 78, 85, 50, 98, 70],
        lineR1: [50, 48, 65, 42, 60, 95, 108, 75, 82, 68, 100],
        barValues: [60, 85, 80, 110, 50, 75, 105, 140]
    },
    antena2: {
        lineR2: [30, 45, 40, 55, 62, 70, 65, 72, 68, 75, 80],
        lineR1: [35, 38, 42, 48, 50, 58, 60, 64, 62, 69, 71],
        barValues: [40, 55, 60, 75, 45, 62, 80, 95]
    },
    antena3: {
        lineR2: [80, 85, 92, 88, 95, 115, 110, 120, 105, 130, 125],
        lineR1: [70, 72, 78, 75, 82, 90, 95, 98, 92, 105, 110],
        barValues: [90, 110, 105, 135, 85, 115, 130, 160]
    }
};

let antenaActual = 'antena1';

// Control de clics en los botones
const antennaBtns = document.querySelectorAll('.antenna-btn');

antennaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. Cambiar la clase 'active' visualmente
        antennaBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 2. Obtener qué antena se pulsó (antena1, antena2 o antena3)
        antenaActual = btn.getAttribute('data-antena');

        // 3. Reutilizar tu función para pintar los datos de esa antena
        actualizarGraficasDesdePython(datosPorAntena[antenaActual]);
    });
});

// ========================================================
// FUNCIÓN PARA ACTUALIZAR CON LOS DATOS QUE LLEGUEN DE PYTHON
// ========================================================
function actualizarGraficasDesdePython(nuevosDatos) {
    lineChart.data.datasets[0].data = nuevosDatos.lineR2;
    lineChart.data.datasets[1].data = nuevosDatos.lineR1;
    lineChart.update();

    barChart.data.datasets[0].data = nuevosDatos.barValues;
    barChart.update();
}


/* Panel de Control y Recepción */
const datosRespaldoPanel = {
    paquetes: [
        {
            antena: 'sonda',
            hora: '14:05:30',
            id: '#1031',
            temp: '-12,3 °C',
            pm25: '2,1 µg/m³',
            estado: 'OK',
            tipoEstado: 'ok',
            humedad: '31,5 % HR',
            presion: '54.020 Pa',
            bateria: '3650 mV',
            pm1: '1,4 µg/m³',
            pm4: '2,6 µg/m³',
            pm10: '3,0 µg/m³'
        },
        {
            antena: 'sonda',
            hora: '14:05:27',
            id: '#1030',
            temp: '-11,8 °C',
            pm25: '--',
            estado: 'Incompleto',
            tipoEstado: 'revisar',
            humedad: '31,9 % HR',
            presion: '55.110 Pa',
            bateria: '3650 mV',
            pm1: '--',
            pm4: '--',
            pm10: '--'
        },
        {
            antena: 'sonda',
            hora: '14:05:24',
            id: '#1029',
            temp: '-11,2 °C',
            pm25: '2,5 µg/m³',
            estado: 'Error CRC',
            tipoEstado: 'fallo',
            humedad: '32,4 % HR',
            presion: '56.300 Pa',
            bateria: '3655 mV',
            pm1: '1,7 µg/m³',
            pm4: '3,0 µg/m³',
            pm10: '3,5 µg/m³'
        },
        {
            antena: 'estacion1',
            hora: '14:05:20',
            id: '#4512',
            temp: '18,4 °C',
            pm25: '8,2 µg/m³',
            estado: 'OK',
            tipoEstado: 'ok',
            humedad: '52,0 % HR',
            presion: '101.240 Pa',
            bateria: '4120 mV',
            pm1: '5,1 µg/m³',
            pm4: '9,4 µg/m³',
            pm10: '11,2 µg/m³'
        },
        {
            antena: 'estacion2',
            hora: '14:05:18',
            id: '#2204',
            temp: '17,9 °C',
            pm25: '7,6 µg/m³',
            estado: 'OK',
            tipoEstado: 'ok',
            humedad: '54,1 % HR',
            presion: '101.190 Pa',
            bateria: '4090 mV',
            pm1: '4,8 µg/m³',
            pm4: '8,9 µg/m³',
            pm10: '10,5 µg/m³'
        },
        {
            antena: 'estacion3',
            hora: '14:04:55',
            id: '#0877',
            temp: '14,2 °C',
            pm25: '--',
            estado: 'Error CRC',
            tipoEstado: 'fallo',
            humedad: '48,0 % HR',
            presion: '98.400 Pa',
            bateria: '3410 mV',
            pm1: '--',
            pm4: '--',
            pm10: '--'
        }
    ]
};

let pausado = false;
let fuenteActiva = 'sonda';
let paquetesActuales = [...datosRespaldoPanel.paquetes];
let mostrarTodoHistorial = false;
let snapshotLimpiado = '';
const avisosDescartados = new Set();

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

nodosItems.forEach(item => {
    item.addEventListener('click', () => {
        const id = item.getAttribute('data-antena');
        fuenteActiva = id;

        nodosItems.forEach(n => {
            const esActiva = n.getAttribute('data-antena') === id;
            n.classList.toggle('nodo-activo', esActiva);
            if (esActiva) {
                n.setAttribute('aria-current', 'true');
            } else {
                n.removeAttribute('aria-current');
            }
        });

        if (antenaSeleccionadaEl) {
            antenaSeleccionadaEl.textContent = nombresFuente[id] || id;
        }

        pintarPaquetes();
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
    const filtrados = paquetesActuales.filter(p => !p.antena || p.antena === fuenteActiva);
    return filtrados.length > 0 ? filtrados : paquetesActuales;
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

function actualizarPanelDesdePython(panel) {
    if (!panel) return;

    if (!pausado && estadoConexion && estadoTexto && panel.estado) {
        const esFallo = panel.estado.toLowerCase().includes('desconect') || panel.estado.toLowerCase().includes('error');
        estadoConexion.className = esFallo ? 'insignia estado-fallo' : 'insignia estado-ok';
        estadoTexto.textContent = panel.estado;
    }

    if (ultimoPaqueteEl && panel.ultimoPaquete) {
        ultimoPaqueteEl.textContent = `Último paquete: ${panel.ultimoPaquete}`;
    }

    if (calidadValorEl && panel.calidad) {
        calidadValorEl.textContent = panel.calidad;
    }

    if (contadoresEl && panel.recibidos !== undefined) {
        contadoresEl.textContent = `Recibidos ${panel.recibidos} · Perdidos ${panel.perdidos} · CRC ${panel.crc}`;
    }

    if (Array.isArray(panel.antenas)) {
        panel.antenas.forEach(ant => {
            const li = document.querySelector(`.nodos-barra li[data-antena="${ant.id}"]`);
            if (!li) return;
            li.classList.toggle('nodo-alerta', ant.tipo === 'fallo');
            const small = li.querySelector('small');
            if (small) {
                small.className = clasePorTipo(ant.tipo);
                small.textContent = ant.estado;
            }
        });
    }

    if (Array.isArray(panel.paquetes)) {
        const nuevoSnapshot = JSON.stringify(panel.paquetes);
        if (nuevoSnapshot !== snapshotLimpiado) {
            snapshotLimpiado = '';
            paquetesActuales = panel.paquetes;
            pintarPaquetes();
        }
    }

    if (Array.isArray(panel.avisos)) {
        pintarAvisos(panel.avisos);
    }
}

document.querySelectorAll('#avisos-lista .btn-cerrar').forEach(btn => {
    btn.addEventListener('click', () => {
        const aviso = btn.closest('.aviso');
        if (aviso) aviso.remove();
    });
});

function obtenerDatosPanel() {
    if (pausado) return;

    fetch('datos.json')
        .then(response => {
            if (!response.ok) throw new Error('Sin datos.json');
            return response.json();
        })
        .then(data => {
            actualizarPanelDesdePython(data.panel);
        })
        .catch(() => {});
}

obtenerDatosPanel();
setInterval(obtenerDatosPanel, 2000);
