const express=require("express");

function productoRoutes(db){

const router=express.Router();

router.get("/producto/:id",(req,res)=>{

db.get(

"SELECT * FROM productos WHERE id=?",

[req.params.id],

(err,producto)=>{

if(err) return res.status(500).json(err);

db.all(

"SELECT * FROM modificadores WHERE producto_id=? ORDER BY tipo,nombre",

[req.params.id],

(err,mods)=>{

if(err) return res.status(500).json(err);

producto.modificadores=mods;

res.json(producto);

});

});

});

return router;

}

module.exports=productoRoutes;
