import FacturaOrdenProductoService from "../../../src/js/control/factura_orden_producto_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(FacturaOrdenProductoService, {
    "idCampo": "idFacturaOrdenProducto",
    "registro": {
        "idFacturaOrdenProducto": "11111111-1111-4111-8111-000000000001",
        "precio": 2.5,
        "observaciones": "",
        "idFactura": {
            "idFactura": "11111111-1111-4111-8111-000000000011"
        },
        "idOrdenProducto": {
            "idOrdenProducto": "11111111-1111-4111-8111-000000000012"
        }
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [
        {
            "metodo": "findByFactura",
            "ruta": "factura"
        }
    ],
    "sinId": [
        {
            "metodo": "findDisponibles",
            "ruta": "disponibles"
        }
    ]
});
