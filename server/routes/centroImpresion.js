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

const DESTINOS = [
  {
    id: "ticket",
    titulo: "Ticket / caja",
    descripcion: "Tickets finales, precuentas y apertura de cajón.",
    archivo: "prueba_ticket.txt"
  },
  {
    id: "bar",
    titulo: "Bar",
    descripcion: "Comandas de bebidas, cafés y barra.",
    archivo: "prueba_bar.txt"
  },
  {
    id: "cocina",
    titulo: "Cocina",
    descripcion: "Comandas de cocina con notas y puntos de cocción.",
    archivo: "prueba_cocina.txt"
  },
  {
    id: "reportes",
    titulo: "Reportes / A4",
    descripcion: "Cierres de caja, informes y documentos de administración.",
    archivo: "prueba_reportes.txt"
  }
];

function configBase() {
  return {
    ticket: {
      modo: "preview",
      tipo: "termica",
      nombre: "",
      ancho: "80",
      ip: "",
      puerto: "9100",
      cortar: 1,
      cajon: 1
    },
    bar: {
      modo: "preview",
      tipo: "termica",
      nombre: "",
      ancho: "80",
      ip: "",
      puerto: "9100",
      cortar: 1,
      cajon: 0
    },
    cocina: {
      modo: "preview",
      tipo: "termica",
      nombre: "",
      ancho: "80",
      ip: "",
      puerto: "9100",
      cortar: 1,
      cajon: 0
    },
    reportes: {
      modo: "preview",
      tipo: "a4",
      nombre: "",
      ancho: "A4",
      ip: "",
      puerto: "",
      cortar: 0,
      cajon: 0
    }
  };
}

function mezclarConfig(configGuardada, fila) {
  const base = configBase();

  if (configGuardada && typeof configGuardada === "object") {
    DESTINOS.forEach((destino) => {
      base[destino.id] = Object.assign(
        {},
        base[destino.id],
        configGuardada[destino.id] || {}
      );
    });
  }

  if (fila) {
    if (fila.stampante_ticket && !base.ticket.nombre) base.ticket.nombre = fila.stampante_ticket;
    if (fila.stampante_bar && !base.bar.nombre) base.bar.nombre = fila.stampante_bar;
    if (fila.stampante_cocina && !base.cocina.nombre) base.cocina.nombre = fila.stampante_cocina;
  }

  return base;
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

function cargarCentroImpresion(db, callback) {
  asegurarCentroImpresion(db, (err) => {
    if (err) return callback(err);

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

      callback(null, mezclarConfig(configGuardada, fila || {}), fila || {});
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
      config.ticket.nombre || "",
      config.bar.nombre || "",
      config.cocina.nombre || ""
    ],
    callback
  );
}

function leerConfigFormulario(body) {
  const config = configBase();

  DESTINOS.forEach((destino) => {
    const id = destino.id;

    config[id] = {
      modo: String(body[id + "_modo"] || "preview"),
      tipo: String(body[id + "_tipo"] || "termica"),
      nombre: String(body[id + "_nombre"] || "").trim(),
      ancho: String(body[id + "_ancho"] || "80"),
      ip: String(body[id + "_ip"] || "").trim(),
      puerto: String(body[id + "_puerto"] || "").trim(),
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

function renderPagina(config, mensaje) {
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

  const cards = DESTINOS.map((destino) => {
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
            <input name="${destino.id}_nombre" value="${escaparHTML(c.nombre || "")}" placeholder="Ej. EPSON TM-T20 Cocina">
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
          <button class="btn-test" type="submit" formaction="/configuracion-impresoras/probar-${destino.id}">
            Generar prueba ${escaparHTML(destino.titulo)}
          </button>

          <a class="btn-link" target="_blank" href="/configuracion-impresoras/ver-prueba/${destino.id}">
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
  body{
    margin:0;
    font-family:Arial, sans-serif;
    background:#f3f4f6;
    color:#111827;
  }

  .page{
    max-width:1180px;
    margin:0 auto;
    padding:28px;
  }

  .topbar{
    display:flex;
    justify-content:space-between;
    gap:14px;
    align-items:center;
    margin-bottom:22px;
  }

  h1{
    margin:0;
    font-size:34px;
  }

  .sub{
    margin:8px 0 0 0;
    color:#6b7280;
    font-weight:700;
  }

  .btn-back{
    text-decoration:none;
    background:#ffffff;
    color:#111827;
    border:1px solid #d1d5db;
    padding:12px 16px;
    border-radius:14px;
    font-weight:900;
  }

  .notice{
    background:#ecfdf5;
    border:1px solid #a7f3d0;
    color:#065f46;
    padding:13px 16px;
    border-radius:14px;
    font-weight:900;
    margin-bottom:18px;
  }

  .intro{
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:22px;
    padding:18px;
    margin-bottom:18px;
    box-shadow:0 10px 24px rgba(15,23,42,0.06);
  }

  .intro strong{
    color:#111827;
  }

  .intro p{
    margin:8px 0;
    color:#374151;
    font-weight:700;
  }

  form{
    display:grid;
    gap:18px;
  }

  .printer-card{
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:24px;
    padding:20px;
    box-shadow:0 12px 28px rgba(15,23,42,0.07);
  }

  .printer-head{
    display:flex;
    justify-content:space-between;
    gap:14px;
    align-items:flex-start;
    margin-bottom:16px;
  }

  .printer-head h2{
    margin:0;
    font-size:24px;
  }

  .printer-head p{
    margin:6px 0 0 0;
    color:#6b7280;
    font-weight:700;
  }

  .printer-head span{
    background:#eff6ff;
    color:#1d4ed8;
    border:1px solid #bfdbfe;
    padding:7px 10px;
    border-radius:999px;
    font-size:12px;
    font-weight:900;
    white-space:nowrap;
  }

  .grid{
    display:grid;
    grid-template-columns:repeat(3, 1fr);
    gap:14px;
  }

  label{
    display:grid;
    gap:7px;
    font-size:13px;
    font-weight:900;
    color:#374151;
  }

  input,
  select{
    min-height:42px;
    border:1px solid #d1d5db;
    border-radius:12px;
    padding:0 11px;
    font-size:14px;
    font-weight:700;
    background:#ffffff;
    color:#111827;
    box-sizing:border-box;
    width:100%;
  }

  .checks{
    display:flex;
    flex-wrap:wrap;
    gap:12px;
    margin-top:14px;
  }

  .checks label{
    display:flex;
    align-items:center;
    gap:8px;
    background:#f9fafb;
    border:1px solid #e5e7eb;
    border-radius:12px;
    padding:10px 12px;
  }

  .checks input{
    width:18px;
    min-height:18px;
  }

  .test-row{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    margin-top:16px;
  }

  .btn-main,
  .btn-test,
  .btn-link{
    border:0;
    border-radius:14px;
    min-height:44px;
    padding:0 16px;
    font-weight:900;
    cursor:pointer;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    justify-content:center;
  }

  .btn-main{
    background:#111827;
    color:#ffffff;
    min-height:54px;
    font-size:16px;
    position:sticky;
    bottom:18px;
    box-shadow:0 14px 34px rgba(17,24,39,0.22);
  }

  .btn-test{
    background:#2563eb;
    color:#ffffff;
  }

  .btn-link{
    background:#f9fafb;
    color:#111827;
    border:1px solid #d1d5db;
  }

  @media(max-width:900px){
    .grid{
      grid-template-columns:1fr;
    }

    .topbar{
      flex-direction:column;
      align-items:flex-start;
    }

    .page{
      padding:18px;
    }
  }
</style>
</head>
<body>
  <main class="page">
    <div class="topbar">
      <div>
        <h1>Centro de impresión</h1>
        <p class="sub">Preparado para prueba, impresión del sistema y ESC/POS.</p>
      </div>

      <a class="btn-back" href="/configuracion">← Volver a configuración</a>
    </div>

    ${mensaje ? `<div class="notice">${escaparHTML(mensaje)}</div>` : ""}

    <div class="intro">
      <p><strong>Modo prueba / vista previa:</strong> ideal ahora, sin impresoras físicas.</p>
      <p><strong>Impresión del sistema:</strong> usará impresoras instaladas en el ordenador.</p>
      <p><strong>ESC/POS red/IP:</strong> pensado para térmicas de restaurante por red, puerto habitual 9100.</p>
      <p><strong>ESC/POS USB:</strong> reservado para una fase posterior.</p>
    </div>

    <form method="POST" action="/configuracion-impresoras">
      ${cards}

      <button class="btn-main" type="submit">
        Guardar centro de impresión
      </button>
    </form>
  </main>
</body>
</html>
  `;
}

function centroImpresionRoutes(db) {
  const router = express.Router();


  router.get("/api/centro-impresion", (req, res) => {
    if (!req.session || !req.session.usuario) {
      return res.status(401).json({
        ok: false,
        error: "No autorizado"
      });
    }

    cargarCentroImpresion(db, (err, config) => {
      if (err) {
        console.error("Error API centro de impresión:", err.message);
        return res.status(500).json({
          ok: false,
          error: "Error cargando centro de impresión"
        });
      }

      res.json({
        ok: true,
        config: config
      });
    });
  });

  router.get("/configuracion-impresoras", requiereConfig, (req, res) => {
    cargarCentroImpresion(db, (err, config) => {
      if (err) {
        console.error("Error cargando centro de impresión:", err.message);
        return res.status(500).send("Error cargando centro de impresión");
      }

      res.send(renderPagina(config, req.query.ok || ""));
    });
  });

  router.post("/configuracion-impresoras", requiereConfig, (req, res) => {
    const config = leerConfigFormulario(req.body || {});

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

  DESTINOS.forEach((destino) => {
    router.post("/configuracion-impresoras/probar-" + destino.id, requiereConfig, (req, res) => {
      const config = leerConfigFormulario(req.body || {});

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

    router.get("/configuracion-impresoras/ver-prueba/" + destino.id, requiereConfig, (req, res) => {
      const ruta = path.join(process.cwd(), "prints", destino.archivo);

      if (!fs.existsSync(ruta)) {
        return res.type("text/plain").send("Todavía no hay prueba generada para " + destino.titulo + ".");
      }

      res.type("text/plain").send(fs.readFileSync(ruta, "utf8"));
    });
  });

  router.post("/configuracion-impresoras/probar-ticket", requiereConfig, (req, res) => {
    req.url = "/configuracion-impresoras/probar-ticket";
    res.redirect("/configuracion-impresoras?ok=Usa el botón Ticket / caja del nuevo Centro de impresión");
  });

  return router;
}

module.exports = centroImpresionRoutes;
