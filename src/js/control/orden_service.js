import DefaultService from "./default_service.js";

/** Servicio del recurso /orden */
class OrdenService extends DefaultService {
    constructor() {
        super("orden");
    }

    /** GET /orden/pendientes */
    findPendientes() {
        return this.findBy(`${this.URL}/pendientes`);
    }

    /** GET /orden/{id}/estado -> datos: { idOrden, estado } (estado de preparacion) */
    findEstado(id) {
        return this.solicitar(`${this.URL}/${id}/estado`, { method: "GET" },
            r => r.json().then(j => this.crearRespuesta(j, 1)));
    }

    /** PUT /orden/{id}/estado con { estado }. Resuelve con { idOrden, estado }. */
    cambiarEstado(id, estado) {
        return this.solicitar(`${this.URL}/${id}/estado`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado })
        }, r => r.json().then(j => this.crearRespuesta(j, 1)));
    }
}
export default OrdenService;
