const express=require("express");

function modificadoresRoutes(db){

const router=express.Router();

router.get("/admin/modificadores",(req,res)=>{

db.all(

`
SELECT
m.id,
m.producto_id,
m.nombre,
m.precio,
m.tipo
FROM modificadores m
ORDER BY m.tipo,m.nombre
`,

[],

(err,rows)=>{

if(err) return res.status(500).json(err);

res.json(rows);

});

});

router.get("/producto/:id/modificadores",(req,res)=>{

db.all(

`
SELECT
id,
nombre,
precio,
tipo
FROM modificadores
WHERE producto_id=?
ORDER BY tipo,nombre
`,

[req.params.id],

(err,rows)=>{

if(err) return res.status(500).json(err);

res.json(rows);

});

});

return router;

}

module.exports=modificadoresRoutes;
