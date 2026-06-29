const express = require("express");

function pagosMultiplesRoutes(db){

  const router = express.Router();

  router.get("/pedido/:id/pagos",(req,res)=>{

    db.all(
      "SELECT * FROM pagos WHERE pedido_id=? ORDER BY id",
      [req.params.id],
      (err,rows)=>{
        if(err) return res.status(500).json(err);
        res.json(rows);
      }
    );

  });

  router.get("/pedido/:id/pendiente",(req,res)=>{

    db.get(
      `SELECT
         p.total - COALESCE(SUM(pg.importe),0) AS pendiente
       FROM pedidos p
       LEFT JOIN pagos pg ON pg.pedido_id=p.id
       WHERE p.id=?
       GROUP BY p.id`,
      [req.params.id],
      (err,row)=>{
        if(err) return res.status(500).json(err);
        res.json(row || {pendiente:0});
      }
    );

  });

  router.post("/pedido/:id/pago",(req,res)=>{

    const pedido=req.params.id;
    const p=req.body;

    db.run(
      "INSERT INTO pagos (pedido_id,metodo,importe,tpv,referencia) VALUES (?,?,?,?,?)",
      [
        pedido,
        p.metodo,
        p.importe,
        p.tpv || null,
        p.referencia || null
      ],
      function(err){

        if(err) return res.status(500).json(err);

        db.get(`SELECT p.total-COALESCE(SUM(pg.importe),0) AS pendiente FROM pedidos p LEFT JOIN pagos pg ON pg.pedido_id=p.id WHERE p.id=? GROUP BY p.id`,[pedido],(err,row)=>{ if(err) return res.status(500).json(err); res.json({ok:true,pago_id:this.lastID,pendiente:row?row.pendiente:0}); });

      }
    );

  });

  return router;

}

module.exports = pagosMultiplesRoutes;
