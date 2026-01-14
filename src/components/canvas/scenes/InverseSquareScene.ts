import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface LightRay {
    angle: number
    length: number
}

export class InverseSquareScene extends BaseScene {
    declare private graphics: Graphics
    declare private sourceBlob: Blob
    declare private lightRays: LightRay[]
    declare private time: number
    declare private pulsePhase: number

    protected setup(): void {
        this.time = 0
        this.pulsePhase = 0
        this.lightRays = []

        // Initialize light rays
        const rayCount = 24
        for (let i = 0; i < rayCount; i++) {
            this.lightRays.push({
                angle: (i / rayCount) * Math.PI * 2,
                length: 150,
            })
        }

        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        this.sourceBlob = new Blob({
            size: 40,
            color: 0xf1c40f,
            shape: 'circle',
            expression: 'happy',
        })
        this.sourceBlob.setPosition(this.centerX - 80, this.centerY - 20)
        this.container.addChild(this.sourceBlob)
    }

    protected onVariablesChange(): void {
        // Handled in animate
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02
        this.pulsePhase += delta * 0.1

        const P = this.variables['P'] || 100
        const r = this.variables['r'] || 2
        const I = P / (4 * Math.PI * r * r)

        // Update source blob
        const blobSize = 30 + (P / 1000) * 30
        const expression = P > 500 ? 'excited' : 'happy'

        this.sourceBlob.setPosition(this.centerX - 80, this.centerY - 20)
        this.sourceBlob.updateOptions({
            size: blobSize,
            wobblePhase: this.time * 3,
            expression,
            color: 0xf1c40f,
        })

        this.drawScene(P, r, I)
    }

    private drawScene(P: number, r: number, I: number): void {
        const g = this.graphics
        g.clear()

        const sourceX = this.centerX - 80
        const sourceY = this.centerY - 20

        // Draw expanding circles (wave fronts)
        const maxRadius = 180
        for (let i = 1; i <= 4; i++) {
            const baseRadius = i * 45
            const pulseOffset = (this.pulsePhase % 1) * 45
            const radius = baseRadius + pulseOffset
            if (radius <= maxRadius) {
                const alpha = Math.max(0, 0.4 - (radius / maxRadius) * 0.3)
                g.circle(sourceX, sourceY, radius)
                g.stroke({ color: 0xf1c40f, width: 2, alpha })
            }
        }

        // Draw light rays
        this.lightRays.forEach((ray) => {
            const endX = sourceX + Math.cos(ray.angle) * ray.length
            const endY = sourceY + Math.sin(ray.angle) * ray.length

            // Gradient effect (brighter near source)
            g.moveTo(sourceX + Math.cos(ray.angle) * 30, sourceY + Math.sin(ray.angle) * 30)
            g.lineTo(endX, endY)
            g.stroke({ color: 0xf1c40f, width: 1.5, alpha: 0.3 })
        })

        // Source glow
        const glowRadius = 40 + (P / 100) * 10
        g.circle(sourceX, sourceY, glowRadius)
        g.fill({ color: 0xf1c40f, alpha: 0.15 })
        g.circle(sourceX, sourceY, glowRadius * 0.6)
        g.fill({ color: 0xf1c40f, alpha: 0.2 })

        // Draw measurement points at different distances
        this.drawMeasurementPoints(g, sourceX, sourceY, r, P)

        // Intensity meter
        this.drawIntensityMeter(g, I, r)
    }

    private drawMeasurementPoints(
        g: Graphics,
        sourceX: number,
        sourceY: number,
        currentR: number,
        P: number
    ): void {
        const distances = [2, 4, 8, 16]
        const angle = 0 // Measure to the right

        distances.forEach((dist, index) => {
            const x = sourceX + dist * 20
            const y = sourceY

            // Point intensity
            const pointI = P / (4 * Math.PI * dist * dist)
            const brightness = Math.min(pointI / 10, 1)

            // Measurement point
            const pointRadius = 8 + brightness * 8
            g.circle(x, y, pointRadius)
            g.fill({
                color: 0xf1c40f,
                alpha: 0.3 + brightness * 0.5,
            })
            g.circle(x, y, pointRadius - 3)
            g.fill({
                color: 0xf1c40f,
                alpha: 0.5 + brightness * 0.4,
            })

            // Distance label line
            if (index < distances.length - 1) {
                g.moveTo(x, y + 20)
                g.lineTo(x, y + 30)
                g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })
            }
        })

        // Highlight current measurement distance
        const currentX = sourceX + currentR * 20
        g.circle(currentX, sourceY, 15)
        g.stroke({ color: 0x3498db, width: 3, alpha: 0.8 })

        // Distance line from source to current point
        g.moveTo(sourceX + 30, sourceY)
        g.lineTo(currentX, sourceY)
        g.stroke({ color: 0x3498db, width: 2, alpha: 0.5 })
    }

    private drawIntensityMeter(g: Graphics, I: number, r: number): void {
        const meterX = this.centerX - 60
        const meterY = this.height - 40
        const meterWidth = 120
        const meterHeight = 16

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.fill({ color: 0x222222, alpha: 0.7 })

        // Fill based on I
        const maxI = 50
        const fillRatio = Math.min(I / maxI, 1)
        const fillColor = I > 20 ? 0xf1c40f : I > 5 ? 0xf39c12 : 0xe67e22

        if (fillRatio > 0) {
            g.roundRect(meterX, meterY, meterWidth * fillRatio, meterHeight, 5)
            g.fill({ color: fillColor, alpha: 0.85 })
        }

        // Border
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })

        // 1/4 markers to show inverse square
        for (let i = 1; i <= 3; i++) {
            const markerRatio = 1 / Math.pow(2, i * 2) // 1/4, 1/16, 1/64
            const markerX = meterX + meterWidth * (markerRatio * maxI / maxI)
            if (markerX > meterX + 5) {
                g.moveTo(markerX, meterY)
                g.lineTo(markerX, meterY + meterHeight)
                g.stroke({ color: 0xffffff, width: 1, alpha: 0.2 })
            }
        }
    }
}
