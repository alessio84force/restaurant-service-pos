"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const LINGUE = ["es", "it", "en", "pt-BR"];

function linguaValida(lingua) {
  return LINGUE.includes(lingua);
}

function controllaPercorso(file) {
  if (
    typeof file !== "string" ||
    !path.isAbsolute(file) ||
    path.basename(file) !== "preferenze.json"
  ) {
    throw new Error("Percorso preferenze non valido.");
  }
}

function privata(stat, cartella) {
  return (
    !stat.isSymbolicLink() &&
    (cartella ? stat.isDirectory() : stat.isFile()) &&
    (stat.mode & 0o777) === (cartella ? 0o700 : 0o600) &&
    (
      typeof process.getuid !== "function" ||
      stat.uid === process.getuid()
    )
  );
}

function leggiLingua(file) {
  try {
    controllaPercorso(file);

    const cartella = fs.lstatSync(path.dirname(file));
    const documento = fs.lstatSync(file);

    if (
      !privata(cartella, true) ||
      !privata(documento, false) ||
      documento.size > 128
    ) {
      return null;
    }

    const dati = JSON.parse(fs.readFileSync(file, "utf8"));

    if (
      !dati ||
      typeof dati !== "object" ||
      Object.keys(dati).length !== 1 ||
      !linguaValida(dati.lingua)
    ) {
      return null;
    }

    return dati.lingua;

  } catch (_) {
    return null;
  }
}

function salvaLingua(file, lingua) {
  controllaPercorso(file);

  if (!linguaValida(lingua)) {
    throw new Error("Lingua non supportata.");
  }

  const cartella = path.dirname(file);

  if (!fs.existsSync(cartella)) {
    fs.mkdirSync(cartella, { mode: 0o700 });
  }

  if (!privata(fs.lstatSync(cartella), true)) {
    throw new Error("Cartella preferenze non sicura.");
  }

  try {
    const documento = fs.lstatSync(file);

    if (!privata(documento, false)) {
      throw new Error("File preferenze non sicuro.");
    }

  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  const temporaneo = path.join(
    cartella,
    ".preferenze-" +
      process.pid + "-" +
      crypto.randomBytes(8).toString("hex")
  );

  try {
    fs.writeFileSync(
      temporaneo,
      JSON.stringify({ lingua }) + "\n",
      { flag: "wx", mode: 0o600 }
    );

    fs.renameSync(temporaneo, file);

    return { lingua };

  } finally {
    try {
      fs.unlinkSync(temporaneo);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }
}

module.exports = {
  linguaValida,
  leggiLingua,
  salvaLingua
};
