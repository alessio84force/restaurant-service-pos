const express = require("express");

function estadoMesasRealRoutes(db){
  const router = express.Router();

  function requiereLoginJson(req,res,next){
    if(req.session && req.session.usuario){
      return next();
    }

    return res.status(401).json({
      ok:false,
      error:"No autorizado"
    });
  }

  router.get("/api/estado-mesas-real", requiereLoginJson, (req,res)=>{
    db.all(`
      SELECT
        p.id AS pedido_id,
        p.estado AS pedido_estado,
        p.mesa_id AS mesa_id,
        m.numero AS mesa_numero
      FROM pedidos p
      LEFT JOIN mesas m ON m.id = p.mesa_id
      WHERE p.estado IN ('abierto','cuenta')
      ORDER BY p.id DESC
    `, [], (err, rows)=>{
      if(err){
        console.error("Error estado real mesas:", err.message);
        return res.status(500).json({
          ok:false,
          error:"Error consultando estado real de mesas"
        });
      }

      const yaVistas = {};
      const estados = [];

      (rows || []).forEach((row)=>{
        const mesa = String(row.mesa_numero || row.mesa_id || "").trim();

        if(!mesa || yaVistas[mesa]){
          return;
        }

        yaVistas[mesa] = true;

        estados.push({
          mesa: mesa,
          pedido_id: row.pedido_id,
          estado: row.pedido_estado === "cuenta" ? "cuenta" : "ocupada"
        });
      });

      res.json({
        ok:true,
        estados:estados
      });
    });
  });

  return router;
}

module.exports = estadoMesasRealRoutes;
