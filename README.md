# FitTrack

Aplicación de seguimiento de entrenamiento construida con Angular 22 y Tailwind CSS 4.

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

## Desarrollo

```bash
npm start
```

La aplicación se sirve en `http://localhost:4200/`.

## Pruebas

Se requiere Chromium, instalado por Playwright:

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
