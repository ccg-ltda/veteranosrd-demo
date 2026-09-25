# AVA CRM · Veteranos RD (Demo)

Demo/tráiler de una plataforma de gestión de préstamos hecha a medida para la **Hermandad de Veteranos Pensionados de las FFAA y PN (Veteranos RD)**, construida como adaptación de la base comercial AVA-CRM-Comercial (React + Vite).

Todo el contenido, datos y flujos son **simulados**. No hay backend, base de datos, buró de crédito real, IA real ni integraciones. El objetivo es demostrar visual y narrativamente el ciclo de crédito de la institución.

## Historia del demo

AVA recibe la solicitud → se genera el prospecto → se consulta el buró → se precalifica → pasa a gestión → se convierte en crédito → se controla la cartera/cobranza → la gerencia visualiza resultados en reportes.

## Navegación principal

1. **Dashboard** — KPIs ejecutivos (cartera activa, solicitudes en proceso, mora, colocación).
2. **AVA** — asistente virtual que capta la solicitud de forma conversacional.
3. **Solicitudes de Crédito** — expediente por solicitante (monto, etapa, documentos, historial).
4. **Prospectos / Leads** — kanban por etapa del proceso de crédito.
5. **Buró de Crédito** — consulta simulada por solicitante (riesgo, score, obligaciones, alertas).
6. **Precalificación** — motor simulado (capacidad de pago, riesgo, monto sugerido, plazo).
7. **Créditos** — ciclo del crédito (monto, plazo, saldo, estado).
8. **Cobranza / Cartera** — cartera total, vencimientos, mora, gestión y promesas de pago.
9. **Gestiones** — tareas y seguimientos ligados a solicitudes/créditos.
10. **Agenda** — citas y actividades.
11. **Reportes** — solicitudes, colocación, cartera, cobranza y productividad.
12. **Configuración** — usuarios, roles y preferencias.

Módulos heredados de la base comercial (Salud, Cooperativa, Voluntariado, Convenios/Aliados, Beneficios/Programas, Ads, Automatizaciones, APIs, Sms, Correo) se conservan en el código pero quedan fuera de la navegación principal del tráiler.

## Identidad visual

Azul institucional como color estructural (navegación, jerarquía, botones) con rojo como acento estratégico (indicadores, estados importantes, detalles de encabezado), blancos/neutros azulados, gradientes sutiles, profundidad y microinteracciones — sin caer en estética comercial genérica ni militar/bélica.

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

- `src/pages/`: componentes de cada módulo del CRM (uno por pantalla, incluye Buró, Precalificación, Cobranza, Salud, Cooperativa, Voluntariado, etc.).
- `src/components/layout/`: navegación (sidebar) y encabezado.
- `src/components/legacy/`: adaptador temporal para la interfaz original (`LegacyFragment`, `GlobalUi`).
- `src/templates/`: marcado HTML por módulo, cargado vía `?raw` en cada página React.
- `src/styles/`: estilos globales (paleta azul/rojo, gradientes, animaciones).
- `public/legacy/crm.js`: estado mock y lógica de interacción de toda la app (render, navegación, modales).
- `legacy/`: copia del prototipo HTML original (AVA-CRM-Comercial), como referencia histórica.

## Nota técnica

La aplicación se monta con React, pero el comportamiento interactivo (estado, render de tablas/kanban/modales, `navigate()`) vive en `public/legacy/crm.js` como script clásico inyectado en tiempo de ejecución. Cada página React solo renderiza su fragmento de HTML (`dangerouslySetInnerHTML`); todos los módulos quedan montados simultáneamente y `navigate()` alterna su visibilidad. Los módulos pueden migrarse gradualmente a estado y eventos React sin cambiar la estructura del repositorio.

## Alcance del demo

Este repositorio es exclusivamente un tráiler comercial. No implementa reglas financieras reales, integración con buró de crédito, IA real ni procesos productivos. Toda la información de solicitantes, créditos y cartera es simulada para efectos de demostración.
