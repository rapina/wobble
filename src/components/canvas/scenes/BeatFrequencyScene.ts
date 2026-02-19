import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Wobble, WobbleExpression } from '../Wobble'

export class BeatFrequencyScene extends BaseScene {
    declare private graphics: Graphics
    declare private waveGraphics: Graphics
    declare private time: number
    declare private wave1Phase: number
    declare private wave2Phase: number

    // Wobble characters
    declare private wobble1: Wobble // f1 tuning fork
    declare private wobble2: Wobble // f2 tuning fork
    declare private wobbleBeat: Wobble // Combined beat character

    // Animation state
    declare private wobble1BaseY: number
    declare private wobble2BaseY: number
    declare private beatBaseY: number

    protected setup(): void {
        this.time = 0
        this.wave1Phase = 0
        this.wave2Phase = 0

        // Graphics layers
        this.waveGraphics = new Graphics()
        this.container.addChild(this.waveGraphics)

        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        // Base Y positions
        const topY = this.height * 0.25
        this.wobble1BaseY = topY
        this.wobble2BaseY = topY
        this.beatBaseY = this.height * 0.62

        // f1 Wobble (left tuning fork) - blue
        this.wobble1 = new Wobble({
            size: 45,
            color: 0x3498db,
            shape: 'circle',
            expression: 'happy',
        })
        this.wobble1.setPosition(this.width * 0.25, this.wobble1BaseY)
        this.container.addChild(this.wobble1)

        // f2 Wobble (right tuning fork) - red
        this.wobble2 = new Wobble({
            size: 45,
            color: 0xe74c3c,
            shape: 'circle',
            expression: 'happy',
        })
        this.wobble2.setPosition(this.width * 0.75, this.wobble2BaseY)
        this.container.addChild(this.wobble2)

        // Beat Wobble (center - combined) - purple
        this.wobbleBeat = new Wobble({
            size: 55,
            color: 0x9b59b6,
            shape: 'star',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: 0x9b59b6,
        })
        this.wobbleBeat.setPosition(this.centerX, this.beatBaseY)
        this.container.addChild(this.wobbleBeat)
    }

    protected onVariablesChange(): void {
        // Handled in animate
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.016

        const f1 = this.variables['f₁'] || 440
        const f2 = this.variables['f₂'] || 445
        const fbeat = Math.abs(f1 - f2)

        // Update phases based on frequencies
        // Scale frequencies to visible oscillation speeds
        const speedScale = 0.015
        this.wave1Phase += f1 * speedScale * delta
        this.wave2Phase += f2 * speedScale * delta

        // Update wobbles
        this.updateWobbles(f1, f2, fbeat, delta)

        // Draw visual elements
        this.drawScene(f1, f2, fbeat)
    }

    private updateWobbles(f1: number, f2: number, fbeat: number, delta: number): void {
        const oscillationAmplitude = 20

        // f1 wobble oscillation (vertical movement)
        const y1Offset = Math.sin(this.wave1Phase) * oscillationAmplitude
        this.wobble1.setPosition(this.width * 0.25, this.wobble1BaseY + y1Offset)

        // f2 wobble oscillation
        const y2Offset = Math.sin(this.wave2Phase) * oscillationAmplitude
        this.wobble2.setPosition(this.width * 0.75, this.wobble2BaseY + y2Offset)

        // Beat wobble - pulsates based on beat frequency
        const beatPhase = (this.wave1Phase + this.wave2Phase) / 2
        const beatEnvelope =
            fbeat > 0
                ? Math.abs(Math.cos(((this.wave1Phase - this.wave2Phase) / 2) * (fbeat / 50)))
                : 1

        // Scale wobbleBeat based on beat envelope
        const baseSize = 55
        const sizeVariation = fbeat > 0 ? 15 * beatEnvelope : 0
        const beatSize = baseSize + sizeVariation

        // Vertical wobble for beat character (slower, smoother)
        const beatYOffset = Math.sin(beatPhase * 0.5) * 8 * beatEnvelope
        this.wobbleBeat.setPosition(this.centerX, this.beatBaseY + beatYOffset)

        // Determine expressions based on beat frequency
        let expr1: WobbleExpression = 'happy'
        let expr2: WobbleExpression = 'happy'
        let exprBeat: WobbleExpression = 'happy'

        if (fbeat === 0) {
            // Perfect tune - everyone happy!
            expr1 = 'happy'
            expr2 = 'happy'
            exprBeat = 'excited'
        } else if (fbeat <= 5) {
            // Slow beats - calm, listening
            expr1 = 'happy'
            expr2 = 'happy'
            exprBeat = 'happy'
        } else if (fbeat <= 20) {
            // Medium beats - slightly stressed
            expr1 = 'effort'
            expr2 = 'effort'
            exprBeat = 'worried'
        } else if (fbeat <= 50) {
            // Fast beats - getting dizzy
            expr1 = 'worried'
            expr2 = 'worried'
            exprBeat = 'dizzy'
        } else {
            // Very different frequencies - chaotic
            expr1 = 'struggle'
            expr2 = 'struggle'
            exprBeat = 'struggle'
        }

        // Update wobble1 (f1)
        const stretch1 = 1 + Math.abs(Math.sin(this.wave1Phase)) * 0.1
        this.wobble1.updateOptions({
            wobblePhase: this.time * 4,
            scaleX: 1 / stretch1,
            scaleY: stretch1,
            expression: expr1,
        })

        // Update wobble2 (f2)
        const stretch2 = 1 + Math.abs(Math.sin(this.wave2Phase)) * 0.1
        this.wobble2.updateOptions({
            wobblePhase: this.time * 4.2,
            scaleX: 1 / stretch2,
            scaleY: stretch2,
            expression: expr2,
        })

        // Update beat wobble
        const beatStretch = fbeat > 0 ? 1 + beatEnvelope * 0.15 : 1.05
        this.wobbleBeat.updateOptions({
            size: beatSize,
            wobblePhase: this.time * 3,
            scaleX: beatStretch,
            scaleY: 2 - beatStretch,
            expression: exprBeat,
            glowIntensity: fbeat === 0 ? 0.6 : 0.2 + beatEnvelope * 0.3,
            glowColor: fbeat === 0 ? 0x2ecc71 : 0x9b59b6,
        })
    }

    private drawScene(f1: number, f2: number, fbeat: number): void {
        this.drawWaves(f1, f2, fbeat)
        this.drawLabels(f1, f2, fbeat)
        this.drawBeatMeter(fbeat)
        this.drawSoundWaves(f1, f2)
    }

    private drawWaves(f1: number, f2: number, fbeat: number): void {
        const g = this.waveGraphics
        g.clear()

        const waveY = this.height * 0.45
        const waveLeft = 30
        const waveRight = this.width - 30
        const waveWidth = waveRight - waveLeft
        const amplitude = 15

        // Background for wave area
        g.roundRect(waveLeft - 5, waveY - 25, waveWidth + 10, 50, 8)
        g.fill({ color: 0x000000, alpha: 0.15 })

        // Draw combined wave pattern
        const wavelength1 = 5000 / f1
        const wavelength2 = 5000 / f2

        // Combined wave
        g.moveTo(waveLeft, waveY)
        for (let x = 0; x <= waveWidth; x += 2) {
            const wave1 = Math.sin((x / wavelength1) * Math.PI * 2 + this.wave1Phase)
            const wave2 = Math.sin((x / wavelength2) * Math.PI * 2 + this.wave2Phase)
            const combined = (wave1 + wave2) / 2
            const y = waveY + combined * amplitude
            g.lineTo(waveLeft + x, y)
        }
        g.stroke({ color: 0x9b59b6, width: 3, alpha: 0.8 })

        // Beat envelope (if visible)
        if (fbeat > 0 && fbeat < 80) {
            const beatWavelength = 5000 / fbeat

            // Upper envelope
            g.moveTo(waveLeft, waveY - amplitude)
            for (let x = 0; x <= waveWidth; x += 4) {
                const envelope = Math.abs(
                    Math.cos((x / beatWavelength) * Math.PI + this.time * fbeat * 0.08)
                )
                g.lineTo(waveLeft + x, waveY - envelope * amplitude)
            }
            g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.5 })

            // Lower envelope
            g.moveTo(waveLeft, waveY + amplitude)
            for (let x = 0; x <= waveWidth; x += 4) {
                const envelope = Math.abs(
                    Math.cos((x / beatWavelength) * Math.PI + this.time * fbeat * 0.08)
                )
                g.lineTo(waveLeft + x, waveY + envelope * amplitude)
            }
            g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.5 })
        }

        // Center line
        g.moveTo(waveLeft, waveY)
        g.lineTo(waveRight, waveY)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.2 })
    }

    private drawLabels(f1: number, f2: number, fbeat: number): void {
        const g = this.graphics
        g.clear()

        // f1 label (below wobble1)
        const label1X = this.width * 0.25
        const label1Y = this.wobble1BaseY + 50
        g.roundRect(label1X - 30, label1Y, 60, 22, 6)
        g.fill({ color: 0x3498db, alpha: 0.3 })
        g.stroke({ color: 0x3498db, width: 2, alpha: 0.6 })

        // f2 label (below wobble2)
        const label2X = this.width * 0.75
        const label2Y = this.wobble2BaseY + 50
        g.roundRect(label2X - 30, label2Y, 60, 22, 6)
        g.fill({ color: 0xe74c3c, alpha: 0.3 })
        g.stroke({ color: 0xe74c3c, width: 2, alpha: 0.6 })

        // Connection lines from wobbles to combined wave
        const waveY = this.height * 0.45

        // Line from wobble1 to wave
        g.moveTo(label1X, label1Y + 22)
        g.quadraticCurveTo(label1X, waveY - 30, this.width * 0.35, waveY)
        g.stroke({ color: 0x3498db, width: 2, alpha: 0.3 })

        // Line from wobble2 to wave
        g.moveTo(label2X, label2Y + 22)
        g.quadraticCurveTo(label2X, waveY - 30, this.width * 0.65, waveY)
        g.stroke({ color: 0xe74c3c, width: 2, alpha: 0.3 })

        // Line from wave to beat wobble
        g.moveTo(this.centerX, waveY + 25)
        g.lineTo(this.centerX, this.beatBaseY - 45)
        g.stroke({ color: 0x9b59b6, width: 2, alpha: 0.3 })

        // Beat frequency label (below beat wobble)
        const beatLabelY = this.beatBaseY + 55
        g.roundRect(this.centerX - 40, beatLabelY, 80, 24, 6)

        // Color based on beat frequency
        let beatColor = 0x2ecc71 // Green for perfect tune
        if (fbeat > 0 && fbeat <= 10) {
            beatColor = 0x2ecc71
        } else if (fbeat > 10 && fbeat <= 30) {
            beatColor = 0xf39c12
        } else if (fbeat > 30) {
            beatColor = 0xe74c3c
        }

        g.fill({ color: beatColor, alpha: 0.3 })
        g.stroke({ color: beatColor, width: 2, alpha: 0.7 })

        // Perfect tune indicator
        if (fbeat === 0) {
            // Celebration ring around beat wobble
            const ringRadius = 50 + Math.sin(this.time * 4) * 5
            g.circle(this.centerX, this.beatBaseY, ringRadius)
            g.stroke({ color: 0x2ecc71, width: 3, alpha: 0.5 + Math.sin(this.time * 6) * 0.3 })

            // Sparkles
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + this.time * 2
                const sparkleR = 60 + Math.sin(this.time * 3 + i) * 10
                const sx = this.centerX + Math.cos(angle) * sparkleR
                const sy = this.beatBaseY + Math.sin(angle) * sparkleR
                g.star(sx, sy, 4, 6, 3)
                g.fill({ color: 0xffd700, alpha: 0.6 + Math.sin(this.time * 4 + i) * 0.3 })
            }
        }
    }

    private drawBeatMeter(fbeat: number): void {
        const g = this.graphics
        const meterX = this.centerX - 70
        const meterY = this.height - 38
        const meterWidth = 140
        const meterHeight = 16

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 6)
        g.fill({ color: 0x222222, alpha: 0.8 })

        // Fill based on beat frequency
        const maxBeat = 100
        const fillRatio = Math.min(fbeat / maxBeat, 1)

        // Color gradient based on audibility
        let fillColor = 0x2ecc71 // Perfect tune (0 Hz) - green
        if (fbeat > 0 && fbeat <= 10) {
            fillColor = 0x2ecc71 // Audible beats - green
        } else if (fbeat > 10 && fbeat <= 30) {
            fillColor = 0xf39c12 // Fast beats - orange
        } else if (fbeat > 30) {
            fillColor = 0xe74c3c // Rough/dissonant - red
        }

        if (fillRatio > 0) {
            g.roundRect(meterX + 2, meterY + 2, (meterWidth - 4) * fillRatio, meterHeight - 4, 4)
            g.fill({ color: fillColor, alpha: 0.9 })
        }

        // Perfect tune glow
        if (fbeat === 0) {
            g.roundRect(meterX, meterY, meterWidth, meterHeight, 6)
            g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.8 + Math.sin(this.time * 5) * 0.2 })
        }

        // Border
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 6)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })

        // Zone markers
        const zone10X = meterX + (10 / maxBeat) * meterWidth
        const zone30X = meterX + (30 / maxBeat) * meterWidth

        g.moveTo(zone10X, meterY)
        g.lineTo(zone10X, meterY + meterHeight)
        g.stroke({ color: 0x2ecc71, width: 1, alpha: 0.4 })

        g.moveTo(zone30X, meterY)
        g.lineTo(zone30X, meterY + meterHeight)
        g.stroke({ color: 0xf39c12, width: 1, alpha: 0.4 })
    }

    private drawSoundWaves(f1: number, f2: number): void {
        const g = this.graphics

        // Sound wave rings from wobble1
        const numRings1 = 3
        for (let i = 0; i < numRings1; i++) {
            const phase = (this.time * 2 + i * 0.5) % 1
            const radius = 35 + phase * 40
            const alpha = (1 - phase) * 0.3
            g.circle(this.width * 0.25, this.wobble1BaseY, radius)
            g.stroke({ color: 0x3498db, width: 2, alpha })
        }

        // Sound wave rings from wobble2
        const numRings2 = 3
        for (let i = 0; i < numRings2; i++) {
            const phase = (this.time * 2.1 + i * 0.5) % 1 // Slightly different timing
            const radius = 35 + phase * 40
            const alpha = (1 - phase) * 0.3
            g.circle(this.width * 0.75, this.wobble2BaseY, radius)
            g.stroke({ color: 0xe74c3c, width: 2, alpha })
        }
    }
}
