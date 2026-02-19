import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression } from '../Blob'
import { pixiColors } from '../../../utils/pixiHelpers'

interface EnergyParticle {
    x: number
    y: number
    targetX: number
    speed: number
    phase: number
}

interface Spark {
    x: number
    y: number
    angle: number
    length: number
    life: number
}

export class CapacitorScene extends BaseScene {
    declare private plateGraphics: Graphics
    declare private energyGraphics: Graphics
    declare private sparkGraphics: Graphics
    declare private positiveBlob: Blob
    declare private negativeBlob: Blob
    declare private energyParticles: EnergyParticle[]
    declare private sparks: Spark[]
    declare private time: number
    declare private energyLevel: number
    declare private targetEnergyLevel: number
    declare private flashIntensity: number

    protected setup(): void {
        this.time = 0
        this.energyLevel = 0
        this.targetEnergyLevel = 0
        this.flashIntensity = 0
        this.energyParticles = []
        this.sparks = []

        // Energy field between plates
        this.energyGraphics = new Graphics()
        this.container.addChild(this.energyGraphics)

        // Capacitor plates
        this.plateGraphics = new Graphics()
        this.container.addChild(this.plateGraphics)

        // Spark effects
        this.sparkGraphics = new Graphics()
        this.container.addChild(this.sparkGraphics)

        // Positive charge blob (left plate)
        this.positiveBlob = new Blob({
            size: 35,
            color: 0xff6b6b,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: 0xff6b6b,
        })
        this.container.addChild(this.positiveBlob)

        // Negative charge blob (right plate)
        this.negativeBlob = new Blob({
            size: 35,
            color: 0x4ecdc4,
            shape: 'square',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: 0x4ecdc4,
        })
        this.container.addChild(this.negativeBlob)

        // Initialize energy particles flowing between plates
        for (let i = 0; i < 15; i++) {
            this.energyParticles.push({
                x: this.centerX,
                y: this.centerY - 50 + Math.random() * 100,
                targetX: this.centerX,
                speed: 0.5 + Math.random() * 1,
                phase: Math.random() * Math.PI * 2,
            })
        }
    }

    protected onVariablesChange(): void {
        const C = this.variables['C'] || 4 // mF (1-10)
        const V = this.variables['V'] || 5 // kV (1-10)
        const E = this.variables['E'] || 50 // kJ

        // Energy level based on E = ½CV² (emphasize V² relationship)
        // At max (C=10, V=10): E = 500 kJ
        const normalizedE = E / 500
        this.targetEnergyLevel = normalizedE

        // Update blob sizes based on charge Q = CV
        const Q = C * V
        const normalizedQ = Q / 100 // Max Q = 100

        this.positiveBlob.updateOptions({
            size: 30 + normalizedQ * 25,
            glowIntensity: 0.2 + normalizedE * 0.8,
        })
        this.negativeBlob.updateOptions({
            size: 30 + normalizedQ * 25,
            glowIntensity: 0.2 + normalizedE * 0.8,
        })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const dt = delta * 0.016
        this.time += dt

        // Smooth energy level transition
        this.energyLevel += (this.targetEnergyLevel - this.energyLevel) * 0.05

        const C = this.variables['C'] || 4
        const V = this.variables['V'] || 5
        const E = this.variables['E'] || 50

        // Plate dimensions - gap depends on C (larger C = smaller gap)
        const plateWidth = 25
        const plateHeight = 140
        const normalizedC = (C - 1) / 9
        const plateGap = 100 - normalizedC * 40 // 100 to 60
        const leftPlateX = this.centerX - plateGap / 2 - plateWidth
        const rightPlateX = this.centerX + plateGap / 2

        // Update blob positions
        const wobbleAmount = this.energyLevel * 5
        const wobble = Math.sin(this.time * 4) * wobbleAmount

        this.positiveBlob.setPosition(leftPlateX - 25, this.centerY)
        this.negativeBlob.setPosition(rightPlateX + plateWidth + 25, this.centerY)

        // Expressions based on energy level
        let expression: BlobExpression = 'happy'
        if (this.energyLevel > 0.7) {
            expression = 'excited'
        } else if (this.energyLevel > 0.4) {
            expression = 'charge'
        }

        this.positiveBlob.updateOptions({
            wobblePhase: this.time * 2,
            expression,
            scaleX: 1 + this.energyLevel * 0.1,
        })
        this.negativeBlob.updateOptions({
            wobblePhase: this.time * 2 + Math.PI,
            expression,
            scaleX: 1 + this.energyLevel * 0.1,
        })

        // Update energy particles
        this.updateEnergyParticles(leftPlateX, rightPlateX, plateWidth, dt)

        // Generate sparks when high energy
        if (this.energyLevel > 0.5 && Math.random() < this.energyLevel * 0.15) {
            const side = Math.random() > 0.5 ? 1 : -1
            const sparkX = this.centerX + side * (plateGap / 2 - 5)
            this.sparks.push({
                x: sparkX,
                y: this.centerY + (Math.random() - 0.5) * plateHeight * 0.7,
                angle: (Math.random() - 0.5) * Math.PI,
                length: 5 + Math.random() * 15 * this.energyLevel,
                life: 1,
            })
        }

        // Update sparks
        this.sparks.forEach((s) => {
            s.life -= 0.08
        })
        this.sparks = this.sparks.filter((s) => s.life > 0)

        // Flash intensity for "ready to discharge" state
        if (this.energyLevel > 0.8) {
            this.flashIntensity = 0.3 + Math.sin(this.time * 8) * 0.2
        } else {
            this.flashIntensity *= 0.95
        }

        this.drawEnergyField(leftPlateX, rightPlateX, plateWidth, plateGap, plateHeight, V)
        this.drawPlates(leftPlateX, rightPlateX, plateWidth, plateHeight)
        this.drawEnergyParticles()
        this.drawSparks()
        this.drawEnergyMeter(E)
    }

    private updateEnergyParticles(
        leftPlateX: number,
        rightPlateX: number,
        plateWidth: number,
        dt: number
    ): void {
        const fieldCenterX = (leftPlateX + plateWidth + rightPlateX) / 2

        this.energyParticles.forEach((p) => {
            p.phase += dt * (2 + this.energyLevel * 3)

            // Oscillate within the field region
            const oscillationRange = 20 + this.energyLevel * 30
            p.x = fieldCenterX + Math.sin(p.phase) * oscillationRange
            p.y += Math.sin(p.phase * 0.7 + p.speed) * 0.5

            // Keep within plate height bounds
            if (p.y < this.centerY - 60) p.y = this.centerY - 60
            if (p.y > this.centerY + 60) p.y = this.centerY + 60
        })
    }

    private drawEnergyField(
        leftX: number,
        rightX: number,
        plateWidth: number,
        gap: number,
        height: number,
        V: number
    ): void {
        const g = this.energyGraphics
        g.clear()

        const fieldLeft = leftX + plateWidth
        const fieldRight = rightX
        const topY = this.centerY - height / 2

        // Energy field glow - intensity based on V² (key insight!)
        // V ranges 1-10, so V² ranges 1-100
        const vSquaredNormalized = ((V * V) - 1) / 99
        const glowIntensity = 0.1 + vSquaredNormalized * 0.5

        // Multiple glow layers for depth
        for (let layer = 4; layer >= 0; layer--) {
            const expand = layer * 8
            const alpha = glowIntensity * (1 - layer * 0.18) * this.energyLevel

            if (alpha > 0.02) {
                g.roundRect(
                    fieldLeft - expand,
                    topY - expand,
                    fieldRight - fieldLeft + expand * 2,
                    height + expand * 2,
                    4
                )
                g.fill({ color: pixiColors.energy, alpha })
            }
        }

        // Electric field lines
        if (this.energyLevel > 0.1) {
            const numLines = 7
            const lineSpacing = (height - 20) / (numLines - 1)

            for (let i = 0; i < numLines; i++) {
                const y = topY + 10 + i * lineSpacing
                const waveOffset = Math.sin(this.time * 3 + i * 0.5) * 2 * this.energyLevel

                g.moveTo(fieldLeft + 5, y)
                const midX = (fieldLeft + fieldRight) / 2
                g.quadraticCurveTo(midX, y + waveOffset, fieldRight - 5, y)
                g.stroke({
                    color: pixiColors.force,
                    width: 1.5,
                    alpha: 0.3 + this.energyLevel * 0.4,
                })

                // Arrow heads
                g.moveTo(fieldRight - 5, y)
                g.lineTo(fieldRight - 12, y - 4)
                g.moveTo(fieldRight - 5, y)
                g.lineTo(fieldRight - 12, y + 4)
                g.stroke({
                    color: pixiColors.force,
                    width: 1.5,
                    alpha: 0.3 + this.energyLevel * 0.4,
                })
            }
        }

        // "Flash ready" effect when highly charged
        if (this.flashIntensity > 0.1) {
            g.roundRect(fieldLeft - 2, topY - 2, fieldRight - fieldLeft + 4, height + 4, 4)
            g.fill({ color: 0xffffff, alpha: this.flashIntensity * 0.3 })
        }

        // V² indicator text area
        if (this.energyLevel > 0.3) {
            const indicatorY = topY + height + 15
            g.roundRect(this.centerX - 25, indicatorY, 50, 20, 4)
            g.fill({ color: pixiColors.energy, alpha: 0.2 + this.energyLevel * 0.3 })
        }
    }

    private drawPlates(leftX: number, rightX: number, width: number, height: number): void {
        const g = this.plateGraphics
        g.clear()

        const topY = this.centerY - height / 2

        // Left plate (positive - red tint)
        g.roundRect(leftX, topY, width, height, 4)
        g.fill({ color: 0x555566 })

        // Left plate highlight
        g.roundRect(leftX, topY, 4, height, 2)
        g.fill({ color: 0x777788 })

        // Left plate charge indicator
        if (this.energyLevel > 0) {
            g.roundRect(leftX - 2, topY - 2, width + 4, height + 4, 6)
            g.stroke({ color: 0xff6b6b, width: 2, alpha: this.energyLevel * 0.6 })

            // + symbols
            for (let i = 0; i < 3; i++) {
                const y = topY + 30 + i * 40
                g.moveTo(leftX + width / 2 - 6, y)
                g.lineTo(leftX + width / 2 + 6, y)
                g.moveTo(leftX + width / 2, y - 6)
                g.lineTo(leftX + width / 2, y + 6)
                g.stroke({ color: 0xff6b6b, width: 2, alpha: 0.5 + this.energyLevel * 0.5 })
            }
        }

        // Right plate (negative - cyan tint)
        g.roundRect(rightX, topY, width, height, 4)
        g.fill({ color: 0x555566 })

        // Right plate highlight
        g.roundRect(rightX + width - 4, topY, 4, height, 2)
        g.fill({ color: 0x777788 })

        // Right plate charge indicator
        if (this.energyLevel > 0) {
            g.roundRect(rightX - 2, topY - 2, width + 4, height + 4, 6)
            g.stroke({ color: 0x4ecdc4, width: 2, alpha: this.energyLevel * 0.6 })

            // - symbols
            for (let i = 0; i < 3; i++) {
                const y = topY + 30 + i * 40
                g.moveTo(rightX + width / 2 - 6, y)
                g.lineTo(rightX + width / 2 + 6, y)
                g.stroke({ color: 0x4ecdc4, width: 2, alpha: 0.5 + this.energyLevel * 0.5 })
            }
        }

        // Wire connections
        const wireY = topY - 25
        g.moveTo(leftX + width / 2, topY)
        g.lineTo(leftX + width / 2, wireY)
        g.lineTo(30, wireY)
        g.stroke({ color: 0x666666, width: 3 })

        g.moveTo(rightX + width / 2, topY)
        g.lineTo(rightX + width / 2, wireY)
        g.lineTo(this.width - 30, wireY)
        g.stroke({ color: 0x666666, width: 3 })

        // Power source indicators
        g.circle(30, wireY, 10)
        g.fill({ color: 0xff6b6b, alpha: 0.4 + this.energyLevel * 0.4 })
        g.circle(this.width - 30, wireY, 10)
        g.fill({ color: 0x4ecdc4, alpha: 0.4 + this.energyLevel * 0.4 })
    }

    private drawEnergyParticles(): void {
        const g = this.sparkGraphics
        g.clear()

        if (this.energyLevel < 0.15) return

        this.energyParticles.forEach((p) => {
            const alpha = this.energyLevel * 0.6
            const size = 2 + this.energyLevel * 3

            // Particle glow
            g.circle(p.x, p.y, size + 2)
            g.fill({ color: pixiColors.energy, alpha: alpha * 0.4 })

            // Particle core
            g.circle(p.x, p.y, size)
            g.fill({ color: 0xffffff, alpha: alpha * 0.8 })
        })
    }

    private drawSparks(): void {
        const g = this.sparkGraphics

        this.sparks.forEach((s) => {
            const endX = s.x + Math.cos(s.angle) * s.length
            const endY = s.y + Math.sin(s.angle) * s.length

            // Spark line
            g.moveTo(s.x, s.y)
            g.lineTo(endX, endY)
            g.stroke({ color: 0xffff88, width: 2, alpha: s.life })

            // Spark glow
            g.circle(s.x, s.y, 3 * s.life)
            g.fill({ color: 0xffffff, alpha: s.life * 0.8 })
        })
    }

    private drawEnergyMeter(E: number): void {
        const g = this.sparkGraphics

        // Energy meter at bottom
        const meterX = 20
        const meterY = this.height - 40
        const meterWidth = 120
        const meterHeight = 20

        // Background
        g.roundRect(meterX - 5, meterY - 8, meterWidth + 35, meterHeight + 16, 8)
        g.fill({ color: 0x1a1a2e, alpha: 0.85 })

        // Meter label area
        g.roundRect(meterX, meterY - 3, 25, meterHeight + 6, 4)
        g.fill({ color: pixiColors.energy, alpha: 0.3 })

        // Meter background
        g.roundRect(meterX + 30, meterY, meterWidth - 30, meterHeight, 5)
        g.fill({ color: 0x333344 })

        // Meter fill (E max = 500 kJ)
        const normalizedE = Math.min(1, E / 500)
        const fillWidth = (meterWidth - 30) * normalizedE

        // Color based on energy level
        const fillColor =
            normalizedE > 0.7 ? 0xff6b6b : normalizedE > 0.4 ? pixiColors.energy : 0xf1c40f

        g.roundRect(meterX + 30, meterY, fillWidth, meterHeight, 5)
        g.fill({ color: fillColor, alpha: 0.85 })

        // Pulsing effect when high energy
        if (normalizedE > 0.6) {
            const pulseAlpha = Math.sin(this.time * 6) * 0.15 + 0.15
            g.roundRect(meterX + 30, meterY, fillWidth, meterHeight, 5)
            g.fill({ color: 0xffffff, alpha: pulseAlpha })
        }

        // Voltage squared indicator (key formula insight)
        if (normalizedE > 0.3) {
            const V = this.variables['V'] || 5
            const vSquaredNormalized = ((V * V) - 1) / 99

            // Small V² indicator next to meter
            g.roundRect(meterX + meterWidth + 5, meterY + 2, 20, meterHeight - 4, 3)
            g.fill({ color: 0x333344 })
            g.roundRect(
                meterX + meterWidth + 5,
                meterY + 2,
                20 * vSquaredNormalized,
                meterHeight - 4,
                3
            )
            g.fill({ color: pixiColors.voltage, alpha: 0.7 })
        }
    }
}
