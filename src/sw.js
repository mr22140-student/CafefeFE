/*
 * Service worker de Cafefe (PWA).
 *
 * - install: guarda en cache el "cascaron" de la app (HTML, JS, CSS, iconos).
 * - activate: borra caches de versiones anteriores.
 * - fetch: archivos propios -> primero la red (siempre lo mas nuevo) y si no hay
 *   conexion, la copia en cache. Asi funciona sin conexion y no se queda
 *   mostrando versiones viejas mientras se desarrolla.
 *
 * NO se cachea (como se indico en clase):
 *   - el API REST (otro origen: localhost:9080) -> siempre va a la red
 *   - browser-sync (/browser-sync/...)
 *
 */
const VERSION = "cafefe-v8";

const ARCHIVOS = [
    "./",
    "index.html",
    "js/boundary/boton_instalar.js",
    "js/boundary/cafefe_app.js",
    "js/boundary/cafefe_encabezado.js",
    "js/boundary/estado_conexion.js",
    "js/boundary/detalle_orden.js",
    "js/boundary/estilos.js",
    "js/boundary/formulario_pago.js",
    "js/boundary/lista_ordenes_pendientes.js",
    "js/boundary/pagina_login.js",
    "js/boundary/pagina_no_encontrada.js",
    "js/boundary/pagina_orden.js",
    "js/boundary/lista_productos.js",
    "js/boundary/carrito_orden.js",
    "js/boundary/pagina_pago.js",
    "js/boundary/pagina_recepcion.js",
    "js/boundary/tarjeta_simple.js",
    "js/boundary/ticket_factura.js",
    "js/config.js",
    "js/control/autenticacion.js",
    "js/control/caja_service.js",
    "js/control/caracteristica_service.js",
    "js/control/cobro.js",
    "js/control/default_service.js",
    "js/control/descuento_producto_service.js",
    "js/control/descuento_service.js",
    "js/control/empleado_rol_service.js",
    "js/control/empleado_service.js",
    "js/control/factura_orden_producto_service.js",
    "js/control/factura_service.js",
    "js/control/instalador.js",
    "js/control/mesero_virtual.js",
    "js/control/orden_cliente.js",
    "js/control/orden_producto_service.js",
    "js/control/orden_service.js",
    "js/control/pago_detalle_service.js",
    "js/control/pago_service.js",
    "js/control/producto_caracteristica_service.js",
    "js/control/producto_service.js",
    "js/control/producto_tipo_producto_service.js",
    "js/control/rol_service.js",
    "js/control/router.js",
    "js/control/sesion.js",
    "js/control/texto.js",
    "js/control/tipo_caracteristica_service.js",
    "js/control/tipo_descuento_service.js",
    "js/control/tipo_producto_service.js",
    "js/entity/default_error.js",
    "js/entity/default_response.js",
    "js/main.js",
    "manifest.json",
    "recursos/estilos/componentes.css",
    "recursos/estilos/principal.css",
    "recursos/iconos/icono-192.png",
    "recursos/iconos/icono-512.png",
    "recursos/iconos/icono-maskable-512.png",
    "recursos/imagenes/tipo_producto/default.png",
    "recursos/imagenes/tipo_producto/8e7dd2b5-5beb-4ccf-81bb-e0395e0b2b8f.png",
    "recursos/imagenes/tipo_producto/05865a67-37b0-42d1-8616-acdd20ed92f5.png",
    "recursos/imagenes/tipo_producto/ed5ff19d-f8e7-4eae-a2ce-9ae59940ad57.png",
    "recursos/imagenes/tipo_producto/16e88bee-c13b-4b1b-a0ca-26cddc92252b.png",
    "recursos/imagenes/tipo_producto/0718e8de-8de4-4540-ac57-d011e7ab1310.png"
];

self.addEventListener("install", evento => {
    evento.waitUntil(
        caches.open(VERSION).then(cache => cache.addAll(ARCHIVOS)).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", evento => {
    evento.waitUntil(
        caches.keys()
            .then(claves => Promise.all(claves.filter(c => c !== VERSION).map(c => caches.delete(c))))
            .then(() => self.clients.claim())
    );
});

function seDebeCachear(peticion) {
    let url = new URL(peticion.url);
    return peticion.method === "GET"
        && url.origin === self.location.origin      // el API REST esta en otro origen
        && !url.pathname.startsWith("/browser-sync");
}

self.addEventListener("fetch", evento => {
    let peticion = evento.request;
    if (!seDebeCachear(peticion)) {
        return;                                       // el navegador la hace normal
    }
    evento.respondWith(
        fetch(peticion)
            .then(respuesta => {
                if (respuesta.ok) {
                    let copia = respuesta.clone();
                    caches.open(VERSION).then(cache => cache.put(peticion, copia));
                }
                return respuesta;
            })
            .catch(() => caches.match(peticion, { ignoreSearch: true }).then(guardada =>
                guardada || (peticion.mode === "navigate" ? caches.match("index.html") : Response.error())))
    );
});
