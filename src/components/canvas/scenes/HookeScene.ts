import { Ticker, Graphics, Text, TextStyle } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression } from '../Blob'
import { pixiColors, clamp, lerp } from '../../../utils/pixiHelpers'

export class HookeScene extends BaseScene {
    declare private blob: Blob
    declare private bandGraphics: Graphics
    declare private uiGraphics: Graphics

    // Physics parameters
    declare private displayedK: number
    declare private displayedAmplitude: number

    // Animation state
    declare private time: number

    // Layout
    declare private leftAnchorX: number
    declare private rightAnchorX: number
    declare private equilibriumX: number

    declare private statusLabel: Text

    protected setup(): void {
        this.displayedK = 50
        this.displayedAmplitude = 0.5
        this.time = 0

        // Layout - horizontal elastic bands
        this.leftAnchorX = 30
        this.rightAnchorX = this.width - 30
        this.equilibriumX = this.centerX

        // Graphics
        this.bandGraphics = new Graphics()
        this.container.addChild(this.bandGraphics)

        this.uiGraphics = new Graphics()
        this.container.addChild(this.uiGraphics)

        // Blob
        this.blob = new Blob({
            size: 50,
            color: pixiColors.spring,
            shape: 'circle',
            expression: 'happy',
        })
        this.container.addChild(this.blob)

        // Status label
        const labelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xffffff,
        })
        this.statusLabel = new Text({ text: '', style: labelStyle })
        this.statusLabel.position.set(20, 20)
        this.container.addChild(this.statusLabel)
    }

    protected onVariablesChange(): void {
        // Read in animate()
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67

        // Get target values
        const targetK = this.variables['k'] ?? 50
        const targetAmplitude = this.variables['x'] ?? 0.5

        // Smooth parameter changes
        this.displayedK = lerp(this.displayedK, targetK, 0.08)
        this.displayedAmplitude = lerp(this.displayedAmplitude, targetAmplitude, 0.08)

        // Angular frequency: ω = √(k/m), higher k = faster oscillation
        const omega = Math.sqrt(this.displayedK / 50) * 2

        // Update time
        this.time += delta * 0.03

        // Simple Harmonic Motion: x(t) = A * sin(ωt)
        const maxDisplacement = 80 // max pixels from center
        const displacement = this.displayedAmplitude * Math.sin(omega * this.time) * maxDisplacement

        // Velocity: v(t) = A * ω * cos(ωt)
        const velocity = this.displayedAmplitude * omega * Math.cos(omega * this.time)

        // Current force: F = -kx (restoring force toward equilibrium)
        const normalizedX = displacement / maxDisplacement
        const force = this.displayedK * Math.abs(normalizedX)
        const forceDirection = -Math.sign(displacement)

        // Blob position
        const blobX = this.equilibriumX + displacement
        const blobY = this.centerY

        // Expression based on state
        let expression: BlobExpression = 'happy'
        const stretch = Math.abs(displacement) / maxDisplacement
        const speed = Math.abs(velocity)

        if (stretch > 0.7) {
            expression = 'effort'
        } else if (speed > 2) {
            expression = velocity > 0 ? 'excited' : 'worried'
        }

        // Squash & stretch based on velocity (horizontal movement)
        const squashX = 1 - velocity * 0.03
        const stretchY = 1 + Math.abs(velocity) * 0.015

        this.blob.setPosition(blobX, blobY)
        this.blob.updateOptions({
            scaleX: clamp(squashX, 0.85, 1.15),
            scaleY: clamp(stretchY, 0.85, 1.15),
            expression,
            wobblePhase: this.time * 2,
        })

        // Draw
        this.drawElasticBands(blobX, blobY, displacement)
        this.drawUI(displacement, force, forceDirection, omega)
        this.updateStatus(normalizedX, force, forceDirection)
    }

    private drawElasticBands(blobX: number, blobY: number, displacement: number): void {
        const g = this.bandGraphics
        g.clear()

        const blobRadius = 25
        const anchorY = blobY

        // Calculate stretch for each band
        const leftLength = blobX - blobRadius - this.leftAnchorX
        const rightLength = this.rightAnchorX - (blobX + blobRadius)
        const restLength = this.equilibriumX - blobRadius - this.leftAnchorX

        const leftStretch = leftLength / restLength
        const rightStretch = rightLength / restLength

        // Band thickness based on k (stiffer = thicker)
        const baseThickness = 6 + (this.displayedK / 100) * 6

        // Left band (stretched when blob moves right)
        const leftThickness = baseThickness / clamp(leftStretch, 0.5, 2)
        const leftColor = this.getStretchColor(leftStretch)
        this.drawWavyBand(
            g,
            this.leftAnchorX,
            anchorY,
            blobX - blobRadius,
            anchorY,
            leftThickness,
            leftColor,
            leftStretch
        )

        // Right band (stretched when blob moves left)
        const rightThickness = baseThickness / clamp(rightStretch, 0.5, 2)
        const rightColor = this.getStretchColor(rightStretch)
        this.drawWavyBand(
            g,
            blobX + blobRadius,
            anchorY,
            this.rightAnchorX,
            anchorY,
            rightThickness,
            rightColor,
            rightStretch
        )

        // Left anchor (wall)
        g.roundRect(this.leftAnchorX - 15, anchorY - 40, 20, 80, 4)
        g.fill(0x555555)
        g.circle(this.leftAnchorX + 3, anchorY, 8)
        g.fill(0x666666)
        g.stroke({ color: 0x444444, width: 2 })

        // Right anchor (wall)
        g.roundRect(this.rightAnchorX - 5, anchorY - 40, 20, 80, 4)
        g.fill(0x555555)
        g.circle(this.rightAnchorX - 3, anchorY, 8)
        g.fill(0x666666)
        g.stroke({ color: 0x444444, width: 2 })
    }

    private drawWavyBand(
        g: Graphics,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        thickness: number,
        color: number,
        stretchRatio: number
    ): void {
        const length = x2 - x1
        if (length < 10) return

        // When compressed, show more waves; when stretched, fewer waves
        const waveCount = Math.max(2, Math.floor(8 / stretchRatio))
        const waveHeight = clamp(12 / stretchRatio, 4, 20)

        g.moveTo(x1, y1)

        for (let i = 0; i <= waveCount; i++) {
            const t = i / waveCount
            const x = x1 + length * t
            const yOffset = (i % 2 === 0 ? -1 : 1) * waveHeight * (i > 0 && i < waveCount ? 1 : 0)
            g.lineTo(x, y1 + yOffset)
        }

        g.stroke({
            color: color,
            width: thickness,
            cap: 'round',
            join: 'round',
        })
    }

    private getStretchColor(stretchRatio: number): number {
        // Blue when compressed, normal when rest, red when stretched
        if (stretchRatio < 0.9) {
            // Compressed - blue
            const t = clamp((0.9 - stretchRatio) / 0.4, 0, 1)
            return this.lerpColor(0x88aacc, 0x4488ff, t)
        } else if (stretchRatio > 1.1) {
            // Stretched - red
            const t = clamp((stretchRatio - 1.1) / 0.5, 0, 1)
            return this.lerpColor(0xccaa88, 0xff6b6b, t)
        }
        // Rest - neutral
        return 0xaaaaaa
    }

    private drawUI(displacement: number, force: number, forceDir: number, omega: number): void {
        const g = this.uiGraphics
        g.clear()

        const centerY = this.centerY

        // Equilibrium line (vertical dashed)
        for (let y = centerY - 60; y < centerY + 60; y += 10) {
            g.moveTo(this.equilibriumX, y)
            g.lineTo(this.equilibriumX, y + 5)
        }
        g.stroke({ color: 0x4ecdc4, width: 2, alpha: 0.5 })

        // "0" marker at equilibrium
        g.roundRect(this.equilibriumX - 11, centerY + 65, 22, 20, 4)
        g.fill({ color: 0x4ecdc4, alpha: 0.6 })

        // Current blob X position
        const blobX = this.equilibriumX + displacement

        // Displacement bracket (x) - below blob
        if (Math.abs(displacement) > 8) {
            const bracketY = centerY + 45

            // Horizontal line from equilibrium to blob
            g.moveTo(this.equilibriumX, bracketY)
            g.lineTo(blobX, bracketY)
            g.stroke({ color: 0x82e0aa, width: 3 })

            // Vertical ticks
            g.moveTo(this.equilibriumX, bracketY - 6)
            g.lineTo(this.equilibriumX, bracketY + 6)
            g.stroke({ color: 0x82e0aa, width: 3 })

            g.moveTo(blobX, bracketY - 6)
            g.lineTo(blobX, bracketY + 6)
            g.stroke({ color: 0x82e0aa, width: 3 })

            // x label
            const midX = (this.equilibriumX + blobX) / 2
            g.roundRect(midX - 12, bracketY + 10, 24, 18, 4)
            g.fill({ color: 0x82e0aa, alpha: 0.8 })
        }

        // Force arrow (F) - above blob, pointing toward equilibrium
        const forceLength = clamp(force * 0.6, 0, 60)
        if (forceLength > 10 && Math.abs(displacement) > 8) {
            const arrowY = centerY - 45
            const arrowEndX = blobX + forceDir * forceLength

            g.moveTo(blobX, arrowY)
            g.lineTo(arrowEndX, arrowY)
            g.stroke({ color: 0xf7dc6f, width: 4 })

            // Arrow head
            g.moveTo(arrowEndX, arrowY)
            g.lineTo(arrowEndX - forceDir * 10, arrowY - 7)
            g.moveTo(arrowEndX, arrowY)
            g.lineTo(arrowEndX - forceDir * 10, arrowY + 7)
            g.stroke({ color: 0xf7dc6f, width: 4 })

            // F label
            g.roundRect(arrowEndX + forceDir * 5 - 12, arrowY - 25, 24, 18, 4)
            g.fill({ color: 0xf7dc6f, alpha: 0.8 })
        }

        // k indicator (bottom left)
        const kBarX = 20
        const kBarY = this.height - 50
        const kBarWidth = 80
        const kRatio = (this.displayedK - 10) / 90

        g.roundRect(kBarX, kBarY - 16, 20, 14, 3)
        g.fill({ color: 0xf39c12, alpha: 0.7 })

        g.roundRect(kBarX, kBarY, kBarWidth, 10, 4)
        g.fill({ color: 0x333344 })

        g.roundRect(kBarX + 2, kBarY + 2, kRatio * (kBarWidth - 4), 6, 2)
        g.fill({ color: 0xf39c12 })

        // Oscillation frequency indicator (sine wave)
        const waveX = this.width - 70
        const waveY = this.height - 45

        g.moveTo(waveX - 40, waveY)
        for (let i = 0; i <= 80; i++) {
            const px = waveX - 40 + i
            const py = waveY + Math.sin(i * omega * 0.08) * 12
            g.lineTo(px, py)
        }
        g.stroke({ color: 0xf39c12, width: 2, alpha: 0.6 })
    }

    private updateStatus(x: number, F: number, forceDir: number): void {
        const direction = forceDir > 0 ? '→' : forceDir < 0 ? '←' : ''
        if (Math.abs(x) < 0.05) {
            this.statusLabel.text = '평형점 통과'
            this.statusLabel.style.fill = 0x4ecdc4
        } else {
            this.statusLabel.text = `F = ${this.displayedK.toFixed(0)} × ${Math.abs(x).toFixed(2)} ${direction}`
            this.statusLabel.style.fill = 0xf7dc6f
        }
    }

    private lerpColor(c1: number, c2: number, t: number): number {
        const r1 = (c1 >> 16) & 0xff,
            g1 = (c1 >> 8) & 0xff,
            b1 = c1 & 0xff
        const r2 = (c2 >> 16) & 0xff,
            g2 = (c2 >> 8) & 0xff,
            b2 = c2 & 0xff
        const r = Math.round(r1 + (r2 - r1) * t)
        const g = Math.round(g1 + (g2 - g1) * t)
        const b = Math.round(b1 + (b2 - b1) * t)
        return (r << 16) + (g << 8) + b
    }
}
