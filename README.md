# Veteranos RD · Demo V2

Demo del sistema de créditos de la **Hermandad de Veteranos Pensionados de las FFAA y PN (Cooperativa)**. Versión V2 aprobada.

Todo el contenido, datos y flujos son **simulados**. No hay backend, base de datos, buró de crédito real, IA real ni integraciones.

## Estructura

- `index.html`: el demo completo (HTML, CSS, JS, datos mock e iconos embebidos). Es la única fuente de verdad.
- `vite.config.js` y `package.json`: solo empaquetan y sirven `index.html` (Vite, sin frameworks).

## Módulos

Dashboard, AVA, Solicitudes de crédito, Prospectos, Buró de crédito, Precalificación, Créditos, Cartera, Agenda, Reportes y Configuración.

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
npm run preview
```

La salida se genera en `dist/`. Usa rutas relativas.

## Despliegue en Vercel

Framework preset: Vite. Build command `npm run build`, output directory `dist`. No requiere backend ni variables de entorno.
