const { enviarEscposRed } = require("./escposRed");

function configBaseImpresionRuntime() {
  return {
    ticket: { modo: "preview", ip: "", puerto: "9100", cortar: 1, cajon: 1 },
    bar: { modo: "preview", ip: "", puerto: "9100", cortar: 1, cajon: 0 },
    cocina: { modo: "preview", ip: "", puerto: "9100", cortar: 1, cajon: 0 },
    reportes: { modo: "preview", ip: "", puerto: "", cortar: 0, cajon: 0 }
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

      Object.keys(base).forEach((destino) => {
        base[destino] = Object.assign({}, base[destino], guardada[destino] || {});
      });

      return callback(null, base);
    } catch (e) {
      return callback(null, base);
    }
  });
}

function imprimirCentroImpresion(db, destino, texto, callback) {
  const destinoId = String(destino || "").toLowerCase();

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

    const c = config[destinoId] || {};
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
