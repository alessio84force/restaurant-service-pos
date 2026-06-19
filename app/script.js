console.log("Restaurant Service POS iniciado");

fetch('http://localhost:3000/mesas')
  .then(response => response.json())
  .then(mesas => {
    const contenedor = document.querySelector('.grid-mesas');
    contenedor.innerHTML = '';

    mesas.forEach(mesa => {
      const div = document.createElement('div');
      div.className = 'mesa ' + mesa.estado;
      div.innerHTML = 'Mesa ' + mesa.numero + '<br><span>' + mesa.estado + '</span>';
      contenedor.appendChild(div);
    });
  })
  .catch(error => {
    console.error('Error cargando mesas:', error);
  });
