import { ESTILOS } from "./estilos.js";
import Autenticacion from "../control/autenticacion.js";
import { sesion } from "../control/sesion.js";
import { rutaPorRol } from "../control/router.js";

/**
 * <pagina-login> (HU1): el usuario es el nombre del empleado y la contraseña su
 * identificador unico. Al entrar, guarda la sesion y lleva a la pantalla de su rol
 * (o a la que intentaba abrir, atributo "destino").
 * Propiedades reemplazables en pruebas: autenticacion, sesion.
 */
class PaginaLogin extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.autenticacion = new Autenticacion();
        this.sesion = sesion;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                :host {
                    display: grid;
                    grid-template-columns: minmax(0, 26rem);
                    justify-content: center;
                    padding-block: var(--esp-6);
                }
                h1 { text-align: center; margin-bottom: var(--esp-1); }
                .subtitulo { text-align: center; color: var(--color-texto-suave); margin-bottom: var(--esp-5); }
                .clave { display: flex; gap: var(--esp-2); }
                .clave input { flex: 1; min-width: 0; }
                .clave .boton { padding-inline: var(--esp-3); }
                .alerta { margin-bottom: var(--esp-4); }
            </style>
            <section class="tarjeta" aria-labelledby="titulo">
                <h1 id="titulo">Iniciar sesión</h1>
                <p class="subtitulo">Bienvenido a Cafefe</p>
                <form novalidate>
                    <div class="campo">
                        <label for="usuario">Usuario</label>
                        <input id="usuario" name="usuario" autocomplete="username" required aria-describedby="ayuda-usuario">
                        <span class="ayuda" id="ayuda-usuario">Su nombre, por ejemplo: Laura</span>
                    </div>
                    <div class="campo">
                        <label for="contrasena">Contraseña</label>
                        <div class="clave">
                            <input id="contrasena" name="contrasena" type="password" autocomplete="current-password"
                                   required spellcheck="false" aria-describedby="ayuda-contrasena">
                            <button type="button" class="boton boton--secundario" id="ver" aria-pressed="false"
                                    aria-controls="contrasena">Mostrar</button>
                        </div>
                        <span class="ayuda" id="ayuda-contrasena">Su código de empleado</span>
                    </div>
                    <p class="alerta alerta--error" role="alert" id="error"></p>
                    <button type="submit" class="boton boton--bloque">Iniciar sesión</button>
                </form>
            </section>`;

        this.shadowRoot.querySelector("form").addEventListener("submit", evento => {
            evento.preventDefault();
            this.ingresar();
        });
        this.shadowRoot.querySelector("#ver").addEventListener("click", () => this.alternarClave());
        this.shadowRoot.querySelector("#usuario").focus();
    }

    alternarClave() {
        let campo = this.shadowRoot.querySelector("#contrasena");
        let boton = this.shadowRoot.querySelector("#ver");
        let mostrar = campo.type === "password";
        campo.type = mostrar ? "text" : "password";
        boton.textContent = mostrar ? "Ocultar" : "Mostrar";
        boton.setAttribute("aria-pressed", String(mostrar));
    }

    async ingresar() {
        let usuario = this.shadowRoot.querySelector("#usuario");
        let contrasena = this.shadowRoot.querySelector("#contrasena");
        let enviar = this.shadowRoot.querySelector("button[type=submit]");

        this.mostrarError("");
        enviar.disabled = true;
        enviar.textContent = "Ingresando…";
        try {
            let datos = await this.autenticacion.ingresar(usuario.value, contrasena.value);
            this.sesion.iniciar(datos);
            let ruta = this.getAttribute("destino") || rutaPorRol(datos.rol.nombre);
            this.dispatchEvent(new CustomEvent("cafefe:sesion-iniciada", { detail: datos, bubbles: true, composed: true }));
            this.dispatchEvent(new CustomEvent("cafefe:navegar", { detail: { ruta }, bubbles: true, composed: true }));
        } catch (e) {
            this.mostrarError(e.mensaje || "No se pudo iniciar sesión.");
            contrasena.value = "";
            contrasena.focus();
        } finally {
            enviar.disabled = false;
            enviar.textContent = "Iniciar sesión";
        }
    }

    mostrarError(mensaje) {
        this.shadowRoot.querySelector("#error").textContent = mensaje;
        let invalido = mensaje ? "true" : "false";
        this.shadowRoot.querySelector("#usuario").setAttribute("aria-invalid", invalido);
        this.shadowRoot.querySelector("#contrasena").setAttribute("aria-invalid", invalido);
    }
}
customElements.define("pagina-login", PaginaLogin);
export default PaginaLogin;
