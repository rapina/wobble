import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'
import { pixiColors } from '../../../utils/pixiHelpers'

interface LaserParticle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    size: number
}

export class BeerLambertScene extends BaseScene {
    declare private laserGraphics: Graphics
    declare private mediumGraphics: Graphics
    declare private particleGraphics: Graphics
    declare private sourceBlob: Blob
    declare private glowGraphics: Graphics
    declare private time: number
    declare private particles: LaserParticle[]
    declare private laserPulse: number

    protected setup(): void {
        this.time = 0
        this.particles = []
        this.laserPulse = 0

        // Background glow
        this.glowGraphics = new Graphics()
        this.container.addChild(this.glowGraphics)

        // Medium (the material laser passes through)
        this.mediumGraphics = new Graphics()
        this.container.addChild(this.mediumGraphics)

        // Laser beam
        this.laserGraphics = new Graphics()
        this.container.addChild(this.laserGraphics)

        // Particles
        this.particleGraphics = new Graphics()
        this.container.addChild(this.particleGraphics)

        // Source blob (laser emitter)
        this.sourceBlob = new Blob({
            size: 40,
            color: 0x58d68d,
            shape: 'pentagon',
            expression: 'happy',
        })
        // Position will be updated in animate() for centering
        this.sourceBlob.setPosition(this.centerX - 100, this.centerY)
        this.container.addChild(this.sourceBlob)
    }

    /**
     * Calculate the source X position to center the entire visualization
     */
    private getSourceX(beamLength: number): number {
        // Total width: source blob (40) + beam + output indicator (30) + bars (100)
        const totalWidth = 40 + beamLength + 30 + 100
        // Center the visualization
        return this.centerX - totalWidth / 2 + 40
    }

    protected onVariablesChange(): void {
        const I0 = this.variables['I₀'] || 50
        // Update source glow based on initial intensity
        this.sourceBlob.updateOptions({
            size: 35 + I0 * 0.1,
        })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const dt = delta * 0.016
        this.time += dt
        this.laserPulse += dt

        const I0 = this.variables['I₀'] || 50
        const alpha = this.variables['α'] || 0.5
        const L = this.variables['L'] || 3
        const I = I0 * Math.exp(-alpha * L)

        // Laser properties - centered
        const beamLength = L * 30 // Scale distance to pixels
        const sourceX = this.getSourceX(beamLength)
        const endX = sourceX + beamLength
        const beamY = this.centerY

        // Update source blob position for centering
        this.sourceBlob.setPosition(sourceX - 30, beamY)

        // Update source expression based on intensity
        let expression: 'happy' | 'excited' | 'worried' = 'happy'
        if (I0 > 80) {
            expression = 'excited'
        } else if (alpha > 1.5) {
            expression = 'worried'
        }

        this.sourceBlob.updateOptions({
            wobblePhase: this.time * 3,
            expression,
            lookDirection: { x: 1, y: 0 },
        })

        // Spawn particles along beam
        const spawnRate = I0 / 30
        if (Math.random() < spawnRate * 0.1) {
            const spawnX = sourceX + Math.random() * beamLength
            const distFromSource = spawnX - sourceX
            const distanceM = distFromSource / 30
            const intensityAtPoint = I0 * Math.exp(-alpha * distanceM)

            if (Math.random() * I0 < intensityAtPoint) {
                this.particles.push({
                    x: spawnX,
                    y: beamY + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 2,
                    life: 1,
                    maxLife: 1,
                    size: 2 + Math.random() * 3,
                })
            }
        }

        // Update particles
        this.particles.forEach((p) => {
            p.x += p.vx * delta
            p.y += p.vy * delta
            p.life -= 0.02 * delta
            p.vy += 0.1 * delta // Slight upward drift
        })
        this.particles = this.particles.filter((p) => p.life > 0 && p.x < endX + 20)

        // Draw everything
        this.drawGlow(I0, sourceX, beamY)
        this.drawMedium(sourceX, beamLength, alpha)
        this.drawLaser(sourceX, endX, beamY, I0, alpha)
        this.drawParticles()
        this.drawIntensityIndicator(endX, beamY, I, I0)
    }

    private drawGlow(I0: number, sourceX: number, sourceY: number): void {
        const g = this.glowGraphics
        g.clear()

        const intensity = I0 / 100
        if (intensity < 0.1) return

        // Glow around source
        for (let i = 3; i >= 0; i--) {
            const radius = 40 + i * 20
            const alpha = intensity * 0.15 * (1 - i * 0.2)
            g.circle(sourceX - 20, sourceY, radius)
            g.fill({ color: 0x58d68d, alpha })
        }
    }

    private drawMedium(sourceX: number, length: number, absorption: number): void {
        const g = this.mediumGraphics
        g.clear()

        const padding = 20
        const height = 100
        const y = this.centerY - height / 2

        // Medium background (darker = more absorptive)
        const darkness = Math.min(absorption / 2, 1)
        const mediumColor = this.lerpColor(0x3498db, 0x1a252f, darkness)

        // Draw medium with gradient-like effect using multiple rectangles
        const segments = 20
        const segWidth = length / segments
        for (let i = 0; i < segments; i++) {
            const x = sourceX + i * segWidth
            const segAlpha = 0.3 + darkness * 0.4
            g.rect(x, y, segWidth + 1, height)
            g.fill({ color: mediumColor, alpha: segAlpha })
        }

        // Border
        g.rect(sourceX, y, length, height)
        g.stroke({ color: 0x5dade2, width: 2, alpha: 0.6 })

        // Absorption coefficient indicator (floating particles in medium)
        const particleCount = Math.floor(absorption * 15)
        const pulse = Math.sin(this.time * 2) * 0.3 + 0.7
        for (let i = 0; i < particleCount; i++) {
            const px = sourceX + 10 + (i * (length - 20)) / particleCount
            const py = y + 20 + Math.sin(this.time * 2 + i) * 20 + 30
            const size = 3 + Math.sin(this.time * 3 + i * 0.5) * 1
            g.circle(px, py, size)
            g.fill({ color: 0x2c3e50, alpha: 0.5 * pulse })
        }

        // Label
        g.circle(sourceX + length / 2, y - 15, 8)
        g.fill({ color: mediumColor, alpha: 0.5 })
    }

    private drawLaser(
        sourceX: number,
        endX: number,
        beamY: number,
        I0: number,
        alpha: number
    ): void {
        const g = this.laserGraphics
        g.clear()

        const segments = 40
        const length = endX - sourceX
        const segWidth = length / segments

        // Draw laser beam with intensity gradient
        for (let i = 0; i < segments; i++) {
            const x = sourceX + i * segWidth
            const distanceM = (i * segWidth) / 30
            const intensity = I0 * Math.exp(-alpha * distanceM)
            const normalizedIntensity = intensity / 100

            // Core beam
            const beamWidth = 6 * (0.5 + normalizedIntensity * 0.5)
            const beamAlpha = Math.min(normalizedIntensity * 1.5, 1)

            g.rect(x, beamY - beamWidth / 2, segWidth + 1, beamWidth)
            g.fill({ color: 0x58d68d, alpha: beamAlpha })

            // Outer glow
            const glowWidth = 20 * normalizedIntensity
            if (glowWidth > 1) {
                g.rect(x, beamY - glowWidth / 2, segWidth + 1, glowWidth)
                g.fill({ color: 0x82e0aa, alpha: beamAlpha * 0.3 })
            }
        }

        // Pulsing effect at source
        const pulse = Math.sin(this.laserPulse * 8) * 0.3 + 0.7
        g.circle(sourceX, beamY, 10 * pulse)
        g.fill({ color: 0x58d68d, alpha: 0.8 })
        g.circle(sourceX, beamY, 15 * pulse)
        g.fill({ color: 0x58d68d, alpha: 0.3 })
    }

    private drawParticles(): void {
        const g = this.particleGraphics
        g.clear()

        this.particles.forEach((p) => {
            const alpha = p.life * 0.8
            g.circle(p.x, p.y, p.size * p.life)
            g.fill({ color: 0x82e0aa, alpha })
        })
    }

    private drawIntensityIndicator(
        endX: number,
        beamY: number,
        outputI: number,
        inputI: number
    ): void {
        const g = this.laserGraphics
        const ratio = outputI / inputI

        // Output intensity indicator (circle at end)
        const indicatorX = endX + 30
        const size = 15 + ratio * 20
        const alpha = 0.3 + ratio * 0.7

        // Glow
        for (let i = 2; i >= 0; i--) {
            const glowSize = size + i * 10
            const glowAlpha = alpha * 0.2 * (1 - i * 0.3)
            g.circle(indicatorX, beamY, glowSize)
            g.fill({ color: 0x58d68d, alpha: glowAlpha })
        }

        // Core
        g.circle(indicatorX, beamY, size)
        g.fill({ color: 0x58d68d, alpha })
        g.circle(indicatorX, beamY, size)
        g.stroke({ color: 0x82e0aa, width: 2, alpha: alpha * 0.8 })

        // Intensity bars comparison - positioned after output indicator
        const barX = indicatorX + 50
        const barHeight = 80
        const barWidth = 12
        const barY = this.centerY - barHeight / 2

        // Input bar (I0)
        g.rect(barX, barY, barWidth, barHeight)
        g.fill({ color: 0x333333, alpha: 0.5 })
        const inputHeight = (inputI / 100) * barHeight
        g.rect(barX, barY + barHeight - inputHeight, barWidth, inputHeight)
        g.fill({ color: 0x58d68d, alpha: 0.9 })
        g.circle(barX + barWidth / 2, barY - 10, 5)
        g.fill({ color: 0x58d68d, alpha: 0.5 })

        // Output bar (I)
        g.rect(barX + 25, barY, barWidth, barHeight)
        g.fill({ color: 0x333333, alpha: 0.5 })
        const outputHeight = (outputI / 100) * barHeight
        g.rect(barX + 25, barY + barHeight - outputHeight, barWidth, outputHeight)
        g.fill({ color: 0x82e0aa, alpha: 0.9 })
        g.circle(barX + 25 + barWidth / 2, barY - 10, 5)
        g.fill({ color: 0x82e0aa, alpha: 0.5 })
    }

    private lerpColor(color1: number, color2: number, t: number): number {
        const r1 = (color1 >> 16) & 0xff
        const g1 = (color1 >> 8) & 0xff
        const b1 = color1 & 0xff

        const r2 = (color2 >> 16) & 0xff
        const g2 = (color2 >> 8) & 0xff
        const b2 = color2 & 0xff

        const r = Math.round(r1 + (r2 - r1) * t)
        const g = Math.round(g1 + (g2 - g1) * t)
        const b = Math.round(b1 + (b2 - b1) * t)

        return (r << 16) | (g << 8) | b
    }
}
