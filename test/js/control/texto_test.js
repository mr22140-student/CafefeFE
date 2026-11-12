import * as chai from "../lib/chai/index.js";
import { normalizar, moneda, escapar, esUuid } from "../../../src/js/control/texto.js";

suite("texto", function () {
    test("normalizar deberia quitar tildes, espacios de mas y mayusculas", function () {
        chai.expect(normalizar("  Café   LÚCIA ")).to.equal("cafe lucia");
        chai.expect(normalizar(null)).to.equal("");
    });

    test("moneda deberia mostrar dos decimales con signo de dolar", function () {
        chai.expect(moneda(3.5)).to.equal("$3.50");
        chai.expect(moneda("10")).to.equal("$10.00");
        chai.expect(moneda(undefined)).to.equal("$0.00");
    });

    test("escapar deberia neutralizar HTML que venga del servidor", function () {
        chai.expect(escapar('<img src=x onerror="alert(1)">')).to.equal("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    });

    test("esUuid deberia aceptar solo identificadores con formato UUID", function () {
        chai.expect(esUuid("11111111-1111-4111-8111-000000000001")).to.equal(true);
        chai.expect(esUuid("Laura")).to.equal(false);
        chai.expect(esUuid("")).to.equal(false);
    });
});
