import PagoDetalleService from "../../../src/js/control/pago_detalle_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(PagoDetalleService, {
    "idCampo": "idPagoDetalle",
    "campoActualizar": "monto",
    "valorActualizado": 8.5,
    "filtros": [
        "findByPago"
    ],
    "sinId": [],
    "ciclo": false
});
