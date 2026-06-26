const express = require("express");

function configurazioneRoutes(db){

const router=express.Router();

router.get("/configurazione",(req,res)=>{

db.get(
"SELECT * FROM configurazione WHERE id=1",
[],
(err,row)=>{

if(err) return res.status(500).json(err);

res.json(row);

});

});

router.post("/configurazione",(req,res)=>{

const c=req.body;

db.run(

`UPDATE configurazione
SET
nome_ristorante=?,
partita_iva=?,
indirizzo=?,
telefono=?,
email=?,
logo=?,
iva=?,
stampante_bar=?,
stampante_cucina=?
WHERE id=1`,

[
c.nome_ristorante,
c.partita_iva,
c.indirizzo,
c.telefono,
c.email,
c.logo,
c.iva,
c.stampante_bar,
c.stampante_cucina
],

(err)=>{

if(err) return res.status(500).json(err);

res.json({
ok:true
});

});

});

return router;

}

module.exports=configurazioneRoutes;
