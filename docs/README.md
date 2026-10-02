# Documentación del nuevo proyecto

Esta carpeta reúne los documentos que rescatan la esencia de **Elix** y definen
el producto que lo reemplazará: un entorno **interactivo, lúdico y didáctico
para aprender Programación Orientada a Objetos (POO)**.

Elix queda como legado. Aquí no se documenta cómo mantener Elix, sino **qué se
conserva, qué se mejora y cómo se construye la nueva versión**.

## Índice

| Documento | Contenido |
| --- | --- |
| [01-manifiesto-y-vision.md](01-manifiesto-y-vision.md) | Enunciado principal, esencia rescatada, público y propuesta de valor. |
| [02-nombre-y-marca.md](02-nombre-y-marca.md) | Shortlist de nombres, pros/contras y recomendación con metáfora didáctica. |
| [03-diseno-didactico.md](03-diseno-didactico.md) | Progresión de aprendizaje de POO, mecánica híbrida bloques→código, evaluación. |
| [04-arquitectura-tecnica.md](04-arquitectura-tecnica.md) | Stack web, modelo de datos JSON, ejecución con Pyodide, persistencia y testing. |
| [05-inventario-y-actualizacion-dependencias.md](05-inventario-y-actualizacion-dependencias.md) | Mapeo de librerías antiguas a equivalentes modernos. |
| [06-paridad-funcional-elix.md](06-paridad-funcional-elix.md) | Capacidades de Elix → conservar / mejorar / descartar / añadir. |
| [07-hoja-de-ruta.md](07-hoja-de-ruta.md) | Fases MVP → v1, hitos y riesgos. |
| [08-archivo-y-nuevo-repositorio.md](08-archivo-y-nuevo-repositorio.md) | Checklist para archivar Elix y crear el repositorio nuevo. |

## Decisiones ya tomadas

- **Plataforma:** aplicación web.
- **Stack:** TypeScript + React, motor de juego en **Canvas 2D** (capa 3D
  opcional más adelante).
- **Lenguaje que aprende el estudiante:** **Python** ejecutado en el navegador
  con **Pyodide**.
- **Idioma y público:** español, personas principiantes.
- **Representación del programa:** híbrido **constructor de clases → código**,
  con los bloques/paletas transformándose progresivamente en Python real.
- **Modelo de datos:** **JSON versionado** como fuente de verdad; el Python
  generado es un artefacto editable, no la fuente.

## Cómo usar esta carpeta

1. Leer `01-manifiesto-y-vision.md` para entender el "por qué".
2. Usar `03-diseno-didactico.md` y `06-paridad-funcional-elix.md` para decidir
   qué enseñar y qué construir.
3. Usar `04-arquitectura-tecnica.md` y `05-inventario-y-actualizacion-dependencias.md`
   como base técnica para el nuevo repositorio.
4. Seguir `08-archivo-y-nuevo-repositorio.md` cuando se archive Elix y se cree
   el repositorio nuevo.

## Estado

Documentos de **diseño previo**. No describen software ya implementado; son la
guía para arrancar el repositorio nuevo.
