import PagoDetalleService from "../../../src/js/control/pago_detalle_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(PagoDetalleService, {
    "idCampo": "idPagoDetalle",
    "registro": {
        "idPagoDetalle": "11111111-1111-4111-8111-000000000001",
        "monto": 10,
        "tipoPago": "EFECTIVO",
        "observaciones": "",
        "referenciaExterna": "",
        "idPago": {
            "idPago": "11111111-1111-4111-8111-000000000011"
        }
    },
    "campoActualizar": "monto",
    "valorActualizado": 8.5,
    "filtros": [
        {
            "metodo": "findByPago",
            "ruta": "pago"
        }
    ],
    "sinId": []
});
