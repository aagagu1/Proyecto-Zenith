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