const express=require("express");

function variantesRoutes(db){

const router=express.Router();

router.get("/admin/variantes",(req,res)=>{

db.all(

`
SELECT
v.id,
v.nombre,
p.nombre producto

FROM variantes v

LEFT JOIN productos p
ON p.id=v.producto_id

ORDER BY p.nombre,v.nombre
`,

[],

(err,rows)=>{

if(err) return res.status(500).json(err);

res.json(rows);

});

});

return router;

}

module.exports=variantesRoutes;
