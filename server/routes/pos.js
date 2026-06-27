const express=require("express");

function posRoutes(db){

const router=express.Router();

router.get("/pos",(req,res)=>{

const risposta={};

db.all(

"SELECT * FROM mesas ORDER BY numero",

[],

(err,mesas)=>{

if(err) return res.status(500).json(err);

risposta.mesas=mesas;

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

JOIN productos p
ON p.categoria_id=c.id

WHERE p.disponible=1

ORDER BY c.nombre,p.nombre

`,

[],

(err,menu)=>{

if(err) return res.status(500).json(err);

risposta.menu=menu;

res.json(risposta);

});

});

});

return router;

}

module.exports=posRoutes;
