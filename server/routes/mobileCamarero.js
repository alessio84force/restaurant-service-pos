const express = require("express");

function mobileCamareroRoutes(db){
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

  function recalcularTotalPedido(pedidoId, callback){
    db.get(
      "SELECT COALESCE(SUM(cantidad * precio),0) AS total FROM pedido_lineas WHERE pedido_id=?",
      [pedidoId],
      (err,totalRow)=>{
        if(err) return callback(err);

        const total = Number((totalRow && totalRow.total) || 0);

        db.run(
          "UPDATE pedidos SET total=? WHERE id=?",
          [total,pedidoId],
          (errUpdate)=>{
            if(errUpdate) return callback(errUpdate);

            callback(null,total);
          }
        );
      }
    );
  }


  router.post("/mobile/mesa/:mesa/ocupada", requiereLoginJson, (req,res)=>{
    const mesa = String(req.params.mesa || "").trim();

    if(!mesa){
      return res.status(400).json({
        ok:false,
        error:"Mesa no válida"
      });
    }

    db.run(
      "UPDATE mesas SET estado='ocupada' WHERE numero=? OR CAST(id AS TEXT)=?",
      [mesa, mesa],
      function(err){
        if(err){
          console.error("Error marcando mesa ocupada móvil:", err.message);
          return res.status(500).json({
            ok:false,
            error:"Error marcando mesa ocupada"
          });
        }

        return res.json({
          ok:true,
          mesa:mesa,
          cambios:this.changes || 0
        });
      }
    );
  });

  router.post("/mobile/linea/:linea/cantidad", requiereLoginJson, (req,res)=>{
    const lineaId = Number(req.params.linea);
    const cantidad = Math.max(0, Number(req.body.cantidad || 0));

    if(!lineaId){
      return res.status(400).json({
        ok:false,
        error:"Línea no válida"
      });
    }

    db.get(
      "SELECT id,pedido_id,cantidad FROM pedido_lineas WHERE id=?",
      [lineaId],
      (err,linea)=>{
        if(err){
          console.error("Error buscando línea móvil:", err.message);
          return res.status(500).json({
            ok:false,
            error:"Error buscando línea"
          });
        }

        if(!linea){
          return res.status(404).json({
            ok:false,
            error:"Línea no encontrada"
          });
        }

        const pedidoId = linea.pedido_id;

        function terminar(){
          recalcularTotalPedido(pedidoId, (errTotal,total)=>{
            if(errTotal){
              console.error("Error recalculando total móvil:", errTotal.message);
              return res.status(500).json({
                ok:false,
                error:"Error recalculando total"
              });
            }

            return res.json({
              ok:true,
              linea_id:lineaId,
              pedido_id:pedidoId,
              cantidad:cantidad,
              total:total
            });
          });
        }

        if(cantidad <= 0){
          db.run(
            "DELETE FROM pedido_lineas WHERE id=?",
            [lineaId],
            (errDelete)=>{
              if(errDelete){
                console.error("Error eliminando línea móvil:", errDelete.message);
                return res.status(500).json({
                  ok:false,
                  error:"Error eliminando línea"
                });
              }

              terminar();
            }
          );
        }else{
          db.run(
            "UPDATE pedido_lineas SET cantidad=? WHERE id=?",
            [cantidad,lineaId],
            (errUpdate)=>{
              if(errUpdate){
                console.error("Error actualizando cantidad móvil:", errUpdate.message);
                return res.status(500).json({
                  ok:false,
                  error:"Error actualizando cantidad"
                });
              }

              terminar();
            }
          );
        }
      }
    );
  });

  return router;
}

module.exports = mobileCamareroRoutes;
