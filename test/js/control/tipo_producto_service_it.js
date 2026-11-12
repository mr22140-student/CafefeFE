import TipoProductoService from "../../../src/js/control/tipo_producto_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(TipoProductoService, {
    "idCampo": "idTipoProducto",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": [],
    "ciclo": true,
    "nuevo": () => ({ "nombre": "Categoria FE " + Date.now(), "activo": true, "observaciones": "Creada desde las pruebas del front" })
});
