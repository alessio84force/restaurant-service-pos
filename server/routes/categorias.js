const express=require("express");

function categoriasRoutes(db){

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

router.post("/admin/categorias",(req,res)=>{

const c=req.body;

db.run(

"INSERT INTO categorias(nombre,destino) VALUES(?,?)",

[
c.nombre,
c.destino
],

function(err){

if(err) return res.status(500).json(err);

res.json({

ok:true,

id:this.lastID

});

});

});

router.put("/admin/categorias/:id",(req,res)=>{

const c=req.body;

db.run(

"UPDATE categorias SET nombre=?,destino=? WHERE id=?",

[
c.nombre,
c.destino,
req.params.id
],

function(err){

if(err) return res.status(500).json(err);

res.json({ok:true});

});

});

router.delete("/admin/categorias/:id",(req,res)=>{

db.run(

"DELETE FROM categorias WHERE id=?",

[req.params.id],

function(err){

if(err) return res.status(500).json(err);

res.json({ok:true});

});

});

return router;

}

module.exports=categoriasRoutes;
