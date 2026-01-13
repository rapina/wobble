import { Ticker, Graphics, Text, TextStyle } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Wobble, WobbleExpression } from '../Wobble'
import { pixiColors } from '../../../utils/pixiHelpers'

interface Particle {
    x: number
    y: number
    vx: number
    state: 'approaching' | 'tunneling' | 'transmitted' | 'reflected'
    willTransmit: boolean
    tunnelingProgress: number
    flash: number
}

export class TunnelingScene extends BaseScene {
    declare private barrierGraphics: Graphics
    declare private waveGraphics: Graphics
    declare private particleGraphics: Graphics
    declare private indicatorGraphics: Graphics
    declare private particles: Particle[]
    declare private time: number
    declare private spawnTimer: number
    declare private statusLabel: Text
    declare private transmittedCount: number
    declare private totalCount: number

    protected setup(): void {
        this.time = 0
        this.spawnTimer = 0
        this.particles = []
        this.transmittedCount = 0
        this.totalCount = 0

        // Graphics layers
        this.waveGraphics = new Graphics()
        this.container.addChild(this.waveGraphics)

        this.barrierGraphics = new Graphics()
        this.container.addChild(this.barrierGraphics)

        this.particleGraphics = new Graphics()
        this.container.addChild(this.particleGraphics)

        this.indicatorGraphics = new Graphics()
        this.container.addChild(this.indicatorGraphics)

        // Status label
        const labelStyle = new TextStyle({
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 13,
            fontWeight: 'bold',
            fill: 0xffffff,
        })
        this.statusLabel = new Text({ text: '투과율: 0%', style: labelStyle })
        this.statusLabel.position.set(15, 15)
        this.container.addChild(this.statusLabel)

        // Initialize some particles
        for (let i = 0; i < 3; i++) {
            this.spawnParticle(i * -60)
        }
    }

    protected onVariablesChange(): void {
        // Reset counts when variables change significantly
        this.transmittedCount = 0
        this.totalCount = 0
    }

    private spawnParticle(offsetX: number = 0): void {
        const T = this.variables['T'] || 23.5
        const willTransmit = Math.random() * 100 < T

        this.particles.push({
            x: -30 + offsetX,
            y: this.centerY + (Math.random() - 0.5) * 20,
            vx: 1.5 + Math.random() * 0.5,
            state: 'approaching',
            willTransmit,
            tunnelingProgress: 0,
            flash: 0,
        })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const E = this.variables['E'] || 8 // Particle energy
        const V = this.variables['V'] || 10 // Barrier height
        const L = this.variables['L'] || 0.1 // Barrier width
        const T = this.variables['T'] || 23.5 // Transmission probability

        // Barrier dimensions (scale L for visual representation)
        const barrierWidth = 30 + L * 150 // L: 0.05-0.4 → 37.5-90
        const barrierHeight = 30 + V * 6
        const barrierX = this.centerX - barrierWidth / 2
        const barrierCenterY = this.centerY

        // Spawn new particles
        this.spawnTimer += delta
        if (this.spawnTimer > 60 && this.particles.length < 8) {
            this.spawnParticle()
            this.spawnTimer = 0
        }

        // Update particles
        this.updateParticles(delta, barrierX, barrierWidth, barrierCenterY, E, V)

        // Draw everything
        this.drawWaveFunction(barrierX, barrierWidth, barrierCenterY, E, V, L)
        this.drawBarrier(barrierX, barrierWidth, barrierHeight, barrierCenterY, V, E)
        this.drawParticles(barrierX, barrierWidth, E)
        this.drawIndicators(T, barrierX, barrierWidth, barrierHeight, barrierCenterY)
        this.updateStatusLabel(T)
    }

    private updateParticles(delta: number, barrierX: number, barrierWidth: number, barrierY: number, E: number, V: number): void {
        const barrierEndX = barrierX + barrierWidth

        this.particles.forEach((p) => {
            p.flash *= 0.9

            switch (p.state) {
                case 'approaching':
                    p.x += p.vx * delta
                    if (p.x >= barrierX - 15) {
                        p.state = 'tunneling'
                        p.flash = 1
                        this.totalCount++
                    }
                    break

                case 'tunneling':
                    p.tunnelingProgress += delta * 0.03
                    if (p.willTransmit) {
                        // Slowly move through barrier
                        p.x += p.vx * delta * 0.3
                        if (p.x >= barrierEndX + 10) {
                            p.state = 'transmitted'
                            p.flash = 1
                            this.transmittedCount++
                        }
                    } else {
                        // Bounce back
                        if (p.tunnelingProgress > 0.5) {
                            p.state = 'reflected'
                            p.vx = -Math.abs(p.vx) * 0.8
                            p.flash = 1
                        }
                    }
                    break

                case 'transmitted':
                    p.x += p.vx * delta * 1.2
                    break

                case 'reflected':
                    p.x += p.vx * delta
                    break
            }
        })

        // Remove off-screen particles
        this.particles = this.particles.filter((p) =>
            p.x > -100 && p.x < this.width + 50
        )
    }

    private drawWaveFunction(barrierX: number, barrierWidth: number, barrierY: number, E: number, V: number, L: number): void {
        const g = this.waveGraphics
        g.clear()

        const barrierEndX = barrierX + barrierWidth
        const amplitude = 25
        const wavelength = 40 + (10 - E) * 3

        // Incoming wave (left of barrier)
        g.moveTo(0, barrierY)
        for (let x = 0; x < barrierX; x += 2) {
            const phase = (x / wavelength) * Math.PI * 2 - this.time * 3
            const y = barrierY + Math.sin(phase) * amplitude
            g.lineTo(x, y)
        }
        g.stroke({ color: pixiColors.wavelength, width: 2.5, alpha: 0.7 })

        // Exponential decay inside barrier (only if E < V)
        if (E < V) {
            const kappa = 5.12 * Math.sqrt(V - E)
            const decay = Math.exp(-kappa * L)

            g.moveTo(barrierX, barrierY)
            for (let x = barrierX; x <= barrierEndX; x += 2) {
                const progress = (x - barrierX) / barrierWidth
                const envelope = Math.exp(-kappa * L * progress)
                const phase = (x / wavelength) * Math.PI * 2 - this.time * 3
                const y = barrierY + Math.sin(phase) * amplitude * envelope
                g.lineTo(x, y)
            }
            g.stroke({ color: pixiColors.wavelength, width: 2, alpha: 0.5 })

            // Transmitted wave (right of barrier, reduced amplitude)
            const transmittedAmplitude = amplitude * decay
            if (transmittedAmplitude > 1) {
                g.moveTo(barrierEndX, barrierY)
                for (let x = barrierEndX; x <= this.width; x += 2) {
                    const phase = (x / wavelength) * Math.PI * 2 - this.time * 3
                    const y = barrierY + Math.sin(phase) * transmittedAmplitude
                    g.lineTo(x, y)
                }
                g.stroke({ color: 0x58d68d, width: 2, alpha: 0.6 })
            }
        } else {
            // Classical transmission (E >= V) - wave continues through
            g.moveTo(barrierX, barrierY)
            for (let x = barrierX; x <= this.width; x += 2) {
                const phase = (x / wavelength) * Math.PI * 2 - this.time * 3
                const y = barrierY + Math.sin(phase) * amplitude
                g.lineTo(x, y)
            }
            g.stroke({ color: 0x58d68d, width: 2.5, alpha: 0.7 })
        }

        // Center line
        g.moveTo(0, barrierY)
        g.lineTo(this.width, barrierY)
        g.stroke({ color: 0x444466, width: 1, alpha: 0.3 })
    }

    private drawBarrier(barrierX: number, barrierWidth: number, barrierHeight: number, barrierY: number, V: number, E: number): void {
        const g = this.barrierGraphics
        g.clear()

        const topY = barrierY - barrierHeight / 2

        // Barrier glow (more intense when E < V)
        if (E < V) {
            for (let i = 3; i >= 0; i--) {
                g.roundRect(
                    barrierX - i * 3,
                    topY - i * 3,
                    barrierWidth + i * 6,
                    barrierHeight + i * 6,
                    8
                )
                g.fill({ color: 0xff6b6b, alpha: 0.05 * (4 - i) })
            }
        }

        // Main barrier (semi-transparent to show wave decay)
        g.roundRect(barrierX, topY, barrierWidth, barrierHeight, 6)
        g.fill({ color: 0x2d1f3d, alpha: 0.7 })
        g.stroke({ color: E < V ? 0xff6b6b : 0x58d68d, width: 2 })

        // Barrier gradient effect
        for (let i = 0; i < 5; i++) {
            const alpha = 0.08 - i * 0.015
            g.roundRect(
                barrierX + i * 3,
                topY,
                barrierWidth - i * 6,
                barrierHeight,
                6
            )
            g.fill({ color: 0x9b59b6, alpha })
        }

        // Energy level indicators on barrier
        const energyY = barrierY - barrierHeight / 2 + (1 - E / V) * barrierHeight
        if (E < V) {
            // E level line
            g.moveTo(barrierX - 20, energyY)
            g.lineTo(barrierX + barrierWidth + 20, energyY)
            g.stroke({ color: pixiColors.energy, width: 2, alpha: 0.6 })
        }

        // V = barrier height indicator
        const labelY = topY - 15
        g.circle(barrierX + barrierWidth / 2, labelY, 12)
        g.fill({ color: 0xff6b6b, alpha: 0.4 })
    }

    private drawParticles(barrierX: number, barrierWidth: number, E: number): void {
        const g = this.particleGraphics
        g.clear()

        const barrierEndX = barrierX + barrierWidth

        this.particles.forEach((p) => {
            const size = 12 + E * 0.5
            let color: number = pixiColors.wavelength
            let alpha = 0.9

            // State-based appearance
            switch (p.state) {
                case 'approaching':
                    color = pixiColors.wavelength
                    break
                case 'tunneling':
                    // Particle becomes ghostly while tunneling
                    alpha = 0.5 + Math.sin(this.time * 10) * 0.2
                    color = p.willTransmit ? 0x58d68d : 0xff6b6b
                    break
                case 'transmitted':
                    color = 0x58d68d
                    break
                case 'reflected':
                    color = 0xff6b6b
                    alpha = 0.7
                    break
            }

            // Flash effect
            if (p.flash > 0.1) {
                g.circle(p.x, p.y, size * 2 * p.flash)
                g.fill({ color, alpha: p.flash * 0.3 })
            }

            // Trail
            if (p.state === 'transmitted') {
                g.moveTo(p.x, p.y)
                g.lineTo(p.x - 20, p.y)
                g.stroke({ color, width: size * 0.5, alpha: 0.3 })
            }

            // Particle body (diamond shape for Gem)
            const s = size * 0.7
            g.moveTo(p.x, p.y - s)
            g.lineTo(p.x + s * 0.7, p.y)
            g.lineTo(p.x, p.y + s)
            g.lineTo(p.x - s * 0.7, p.y)
            g.closePath()
            g.fill({ color, alpha })

            // Inner highlight
            g.circle(p.x, p.y, size * 0.3)
            g.fill({ color: 0xffffff, alpha: alpha * 0.6 })

            // Tunneling effect: show decay while inside barrier
            if (p.state === 'tunneling' && p.x > barrierX && p.x < barrierEndX) {
                const progress = (p.x - barrierX) / barrierWidth
                const decayAlpha = Math.exp(-progress * 2) * 0.5
                g.circle(p.x, p.y, size * 1.5)
                g.fill({ color: 0x9b59b6, alpha: decayAlpha })
            }
        })
    }

    private drawIndicators(T: number, barrierX: number, barrierWidth: number, barrierHeight: number, barrierY: number): void {
        const g = this.indicatorGraphics
        g.clear()

        // Transmission probability bar at bottom
        const barY = this.height - 40
        const barWidth = 150
        const barHeight = 12
        const barX = this.centerX - barWidth / 2

        // Background
        g.roundRect(barX, barY, barWidth, barHeight, 4)
        g.fill({ color: 0x222233, alpha: 0.7 })

        // Fill based on T
        const fillWidth = (T / 100) * barWidth
        g.roundRect(barX, barY, fillWidth, barHeight, 4)
        g.fill({ color: T > 50 ? 0x58d68d : T > 20 ? 0xf39c12 : 0xff6b6b, alpha: 0.8 })

        // Border
        g.roundRect(barX, barY, barWidth, barHeight, 4)
        g.stroke({ color: 0x666688, width: 1 })

        // Transmitted/Reflected counters
        const counterY = barY - 25

        // Transmitted (green)
        g.circle(barX + 20, counterY, 8)
        g.fill({ color: 0x58d68d, alpha: 0.6 })

        // Reflected (red)
        g.circle(barX + barWidth - 20, counterY, 8)
        g.fill({ color: 0xff6b6b, alpha: 0.6 })

        // Arrow labels
        const arrowY = barrierY + barrierHeight / 2 + 30

        // Left arrow (incoming)
        g.moveTo(30, arrowY)
        g.lineTo(barrierX - 20, arrowY)
        g.stroke({ color: pixiColors.wavelength, width: 2, alpha: 0.5 })
        g.moveTo(barrierX - 20, arrowY)
        g.lineTo(barrierX - 30, arrowY - 5)
        g.moveTo(barrierX - 20, arrowY)
        g.lineTo(barrierX - 30, arrowY + 5)
        g.stroke({ color: pixiColors.wavelength, width: 2, alpha: 0.5 })

        // Right arrow (transmitted)
        g.moveTo(barrierX + barrierWidth + 20, arrowY)
        g.lineTo(this.width - 30, arrowY)
        g.stroke({ color: 0x58d68d, width: 2, alpha: 0.5 })
        g.moveTo(this.width - 30, arrowY)
        g.lineTo(this.width - 40, arrowY - 5)
        g.moveTo(this.width - 30, arrowY)
        g.lineTo(this.width - 40, arrowY + 5)
        g.stroke({ color: 0x58d68d, width: 2, alpha: 0.5 })
    }

    private updateStatusLabel(T: number): void {
        const ratio = this.totalCount > 0
            ? Math.round((this.transmittedCount / this.totalCount) * 100)
            : 0
        this.statusLabel.text = `투과: ${this.transmittedCount}/${this.totalCount} (이론: ${T.toFixed(0)}%)`
        this.statusLabel.style.fill = T > 50 ? 0x58d68d : T > 20 ? 0xf39c12 : 0xff6b6b
    }
}
