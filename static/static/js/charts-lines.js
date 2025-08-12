/**
 * For usage, visit Chart.js docs https://www.chartjs.org/docs/latest/
 */
// Función para obtener datos del gráfico
function getChartData() {
  console.log('=== DEBUG CHART DATA ===');
  console.log('window.chartData:', window.chartData);
  
  // Verificar si hay datos reales desde Django
  if (window.chartData && 
      window.chartData.labels && 
      window.chartData.labels.length > 0 && 
      window.chartData.labels[0] !== 'Sin datos' &&
      window.chartData.data &&
      window.chartData.data.length > 0) {
    
    console.log('✅ Usando datos reales de la API');
    console.log('Labels:', window.chartData.labels);
    console.log('Data:', window.chartData.data);
    
    return {
      labels: window.chartData.labels,
      datasets: [
        {
          label: 'Respuestas por día',
          backgroundColor: 'rgba(6, 148, 162, 0.1)',
          borderColor: '#0694a2',
          pointBackgroundColor: '#0694a2',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          data: window.chartData.data,
          fill: true,
          tension: 0.4,
        }
      ]
    };
  } else {
    console.log('❌ No hay datos reales, usando datos por defecto');
    console.log('Razones:');
    console.log('- window.chartData existe:', !!window.chartData);
    if (window.chartData) {
      console.log('- labels existen:', !!window.chartData.labels);
      console.log('- labels length:', window.chartData.labels ? window.chartData.labels.length : 'N/A');
      console.log('- primer label:', window.chartData.labels ? window.chartData.labels[0] : 'N/A');
      console.log('- data existe:', !!window.chartData.data);
      console.log('- data length:', window.chartData.data ? window.chartData.data.length : 'N/A');
    }
    
    // Datos por defecto - estos son los que ves actualmente
    return {
      labels: ['Sin datos disponibles'],
      datasets: [
        {
          label: 'No hay datos',
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          borderColor: '#9ca3af',
          pointBackgroundColor: '#9ca3af',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          data: [0],
          fill: true,
          tension: 0.4,
        }
      ]
    };
  }
}

// Función para calcular estadísticas
function calculateStats() {
  console.log('Calculando estadísticas...');
  
  if (window.chartData && 
      window.chartData.data && 
      window.chartData.data.length > 0 &&
      window.chartData.labels &&
      window.chartData.labels[0] !== 'Sin datos') {
    
    const data = window.chartData.data;
    const labels = window.chartData.labels;
    
    console.log('Datos para estadísticas:', { data, labels });
    
    // Días con respuestas (datos > 0)
    const daysWithResponses = data.filter(value => value > 0).length;
    
    // Promedio por día (solo días con respuestas)
    const total = data.reduce((sum, value) => sum + value, 0);
    const average = daysWithResponses > 0 ? (total / daysWithResponses) : 0;
    
    // Día con más respuestas
    const maxValue = Math.max(...data);
    const maxIndex = data.indexOf(maxValue);
    const peakDay = maxValue > 0 ? `${labels[maxIndex]} (${maxValue})` : 'N/A';
    
    console.log('Estadísticas calculadas:', {
      daysWithResponses,
      average: average.toFixed(1),
      peakDay
    });
    
    // Actualizar elementos HTML
    const daysElement = document.getElementById('days-with-responses');
    const avgElement = document.getElementById('average-per-day');
    const peakElement = document.getElementById('peak-day');
    
    if (daysElement) daysElement.textContent = daysWithResponses;
    if (avgElement) avgElement.textContent = average.toFixed(1);
    if (peakElement) peakElement.textContent = peakDay;
    
  } else {
    console.log('No hay datos válidos para estadísticas');
    
    // Valores por defecto
    const daysElement = document.getElementById('days-with-responses');
    const avgElement = document.getElementById('average-per-day');
    const peakElement = document.getElementById('peak-day');
    
    if (daysElement) daysElement.textContent = '0';
    if (avgElement) avgElement.textContent = '0';
    if (peakElement) peakElement.textContent = 'N/A';
  }
}

// Configuración del gráfico
const lineConfig = {
  type: 'line',
  data: getChartData(),
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          font: {
            size: 14,
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif'
        },
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return `📅 ${context[0].label}`;
          },
          label: function(context) {
            const value = context.parsed.y;
            const unit = value === 1 ? 'respuesta' : 'respuestas';
            return `📊 ${value} ${unit}`;
          }
        }
      }
    },
    hover: {
      mode: 'nearest',
      intersect: false,
      animationDuration: 200
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '📅 Fechas',
          font: {
            size: 14,
            family: 'Inter, system-ui, sans-serif',
            weight: '600'
          },
          color: '#374151'
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawOnChartArea: true,
        },
        ticks: {
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '📊 Número de respuestas',
          font: {
            size: 14,
            family: 'Inter, system-ui, sans-serif',
            weight: '600'
          },
          color: '#374151'
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawOnChartArea: true,
        },
        ticks: {
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280',
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        }
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    elements: {
      point: {
        hoverBorderWidth: 3
      },
      line: {
        borderCapStyle: 'round',
        borderJoinStyle: 'round'
      }
    }
  }
}

// Variable global para el gráfico
let myLineChart = null;

// Función para inicializar el gráfico
function initChart() {
  console.log('🚀 Inicializando gráfico...');
  
  const lineCtx = document.getElementById('line');
  if (!lineCtx) {
    console.error('❌ No se encontró el elemento canvas con id="line"');
    return;
  }

  console.log('📊 Canvas encontrado, creando gráfico...');
  
  // Destruir gráfico anterior si existe
  if (myLineChart) {
    myLineChart.destroy();
  }
  
  // Obtener datos actualizados
  lineConfig.data = getChartData();
  
  // Crear el gráfico
  myLineChart = new Chart(lineCtx, lineConfig);
  
  console.log('✅ Gráfico creado exitosamente');
  console.log('📈 Datos del gráfico:', myLineChart.data);

  // Calcular y mostrar estadísticas
  calculateStats();
}

// Función para actualizar el gráfico con nuevos datos
function updateChart() {
  if (myLineChart) {
    console.log('🔄 Actualizando gráfico...');
    
    const newData = getChartData();
    myLineChart.data = newData;
    myLineChart.update('active');
    
    // Actualizar estadísticas
    calculateStats();
    
    console.log('✅ Gráfico actualizado');
  } else {
    console.log('⚠️ No hay gráfico para actualizar, inicializando...');
    initChart();
  }
}

// Función para verificar que los datos estén cargados
function waitForData() {
  console.log('⏳ Esperando datos...');
  
  // Verificar si window.chartData ya existe
  if (window.chartData) {
    console.log('✅ Datos encontrados inmediatamente');
    initChart();
    return;
  }
  
  // Si no, esperar un poco y volver a intentar
  let attempts = 0;
  const maxAttempts = 10;
  
  const checkData = setInterval(() => {
    attempts++;
    console.log(`🔍 Intento ${attempts}/${maxAttempts} - Buscando datos...`);
    
    if (window.chartData) {
      console.log('✅ Datos encontrados después de', attempts, 'intentos');
      clearInterval(checkData);
      initChart();
    } else if (attempts >= maxAttempts) {
      console.log('❌ No se encontraron datos después de', maxAttempts, 'intentos');
      console.log('🔧 Inicializando con datos por defecto');
      clearInterval(checkData);
      initChart();
    }
  }, 100); // Verificar cada 100ms
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌐 DOM cargado, iniciando proceso...');
  
  // Esperar un poco para que se carguen todos los scripts
  setTimeout(waitForData, 200);
});

// Función de debugging para la consola
window.debugChart = function() {
  console.log('=== 🐛 DEBUG CHART ===');
  console.log('window.chartData:', window.chartData);
  console.log('Chart instance:', myLineChart);
  console.log('Chart data:', myLineChart ? myLineChart.data : 'No chart');
  console.log('Canvas element:', document.getElementById('line'));
  console.log('Stats elements:', {
    days: document.getElementById('days-with-responses'),
    avg: document.getElementById('average-per-day'),  
    peak: document.getElementById('peak-day')
  });
  console.log('===================');
  
  // Intentar recrear el gráfico
  console.log('🔄 Recreando gráfico...');
  initChart();
};

// Hacer la función updateChart disponible globalmente
window.updateChart = updateChart;
window.initChart = initChart;