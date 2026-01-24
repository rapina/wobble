import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Wobble, WobbleExpression } from '../Wobble'
import { pixiColors } from '../../../utils/pixiHelpers'

interface Photon {
    x: number
    y: number
    vx: number
    vy: number
    color: number
    life: number
    emission: boolean // true = emitting (outward), false = absorbing (inward)
}

export class BohrScene extends BaseScene {
    declare private nucleusWobble: Wobble
    declare private electronWobble: Wobble
    declare private orbitGraphics: Graphics
    declare private energyGraphics: Graphics
    declare private photonGraphics: Graphics
    declare private photons: Photon[]
    declare private electronAngle: number
    declare private time: number
    declare private currentN: number
    declare private targetN: number
    declare private transitionProgress: number
    declare private isTransitioning: boolean

    protected setup(): void {
        this.time = 0
        this.electronAngle = 0
        this.currentN = 2
        this.targetN = 2
        this.transitionProgress = 0
        this.isTransitioning = false
        this.photons = []

        // Orbit graphics
        this.orbitGraphics = new Graphics()
        this.container.addChild(this.orbitGraphics)

        // Photon graphics
        this.photonGraphics = new Graphics()
        this.container.addChild(this.photonGraphics)

        // Energy level diagram
        this.energyGraphics = new Graphics()
        this.container.addChild(this.energyGraphics)

        // Nucleus (proton) - Einstein for quantum mechanics theme
        this.nucleusWobble = new Wobble({
            size: 30,
            color: 0xf39c12, // Orange/yellow for proton
            shape: 'einstein',
            expression: 'happy',
            glowIntensity: 0.4,
            glowColor: 0xf39c12,
        })
        this.nucleusWobble.setPosition(this.centerX, this.centerY)
        this.container.addChild(this.nucleusWobble)

        // Electron - Circle (Wobi) orbiting
        this.electronWobble = new Wobble({
            size: 18,
            color: 0x5dade2, // Blue for electron
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: 0x5dade2,
        })
        this.container.addChild(this.electronWobble)
    }

    protected onVariablesChange(): void {
        const newN = Math.round(this.variables['n'] || 2)

        if (newN !== this.targetN) {
            // Start transition animation
            this.targetN = newN
            this.isTransitioning = true
            this.transitionProgress = 0

            // Create photon for emission/absorption
            const emission = newN < this.currentN // Going to lower energy = emit photon
            this.createPhoton(emission, this.currentN, newN)
        }
    }

    private createPhoton(emission: boolean, fromN: number, toN: number): void {
        // Calculate photon energy and color based on transition
        const E1 = -13.6 / (fromN * fromN)
        const E2 = -13.6 / (toN * toN)
        const deltaE = Math.abs(E2 - E1)

        // Map energy to color (Balmer series approximation)
        const color = this.energyToColor(deltaE)

        // Get electron current position
        const radius = this.getOrbitRadius(fromN)
        const x = this.centerX + Math.cos(this.electronAngle) * radius
        const y = this.centerY + Math.sin(this.electronAngle) * radius

        if (emission) {
            // Emit photon outward
            const angle = this.electronAngle + (Math.random() - 0.5) * 0.5
            this.photons.push({
                x,
                y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                color,
                life: 1,
                emission: true,
            })
        } else {
            // Absorb photon (coming from outside)
            const angle = Math.random() * Math.PI * 2
            const startRadius = 150
            this.photons.push({
                x: this.centerX + Math.cos(angle) * startRadius,
                y: this.centerY + Math.sin(angle) * startRadius,
                vx: -Math.cos(angle) * 2,
                vy: -Math.sin(angle) * 2,
                color,
                life: 1,
                emission: false,
            })
        }
    }

    private energyToColor(deltaE: number): number {
        // Map energy difference to visible spectrum color
        // Higher energy = blue/violet, lower energy = red
        if (deltaE > 3) return 0x8844ff // Violet (Lyman series)
        if (deltaE > 2.5) return 0x4444ff // Blue
        if (deltaE > 2) return 0x44ddff // Cyan
        if (deltaE > 1.5) return 0x44ff88 // Green
        if (deltaE > 1) return 0xffff44 // Yellow
        if (deltaE > 0.5) return 0xff8844 // Orange
        return 0xff4444 // Red (Paschen series)
    }

    private getOrbitRadius(n: number): number {
        // Scale orbit radius for visualization
        // r_n = n² * baseRadius
        const baseRadius = 15
        return baseRadius + n * n * 8
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const n = Math.round(this.variables['n'] || 2)

        // Handle transition animation
        if (this.isTransitioning) {
            this.transitionProgress += delta * 0.03
            if (this.transitionProgress >= 1) {
                this.transitionProgress = 1
                this.isTransitioning = false
                this.currentN = this.targetN
            }
        }

        // Interpolate orbit radius during transition
        const currentRadius = this.getOrbitRadius(this.currentN)
        const targetRadius = this.getOrbitRadius(this.targetN)
        const radius = this.isTransitioning
            ? currentRadius +
              (targetRadius - currentRadius) * this.easeInOut(this.transitionProgress)
            : targetRadius

        // Orbital speed (faster at lower orbits, like real physics)
        const baseSpeed = 0.05
        const speed = baseSpeed / Math.sqrt(n)
        this.electronAngle += speed * delta

        // Position electron
        const electronX = this.centerX + Math.cos(this.electronAngle) * radius
        const electronY = this.centerY + Math.sin(this.electronAngle) * radius

        // Expression based on state
        let expression: WobbleExpression = 'happy'
        if (this.isTransitioning) {
            expression = 'excited'
        } else if (n === 1) {
            expression = 'happy' // Ground state - stable
        } else if (n >= 5) {
            expression = 'surprised' // High energy - unstable
        }

        this.electronWobble.setPosition(electronX, electronY)
        this.electronWobble.updateOptions({
            wobblePhase: this.time * 4,
            expression,
            glowIntensity: this.isTransitioning ? 0.6 : 0.3,
            size: 14 + (6 - n) * 1, // Smaller at higher orbits
        })

        // Nucleus wobble
        this.nucleusWobble.updateOptions({
            wobblePhase: this.time * 2,
        })

        // Update photons
        this.updatePhotons(delta)

        // Draw elements
        this.drawOrbits(n, radius)
        this.drawPhotons()
        this.drawEnergyDiagram(n)
    }

    private easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    }

    private updatePhotons(delta: number): void {
        this.photons.forEach((p) => {
            p.x += p.vx * delta
            p.y += p.vy * delta
            p.life -= 0.015 * delta

            // Absorption: check if photon reached nucleus area
            if (!p.emission) {
                const distToCenter = Math.sqrt(
                    (p.x - this.centerX) ** 2 + (p.y - this.centerY) ** 2
                )
                if (distToCenter < 30) {
                    p.life = 0 // Absorbed
                }
            }
        })

        this.photons = this.photons.filter((p) => p.life > 0)
    }

    private drawOrbits(currentN: number, activeRadius: number): void {
        const g = this.orbitGraphics
        g.clear()

        // Draw all possible orbits (n = 1 to 6)
        for (let n = 1; n <= 6; n++) {
            const radius = this.getOrbitRadius(n)
            const isActive = n === this.targetN
            const alpha = isActive ? 0.8 : 0.2
            const width = isActive ? 2.5 : 1

            // Dashed circle for inactive, solid for active
            if (isActive) {
                g.circle(this.centerX, this.centerY, radius)
                g.stroke({ color: 0x5dade2, width, alpha })

                // Glow for active orbit
                g.circle(this.centerX, this.centerY, radius)
                g.stroke({ color: 0x5dade2, width: 8, alpha: 0.1 })
            } else {
                // Dashed circle - draw individual arc segments
                const segments = 24
                for (let i = 0; i < segments; i += 2) {
                    const startAngle = (i / segments) * Math.PI * 2
                    const endAngle = ((i + 1) / segments) * Math.PI * 2
                    // Must moveTo start position before each arc
                    const startX = this.centerX + Math.cos(startAngle) * radius
                    const startY = this.centerY + Math.sin(startAngle) * radius
                    g.moveTo(startX, startY)
                    g.arc(this.centerX, this.centerY, radius, startAngle, endAngle)
                }
                g.stroke({ color: 0x5dade2, width, alpha })
            }

            // Orbit label (n value) on right side
            const labelX = this.centerX + radius + 15
            const labelY = this.centerY

            if (labelX < this.width - 80) {
                g.circle(labelX, labelY, 10)
                g.fill({ color: isActive ? 0x5dade2 : 0x444466, alpha: isActive ? 0.5 : 0.3 })
            }
        }

        // Electron trail
        const trailLength = 8
        for (let i = 0; i < trailLength; i++) {
            const angle = this.electronAngle - i * 0.1
            const x = this.centerX + Math.cos(angle) * activeRadius
            const y = this.centerY + Math.sin(angle) * activeRadius
            const alpha = 0.4 * (1 - i / trailLength)
            const size = 6 * (1 - i / trailLength)

            g.circle(x, y, size)
            g.fill({ color: 0x5dade2, alpha })
        }
    }

    private drawPhotons(): void {
        const g = this.photonGraphics
        g.clear()

        this.photons.forEach((p) => {
            // Photon glow
            g.circle(p.x, p.y, 15 * p.life)
            g.fill({ color: p.color, alpha: p.life * 0.3 })

            // Photon core
            g.circle(p.x, p.y, 6 * p.life)
            g.fill({ color: p.color, alpha: p.life * 0.8 })

            // Wave pattern (only draw if photon is moving)
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
            if (speed > 0.1) {
                const amplitude = 5 * p.life
                const perpX = -p.vy / speed
                const perpY = p.vx / speed

                g.moveTo(
                    p.x - p.vx * 3 + perpX * Math.sin(this.time * 10) * amplitude,
                    p.y - p.vy * 3 + perpY * Math.sin(this.time * 10) * amplitude
                )
                for (let i = 0; i < 4; i++) {
                    const t = i / 4
                    const wx =
                        p.x -
                        p.vx * 3 * (1 - t) +
                        perpX * Math.sin(this.time * 10 + i) * amplitude * (1 - t)
                    const wy =
                        p.y -
                        p.vy * 3 * (1 - t) +
                        perpY * Math.sin(this.time * 10 + i) * amplitude * (1 - t)
                    g.lineTo(wx, wy)
                }
                g.stroke({ color: p.color, width: 2 * p.life, alpha: p.life * 0.6 })
            }
        })
    }

    private drawEnergyDiagram(currentN: number): void {
        const g = this.energyGraphics
        g.clear()

        const diagramX = 25
        const diagramWidth = 40
        const diagramHeight = 140
        const diagramTop = this.centerY - diagramHeight / 2
        const diagramBottom = diagramTop + diagramHeight

        // Background
        g.roundRect(diagramX - 5, diagramTop - 15, diagramWidth + 10, diagramHeight + 30, 5)
        g.fill({ color: 0x1a1a2e, alpha: 0.7 })
        g.stroke({ color: 0x444466, width: 1 })

        // Draw energy levels
        // E_n = -13.6/n² eV
        // E_1 = -13.6 eV (bottom), E_6 ≈ -0.38 eV (top)
        for (let n = 1; n <= 6; n++) {
            const En = -13.6 / (n * n)
            // Map energy to y position (-13.6 at bottom, 0 at top)
            const normalizedE = (En + 13.6) / 13.6 // 0 to 1
            const levelY = diagramBottom - normalizedE * diagramHeight

            const isActive = n === this.targetN
            const alpha = isActive ? 1 : 0.4
            const width = isActive ? 3 : 1.5
            const color = isActive ? pixiColors.energy : 0x888888

            // Energy level line
            g.moveTo(diagramX, levelY)
            g.lineTo(diagramX + diagramWidth, levelY)
            g.stroke({ color, width, alpha })

            // Active level glow
            if (isActive) {
                g.roundRect(diagramX - 2, levelY - 4, diagramWidth + 4, 8, 3)
                g.fill({ color: pixiColors.energy, alpha: 0.3 })
            }
        }

        // Transition arrow when changing levels
        if (this.isTransitioning && this.currentN !== this.targetN) {
            const fromE = -13.6 / (this.currentN * this.currentN)
            const toE = -13.6 / (this.targetN * this.targetN)
            const fromY = diagramBottom - ((fromE + 13.6) / 13.6) * diagramHeight
            const toY = diagramBottom - ((toE + 13.6) / 13.6) * diagramHeight

            const arrowX = diagramX + diagramWidth + 15
            const emission = this.targetN < this.currentN

            // Arrow
            g.moveTo(arrowX, fromY)
            g.lineTo(arrowX, toY)
            g.stroke({ color: emission ? 0xffaa44 : 0x44aaff, width: 2 })

            // Arrow head
            const headY = toY + (emission ? 8 : -8)
            g.moveTo(arrowX, toY)
            g.lineTo(arrowX - 5, headY)
            g.moveTo(arrowX, toY)
            g.lineTo(arrowX + 5, headY)
            g.stroke({ color: emission ? 0xffaa44 : 0x44aaff, width: 2 })

            // Photon symbol
            const photonY = (fromY + toY) / 2
            g.circle(arrowX + 15, photonY, 6)
            g.fill({ color: emission ? 0xffaa44 : 0x44aaff, alpha: 0.7 })
        }

        // E = 0 reference line at top
        g.moveTo(diagramX - 5, diagramTop)
        g.lineTo(diagramX + diagramWidth + 5, diagramTop)
        g.stroke({ color: 0x666688, width: 1, alpha: 0.5 })
    }
}
