import TipoProductoService from "../../../src/js/control/tipo_producto_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(TipoProductoService, {
    "idCampo": "idTipoProducto",
    "registro": {
        "idTipoProducto": "11111111-1111-4111-8111-000000000001",
        "nombre": "Cafés",
        "activo": true,
        "observaciones": ""
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": []
});
