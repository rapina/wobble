import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface RadiationWave {
    angle: number
    radius: number
    speed: number
    opacity: number
}

export class StefanBoltzmannScene extends BaseScene {
    declare private starBlob: Blob
    declare private radiationGraphics: Graphics
    declare private meterGraphics: Graphics
    declare private waves: RadiationWave[]
    declare private time: number

    protected setup(): void {
        this.time = 0
        this.waves = []

        this.radiationGraphics = new Graphics()
        this.container.addChild(this.radiationGraphics)

        this.meterGraphics = new Graphics()
        this.container.addChild(this.meterGraphics)

        // Star/blackbody (circle) - centered
        this.starBlob = new Blob({
            size: 60,
            color: 0xff6600,
            shape: 'circle',
            expression: 'hot',
            glowIntensity: 0.6,
            glowColor: 0xff6600,
        })
        this.starBlob.setPosition(this.centerX, this.centerY)
        this.container.addChild(this.starBlob)
    }

    protected onVariablesChange(): void {
        const T = this.variables['T'] || 600
        const A = this.variables['A'] || 4

        // Temperature affects color (blackbody radiation)
        const color = this.temperatureToColor(T)

        // A range 1-10: more dramatic size change
        const aNormalized = (A - 1) / 9 // 0 to 1
        // T range 300-1200: more dramatic glow
        const tNormalized = (T - 300) / 900 // 0 to 1

        this.starBlob.updateOptions({
            size: 35 + aNormalized * 55, // 35 to 90
            color,
            glowColor: color,
            glowIntensity: 0.3 + tNormalized * 1.2, // 0.3 to 1.5
        })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const T = this.variables['T'] || 600
        const A = this.variables['A'] || 4
        const sigma = 5.67e-8
        const P = sigma * A * Math.pow(T, 4)

        // T⁴ relationship: dramatically more waves at higher T
        // T range 300-1200, normalize properly
        const normalizedT = (T - 300) / 900 // 0 to 1
        // More dramatic emission rate using T⁴ scaling
        const emissionRate = 0.05 + Math.pow(normalizedT, 2) * 0.8 // T² scaling for visual effect

        // Emit new waves based on temperature and area
        if (Math.random() < emissionRate) {
            // A affects number of waves (A range 1-10)
            const numWaves = Math.ceil(1 + (A - 1) * 0.5)
            for (let i = 0; i < numWaves; i++) {
                this.waves.push({
                    angle: Math.random() * Math.PI * 2,
                    radius: 0,
                    speed: 1.5 + normalizedT * 2 + Math.random() * 0.5, // Speed increases with T
                    opacity: 1,
                })
            }
        }

        // Update waves
        const starSize = this.starBlob.getOptions().size as number
        this.waves.forEach((w) => {
            w.radius += w.speed * delta * 2
            w.opacity = Math.max(0, 1 - w.radius / 120)
        })
        this.waves = this.waves.filter((w) => w.opacity > 0)

        // Animate star
        this.starBlob.updateOptions({
            wobblePhase: this.time * 3,
            scaleX: 1 + Math.sin(this.time * 4) * 0.03,
            scaleY: 1 + Math.cos(this.time * 4) * 0.03,
        })

        this.drawRadiation(T, starSize)
        this.drawPowerMeter(P, T)
        this.drawTemperatureScale(T)
    }

    private temperatureToColor(T: number): number {
        // Blackbody color approximation (T range 300-1200)
        if (T < 350) return 0x330000 // Very dim red
        if (T < 450) return 0x660000 // Dark red
        if (T < 550) return 0xaa2200 // Red
        if (T < 650) return 0xcc3300 // Bright red
        if (T < 750) return 0xff6600 // Orange-red
        if (T < 850) return 0xff9900 // Orange
        if (T < 950) return 0xffcc00 // Yellow-orange
        if (T < 1050) return 0xffff66 // Yellow
        if (T < 1150) return 0xffffaa // Light yellow
        return 0xffffee // White-yellow
    }

    private drawRadiation(T: number, starSize: number): void {
        const g = this.radiationGraphics
        g.clear()

        const color = this.temperatureToColor(T)
        const startRadius = starSize / 2 + 5
        const starX = this.centerX

        // Draw radiation waves
        this.waves.forEach((w) => {
            const r = startRadius + w.radius
            const x = starX + Math.cos(w.angle) * r
            const y = this.centerY + Math.sin(w.angle) * r

            // Wave particle
            g.circle(x, y, 4 + w.opacity * 2)
            g.fill({ color, alpha: w.opacity * 0.8 })

            // Trailing line
            const trailR = r - 10
            const trailX = starX + Math.cos(w.angle) * trailR
            const trailY = this.centerY + Math.sin(w.angle) * trailR
            g.moveTo(trailX, trailY)
            g.lineTo(x, y)
            g.stroke({ color, width: 2, alpha: w.opacity * 0.5 })
        })

        // Draw concentric glow rings
        for (let i = 1; i <= 3; i++) {
            const ringRadius = starSize / 2 + i * 15
            g.circle(starX, this.centerY, ringRadius)
            g.stroke({ color, width: 2, alpha: 0.2 / i })
        }
    }

    private drawPowerMeter(P: number, T: number): void {
        const g = this.meterGraphics
        g.clear()

        // Position meter on the right side
        const meterX = this.width - 45
        const meterHeight = 140
        const meterY = this.centerY - meterHeight / 2
        const meterWidth = 20

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.fill({ color: 0x222222, alpha: 0.7 })

        // Power fill (logarithmic scale due to T⁴)
        const maxP = 5.67e-8 * 10 * Math.pow(1000, 4) // Max theoretical
        const logP = Math.log10(P + 1)
        const logMax = Math.log10(maxP + 1)
        const fillRatio = Math.min(logP / logMax, 1)
        const fillHeight = fillRatio * meterHeight

        const color = this.temperatureToColor(T)
        g.roundRect(meterX, meterY + meterHeight - fillHeight, meterWidth, fillHeight, 5)
        g.fill({ color, alpha: 0.8 })

        // Scale marks
        for (let i = 0; i <= 4; i++) {
            const y = meterY + (i / 4) * meterHeight
            g.moveTo(meterX - 5, y)
            g.lineTo(meterX, y)
            g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
        }

        // T⁴ indicator arrow
        const arrowX = meterX - 15
        const arrowY = meterY + meterHeight - fillHeight
        g.moveTo(arrowX, arrowY)
        g.lineTo(arrowX + 8, arrowY - 4)
        g.lineTo(arrowX + 8, arrowY + 4)
        g.closePath()
        g.fill({ color: 0xffffff, alpha: 0.7 })
    }

    private drawTemperatureScale(T: number): void {
        const g = this.meterGraphics

        // Temperature color bar at bottom
        const barWidth = 150
        const barHeight = 15
        const barX = this.centerX - barWidth / 2
        const barY = this.height - 35

        // Draw gradient (T range 300-1200)
        const segments = 20
        const segWidth = barWidth / segments
        for (let i = 0; i < segments; i++) {
            const segT = 300 + (i / segments) * 900
            const color = this.temperatureToColor(segT)
            g.rect(barX + i * segWidth, barY, segWidth + 1, barHeight)
            g.fill({ color, alpha: 0.8 })
        }

        // Current temperature marker (T range 300-1200)
        const markerPos = ((T - 300) / 900) * barWidth
        g.moveTo(barX + markerPos, barY - 5)
        g.lineTo(barX + markerPos - 5, barY - 12)
        g.lineTo(barX + markerPos + 5, barY - 12)
        g.closePath()
        g.fill({ color: 0xffffff, alpha: 0.9 })

        // Border
        g.roundRect(barX, barY, barWidth, barHeight, 3)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })
    }
}
