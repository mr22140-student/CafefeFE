import DescuentoService from "../../../src/js/control/descuento_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(DescuentoService, {
    "idCampo": "idDescuento",
    "registro": {
        "idDescuento": "11111111-1111-4111-8111-000000000001",
        "nombre": "Promo",
        "fechaDesde": "2026-11-01T00:00:00.000-06:00",
        "fechaHasta": "2026-11-30T00:00:00.000-06:00",
        "observaciones": "",
        "idTipoDescuento": {
            "idTipoDescuento": "11111111-1111-4111-8111-000000000011"
        }
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": []
});
