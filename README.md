# Kamay

> **Un entorno interactivo, lúdico y didáctico para aprender Programación
> Orientada a Objetos, donde el estudiante construye clases y objetos jugando y
> ve, en todo momento, el código Python real que está generando.**

**Kamay** es un nombre quechua que significa _crear, formar, fundar_ y, en su uso
andino, _animar / dar ánima_. Resume las dos acciones del entorno: se **moldea**
una clase y se **da vida** a los objetos. Ver [CREDITS.md](CREDITS.md).

## Estado

El proyecto está en **Fase 1 (MVP), hito M1 — editor local**. Ya funciona:

- **Fábrica**: agregar y eliminar objetos del catálogo (círculo, cuadrado, triángulo).
- **Escenario**: motor Canvas 2D con fondo, selección y arrastre de objetos.
- **Propiedades**: posición, rotación, escala y color.
- **Código**: Python generado en vivo desde el modelo.
- **Persistencia**: autoguardado en IndexedDB y export/import `.kamay.json`.
- **Undo/redo** y mensajes de error en español.

Pendiente (M2–M3): ejecución real con **Pyodide** y la UI de acciones/métodos.
Consulta la hoja de ruta y el diseño en [`docs/`](docs/README.md).

## Stack

| Capa             | Tecnología                                    |
| ---------------- | --------------------------------------------- |
| UI               | TypeScript + React                            |
| Build            | Vite                                          |
| Estado           | Zustand (store central tipado)                |
| Esquema de datos | JSON versionado validado con Zod              |
| Estilos          | Tailwind CSS v4                               |
| Runtime Python   | Pyodide (M2, en Web Worker)                   |
| Motor            | Canvas 2D propio                              |
| Persistencia     | IndexedDB (idb) + export/import `.kamay.json` |
| Tests            | Vitest + React Testing Library + Playwright   |
| Lint / formato   | oxlint + Prettier                             |

## Requisitos

- Node.js **>= 22.12** (ver `.nvmrc`).
- pnpm (se fija vía `packageManager` en `package.json`).

## Desarrollo

```bash
pnpm install
pnpm dev          # servidor de desarrollo
pnpm build        # typecheck + build de producción
pnpm preview      # sirve el build
```

## Calidad

```bash
pnpm lint         # oxlint
pnpm format       # Prettier (escribe)
pnpm format:check # Prettier (verifica)
pnpm typecheck    # tsc -b
pnpm test         # Vitest (unitarios)
pnpm test:e2e     # Playwright (requiere: pnpm exec playwright install)
```

## Estructura

```
src/
  model/         # esquema Zod versionado, tipos y migraciones
  store/         # estado central (Zustand) con undo/redo
  generator/     # modelo JSON -> código Python determinista
  runtime/       # contrato del puente a Pyodide (Fase 1)
  engine/        # contrato del motor Canvas 2D (Fase 1)
  views/         # escenario, fábrica, código y barra superior
  persistence/   # contrato de IndexedDB y export/import (Fase 1)
  i18n/          # textos de la interfaz en español
  ui/            # componentes reutilizables y sistema de diseño
```

## Convenciones

- **Código e identificadores en inglés**; **interfaz y documentación en español**.
- **Commits** con Conventional Commits (`feat:`, `fix:`, `docs:`…).
- Todo cambio en el modelo JSON lleva **migración** y test de esquema.
- Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Despliegue

La salida de `pnpm build` es **100 % estática** (`dist/`): desplegable en GitHub
Pages, Netlify o Cloudflare Pages.

## Licencia

[MIT](LICENSE) © 2026 Jose Amaya.
