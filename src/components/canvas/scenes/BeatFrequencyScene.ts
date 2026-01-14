import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'

export class BeatFrequencyScene extends BaseScene {
    declare private graphics: Graphics
    declare private time: number
    declare private wave1Phase: number
    declare private wave2Phase: number

    protected setup(): void {
        this.time = 0
        this.wave1Phase = 0
        this.wave2Phase = 0

        this.graphics = new Graphics()
        this.container.addChild(this.graphics)
    }

    protected onVariablesChange(): void {
        // Handled in animate
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.001

        const f1 = this.variables['f₁'] || 440
        const f2 = this.variables['f₂'] || 445
        const fbeat = Math.abs(f1 - f2)

        // Update phases
        this.wave1Phase += f1 * 0.0005 * delta
        this.wave2Phase += f2 * 0.0005 * delta

        this.drawScene(f1, f2, fbeat)
    }

    private drawScene(f1: number, f2: number, fbeat: number): void {
        const g = this.graphics
        g.clear()

        const waveY1 = this.centerY - 60
        const waveY2 = this.centerY
        const waveY3 = this.centerY + 70
        const waveLeft = 30
        const waveRight = this.width - 30
        const waveWidth = waveRight - waveLeft

        // Wave 1 (f1)
        this.drawWave(g, waveLeft, waveY1, waveWidth, f1, this.wave1Phase, 0x3498db, 'f₁')

        // Wave 2 (f2)
        this.drawWave(g, waveLeft, waveY2, waveWidth, f2, this.wave2Phase, 0xe74c3c, 'f₂')

        // Combined wave (beat pattern)
        this.drawBeatWave(g, waveLeft, waveY3, waveWidth, f1, f2, fbeat)

        // Beat frequency indicator
        this.drawBeatMeter(g, fbeat)
    }

    private drawWave(
        g: Graphics,
        startX: number,
        centerY: number,
        width: number,
        freq: number,
        phase: number,
        color: number,
        label: string
    ): void {
        const amplitude = 25
        const wavelength = 5000 / freq // Higher freq = shorter wavelength

        // Wave background
        g.roundRect(startX - 5, centerY - 35, width + 10, 50, 6)
        g.fill({ color: 0x000000, alpha: 0.15 })

        // Draw wave
        g.moveTo(startX, centerY)
        for (let x = 0; x <= width; x += 2) {
            const y = centerY + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amplitude
            g.lineTo(startX + x, y)
        }
        g.stroke({ color, width: 2.5, alpha: 0.9 })

        // Center line
        g.moveTo(startX, centerY)
        g.lineTo(startX + width, centerY)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.2 })

        // Label
        g.circle(startX - 15, centerY, 6)
        g.fill({ color, alpha: 0.8 })
    }

    private drawBeatWave(
        g: Graphics,
        startX: number,
        centerY: number,
        width: number,
        f1: number,
        f2: number,
        fbeat: number
    ): void {
        const amplitude = 25

        // Wave background
        g.roundRect(startX - 5, centerY - 40, width + 10, 60, 6)
        g.fill({ color: 0x000000, alpha: 0.2 })

        // Calculate combined wave
        const wavelength1 = 5000 / f1
        const wavelength2 = 5000 / f2
        const beatWavelength = fbeat > 0 ? 5000 / fbeat : width * 10

        // Draw combined wave with beat envelope
        g.moveTo(startX, centerY)
        for (let x = 0; x <= width; x += 2) {
            const wave1 = Math.sin((x / wavelength1) * Math.PI * 2 + this.wave1Phase)
            const wave2 = Math.sin((x / wavelength2) * Math.PI * 2 + this.wave2Phase)
            const combined = (wave1 + wave2) / 2
            const y = centerY + combined * amplitude
            g.lineTo(startX + x, y)
        }
        g.stroke({ color: 0x9b59b6, width: 3, alpha: 0.9 })

        // Beat envelope (if fbeat is visible)
        if (fbeat > 0 && fbeat < 50) {
            // Upper envelope
            g.moveTo(startX, centerY - amplitude)
            for (let x = 0; x <= width; x += 4) {
                const envelope = Math.abs(Math.cos((x / beatWavelength) * Math.PI + this.time * fbeat * 0.1))
                g.lineTo(startX + x, centerY - envelope * amplitude)
            }
            g.stroke({ color: 0x2ecc71, width: 1.5, alpha: 0.5 })

            // Lower envelope
            g.moveTo(startX, centerY + amplitude)
            for (let x = 0; x <= width; x += 4) {
                const envelope = Math.abs(Math.cos((x / beatWavelength) * Math.PI + this.time * fbeat * 0.1))
                g.lineTo(startX + x, centerY + envelope * amplitude)
            }
            g.stroke({ color: 0x2ecc71, width: 1.5, alpha: 0.5 })
        }

        // Center line
        g.moveTo(startX, centerY)
        g.lineTo(startX + width, centerY)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.2 })

        // Label
        g.circle(startX - 15, centerY, 8)
        g.fill({ color: 0x9b59b6, alpha: 0.8 })
    }

    private drawBeatMeter(g: Graphics, fbeat: number): void {
        const meterX = this.centerX - 60
        const meterY = this.height - 35
        const meterWidth = 120
        const meterHeight = 14

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.fill({ color: 0x222222, alpha: 0.7 })

        // Fill based on beat frequency
        const maxBeat = 100
        const fillRatio = Math.min(fbeat / maxBeat, 1)

        // Color based on audibility
        let fillColor = 0x2ecc71 // Perfect tune (0 Hz)
        if (fbeat > 0 && fbeat <= 10) {
            fillColor = 0x2ecc71 // Audible beats
        } else if (fbeat > 10 && fbeat <= 30) {
            fillColor = 0xf39c12 // Fast beats
        } else if (fbeat > 30) {
            fillColor = 0xe74c3c // Rough/dissonant
        }

        if (fillRatio > 0) {
            g.roundRect(meterX, meterY, meterWidth * fillRatio, meterHeight, 5)
            g.fill({ color: fillColor, alpha: 0.85 })
        }

        // Perfect tune indicator
        if (fbeat === 0) {
            g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
            g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.9 })
        }

        // Border
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })

        // Tuning zone markers
        const tuneZoneX = meterX + (10 / maxBeat) * meterWidth
        g.moveTo(tuneZoneX, meterY)
        g.lineTo(tuneZoneX, meterY + meterHeight)
        g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.6 })
    }
}
