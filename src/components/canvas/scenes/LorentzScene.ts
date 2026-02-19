import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression } from '../Blob'
import { pixiColors } from '../../../utils/pixiHelpers'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    age: number
    size: number
}

export class LorentzScene extends BaseScene {
    declare private chargeBlob: Blob
    declare private fieldGraphics: Graphics
    declare private particleGraphics: Graphics
    declare private vectorGraphics: Graphics
    declare private glowGraphics: Graphics
    declare private time: number
    declare private particles: Particle[]
    declare private fieldRegionLeft: number
    declare private fieldRegionRight: number
    declare private spawnTimer: number

    // Blob's own independent path state
    declare private blobX: number
    declare private blobY: number
    declare private blobVx: number
    declare private blobVy: number

    protected setup(): void {
        this.time = 0
        this.particles = []
        this.spawnTimer = 0

        // Field region bounds (center area where B field exists)
        this.fieldRegionLeft = this.width * 0.25
        this.fieldRegionRight = this.width * 0.75

        // Initialize blob path state
        const baseSpeed = 2.5 + 5 * 0.3 // default v=5
        this.blobX = 5
        this.blobY = this.centerY
        this.blobVx = baseSpeed
        this.blobVy = 0

        // Background glow
        this.glowGraphics = new Graphics()
        this.container.addChild(this.glowGraphics)

        // Magnetic field visualization
        this.fieldGraphics = new Graphics()
        this.container.addChild(this.fieldGraphics)

        // Particles
        this.particleGraphics = new Graphics()
        this.container.addChild(this.particleGraphics)

        // Main charge blob (follows its own smooth path)
        this.chargeBlob = new Blob({
            size: 40,
            color: pixiColors.charge,
            shape: 'triangle',
            expression: 'happy',
        })
        this.chargeBlob.setPosition(-50, this.centerY)
        this.container.addChild(this.chargeBlob)

        // Vectors (on top)
        this.vectorGraphics = new Graphics()
        this.container.addChild(this.vectorGraphics)
    }

    protected onVariablesChange(): void {
        const q = this.variables['q'] || 10
        this.chargeBlob.updateOptions({ size: 35 + Math.abs(q) * 0.12 })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const dt = delta * 0.016
        this.time += dt
        this.spawnTimer += dt

        const q = this.variables['q'] || 10
        const v = this.variables['v'] || 5
        const B = this.variables['B'] || 0.5
        const F = q * v * B

        const baseSpeed = 2.5 + v * 0.3
        // Lorentz force rotates velocity (circular arc), capped to prevent looping
        const omega = Math.min(0.02, q * B * 0.001)

        // --- Animate blob on its own independent path ---
        this.updateBlobPath(delta, baseSpeed, omega)

        // --- Spawn trail particles from left edge ---
        const spawnInterval = 0.1
        if (this.spawnTimer > spawnInterval) {
            this.spawnTimer = 0
            this.particles.push({
                x: 5,
                y: this.centerY,
                vx: baseSpeed,
                vy: 0,
                age: 0,
                size: 3.5,
            })
        }

        // Update trail particles (same rotation physics as blob)
        this.particles.forEach((p) => {
            p.age += dt
            if (p.x > this.fieldRegionLeft && p.x < this.fieldRegionRight) {
                const angle = omega * delta
                const cos_a = Math.cos(angle)
                const sin_a = Math.sin(angle)
                const newVx = p.vx * cos_a - p.vy * sin_a
                const newVy = p.vx * sin_a + p.vy * cos_a
                p.vx = newVx
                p.vy = newVy
                // Ensure forward progress (prevent looping back)
                if (p.vx < baseSpeed * 0.15) {
                    p.vx = baseSpeed * 0.15
                }
            }
            p.x += p.vx * delta
            p.y += p.vy * delta
        })

        // Remove particles that exit screen
        this.particles = this.particles.filter(
            (p) => p.x < this.width + 20 && p.x > -20 && p.y < this.height + 20 && p.y > -20
        )

        // Update blob visuals
        const inField = this.blobX > this.fieldRegionLeft && this.blobX < this.fieldRegionRight
        const velocityAngle = Math.atan2(this.blobVy, this.blobVx)

        let expression: BlobExpression = 'happy'
        if (inField && B > 1) {
            expression = 'worried'
        } else if (v > 15) {
            expression = 'excited'
        }

        this.chargeBlob.setPosition(this.blobX, this.blobY)
        this.chargeBlob.updateOptions({
            wobblePhase: this.time * (2 + v * 0.2),
            expression,
            lookDirection: {
                x: this.blobVx,
                y: this.blobVy,
            },
            showSpeedLines: v > 12,
            speedDirection: velocityAngle + Math.PI,
        })

        this.drawFieldRegion(B)
        this.drawParticles()
        this.drawVectors(v, F)
        this.drawForceIndicator(F)
    }

    private updateBlobPath(delta: number, baseSpeed: number, omega: number): void {
        // Apply Lorentz rotation inside field region (circular arc)
        if (this.blobX > this.fieldRegionLeft && this.blobX < this.fieldRegionRight) {
            const angle = omega * delta
            const cos_a = Math.cos(angle)
            const sin_a = Math.sin(angle)
            const newVx = this.blobVx * cos_a - this.blobVy * sin_a
            const newVy = this.blobVx * sin_a + this.blobVy * cos_a
            this.blobVx = newVx
            this.blobVy = newVy
            // Ensure forward progress (prevent looping back)
            if (this.blobVx < baseSpeed * 0.15) {
                this.blobVx = baseSpeed * 0.15
            }
        }

        // Move blob
        this.blobX += this.blobVx * delta
        this.blobY += this.blobVy * delta

        // Reset blob when it exits the screen (right edge or bottom)
        if (this.blobX > this.width + 30 || this.blobY > this.height + 30) {
            this.blobX = 5
            this.blobY = this.centerY
            this.blobVx = baseSpeed
            this.blobVy = 0
        }
    }

    private drawFieldRegion(B: number): void {
        const g = this.fieldGraphics
        g.clear()

        const fieldAlpha = 0.15 + B * 0.15
        const pulse = Math.sin(this.time * 3) * 0.05 + 0.95

        // Field region background
        g.rect(this.fieldRegionLeft, 0, this.fieldRegionRight - this.fieldRegionLeft, this.height)
        g.fill({ color: 0x4a9eff, alpha: fieldAlpha * 0.3 })

        // Field region borders
        g.moveTo(this.fieldRegionLeft, 0)
        g.lineTo(this.fieldRegionLeft, this.height)
        g.stroke({ color: 0x4a9eff, width: 2, alpha: fieldAlpha })

        g.moveTo(this.fieldRegionRight, 0)
        g.lineTo(this.fieldRegionRight, this.height)
        g.stroke({ color: 0x4a9eff, width: 2, alpha: fieldAlpha })

        // B field symbols (dots with circles = field out of page)
        const spacing = 40
        const startX = this.fieldRegionLeft + spacing / 2
        const endX = this.fieldRegionRight - spacing / 2

        for (let x = startX; x <= endX; x += spacing) {
            for (let y = spacing / 2; y < this.height; y += spacing) {
                const ringSize = 5 + B * 2
                g.circle(x, y, ringSize * pulse)
                g.stroke({ color: 0x4a9eff, width: 1.5, alpha: fieldAlpha * 0.8 })
                g.circle(x, y, 2)
                g.fill({ color: 0x4a9eff, alpha: fieldAlpha })
            }
        }

        // B label at top
        g.roundRect(this.centerX - 20, 10, 40, 24, 6)
        g.fill({ color: 0x4a9eff, alpha: 0.3 })
        g.stroke({ color: 0x4a9eff, width: 1, alpha: 0.6 })
    }

    private drawParticles(): void {
        const g = this.particleGraphics
        g.clear()

        // Draw particle trail/stream
        this.particles.forEach((p, i) => {
            const alpha = Math.max(0.2, 1 - p.age * 0.5)
            const inField = p.x > this.fieldRegionLeft && p.x < this.fieldRegionRight

            // Particle glow
            g.circle(p.x, p.y, p.size + 3)
            g.fill({ color: pixiColors.charge, alpha: alpha * 0.3 })

            // Particle body
            g.circle(p.x, p.y, p.size)
            g.fill({ color: inField ? 0xff8888 : pixiColors.charge, alpha })

            // Connect to previous particle for trail effect
            if (i > 0) {
                const prev = this.particles[i - 1]
                const dist = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2))
                if (dist < 30) {
                    g.moveTo(prev.x, prev.y)
                    g.lineTo(p.x, p.y)
                    g.stroke({ color: 0x88ddff, width: 1, alpha: alpha * 0.3 })
                }
            }
        })
    }

    private drawVectors(v: number, F: number): void {
        const g = this.vectorGraphics
        g.clear()

        const inField = this.blobX > this.fieldRegionLeft && this.blobX < this.fieldRegionRight

        // Velocity vector (green, in direction of motion)
        const vLength = 25 + v * 1.5
        const velocityAngle = Math.atan2(this.blobVy, this.blobVx)
        this.drawArrow(
            g,
            this.blobX,
            this.blobY,
            velocityAngle,
            vLength,
            0x22c55e,
            'v',
            0.9
        )

        // Force vector (red, perpendicular to velocity) - only in field
        if (inField && F > 5) {
            const forceAngle = velocityAngle + Math.PI / 2
            const fLength = 15 + F / 30
            this.drawArrow(
                g,
                this.blobX,
                this.blobY,
                forceAngle,
                fLength,
                pixiColors.force,
                'F',
                0.9
            )
        }

        // Entry arrow showing straight path (before field)
        if (this.blobX < this.fieldRegionLeft + 30) {
            g.moveTo(10, this.centerY)
            g.lineTo(this.fieldRegionLeft - 10, this.centerY)
            g.stroke({ color: 0x666666, width: 1, alpha: 0.4 })

            // Arrow head
            g.moveTo(this.fieldRegionLeft - 10, this.centerY)
            g.lineTo(this.fieldRegionLeft - 18, this.centerY - 5)
            g.moveTo(this.fieldRegionLeft - 10, this.centerY)
            g.lineTo(this.fieldRegionLeft - 18, this.centerY + 5)
            g.stroke({ color: 0x666666, width: 1, alpha: 0.4 })
        }
    }

    private drawArrow(
        g: Graphics,
        x: number,
        y: number,
        angle: number,
        length: number,
        color: number,
        label: string,
        alpha: number
    ): void {
        const endX = x + Math.cos(angle) * length
        const endY = y + Math.sin(angle) * length

        // Arrow shaft
        g.moveTo(x, y)
        g.lineTo(endX, endY)
        g.stroke({ color, width: 3, alpha })

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
        g.stroke({ color, width: 3, alpha })

        // Label
        const labelX = endX + Math.cos(angle) * 12
        const labelY = endY + Math.sin(angle) * 12
        g.circle(labelX, labelY, 8)
        g.fill({ color, alpha: 0.4 })
    }

    private drawForceIndicator(F: number): void {
        const g = this.vectorGraphics

        // Force meter at bottom
        const meterX = 20
        const meterY = this.height - 35
        const meterWidth = 100
        const meterHeight = 14

        // Background
        g.roundRect(meterX - 5, meterY - 5, meterWidth + 30, meterHeight + 10, 6)
        g.fill({ color: 0x1a1a2e, alpha: 0.8 })

        // Meter background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 4)
        g.fill({ color: 0x333344 })

        // Meter fill (F range is roughly 0-4000 mN)
        const normalizedF = Math.min(1, F / 2000)
        const fillColor = normalizedF > 0.7 ? 0xff6b6b : normalizedF > 0.4 ? 0xf39c12 : 0x4ecdc4
        g.roundRect(meterX, meterY, meterWidth * normalizedF, meterHeight, 4)
        g.fill({ color: fillColor, alpha: 0.8 })

        // F label
        g.circle(meterX + meterWidth + 15, meterY + meterHeight / 2, 10)
        g.fill({ color: pixiColors.force, alpha: 0.4 })
    }
}
