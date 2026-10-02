# 05 — Inventario y actualización de dependencias

Inventario de las dependencias del Elix actual y su reemplazo en el proyecto
nuevo. El objetivo es **actualizar todo el stack** y eliminar tecnología sin
mantenimiento.

## Dependencias actuales (Elix)

Detectadas en `setup.py`, `elix/` y `pilasengine/`:

| Dependencia | Uso en Elix | Estado |
| --- | --- | --- |
| Python 2.7 | Lenguaje base. | **Obsoleto** (sin soporte). |
| PyQt4 | Interfaz de escritorio (IDE, diálogos). | **Obsoleto** (PyQt4 no existe para Python 3 moderno). |
| pilas-engine 1.3.2 | Motor 2D: actores, escenas, dibujado, wizard. | **Sin mantenimiento** (vendido en el repo). |
| Box2D (pybox2d) | Física en `pilasengine/fisica`. | **Obsoleto** (bindings pybox2d abandonados). |
| pygame | Audio (`pygame.mixer`). | **Reemplazable** (atado a escritorio). |
| pytweener | Interpolaciones/tween. | **Obsoleto**. |
| appdirs | Rutas de configuración por SO. | Innecesario en web. |
| autocompletar (PyQt) | Autocompletado del intérprete interno. | Reemplazado por el editor web. |
| setuptools / `setup.py` | Empaquetado. | Reemplazado por el gestor del stack web. |
| Módulos stdlib Python 2 | `imp`, `reload`, `<>`, `dict.has_key`. | Desaparecen con Python 3. |

## Mapeo a equivalentes modernos

| Necesidad | Antes (Elix) | Ahora (nuevo proyecto) | Motivo |
| --- | --- | --- | --- |
| Interfaz / IDE | PyQt4 | **React + TypeScript** | Web, multiplataforma, mantenida. |
| Compilación de UI | Qt Designer / uic | Componentes React + sistema de diseño | Flujo web estándar. |
| Estado de la app | Variables en `VentanaPrincipal` | **Zustand** + Zod | Estado tipado y validado. |
| Validación de datos | Parseo manual con `split` | **Zod** | Esquema único, errores claros. |
| Motor 2D | pilas-engine 1.3.2 | **Motor propio sobre Canvas 2D** | Control total, sin dependencia muerta. |
| Física | Box2D (pybox2d) | **planck.js** (opcional) | JS puro, mantenido, opcional por nivel. |
| Audio | pygame.mixer | **Web Audio API** (o Howler.js) | Nativo del navegador. |
| Tweens | pytweener | **tween.js** o propio | Ligero y mantenido. |
| Editor de código | widget PyQt | **CodeMirror 6** | Resaltado, autocompletado, ligero. |
| Ejecutar Python | CPython 2 del sistema | **Pyodide** (Python 3 en WASM) | Python real en el navegador. |
| Persistencia | Archivos planos + `os.getcwd()` | **IndexedDB** + export/import | Sin sistema de archivos, portable. |
| Configuración | appdirs | `localStorage` / IndexedDB | No aplica en web. |
| Empaquetado | setuptools | **Vite** + hosting estático | Estándar actual. |
| Pruebas | `unittest` (Python 2) | **Vitest + RTL + Playwright** | Pruebas de unidad, componentes y E2E. |

## Notas por dependencia

### Pyodide (runtime Python)

- Provee **Python 3 real** en el navegador vía WebAssembly.
- Debe correr en **Web Worker** para no bloquear la UI.
- Considerar su peso (~varios MB) y precargar en diferido.

### planck.js (física)

- Solo se activa en los niveles que necesitan física real.
- Para colisiones simples (nivel 2–4) basta una detección AABB/círculos propia.

### CodeMirror 6

- Elegido sobre Monaco por ser **más liviano** y fácil de integrar con React.
- Debe soportar resaltado de Python y marcado de errores en línea.

### Web Audio API / Howler.js

- Howler simplifica la reproducción y el control de sonido; Web Audio pura
  reduce dependencias. **Decidir en el MVP** según necesidad real de mezcla.

## Migración de recursos (assets)

El repo antiguo trae recursos en `data/` (imágenes PNG, audio WAV, fuentes TTF)
y en `pilasengine/`. Antes de reutilizarlos:

- [ ] **Verificar licencias de cada asset.** `pilasengine` es LGPLv3, pero los
  recursos gráficos y sonoros pueden tener licencias propias (algunos parecen
  de terceros: pájaros, monedas, fuentes, etc.).
- [ ] Separar assets **reutilizables con licencia clara** de los dudosos.
- [ ] Convertir audio WAV a **OGG/MP3** para web; optimizar PNG a WebP.
- [ ] Sustituir fuentes por **fuentes web** con licencia libre.
- [ ] Documentar la procedencia y licencia de cada recurso en un `CREDITS`.

> Regla: si la licencia de un asset no está clara, **no se reutiliza**; se
> reemplaza por uno libre o se genera uno nuevo.

## Licencia del proyecto

- Elix hereda LGPLv3 del pilas-engine vendido. Para el proyecto nuevo, decidir
  una licencia explícita (se sugiere **MIT** o **Apache-2.0** para máxima
  reutilización educativa, o **GPLv3** si se quiere garantizar apertura).
- Decisión pendiente → ver `08-archivo-y-nuevo-repositorio.md`.

## Resumen

Se elimina toda dependencia atada a Python 2, PyQt4, pilas-engine y pybox2d, y
se reconstruye el producto como aplicación web con un stack mantenido:
**TypeScript + React + Canvas 2D + Pyodide**, con pruebas y despliegue modernos.
