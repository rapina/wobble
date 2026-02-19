import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface Spark {
    x: number
    y: number
    vx: number
    vy: number
    alpha: number
}

export class FaradayScene extends BaseScene {
    declare private graphics: Graphics
    declare private magnetBlob: Blob
    declare private magnetY: number
    declare private magnetVelocity: number
    declare private sparks: Spark[]
    declare private time: number
    declare private coilGlow: number

    protected setup(): void {
        this.time = 0
        this.magnetY = this.centerY - 80
        this.magnetVelocity = 0
        this.sparks = []
        this.coilGlow = 0

        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        this.magnetBlob = new Blob({
            size: 40,
            color: 0xe74c3c,
            shape: 'square',
            expression: 'happy',
        })
        this.magnetBlob.setPosition(this.centerX, this.magnetY)
        this.container.addChild(this.magnetBlob)
    }

    protected onVariablesChange(): void {
        const dt = this.variables['Δt'] || 0.1
        // Faster change = faster magnet movement
        this.magnetVelocity = (1 / dt) * 2
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.03

        const N = this.variables['N'] || 50
        const dPhi = this.variables['ΔΦ'] || 0.2
        const dt = this.variables['Δt'] || 0.1
        const EMF = Math.abs((N * dPhi) / dt)

        // Oscillate magnet through coil
        const oscillationSpeed = (1 / dt) * 0.5
        this.magnetY = this.centerY + Math.sin(this.time * oscillationSpeed) * 60

        // Calculate instantaneous velocity for glow effect
        const velocity = Math.abs(Math.cos(this.time * oscillationSpeed)) * oscillationSpeed
        this.coilGlow = Math.min(velocity * 0.3, 1)

        // Spawn sparks when EMF is high
        if (EMF > 100 && Math.random() < 0.1 * delta) {
            const side = Math.random() > 0.5 ? 1 : -1
            this.sparks.push({
                x: this.centerX + side * 50,
                y: this.centerY,
                vx: side * (2 + Math.random() * 3),
                vy: (Math.random() - 0.5) * 4,
                alpha: 1,
            })
        }

        // Update sparks
        this.sparks.forEach((spark) => {
            spark.x += spark.vx * delta
            spark.y += spark.vy * delta
            spark.alpha -= 0.03 * delta
        })
        this.sparks = this.sparks.filter((s) => s.alpha > 0)

        // Update magnet blob
        const expression = velocity > 3 ? 'excited' : velocity > 1 ? 'happy' : 'neutral'
        this.magnetBlob.setPosition(this.centerX, this.magnetY)
        this.magnetBlob.updateOptions({
            size: 35,
            wobblePhase: this.time * 2,
            expression,
        })

        this.drawScene(N, EMF, velocity)
    }

    private drawScene(N: number, EMF: number, velocity: number): void {
        const g = this.graphics
        g.clear()

        const cx = this.centerX
        const cy = this.centerY

        // Draw coil (multiple loops)
        const coilWidth = 60
        const coilHeight = 80
        const loops = Math.min(Math.floor(N / 10), 10)

        for (let i = 0; i < loops; i++) {
            const offset = (i - loops / 2) * 4
            g.ellipse(cx + offset, cy, coilWidth / 2 - Math.abs(offset) * 0.5, coilHeight / 2)
            g.stroke({
                color: 0xf39c12,
                width: 3,
                alpha: 0.7 + this.coilGlow * 0.3,
            })
        }

        // Coil glow effect
        if (this.coilGlow > 0.2) {
            g.ellipse(cx, cy, coilWidth / 2 + 10, coilHeight / 2 + 10)
            g.stroke({
                color: 0xf1c40f,
                width: 8,
                alpha: this.coilGlow * 0.3,
            })
        }

        // Magnet poles (N and S)
        const magnetTop = this.magnetY - 20
        const magnetBottom = this.magnetY + 20

        // North pole (red)
        g.roundRect(cx - 20, magnetTop, 40, 20, 4)
        g.fill({ color: 0xe74c3c, alpha: 0.9 })

        // South pole (blue)
        g.roundRect(cx - 20, this.magnetY, 40, 20, 4)
        g.fill({ color: 0x3498db, alpha: 0.9 })

        // Magnetic field lines
        this.drawFieldLines(g, cx, this.magnetY, velocity)

        // Draw sparks
        this.sparks.forEach((spark) => {
            g.moveTo(spark.x, spark.y)
            g.lineTo(spark.x + spark.vx * 3, spark.y + spark.vy * 3)
            g.stroke({ color: 0xf1c40f, width: 2, alpha: spark.alpha })
        })

        // EMF meter
        this.drawEMFMeter(g, EMF)
    }

    private drawFieldLines(g: Graphics, cx: number, magnetY: number, velocity: number): void {
        const fieldStrength = 0.3 + velocity * 0.1

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI - Math.PI / 2
            const startX = cx + Math.cos(angle) * 25
            const startY = magnetY - 20 + Math.sin(angle) * 10

            // Curved field line
            g.moveTo(startX, startY)
            g.quadraticCurveTo(
                startX + Math.cos(angle) * 40,
                startY - 30,
                startX + Math.cos(angle) * 60,
                startY
            )
            g.stroke({ color: 0x9b59b6, width: 1.5, alpha: fieldStrength })
        }
    }

    private drawEMFMeter(g: Graphics, EMF: number): void {
        const meterX = this.centerX - 60
        const meterY = this.height - 40
        const meterWidth = 120
        const meterHeight = 16

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.fill({ color: 0x222222, alpha: 0.7 })

        // Fill based on EMF
        const maxEMF = 500
        const fillRatio = Math.min(EMF / maxEMF, 1)
        const fillColor = EMF > 300 ? 0xe74c3c : EMF > 100 ? 0xf39c12 : 0xf1c40f

        if (fillRatio > 0) {
            g.roundRect(meterX, meterY, meterWidth * fillRatio, meterHeight, 5)
            g.fill({ color: fillColor, alpha: 0.85 })
        }

        // Border
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })

        // Lightning bolt icon
        if (EMF > 50) {
            const boltX = meterX + meterWidth * fillRatio - 10
            if (boltX > meterX + 15) {
                g.moveTo(boltX, meterY + 3)
                g.lineTo(boltX - 4, meterY + 8)
                g.lineTo(boltX, meterY + 8)
                g.lineTo(boltX - 4, meterY + 13)
                g.stroke({ color: 0xffffff, width: 1.5, alpha: 0.9 })
            }
        }
    }
}
