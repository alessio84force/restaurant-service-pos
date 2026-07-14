const { imprimirCentroImpresion } = require("../printing/centroImpresionRuntime");
const express = require("express");
const fs = require("fs");
const path = require("path");

function escaparHTML(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizarDestino(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function requiereConfig(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect("/login");
  }

  const rol = req.session.usuario.rol || req.session.usuario.role || "";

  if (rol === "admin" || rol === "gerente") {
    return next();
  }

  return res.status(403).send("No autorizado");
}

function destinoTicket() {
  return {
    id: "ticket",
    titulo: "Ticket / caja",
    descripcion: "Tickets finales, precuentas y apertura de cajón.",
    archivo: "prueba_ticket.txt",
    tipoSistema: "ticket"
  };
}

function destinoReportes() {
  return {
    id: "reportes",
    titulo: "Reportes / A4",
    descripcion: "Cierres de caja, informes y documentos de administración.",
    archivo: "prueba_reportes.txt",
    tipoSistema: "reportes"
  };
}

function descripcionComanda(id, nombre) {
  if (id === "bar") return "Comandas de bebidas, cafés y barra.";
  if (id === "cocina") return "Comandas de cocina con notas y puntos de cocción.";
  return "Comandas de " + nombre + ".";
}

function archivoPruebaDestino(id) {
  return "prueba_" + normalizarDestino(id) + ".txt";
}

function asegurarCentroImpresion(db, callback) {
  db.run(
    "INSERT OR IGNORE INTO configurazione(id,nome_ristorante,iva,mensaje_ticket,modo_impresion) VALUES(1,'Restaurant Service Demo',10,'Gracias por su visita','preview')",
    [],
    (errInsert) => {
      if (errInsert) return callback(errInsert);

      db.all("PRAGMA table_info(configurazione)", [], (errCols, columnas) => {
        if (errCols) return callback(errCols);

        const nombres = (columnas || []).map((c) => c.name);

        const columnasNecesarias = [
          { nombre: "config_impresion_json", sql: "ALTER TABLE configurazione ADD COLUMN config_impresion_json TEXT" },
          { nombre: "stampante_ticket", sql: "ALTER TABLE configurazione ADD COLUMN stampante_ticket TEXT DEFAULT ''" },
          { nombre: "stampante_bar", sql: "ALTER TABLE configurazione ADD COLUMN stampante_bar TEXT DEFAULT ''" },
          { nombre: "stampante_cocina", sql: "ALTER TABLE configurazione ADD COLUMN stampante_cocina TEXT DEFAULT ''" },
          { nombre: "modo_impresion", sql: "ALTER TABLE configurazione ADD COLUMN modo_impresion TEXT DEFAULT 'preview'" }
        ].filter((col) => !nombres.includes(col.nombre));

        function siguiente(i) {
          if (i >= columnasNecesarias.length) {
            return callback();
          }

          db.run(columnasNecesarias[i].sql, [], (errAlter) => {
            if (errAlter && !String(errAlter.message || "").includes("duplicate column")) {
              return callback(errAlter);
            }

            siguiente(i + 1);
          });
        }

        siguiente(0);
      });
    }
  );
}

function asegurarDestinosComanda(db, callback) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS destinos_comanda (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        activo INTEGER DEFAULT 1,
        orden INTEGER DEFAULT 0,
        creado_en TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, [], (errTabla) => {
      if (errTabla) return callback(errTabla);

      db.run(
        "INSERT OR IGNORE INTO destinos_comanda(id,nombre,activo,orden) VALUES('bar','Bar',1,10)",
        [],
        (errBar) => {
          if (errBar) return callback(errBar);

          db.run(
            "INSERT OR IGNORE INTO destinos_comanda(id,nombre,activo,orden) VALUES('cocina','Cocina',1,20)",
            [],
            callback
          );
        }
      );
    });
  });
}

function cargarDestinosCentro(db, callback) {
  asegurarDestinosComanda(db, (err) => {
    if (err) return callback(err);

    db.all(
      `SELECT id,nombre,activo,orden
       FROM destinos_comanda
       WHERE activo=1
       ORDER BY orden ASC, nombre COLLATE NOCASE ASC`,
      [],
      (errDestinos, filas) => {
        if (errDestinos) return callback(errDestinos);

        const destinos = [destinoTicket()];
        const vistos = { ticket: true };

        (filas || []).forEach((fila) => {
          const id = normalizarDestino(fila.id || fila.nombre);
          const nombre = String(fila.nombre || id).trim();

          if (!id || vistos[id]) return;

          destinos.push({
            id,
            titulo: nombre,
            descripcion: descripcionComanda(id, nombre),
            archivo: archivoPruebaDestino(id),
            tipoSistema: "comanda"
          });

          vistos[id] = true;
        });

        if (!vistos.bar) {
          destinos.push({
            id: "bar",
            titulo: "Bar",
            descripcion: descripcionComanda("bar", "Bar"),
            archivo: "prueba_bar.txt",
            tipoSistema: "comanda"
          });
          vistos.bar = true;
        }

        if (!vistos.cocina) {
          destinos.push({
            id: "cocina",
            titulo: "Cocina",
            descripcion: descripcionComanda("cocina", "Cocina"),
            archivo: "prueba_cocina.txt",
            tipoSistema: "comanda"
          });
          vistos.cocina = true;
        }

        destinos.push(destinoReportes());

        callback(null, destinos);
      }
    );
  });
}

function configDefaultDestino(destino) {
  if (destino.id === "ticket") {
    return {
      modo: "preview",
      tipo: "termica",
      nombre: "",
      ancho: "80",
      ip: "",
      puerto: "9100",
      cortar: 1,
      cajon: 1
    };
  }

  if (destino.id === "reportes") {
    return {
      modo: "preview",
      tipo: "a4",
      nombre: "",
      ancho: "A4",
      ip: "",
      puerto: "",
      cortar: 0,
      cajon: 0
    };
  }

  return {
    modo: "preview",
    tipo: "termica",
    nombre: "",
    ancho: "80",
    ip: "",
    puerto: "9100",
    cortar: 1,
    cajon: 0
  };
}

function configBase(destinos) {
  const base = {};

  destinos.forEach((destino) => {
    base[destino.id] = configDefaultDestino(destino);
  });

  return base;
}

function mezclarConfig(configGuardada, fila, destinos) {
  const base = configBase(destinos);

  if (configGuardada && typeof configGuardada === "object") {
    Object.keys(configGuardada).forEach((key) => {
      const id = normalizarDestino(key);

      if (!id) return;

      const destinoDef = destinos.find((d) => d.id === id) || { id };
      const def = base[id] || configDefaultDestino(destinoDef);

      base[id] = Object.assign({}, def, configGuardada[key] || {});
    });
  }

  if (fila) {
    if (fila.stampante_ticket && base.ticket && !base.ticket.nombre) {
      base.ticket.nombre = fila.stampante_ticket;
    }

    if (fila.stampante_bar && base.bar && !base.bar.nombre) {
      base.bar.nombre = fila.stampante_bar;
    }

    if (fila.stampante_cocina && base.cocina && !base.cocina.nombre) {
      base.cocina.nombre = fila.stampante_cocina;
    }
  }

  return base;
}

function cargarCentroImpresion(db, callback) {
  asegurarCentroImpresion(db, (err) => {
    if (err) return callback(err);

    cargarDestinosCentro(db, (errDestinos, destinos) => {
      if (errDestinos) return callback(errDestinos);

      db.get("SELECT * FROM configurazione WHERE id=1", [], (errGet, fila) => {
        if (errGet) return callback(errGet);

        let configGuardada = null;

        try {
          configGuardada = fila && fila.config_impresion_json
            ? JSON.parse(fila.config_impresion_json)
            : null;
        } catch (e) {
          configGuardada = null;
        }

        callback(null, mezclarConfig(configGuardada, fila || {}, destinos), fila || {}, destinos);
      });
    });
  });
}

function guardarCentroImpresion(db, config, callback) {
  db.run(
    `UPDATE configurazione
     SET config_impresion_json=?,
         modo_impresion=?,
         stampante_ticket=?,
         stampante_bar=?,
         stampante_cocina=?
     WHERE id=1`,
    [
      JSON.stringify(config),
      "centro_impresion",
      config.ticket ? (config.ticket.nombre || "") : "",
      config.bar ? (config.bar.nombre || "") : "",
      config.cocina ? (config.cocina.nombre || "") : ""
    ],
    callback
  );
}

function leerConfigFormulario(body, destinos) {
  const config = configBase(destinos);

  destinos.forEach((destino) => {
    const id = destino.id;

    config[id] = {
      modo: String(body[id + "_modo"] || config[id].modo || "preview"),
      tipo: String(body[id + "_tipo"] || config[id].tipo || "termica"),
      nombre: String(body[id + "_nombre"] || "").trim(),
      ancho: String(body[id + "_ancho"] || config[id].ancho || "80"),
      ip: String(body[id + "_ip"] || "").trim(),
      puerto: String(body[id + "_puerto"] || config[id].puerto || "").trim(),
      cortar: body[id + "_cortar"] ? 1 : 0,
      cajon: body[id + "_cajon"] ? 1 : 0
    };
  });

  return config;
}

function textoPrueba(destino, config) {
  const c = config[destino.id] || {};
  const fecha = new Date().toLocaleString("es-ES");

  let texto = "";
  texto += "================================\n";
  texto += "      RESTAURANT SERVICE POS\n";
  texto += "================================\n";
  texto += "PRUEBA IMPRESION: " + destino.titulo.toUpperCase() + "\n";
  texto += "FECHA: " + fecha + "\n";
  texto += "--------------------------------\n";
  texto += "MODO: " + (c.modo || "preview") + "\n";
  texto += "TIPO: " + (c.tipo || "termica") + "\n";
  texto += "NOMBRE: " + (c.nombre || "Sin configurar") + "\n";
  texto += "PAPEL: " + (c.ancho || "80") + "\n";
  texto += "IP: " + (c.ip || "Sin IP") + "\n";
  texto += "PUERTO: " + (c.puerto || "Sin puerto") + "\n";
  texto += "CORTAR PAPEL: " + (Number(c.cortar) === 1 ? "SI" : "NO") + "\n";
  texto += "ABRIR CAJON: " + (Number(c.cajon) === 1 ? "SI" : "NO") + "\n";
  texto += "--------------------------------\n";
  texto += "LINEA DE PRUEBA 1\n";
  texto += "LINEA DE PRUEBA 2\n";
  texto += ">>> NOTA IMPORTANTE <<<\n";
  texto += "PRUEBA DE NOTAS Y COMANDAS\n";
  texto += "================================\n\n\n";

  return texto;
}

function guardarPrueba(destino, config) {
  const carpeta = path.join(process.cwd(), "prints");

  if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
  }

  const ruta = path.join(carpeta, destino.archivo);
  fs.writeFileSync(ruta, textoPrueba(destino, config), "utf8");

  return ruta;
}

function renderSelect(nombre, valor, opciones) {
  return `
    <select name="${nombre}">
      ${opciones.map((op) => `
        <option value="${escaparHTML(op.value)}" ${String(valor) === String(op.value) ? "selected" : ""}>
          ${escaparHTML(op.label)}
        </option>
      `).join("")}
    </select>
  `;
}

function renderPagina(config, mensaje, destinos) {
  const modos = [
    { value: "preview", label: "Modo prueba / vista previa" },
    { value: "sistema", label: "Impresión del sistema" },
    { value: "escpos_red", label: "ESC/POS red/IP" },
    { value: "escpos_usb", label: "ESC/POS USB futuro" }
  ];

  const tipos = [
    { value: "termica", label: "Térmica 58/80mm" },
    { value: "impacto", label: "Impacto / matricial cocina" },
    { value: "a4", label: "A4 / oficina" },
    { value: "etiquetas", label: "Etiquetas" }
  ];

  const anchos = [
    { value: "58", label: "58 mm" },
    { value: "80", label: "80 mm" },
    { value: "A4", label: "A4" },
    { value: "etiqueta", label: "Etiqueta" }
  ];

  const cards = destinos.map((destino) => {
    const c = config[destino.id] || {};

    return `
      <section class="printer-card">
        <div class="printer-head">
          <div>
            <h2>${escaparHTML(destino.titulo)}</h2>
            <p>${escaparHTML(destino.descripcion)}</p>
          </div>
          <span>${escaparHTML(c.modo || "preview")}</span>
        </div>

        <div class="grid">
          <label>
            Modo impresión
            ${renderSelect(destino.id + "_modo", c.modo, modos)}
          </label>

          <label>
            Tipo impresora
            ${renderSelect(destino.id + "_tipo", c.tipo, tipos)}
          </label>

          <label>
            Nombre impresora sistema
            <input name="${destino.id}_nombre" value="${escaparHTML(c.nombre || "")}" placeholder="Ej. EPSON TM-T20 ${escaparHTML(destino.titulo)}">
          </label>

          <label>
            Ancho papel
            ${renderSelect(destino.id + "_ancho", c.ancho, anchos)}
          </label>

          <label>
            IP impresora red
            <input name="${destino.id}_ip" value="${escaparHTML(c.ip || "")}" placeholder="Ej. 192.168.1.50">
          </label>

          <label>
            Puerto
            <input name="${destino.id}_puerto" value="${escaparHTML(c.puerto || "")}" placeholder="9100">
          </label>
        </div>

        <div class="checks">
          <label>
            <input type="checkbox" name="${destino.id}_cortar" value="1" ${Number(c.cortar) === 1 ? "checked" : ""}>
            Cortar papel
          </label>

          <label>
            <input type="checkbox" name="${destino.id}_cajon" value="1" ${Number(c.cajon) === 1 ? "checked" : ""}>
            Abrir cajón portamonedas
          </label>
        </div>

        <div class="test-row">
          <button class="btn-test" type="submit" formaction="/configuracion-impresoras/probar-${escaparHTML(destino.id)}">
            Generar prueba ${escaparHTML(destino.titulo)}
          </button>

          <a class="btn-link" target="_blank" href="/configuracion-impresoras/ver-prueba/${escaparHTML(destino.id)}">
            Ver última prueba
          </a>
        </div>
      </section>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Centro de impresión - Restaurant Service POS</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body{margin:0;font-family:Arial,sans-serif;background:#f3f4f6;color:#111827;}
  .page{max-width:1180px;margin:0 auto;padding:28px;}
  .topbar{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:22px;}
  h1{margin:0;font-size:34px;}
  .sub{margin:8px 0 0 0;color:#6b7280;font-weight:700;}
  .btn-back{text-decoration:none;background:#ffffff;color:#111827;border:1px solid #d1d5db;padding:12px 16px;border-radius:14px;font-weight:900;}
  .notice{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;padding:13px 16px;border-radius:14px;font-weight:900;margin-bottom:18px;}
  .intro{background:#ffffff;border:1px solid #e5e7eb;border-radius:22px;padding:18px;margin-bottom:18px;box-shadow:0 10px 24px rgba(15,23,42,0.06);}
  .intro p{margin:8px 0;color:#374151;font-weight:700;}
  form{display:grid;gap:18px;}
  .printer-card{background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;padding:20px;box-shadow:0 12px 28px rgba(15,23,42,0.07);}
  .printer-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:16px;}
  .printer-head h2{margin:0;font-size:24px;}
  .printer-head p{margin:7px 0 0;color:#6b7280;font-weight:700;}
  .printer-head span{background:#111827;color:white;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:900;text-transform:uppercase;}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}
  label{display:grid;gap:7px;font-weight:900;color:#374151;}
  input,select{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:12px;padding:11px;font-size:15px;background:white;}
  .checks{display:flex;gap:18px;flex-wrap:wrap;margin-top:15px;}
  .checks label{display:flex;align-items:center;gap:8px;}
  .checks input{width:auto;}
  .test-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;}
  button,.btn-save,.btn-test,.btn-link{border:0;border-radius:14px;padding:12px 16px;font-weight:900;text-decoration:none;cursor:pointer;}
  .btn-save{background:#16a34a;color:white;font-size:17px;}
  .btn-test{background:#111827;color:white;}
  .btn-link{background:#f3f4f6;color:#111827;border:1px solid #d1d5db;}
  .save-box{position:sticky;bottom:0;background:#f3f4f6;border-top:1px solid #e5e7eb;padding:16px 0;}
  @media(max-width:800px){.grid{grid-template-columns:1fr}.topbar{align-items:flex-start;flex-direction:column}}
</style>
</head>
<body>
  <main class="page">
    <div class="topbar">
      <div>
        <h1>Centro de impresión</h1>
        <p class="sub">Configura ticket, reportes y todos los destinos de comanda.</p>
      </div>
      <a class="btn-back" href="/configuracion">Volver a configuración</a>
    </div>

    ${mensaje ? `<div class="notice">${escaparHTML(mensaje)}</div>` : ""}

    <section class="intro">
      <p><strong>Multidestino:</strong> si creas Pizzería, Parrilla o Coctelería en Destinos de comanda, aquí aparece automáticamente su impresora.</p>
      <p>Modo prueba genera archivos TXT en la carpeta prints. ESC/POS red enviará directamente a la IP configurada.</p>
    </section>

    <form method="POST" action="/configuracion-impresoras">
      ${cards}

      <div class="save-box">
        <button class="btn-save" type="submit">Guardar centro de impresión</button>
      </div>
    </form>
  </main>
</body>
</html>
`;
}

function buscarDestino(destinos, id) {
  const limpio = normalizarDestino(id);
  return destinos.find((d) => d.id === limpio) || null;
}

function centroImpresionRoutes(db) {
  const router = express.Router();

  router.get("/configuracion-impresoras", requiereConfig, (req, res) => {
    cargarCentroImpresion(db, (err, config, fila, destinos) => {
      if (err) {
        console.error("Error cargando centro de impresión:", err.message);
        return res.status(500).send("Error cargando centro de impresión: " + err.message);
      }

      res.send(renderPagina(config, req.query.ok || "", destinos));
    });
  });

  router.post("/configuracion-impresoras", requiereConfig, (req, res) => {
    cargarDestinosCentro(db, (errDestinos, destinos) => {
      if (errDestinos) {
        console.error("Error cargando destinos:", errDestinos.message);
        return res.redirect("/configuracion-impresoras?ok=Error cargando destinos");
      }

      const config = leerConfigFormulario(req.body || {}, destinos);

      asegurarCentroImpresion(db, (errAsegurar) => {
        if (errAsegurar) {
          console.error("Error preparando centro de impresión:", errAsegurar.message);
          return res.redirect("/configuracion-impresoras?ok=Error preparando centro de impresión");
        }

        guardarCentroImpresion(db, config, (errGuardar) => {
          if (errGuardar) {
            console.error("Error guardando centro de impresión:", errGuardar.message);
            return res.redirect("/configuracion-impresoras?ok=Error guardando centro de impresión");
          }

          res.redirect("/configuracion-impresoras?ok=Centro de impresión guardado correctamente");
        });
      });
    });
  });

  router.post("/configuracion-impresoras/probar-:destinoId", requiereConfig, (req, res) => {
    cargarDestinosCentro(db, (errDestinos, destinos) => {
      if (errDestinos) {
        console.error("Error cargando destinos prueba:", errDestinos.message);
        return res.redirect("/configuracion-impresoras?ok=Error cargando destinos");
      }

      const destino = buscarDestino(destinos, req.params.destinoId);

      if (!destino) {
        return res.redirect("/configuracion-impresoras?ok=Destino no encontrado");
      }

      const config = leerConfigFormulario(req.body || {}, destinos);

      asegurarCentroImpresion(db, (errAsegurar) => {
        if (errAsegurar) {
          console.error("Error preparando prueba:", errAsegurar.message);
          return res.redirect("/configuracion-impresoras?ok=Error preparando prueba");
        }

        guardarCentroImpresion(db, config, (errGuardar) => {
          if (errGuardar) {
            console.error("Error guardando configuración antes de prueba:", errGuardar.message);
            return res.redirect("/configuracion-impresoras?ok=Error guardando configuración");
          }

          guardarPrueba(destino, config);

          imprimirCentroImpresion(db, destino.id, textoPrueba(destino, config), function(resultadoImpresion) {
            if (resultadoImpresion && resultadoImpresion.modo === "escpos_red" && !resultadoImpresion.ok) {
              console.log("[PRUEBA ESC/POS]", destino.id, "NO ENVIADA:", resultadoImpresion.motivo || resultadoImpresion.error || "sin detalle");
            }
          });

          res.redirect("/configuracion-impresoras?ok=Prueba generada en prints/" + destino.archivo);
        });
      });
    });
  });

  router.get("/configuracion-impresoras/ver-prueba/:destinoId", requiereConfig, (req, res) => {
    cargarDestinosCentro(db, (errDestinos, destinos) => {
      if (errDestinos) {
        return res.type("text/plain").send("Error cargando destinos: " + errDestinos.message);
      }

      const destino = buscarDestino(destinos, req.params.destinoId);

      if (!destino) {
        return res.type("text/plain").send("Destino no encontrado.");
      }

      const ruta = path.join(process.cwd(), "prints", destino.archivo);

      if (!fs.existsSync(ruta)) {
        return res.type("text/plain").send("Todavía no hay prueba generada para " + destino.titulo + ".");
      }

      res.type("text/plain").send(fs.readFileSync(ruta, "utf8"));
    });
  });

  return router;
}

module.exports = centroImpresionRoutes;
