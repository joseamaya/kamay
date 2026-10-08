# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **State-driven model**: object behavior is now only state. The engine reacts to
  `x`/`y`/`rotation`/`scale` (move, rotate, scale) and `mensaje` (speech bubble);
  the old primitives (`decir`, `mover`, `girar`, `cambiar_escala`, `esperar`,
  `emitir`) and the base `Actor` class are gone. Domain bases (`Vehiculo`,
  `Animal`, `Cosa`) are now the roots of the model, and a new class can be
  created with no base. The schema is migrated to v8.
- **Execution**: projects whose methods are all blocks run in a **TypeScript
  simulation**; projects with an advanced-code method run the generated Python
  with **Pyodide**, now loaded on demand (the background warmup was removed).
- **Catalog**: entity and domain-base methods are authored as blocks (state
  assignments), and movement methods (`moverse`, `pedalear`, `acelerar`, `rodar`,
  `volar`, `despegar`) are relative.
- **Missions and rubric**: removed the wait/signal missions and the `sequences`
  badge and criterion; the rubric now has eight criteria (added `state`).
- **Appearance leaves the domain (schemas v10 and v13)**: `color`/`shape`/`glyph`
  are no longer class/object attributes and are no longer emitted in the generated
  Python. They belong to the simulation and are defined **only on the class**: the
  class declares its base appearance and state variants override it (the
  per-object override was removed in v13). This removes the `glyph` leak into
  "custom attributes" and keeps the Python as clean domain code (see `docs/04`,
  "Dos capas").
- **The scene state leaves the domain (schema v11)**: position, rotation, scale
  and message move to `object.simulation`, which the stage edits and the generated
  Python never contains. Movement and speech are now **domain attributes the
  engine interprets by convention** (`distancia`, `altura`, `giro`, `tamano`,
  `sonido`): the catalog methods change those attributes and the engine maps them
  onto the scene. Old projects are migrated.
- **Orders instead of events (schema v12)**: triggers are gone. A scene keeps a
  flat, **ordered list of orders** (method calls) that the simulation runs in the
  order they were added, and the generated `main()` inlines them the same way.
  The "Tipo de llamada" (a un objeto / a todos los objetos) stays. Click, collision
  and key interactions were removed, and level 4 now teaches writing a method as
  code (`own_code`); old events are migrated to orders.
- **Vocabulary**: the method call is now a **call** throughout the UI — the panel
  lists "Llamadas", the button is "Llamar método" and the selector picks the
  "Método". This makes the OOP terminology explicit and avoids clashing with
  "Métodos", the class editor section where methods are defined. The speech bubble
  content is now "texto".
- **Object menu**: the object inspector is now a **floating popover portaled to
  the document**, positioned in window coordinates with a window-height max, so it
  is no longer capped to the (small) stage and no longer shrinks when the code
  editor is open. It is slightly wider and stays non-modal.
- **Run session**: after a run the scene stays in the results state with the
  **State** panel (`before → after`); a new **"Volver a editar"** (back to editing)
  button ends the session and returns the scene to the model, clearing the
  observations and unlocking editing. "Ejecutar" re-runs from scratch.
- **Icon controls**: run/stop, back-to-editing, step mode/step/back and
  undo/redo are now **icon-only buttons with a tooltip** (`src/ui/IconButton`,
  `src/ui/icons`), keeping the accessible name for tests and screen readers.
- **Top bar split (IDE-style)**: the top bar is now a **menu bar** (Archivo, Ver,
  Curso) plus a **toolbar** (guardar, deshacer/rehacer, ejecutar/detener, paso a
  paso), with level and missions on the right. The old "⋯" overflow menu is gone;
  its items live in the menus. Factory and scene row actions use `IconButton`
  instead of text glyphs.
- **Four-zone layout (IDE-style)**: the instance inspector is now a **fixed right
  panel** that reflects the selection (concept, calls, state; scene properties when
  nothing is selected) with duplicate/delete in its header, replacing the floating
  popover. The left side becomes a **single sidebar** with **Proyecto** / **Objetos**
  tabs (persisted, default "Objetos"), and the inspector can be collapsed. Code
  stays at the bottom. The stage keeps the selection highlight and handles.
- **Grouped inheritance labels**: inherited members are grouped by their origin
  class — a single "Heredado de {clase}" header with its methods/attributes below —
  instead of repeating the label on every row. The inheritance section now shows
  only the class chain.
- **Concept glossary**: inspector section headers use the concept terms (Método,
  Herencia, Composición, Estado, Llamada) with an info tooltip that shows their
  definition, and the object/class are labelled "Objeto"/"Clase" to reinforce the
  mould-vs-instance distinction. The tooltip is now a shared `Tooltip` component.
- **Contextual hints**: the guide bar has a **"Pista"** button that reveals the
  current mission's hints progressively, sharing progress with the missions dialog
  (hint state moved to `editorStore`). Mission/guide texts now reference the
  "Objetos" panel instead of the old "Fábrica".
- **Inspector feedback**: the inspector now surfaces the selected class's
  **misconception** (read-only, without recording evidence) and shows the
  **rubric status** (presentado/practicado/demostrado) as a badge on the concept
  terms (Estado, Llamada, Herencia, Composición).

### Added

- **Visual variants (schema v7)**: a class can declare appearance variants
  (`attribute == value` → color, shape, glyph or image) that change how its
  objects are drawn while the state matches; the catalog ships the `Vehiculo`
  "Prendido" variant.
- **"For each" order**: send the same message to every object of a class and its
  subclasses, generating `for animal in [perro1, gato1]: animal.hablar()`. It is
  offered from level 5, adds a `same_message` mission, and the polymorphism
  template now uses it. The schema is migrated to v9.
- **"Change" block**: add or subtract a number from an attribute, generating
  `self.x = self.x + n`.
- **Step timeline**: step-by-step mode gains a scrubber to jump to any step, on
  top of the existing step back/forward.
- **Teacher mode persistence**: imported deliveries are stored in IndexedDB and
  survive reloads, and each delivery shows a summary (missions, demonstrated
  concepts, predictions).
- **Structured analytics**: a local, timestamped activity log (missions,
  predictions, misconceptions, runtime errors); the rubric shows the evidence
  count per criterion, time per concept and errors by type, and the delivery and
  the teacher report include the summary.
- **Referential integrity check**: imported or shared projects with dangling
  references (missing classes, objects, event sources, action targets) or
  inheritance/composition cycles load with a non-blocking warning instead of
  silently.
- **Inheritance in the palette**: the domain base classes (Vehiculo, Animal,
  Cosa) appear as "Clases base" tiles that create a subclass in one step (with a
  level notice before level 5), and the class list shows subclasses indented under
  their base, with a "hereda de" tag when the base is not in the scene.
- **Direct manipulation on the stage**: the selected object shows a rotate and a
  resize handle, so position, rotation and scale are changed with the mouse. The
  object menu is a viewer (behaviour, inheritance, composition, orders, appearance
  and state) and no longer edits the transform.
- **Composition (level 6)**: a class can contain other objects as components;
  the class editor lets you pick the part class, the generated Python imports it
  and creates it in `__init__` (e.g. `self.bateria = Bateria("bateria")`), the
  level 6 path and a "combine objects" mission/badge are added, the rubric gains
  a composition criterion, and a composition template ships.

### Planned

- Phase 5: optional 3D, real-time collaboration and translations.

## [0.2.0] - 2026-10-05

Covers Phases 3–4, the guided levels, the didactic UX pass and the first
evaluation tools.

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
- **Compact toolbar**: project and classroom actions (new, portfolio, export,
  import, share, templates, projector) move into a "⋯" menu, leaving save, level,
  missions, run and undo/redo at hand; the guide panel also shows the next
  mission.
- **First-run guide and celebrations**: a welcome card on the empty stage shows
  the first three steps once (remembered locally), and completing a mission pops
  a small celebration toast.
- **IDE-style layout**: the left column is now a project explorer (scenes plus
  the generated Python files), the catalogue moves to the right, and the guide
  becomes a compact banner under the toolbar. The code dock drops its file tabs
  and follows the file chosen in the explorer.
- **Error hints**: runtime errors now come with a didactic hint that names the
  concept (e.g. "A «Heroe» le falta el método o atributo «saltar»"), shown in
  the activity bar and the inline diagnostic.
- **Concept rubric**: evaluate the built project against a per-concept rubric
  (objects, orders, classes, inheritance, events, sequences) from the toolbar,
  and include it in the delivery bundle.

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
