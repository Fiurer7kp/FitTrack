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

> “En el cronómetro puedo iniciar, pausar y reiniciar el tiempo; también agrego ejercicios y registro repeticiones y peso por serie. Al guardar, la sesión queda en el historial local y el dashboard calcula los récords personales a partir de las series reales. Desde el calendario puedo editar o eliminar sesiones y planificar o cancelar rutinas en fechas concretas. Los planes se muestran diferentes de los entrenamientos ya completados.”

Acción en pantalla: guardar una sesión breve con series, mostrar un récord en el dashboard, abrir el calendario y planificar una rutina para una fecha.

> “La persistencia está encapsulada en las funciones del dominio de entrenamientos, en `src/app/dashboard/workout.ts`. Allí se normalizan las fechas al leer datos serializados y se validan los cambios antes de guardarlos. Si el almacenamiento falla, la interfaz muestra un mensaje en vez de indicar que la operación se completó.”

## 5. Componentes y otras secciones (50 segundos)

> “La biblioteca de ejercicios permite buscar, filtrar y administrar ejercicios. Las rutinas permiten crear planes semanales y consultar su detalle. En el perfil puedo guardar peso y cintura con fecha y revisar la diferencia entre la primera y la última medida. El temporizador de descanso tiene duraciones predefinidas y una duración personalizada. Cada sección mantiene su lógica en TypeScript, la presentación en HTML y los estilos en SCSS.”

Acción en pantalla: enseñar brevemente ejercicios, rutinas y el historial de medidas del perfil.

## 6. Pruebas y compilación (45 segundos)

> “Las pruebas están junto a los componentes y servicios, en archivos `.spec.ts`. Usamos el ejecutor de pruebas de Angular con Vitest y Chromium. Hay pruebas de cálculos, almacenamiento por cuenta, autenticación, edición y planificación de calendario, tendencias de medidas, formularios y temporizadores. Se ejecutan con `npm test`; `npm run build` valida que la aplicación compile para producción.”

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
- `src/app/calendar/`: vista mensual, edición del historial y agenda de rutinas planificadas.
- `src/app/timer/`: cronómetro, temporizador de descanso y registro de ejercicios por serie.
- `src/app/profile/`: perfil y medidas corporales; `body-measurement.ts` valida y persiste el historial fechado.
- `src/app/exercises/` y `src/app/routines/`: administración de ejercicios y rutinas semanales.
- `src/app/**/*.spec.ts`: pruebas unitarias de componentes, servicios y lógica.

La autenticación y los datos del prototipo usan `localStorage`; esto es adecuado para una demostración local, no para producción con datos reales.
