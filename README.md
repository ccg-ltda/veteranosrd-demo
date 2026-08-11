# AVA CRM Comercial

Interfaz comercial organizada como una aplicación React con Vite.

## Requisitos

- Node.js 18 o superior
- npm

## Desarrollo

```bash
npm install
npm run dev
```

## Compilación

```bash
npm run build
```

La salida lista para despliegue se genera en `dist/`.
Los recursos usan rutas relativas, por lo que esa carpeta también puede publicarse bajo una subruta, como GitHub Pages.

## Estructura

- `src/pages/`: componentes de cada módulo del CRM.
- `src/components/layout/`: navegación y encabezado.
- `src/components/legacy/`: adaptador temporal para la interfaz original.
- `src/templates/`: marcado HTML separado por módulo.
- `src/styles/`: estilos globales.
- `public/legacy/crm.js`: comportamiento original preservado.
- `legacy/`: copia del prototipo original.

## Nota técnica

La aplicación ya se ejecuta y compila con React. Para evitar regresiones, conserva temporalmente los controladores DOM originales en `public/legacy/crm.js`. Los módulos pueden migrarse gradualmente a estado y eventos React sin cambiar la estructura del repositorio.
