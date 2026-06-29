let mesaSeleccionada = null;

document.addEventListener("DOMContentLoaded", async ()=>{

    try{

        await cargarMesasV2();

        await cargarMenuV2();

        console.log("Restaurant Service POS V2 iniciado");

    }catch(error){

        console.error("Error iniciando V2:", error);

    }

});
