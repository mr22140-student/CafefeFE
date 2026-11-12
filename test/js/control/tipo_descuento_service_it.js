import TipoDescuentoService from "../../../src/js/control/tipo_descuento_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(TipoDescuentoService, {
    "idCampo": "idTipoDescuento",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": [],
    "ciclo": false
});
