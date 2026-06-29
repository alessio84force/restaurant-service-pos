const API = "http://localhost:3000";

async function apiGet(url){

    const respuesta = await fetch(API + url);

    if(!respuesta.ok){

        throw new Error("Error HTTP " + respuesta.status);

    }

    return await respuesta.json();

}

async function apiPost(url, datos){

    const respuesta = await fetch(API + url,{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(datos || {})

    });

    if(!respuesta.ok){

        throw new Error("Error HTTP " + respuesta.status);

    }

    return await respuesta.json();

}
