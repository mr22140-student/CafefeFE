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

