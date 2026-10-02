# 04 — Arquitectura técnica

## Resumen

Aplicación **web** que corre por completo en el navegador (sin backend propio),
con el código Python del estudiante ejecutándose en el cliente.

| Capa | Tecnología propuesta |
| --- | --- |
| UI | TypeScript + React |
| Estado | Store central tipado (Zustand o Redux Toolkit) |
| Esquema de datos | JSON versionado validado con Zod |
| Motor de juego | Canvas 2D (capa 3D opcional futura) |
| Audio | Web Audio API (o Howler.js) |
| Física | planck.js (opcional, por nivel) |
| Tweens | tween.js o implementación propia |
| Editor de código | CodeMirror 6 (más ligero que Monaco) |
| Runtime Python | **Pyodide** (Python 3 en WebAssembly) |
| Persistencia | IndexedDB + export/import de archivos |
| Build | Vite |
| Tests | Vitest + React Testing Library + Playwright |
| Despliegue | Hosting estático (GitHub Pages / Netlify / Cloudflare Pages) |

## Principios arquitectónicos

1. **Una sola fuente de verdad**: el estado del proyecto (el modelo) vive en un
   store único. Las tres vistas son proyecciones de ese estado.
2. **Generación de código determinista**: el mismo modelo produce siempre el
   mismo Python.
3. **Aislamiento de la ejecución**: el Python del estudiante corre en un Web
   Worker con Pyodide, nunca en el hilo de la interfaz.
4. **Todo en el cliente**: sin cuentas ni servidores; el usuario es dueño de sus
   datos.

## Módulos

```
src/
  modelo/         # tipos + esquema Zod + migraciones de versión
  store/          # estado central, acciones, undo/redo
  generador/      # modelo -> código Python
  runtime/        # puente a Pyodide en Web Worker
  motor/          # bucle de juego, Canvas 2D, actores, colisiones, tween
  vistas/
    escenario/    # lienzo y objetos
    fabrica/      # paletas, bloques, diálogos de clase/objeto
    codigo/       # editor CodeMirror + resaltado
    barra/        # menús, ejecutar, guardar, compartir
  persistencia/   # IndexedDB, export/import, importador legado Elix
  i18n/           # textos en español (base para futuras traducciones)
  ui/             # componentes reutilizables y sistema de diseño
```

## Modelo de datos (JSON versionado)

El **JSON es la fuente de verdad**. El Python es un artefacto generado (y
editable, pero no canónico).

```json
{
  "version": 1,
  "meta": {
    "nombre": "Mi primer juego",
    "autor": "",
    "creado": "2026-01-01T00:00:00Z"
  },
  "escenas": [
    {
      "id": "escena-1",
      "nombre": "Principal",
      "fondo": "pasto",
      "clases": [
        {
          "id": "clase-heroe",
          "nombre": "Heroe",
          "hereda": "Actor",
          "imagen": "assets/heroe.png",
          "atributos": [
            { "nombre": "vida", "tipo": "number", "inicial": 100 }
          ],
          "metodos": [
            {
              "nombre": "saltar",
              "parametros": [],
              "cuerpo": { "tipo": "bloques", "ops": [] }
            }
          ]
        }
      ],
      "objetos": [
        {
          "id": "h1",
          "nombre": "h1",
          "clase": "Heroe",
          "atributos": { "x": 0, "y": 0, "rotacion": 0, "escala": 1 }
        }
      ],
      "eventos": [
        {
          "tipo": "al_iniciar",
          "acciones": [
            { "objeto": "h1", "metodo": "decir", "args": { "mensaje": "¡Hola!" } }
          ]
        }
      ]
    }
  ]
}
```

Decisiones del modelo:

- `version` habilita **migraciones** automáticas al abrir proyectos antiguos.
- El `cuerpo` de un método puede ser **bloques** (`ops`) o **código** crudo
  (`{"tipo": "codigo", "python": "..."}`); así lo visual y lo escrito conviven.
- Atributos con `tipo` e `inicial` permiten generar `__init__` correcto.
- `hereda` habilita la herencia (nivel 5).
- Los objetos referencian una clase por nombre y guardan su estado inicial.

### Validación

El esquema se define una vez con **Zod** y se reutiliza para validar al cargar,
al importar y en los tests. Un JSON inválido se rechaza con un mensaje claro.

## Generación de código Python

Un módulo puro toma el modelo y produce:

1. **`principal.py`** — arranque, creación de objetos, eventos.
2. **Un archivo por clase** — `Heroe.py`, etc., con atributos y métodos.

Reglas:

- Generación **determinista** y con **orden estable** (para diffs limpios).
- Cabecera con `# -*- coding: utf-8 -*-` y metadatos del proyecto.
- El código generado se muestra en la vista Código y se puede exportar.

### Importador legado (Elix → JSON)

Migración de un solo uso del formato plano de Elix:

| Formato Elix | Destino JSON |
| --- | --- |
| `objetos` (`nombre=Clase`) | `objetos[]` con `nombre` y `clase`. |
| `propiedades` (`nombre.x=valor`) | `atributos` del objeto (`x`, `y`, `rotacion`, `escala`). |
| `metodos` (`h1.decir(...)`) | `eventos[].acciones[]` o cuerpo de método. |
| `Clase.py` | `clases[]` (se adjunta el código como `cuerpo: codigo`). |

Esto permite migrar `ejemplos/Lucha/` y verificar paridad conceptual.

## Ejecución con Pyodide

- Pyodide se carga **una vez** en un **Web Worker** dedicado.
- El runtime dispone de una API mínima del motor (`actor`, `escena`, `decir`,
  `mover`, `esperar`, `colisiona`, …) que el Python generado usa.
- El motor real (Canvas 2D) vive en el hilo principal; el Worker le envía
  **comandos** (crear actor, mover, animar) por mensajes.
- **Reinicio rápido**: guardar el estado inicial del proyecto para volver a
  ejecutar sin recargar Pyodide.
- **Errores**: el Worker captura excepciones y devuelve `{mensaje, linea}` que
  la UI traduce a español.
- **Seguridad**: Pyodide corre en el sandbox del navegador; sin acceso a red ni
  al sistema por defecto.

> Nota de rendimiento: Pyodide pesa varios MB la primera vez. Se **precarga en
> segundo plano** y se cachea; la UI (montar, editar, guardar) no espera a que
> termine.

## Motor 2D (Canvas)

- Bucle de juego con `requestAnimationFrame` y delta de tiempo.
- Entidades (actores) con transformación, imagen/sprite, animación y z-order.
- Sistema de eventos y colisiones simple (AABB/círculos); física completa
  (planck.js) solo cuando el nivel la requiera.
- Interpolaciones (tween) para "mover a", "girar", "escalar".
- El motor es **determinista en modo test** (semilla fija, delta fijo).

## Persistencia

- **IndexedDB** guarda proyectos localmente (autoguardado).
- **Export/import**: archivo del proyecto (`.moldea.json` o zip con assets).
- **Compartir**: generar un enlace con el proyecto codificado (fase futura) o
  exportar archivo.
- **Undo/redo**: pila de acciones sobre el store.

## Testing

- **Unitario (Vitest)**: generador de código, esquema Zod, importador legado,
  lógica del motor.
- **Componentes (RTL)**: vistas de Fábrica y Código.
- **Extremo a extremo (Playwright)**: flujo "crear proyecto → crear objeto →
  ejecutar → guardar → reabrir".
- **Golden tests** del generador: modelo → `.py` esperado, para evitar
  regresiones.

## Build y despliegue

- **Vite** para desarrollo y build estático.
- Salida 100% estática; desplegable en GitHub Pages, Netlify o Cloudflare Pages.
- Versionado y `CHANGELOG`; etiquetas semánticas.

## Riesgos técnicos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Peso de Pyodide | Precarga diferida + caché + indicador de progreso. |
| Fluidez del Canvas con muchos objetos | Límites por escena + dibujado por capas + profiling. |
| Sincronización código⇄bloques | Código no representable se conserva como texto ("código avanzado"). |
| Deriva del modelo JSON | `version` + migraciones + tests de esquema. |
