import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface GasParticle {
    x: number
    y: number
    vx: number
    vy: number
}

export class FirstLawScene extends BaseScene {
    declare private pistonBlob: Blob
    declare private flameBlob: Blob
    declare private containerGraphics: Graphics
    declare private particleGraphics: Graphics
    declare private particles: GasParticle[]
    declare private time: number
    declare private pistonY: number

    protected setup(): void {
        this.time = 0
        this.particles = []
        this.pistonY = this.centerY - 40

        this.containerGraphics = new Graphics()
        this.container.addChild(this.containerGraphics)

        this.particleGraphics = new Graphics()
        this.container.addChild(this.particleGraphics)

        // Initialize gas particles
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.centerX + (Math.random() - 0.5) * 80,
                y: this.centerY + 20 + Math.random() * 60,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
            })
        }

        // Piston (square blob - movable top)
        this.pistonBlob = new Blob({
            size: 50,
            color: 0x7f8c8d,
            shape: 'square',
            expression: 'happy',
        })
        this.pistonBlob.setPosition(this.centerX, this.pistonY)
        this.container.addChild(this.pistonBlob)

        // Flame/Heat source (circle blob - bottom)
        this.flameBlob = new Blob({
            size: 40,
            color: 0xe74c3c,
            shape: 'circle',
            expression: 'hot',
            glowIntensity: 0.5,
            glowColor: 0xff6b35,
        })
        this.flameBlob.setPosition(this.centerX, this.height - 60)
        this.container.addChild(this.flameBlob)
    }

    protected onVariablesChange(): void {
        const Q = this.variables['Q'] || 400
        const W = this.variables['W'] || 200
        const dU = Q - W

        // Flame intensity based on Q (range 100-800)
        const qNormalized = (Q - 100) / 700 // 0 to 1
        this.flameBlob.updateOptions({
            size: 30 + qNormalized * 35,
            glowIntensity: 0.3 + qNormalized * 0.7,
        })

        // Piston position based on W (range 50-600)
        const wNormalized = (W - 50) / 550 // 0 to 1
        this.pistonY = this.centerY - 10 - wNormalized * 80

        // Particle speed based on internal energy
        const speedMultiplier = 0.8 + Math.max(0, dU + 200) / 400
        this.particles.forEach((p) => {
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
            if (speed > 0) {
                p.vx = (p.vx / speed) * speedMultiplier * 2
                p.vy = (p.vy / speed) * speedMultiplier * 2
            }
        })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.03

        const Q = this.variables['Q'] || 400
        const W = this.variables['W'] || 200
        const dU = Q - W

        // Container boundaries
        const containerLeft = this.centerX - 60
        const containerRight = this.centerX + 60
        const containerBottom = this.height - 100
        const containerTop = this.pistonY + 25

        // Update particles - more dramatic speed response to dU
        // dU range is roughly -500 to 750, normalize to speed multiplier 0.5 to 3
        const dUNormalized = (dU + 500) / 1250 // 0 to 1
        const speedMultiplier = 0.5 + dUNormalized * 2.5
        this.particles.forEach((p) => {
            p.x += p.vx * delta * speedMultiplier
            p.y += p.vy * delta * speedMultiplier

            // Bounce off walls
            if (p.x < containerLeft + 8) {
                p.x = containerLeft + 8
                p.vx = Math.abs(p.vx)
            }
            if (p.x > containerRight - 8) {
                p.x = containerRight - 8
                p.vx = -Math.abs(p.vx)
            }
            if (p.y > containerBottom - 8) {
                p.y = containerBottom - 8
                p.vy = -Math.abs(p.vy)
            }
            if (p.y < containerTop + 8) {
                p.y = containerTop + 8
                p.vy = Math.abs(p.vy)
            }
        })

        // Animate piston position smoothly
        const currentPistonY = this.pistonBlob.position.y
        const targetPistonY = this.pistonY
        const newPistonY = currentPistonY + (targetPistonY - currentPistonY) * 0.1
        this.pistonBlob.setPosition(this.centerX, newPistonY)

        // Piston wobble when work is being done
        this.pistonBlob.updateOptions({
            wobblePhase: this.time * 2,
            scaleX: 1 + Math.sin(this.time * 4) * 0.02,
        })

        // Flame animation - more intense with higher Q
        const qNormalized = (Q - 100) / 700 // 0 to 1
        this.flameBlob.updateOptions({
            wobblePhase: this.time * (3 + qNormalized * 4),
            scaleY: 1 + Math.sin(this.time * 8) * (0.05 + qNormalized * 0.15),
            scaleX: 1 + Math.sin(this.time * 6) * qNormalized * 0.1,
        })

        this.drawContainer()
        this.drawParticles(dU)
        this.drawHeatFlow(Q)
        this.drawWorkArrow(W)
    }

    private drawContainer(): void {
        const g = this.containerGraphics
        g.clear()

        const pistonY = this.pistonBlob.position.y
        const containerLeft = this.centerX - 60
        const containerRight = this.centerX + 60
        const containerBottom = this.height - 100

        // Container walls (left and right)
        g.rect(containerLeft - 8, pistonY, 8, containerBottom - pistonY)
        g.fill({ color: 0x34495e, alpha: 0.9 })
        g.rect(containerRight, pistonY, 8, containerBottom - pistonY)
        g.fill({ color: 0x34495e, alpha: 0.9 })

        // Container bottom
        g.rect(containerLeft - 8, containerBottom, 136, 10)
        g.fill({ color: 0x34495e, alpha: 0.9 })

        // Piston rod
        g.rect(this.centerX - 4, pistonY - 50, 8, 50)
        g.fill({ color: 0x95a5a6, alpha: 0.8 })

        // Piston plate (top of gas)
        g.rect(containerLeft, pistonY + 20, 120, 8)
        g.fill({ color: 0x7f8c8d, alpha: 0.9 })
    }

    private drawParticles(dU: number): void {
        const g = this.particleGraphics
        g.clear()

        // Particle color based on internal energy
        let color: number
        if (dU < 0) {
            color = 0x3498db // Cooling - blue
        } else if (dU < 200) {
            color = 0xf39c12 // Warm - orange
        } else {
            color = 0xe74c3c // Hot - red
        }

        this.particles.forEach((p) => {
            g.circle(p.x, p.y, 5)
            g.fill({ color, alpha: 0.8 })
        })
    }

    private drawHeatFlow(Q: number): void {
        const g = this.containerGraphics

        // Q affects visual intensity (Q range 100-800)
        const qNormalized = (Q - 100) / 700 // 0 to 1

        // Heat arrows from flame to container - more arrows and thicker with higher Q
        const numArrows = Math.floor(Q / 150) + 1 // 1 to 6 arrows
        const arrowSpacing = 25
        const startX = this.centerX - ((numArrows - 1) * arrowSpacing) / 2
        const lineWidth = 2 + qNormalized * 3 // 2 to 5
        const waveSpeed = 4 + qNormalized * 4 // Faster wave with more heat

        for (let i = 0; i < numArrows; i++) {
            const x = startX + i * arrowSpacing
            const waveOffset = Math.sin(this.time * waveSpeed + i) * (3 + qNormalized * 3)

            g.moveTo(x + waveOffset, this.height - 90)
            g.lineTo(x + waveOffset, this.height - 125)
            g.stroke({ color: 0xe74c3c, width: lineWidth, alpha: 0.5 + qNormalized * 0.3 })

            // Arrow head
            g.moveTo(x + waveOffset, this.height - 125)
            g.lineTo(x + waveOffset - 6, this.height - 115)
            g.moveTo(x + waveOffset, this.height - 125)
            g.lineTo(x + waveOffset + 6, this.height - 115)
            g.stroke({ color: 0xe74c3c, width: lineWidth, alpha: 0.5 + qNormalized * 0.3 })
        }

        // Q label - size varies with Q
        const labelSize = 12 + qNormalized * 8
        g.circle(this.centerX - 80, this.height - 107, labelSize)
        g.fill({ color: 0xe74c3c, alpha: 0.2 + qNormalized * 0.3 })
    }

    private drawWorkArrow(W: number): void {
        const g = this.containerGraphics

        if (W > 50) {
            const pistonY = this.pistonBlob.position.y
            const arrowLength = Math.min(W * 0.15, 60)

            // Work arrow pointing up from piston
            g.moveTo(this.centerX, pistonY - 55)
            g.lineTo(this.centerX, pistonY - 55 - arrowLength)
            g.stroke({ color: 0x3498db, width: 4, alpha: 0.7 })

            // Arrow head
            g.moveTo(this.centerX, pistonY - 55 - arrowLength)
            g.lineTo(this.centerX - 8, pistonY - 45 - arrowLength)
            g.moveTo(this.centerX, pistonY - 55 - arrowLength)
            g.lineTo(this.centerX + 8, pistonY - 45 - arrowLength)
            g.stroke({ color: 0x3498db, width: 4, alpha: 0.7 })

            // W label
            g.circle(this.centerX + 30, pistonY - 70, 15)
            g.fill({ color: 0x3498db, alpha: 0.3 })
        }
    }
}
