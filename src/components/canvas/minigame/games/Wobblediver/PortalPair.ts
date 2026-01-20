/**
 * PortalPair.ts - Connected wormhole portals for teleportation
 *
 * Manages a pair of portals (entrance and exit) with visual connection
 * and teleportation logic
 */

import { Container, Graphics } from 'pixi.js'
import { Wormhole } from './Wormhole'

export interface PortalPairConfig {
    entrance: {
        x: number
        y: number
        radius: number
    }
    exit: {
        x: number
        y: number
        radius: number
    }
    color: 'purple' | 'teal' | 'red' | 'gold'
}

// Particle flowing from entrance to exit
interface ConnectionParticle {
    progress: number  // 0 = entrance, 1 = exit
    speed: number
    size: number
    alpha: number
}

export class PortalPair {
    public container: Container
    public entrance: Wormhole
    public exit: Wormhole
    private connectionGraphics: Graphics

    private connectionParticles: ConnectionParticle[] = []
    private time = 0

    // Teleportation cooldown per wobble (prevent rapid teleports)
    private cooldownMap = new Map<any, number>()
    private readonly COOLDOWN_DURATION = 0.5  // seconds

    // Teleportation state
    private isTeleporting = false
    private teleportProgress = 0
    private teleportingObject: { x: number; y: number } | null = null

    constructor(config: PortalPairConfig, app?: any) {
        this.container = new Container()

        // Create entrance portal
        this.entrance = new Wormhole(
            {
                x: config.entrance.x,
                y: config.entrance.y,
                radius: config.entrance.radius,
                isFinish: false,
                portalColor: config.color,
            },
            app
        )
        this.container.addChild(this.entrance.container)

        // Create exit portal
        this.exit = new Wormhole(
            {
                x: config.exit.x,
                y: config.exit.y,
                radius: config.exit.radius,
                isFinish: false,
                portalColor: config.color,
            },
            app
        )
        this.container.addChild(this.exit.container)

        // Connection visualization (behind portals)
        this.connectionGraphics = new Graphics()
        this.container.addChild(this.connectionGraphics)
        this.container.setChildIndex(this.connectionGraphics, 0)

        this.initConnectionParticles()
    }

    private initConnectionParticles(): void {
        const count = 15
        for (let i = 0; i < count; i++) {
            this.connectionParticles.push({
                progress: Math.random(),
                speed: 0.1 + Math.random() * 0.15,
                size: 2 + Math.random() * 3,
                alpha: 0.3 + Math.random() * 0.4,
            })
        }
    }

    private drawConnection(): void {
        const g = this.connectionGraphics
        g.clear()

        const dx = this.exit.x - this.entrance.x
        const dy = this.exit.y - this.entrance.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Don't draw connection if portals are too far apart (visual clutter)
        if (distance > 300) return

        // Bezier curve connection
        const controlX = (this.entrance.x + this.exit.x) / 2 + dy * 0.2
        const controlY = (this.entrance.y + this.exit.y) / 2 - dx * 0.2

        // Faint connection line
        g.moveTo(this.entrance.x, this.entrance.y)
        g.quadraticCurveTo(controlX, controlY, this.exit.x, this.exit.y)
        g.stroke({
            color: this.entrance.isFinish ? 0xf1c40f : 0x9b59b6,
            width: 2,
            alpha: 0.15 + Math.sin(this.time * 2) * 0.05,
        })

        // Particles flowing along connection
        for (const particle of this.connectionParticles) {
            const t = particle.progress
            const px = (1 - t) * (1 - t) * this.entrance.x + 2 * (1 - t) * t * controlX + t * t * this.exit.x
            const py = (1 - t) * (1 - t) * this.entrance.y + 2 * (1 - t) * t * controlY + t * t * this.exit.y

            g.circle(px, py, particle.size)
            g.fill({
                color: this.entrance.isFinish ? 0xf1c40f : 0x9b59b6,
                alpha: particle.alpha,
            })
        }
    }

    /**
     * Update animations and check for teleportation
     */
    update(deltaSeconds: number, renderer?: any): void {
        this.time += deltaSeconds

        // Update portals
        this.entrance.update(deltaSeconds, renderer)
        this.exit.update(deltaSeconds, renderer)

        // Update connection particles
        for (const particle of this.connectionParticles) {
            particle.progress += particle.speed * deltaSeconds
            if (particle.progress >= 1.0) {
                particle.progress = 0
            }
        }

        // Update cooldowns
        for (const [key, cooldown] of this.cooldownMap.entries()) {
            const newCooldown = cooldown - deltaSeconds
            if (newCooldown <= 0) {
                this.cooldownMap.delete(key)
            } else {
                this.cooldownMap.set(key, newCooldown)
            }
        }

        this.drawConnection()
    }

    /**
     * Check if an object should teleport
     * Returns exit position if teleport occurs, null otherwise
     */
    checkTeleport(
        object: any,
        objectX: number,
        objectY: number
    ): { teleported: boolean; exitX: number; exitY: number } | null {
        // Check cooldown
        if (this.cooldownMap.has(object)) {
            return null
        }

        // Check if object is in entrance portal
        const hit = this.entrance.checkHit(objectX, objectY)
        if (hit.hit) {
            // Trigger teleportation
            this.cooldownMap.set(object, this.COOLDOWN_DURATION)
            this.entrance.showHit(hit.perfect)

            // Visual effect at exit
            setTimeout(() => {
                this.exit.showHit(false)
            }, 100)

            return {
                teleported: true,
                exitX: this.exit.x,
                exitY: this.exit.y,
            }
        }

        return null
    }

    /**
     * Check if object is near entrance (for visual feedback)
     */
    isNearEntrance(objectX: number, objectY: number, threshold: number = 100): boolean {
        const dx = objectX - this.entrance.x
        const dy = objectY - this.entrance.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance < threshold
    }

    /**
     * Move portals to new positions
     */
    movePortals(
        entranceX: number,
        entranceY: number,
        exitX: number,
        exitY: number
    ): void {
        this.entrance.moveTo(entranceX, entranceY)
        this.exit.moveTo(exitX, exitY)
    }

    /**
     * Resize both portals
     */
    setRadius(radius: number): void {
        this.entrance.setRadius(radius)
        this.exit.setRadius(radius)
    }

    destroy(): void {
        this.entrance.destroy()
        this.exit.destroy()
        this.container.destroy({ children: true })
    }
}
