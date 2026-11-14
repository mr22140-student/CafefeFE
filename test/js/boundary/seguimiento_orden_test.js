import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/seguimiento_orden.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { montar, limpiar, esperar, respuesta } from "./utilidades.js";

function conEstado(estado) {
    return respuesta({ idOrden: "o1", estado });
}

function pasoActual(seguimiento) {
    return seguimiento.shadowRoot.querySelector('li[aria-current="step"]').dataset.paso;
}

suite("<seguimiento-orden>", function () {
    let ordenService;

    setup(function () {
        ordenService = { findEstado: sinon.stub().resolves(conEstado("PREPARANDO")) };
    });

    teardown(limpiar);

    test("deberia consultar el estado de su orden y marcar ese paso", async function () {
        let seguimiento = montar("seguimiento-orden", { ordenService, intervalo: 1000 }, { orden: "o1" });
        await esperar();
        chai.expect(ordenService.findEstado.calledWith("o1")).to.equal(true);
        chai.expect(pasoActual(seguimiento)).to.equal("PREPARANDO");
        chai.expect(seguimiento.shadowRoot.querySelectorAll("li.hecho")).to.have.lengthOf(1);
        chai.expect(seguimiento.shadowRoot.querySelector("#mensaje").textContent).to.contain("preparando");
    });

    test("deberia actualizarse solo cuando el barista cambia el estado", async function () {
        let seguimiento = montar("seguimiento-orden", { ordenService, intervalo: 20 }, { orden: "o1" });
        let cambios = [];
        seguimiento.addEventListener("cafefe:estado-cambio", e => cambios.push(e.detail.estado));
        await esperar();
        ordenService.findEstado.resolves(conEstado("EN_CAMINO"));
        await esperar(50);
        chai.expect(pasoActual(seguimiento)).to.equal("EN_CAMINO");
        chai.expect(seguimiento.shadowRoot.querySelector("#mensaje").textContent).to.contain("camino a su mesa");
        chai.expect(cambios).to.deep.equal(["PREPARANDO", "EN_CAMINO"]);
    });

    test("al entregarse la orden deberia dejar de consultar", async function () {
        ordenService.findEstado.resolves(conEstado("ENTREGADA"));
        let seguimiento = montar("seguimiento-orden", { ordenService, intervalo: 20 }, { orden: "o1" });
        await esperar(70);
        chai.expect(ordenService.findEstado.callCount).to.equal(1);
        chai.expect(pasoActual(seguimiento)).to.equal("ENTREGADA");
    });

    test("sin conexion deberia avisar y seguir intentando", async function () {
        let error = new DefaultError();
        error.estado = 0;
        ordenService.findEstado.rejects(error);
        let seguimiento = montar("seguimiento-orden", { ordenService, intervalo: 20 }, { orden: "o1" });
        await esperar(50);
        chai.expect(seguimiento.shadowRoot.querySelector("#conexion").textContent).to.contain("reintentando");
        chai.expect(ordenService.findEstado.callCount).to.be.greaterThan(1);
        chai.expect(pasoActual(seguimiento)).to.equal("RECIBIDA");
    });

    test("al quitarlo de la pagina deberia dejar de consultar", async function () {
        let seguimiento = montar("seguimiento-orden", { ordenService, intervalo: 20 }, { orden: "o1" });
        await esperar();
        seguimiento.remove();
        let llamadas = ordenService.findEstado.callCount;
        await esperar(60);
        chai.expect(ordenService.findEstado.callCount).to.equal(llamadas);
    });
});