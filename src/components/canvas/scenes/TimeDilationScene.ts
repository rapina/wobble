import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression } from '../Blob'

type JourneyPhase = 'waiting' | 'traveling' | 'reunited'

export class TimeDilationScene extends BaseScene {
    declare private earthBlob: Blob
    declare private travelBlob: Blob
    declare private effectGraphics: Graphics
    declare private rocketGraphics: Graphics
    declare private time: number

    // Journey state
    declare private phase: JourneyPhase
    declare private phaseTime: number
    declare private orbitAngle: number // 0 to 2π for full orbit
    declare private earthAge: number
    declare private travelAge: number
    declare private orbitTrail: { x: number; y: number; alpha: number }[]

    protected setup(): void {
        this.time = 0
        this.phase = 'waiting'
        this.phaseTime = 0
        this.orbitAngle = 0
        this.earthAge = 0
        this.travelAge = 0
        this.orbitTrail = []

        this.effectGraphics = new Graphics()
        this.container.addChild(this.effectGraphics)

        this.rocketGraphics = new Graphics()
        this.container.addChild(this.rocketGraphics)

        // Earth blob (stays on Earth) - positioned on left side of Earth top
        this.earthBlob = new Blob({
            size: 35,
            color: 0x4ecdc4,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.2,
            glowColor: 0x4ecdc4,
        })
        this.earthBlob.setPosition(this.centerX - 25, this.centerY - 55)
        this.container.addChild(this.earthBlob)

        // Traveling blob - starts next to earth blob
        this.travelBlob = new Blob({
            size: 35,
            color: 0xff6b6b,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.2,
            glowColor: 0xff6b6b,
        })
        this.travelBlob.setPosition(this.centerX + 25, this.centerY - 55)
        this.container.addChild(this.travelBlob)
    }

    protected onVariablesChange(): void {
        this.resetJourney()
    }

    private resetJourney(): void {
        this.phase = 'waiting'
        this.phaseTime = 0
        this.orbitAngle = 0
        this.earthAge = 0
        this.travelAge = 0
        this.orbitTrail = []
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02
        this.phaseTime += delta * 0.016

        const t0 = this.variables['t₀'] ?? 1
        const v = Math.min(0.95, Math.max(0.1, this.variables['v'] ?? 0.5))

        // Lorentz factor
        const gamma = 1 / Math.sqrt(1 - v * v)

        // Orbit parameters - orbit starts/ends at blob position
        const startX = this.centerX + 25
        const startY = this.centerY - 55
        const orbitRadiusX = this.width * 0.35
        const orbitRadiusY = this.height * 0.35
        const orbitSpeed = 0.015 + v * 0.02

        switch (this.phase) {
            case 'waiting':
                if (this.phaseTime > 0.8) {
                    this.phase = 'traveling'
                    this.phaseTime = 0
                }
                break

            case 'traveling':
                // Progress through orbit
                this.orbitAngle += orbitSpeed * delta

                // Aging
                this.earthAge += 0.015 * delta * t0
                this.travelAge += (0.015 / gamma) * delta * t0

                // Add to trail
                if (this.time % 0.05 < 0.02) {
                    const trailX = startX + Math.sin(this.orbitAngle) * orbitRadiusX
                    const trailY = startY + (1 - Math.cos(this.orbitAngle)) * orbitRadiusY
                    this.orbitTrail.push({ x: trailX, y: trailY, alpha: 1 })
                }

                // Complete orbit
                if (this.orbitAngle >= Math.PI * 2) {
                    this.orbitAngle = Math.PI * 2
                    this.phase = 'reunited'
                    this.phaseTime = 0
                }
                break

            case 'reunited':
                if (this.phaseTime > 3) {
                    this.resetJourney()
                }
                break
        }

        // Fade trail
        this.orbitTrail.forEach((t) => (t.alpha *= 0.98))
        this.orbitTrail = this.orbitTrail.filter((t) => t.alpha > 0.05)

        // Calculate travel blob position
        if (this.phase === 'waiting' || this.phase === 'reunited') {
            // Side by side with earth blob
            this.travelBlob.setPosition(startX, startY)
        } else {
            // On orbit - same formula as trail
            const travelX = startX + Math.sin(this.orbitAngle) * orbitRadiusX
            const travelY = startY + (1 - Math.cos(this.orbitAngle)) * orbitRadiusY
            this.travelBlob.setPosition(travelX, travelY)
        }

        // Update appearances
        this.updateBlobAppearances(v, gamma)

        // Draw
        this.drawEffects(v, orbitRadiusX, orbitRadiusY, startX, startY)
        this.drawRocket(v, orbitRadiusX, orbitRadiusY, startX, startY)
        this.drawAgeIndicators()
    }

    private updateBlobAppearances(v: number, gamma: number): void {
        const earthAgeNorm = Math.min(1, this.earthAge / 2)

        let earthExpression: BlobExpression = 'happy'
        if (earthAgeNorm > 0.7) earthExpression = 'sleepy'
        else if (earthAgeNorm > 0.4) earthExpression = 'surprised'

        const earthColor = this.lerpColor(0x4ecdc4, 0x888899, earthAgeNorm)
        const earthSize = 35 - earthAgeNorm * 8

        this.earthBlob.updateOptions({
            wobblePhase: this.time * (1.5 - earthAgeNorm * 0.5),
            expression: earthExpression,
            color: earthColor,
            size: earthSize,
            glowIntensity: 0.2 - earthAgeNorm * 0.1,
        })

        // Travel blob
        const travelAgeNorm = Math.min(1, this.travelAge / 2)
        let travelExpression: BlobExpression = this.phase === 'traveling' ? 'excited' : 'happy'

        const travelSize = 35 - travelAgeNorm * 4
        const travelColor = this.lerpColor(0xff6b6b, 0xcc8888, travelAgeNorm * 0.3)

        // Direction for speed lines (tangent to orbit)
        const tangentAngle = this.orbitAngle + Math.PI / 2

        this.travelBlob.updateOptions({
            wobblePhase: this.time * 2,
            expression: travelExpression,
            color: travelColor,
            size: travelSize,
            showSpeedLines: this.phase === 'traveling',
            speedDirection: tangentAngle + Math.PI,
            glowIntensity: 0.2 + (this.phase === 'traveling' ? v * 0.3 : 0),
        })
    }

    private lerpColor(c1: number, c2: number, t: number): number {
        const r1 = (c1 >> 16) & 0xff,
            g1 = (c1 >> 8) & 0xff,
            b1 = c1 & 0xff
        const r2 = (c2 >> 16) & 0xff,
            g2 = (c2 >> 8) & 0xff,
            b2 = c2 & 0xff
        const r = Math.round(r1 + (r2 - r1) * t)
        const g = Math.round(g1 + (g2 - g1) * t)
        const b = Math.round(b1 + (b2 - b1) * t)
        return (r << 16) | (g << 8) | b
    }

    private drawEffects(
        v: number,
        orbitRX: number,
        orbitRY: number,
        startX: number,
        startY: number
    ): void {
        const g = this.effectGraphics
        g.clear()

        // Draw Earth globe in center (bigger to fit both blobs)
        const earthX = this.centerX
        const earthY = this.centerY + 20
        const earthRadius = 60

        // Shadow
        g.circle(earthX + 3, earthY + 3, earthRadius)
        g.fill({ color: 0x000000, alpha: 0.2 })

        // Ocean
        g.circle(earthX, earthY, earthRadius)
        g.fill({ color: 0x1e90ff, alpha: 0.8 })

        // Continents (scaled for bigger Earth)
        g.ellipse(earthX - 25, earthY - 8, 18, 26)
        g.fill({ color: 0x3d9970, alpha: 0.9 })
        g.ellipse(earthX + 15, earthY - 15, 14, 18)
        g.fill({ color: 0x3d9970, alpha: 0.9 })
        g.ellipse(earthX + 18, earthY + 15, 10, 16)
        g.fill({ color: 0x3d9970, alpha: 0.9 })
        g.ellipse(earthX + 38, earthY - 8, 15, 12)
        g.fill({ color: 0x3d9970, alpha: 0.9 })

        // Atmosphere
        g.circle(earthX, earthY, earthRadius + 8)
        g.stroke({ color: 0x87ceeb, width: 5, alpha: 0.3 })

        // Shine
        g.circle(earthX - 20, earthY - 25, 12)
        g.fill({ color: 0xffffff, alpha: 0.2 })

        // Draw orbit path (dotted ellipse) - same formula as blob movement
        for (let i = 0; i <= 40; i++) {
            const angle = (i / 40) * Math.PI * 2
            const dotX = startX + Math.sin(angle) * orbitRX
            const dotY = startY + (1 - Math.cos(angle)) * orbitRY
            g.circle(dotX, dotY, 2)
            g.fill({ color: 0x666677, alpha: 0.25 })
        }

        // Draw trail
        this.orbitTrail.forEach((t) => {
            g.circle(t.x, t.y, 4)
            g.fill({ color: 0xff6b6b, alpha: t.alpha * 0.5 })
        })

        // Stars in background
        const starPositions = [
            { x: 30, y: 40 },
            { x: this.width - 40, y: 50 },
            { x: 50, y: this.height - 60 },
            { x: this.width - 60, y: this.height - 50 },
            { x: this.width / 2, y: 30 },
        ]
        starPositions.forEach((s) => {
            const twinkle = 0.5 + Math.sin(this.time * 3 + s.x) * 0.3
            g.circle(s.x, s.y, 2)
            g.fill({ color: 0xffffff, alpha: twinkle })
        })
    }

    private drawRocket(
        v: number,
        orbitRX: number,
        orbitRY: number,
        startX: number,
        startY: number
    ): void {
        const g = this.rocketGraphics
        g.clear()

        if (this.phase !== 'traveling') return

        // Position on orbit - same formula as blob
        const cx = startX + Math.sin(this.orbitAngle) * orbitRX
        const cy = startY + (1 - Math.cos(this.orbitAngle)) * orbitRY

        // Tangent direction (derivative of position)
        const dx = Math.cos(this.orbitAngle) * orbitRX
        const dy = Math.sin(this.orbitAngle) * orbitRY
        const angle = Math.atan2(dy, dx)

        const cos = Math.cos(angle)
        const sin = Math.sin(angle)

        const rocketOffsetX = -25
        const rocketOffsetY = 0
        const rcx = cx + rocketOffsetX * cos - rocketOffsetY * sin
        const rcy = cy + rocketOffsetX * sin + rocketOffsetY * cos

        const rot = (x: number, y: number) => ({
            x: rcx + x * cos - y * sin,
            y: rcy + x * sin + y * cos,
        })

        // Flame
        const flameLength = 12 + v * 15 + Math.sin(this.time * 20) * 4

        const f1 = rot(-12, 0)
        const f2 = rot(-12 - flameLength, -4)
        const f3 = rot(-12 - flameLength * 0.7, 0)
        const f4 = rot(-12 - flameLength, 4)

        g.moveTo(f1.x, f1.y)
        g.lineTo(f2.x, f2.y)
        g.lineTo(f3.x, f3.y)
        g.lineTo(f4.x, f4.y)
        g.closePath()
        g.fill({ color: 0xff6600, alpha: 0.8 })

        // Inner flame
        const if2 = rot(-12 - flameLength * 0.5, -2)
        const if3 = rot(-12 - flameLength * 0.3, 0)
        const if4 = rot(-12 - flameLength * 0.5, 2)

        g.moveTo(f1.x, f1.y)
        g.lineTo(if2.x, if2.y)
        g.lineTo(if3.x, if3.y)
        g.lineTo(if4.x, if4.y)
        g.closePath()
        g.fill({ color: 0xffff00, alpha: 0.9 })

        // Rocket body
        const r1 = rot(15, 0)
        const r2 = rot(-8, -6)
        const r3 = rot(-8, 6)

        g.moveTo(r1.x, r1.y)
        g.lineTo(r2.x, r2.y)
        g.lineTo(r3.x, r3.y)
        g.closePath()
        g.fill({ color: 0xcccccc, alpha: 0.9 })

        // Window
        const w = rot(3, 0)
        g.circle(w.x, w.y, 3)
        g.fill({ color: 0x4488ff, alpha: 0.8 })
    }

    private drawAgeIndicators(): void {
        const g = this.effectGraphics

        const earthYears = Math.floor(this.earthAge * 30)
        const travelYears = Math.floor(this.travelAge * 30)

        // Earth blob age - always above the earth blob
        const earthBlobX = this.centerX - 25
        const earthAgeY = this.centerY - 105

        const earthAgeSize = 18 + Math.min(8, earthYears * 0.2)
        g.circle(earthBlobX, earthAgeY, earthAgeSize)
        g.fill({ color: 0x1a1a2e, alpha: 0.85 })
        g.circle(earthBlobX, earthAgeY, earthAgeSize)
        g.stroke({ color: 0x4ecdc4, width: 2, alpha: 0.8 })
        this.drawNumber(g, earthBlobX, earthAgeY, earthYears, 0x4ecdc4)

        // Travel age display
        if (this.phase === 'traveling') {
            // Follows blob during travel
            const travelDispX = this.travelBlob.x
            const travelDispY = this.travelBlob.y - 45

            const travelAgeSize = 18 + Math.min(8, travelYears * 0.2)
            g.circle(travelDispX, travelDispY, travelAgeSize)
            g.fill({ color: 0x1a1a2e, alpha: 0.85 })
            g.circle(travelDispX, travelDispY, travelAgeSize)
            g.stroke({ color: 0xff6b6b, width: 2, alpha: 0.8 })
            this.drawNumber(g, travelDispX, travelDispY, travelYears, 0xff6b6b)
        } else if (this.phase === 'reunited') {
            // Side by side above blobs when reunited
            const travelBlobX = this.centerX + 25

            const travelAgeSize = 18 + Math.min(8, travelYears * 0.2)
            g.circle(travelBlobX, earthAgeY, travelAgeSize)
            g.fill({ color: 0x1a1a2e, alpha: 0.85 })
            g.circle(travelBlobX, earthAgeY, travelAgeSize)
            g.stroke({ color: 0xff6b6b, width: 2, alpha: 0.8 })
            this.drawNumber(g, travelBlobX, earthAgeY, travelYears, 0xff6b6b)
        }

        // Age comparison bar
        if (this.earthAge > 0) {
            const barX = this.centerX - 50
            const barY = this.height - 35
            const barWidth = 100

            g.roundRect(barX, barY, barWidth, 12, 6)
            g.fill({ color: 0x1a1a2e, alpha: 0.7 })

            const maxAge = Math.max(this.earthAge, this.travelAge, 0.01)
            const earthBarW = (this.earthAge / (maxAge * 2)) * barWidth
            const travelBarW = (this.travelAge / (maxAge * 2)) * barWidth

            g.roundRect(barX, barY, earthBarW, 12, 6)
            g.fill({ color: 0x4ecdc4, alpha: 0.8 })

            g.roundRect(barX + barWidth / 2, barY, travelBarW, 12, 6)
            g.fill({ color: 0xff6b6b, alpha: 0.8 })

            g.moveTo(barX + barWidth / 2, barY)
            g.lineTo(barX + barWidth / 2, barY + 12)
            g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
        }
    }

    private drawNumber(g: Graphics, x: number, y: number, num: number, color: number): void {
        const digits = num.toString().split('')
        const digitWidth = 7
        const startX = x - (digits.length * digitWidth) / 2

        digits.forEach((digit, i) => {
            const dx = startX + i * digitWidth + digitWidth / 2
            this.drawDigit(g, dx, y, parseInt(digit), color)
        })
    }

    private drawDigit(g: Graphics, x: number, y: number, digit: number, color: number): void {
        const w = 4,
            h = 7,
            t = 1.5

        const segments: Record<number, boolean[]> = {
            0: [true, true, true, true, true, true, false],
            1: [false, true, true, false, false, false, false],
            2: [true, true, false, true, true, false, true],
            3: [true, true, true, true, false, false, true],
            4: [false, true, true, false, false, true, true],
            5: [true, false, true, true, false, true, true],
            6: [true, false, true, true, true, true, true],
            7: [true, true, true, false, false, false, false],
            8: [true, true, true, true, true, true, true],
            9: [true, true, true, true, false, true, true],
        }

        const segs = segments[digit] || segments[0]

        if (segs[0]) {
            g.moveTo(x - w / 2, y - h / 2)
            g.lineTo(x + w / 2, y - h / 2)
            g.stroke({ color, width: t, alpha: 0.9 })
        }
        if (segs[1]) {
            g.moveTo(x + w / 2, y - h / 2)
            g.lineTo(x + w / 2, y)
            g.stroke({ color, width: t, alpha: 0.9 })
        }
        if (segs[2]) {
            g.moveTo(x + w / 2, y)
            g.lineTo(x + w / 2, y + h / 2)
            g.stroke({ color, width: t, alpha: 0.9 })
        }
        if (segs[3]) {
            g.moveTo(x - w / 2, y + h / 2)
            g.lineTo(x + w / 2, y + h / 2)
            g.stroke({ color, width: t, alpha: 0.9 })
        }
        if (segs[4]) {
            g.moveTo(x - w / 2, y)
            g.lineTo(x - w / 2, y + h / 2)
            g.stroke({ color, width: t, alpha: 0.9 })
        }
        if (segs[5]) {
            g.moveTo(x - w / 2, y - h / 2)
            g.lineTo(x - w / 2, y)
            g.stroke({ color, width: t, alpha: 0.9 })
        }
        if (segs[6]) {
            g.moveTo(x - w / 2, y)
            g.lineTo(x + w / 2, y)
            g.stroke({ color, width: t, alpha: 0.9 })
        }
    }
}
