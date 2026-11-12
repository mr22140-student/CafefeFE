import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/pagina_login.js";
import { Sesion } from "../../../src/js/control/sesion.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { montar, limpiar, esperar } from "./utilidades.js";

const CAJERA = {
    empleado: { idEmpleado: "e1", nombre: "Laura", apellido: "Martinez" },
    rol: { idRol: "r1", nombre: "Cajero" },
    idEmpleadoRol: "er1"
};

function enviar(pagina, usuario, contrasena) {
    let raiz = pagina.shadowRoot;
    raiz.querySelector("#usuario").value = usuario;
    raiz.querySelector("#contrasena").value = contrasena;
    raiz.querySelector("form").requestSubmit();
}

suite("<pagina-login>", function () {
    let autenticacion;
    let sesion;

    setup(function () {
        autenticacion = { ingresar: sinon.stub() };
        sesion = new Sesion(null, new EventTarget());
    });

    teardown(limpiar);

    test("deberia tener campos con etiqueta y la contraseña oculta", function () {
        let raiz = montar("pagina-login", { autenticacion, sesion }).shadowRoot;
        chai.expect(raiz.querySelector("label[for=usuario]")).to.not.equal(null);
        chai.expect(raiz.querySelector("label[for=contrasena]")).to.not.equal(null);
        chai.expect(raiz.querySelector("#contrasena").type).to.equal("password");
    });

    test("Mostrar deberia alternar la visibilidad de la contraseña", function () {
        let raiz = montar("pagina-login", { autenticacion, sesion }).shadowRoot;
        raiz.querySelector("#ver").click();
        chai.expect(raiz.querySelector("#contrasena").type).to.equal("text");
        chai.expect(raiz.querySelector("#ver").getAttribute("aria-pressed")).to.equal("true");
    });

    test("con credenciales correctas deberia iniciar sesion y navegar a la pantalla del rol", async function () {
        autenticacion.ingresar.resolves(CAJERA);
        let pagina = montar("pagina-login", { autenticacion, sesion });
        let navegar = sinon.spy();
        pagina.addEventListener("cafefe:navegar", e => navegar(e.detail.ruta));

        enviar(pagina, "Laura", "11111111-1111-4111-8111-000000000001");
        await esperar();

        chai.expect(autenticacion.ingresar.calledOnceWith("Laura", "11111111-1111-4111-8111-000000000001")).to.equal(true);
        chai.expect(sesion.obtener()).to.deep.equal(CAJERA);
        chai.expect(navegar.calledOnceWith("/pago")).to.equal(true);
    });

    test("deberia volver a la pagina que se queria abrir (atributo destino)", async function () {
        autenticacion.ingresar.resolves(CAJERA);
        let pagina = montar("pagina-login", { autenticacion, sesion }, { destino: "/orden" });
        let ruta = null;
        pagina.addEventListener("cafefe:navegar", e => { ruta = e.detail.ruta; });
        enviar(pagina, "Laura", "x");
        await esperar();
        chai.expect(ruta).to.equal("/orden");
    });

    test("con credenciales incorrectas deberia mostrar el error, marcar los campos y no iniciar sesion", async function () {
        let error = new DefaultError();
        error.mensaje = "Usuario o contraseña incorrectos.";
        autenticacion.ingresar.rejects(error);
        let pagina = montar("pagina-login", { autenticacion, sesion });

        enviar(pagina, "Laura", "mal");
        await esperar();

        let raiz = pagina.shadowRoot;
        chai.expect(raiz.querySelector("#error").textContent).to.equal("Usuario o contraseña incorrectos.");
        chai.expect(raiz.querySelector("#error").getAttribute("role")).to.equal("alert");
        chai.expect(raiz.querySelector("#contrasena").getAttribute("aria-invalid")).to.equal("true");
        chai.expect(raiz.querySelector("#contrasena").value).to.equal("");
        chai.expect(sesion.obtener()).to.equal(null);
    });

    test("mientras valida deberia deshabilitar el boton para no enviar dos veces", async function () {
        let terminar;
        autenticacion.ingresar.returns(new Promise(resolve => { terminar = resolve; }));
        let pagina = montar("pagina-login", { autenticacion, sesion });
        enviar(pagina, "Laura", "x");
        let boton = pagina.shadowRoot.querySelector("button[type=submit]");
        chai.expect(boton.disabled).to.equal(true);
        terminar(CAJERA);
        await esperar();
        chai.expect(boton.disabled).to.equal(false);
    });
});
