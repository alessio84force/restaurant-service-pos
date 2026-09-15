const net = require("net");

function hostLocaleConsentito(
  host
) {

  const valore =
    String(host || "")
      .trim();

  if (!net.isIPv4(valore)) {
    return false;
  }

  const parti =
    valore
      .split(".")
      .map(Number);

  /*
   * Loopback consentito:
   * utile anche per test locali.
   */
  if (parti[0] === 127) {
    return true;
  }

  /*
   * RFC1918:
   * 10.0.0.0/8
   */
  if (parti[0] === 10) {
    return true;
  }

  /*
   * RFC1918:
   * 172.16.0.0/12
   */
  if (
    parti[0] === 172 &&
    parti[1] >= 16 &&
    parti[1] <= 31
  ) {
    return true;
  }

  /*
   * RFC1918:
   * 192.168.0.0/16
   */
  if (
    parti[0] === 192 &&
    parti[1] === 168
  ) {
    return true;
  }

  return false;
}

function inviaTcpEscpos(
  dispositivo,
  dati,
  opzioni
) {

  return new Promise(
    (resolve, reject) => {

      if (!dispositivo) {
        reject(
          new Error(
            "Stampante TCP ESC/POS mancante"
          )
        );
        return;
      }

      const host =
        String(
          dispositivo.host || ""
        ).trim();

      const port =
        Number(
          dispositivo.port ||
          9100
        );

      if (
        !hostLocaleConsentito(
          host
        )
      ) {
        reject(
          new Error(
            "Host TCP ESC/POS non consentito: " +
            host
          )
        );
        return;
      }

      if (
        !Number.isInteger(port) ||
        port <= 0 ||
        port > 65535
      ) {
        reject(
          new Error(
            "Porta TCP ESC/POS non valida"
          )
        );
        return;
      }

      const buffer =
        Buffer.isBuffer(dati)
          ? dati
          : Buffer.from(
              dati || ""
            );

      if (!buffer.length) {
        reject(
          new Error(
            "Contenuto TCP ESC/POS vuoto"
          )
        );
        return;
      }

      const timeoutMs =
        Math.max(
          1000,
          Math.min(
            30000,
            Number(
              opzioni &&
              opzioni.timeoutMs
            ) || 15000
          )
        );

      const socket =
        new net.Socket();

      let concluso =
        false;

      function errore(err) {

        if (concluso) {
          return;
        }

        concluso =
          true;

        try {
          socket.destroy();
        } catch (_) {}

        reject(
          err instanceof Error
            ? err
            : new Error(
                String(err)
              )
        );
      }

      function successo() {

        if (concluso) {
          return;
        }

        concluso =
          true;

        resolve({
          ok: true,
          host:
            host,
          port:
            port,
          bytes:
            buffer.length
        });
      }

      socket.setTimeout(
        timeoutMs
      );

      socket.setNoDelay(
        true
      );

      socket.once(
        "timeout",
        () => {
          errore(
            new Error(
              "Timeout TCP ESC/POS verso " +
              host +
              ":" +
              port
            )
          );
        }
      );

      socket.once(
        "error",
        errore
      );

      socket.once(
        "close",
        (conErrore) => {

          if (
            !concluso &&
            !conErrore
          ) {
            errore(
              new Error(
                "Connessione TCP ESC/POS chiusa prima del completamento"
              )
            );
          }
        }
      );

      socket.once(
        "connect",
        () => {

          socket.end(
            buffer
          );

        }
      );

      socket.once(
        "finish",
        successo
      );

      socket.connect(
        port,
        host
      );
    }
  );
}

module.exports = {
  hostLocaleConsentito,
  inviaTcpEscpos
};
