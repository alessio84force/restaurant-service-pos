async function cargarMesasV2(){

    const mesas = await apiGet("/mesas");

    const lista = document.getElementById("lista-mesas");

    lista.innerHTML="";

    const zonas={};

    mesas.forEach(m=>{

        if(!zonas[m.zona]){

            zonas[m.zona]=[];

        }

        zonas[m.zona].push(m);

    });

    Object.keys(zonas).forEach(nombre=>{

        const zona=document.createElement("div");

        zona.className="zona";

        zona.innerHTML="<h3>"+nombre+"</h3>";

        const grid=document.createElement("div");

        grid.className="grid-mesas";

        zonas[nombre].forEach(mesa=>{

            let icono="🟢";

            if(mesa.estado=="ocupada") icono="🔴";
            if(mesa.estado=="reservada") icono="🟡";
            if(mesa.estado=="cuenta") icono="🔵";

            const card=document.createElement("div");

            card.className="mesa-card "+mesa.estado;

            card.innerHTML=`

                <div class="numero-mesa">

                    ${mesa.numero}

                </div>

                <div class="icono">

                    ${icono}

                </div>

            `;

            card.onclick=()=>{

                mesaSeleccionada=mesa.numero;

                document.querySelectorAll(".mesa-card").forEach(c=>{

                    c.style.borderColor="transparent";

                });

                card.style.borderColor="#2563eb";

                cargarPedidoV2(mesa.numero);

            };

            grid.appendChild(card);

        });

        zona.appendChild(grid);

        lista.appendChild(zona);

    });

}
