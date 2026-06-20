let mesaSeleccionada = null;

function cargarMesas() {
  fetch('http://localhost:3000/mesas')
    .then(response => response.json())
    .then(mesas => {
      const contenedor = document.querySelector('.grid-mesas');
      contenedor.innerHTML = '';

      mesas.forEach(mesa => {
        const div = document.createElement('div');
        div.className = 'mesa ' + mesa.estado;
        div.innerHTML = 'Mesa ' + mesa.numero + '<br><span>' + mesa.estado + '</span>';

        div.addEventListener('click', () => {
          mesaSeleccionada = mesa.numero;

          if (mesa.estado === 'libre') {
            if (confirm('¿Abrir Mesa ' + mesa.numero + '?')) {
              fetch('http://localhost:3000/abrir-mesa/' + mesa.numero, {
                method: 'POST'
              })
              .then(response => response.json())
              .then(() => {
                cargarMesas();
                cargarPedido(mesa.numero);
                cargarProductos();
              });
            }
          } else {
            cargarPedido(mesa.numero);
            cargarProductos();
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
      const detalle = document.getElementById('detalle-pedido');

      if (!data.pedido) {
        detalle.innerHTML = '<p>No hay pedido abierto para la Mesa ' + numeroMesa + '.</p>';
        return;
      }

      let html = '<h3>Mesa ' + data.mesa + ' - Pedido ' + data.pedido + '</h3>';
      html += '<ul>';

      data.productos.forEach(producto => {
        html += '<li>' + producto.nombre + ' x' + producto.cantidad + ' - ' + producto.subtotal.toFixed(2) + ' €</li>';
      });

      html += '</ul>';
      html += '<h3>Total: ' + data.total.toFixed(2) + ' €</h3>';
html += '<button onclick="cerrarMesa(' + data.mesa + ')">Cerrar Mesa</button>';

html += '<button onclick="generarPrecuenta(' + data.mesa + ')">Precuenta</button>';
      detalle.innerHTML = html;
    });
}

function cargarProductos() {
  fetch('http://localhost:3000/productos')
    .then(response => response.json())
    .then(productos => {
      const lista = document.getElementById('lista-productos');
      lista.innerHTML = '';

      productos.forEach(producto => {
        const btn = document.createElement('button');
        btn.textContent = producto.nombre + ' - ' + producto.precio.toFixed(2) + ' €';

        btn.addEventListener('click', () => {
          anadirProducto(producto.id);
        });

        lista.appendChild(btn);
      });
    });
}

function anadirProducto(productoId) {
  if (!mesaSeleccionada) {
    alert('Primero selecciona una mesa.');
    return;
  }

  fetch('http://localhost:3000/anadir-producto', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mesa: mesaSeleccionada,
      producto: productoId,
      cantidad: 1
    })
  })
  .then(response => response.json())
  .then(() => {
    cargarPedido(mesaSeleccionada);
    cargarMesas();
  });
}

cargarMesas();

cargarProductos();

function cerrarMesa(numeroMesa) {
  if (!confirm('¿Cerrar Mesa ' + numeroMesa + '?')) {
    return;
  }

  fetch('http://localhost:3000/cerrar-mesa/' + numeroMesa, {
    method: 'POST'
  })
  .then(response => response.json())
  .then(() => {
    mesaSeleccionada = null;
    cargarMesas();
    document.getElementById('detalle-pedido').innerHTML =
      'Selecciona una mesa para ver el pedido.';
  });
}

function generarPrecuenta(numeroMesa) {
  window.open('http://localhost:3000/pedido/' + numeroMesa, '_blank');
}
