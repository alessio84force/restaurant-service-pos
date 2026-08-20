(function(){

    const TESTI = {
        es: {
            version: "Versión 2",
            mesas: "Mesas",
            bienvenida: "Bienvenido",
            seleccionar_mesa: "Selecciona una mesa para comenzar.",
            menu: "Menú",
            cerrar_sesion: "Cerrar sesión",
            cargando_usuario: "Cargando usuario..."
        },

        it: {
            version: "Versione 2",
            mesas: "Tavoli",
            bienvenida: "Benvenuto",
            seleccionar_mesa: "Seleziona un tavolo per iniziare.",
            menu: "Menu",
            cerrar_sesion: "Chiudi sessione",
            cargando_usuario: "Caricamento utente..."
        },

        en: {
            version: "Version 2",
            mesas: "Tables",
            bienvenida: "Welcome",
            seleccionar_mesa: "Select a table to get started.",
            menu: "Menu",
            cerrar_sesion: "Sign out",
            cargando_usuario: "Loading user..."
        },

        "pt-br": {
            version: "Versão 2",
            mesas: "Mesas",
            bienvenida: "Bem-vindo",
            seleccionar_mesa: "Selecione uma mesa para começar.",
            menu: "Cardápio",
            cerrar_sesion: "Sair",
            cargando_usuario: "Carregando usuário..."
        }
    };

    function normalizzaLingua(valor){
        const lingua = String(valor || "").trim().toLowerCase();

        if(["es","it","en","pt-br"].includes(lingua)){
            return lingua;
        }

        return "es";
    }

    function applicaTraduzioni(lingua){
        const testi = TESTI[lingua] || TESTI.es;

        document.documentElement.lang = lingua;

        document.querySelectorAll("[data-pos-i18n]").forEach(function(el){
            const chiave = el.getAttribute("data-pos-i18n");

            if(Object.prototype.hasOwnProperty.call(testi, chiave)){
                el.textContent = testi[chiave];
            }
        });
    }

    async function avviaTraduzione(){
        try{
            const risposta = await fetch(
                window.location.origin + "/usuario-actual",
                {
                    credentials: "include"
                }
            );

            if(!risposta.ok){
                return;
            }

            const dati = await risposta.json();

            const lingua = normalizzaLingua(
                dati.idioma ||
                (
                    dati.usuario &&
                    dati.usuario.idioma
                )
            );

            applicaTraduzioni(lingua);

        }catch(error){
            console.warn(
                "Traduzione POS non disponibile:",
                error.message || error
            );
        }
    }

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded", avviaTraduzione);
    }else{
        avviaTraduzione();
    }

})();
