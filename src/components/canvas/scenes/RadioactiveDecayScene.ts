import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    alive: boolean
    decayTime: number
    alpha: number
    size: number
}

interface DecayFlash {
    x: number
    y: number
    radius: number
    alpha: number
}

export class RadioactiveDecayScene extends BaseScene {
    declare private graphics: Graphics
    declare private nucleusBlob: Blob
    declare private particles: Particle[]
    declare private decayFlashes: DecayFlash[]
    declare private time: number
    declare private lastN: number

    protected setup(): void {
        this.time = 0
        this.particles = []
        this.decayFlashes = []
        this.lastN = 0

        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        // Central nucleus blob
        this.nucleusBlob = new Blob({
            size: 60,
            color: 0x9b59b6,
            shape: 'circle',
            expression: 'happy',
        })
        this.nucleusBlob.setPosition(this.centerX, this.centerY - 30)
        this.container.addChild(this.nucleusBlob)

        // Initialize particles
        this.initializeParticles(500)
    }

    private initializeParticles(count: number): void {
        this.particles = []
        const radius = 80
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const r = Math.random() * radius
            this.particles.push({
                x: this.centerX + Math.cos(angle) * r,
                y: this.centerY - 30 + Math.sin(angle) * r,
                vx: 0,
                vy: 0,
                alive: true,
                decayTime: Math.random() * 100, // Random decay time
                alpha: 1,
                size: 3 + Math.random() * 3,
            })
        }
    }

    protected onVariablesChange(): void {
        const N0 = this.variables['N₀'] || 500
        const lambda = this.variables['λ'] || 0.1
        const t = this.variables['t'] || 5
        const N = Math.round(N0 * Math.exp(-lambda * t))

        // Reinitialize if N₀ changed significantly
        if (Math.abs(N0 - this.particles.length) > 50) {
            this.initializeParticles(N0)
        }

        // Update particle states based on N
        const aliveCount = this.particles.filter((p) => p.alive).length
        const targetAlive = N

        if (aliveCount > targetAlive) {
            // Need to decay some particles
            const toDecay = aliveCount - targetAlive
            let decayed = 0
            for (const particle of this.particles) {
                if (particle.alive && decayed < toDecay) {
                    particle.alive = false
                    // Set velocity for flying away
                    const angle = Math.random() * Math.PI * 2
                    const speed = 2 + Math.random() * 3
                    particle.vx = Math.cos(angle) * speed
                    particle.vy = Math.sin(angle) * speed

                    // Add decay flash
                    this.decayFlashes.push({
                        x: particle.x,
                        y: particle.y,
                        radius: 5,
                        alpha: 1,
                    })

                    decayed++
                }
            }
        }

        this.lastN = N
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const N0 = this.variables['N₀'] || 500
        const lambda = this.variables['λ'] || 0.1
        const t = this.variables['t'] || 5
        const N = Math.round(N0 * Math.exp(-lambda * t))

        // Decay ratio for visual effects
        const decayRatio = N / N0

        // Update nucleus blob
        const blobSize = 30 + decayRatio * 50
        const expression =
            decayRatio > 0.7 ? 'happy' : decayRatio > 0.3 ? 'neutral' : 'worried'

        this.nucleusBlob.setPosition(this.centerX, this.centerY - 30)
        this.nucleusBlob.updateOptions({
            size: blobSize,
            wobblePhase: this.time * 2,
            expression,
            color: this.lerpColor(0x7f8c8d, 0x9b59b6, decayRatio),
        })

        // Update particles
        this.particles.forEach((particle) => {
            if (!particle.alive) {
                // Flying away animation
                particle.x += particle.vx * delta
                particle.y += particle.vy * delta
                particle.alpha -= 0.02 * delta
            } else {
                // Small wobble for alive particles
                particle.x += (Math.random() - 0.5) * 0.5 * delta
                particle.y += (Math.random() - 0.5) * 0.5 * delta
            }
        })

        // Update decay flashes
        this.decayFlashes.forEach((flash) => {
            flash.radius += 2 * delta
            flash.alpha -= 0.05 * delta
        })
        this.decayFlashes = this.decayFlashes.filter((f) => f.alpha > 0)

        // Clean up fully faded particles
        this.particles = this.particles.filter(
            (p) => p.alive || p.alpha > 0
        )

        this.drawScene(N0, N, lambda, decayRatio)
    }

    private drawScene(
        N0: number,
        N: number,
        lambda: number,
        decayRatio: number
    ): void {
        const g = this.graphics
        g.clear()

        // Draw containment circle
        g.circle(this.centerX, this.centerY - 30, 90)
        g.stroke({ color: 0x9b59b6, width: 2, alpha: 0.3 })
        g.circle(this.centerX, this.centerY - 30, 95)
        g.stroke({ color: 0x9b59b6, width: 1, alpha: 0.15 })

        // Draw alive particles (inside)
        this.particles.forEach((particle) => {
            if (particle.alive) {
                g.circle(particle.x, particle.y, particle.size)
                g.fill({ color: 0xe74c3c, alpha: 0.8 })
                // Glow effect
                g.circle(particle.x, particle.y, particle.size + 2)
                g.fill({ color: 0xe74c3c, alpha: 0.2 })
            }
        })

        // Draw decaying particles (flying away)
        this.particles.forEach((particle) => {
            if (!particle.alive && particle.alpha > 0) {
                g.circle(particle.x, particle.y, particle.size)
                g.fill({ color: 0xf39c12, alpha: particle.alpha * 0.8 })
            }
        })

        // Draw decay flashes
        this.decayFlashes.forEach((flash) => {
            g.circle(flash.x, flash.y, flash.radius)
            g.fill({ color: 0xf1c40f, alpha: flash.alpha * 0.5 })
        })

        // Draw decay curve
        this.drawDecayCurve(g, lambda, decayRatio)

        // Draw count bar
        this.drawCountBar(g, N0, N, decayRatio)
    }

    private drawDecayCurve(
        g: Graphics,
        lambda: number,
        currentRatio: number
    ): void {
        const chartLeft = this.centerX - 100
        const chartRight = this.centerX + 100
        const chartTop = this.centerY + 60
        const chartBottom = this.centerY + 120

        // Background
        g.roundRect(
            chartLeft - 10,
            chartTop - 5,
            chartRight - chartLeft + 20,
            chartBottom - chartTop + 10,
            6
        )
        g.fill({ color: 0x000000, alpha: 0.2 })

        // Draw decay curve
        const points: { x: number; y: number }[] = []
        for (let i = 0; i <= 30; i++) {
            const t = i
            const ratio = Math.exp(-lambda * t)
            const x = chartLeft + (i / 30) * (chartRight - chartLeft)
            const y = chartBottom - ratio * (chartBottom - chartTop)
            points.push({ x, y })
        }

        // Fill under curve
        g.moveTo(chartLeft, chartBottom)
        points.forEach((p) => g.lineTo(p.x, p.y))
        g.lineTo(chartRight, chartBottom)
        g.closePath()
        g.fill({ color: 0x9b59b6, alpha: 0.15 })

        // Draw curve line
        g.moveTo(points[0].x, points[0].y)
        points.forEach((p) => g.lineTo(p.x, p.y))
        g.stroke({ color: 0x9b59b6, width: 2, alpha: 0.8 })

        // Current position marker
        const t = this.variables['t'] || 5
        const markerX = chartLeft + (t / 30) * (chartRight - chartLeft)
        const markerY = chartBottom - currentRatio * (chartBottom - chartTop)

        g.circle(markerX, markerY, 6)
        g.fill({ color: 0xe74c3c, alpha: 0.9 })
        g.circle(markerX, markerY, 3)
        g.fill({ color: 0xffffff, alpha: 0.8 })

        // Vertical line
        g.moveTo(markerX, markerY)
        g.lineTo(markerX, chartBottom)
        g.stroke({ color: 0xe74c3c, width: 1, alpha: 0.5 })
    }

    private drawCountBar(
        g: Graphics,
        N0: number,
        N: number,
        ratio: number
    ): void {
        const barX = this.centerX - 60
        const barY = this.height - 35
        const barWidth = 120
        const barHeight = 14

        // Background
        g.roundRect(barX, barY, barWidth, barHeight, 5)
        g.fill({ color: 0x222222, alpha: 0.7 })

        // Fill
        const fillWidth = barWidth * ratio
        if (fillWidth > 0) {
            const fillColor =
                ratio > 0.5 ? 0x9b59b6 : ratio > 0.2 ? 0xf39c12 : 0xe74c3c
            g.roundRect(barX, barY, fillWidth, barHeight, 5)
            g.fill({ color: fillColor, alpha: 0.85 })
        }

        // Border
        g.roundRect(barX, barY, barWidth, barHeight, 5)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })

        // Half-life marker
        const halfLifeX = barX + barWidth * 0.5
        g.moveTo(halfLifeX, barY)
        g.lineTo(halfLifeX, barY + barHeight)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })
    }

    private lerpColor(color1: number, color2: number, t: number): number {
        const r1 = (color1 >> 16) & 0xff
        const g1 = (color1 >> 8) & 0xff
        const b1 = color1 & 0xff
        const r2 = (color2 >> 16) & 0xff
        const g2 = (color2 >> 8) & 0xff
        const b2 = color2 & 0xff
        const r = Math.floor(r1 + (r2 - r1) * t)
        const g = Math.floor(g1 + (g2 - g1) * t)
        const b = Math.floor(b1 + (b2 - b1) * t)
        return (r << 16) | (g << 8) | b
    }
}
