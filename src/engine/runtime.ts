import type { RuntimeCommand } from '../runtime/types'
import { advanceTweens, createTween } from './tween'
import type { Tween } from './tween'
import type { Actor, Bubble, SceneState } from './types'

const MOVE_DURATION = 0.6
const SAY_DURATION = 2.5

type ActorCommand = Exclude<RuntimeCommand, { type: 'wait' }>

/**
 * Mutable state produced by executing the student's program. It starts from the
 * model's initial scene and reacts to engine commands, advancing animations on
 * each frame.
 */
export class RuntimeController {
  private actors: Actor[] = []
  private bubbles: Bubble[] = []
  private tweens: Tween[] = []
  private reducedMotion = false
  private clock = 0
  private delay = 0
  private pending: { command: ActorCommand; at: number }[] = []

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value
  }

  reset(scene: SceneState): void {
    this.actors = scene.actors.map((actor) => ({
      ...actor,
      transform: { ...actor.transform, position: { ...actor.transform.position } },
    }))
    this.bubbles = []
    this.tweens = []
    this.clock = 0
    this.delay = 0
    this.pending = []
  }

  private find(target: string): Actor | undefined {
    return this.actors.find((actor) => actor.id === target || actor.name === target)
  }

  apply(command: RuntimeCommand): void {
    if (command.type === 'wait') {
      this.delay = Math.max(0, this.delay + command.seconds)
      return
    }
    if (this.delay > 0) {
      this.pending.push({ command, at: this.clock + this.delay })
      return
    }
    this.applyNow(command)
  }

  private applyNow(command: ActorCommand): void {
    const actor = this.find(command.target)
    if (!actor) return

    switch (command.type) {
      case 'say':
        this.bubbles = [
          ...this.bubbles.filter((bubble) => bubble.target !== actor.id),
          { target: actor.id, message: command.message, ttl: SAY_DURATION },
        ]
        break
      case 'move':
        if (this.reducedMotion) {
          actor.transform.position.x = command.x
          actor.transform.position.y = command.y
        } else {
          this.tweens.push(
            createTween(actor.id, 'x', actor.transform.position.x, command.x, MOVE_DURATION),
          )
          this.tweens.push(
            createTween(actor.id, 'y', actor.transform.position.y, command.y, MOVE_DURATION),
          )
        }
        break
      case 'rotate':
        if (this.reducedMotion) {
          actor.transform.rotation = command.degrees
        } else {
          this.tweens.push(
            createTween(
              actor.id,
              'rotation',
              actor.transform.rotation,
              command.degrees,
              MOVE_DURATION,
            ),
          )
        }
        break
      case 'scale':
        if (this.reducedMotion) {
          actor.transform.scale = command.factor
        } else {
          this.tweens.push(
            createTween(actor.id, 'scale', actor.transform.scale, command.factor, MOVE_DURATION),
          )
        }
        break
    }
  }

  update(delta: number): void {
    this.clock += delta
    if (this.pending.length > 0) {
      const due = this.pending.filter((item) => item.at <= this.clock)
      this.pending = this.pending.filter((item) => item.at > this.clock)
      for (const item of due) this.applyNow(item.command)
    }

    this.tweens = advanceTweens(this.tweens, delta, ({ objectId, property, value }) => {
      const actor = this.actors.find((candidate) => candidate.id === objectId)
      if (!actor) return
      if (property === 'x') actor.transform.position.x = value
      else if (property === 'y') actor.transform.position.y = value
      else if (property === 'rotation') actor.transform.rotation = value
      else actor.transform.scale = value
    })

    this.bubbles = this.bubbles
      .map((bubble) => ({ ...bubble, ttl: bubble.ttl - delta }))
      .filter((bubble) => bubble.ttl > 0)
  }

  getActors(): Actor[] {
    return this.actors
  }

  getBubbles(): Bubble[] {
    return this.bubbles
  }
}
