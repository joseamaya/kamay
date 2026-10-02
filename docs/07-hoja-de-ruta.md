# 07 — Hoja de ruta

Plan por fases, de un MVP usable en aula a una versión estable. Los plazos son
orientativos y se ajustan al ritmo real del desarrollo.

## Fase 0 — Fundaciones

Objetivo: dejar el terreno listo para construir.

- Crear el repositorio nuevo (ver `08-archivo-y-nuevo-repositorio.md`).
- Elegir nombre final, licencia y dominio.
- Montar stack: **Vite + React + TypeScript**, lint y formato.
- Definir el **esquema Zod** y el store central.
- Sistema de diseño mínimo (tipografía, color, componentes base).
- CI: lint + tests + build.

**Hito:** la app vacía se construye y despliega en hosting estático.

## Fase 1 — MVP: escenario, objetos y ejecución

Objetivo: el estudiante crea algo y lo ve funcionar.

- Vista **Escenario** (Canvas 2D) con fondo y actores.
- Vista **Fábrica**: crear/eliminar objetos desde un catálogo.
- Atributos básicos: posición, rotación, escala (panel + arrastre).
- **Runtime Pyodide** en Web Worker con API mínima del motor.
- Vista **Código** generada en vivo (solo lectura).
- Guardar/abrir en IndexedDB y export/import.
- Mensajes de error en español.

**Hito (MVP):** crear un proyecto, poner un personaje, moverlo, ejecutarlo y
guardarlo, viendo el Python generado. Cubre los niveles 1–2.

## Fase 2 — Clases propias y código editable

Objetivo: el estudiante deja de usar solo lo prefabricado.

- Asistente de **clase propia** (atributos y métodos).
- Instanciar varios objetos de la misma clase; identidad y estado.
- Vista Código **editable** (CodeMirror 6) con resaltado y errores en línea.
- Paleta de métodos con parámetros tipados.
- Interacción entre objetos (eventos simples, colisiones básicas).
- Importador del **formato legado de Elix**.

**Hito:** el estudiante crea su clase, la instancia y escribe su primer método.
Cubre los niveles 3–4.

## Fase 3 — Bloques → código e herencia

Objetivo: la transición pedagógica completa.

- Bloques apilables para el cuerpo de métodos.
- Sincronización **bidireccional** bloques ⇄ código, con "código avanzado".
- **Herencia** entre clases.
- Escenas múltiples y sistema de eventos más rico.
- Física opcional (planck.js) cuando el nivel la requiera.

**Hito:** un proyecto con jerarquía de clases y lógica visual/código mezclada.
Cubre el nivel 5.

## Fase 4 — Aula y ludificación

Objetivo: que sea una herramienta lista para clase.

- Misiones, retos autocorregidos e insignias.
- **Modo proyector** y guías/plantillas para docentes.
- Compartir por enlace (proyecto codificado en la URL).
- Accesibilidad: teclado, contraste, tamaños.
- Portafolio/entrega de proyectos.

**Hito:** una unidad didáctica completa impartible solo con la herramienta.

## Fase 5 — Futuro

- Capa **3D** opcional (Three.js).
- Colaboración en tiempo real.
- Más catálogos de assets y mundos temáticos.
- Traducción a otros idiomas (la base i18n queda desde la fase 0).

## Riesgos y dependencias

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Peso/arranque de Pyodide | Alto en primera carga | Precarga diferida + caché + esqueleto de UI. |
| Complejidad del editor bidireccional | Alto (fase 3) | Empezar solo lectura→edición→bloques por pasos. |
| Licencias de assets heredados | Legal | Auditar y reemplazar; documentar en `CREDITS`. |
| Alcance del motor 2D | Medio | Empezar con lo mínimo del MVP; ampliar por niveles. |
| Tiempo de desarrollo sostenido | Medio | Fases con hitos entregables y MVP temprano. |

## Criterios de éxito del MVP (Fase 1)

1. Se abre en el navegador sin instalar nada.
2. Se crea un proyecto, se agrega un objeto y se cambian sus atributos.
3. Se ejecuta y se ve el comportamiento en el escenario.
4. El código Python generado es visible y correcto.
5. El proyecto se guarda, se cierra y se reabre sin pérdida.
