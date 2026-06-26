let mesaSeleccionada = null;

function cargarMesas() {
  fetch('http://localhost:3000/mesas')
    .then(response => response.json())
    .then(mesas => {
      const contenedor = document.querySelector('.grid-mesas');
      contenedor.innerHTML = '';

      const zonas = {};

      mesas.forEach(mesa => {
        const nombreZona = mesa.zona || 'Sin zona';

        if (!zonas[nombreZona]) {
          zonas[nombreZona] = [];
        }

        zonas[nombreZona].push(mesa);
      });

      Object.keys(zonas).forEach(nombreZona => {
        const bloqueZona = document.createElement('div');
        bloqueZona.className = 'bloque-zona';

        const tituloZona = document.createElement('h3');
        tituloZona.textContent = nombreZona;
        bloqueZona.appendChild(tituloZona);

        const gridZona = document.createElement('div');
        gridZona.className = 'grid-zona';

        zonas[nombreZona].forEach(mesa => {
          const div = document.createElement('div');
          div.className = 'mesa ' + mesa.estado;
          div.innerHTML = 'Mesa ' + mesa.numero + '<br><span>' + mesa.estado + '</span>';

          if (mesa.reserva_cliente) {
            div.innerHTML += '<br><small>' + mesa.reserva_cliente + '<br>' + mesa.reserva_hora + ' - ' + mesa.reserva_personas + ' personas</small>';
          }

          div.addEventListener('click', () => {
            mesaSeleccionada = mesa.numero;

            if (mesa.estado === 'libre') {
              if (confirm('¿Abrir Mesa ' + mesa.numero + '?')) {
                fetch('http://localhost:3000/abrir-mesa/' + mesa.numero, { method: 'POST' })
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

          gridZona.appendChild(div);
        });

        bloqueZona.appendChild(gridZona);
        contenedor.appendChild(bloqueZona);
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

      data.productos.forEach(producto => {
        html += '<div class="linea-pedido">';
        html += '<strong>' + producto.nombre + '</strong><br>';
        html += 'Cantidad: ' + producto.cantidad + ' | Subtotal: ' + producto.subtotal.toFixed(2) + ' EUR<br>';
        html += '<button onclick="cambiarCantidad(' + producto.id + ', 1)">+</button>';
        html += '<button onclick="cambiarCantidad(' + producto.id + ', -1)">-</button>';
        html += '<button onclick="eliminarLinea(' + producto.id + ')">Eliminar</button>';
        html += '</div>';
      });

      html += '<h3>Total: ' + data.total.toFixed(2) + ' EUR</h3>';
      html += '<button onclick="generarPrecuenta(' + data.mesa + ')">Imprimir cuenta</button>';
      html += '<button onclick="marcarCuenta(' + data.mesa + ')">Cuenta entregada</button>';
      html += '<button onclick="pagarMesa(' + data.mesa + ', \'tarjeta\', ' + data.total + ')">Cobrar tarjeta</button>';
      html += '<button onclick="pagarMesa(' + data.mesa + ', \'efectivo\', ' + data.total + ')">Cobrar efectivo</button>';

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
        btn.textContent = producto.nombre + ' - ' + producto.precio.toFixed(2) + ' EUR';

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
    headers: { 'Content-Type': 'application/json' },
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

function cambiarCantidad(lineaId, cambio) {
  fetch('http://localhost:3000/linea/' + lineaId + '/cantidad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cambio: cambio })
  })
  .then(response => response.json())
  .then(() => {
    cargarPedido(mesaSeleccionada);
    cargarMesas();
  });
}

function eliminarLinea(lineaId) {
  if (!confirm('¿Eliminar producto del pedido?')) {
    return;
  }

  fetch('http://localhost:3000/linea/' + lineaId, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(() => {
    cargarPedido(mesaSeleccionada);
    cargarMesas();
  });
}

function cerrarMesa(numeroMesa) {
  if (!confirm('¿Cerrar Mesa ' + numeroMesa + '?')) {
    return;
  }

  fetch('http://localhost:3000/cerrar-mesa/' + numeroMesa, { method: 'POST' })
    .then(response => response.json())
    .then(() => {
      mesaSeleccionada = null;
      cargarMesas();
      document.getElementById('detalle-pedido').innerHTML =
        'Selecciona una mesa para ver el pedido.';
    });
}

function generarPrecuenta(numeroMesa) {
  window.open('http://localhost:3000/ticket/' + numeroMesa, '_blank');
}

cargarMesas();
cargarProductos();


function marcarCuenta(numeroMesa) {
  fetch('http://localhost:3000/mesa/' + numeroMesa + '/cuenta', {
    method: 'POST'
  })
  .then(response => response.json())
  .then(() => {
    cargarMesas();
    cargarPedido(numeroMesa);
  });
}

function pagarMesa(numeroMesa, metodo, total) {
  let efectivo = 0;
  let tarjeta = 0;

  if (metodo === 'efectivo') {
    efectivo = total;
  }

  if (metodo === 'tarjeta') {
    tarjeta = total;
  }

  fetch('http://localhost:3000/mesa/' + numeroMesa + '/pagar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metodo: metodo,
      efectivo: efectivo,
      tarjeta: tarjeta
    })
  })
  .then(response => response.json())
  .then(() => {
    mesaSeleccionada = null;
    cargarMesas();
    document.getElementById('detalle-pedido').innerHTML = 'Selecciona una mesa para ver el pedido.';
  });
}
