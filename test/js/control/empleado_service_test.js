import EmpleadoService from "../../../src/js/control/empleado_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(EmpleadoService, {
    "idCampo": "idEmpleado",
    "registro": {
        "idEmpleado": "11111111-1111-4111-8111-000000000001",
        "nombre": "Laura",
        "apellido": "Martinez",
        "activo": true,
        "comentarios": ""
    },
    "campoActualizar": "comentarios",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": []
});
