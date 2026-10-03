# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Catalog**: more geometric shapes (rectangle, diamond, pentagon, hexagon,
  heart, star) and characters/things drawn as emoji (cat, dog, robot, rocket,
  apple, ball, tree, house), grouped into "Formas" and "Personajes y cosas".

### Planned

- Classroom features (missions, teacher mode, sharing, portfolio).

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
