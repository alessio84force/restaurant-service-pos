"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const sorgenteRelativo =
  "print-bridge/native/macosUsbEscpos.c";

const binarioRelativo =
  "print-bridge/native/rsp-macos-usb-escpos";

function preparaHelperMac(directory, modalita) {
  if (
    !path.isAbsolute(directory) ||
    !["dry-run", "build"].includes(modalita)
  ) {
    throw new Error("Argomenti preparazione non validi");
  }

  const sorgente = path.join(directory, sorgenteRelativo);
  const binario = path.join(directory, binarioRelativo);

  const configFile = path.join(
    directory,
    "electron-builder.json"
  );

  const stat = fs.lstatSync(sorgente);

  assert(stat.isFile() && !stat.isSymbolicLink());
  assert(!fs.existsSync(binario));

  const configurazione = JSON.parse(
    fs.readFileSync(configFile, "utf8")
  );

  assert.strictEqual(configurazione.asar, true);
  assert.strictEqual(configurazione.files.length, 22);

  assert(
    configurazione.files.includes(sorgenteRelativo)
  );

  assert.deepStrictEqual(
    configurazione.asarUnpack,
    [sorgenteRelativo]
  );

  // Il test locale verifica tutto senza compilare.
  if (modalita === "dry-run") {
    return {
      ok: true,
      compilato: false
    };
  }

  if (process.platform !== "darwin") {
    throw new Error("Compilazione disponibile solo su macOS");
  }

  // Un binario universale per Intel e Apple Silicon.
  execFileSync("/usr/bin/xcrun", [
    "--sdk", "macosx",
    "clang",
    "-arch", "x86_64",
    "-arch", "arm64",
    "-mmacosx-version-min=13.0",
    "-Wall",
    "-framework", "IOKit",
    "-framework", "CoreFoundation",
    sorgente,
    "-o", binario
  ], { stdio: "pipe" });

  fs.chmodSync(binario, 0o755);

  // Non accettiamo un binario con una sola architettura.
  execFileSync("/usr/bin/lipo", [
    "-verify_arch",
    "x86_64",
    "arm64",
    binario
  ], { stdio: "pipe" });

  const statBinario = fs.lstatSync(binario);

  assert(
    statBinario.isFile() &&
    !statBinario.isSymbolicLink() &&
    statBinario.size > 0 &&
    (statBinario.mode & 0o111) !== 0
  );

  // Aggiorniamo soltanto la configurazione temporanea
  // macOS, senza alterare quella originale del progetto.
  configurazione.files.push(binarioRelativo);
  configurazione.asarUnpack.push(binarioRelativo);

  assert.strictEqual(configurazione.files.length, 23);
  assert.strictEqual(configurazione.asarUnpack.length, 2);

  fs.writeFileSync(
    configFile,
    JSON.stringify(configurazione, null, 2) + "\n"
  );

  return {
    ok: true,
    compilato: true
  };
}

if (require.main === module) {
  const risultato = preparaHelperMac(
    process.argv[2],
    String(process.argv[3] || "").replace(/^--/, "")
  );

  console.log(
    risultato.compilato
      ? "HELPER_UNIVERSALE_MACOS_COMPILATO_OK"
      : "PREPARAZIONE_HELPER_VERIFICATA_OK"
  );
}

module.exports = {
  preparaHelperMac
};
