# CafefeFE
Proyecto web de la materia PPI 2026 (Universidad de El Salvador). Sistema de cafetería Cafefe.

Integrantes:

- Marta Raquel Mata Roque
- Daniel Ernesto Menjivar Yaque


## Herramientas que se necesitan (◕‿◕)

- **Node.js y npm**, para instalar browser-sync: `npm install -g browser-sync`
- **Visual Studio Code**, para correr el proyecto con las tareas de `.vscode`
- **Brave** en `/usr/bin/brave-browser` (si está en otra ruta, cambiarla en `.vscode/launch.json`)
- **Backend CafefeSV** corriendo en NetBeans con Open Liberty (puerto 9080)
- **PostgreSQL** (en Docker) con la base de datos de CafefeSV

Las pruebas usan Mocha, Chai y Sinon, que ya vienen dentro de `test/js/lib`: no hay que instalar nada más.

## Cómo correrlo >:D

1. Levantar PostgreSQL y CafefeSV en NetBeans.
2. Abrir esta carpeta en VS Code y, en **Run and Debug**, elegir **BrowserSync Brave**: la app abre en `http://localhost:3000`.
3. Para las pruebas, elegir **BrowserSync Debug** y abrir `http://localhost:3000/test/`.
