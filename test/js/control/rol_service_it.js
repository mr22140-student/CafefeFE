import RolService from "../../../src/js/control/rol_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(RolService, {
    "idCampo": "idRol",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": [],
    "ciclo": false
});
