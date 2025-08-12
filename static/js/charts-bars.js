/**
 * For usage, visit Chart.js docs https://www.chartjs.org/docs/latest/
 */

async function cargarDatos() {
  try {
    const respuesta = await fetch("http://mtorresg.pythonanywhere.com/landing/api/index/?format=json");
    const datos = await respuesta.json();

    // Transformar datos del JSON
    const entradas = Object.values(datos);
    
    // Llenar tabla
    const tablaBody = document.querySelector("#tabla-datos tbody");
    tablaBody.innerHTML = ""; // Limpiar antes de insertar
    entradas.forEach(item => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${item.fecha || item.timestamp || ""}</td>
        <td>${item.mensaje}</td>
        <td>${item.motivo}</td>
        <td>${item.nombre}</td>
      `;
      tablaBody.appendChild(fila);
    });

    // Agrupar datos por motivo para el gráfico
    const motivos = {};
    entradas.forEach(item => {
      motivos[item.motivo] = (motivos[item.motivo] || 0) + 1;
    });

    const labels = Object.keys(motivos);
    const valores = Object.values(motivos);

    // Configurar gráfico
    const barConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cantidad por motivo',
            backgroundColor: '#0694a2',
            borderWidth: 1,
            data: valores,
          }
        ],
      },
      options: {
        responsive: true,
        legend: { display: false }
      }
    };

    const barsCtx = document.getElementById('bars');
    window.myBar = new Chart(barsCtx, barConfig);

  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}

// Cargar al iniciar
cargarDatos();

// Actualizar cada 10 segundos
setInterval(cargarDatos, 10000);
