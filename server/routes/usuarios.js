const express = require("express");

function usuariosRoutes(db){

const router = express.Router();

router.get("/admin/usuarios",(req,res)=>{

db.all(

"SELECT id,nombre,email,rol,activo,creado_en FROM usuarios ORDER BY nombre",

[],

(err,rows)=>{

if(err){
console.log(err);
return res.status(500).json(err);
}

res.json(rows);

});

});

return router;

}

module.exports = usuariosRoutes;
