const { normalizarIdioma } = require("./i18n");

function textosProductosConfig(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",
      productosPrecios: "Productos y precios",
      descripcion:
        "Crea categorías, productos, precios y destinos. Cada restaurante solo ve su propio menú.",
      volverConfiguracion: "Volver a configuración",
      primerosPasos: "Primeros pasos",
      abrirPos: "Abrir POS",

      nuevaCategoria: "Nueva categoría",
      categorias: "Categorías",
      nombre: "Nombre",
      placeholderCategoria: "Bebidas, Carnes, Postres...",
      destino: "Destino",
      crearCategoria: "Crear categoría",
      guardar: "Guardar",
      sinCategorias:
        "Todavía no hay categorías. Crea la primera categoría para empezar.",

      nuevoProducto: "Nuevo producto",
      productos: "Productos",
      nombreProducto: "Nombre producto",
      placeholderProducto: "Coca-Cola, Pizza margarita...",
      precio: "Precio",
      ivaProducto: "IVA del producto (%)",
      ivaProductoAyuda:
        "Déjalo vacío para usar el IVA por defecto del restaurante.",
      categoria: "Categoría",
      primeroCategoria: "Primero crea una categoría",
      requiereCoccion: "Requiere punto de cocción",
      puntoCoccion: "Punto de cocción",
      crearProducto: "Crear producto",
      guardarProducto: "Guardar producto",
      ocultarProducto: "Ocultar producto",
      activarProducto: "Activar producto",
      sinProductos: "Todavía no hay productos.",
      sinCategoria: "Sin categoría",

      destinoBar: "Bar",
      destinoCocina: "Cocina",
      destinoPizzeria: "Pizzería",
      destinoGeneral: "General",

      nombreCategoriaObligatorio:
        "Nombre de categoría obligatorio",
      categoriaCreada: "Categoría creada",
      datosCategoriaIncompletos:
        "Datos de categoría incompletos",
      categoriaActualizada: "Categoría actualizada",
      faltanDatosProducto: "Faltan datos del producto",
      categoriaNoEncontrada:
        "Categoría no encontrada para este restaurante",
      productoCreado: "Producto creado",
      productoActualizado: "Producto actualizado",
      productoNoEncontrado: "Producto no encontrado",
      productoNoEncontradoRestaurante:
        "Producto no encontrado para este restaurante",
      estadoProductoActualizado:
        "Estado del producto actualizado",
      sinPermisos:
        "No tienes permisos para configurar productos."
    },

    it: {
      lang: "it",
      productosPrecios: "Prodotti e prezzi",
      descripcion:
        "Crea categorie, prodotti, prezzi e destinazioni. Ogni ristorante vede soltanto il proprio menu.",
      volverConfiguracion: "Torna alla configurazione",
      primerosPasos: "Primi passi",
      abrirPos: "Apri POS",

      nuevaCategoria: "Nuova categoria",
      categorias: "Categorie",
      nombre: "Nome",
      placeholderCategoria: "Bevande, Carne, Dolci...",
      destino: "Destinazione",
      crearCategoria: "Crea categoria",
      guardar: "Salva",
      sinCategorias:
        "Non ci sono ancora categorie. Crea la prima categoria per iniziare.",

      nuevoProducto: "Nuovo prodotto",
      productos: "Prodotti",
      nombreProducto: "Nome del prodotto",
      placeholderProducto: "Coca-Cola, Pizza margherita...",
      precio: "Prezzo",
      ivaProducto: "IVA del prodotto (%)",
      ivaProductoAyuda:
        "Lascia vuoto per usare l'IVA predefinita del ristorante.",
      categoria: "Categoria",
      primeroCategoria: "Prima crea una categoria",
      requiereCoccion: "Richiede il punto di cottura",
      puntoCoccion: "Punto di cottura",
      crearProducto: "Crea prodotto",
      guardarProducto: "Salva prodotto",
      ocultarProducto: "Nascondi prodotto",
      activarProducto: "Attiva prodotto",
      sinProductos: "Non ci sono ancora prodotti.",
      sinCategoria: "Senza categoria",

      destinoBar: "Bar",
      destinoCocina: "Cucina",
      destinoPizzeria: "Pizzeria",
      destinoGeneral: "Generale",

      nombreCategoriaObligatorio:
        "Il nome della categoria è obbligatorio",
      categoriaCreada: "Categoria creata",
      datosCategoriaIncompletos:
        "Dati della categoria incompleti",
      categoriaActualizada: "Categoria aggiornata",
      faltanDatosProducto:
        "Mancano alcuni dati del prodotto",
      categoriaNoEncontrada:
        "Categoria non trovata per questo ristorante",
      productoCreado: "Prodotto creato",
      productoActualizado: "Prodotto aggiornato",
      productoNoEncontrado: "Prodotto non trovato",
      productoNoEncontradoRestaurante:
        "Prodotto non trovato per questo ristorante",
      estadoProductoActualizado:
        "Stato del prodotto aggiornato",
      sinPermisos:
        "Non hai i permessi per configurare i prodotti."
    },

    en: {
      lang: "en",
      productosPrecios: "Products and prices",
      descripcion:
        "Create categories, products, prices and destinations. Each restaurant only sees its own menu.",
      volverConfiguracion: "Back to settings",
      primerosPasos: "Getting started",
      abrirPos: "Open POS",

      nuevaCategoria: "New category",
      categorias: "Categories",
      nombre: "Name",
      placeholderCategoria: "Drinks, Meat, Desserts...",
      destino: "Destination",
      crearCategoria: "Create category",
      guardar: "Save",
      sinCategorias:
        "There are no categories yet. Create the first category to get started.",

      nuevoProducto: "New product",
      productos: "Products",
      nombreProducto: "Product name",
      placeholderProducto: "Coca-Cola, Margherita pizza...",
      precio: "Price",
      ivaProducto: "Product VAT (%)",
      ivaProductoAyuda:
        "Leave blank to use the restaurant's default VAT rate.",
      categoria: "Category",
      primeroCategoria: "Create a category first",
      requiereCoccion: "Requires cooking level",
      puntoCoccion: "Cooking level",
      crearProducto: "Create product",
      guardarProducto: "Save product",
      ocultarProducto: "Hide product",
      activarProducto: "Activate product",
      sinProductos: "There are no products yet.",
      sinCategoria: "No category",

      destinoBar: "Bar",
      destinoCocina: "Kitchen",
      destinoPizzeria: "Pizzeria",
      destinoGeneral: "General",

      nombreCategoriaObligatorio:
        "Category name is required",
      categoriaCreada: "Category created",
      datosCategoriaIncompletos:
        "Category details are incomplete",
      categoriaActualizada: "Category updated",
      faltanDatosProducto:
        "Some product details are missing",
      categoriaNoEncontrada:
        "Category not found for this restaurant",
      productoCreado: "Product created",
      productoActualizado: "Product updated",
      productoNoEncontrado: "Product not found",
      productoNoEncontradoRestaurante:
        "Product not found for this restaurant",
      estadoProductoActualizado:
        "Product status updated",
      sinPermisos:
        "You do not have permission to configure products."
    },
    "pt-br": {
          "lang": "pt-BR",
          "productosPrecios": "Produtos e preços",
          "descripcion": "Crie categorias, produtos, preços e destinos. Cada restaurante vê apenas o próprio cardápio.",
          "volverConfiguracion": "Voltar às configurações",
          "primerosPasos": "Primeiros passos",
          "abrirPos": "Abrir POS",
          "nuevaCategoria": "Nova categoria",
          "categorias": "Categorias",
          "nombre": "Nome",
          "placeholderCategoria": "Bebidas, Carnes, Sobremesas...",
          "destino": "Destino",
          "crearCategoria": "Criar categoria",
          "guardar": "Salvar",
          "sinCategorias": "Ainda não há categorias. Crie a primeira categoria para começar.",
          "nuevoProducto": "Novo produto",
          "productos": "Produtos",
          "nombreProducto": "Nome do produto",
          "placeholderProducto": "Coca-Cola, Pizza Margherita...",
          "precio": "Preço",
          "ivaProducto": "IVA do produto (%)",
          "ivaProductoAyuda": "Deixe em branco para usar o IVA padrão do restaurante.",
          "categoria": "Categoria",
          "primeroCategoria": "Crie uma categoria primeiro",
          "requiereCoccion": "Exige ponto de cozimento",
          "puntoCoccion": "Ponto de cozimento",
          "crearProducto": "Criar produto",
          "guardarProducto": "Salvar produto",
          "ocultarProducto": "Ocultar produto",
          "activarProducto": "Ativar produto",
          "sinProductos": "Ainda não há produtos.",
          "sinCategoria": "Sem categoria",
          "destinoBar": "Bar",
          "destinoCocina": "Cozinha",
          "destinoPizzeria": "Pizzaria",
          "destinoGeneral": "Geral",
          "nombreCategoriaObligatorio": "O nome da categoria é obrigatório",
          "categoriaCreada": "Categoria criada",
          "datosCategoriaIncompletos": "Os dados da categoria estão incompletos",
          "categoriaActualizada": "Categoria atualizada",
          "faltanDatosProducto": "Faltam alguns dados do produto",
          "categoriaNoEncontrada": "Categoria não encontrada para este restaurante",
          "productoCreado": "Produto criado",
          "productoActualizado": "Produto atualizado",
          "productoNoEncontrado": "Produto não encontrado",
          "productoNoEncontradoRestaurante": "Produto não encontrado para este restaurante",
          "estadoProductoActualizado": "Status do produto atualizado",
          "sinPermisos": "Você não tem permissão para configurar produtos."
    }
  };

  return textos[idioma] || textos.es;
}

module.exports = {
  textosProductosConfig
};
