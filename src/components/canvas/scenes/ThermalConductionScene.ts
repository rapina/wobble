import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface HeatParticle {
    x: number
    y: number
    progress: number
    speed: number
    yOffset: number
}

export class ThermalConductionScene extends BaseScene {
    declare private hotBlob: Blob
    declare private coldBlob: Blob
    declare private barGraphics: Graphics
    declare private particleGraphics: Graphics
    declare private uiGraphics: Graphics
    declare private heatParticles: HeatParticle[]
    declare private time: number
    declare private coldTemp: number

    protected setup(): void {
        this.time = 0
        this.heatParticles = []
        this.coldTemp = 20 // Starting cold side temperature

        this.barGraphics = new Graphics()
        this.container.addChild(this.barGraphics)

        this.particleGraphics = new Graphics()
        this.container.addChild(this.particleGraphics)

        this.uiGraphics = new Graphics()
        this.container.addChild(this.uiGraphics)

        // Hot side (circle - heat source)
        this.hotBlob = new Blob({
            size: 50,
            color: 0xe74c3c,
            shape: 'circle',
            expression: 'hot',
            glowIntensity: 0.6,
            glowColor: 0xe74c3c,
        })
        this.hotBlob.setPosition(50, this.centerY)
        this.container.addChild(this.hotBlob)

        // Cold side (square - heat sink)
        this.coldBlob = new Blob({
            size: 45,
            color: 0x3498db,
            shape: 'square',
            expression: 'happy',
        })
        this.coldBlob.setPosition(this.width - 50, this.centerY)
        this.container.addChild(this.coldBlob)
    }

    protected onVariablesChange(): void {
        const dT = this.variables['ΔT'] || 50
        const k = this.variables['k'] || 50

        // Hot blob intensity based on temperature difference
        this.hotBlob.updateOptions({
            glowIntensity: 0.3 + (dT / 200) * 0.7,
            size: 45 + (dT / 200) * 15,
        })

        // Reset cold side temperature when variables change
        this.coldTemp = 20
        this.heatParticles = []
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const k = this.variables['k'] || 50
        const A = this.variables['A'] || 25
        const dT = this.variables['ΔT'] || 50
        const L = this.variables['L'] || 10

        // Calculate heat flow rate Q = kAΔT/L
        const Q = (k * A * dT) / (L * 100)

        // Bar dimensions based on parameters
        const barLength = 80 + L * 3 // L affects bar length
        const barHeight = 20 + A * 0.4 // A affects bar height (cross-section)

        // Center the bar horizontally
        const barStartX = this.centerX - barLength / 2
        const barEndX = barStartX + barLength

        // Particle emission rate based on Q
        const emissionRate = Q * 0.008
        if (Math.random() < emissionRate) {
            // More particles with higher k
            const numParticles = Math.ceil(k / 100)
            for (let i = 0; i < numParticles; i++) {
                this.heatParticles.push({
                    x: barStartX,
                    y: this.centerY,
                    progress: 0,
                    speed: 0.008 + (k / 400) * 0.015, // k affects speed
                    yOffset: (Math.random() - 0.5) * (barHeight - 10),
                })
            }
        }

        // Update particles
        this.heatParticles.forEach((p) => {
            p.progress += p.speed * delta
            p.x = barStartX + p.progress * barLength
        })
        this.heatParticles = this.heatParticles.filter((p) => p.progress < 1)

        // Slowly increase cold side temperature (visual feedback)
        if (Q > 0) {
            this.coldTemp = Math.min(this.coldTemp + Q * 0.0001 * delta, 20 + dT * 0.3)
        }

        // Update cold blob color based on received heat
        const coldHeatRatio = (this.coldTemp - 20) / (dT * 0.3 + 1)
        const coldR = Math.floor(52 + coldHeatRatio * 100)
        const coldG = Math.floor(152 - coldHeatRatio * 50)
        const coldB = Math.floor(219 - coldHeatRatio * 100)
        const coldColor = (coldR << 16) | (coldG << 8) | coldB

        this.coldBlob.updateOptions({
            color: coldColor,
            expression: coldHeatRatio > 0.3 ? 'surprised' : 'happy',
        })

        // Animate blobs
        this.hotBlob.updateOptions({
            wobblePhase: this.time * 4,
            scaleX: 1 + Math.sin(this.time * 6) * 0.05,
        })

        this.coldBlob.updateOptions({
            wobblePhase: this.time * 2,
        })

        // Position blobs based on bar
        this.hotBlob.setPosition(barStartX - 35, this.centerY)
        this.coldBlob.setPosition(barEndX + 35, this.centerY)

        this.drawBar(barStartX, barLength, barHeight, k)
        this.drawParticles(barStartX, barLength, barHeight)
        this.drawUI(Q, k, A, dT, L, barStartX, barEndX, barHeight)
    }

    private drawBar(barStartX: number, barLength: number, barHeight: number, k: number): void {
        const g = this.barGraphics
        g.clear()

        const barY = this.centerY - barHeight / 2

        // Material color based on k (thermal conductivity)
        // Low k = darker (insulator), High k = lighter/metallic (conductor)
        const kNormalized = Math.min(k / 400, 1)

        // Draw conducting bar with gradient
        const segments = 25
        for (let i = 0; i < segments; i++) {
            const t = i / (segments - 1)
            const x = barStartX + t * barLength
            const segWidth = barLength / segments + 1

            // Temperature gradient from hot (red) to cold (blue)
            const r = Math.floor(231 * (1 - t) + 80 * t)
            const gb = Math.floor(76 * (1 - t) + 140 * t)
            const b = Math.floor(76 * (1 - t) + 200 * t)
            const color = (r << 16) | (gb << 8) | b

            // Material shine based on k
            const alpha = 0.6 + kNormalized * 0.3

            g.rect(x, barY, segWidth, barHeight)
            g.fill({ color, alpha })
        }

        // Metallic shine for high k materials
        if (kNormalized > 0.3) {
            const shineAlpha = (kNormalized - 0.3) * 0.4
            g.rect(barStartX, barY + 2, barLength, barHeight * 0.3)
            g.fill({ color: 0xffffff, alpha: shineAlpha })
        }

        // Bar outline
        g.roundRect(barStartX, barY, barLength, barHeight, 4)
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.4 })

        // Material indicator (k value visualization)
        // Show conductivity as pattern density
        if (k > 100) {
            // Good conductor - parallel lines
            const lineCount = Math.floor(k / 80)
            for (let i = 0; i < lineCount; i++) {
                const lx = barStartX + 10 + (i * (barLength - 20)) / lineCount
                g.moveTo(lx, barY + 5)
                g.lineTo(lx, barY + barHeight - 5)
                g.stroke({ color: 0xffffff, width: 1, alpha: 0.15 })
            }
        }
    }

    private drawParticles(barStartX: number, barLength: number, barHeight: number): void {
        const pg = this.particleGraphics
        pg.clear()

        this.heatParticles.forEach((p) => {
            const alpha = 1 - Math.pow(Math.abs(p.progress - 0.5) * 2, 2)

            // Color changes as particle travels
            const t = p.progress
            const r = Math.floor(255 * (1 - t) + 100 * t)
            const g = Math.floor(100 * (1 - t) + 150 * t)
            const b = Math.floor(50 * (1 - t) + 220 * t)
            const color = (r << 16) | (g << 8) | b

            // Particle with glow
            pg.circle(p.x, this.centerY + p.yOffset, 4)
            pg.fill({ color, alpha: alpha * 0.9 })

            // Glow effect
            pg.circle(p.x, this.centerY + p.yOffset, 7)
            pg.fill({ color, alpha: alpha * 0.3 })

            // Trail
            if (p.progress > 0.05) {
                pg.moveTo(p.x - 15, this.centerY + p.yOffset)
                pg.lineTo(p.x - 3, this.centerY + p.yOffset)
                pg.stroke({ color, width: 2, alpha: alpha * 0.4 })
            }
        })
    }

    private drawUI(
        Q: number,
        k: number,
        A: number,
        dT: number,
        L: number,
        barStartX: number,
        barEndX: number,
        barHeight: number
    ): void {
        const g = this.uiGraphics
        g.clear()

        // Heat flow meter (Q) at bottom
        const meterWidth = 120
        const meterHeight = 14
        const meterX = this.centerX - meterWidth / 2
        const meterY = this.height - 40

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.fill({ color: 0x222222, alpha: 0.7 })

        // Q fill (logarithmic scale)
        const maxQ = 5000
        const qRatio = Math.min(Math.log10(Q + 1) / Math.log10(maxQ), 1)
        const fillWidth = qRatio * meterWidth

        // Color based on Q value
        const qColor = Q > 1000 ? 0xe74c3c : Q > 300 ? 0xf39c12 : 0x3498db
        g.roundRect(meterX, meterY, fillWidth, meterHeight, 5)
        g.fill({ color: qColor, alpha: 0.8 })

        // Q indicator arrow
        g.moveTo(meterX + fillWidth, meterY - 6)
        g.lineTo(meterX + fillWidth - 5, meterY - 12)
        g.lineTo(meterX + fillWidth + 5, meterY - 12)
        g.closePath()
        g.fill({ color: 0xffffff, alpha: 0.8 })

        // Temperature indicators
        // Hot side temp
        const hotTemp = 20 + dT
        this.drawTempIndicator(g, barStartX - 35, this.centerY - 50, hotTemp, 0xe74c3c)

        // Cold side temp (animated)
        this.drawTempIndicator(
            g,
            barEndX + 35,
            this.centerY - 50,
            Math.round(this.coldTemp),
            0x3498db
        )

        // Length indicator (L)
        const arrowY = this.centerY + barHeight / 2 + 20
        g.moveTo(barStartX, arrowY)
        g.lineTo(barEndX, arrowY)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })

        // Arrow ends
        g.moveTo(barStartX, arrowY - 5)
        g.lineTo(barStartX, arrowY + 5)
        g.moveTo(barEndX, arrowY - 5)
        g.lineTo(barEndX, arrowY + 5)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })

        // Area indicator (A) - show as bar thickness indicator
        const areaY = this.centerY - barHeight / 2 - 15
        g.moveTo(barStartX + 20, areaY)
        g.lineTo(barStartX + 20, areaY - 10 - A * 0.2)
        g.stroke({ color: 0x9b59b6, width: 2, alpha: 0.5 })

        // Conductivity indicator (k)
        const kX = barStartX + barEndX
        const kBarWidth = 8
        const kBarHeight = 60
        const kY = this.centerY - kBarHeight / 2

        // k meter on the side
        g.roundRect(this.width - 30, kY, kBarWidth, kBarHeight, 3)
        g.fill({ color: 0x222222, alpha: 0.5 })

        const kRatio = Math.min(k / 400, 1)
        const kFillHeight = kRatio * kBarHeight
        g.roundRect(this.width - 30, kY + kBarHeight - kFillHeight, kBarWidth, kFillHeight, 3)
        g.fill({ color: 0x2ecc71, alpha: 0.7 })
    }

    private drawTempIndicator(
        g: Graphics,
        x: number,
        y: number,
        temp: number,
        color: number
    ): void {
        // Temperature bubble
        g.circle(x, y, 16)
        g.fill({ color, alpha: 0.3 })
        g.circle(x, y, 16)
        g.stroke({ color, width: 2, alpha: 0.6 })

        // Degree symbol representation
        g.circle(x + 12, y - 8, 3)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })
    }
}
