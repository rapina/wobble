import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'

interface FluidParticle {
    x: number
    y: number
    baseY: number
    phase: number
    size: number
}

export class BernoulliScene extends BaseScene {
    declare private graphics: Graphics
    declare private particles: FluidParticle[]
    declare private time: number

    protected setup(): void {
        this.time = 0
        this.particles = []
        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        // Initialize fluid particles
        this.initializeParticles()
    }

    private initializeParticles(): void {
        this.particles = []
        const particleCount = 40

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: this.centerY,
                baseY: this.centerY,
                phase: Math.random() * Math.PI * 2,
                size: 4 + Math.random() * 4,
            })
        }
    }

    protected onVariablesChange(): void {
        // Variables change handled in animate
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const v1 = this.variables['v₁'] || 3
        const A1 = this.variables['A₁'] || 6
        const A2 = this.variables['A₂'] || 2
        const v2 = (A1 * v1) / A2

        // Pipe dimensions
        const pipeLeft = this.centerX - 140
        const pipeRight = this.centerX + 140
        const pipeLength = pipeRight - pipeLeft
        const narrowStart = this.centerX - 40
        const narrowEnd = this.centerX + 40

        // Update particles
        this.particles.forEach((particle) => {
            // Calculate local velocity based on position
            let localVelocity = v1
            let pipeHalfHeight = A1 * 4 // Scale area to visual height

            if (particle.x >= narrowStart && particle.x <= narrowEnd) {
                // In narrow section
                const t = (particle.x - narrowStart) / (narrowEnd - narrowStart)
                const narrowProgress = Math.sin(t * Math.PI)
                localVelocity = v1 + (v2 - v1) * narrowProgress
                pipeHalfHeight = A1 * 4 - (A1 - A2) * 4 * narrowProgress
            } else if (particle.x > narrowEnd) {
                // After narrow section, gradually return to A1 velocity
                const distAfter = particle.x - narrowEnd
                const transitionLength = 30
                if (distAfter < transitionLength) {
                    const t = distAfter / transitionLength
                    localVelocity = v2 - (v2 - v1) * t
                } else {
                    localVelocity = v1
                }
            }

            // Move particle
            particle.x += localVelocity * 0.8 * delta

            // Oscillate within pipe bounds
            particle.phase += 0.05 * delta
            const oscillation = Math.sin(particle.phase) * (pipeHalfHeight * 0.6)
            particle.baseY = this.centerY
            particle.y = particle.baseY + oscillation

            // Wrap around
            if (particle.x > pipeRight + 20) {
                particle.x = pipeLeft - 20
                particle.phase = Math.random() * Math.PI * 2
            }
        })

        this.drawScene(v1, v2, A1, A2, pipeLeft, pipeRight, narrowStart, narrowEnd)
    }

    private drawScene(
        v1: number,
        v2: number,
        A1: number,
        A2: number,
        pipeLeft: number,
        pipeRight: number,
        narrowStart: number,
        narrowEnd: number
    ): void {
        const g = this.graphics
        g.clear()

        const cy = this.centerY

        // Calculate pipe heights
        const h1 = A1 * 4
        const h2 = A2 * 4

        // Draw pipe shape (Venturi tube)
        // Top edge
        g.moveTo(pipeLeft, cy - h1)
        g.lineTo(narrowStart, cy - h1)
        g.quadraticCurveTo(this.centerX - 20, cy - h2, this.centerX, cy - h2)
        g.quadraticCurveTo(this.centerX + 20, cy - h2, narrowEnd, cy - h1)
        g.lineTo(pipeRight, cy - h1)

        // Right edge down
        g.lineTo(pipeRight, cy + h1)

        // Bottom edge (reverse)
        g.lineTo(narrowEnd, cy + h1)
        g.quadraticCurveTo(this.centerX + 20, cy + h2, this.centerX, cy + h2)
        g.quadraticCurveTo(this.centerX - 20, cy + h2, narrowStart, cy + h1)
        g.lineTo(pipeLeft, cy + h1)

        // Close and fill
        g.closePath()
        g.fill({ color: 0x3498db, alpha: 0.2 })
        g.stroke({ color: 0x3498db, width: 3, alpha: 0.7 })

        // Draw flow arrows
        this.drawFlowArrows(g, v1, v2, pipeLeft, narrowStart, narrowEnd, pipeRight, cy, h1, h2)

        // Draw particles
        this.particles.forEach((particle) => {
            // Calculate if particle is in visible area
            if (particle.x >= pipeLeft - 10 && particle.x <= pipeRight + 10) {
                // Calculate local pipe height for clipping
                let localHeight = h1
                if (particle.x >= narrowStart && particle.x <= narrowEnd) {
                    const t = (particle.x - narrowStart) / (narrowEnd - narrowStart)
                    localHeight = h1 - (h1 - h2) * Math.sin(t * Math.PI)
                }

                // Only draw if within pipe bounds
                if (Math.abs(particle.y - cy) < localHeight - 5) {
                    // Particle color based on speed (blue to red)
                    let localSpeed = v1
                    if (particle.x >= narrowStart && particle.x <= narrowEnd) {
                        const t = (particle.x - narrowStart) / (narrowEnd - narrowStart)
                        localSpeed = v1 + (v2 - v1) * Math.sin(t * Math.PI)
                    }
                    const speedRatio = Math.min(localSpeed / 20, 1)
                    const color = this.lerpColor(0x3498db, 0xe74c3c, speedRatio)

                    g.circle(particle.x, particle.y, particle.size)
                    g.fill({ color, alpha: 0.8 })
                }
            }
        })

        // Draw pressure indicators
        this.drawPressureIndicators(
            g,
            v1,
            v2,
            pipeLeft,
            narrowStart,
            narrowEnd,
            pipeRight,
            cy,
            h1,
            h2
        )

        // Draw velocity bar
        this.drawVelocityBar(g, v1, v2)
    }

    private drawFlowArrows(
        g: Graphics,
        v1: number,
        v2: number,
        pipeLeft: number,
        narrowStart: number,
        narrowEnd: number,
        pipeRight: number,
        cy: number,
        h1: number,
        h2: number
    ): void {
        // Inlet arrow
        const arrowY = cy
        g.moveTo(pipeLeft + 10, arrowY - 8)
        g.lineTo(pipeLeft + 25, arrowY)
        g.lineTo(pipeLeft + 10, arrowY + 8)
        g.fill({ color: 0x3498db, alpha: 0.8 })

        // Narrow section arrows (faster = more/longer arrows)
        const arrowCount = Math.ceil(v2 / 5)
        for (let i = 0; i < arrowCount; i++) {
            const ax = this.centerX - 20 + i * 15
            const arrowSize = 6 + (v2 / 10) * 2
            g.moveTo(ax, arrowY - arrowSize)
            g.lineTo(ax + arrowSize, arrowY)
            g.lineTo(ax, arrowY + arrowSize)
            g.fill({ color: 0xe74c3c, alpha: 0.6 })
        }

        // Outlet arrow
        g.moveTo(pipeRight - 25, arrowY - 8)
        g.lineTo(pipeRight - 10, arrowY)
        g.lineTo(pipeRight - 25, arrowY + 8)
        g.fill({ color: 0x3498db, alpha: 0.8 })
    }

    private drawPressureIndicators(
        g: Graphics,
        v1: number,
        v2: number,
        pipeLeft: number,
        narrowStart: number,
        narrowEnd: number,
        pipeRight: number,
        cy: number,
        h1: number,
        h2: number
    ): void {
        // Pressure is inversely related to velocity (Bernoulli)
        // P + ½ρv² = const, so higher v means lower P

        const p1 = 100 - v1 * 5 // Simplified pressure
        const p2 = 100 - v2 * 5

        // Left pressure bar (high pressure)
        const barWidth = 20
        const maxBarHeight = 40
        const leftBarX = pipeLeft - 35
        const leftBarHeight = (p1 / 100) * maxBarHeight

        g.roundRect(leftBarX, cy - leftBarHeight / 2, barWidth, leftBarHeight, 3)
        g.fill({ color: 0x2ecc71, alpha: 0.7 })
        g.roundRect(leftBarX, cy - leftBarHeight / 2, barWidth, leftBarHeight, 3)
        g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.9 })

        // Center pressure bar (low pressure)
        const centerBarX = this.centerX - 10
        const centerBarHeight = Math.max((p2 / 100) * maxBarHeight, 5)

        g.roundRect(centerBarX, cy - h2 - 30, barWidth, centerBarHeight, 3)
        g.fill({ color: 0xe74c3c, alpha: 0.7 })
        g.roundRect(centerBarX, cy - h2 - 30, barWidth, centerBarHeight, 3)
        g.stroke({ color: 0xe74c3c, width: 2, alpha: 0.9 })

        // Right pressure bar (returns to high)
        const rightBarX = pipeRight + 15
        g.roundRect(rightBarX, cy - leftBarHeight / 2, barWidth, leftBarHeight, 3)
        g.fill({ color: 0x2ecc71, alpha: 0.7 })
        g.roundRect(rightBarX, cy - leftBarHeight / 2, barWidth, leftBarHeight, 3)
        g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.9 })

        // Labels
        // P high
        g.circle(leftBarX + barWidth / 2, cy + maxBarHeight / 2 + 15, 4)
        g.fill({ color: 0x2ecc71, alpha: 0.8 })

        // P low
        g.circle(centerBarX + barWidth / 2, cy - h2 - 30 + centerBarHeight + 10, 4)
        g.fill({ color: 0xe74c3c, alpha: 0.8 })
    }

    private drawVelocityBar(g: Graphics, v1: number, v2: number): void {
        const barX = this.centerX - 70
        const barY = this.height - 35
        const barWidth = 140
        const barHeight = 14

        // Background
        g.roundRect(barX, barY, barWidth, barHeight, 5)
        g.fill({ color: 0x222222, alpha: 0.7 })

        // Fill based on v2 relative to max possible
        const maxV2 = 50 // Approximate max
        const fillRatio = Math.min(v2 / maxV2, 1)
        const fillWidth = barWidth * fillRatio

        if (fillWidth > 0) {
            const fillColor = v2 > 30 ? 0xe74c3c : v2 > 15 ? 0xf39c12 : 0x3498db
            g.roundRect(barX, barY, fillWidth, barHeight, 5)
            g.fill({ color: fillColor, alpha: 0.85 })
        }

        // Border
        g.roundRect(barX, barY, barWidth, barHeight, 5)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })

        // v1 marker
        const v1Ratio = Math.min(v1 / maxV2, 1)
        const v1MarkerX = barX + barWidth * v1Ratio
        g.moveTo(v1MarkerX, barY - 3)
        g.lineTo(v1MarkerX - 3, barY - 7)
        g.lineTo(v1MarkerX + 3, barY - 7)
        g.closePath()
        g.fill({ color: 0x3498db, alpha: 0.9 })
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
