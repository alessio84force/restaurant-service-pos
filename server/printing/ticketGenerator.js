function generarTicketHTML(titulo, pedido, productos) {
  let filas = '';

  productos.forEach(p => {
    filas += `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td>${p.precio.toFixed(2)}</td>
        <td>${p.subtotal.toFixed(2)}</td>
      </tr>
    `;
  });

  return `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
    </head>
    <body>
      <h1>${titulo}</h1>
      <p>Mesa ${pedido.mesa} | Pedido ${pedido.id}</p>
      <table>
        <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr>
        ${filas}
      </table>
      <h2>Total: ${pedido.total.toFixed(2)} EUR</h2>
      <button onclick="window.print()">Imprimir</button>
    </body>
    </html>
  `;
}

module.exports = {
  generarTicketHTML
};
