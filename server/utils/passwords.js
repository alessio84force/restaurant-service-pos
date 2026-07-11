const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

function isHash(passwordGuardada){
  const value = String(passwordGuardada || "");
  return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
}

function hashPassword(password){
  const value = String(password || "");

  if(!value){
    return "";
  }

  if(isHash(value)){
    return value;
  }

  return bcrypt.hashSync(value, SALT_ROUNDS);
}

function verificarPassword(passwordIngresada, passwordGuardada){
  const ingresada = String(passwordIngresada || "");
  const guardada = String(passwordGuardada || "");

  if(!ingresada || !guardada){
    return false;
  }

  if(isHash(guardada)){
    return bcrypt.compareSync(ingresada, guardada);
  }

  return ingresada === guardada;
}

function necesitaRehash(passwordGuardada){
  return Boolean(passwordGuardada) && !isHash(passwordGuardada);
}

module.exports = {
  hashPassword,
  verificarPassword,
  necesitaRehash,
  isHash
};
