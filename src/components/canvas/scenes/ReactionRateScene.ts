import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface Particle {
    blob: Blob
    x: number
    y: number
    vx: number
    vy: number
    isReactant: boolean // true = reactant (orange), false = product (teal)
    reactionTimer: number
}

interface ReactionFlash {
    x: number
    y: number
    life: number
    size: number
}

export class ReactionRateScene extends BaseScene {
    declare private container2: Graphics
    declare private particles: Particle[]
    declare private flashes: ReactionFlash[]
    declare private time: number
    declare private reactionCount: number
    declare private reactionRate: number

    protected setup(): void {
        this.time = 0
        this.particles = []
        this.flashes = []
        this.reactionCount = 0
        this.reactionRate = 0

        this.container2 = new Graphics()
        this.container.addChild(this.container2)

        // Initialize reactant particles
        for (let i = 0; i < 15; i++) {
            this.addParticle(true)
        }
    }

    private addParticle(isReactant: boolean): void {
        const containerLeft = this.centerX - 100
        const containerRight = this.centerX + 100
        const containerTop = this.centerY - 60
        const containerBottom = this.centerY + 60

        const x = containerLeft + 20 + Math.random() * (containerRight - containerLeft - 40)
        const y = containerTop + 20 + Math.random() * (containerBottom - containerTop - 40)

        const blob = new Blob({
            size: isReactant ? 18 : 14,
            color: isReactant ? 0xf39c12 : 0x1abc9c, // Orange reactant, Teal product
            shape: isReactant ? 'circle' : 'star',
            expression: isReactant ? 'excited' : 'happy',
        })
        blob.setPosition(x, y)
        this.container.addChild(blob)

        this.particles.push({
            blob,
            x,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            isReactant,
            reactionTimer: 0,
        })
    }

    protected onVariablesChange(): void {
        const k = this.variables['k'] || 1
        const A = this.variables['[A]'] || 1
        const n = this.variables['n'] || 1

        // Adjust number of reactant particles based on concentration
        const targetReactants = Math.max(5, Math.min(20, Math.floor(A * 5)))
        const currentReactants = this.particles.filter((p) => p.isReactant).length

        if (currentReactants < targetReactants) {
            for (let i = 0; i < targetReactants - currentReactants; i++) {
                this.addParticle(true)
            }
        } else if (currentReactants > targetReactants) {
            // Remove excess reactants
            let toRemove = currentReactants - targetReactants
            for (let i = this.particles.length - 1; i >= 0 && toRemove > 0; i--) {
                if (this.particles[i].isReactant) {
                    const p = this.particles[i]
                    this.container.removeChild(p.blob)
                    p.blob.destroy()
                    this.particles.splice(i, 1)
                    toRemove--
                }
            }
        }
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const k = this.variables['k'] || 1
        const A = this.variables['[A]'] || 1
        const n = this.variables['n'] || 1
        const r = k * Math.pow(A, n)

        // Update reaction rate display
        this.reactionRate = r

        // Container boundaries
        const containerLeft = this.centerX - 100
        const containerRight = this.centerX + 100
        const containerTop = this.centerY - 60
        const containerBottom = this.centerY + 60

        // Speed multiplier based on rate constant
        const speedMult = 0.5 + k * 0.3

        // Reaction probability based on rate
        const reactionProb = 0.001 * r * delta

        // Update particles
        this.particles.forEach((p, i) => {
            // Move particle
            const particleSpeed = p.isReactant ? speedMult : speedMult * 0.7
            p.x += p.vx * delta * particleSpeed
            p.y += p.vy * delta * particleSpeed

            // Bounce off walls
            if (p.x < containerLeft + 15) {
                p.x = containerLeft + 15
                p.vx = Math.abs(p.vx)
            }
            if (p.x > containerRight - 15) {
                p.x = containerRight - 15
                p.vx = -Math.abs(p.vx)
            }
            if (p.y < containerTop + 15) {
                p.y = containerTop + 15
                p.vy = Math.abs(p.vy)
            }
            if (p.y > containerBottom - 15) {
                p.y = containerBottom - 15
                p.vy = -Math.abs(p.vy)
            }

            // Random velocity changes
            if (Math.random() < 0.03) {
                p.vx += (Math.random() - 0.5) * 0.5
                p.vy += (Math.random() - 0.5) * 0.5
            }

            // Update blob
            p.blob.setPosition(p.x, p.y)
            p.blob.updateOptions({
                wobblePhase: this.time * (2 + k) + i,
                size: p.isReactant ? 18 : 14,
            })

            // Check for reactions (reactant -> product)
            if (p.isReactant && Math.random() < reactionProb) {
                // Check collision with another reactant for n >= 2
                if (n >= 2) {
                    const nearbyReactant = this.particles.find(
                        (other, j) =>
                            j !== i &&
                            other.isReactant &&
                            Math.hypot(p.x - other.x, p.y - other.y) < 40
                    )
                    if (nearbyReactant) {
                        this.convertToProduct(p)
                        this.addFlash(p.x, p.y)
                        this.reactionCount++
                    }
                } else {
                    // n < 2: single particle can react
                    this.convertToProduct(p)
                    this.addFlash(p.x, p.y)
                    this.reactionCount++
                }
            }
        })

        // Limit product particles
        const products = this.particles.filter((p) => !p.isReactant)
        if (products.length > 10) {
            // Remove oldest product
            const oldest = products[0]
            const idx = this.particles.indexOf(oldest)
            if (idx >= 0) {
                this.container.removeChild(oldest.blob)
                oldest.blob.destroy()
                this.particles.splice(idx, 1)
            }
        }

        // Regenerate reactants slowly
        const reactants = this.particles.filter((p) => p.isReactant)
        if (reactants.length < 5 && Math.random() < 0.02) {
            this.addParticle(true)
        }

        // Update flashes
        this.flashes.forEach((flash) => {
            flash.life -= 0.05 * delta
            flash.size += 2 * delta
        })
        this.flashes = this.flashes.filter((f) => f.life > 0)

        this.drawScene(r, n)
    }

    private convertToProduct(p: Particle): void {
        p.isReactant = false
        p.blob.updateOptions({
            color: 0x1abc9c,
            shape: 'star',
            expression: 'happy',
            size: 14,
        })
    }

    private addFlash(x: number, y: number): void {
        this.flashes.push({
            x,
            y,
            life: 1,
            size: 10,
        })
    }

    private drawScene(r: number, n: number): void {
        const g = this.container2
        g.clear()

        const containerLeft = this.centerX - 100
        const containerRight = this.centerX + 100
        const containerTop = this.centerY - 60
        const containerBottom = this.centerY + 60

        // Container (reaction vessel)
        g.roundRect(containerLeft, containerTop, 200, 120, 10)
        g.stroke({ color: 0xffffff, width: 3, alpha: 0.5 })

        // Glass highlight
        g.rect(containerLeft + 5, containerTop + 5, 6, 110)
        g.fill({ color: 0xffffff, alpha: 0.1 })

        // Draw reaction flashes
        this.flashes.forEach((flash) => {
            // Outer glow
            g.circle(flash.x, flash.y, flash.size * 2)
            g.fill({ color: 0xf1c40f, alpha: flash.life * 0.3 })

            // Inner flash
            g.circle(flash.x, flash.y, flash.size)
            g.fill({ color: 0xffffff, alpha: flash.life * 0.8 })

            // Sparkles
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + this.time * 5
                const sparkleX = flash.x + Math.cos(angle) * flash.size * 1.5
                const sparkleY = flash.y + Math.sin(angle) * flash.size * 1.5
                g.circle(sparkleX, sparkleY, 2)
                g.fill({ color: 0xf1c40f, alpha: flash.life * 0.6 })
            }
        })

        // Catalyst indicator (k)
        this.drawCatalystGlow(g)

        // Rate meter
        this.drawRateMeter(g, r)

        // Reaction order indicator
        this.drawOrderIndicator(g, n)
    }

    private drawCatalystGlow(g: Graphics): void {
        const k = this.variables['k'] || 1
        const glowIntensity = k / 10

        // Glow around container edges
        const containerLeft = this.centerX - 100
        const containerTop = this.centerY - 60

        if (glowIntensity > 0.1) {
            g.roundRect(containerLeft - 5, containerTop - 5, 210, 130, 12)
            g.stroke({ color: 0xe91e63, width: 3, alpha: glowIntensity * 0.5 })
        }
    }

    private drawRateMeter(g: Graphics, r: number): void {
        const meterX = this.centerX - 60
        const meterY = this.height - 45
        const meterWidth = 120
        const meterHeight = 14

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 4)
        g.fill({ color: 0x333333, alpha: 0.6 })

        // Fill based on rate (log scale for better visualization)
        const normalizedRate = Math.min(1, Math.log10(r + 1) / 2)
        const fillColor = this.rateToColor(normalizedRate)

        g.roundRect(meterX, meterY, meterWidth * normalizedRate, meterHeight, 4)
        g.fill({ color: fillColor, alpha: 0.8 })

        // Border
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 4)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })

        // Rate indicator marks
        for (let i = 1; i <= 3; i++) {
            const markX = meterX + (i / 4) * meterWidth
            g.moveTo(markX, meterY)
            g.lineTo(markX, meterY + 4)
            g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })
        }
    }

    private drawOrderIndicator(g: Graphics, n: number): void {
        // Draw n order indicator as small dots
        const baseX = this.centerX + 70
        const baseY = this.height - 38

        for (let i = 0; i < Math.min(n, 3); i++) {
            g.circle(baseX + i * 12, baseY, 4)
            g.fill({ color: 0xf39c12, alpha: 0.8 })
        }

        // Zero order special indicator
        if (n === 0) {
            g.circle(baseX, baseY, 4)
            g.stroke({ color: 0xf39c12, width: 2, alpha: 0.8 })
        }
    }

    private rateToColor(t: number): number {
        // Green (slow) -> Yellow -> Red (fast)
        if (t < 0.5) {
            const ratio = t * 2
            return this.lerpColor(0x2ecc71, 0xf1c40f, ratio)
        } else {
            const ratio = (t - 0.5) * 2
            return this.lerpColor(0xf1c40f, 0xe74c3c, ratio)
        }
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
