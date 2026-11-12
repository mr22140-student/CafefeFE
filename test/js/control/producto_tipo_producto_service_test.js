import ProductoTipoProductoService from "../../../src/js/control/producto_tipo_producto_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(ProductoTipoProductoService, {
    "idCampo": "idProductoTipoProducto",
    "registro": {
        "idProductoTipoProducto": "11111111-1111-4111-8111-000000000001",
        "fechaCreacion": "2026-11-10T10:00:00.000-06:00",
        "observaciones": "",
        "producto": {
            "idProducto": "11111111-1111-4111-8111-000000000011"
        },
        "idTipoProducto": {
            "idTipoProducto": "11111111-1111-4111-8111-000000000012"
        }
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [
        {
            "metodo": "findByProducto",
            "ruta": "producto"
        },
        {
            "metodo": "findByTipoProducto",
            "ruta": "tipo_producto"
        }
    ],
    "sinId": []
});
