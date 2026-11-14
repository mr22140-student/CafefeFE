import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import { ColaOrdenes, EVENTO_COLA, iniciarEnvioAutomatico } from "../../../src/js/control/cola_ordenes.js";
import AlmacenLocal from "../../../src/js/control/almacen_local.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { almacenamientoFalso } from "./almacenamiento_falso.js";

const LATTE = { idProducto: "p1", nombre: "Latte", precioSugerido: 3.5, activo: true, comentarios: "no se guarda" };

function errorHttp(estado, mensaje = "") {
    let e = new DefaultError();
    e.estado = estado;
    e.mensaje = mensaje;
    return e;
}

suite("ColaOrdenes (ordenes sin conexion)", function () {
    let ordenCliente, cola;

    setup(function () {
        ordenCliente = { crear: sinon.stub().resolves({ orden: { idOrden: "o-nueva" } }) };
        cola = new ColaOrdenes(ordenCliente, new AlmacenLocal(almacenamientoFalso()));
    });

    test("agregar deberia guardar la orden con lo necesario para crearla y avisar", function () {
        let aviso = null;
        cola.addEventListener(EVENTO_COLA, e => { aviso = e.detail; });
        cola.agregar("Ana", [{ producto: LATTE, cantidad: 2 }]);
        let pendientes = cola.pendientes();
        chai.expect(pendientes).to.have.lengthOf(1);
        chai.expect(pendientes[0].cliente).to.equal("Ana");
        chai.expect(pendientes[0].items[0]).to.deep.equal({ cantidad: 2, producto: { idProducto: "p1", nombre: "Latte", precioSugerido: 3.5 } });
        chai.expect(aviso.pendientes).to.equal(1);
    });

    test("enviarPendientes deberia crear cada orden en orden y quitarla de la cola", async function () {
        cola.agregar("Ana", [{ producto: LATTE, cantidad: 1 }]);
        cola.agregar("Luis", [{ producto: LATTE, cantidad: 3 }]);
        let resultado = await cola.enviarPendientes();
        chai.expect(ordenCliente.crear.firstCall.args[0]).to.equal("Ana");
        chai.expect(ordenCliente.crear.secondCall.args[0]).to.equal("Luis");
        chai.expect(resultado.enviadas).to.have.lengthOf(2);
        chai.expect(resultado.enviadas[0].idOrden).to.equal("o-nueva");
        chai.expect(cola.pendientes()).to.have.lengthOf(0);
    });

    test("si sigue sin conexion deberia detenerse y dejar las ordenes guardadas", async function () {
        ordenCliente.crear.rejects(errorHttp(0));
        cola.agregar("Ana", [{ producto: LATTE, cantidad: 1 }]);
        cola.agregar("Luis", [{ producto: LATTE, cantidad: 1 }]);
        let resultado = await cola.enviarPendientes();
        chai.expect(ordenCliente.crear.calledOnce).to.equal(true);
        chai.expect(resultado.enviadas).to.have.lengthOf(0);
        chai.expect(cola.pendientes()).to.have.lengthOf(2);
    });

    test("si el servidor rechaza una orden deberia quitarla, reportarla y seguir con las demas", async function () {
        ordenCliente.crear.onFirstCall().rejects(errorHttp(422, "El producto no existe"));
        cola.agregar("Ana", [{ producto: LATTE, cantidad: 1 }]);
        cola.agregar("Luis", [{ producto: LATTE, cantidad: 1 }]);
        let resultado = await cola.enviarPendientes();
        chai.expect(resultado.rechazadas).to.have.lengthOf(1);
        chai.expect(resultado.rechazadas[0].mensaje).to.equal("El producto no existe");
        chai.expect(resultado.enviadas).to.have.lengthOf(1);
        chai.expect(cola.pendientes()).to.have.lengthOf(0);
    });

    test("dos envios al mismo tiempo no deberian mandar la orden dos veces", async function () {
        cola.agregar("Ana", [{ producto: LATTE, cantidad: 1 }]);
        await Promise.all([cola.enviarPendientes(), cola.enviarPendientes()]);
        chai.expect(ordenCliente.crear.calledOnce).to.equal(true);
    });

    test("deberia enviar al iniciar y cada vez que vuelve la conexion", async function () {
        let ventana = new EventTarget();
        ventana.navigator = { onLine: true };
        let envio = sinon.stub(cola, "enviarPendientes").resolves({});
        iniciarEnvioAutomatico(cola, ventana);
        chai.expect(envio.calledOnce).to.equal(true);
        ventana.dispatchEvent(new Event("online"));
        chai.expect(envio.calledTwice).to.equal(true);
    });

    test("sin conexion al iniciar no deberia intentar enviar", function () {
        let ventana = new EventTarget();
        ventana.navigator = { onLine: false };
        let envio = sinon.stub(cola, "enviarPendientes").resolves({});
        iniciarEnvioAutomatico(cola, ventana);
        chai.expect(envio.called).to.equal(false);
    });
});