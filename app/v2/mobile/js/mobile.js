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
  cargando: false,
  usuario: null,
  rol: "",
  idioma: "es"
};

const TESTI_MOBILE = {
  es: {
    posMovil: "POS móvil",
    camareroMovil: "Camarero móvil",
    actualizar: "Actualizar",
    mesas: "Mesas",
    pedido: "Pedido",
    productos: "Productos",
    configuracion: "Configuración",
    salir: "Salir",
    cargandoPos: "Cargando POS móvil...",
    cargando: "Cargando...",
    sesionNoIniciada: "Sesión no iniciada",
    errorApi: "Error de comunicación",
    noCargarPos: "No se pudo cargar el POS móvil",
    reintentar: "Reintentar",
    noMesas: "No hay mesas configuradas.",
    libre: "LIBRE",
    ocupada: "OCUPADA",
    cuentaPedida: "CUENTA PEDIDA",
    seleccionaMesa: "Selecciona una mesa para empezar.",
    verMesas: "Ver mesas",
    mesa: "Mesa",
    sinPedido: "No hay pedido abierto en esta mesa.",
    abrirMesa: "Abrir mesa",
    cambiarMesa: "Cambiar mesa",
    producto: "Producto",
    editarNota: "Editar nota",
    anadirNota: "Añadir nota",
    totalPedido: "Total pedido",
    anadirProductos: "Añadir productos",
    precuenta: "Precuenta",
    imprimirPrecuenta: "Imprimir cuenta",
    volverPedido: "Volver al pedido",
    noImprimirPrecuenta: "No se pudo abrir la impresión",
    enviarComandas: "Enviar comandas",
    lineasPedido: "Líneas del pedido",
    sinProductosPedido: "Todavía no hay productos.",
    mesaAbierta: "Mesa abierta correctamente",
    noAbrirMesa: "No se pudo abrir la mesa",
    cantidadActualizada: "Cantidad actualizada",
    noCambiarCantidad: "No se pudo cambiar la cantidad",
    notaPrompt: "Nota para cocina/bar:",
    notaGuardada: "Nota guardada",
    noGuardarNota: "No se pudo guardar la nota",
    seleccionaMesaAntes: "Selecciona una mesa antes de añadir productos.",
    buscarProducto: "Buscar producto...",
    puntoCoccion: "Punto de cocción",
    sinProductosCategoria: "No hay productos en esta categoría.",
    pocoHecho: "Poco hecho",
    alPuntoMenos: "Al punto menos",
    alPunto: "Al punto",
    alPuntoMas: "Al punto más",
    muyHecho: "Muy hecho",
    puntoPrefijo: "Punto",
    sinPunto: "Sin punto",
    cancelar: "Cancelar",
    seleccionaMesaPrimero: "Selecciona una mesa primero",
    productoAnadido: "Producto añadido",
    noAnadirProducto: "No se pudo añadir el producto",
    seleccionaMesaComanda: "Selecciona una mesa",
    enviandoComandas: "Enviando comandas...",
    respuestaNoValida: "Respuesta no válida del servidor",
    errorEnviarComandas: "Error enviando comandas",
    comandasEnviadas: "Comandas enviadas",
    sinNuevosProductos: "No hay productos nuevos para enviar",
    noEnviarComanda: "No se pudo enviar la comanda",
    noEnviarComandas: "No se pudieron enviar las comandas",
    sinPedidoAbierto: "No hay pedido abierto",
    precuentaGenerada: "Precuenta generada",
    noGenerarPrecuenta: "No se pudo generar la precuenta"
  },

  it: {
    posMovil: "POS mobile",
    camareroMovil: "Cameriere mobile",
    actualizar: "Aggiorna",
    mesas: "Tavoli",
    pedido: "Ordine",
    productos: "Prodotti",
    configuracion: "Configurazione",
    salir: "Esci",
    cargandoPos: "Caricamento POS mobile...",
    cargando: "Caricamento...",
    sesionNoIniciada: "Sessione non avviata",
    errorApi: "Errore di comunicazione",
    noCargarPos: "Impossibile caricare il POS mobile",
    reintentar: "Riprova",
    noMesas: "Non ci sono tavoli configurati.",
    libre: "LIBERO",
    ocupada: "OCCUPATO",
    cuentaPedida: "CONTO RICHIESTO",
    seleccionaMesa: "Seleziona un tavolo per iniziare.",
    verMesas: "Vedi tavoli",
    mesa: "Tavolo",
    sinPedido: "Non ci sono ordini aperti su questo tavolo.",
    abrirMesa: "Apri tavolo",
    cambiarMesa: "Cambia tavolo",
    producto: "Prodotto",
    editarNota: "Modifica nota",
    anadirNota: "Aggiungi nota",
    totalPedido: "Totale ordine",
    anadirProductos: "Aggiungi prodotti",
    precuenta: "Preconto",
    imprimirPrecuenta: "Stampa conto",
    volverPedido: "Torna all'ordine",
    noImprimirPrecuenta: "Impossibile aprire la stampa",
    enviarComandas: "Invia comande",
    lineasPedido: "Righe dell'ordine",
    sinProductosPedido: "Non ci sono ancora prodotti.",
    mesaAbierta: "Tavolo aperto correttamente",
    noAbrirMesa: "Impossibile aprire il tavolo",
    cantidadActualizada: "Quantità aggiornata",
    noCambiarCantidad: "Impossibile modificare la quantità",
    notaPrompt: "Nota per cucina/bar:",
    notaGuardada: "Nota salvata",
    noGuardarNota: "Impossibile salvare la nota",
    seleccionaMesaAntes: "Seleziona un tavolo prima di aggiungere prodotti.",
    buscarProducto: "Cerca prodotto...",
    puntoCoccion: "Cottura",
    sinProductosCategoria: "Non ci sono prodotti in questa categoria.",
    pocoHecho: "Al sangue",
    alPuntoMenos: "Medio-al sangue",
    alPunto: "Media cottura",
    alPuntoMas: "Medio-ben cotto",
    muyHecho: "Ben cotto",
    puntoPrefijo: "Cottura",
    sinPunto: "Senza indicazione",
    cancelar: "Annulla",
    seleccionaMesaPrimero: "Seleziona prima un tavolo",
    productoAnadido: "Prodotto aggiunto",
    noAnadirProducto: "Impossibile aggiungere il prodotto",
    seleccionaMesaComanda: "Seleziona un tavolo",
    enviandoComandas: "Invio comande...",
    respuestaNoValida: "Risposta del server non valida",
    errorEnviarComandas: "Errore durante l'invio delle comande",
    comandasEnviadas: "Comande inviate",
    sinNuevosProductos: "Non ci sono nuovi prodotti da inviare",
    noEnviarComanda: "Impossibile inviare la comanda",
    noEnviarComandas: "Impossibile inviare le comande",
    sinPedidoAbierto: "Non ci sono ordini aperti",
    precuentaGenerada: "Preconto generato",
    noGenerarPrecuenta: "Impossibile generare il preconto"
  },

  en: {
    posMovil: "Mobile POS",
    camareroMovil: "Mobile waiter",
    actualizar: "Refresh",
    mesas: "Tables",
    pedido: "Order",
    productos: "Products",
    configuracion: "Settings",
    salir: "Sign out",
    cargandoPos: "Loading mobile POS...",
    cargando: "Loading...",
    sesionNoIniciada: "Session not started",
    errorApi: "Communication error",
    noCargarPos: "Could not load the mobile POS",
    reintentar: "Try again",
    noMesas: "No tables configured.",
    libre: "FREE",
    ocupada: "OCCUPIED",
    cuentaPedida: "BILL REQUESTED",
    seleccionaMesa: "Select a table to get started.",
    verMesas: "View tables",
    mesa: "Table",
    sinPedido: "There is no open order on this table.",
    abrirMesa: "Open table",
    cambiarMesa: "Change table",
    producto: "Product",
    editarNota: "Edit note",
    anadirNota: "Add note",
    totalPedido: "Order total",
    anadirProductos: "Add products",
    precuenta: "Pre-bill",
    imprimirPrecuenta: "Print bill",
    volverPedido: "Back to order",
    noImprimirPrecuenta: "Could not open printing",
    enviarComandas: "Send orders",
    lineasPedido: "Order lines",
    sinProductosPedido: "There are no products yet.",
    mesaAbierta: "Table opened successfully",
    noAbrirMesa: "Could not open the table",
    cantidadActualizada: "Quantity updated",
    noCambiarCantidad: "Could not change the quantity",
    notaPrompt: "Note for kitchen/bar:",
    notaGuardada: "Note saved",
    noGuardarNota: "Could not save the note",
    seleccionaMesaAntes: "Select a table before adding products.",
    buscarProducto: "Search product...",
    puntoCoccion: "Doneness",
    sinProductosCategoria: "There are no products in this category.",
    pocoHecho: "Rare",
    alPuntoMenos: "Medium rare",
    alPunto: "Medium",
    alPuntoMas: "Medium well",
    muyHecho: "Well done",
    puntoPrefijo: "Doneness",
    sinPunto: "No preference",
    cancelar: "Cancel",
    seleccionaMesaPrimero: "Select a table first",
    productoAnadido: "Product added",
    noAnadirProducto: "Could not add the product",
    seleccionaMesaComanda: "Select a table",
    enviandoComandas: "Sending orders...",
    respuestaNoValida: "Invalid server response",
    errorEnviarComandas: "Error sending orders",
    comandasEnviadas: "Orders sent",
    sinNuevosProductos: "There are no new products to send",
    noEnviarComanda: "Could not send the order",
    noEnviarComandas: "Could not send the orders",
    sinPedidoAbierto: "There is no open order",
    precuentaGenerada: "Pre-bill generated",
    noGenerarPrecuenta: "Could not generate the pre-bill"
  }
};

function normalizarIdiomaMobile(valor){
  const idioma = String(valor || "").trim().toLowerCase();

  if(["es","it","en"].includes(idioma)){
    return idioma;
  }

  return "es";
}

function textoMobile(clave){
  const idioma = normalizarIdiomaMobile(
    estadoMobile.idioma
  );

  const textos =
    TESTI_MOBILE[idioma] ||
    TESTI_MOBILE.es;

  return Object.prototype.hasOwnProperty.call(textos, clave)
    ? textos[clave]
    : clave;
}

function aplicarIdiomaMobile(){
  const idioma = normalizarIdiomaMobile(
    estadoMobile.idioma
  );

  estadoMobile.idioma = idioma;
  document.documentElement.lang = idioma;

  const actualizar =
    document.getElementById("mobile-actualizar");

  const tabMesas =
    document.getElementById("tab-mesas");

  const tabPedido =
    document.getElementById("tab-pedido");

  const tabProductos =
    document.getElementById("tab-productos");

  const configuracion =
    document.getElementById("mobile-configuracion");

  const salir =
    document.getElementById("mobile-salir");

  const loading =
    document.getElementById("mobile-loading-inicial");

  if(actualizar){
    actualizar.textContent = textoMobile("actualizar");
  }

  if(tabMesas){
    tabMesas.textContent = textoMobile("mesas");
  }

  if(tabPedido){
    tabPedido.textContent = textoMobile("pedido");
  }

  if(tabProductos){
    tabProductos.textContent = textoMobile("productos");
  }

  if(configuracion){
    configuracion.textContent =
      textoMobile("configuracion");
  }

  if(salir){
    salir.textContent = textoMobile("salir");
  }

  if(loading){
    loading.textContent =
      textoMobile("cargandoPos");
  }
}

function textoEstadoMesaMobile(estado){
  if(estado === "cuenta"){
    return textoMobile("cuentaPedida");
  }

  if(estado === "ocupada"){
    return textoMobile("ocupada");
  }

  return textoMobile("libre");
}

async function cargarUsuarioMobile(){
  const datos = await apiMobile("/usuario-actual");

  const usuario =
    datos && datos.usuario
      ? datos.usuario
      : datos;

  estadoMobile.usuario = usuario || {};

  estadoMobile.rol = String(
    (usuario && usuario.rol) ||
    (datos && datos.rol) ||
    ""
  ).toLowerCase();

  estadoMobile.idioma = normalizarIdiomaMobile(
    (usuario && usuario.idioma) ||
    (datos && datos.idioma) ||
    "es"
  );

  aplicarIdiomaMobile();
  aplicarModoUsuarioMobile();
}

function aplicarModoUsuarioMobile(){
  const esAdmin =
    estadoMobile.rol === "admin" ||
    estadoMobile.rol === "gerente";

  const subtitulo =
    document.getElementById("mobile-subtitulo");

  const configuracion =
    document.getElementById("mobile-configuracion");

  const footer =
    document.getElementById("mobile-footer");

  if(subtitulo){
    subtitulo.textContent =
      esAdmin
        ? textoMobile("posMovil")
        : textoMobile("camareroMovil");
  }

  if(configuracion){
    configuracion.hidden = !esAdmin;
  }

  if(footer){
    footer.classList.toggle("solo-salida", !esAdmin);
  }

  document.title =
    "Restaurant Service POS - " +
    (
      esAdmin
        ? textoMobile("posMovil")
        : textoMobile("camareroMovil")
    );
}

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
    throw new Error(textoMobile("sesionNoIniciada"));
  }

  if(tipo.includes("application/json")){
    const datos = await respuesta.json();

    if(!respuesta.ok){
      throw new Error(
      datos.error ||
      datos.message ||
      textoMobile("errorApi")
    );
    }

    return datos;
  }

  const texto = await respuesta.text();

  if(texto.includes("<form") || texto.includes("login") || respuesta.url.includes("/login")){
    window.location.href = "/login";
    throw new Error(textoMobile("sesionNoIniciada"));
  }

  if(!respuesta.ok){
    throw new Error(
    textoMobile("errorApi") + " " + respuesta.status
  );
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
    const categoriaNombre =
      fila.categoria ||
      fila.nombre_categoria ||
      fila.categoria_nombre ||
      textoMobile("productos");

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
    renderErrorMobile(
      error.message ||
      textoMobile("noCargarPos")
    );
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
  document.body.classList.toggle(
    "mobile-preconto-attivo",
    estadoMobile.vista === "precuenta"
  );

  activarTabsMobile();

  if(estadoMobile.cargando){
    document.getElementById("mobile-app").innerHTML = `
      <section class="mobile-loading">${textoMobile("cargando")}</section>
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
  if(estadoMobile.vista === "precuenta"){
    renderPrecuentaMobile();
    return;
  }

  renderProductosMobile();
}


function renderErrorMobile(mensaje){
  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-error">
      ${escaparMobile(mensaje)}
      <div class="mobile-actions">
        <button class="mobile-btn primary full" onclick="recargarTodoMobile()">${textoMobile("reintentar")}</button>
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
        <span>${escaparMobile(textoEstadoMesaMobile(estado))}</span>
        ${zona ? `<small>${escaparMobile(zona)}</small>` : ""}
      </button>
    `;
  }).join("");

  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-panel">
      <h2>${textoMobile("mesas")}</h2>
      <div class="mobile-grid-mesas">
        ${mesasHtml || `<div class="mobile-empty">${textoMobile("noMesas")}</div>`}
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
    renderErrorMobile(
      error.message ||
      textoMobile("noAbrirMesa")
    );
  }
}

function renderPedidoMobile(){
  const mesa = estadoMobile.mesa;

  if(!mesa){
    document.getElementById("mobile-app").innerHTML = `
      <section class="mobile-empty">
        ${textoMobile("seleccionaMesa")}
        <div class="mobile-actions">
          <button class="mobile-btn primary full" onclick="cambiarVistaMobile('mesas')">${textoMobile("verMesas")}</button>
        </div>
      </section>
    `;
    return;
  }

  if(!estadoMobile.pedido){
    document.getElementById("mobile-app").innerHTML = `
      <section class="mobile-panel">
        <h2>${textoMobile("mesa")} ${escaparMobile(mesa)}</h2>
        <p>${textoMobile("sinPedido")}</p>
        <div class="mobile-actions">
          <button class="mobile-btn green full" onclick="abrirMesaMobile()">${textoMobile("abrirMesa")}</button>
          <button class="mobile-btn full" onclick="cambiarVistaMobile('mesas')">${textoMobile("cambiarMesa")}</button>
        </div>
      </section>
    `;
    return;
  }

  const lineasHtml = estadoMobile.lineas.map((linea)=>{
    const nombre =
      linea.nombre ||
      linea.producto ||
      textoMobile("producto");
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
            ${nota ? textoMobile("editarNota") : textoMobile("anadirNota")}
          </button>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-panel">
      <h2>${textoMobile("mesa")} ${escaparMobile(mesa)}</h2>

      <div class="mobile-total">
        <span>${textoMobile("totalPedido")}</span>
        <strong>${dineroMobile(estadoMobile.total)}</strong>
      </div>

      <div class="mobile-actions">
        <button class="mobile-btn blue" onclick="cambiarVistaMobile('productos')">${textoMobile("anadirProductos")}</button>
        <button class="mobile-btn yellow" onclick="generarPrecuentaMobile()">${textoMobile("precuenta")}</button>
        <button class="mobile-btn blue" onclick="enviarTodasComandasMobile()">${textoMobile("enviarComandas")}</button>
      </div>
    </section>

    <section class="mobile-panel">
      <h3>${textoMobile("lineasPedido")}</h3>
      ${lineasHtml || `<div class="mobile-empty">${textoMobile("sinProductosPedido")}</div>`}
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
    toastMobile(textoMobile("mesaAbierta"), "ok");
  }catch(error){
    estadoMobile.cargando = false;
    renderMobile();
    toastMobile(textoMobile("noAbrirMesa"), "error");
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
    toastMobile(textoMobile("cantidadActualizada"), "ok");
  }catch(error){
    console.error("Error cambiando cantidad móvil:", error);
    toastMobile(textoMobile("noCambiarCantidad"), "error");
  }
}

async function editarNotaLineaMobile(lineaId, notaActual){
  const nuevaNota = window.prompt(
    textoMobile("notaPrompt"),
    notaActual || ""
  );

  if(nuevaNota === null) return;

  try{
    await apiMobile("/linea/" + lineaId + "/nota", {
      method:"POST",
      body:{ nota: nuevaNota }
    });

    await cargarPedidoMobile(estadoMobile.mesa);
    renderMobile();
    toastMobile(textoMobile("notaGuardada"), "ok");
  }catch(error){
    toastMobile(textoMobile("noGuardarNota"), "error");
  }
}

function renderProductosMobile(){
  if(!estadoMobile.mesa){
    document.getElementById("mobile-app").innerHTML = `
      <section class="mobile-empty">
        ${textoMobile("seleccionaMesaAntes")}
        <div class="mobile-actions">
          <button class="mobile-btn primary full" onclick="cambiarVistaMobile('mesas')">${textoMobile("verMesas")}</button>
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
        <small>${escaparMobile(p.categoria || "")}${Number(p.requiere_coccion) === 1 ? " · " + textoMobile("puntoCoccion") : ""}</small>
      </div>
      <span>${dineroMobile(p.precio)}</span>
    </button>
  `).join("");

  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-panel">
      <h2>${textoMobile("productos")}</h2>
      <p><strong>${textoMobile("mesa")}:</strong> ${escaparMobile(estadoMobile.mesa)}</p>

      <input
        class="mobile-search"
        placeholder="${escaparMobile(textoMobile("buscarProducto"))}"
        value="${escaparMobile(estadoMobile.busqueda)}"
        oninput="buscarProductoMobile(this.value)"
      >

      <div class="mobile-categorias">
        ${categoriasHtml}
      </div>

      <div class="mobile-productos">
        ${productosHtml || `<div class="mobile-empty">${textoMobile("sinProductosCategoria")}</div>`}
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
    textoMobile("pocoHecho"),
    textoMobile("alPuntoMenos"),
    textoMobile("alPunto"),
    textoMobile("alPuntoMas"),
    textoMobile("muyHecho")
  ];

  const prefijo =
    textoMobile("puntoPrefijo");

  const botones = opciones.map((opcion)=>`
    <button onclick="anadirProductoMobilePorId(${Number(producto.id)}, '${escaparMobile(prefijo + ": " + opcion).replace(/'/g,"\\'")}', '${escaparMobile(opcion).replace(/'/g,"\\'")}')">
      ${escaparMobile(opcion)}
    </button>
  `).join("");

  document.getElementById("mobile-modal").innerHTML = `
    <div class="mobile-modal-bg">
      <div class="mobile-modal-box">
        <h3>${escaparMobile(producto.nombre)}</h3>
        <div class="mobile-modal-options">
          ${botones}
          <button onclick="anadirProductoMobilePorId(${Number(producto.id)}, '', '')">${textoMobile("sinPunto")}</button>
          <button onclick="cerrarModalMobile()">${textoMobile("cancelar")}</button>
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
    toastMobile(
      textoMobile("seleccionaMesaPrimero"),
      "error"
    );
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

    toastMobile(textoMobile("productoAnadido"), "ok");
    renderProductosMobile();
  }catch(error){
    toastMobile(textoMobile("noAnadirProducto"), "error");
  }
}

async function enviarComandaMobile(destino){
  if(!estadoMobile.mesa){
    toastMobile(
      textoMobile("seleccionaMesaComanda"),
      "error"
    );
    return;
  }

  try{
    toastMobile(textoMobile("enviandoComandas"), "info");

    const respuestaFetch = await fetch(
      API_MOBILE + "/saas/comandas/enviar-todas/" + encodeURIComponent(estadoMobile.mesa),
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }
    );

    const respuesta = await respuestaFetch.json().catch(function(){
      return {
        ok:false,
        error:textoMobile("respuestaNoValida")
      };
    });

    if(!respuestaFetch.ok || respuesta.ok === false){
      throw new Error(
      respuesta.error ||
      textoMobile("errorEnviarComandas")
    );
    }

    if(respuesta && Array.isArray(respuesta.enviados) && respuesta.enviados.length > 0){
      toastMobile(
        textoMobile("comandasEnviadas") +
        ": " +
        respuesta.enviados.join(", "),
        "ok"
      );

      if(typeof cargarPedidoMobile === "function"){
        await cargarPedidoMobile(estadoMobile.mesa);
      }

      return;
    }

    console.log("DEBUG enviarComandaMobile:", respuesta);
    toastMobile(
      textoMobile("sinNuevosProductos"),
      "aviso"
    );
  }catch(error){
    console.error("Error enviando comandas mobile:", error);
    toastMobile(textoMobile("noEnviarComanda"), "error");
  }
}


async function enviarTodasComandasMobile(){
  if(!estadoMobile.mesa){
    toastMobile(
      textoMobile("seleccionaMesaComanda"),
      "error"
    );
    return;
  }

  try{
    toastMobile(textoMobile("enviandoComandas"), "info");

    const respuestaFetch = await fetch(
      API_MOBILE + "/saas/comandas/enviar-todas/" + encodeURIComponent(estadoMobile.mesa),
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }
    );

    const respuesta = await respuestaFetch.json().catch(function(){
      return {
        ok:false,
        error:textoMobile("respuestaNoValida")
      };
    });

    if(!respuestaFetch.ok || respuesta.ok === false){
      throw new Error(
      respuesta.error ||
      textoMobile("errorEnviarComandas")
    );
    }

    if(respuesta && Array.isArray(respuesta.enviados) && respuesta.enviados.length > 0){
      toastMobile(
        textoMobile("comandasEnviadas") +
        ": " +
        respuesta.enviados.join(", "),
        "ok"
      );

      if(typeof cargarPedidoMobile === "function"){
        await cargarPedidoMobile(estadoMobile.mesa);
      }

      return;
    }

    console.log("DEBUG enviarTodasComandasMobile:", respuesta);
    toastMobile(
      textoMobile("sinNuevosProductos"),
      "aviso"
    );
  }catch(error){
    console.error("Error enviando comandas mobile:", error);
    toastMobile(textoMobile("noEnviarComandas"), "error");
  }
}



function renderPrecuentaMobile(){
  if(!estadoMobile.mesa || !estadoMobile.pedido){
    estadoMobile.vista = "pedido";
    renderPedidoMobile();
    return;
  }

  const lineasHtml = estadoMobile.lineas.map((linea)=>{
    const nombre =
      linea.nombre ||
      linea.producto ||
      textoMobile("producto");

    const cantidad = Number(linea.cantidad || 0);
    const precio = Number(linea.precio || 0);

    const subtotal = Number(
      linea.subtotal ||
      (cantidad * precio)
    );

    const nota = linea.nota || "";

    return `
      <div class="mobile-preconto-linea">

        <div class="mobile-preconto-linea-principal">
          <strong>${cantidad} × ${escaparMobile(nombre)}</strong>
          <span>${dineroMobile(subtotal)}</span>
        </div>

        <div class="mobile-preconto-precio">
          ${dineroMobile(precio)}
        </div>

        ${nota
          ? `<div class="mobile-preconto-nota">${escaparMobile(nota)}</div>`
          : ""
        }

      </div>
    `;
  }).join("");

  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-preconto">

      <div class="mobile-preconto-cabecera">
        <strong>Restaurant Service</strong>

        <h2>${textoMobile("precuenta")}</h2>

        <div>
          ${textoMobile("mesa")} ${escaparMobile(estadoMobile.mesa)}
        </div>
      </div>

      <div class="mobile-preconto-lineas">
        ${lineasHtml}
      </div>

      <div class="mobile-preconto-total">
        <span>${textoMobile("totalPedido")}</span>
        <strong>${dineroMobile(estadoMobile.total)}</strong>
      </div>

      <div class="mobile-preconto-actions">

        <button
          class="mobile-btn green full"
          onclick="imprimirPrecuentaMobile()"
        >
          ${textoMobile("imprimirPrecuenta")}
        </button>

        <button
          class="mobile-btn full"
          onclick="volverPedidoDesdePrecuentaMobile()"
        >
          ${textoMobile("volverPedido")}
        </button>

      </div>

    </section>
  `;
}


function volverPedidoDesdePrecuentaMobile(){
  estadoMobile.vista = "pedido";
  renderMobile();
}


function imprimirPrecuentaMobile(){
  if(!estadoMobile.mesa){
    return;
  }

  try{
    const vecchio =
      document.getElementById("mobile-ticket-print-frame");

    if(vecchio){
      vecchio.remove();
    }

    const iframe = document.createElement("iframe");

    iframe.id = "mobile-ticket-print-frame";

    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.border = "0";

    iframe.src =
      API_MOBILE +
      "/ticket/" +
      encodeURIComponent(estadoMobile.mesa);

    iframe.onload = function(){
      setTimeout(function(){
        try{
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }catch(error){
          toastMobile(
            textoMobile("noImprimirPrecuenta"),
            "error"
          );
        }
      }, 400);
    };

    document.body.appendChild(iframe);

    setTimeout(function(){
      if(iframe.parentNode){
        iframe.remove();
      }
    }, 30000);

  }catch(error){
    toastMobile(
      textoMobile("noImprimirPrecuenta"),
      "error"
    );
  }
}


async function generarPrecuentaMobile(){
  if(!estadoMobile.mesa || !estadoMobile.pedido){
    toastMobile(textoMobile("sinPedidoAbierto"), "error");
    return;
  }

  try{
    await apiMobile("/mesa/" + encodeURIComponent(estadoMobile.mesa) + "/cuenta", {
      method:"POST",
      body:{}
    });

    estadoMobile.vista = "precuenta";

await cargarPedidoMobile(estadoMobile.mesa);
    await cargarMesasMobile();
    renderMobile();

    toastMobile(textoMobile("precuentaGenerada"), "ok");
  }catch(error){
    toastMobile(textoMobile("noGenerarPrecuenta"), "error");
  }
}

async function iniciarPosMobile(){
  try{
    await cargarUsuarioMobile();
  }catch(error){
    console.warn(
      "No se pudo cargar el usuario móvil:",
      error.message || error
    );
  }

  await recargarTodoMobile();
}

document.addEventListener("DOMContentLoaded", iniciarPosMobile);

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
