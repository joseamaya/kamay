# 01 — Manifiesto y visión

## Enunciado principal

> **Un entorno interactivo, lúdico y didáctico para aprender Programación
> Orientada a Objetos, donde el estudiante construye clases y objetos jugando y
> ve, en todo momento, el código Python real que está generando.**

Ese enunciado es la esencia que se rescata de Elix. Todo lo demás —lenguaje,
interfaz, motor, plataforma— se moderniza, pero el enunciado no cambia.

## Qué era Elix

Elix era una aplicación de escritorio (Python 2 + PyQt4) para aprender POO. Su
modelo era claro y potente:

- Un **proyecto** se describe con tres listas planas: los objetos
  (`nombre=Clase`), sus propiedades (`x`, `y`, `rotacion`, `escala`) y los
  métodos que se invocan sobre ellos.
- Desde una interfaz visual el estudiante **agrega clases, crea objetos, mueve
  y rota los objetos y les llama métodos** (decir, correr, saltar, pelear…).
- La aplicación **generaba `principal.py`**, un programa Python real que corría
  sobre el motor 2D pilas-engine y mostraba el resultado en pantalla.

Su idea fuerte: **no se programa escribiendo primero, se programa manipulando
objetos y viendo el código que aparece detrás.** El código es una consecuencia
visible de las decisiones, no una barrera de entrada.

## Qué se conserva (la esencia)

1. **Aprender POO haciendo**, no leyendo teoría.
2. **Objetos concretos y visuales** (personajes, cosas) que el estudiante toca,
   mueve y hace actuar.
3. **El código Python siempre visible**, como espejo de lo que se construye.
4. **Progresión sin muros**: empezar manipulando y terminar escribiendo código,
   sin cambiar de herramienta ni de lenguaje.
5. **Resultado inmediato y lúdico**: se ejecuta y se ve en pantalla.

## Qué se descarta (el lastre)

- Python 2, PyQt4, pybox2d y pilas-engine 1.3.2: tecnología obsoleta y sin
  mantenimiento.
- Instalación manual y dependiente del sistema operativo.
- Modelo de datos plano y frágil (`objetos` / `propiedades` / `metodos` como
  texto parseado con `split`).
- IDE de escritorio: difícil de distribuir, compartir y usar en el aula.

## Qué se mejora o se añade

- **Aplicación web**: se abre en el navegador, se comparte con un enlace, no se
  instala.
- **Python 3 real en el navegador** con Pyodide: el estudiante aprende el
  lenguaje vigente, no una versión muerta.
- **Híbrido bloques → código**: los bloques/paletas se transforman
  progresivamente en Python editable.
- **Modelo de datos JSON versionado**, con clases de verdad (atributos,
  métodos, herencia), escenas y eventos.
- **Guardado local y export/import** para llevar proyectos de un equipo a otro.

## Público objetivo

- **Estudiantes principiantes** de secundaria y de los primeros cursos de
  universidad, sin experiencia previa en programación.
- **Docentes** que necesitan una herramienta lista para el aula, en español y
  sin instalación.
- **Personas autodidactas** en español que quieren una primera experiencia de
  programación orientada a objetos.

## Propuesta de valor

| Sin la herramienta | Con la herramienta |
| --- | --- |
| La sintaxis y el entorno desaniman antes de entender el concepto. | Se empieza jugando; el código llega solo y se entiende. |
| Instalar Python, editor y librerías es una clase entera. | Se abre una URL y se empieza en un minuto. |
| Los ejemplos abstractos (`class A`, `class B`) no enganchan. | Se construyen personajes y acciones que se ven en pantalla. |
| El paso de bloques a código suele ser un salto brusco. | La transición es gradual y dentro de la misma herramienta. |

## Principios de diseño

1. **Ver para creer**: cada acción del estudiante tiene un efecto visible en el
   escenario y en el código.
2. **Cero instalación**: todo ocurre en el navegador.
3. **El código es el destino, no el peaje**: nunca se oculta el Python; se
   revela de a poco.
4. **Fracaso seguro**: los errores se explican en lenguaje claro y no rompen el
   proyecto.
5. **Autonomía progresiva**: el andamiaje (bloques, paletas, diálogos)
   desaparece a medida que el estudiante gana confianza.
6. **Español primero**: la interfaz, los textos y los ejemplos están en español.
7. **Proyecto como objeto de aprendizaje**: se puede guardar, compartir y
   revisar lo que se construyó.

## Cómo se sabrá que funciona

- Una persona sin experiencia pasa de crear su primer objeto a escribir su
  primera clase propia en una sola sesión.
- El estudiante entiende y usa **clase, objeto, atributo, método y herencia**
  con ejemplos propios, no memorizados.
- El proyecto final guardado contiene código Python que el estudiante reconoce
  como suyo.
