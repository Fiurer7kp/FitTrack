# FitTrack

Aplicación de seguimiento de entrenamiento construida con Angular 22 y Tailwind CSS 4.

## Funcionalidades

- Registro, inicio y cierre de sesión con cuentas guardadas en el navegador.
- Biblioteca de ejercicios con búsqueda, filtros y operaciones CRUD.
- Creación, edición, eliminación y detalle de rutinas semanales.
- Calendario mensual con días de entrenamiento y edición y eliminación de sesiones.
- Edición del perfil y estadísticas generales.
- Cronómetro de entrenamiento que permite guardar sesiones y temporizador de descanso configurable.
- Tema claro/oscuro con preferencia guardada en el navegador.
- Dashboard con métricas, gráfica de progreso e historial reciente con opción para eliminar sesiones.

Los datos de ejemplo se muestran cuando todavía no hay un historial guardado. Las sesiones se separan por cuenta, pero los datos de las cuentas, rutinas, ejercicios y sesiones se almacenan localmente en el navegador; no hay servidor ni sincronización entre dispositivos. FitTrack es un prototipo académico, no un servicio de autenticación o almacenamiento de producción.

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

## Presentación

Consulta [GUIA_PRESENTACION.md](./GUIA_PRESENTACION.md) para un guion de demostración y una explicación breve de las rutas, componentes y pruebas.
