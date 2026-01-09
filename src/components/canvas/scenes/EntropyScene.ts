import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface ParticleBlob {
    blob: Blob
    x: number
    y: number
    vx: number
    vy: number
    temperature: number // 0 = cold (blue), 1 = hot (red)
}

interface HeatParticle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
}

export class EntropyScene extends BaseScene {
    declare private containerGraphics: Graphics
    declare private heatGraphics: Graphics
    declare private particleBlobs: ParticleBlob[]
    declare private heatParticles: HeatParticle[]
    declare private time: number
    declare private dividerOpen: number // 0 = closed, 1 = fully open

    protected setup(): void {
        this.time = 0
        this.particleBlobs = []
        this.heatParticles = []
        this.dividerOpen = 0

        this.containerGraphics = new Graphics()
        this.container.addChild(this.containerGraphics)

        this.heatGraphics = new Graphics()
        this.container.addChild(this.heatGraphics)

        // Initialize hot particle blobs (left side) - start hot (red)
        for (let i = 0; i < 6; i++) {
            const blob = new Blob({
                size: 18,
                color: 0xe74c3c,
                shape: 'circle',
                expression: 'hot',
            })
            const x = this.centerX - 60 + (Math.random() - 0.5) * 50
            const y = this.centerY + (Math.random() - 0.5) * 80
            blob.setPosition(x, y)
            this.container.addChild(blob)
            this.particleBlobs.push({
                blob,
                x,
                y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                temperature: 1, // Hot
            })
        }

        // Initialize cold particle blobs (right side) - start cold (blue)
        for (let i = 0; i < 6; i++) {
            const blob = new Blob({
                size: 18,
                color: 0x3498db,
                shape: 'circle',
                expression: 'sleepy',
            })
            const x = this.centerX + 60 + (Math.random() - 0.5) * 50
            const y = this.centerY + (Math.random() - 0.5) * 80
            blob.setPosition(x, y)
            this.container.addChild(blob)
            this.particleBlobs.push({
                blob,
                x,
                y,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                temperature: 0, // Cold
            })
        }
    }

    protected onVariablesChange(): void {
        const Q = this.variables['Q'] || 600
        const T = this.variables['T'] || 300
        const dS = Q / T

        // Entropy determines how open the divider is (dS range ~0.33 to 8)
        // Higher entropy = more mixing = divider more open
        this.dividerOpen = Math.min(dS / 4, 1)

        // T affects overall system temperature (T range 150-600)
        const tNormalized = (T - 150) / 450 // 0 to 1

        // Reset particle temperatures based on T
        // Left side particles are hotter, right side are colder, but overall based on T
        this.particleBlobs.forEach((p, i) => {
            if (i < 6) {
                // Left side (relatively hotter)
                p.temperature = Math.min(1, tNormalized + 0.3)
            } else {
                // Right side (relatively colder)
                p.temperature = Math.max(0, tNormalized - 0.3)
            }
        })
    }

    private temperatureToColor(temp: number): number {
        // temp: 0 (cold/blue) to 1 (hot/red)
        const r = Math.floor(temp * 231 + (1 - temp) * 52)
        const g = Math.floor(temp * 76 + (1 - temp) * 152)
        const b = Math.floor(temp * 60 + (1 - temp) * 219)
        return (r << 16) | (g << 8) | b
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const Q = this.variables['Q'] || 600
        const T = this.variables['T'] || 300
        const dS = Q / T

        // Container boundaries
        const containerLeft = this.centerX - 110
        const containerRight = this.centerX + 110
        const containerTop = this.centerY - 70
        const containerBottom = this.centerY + 70
        const dividerX = this.centerX

        // Calculate divider gap (entropy determines opening) - more dramatic range
        const maxGap = 100
        const gapSize = this.dividerOpen * maxGap
        const gapTop = this.centerY - gapSize / 2
        const gapBottom = this.centerY + gapSize / 2

        // Q affects heat transfer rate (Q range 200-1200)
        const qNormalized = (Q - 200) / 1000
        const heatTransferRate = 0.001 + qNormalized * 0.008

        // Heat transfer between particles when divider is open
        if (this.dividerOpen > 0.1) {
            this.particleBlobs.forEach((p1, i) => {
                this.particleBlobs.forEach((p2, j) => {
                    if (i >= j) return
                    const dx = p1.x - p2.x
                    const dy = p1.y - p2.y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    // Heat transfers when particles are close
                    if (dist < 50) {
                        const transfer =
                            heatTransferRate * (p1.temperature - p2.temperature) * delta
                        p1.temperature -= transfer
                        p2.temperature += transfer
                        // Clamp temperatures
                        p1.temperature = Math.max(0, Math.min(1, p1.temperature))
                        p2.temperature = Math.max(0, Math.min(1, p2.temperature))
                    }
                })
            })
        }

        // Update particle blobs
        this.particleBlobs.forEach((p, i) => {
            // Speed based on individual particle temperature
            const speed = 0.5 + p.temperature * 1.5
            p.x += p.vx * delta * speed
            p.y += p.vy * delta * speed

            // Bounce off outer walls
            if (p.x < containerLeft + 12) {
                p.x = containerLeft + 12
                p.vx = Math.abs(p.vx)
            }
            if (p.x > containerRight - 12) {
                p.x = containerRight - 12
                p.vx = -Math.abs(p.vx)
            }
            if (p.y < containerTop + 12) {
                p.y = containerTop + 12
                p.vy = Math.abs(p.vy)
            }
            if (p.y > containerBottom - 12) {
                p.y = containerBottom - 12
                p.vy = -Math.abs(p.vy)
            }

            // Divider collision (with gap)
            if (gapSize < 5) {
                // Divider closed
                if (p.x < dividerX && p.x > dividerX - 15 && p.vx > 0) {
                    p.x = dividerX - 15
                    p.vx = -Math.abs(p.vx)
                }
                if (p.x > dividerX && p.x < dividerX + 15 && p.vx < 0) {
                    p.x = dividerX + 15
                    p.vx = Math.abs(p.vx)
                }
            } else {
                // Divider has gap - only block if outside gap
                const inGap = p.y > gapTop && p.y < gapBottom
                if (!inGap) {
                    if (p.x < dividerX && p.x > dividerX - 15 && p.vx > 0) {
                        p.x = dividerX - 15
                        p.vx = -Math.abs(p.vx)
                    }
                    if (p.x > dividerX && p.x < dividerX + 15 && p.vx < 0) {
                        p.x = dividerX + 15
                        p.vx = Math.abs(p.vx)
                    }
                }
            }

            // Random velocity changes
            if (Math.random() < 0.01) {
                p.vx += (Math.random() - 0.5) * 0.5
                p.vy += (Math.random() - 0.5) * 0.5
            }

            // Update blob position, color, and animation based on temperature
            p.blob.setPosition(p.x, p.y)
            const color = this.temperatureToColor(p.temperature)
            const expression =
                p.temperature > 0.7 ? 'hot' : p.temperature > 0.4 ? 'happy' : 'sleepy'
            p.blob.updateOptions({
                color,
                expression,
                size: 16 + p.temperature * 6,
                wobblePhase: this.time * (2 + p.temperature * 3) + i,
            })
        })

        // Generate heat flow particles based on Q (Q range 200-1200)
        // Heat flows from hot (left) to cold (right)
        const heatFlowRate = 0.02 + qNormalized * 0.15 // More Q = more heat particles
        if (Math.random() < heatFlowRate && this.dividerOpen > 0.1) {
            const startX = this.centerX - 80
            const startY = this.centerY + (Math.random() - 0.5) * 60
            this.heatParticles.push({
                x: startX,
                y: startY,
                vx: 1.5 + qNormalized * 2, // Speed based on Q
                vy: (Math.random() - 0.5) * 0.5,
                life: 1,
            })
        }

        // Update heat particles
        this.heatParticles.forEach((hp) => {
            hp.x += hp.vx * delta
            hp.y += hp.vy * delta
            hp.life -= 0.015
        })
        this.heatParticles = this.heatParticles.filter(
            (hp) => hp.life > 0 && hp.x < this.centerX + 100
        )

        this.drawContainer(gapTop, gapBottom)
        this.drawHeatFlow()
        this.drawThermometer(T)
        this.drawEntropyMeter(dS)
    }

    private drawContainer(gapTop: number, gapBottom: number): void {
        const g = this.containerGraphics
        g.clear()

        const containerLeft = this.centerX - 110
        const containerRight = this.centerX + 110
        const containerTop = this.centerY - 70
        const containerBottom = this.centerY + 70
        const dividerX = this.centerX

        // Container outline
        g.roundRect(containerLeft, containerTop, 220, 140, 8)
        g.stroke({ color: 0xffffff, width: 3, alpha: 0.5 })

        // Divider (with gap)
        // Top part of divider
        if (gapTop > containerTop) {
            g.rect(dividerX - 3, containerTop, 6, gapTop - containerTop)
            g.fill({ color: 0x95a5a6, alpha: 0.9 })
        }
        // Bottom part of divider
        if (gapBottom < containerBottom) {
            g.rect(dividerX - 3, gapBottom, 6, containerBottom - gapBottom)
            g.fill({ color: 0x95a5a6, alpha: 0.9 })
        }
    }

    private drawHeatFlow(): void {
        const g = this.heatGraphics
        g.clear()

        // Draw heat particles flowing from hot to cold
        this.heatParticles.forEach((hp) => {
            const size = 4 + hp.life * 3
            const alpha = hp.life * 0.8

            // Orange-yellow gradient based on life
            const r = 255
            const green = Math.floor(150 + hp.life * 100)
            const b = Math.floor(50 * hp.life)
            const color = (r << 16) | (green << 8) | b

            // Main particle
            g.circle(hp.x, hp.y, size)
            g.fill({ color, alpha })

            // Glow effect
            g.circle(hp.x, hp.y, size * 1.5)
            g.fill({ color, alpha: alpha * 0.3 })

            // Trail
            g.moveTo(hp.x - hp.vx * 3, hp.y)
            g.lineTo(hp.x, hp.y)
            g.stroke({ color, width: size * 0.6, alpha: alpha * 0.5 })
        })
    }

    private drawThermometer(T: number): void {
        const g = this.containerGraphics

        // Thermometer position (left side of container)
        const thermoX = this.centerX - 140
        const thermoHeight = 120
        const thermoY = this.centerY - thermoHeight / 2
        const thermoWidth = 16

        // Background (glass tube)
        g.roundRect(thermoX, thermoY, thermoWidth, thermoHeight, 8)
        g.fill({ color: 0x222233, alpha: 0.8 })

        // Temperature fill (T range 150-600)
        const tNormalized = (T - 150) / 450 // 0 to 1
        const fillHeight = tNormalized * (thermoHeight - 10)

        // Color gradient: blue (cold) -> red (hot)
        const r = Math.floor(tNormalized * 231 + (1 - tNormalized) * 52)
        const green = Math.floor(tNormalized * 76 + (1 - tNormalized) * 152)
        const b = Math.floor(tNormalized * 60 + (1 - tNormalized) * 219)
        const fillColor = (r << 16) | (green << 8) | b

        g.roundRect(
            thermoX + 2,
            thermoY + thermoHeight - fillHeight - 5,
            thermoWidth - 4,
            fillHeight,
            6
        )
        g.fill({ color: fillColor, alpha: 0.9 })

        // Bulb at bottom
        g.circle(thermoX + thermoWidth / 2, thermoY + thermoHeight + 8, 12)
        g.fill({ color: fillColor, alpha: 0.9 })

        // Scale marks
        for (let i = 0; i <= 4; i++) {
            const markY = thermoY + 5 + (i / 4) * (thermoHeight - 10)
            g.moveTo(thermoX - 4, markY)
            g.lineTo(thermoX, markY)
            g.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })
        }

        // Glass highlight
        g.roundRect(thermoX + 2, thermoY + 2, 4, thermoHeight - 4, 4)
        g.fill({ color: 0xffffff, alpha: 0.15 })
    }

    private drawEntropyMeter(dS: number): void {
        const g = this.containerGraphics

        // Entropy meter (bottom)
        const meterX = this.centerX - 50
        const meterY = this.height - 30
        const meterWidth = 100
        const meterHeight = 12

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 4)
        g.fill({ color: 0x333333, alpha: 0.6 })

        // Fill based on entropy
        const fillWidth = Math.min(dS / 4, 1) * meterWidth
        // Gradient from order (purple) to disorder (yellow)
        const t = Math.min(dS / 4, 1)
        const r = Math.floor(155 + t * 100)
        const g_val = Math.floor(89 + t * 166)
        const b = Math.floor(182 - t * 150)
        const fillColor = (r << 16) | (g_val << 8) | b

        g.roundRect(meterX, meterY, fillWidth, meterHeight, 4)
        g.fill({ color: fillColor, alpha: 0.8 })

        // Arrow showing mixing direction
        if (this.dividerOpen > 0.3) {
            const arrowY = this.centerY
            // Left to right arrow
            g.moveTo(this.centerX - 30, arrowY - 40)
            g.lineTo(this.centerX + 10, arrowY - 40)
            g.stroke({ color: 0xe74c3c, width: 2, alpha: 0.5 })
            // Right to left arrow
            g.moveTo(this.centerX + 30, arrowY + 40)
            g.lineTo(this.centerX - 10, arrowY + 40)
            g.stroke({ color: 0x3498db, width: 2, alpha: 0.5 })
        }
    }
}
