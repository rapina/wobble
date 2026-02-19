import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Wobble, WobbleExpression } from '../Wobble'
import { pixiColors } from '../../../utils/pixiHelpers'

export class UncertaintyScene extends BaseScene {
    declare private particleWobble: Wobble
    declare private waveGraphics: Graphics
    declare private momentumGraphics: Graphics
    declare private indicatorGraphics: Graphics
    declare private glowGraphics: Graphics
    declare private time: number
    declare private particleOffsetX: number
    declare private particleOffsetY: number

    protected setup(): void {
        this.time = 0
        this.particleOffsetX = 0
        this.particleOffsetY = 0

        // Glow layer (behind everything)
        this.glowGraphics = new Graphics()
        this.container.addChild(this.glowGraphics)

        // Wave packet visualization
        this.waveGraphics = new Graphics()
        this.container.addChild(this.waveGraphics)

        // Momentum distribution
        this.momentumGraphics = new Graphics()
        this.container.addChild(this.momentumGraphics)

        // Indicator graphics
        this.indicatorGraphics = new Graphics()
        this.container.addChild(this.indicatorGraphics)

        // Quantum particle as Einstein - uncertainty principle pioneer
        this.particleWobble = new Wobble({
            size: 30,
            color: pixiColors.wavelength,
            shape: 'einstein',
            expression: 'happy',
            glowIntensity: 0.4,
            glowColor: pixiColors.wavelength,
        })
        this.container.addChild(this.particleWobble)
    }

    protected onVariablesChange(): void {
        const Dx = this.variables['Δx'] || 1

        // Size inversely related to position certainty
        // When position is well-known (small Δx), particle is more "solid"
        const size = 20 + (10 - Dx) * 2
        this.particleWobble.updateOptions({ size: Math.max(15, Math.min(40, size)) })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        // Get variables
        const Dx = this.variables['Δx'] || 1 // Position uncertainty (nm)
        const Dp = this.variables['Δp'] || 0.53 // Momentum uncertainty

        // Scale for visualization
        const positionWidth = 30 + Dx * 20 // Wave packet width
        const momentumSpread = Math.min(150, Dp * 30) // Momentum distribution width

        // Particle random motion within uncertainty region
        // More position uncertainty = larger random movements
        const jitterScale = Dx * 3
        this.particleOffsetX += (Math.random() - 0.5) * jitterScale * delta
        this.particleOffsetY += (Math.random() - 0.5) * jitterScale * delta

        // Damping to keep particle centered
        this.particleOffsetX *= 0.95
        this.particleOffsetY *= 0.95

        // Clamp to reasonable bounds
        const maxOffset = positionWidth * 0.8
        this.particleOffsetX = Math.max(-maxOffset, Math.min(maxOffset, this.particleOffsetX))
        this.particleOffsetY = Math.max(
            -maxOffset * 0.5,
            Math.min(maxOffset * 0.5, this.particleOffsetY)
        )

        // Expression based on uncertainty
        let expression: WobbleExpression = 'happy'
        if (Dx < 1) {
            expression = 'excited' // Well localized - knows where it is
        } else if (Dx > 5) {
            expression = 'dizzy' // Very uncertain position
        } else if (Dx > 3) {
            expression = 'worried' // Moderately uncertain
        }

        // Shimmer effect proportional to momentum uncertainty
        const shimmerScale = 1 + Math.sin(this.time * 10 * Dp) * 0.05 * Math.min(1, Dp)

        this.particleWobble.setPosition(
            this.centerX + this.particleOffsetX,
            this.centerY - 30 + this.particleOffsetY
        )
        this.particleWobble.updateOptions({
            wobblePhase: this.time * 3,
            expression,
            scaleX: shimmerScale,
            scaleY: shimmerScale,
            glowIntensity: 0.3 + Dp * 0.1,
        })

        this.drawGlow(positionWidth, Dp)
        this.drawWavePacket(positionWidth)
        this.drawMomentumDistribution(momentumSpread)
        this.drawIndicators(positionWidth, momentumSpread, Dx, Dp)
    }

    private drawGlow(positionWidth: number, Dp: number): void {
        const g = this.glowGraphics
        g.clear()

        // Glow representing quantum uncertainty cloud
        const glowRadius = positionWidth * 1.5
        for (let i = 4; i >= 0; i--) {
            const r = glowRadius * (0.3 + i * 0.2)
            const alpha = 0.06 * (1 - i * 0.15)
            g.ellipse(this.centerX, this.centerY - 30, r, r * 0.6)
            g.fill({ color: pixiColors.wavelength, alpha })
        }
    }

    private drawWavePacket(positionWidth: number): void {
        const g = this.waveGraphics
        g.clear()

        const amplitude = 35
        const centerY = this.centerY - 30

        // Draw wave packet with Gaussian envelope
        g.moveTo(0, centerY)

        for (let x = 0; x <= this.width; x += 2) {
            const distFromCenter = x - this.centerX
            // Gaussian envelope
            const envelope = Math.exp(
                -(distFromCenter * distFromCenter) / (positionWidth * positionWidth * 2)
            )

            // Wave oscillation
            const wavelength = 30 + positionWidth * 0.5
            const phase = (x / wavelength) * Math.PI * 2 - this.time * 4
            const y = centerY + Math.sin(phase) * amplitude * envelope

            g.lineTo(x, y)
        }

        g.stroke({ color: pixiColors.wavelength, width: 3, alpha: 0.8 })

        // Draw probability density |ψ|²
        for (let x = 0; x <= this.width; x += 3) {
            const distFromCenter = x - this.centerX
            const envelope = Math.exp(
                -(distFromCenter * distFromCenter) / (positionWidth * positionWidth * 2)
            )

            const wavelength = 30 + positionWidth * 0.5
            const phase = (x / wavelength) * Math.PI * 2 - this.time * 4
            const waveValue = Math.sin(phase)
            const probability = waveValue * waveValue * envelope

            if (probability > 0.02) {
                const height = probability * amplitude * 1.5
                g.rect(x - 1, centerY - height / 2, 2, height)
                g.fill({ color: pixiColors.wavelength, alpha: probability * 0.4 })
            }
        }

        // Draw envelope outline
        g.moveTo(this.centerX - positionWidth * 3, centerY)
        for (
            let x = this.centerX - positionWidth * 3;
            x <= this.centerX + positionWidth * 3;
            x += 2
        ) {
            const distFromCenter = x - this.centerX
            const envelope = Math.exp(
                -(distFromCenter * distFromCenter) / (positionWidth * positionWidth * 2)
            )
            g.lineTo(x, centerY - amplitude * envelope)
        }
        g.stroke({ color: pixiColors.distance, width: 1.5, alpha: 0.5 })

        g.moveTo(this.centerX - positionWidth * 3, centerY)
        for (
            let x = this.centerX - positionWidth * 3;
            x <= this.centerX + positionWidth * 3;
            x += 2
        ) {
            const distFromCenter = x - this.centerX
            const envelope = Math.exp(
                -(distFromCenter * distFromCenter) / (positionWidth * positionWidth * 2)
            )
            g.lineTo(x, centerY + amplitude * envelope)
        }
        g.stroke({ color: pixiColors.distance, width: 1.5, alpha: 0.5 })

        // Center line
        g.moveTo(0, centerY)
        g.lineTo(this.width, centerY)
        g.stroke({ color: 0x444466, width: 1, alpha: 0.3 })
    }

    private drawMomentumDistribution(momentumSpread: number): void {
        const g = this.momentumGraphics
        g.clear()

        const barY = this.height - 80
        const barHeight = 40
        const numBars = 25

        // Draw momentum distribution bars (Gaussian shape, inverse to position)
        for (let i = 0; i < numBars; i++) {
            const barX = this.centerX + (i - numBars / 2) * 8
            const distFromCenter = (i - numBars / 2) / (numBars / 2)

            // Gaussian distribution width is proportional to momentum spread
            const normalizedSpread = momentumSpread / 150
            const gaussianWidth = 0.3 + normalizedSpread * 0.7
            const height = Math.exp(
                -(distFromCenter * distFromCenter) / (gaussianWidth * gaussianWidth * 2)
            )

            const barActualHeight = height * barHeight
            const alpha = 0.3 + height * 0.5

            g.roundRect(barX - 3, barY - barActualHeight, 6, barActualHeight, 2)
            g.fill({ color: pixiColors.velocity, alpha })
        }

        // Momentum distribution label background
        g.roundRect(this.centerX - 35, barY + 5, 70, 18, 4)
        g.fill({ color: 0x000000, alpha: 0.3 })
    }

    private drawIndicators(
        positionWidth: number,
        momentumSpread: number,
        Dx: number,
        Dp: number
    ): void {
        const g = this.indicatorGraphics
        g.clear()

        // Position uncertainty indicator (Δx)
        const posIndicatorY = this.centerY + 60
        const posBarWidth = positionWidth * 2

        // Δx bar
        g.moveTo(this.centerX - posBarWidth, posIndicatorY)
        g.lineTo(this.centerX + posBarWidth, posIndicatorY)
        g.stroke({ color: pixiColors.distance, width: 3 })

        // End caps
        g.moveTo(this.centerX - posBarWidth, posIndicatorY - 8)
        g.lineTo(this.centerX - posBarWidth, posIndicatorY + 8)
        g.moveTo(this.centerX + posBarWidth, posIndicatorY - 8)
        g.lineTo(this.centerX + posBarWidth, posIndicatorY + 8)
        g.stroke({ color: pixiColors.distance, width: 2 })

        // Δx label circle
        g.circle(this.centerX, posIndicatorY - 18, 14)
        g.fill({ color: pixiColors.distance, alpha: 0.3 })
        g.stroke({ color: pixiColors.distance, width: 1.5 })

        // Tradeoff arrows between Δx and Δp sections
        const arrowY = this.height - 120

        // Inverse relationship visualization
        // Draw double arrow showing inverse relationship
        const arrowStartX = this.centerX - 60
        const arrowEndX = this.centerX + 60

        // Dotted line with arrows
        for (let x = arrowStartX; x < arrowEndX; x += 10) {
            g.moveTo(x, arrowY)
            g.lineTo(Math.min(x + 5, arrowEndX), arrowY)
        }
        g.stroke({ color: 0x888888, width: 1.5 })

        // Arrow heads (bidirectional)
        g.moveTo(arrowStartX, arrowY)
        g.lineTo(arrowStartX + 8, arrowY - 5)
        g.moveTo(arrowStartX, arrowY)
        g.lineTo(arrowStartX + 8, arrowY + 5)
        g.moveTo(arrowEndX, arrowY)
        g.lineTo(arrowEndX - 8, arrowY - 5)
        g.moveTo(arrowEndX, arrowY)
        g.lineTo(arrowEndX - 8, arrowY + 5)
        g.stroke({ color: 0x888888, width: 1.5 })

        // Product indicator (ΔxΔp ≥ ℏ/2)
        const productY = arrowY - 25
        const minProduct = 0.528 // ℏ/2 in our units
        const actualProduct = Dx * Dp
        const fillRatio = Math.min(1, minProduct / actualProduct)

        // Background bar
        g.roundRect(this.centerX - 50, productY - 6, 100, 12, 4)
        g.fill({ color: 0x333344, alpha: 0.5 })

        // Filled portion (always at minimum since Δp = ℏ/(2Δx))
        g.roundRect(this.centerX - 50, productY - 6, 100 * fillRatio, 12, 4)
        g.fill({ color: 0x58d68d, alpha: 0.7 })
    }
}
