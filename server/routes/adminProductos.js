const express = require("express");

function adminProductosRoutes(db){

const router=express.Router();

router.get("/admin/categorias",(req,res)=>{

db.all(
"SELECT id,nombre,destino FROM categorias ORDER BY nombre",
[],
(err,rows)=>{
if(err) return res.status(500).json(err);
res.json(rows);
});

});

router.get("/admin/productos",(req,res)=>{

db.all(

`
SELECT
p.id,
p.nombre,
p.precio,
c.nombre categoria,
c.destino
FROM productos p
JOIN categorias c
ON c.id=p.categoria_id
ORDER BY c.nombre,p.nombre
`,

[],

(err,rows)=>{

if(err) return res.status(500).json(err);

res.json(rows);

});

});

router.post("/admin/productos",(req,res)=>{

const p=req.body;

db.run(

`
INSERT INTO productos
(nombre,precio,categoria_id)
VALUES(?,?,?)
`,

[
p.nombre,
p.precio,
p.categoria_id
],

function(err){

if(err) return res.status(500).json(err);

res.json({
ok:true,
id:this.lastID
});

}

);

});

return router;

}

module.exports=adminProductosRoutes;
