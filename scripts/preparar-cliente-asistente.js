require("dotenv").config();

const { execFileSync, spawnSync } = require("child_process");

function escapeAppleScript(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function dialogo(label, defaultValue, hidden) {
  const safeLabel = escapeAppleScript(label);
  const safeDefault = escapeAppleScript(defaultValue || "");

  const script =
    `display dialog "${safeLabel}" default answer "${safeDefault}" ` +
    `${hidden ? "with hidden answer " : ""}` +
    `buttons {"Cancelar", "OK"} default button "OK" cancel button "Cancelar"`;

  try {
    return execFileSync("osascript", [
      "-e", script,
      "-e", "text returned of result"
    ], { encoding: "utf8" }).trim();
  } catch (e) {
    console.log("Operación cancelada.");
    process.exit(0);
  }
}

function confirmar(mensaje) {
  const safe = escapeAppleScript(mensaje);

  const script =
    `display dialog "${safe}" buttons {"Cancelar", "Continuar"} ` +
    `default button "Continuar" cancel button "Cancelar" with icon caution`;

  try {
    execFileSync("osascript", ["-e", script], { encoding: "utf8" });
    return true;
  } catch (e) {
    console.log("Operación cancelada.");
    process.exit(0);
  }
}

function obligatorio(nombre, valor) {
  if (!String(valor || "").trim()) {
    console.error("Falta dato obligatorio:", nombre);
    process.exit(1);
  }
}

function run(cmd, args) {
  console.log("");
  console.log("Ejecutando:", cmd, args.join(" "));

  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    console.error("");
    console.error("Error ejecutando:", cmd, args.join(" "));
    process.exit(result.status || 1);
  }
}

console.log("==============================================");
console.log("ASISTENTE PREPARAR CLIENTE - RESTAURANT SERVICE POS");
console.log("==============================================");
console.log("");
console.log("Este asistente preparará el database local para un cliente real.");
console.log("Hará backup automático y usará el script preparar-cliente existente.");
console.log("");

confirmar(
  "Este asistente preparará el POS para un cliente real.\\n\\n" +
  "Antes de continuar, asegúrate de que Git está limpio y de que quieres cambiar el database local.\\n\\n" +
  "¿Continuar?"
);

const restaurante = dialogo("Nombre del restaurante", "", false);
const propietario = dialogo("Nombre del propietario / responsable", "", false);
const email = dialogo("Email del cliente", "", false);
const password = dialogo("Password inicial del cliente", "", true);
const telefono = dialogo("Teléfono del restaurante", "", false);
const direccion = dialogo("Dirección del restaurante", "", false);
const nif = dialogo("NIF/CIF del restaurante", "", true);
const promo = dialogo(
  "Código promocional opcional. Déjalo vacío si no hay promo. Ejemplos: BOADILLA COMERCIO / CODICE ALESSIO",
  "",
  false
);

obligatorio("restaurante", restaurante);
obligatorio("propietario", propietario);
obligatorio("email", email);
obligatorio("password", password);

const resumen =
  "Resumen cliente:\\n\\n" +
  "Restaurante: " + restaurante + "\\n" +
  "Propietario: " + propietario + "\\n" +
  "Email: " + email + "\\n" +
  "Teléfono: " + (telefono || "No indicado") + "\\n" +
  "Dirección: " + (direccion || "No indicada") + "\\n" +
  "NIF/CIF: " + (nif ? "Configurado" : "No indicado") + "\\n" +
  "Promo: " + (promo || "Sin promo") + "\\n\\n" +
  "La contraseña NO se muestra.\\n\\n" +
  "El script hará backup, limpiará datos operativos y preparará el cliente.\\n\\n" +
  "¿Confirmas?";

confirmar(resumen);

const args = [
  "run",
  "preparar-cliente",
  "--",
  "--restaurante", restaurante,
  "--propietario", propietario,
  "--email", email,
  "--password", password
];

if (telefono) args.push("--telefono", telefono);
if (direccion) args.push("--direccion", direccion);
if (nif) args.push("--nif", nif);
if (promo) args.push("--promo", promo);

run("npm", args);

console.log("");
console.log("===== CHECK PRODUCCIÓN DESPUÉS DE PREPARAR CLIENTE =====");
run("npm", ["run", "check-produccion"]);

console.log("");
console.log("==============================================");
console.log("CLIENTE PREPARADO CORRECTAMENTE");
console.log("==============================================");
console.log("");
console.log("Login cliente:");
console.log("Email:", email);
console.log("Password: la que has escrito en la ventana privada");
console.log("");
console.log("URLs:");
console.log("Login: http://localhost:3000/login");
console.log("Suscripción: http://localhost:3000/configuracion-suscripcion");
console.log("");
console.log("Revisa que hayan llegado las emails automáticas al cliente.");
