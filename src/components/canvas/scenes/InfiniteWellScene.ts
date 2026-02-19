import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Wobble, WobbleExpression } from '../Wobble'
import { pixiColors } from '../../../utils/pixiHelpers'

export class InfiniteWellScene extends BaseScene {
    declare private particleWobble: Wobble
    declare private waveGraphics: Graphics
    declare private wallGraphics: Graphics
    declare private energyGraphics: Graphics
    declare private probabilityGraphics: Graphics
    declare private time: number

    protected setup(): void {
        this.time = 0

        // Wall graphics (infinite potential barriers)
        this.wallGraphics = new Graphics()
        this.container.addChild(this.wallGraphics)

        // Probability density |ψ|²
        this.probabilityGraphics = new Graphics()
        this.container.addChild(this.probabilityGraphics)

        // Wave function ψ(x)
        this.waveGraphics = new Graphics()
        this.container.addChild(this.waveGraphics)

        // Energy level diagram
        this.energyGraphics = new Graphics()
        this.container.addChild(this.energyGraphics)

        // Quantum particle (Einstein - quantum mechanics pioneer)
        this.particleWobble = new Wobble({
            size: 25,
            color: pixiColors.wavelength,
            shape: 'einstein',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: pixiColors.energy,
        })
        this.container.addChild(this.particleWobble)
    }

    protected onVariablesChange(): void {
        const n = Math.round(this.variables['n'] || 1)
        const E = this.variables['E'] || 0.38

        // Higher energy = more glow
        const glowIntensity = 0.2 + Math.min(0.5, E / 10)
        this.particleWobble.updateOptions({ glowIntensity })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.03

        const n = Math.round(this.variables['n'] || 1)
        const L = this.variables['L'] || 1 // nm
        const E = this.variables['E'] || 0.38 // eV

        // Well dimensions on screen
        const wellMargin = 60
        const wellWidth = Math.min(this.width - wellMargin * 2, 200 + L * 30)
        const wellStartX = this.centerX - wellWidth / 2
        const wellEndX = this.centerX + wellWidth / 2
        const wellCenterY = this.centerY - 20

        // Animation frequency increases with energy
        const frequency = 1 + Math.sqrt(E) * 0.5
        const temporalTerm = Math.cos(this.time * frequency * Math.PI)

        // Find probability maximum position for particle
        const maxProbX = this.findProbabilityMaximum(n, wellStartX, wellEndX, temporalTerm)

        // Expression based on quantum number
        let expression: WobbleExpression = 'happy'
        if (n >= 4) {
            expression = 'excited'
        } else if (n >= 3) {
            expression = 'surprised'
        } else if (n === 2) {
            expression = 'happy'
        }

        // Particle follows probability maximum with some wobble
        const amplitude = 35
        const waveY =
            wellCenterY +
            this.getWaveValue(maxProbX, wellStartX, wellEndX, n, temporalTerm) * amplitude * 0.3

        this.particleWobble.setPosition(maxProbX, waveY)
        this.particleWobble.updateOptions({
            wobblePhase: this.time * 3,
            expression,
            scaleX: 1 + Math.abs(temporalTerm) * 0.1,
            scaleY: 1 - Math.abs(temporalTerm) * 0.05,
        })

        this.drawWalls(wellStartX, wellEndX, wellCenterY)
        this.drawProbabilityDensity(n, wellStartX, wellEndX, wellCenterY, temporalTerm)
        this.drawWaveFunction(n, wellStartX, wellEndX, wellCenterY, temporalTerm)
        this.drawEnergyLevels(n, E, wellEndX)
        this.drawNodeMarkers(n, wellStartX, wellEndX, wellCenterY)
    }

    private getWaveValue(
        x: number,
        startX: number,
        endX: number,
        n: number,
        temporalTerm: number
    ): number {
        const wellWidth = endX - startX
        const normalizedX = (x - startX) / wellWidth
        if (normalizedX < 0 || normalizedX > 1) return 0
        return Math.sin(normalizedX * n * Math.PI) * temporalTerm
    }

    private findProbabilityMaximum(
        n: number,
        startX: number,
        endX: number,
        temporalTerm: number
    ): number {
        // Find the antinode (probability maximum) closest to current position
        // For n states, there are n antinodes at positions (k+0.5)/n for k=0,1,...,n-1
        const wellWidth = endX - startX

        // Animate between antinodes based on time
        const antinodeIndex = Math.floor((this.time * 0.3) % n)
        const antinodePosition = (antinodeIndex + 0.5) / n

        return startX + antinodePosition * wellWidth
    }

    private drawWalls(startX: number, endX: number, centerY: number): void {
        const g = this.wallGraphics
        g.clear()

        const wallHeight = 150
        const wallWidth = 20

        // Left wall (infinite potential)
        g.rect(startX - wallWidth, centerY - wallHeight / 2, wallWidth, wallHeight)
        g.fill({ color: 0x2d1f3d, alpha: 0.9 })

        // Right wall
        g.rect(endX, centerY - wallHeight / 2, wallWidth, wallHeight)
        g.fill({ color: 0x2d1f3d, alpha: 0.9 })

        // Wall gradient effect (showing infinite potential)
        for (let i = 0; i < 5; i++) {
            const alpha = 0.15 - i * 0.025
            // Left wall glow
            g.rect(startX - wallWidth - i * 3, centerY - wallHeight / 2, 3, wallHeight)
            g.fill({ color: 0x9b59b6, alpha })
            // Right wall glow
            g.rect(endX + wallWidth + i * 3, centerY - wallHeight / 2, 3, wallHeight)
            g.fill({ color: 0x9b59b6, alpha })
        }

        // V = ∞ labels
        const labelY = centerY - wallHeight / 2 - 15
        g.circle(startX - wallWidth / 2, labelY, 10)
        g.fill({ color: 0x9b59b6, alpha: 0.5 })
        g.circle(endX + wallWidth / 2, labelY, 10)
        g.fill({ color: 0x9b59b6, alpha: 0.5 })

        // Bottom line (potential = 0 inside well)
        g.moveTo(startX, centerY + 60)
        g.lineTo(endX, centerY + 60)
        g.stroke({ color: 0x444466, width: 1, alpha: 0.5 })
    }

    private drawProbabilityDensity(
        n: number,
        startX: number,
        endX: number,
        centerY: number,
        temporalTerm: number
    ): void {
        const g = this.probabilityGraphics
        g.clear()

        const wellWidth = endX - startX
        const amplitude = 40

        // |ψ|² = sin²(nπx/L) - time independent probability density
        for (let x = startX; x <= endX; x += 2) {
            const normalizedX = (x - startX) / wellWidth
            const spatialTerm = Math.sin(normalizedX * n * Math.PI)
            const probability = spatialTerm * spatialTerm

            if (probability > 0.01) {
                const height = probability * amplitude
                g.rect(x - 1, centerY - height / 2, 2, height)
                g.fill({ color: pixiColors.energy, alpha: probability * 0.4 })
            }
        }
    }

    private drawWaveFunction(
        n: number,
        startX: number,
        endX: number,
        centerY: number,
        temporalTerm: number
    ): void {
        const g = this.waveGraphics
        g.clear()

        const wellWidth = endX - startX
        const amplitude = 40

        // Draw motion blur trails
        for (let frame = 0; frame < 2; frame++) {
            const timeOffset = frame * 0.1
            const frameTemporalTerm = Math.cos(
                (this.time - timeOffset) * (1 + Math.sqrt(n) * 0.3) * Math.PI
            )
            const alpha = 0.25 - frame * 0.1

            g.moveTo(startX, centerY)
            for (let x = startX; x <= endX; x += 2) {
                const normalizedX = (x - startX) / wellWidth
                const y =
                    centerY + Math.sin(normalizedX * n * Math.PI) * frameTemporalTerm * amplitude
                g.lineTo(x, y)
            }
            g.stroke({ color: pixiColors.wavelength, width: 3 - frame, alpha })
        }

        // Main wave function ψ(x,t) = sin(nπx/L) * cos(ωt)
        g.moveTo(startX, centerY)
        for (let x = startX; x <= endX; x += 2) {
            const normalizedX = (x - startX) / wellWidth
            const y = centerY + Math.sin(normalizedX * n * Math.PI) * temporalTerm * amplitude
            g.lineTo(x, y)
        }
        g.stroke({ color: pixiColors.wavelength, width: 3, alpha: 0.9 })

        // Zero line
        g.moveTo(startX, centerY)
        g.lineTo(endX, centerY)
        g.stroke({ color: 0x444466, width: 1, alpha: 0.3 })
    }

    private drawEnergyLevels(currentN: number, currentE: number, wellEndX: number): void {
        const g = this.energyGraphics
        g.clear()

        const diagramX = wellEndX + 50
        const diagramWidth = 50
        const diagramHeight = 120
        const diagramTop = this.centerY - diagramHeight / 2 - 20
        const diagramBottom = diagramTop + diagramHeight

        // Energy diagram background
        g.roundRect(diagramX - 5, diagramTop - 10, diagramWidth + 10, diagramHeight + 20, 5)
        g.fill({ color: 0x1a1a2e, alpha: 0.7 })
        g.stroke({ color: 0x444466, width: 1 })

        // Draw energy levels E_n = n² * E_1
        const E1 = 0.376 / (this.variables['L'] || 1) ** 2

        for (let n = 1; n <= 5; n++) {
            const En = n * n * E1
            // Normalize to diagram height (E_5 at top)
            const normalizedE = (n * n) / 25
            const levelY = diagramBottom - normalizedE * diagramHeight

            const isActive = n === currentN
            const alpha = isActive ? 1 : 0.4
            const width = isActive ? 3 : 1.5
            const color = isActive ? pixiColors.energy : 0x888888

            // Energy level line
            g.moveTo(diagramX, levelY)
            g.lineTo(diagramX + diagramWidth, levelY)
            g.stroke({ color, width, alpha })

            // Level label (n value)
            if (isActive) {
                g.circle(diagramX + diagramWidth + 12, levelY, 8)
                g.fill({ color: pixiColors.energy, alpha: 0.6 })
            }
        }

        // Current energy indicator arrow
        const currentLevelY = diagramBottom - ((currentN * currentN) / 25) * diagramHeight
        g.moveTo(diagramX - 15, currentLevelY)
        g.lineTo(diagramX - 5, currentLevelY - 5)
        g.lineTo(diagramX - 5, currentLevelY + 5)
        g.closePath()
        g.fill({ color: pixiColors.energy, alpha: 0.8 })
    }

    private drawNodeMarkers(n: number, startX: number, endX: number, centerY: number): void {
        const g = this.waveGraphics
        const wellWidth = endX - startX

        // Draw nodes (where ψ = 0)
        // Nodes at x = k/n * L for k = 0, 1, ..., n
        for (let k = 0; k <= n; k++) {
            const nodeX = startX + (k / n) * wellWidth

            g.circle(nodeX, centerY, 5)
            g.fill({ color: 0xff6b6b, alpha: 0.8 })

            // Node label below
            if (k > 0 && k < n) {
                g.circle(nodeX, centerY + 55, 8)
                g.fill({ color: 0xff6b6b, alpha: 0.4 })
            }
        }

        // Number of nodes indicator at bottom
        const indicatorY = this.height - 35
        g.roundRect(this.centerX - 60, indicatorY - 8, 120, 20, 8)
        g.fill({ color: 0x222222, alpha: 0.6 })

        // Show n-1 nodes (excluding boundary nodes)
        const nodeCount = n - 1
        for (let i = 0; i < 4; i++) {
            const dotX = this.centerX - 30 + i * 20
            const isActive = i < nodeCount
            g.circle(dotX, indicatorY + 2, 5)
            g.fill({ color: isActive ? 0xff6b6b : 0x444444, alpha: isActive ? 0.9 : 0.4 })
        }
    }
}
