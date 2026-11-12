# CafefeFE
Proyecto web de la materia PPI 2026 (Universidad de El Salvador). Sistema de cafetería Cafefe.

Integrantes:

- Marta Raquel Mata Roque
- Daniel Ernesto Menjivar Yaque

## Requisitos

- Node.js y browser-sync: `npm install -g browser-sync`
- Brave. En **Run and Debug** hay dos versiones de cada configuración: la normal (`/usr/bin/brave-browser`) y la **(snap)** (`/snap/bin/brave`), para Brave instalado como snap
- CafefeSV corriendo en NetBeans con la base de datos (Docker)

## Cómo correrlo

1. Levantar Postgres (Docker) y CafefeSV en NetBeans.
2. Revisar la URL del API en `src/js/config.js` (`URL_API`): debe ser la misma que usan para ver el JSON en el navegador.
3. En VS Code, panel **Run and Debug**:
   - **BrowserSync Brave**: sirve `src/` → app en `http://localhost:3000`
   - **BrowserSync Debug**: sirve la carpeta completa → app en `http://localhost:3000/src/` y pruebas en `http://localhost:3000/test/`

## Pruebas

Se hacen con Mocha + Chai + Sinon en el navegador, como se vio en clase. Las librerías están **solo** en
`test/js/lib`; la app (`src/`) no usa ninguna.

- `test/unit.html`: **unitarias** (`suite/test`). Simulan `fetch` con sinon, así que no necesitan el backend.
- `test/it.html`: **integración** (`describe/it`). Van contra CafefeSV real.
- `test/index.html`: lista para correr un archivo a la vez.
- Al crear un archivo de prueba nuevo, se agrega a `test/js/lista_pruebas.js`.

## Estructura

```
src/
├── index.html            solo <cafefe-app>
├── manifest.json         PWA: nombre, colores, iconos
├── sw.js                 service worker (cache del cascarón; NO cachea el API ni browser-sync)
├── js/
│   ├── config.js         URL del API, nombres de rol, id del mesero virtual
│   ├── main.js           registra componentes y service worker
│   ├── entity/           DefaultResponse, DefaultError
│   ├── control/          servicios REST (uno por entidad), router, sesión, login, instalador
│   └── boundary/         Web Components (<cafefe-app>, páginas, tarjetas, botones…)
└── recursos/
    ├── estilos/          principal.css (variables de diseño), componentes.css (compartido en Shadow DOM)
    ├── iconos/           iconos de la PWA
    └── imagenes/tipo_producto/{idTipoProducto}.svg   imagen de cada categoría (default.svg si no hay)
test/
├── unit.html, it.html, index.html
└── js/ control/ boundary/ lib/
```

## Rutas (SPA por hash)

| Ruta | Componente | Quién |
|---|---|---|
| `#/orden` | `<pagina-orden>` (HU2) | cualquiera, sin login |
| `#/login` | `<pagina-login>` (HU1) | empleados |
| `#/recepcion` | `<pagina-recepcion>` (HU3) | barista / cocinero |
| `#/pago` | `<pagina-pago>` (HU4) | cajero |

Si alguien abre una ruta sin tener el rol, el router lo manda al login y después lo regresa.

## Reglas del equipo para un componente nuevo

1. Archivo en `src/js/boundary/nombre_componente.js` con `customElements.define("nombre-componente", Clase)` (el nombre lleva guion).
2. `attachShadow({ mode: "open" })` y `${ESTILOS}` al inicio del shadow; los colores y tamaños salen de las variables de `principal.css`.
3. Los datos van por los servicios de `control/`, nunca con `fetch` directo en el componente.
4. Los componentes se comunican con `CustomEvent` (`bubbles: true, composed: true`). Para navegar: `cafefe:navegar` con `{ detail: { ruta } }`.
5. Los servicios se guardan en propiedades (`this.ordenService`), así las pruebas pueden reemplazarlos.
6. Agregar el archivo a `ARCHIVOS` en `src/sw.js` y subir `VERSION`.
7. Escribir sus pruebas en `test/js/boundary/` y agregarlas a `lista_pruebas.js`.
8. Accesibilidad: cada `input` con su `label`, mensajes de error con `role="alert"`, botones de verdad (`<button>`).
