/**
 * Punto de entrada de la SPA.
 * 1. Importa el instalador primero para no perder "beforeinstallprompt".
 * 2. Registra los Web Components (al importar cafefe_app se registran todos).
 * 3. Registra el service worker (PWA: instalable y sin conexion).
 * 4. Envia las ordenes que se hicieron sin conexion, al abrir y al volver la conexion.
 */
import "./control/instalador.js";
import "./boundary/cafefe_app.js";
import { iniciarEnvioAutomatico } from "./control/cola_ordenes.js";

iniciarEnvioAutomatico();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(error => {
            console.error("No se pudo registrar el service worker", error);
        });
    });
}
