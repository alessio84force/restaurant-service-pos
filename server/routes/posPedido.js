const express = require("express");

function requiereLoginJson(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ error: "No autorizado" });
  }

  next();
}

function obtenerTablaLineas(db, callback) {
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('pedido_lineas','lineas_pedido') ORDER BY CASE WHEN name='pedido_lineas' THEN 0 ELSE 1 END LIMIT 1",
    [],
    (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(new Error("No existe tabla de líneas de pedido"));
      callback(null, row.name);
    }
  );
}

function columnasTabla(db, tabla, callback) {
  db.all("PRAGMA table_info(" + tabla + ")", [], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows.map((r) => r.name));
  });
}

function obtenerMesa(db, numeroMesa, callback) {
  db.get(
    "SELECT id, numero, estado FROM mesas WHERE numero=?",
    [numeroMesa],
    callback
  );
}

function obtenerPedidoAbierto(db, mesaId, callback) {
  db.get(
    "SELECT * FROM pedidos WHERE mesa_id=? AND estado!='cerrado' ORDER BY id DESC LIMIT 1",
    [mesaId],
    callback
  );
}

function actualizarTotalPedido(db, pedidoId, callback) {
  obtenerTablaLineas(db, (err, tablaLineas) => {
    if (err) return callback(err);

    columnasTabla(db, tablaLineas, (err2, cols) => {
      if (err2) return callback(err2);

      const precioExpr = cols.includes("precio_unitario")
        ? "COALESCE(precio_unitario,0)"
        : cols.includes("precio")
          ? "COALESCE(precio,0)"
          : "0";

      const sql = "SELECT COALESCE(SUM(COALESCE(cantidad,1) * " + precioExpr + "),0) AS total FROM " + tablaLineas + " WHERE pedido_id=?";

      db.get(sql, [pedidoId], (err3, row) => {
        if (err3) return callback(err3);

        const total = Number(row && row.total ? row.total : 0);

        db.run(
          "UPDATE pedidos SET total=? WHERE id=?",
          [total, pedidoId],
          (err4) => callback(err4, total)
        );
      });
    });
  });
}

function crearPedidoSiNoExiste(db, numeroMesa, callback) {
  obtenerMesa(db, numeroMesa, (err, mesa) => {
    if (err) return callback(err);
    if (!mesa) return callback(new Error("Mesa no encontrada"));

    obtenerPedidoAbierto(db, mesa.id, (err2, pedido) => {
      if (err2) return callback(err2);

      if (pedido) {
        if (mesa.estado !== "cuenta" && mesa.estado !== "ocupada") {
          return db.run(
            "UPDATE mesas SET estado='ocupada' WHERE id=?",
            [mesa.id],
            (errEstado) => {
              if (errEstado) return callback(errEstado);
              return callback(null, Object.assign({}, mesa, { estado: "ocupada" }), pedido);
            }
          );
        }

        return callback(null, mesa, pedido);
      }

      db.run(
        "UPDATE mesas SET estado='ocupada' WHERE id=?",
        [mesa.id],
        (err3) => {
          if (err3) return callback(err3);

          db.run(
            "INSERT INTO pedidos (mesa_id, estado, total) VALUES (?, 'abierto', 0)",
            [mesa.id],
            function(err4) {
              if (err4) return callback(err4);

              callback(null, Object.assign({}, mesa, { estado: "ocupada" }), {
                id: this.lastID,
                mesa_id: mesa.id,
                estado: "abierto",
                total: 0
              });
            }
          );
        }
      );
    });
  });
}

function cargarLineasPedido(db, pedidoId, callback) {
  obtenerTablaLineas(db, (err, tablaLineas) => {
    if (err) return callback(err);

    columnasTabla(db, tablaLineas, (err2, cols) => {
      if (err2) return callback(err2);

      const precioExpr = cols.includes("precio_unitario")
        ? "COALESCE(pl.precio_unitario, productos.precio, 0)"
        : cols.includes("precio")
          ? "COALESCE(pl.precio, productos.precio, 0)"
          : "COALESCE(productos.precio, 0)";

      const notaExpr = cols.includes("nota")
        ? "COALESCE(pl.nota,'')"
        : cols.includes("notas")
          ? "COALESCE(pl.notas,'')"
          : "''";

      const enviadaBarExpr = cols.includes("cantidad_enviada_bar")
        ? "COALESCE(pl.cantidad_enviada_bar,0)"
        : "0";

      const enviadaCocinaExpr = cols.includes("cantidad_enviada_cocina")
        ? "COALESCE(pl.cantidad_enviada_cocina,0)"
        : "0";

      const sql = `
        SELECT
          pl.id AS linea_id,
          pl.id AS id,
          productos.id AS producto_id,
          productos.nombre AS nombre,
          productos.nombre AS producto,
          COALESCE(pl.cantidad,1) AS cantidad,
          ${precioExpr} AS precio,
          ${precioExpr} AS precio_unitario,
          COALESCE(pl.cantidad,1) * ${precioExpr} AS total,
          ${notaExpr} AS nota,
          ${enviadaBarExpr} AS cantidad_enviada_bar,
          ${enviadaCocinaExpr} AS cantidad_enviada_cocina,
          categorias.nombre AS categoria,
          categorias.destino AS destino
        FROM ${tablaLineas} pl
        JOIN productos ON productos.id = pl.producto_id
        LEFT JOIN categorias ON categorias.id = productos.categoria_id
        WHERE pl.pedido_id=?
        ORDER BY pl.id
      `;

      db.all(sql, [pedidoId], callback);
    });
  });
}

module.exports = function posPedidoRoutes(db) {
  const router = express.Router();

  router.get("/pedido/:mesa", requiereLoginJson, (req, res) => {
    const numeroMesa = req.params.mesa;

    obtenerMesa(db, numeroMesa, (err, mesa) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!mesa) {
        return res.json({
          mesa: numeroMesa,
          pedido: null,
          productos: [],
          total: 0
        });
      }

      obtenerPedidoAbierto(db, mesa.id, (err2, pedido) => {
        if (err2) return res.status(500).json({ error: err2.message });

        if (!pedido) {
          return res.json({
            mesa: mesa.numero,
            pedido: null,
            productos: [],
            total: 0,
            estado_mesa: mesa.estado
          });
        }

        cargarLineasPedido(db, pedido.id, (err3, lineas) => {
          if (err3) return res.status(500).json({ error: err3.message });

          const total = (lineas || []).reduce((s, p) => s + Number(p.total || 0), 0);

          res.json({
            mesa: mesa.numero,
            pedido: pedido.id,
            pedido_id: pedido.id,
            productos: lineas || [],
            total: total,
            estado_mesa: mesa.estado
          });
        });
      });
    });
  });

  router.post("/abrir-mesa/:mesa", requiereLoginJson, (req, res) => {
    crearPedidoSiNoExiste(db, req.params.mesa, (err, mesa, pedido) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        ok: true,
        mesa: mesa.numero,
        pedido: pedido.id
      });
    });
  });


  router.post("/anadir-producto", requiereLoginJson, (req, res) => {
    const numeroMesa = req.body.mesa;
    const productoId = Number(req.body.producto);
    const cantidad = Math.max(1, Number(req.body.cantidad || 1));
    const nota = String(req.body.nota || req.body.punto_coccion || "").trim();

    if (!numeroMesa || !productoId) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    crearPedidoSiNoExiste(db, numeroMesa, (err, mesa, pedido) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get("SELECT id, precio FROM productos WHERE id=?", [productoId], (err2, producto) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

        obtenerTablaLineas(db, (err3, tablaLineas) => {
          if (err3) return res.status(500).json({ error: err3.message });

          columnasTabla(db, tablaLineas, (err4, colsIniciales) => {
            if (err4) return res.status(500).json({ error: err4.message });

            function continuarConColumnas(cols) {
              const precioCol = cols.includes("precio_unitario")
                ? "precio_unitario"
                : cols.includes("precio")
                  ? "precio"
                  : null;

              const notaCol = cols.includes("nota")
                ? "nota"
                : cols.includes("notas")
                  ? "notas"
                  : null;

              function terminar() {
                actualizarTotalPedido(db, pedido.id, (errTotal, total) => {
                  if (errTotal) return res.status(500).json({ error: errTotal.message });

                  res.json({
                    ok: true,
                    mesa: mesa.numero,
                    pedido: pedido.id,
                    total: total
                  });
                });
              }

              function insertarLineaNueva() {
                const colsInsert = ["pedido_id", "producto_id", "cantidad"];
                const params = [pedido.id, productoId, cantidad];

                if (precioCol) {
                  colsInsert.push(precioCol);
                  params.push(Number(producto.precio || 0));
                }

                if (notaCol && nota) {
                  colsInsert.push(notaCol);
                  params.push(nota);
                }

                const sqlInsert = "INSERT INTO " + tablaLineas + " (" + colsInsert.join(",") + ") VALUES (" + colsInsert.map(() => "?").join(",") + ")";

                db.run(sqlInsert, params, (errInsert) => {
                  if (errInsert) return res.status(500).json({ error: errInsert.message });
                  terminar();
                });
              }

              if (nota) {
                return insertarLineaNueva();
              }

              const filtroNotaVacia = notaCol ? " AND COALESCE(" + notaCol + ", '') = ''" : "";

              db.get(
                "SELECT id, cantidad FROM " + tablaLineas + " WHERE pedido_id=? AND producto_id=?" + filtroNotaVacia + " ORDER BY id DESC LIMIT 1",
                [pedido.id, productoId],
                (err5, linea) => {
                  if (err5) return res.status(500).json({ error: err5.message });

                  if (linea) {
                    return db.run(
                      "UPDATE " + tablaLineas + " SET cantidad=? WHERE id=?",
                      [Number(linea.cantidad || 0) + cantidad, linea.id],
                      (err6) => {
                        if (err6) return res.status(500).json({ error: err6.message });
                        terminar();
                      }
                    );
                  }

                  insertarLineaNueva();
                }
              );
            }

            const tieneNota = colsIniciales.includes("nota") || colsIniciales.includes("notas");

            if (tieneNota) {
              return continuarConColumnas(colsIniciales);
            }

            db.run("ALTER TABLE " + tablaLineas + " ADD COLUMN nota TEXT", [], (errAlter) => {
              if (errAlter && !String(errAlter.message || "").includes("duplicate column")) {
                return res.status(500).json({ error: errAlter.message });
              }

              columnasTabla(db, tablaLineas, (errColumnasFinales, colsFinales) => {
                if (errColumnasFinales) return res.status(500).json({ error: errColumnasFinales.message });
                continuarConColumnas(colsFinales);
              });
            });
          });
        });
      });
    });
  });




  router.post("/linea/:linea/cantidad", requiereLoginJson, (req, res) => {
    const lineaId = Number(req.params.linea);
    const cambio = Number(req.body.cambio || req.body.delta || 0);

    obtenerTablaLineas(db, (err, tablaLineas) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get("SELECT id, pedido_id, cantidad FROM " + tablaLineas + " WHERE id=?", [lineaId], (err2, linea) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if (!linea) return res.status(404).json({ error: "Línea no encontrada" });

        const nuevaCantidad = Number(linea.cantidad || 0) + cambio;

        function terminar() {
          actualizarTotalPedido(db, linea.pedido_id, (errTotal, total) => {
            if (errTotal) return res.status(500).json({ error: errTotal.message });
            res.json({ ok: true, total: total });
          });
        }

        if (nuevaCantidad <= 0) {
          return db.run("DELETE FROM " + tablaLineas + " WHERE id=?", [lineaId], (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });
            terminar();
          });
        }

        db.run("UPDATE " + tablaLineas + " SET cantidad=? WHERE id=?", [nuevaCantidad, lineaId], (err4) => {
          if (err4) return res.status(500).json({ error: err4.message });
          terminar();
        });
      });
    });
  });

  router.post("/pedido-linea/:linea/cantidad", requiereLoginJson, (req, res) => {
    const lineaId = Number(req.params.linea);
    const delta = Number(req.body.delta || req.body.cambio || 0);
    const cantidadDirecta = req.body.cantidad !== undefined ? Number(req.body.cantidad) : null;

    obtenerTablaLineas(db, (err, tablaLineas) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get("SELECT id, pedido_id, cantidad FROM " + tablaLineas + " WHERE id=?", [lineaId], (err2, linea) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if (!linea) return res.status(404).json({ error: "Línea no encontrada" });

        const nuevaCantidad = cantidadDirecta !== null
          ? cantidadDirecta
          : Number(linea.cantidad || 0) + delta;

        function terminar() {
          actualizarTotalPedido(db, linea.pedido_id, (errTotal, total) => {
            if (errTotal) return res.status(500).json({ error: errTotal.message });
            res.json({ ok: true, total: total });
          });
        }

        if (nuevaCantidad <= 0) {
          return db.run("DELETE FROM " + tablaLineas + " WHERE id=?", [lineaId], (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });
            terminar();
          });
        }

        db.run("UPDATE " + tablaLineas + " SET cantidad=? WHERE id=?", [nuevaCantidad, lineaId], (err4) => {
          if (err4) return res.status(500).json({ error: err4.message });
          terminar();
        });
      });
    });
  });

  router.post("/linea-pedido/:linea/cantidad", requiereLoginJson, (req, res) => {
    req.url = "/pedido-linea/" + req.params.linea + "/cantidad";
    router.handle(req, res);
  });




  router.post("/mesa/:mesa/cuenta", requiereLoginJson, (req, res) => {
    const mesa = req.params.mesa;

    const sql = `
      SELECT
        mesas.id AS mesa_id,
        pedidos.id AS pedido_id
      FROM mesas
      JOIN pedidos ON pedidos.mesa_id = mesas.id
      WHERE mesas.numero = ?
        AND pedidos.estado != 'cerrado'
      ORDER BY pedidos.id DESC
      LIMIT 1
    `;

    db.get(sql, [mesa], (err, row) => {
      if (err) {
        console.error("Error buscando pedido para cuenta:", err.message);
        return res.status(500).json({ error: "Error buscando pedido" });
      }

      if (!row) {
        return res.status(404).json({ error: "No hay pedido abierto" });
      }

      db.run("UPDATE pedidos SET estado='cuenta' WHERE id=?", [row.pedido_id], (errPedido) => {
        if (errPedido) {
          console.error("Error poniendo pedido en cuenta:", errPedido.message);
          return res.status(500).json({ error: "Error poniendo pedido en cuenta" });
        }

        db.run("UPDATE mesas SET estado='cuenta' WHERE id=?", [row.mesa_id], (errMesa) => {
          if (errMesa) {
            console.error("Error poniendo mesa en cuenta:", errMesa.message);
            return res.status(500).json({ error: "Error poniendo mesa en cuenta" });
          }

          res.json({
            ok: true,
            mesa: mesa,
            pedido: row.pedido_id,
            estado: "cuenta"
          });
        });
      });
    });
  });

  return router;
};
