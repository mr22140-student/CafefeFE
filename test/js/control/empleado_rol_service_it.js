import EmpleadoRolService from "../../../src/js/control/empleado_rol_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(EmpleadoRolService, {
    "idCampo": "idEmpleadoRol",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [
        "findByEmpleado"
    ],
    "sinId": [],
    "ciclo": false
});
