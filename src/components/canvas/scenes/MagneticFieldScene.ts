import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'

interface FieldArrow {
    angle: number
    distance: number
    strength: number
}

export class MagneticFieldScene extends BaseScene {
    declare private graphics: Graphics
    declare private fieldArrows: FieldArrow[]
    declare private time: number
    declare private currentFlow: number

    protected setup(): void {
        this.time = 0
        this.currentFlow = 0
        this.fieldArrows = []

        // Initialize field arrows in concentric circles
        const distances = [40, 70, 100, 130]
        distances.forEach((dist) => {
            const arrowCount = Math.floor(dist / 15)
            for (let i = 0; i < arrowCount; i++) {
                this.fieldArrows.push({
                    angle: (i / arrowCount) * Math.PI * 2,
                    distance: dist,
                    strength: 1 / (dist / 40),
                })
            }
        })

        this.graphics = new Graphics()
        this.container.addChild(this.graphics)
    }

    protected onVariablesChange(): void {
        // Handled in animate
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const I = this.variables['I'] || 10
        const r = this.variables['r'] || 10
        const mu0 = 4 * Math.PI * 1e-7
        const B = ((mu0 * I) / (2 * Math.PI * (r / 100))) * 1e6 // in μT

        // Animate current flow
        this.currentFlow += I * 0.01 * delta

        // Rotate field arrows based on current
        this.fieldArrows.forEach((arrow) => {
            arrow.angle += (I / 50) * 0.02 * delta
        })

        this.drawScene(I, r, B)
    }

    private drawScene(I: number, r: number, B: number): void {
        const g = this.graphics
        g.clear()

        const cx = this.centerX
        const cy = this.centerY - 20

        // Draw wire (coming out of screen - dot)
        g.circle(cx, cy, 20)
        g.fill({ color: 0xf39c12, alpha: 0.8 })
        g.circle(cx, cy, 25)
        g.stroke({ color: 0xf39c12, width: 3, alpha: 0.5 })

        // Current direction indicator (dot = out of screen)
        g.circle(cx, cy, 6)
        g.fill({ color: 0x2c3e50, alpha: 0.9 })

        // Current flow animation (rings emanating)
        const flowPhase = this.currentFlow % (Math.PI * 2)
        for (let i = 0; i < 3; i++) {
            const ringRadius = 25 + ((flowPhase + i * Math.PI * 0.7) % (Math.PI * 2)) * 20
            const ringAlpha = Math.max(0, 1 - ringRadius / 150) * (I / 100)
            if (ringAlpha > 0.05) {
                g.circle(cx, cy, ringRadius)
                g.stroke({ color: 0xf39c12, width: 2, alpha: ringAlpha })
            }
        }

        // Draw magnetic field lines (concentric circles with arrows)
        this.drawFieldLines(g, cx, cy, I, r)

        // Draw measurement point
        const measureAngle = Math.PI / 4
        const measureX = cx + Math.cos(measureAngle) * r * 3
        const measureY = cy + Math.sin(measureAngle) * r * 3

        // Measurement point
        g.circle(measureX, measureY, 8)
        g.fill({ color: 0x3498db, alpha: 0.9 })
        g.circle(measureX, measureY, 12)
        g.stroke({ color: 0x3498db, width: 2, alpha: 0.5 })

        // Distance line
        g.moveTo(cx, cy)
        g.lineTo(measureX, measureY)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })

        // Field strength meter
        this.drawFieldMeter(g, B, I)
    }

    private drawFieldLines(g: Graphics, cx: number, cy: number, I: number, r: number): void {
        // Draw circular field lines
        const radii = [40, 70, 100, 130]

        radii.forEach((radius, index) => {
            // Field line circle
            g.circle(cx, cy, radius)
            const alpha = Math.max(0.1, 0.5 - index * 0.1) * Math.min(I / 50, 1)
            g.stroke({ color: 0x9b59b6, width: 1.5, alpha })

            // Direction arrows on the circle
            const arrowCount = 4 + index * 2
            for (let i = 0; i < arrowCount; i++) {
                const angle = (i / arrowCount) * Math.PI * 2 + this.time * (I / 30)
                const arrowX = cx + Math.cos(angle) * radius
                const arrowY = cy + Math.sin(angle) * radius

                // Arrow pointing tangentially (counterclockwise for current out of page)
                const tangentAngle = angle + Math.PI / 2
                const arrowSize = 6
                g.moveTo(arrowX, arrowY)
                g.lineTo(
                    arrowX - Math.cos(tangentAngle - 0.4) * arrowSize,
                    arrowY - Math.sin(tangentAngle - 0.4) * arrowSize
                )
                g.moveTo(arrowX, arrowY)
                g.lineTo(
                    arrowX - Math.cos(tangentAngle + 0.4) * arrowSize,
                    arrowY - Math.sin(tangentAngle + 0.4) * arrowSize
                )
                g.stroke({ color: 0x9b59b6, width: 2, alpha: alpha * 1.5 })
            }
        })

        // Highlight the measurement radius
        g.circle(cx, cy, r * 3)
        g.stroke({ color: 0x3498db, width: 2, alpha: 0.6 })
    }

    private drawFieldMeter(g: Graphics, B: number, I: number): void {
        const meterX = this.centerX - 60
        const meterY = this.height - 40
        const meterWidth = 120
        const meterHeight = 16

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.fill({ color: 0x222222, alpha: 0.7 })

        // Fill based on B (capped at 500 μT for display)
        const maxB = 500
        const fillRatio = Math.min(B / maxB, 1)
        const fillColor = B > 200 ? 0xe74c3c : B > 50 ? 0x9b59b6 : 0x3498db

        if (fillRatio > 0) {
            g.roundRect(meterX, meterY, meterWidth * fillRatio, meterHeight, 5)
            g.fill({ color: fillColor, alpha: 0.85 })
        }

        // Earth's field reference line (~50 μT)
        const earthLineX = meterX + (50 / maxB) * meterWidth
        g.moveTo(earthLineX, meterY)
        g.lineTo(earthLineX, meterY + meterHeight)
        g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.6 })

        // Border
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
    }
}
