# Contribuir a Kamay

Gracias por ayudar a construir Kamay. Estas son las reglas de trabajo del
proyecto.

## Puesta en marcha

```bash
pnpm install
pnpm dev
```

Se requiere Node.js >= 22.12 (ver `.nvmrc`).

## Ramas

- `feature/<tema>` para funcionalidad nueva.
- `fix/<tema>` para correcciones.
- `docs/<tema>` para documentación.
- `chore/<tema>` para tareas de mantenimiento.

Parte siempre de `main` y mantén la rama enfocada en un solo cambio.

## Commits

Usamos **Conventional Commits**: `feat:`, `fix:`, `docs:`, `test:`, `chore:`,
`refactor:`. El mensaje describe el **qué** y el **por qué**, no el cómo.

```text
feat: add class wizard to the factory view
fix: keep undo history when loading a project
docs: document the JSON schema migrations
```

## Flujo de Pull Request

1. Abre el PR contra `main` con una descripción clara.
2. La **CI debe estar en verde** (lint, formato, typecheck, test, build y e2e).
3. Se requiere **una revisión** antes de fusionar.
4. Fusiona con _squash_ para mantener un historial limpio.

## Antes de enviar

Ejecuta localmente:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
```

Añade test a toda funcionalidad nueva (unidad o e2e según corresponda).

## Modelo de datos

El **JSON es la fuente de verdad**. Cualquier cambio en el esquema
(`src/model/`):

- sube `CURRENT_SCHEMA_VERSION`,
- añade una **migración** en `src/model/migrations.ts`,
- incluye un test de esquema y de migración.

## Idioma

- **Código e identificadores en inglés.**
- **Interfaz, textos y documentación en español.**

## Licencia

Al contribuir aceptas que tu aporte se publique bajo la licencia [MIT](LICENSE).
