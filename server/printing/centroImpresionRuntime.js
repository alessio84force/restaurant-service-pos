const { enviarEscposRed } = require("./escposRed");

function normalizarDestinoRuntime(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function configDefaultRuntime(destino) {
  if (destino === "ticket") {
    return { modo: "preview", tipo: "termica", nombre: "", ancho: "80", ip: "", puerto: "9100", cortar: 1, cajon: 1 };
  }

  if (destino === "reportes") {
    return { modo: "preview", tipo: "a4", nombre: "", ancho: "A4", ip: "", puerto: "", cortar: 0, cajon: 0 };
  }

  return { modo: "preview", tipo: "termica", nombre: "", ancho: "80", ip: "", puerto: "9100", cortar: 1, cajon: 0 };
}

function configBaseImpresionRuntime() {
  return {
    ticket: configDefaultRuntime("ticket"),
    bar: configDefaultRuntime("bar"),
    cocina: configDefaultRuntime("cocina"),
    reportes: configDefaultRuntime("reportes")
  };
}

function cargarConfigImpresionRuntime(db, callback) {
  db.get("SELECT config_impresion_json FROM configurazione WHERE id=1", [], (err, fila) => {
    if (err) {
      return callback(err);
    }

    const base = configBaseImpresionRuntime();

    if (!fila || !fila.config_impresion_json) {
      return callback(null, base);
    }

    try {
      const guardada = JSON.parse(fila.config_impresion_json);

      Object.keys(guardada || {}).forEach((destinoOriginal) => {
        const destino = normalizarDestinoRuntime(destinoOriginal);

        if (!destino) return;

        base[destino] = Object.assign(
          {},
          base[destino] || configDefaultRuntime(destino),
          guardada[destinoOriginal] || {}
        );
      });

      return callback(null, base);
    } catch (e) {
      return callback(null, base);
    }
  });
}

function imprimirCentroImpresion(db, destino, texto, callback) {
  const destinoId = normalizarDestinoRuntime(destino);

  cargarConfigImpresionRuntime(db, (err, config) => {
    if (err) {
      console.log("[IMPRESION] Error cargando configuración:", err.message);

      if (callback) {
        callback({
          ok: false,
          destino: destinoId,
          error: err.message
        });
      }

      return;
    }

    const c = config[destinoId] || configDefaultRuntime(destinoId);
    const modo = String(c.modo || "preview");

    if (modo !== "escpos_red") {
      if (callback) {
        callback({
          ok: true,
          destino: destinoId,
          modo: modo,
          accion: "sin_impresion_directa"
        });
      }

      return;
    }

    enviarEscposRed({
      ip: c.ip,
      puerto: c.puerto || 9100,
      texto: texto,
      cortar: c.cortar,
      cajon: c.cajon,
      timeoutMs: 1800
    }, (errEnvio, resultado) => {
      const salida = resultado || {
        ok: false,
        motivo: errEnvio ? errEnvio.message : "Error desconocido"
      };

      if (salida.ok) {
        console.log("[IMPRESION ESC/POS]", destinoId, "OK", salida.ip + ":" + salida.puerto, salida.bytes + " bytes");
      } else {
        console.log("[IMPRESION ESC/POS]", destinoId, "NO ENVIADA:", salida.motivo || "sin detalle");
      }

      if (callback) {
        callback(Object.assign({
          destino: destinoId,
          modo: "escpos_red"
        }, salida));
      }
    });
  });
}

module.exports = {
  imprimirCentroImpresion
};
