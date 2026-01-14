import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface WaveRing {
    x: number
    radius: number
    alpha: number
}

export class DopplerScene extends BaseScene {
    declare private graphics: Graphics
    declare private sourceBlob: Blob
    declare private waveRings: WaveRing[]
    declare private sourceX: number
    declare private time: number
    declare private lastWaveTime: number

    protected setup(): void {
        this.time = 0
        this.lastWaveTime = 0
        this.waveRings = []
        this.sourceX = this.centerX

        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        this.sourceBlob = new Blob({
            size: 35,
            color: 0xe74c3c,
            shape: 'circle',
            expression: 'happy',
        })
        this.sourceBlob.setPosition(this.centerX, this.centerY)
        this.container.addChild(this.sourceBlob)
    }

    protected onVariablesChange(): void {
        // Handled in animate
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.05

        const f = this.variables['f'] || 300
        const v = this.variables['v'] || 340
        const vs = this.variables['vₛ'] || 30

        // Move source based on velocity
        const sourceSpeed = vs * 0.3
        this.sourceX += sourceSpeed * delta * 0.1

        // Wrap around
        if (this.sourceX > this.width + 50) this.sourceX = -50
        if (this.sourceX < -50) this.sourceX = this.width + 50

        // Emit waves at intervals based on frequency
        const waveInterval = 30 / (f / 100)
        if (this.time - this.lastWaveTime > waveInterval) {
            this.waveRings.push({
                x: this.sourceX,
                radius: 10,
                alpha: 0.8,
            })
            this.lastWaveTime = this.time
        }

        // Update waves
        const waveSpeed = v * 0.15
        this.waveRings.forEach((ring) => {
            ring.radius += waveSpeed * delta * 0.1
            ring.alpha -= 0.005 * delta
        })
        this.waveRings = this.waveRings.filter((r) => r.alpha > 0 && r.radius < 300)

        // Update source blob
        const expression = Math.abs(vs) > 50 ? 'excited' : 'happy'
        this.sourceBlob.setPosition(this.sourceX, this.centerY)
        this.sourceBlob.updateOptions({
            size: 35,
            wobblePhase: this.time * 3,
            expression,
        })

        this.drawScene(f, v, vs)
    }

    private drawScene(f: number, v: number, vs: number): void {
        const g = this.graphics
        g.clear()

        // Draw wave rings
        this.waveRings.forEach((ring) => {
            g.circle(ring.x, this.centerY, ring.radius)
            g.stroke({
                color: vs > 0 ? 0xe74c3c : vs < 0 ? 0x3498db : 0x9b59b6,
                width: 2,
                alpha: ring.alpha,
            })
        })

        // Draw observer on the right
        const observerX = this.width - 60
        g.circle(observerX, this.centerY, 15)
        g.fill({ color: 0x2ecc71, alpha: 0.8 })
        g.circle(observerX, this.centerY, 20)
        g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.5 })

        // Observer ears
        g.circle(observerX - 8, this.centerY - 10, 5)
        g.fill({ color: 0x27ae60, alpha: 0.9 })
        g.circle(observerX + 8, this.centerY - 10, 5)
        g.fill({ color: 0x27ae60, alpha: 0.9 })

        // Direction arrow
        if (vs !== 0) {
            const arrowX = this.sourceX + (vs > 0 ? 50 : -50)
            const arrowDir = vs > 0 ? 1 : -1
            g.moveTo(arrowX, this.centerY)
            g.lineTo(arrowX + arrowDir * 20, this.centerY)
            g.lineTo(arrowX + arrowDir * 15, this.centerY - 8)
            g.moveTo(arrowX + arrowDir * 20, this.centerY)
            g.lineTo(arrowX + arrowDir * 15, this.centerY + 8)
            g.stroke({ color: 0xffffff, width: 2, alpha: 0.7 })
        }

        // Frequency visualization
        this.drawFrequencyBars(g, f, vs, v)
    }

    private drawFrequencyBars(g: Graphics, f: number, vs: number, v: number): void {
        const fPrime = f * (v / (v - vs))
        const barY = this.height - 50
        const barWidth = 120
        const centerX = this.centerX

        // Original frequency bar
        g.roundRect(centerX - barWidth - 20, barY, barWidth, 16, 4)
        g.fill({ color: 0x9b59b6, alpha: 0.6 })
        g.roundRect(centerX - barWidth - 20, barY, barWidth * (f / 500), 16, 4)
        g.fill({ color: 0x9b59b6, alpha: 0.9 })

        // Observed frequency bar
        const observedRatio = Math.min(fPrime / 500, 1)
        const observedColor = fPrime > f ? 0xe74c3c : fPrime < f ? 0x3498db : 0x9b59b6
        g.roundRect(centerX + 20, barY, barWidth, 16, 4)
        g.fill({ color: 0x333333, alpha: 0.6 })
        g.roundRect(centerX + 20, barY, barWidth * observedRatio, 16, 4)
        g.fill({ color: observedColor, alpha: 0.9 })

        // Labels
        g.circle(centerX - barWidth / 2 - 20, barY + 25, 4)
        g.fill({ color: 0x9b59b6, alpha: 0.8 })
        g.circle(centerX + barWidth / 2 + 20, barY + 25, 4)
        g.fill({ color: observedColor, alpha: 0.8 })
    }
}
