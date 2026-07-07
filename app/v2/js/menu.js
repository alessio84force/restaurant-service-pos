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
        btn.innerHTML = p.producto + "<br><span>" + Number(p.precio).toFixed(2) + " €</span>" + (Number(p.requiere_coccion || 0) === 1 ? "<small class=\"badge-coccion-v2\">Punto cocción</small>" : "");

        btn.onclick = ()=>{
            agregarProductoV2(p.producto_id);
            mostrarCategoriasV2();
        };

        contenedor.appendChild(btn);

    });

}


// V2.2.7 - Puntos de cocción

const puntosCoccionV2 = [
    "Poco hecho",
    "Al punto menos",
    "Al punto",
    "Al punto más",
    "Muy hecho"
];

function buscarProductoMenuV2(productoId){
    return menuCompletoV2.find(p => Number(p.producto_id) === Number(productoId));
}

function seleccionarPuntoCoccionV2(producto){
    return new Promise((resolve)=>{
        const overlay = document.createElement("div");
        overlay.className = "modal-coccion-v2";

        const opciones = puntosCoccionV2.map(punto => {
            return '<button type="button" data-punto="' + punto + '">' + punto + '</button>';
        }).join("");

        overlay.innerHTML = `
            <div class="modal-coccion-card-v2">
                <h3>${producto.producto}</h3>
                <p>Selecciona el punto de cocción</p>

                <div class="modal-coccion-opciones-v2">
                    ${opciones}
                </div>

                <button type="button" class="modal-coccion-cancelar-v2">
                    Cancelar
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelectorAll("[data-punto]").forEach(btn=>{
            btn.addEventListener("click", ()=>{
                const punto = btn.getAttribute("data-punto");
                overlay.remove();
                resolve(punto);
            });
        });

        overlay.querySelector(".modal-coccion-cancelar-v2").addEventListener("click", ()=>{
            overlay.remove();
            resolve(null);
        });

        overlay.addEventListener("click", (event)=>{
            if(event.target === overlay){
                overlay.remove();
                resolve(null);
            }
        });
    });
}

async function agregarProductoV2(productoId){
    if(!mesaSeleccionada){
        alert("Selecciona una mesa antes de añadir productos.");
        return;
    }

    const producto = buscarProductoMenuV2(productoId);

    let nota = "";
    let puntoCoccion = "";

    if(producto && Number(producto.requiere_coccion || 0) === 1){
        puntoCoccion = await seleccionarPuntoCoccionV2(producto);

        if(!puntoCoccion){
            return;
        }

        nota = "Punto: " + puntoCoccion;
    }

    await apiPost("/anadir-producto",{
        mesa:mesaSeleccionada,
        producto:productoId,
        cantidad:1,
        nota:nota,
        punto_coccion:puntoCoccion
    });

    await cargarPedidoV2(mesaSeleccionada);
    await cargarMesasV2();
}

// FIN V2.2.7 - Puntos de cocción
