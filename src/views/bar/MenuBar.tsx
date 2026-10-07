import { getMessages } from '../../i18n'
import { usePreferencesStore } from '../../store'
import { Menu, MenuItem } from '../../ui/Menu'

export interface MenuBarProps {
  name: string
  dirty: boolean
  onRename: () => void
  onNew: () => void
  onSave: () => void
  onPortfolio: () => void
  onImport: () => void
  onExport: () => void
  onDeliver: () => void
  onShare: () => void
  onTemplates: () => void
  onRubric: () => void
  onTeacher: () => void
  onLevels: () => void
  onMissions: () => void
  canSave: boolean
}

export function MenuBar({
  name,
  dirty,
  onRename,
  onNew,
  onSave,
  onPortfolio,
  onImport,
  onExport,
  onDeliver,
  onShare,
  onTemplates,
  onRubric,
  onTeacher,
  onLevels,
  onMissions,
  canSave,
}: MenuBarProps) {
  const messages = getMessages()
  const theme = usePreferencesStore((state) => state.theme)
  const setTheme = usePreferencesStore((state) => state.setTheme)
  const fontScale = usePreferencesStore((state) => state.fontScale)
  const setFontScale = usePreferencesStore((state) => state.setFontScale)
  const projector = usePreferencesStore((state) => state.projector)
  const setProjector = usePreferencesStore((state) => state.setProjector)

  const themeLabel = (value: string) => `${messages.bar.theme}: ${value}`
  const textLabel = (value: string) => `${messages.bar.text}: ${value}`

  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className="text-primary mr-2 text-base font-bold">{messages.app.name}</span>
      <button
        type="button"
        onClick={onRename}
        aria-label={messages.bar.renameProject}
        className="text-muted-foreground hover:text-foreground mr-1 hidden max-w-40 truncate text-sm hover:underline sm:inline"
      >
        {name}
        {dirty ? ' •' : ''}
      </button>

      <Menu label={messages.bar.menu.file} align="left">
        {(close) => (
          <>
            <MenuItem
              onClick={() => {
                close()
                onNew()
              }}
            >
              {messages.bar.newProject}
            </MenuItem>
            <MenuItem
              disabled={!canSave}
              onClick={() => {
                close()
                onSave()
              }}
            >
              {messages.bar.save}
            </MenuItem>
            <MenuItem
              disabled={!canSave}
              onClick={() => {
                close()
                onPortfolio()
              }}
            >
              {messages.bar.portfolio}
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                onImport()
              }}
            >
              {messages.bar.import}
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                onExport()
              }}
            >
              {messages.bar.export}
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                onDeliver()
              }}
            >
              {messages.bar.deliver}
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                onShare()
              }}
            >
              {messages.bar.share}
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                onTemplates()
              }}
            >
              {messages.bar.templates}
            </MenuItem>
          </>
        )}
      </Menu>

      <Menu label={messages.bar.menu.view} align="left">
        {(close) => (
          <>
            <MenuItem
              pressed={theme === 'light'}
              onClick={() => {
                close()
                setTheme('light')
              }}
            >
              {themeLabel(messages.bar.themeLight)}
            </MenuItem>
            <MenuItem
              pressed={theme === 'dark'}
              onClick={() => {
                close()
                setTheme('dark')
              }}
            >
              {themeLabel(messages.bar.themeDark)}
            </MenuItem>
            <MenuItem
              pressed={fontScale === 'normal'}
              onClick={() => {
                close()
                setFontScale('normal')
              }}
            >
              {textLabel(messages.bar.textNormal)}
            </MenuItem>
            <MenuItem
              pressed={fontScale === 'large'}
              onClick={() => {
                close()
                setFontScale('large')
              }}
            >
              {textLabel(messages.bar.textLarge)}
            </MenuItem>
            <MenuItem
              pressed={fontScale === 'xlarge'}
              onClick={() => {
                close()
                setFontScale('xlarge')
              }}
            >
              {textLabel(messages.bar.textXLarge)}
            </MenuItem>
            <MenuItem
              pressed={projector}
              onClick={() => {
                close()
                setProjector(!projector)
              }}
            >
              {messages.bar.projector}
            </MenuItem>
          </>
        )}
      </Menu>

      <Menu label={messages.bar.menu.course} align="left">
        {(close) => (
          <>
            <MenuItem
              onClick={() => {
                close()
                onLevels()
              }}
            >
              {messages.bar.levelShort}
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                onMissions()
              }}
            >
              {messages.bar.missionsShort}
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                onRubric()
              }}
            >
              {messages.rubric.title}
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                onTeacher()
              }}
            >
              {messages.teacher.title}
            </MenuItem>
          </>
        )}
      </Menu>
    </div>
  )
}
