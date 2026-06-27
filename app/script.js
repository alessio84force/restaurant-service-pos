let mesaSeleccionada = null;
let menuCompleto = [];
let categoriaActual = null;

function cargarMesas() {
  fetch('http://localhost:3000/mesas')
    .then(r => r.json())
    .then(mesas => {
      const contenedor = document.querySelector('.grid-mesas');
      contenedor.innerHTML = '';

      const zonas = {};
      mesas.forEach(mesa => {
        const zona = mesa.zona || 'Sin zona';
        if (!zonas[zona]) zonas[zona] = [];
        zonas[zona].push(mesa);
      });

      Object.keys(zonas).forEach(zona => {
        const bloque = document.createElement('div');
        bloque.className = 'bloque-zona';
        bloque.innerHTML = '<h3>' + zona + '</h3>';

        const grid = document.createElement('div');
        grid.className = 'grid-zona';

        zonas[zona].forEach(mesa => {
          const div = document.createElement('div');
          div.className = 'mesa ' + mesa.estado;
          div.innerHTML = 'Mesa ' + mesa.numero + '<br><span>' + mesa.estado + '</span>';

          div.onclick = () => seleccionarMesa(mesa);

          grid.appendChild(div);
        });

        bloque.appendChild(grid);
        contenedor.appendChild(bloque);
      });
    });
}

function seleccionarMesa(mesa) {
  mesaSeleccionada = mesa.numero;

  if (mesa.estado === 'libre') {
    if (!confirm('¿Abrir Mesa ' + mesa.numero + '?')) return;

    fetch('http://localhost:3000/abrir-mesa/' + mesa.numero, { method: 'POST' })
      .then(() => {
        cargarMesas();
        cargarPedido(mesa.numero);
      });
  } else {
    cargarPedido(mesa.numero);
  }
}

function cargarPedido(numeroMesa) {
  fetch('http://localhost:3000/pedido/' + numeroMesa)
    .then(r => r.json())
    .then(data => {
      const detalle = document.getElementById('detalle-pedido');

      if (!data.pedido) {
        detalle.innerHTML = '<p>No hay pedido abierto para la Mesa ' + numeroMesa + '.</p>';
        return;
      }

      let html = '<h3>Mesa ' + data.mesa + '</h3>';

      data.productos.forEach(p => {
        html += '<div class="linea-pedido">';
        html += '<strong>' + p.nombre + '</strong><br>';
        html += 'Cantidad: ' + p.cantidad + ' | ' + p.subtotal.toFixed(2) + ' EUR<br>';
        html += '<button onclick="cambiarCantidad(' + p.id + ',1)">+</button>';
        html += '<button onclick="cambiarCantidad(' + p.id + ',-1)">-</button>';
        html += '<button onclick="eliminarLinea(' + p.id + ')">Eliminar</button>';
        html += '</div>';
      });

      html += '<h3>Total: ' + data.total.toFixed(2) + ' EUR</h3>';
      html += '<button onclick="enviarBar(' + data.mesa + ')">🍺 Bar</button>';
      html += '<button onclick="enviarCocina(' + data.mesa + ')">🍽 Cocina</button>';
      html += '<button onclick="generarPrecuenta(' + data.mesa + ')">🧾 Cuenta</button>';
      html += '<button onclick="marcarCuenta(' + data.mesa + ')">Cuenta entregada</button>';
      html += '<button onclick="pagarMesa(' + data.mesa + ',\'tarjeta\',' + data.total + ')">Tarjeta</button>';
      html += '<button onclick="pagarMesa(' + data.mesa + ',\'efectivo\',' + data.total + ')">Efectivo</button>';

      detalle.innerHTML = html;
    });
}

function cargarProductos() {
  fetch('http://localhost:3000/menu')
    .then(r => r.json())
    .then(menu => {
      menuCompleto = menu;
      pintarCategorias();
      pintarProductos();
    });
}

function pintarCategorias() {
  const lista = document.getElementById('lista-productos');
  const categorias = {};

  menuCompleto.forEach(item => {
    categorias[item.categoria_id] = item.categoria;
  });

  let html = '<div class="categorias-pos">';
  Object.keys(categorias).forEach(id => {
    html += '<button onclick="seleccionarCategoria(' + id + ')">' + categorias[id] + '</button>';
  });
  html += '</div>';
  html += '<div id="productos-filtrados"><p>Selecciona una categoría.</p></div>';

  lista.innerHTML = html;
}

function seleccionarCategoria(id) {
  categoriaActual = id;
  pintarProductos();
}

function pintarProductos() {
  const contenedor = document.getElementById('productos-filtrados');
  if (!contenedor) return;

  if (!categoriaActual) {
    contenedor.innerHTML = '<p>Selecciona una categoría.</p>';
    return;
  }

  const productos = menuCompleto.filter(p => p.categoria_id === categoriaActual);

  contenedor.innerHTML = '';

  productos.forEach(producto => {
    const btn = document.createElement('button');
    btn.textContent = producto.producto + ' - ' + Number(producto.precio).toFixed(2) + ' EUR';

    btn.onclick = () => {
      anadirProducto(producto.producto_id);
      categoriaActual = null;
      pintarCategorias();
      pintarProductos();
    };

    contenedor.appendChild(btn);
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
  .then(r => r.json())
  .then(() => {
    cargarPedido(mesaSeleccionada);
    cargarMesas();
  });
}

function cambiarCantidad(lineaId, cambio) {
  fetch('http://localhost:3000/linea/' + lineaId + '/cantidad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cambio })
  })
  .then(() => {
    cargarPedido(mesaSeleccionada);
    cargarMesas();
  });
}

function eliminarLinea(lineaId) {
  if (!confirm('¿Eliminar producto?')) return;

  fetch('http://localhost:3000/linea/' + lineaId, { method: 'DELETE' })
  .then(() => {
    cargarPedido(mesaSeleccionada);
    cargarMesas();
  });
}

function generarPrecuenta(mesa) {
  window.open('http://localhost:3000/ticket/' + mesa, '_blank');
}

function marcarCuenta(mesa) {
  fetch('http://localhost:3000/mesa/' + mesa + '/cuenta', { method: 'POST' })
  .then(() => {
    cargarMesas();
    cargarPedido(mesa);
  });
}

function pagarMesa(mesa, metodo, total) {
  fetch('http://localhost:3000/mesa/' + mesa + '/pagar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metodo,
      efectivo: metodo === 'efectivo' ? total : 0,
      tarjeta: metodo === 'tarjeta' ? total : 0
    })
  })
  .then(() => {
    mesaSeleccionada = null;
    cargarMesas();
    document.getElementById('detalle-pedido').innerHTML = 'Selecciona una mesa.';
  });
}

function enviarBar(mesa) {
  fetch('http://localhost:3000/bar/enviar/' + mesa, { method: 'POST' })
  .then(r => r.json())
  .then(data => alert(data.mensaje || 'Enviado al bar'));
}

function enviarCocina(mesa) {
  fetch('http://localhost:3000/cocina/enviar/' + mesa, { method: 'POST' })
  .then(r => r.json())
  .then(data => alert(data.mensaje || 'Enviado a cocina'));
}

cargarMesas();
cargarProductos();
