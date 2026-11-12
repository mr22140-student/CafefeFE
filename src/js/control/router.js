import { ROLES } from "../config.js";
import { normalizar } from "./texto.js";

/**
 * Rutas de la SPA. Se navega con el hash (#/orden), asi la pagina nunca se recarga
 * y funciona igual servida por browser-sync o instalada como PWA.
 * roles: null = publica; si no, solo esos roles pueden entrar.
 */
export const RUTAS = {
    "/orden": { elemento: "pagina-orden", titulo: "Ordenar", roles: null, menu: true },
    "/recepcion": { elemento: "pagina-recepcion", titulo: "Recepción de órdenes", roles: [ROLES.BARISTA, ROLES.COCINERO], menu: true },
    "/pago": { elemento: "pagina-pago", titulo: "Pago", roles: [ROLES.CAJERO], menu: true },
    "/login": { elemento: "pagina-login", titulo: "Iniciar sesión", roles: null, menu: false }
};

export const RUTA_INICIAL = "/orden";
export const RUTA_LOGIN = "/login";
export const NO_ENCONTRADA = { elemento: "pagina-no-encontrada", titulo: "Página no encontrada", roles: null, menu: false };

/**
 * Decide que pagina mostrar para un hash y el rol de la sesion.
 * Si la ruta pide un rol que no se tiene, manda al login y recuerda el destino.
 * @returns {{ruta, elemento, titulo, roles, destino?, redirigido?}}
 */
export function resolverRuta(hash, rol) {
    let ruta = (hash ?? "").replace(/^#/, "").split("?")[0] || RUTA_INICIAL;
    let definicion = RUTAS[ruta];
    if (!definicion) {
        return { ruta, ...NO_ENCONTRADA };
    }
    if (definicion.roles && !definicion.roles.includes(normalizar(rol))) {
        return { ruta: RUTA_LOGIN, ...RUTAS[RUTA_LOGIN], destino: ruta, redirigido: true };
    }
    return { ruta, ...definicion };
}

/** A donde va cada empleado despues del login. */
export function rutaPorRol(rol) {
    switch (normalizar(rol)) {
        case ROLES.CAJERO:
            return "/pago";
        case ROLES.BARISTA:
        case ROLES.COCINERO:
            return "/recepcion";
        default:
            return RUTA_INICIAL;
    }
}

/** Rutas que se muestran en el menu para ese rol. */
export function rutasDelMenu(rol) {
    return Object.entries(RUTAS)
        .filter(([, d]) => d.menu && (d.roles === null || d.roles.includes(normalizar(rol))))
        .map(([ruta, d]) => ({ ruta, titulo: d.titulo }));
}

export function navegar(ruta) {
    window.location.hash = "#" + ruta;
}
