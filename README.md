# FitTrack

FitTrack es una aplicación web para registrar y consultar entrenamientos. Permite administrar ejercicios y rutinas, planificar sesiones en un calendario, guardar series y medidas corporales, y revisar el progreso. Está construida con Angular 22 y Tailwind CSS 4.

## Funcionalidades

- Registro, inicio y cierre de sesión con cuentas guardadas en el navegador.
- Biblioteca de ejercicios con sugerencias por nombre, grupo muscular automático, búsqueda y operaciones CRUD.
- Historial por ejercicio con gráficas seleccionables de peso máximo, repeticiones y volumen.
- Creación, edición, eliminación y detalle de rutinas semanales.
- Registro de sesiones con ejercicios y detalle de repeticiones y peso por serie; cálculo de récords personales.
- Calendario mensual para consultar sesiones, editarlas/eliminarlas y planificar o cancelar rutinas.
- Historial de peso y cintura con medidas fechadas y tendencias en el perfil.
- Edición del perfil y estadísticas generales.
- Cronómetro de entrenamiento que permite guardar sesiones y temporizador de descanso configurable.
- Tema claro/oscuro con preferencia guardada en el navegador.
- Dashboard con métricas, gráfica de progreso e historial reciente con opción para eliminar sesiones.

Los datos de ejemplo se muestran cuando todavía no hay un historial guardado. Los historiales de sesiones y medidas, las rutinas y los planes del calendario se separan por cuenta y se guardan localmente en el navegador; no hay servidor ni sincronización entre dispositivos. FitTrack es un prototipo académico, no un servicio de autenticación o almacenamiento de producción.

## Conceptos del curso aplicados

- **Componentes:** la aplicación se organiza en pantallas para dashboard, ejercicios, rutinas, calendario, perfil y temporizador, además del componente reutilizable `MetricCard`.
- **Estructuras de control:** las plantillas usan `@if` para mostrar estados y mensajes según los datos, y `@for` para recorrer ejercicios, rutinas, medidas y sesiones.
- **Signals:** `signal` mantiene estados que cambian durante el uso; `computed` deriva métricas y datos visibles. Se usan, por ejemplo, en el dashboard, calendario, perfil, temporizador y autenticación.
- **Manejo de eventos:** eventos como `(click)` responden a acciones de botones; `(ngSubmit)` procesa el envío de formularios.
- **Formularios:** los formularios reactivos y sus validaciones se usan en inicio de sesión/registro, ejercicios, rutinas, perfil y medidas corporales.
- **Comunicación entre componentes:** el dashboard entrega datos al componente reutilizable `app-metric-card` mediante sus entradas requeridas. Los servicios `AuthService` y `ThemeService` comparten estado entre pantallas.

## Desarrollo

Se requiere Node.js y npm compatibles con Angular 22. Desde la carpeta del proyecto, instala las dependencias y ejecuta la aplicación:

```bash
npm install
npm start
```

La aplicación se sirve en `http://localhost:4200/`.

## Pruebas

Se requiere Chromium. Instálalo con Playwright y ejecuta las pruebas:

```bash
npx playwright install chromium
npm test
```

Para ejecutar las pruebas en modo observación:

```bash
npm run test:watch
```

## Compilación

```bash
npm run build
```

Los artefactos se generan en `dist/`.
