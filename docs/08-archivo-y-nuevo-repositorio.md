# 08 — Archivo de Elix y creación del repositorio nuevo

Checklist operativa para cerrar este repositorio y arrancar el nuevo. Estas
acciones las ejecuta una persona (implican cambios en GitHub); este documento
las deja por escrito para no olvidar pasos.

## A. Cierre y archivo de Elix

- [ ] Confirmar que toda la documentación útil está en
  `docs/nuevo-proyecto/` (este proyecto ya no se mantendrá).
- [ ] Mover/duplicar la documentación al repositorio nuevo (sección C).
- [ ] Etiquetar el estado final del repositorio:
  `git tag -a v1.0-legacy -m "Última versión de Elix"` y `git push --tags`.
- [ ] Añadir un aviso al inicio de `README.md`:

  > **Proyecto archivado.** Elix (Python 2 + PyQt4) quedó desfasado. Su esencia
  > continúa en **Kamay**: https://github.com/joseamaya/kamay. Este repositorio
  > se mantiene solo como referencia histórica.

- [ ] Archivar el repositorio en GitHub (*Settings → Archive this repository*),
  de modo que quede **de solo lectura**.
- [ ] (Opcional) Crear una **release** final con el `principal.py` de ejemplo
  (`ejemplos/Lucha`) y capturas, para preservar el legado funcional.

## B. Decisiones a fijar antes de crear el repo nuevo

- [x] **Nombre final**: **Kamay** (ver `02-nombre-y-marca.md`).
- [ ] **Licencia** del proyecto nuevo (aún sin fijar):
  - `MIT` o `Apache-2.0`: máxima reutilización educativa. *(Recomendada)*
  - `GPLv3` / `AGPLv3`: garantiza que las mejoras sigan abiertas.
- [x] **Visibilidad**: público.
- [x] **Organización/cuenta** de GitHub: `joseamaya`.
- [ ] **Dominio** para la app desplegada (opcional en el arranque).

## C. Creación del repositorio nuevo

1. Crear el repositorio en GitHub:
   `gh repo create joseamaya/kamay --public --description "Entorno interactivo y didáctico para aprender POO"`.
2. Inicializar el stack web (ver `04-arquitectura-tecnica.md`):
   - [ ] `Vite + React + TypeScript`.
   - [ ] Lint/formato (ESLint + Prettier) y **CI** (lint + test + build).
   - [ ] Estructura `src/modelo`, `src/store`, `src/generador`, `src/runtime`,
         `src/motor`, `src/vistas`, `src/persistencia`, `src/i18n`, `src/ui`.
3. Copiar esta documentación a `docs/` del repo nuevo y enlazarla desde el
   `README.md`.
4. `README.md` mínimo: enunciado principal (de `01-manifiesto-y-vision.md`),
   estado, cómo ejecutar en desarrollo, cómo desplegar y licencia.
5. Añadir `CONTRIBUTING.md` con:
   - [ ] Convención de **ramas** (p. ej. `feature/…`, `fix/…`) y de **commits**
         (Conventional Commits: `feat:`, `fix:`, `docs:`…).
   - [ ] Flujo de **PR** (una revisión, CI en verde antes de fusionar).
   - [ ] Cómo correr tests y lint localmente.
6. Añadir plantillas de **issues** y, si aplica, de **PR**.
7. Elegir y registrar los **assets** reutilizables con licencia clara
   (ver `05-inventario-y-actualizacion-dependencias.md`); crear `CREDITS`.

## D. Primer contenido (semilla)

- [ ] Implementar el **MVP de Fase 1** (ver `07-hoja-de-ruta.md`).
- [ ] Migrar `ejemplos/Lucha` con el **importador legado** como prueba de
  paridad: el ejemplo debe reconstruirse en el modelo JSON.
- [ ] Publicar la primera versión desplegada (GitHub Pages / Netlify /
  Cloudflare Pages).

## E. Convenciones de trabajo sugeridas

- **Idioma:** interfaz, textos y documentación en **español**; código e
  identificadores en inglés (convención habitual y portable).
- **Commits:** Conventional Commits, mensajes cortos y en español o inglés de
  forma consistente.
- **Funcionalidad nueva:** acompañada de test (unidad o E2E según corresponda).
- **Cambios de modelo JSON:** siempre con **migración** y test de esquema.
- **Documentación:** toda decisión didáctica o técnica relevante se refleja en
  `docs/`.

## F. Qué NO migrar

- Nada de `pilasengine/` ni su lógica de escritorio.
- El formato plano `objetos`/`propiedades`/`metodos` (salvo el importador).
- Assets cuya licencia no esté clara.
- Dependencias Python 2 / PyQt4 / pybox2d / pygame.

## Resultado esperado

Elix queda **archivado y legible** como referencia, y el repositorio nuevo
arranca con: stack web moderno, documentación completa, CI, MVP planificado y
un ejemplo migrado que demuestra la continuidad de la esencia.
