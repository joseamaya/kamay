import { create } from 'zustand'

export type ThemePreference = 'light' | 'dark'
export type FontScale = 'normal' | 'large' | 'xlarge'
export type SidebarView = 'objects' | 'project'

export const FONT_SCALE_PERCENT: Record<FontScale, number> = {
  normal: 100,
  large: 112.5,
  xlarge: 125,
}

const STORAGE_KEY = 'kamay.preferences'

interface StoredPreferences {
  theme?: ThemePreference
  fontScale?: FontScale
  projector?: boolean
  sidebarView?: SidebarView
  inspectorOpen?: boolean
}

function readStored(): StoredPreferences {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredPreferences) : {}
  } catch {
    return {}
  }
}

function systemTheme(): ThemePreference {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function systemReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface PreferencesState {
  theme: ThemePreference
  fontScale: FontScale
  reducedMotion: boolean
  projector: boolean
  sidebarView: SidebarView
  inspectorOpen: boolean
  setTheme: (theme: ThemePreference) => void
  setFontScale: (fontScale: FontScale) => void
  setReducedMotion: (reducedMotion: boolean) => void
  setProjector: (projector: boolean) => void
  setSidebarView: (view: SidebarView) => void
  setInspectorOpen: (open: boolean) => void
}

const stored = readStored()

export const usePreferencesStore = create<PreferencesState>((set, get) => {
  const persist = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          theme: get().theme,
          fontScale: get().fontScale,
          projector: get().projector,
          sidebarView: get().sidebarView,
          inspectorOpen: get().inspectorOpen,
        }),
      )
    } catch {
      // Storage can be unavailable (private mode); preferences stay in memory.
    }
  }

  return {
    theme: stored.theme ?? systemTheme(),
    fontScale: stored.fontScale ?? 'normal',
    reducedMotion: systemReducedMotion(),
    projector: stored.projector ?? false,
    sidebarView: stored.sidebarView ?? 'objects',
    inspectorOpen: stored.inspectorOpen ?? true,
    setTheme: (theme) => {
      set({ theme })
      persist()
    },
    setFontScale: (fontScale) => {
      set({ fontScale })
      persist()
    },
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setProjector: (projector) => {
      set({ projector })
      persist()
    },
    setSidebarView: (sidebarView) => {
      set({ sidebarView })
      persist()
    },
    setInspectorOpen: (inspectorOpen) => {
      set({ inspectorOpen })
      persist()
    },
  }
})
