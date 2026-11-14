/**
 * Guarda datos en el navegador (localStorage) para que la app funcione sin conexion:
 * la copia del menu y la cola de ordenes pendientes de envio.
 * - Todo se guarda como JSON con el prefijo "cafefe." para no chocar con otras apps.
 * - Si el navegador no deja usar localStorage (modo privado, almacenamiento lleno),
 *   no se rompe: leer devuelve el valor por defecto y guardar devuelve false.
 * El almacenamiento se recibe en el constructor para poder simularlo en las pruebas.
 */
class AlmacenLocal {
    constructor(almacenamiento = obtenerLocalStorage()) {
        this.almacenamiento = almacenamiento;
    }

    leer(clave, porDefecto = null) {
        try {
            let texto = this.almacenamiento ? this.almacenamiento.getItem("cafefe." + clave) : null;
            return texto === null ? porDefecto : JSON.parse(texto);
        } catch (e) {
            return porDefecto;
        }
    }

    /** Devuelve true si se pudo guardar. */
    guardar(clave, valor) {
        try {
            this.almacenamiento.setItem("cafefe." + clave, JSON.stringify(valor));
            return true;
        } catch (e) {
            return false;
        }
    }

    borrar(clave) {
        try {
            this.almacenamiento.removeItem("cafefe." + clave);
        } catch (e) {
            // nada que borrar
        }
    }
}

function obtenerLocalStorage() {
    try {
        return window.localStorage;
    } catch (e) {
        return null;
    }
}

export default AlmacenLocal;