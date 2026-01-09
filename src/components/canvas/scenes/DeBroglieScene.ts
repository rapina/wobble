import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression, BlobShape } from '../Blob'
import { pixiColors } from '../../../utils/pixiHelpers'

interface WavePacket {
    phase: number
    amplitude: number
}

export class DeBroglieScene extends BaseScene {
    declare private particleBlob: Blob
    declare private waveGraphics: Graphics
    declare private probabilityGraphics: Graphics
    declare private indicatorGraphics: Graphics
    declare private glowGraphics: Graphics
    declare private time: number
    declare private posX: number
    declare private wavePackets: WavePacket[]
    declare private dualityPhase: number

    protected setup(): void {
        this.time = 0
        this.posX = this.width * 0.3
        this.dualityPhase = 0
        this.wavePackets = []

        // Initialize wave packets for interference
        for (let i = 0; i < 8; i++) {
            this.wavePackets.push({
                phase: i * 0.5,
                amplitude: 1 - Math.abs(i - 4) * 0.15,
            })
        }

        // Glow layer
        this.glowGraphics = new Graphics()
        this.container.addChild(this.glowGraphics)

        // Probability density
        this.probabilityGraphics = new Graphics()
        this.container.addChild(this.probabilityGraphics)

        // Matter wave
        this.waveGraphics = new Graphics()
        this.container.addChild(this.waveGraphics)

        // Wavelength indicator
        this.indicatorGraphics = new Graphics()
        this.container.addChild(this.indicatorGraphics)

        // Particle (showing wave-particle duality)
        this.particleBlob = new Blob({
            size: 25,
            color: pixiColors.mass,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: pixiColors.wavelength,
        })
        this.container.addChild(this.particleBlob)
    }

    protected onVariablesChange(): void {
        // m is in units of ×10⁻³¹ kg (range 1-20), v is in units of ×10⁶ m/s
        const m = this.variables['m'] || 9.1

        // Size scales with mass: 15-30 range for m=1-20
        const size = 15 + (m / 20) * 15
        this.particleBlob.updateOptions({ size })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const dt = delta * 0.016
        this.time += dt
        this.dualityPhase += dt * 0.5

        // Variables from formula: m (1-20), v (0.1-10), λ (nm)
        const v = this.variables['v'] || 1 // ×10⁶ m/s
        const lambda = this.variables['λ'] || 0.73 // nm
        const m = this.variables['m'] || 9.1 // ×10⁻³¹ kg

        // Scale wavelength for visibility (lambda in nm, range ~0.03 to 6.6)
        const scaledLambda = 30 + lambda * 15
        const speed = 0.5 + v * 0.3

        // Move particle with wave-like motion
        this.posX += speed * delta
        if (this.posX > this.width + 50) {
            this.posX = -50
        }

        // Particle vertical oscillation matching wave
        const wavePhase = (this.posX / scaledLambda) * Math.PI * 2
        const waveY = Math.sin(wavePhase - this.time * 3) * 25

        // Expression based on velocity (v range: 0.1-10)
        let expression: BlobExpression = 'happy'
        if (v > 7) {
            expression = 'excited'
        } else if (v > 4) {
            expression = 'surprised'
        }

        // Duality effect - particle becomes more "wave-like" at high momentum
        const dualityFactor = Math.min(1, v / 10)
        const pulseScale = 1 + Math.sin(this.dualityPhase * 4) * 0.1 * dualityFactor

        this.particleBlob.setPosition(this.posX, this.centerY + waveY * 0.3)
        this.particleBlob.updateOptions({
            wobblePhase: this.time * (2 + speed),
            expression,
            scaleX: pulseScale,
            scaleY: pulseScale,
            glowIntensity: 0.2 + dualityFactor * 0.3,
            showSpeedLines: v > 5,
            speedDirection: Math.PI,
            lookDirection: { x: 1, y: waveY * 0.02 },
        })

        this.drawGlow(scaledLambda, dualityFactor)
        this.drawProbabilityDensity(scaledLambda)
        this.drawMatterWave(scaledLambda)
        this.drawIndicator(scaledLambda, lambda)
    }

    private drawGlow(scaledLambda: number, dualityFactor: number): void {
        const g = this.glowGraphics
        g.clear()

        // Glow around particle showing wave nature
        const glowRadius = 40 + dualityFactor * 30
        for (let i = 3; i >= 0; i--) {
            const r = glowRadius + i * 15
            const alpha = 0.08 * (1 - i * 0.2) * dualityFactor
            g.circle(this.posX, this.centerY, r)
            g.fill({ color: pixiColors.wavelength, alpha })
        }
    }

    private drawProbabilityDensity(scaledLambda: number): void {
        const g = this.probabilityGraphics
        g.clear()

        // Draw probability density |ψ|² as filled region
        const amplitude = 30
        const envelopeWidth = scaledLambda * 3

        // Gaussian envelope centered on particle
        for (let x = 0; x <= this.width; x += 3) {
            const distFromParticle = x - this.posX
            const envelope = Math.exp(
                -(distFromParticle * distFromParticle) / (envelopeWidth * envelopeWidth)
            )

            const phase = (x / scaledLambda) * Math.PI * 2 - this.time * 3
            const waveValue = Math.sin(phase)
            const probability = waveValue * waveValue * envelope

            if (probability > 0.01) {
                const height = probability * amplitude * 2
                g.rect(x - 1, this.centerY - height / 2, 2, height)
                g.fill({ color: pixiColors.wavelength, alpha: probability * 0.3 })
            }
        }
    }

    private drawMatterWave(scaledLambda: number): void {
        const g = this.waveGraphics
        g.clear()

        const amplitude = 30
        const envelopeWidth = scaledLambda * 2.5

        // De Broglie wave with envelope
        g.moveTo(0, this.centerY)

        for (let x = 0; x <= this.width; x += 2) {
            // Gaussian envelope centered on particle position
            const distFromParticle = x - this.posX
            const envelope = Math.exp(
                -(distFromParticle * distFromParticle) / (envelopeWidth * envelopeWidth)
            )

            const phase = (x / scaledLambda) * Math.PI * 2 - this.time * 3
            const y = this.centerY + Math.sin(phase) * amplitude * envelope
            g.lineTo(x, y)
        }

        g.stroke({ color: pixiColors.wavelength, width: 3, alpha: 0.8 })

        // Draw wave crests with dots
        for (let x = 0; x <= this.width; x += scaledLambda / 2) {
            const distFromParticle = x - this.posX
            const envelope = Math.exp(
                -(distFromParticle * distFromParticle) / (envelopeWidth * envelopeWidth)
            )

            if (envelope > 0.2) {
                const phase = (x / scaledLambda) * Math.PI * 2 - this.time * 3
                const y = this.centerY + Math.sin(phase) * amplitude * envelope
                g.circle(x, y, 3 + envelope * 2)
                g.fill({ color: 0xffffff, alpha: envelope * 0.6 })
            }
        }

        // Center line (equilibrium)
        g.moveTo(0, this.centerY)
        g.lineTo(this.width, this.centerY)
        g.stroke({ color: 0x444466, width: 1, alpha: 0.3 })
    }

    private drawIndicator(scaledLambda: number, realLambda: number): void {
        const g = this.indicatorGraphics
        g.clear()

        const indicatorY = this.height - 45
        const startX = 40
        const endX = startX + scaledLambda

        // Wavelength indicator bar
        g.moveTo(startX, indicatorY)
        g.lineTo(endX, indicatorY)
        g.stroke({ color: 0xffffff, width: 2 })

        // End caps
        g.moveTo(startX, indicatorY - 8)
        g.lineTo(startX, indicatorY + 8)
        g.moveTo(endX, indicatorY - 8)
        g.lineTo(endX, indicatorY + 8)
        g.stroke({ color: 0xffffff, width: 2 })

        // λ symbol with circle background
        const labelX = (startX + endX) / 2
        g.circle(labelX, indicatorY - 18, 12)
        g.fill({ color: pixiColors.wavelength, alpha: 0.3 })
        g.circle(labelX, indicatorY - 18, 12)
        g.stroke({ color: pixiColors.wavelength, width: 1.5 })

        // Momentum indicator (p = h/λ)
        const momentumBarWidth = Math.min(80, 1000 / scaledLambda)
        const momentumX = this.width - 60

        // p indicator bar (inverse of λ)
        g.roundRect(momentumX - momentumBarWidth / 2, indicatorY - 5, momentumBarWidth, 10, 3)
        g.fill({ color: pixiColors.mass, alpha: 0.5 })

        g.circle(momentumX, indicatorY - 18, 10)
        g.fill({ color: pixiColors.mass, alpha: 0.3 })

        // Show relationship arrow (λ ↔ p)
        const arrowY = indicatorY - 18
        const arrowStartX = endX + 30
        const arrowEndX = momentumX - momentumBarWidth / 2 - 30

        if (arrowEndX > arrowStartX + 40) {
            // Dotted line
            for (let x = arrowStartX; x < arrowEndX; x += 8) {
                g.moveTo(x, arrowY)
                g.lineTo(Math.min(x + 4, arrowEndX), arrowY)
            }
            g.stroke({ color: 0x666688, width: 1 })

            // Double arrow heads
            g.moveTo(arrowStartX, arrowY)
            g.lineTo(arrowStartX + 6, arrowY - 4)
            g.moveTo(arrowStartX, arrowY)
            g.lineTo(arrowStartX + 6, arrowY + 4)

            g.moveTo(arrowEndX, arrowY)
            g.lineTo(arrowEndX - 6, arrowY - 4)
            g.moveTo(arrowEndX, arrowY)
            g.lineTo(arrowEndX - 6, arrowY + 4)
            g.stroke({ color: 0x666688, width: 1.5 })
        }
    }
}
