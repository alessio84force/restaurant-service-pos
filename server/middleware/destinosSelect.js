function destinosSelectMiddleware(){
  const injection = `
<style>
.rs-destinos-link{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  margin:14px 0 18px;
  padding:12px 16px;
  border-radius:14px;
  background:#111827;
  color:white !important;
  text-decoration:none;
  font-weight:900;
  box-shadow:0 8px 18px rgba(15,23,42,.16);
}
.rs-destinos-link:hover{opacity:.92;}
.rs-destinos-box{
  margin:14px 0 18px;
  padding:14px 16px;
  border-radius:16px;
  background:#f9fafb;
  border:1px solid #e5e7eb;
}
.rs-destinos-box strong{
  display:block;
  margin-bottom:6px;
}
.rs-destinos-box p{
  margin:0 0 10px;
  color:#4b5563;
}
</style>
<script id="rs-destinos-personalizables-script">
(function(){
  function insertarBoton(){
    if(document.querySelector('.rs-destinos-link')) return;

    var box = document.createElement('div');
    box.className = 'rs-destinos-box';
    box.innerHTML =
      '<strong>Destinos de comanda</strong>' +
      '<p>Crea destinos como Pizzería, Parrilla, Coctelería, Sushi o Pastelería y asígnalos a las categorías.</p>' +
      '<a class="rs-destinos-link" href="/configuracion-destinos">Configurar / crear destinos</a>';

    var h1 = document.querySelector('h1');
    if(h1 && h1.parentNode){
      h1.parentNode.insertBefore(box, h1.nextSibling);
      return;
    }

    var main = document.querySelector('main');
    if(main){
      main.insertBefore(box, main.firstChild);
      return;
    }

    document.body.insertBefore(box, document.body.firstChild);
  }

  function cargarDestinos(){
    if(!document.querySelector('select[name="destino"]')) return;

    insertarBoton();

    fetch('/api/destinos-comanda')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var destinos = data && data.destinos ? data.destinos : [];

        document.querySelectorAll('select[name="destino"]').forEach(function(select){
          var actual = select.value || '';
          select.innerHTML = '';

          var existeActual = false;

          destinos.forEach(function(destino){
            var opt = document.createElement('option');
            opt.value = destino.id;
            opt.textContent = destino.nombre;

            if(destino.id === actual){
              opt.selected = true;
              existeActual = true;
            }

            select.appendChild(opt);
          });

          if(actual && !existeActual){
            var optActual = document.createElement('option');
            optActual.value = actual;
            optActual.textContent = actual;
            optActual.selected = true;
            select.appendChild(optActual);
          }
        });
      })
      .catch(function(){
        insertarBoton();
      });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', cargarDestinos);
  }else{
    cargarDestinos();
  }
})();
</script>
`;

  return function(req,res,next){
    const originalSend = res.send;

    res.send = function(body){
      try{
        const contentType = String(res.getHeader("Content-Type") || "");

        if(
          typeof body === "string" &&
          body.includes('name="destino"') &&
          !body.includes("rs-destinos-personalizables-script") &&
          (contentType.includes("text/html") || body.includes("<html") || body.includes("<body"))
        ){
          if(body.includes("</body>")){
            body = body.replace("</body>", injection + "</body>");
          }else{
            body = body + injection;
          }
        }
      }catch(e){}

      return originalSend.call(this, body);
    };

    next();
  };
}

module.exports = destinosSelectMiddleware;
