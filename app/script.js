console.log("Restaurant Service POS iniciado");

function cargarMesas() {
  fetch('http://localhost:3000/mesas')
    .then(response => response.json())
    .then(mesas => {
      const contenedor = document.querySelector('.grid-mesas');
      contenedor.innerHTML = '';

      mesas.forEach(mesa => {
        const div = document.createElement('div');
        div.className = 'mesa ' + mesa.estado;
        div.innerHTML =
          'Mesa ' + mesa.numero +
          '<br><span>' + mesa.estado + '</span>';

        div.addEventListener('click', () => {

          if (mesa.estado === 'libre') {

            if (confirm('¿Abrir Mesa ' + mesa.numero + '?')) {

              fetch(
                'http://localhost:3000/abrir-mesa/' + mesa.numero,
                {
                  method: 'POST'
                }
              )
              .then(response => response.json())
              .then(() => {
                cargarMesas();
                cargarPedido(mesa.numero);
              });
            }

          } else {
            cargarPedido(mesa.numero);
          }

        });

        contenedor.appendChild(div);
      });
    });
}

function cargarPedido(numeroMesa) {

  fetch('http://localhost:3000/pedido/' + numeroMesa)
    .then(response => response.json())
    .then(data => {

      const detalle =
        document.getElementById('detalle-pedido');

      if (!data.pedido) {

        detalle.innerHTML =
          '<p>No hay pedido abierto para la Mesa ' +
          numeroMesa +
          '.</p>';

        return;
      }

      let html =
        '<h3>Mesa ' +
        data.mesa +
        ' - Pedido ' +
        data.pedido +
        '</h3>';

      html += '<ul>';

      data.productos.forEach(producto => {

        html +=
          '<li>' +
          producto.nombre +
          ' x' +
          producto.cantidad +
          ' - ' +
          producto.subtotal.toFixed(2) +
          ' €</li>';

      });

      html += '</ul>';

      html +=
        '<h3>Total: ' +
        data.total.toFixed(2) +
        ' €</h3>';

      detalle.innerHTML = html;
    });
}

cargarMesas();
