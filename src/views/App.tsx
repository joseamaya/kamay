import { ActivityPanel } from './activity/ActivityPanel'
import { TopBar } from './bar/TopBar'
import { CodeView } from './code/CodeView'
import { FactoryView } from './factory/FactoryView'
import { ScenarioView } from './scenario/ScenarioView'

export function App() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <main className="grid flex-1 grid-cols-1 gap-3 overflow-auto p-3 lg:grid-cols-[20rem_1fr_24rem] lg:overflow-hidden">
        <FactoryView />
        <ScenarioView />
        <CodeView />
      </main>
      <ActivityPanel />
    </div>
  )
}
