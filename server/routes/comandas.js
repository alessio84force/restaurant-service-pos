const { imprimirCentroImpresion } = require("../printing/centroImpresionRuntime");
const express = require("express");
const fs = require("fs");
const path = require("path");

function limpiarTextoTicket(texto){
  return String(texto || "").replace(/\s+/g, " ").trim();
}

function normalizarDestino(destino){
  return String(destino || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function lineaSeparadora(){
  return "================================\n";
}

function lineaCorta(){
  return "--------------------------------\n";
}

function asegurarTablaEnvios(db, callback){
  db.run(`
    CREATE TABLE IF NOT EXISTS comanda_envios_linea (
      linea_id INTEGER NOT NULL,
      destino TEXT NOT NULL,
      cantidad_enviada INTEGER DEFAULT 0,
      actualizado_en TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(linea_id, destino)
    )
  `, [], callback);
}

function obtenerNombreDestino(db, destino, callback){
  db.get("SELECT nombre FROM destinos_comanda WHERE id=? LIMIT 1", [destino], (err, row)=>{
    if(err || !row){
      return callback(destino.charAt(0).toUpperCase() + destino.slice(1));
    }

    callback(row.nombre || destino);
  });
}

function formatearComandaDestino(mesa, destinoNombre, lineas){
  const ahora = new Date().toLocaleString("es-ES");
  const pedido = lineas.length > 0 ? lineas[0].pedido : "";

  let texto = "";

  texto += lineaSeparadora();
  texto += "       RESTAURANT SERVICE\n";
  texto += lineaSeparadora();
  texto += "COMANDA " + limpiarTextoTicket(destinoNombre).toUpperCase() + "\n";
  texto += "MESA: " + mesa + "\n";
  texto += "PEDIDO: " + pedido + "\n";
  texto += "HORA: " + ahora + "\n";
  texto += lineaCorta();

  lineas.forEach((l)=>{
    texto += l.cantidad + " x " + limpiarTextoTicket(l.nombre).toUpperCase() + "\n";

    if(l.nota){
      texto += "  >>> NOTA " + limpiarTextoTicket(destinoNombre).toUpperCase() + " <<<\n";
      texto += "  " + limpiarTextoTicket(l.nota).toUpperCase() + "\n";
    }
  });

  texto += lineaCorta();
  texto += "TOTAL LINEAS: " + lineas.length + "\n";
  texto += lineaSeparadora();
  texto += "\n\n";

  return texto;
}

function buscarLineasPendientes(db, mesa, destino, callback){
  const sql = `
    SELECT
      pl.id,
      pe.id AS pedido,
      pl.cantidad AS cantidad_total,
      COALESCE(cel.cantidad_enviada, 0) AS cantidad_enviada,
      pl.cantidad - COALESCE(cel.cantidad_enviada, 0) AS cantidad,
      p.nombre,
      pl.nota,
      c.destino
    FROM pedido_lineas pl
    JOIN pedidos pe ON pe.id = pl.pedido_id
    JOIN mesas m ON m.id = pe.mesa_id
    JOIN productos p ON p.id = pl.producto_id
    JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN comanda_envios_linea cel
      ON cel.linea_id = pl.id
     AND LOWER(cel.destino) = LOWER(?)
    WHERE m.numero = ?
      AND pe.estado != 'cerrado'
      AND LOWER(c.destino) = LOWER(?)
      AND pl.cantidad - COALESCE(cel.cantidad_enviada, 0) > 0
    ORDER BY pl.id
  `;

  db.all(sql, [destino, mesa, destino], callback);
}

function actualizarEnvios(db, destino, lineas, callback){
  let i = 0;

  function siguiente(){
    if(i >= lineas.length){
      return callback(null);
    }

    const linea = lineas[i];

    db.run(
      "INSERT OR IGNORE INTO comanda_envios_linea(linea_id,destino,cantidad_enviada,actualizado_en) VALUES(?,?,0,CURRENT_TIMESTAMP)",
      [linea.id, destino],
      (errInsert)=>{
        if(errInsert) return callback(errInsert);

        db.run(
          "UPDATE comanda_envios_linea SET cantidad_enviada=?, actualizado_en=CURRENT_TIMESTAMP WHERE linea_id=? AND LOWER(destino)=LOWER(?)",
          [linea.cantidad_total, linea.id, destino],
          (errUpdate)=>{
            if(errUpdate) return callback(errUpdate);
            i++;
            siguiente();
          }
        );
      }
    );
  }

  siguiente();
}

function comandasRoutes(db){
  const router = express.Router();

  router.post("/comandas/enviar/:destino/:mesa", (req,res)=>{
    const destino = normalizarDestino(req.params.destino);
    const mesa = req.params.mesa;

    if(!destino){
      return res.status(400).json({ ok:false, error:"destino_no_valido" });
    }

    asegurarTablaEnvios(db, (errTabla)=>{
      if(errTabla){
        return res.status(500).json({ ok:false, error:errTabla.message });
      }

      obtenerNombreDestino(db, destino, (destinoNombre)=>{
        buscarLineasPendientes(db, mesa, destino, (errLineas, lineas)=>{
          if(errLineas){
            return res.status(500).json({ ok:false, error:errLineas.message });
          }

          if(!lineas || lineas.length === 0){
            return res.json({
              ok:true,
              mensaje:"Nada para enviar",
              destino,
              destino_nombre:destinoNombre,
              mesa,
              lineas:[]
            });
          }

          const texto = formatearComandaDestino(mesa, destinoNombre, lineas);
          const carpetaPrint = path.join(__dirname, "..", "..", "prints");

          if(!fs.existsSync(carpetaPrint)){
            fs.mkdirSync(carpetaPrint, { recursive:true });
          }

          const archivo = "comanda_" + destino + ".txt";
          const rutaPrint = path.join(carpetaPrint, archivo);

          fs.writeFileSync(rutaPrint, texto, "utf8");

          imprimirCentroImpresion(db, destino, texto, function(resultadoImpresion){
            if(resultadoImpresion && resultadoImpresion.modo === "escpos_red" && !resultadoImpresion.ok){
              console.log("[COMANDA " + destino.toUpperCase() + "] No se pudo imprimir:", resultadoImpresion.motivo || resultadoImpresion.error || "sin detalle");
            }
          });

          actualizarEnvios(db, destino, lineas, (errUpdate)=>{
            if(errUpdate){
              return res.status(500).json({ ok:false, error:errUpdate.message });
            }

            res.json({
              ok:true,
              mensaje:"Comanda " + destinoNombre + " generada",
              archivo:"prints/" + archivo,
              destino,
              destino_nombre:destinoNombre,
              mesa,
              lineas
            });
          });
        });
      });
    });
  });

  return router;
}

module.exports = comandasRoutes;
