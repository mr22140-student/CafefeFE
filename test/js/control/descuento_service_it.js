import DescuentoService from "../../../src/js/control/descuento_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(DescuentoService, {
    "idCampo": "idDescuento",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": [],
    "ciclo": false
});
