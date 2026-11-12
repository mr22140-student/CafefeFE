import { URL_API } from "../config.js";
import DefaultError from "../entity/default_error.js";
import DefaultResponse from "../entity/default_response.js";

/**
 * Servicio base: envuelve fetch contra el API REST de CafefeSV.
 * Cada servicio hijo solo indica su recurso (por ejemplo "tipo_producto")
 * y agrega sus consultas filtradas con findBy.
 *
 * Codigos que devuelve el backend:
 *  200 ok | 201 creado (Location + entidad) | 204 eliminado
 *  404 no existe | 422 dato invalido (Wrong-Parameter + mensaje) | 500 error (App-Error)
 */
class DefaultService {
    constructor(recurso = "") {
        this.BASE_URL = URL_API;
        this.URL = this.BASE_URL + recurso;
    }

    crearError(mensaje, e, estado = 0) {
        let error = new DefaultError();
        error.mensaje = mensaje;
        error.error = e;
        error.estado = estado;
        return error;
    }

    crearRespuesta(datos, totalDatos) {
        let response = new DefaultResponse();
        response.datos = datos;
        response.totalDatos = totalDatos;
        return response;
    }

    /**
     * Convierte una respuesta HTTP que no fue exitosa en un DefaultError y rechaza la promesa.
     */
    rechazarRespuesta(r, reject) {
        if (r.status === 404) {
            reject(this.crearError("No existe el registro", null, 404));
        } else if (r.status === 422) {
            let campo = r.headers.get("Wrong-Parameter");
            r.text().then(texto => {
                let mensaje = texto ? texto : `Dato invalido${campo ? ": " + campo : ""}`;
                reject(this.crearError(mensaje, campo, 422));
            }).catch(() => {
                reject(this.crearError("Dato invalido", campo, 422));
            });
        } else if (r.status === 500) {
            let detalle = r.headers.get("App-Error");
            reject(this.crearError("Error en el servidor" + (detalle ? ": " + detalle : ""), detalle, 500));
        } else {
            reject(this.crearError(`Error al procesar la solicitud: ${r.status}`, null, r.status));
        }
    }

    /**
     * Hace la peticion. Si la respuesta es exitosa (2xx) llama a procesar(r),
     * que debe devolver una promesa con el DefaultResponse.
     */
    solicitar(url, opciones, procesar) {
        return new Promise((resolve, reject) => {
            fetch(url, opciones).then(r => {
                if (r.ok) {
                    procesar(r).then(resolve).catch(e => {
                        reject(this.crearError("Error al parsear la respuesta del servidor", e, r.status));
                    });
                } else {
                    this.rechazarRespuesta(r, reject);
                }
            }).catch(e => {
                reject(this.crearError("Error al acceder al repositorio", e, 0));
            });
        });
    }

    /** GET /recurso?first=&max= (el backend permite max hasta 100). */
    findRange(first = 0, max = 50) {
        return this.solicitar(`${this.URL}?first=${first}&max=${max}`, { method: "GET" },
            r => r.json().then(j => this.crearRespuesta(j, Number(r.headers.get("Total-Registros")))));
    }

    /** GET /recurso/{id} */
    findById(id) {
        return this.solicitar(`${this.URL}/${id}`, { method: "GET" },
            r => r.json().then(j => this.crearRespuesta(j, 1)));
    }

    /** GET de una lista filtrada, por ejemplo /orden_producto/orden/{id} */
    findBy(url) {
        return this.solicitar(url, { method: "GET" },
            r => r.json().then(j => this.crearRespuesta(j, j.length)));
    }

    /** POST /recurso. Resuelve con la entidad creada en datos y la cabecera Location en ubicacion. */
    create(registro) {
        return this.solicitar(this.URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registro)
        }, r => r.text().then(texto => {
            let response = this.crearRespuesta(texto ? JSON.parse(texto) : null, 1);
            response.ubicacion = r.headers.get("Location");
            return response;
        }));
    }

    /** PUT /recurso/{id} (se manda el objeto completo). Resuelve con el registro actualizado. */
    update(id, registro) {
        return this.solicitar(`${this.URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registro)
        }, r => r.json().then(j => this.crearRespuesta(j, 1)));
    }

    /** DELETE /recurso/{id}. El backend responde 204 sin cuerpo. */
    delete(id) {
        return this.solicitar(`${this.URL}/${id}`, { method: "DELETE" },
            () => Promise.resolve(this.crearRespuesta([], 0)));
    }
}
export default DefaultService;
