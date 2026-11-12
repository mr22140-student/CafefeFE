import EmpleadoService from "../../../src/js/control/empleado_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(EmpleadoService, {
    "idCampo": "idEmpleado",
    "campoActualizar": "comentarios",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": [],
    "ciclo": false
});
