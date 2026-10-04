# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Catalog**: more geometric shapes (rectangle, diamond, pentagon, hexagon,
  heart, star) and characters/things drawn as emoji (cat, dog, robot, rocket,
  apple, ball, tree, house), grouped into "Formas" and "Personajes y cosas".
- **Share by link**: encode the project (gzip + base64url) in the URL hash and
  open it as a new copy in another browser.
- **Missions and badges**: eleven auto-checked goals over the project model
  (objects, orders, own classes, inheritance, events, sequences) with six
  concept badges and local progress.
- **Templates**: ready-to-use classroom starting points (greeting, collision,
  own class, inheritance, physics).
- **Projector mode**: high-contrast theme with larger text, persisted with the
  other accessibility preferences.
- **Portfolio**: rename the project, browse saved projects with dates, and
  export or delete each one.
- **Delivery**: export a bundle with the project, the generated Python and the
  completed missions.
- **Sprites**: upload an image for a class (downscaled to 128 px and embedded in
  the project); it renders on the stage without appearing in the generated code.
- **Themed worlds**: procedural backgrounds (forest, desert, space, city) on top
  of the flat colors.
- **Background warmup**: Pyodide is preloaded during idle time through a warmup
  channel kept separate from the run lifecycle, so the first run is fast.
- **Guided levels**: a 1–5 path that unlocks language features (orders, own
  classes, blocks, events, inheritance) as missions are completed, with a free
  mode and an automatic raise for loaded projects.
- **Edit values in the code**: from level 2, an "Editar valores" toggle turns
  the editable literals of `principal.py` (object attributes and order
  arguments) into inline fields that write back to the model.
- **Object menu**: selecting an object on the stage opens a contextual menu
  anchored next to it with its properties and orders, and a guide panel shows
  the current level and the next step. The code dock starts collapsed at level 1.

### Planned

- Phase 5: optional 3D and more asset catalogs/worlds.

## [0.1.0] - 2026-10-02

First tagged release. Covers Phases 0–2 and the first Phase 3 milestones.

### Added

- **Factory**: add and remove catalog objects (circle, square, triangle).
- **Classes**: create your own classes with attributes and methods, instantiate
  several objects with independent state, and inherit from another class
  (base-class selector, inherited methods and attributes).
- **Scenes**: create, rename, switch and delete scenes; the stage and the
  generated code follow the active scene.
- **Blocks**: build method bodies with stackable blocks (call a method, assign
  an attribute, repeat), compiled to Python with a live preview and one-way
  "convert to code".
- **Stage**: custom Canvas 2D engine with background, selection, drag and tweens.
- **Actions**: orders (`decir`, `mover`, `girar`, `cambiar_escala`) and
  user-defined methods, triggered on start, click or collision.
- **Code**: Python generated live, shown in a CodeMirror view (read-only) with
  editable method bodies and inline runtime errors.
- **Execution**: run the program with **Pyodide** in a Web Worker; runtime
  errors are translated to Spanish and marked inline in the generated code.
- **Persistence**: IndexedDB autosave and `.kamay.json` export/import.
- **Undo/redo** and error messages in Spanish.
- Versioned JSON model validated with Zod and automatic migrations.

### Notes

- The user interface and generated examples are in Spanish; the codebase,
  tooling and documentation are in English.
- Deployment to static hosting is still pending.
