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

The project is in **Phase 3 — blocks, scenes and inheritance**. Working today:

- **Factory**: add and remove objects from the catalog (circle, square, triangle).
- **Classes**: create your own classes with attributes and methods, instantiate
  several objects from them and inherit from another class.
- **Scenes**: create, rename, switch and delete scenes; the stage and the
  generated code follow the active scene.
- **Stage**: custom Canvas 2D engine with background, selection and drag.
- **Properties**: position, rotation, scale and color.
- **Actions**: orders (`decir`, `mover`, `girar`, `cambiar_escala`, `esperar`)
  plus user-defined methods, triggered on start, click or collision.
- **Blocks**: build method bodies with stackable blocks (call a method, assign
  an attribute, repeat) and convert them to/from code; code the editor cannot
  represent is kept as advanced code.
- **Code**: Python generated live, shown in a CodeMirror view (read-only) with
  editable method bodies.
- **Execution**: run the program with **Pyodide** (Web Worker) and see the
  objects talk and move; runtime errors are translated to Spanish and marked
  inline in the generated code.
- **Persistence**: autosave to IndexedDB and `.kamay.json` export/import.
- **Undo/redo** and error messages in Spanish.

Pending (Phase 3): richer events and optional physics.

## Accessibility

- **Keyboard**: focus the stage and use the arrow keys to move the selected
  object (`Shift` for bigger steps), `Enter`/`Space` to trigger its click event
  and `Escape` to deselect. Objects can also be selected from the factory list.
- **Theme and text size**: light/dark theme and three text sizes, persisted
  locally; the theme follows the system preference on first load.
- **Reduced motion**: `prefers-reduced-motion` disables movement animations.
- Status and errors are announced through a live region.

## Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| UI             | TypeScript + React                            |
| Build          | Vite                                          |
| State          | Zustand (typed central store)                 |
| Data schema    | Versioned JSON validated with Zod             |
| Styling        | Tailwind CSS v4                               |
| Python runtime | Pyodide (in a Web Worker, pinned CDN)         |
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
  model/         # versioned Zod schema, types, migrations, catalog and actions
  store/         # central state (Zustand) with undo/redo
  generator/     # JSON model -> deterministic Python code
  runtime/       # Pyodide worker, bridge, command bus and error translation
  engine/        # Canvas 2D engine and runtime commands
  views/         # stage, factory, actions, inspector, classes, code and bar
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

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the release history.

## License

[MIT](LICENSE) © 2026 Jose Amaya.
