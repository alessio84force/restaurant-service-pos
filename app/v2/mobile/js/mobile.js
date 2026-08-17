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
  idioma: "es",
  pagamento: null
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
    pagar: "Cobrar",
    pago: "Pago",
    totalCuenta: "Total",
    pagado: "Pagado",
    pendiente: "Pendiente",
    metodoPago: "Método de pago",
    tarjeta: "Tarjeta",
    efectivo: "Efectivo",
    bizum: "Bizum",
    importeCobrar: "Importe a cobrar",
    todo: "Todo",
    mitad: "Mitad",
    confirmarPago: "Confirmar pago",
    pagosRealizados: "Pagos realizados",
    sinPagos: "Todavía no hay pagos registrados.",
    pagoRegistrado: "Pago registrado correctamente.",
    pagoCompletado: "Pago completado",
    mesaLiberada: "La mesa está libre.",
    volverMesas: "Volver a mesas",
    importeMayorCero: "El importe debe ser mayor que cero.",
    importeSuperaPendiente: "El importe no puede superar lo pendiente.",
    noCargarPago: "No se pudieron cargar los datos del pago.",
    noRegistrarPago: "No se pudo registrar el pago.",
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
    pagar: "Paga",
    pago: "Pagamento",
    totalCuenta: "Totale",
    pagado: "Pagato",
    pendiente: "Da pagare",
    metodoPago: "Metodo di pagamento",
    tarjeta: "Carta",
    efectivo: "Contanti",
    bizum: "Bizum",
    importeCobrar: "Importo da pagare",
    todo: "Tutto",
    mitad: "Metà",
    confirmarPago: "Conferma pagamento",
    pagosRealizados: "Pagamenti effettuati",
    sinPagos: "Non ci sono ancora pagamenti registrati.",
    pagoRegistrado: "Pagamento registrato correttamente.",
    pagoCompletado: "Pagamento completato",
    mesaLiberada: "Il tavolo è libero.",
    volverMesas: "Torna ai tavoli",
    importeMayorCero: "L'importo deve essere maggiore di zero.",
    importeSuperaPendiente: "L'importo non può superare il saldo da pagare.",
    noCargarPago: "Impossibile caricare i dati del pagamento.",
    noRegistrarPago: "Impossibile registrare il pagamento.",
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
    pagar: "Pay",
    pago: "Payment",
    totalCuenta: "Total",
    pagado: "Paid",
    pendiente: "Remaining",
    metodoPago: "Payment method",
    tarjeta: "Card",
    efectivo: "Cash",
    bizum: "Bizum",
    importeCobrar: "Amount to pay",
    todo: "All",
    mitad: "Half",
    confirmarPago: "Confirm payment",
    pagosRealizados: "Payments made",
    sinPagos: "No payments recorded yet.",
    pagoRegistrado: "Payment recorded successfully.",
    pagoCompletado: "Payment completed",
    mesaLiberada: "The table is free.",
    volverMesas: "Back to tables",
    importeMayorCero: "The amount must be greater than zero.",
    importeSuperaPendiente: "The amount cannot exceed the remaining balance.",
    noCargarPago: "Could not load payment data.",
    noRegistrarPago: "Could not record the payment.",
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

function esAdminGerenteMobile(){
  const rol = String(estadoMobile.rol || "").toLowerCase();
  return rol === "admin" || rol === "gerente";
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
    ["precuenta", "pagamento", "pagamento-completato"].includes(
      estadoMobile.vista
    )
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

  if(estadoMobile.vista === "pagamento"){
    renderPagamentoMobile();
    return;
  }

  if(estadoMobile.vista === "pagamento-completato"){
    renderPagamentoCompletatoMobile();
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
    estadoMobile.pagamento = null;
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

        ${esAdminGerenteMobile() ? `
          <button
            class="mobile-btn primary full"
            onclick="aprirePagamentoMobile()"
          >
            ${textoMobile("pagar")}
          </button>
        ` : ""}

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



function arrotondarePagamentoMobile(valor){
  return Math.round((Number(valor || 0) + Number.EPSILON) * 100) / 100;
}


function leggereImportoPagamentoMobile(){
  const input = document.getElementById("mobile-pagamento-importe");

  if(!input){
    return 0;
  }

  const valore = String(input.value || "")
    .trim()
    .replace(",", ".");

  const numero = Number(valore);

  if(!Number.isFinite(numero)){
    return 0;
  }

  return arrotondarePagamentoMobile(numero);
}


function nomeMetodoPagamentoMobile(metodo){
  if(metodo === "tarjeta"){
    return textoMobile("tarjeta");
  }

  if(metodo === "efectivo"){
    return textoMobile("efectivo");
  }

  if(metodo === "bizum"){
    return textoMobile("bizum");
  }

  return metodo || textoMobile("pago");
}


async function aprirePagamentoMobile(){
  if(!esAdminGerenteMobile()){
    toastMobile(textoMobile("errorApi"), "error");
    return;
  }

  if(!estadoMobile.mesa || !estadoMobile.pedido){
    toastMobile(textoMobile("sinPedidoAbierto"), "error");
    return;
  }

  estadoMobile.pagamento = {
    pedidoId: Number(estadoMobile.pedido),
    mesa: String(estadoMobile.mesa),
    total: arrotondarePagamentoMobile(estadoMobile.total),
    pagado: 0,
    pendiente: arrotondarePagamentoMobile(estadoMobile.total),
    pagos: [],
    metodo: "tarjeta",
    importeActual: "",
    procesando: false,
    mensaje: "",
    tipoMensaje: ""
  };

  estadoMobile.vista = "pagamento";
  renderMobile();

  await caricarePagamentoMobile();
}


async function caricarePagamentoMobile(){
  const pagamento = estadoMobile.pagamento;

  if(
    !pagamento ||
    !pagamento.pedidoId ||
    !esAdminGerenteMobile()
  ){
    return;
  }

  try{
    const resultados = await Promise.all([
      apiMobile(
        "/pedido/" +
        encodeURIComponent(pagamento.pedidoId) +
        "/pagos"
      ),
      apiMobile(
        "/pedido/" +
        encodeURIComponent(pagamento.pedidoId) +
        "/pendiente"
      )
    ]);

    const pagos = resultados[0];
    const resumen = resultados[1] || {};

    pagamento.pagos = Array.isArray(pagos) ? pagos : [];
    pagamento.total = arrotondarePagamentoMobile(
      resumen.total != null
        ? resumen.total
        : pagamento.total
    );

    pagamento.pagado = arrotondarePagamentoMobile(
      resumen.pagado != null
        ? resumen.pagado
        : pagamento.pagos.reduce(
            (suma, pago)=>suma + Number(pago.importe || 0),
            0
          )
    );

    pagamento.pendiente = Math.max(
      0,
      arrotondarePagamentoMobile(
        resumen.pendiente != null
          ? resumen.pendiente
          : pagamento.total - pagamento.pagado
      )
    );

    if(pagamento.pendiente <= 0.005){
      await completarePagamentoMobile();
      return;
    }

    if(estadoMobile.vista === "pagamento"){
      renderMobile();
    }

  }catch(error){
    console.error(
      "Error cargando pagamento mobile:",
      error
    );

    pagamento.mensaje = textoMobile("noCargarPago");
    pagamento.tipoMensaje = "error";

    if(estadoMobile.vista === "pagamento"){
      renderMobile();
    }
  }
}


function renderPagamentoMobile(){
  if(!esAdminGerenteMobile()){
    estadoMobile.vista = "pedido";
    renderMobile();
    return;
  }

  const pagamento = estadoMobile.pagamento;

  if(!pagamento){
    estadoMobile.vista = "precuenta";
    renderMobile();
    return;
  }

  const importeInput =
    pagamento.importeActual !== null &&
    pagamento.importeActual !== undefined
      ? String(pagamento.importeActual)
      : "";

  const desactivado =
    pagamento.procesando ||
    pagamento.pendiente <= 0.005;

  const historialHtml =
    pagamento.pagos.length > 0
      ? pagamento.pagos.map((pago)=>{
          return `
            <div class="mobile-pagamento-historial-item">
              <strong>
                ${escaparMobile(
                  nomeMetodoPagamentoMobile(pago.metodo)
                )}
              </strong>

              <span>
                ${dineroMobile(pago.importe)}
              </span>
            </div>
          `;
        }).join("")
      : `
          <div class="mobile-pagamento-vacio">
            ${textoMobile("sinPagos")}
          </div>
        `;

  const mensajeHtml = pagamento.mensaje
    ? `
        <div class="mobile-pagamento-mensaje ${pagamento.tipoMensaje || ""}">
          ${escaparMobile(pagamento.mensaje)}
        </div>
      `
    : "";

  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-pagamento">

      <div class="mobile-pagamento-cabecera">
        <strong>Restaurant Service</strong>
        <h2>${textoMobile("pago")}</h2>
        <div>
          ${textoMobile("mesa")}
          ${escaparMobile(pagamento.mesa)}
        </div>
      </div>

      <div class="mobile-pagamento-resumen">

        <div class="mobile-pagamento-card">
          <span>${textoMobile("totalCuenta")}</span>
          <strong>${dineroMobile(pagamento.total)}</strong>
        </div>

        <div class="mobile-pagamento-card">
          <span>${textoMobile("pagado")}</span>
          <strong>${dineroMobile(pagamento.pagado)}</strong>
        </div>

        <div class="mobile-pagamento-card pendiente">
          <span>${textoMobile("pendiente")}</span>
          <strong>${dineroMobile(pagamento.pendiente)}</strong>
        </div>

      </div>

      ${mensajeHtml}

      <div class="mobile-pagamento-bloque">

        <h3>${textoMobile("metodoPago")}</h3>

        <div class="mobile-pagamento-metodos">

          <button
            class="mobile-btn ${pagamento.metodo === "tarjeta" ? "primary" : ""}"
            onclick="selezionareMetodoPagamentoMobile('tarjeta')"
            ${desactivado ? "disabled" : ""}
          >
            ${textoMobile("tarjeta")}
          </button>

          <button
            class="mobile-btn ${pagamento.metodo === "efectivo" ? "primary" : ""}"
            onclick="selezionareMetodoPagamentoMobile('efectivo')"
            ${desactivado ? "disabled" : ""}
          >
            ${textoMobile("efectivo")}
          </button>

          <button
            class="mobile-btn ${pagamento.metodo === "bizum" ? "primary" : ""}"
            onclick="selezionareMetodoPagamentoMobile('bizum')"
            ${desactivado ? "disabled" : ""}
          >
            ${textoMobile("bizum")}
          </button>

        </div>

      </div>

      <div class="mobile-pagamento-bloque">

        <h3>${textoMobile("importeCobrar")}</h3>

        <input
          id="mobile-pagamento-importe"
          class="mobile-pagamento-input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          value="${escaparMobile(importeInput)}"
          ${desactivado ? "disabled" : ""}
        >

        <div class="mobile-pagamento-rapidi">

          <button
            class="mobile-btn"
            onclick="impostareImportoPagamentoMobile('todo')"
            ${desactivado ? "disabled" : ""}
          >
            ${textoMobile("todo")}
          </button>

          <button
            class="mobile-btn"
            onclick="impostareImportoPagamentoMobile('mitad')"
            ${desactivado ? "disabled" : ""}
          >
            ${textoMobile("mitad")}
          </button>

          <button
            class="mobile-btn"
            onclick="impostareImportoPagamentoMobile(5)"
            ${desactivado ? "disabled" : ""}
          >
            5 €
          </button>

          <button
            class="mobile-btn"
            onclick="impostareImportoPagamentoMobile(10)"
            ${desactivado ? "disabled" : ""}
          >
            10 €
          </button>

          <button
            class="mobile-btn"
            onclick="impostareImportoPagamentoMobile(20)"
            ${desactivado ? "disabled" : ""}
          >
            20 €
          </button>

        </div>

        <button
          class="mobile-btn green full mobile-pagamento-conferma"
          onclick="confermarePagamentoMobile()"
          ${desactivado ? "disabled" : ""}
        >
          ${pagamento.procesando
            ? textoMobile("cargando")
            : textoMobile("confirmarPago")
          }
        </button>

      </div>

      <div class="mobile-pagamento-bloque">

        <h3>${textoMobile("pagosRealizados")}</h3>

        <div class="mobile-pagamento-historial">
          ${historialHtml}
        </div>

      </div>

      <button
        class="mobile-btn full"
        onclick="tornarePrecontoDaPagamentoMobile()"
        ${pagamento.procesando ? "disabled" : ""}
      >
        ${textoMobile("precuenta")}
      </button>

    </section>
  `;
}


function selezionareMetodoPagamentoMobile(metodo){
  const pagamento = estadoMobile.pagamento;

  if(!pagamento || pagamento.procesando){
    return;
  }

  const valoreAttuale =
    document.getElementById("mobile-pagamento-importe");

  pagamento.importeActual =
    valoreAttuale ? valoreAttuale.value : "";

  pagamento.metodo = metodo;
  pagamento.mensaje = "";
  pagamento.tipoMensaje = "";

  renderPagamentoMobile();
}


function impostareImportoPagamentoMobile(valor){
  const pagamento = estadoMobile.pagamento;

  if(!pagamento || pagamento.procesando){
    return;
  }

  const pendiente = Math.max(
    0,
    arrotondarePagamentoMobile(pagamento.pendiente)
  );

  let importe = 0;

  if(valor === "todo"){
    importe = pendiente;
  }else if(valor === "mitad"){
    importe = pendiente / 2;
  }else{
    importe = Math.min(
      Number(valor || 0),
      pendiente
    );
  }

  pagamento.importeActual =
    arrotondarePagamentoMobile(importe).toFixed(2);

  const input =
    document.getElementById("mobile-pagamento-importe");

  if(input){
    input.value = pagamento.importeActual;
  }
}


async function confermarePagamentoMobile(){
  const pagamento = estadoMobile.pagamento;

  if(
    !pagamento ||
    pagamento.procesando ||
    !esAdminGerenteMobile()
  ){
    return;
  }

  const importe = leggereImportoPagamentoMobile();

  pagamento.importeActual =
    importe > 0 ? importe.toFixed(2) : "";

  if(importe <= 0){
    pagamento.mensaje =
      textoMobile("importeMayorCero");

    pagamento.tipoMensaje = "error";

    renderPagamentoMobile();
    return;
  }

  if(importe > pagamento.pendiente + 0.005){
    pagamento.mensaje =
      textoMobile("importeSuperaPendiente");

    pagamento.tipoMensaje = "error";

    renderPagamentoMobile();
    return;
  }

  try{
    pagamento.procesando = true;
    pagamento.mensaje = "";
    pagamento.tipoMensaje = "";

    renderPagamentoMobile();

    const risposta = await apiMobile(
      "/pedido/" +
      encodeURIComponent(pagamento.pedidoId) +
      "/pago",
      {
        method: "POST",
        body: {
          metodo: pagamento.metodo,
          importe: importe
        }
      }
    );

    pagamento.procesando = false;
    pagamento.importeActual = "";

    const pendienteServidor =
      arrotondarePagamentoMobile(
        risposta && risposta.pendiente
      );

    if(pendienteServidor <= 0.005){
      pagamento.pagado =
        arrotondarePagamentoMobile(pagamento.total);

      pagamento.pendiente = 0;

      await completarePagamentoMobile();
      return;
    }

    pagamento.mensaje =
      textoMobile("pagoRegistrado");

    pagamento.tipoMensaje = "ok";

    await caricarePagamentoMobile();

  }catch(error){
    console.error(
      "Error registrando pagamento mobile:",
      error
    );

    pagamento.procesando = false;
    pagamento.mensaje =
      textoMobile("noRegistrarPago");

    pagamento.tipoMensaje = "error";

    renderPagamentoMobile();
  }
}


async function completarePagamentoMobile(){
  const pagamento = estadoMobile.pagamento;

  if(!pagamento){
    return;
  }

  const mesaChiusa = pagamento.mesa;

  pagamento.procesando = false;
  pagamento.pendiente = 0;

  estadoMobile.vista = "pagamento-completato";

  /*
   * Evita che la sincronizzazione automatica ricarichi
   * il pedido appena chiuso mentre mostriamo la conferma.
   */
  estadoMobile.mesa = null;
  estadoMobile.pedido = null;
  estadoMobile.lineas = [];
  estadoMobile.total = 0;

  try{
    await cargarMesasMobile();
  }catch(error){
    console.warn(
      "Tavoli non aggiornati dopo pagamento:",
      error.message || error
    );
  }

  pagamento.mesa = mesaChiusa;

  renderMobile();
}


function renderPagamentoCompletatoMobile(){
  const pagamento = estadoMobile.pagamento;

  if(!pagamento){
    statoFinalePagamentoVersoMesasMobile();
    return;
  }

  document.getElementById("mobile-app").innerHTML = `
    <section class="mobile-pagamento mobile-pagamento-completato">

      <div class="mobile-pagamento-cabecera">
        <strong>Restaurant Service</strong>
        <h2>${textoMobile("pagoCompletado")}</h2>
      </div>

      <div class="mobile-pagamento-success">
        <strong>
          ${textoMobile("mesa")}
          ${escaparMobile(pagamento.mesa)}
        </strong>

        <span>
          ${textoMobile("mesaLiberada")}
        </span>
      </div>

      <div class="mobile-pagamento-resumen">

        <div class="mobile-pagamento-card">
          <span>${textoMobile("totalCuenta")}</span>
          <strong>${dineroMobile(pagamento.total)}</strong>
        </div>

        <div class="mobile-pagamento-card">
          <span>${textoMobile("pagado")}</span>
          <strong>${dineroMobile(pagamento.total)}</strong>
        </div>

        <div class="mobile-pagamento-card pendiente">
          <span>${textoMobile("pendiente")}</span>
          <strong>0.00 €</strong>
        </div>

      </div>

      <button
        class="mobile-btn green full mobile-pagamento-conferma"
        onclick="statoFinalePagamentoVersoMesasMobile()"
      >
        ${textoMobile("volverMesas")}
      </button>

    </section>
  `;
}


function statoFinalePagamentoVersoMesasMobile(){
  estadoMobile.pagamento = null;
  estadoMobile.mesa = null;
  estadoMobile.pedido = null;
  estadoMobile.lineas = [];
  estadoMobile.total = 0;
  estadoMobile.vista = "mesas";

  renderMobile();
}


function tornarePrecontoDaPagamentoMobile(){
  if(
    !estadoMobile.pagamento ||
    estadoMobile.pagamento.procesando
  ){
    return;
  }

  estadoMobile.vista = "precuenta";
  renderMobile();
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

    if(
      estadoMobile.vista === "pagamento" &&
      estadoMobile.pagamento
    ){
      await caricarePagamentoMobile();
    }else if(
      estadoMobile.mesa &&
      estadoMobile.vista !== "pagamento-completato"
    ){
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
