function passwordEyeMiddleware(){
  const injection = `
<style>
.rs-password-eye-wrapper{
  position:relative;
  display:block;
  width:100%;
}
.rs-password-eye-wrapper input[type="password"],
.rs-password-eye-wrapper input[type="text"]{
  padding-right:46px !important;
}
.rs-password-eye-btn{
  position:absolute;
  right:12px;
  top:50%;
  transform:translateY(-50%);
  border:0;
  background:transparent;
  cursor:pointer;
  font-size:18px;
  line-height:1;
  padding:6px;
  opacity:.75;
}
.rs-password-eye-btn:hover{
  opacity:1;
}
</style>
<script>
(function(){
  function prepararPasswordEye(){
    var inputs = document.querySelectorAll('input[type="password"]:not([data-password-eye-ready])');

    inputs.forEach(function(input){
      input.setAttribute('data-password-eye-ready','1');

      var parent = input.parentNode;
      if(!parent) return;

      var wrapper = document.createElement('span');
      wrapper.className = 'rs-password-eye-wrapper';

      parent.insertBefore(wrapper, input);
      wrapper.appendChild(input);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rs-password-eye-btn';
      btn.setAttribute('aria-label','Mostrar contraseña');
      btn.setAttribute('title','Mostrar contraseña');
      btn.textContent = '👁️';

      btn.addEventListener('click', function(){
        var visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        btn.textContent = visible ? '👁️' : '🙈';
        btn.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
        btn.setAttribute('title', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
        input.focus();
      });

      wrapper.appendChild(btn);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', prepararPasswordEye);
  }else{
    prepararPasswordEye();
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
          body.includes('type="password"') &&
          !body.includes("rs-password-eye-wrapper") &&
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

module.exports = passwordEyeMiddleware;
