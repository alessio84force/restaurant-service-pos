function destinosSelectMiddleware(){
  const injection = `
<style>
.rs-destinos-link{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  margin:10px 0 14px;
  padding:10px 14px;
  border-radius:12px;
  background:#111827;
  color:white !important;
  text-decoration:none;
  font-weight:800;
}
.rs-destinos-link:hover{opacity:.9;}
</style>
<script id="rs-destinos-personalizables-script">
(function(){
  function cargarDestinos(){
    if(!document.querySelector('select[name="destino"]')) return;

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

        if(!document.querySelector('.rs-destinos-link')){
          var h1 = document.querySelector('h1');
          var link = document.createElement('a');
          link.href = '/configuracion-destinos';
          link.className = 'rs-destinos-link';
          link.textContent = 'Configurar destinos de comanda';

          if(h1 && h1.parentNode){
            h1.parentNode.insertBefore(link, h1.nextSibling);
          }
        }
      })
      .catch(function(){});
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
