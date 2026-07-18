const express = require("express");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function requiereLoginJson(req, res, next) {
  if (req.session && req.session.usuario) return next();

  return res.status(401).json({
    ok: false,
    error: "No autenticado"
  });
}

function all(db, sql, params) {
  return new Promise((resolve) => {
    db.all(sql, params || [], function(err, rows) {
      if (err) {
        console.error("[mesasOperativasSaas] SQL all:", err.message);
        return resolve([]);
      }

      resolve(rows || []);
    });
  });
}

function get(db, sql, params) {
  return new Promise((resolve) => {
    db.get(sql, params || [], function(err, row) {
      if (err) {
        console.error("[mesasOperativasSaas] SQL get:", err.message);
        return resolve(null);
      }

      resolve(row || null);
    });
  });
}

function run(db, sql, params) {
  return new Promise((resolve) => {
    db.run(sql, params || [], function(err) {
      if (err) {
        console.error("[mesasOperativasSaas] SQL run:", err.message);
        return resolve({ ok: false, error: err.message });
      }

      resolve({ ok: true, id: this.lastID, changes: this.changes });
    });
  });
}

async function cargarMesas(db, restauranteId) {
  return all(
    db,
    `SELECT
      mesas.id,
      mesas.numero,
      mesas.estado,
      mesas.zona_id,
      zonas.nombre AS zona,
      reservas.cliente AS reserva_cliente,
      reservas.personas AS reserva_personas,
      reservas.hora AS reserva_hora
    FROM mesas
    LEFT JOIN zonas
      ON zonas.id = mesas.zona_id
      AND COALESCE(zonas.restaurante_id,1)=?
    LEFT JOIN reservas
      ON reservas.mesa_id = mesas.id
      AND reservas.estado = 'activa'
      AND COALESCE(reservas.restaurante_id,1)=?
    WHERE COALESCE(mesas.restaurante_id,1)=?
    AND COALESCE(mesas.activo,1)=1
    ORDER BY COALESCE(zonas.id, 999999), mesas.numero`,
    [restauranteId, restauranteId, restauranteId]
  );
}

module.exports = function mesasOperativasSaasRoutes(db) {
  const router = express.Router();

  router.get("/mesas", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const mesas = await cargarMesas(db, restauranteId);
    res.json(mesas);
  });

  router.get("/api/estado-mesas-real", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const mesas = await cargarMesas(db, restauranteId);

    res.json({
      ok: true,
      mesas: mesas.map((m) => ({
        id: m.id,
        numero: m.numero,
        estado: m.estado,
        zona_id: m.zona_id,
        zona: m.zona || ""
      }))
    });
  });

  router.post("/abrir-mesa/:mesa", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const mesaParam = String(req.params.mesa || "").trim();

    const mesa = await get(
      db,
      `SELECT id, numero, estado
       FROM mesas
       WHERE COALESCE(restaurante_id,1)=?
       AND COALESCE(activo,1)=1
       AND (CAST(numero AS TEXT)=? OR CAST(id AS TEXT)=?)
       LIMIT 1`,
      [restauranteId, mesaParam, mesaParam]
    );

    if (!mesa) {
      return res.status(404).json({
        ok: false,
        error: "Mesa no encontrada para este restaurante"
      });
    }

    await run(
      db,
      "UPDATE mesas SET estado='ocupada' WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [mesa.id, restauranteId]
    );

    const pedido = await get(
      db,
      `SELECT id
       FROM pedidos
       WHERE mesa_id=?
       AND estado='abierto'
       AND COALESCE(restaurante_id,1)=?
       ORDER BY id DESC
       LIMIT 1`,
      [mesa.id, restauranteId]
    );

    if (!pedido) {
      await run(
        db,
        "INSERT INTO pedidos (mesa_id, estado, total, restaurante_id) VALUES (?, 'abierto', 0, ?)",
        [mesa.id, restauranteId]
      );
    }

    res.json({
      ok: true,
      mesa_id: mesa.id,
      mesa: mesa.numero
    });
  });

  return router;
};
