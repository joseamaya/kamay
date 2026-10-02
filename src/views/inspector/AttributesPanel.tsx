import { getMessages } from '../../i18n'
import { readNumber, readString } from '../../model'
import { useActiveScene, useProjectStore, useSelectedObject } from '../../store'
import { ColorInput } from '../../ui/ColorInput'
import { NumberField } from '../../ui/NumberField'
import { Panel } from '../../ui/Panel'
import { Slider } from '../../ui/Slider'

export function AttributesPanel() {
  const messages = getMessages()
  const scene = useActiveScene()
  const object = useSelectedObject()
  const updateObjectAttributes = useProjectStore((state) => state.updateObjectAttributes)

  if (!scene || !object) {
    return (
      <Panel title={messages.inspector.title} className="min-h-0">
        <p className="text-muted-foreground text-sm">{messages.inspector.empty}</p>
      </Panel>
    )
  }

  const patch = (values: Record<string, number | string>) =>
    updateObjectAttributes(scene.id, object.id, values)

  return (
    <Panel title={messages.inspector.title} className="min-h-0">
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={messages.inspector.positionX}
          value={readNumber(object.attributes, 'x', 0)}
          onChange={(value) => patch({ x: value })}
        />
        <NumberField
          label={messages.inspector.positionY}
          value={readNumber(object.attributes, 'y', 0)}
          onChange={(value) => patch({ y: value })}
        />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Slider
          label={messages.inspector.rotation}
          value={readNumber(object.attributes, 'rotation', 0)}
          min={-180}
          max={180}
          onChange={(value) => patch({ rotation: value })}
        />
        <Slider
          label={messages.inspector.scale}
          value={readNumber(object.attributes, 'scale', 1)}
          min={0.2}
          max={3}
          step={0.1}
          onChange={(value) => patch({ scale: value })}
        />
        <ColorInput
          label={messages.inspector.color}
          value={readString(object.attributes, 'color', '#e2603a')}
          onChange={(value) => patch({ color: value })}
        />
      </div>
    </Panel>
  )
}
