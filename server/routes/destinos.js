const express = require("express");

function escaparHTML(valor){
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizarDestino(nombre){
  return String(nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function requiereConfig(req,res,next){
  if(!req.session || !req.session.usuario){
    return res.redirect("/login");
  }

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if(rol !== "admin" && rol !== "gerente"){
    return res.status(403).send("Acceso no permitido");
  }

  next();
}

function asegurarTablaDestinos(db, callback){
  db.serialize(()=>{
    db.run(`
      CREATE TABLE IF NOT EXISTS destinos_comanda (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        activo INTEGER DEFAULT 1,
        orden INTEGER DEFAULT 0,
        creado_en TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, [], (err)=>{
      if(err) return callback(err);

      db.run(
        "INSERT OR IGNORE INTO destinos_comanda(id,nombre,activo,orden) VALUES('bar','Bar',1,10)",
        [],
        (errBar)=>{
          if(errBar) return callback(errBar);

          db.run(
            "INSERT OR IGNORE INTO destinos_comanda(id,nombre,activo,orden) VALUES('cocina','Cocina',1,20)",
            [],
            (errCocina)=>{
              if(errCocina) return callback(errCocina);

              db.all("SELECT DISTINCT destino FROM categorias WHERE destino IS NOT NULL AND TRIM(destino)<>''", [], (errCats, filas)=>{
                if(errCats) return callback(null);

                const destinos = filas || [];

                function siguiente(i){
                  if(i >= destinos.length) return callback(null);

                  const id = normalizarDestino(destinos[i].destino);
                  const nombre = String(destinos[i].destino || "").trim();

                  if(!id) return siguiente(i + 1);

                  db.run(
                    "INSERT OR IGNORE INTO destinos_comanda(id,nombre,activo,orden) VALUES(?,?,1,100)",
                    [id, nombre.charAt(0).toUpperCase() + nombre.slice(1)],
                    () => siguiente(i + 1)
                  );
                }

                siguiente(0);
              });
            }
          );
        }
      );
    });
  });
}

function cargarDestinos(db, soloActivos, callback){
  asegurarTablaDestinos(db, (err)=>{
    if(err) return callback(err);

    const where = soloActivos ? "WHERE activo=1" : "";

    db.all(
      `SELECT id,nombre,activo,orden,creado_en
       FROM destinos_comanda
       ${where}
       ORDER BY orden ASC, nombre COLLATE NOCASE ASC`,
      [],
      callback
    );
  });
}

function renderPagina(destinos, mensaje){
  const filas = destinos.map((d)=>{
    const activo = Number(d.activo || 0) === 1;

    return `
      <tr>
        <td><strong>${escaparHTML(d.nombre)}</strong><br><span>${escaparHTML(d.id)}</span></td>
        <td>${activo ? '<span class="ok">Activo</span>' : '<span class="off">Inactivo</span>'}</td>
        <td>${Number(d.orden || 0)}</td>
        <td class="acciones">
          <form method="POST" action="/configuracion-destinos/${escaparHTML(d.id)}/activar">
            <button ${activo ? "disabled" : ""}>Activar</button>
          </form>
          <form method="POST" action="/configuracion-destinos/${escaparHTML(d.id)}/desactivar">
            <button ${!activo ? "disabled" : ""}>Desactivar</button>
          </form>
        </td>
      </tr>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Destinos de comanda - Restaurant Service POS</title>
  <style>
    body{margin:0;font-family:Arial,sans-serif;background:#f3f4f6;color:#111827;}
    .topbar{background:#111827;color:white;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;}
    .topbar a{color:white;text-decoration:none;font-weight:800;}
    main{max-width:1100px;margin:28px auto;padding:0 18px;}
    .grid{display:grid;grid-template-columns:360px 1fr;gap:22px;align-items:start;}
    .card{background:white;border-radius:20px;padding:22px;box-shadow:0 12px 30px rgba(15,23,42,.08);}
    h1{margin:0;font-size:26px;}
    h2{margin-top:0;}
    p{color:#4b5563;line-height:1.45;}
    label{display:block;font-weight:800;margin:14px 0 6px;}
    input{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:12px;padding:12px;font-size:15px;}
    button,.btn{border:0;border-radius:12px;background:#111827;color:white;padding:11px 14px;font-weight:800;cursor:pointer;text-decoration:none;display:inline-block;}
    button:disabled{opacity:.35;cursor:not-allowed;}
    table{width:100%;border-collapse:collapse;}
    th,td{padding:13px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:middle;}
    th{font-size:13px;text-transform:uppercase;color:#6b7280;}
    td span{color:#6b7280;font-size:13px;}
    .acciones{display:flex;gap:8px;flex-wrap:wrap;}
    .acciones form{margin:0;}
    .ok{display:inline-block;background:#dcfce7;color:#166534;padding:5px 10px;border-radius:999px;font-weight:800;}
    .off{display:inline-block;background:#fee2e2;color:#991b1b;padding:5px 10px;border-radius:999px;font-weight:800;}
    .msg{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;border-radius:14px;padding:12px 14px;margin-bottom:16px;font-weight:800;}
    .help{background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:12px;margin-top:14px;}
    @media(max-width:850px){.grid{grid-template-columns:1fr;}}
  </style>
</head>
<body>
  <div class="topbar">
    <strong>Destinos de comanda</strong>
    <div>
      <a href="/configuracion">Configuración</a> ·
      <a href="/configuracion-productos">Productos</a> ·
      <a href="/app/v2">POS</a>
    </div>
  </div>

  <main>
    ${mensaje ? `<div class="msg">${escaparHTML(mensaje)}</div>` : ""}

    <div class="grid">
      <section class="card">
        <h1>Crear destino</h1>
        <p>Crea zonas de preparación como Pizzería, Parrilla, Coctelería, Sushi o Pastelería.</p>

        <form method="POST" action="/configuracion-destinos/crear">
          <label>Nombre del destino</label>
          <input name="nombre" placeholder="Ej. Pizzería" required>

          <label>Orden</label>
          <input name="orden" type="number" value="30">

          <br><br>
          <button type="submit">Crear destino</button>
        </form>

        <div class="help">
          <strong>Importante:</strong>
          después podrás asignar categorías a este destino desde Productos.
        </div>
      </section>

      <section class="card">
        <h2>Destinos existentes</h2>
        <table>
          <thead>
            <tr>
              <th>Destino</th>
              <th>Estado</th>
              <th>Orden</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filas || '<tr><td colspan="4">No hay destinos creados.</td></tr>'}
          </tbody>
        </table>
      </section>
    </div>
  </main>
</body>
</html>
`;
}

function destinosRoutes(db){
  const router = express.Router();

  router.get("/api/destinos-comanda", (req,res)=>{
    if(!req.session || !req.session.usuario){
      return res.status(401).json({ ok:false, error:"no_login" });
    }

    cargarDestinos(db, true, (err,destinos)=>{
      if(err){
        return res.status(500).json({ ok:false, error:err.message });
      }

      res.json({ ok:true, destinos:destinos || [] });
    });
  });

  router.get("/configuracion-destinos", requiereConfig, (req,res)=>{
    cargarDestinos(db, false, (err,destinos)=>{
      if(err){
        return res.status(500).send("Error cargando destinos: " + err.message);
      }

      res.send(renderPagina(destinos || [], req.query.ok || ""));
    });
  });

  router.post("/configuracion-destinos/crear", requiereConfig, (req,res)=>{
    const nombre = String(req.body.nombre || "").trim();
    const orden = Number(req.body.orden || 100);
    const id = normalizarDestino(nombre);

    if(!nombre || !id){
      return res.redirect("/configuracion-destinos?ok=Nombre no válido");
    }

    asegurarTablaDestinos(db, (err)=>{
      if(err){
        return res.status(500).send("Error preparando destinos: " + err.message);
      }

      db.run(
        "INSERT OR IGNORE INTO destinos_comanda(id,nombre,activo,orden) VALUES(?,?,1,?)",
        [id,nombre,orden],
        (errInsert)=>{
          if(errInsert){
            return res.status(500).send("Error creando destino: " + errInsert.message);
          }

          res.redirect("/configuracion-destinos?ok=Destino creado");
        }
      );
    });
  });

  router.post("/configuracion-destinos/:id/activar", requiereConfig, (req,res)=>{
    asegurarTablaDestinos(db, (err)=>{
      if(err) return res.status(500).send(err.message);

      db.run(
        "UPDATE destinos_comanda SET activo=1 WHERE id=?",
        [req.params.id],
        () => res.redirect("/configuracion-destinos?ok=Destino activado")
      );
    });
  });

  router.post("/configuracion-destinos/:id/desactivar", requiereConfig, (req,res)=>{
    asegurarTablaDestinos(db, (err)=>{
      if(err) return res.status(500).send(err.message);

      db.run(
        "UPDATE destinos_comanda SET activo=0 WHERE id=?",
        [req.params.id],
        () => res.redirect("/configuracion-destinos?ok=Destino desactivado")
      );
    });
  });

  return router;
}

module.exports = destinosRoutes;
