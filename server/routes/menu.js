const express=require("express");

function menuRoutes(db){

const router=express.Router();

router.get("/menu",(req,res)=>{

db.all(

`
SELECT

c.id categoria_id,
c.nombre categoria,
c.destino,

p.id producto_id,
p.nombre producto,
p.precio

FROM categorias c

LEFT JOIN productos p
ON p.categoria_id=c.id

WHERE p.disponible=1

ORDER BY c.nombre,p.nombre

`,

[],

(err,rows)=>{

if(err) return res.status(500).json(err);

res.json(rows);

});

});

return router;

}

module.exports=menuRoutes;
