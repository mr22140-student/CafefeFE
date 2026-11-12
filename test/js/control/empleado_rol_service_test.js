import EmpleadoRolService from "../../../src/js/control/empleado_rol_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(EmpleadoRolService, {
    "idCampo": "idEmpleadoRol",
    "registro": {
        "idEmpleadoRol": "11111111-1111-4111-8111-000000000001",
        "idEmpleado": "11111111-1111-4111-8111-000000000011",
        "activo": true,
        "observaciones": "",
        "idRol": {
            "idRol": "11111111-1111-4111-8111-000000000012"
        }
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [
        {
            "metodo": "findByEmpleado",
            "ruta": "empleado"
        }
    ],
    "sinId": []
});
