# 06 — Paridad funcional con Elix

Mapa de las capacidades reales de Elix (casi todas en
`elix/gui/ventanas.py` → clase `VentanaPrincipal`) y qué se hace con cada una
en el proyecto nuevo.

Leyenda: **Conservar** (misma idea), **Mejorar** (misma idea, mejor UX),
**Descartar** (no aplica), **Añadir** (nuevo).

## Gestión de proyectos

| Capacidad Elix | Comportamiento actual | Decisión | Propuesta nueva |
| --- | --- | --- | --- |
| `crear_nuevo_proyecto` | Diálogo nombre/autor/ubicación; crea carpeta + `data/`. | Mejorar | Asistente de creación en web; sin rutas de disco. Nombre, autor y escena inicial. |
| `abrir_proyecto` | `QFileDialog` de carpeta. | Mejorar | Abrir proyecto guardado en IndexedDB o importar archivo. |
| `iniciar_proyecto` | Define rutas a `principal.py`, `objetos`, `propiedades`, `metodos`. | Descartar | Reemplazado por el modelo JSON en el store. |
| `guardar_programa` | Regenera `principal.py` desde los tres archivos planos. | Mejorar | Autoguardado del JSON + export del Python generado. |
| `correr_programa` | `subprocess.call(['python', principal.py])`. | Descartar | Ejecución en el navegador con Pyodide, en vivo. |

## Clases

| Capacidad Elix | Comportamiento actual | Decisión | Propuesta nueva |
| --- | --- | --- | --- |
| `abrir_ventana_nueva_clase` | Lista fija de actores predefinidos + nombre + imagen. | Mejorar | Asistente de clase: nombre, a partir de qué hereda, imagen y primer método. |
| `crear_clase` | Escribe `Clase.py` con `iniciar()` y la ruta de imagen. | Mejorar | La clase vive en el modelo JSON y se genera Python equivalente. |
| `cargar_clases` | Escanea `.py` en la carpeta del proyecto. | Descartar | Las clases están en el modelo; no se escanea el disco. |
| `abrir_editor` | Ventana de editor de texto para el `.py` de la clase. | Mejorar | Vista Código integrada (CodeMirror) con el Python generado/editable. |
| Actores predefinidos | Lista fija (Aceituna, Banana, Bomba, Mono, Nave, Pingu, …). | Mejorar | Catálogo de sprites/actores con búsqueda y, luego, assets propios. |

## Objetos

| Capacidad Elix | Comportamiento actual | Decisión | Propuesta nueva |
| --- | --- | --- | --- |
| `crear_objeto` | Pide un nombre y lo instancia desde una clase. | Conservar | Igual, con validación de nombres y vista previa. |
| `instanciar_objeto` / `tipo_actor` | Importa el módulo o usa un actor predefinido. | Mejorar | Instanciación desde el modelo; sin `__import__` dinámico. |
| `eliminar_objeto` | Borra el objeto y sus métodos asociados. | Conservar | Igual, con confirmación y undo. |
| Árboles de actores/mundo/objetos (`arbolActores`, `arbolMundo`, `arbolObjetos`) | `QTreeWidget` con menús contextuales. | Mejorar | Panel lateral de proyecto (clases, objetos, escenas) con búsqueda. |
| `habilidad Arrastrable` automática | Todo objeto recién creado es arrastrable. | Mejorar | Comportamiento configurable, no forzado. |

## Propiedades (atributos)

| Capacidad Elix | Comportamiento actual | Decisión | Propuesta nueva |
| --- | --- | --- | --- |
| `sbX`, `sbY` | Coordenadas del objeto. | Conservar | Edición en panel y arrastrando en el escenario. |
| `sbRotacion` | Rotación. | Conservar | Con control circular además del numérico. |
| `sbEscala` | Escala. | Conservar | Igual. |
| `cargar_propiedades` | Parsea `nombre.atributo=valor` (solo x, y, rotacion, escala). | Mejorar | Atributos **personalizados** definidos en la clase (`tipo`, valor inicial). |

## Métodos

| Capacidad Elix | Comportamiento actual | Decisión | Propuesta nueva |
| --- | --- | --- | --- |
| `obtener_metodos` | Usa `inspect.getargspec` sobre la clase. | Mejorar | La paleta de métodos viene del modelo y del catálogo del motor. |
| `llamar_metodo` | `QInputDialog` por cada parámetro; guarda la llamada como texto. | Mejorar | Bloque de acción con campos tipados; se refleja como Python. |
| `cargar_metodos` | Cada línea es una llamada Python cruda. | Mejorar | Acciones estructuradas (objeto, método, argumentos). |
| Métodos con `<>`/texto | Guardado y ejecutado tal cual. | Descartar | Se elimina el almacenamiento de código como cadena suelta. |

## Fondos y escena

| Capacidad Elix | Comportamiento actual | Decisión | Propuesta nueva |
| --- | --- | --- | --- |
| `llenar_fondos` / `tipo_fondo` | Lista fija (Volley, Nubes, Pasto, Selva, Tarde, Espacio, Noche). | Mejorar | Selector de fondo visual con vista previa. |
| `crear_fondo` | Parcialmente comentado/incompleto. | Mejorar | Escenas múltiples con fondo propio. |

## Interfaz general

| Capacidad Elix | Comportamiento actual | Decisión | Propuesta nueva |
| --- | --- | --- | --- |
| `taPrograma` | Panel de texto con el registro de acciones. | Mejorar | Panel de actividad/consola con errores traducidos. |
| `AcercaDe` | Diálogo "acerca de". | Conservar | Enlace de créditos y licencias. |
| Menú Guardar/Ejecutar/Deshacer/Rehacer | Acciones básicas. | Mejorar | Añadir **undo/redo real** y atajos de teclado. |

## Capacidades nuevas (no existían en Elix)

- **Bloques → código** con sincronización bidireccional.
- **Herencia** entre clases (nivel 5 del diseño didáctico).
- **Escenas múltiples** y eventos (colisiones, al iniciar).
- **Pyodide**: ejecución de Python 3 real en el navegador.
- **Importador del formato legado** para migrar proyectos Elix.
- **Export/import** y, a futuro, **compartir por enlace**.
- **Misiones, retos e insignias** (ludificación con verificación automática).
- **Modo proyector** para docentes.
- **Accesibilidad** y textos en español de base.

## Conclusión

La paridad conceptual se mantiene: **crear clases, instanciar objetos, ajustar
atributos y llamar métodos viendo el Python generado**. Lo que cambia es el
soporte técnico (web), el modelo de datos (JSON), la pedagogía (híbrido
progresivo) y todo lo obsoleto que se descarta.
