# Kamay

> **An interactive, playful and didactic environment to learn Object-Oriented
> Programming, where the student builds classes and objects by playing and sees,
> at all times, the real Python code being generated.**

**Kamay** is a Quechua word meaning _to create, to shape, to found_ and, in its
Andean use, _to animate / to give a soul_. It sums up the two actions of the
environment: you **shape** a class and you **bring** objects **to life**.

The user interface is in Spanish; the codebase, tooling and documentation are in
English.

## Status

The project is in **Phase 1 (MVP), milestone M1 — local editor**. Working today:

- **Factory**: add and remove objects from the catalog (circle, square, triangle).
- **Stage**: custom Canvas 2D engine with background, selection and drag.
- **Properties**: position, rotation, scale and color.
- **Code**: Python generated live from the model.
- **Persistence**: autosave to IndexedDB and `.kamay.json` export/import.
- **Undo/redo** and error messages in Spanish.

Pending (M2–M3): real execution with **Pyodide** and the actions/methods UI.

## Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| UI             | TypeScript + React                            |
| Build          | Vite                                          |
| State          | Zustand (typed central store)                 |
| Data schema    | Versioned JSON validated with Zod             |
| Styling        | Tailwind CSS v4                               |
| Python runtime | Pyodide (M2, in a Web Worker)                 |
| Engine         | Custom Canvas 2D                              |
| Persistence    | IndexedDB (idb) + `.kamay.json` export/import |
| Tests          | Vitest + React Testing Library + Playwright   |
| Lint / format  | oxlint + Prettier                             |

## Requirements

- Node.js **>= 22.12** (see `.nvmrc`).
- pnpm (pinned via `packageManager` in `package.json`).

## Development

```bash
pnpm install
pnpm dev          # development server
pnpm build        # typecheck + production build
pnpm preview      # serve the build
```

## Quality

```bash
pnpm lint         # oxlint
pnpm format       # Prettier (write)
pnpm format:check # Prettier (check)
pnpm typecheck    # tsc -b
pnpm test         # Vitest (unit)
pnpm test:e2e     # Playwright (requires: pnpm exec playwright install)
```

## Structure

```
src/
  model/         # versioned Zod schema, types and migrations
  store/         # central state (Zustand) with undo/redo
  generator/     # JSON model -> deterministic Python code
  runtime/       # Pyodide bridge contract
  engine/        # Canvas 2D engine
  views/         # stage, factory, code and top bar
  persistence/   # IndexedDB and export/import
  i18n/          # Spanish UI strings
  ui/            # reusable components and design system
```

## Conventions

- **Code, identifiers and documentation in English**; **user interface in
  Spanish** (all UI strings live in `src/i18n/es.ts`).
- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Every change to the JSON model ships with a **migration** and a schema test.
- New functionality ships with tests. Run `pnpm lint`, `pnpm typecheck` and
  `pnpm test` before opening a pull request; `main` requires green CI.

## Deployment

The `pnpm build` output is **fully static** (`dist/`): deployable to GitHub
Pages, Netlify or Cloudflare Pages.

## License

[MIT](LICENSE) © 2026 Jose Amaya.
