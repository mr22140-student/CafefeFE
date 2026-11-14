import * as chai from "../lib/chai/index.js";
import { normalizar, moneda, escapar, esUuid, marcarCliente, leerCliente, esNombreValido } from "../../../src/js/control/texto.js";

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

        test("esNombreValido deberia aceptar nombres con tildes, espacios y apostrofos", function () {
        chai.expect(esNombreValido("María José")).to.equal(true);
        chai.expect(esNombreValido("  Ñoño O'Neil-Peña ")).to.equal(true);
    });

    test("esNombreValido deberia rechazar numeros, simbolos y textos vacios", function () {
        chai.expect(esNombreValido("Ana2")).to.equal(false);
        chai.expect(esNombreValido("12345")).to.equal(false);
        chai.expect(esNombreValido("@na")).to.equal(false);
        chai.expect(esNombreValido("   ")).to.equal(false);
        chai.expect(esNombreValido(null)).to.equal(false);
    });

    test("marcarCliente y leerCliente deberian guardar y recuperar el nombre del cliente", function () {
        chai.expect(marcarCliente("  Ana ")).to.equal("Cliente: Ana");
        chai.expect(leerCliente(marcarCliente("Ana López"))).to.equal("Ana López");
        chai.expect(leerCliente("Descuento Clientes Preferenciales")).to.equal("");
        chai.expect(leerCliente(null)).to.equal("");
    });
});
