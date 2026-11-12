import ProductoCaracteristicaService from "../../../src/js/control/producto_caracteristica_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(ProductoCaracteristicaService, {
    "idCampo": "idProductoCaracteristica",
    "registro": {
        "idProductoCaracteristica": "11111111-1111-4111-8111-000000000001",
        "valor": "12oz",
        "idCaracteristica": {
            "idCaracteristica": "11111111-1111-4111-8111-000000000011"
        },
        "idProducto": {
            "idProducto": "11111111-1111-4111-8111-000000000012"
        }
    },
    "campoActualizar": "valor",
    "valorActualizado": "16oz",
    "filtros": [
        {
            "metodo": "findByProducto",
            "ruta": "producto"
        }
    ],
    "sinId": []
});
