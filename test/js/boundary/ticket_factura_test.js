import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/ticket_factura.js";
import { montar, limpiar } from "./utilidades.js";

const DATOS = {
    factura: { idFactura: "abcdef12-0000-4000-8000-000000000000", cliente: "Ana", fechaFacturacion: "2026-11-12T15:00:00.000Z" },
    cajero: "Carlos Montano",
    caja: "caja1",
    productos: [{ precio: 3.5, idProducto: { nombre: "Cafe Americano" } }, { precio: 5, idProducto: { nombre: "Caffe Latte" } }],
    detalles: [{ tipoPago: "TARJETA", monto: 5, referenciaExterna: "AUT-1" }, { tipoPago: "EFECTIVO", monto: 3.5 }],
    cambio: 150
};

suite("<ticket-factura>", function () {
    teardown(limpiar);

    test("deberia mostrar numero de factura, cliente, cajero, productos, total, pagos y cambio", function () {
        let ticket = montar("ticket-factura", { datos: DATOS });
        let texto = ticket.shadowRoot.textContent;
        chai.expect(texto).to.contain("ABCDEF12").and.contain("Ana").and.contain("Carlos Montano").and.contain("caja1");
        chai.expect(texto).to.contain("Cafe Americano").and.contain("$8.50");
        chai.expect(texto).to.contain("Ref. AUT-1").and.contain("Cambio").and.contain("$1.50");
    });

    test("el documento para imprimir deberia tener solo el ticket", function () {
        let ticket = montar("ticket-factura", { datos: DATOS });
        let html = ticket.documentoImprimible();
        chai.expect(html).to.contain("<!DOCTYPE html>").and.contain("Caffe Latte");
        chai.expect(html).to.not.contain("Nuevo cobro");
    });

    test("Imprimir deberia crear un iframe con solo el ticket y mandarlo a imprimir", async function () {
        let ticket = montar("ticket-factura", { datos: DATOS });
        let impreso = null;
        let listo = new Promise(resolve => {
            ticket.alImprimir = ventana => { impreso = ventana.document.body.textContent; resolve(); };
        });
        let marco = ticket.imprimir();
        await listo;
        chai.expect(marco.tagName).to.equal("IFRAME");
        chai.expect(impreso).to.contain("Caffe Latte").and.contain("TOTAL");
        marco.remove();
    });

    test("Nuevo cobro deberia avisar con un evento", function () {
        let ticket = montar("ticket-factura", { datos: DATOS });
        let avisado = false;
        ticket.addEventListener("cafefe:nuevo-cobro", () => { avisado = true; });
        ticket.shadowRoot.querySelector("#nuevo").click();
        chai.expect(avisado).to.equal(true);
    });
});
