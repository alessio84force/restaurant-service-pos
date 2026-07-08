const net = require("net");

function limpiarTextoEscpos(texto) {
  return String(texto || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[^\x09\x0A\x0D\x20-\x7EÁÉÍÓÚÜÑáéíóúüñ€]/g, "");
}

function crearBufferEscpos(texto, opciones) {
  const opts = opciones || {};
  const partes = [];

  // Inicializar impresora
  partes.push(Buffer.from([0x1b, 0x40]));

  // Alineación izquierda
  partes.push(Buffer.from([0x1b, 0x61, 0x00]));

  // Texto principal
  partes.push(Buffer.from(limpiarTextoEscpos(texto), "utf8"));

  // Espacio final
  partes.push(Buffer.from("\n\n\n", "utf8"));

  // Abrir cajón portamonedas, si procede
  if (Number(opts.cajon) === 1) {
    partes.push(Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]));
  }

  // Cortar papel, si procede
  if (Number(opts.cortar) === 1) {
    partes.push(Buffer.from([0x1d, 0x56, 0x42, 0x00]));
  }

  return Buffer.concat(partes);
}

function enviarEscposRed(opciones, callback) {
  const opts = opciones || {};
  const ip = String(opts.ip || "").trim();
  const puerto = Number(opts.puerto || 9100);
  const timeoutMs = Number(opts.timeoutMs || 1800);

  if (!ip) {
    return callback(null, {
      ok: false,
      motivo: "Sin IP configurada"
    });
  }

  const buffer = crearBufferEscpos(opts.texto || "", {
    cortar: opts.cortar,
    cajon: opts.cajon
  });

  let terminado = false;

  function finalizar(err, resultado) {
    if (terminado) return;
    terminado = true;
    callback(err, resultado);
  }

  const socket = new net.Socket();

  socket.setTimeout(timeoutMs);

  socket.connect(puerto, ip, () => {
    socket.write(buffer, () => {
      socket.end();
      finalizar(null, {
        ok: true,
        ip: ip,
        puerto: puerto,
        bytes: buffer.length
      });
    });
  });

  socket.on("timeout", () => {
    socket.destroy();
    finalizar(null, {
      ok: false,
      ip: ip,
      puerto: puerto,
      motivo: "Timeout conectando con impresora"
    });
  });

  socket.on("error", (err) => {
    socket.destroy();
    finalizar(null, {
      ok: false,
      ip: ip,
      puerto: puerto,
      motivo: err.message
    });
  });
}

module.exports = {
  crearBufferEscpos,
  enviarEscposRed
};
