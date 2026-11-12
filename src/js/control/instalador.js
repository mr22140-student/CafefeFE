/** Evento que se dispara cuando cambia la posibilidad de instalar la app. */
export const EVENTO_INSTALADOR = "cafefe:instalador";

/**
 * Flujo de instalacion de la PWA.
 * El navegador dispara "beforeinstallprompt" cuando la app es instalable; se cancela
 * (preventDefault) para que no salga su aviso automatico y se guarda el evento.
 * Despues, el boton propio de la app llama a instalar(), que muestra el dialogo.
 */
export class Instalador extends EventTarget {
    constructor(ventana = window) {
        super();
        this.aviso = null;
        this.instalada = Boolean(ventana.matchMedia && ventana.matchMedia("(display-mode: standalone)").matches);

        ventana.addEventListener("beforeinstallprompt", evento => {
            evento.preventDefault();
            this.aviso = evento;
            this.avisar();
        });
        ventana.addEventListener("appinstalled", () => {
            this.aviso = null;
            this.instalada = true;
            this.avisar();
        });
    }

    get disponible() {
        return this.aviso !== null && !this.instalada;
    }

    /** Muestra el dialogo del navegador. Resuelve true si el usuario acepto. */
    async instalar() {
        if (!this.aviso) {
            return false;
        }
        let aviso = this.aviso;
        this.aviso = null;
        aviso.prompt();
        let eleccion = await aviso.userChoice;
        this.avisar();
        return eleccion.outcome === "accepted";
    }

    avisar() {
        this.dispatchEvent(new CustomEvent(EVENTO_INSTALADOR, { detail: { disponible: this.disponible, instalada: this.instalada } }));
    }
}

/** Instancia compartida: se crea al importar main.js para no perderse el evento. */
export const instalador = new Instalador();
