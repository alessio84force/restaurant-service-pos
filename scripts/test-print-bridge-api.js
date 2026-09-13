const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const express =
  require("express");

const sqlite3 =
  require("sqlite3").verbose();

const {
  prepararPrintBridge
} = require(
  "../server/migrations/printBridge"
);

const {
  accodaLavoro
} = require(
  "../server/printing/printBridgeQueue"
);

const {
  creaTokenBridge,
  hashToken
} = require(
  "../server/printing/printBridgeAuth"
);

const printBridgeApiRoutes =
  require(
    "../server/routes/printBridgeApi"
  );

const dbFile =
  path.join(
    os.tmpdir(),
    "rsp-print-bridge-api-test.db"
  );

try {
  fs.unlinkSync(dbFile);
} catch (_) {}

const db =
  new sqlite3.Database(dbFile);

function prepara() {
  return new Promise(
    (resolve, reject) => {
      prepararPrintBridge(
        db,
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    }
  );
}

function get(sql, params) {
  return new Promise(
    (resolve, reject) => {
      db.get(
        sql,
        params || [],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    }
  );
}

function assert(condizione, messaggio) {
  if (!condizione) {
    throw new Error(
      "TEST FALLITO: " +
      messaggio
    );
  }
}

function richiesta(
  porta,
  metodo,
  percorso,
  token,
  bridgeId,
  body
) {
  return new Promise(
    (resolve, reject) => {
      const contenuto =
        body == null
          ? ""
          : JSON.stringify(body);

      const headers = {};

      if (token) {
        headers.Authorization =
          "Bearer " + token;
      }

      if (bridgeId) {
        headers[
          "X-RSP-Bridge-ID"
        ] = bridgeId;
      }

      if (contenuto) {
        headers[
          "Content-Type"
        ] = "application/json";

        headers[
          "Content-Length"
        ] = Buffer.byteLength(
          contenuto
        );
      }

      const req =
        http.request(
          {
            hostname: "127.0.0.1",
            port: porta,
            path: percorso,
            method: metodo,
            headers
          },
          (res) => {
            let testo = "";

            res.setEncoding("utf8");

            res.on(
              "data",
              (chunk) => {
                testo += chunk;
              }
            );

            res.on(
              "end",
              () => {
                let json = null;

                try {
                  json =
                    JSON.parse(testo);
                } catch (_) {}

                resolve({
                  status:
                    res.statusCode,
                  json,
                  testo
                });
              }
            );
          }
        );

      req.on(
        "error",
        reject
      );

      if (contenuto) {
        req.write(contenuto);
      }

      req.end();
    }
  );
}

async function main() {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "TEST PRINT BRIDGE API"
  );
  console.log(
    "========================================"
  );

  await prepara();

  const token14 =
    await creaTokenBridge(
      db,
      14,
      "Bridge ristorante 14"
    );

  const token15 =
    await creaTokenBridge(
      db,
      15,
      "Bridge ristorante 15"
    );

  const config14 =
    await get(
      `
      SELECT *
      FROM print_bridge_config
      WHERE restaurante_id=14
      `
    );

  assert(
    config14.token_hash ===
      hashToken(token14.token),
    "hash token errato"
  );

  assert(
    config14.token_hash !==
      token14.token,
    "token salvato in chiaro"
  );

  await accodaLavoro(
    db,
    {
      restaurante_id: 14,
      idempotency_key:
        "api:r14:1",
      destino: "cocina",
      contenuto:
        "COMANDA RISTORANTE 14"
    }
  );

  await accodaLavoro(
    db,
    {
      restaurante_id: 14,
      idempotency_key:
        "api:r14:2",
      destino: "bar",
      contenuto:
        "COMANDA BAR RISTORANTE 14"
    }
  );

  await accodaLavoro(
    db,
    {
      restaurante_id: 15,
      idempotency_key:
        "api:r15:1",
      destino: "cocina",
      contenuto:
        "COMANDA RISTORANTE 15"
    }
  );

  const app =
    express();

  app.use(
    printBridgeApiRoutes(db)
  );

  const server =
    await new Promise(
      (resolve) => {
        const s =
          app.listen(
            0,
            "127.0.0.1",
            () => resolve(s)
          );
      }
    );

  const porta =
    server.address().port;

  try {
    const senzaToken =
      await richiesta(
        porta,
        "GET",
        "/api/print-bridge/ping"
      );

    assert(
      senzaToken.status === 401,
      "accesso senza token consentito"
    );

    const tokenFalso =
      await richiesta(
        porta,
        "GET",
        "/api/print-bridge/ping",
        "token-non-valido"
      );

    assert(
      tokenFalso.status === 401,
      "token falso accettato"
    );

    const ping14 =
      await richiesta(
        porta,
        "GET",
        "/api/print-bridge/ping",
        token14.token
      );

    assert(
      ping14.status === 200 &&
      ping14.json &&
      Number(
        ping14.json.restaurante_id
      ) === 14,
      "token r14 non identifica r14"
    );

    const heartbeat =
      await richiesta(
        porta,
        "POST",
        "/api/print-bridge/heartbeat",
        token14.token,
        "bridge-r14-api-test",
        {
          bridge_nome:
            "Mac test",
          bridge_version:
            "2.14.0"
        }
      );

    assert(
      heartbeat.status === 200 &&
      heartbeat.json.ok === true,
      "heartbeat fallito"
    );

    const claim14 =
      await richiesta(
        porta,
        "POST",
        "/api/print-bridge/jobs/claim",
        token14.token,
        "bridge-r14-api-test"
      );

    assert(
      claim14.status === 200 &&
      claim14.json &&
      claim14.json.lavoro &&
      Number(
        claim14.json.lavoro
          .restaurante_id
      ) === 14,
      "r14 non riceve lavoro r14"
    );

    assert(
      claim14.json.lavoro
        .contenido ===
        "COMANDA RISTORANTE 14",
      "contenuto lavoro errato"
    );

    const ackBridgeSbagliato =
      await richiesta(
        porta,
        "POST",
        "/api/print-bridge/jobs/" +
          claim14.json.lavoro.id +
          "/printed",
        token14.token,
        "bridge-diverso"
      );

    assert(
      ackBridgeSbagliato.status ===
        409,
      "bridge diverso ha confermato lavoro"
    );

    const ack14 =
      await richiesta(
        porta,
        "POST",
        "/api/print-bridge/jobs/" +
          claim14.json.lavoro.id +
          "/printed",
        token14.token,
        "bridge-r14-api-test"
      );

    assert(
      ack14.status === 200 &&
      ack14.json.estado ===
        "impreso",
      "ack corretto fallito"
    );

    const claim14Secondo =
      await richiesta(
        porta,
        "POST",
        "/api/print-bridge/jobs/claim",
        token14.token,
        "bridge-r14-api-test"
      );

    assert(
      claim14Secondo.status ===
        200 &&
      claim14Secondo.json.lavoro &&
      claim14Secondo.json.lavoro
        .destino === "bar",
      "secondo lavoro r14 non ricevuto"
    );

    const errore14 =
      await richiesta(
        porta,
        "POST",
        "/api/print-bridge/jobs/" +
          claim14Secondo.json
            .lavoro.id +
          "/error",
        token14.token,
        "bridge-r14-api-test",
        {
          error:
            "stampante offline"
        }
      );

    assert(
      errore14.status === 200 &&
      errore14.json.estado ===
        "error",
      "segnalazione errore fallita"
    );

    const claim14Vuoto =
      await richiesta(
        porta,
        "POST",
        "/api/print-bridge/jobs/claim",
        token14.token,
        "bridge-r14-api-test"
      );

    assert(
      claim14Vuoto.status === 200 &&
      claim14Vuoto.json.lavoro ===
        null,
      "r14 vede lavori non suoi"
    );

    const claim15 =
      await richiesta(
        porta,
        "POST",
        "/api/print-bridge/jobs/claim",
        token15.token,
        "bridge-r15-api-test"
      );

    assert(
      claim15.status === 200 &&
      claim15.json.lavoro &&
      Number(
        claim15.json.lavoro
          .restaurante_id
      ) === 15,
      "r15 non riceve il suo lavoro"
    );

    const configAggiornata =
      await get(
        `
        SELECT *
        FROM print_bridge_config
        WHERE restaurante_id=14
        `
      );

    assert(
      configAggiornata
        .ultimo_contacto,
      "heartbeat non registrato"
    );

    assert(
      configAggiornata
        .bridge_version ===
        "2.14.0",
      "versione bridge non registrata"
    );

    console.log("");
    console.log(
      "TOKEN HASH: OK"
    );
    console.log(
      "ACCESSO SENZA TOKEN: BLOCCATO"
    );
    console.log(
      "TOKEN ERRATO: BLOCCATO"
    );
    console.log(
      "TOKEN -> RISTORANTE: OK"
    );
    console.log(
      "MULTI-TENANT API: OK"
    );
    console.log(
      "BRIDGE ID: OK"
    );
    console.log(
      "HEARTBEAT: OK"
    );
    console.log(
      "CLAIM API: OK"
    );
    console.log(
      "ACK API: OK"
    );
    console.log(
      "ERROR API: OK"
    );

    console.log("");
    console.log(
      "TEST PRINT BRIDGE API: SUPERATO"
    );
  } finally {
    await new Promise(
      (resolve) =>
        server.close(resolve)
    );
  }
}

main()
  .catch((err) => {
    console.error("");
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    db.close();
  });
