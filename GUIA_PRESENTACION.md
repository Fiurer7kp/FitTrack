# Guion de presentación de FitTrack

Duración sugerida: 5 minutos. Antes de grabar, ejecuta `npm start`, abre `http://localhost:4200/` y registra una cuenta de prueba. Los datos se guardan en el navegador; usa información ficticia.

## 1. Introducción (20 segundos)

> “FitTrack es una aplicación para organizar y dar seguimiento a entrenamientos. La construí con Angular 22 y Tailwind CSS. Desde el dashboard se puede consultar el progreso y navegar a ejercicios, rutinas, calendario, cronómetro y perfil.”

## 2. Inicio de sesión y navegación (40 segundos)

> “La pantalla inicial permite registrar una cuenta o iniciar sesión. Las rutas están definidas en `src/app/app.routes.ts`. La ruta raíz lleva al login y las secciones privadas usan `authGuard`; las pantallas se cargan bajo demanda con `loadComponent`, para no cargar todos los componentes desde el inicio.”

Acción en pantalla: iniciar sesión y recorrer los enlaces del dashboard.

> “Cada pantalla es un componente standalone. Angular muestra la vista activa dentro de `RouterOutlet`, que está en el componente raíz. Los templates usan las directivas de control de flujo de Angular para mostrar listas, estados vacíos y formularios.”

## 3. Dashboard (45 segundos)

> “El dashboard presenta métricas semanales, una racha, una gráfica de peso y las sesiones recientes. Las métricas se calculan a partir del historial. Angular Signals (`signal` y `computed`) mantienen esos valores sincronizados cuando cambia la lista de sesiones.”

Acción en pantalla: cambiar el rango de la gráfica y abrir el registro de sesión.

## 4. Registrar y gestionar sesiones (1 minuto)

> “En el cronómetro puedo iniciar, pausar y reiniciar el tiempo. Al guardar, la sesión queda en el almacenamiento local del navegador. Desde el calendario puedo elegir un día, editar el nombre, fecha, duración y calorías, o eliminar la sesión. También puedo eliminar una sesión desde el dashboard.”

Acción en pantalla: guardar una sesión breve, abrir el calendario, editarla y luego mostrar la confirmación de eliminación.

> “La persistencia está encapsulada en las funciones del dominio de entrenamientos, en `src/app/dashboard/workout.ts`. Allí se normalizan las fechas al leer datos serializados y se validan los cambios antes de guardarlos. Si el almacenamiento falla, la interfaz muestra un mensaje en vez de indicar que la operación se completó.”

## 5. Componentes y otras secciones (50 segundos)

> “La biblioteca de ejercicios permite buscar, filtrar y administrar ejercicios. Las rutinas permiten crear planes y consultar su detalle. El perfil edita los datos personales, y el temporizador de descanso tiene duraciones predefinidas y una duración personalizada. Cada sección mantiene su lógica en TypeScript, la presentación en HTML y los estilos en SCSS.”

Acción en pantalla: enseñar brevemente ejercicios, rutinas y perfil.

## 6. Pruebas y compilación (45 segundos)

> “Las pruebas están junto a los componentes y servicios, en archivos `.spec.ts`. Usamos el ejecutor de pruebas de Angular con Vitest y Chromium. Hay pruebas de cálculos, almacenamiento, autenticación, calendario, formularios y temporizadores. Se ejecutan con `npm test`; `npm run build` valida que la aplicación compile para producción.”

Mostrar en terminal:

```bash
npm test
npm run build
```

## 7. Cierre (20 segundos)

> “El proyecto demuestra navegación con rutas protegidas, componentes standalone, estado reactivo con Signals, persistencia local y pruebas automatizadas. Como siguiente etapa, se podría agregar un backend para sincronizar cuentas e historiales entre dispositivos. Actualmente los datos permanecen en el navegador y no se sincronizan.”

## Mapa rápido del código

- `src/app/app.routes.ts`: rutas, protección con `authGuard` y carga diferida de componentes.
- `src/app/app.ts` y `src/app/app.html`: componente raíz y `RouterOutlet`.
- `src/app/auth/`: registro, login, sesión local y protección de rutas.
- `src/app/dashboard/`: métricas, gráficas, historial y modelos/cálculos de entrenamientos.
- `src/app/calendar/`: vista mensual y edición del historial por fecha.
- `src/app/timer/`: cronómetro, temporizador de descanso y registro de una sesión.
- `src/app/exercises/` y `src/app/routines/`: administración de ejercicios y rutinas.
- `src/app/**/*.spec.ts`: pruebas unitarias de componentes, servicios y lógica.

La autenticación y los datos del prototipo usan `localStorage`; esto es adecuado para una demostración local, no para producción con datos reales.
