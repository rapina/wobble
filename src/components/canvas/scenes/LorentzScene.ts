import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression, BlobShape } from '../Blob'
import { pixiColors } from '../../../utils/pixiHelpers'

interface TrailPoint {
    x: number
    y: number
    age: number
}

interface Spark {
    x: number
    y: number
    vx: number
    vy: number
    life: number
}

export class LorentzScene extends BaseScene {
    declare private chargeBlob: Blob
    declare private fieldGraphics: Graphics
    declare private trailGraphics: Graphics
    declare private vectorGraphics: Graphics
    declare private sparkGraphics: Graphics
    declare private glowGraphics: Graphics
    declare private time: number
    declare private posX: number
    declare private posY: number
    declare private velocityAngle: number
    declare private trail: TrailPoint[]
    declare private sparks: Spark[]
    declare private fieldPulse: number

    protected setup(): void {
        this.time = 0
        this.posX = this.centerX
        this.posY = this.centerY
        this.velocityAngle = 0
        this.trail = []
        this.sparks = []
        this.fieldPulse = 0

        // Background glow
        this.glowGraphics = new Graphics()
        this.container.addChild(this.glowGraphics)

        // Magnetic field
        this.fieldGraphics = new Graphics()
        this.container.addChild(this.fieldGraphics)

        // Trail
        this.trailGraphics = new Graphics()
        this.container.addChild(this.trailGraphics)

        // Sparks
        this.sparkGraphics = new Graphics()
        this.container.addChild(this.sparkGraphics)

        // Charge blob (자기장 속에서 휘어지는 역할)
        this.chargeBlob = new Blob({
            size: 45,
            color: pixiColors.charge,
            shape: 'circle',
            expression: 'happy',
        })
        this.chargeBlob.setPosition(this.centerX, this.centerY)
        this.container.addChild(this.chargeBlob)

        // Vectors (on top)
        this.vectorGraphics = new Graphics()
        this.container.addChild(this.vectorGraphics)
    }

    protected onVariablesChange(): void {
        const q = this.variables['q'] || 10
        this.chargeBlob.updateOptions({ size: 35 + Math.abs(q) * 0.15 })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const dt = delta * 0.016
        this.time += dt
        this.fieldPulse += dt

        const q = this.variables['q'] || 10
        const v = this.variables['v'] || 5
        const B = this.variables['B'] || 0.5
        const F = q * v * B

        // Radius proportional to v/B (r = mv/qB, assuming m/q is constant)
        const baseRadius = 60
        const radius = baseRadius + (v / B) * 8

        // Angular velocity proportional to B (ω = qB/m)
        const angularSpeed = B * 0.015
        this.velocityAngle += angularSpeed * delta

        // Calculate position
        this.posX = this.centerX + Math.cos(this.velocityAngle) * radius
        this.posY = this.centerY + Math.sin(this.velocityAngle) * radius

        // Add trail point
        if (this.time % 0.02 < dt) {
            this.trail.push({ x: this.posX, y: this.posY, age: 0 })
            if (this.trail.length > 60) this.trail.shift()
        }
        this.trail.forEach((p) => (p.age += dt))

        // Create sparks based on force
        const sparkRate = F / 500
        if (Math.random() < sparkRate * 0.1) {
            const angle = Math.random() * Math.PI * 2
            const speed = 1 + Math.random() * 2
            this.sparks.push({
                x: this.posX + (Math.random() - 0.5) * 20,
                y: this.posY + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
            })
        }

        // Update sparks
        this.sparks.forEach((s) => {
            s.x += s.vx * delta
            s.y += s.vy * delta
            s.life -= 0.04
        })
        this.sparks = this.sparks.filter((s) => s.life > 0)

        // Velocity direction (tangent to circle)
        const velocityDir = this.velocityAngle + Math.PI / 2

        // Expression based on speed and force
        let expression: BlobExpression = 'happy'
        if (v > 15) {
            expression = 'excited'
        } else if (B > 1.5) {
            expression = 'worried'
        } else if (v > 10) {
            expression = 'happy'
        }

        this.chargeBlob.setPosition(this.posX, this.posY)
        this.chargeBlob.updateOptions({
            wobblePhase: this.time * (2 + v * 0.2),
            expression,
            lookDirection: {
                x: Math.cos(velocityDir),
                y: Math.sin(velocityDir),
            },
            scaleX: 1 + v * 0.01,
            scaleY: 1 - v * 0.005,
            showSpeedLines: v > 12,
            speedDirection: velocityDir + Math.PI,
        })

        this.drawGlow(F)
        this.drawMagneticField(B)
        this.drawTrail()
        this.drawSparks()
        this.drawVectors(velocityDir, v, B, F, radius)
    }

    private drawGlow(force: number): void {
        const g = this.glowGraphics
        g.clear()

        const intensity = Math.min(1, force / 200)
        if (intensity < 0.1) return

        // Glow around charge
        for (let i = 3; i >= 0; i--) {
            const radius = 30 + i * 15
            const alpha = intensity * 0.1 * (1 - i * 0.2)
            g.circle(this.posX, this.posY, radius)
            g.fill({ color: pixiColors.charge, alpha })
        }
    }

    private drawMagneticField(B: number): void {
        const g = this.fieldGraphics
        g.clear()

        const spacing = 45
        const pulse = Math.sin(this.fieldPulse * 3) * 0.3 + 0.7
        const fieldAlpha = 0.3 + B * 0.2

        // Draw magnetic field symbols (dots with rings for field out of page)
        for (let x = 30; x < this.width - 20; x += spacing) {
            for (let y = 30; y < this.height - 20; y += spacing) {
                // Distance from center affects the visual
                const dist = Math.sqrt(
                    Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2)
                )
                const nearCharge =
                    Math.sqrt(Math.pow(x - this.posX, 2) + Math.pow(y - this.posY, 2)) < 50

                // Outer ring (pulsing)
                const ringSize = nearCharge ? 8 * pulse : 6
                g.circle(x, y, ringSize)
                g.stroke({
                    color: 0x4a9eff,
                    width: 1.5,
                    alpha: fieldAlpha * (nearCharge ? 1 : 0.6),
                })

                // Center dot
                g.circle(x, y, nearCharge ? 3 : 2)
                g.fill({ color: 0x4a9eff, alpha: fieldAlpha * (nearCharge ? 1 : 0.7) })
            }
        }

        // Field direction indicator (B into page symbol: ⊗ or out: ⊙)
        g.circle(this.width - 30, 30, 12)
        g.stroke({ color: 0x4a9eff, width: 2, alpha: 0.8 })
        g.circle(this.width - 30, 30, 3)
        g.fill({ color: 0x4a9eff, alpha: 0.8 })

        // "B" label
        g.circle(this.width - 30, 50, 8)
        g.fill({ color: 0x4a9eff, alpha: 0.3 })
    }

    private drawTrail(): void {
        const g = this.trailGraphics
        g.clear()

        if (this.trail.length < 2) return

        // Draw fading trail
        for (let i = 1; i < this.trail.length; i++) {
            const p = this.trail[i]
            const prev = this.trail[i - 1]
            const alpha = Math.max(0, 0.6 - p.age * 0.8)

            if (alpha > 0) {
                const width = 3 * (1 - p.age * 0.5)
                g.moveTo(prev.x, prev.y)
                g.lineTo(p.x, p.y)
                g.stroke({ color: 0x88ddff, width, alpha })
            }
        }

        // Orbital path preview (dashed)
        const v = this.variables['v'] || 5
        const B = this.variables['B'] || 0.5
        const radius = 60 + (v / B) * 8

        const segments = 24
        for (let i = 0; i < segments; i += 2) {
            const a1 = (i / segments) * Math.PI * 2
            const a2 = ((i + 1) / segments) * Math.PI * 2
            g.moveTo(this.centerX + Math.cos(a1) * radius, this.centerY + Math.sin(a1) * radius)
            g.lineTo(this.centerX + Math.cos(a2) * radius, this.centerY + Math.sin(a2) * radius)
        }
        g.stroke({ color: 0x444466, width: 1, alpha: 0.4 })
    }

    private drawSparks(): void {
        const g = this.sparkGraphics
        g.clear()

        this.sparks.forEach((s) => {
            g.circle(s.x, s.y, 2 + s.life * 2)
            g.fill({ color: 0x88ddff, alpha: s.life * 0.8 })
        })
    }

    private drawVectors(
        velocityDir: number,
        v: number,
        B: number,
        F: number,
        radius: number
    ): void {
        const g = this.vectorGraphics
        g.clear()

        // Velocity vector (green, tangent to path)
        const vLength = 20 + v * 2
        this.drawArrow(g, this.posX, this.posY, velocityDir, vLength, 0x22c55e, 'v')

        // Force vector (red, toward center - centripetal)
        const forceDir = this.velocityAngle + Math.PI
        const fLength = 20 + F / 20
        this.drawArrow(g, this.posX, this.posY, forceDir, fLength, pixiColors.force, 'F')

        // Center point indicator
        g.circle(this.centerX, this.centerY, 5)
        g.fill({ color: 0x666666, alpha: 0.5 })
        g.circle(this.centerX, this.centerY, 2)
        g.fill({ color: 0xaaaaaa, alpha: 0.8 })

        // Radius line (dashed)
        const dashLength = 8
        const numDashes = Math.floor(radius / (dashLength * 2))
        for (let i = 0; i < numDashes; i++) {
            const t1 = (i * 2 * dashLength) / radius
            const t2 = ((i * 2 + 1) * dashLength) / radius
            const x1 = this.centerX + (this.posX - this.centerX) * t1
            const y1 = this.centerY + (this.posY - this.centerY) * t1
            const x2 = this.centerX + (this.posX - this.centerX) * t2
            const y2 = this.centerY + (this.posY - this.centerY) * t2
            g.moveTo(x1, y1)
            g.lineTo(x2, y2)
        }
        g.stroke({ color: 0x666666, width: 1, alpha: 0.4 })
    }

    private drawArrow(
        g: Graphics,
        x: number,
        y: number,
        angle: number,
        length: number,
        color: number,
        label: string
    ): void {
        const endX = x + Math.cos(angle) * length
        const endY = y + Math.sin(angle) * length

        // Arrow shaft
        g.moveTo(x, y)
        g.lineTo(endX, endY)
        g.stroke({ color, width: 3 })

        // Arrow head
        const headAngle = 0.4
        const headLength = 10
        g.moveTo(endX, endY)
        g.lineTo(
            endX - Math.cos(angle - headAngle) * headLength,
            endY - Math.sin(angle - headAngle) * headLength
        )
        g.moveTo(endX, endY)
        g.lineTo(
            endX - Math.cos(angle + headAngle) * headLength,
            endY - Math.sin(angle + headAngle) * headLength
        )
        g.stroke({ color, width: 3 })

        // Label background
        const labelX = endX + Math.cos(angle) * 12
        const labelY = endY + Math.sin(angle) * 12
        g.circle(labelX, labelY, 8)
        g.fill({ color, alpha: 0.3 })
    }
}
