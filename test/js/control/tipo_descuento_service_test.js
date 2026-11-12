import TipoDescuentoService from "../../../src/js/control/tipo_descuento_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(TipoDescuentoService, {
    "idCampo": "idTipoDescuento",
    "registro": {
        "idTipoDescuento": "11111111-1111-4111-8111-000000000001",
        "nombre": "Temporada",
        "activo": true,
        "descuentoMaximo": 50,
        "observaciones": ""
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": []
});
