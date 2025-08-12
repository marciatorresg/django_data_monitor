// Configuración del gráfico de líneas
const lineConfig = {
  type: 'line',
  data: {
    labels: ['Cargando...'],
    datasets: [
      {
        label: 'Respuestas por día',
        backgroundColor: 'rgba(6, 148, 162, 0.1)',
        borderColor: '#0694a2',
        borderWidth: 2,
        pointBackgroundColor: '#0694a2',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        data: [0],
        fill: true,
        tension: 0.4,
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#0694a2',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y + ' respuesta' + (context.parsed.y !== 1 ? 's' : '');
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Fecha',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Número de respuestas',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          },
          stepSize: 1,
          callback: function(value) {
            if (Number.isInteger(value)) {
              return value;
            }
          }
        }
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: '#0694a2',
        hoverBorderColor: '#ffffff',
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  },
}

// Función para cargar datos y actualizar gráfico
async function cargarDatosLineas() {
  console.log('=== CARGANDO DATOS PARA GRÁFICO DE LÍNEAS ===');
  
  try {
    // CAMBIO AQUÍ: Usar el proxy local en lugar de la URL externa
    const respuesta = await fetch("/api/proxy/");
    
    if (!respuesta.ok) {
      throw new Error(`HTTP error! status: ${respuesta.status}`);
    }
    
    const datos = await respuesta.json();
    console.log('Datos recibidos de la API:', datos);

    // Transformar datos del JSON (mismo que usas en charts-bars.js)
    const entradas = Object.values(datos);
    console.log('Entradas procesadas:', entradas);
    
    if (entradas.length === 0) {
      console.log('⚠️ No hay entradas para procesar');
      return;
    }

    // Agrupar respuestas por fecha
    const respuestasPorFecha = {};
    
    entradas.forEach(item => {
      let fecha = item.timestamp || item.fecha || '';
      
      if (fecha) {
        try {
          // Procesar diferentes formatos de fecha (igual que en tu views.py)
          let fechaFormateada;
          
          if (fecha.includes('/') && (fecha.includes('p. m.') || fecha.includes('a. m.'))) {
            // Formato: "28/07/2025, 03:47:51 p. m."
            fechaFormateada = fecha.split(',')[0].trim();
          } else if (fecha.includes('T')) {
            // Formato ISO: "2025-07-28T15:47:51.000Z"
            const dt = new Date(fecha);
            fechaFormateada = dt.toLocaleDateString('es-ES');
          } else if (fecha.includes('-') && fecha.includes(' ')) {
            // Formato: "2025-07-28 15:47:51"
            const dt = new Date(fecha);
            fechaFormateada = dt.toLocaleDateString('es-ES');
          } else if (fecha.includes('-')) {
            // Formato: "2025-07-28"
            const dt = new Date(fecha);
            fechaFormateada = dt.toLocaleDateString('es-ES');
          } else {
            fechaFormateada = fecha;
          }
          
          respuestasPorFecha[fechaFormateada] = (respuestasPorFecha[fechaFormateada] || 0) + 1;
          console.log(`Fecha procesada: ${fecha} -> ${fechaFormateada}`);
          
        } catch (error) {
          console.error('Error procesando fecha:', fecha, error);
        }
      }
    });

    console.log('Respuestas agrupadas por fecha:', respuestasPorFecha);

    // Convertir a arrays ordenados
    const fechasOrdenadas = Object.keys(respuestasPorFecha).sort((a, b) => {
      // Intentar ordenar por fecha
      try {
        const [diaA, mesA, añoA] = a.split('/');
        const [diaB, mesB, añoB] = b.split('/');
        const fechaA = new Date(añoA, mesA - 1, diaA);
        const fechaB = new Date(añoB, mesB - 1, diaB);
        return fechaA - fechaB;
      } catch {
        return a.localeCompare(b);
      }
    });

    const labels = fechasOrdenadas;
    const valores = fechasOrdenadas.map(fecha => respuestasPorFecha[fecha]);

    console.log('Datos finales para el gráfico:');
    console.log('Labels:', labels);
    console.log('Valores:', valores);

    // Actualizar gráfico
    if (window.myLine) {
      window.myLine.data.labels = labels;
      window.myLine.data.datasets[0].data = valores;
      window.myLine.update();
      console.log('✅ Gráfico actualizado');
    } else {
      console.log('⚠️ Gráfico no inicializado aún');
    }

    // Actualizar estadísticas
    updateChartStats(labels, valores);

  } catch (error) {
    console.error('❌ Error cargando datos para gráfico de líneas:', error);
    
    // Mostrar datos de error
    if (window.myLine) {
      window.myLine.data.labels = ['Error de conexión'];
      window.myLine.data.datasets[0].data = [0];
      window.myLine.update();
    }
  }
}

// Función para actualizar estadísticas
function updateChartStats(labels, data) {
  console.log('=== ACTUALIZANDO ESTADÍSTICAS ===');
  
  if (labels && data && data.length > 0) {
    // Días con respuestas
    const daysWithResponses = data.filter(value => value > 0).length;
    
    // Promedio por día
    const total = data.reduce((sum, value) => sum + value, 0);
    const average = total / data.length;
    
    // Día con más respuestas
    const maxValue = Math.max(...data);
    const maxIndex = data.indexOf(maxValue);
    const peakDay = labels[maxIndex] || '-';
    
    console.log('Estadísticas calculadas:', {
      daysWithResponses,
      average: average.toFixed(1),
      peakDay: `${peakDay} (${maxValue})`
    });
    
    // Actualizar elementos del DOM
    const daysElement = document.getElementById('days-with-responses');
    const averageElement = document.getElementById('average-per-day');
    const peakElement = document.getElementById('peak-day');
    
    if (daysElement) daysElement.textContent = daysWithResponses;
    if (averageElement) averageElement.textContent = average.toFixed(1);
    if (peakElement) peakElement.textContent = maxValue > 0 ? `${peakDay} (${maxValue})` : '-';
  }
}

// Inicializar gráfico cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 DOM listo, inicializando gráfico de líneas');
  
  const lineCtx = document.getElementById('line');
  
  if (lineCtx) {
    // Crear gráfico
    window.myLine = new Chart(lineCtx, lineConfig);
    console.log('✅ Gráfico de líneas inicializado');
    
    // Cargar datos iniciales
    cargarDatosLineas();
    
    // Actualizar cada 10 segundos (igual que tu charts-bars.js)
    setInterval(cargarDatosLineas, 10000);
    
  } else {
    console.error('❌ No se encontró el elemento canvas con id "line"');
  }
});

// Función global para actualización manual
window.forceLineChartUpdate = function() {
  console.log('🔄 Actualización manual del gráfico de líneas');
  cargarDatosLineas();
};

console.log('=== SCRIPT charts-lines.js CARGADO ===');