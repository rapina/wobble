import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface Spark {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    size: number
}

interface LightningSegment {
    x1: number
    y1: number
    x2: number
    y2: number
}

export class ElectricDischargeScene extends BaseScene {
    declare private electrodeGraphics: Graphics
    declare private arcGraphics: Graphics
    declare private glowGraphics: Graphics
    declare private sparkGraphics: Graphics
    declare private fieldGraphics: Graphics
    declare private positiveBlob: Blob
    declare private negativeBlob: Blob
    declare private sparks: Spark[]
    declare private lightningPath: LightningSegment[]
    declare private time: number
    declare private flickerPhase: number
    declare private arcIntensity: number
    declare private targetArcIntensity: number

    protected setup(): void {
        this.sparks = []
        this.lightningPath = []
        this.time = 0
        this.flickerPhase = 0
        this.arcIntensity = 0
        this.targetArcIntensity = 0

        // Field visualization (behind everything)
        this.fieldGraphics = new Graphics()
        this.container.addChild(this.fieldGraphics)

        // Glow effect (behind arc)
        this.glowGraphics = new Graphics()
        this.container.addChild(this.glowGraphics)

        // Arc discharge
        this.arcGraphics = new Graphics()
        this.container.addChild(this.arcGraphics)

        // Sparks
        this.sparkGraphics = new Graphics()
        this.container.addChild(this.sparkGraphics)

        // Electrodes
        this.electrodeGraphics = new Graphics()
        this.container.addChild(this.electrodeGraphics)

        // Positive electrode blob (excited)
        this.positiveBlob = new Blob({
            size: 30,
            color: 0xff6b6b,
            shape: 'circle',
            expression: 'happy',
        })
        this.container.addChild(this.positiveBlob)

        // Negative electrode blob
        this.negativeBlob = new Blob({
            size: 30,
            color: 0x4ecdc4,
            shape: 'circle',
            expression: 'happy',
        })
        this.container.addChild(this.negativeBlob)
    }

    protected onVariablesChange(): void {
        const V = this.variables['V'] ?? 30
        const d = this.variables['d'] ?? 10
        const E = V / d

        // Arc intensity based on whether breakdown occurs (E > 3 kV/mm)
        if (E >= 3) {
            // Above breakdown - strong arc
            this.targetArcIntensity = Math.min(1, (E - 3) / 7 + 0.5)
        } else {
            // Below breakdown - weak field lines, no arc
            this.targetArcIntensity = E / 3 * 0.3
        }
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const dt = delta * 0.016
        this.time += dt
        this.flickerPhase += dt * 30

        // Smooth arc intensity transition
        this.arcIntensity += (this.targetArcIntensity - this.arcIntensity) * 0.1

        const V = this.variables['V'] ?? 30
        const d = this.variables['d'] ?? 10
        const E = V / d

        // Gap distance affects electrode positions
        const normalizedGap = d / 50 // 0 to 1
        const gapPixels = 60 + normalizedGap * 120 // 60 to 180 pixels

        const leftX = this.centerX - gapPixels / 2
        const rightX = this.centerX + gapPixels / 2

        // Update blobs
        const wobble = Math.sin(this.time * 5) * 3 * this.arcIntensity
        this.positiveBlob.setPosition(leftX - 25, this.centerY + wobble)
        this.negativeBlob.setPosition(rightX + 25, this.centerY - wobble)

        const isDischarging = E >= 3
        this.positiveBlob.updateOptions({
            wobblePhase: this.time * 3,
            expression: isDischarging ? 'excited' : (E > 2 ? 'happy' : 'neutral'),
            size: 25 + this.arcIntensity * 10,
        })
        this.negativeBlob.updateOptions({
            wobblePhase: this.time * 3 + Math.PI,
            expression: isDischarging ? 'excited' : (E > 2 ? 'happy' : 'neutral'),
            size: 25 + this.arcIntensity * 10,
        })

        // Generate sparks during discharge
        if (isDischarging && Math.random() < 0.3 * this.arcIntensity) {
            const sparkX = this.centerX + (Math.random() - 0.5) * gapPixels * 0.8
            this.sparks.push({
                x: sparkX,
                y: this.centerY + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3 - 1,
                life: 1,
                size: 2 + Math.random() * 3,
            })
        }

        // Update sparks
        this.sparks.forEach((s) => {
            s.x += s.vx * delta
            s.y += s.vy * delta
            s.vy += 0.05 * delta // slight gravity
            s.life -= 0.03 * delta
        })
        this.sparks = this.sparks.filter((s) => s.life > 0)

        // Generate lightning path if discharging
        if (isDischarging) {
            this.generateLightningPath(leftX + 15, rightX - 15)
        } else {
            this.lightningPath = []
        }

        this.drawElectrodes(leftX, rightX)
        this.drawFieldLines(leftX, rightX, E)
        this.drawGlow(leftX, rightX, isDischarging)
        this.drawArc(isDischarging)
        this.drawSparks()
        this.drawIndicator(E)
    }

    private generateLightningPath(startX: number, endX: number): void {
        this.lightningPath = []
        const segments = 8 + Math.floor(Math.random() * 4)
        const segmentWidth = (endX - startX) / segments

        let x = startX
        let y = this.centerY

        for (let i = 0; i < segments; i++) {
            const nextX = startX + segmentWidth * (i + 1)
            // Amplitude decreases near endpoints for natural look
            const distFromCenter = Math.abs(i - segments / 2) / (segments / 2)
            const amplitude = (1 - distFromCenter * 0.5) * 30
            const nextY = this.centerY + (Math.random() - 0.5) * amplitude

            this.lightningPath.push({
                x1: x,
                y1: y,
                x2: nextX,
                y2: i === segments - 1 ? this.centerY : nextY,
            })

            x = nextX
            y = nextY
        }
    }

    private drawElectrodes(leftX: number, rightX: number): void {
        const g = this.electrodeGraphics
        g.clear()

        const electrodeHeight = 80
        const electrodeWidth = 15
        const topY = this.centerY - electrodeHeight / 2

        // Left electrode (positive, pointed)
        g.moveTo(leftX, topY)
        g.lineTo(leftX + electrodeWidth, topY + 10)
        g.lineTo(leftX + electrodeWidth, topY + electrodeHeight - 10)
        g.lineTo(leftX, topY + electrodeHeight)
        g.lineTo(leftX - 5, this.centerY)
        g.closePath()
        g.fill(0x888899)

        // Left electrode highlight
        g.moveTo(leftX - 5, this.centerY)
        g.lineTo(leftX, topY)
        g.lineTo(leftX, topY + electrodeHeight)
        g.closePath()
        g.fill(0xaaaabb)

        // Left glow when charged
        if (this.arcIntensity > 0.1) {
            g.circle(leftX - 5, this.centerY, 8 + this.arcIntensity * 5)
            g.fill({ color: 0xff6b6b, alpha: this.arcIntensity * 0.5 })
        }

        // Right electrode (negative, pointed)
        g.moveTo(rightX, topY)
        g.lineTo(rightX - electrodeWidth, topY + 10)
        g.lineTo(rightX - electrodeWidth, topY + electrodeHeight - 10)
        g.lineTo(rightX, topY + electrodeHeight)
        g.lineTo(rightX + 5, this.centerY)
        g.closePath()
        g.fill(0x888899)

        // Right electrode highlight
        g.moveTo(rightX + 5, this.centerY)
        g.lineTo(rightX, topY)
        g.lineTo(rightX, topY + electrodeHeight)
        g.closePath()
        g.fill(0x666677)

        // Right glow when charged
        if (this.arcIntensity > 0.1) {
            g.circle(rightX + 5, this.centerY, 8 + this.arcIntensity * 5)
            g.fill({ color: 0x4ecdc4, alpha: this.arcIntensity * 0.5 })
        }

        // Wire connections
        g.moveTo(leftX - 10, topY - 20)
        g.lineTo(leftX + electrodeWidth / 2, topY - 20)
        g.lineTo(leftX + electrodeWidth / 2, topY)
        g.stroke({ color: 0x666666, width: 3 })

        g.moveTo(rightX + 10, topY - 20)
        g.lineTo(rightX - electrodeWidth / 2, topY - 20)
        g.lineTo(rightX - electrodeWidth / 2, topY)
        g.stroke({ color: 0x666666, width: 3 })

        // Voltage labels
        g.circle(leftX - 10, topY - 20, 10)
        g.fill({ color: 0xff6b6b, alpha: 0.6 })
        g.circle(rightX + 10, topY - 20, 10)
        g.fill({ color: 0x4ecdc4, alpha: 0.6 })
    }

    private drawFieldLines(leftX: number, rightX: number, E: number): void {
        const g = this.fieldGraphics
        g.clear()

        if (E < 0.5) return

        const numLines = 5
        const startX = leftX - 5
        const endX = rightX + 5

        for (let i = 0; i < numLines; i++) {
            const offset = (i - (numLines - 1) / 2) * 15
            const y = this.centerY + offset
            const waveAmp = Math.min(3, E * 0.5) * Math.sin(this.time * 3 + i)

            g.moveTo(startX, y)
            const midX = (startX + endX) / 2
            g.quadraticCurveTo(midX, y + waveAmp, endX, y)

            const alpha = Math.min(0.4, E * 0.1)
            g.stroke({ color: 0x00ffff, width: 1, alpha })

            // Arrow
            g.moveTo(endX, y)
            g.lineTo(endX - 6, y - 3)
            g.moveTo(endX, y)
            g.lineTo(endX - 6, y + 3)
            g.stroke({ color: 0x00ffff, width: 1, alpha })
        }
    }

    private drawGlow(leftX: number, rightX: number, isDischarging: boolean): void {
        const g = this.glowGraphics
        g.clear()

        if (!isDischarging) return

        const flicker = 0.7 + Math.sin(this.flickerPhase) * 0.3
        const gapWidth = rightX - leftX

        // Main glow
        g.ellipse(this.centerX, this.centerY, gapWidth / 2 + 20, 40)
        g.fill({ color: 0x00ffff, alpha: 0.15 * this.arcIntensity * flicker })

        // Inner glow
        g.ellipse(this.centerX, this.centerY, gapWidth / 2, 20)
        g.fill({ color: 0x88ffff, alpha: 0.2 * this.arcIntensity * flicker })
    }

    private drawArc(isDischarging: boolean): void {
        const g = this.arcGraphics
        g.clear()

        if (!isDischarging || this.lightningPath.length === 0) return

        const flicker = 0.6 + Math.sin(this.flickerPhase * 1.5) * 0.4

        // Draw lightning path - outer glow
        this.lightningPath.forEach((seg) => {
            g.moveTo(seg.x1, seg.y1)
            g.lineTo(seg.x2, seg.y2)
        })
        g.stroke({
            color: 0x00ffff,
            width: 8,
            alpha: 0.3 * this.arcIntensity * flicker,
        })

        // Draw lightning path - middle layer
        this.lightningPath.forEach((seg) => {
            g.moveTo(seg.x1, seg.y1)
            g.lineTo(seg.x2, seg.y2)
        })
        g.stroke({
            color: 0x88ffff,
            width: 4,
            alpha: 0.6 * this.arcIntensity * flicker,
        })

        // Draw lightning path - core
        this.lightningPath.forEach((seg) => {
            g.moveTo(seg.x1, seg.y1)
            g.lineTo(seg.x2, seg.y2)
        })
        g.stroke({
            color: 0xffffff,
            width: 2,
            alpha: 0.9 * this.arcIntensity * flicker,
        })

        // Branch lightnings (occasionally)
        if (this.arcIntensity > 0.5 && this.lightningPath.length > 2) {
            const branchStart = this.lightningPath[Math.floor(this.lightningPath.length / 2)]
            const branchX = branchStart.x2
            const branchY = branchStart.y2
            const branchEndX = branchX + (Math.random() - 0.5) * 30
            const branchEndY = branchY + (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 20)

            g.moveTo(branchX, branchY)
            g.lineTo(branchEndX, branchEndY)
            g.stroke({
                color: 0x00ffff,
                width: 3,
                alpha: 0.3 * flicker,
            })
            g.moveTo(branchX, branchY)
            g.lineTo(branchEndX, branchEndY)
            g.stroke({
                color: 0xffffff,
                width: 1,
                alpha: 0.5 * flicker,
            })
        }
    }

    private drawSparks(): void {
        const g = this.sparkGraphics
        g.clear()

        this.sparks.forEach((s) => {
            g.circle(s.x, s.y, s.size * s.life)
            g.fill({ color: 0xffff88, alpha: s.life })
            g.circle(s.x, s.y, s.size * 0.5 * s.life)
            g.fill({ color: 0xffffff, alpha: s.life })
        })
    }

    private drawIndicator(E: number): void {
        const g = this.fieldGraphics

        // E value indicator at bottom
        const indicatorX = 20
        const indicatorY = this.height - 30
        const maxBarWidth = 100

        // Background
        g.roundRect(indicatorX - 5, indicatorY - 12, maxBarWidth + 60, 24, 6)
        g.fill({ color: 0x1a1a2e, alpha: 0.8 })

        // Bar background
        g.roundRect(indicatorX, indicatorY - 6, maxBarWidth, 12, 3)
        g.fill({ color: 0x333344 })

        // Bar fill (max E = 10)
        const normalizedE = Math.min(1, E / 10)
        const fillWidth = maxBarWidth * normalizedE

        // Color based on breakdown threshold
        const barColor = E >= 3 ? 0x00ffff : 0x4466aa
        g.roundRect(indicatorX, indicatorY - 6, fillWidth, 12, 3)
        g.fill({ color: barColor, alpha: 0.8 })

        // Breakdown threshold marker
        const thresholdX = indicatorX + maxBarWidth * 0.3 // 3/10
        g.moveTo(thresholdX, indicatorY - 8)
        g.lineTo(thresholdX, indicatorY + 8)
        g.stroke({ color: 0xff6666, width: 2, alpha: 0.6 })

        // E label
        g.circle(indicatorX + maxBarWidth + 15, indicatorY, 8)
        g.fill({ color: E >= 3 ? 0x00ffff : 0x4466aa, alpha: 0.6 })

        // Breakdown indicator text area
        if (E >= 3) {
            g.roundRect(indicatorX + maxBarWidth + 28, indicatorY - 8, 22, 16, 3)
            g.fill({ color: 0x00ffff, alpha: 0.3 })
        }
    }
}
