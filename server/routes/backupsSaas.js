const express = require("express");
const fs = require("fs");
const path = require("path");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function escapar(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function requiereAdminGerente(req, res, next) {
  if (!req.session || !req.session.usuario) return res.redirect("/login");

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if (rol !== "admin" && rol !== "gerente") {
    return res.status(403).send("No tienes permisos para backups.");
  }

  next();
}

function all(db, sql, params) {
  return new Promise((resolve) => {
    db.all(sql, params || [], function(err, rows) {
      if (err) {
        console.error("[backupsSaas] SQL:", err.message);
        return resolve([]);
      }
      resolve(rows || []);
    });
  });
}

function carpetaBackups(restauranteId) {
  return path.join(process.cwd(), "backups", "restaurante_" + restauranteId);
}

function fechaNombre() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "-" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function nombreSeguro(nombre, restauranteId) {
  const limpio = path.basename(String(nombre || ""));

  if (!limpio.startsWith("backup_r" + restauranteId + "_")) return null;
  if (!/^backup_r[0-9]+_[0-9]{8}-[0-9]{6}\.json$/.test(limpio)) return null;

  return limpio;
}

async function crearBackupRestaurante(db, restauranteId, usuario) {
  const backup = {
    version: "V2.8.0J",
    tipo: "restaurant_service_pos_saas_backup",
    restaurante_id: restauranteId,
    creado_en: new Date().toISOString(),
    creado_por: usuario ? { id: usuario.id, email: usuario.email, rol: usuario.rol } : null,
    datos: {}
  };

  backup.datos.restaurante = await all(
    db,
    "SELECT * FROM restaurantes WHERE id=?",
    [restauranteId]
  );

  backup.datos.configuracion = await all(
    db,
    "SELECT * FROM configurazione WHERE COALESCE(restaurante_id,1)=?",
    [restauranteId]
  );

  backup.datos.usuarios = await all(
    db,
    "SELECT id,nombre,email,rol,activo,creado_en,restaurante_id FROM usuarios WHERE COALESCE(restaurante_id,1)=?",
    [restauranteId]
  );

  const tablas = [
    "zonas",
    "mesas",
    "categorias",
    "productos",
    "destinos_comanda",
    "pedidos",
    "pedido_lineas",
    "pagos",
    "cierres_caja",
    "comanda_envios_linea"
  ];

  for (const tabla of tablas) {
    backup.datos[tabla] = await all(
      db,
      "SELECT * FROM " + tabla + " WHERE COALESCE(restaurante_id,1)=?",
      [restauranteId]
    );
  }

  const carpeta = carpetaBackups(restauranteId);
  fs.mkdirSync(carpeta, { recursive: true });

  const nombre = "backup_r" + restauranteId + "_" + fechaNombre() + ".json";
  const ruta = path.join(carpeta, nombre);

  fs.writeFileSync(ruta, JSON.stringify(backup, null, 2), "utf8");

  return nombre;
}

function listarBackups(restauranteId) {
  const carpeta = carpetaBackups(restauranteId);

  if (!fs.existsSync(carpeta)) return [];

  return fs.readdirSync(carpeta)
    .filter((n) => nombreSeguro(n, restauranteId))
    .map((n) => {
      const ruta = path.join(carpeta, n);
      const stat = fs.statSync(ruta);
      return {
        nombre: n,
        size: stat.size,
        creado: stat.mtime
      };
    })
    .sort((a, b) => b.creado - a.creado);
}

function renderBackups(backups, query) {
  const ok = query.ok || "";
  const error = query.error || "";

  const filas = backups.map((b) => `
    <tr>
      <td><strong>${escapar(b.nombre)}</strong></td>
      <td>${escapar((b.size / 1024).toFixed(1))} KB</td>
      <td>${escapar(b.creado.toLocaleString("es-ES"))}</td>
      <td>
        <a class="btn small" href="/configuracion-backups/descargar/${encodeURIComponent(b.nombre)}">Descargar</a>
        <form method="POST" action="/configuracion-backups/eliminar/${encodeURIComponent(b.nombre)}" onsubmit="return confirm('¿Eliminar este backup?');">
          <button class="danger" type="submit">Eliminar</button>
        </form>
      </td>
    </tr>
  `).join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Backups - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;background:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;}
    .wrap{max-width:1100px;margin:0 auto;padding:28px 18px 70px;}
    .hero{background:linear-gradient(135deg,#111827,#7c2d12);color:white;border-radius:26px;padding:28px;margin-bottom:18px;}
    .hero h1{margin:0 0 8px;font-size:32px;}
    .hero p{margin:0;color:#ffedd5;}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    a.btn,button{display:inline-block;border:0;border-radius:12px;padding:10px 13px;background:#ea580c;color:white;text-decoration:none;font-weight:900;cursor:pointer;font-size:14px;}
    a.sec,button.sec{background:#e5e7eb;color:#111827;}
    button.danger{background:#dc2626;}
    .small{padding:8px 10px;font-size:13px;}
    .msg{border-radius:15px;padding:12px 14px;margin-bottom:14px;font-weight:900;}
    .ok{background:#ecfdf5;color:#14532d;border:1px solid #86efac;}
    .error{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
    .card{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    table{width:100%;border-collapse:collapse;}
    th,td{padding:11px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top;}
    th{font-size:12px;text-transform:uppercase;color:#6b7280;}
    form{display:inline-block;margin:0 4px;}
    @media(max-width:850px){table,thead,tbody,tr,td,th{display:block;} th{display:none;}}
  

    /* RS CHIC K2 BACKUPS */
    body{
      background:
        radial-gradient(circle at 10% 8%, rgba(245,158,11,.20), transparent 30%),
        radial-gradient(circle at 86% 14%, rgba(20,184,166,.18), transparent 28%),
        linear-gradient(135deg,#0f172a 0%,#111827 32%,#f8fafc 32%,#f3f4f6 100%) !important;
      color:#101827 !important;
    }
    .wrap{
      max-width:1120px !important;
      padding:24px 18px 48px !important;
    }
    .hero{
      position:relative !important;
      overflow:hidden !important;
      border-radius:30px !important;
      padding:24px !important;
      background:
        linear-gradient(135deg,rgba(17,24,39,.96),rgba(120,53,15,.66)),
        radial-gradient(circle at 92% 18%, rgba(245,158,11,.60), transparent 32%) !important;
      box-shadow:0 24px 70px rgba(15,23,42,.28) !important;
      border:1px solid rgba(255,255,255,.14) !important;
    }
    .hero:after{
      content:"";
      position:absolute;
      right:-88px;
      top:-88px;
      width:230px;
      height:230px;
      border-radius:999px;
      background:rgba(255,255,255,.12);
      border:1px solid rgba(255,255,255,.16);
    }
    .hero h1{
      font-size:32px !important;
      letter-spacing:-.045em !important;
      line-height:1.02 !important;
    }
    .hero p{
      color:#ffedd5 !important;
      max-width:760px !important;
    }
    .actions{
      position:relative;
      z-index:2;
    }
    a.btn,button{
      background:linear-gradient(135deg,#ea580c,#f59e0b) !important;
      color:white !important;
      border:1px solid rgba(255,255,255,.22) !important;
      box-shadow:0 10px 24px rgba(15,23,42,.14) !important;
      transition:transform .16s ease, box-shadow .16s ease !important;
    }
    a.btn:hover,button:hover{
      transform:translateY(-2px);
      box-shadow:0 16px 34px rgba(15,23,42,.20) !important;
    }
    a.sec,button.sec{
      background:linear-gradient(135deg,#ffffff,#ffedd5) !important;
      color:#0f172a !important;
      border:1px solid rgba(255,255,255,.72) !important;
    }
    .card{
      border-radius:24px !important;
      background:rgba(255,255,255,.94) !important;
      border:1px solid rgba(229,231,235,.92) !important;
      box-shadow:0 14px 36px rgba(15,23,42,.09) !important;
      backdrop-filter:blur(12px);
    }
    .card h2{
      margin-top:0 !important;
      letter-spacing:-.035em !important;
      color:#111827 !important;
    }
    table{
      overflow:hidden !important;
      border-radius:18px !important;
      background:white !important;
    }
    th{
      background:#f9fafb !important;
      color:#6b7280 !important;
      letter-spacing:.06em !important;
    }
    td{
      background:rgba(255,255,255,.86) !important;
    }
    .msg{
      border-radius:18px !important;
      box-shadow:0 10px 24px rgba(15,23,42,.06) !important;
    }
    .ok{
      background:linear-gradient(135deg,#ecfdf5,#f0fdfa) !important;
      border-color:#99f6e4 !important;
    }
    .error{
      background:linear-gradient(135deg,#fff7ed,#fef2f2) !important;
      border-color:#fed7aa !important;
    }

</style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Backups</h1>
      <p>Copias de seguridad separadas solo del restaurante actual.</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/configuracion-reportes">Reportes</a>
      </div>
    </section>

    ${ok ? `<div class="msg ok">${escapar(ok)}</div>` : ""}
    ${error ? `<div class="msg error">${escapar(error)}</div>` : ""}

    <section class="card">
      <h2>Crear backup</h2>
      <p>El backup incluye datos operativos del restaurante actual, sin mezclar datos de otros restaurantes.</p>
      <form method="POST" action="/configuracion-backups/crear">
        <button type="submit">Crear backup ahora</button>
      </form>
    </section>

    <section class="card">
      <h2>Backups disponibles</h2>
      <table>
        <thead><tr><th>Archivo</th><th>Tamaño</th><th>Fecha</th><th>Acciones</th></tr></thead>
        <tbody>${filas || `<tr><td colspan="4">Todavía no hay backups.</td></tr>`}</tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}

module.exports = function backupsSaasRoutes(db) {
  const router = express.Router();

  router.get("/configuracion-backups", requiereAdminGerente, function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const backups = listarBackups(restauranteId);

    res.send(renderBackups(backups, req.query || {}));
  });

  router.post("/configuracion-backups/crear", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);

    try {
      const nombre = await crearBackupRestaurante(db, restauranteId, req.session.usuario);
      res.redirect("/configuracion-backups?ok=" + encodeURIComponent("Backup creado: " + nombre));
    } catch (err) {
      res.redirect("/configuracion-backups?error=" + encodeURIComponent(err.message));
    }
  });

  router.get("/configuracion-backups/descargar/:nombre", requiereAdminGerente, function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const nombre = nombreSeguro(req.params.nombre, restauranteId);

    if (!nombre) return res.status(400).send("Backup no válido.");

    const ruta = path.join(carpetaBackups(restauranteId), nombre);

    if (!fs.existsSync(ruta)) return res.status(404).send("Backup no encontrado.");

    res.download(ruta, nombre);
  });

  router.post("/configuracion-backups/eliminar/:nombre", requiereAdminGerente, function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const nombre = nombreSeguro(req.params.nombre, restauranteId);

    if (!nombre) {
      return res.redirect("/configuracion-backups?error=" + encodeURIComponent("Nombre de backup no válido."));
    }

    const ruta = path.join(carpetaBackups(restauranteId), nombre);

    if (fs.existsSync(ruta)) fs.unlinkSync(ruta);

    res.redirect("/configuracion-backups?ok=" + encodeURIComponent("Backup eliminado."));
  });

  return router;
};
