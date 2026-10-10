const {
  execFile
} = require("child_process");

const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  scopriStampanti
} = require("./scopriStampanti");

const {
  inviaUsbEscposMacOS
} = require("./usbEscposMac");

const {
  inviaTcpEscpos
} = require("./tcpEscpos");

const {
  profiloPerStampante
} = require("./profiliStampanti");

function esegui(comando, args) {
  return new Promise(
    (resolve, reject) => {
      execFile(
        comando,
        args || [],
        {
          encoding: "utf8"
        },
        (err, stdout, stderr) => {
          if (err) {
            err.stdout =
              String(stdout || "");

            err.stderr =
              String(stderr || "");

            return reject(err);
          }

          resolve({
            stdout:
              String(stdout || ""),
            stderr:
              String(stderr || "")
          });
        }
      );
    }
  );
}

function aspetta(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

function trovaStampante(idONome) {
  const cercata =
    String(idONome || "").trim();

  if (!cercata) {
    return null;
  }

  const stampanti =
    scopriStampanti();

  return (
    stampanti.find(
      (s) => s.id === cercata
    ) ||
    stampanti.find(
      (s) => s.nome === cercata
    ) ||
    null
  );
}

function estraiJobId(
  risposta,
  nomeStampante
) {
  const escaped =
    String(nomeStampante)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

  const match =
    String(risposta || "")
      .match(
        new RegExp(
          escaped + "-(\\d+)"
        )
      );

  if (!match) {
    return null;
  }

  return (
    nomeStampante +
    "-" +
    match[1]
  );
}

async function lavoroAncoraInCoda(
  nomeStampante,
  jobId
) {
  const risultato =
    await esegui(
      "/usr/bin/lpstat",
      [
        "-W",
        "not-completed",
        "-o",
        nomeStampante
      ]
    );

  return risultato.stdout
    .split(/\r?\n/)
    .some(
      (riga) =>
        riga.trim()
          .startsWith(
            jobId + " "
          ) ||
        riga.trim() === jobId
    );
}

async function cancellaLavoro(
  jobId
) {
  try {
    await esegui(
      "/usr/bin/cancel",
      [jobId]
    );
  } catch (_) {}
}


function normalizzaTestoEscPos(
  testo
) {
  return String(testo || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^\x0A\x0D\x20-\x7E]/g,
      "?"
    );
}

function creaBufferEscPos(
  testo,
  stampante
) {

  const contenuto =
    normalizzaTestoEscPos(
      testo
    );

  const profilo =
    profiloPerStampante(
      stampante
    );

  const blocchi = [
    Buffer.from(
      [
        0x1B,
        0x40
      ]
    ),

    Buffer.from(
      contenuto,
      "ascii"
    ),

    Buffer.from(
      "\n\n\n",
      "ascii"
    )
  ];

  /*
   * Taglio automatico soltanto
   * per profili verificati.
   *
   * Epson TM:
   * GS V 1 = taglio parziale.
   */
  if (
    profilo.capacita.taglio ===
      true &&
    profilo.capacita
      .taglio_comando ===
      "gs_v_1_partial"
  ) {

    blocchi.push(
      Buffer.from(
        [
          0x1D,
          0x56,
          0x01
        ]
      )
    );
  }

  return Buffer.concat(
    blocchi
  );
}


function inviaWindowsRaw(
  stampante,
  dati,
  opzioni
) {

  return new Promise(
    (resolve, reject) => {

      if (
        os.platform() !== "win32"
      ) {
        reject(
          new Error(
            "Spooler Windows disponibile solo su win32"
          )
        );
        return;
      }

      const nome =
        String(
          stampante &&
          stampante.nome ||
          ""
        ).trim();

      if (!nome) {
        reject(
          new Error(
            "Nome stampante Windows mancante"
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
            "Contenuto RAW Windows vuoto"
          )
        );
        return;
      }

      const token =
        Date.now() +
        "-" +
        Math.random()
          .toString(16)
          .slice(2);

      const fileDati =
        path.join(
          os.tmpdir(),
          "rsp-win-raw-" +
          token +
          ".bin"
        );

      const fileScript =
        path.join(
          os.tmpdir(),
          "rsp-win-raw-" +
          token +
          ".ps1"
        );

      const script = [
        'param([string]$PrinterName,[string]$FilePath)',
        '$ErrorActionPreference = "Stop"',
        '$source = @"',
        'using System;',
        'using System.Runtime.InteropServices;',
        'public class RawPrinter {',
        '  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]',
        '  public class DOC_INFO_1 {',
        '    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;',
        '    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;',
        '    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;',
        '  }',
        '  [DllImport("winspool.drv", EntryPoint="OpenPrinterW", SetLastError=true, CharSet=CharSet.Unicode)]',
        '  public static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);',
        '  [DllImport("winspool.drv", SetLastError=true)]',
        '  public static extern bool ClosePrinter(IntPtr handle);',
        '  [DllImport("winspool.drv", EntryPoint="StartDocPrinterW", SetLastError=true, CharSet=CharSet.Unicode)]',
        '  public static extern int StartDocPrinter(IntPtr handle, int level, [In] DOC_INFO_1 info);',
        '  [DllImport("winspool.drv", SetLastError=true)]',
        '  public static extern bool EndDocPrinter(IntPtr handle);',
        '  [DllImport("winspool.drv", SetLastError=true)]',
        '  public static extern bool StartPagePrinter(IntPtr handle);',
        '  [DllImport("winspool.drv", SetLastError=true)]',
        '  public static extern bool EndPagePrinter(IntPtr handle);',
        '  [DllImport("winspool.drv", SetLastError=true)]',
        '  public static extern bool WritePrinter(IntPtr handle, byte[] bytes, int count, out int written);',
        '}',
        '"@',
        'Add-Type -TypeDefinition $source',
        '$bytes = [IO.File]::ReadAllBytes($FilePath)',
        '$handle = [IntPtr]::Zero',
        'if (-not [RawPrinter]::OpenPrinter($PrinterName,[ref]$handle,[IntPtr]::Zero)) { throw "OpenPrinter fallita" }',
        '$docStarted = $false',
        '$pageStarted = $false',
        'try {',
        '  $doc = New-Object RawPrinter+DOC_INFO_1',
        '  $doc.pDocName = "Restaurant Service POS"',
        '  $doc.pOutputFile = $null',
        '  $doc.pDataType = "RAW"',
        '  $job = [RawPrinter]::StartDocPrinter($handle,1,$doc)',
        '  if ($job -le 0) { throw "StartDocPrinter fallita" }',
        '  $docStarted = $true',
        '  if (-not [RawPrinter]::StartPagePrinter($handle)) { throw "StartPagePrinter fallita" }',
        '  $pageStarted = $true',
        '  $written = 0',
        '  if (-not [RawPrinter]::WritePrinter($handle,$bytes,$bytes.Length,[ref]$written)) { throw "WritePrinter fallita" }',
        '  if ($written -ne $bytes.Length) { throw "Scrittura RAW incompleta" }',
        '  Write-Output ("job=" + $job + " bytes=" + $written)',
        '} finally {',
        '  if ($pageStarted) { [RawPrinter]::EndPagePrinter($handle) | Out-Null }',
        '  if ($docStarted) { [RawPrinter]::EndDocPrinter($handle) | Out-Null }',
        '  [RawPrinter]::ClosePrinter($handle) | Out-Null',
        '}'
      ].join("\r\n");

      fs.writeFileSync(
        fileDati,
        buffer
      );

      fs.writeFileSync(
        fileScript,
        script,
        "utf8"
      );

      const timeoutMs =
        Number(
          opzioni &&
          opzioni.timeoutMs
        ) || 15000;

      execFile(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          fileScript,
          "-PrinterName",
          nome,
          "-FilePath",
          fileDati
        ],
        {
          encoding:
            "utf8",
          windowsHide:
            true,
          timeout:
            timeoutMs
        },
        (err, stdout, stderr) => {

          try {
            fs.unlinkSync(
              fileDati
            );
          } catch (_) {}

          try {
            fs.unlinkSync(
              fileScript
            );
          } catch (_) {}

          if (err) {
            err.stdout =
              String(
                stdout || ""
              );

            err.stderr =
              String(
                stderr || ""
              );

            reject(err);
            return;
          }

          resolve({
            ok:
              true,

            stdout:
              String(
                stdout || ""
              ).trim(),

            bytes:
              buffer.length
          });
        }
      );
    }
  );
}

async function stampaTesto(
  idONome,
  testo,
  opzioni
) {
  const stampante =
    trovaStampante(idONome);

  if (!stampante) {
    throw new Error(
      "Stampante non trovata: " +
      idONome
    );
  }

  const contenuto =
    String(testo || "");

  if (!contenuto) {
    throw new Error(
      "Contenuto stampa vuoto"
    );
  }

  const timeoutMs =
    Number(
      opzioni &&
      opzioni.timeoutMs
    ) || 15000;

  const intervalloMs =
    Number(
      opzioni &&
      opzioni.intervalloMs
    ) || 1000;

  if (
    stampante.trasporto ===
    "usb_escpos"
  ) {
    const dati =
      creaBufferEscPos(
        contenuto,
        stampante
      );

    const risultato =
      inviaUsbEscposMacOS(
        stampante,
        dati,
        {
          timeoutMs: timeoutMs
        }
      );

    return {
      ok: true,
      stampante:
        stampante.nome,
      printer_id:
        stampante.id,
      job_id:
        "usb-" +
        Date.now(),
      risposta:
        risultato.stdout,
      trasporto:
        "usb_escpos"
    };
  }

  if (
    stampante.trasporto ===
    "winspool_raw"
  ) {

    const dati =
      creaBufferEscPos(
        contenuto,
        stampante
      );

    const risultato =
      await inviaWindowsRaw(
        stampante,
        dati,
        {
          timeoutMs:
            timeoutMs
        }
      );

    return {
      ok:
        true,

      stampante:
        stampante.nome,

      printer_id:
        stampante.id,

      job_id:
        "win-" +
        Date.now(),

      risposta:
        risultato.stdout,

      trasporto:
        "winspool_raw"
    };
  }

  if (
    stampante.trasporto ===
    "tcp_escpos"
  ) {

    const dati =
      creaBufferEscPos(
        contenuto,
        stampante
      );

    const risultato =
      await inviaTcpEscpos(
        stampante,
        dati,
        {
          timeoutMs:
            timeoutMs
        }
      );

    return {
      ok: true,

      stampante:
        stampante.nome,

      printer_id:
        stampante.id,

      job_id:
        "tcp-" +
        Date.now(),

      risposta:
        "bytes=" +
        risultato.bytes,

      trasporto:
        "tcp_escpos"
    };
  }

  const file =
    path.join(
      os.tmpdir(),
      "rsp-print-" +
        Date.now() +
        "-" +
        Math.random()
          .toString(16)
          .slice(2) +
        ".txt"
    );

  fs.writeFileSync(
    file,
    contenuto,
    "utf8"
  );

  let jobId = null;

  try {
    const invio =
      await esegui(
        "/usr/bin/lp",
        [
          "-d",
          stampante.nome,
          file
        ]
      );

    jobId =
      estraiJobId(
        invio.stdout,
        stampante.nome
      );

    if (!jobId) {
      throw new Error(
        "CUPS ha accettato il lavoro ma non e' stato possibile leggere il job ID"
      );
    }

    const inizio =
      Date.now();

    while (
      Date.now() - inizio <
      timeoutMs
    ) {
      const ancora =
        await lavoroAncoraInCoda(
          stampante.nome,
          jobId
        );

      if (!ancora) {
        return {
          ok: true,
          stampante:
            stampante.nome,
          printer_id:
            stampante.id,
          job_id:
            jobId,
          risposta:
            invio.stdout.trim()
        };
      }

      await aspetta(
        intervalloMs
      );
    }

    await cancellaLavoro(
      jobId
    );

    throw new Error(
      "Timeout stampa: il lavoro " +
      jobId +
      " e' rimasto nella coda CUPS ed e' stato cancellato"
    );
  } finally {
    try {
      fs.unlinkSync(file);
    } catch (_) {}
  }
}

function stampaTest(idONome) {
  const stampante =
    trovaStampante(idONome);

  if (!stampante) {
    return Promise.reject(
      new Error(
        "Stampante non trovata: " +
        idONome
      )
    );
  }

  const testo = [
    "",
    "RESTAURANT SERVICE POS",
    "PRINT BRIDGE",
    "",
    "PROVA DI STAMPA",
    "------------------------------",
    "Stampante: " +
      stampante.nome,
    "ID: " +
      stampante.id,
    "",
    "Test Print Bridge V2.14.0",
    "",
    new Date().toISOString(),
    "",
    ""
  ].join("\n");

  return stampaTesto(
    stampante.id,
    testo
  );
}

module.exports = {

  creaBufferEscPos,
  trovaStampante,
  stampaTesto,
  stampaTest
};
