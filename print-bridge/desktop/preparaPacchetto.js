"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const {
  verificaDistribuzione
} = require("./distribuzione");

const root = path.resolve(__dirname, "../..");

const manifestSorgente = path.join(
  __dirname,
  "package.desktop.json"
);

function hash(file) {
  return crypto.createHash("sha256")
    .update(fs.readFileSync(file))
    .digest("hex");
}

function elencaFile(directory, base = directory) {
  const risultato = [];

  for (const voce of fs.readdirSync(directory)) {
    const completo = path.join(directory, voce);
    const stat = fs.lstatSync(completo);

    if (stat.isSymbolicLink()) {
      throw new Error("Collegamento simbolico non ammesso");
    }

    if (stat.isDirectory()) {
      risultato.push(...elencaFile(completo, base));
    } else if (stat.isFile()) {
      risultato.push(
        path.relative(base, completo).split(path.sep).join("/")
      );
    } else {
      throw new Error("Elemento inatteso nel pacchetto");
    }
  }

  return risultato.sort();
}

function preparaPacchetto() {
  const verifica = verificaDistribuzione();

  if (!verifica.ok || verifica.files.length !== 21) {
    throw new Error("Elenco distribuzione inatteso");
  }

  const manifestStat = fs.lstatSync(manifestSorgente);

  if (
    !manifestStat.isFile() ||
    manifestStat.isSymbolicLink()
  ) {
    throw new Error("Manifest Desktop non sicuro");
  }

  const manifest = JSON.parse(
    fs.readFileSync(manifestSorgente, "utf8")
  );

  if (
    manifest.name !== "restaurant-service-print-bridge" ||
    manifest.version !== "2.15.0" ||
    manifest.main !== "print-bridge/desktop/electronMain.js" ||
    manifest.private !== true ||
    manifest.dependencies !== undefined ||
    manifest.devDependencies !== undefined
  ) {
    throw new Error("Manifest Desktop inatteso");
  }

  const destinazione = fs.mkdtempSync(
    path.join(os.tmpdir(), "rsp-desktop-v215-")
  );

  fs.chmodSync(destinazione, 0o700);

  const copie = [];

  for (const relativo of verifica.files) {
    const origine = path.join(root, relativo);
    const arrivo = path.join(destinazione, relativo);

    fs.mkdirSync(path.dirname(arrivo), {
      recursive: true,
      mode: 0o700
    });

    fs.copyFileSync(
      origine,
      arrivo,
      fs.constants.COPYFILE_EXCL
    );

    fs.chmodSync(arrivo, 0o600);

    if (hash(origine) !== hash(arrivo)) {
      throw new Error("Copia non identica: " + relativo);
    }

    copie.push(relativo);
  }

  const packageDestinazione = path.join(
    destinazione,
    "package.json"
  );

  fs.copyFileSync(
    manifestSorgente,
    packageDestinazione,
    fs.constants.COPYFILE_EXCL
  );

  fs.chmodSync(packageDestinazione, 0o600);

  if (hash(manifestSorgente) !== hash(packageDestinazione)) {
    throw new Error("Manifest copiato non correttamente");
  }

  const attesi = [...copie, "package.json"].sort();
  const effettivi = elencaFile(destinazione);

  if (
    JSON.stringify(attesi) !==
    JSON.stringify(effettivi)
  ) {
    throw new Error("File inattesi nel pacchetto");
  }

  if (!fs.existsSync(
    path.join(destinazione, manifest.main)
  )) {
    throw new Error("Avvio Desktop assente");
  }

  return {
    directory: destinazione,
    numeroFile: effettivi.length
  };
}

if (require.main === module) {
  const risultato = preparaPacchetto();

  console.log("PACCHETTO_TEMPORANEO_CREATO_OK");
  console.log("NUMERO_FILE:", risultato.numeroFile);
  console.log("COPIE_IDENTICHE_VERIFICATE_OK");
  console.log("WORKER_INCLUSO_SENZA_AVVIO_OK");
  console.log("CARTELLA_TEMPORANEA:", risultato.directory);
}

module.exports = {
  preparaPacchetto
};
