export const es = {
  app: {
    name: 'Kamay',
    tagline: 'Moldea clases, da vida a objetos',
  },
  bar: {
    run: 'Ejecutar',
    stop: 'Detener',
    save: 'Guardar',
    open: 'Abrir',
    undo: 'Deshacer',
    redo: 'Rehacer',
    theme: 'Tema',
    runSoon: 'Disponible en la Fase 1',
  },
  views: {
    scenario: 'Escenario',
    factory: 'Fábrica',
    code: 'Código',
  },
  factory: {
    title: 'Fábrica',
    empty: 'Arrastra personajes y cosas al escenario para empezar.',
    buildHint: 'Aquí construirás clases, objetos, atributos y métodos.',
  },
  scenario: {
    title: 'Escenario',
    empty: 'El escenario está vacío.',
    emptyHint: 'Agrega objetos desde la Fábrica y verás su efecto aquí.',
  },
  code: {
    title: 'Código',
    subtitle: 'Python generado en vivo desde tu proyecto.',
    empty: 'Aún no hay código que mostrar.',
  },
  activity: {
    title: 'Actividad',
    idle: 'Sin mensajes por ahora.',
    ready: 'Proyecto listo.',
  },
  errors: {
    invalidProject: 'El proyecto no es válido.',
  },
} as const

export type Messages = typeof es
