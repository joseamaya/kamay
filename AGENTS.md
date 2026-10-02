# AGENTS.md

Guía para agentes que trabajen en este repositorio.

## Proyecto

**Kamay**: aplicación web (solo cliente) para aprender Programación Orientada a
Objetos. El estudiante construye clases y objetos de forma visual y ve el
**código Python real** que genera. Stack: TypeScript + React + Vite, estado con
Zustand, esquema JSON versionado con Zod, Tailwind CSS v4. Fases futuras: Pyodide
en Web Worker, motor Canvas 2D, IndexedDB.

La documentación de diseño está en [`docs/`](docs/README.md) y es la referencia
autoritativa. Código actual: **Fase 0 (Fundaciones)**.

## Comandos

Usar Node >= 22.12 (`.nvmrc`) y pnpm.

```bash
pnpm install
pnpm dev
pnpm build        # tsc -b && vite build
pnpm preview
pnpm lint         # oxlint
pnpm format       # Prettier (escribe)
pnpm format:check # Prettier (verifica)
pnpm typecheck    # tsc -b
pnpm test         # Vitest
pnpm test:e2e     # Playwright
```

Tras cualquier cambio, ejecutar como mínimo `pnpm lint`, `pnpm typecheck` y
`pnpm test`. Antes de dar algo por terminado, `pnpm build`.

## Estructura

```
src/
  model/         # esquema Zod, tipos y migraciones (fuente de verdad)
  store/         # estado central con undo/redo
  generator/     # modelo JSON -> Python determinista
  runtime/       # contrato del puente a Pyodide
  engine/        # contrato del motor Canvas 2D
  views/         # escenario, fábrica, código, barra
  persistence/   # contrato de IndexedDB y export/import
  i18n/          # textos en español
  ui/            # componentes reutilizables
```

## Convenciones

- **Código e identificadores en inglés**; **UI y documentación en español**.
  Todas las cadenas visibles viven en `src/i18n/es.ts`; no escribir literales en
  español dentro de los componentes.
- **No añadir comentarios** salvo que sean necesarios para explicar una decisión
  no obvia.
- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- **No hacer commit, push ni PR** salvo que se pida explícitamente.
- Cambios en el modelo JSON: subir `CURRENT_SCHEMA_VERSION`, añadir migración en
  `src/model/migrations.ts` y test de esquema.
- Añadir test a la funcionalidad nueva.
