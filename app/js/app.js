async function cargarPOS(){

const res=await fetch(API+"/pos");

const datos=await res.json();

console.log("POS");

console.log(datos);

}
