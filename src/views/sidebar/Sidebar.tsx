import { getMessages } from '../../i18n'
import { usePreferencesStore } from '../../store'
import type { SidebarView } from '../../store'
import { cn } from '../../ui/cn'
import { BoxIcon, FolderIcon } from '../../ui/icons'
import { FactoryView } from '../factory/FactoryView'
import { ProjectExplorer } from '../explorer/ProjectExplorer'

const TABS: { id: SidebarView; icon: typeof BoxIcon }[] = [
  { id: 'project', icon: FolderIcon },
  { id: 'objects', icon: BoxIcon },
]

export function Sidebar() {
  const messages = getMessages()
  const view = usePreferencesStore((state) => state.sidebarView)
  const setView = usePreferencesStore((state) => state.setSidebarView)

  const labels: Record<SidebarView, string> = {
    project: messages.sidebar.project,
    objects: messages.sidebar.objects,
  }

  return (
    <section className="border-border bg-card text-card-foreground flex min-h-0 flex-col overflow-hidden rounded-lg border">
      <header
        role="tablist"
        aria-label={messages.sidebar.title}
        className="border-border flex flex-none items-center gap-1 border-b px-1.5 py-1.5"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={view === tab.id}
              onClick={() => setView(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition',
                view === tab.id
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon size={14} />
              {labels[tab.id]}
            </button>
          )
        })}
      </header>
      <div role="tabpanel" className="min-h-0 flex-1 overflow-auto p-4">
        {view === 'project' ? <ProjectExplorer /> : <FactoryView />}
      </div>
    </section>
  )
}
