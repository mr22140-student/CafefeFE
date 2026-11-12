import DefaultResponse from "../../../src/js/entity/default_response.js";

/** Crea el componente, le asigna propiedades (dobles de prueba) ANTES de conectarlo y lo agrega a la pagina. */
export function montar(etiqueta, propiedades = {}, atributos = {}) {
    let elemento = document.createElement(etiqueta);
    Object.assign(elemento, propiedades);
    Object.entries(atributos).forEach(([k, v]) => elemento.setAttribute(k, v));
    zona().appendChild(elemento);
    return elemento;
}

/** Quita de la pagina todo lo montado en las pruebas. */
export function limpiar() {
    zona().replaceChildren();
}

/** Espera a que terminen las promesas pendientes (fetch simulado, async/await). */
export function esperar(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function respuesta(datos) {
    let r = new DefaultResponse();
    r.datos = datos;
    r.totalDatos = Array.isArray(datos) ? datos.length : 1;
    return r;
}

function zona() {
    let z = document.getElementById("zona-pruebas");
    if (!z) {
        z = document.createElement("div");
        z.id = "zona-pruebas";
        z.hidden = true;
        document.body.appendChild(z);
    }
    return z;
}
