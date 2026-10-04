import { getMessages } from '../../i18n'
import { useProgressStore } from '../../store'
import { Button } from '../../ui/Button'

export function WelcomeCard() {
  const messages = getMessages()
  const completeOnboarding = useProgressStore((state) => state.completeOnboarding)

  const steps = [messages.welcome.step1, messages.welcome.step2, messages.welcome.step3]

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
      <div className="border-border bg-card text-card-foreground pointer-events-auto flex max-w-sm flex-col gap-3 rounded-xl border p-5 shadow-lg">
        <h2 className="text-base font-semibold">{messages.welcome.title}</h2>
        <ol className="flex flex-col gap-2 text-sm">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-2">
              <span className="bg-primary text-primary-foreground mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-semibold">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <Button size="sm" onClick={completeOnboarding}>
          {messages.welcome.start}
        </Button>
      </div>
    </div>
  )
}
