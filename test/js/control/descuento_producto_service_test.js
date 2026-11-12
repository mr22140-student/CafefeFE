import DescuentoProductoService from "../../../src/js/control/descuento_producto_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(DescuentoProductoService, {
    "idCampo": "idDescuentoProducto",
    "registro": {
        "idDescuentoProducto": "11111111-1111-4111-8111-000000000001",
        "valor": 10,
        "fechaDesde": "2026-11-01T00:00:00.000-06:00",
        "fechaHasta": "2026-11-30T00:00:00.000-06:00",
        "observaciones": "",
        "idDescuento": {
            "idDescuento": "11111111-1111-4111-8111-000000000011"
        },
        "idProducto": {
            "idProducto": "11111111-1111-4111-8111-000000000012"
        }
    },
    "campoActualizar": "valor",
    "valorActualizado": 15,
    "filtros": [
        {
            "metodo": "findByDescuento",
            "ruta": "descuento"
        },
        {
            "metodo": "findByProducto",
            "ruta": "producto"
        }
    ],
    "sinId": []
});
