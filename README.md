# FitTrack

Aplicación de seguimiento de entrenamiento construida con Angular 22 y Tailwind CSS 4.

## Funcionalidades

- Registro, inicio y cierre de sesión con cuentas guardadas en el navegador.
- Biblioteca de ejercicios con búsqueda, filtros y operaciones CRUD.
- Creación, edición, eliminación y detalle de rutinas semanales.
- Calendario mensual con días de entrenamiento y detalle por día.
- Edición del perfil y estadísticas generales.
- Cronómetro de entrenamiento y temporizador de descanso configurable.
- Tema claro/oscuro con preferencia guardada en el navegador.

> El dashboard, calendario y estadísticas reutilizan actualmente los entrenamientos de demostración existentes. El registro de sesiones reales todavía no está implementado.

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
