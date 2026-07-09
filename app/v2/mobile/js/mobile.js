const API_MOBILE = window.location.origin;

let estadoMobile = {
  vista: "mesas",
  mesas: [],
  mesa: null,
  pedido: null,
  lineas: [],
  total: 0,
  categorias: [],
  productos: [],
  categoria: null,
  busqueda: "",
  cargando: false
};

function escaparMobile(texto){
  return String(texto === null || texto === undefined ? "" : texto)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function dineroMobile(valor){
  return Number(valor || 0).toFixed(2) + " €";
}

async function apiMobile(path, opciones){
  const opts = opciones || {};
  const respuesta = await fetch(API_MOBILE + path, {
    method: opts.method || "GET",
    credentials: "include",
    headers: Object.assign({
      "Content-Type": "application/json"
    }, opts.headers || {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  const tipo = respuesta.headers.get("content-type") || "";

  if(respuesta.redirected && respuesta.url.includes("/login")){
    window.location.href = "/login";
    throw new Error("Sesión no iniciada");
  }

  if(tipo.includes("application/json")){
    const datos = await respuesta.json();

    if(!respuesta.ok){
      throw new Error(datos.error || datos.message || "Error API");
    }

    return datos;
  }

  const texto = await respuesta.text();

  if(texto.includes("<form") || texto.includes("login") || respuesta.url.includes("/login")){
    window.location.href = "/login";
    throw new Error("Sesión no iniciada");
  }

  if(!respuesta.ok){
    throw new Error("Error " + respuesta.status);
  }

  return texto;
}

function toastMobile(texto, tipo){
  const contenedor = document.getElementById("mobile-toast");
  if(!contenedor) return;

  const div = document.createElement("div");
  div.className = "toast-mobile " + (tipo || "");
  div.textContent = texto;
  contenedor.appendChild(div);

  setTimeout(()=>{
    div.remove();
  }, 2800);
}

function normalizarNumeroMesaMobile(mesa){
  return String(
    mesa.numero ||
    mesa.nombre ||
    mesa.nombre_mesa ||
    mesa.id ||
    ""
  );
}

function normalizarEstadoMesaMobile(mesa){
  const estado = String(mesa.estado || "").toLowerCase();
  const pedidoEstado = String(mesa.pedido_estado || mesa.estado_pedido || "").toLowerCase();

  if(pedidoEstado === "cuenta" || estado === "cuenta") return "cuenta";
  if(pedidoEstado === "abierto" || estado === "ocupada") return "ocupada";
  if(estado === "reservada") return "reservada";
  return "libre";
}

function normalizarMenuMobile(datos){
  let filas = [];

  if(Array.isArray(datos)){
    filas = datos;
  }else if(Array.isArray(datos.productos)){
    filas = datos.productos;
  }else if(Array.isArray(datos.rows)){
    filas = datos.rows;
  }

  const categoriasMap = {};
  const productos = [];

  filas.forEach((fila)=>{
    const productoId = fila.producto_id || fila.id || fila.id_producto;
    const nombreProducto = fila.producto || fila.nombre || fila.nombre_producto;

    const categoriaId = fila.categoria_id || fila.id_categoria || fila.categoria || "sin-categoria";
    const categoriaNombre = fila.categoria || fila.nombre_categoria || fila.categoria_nombre || "Productos";

    categoriasMap[categoriaId] = {
      id: categoriaId,
      nombre: categoriaNombre,
      destino: fila.destino || ""
    };

    if(productoId && nombreProducto){
      productos.push({
        id: productoId,
        nombre: nombreProducto,
        precio: Number(fila.precio || 0),
        categoria_id: categoriaId,
        categoria: categoriaNombre,
        destino: fila.destino || "",
        requiere_coccion: Number(fila.requiere_coccion || fila.punto_coccion || 0)
      });
    }
  });

  return {
    categorias: Object.values(categoriasMap),
    productos
  };
}

async function cargarMesasMobile(){
  const datos = await apiMobile("/mesas");
  estadoMobile.mesas = Array.isArray(datos) ? datos : (datos.mesas || []);
}

async function cargarMenuMobile(){
  const datos = await apiMobile("/menu");
  const menu = normalizarMenuMobile(datos);

  estadoMobile.categorias = menu.categorias;
  estadoMobile.productos = menu.productos;

  if(!estadoMobile.categoria && estadoMobile.categorias.length > 0){
    estadoMobile.categoria = estadoMobile.categorias[0].id;
  }
}

async function cargarPedidoMobile(numeroMesa){
  if(!numeroMesa){
    estadoMobile.pedido = null;
    estadoMobile.lineas = [];
    estadoMobile.total = 0;
    return;
  }

  const datos = await apiMobile("/pedido/" + encodeURIComponent(numeroMesa));

  estadoMobile.pedido = datos.pedido || null;
  estadoMobile.lineas = datos.productos || datos.lineas || [];
  estadoMobile.total = Number(
    datos.total ||
    (datos.pedido && datos.pedido.total) ||
    estadoMobile.lineas.reduce((s,p)=>s + Number(p.subtotal || (Number(p.cantidad || 0) * Number(p.precio || 0))),0)
  );
}

async function recargarTodoMobile(){
  try{
    estadoMobile.cargando = true;
    renderMobile();

    await cargarMesasMobile();
    await cargarMenuMobile();

    if(estadoMobile.mesa){
      await cargarPedidoMobile(estadoMobile.mesa);
    }

    estadoMobile.cargando = false;
    renderMobile();
  }catch(error){
    estadoMobile.cargando = false;
    renderErrorMobile(error.message || "No se pudo cargar el POS móvil");
  }
}

function cambiarVistaMobile(vista){
  estadoMobile.vista = vista;
  renderMobile();
}

function activarTabsMobile(){
  ["mesas","pedido","productos"].forEach((vista)=>{
    const btn = document.getElementById("tab-" + vista);
    if(btn){
      btn.classList.toggle("activo", estadoMobile.vista === vista);
    }
  });
}

function renderMobile(){
  activarTabsMobile();

  if(estadoMobile.cargando){
    document.getElementById("mobile-app").innerHTML = `
      <section class="mobile-loading">Cargando...</section>
    `;
    return;
  }

  if(estadoMobile.vista === "mesas"){
    renderMesasMobile();
    return;
  }

  if(estadoMobile.vista === "pedido"){
    renderPedidoMobile();
    return;
  }

  renderProductosMobile();
}

function renderErrorMobile(mensaje){
  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-error">
      ${escaparMobile(mensaje)}
      <div class="mobile-actions">
        <button class="mobile-btn primary full" onclick="recargarTodoMobile()">Reintentar</button>
      </div>
    </section>
  `;
}

function renderMesasMobile(){
  const mesasHtml = estadoMobile.mesas.map((mesa)=>{
    const numero = normalizarNumeroMesaMobile(mesa);
    const estado = normalizarEstadoMesaMobile(mesa);
    const activa = String(estadoMobile.mesa) === String(numero);
    const zona = mesa.zona || mesa.sala || "";

    return `
      <button class="mobile-mesa ${estado} ${activa ? "activa" : ""}" onclick="seleccionarMesaMobile('${escaparMobile(numero).replace(/'/g,"\\'")}')">
        <strong>${escaparMobile(numero)}</strong>
        <span>${escaparMobile(estado.toUpperCase())}</span>
        ${zona ? `<small>${escaparMobile(zona)}</small>` : ""}
      </button>
    `;
  }).join("");

  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-panel">
      <h2>Mesas</h2>
      <div class="mobile-grid-mesas">
        ${mesasHtml || `<div class="mobile-empty">No hay mesas configuradas.</div>`}
      </div>
    </section>
  `;
}

async function seleccionarMesaMobile(numeroMesa){
  try{
    estadoMobile.mesa = String(numeroMesa);
    estadoMobile.vista = "pedido";
    estadoMobile.cargando = true;
    renderMobile();

    await cargarPedidoMobile(estadoMobile.mesa);

    estadoMobile.cargando = false;
    renderMobile();
  }catch(error){
    estadoMobile.cargando = false;
    renderErrorMobile(error.message || "No se pudo abrir la mesa");
  }
}

function renderPedidoMobile(){
  const mesa = estadoMobile.mesa;

  if(!mesa){
    document.getElementById("mobile-app").innerHTML = `
      <section class="mobile-empty">
        Selecciona una mesa para empezar.
        <div class="mobile-actions">
          <button class="mobile-btn primary full" onclick="cambiarVistaMobile('mesas')">Ver mesas</button>
        </div>
      </section>
    `;
    return;
  }

  if(!estadoMobile.pedido){
    document.getElementById("mobile-app").innerHTML = `
      <section class="mobile-panel">
        <h2>Mesa ${escaparMobile(mesa)}</h2>
        <p>No hay pedido abierto en esta mesa.</p>
        <div class="mobile-actions">
          <button class="mobile-btn green full" onclick="abrirMesaMobile()">Abrir mesa</button>
          <button class="mobile-btn full" onclick="cambiarVistaMobile('mesas')">Cambiar mesa</button>
        </div>
      </section>
    `;
    return;
  }

  const lineasHtml = estadoMobile.lineas.map((linea)=>{
    const nombre = linea.nombre || linea.producto || "Producto";
    const cantidad = Number(linea.cantidad || 0);
    const precio = Number(linea.precio || 0);
    const subtotal = Number(linea.subtotal || (cantidad * precio));
    const nota = linea.nota || "";

    return `
      <div class="mobile-linea">
        <div class="mobile-linea-top">
          <strong>${escaparMobile(nombre)}</strong>
          <span>${dineroMobile(subtotal)}</span>
        </div>

        ${nota ? `<div class="mobile-nota">${escaparMobile(nota)}</div>` : ""}

        <div class="mobile-cantidad">
          <button onclick="cambiarCantidadLineaMobile(${Number(linea.id)}, ${cantidad - 1})">−</button>
          <strong>${cantidad}</strong>
          <button onclick="cambiarCantidadLineaMobile(${Number(linea.id)}, ${cantidad + 1})">+</button>
        </div>

        <div class="mobile-linea-extra">
          <button onclick="editarNotaLineaMobile(${Number(linea.id)}, '${escaparMobile(nota).replace(/'/g,"\\'")}')">
            ${nota ? "Editar nota" : "Añadir nota"}
          </button>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-panel">
      <h2>Mesa ${escaparMobile(mesa)}</h2>

      <div class="mobile-total">
        <span>Total pedido</span>
        <strong>${dineroMobile(estadoMobile.total)}</strong>
      </div>

      <div class="mobile-actions">
        <button class="mobile-btn blue" onclick="cambiarVistaMobile('productos')">Añadir productos</button>
        <button class="mobile-btn yellow" onclick="generarPrecuentaMobile()">Precuenta</button>
        <button class="mobile-btn green" onclick="enviarComandaMobile('bar')">Enviar bar</button>
        <button class="mobile-btn red" onclick="enviarComandaMobile('cocina')">Enviar cocina</button>
      </div>
    </section>

    <section class="mobile-panel">
      <h3>Líneas del pedido</h3>
      ${lineasHtml || `<div class="mobile-empty">Todavía no hay productos.</div>`}
    </section>
  `;
}


async function marcarMesaOcupadaMobile(){
  if(!estadoMobile.mesa){
    return;
  }

  try{
    await apiMobile("/mobile/mesa/" + encodeURIComponent(estadoMobile.mesa) + "/ocupada", {
      method:"POST",
      body:{}
    });
  }catch(error){
    console.warn("No se pudo marcar mesa ocupada desde móvil:", error.message || error);
  }
}

async function abrirMesaMobile(){
  if(!estadoMobile.mesa) return;

  try{
    estadoMobile.cargando = true;
    renderMobile();

    await apiMobile("/abrir-mesa/" + encodeURIComponent(estadoMobile.mesa), {
      method:"POST",
      body:{}
    });

    await marcarMesaOcupadaMobile();

    await cargarMesasMobile();
    await cargarPedidoMobile(estadoMobile.mesa);

    estadoMobile.cargando = false;
    renderMobile();
    toastMobile("Mesa abierta correctamente", "ok");
  }catch(error){
    estadoMobile.cargando = false;
    renderMobile();
    toastMobile("No se pudo abrir la mesa", "error");
  }
}

async function enviarCantidadLineaMobile(lineaId, cantidad){
  await apiMobile("/mobile/linea/" + lineaId + "/cantidad", {
    method: "POST",
    body: {
      cantidad: cantidad
    }
  });

  return true;
}

async function cambiarCantidadLineaMobile(lineaId, nuevaCantidad){
  if(!lineaId) return;

  const cantidad = Math.max(0, Number(nuevaCantidad || 0));

  try{
    await enviarCantidadLineaMobile(lineaId, cantidad);

    await cargarPedidoMobile(estadoMobile.mesa);
    await cargarMesasMobile();

    renderMobile();
    toastMobile("Cantidad actualizada", "ok");
  }catch(error){
    console.error("Error cambiando cantidad móvil:", error);
    toastMobile("No se pudo cambiar la cantidad", "error");
  }
}

async function editarNotaLineaMobile(lineaId, notaActual){
  const nuevaNota = window.prompt("Nota para cocina/bar:", notaActual || "");

  if(nuevaNota === null) return;

  try{
    await apiMobile("/linea/" + lineaId + "/nota", {
      method:"POST",
      body:{ nota: nuevaNota }
    });

    await cargarPedidoMobile(estadoMobile.mesa);
    renderMobile();
    toastMobile("Nota guardada", "ok");
  }catch(error){
    toastMobile("No se pudo guardar la nota", "error");
  }
}

function renderProductosMobile(){
  if(!estadoMobile.mesa){
    document.getElementById("mobile-app").innerHTML = `
      <section class="mobile-empty">
        Selecciona una mesa antes de añadir productos.
        <div class="mobile-actions">
          <button class="mobile-btn primary full" onclick="cambiarVistaMobile('mesas')">Ver mesas</button>
        </div>
      </section>
    `;
    return;
  }

  const categoriasHtml = estadoMobile.categorias.map((cat)=>`
    <button class="mobile-categoria ${String(cat.id) === String(estadoMobile.categoria) ? "activa" : ""}" onclick="seleccionarCategoriaMobile('${escaparMobile(cat.id).replace(/'/g,"\\'")}')">
      ${escaparMobile(cat.nombre)}
    </button>
  `).join("");

  const busqueda = String(estadoMobile.busqueda || "").toLowerCase().trim();

  const productos = estadoMobile.productos.filter((p)=>{
    const coincideCategoria = !estadoMobile.categoria || String(p.categoria_id) === String(estadoMobile.categoria);
    const coincideBusqueda = !busqueda || String(p.nombre || "").toLowerCase().includes(busqueda);
    return coincideCategoria && coincideBusqueda;
  });

  const productosHtml = productos.map((p)=>`
    <button class="mobile-producto" onclick="prepararProductoMobile(${Number(p.id)})">
      <div>
        <strong>${escaparMobile(p.nombre)}</strong>
        <small>${escaparMobile(p.categoria || "")}${Number(p.requiere_coccion) === 1 ? " · Punto cocción" : ""}</small>
      </div>
      <span>${dineroMobile(p.precio)}</span>
    </button>
  `).join("");

  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-panel">
      <h2>Productos</h2>
      <p><strong>Mesa:</strong> ${escaparMobile(estadoMobile.mesa)}</p>

      <input
        class="mobile-search"
        placeholder="Buscar producto..."
        value="${escaparMobile(estadoMobile.busqueda)}"
        oninput="buscarProductoMobile(this.value)"
      >

      <div class="mobile-categorias">
        ${categoriasHtml}
      </div>

      <div class="mobile-productos">
        ${productosHtml || `<div class="mobile-empty">No hay productos en esta categoría.</div>`}
      </div>
    </section>
  `;
}

function seleccionarCategoriaMobile(categoriaId){
  estadoMobile.categoria = categoriaId;
  renderProductosMobile();
}

function buscarProductoMobile(valor){
  estadoMobile.busqueda = valor;
  renderProductosMobile();
}

function prepararProductoMobile(productoId){
  const producto = estadoMobile.productos.find(p => Number(p.id) === Number(productoId));
  if(!producto) return;

  if(Number(producto.requiere_coccion) === 1){
    mostrarModalPuntoMobile(producto);
    return;
  }

  anadirProductoMobile(producto, "", "");
}

function cerrarModalMobile(){
  const modal = document.getElementById("mobile-modal");
  if(modal) modal.innerHTML = "";
}

function mostrarModalPuntoMobile(producto){
  const opciones = [
    "Poco hecho",
    "Al punto menos",
    "Al punto",
    "Al punto más",
    "Muy hecho"
  ];

  const botones = opciones.map((opcion)=>`
    <button onclick="anadirProductoMobilePorId(${Number(producto.id)}, 'Punto: ${escaparMobile(opcion).replace(/'/g,"\\'")}', '${escaparMobile(opcion).replace(/'/g,"\\'")}')">
      ${escaparMobile(opcion)}
    </button>
  `).join("");

  document.getElementById("mobile-modal").innerHTML = `
    <div class="mobile-modal-bg">
      <div class="mobile-modal-box">
        <h3>${escaparMobile(producto.nombre)}</h3>
        <div class="mobile-modal-options">
          ${botones}
          <button onclick="anadirProductoMobilePorId(${Number(producto.id)}, '', '')">Sin punto</button>
          <button onclick="cerrarModalMobile()">Cancelar</button>
        </div>
      </div>
    </div>
  `;
}

function anadirProductoMobilePorId(productoId, nota, punto){
  const producto = estadoMobile.productos.find(p => Number(p.id) === Number(productoId));
  if(!producto) return;

  cerrarModalMobile();
  anadirProductoMobile(producto, nota, punto);
}

async function anadirProductoMobile(producto, nota, punto){
  if(!estadoMobile.mesa){
    toastMobile("Selecciona una mesa primero", "error");
    return;
  }

  try{
    if(!estadoMobile.pedido){
      await apiMobile("/abrir-mesa/" + encodeURIComponent(estadoMobile.mesa), {
        method:"POST",
        body:{}
      });
    }

    await apiMobile("/anadir-producto", {
      method:"POST",
      body:{
        mesa: estadoMobile.mesa,
        numeroMesa: estadoMobile.mesa,
        producto_id: producto.id,
        producto: producto.id,
        cantidad: 1,
        nota: nota || "",
        punto_coccion: punto || ""
      }
    });

    await marcarMesaOcupadaMobile();

    await cargarPedidoMobile(estadoMobile.mesa);
    await cargarMesasMobile();

    toastMobile("Producto añadido", "ok");
    renderProductosMobile();
  }catch(error){
    toastMobile("No se pudo añadir producto", "error");
  }
}

async function enviarComandaMobile(destino){
  if(!estadoMobile.mesa || !estadoMobile.pedido){
    toastMobile("No hay pedido abierto", "error");
    return;
  }

  try{
    await apiMobile("/" + destino + "/enviar/" + encodeURIComponent(estadoMobile.mesa), {
      method:"POST",
      body:{}
    });

    await cargarPedidoMobile(estadoMobile.mesa);
    await cargarMesasMobile();
    renderMobile();

    toastMobile("Comanda enviada a " + destino, "ok");
  }catch(error){
    toastMobile("No se pudo enviar la comanda", "error");
  }
}

async function generarPrecuentaMobile(){
  if(!estadoMobile.mesa || !estadoMobile.pedido){
    toastMobile("No hay pedido abierto", "error");
    return;
  }

  try{
    await apiMobile("/mesa/" + encodeURIComponent(estadoMobile.mesa) + "/cuenta", {
      method:"POST",
      body:{}
    });

    window.open(API_MOBILE + "/ticket/" + encodeURIComponent(estadoMobile.mesa), "_blank");

    await cargarPedidoMobile(estadoMobile.mesa);
    await cargarMesasMobile();
    renderMobile();

    toastMobile("Precuenta generada", "ok");
  }catch(error){
    toastMobile("No se pudo generar la precuenta", "error");
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  recargarTodoMobile();
});

/* V2.4.1E - Sincronización automática móvil ↔ PC */
let sincronizandoMobile = false;

function usuarioEstaEscribiendoMobile(){
  const activo = document.activeElement;

  if(!activo){
    return false;
  }

  const tag = String(activo.tagName || "").toLowerCase();

  return tag === "input" || tag === "textarea" || tag === "select";
}

function modalAbiertoMobile(){
  const modal = document.getElementById("mobile-modal");
  return modal && String(modal.innerHTML || "").trim().length > 0;
}

async function sincronizarAutomaticamenteMobile(){
  if(sincronizandoMobile || estadoMobile.cargando){
    return;
  }

  if(document.hidden){
    return;
  }

  if(usuarioEstaEscribiendoMobile()){
    return;
  }

  if(modalAbiertoMobile()){
    return;
  }

  try{
    sincronizandoMobile = true;

    await cargarMesasMobile();

    if(estadoMobile.mesa){
      await cargarPedidoMobile(estadoMobile.mesa);
    }

    sincronizandoMobile = false;
    renderMobile();
  }catch(error){
    sincronizandoMobile = false;
    console.warn("Sincronización automática móvil no realizada:", error.message || error);
  }
}

if(!window.__syncAutomaticoMobile){
  window.__syncAutomaticoMobile = true;

  setInterval(sincronizarAutomaticamenteMobile, 4000);

  document.addEventListener("visibilitychange", function(){
    if(!document.hidden){
      sincronizarAutomaticamenteMobile();
    }
  });
}
