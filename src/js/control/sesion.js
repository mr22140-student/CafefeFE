import { normalizar } from "./texto.js";

const CLAVE = "cafefe.sesion";

/** Evento que se dispara en window cada vez que la sesion cambia. */
export const EVENTO_SESION = "cafefe:sesion";

/**
 * Sesion del empleado que inicio sesion (HU1).
 * Se guarda en sessionStorage: dura mientras la pestaña o la app esten abiertas.
 * Si el navegador no deja usar sessionStorage, se guarda solo en memoria.
 */
export class Sesion {
    constructor(almacen = obtenerAlmacen(), objetivo = window) {
        this.almacen = almacen;
        this.objetivo = objetivo;
        this.enMemoria = null;
    }

    /** { empleado: {idEmpleado, nombre, apellido}, rol: {idRol, nombre}, idEmpleadoRol } o null */
    obtener() {
        try {
            let texto = this.almacen ? this.almacen.getItem(CLAVE) : null;
            return texto ? JSON.parse(texto) : this.enMemoria;
        } catch (e) {
            return this.enMemoria;
        }
    }

    iniciar(datos) {
        this.enMemoria = datos;
        try {
            this.almacen?.setItem(CLAVE, JSON.stringify(datos));
        } catch (e) {
            // sin almacenamiento: queda solo en memoria
        }
        this.avisar();
    }

    cerrar() {
        this.enMemoria = null;
        try {
            this.almacen?.removeItem(CLAVE);
        } catch (e) {
            // nada que borrar
        }
        this.avisar();
    }

    estaIniciada() {
        return this.obtener() !== null;
    }

    /** Nombre del rol normalizado ("cajero", "barista"...) o null si no hay sesion. */
    rol() {
        let datos = this.obtener();
        return datos && datos.rol ? normalizar(datos.rol.nombre) : null;
    }

    tieneRol(roles) {
        let actual = this.rol();
        return actual !== null && roles.map(normalizar).includes(actual);
    }

    avisar() {
        this.objetivo.dispatchEvent(new CustomEvent(EVENTO_SESION, { detail: this.obtener() }));
    }
}

function obtenerAlmacen() {
    try {
        return window.sessionStorage;
    } catch (e) {
        return null;
    }
}

/** Instancia compartida por toda la app. */
export const sesion = new Sesion();
