import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression } from '../Blob'
import { pixiColors } from '../../../utils/pixiHelpers'

export class MagneticFieldScene extends BaseScene {
    declare private graphics: Graphics
    declare private fieldGraphics: Graphics
    declare private time: number
    declare private currentFlow: number
    declare private wireBlob: Blob
    declare private probeBlob: Blob
    declare private probeAngle: number

    protected setup(): void {
        this.time = 0
        this.currentFlow = 0
        this.probeAngle = -Math.PI / 4 // Start top-right

        // Field lines layer (behind everything)
        this.fieldGraphics = new Graphics()
        this.container.addChild(this.fieldGraphics)

        // General graphics layer
        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        // Wire wobble at center (current carrier)
        this.wireBlob = new Blob({
            size: 36,
            color: 0xf39c12,
            shape: 'circle',
            expression: 'charge',
            glowColor: 0xf39c12,
            glowIntensity: 0.5,
        })
        this.wireBlob.setPosition(this.centerX, this.centerY - 20)
        this.container.addChild(this.wireBlob)

        // Probe wobble (measurement point, orbits the wire)
        this.probeBlob = new Blob({
            size: 22,
            color: 0x3498db,
            shape: 'diamond',
            expression: 'happy',
            showShadow: false,
        })
        this.container.addChild(this.probeBlob)
    }

    protected onVariablesChange(): void {
        const I = this.variables['I'] || 10
        this.wireBlob.updateOptions({
            size: 32 + I * 0.08,
            glowIntensity: 0.3 + I * 0.015,
        })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const I = this.variables['I'] || 10
        const r = this.variables['r'] || 10
        const mu0 = 4 * Math.PI * 1e-7
        const B = ((mu0 * I) / (2 * Math.PI * (r / 100))) * 1e6 // in μT

        const cx = this.centerX
        const cy = this.centerY - 20

        // Animate current flow
        this.currentFlow += I * 0.01 * delta

        // Orbit the probe wobble around the wire
        const orbitSpeed = I * 0.003
        this.probeAngle += orbitSpeed * delta
        const probeRadius = Math.max(50, r * 3)
        const probeX = cx + Math.cos(this.probeAngle) * probeRadius
        const probeY = cy + Math.sin(this.probeAngle) * probeRadius

        this.probeBlob.setPosition(probeX, probeY)

        // Probe expression reacts to field strength
        let probeExpression: BlobExpression = 'happy'
        let showSweat = false
        if (B > 200) {
            probeExpression = 'dizzy'
            showSweat = true
        } else if (B > 100) {
            probeExpression = 'worried'
            showSweat = true
        } else if (B > 50) {
            probeExpression = 'surprised'
        }

        // Probe looks tangentially (in field direction)
        const tangentAngle = this.probeAngle + Math.PI / 2
        this.probeBlob.updateOptions({
            expression: probeExpression,
            showSweat,
            wobblePhase: this.time * 3,
            lookDirection: {
                x: Math.cos(tangentAngle),
                y: Math.sin(tangentAngle),
            },
            size: 20 + Math.min(B / 50, 1) * 6,
            glowColor: 0x9b59b6,
            glowIntensity: Math.min(B / 200, 0.8),
        })

        // Wire wobble expression
        let wireExpression: BlobExpression = 'charge'
        if (I > 70) {
            wireExpression = 'effort'
        } else if (I > 40) {
            wireExpression = 'excited'
        }
        this.wireBlob.updateOptions({
            expression: wireExpression,
            wobblePhase: this.time * (2 + I * 0.05),
            showSweat: I > 80,
        })

        this.drawFieldLines(cx, cy, I, r)
        this.drawScene(cx, cy, I, r, B, probeX, probeY, probeRadius)
    }

    private drawFieldLines(cx: number, cy: number, I: number, r: number): void {
        const g = this.fieldGraphics
        g.clear()

        const radii = [40, 70, 100, 130, 160]

        radii.forEach((radius, index) => {
            const alpha = Math.max(0.08, 0.4 - index * 0.07) * Math.min(I / 40, 1)
            g.circle(cx, cy, radius)
            g.stroke({ color: 0x9b59b6, width: 1.5, alpha })

            // Direction arrows on the circle (rotating with current)
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

        // Highlight the measurement radius circle
        const measureRadius = Math.max(50, r * 3)
        g.circle(cx, cy, measureRadius)
        g.stroke({ color: 0x3498db, width: 2, alpha: 0.5 })
    }

    private drawScene(
        cx: number,
        cy: number,
        I: number,
        r: number,
        B: number,
        probeX: number,
        probeY: number,
        probeRadius: number
    ): void {
        const g = this.graphics
        g.clear()

        // Current flow animation (rings emanating from wire)
        const flowPhase = this.currentFlow % (Math.PI * 2)
        for (let i = 0; i < 3; i++) {
            const ringRadius = 25 + ((flowPhase + i * Math.PI * 0.7) % (Math.PI * 2)) * 15
            const ringAlpha = Math.max(0, 0.8 - ringRadius / 120) * Math.min(I / 80, 0.6)
            if (ringAlpha > 0.03) {
                g.circle(cx, cy, ringRadius)
                g.stroke({ color: 0xf39c12, width: 2, alpha: ringAlpha })
            }
        }

        // Distance line from wire to probe
        g.moveTo(cx, cy)
        g.lineTo(probeX, probeY)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })

        // Distance label (small "r" marker at midpoint)
        const midX = (cx + probeX) / 2
        const midY = (cy + probeY) / 2
        g.circle(midX, midY, 9)
        g.fill({ color: 0x222233, alpha: 0.8 })
        g.circle(midX, midY, 9)
        g.stroke({ color: 0x3498db, width: 1.5, alpha: 0.6 })

        // Current direction indicator on wire ("dot" = current out of page)
        g.circle(cx, cy - 1, 5)
        g.fill({ color: 0x2c3e50, alpha: 0.7 })

        // Field strength meter at bottom
        this.drawFieldMeter(g, B)
    }

    private drawFieldMeter(g: Graphics, B: number): void {
        const meterX = this.centerX - 60
        const meterY = this.height - 40
        const meterWidth = 120
        const meterHeight = 16

        // Background
        g.roundRect(meterX - 4, meterY - 4, meterWidth + 8, meterHeight + 8, 7)
        g.fill({ color: 0x1a1a2e, alpha: 0.8 })

        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.fill({ color: 0x222233 })

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
        g.moveTo(earthLineX, meterY - 2)
        g.lineTo(earthLineX, meterY + meterHeight + 2)
        g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.6 })

        // Border
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })

        // B label
        g.circle(meterX + meterWidth + 16, meterY + meterHeight / 2, 10)
        g.fill({ color: 0x9b59b6, alpha: 0.4 })
    }
}
