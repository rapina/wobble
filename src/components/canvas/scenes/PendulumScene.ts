import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression, BlobShape } from '../Blob'
import { pixiColors } from '../../../utils/pixiHelpers'

interface TrailPoint {
    x: number
    y: number
    age: number
}

export class PendulumScene extends BaseScene {
    declare private blob: Blob
    declare private ropeGraphics: Graphics
    declare private pivotGraphics: Graphics
    declare private trailGraphics: Graphics
    declare private angle: number
    declare private angularVelocity: number
    declare private length: number
    declare private gravity: number
    declare private pivotX: number
    declare private pivotY: number
    declare private time: number
    declare private trail: TrailPoint[]
    declare private maxAngleReached: number

    protected setup(): void {
        this.angle = Math.PI / 3 // Start at 60 degrees
        this.angularVelocity = 0
        this.length = 130
        this.gravity = 9.8
        this.pivotY = 60
        this.pivotX = this.centerX
        this.time = 0
        this.trail = []
        this.maxAngleReached = Math.abs(this.angle)

        // Trail (behind everything)
        this.trailGraphics = new Graphics()
        this.container.addChild(this.trailGraphics)

        // Pivot point with mounting
        this.pivotGraphics = new Graphics()
        this.container.addChild(this.pivotGraphics)

        // Rope
        this.ropeGraphics = new Graphics()
        this.container.addChild(this.ropeGraphics)

        // Blob
        this.blob = new Blob({
            size: 55,
            color: pixiColors.mass,
            shape: 'pentagon',
            expression: 'excited',
        })
        this.container.addChild(this.blob)

        this.drawPivot()
    }

    protected onVariablesChange(): void {
        this.length = (this.variables['L'] || 1) * 80 + 60
        this.gravity = this.variables['g'] || 9.8

        // Give it a push when gravity changes
        if (Math.abs(this.angularVelocity) < 0.01) {
            this.angle = Math.PI / 3
            this.angularVelocity = 0
        }
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const dt = delta * 0.016
        this.time += dt

        // Pendulum physics: α = -(g/L) * sin(θ)
        const angularAcceleration = -(this.gravity / this.length) * Math.sin(this.angle) * 60

        this.angularVelocity += angularAcceleration * dt
        this.angularVelocity *= 0.9985 // Light damping
        this.angle += this.angularVelocity * dt

        // Track max angle
        this.maxAngleReached = Math.max(this.maxAngleReached, Math.abs(this.angle))
        this.maxAngleReached *= 0.999 // Slowly decay

        const bobX = this.pivotX + Math.sin(this.angle) * this.length
        const bobY = this.pivotY + Math.cos(this.angle) * this.length

        // Add trail point
        if (this.time % 0.02 < dt) {
            this.trail.push({ x: bobX, y: bobY, age: 0 })
            if (this.trail.length > 30) this.trail.shift()
        }

        // Age trail
        this.trail.forEach((p) => (p.age += dt))

        const speed = Math.abs(this.angularVelocity)
        const atPeak = Math.abs(this.angle) > this.maxAngleReached * 0.9 && speed < 0.02

        // Dynamic expression
        let expression: BlobExpression = 'happy'
        if (atPeak) {
            expression = 'worried'
        } else if (speed > 0.08) {
            expression = 'excited'
        } else if (speed > 0.04) {
            expression = 'happy'
        }

        // Stretch based on velocity (squash at peaks, stretch when moving fast)
        const stretchFactor = speed * 3
        const tangentAngle = this.angle + Math.PI / 2

        this.blob.setPosition(bobX, bobY)
        this.blob.updateOptions({
            wobblePhase: this.time * 3,
            expression,
            scaleX: 1 + stretchFactor * Math.abs(Math.cos(tangentAngle)) * 0.3,
            scaleY: 1 - stretchFactor * 0.1,
            lookDirection: { x: this.angularVelocity * 5, y: speed > 0.03 ? 0.5 : 0 },
            showSweat: speed > 0.1,
        })

        this.drawTrail()
        this.drawRope(bobX, bobY)
    }

    private drawPivot(): void {
        const g = this.pivotGraphics
        g.clear()

        // Ceiling bar
        g.rect(this.pivotX - 60, this.pivotY - 20, 120, 15)
        g.fill(0x555555)

        // Mounting bracket
        g.moveTo(this.pivotX - 15, this.pivotY - 5)
        g.lineTo(this.pivotX, this.pivotY + 8)
        g.lineTo(this.pivotX + 15, this.pivotY - 5)
        g.fill(0x666666)

        // Pivot circle
        g.circle(this.pivotX, this.pivotY + 8, 6)
        g.fill(0x888888)
    }

    private drawRope(bobX: number, bobY: number): void {
        const g = this.ropeGraphics
        g.clear()

        // Rope with slight curve based on velocity
        const curveFactor = this.angularVelocity * 10
        const midX = (this.pivotX + bobX) / 2 + curveFactor
        const midY = (this.pivotY + 8 + bobY - 25) / 2

        g.moveTo(this.pivotX, this.pivotY + 8)
        g.quadraticCurveTo(midX, midY, bobX, bobY - 25)
        g.stroke({ color: 0x8b4513, width: 4 })

        // Rope attachment on blob
        g.circle(bobX, bobY - 25, 4)
        g.fill(0x654321)
    }

    private drawTrail(): void {
        const g = this.trailGraphics
        g.clear()

        if (this.trail.length < 2) return

        // Draw fading trail
        for (let i = 1; i < this.trail.length; i++) {
            const p = this.trail[i]
            const prev = this.trail[i - 1]
            const alpha = Math.max(0, 0.4 - p.age * 0.5)

            if (alpha > 0) {
                g.moveTo(prev.x, prev.y)
                g.lineTo(p.x, p.y)
                g.stroke({ color: 0x4ecdc4, width: 2, alpha })
            }
        }
    }
}
