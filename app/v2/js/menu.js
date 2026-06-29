let menuCompletoV2 = [];

async function cargarMenuV2(){

    menuCompletoV2 = await apiGet("/menu");

    mostrarCategoriasV2();

}

function mostrarCategoriasV2(){

    const categorias = {};

    menuCompletoV2.forEach(item=>{
        categorias[item.categoria_id] = item.categoria;
    });

    const contenedor = document.getElementById("lista-categorias");
    const productos = document.getElementById("lista-productos");

    contenedor.innerHTML = "";
    productos.innerHTML = "";

    Object.keys(categorias).forEach(id=>{

        const btn = document.createElement("button");

        btn.className = "menu-btn";
        btn.textContent = categorias[id];

        btn.onclick = ()=>{
            mostrarProductosV2(Number(id));
        };

        contenedor.appendChild(btn);

    });

}

function mostrarProductosV2(categoriaId){

    const contenedor = document.getElementById("lista-productos");
    const categorias = document.getElementById("lista-categorias");

    const productos = menuCompletoV2.filter(p=>p.categoria_id===categoriaId);

    categorias.innerHTML = "";

    const volver = document.createElement("button");
    volver.className = "menu-btn";
    volver.textContent = "← Categorías";
    volver.onclick = mostrarCategoriasV2;

    categorias.appendChild(volver);

    contenedor.innerHTML = "";

    productos.forEach(p=>{

        const btn = document.createElement("button");

        btn.className = "producto-btn";
        btn.innerHTML = p.producto + "<br><span>" + Number(p.precio).toFixed(2) + " €</span>";

        btn.onclick = ()=>{
            agregarProductoV2(p.producto_id);
            mostrarCategoriasV2();
        };

        contenedor.appendChild(btn);

    });

}

async function agregarProductoV2(productoId){

    if(!mesaSeleccionada){
        alert("Selecciona una mesa.");
        return;
    }

    await apiPost("/anadir-producto",{
        mesa:mesaSeleccionada,
        producto:productoId,
        cantidad:1
    });

    await cargarPedidoV2(mesaSeleccionada);
    await cargarMesasV2();

}
