// ==========================================================
// 1. INICIALIZACIÓN DE LAS GRÁFICAS (CONECTADAS A PYTHON)
// ==========================================================

// Gráfica de Líneas
const ctxLine = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(ctxLine, {
    type: 'line',
    data: {
        labels: [], // Se alimenta dinámicamente desde el JSON de Python
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
                borderDash: [5, 5], // Serie de referencia discontinua según guía
                borderWidth: 2, 
                tension: 0.3 
            }
        ]
    },
    options: {
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { 
            legend: { 
                labels: { 
                    color: '#E9E7F5', 
                    font: { family: 'Inter', size: 12 } 
                } 
            } 
        },
        scales: {
            x: { 
                ticks: { color: '#908E9C', font: { size: 11 } }, 
                grid: { color: 'rgba(233, 231, 245, 0.12)' } // Cuadrícula al 12% según guía
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
        labels: [], // Se alimenta dinámicamente desde el JSON de Python
        datasets: [
            { 
                label: 'Antena (Principal)', 
                data: [], 
                backgroundColor: '#E9E7F5', // Barra destacada según guía
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
            legend: { 
                labels: { 
                    color: '#E9E7F5', 
                    font: { family: 'Inter', size: 12 } 
                } 
            } 
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


// ==========================================================
// 2. FUNCIÓN DE ACTUALIZACIÓN DINÁMICA
// ==========================================================
function actualizarGraficasDesdePython(nuevosDatos) {
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
// 3. CONEXIÓN CON EL FLUJO DE PYTHON (LECTURA DE ARCHIVO LOCAL)
// ==========================================================
function obtenerDatosLocalesPython() {
    fetch('datos.json')
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar el archivo de datos");
            return response.json();
        })
        .then(data => {
            actualizarGraficasDesdePython(data);
        })
        .catch(error => {
            console.log("Esperando flujo de datos desde Python...", error);
        });
}

// Consultar los datos nuevos de Python cada 2 segundos automáticamente
setInterval(obtenerDatosLocalesPython, 2000);