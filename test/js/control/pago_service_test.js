import PagoService from "../../../src/js/control/pago_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(PagoService, {
    "idCampo": "idPago",
    "registro": {
        "idPago": "11111111-1111-4111-8111-000000000001",
        "estado": "PENDIENTE",
        "observaciones": "",
        "idFactura": {
            "idFactura": "11111111-1111-4111-8111-000000000011"
        }
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": []
});
