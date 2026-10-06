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

The project has completed **Phase 4 — classroom and gamification**. Working today:

- **Factory**: add and remove objects from the catalog: geometric shapes
  (circle, square, triangle, rectangle, diamond, pentagon, hexagon, heart,
  star) and characters/things drawn as emoji (cat, dog, robot, rocket, apple,
  ball, tree, house).
- **Classes**: create your own classes with attributes and methods, instantiate
  several objects from them, inherit from another class and compose them (a
  class can contain other objects as components).
- **Scenes**: create, rename, switch and delete scenes; the stage and the
  generated code follow the active scene.
- **Stage**: custom Canvas 2D engine with background, selection and drag.
- **Project explorer**: the left column lists the scenes and the generated
  Python files (`principal.py` plus one per class); picking a file opens it in
  the code dock.
- **Object menu**: selecting an object on the stage opens a contextual menu
  anchored next to it with its properties and orders, and a guide banner under
  the toolbar shows the current level, the next mission and the next step.
- **Compact toolbar**: save, level, missions, run and undo/redo stay at hand;
  project and classroom actions (new, portfolio, export, import, share,
  templates, projector) live in a "⋯" menu.
- **First-run guide and celebrations**: a welcome card shows the first three
  steps once, and completing a mission pops a small celebration toast.
- **Physics**: optional per scene (toggle + gravity); objects fall and collide
  for real with planck.js.
- **Properties**: position, rotation, scale and color.
- **Actions**: the object's own (or inherited) methods, triggered on start,
  click, collision or key press.
- **Blocks**: build method bodies with stackable blocks (call a method, assign
  an attribute, add/subtract a number, repeat) and convert them to/from code;
  code the editor cannot represent is kept as advanced code.
- **Code**: Python generated live, shown in a CodeMirror view (read-only) with
  editable method bodies and, from level 2, inline editing of literal values
  directly in `principal.py` (object attributes and order arguments).
- **Execution**: projects whose methods are all blocks run in a **TypeScript
  simulation**; the canvas reacts to state (`x`/`y`/`rotation`/`scale` move the
  object, `mensaje` shows a bubble, visual variants change the look). Projects
  with an advanced-code method run the generated Python with **Pyodide**, loaded
  on demand. Runtime errors are translated to Spanish with a hint that names the
  concept, and marked inline in the generated code.
- **Persistence**: autosave to IndexedDB, `.kamay.json` export/import and
  **share by link** (the project travels encoded in the URL).
- **Missions and badges**: short auto-checked goals ("add an object", "create
  your own class", "use inheritance") with progress kept locally.
- **Guided levels**: a 1–6 learning path that unlocks language features (orders,
  own classes, blocks, events, inheritance, composition) as missions are
  completed, plus a free mode for teachers and advanced users.
- **Templates**: ready-to-use classroom starting points (greeting, collision,
  own class, inheritance, physics).
- **Projector mode**: high-contrast theme with larger text for explaining in
  class.
- **Sprites and worlds**: upload an image for a class (downscaled and stored in
  the project) and it renders on the stage, plus themed backgrounds (forest,
  desert, space, city). The generated Python stays clean.
- **Portfolio**: rename the project, browse saved projects with their dates,
  export or delete each one, and **deliver** a bundle with the project, the
  generated Python, the completed missions and the concept rubric.
- **Rubric**: a per-concept rubric (objects, orders, classes, inheritance,
  events, sequences) evaluated from the built project and available from the
  toolbar menu.
- **Undo/redo** and error messages in Spanish.

Pending (Phase 5): optional 3D, real-time collaboration, more asset catalogs and
worlds, and translations.

## Accessibility

- **Keyboard**: focus the stage and use the arrow keys to move the selected
  object (`Shift` for bigger steps), `Enter`/`Space` to trigger its click event
  and `Escape` to deselect. Objects can also be selected from the factory list.
- **Theme and text size**: light/dark theme and three text sizes, persisted
  locally; the theme follows the system preference on first load.
- **Reduced motion**: `prefers-reduced-motion` disables movement animations.
- Status and errors are announced through a live region.

## Stack

| Layer         | Technology                                                 |
| ------------- | ---------------------------------------------------------- |
| UI            | TypeScript + React                                         |
| Build         | Vite                                                       |
| State         | Zustand (typed central store)                              |
| Data schema   | Versioned JSON validated with Zod                          |
| Styling       | Tailwind CSS v4                                            |
| Execution     | TypeScript simulation (blocks) + Pyodide for advanced code |
| Engine        | Custom Canvas 2D                                           |
| Persistence   | IndexedDB (idb) + `.kamay.json` export/import              |
| Tests         | Vitest + React Testing Library + Playwright                |
| Lint / format | oxlint + Prettier                                          |

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
  runtime/       # block simulator, Pyodide worker, bridge, command bus and errors
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

The repository ships a **GitHub Pages** workflow
(`.github/workflows/deploy.yml`) that builds with `VITE_BASE=/kamay/` and
publishes `dist/`. Enable it once in **Settings → Pages → Source: GitHub
Actions**; afterwards every push to `main` deploys to
`https://<owner>.github.io/kamay/`.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the release history.

## License

[MIT](LICENSE) © 2026 Jose Amaya.
