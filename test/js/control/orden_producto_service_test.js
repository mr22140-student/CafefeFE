import OrdenProductoService from "../../../src/js/control/orden_producto_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(OrdenProductoService, {
    "idCampo": "idOrdenProducto",
    "registro": {
        "idOrdenProducto": "11111111-1111-4111-8111-000000000001",
        "precio": 2.5,
        "observaciones": "Cliente: Ana",
        "idOrden": {
            "idOrden": "11111111-1111-4111-8111-000000000011"
        },
        "idProducto": {
            "idProducto": "11111111-1111-4111-8111-000000000012"
        }
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "Cliente: Ana Garcia",
    "filtros": [
        {
            "metodo": "findByOrden",
            "ruta": "orden"
        }
    ],
    "sinId": []
});
