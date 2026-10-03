import type { PhysicsConfig } from '../model'
import { collisionKey } from '../model'
import { ACTOR_SIZE } from './renderer'
import type { Actor } from './types'

type Planck = typeof import('planck')

const FIXED_STEP = 1 / 60
const MAX_ACCUMULATED = 0.1
const DEFAULT_PHYSICS: PhysicsConfig = { enabled: false, gravityY: -9.8 }

/**
 * Optional rigid-body simulation backed by planck.js. It is loaded lazily and
 * keeps circular bodies in sync with the actors' transforms.
 */
export class PhysicsController {
  private planck: Planck | null = null
  private world: import('planck').World | null = null
  private bodies = new Map<string, import('planck').Body>()
  private config: PhysicsConfig = DEFAULT_PHYSICS
  private actors: Actor[] = []
  private active = false
  private loading: Promise<void> | null = null
  private accumulator = 0
  private contacts = new Set<string>()

  isActive(): boolean {
    return this.active
  }

  reset(config: PhysicsConfig | undefined, actors: Actor[]): void {
    this.config = config ?? DEFAULT_PHYSICS
    this.actors = actors
    this.active = this.config.enabled
    this.contacts.clear()
    this.accumulator = 0
    this.world = null
    this.bodies.clear()

    if (this.active) void this.ready()
  }

  /** Loads planck.js on demand and builds the world once. */
  ready(): Promise<void> {
    return this.ensureLoaded().then(() => {
      if (this.active && !this.world) this.build()
    })
  }

  private ensureLoaded(): Promise<void> {
    if (this.planck) return Promise.resolve()
    if (!this.loading) {
      this.loading = import('planck').then((module) => {
        this.planck = module
      })
    }
    return this.loading
  }

  private build(): void {
    const planck = this.planck
    if (!planck) return

    const world = new planck.World({ gravity: new planck.Vec2(0, this.config.gravityY) })
    this.bodies.clear()
    this.contacts.clear()

    for (const actor of this.actors) {
      const radius = (ACTOR_SIZE / 2) * Math.max(actor.transform.scale, 0.2)
      const body = world.createDynamicBody({
        position: new planck.Vec2(actor.transform.position.x, actor.transform.position.y),
        angle: (actor.transform.rotation * Math.PI) / 180,
      })
      body.createFixture({
        shape: new planck.Circle(radius),
        density: 1,
        friction: 0.3,
        restitution: 0.1,
      })
      body.setUserData(actor.name)
      this.bodies.set(actor.id, body)
    }

    world.on('begin-contact', (contact) => {
      const key = this.contactKey(contact)
      if (key) this.contacts.add(key)
    })
    world.on('end-contact', (contact) => {
      const key = this.contactKey(contact)
      if (key) this.contacts.delete(key)
    })

    this.world = world
  }

  private contactKey(contact: import('planck').Contact): string | null {
    const a = contact.getFixtureA().getBody().getUserData()
    const b = contact.getFixtureB().getBody().getUserData()
    if (typeof a !== 'string' || typeof b !== 'string') return null
    return collisionKey(a, b)
  }

  teleport(id: string, x: number, y: number): void {
    const body = this.bodies.get(id)
    if (!body || !this.planck) return
    body.setTransform(new this.planck.Vec2(x, y), body.getAngle())
  }

  setAngle(id: string, degrees: number): void {
    const body = this.bodies.get(id)
    if (!body) return
    body.setTransform(body.getPosition(), (degrees * Math.PI) / 180)
  }

  step(delta: number, actors: Actor[]): void {
    const world = this.world
    if (!world) return

    this.accumulator += Math.min(delta, MAX_ACCUMULATED)
    while (this.accumulator >= FIXED_STEP) {
      world.step(FIXED_STEP)
      this.accumulator -= FIXED_STEP
    }

    for (const actor of actors) {
      const body = this.bodies.get(actor.id)
      if (!body) continue
      const position = body.getPosition()
      actor.transform.position.x = position.x
      actor.transform.position.y = position.y
      actor.transform.rotation = (body.getAngle() * 180) / Math.PI
    }
  }

  getCollisions(): Set<string> {
    return this.contacts
  }
}
