# 03 — Diseño didáctico

## Objetivo de aprendizaje

Que una persona sin experiencia previa comprenda y **use con criterio** los
conceptos centrales de la Programación Orientada a Objetos:

- **objeto** (una cosa con estado y comportamiento),
- **clase** (el molde que define cómo se crea un objeto),
- **atributo** (el estado del objeto),
- **método** (lo que el objeto sabe hacer),
- **instancia** (cada objeto concreto creado a partir de una clase),
- **herencia** (especializar y reutilizar),
- **polimorfismo y composición** (nivel avanzado).

No se busca memorizar sintaxis, sino **modelar problemas como objetos que
colaboran**. La sintaxis llega como consecuencia de la práctica.

## Modelo de representación: híbrido "constructor → código"

La herramienta tiene **tres vistas sincronizadas** sobre el mismo proyecto:

| Vista | Qué muestra | Rol en el aprendizaje |
| --- | --- | --- |
| **Escenario** | El lienzo con los objetos y su comportamiento en vivo. | Ver el resultado y "tocar" las cosas. |
| **Fábrica** | Paletas y bloques para crear clases, objetos, atributos y métodos. | Construir sin pelear con la sintaxis. |
| **Código** | El `principal.py` (y las clases) en Python real, generado en vivo. | Conectar lo visual con el lenguaje. |

Regla de oro: **el código nunca se oculta del todo**. Aunque el estudiante
trabaje con paletas, la vista de Código refleja cada decisión en Python.

### Doble sentido (sincronización)

- **Fábrica → Código**: cada acción visual regenera el Python correspondiente.
- **Código → Fábrica**: si el estudiante edita código que el constructor sabe
  representar, los bloques se actualizan; si no, el bloque se marca como
  *«código avanzado»* y se conserva como texto (no se pierde).

Esto evita el problema clásico de los bloques (quedarse atrapado en ellos) y el
problema del código puro (muro de entrada).

## Progresión por niveles (mundos)

La dificultad y el andamiaje avanzan juntos. Cada nivel **desbloquea** más
lenguaje y más responsabilidad sobre el código.

### Nivel 1 — Cosas en el escenario (objetos)

- Se arrastran objetos prefabricados (personajes, cosas) al escenario.
- Se cambian posición, tamaño, rotación y color.
- El estudiante ve: *«existen objetos y puedo cambiar su estado»*.
- Andamiaje: todo con paletas; el código es **solo lectura**.

### Nivel 2 — Órdenes (métodos y parámetros)

- Se le dan órdenes a los objetos: `decir("hola")`, `correr()`, `saltar()`.
- Aparecen los **parámetros** (un método puede recibir datos).
- El estudiante ve: *«los objetos hacen cosas cuando les mando mensajes»*.
- Andamiaje: paletas + se pueden **editar valores** directamente en el código
  resaltado.

### Nivel 3 — Mi primera clase (atributos y métodos propios)

- Se crea una **clase propia**: un molde con atributos y métodos.
- Se define qué tiene y qué sabe hacer; se instancian varios objetos de ella.
- Se introduce `class`, `self` y `__init__` de forma guiada.
- El estudiante ve: *«puedo fabricar mis propios objetos»*.
- Andamiaje: bloques apilables para el cuerpo de los métodos.

### Nivel 4 — Muchos objetos e identidad (instancias)

- Varias instancias de la misma clase con **estado independiente**.
- Interacción entre objetos: colisiones, eventos, uno que sigue a otro.
- El estudiante ve: *«cada objeto tiene su propia vida y pueden colaborar»*.

### Nivel 5 — Familia de clases (herencia)

- Especializar: `Heroe` y `Enemigo` heredan de `Personaje`.
- Reutilización de atributos y métodos; sobrescritura.
- El estudiante ve: *«puedo partir de lo que ya existe y ampliarlo»*.

### Nivel 6 — Polimorfismo y composición (avanzado)

- Un mismo mensaje con respuestas distintas según el objeto.
- Objetos que **contienen** otros objetos (composición) frente a heredar.
- Puente hacia el código escrito a mano.

## Andamiaje: de los bloques al código

| Nivel | Paletas | Bloques | Código | Edición de código |
| --- | --- | --- | --- | --- |
| 1 | Sí | No | Solo lectura | No |
| 2 | Sí | No | Resaltado | Solo valores |
| 3 | Sí | Apilables | Completo | Métodos guiados |
| 4+ | Opcional | Sí | Completo | Libre |

La meta es que el andamiaje **desaparezca**: el estudiante de nivel avanzado
trabaja como en un editor de código, pero con el escenario al lado.

## Diseño de errores

- Los errores se muestran **en español**, señalando la línea y el concepto
  (`«A 'Heroe' le falta el método 'saltar'»`), no el `traceback` crudo.
- Se ofrecen **pistas** en vez de la respuesta.
- Un error nunca pierde el proyecto ni bloquea el escenario.

## Ludificación (sin ruido)

- **Misiones** cortas con un objetivo observable ("haz que el héroe salude").
- **Desbloqueos** de lenguaje atados a hitos de aprendizaje.
- **Insignias** por conceptos dominados, no por tiempo conectado.
- **Retos** con verificación automática y feedback inmediato.
- El juego es una **consecuencia** de programar; no un fin en sí mismo.

## Rol del docente

- **Guías y plantillas** de proyecto listas para el aula.
- **Modo proyector**: texto grande y contraste alto para explicar en clase.
- **Retos evaluables** con criterios claros y autocorrección.
- **Portafolio**: cada estudiante guarda y entrega sus proyectos.

## Evaluación

- **Formativa**: misiones y retos con feedback inmediato.
- **Auténtica**: el proyecto guardado (JSON + Python) es la evidencia; se evalúa
  el modelo construido, no un examen de sintaxis.
- **Rúbricas** por concepto: crear clase propia, usar atributos/métodos, aplicar
  herencia, resolver un problema modelando objetos.

## Accesibilidad e inclusión

- Navegación por teclado y tamaños de texto ajustables.
- Contraste alto; no depender del color ni del sonido para información clave.
- Textos en español claro; evitar jerga innecesaria.
