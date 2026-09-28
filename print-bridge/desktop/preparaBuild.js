"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const { preparaPacchetto } = require("./preparaPacchetto");
const { verificaDistribuzione } = require("./distribuzione");

function preparaBuild() {
  const pacchetto = preparaPacchetto();

  assert.strictEqual(pacchetto.numeroFile, 10);

  const directory = pacchetto.directory;
  const packageFile = path.join(directory, "package.json");

  const packageOriginale = JSON.parse(
    fs.readFileSync(packageFile, "utf8")
  );

  assert.strictEqual(
    packageOriginale.name,
    "restaurant-service-print-bridge"
  );

  assert.strictEqual(
    packageOriginale.dependencies,
    undefined
  );

  const packageBuild = {
    ...packageOriginale,
    devDependencies: {
      electron: "44.4.5",
      "electron-builder": "26.15.3"
    }
  };

  fs.writeFileSync(
    packageFile,
    JSON.stringify(packageBuild, null, 2) + "\n",
    { mode: 0o600 }
  );

  const configurazione = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "build.desktop.json"),
      "utf8"
    )
  );

  const autorizzati = [
    "package.json",
    ...verificaDistribuzione().files
  ].sort();

  assert.deepStrictEqual(
    [...configurazione.files].sort(),
    autorizzati
  );

  assert.strictEqual(
    configurazione.publish,
    undefined
  );

  const configDestinazione = path.join(
    directory,
    "electron-builder.json"
  );

  fs.writeFileSync(
    configDestinazione,
    JSON.stringify(configurazione, null, 2) + "\n",
    {
      mode: 0o600,
      flag: "wx"
    }
  );

  const presenti = [];

  function visita(cartella, base = cartella) {
    for (const voce of fs.readdirSync(cartella)) {
      const completo = path.join(cartella, voce);
      const stat = fs.lstatSync(completo);

      if (stat.isSymbolicLink()) {
        throw new Error("Collegamento simbolico inatteso");
      }

      if (stat.isDirectory()) {
        visita(completo, base);
      } else if (stat.isFile()) {
        presenti.push(
          path.relative(base, completo)
            .split(path.sep).join("/")
        );
      } else {
        throw new Error("Elemento inatteso");
      }
    }
  }

  visita(directory);

  const attesi = [
    ...autorizzati,
    "electron-builder.json"
  ].sort();

  assert.deepStrictEqual(presenti.sort(), attesi);

  assert.strictEqual(presenti.length, 11);

  return {
    directory,
    files: presenti.length,
    electron: packageBuild.devDependencies.electron,
    builder: packageBuild.devDependencies["electron-builder"]
  };
}

if (require.main === module) {
  const risultato = preparaBuild();

  console.log("AMBIENTE_BUILD_ISOLATO_OK");
  console.log("FILE_TOTALI:", risultato.files);
  console.log("ELECTRON_PREVISTO:", risultato.electron);
  console.log("BUILDER_PREVISTO:", risultato.builder);
  console.log("NESSUNA_DIPENDENZA_INSTALLATA");
  console.log("CARTELLA_TEMPORANEA:", risultato.directory);
}

module.exports = {
  preparaBuild
};
