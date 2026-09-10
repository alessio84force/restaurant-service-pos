"use strict";

const http = require("http");

const HOST = "127.0.0.1";
const PORT = 18080;

function rispostaStatoXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Service>
  <Request>
    <errorCode>0</errorCode>
    <printerError>0</printerError>
    <paperEnd>0</paperEnd>
    <coverOpen>0</coverOpen>
    <lastCmd>0</lastCmd>
    <mode>REG</mode>
    <idleState>0</idleState>
    <lastZ>499</lastZ>
    <lastDocF>1</lastDocF>
    <lastDocNF>0</lastDocNF>
    <lastCreditNoteN>0</lastCreditNoteN>
    <lastInvoiceN>0</lastInvoiceN>
    <busy>0</busy>
  </Request>
</Service>`;
}

function rispostaConfigurazioneXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Service>

  <Request>
    <errorCode>0</errorCode>
    <printerError>0</printerError>
    <paperEnd>0</paperEnd>
    <coverOpen>0</coverOpen>
    <lastCmd>0</lastCmd>
    <mode>REG</mode>
    <idleState>0</idleState>
    <lastZ>499</lastZ>
    <lastDocF>1</lastDocF>
    <lastDocNF>0</lastDocNF>
    <lastCreditNoteN>0</lastCreditNoteN>
    <lastInvoiceN>0</lastInvoiceN>
    <busy>0</busy>
  </Request>

  <Prg>

    <Department id="1">
      <txt>RISTORAZIONE</txt>

      <vatCode>
        <value>1</value>
      </vatCode>

      <groupCode>
        <value>1</value>
      </groupCode>
    </Department>

    <VAT id="1">
      <value>10</value>
    </VAT>

    <Payment id="1">
      <txt>TEST CARTA</txt>

      <change>
        <enabled>0</enabled>
      </change>

      <cash>
        <enabled>0</enabled>
      </cash>

      <credit>
        <enabled>0</enabled>
      </credit>

      <drawer>
        <enabled>0</enabled>
      </drawer>
    </Payment>

    <Payment id="2">
      <txt>CONTANTI</txt>

      <change>
        <enabled>1</enabled>
      </change>

      <cash>
        <enabled>1</enabled>
      </cash>

      <credit>
        <enabled>0</enabled>
      </credit>

      <drawer>
        <enabled>1</enabled>
      </drawer>
    </Payment>

  </Prg>

</Service>`;
}

function rispostaErroreXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Service>
  <Request>
    <errorCode>99</errorCode>
    <printerError>0</printerError>
    <paperEnd>0</paperEnd>
    <coverOpen>0</coverOpen>
    <lastCmd>0</lastCmd>
    <mode>REG</mode>
    <idleState>0</idleState>
    <lastZ>499</lastZ>
    <lastDocF>1</lastDocF>
    <busy>0</busy>
  </Request>
</Service>`;
}

const server = http.createServer(
  function(req, res) {
    if (
      req.method !== "POST" ||
      req.url !== "/service.cgi"
    ) {
      res.writeHead(
        404,
        {
          "Content-Type":
            "text/plain; charset=utf-8"
        }
      );

      res.end("Not Found");
      return;
    }

    const parti = [];

    req.on(
      "data",
      function(chunk) {
        parti.push(chunk);
      }
    );

    req.on(
      "end",
      function() {
        const corpo =
          Buffer.concat(parti)
            .toString("utf8");

        console.log("");
        console.log(
          "=== RICHIESTA RCH RICEVUTA ==="
        );
        console.log(corpo);

        let xml;

        if (corpo.indexOf("/?s") !== -1) {
          console.log(
            "TIPO: LETTURA STATO"
          );

          xml =
            rispostaStatoXml();
        } else if (
          corpo.indexOf("/?C") !== -1
        ) {
          console.log(
            "TIPO: LETTURA CONFIGURAZIONE"
          );

          xml =
            rispostaConfigurazioneXml();
        } else {
          console.log(
            "TIPO: COMANDO NON RICONOSCIUTO"
          );

          xml =
            rispostaErroreXml();
        }

        console.log("");
        console.log(
          "=== RISPOSTA SIMULATA ==="
        );
        console.log(xml);

        res.writeHead(
          200,
          {
            "Content-Type":
              "application/xml; charset=utf-8",
            "Content-Length":
              Buffer.byteLength(xml),
            "Connection":
              "close"
          }
        );

        res.end(xml);
      }
    );
  }
);

server.listen(
  PORT,
  HOST,
  function() {
    console.log(
      "[RCH Simulator] Attivo su http://" +
      HOST +
      ":" +
      PORT +
      "/service.cgi"
    );

    console.log(
      "[RCH Simulator] Nessun dispositivo fiscale reale coinvolto"
    );
  }
);

function arresta() {
  console.log("");
  console.log(
    "[RCH Simulator] Arresto..."
  );

  server.close(function() {
    process.exit(0);
  });
}

process.once(
  "SIGINT",
  arresta
);

process.once(
  "SIGTERM",
  arresta
);
