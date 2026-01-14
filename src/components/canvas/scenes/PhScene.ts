import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface Ion {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    isHydrogen: boolean // true = H+, false = OH-
}

export class PhScene extends BaseScene {
    declare private beaker: Graphics
    declare private solution: Graphics
    declare private ions: Ion[]
    declare private ionBlobs: Blob[]
    declare private bubbles: { x: number; y: number; size: number; speed: number }[]
    declare private time: number

    protected setup(): void {
        this.time = 0
        this.ions = []
        this.ionBlobs = []
        this.bubbles = []

        this.beaker = new Graphics()
        this.container.addChild(this.beaker)

        this.solution = new Graphics()
        this.container.addChild(this.solution)

        // Initialize H+ ions
        for (let i = 0; i < 15; i++) {
            this.addIon(true)
        }

        // Initialize bubbles
        for (let i = 0; i < 8; i++) {
            this.bubbles.push({
                x: this.centerX - 60 + Math.random() * 120,
                y: this.centerY + 100,
                size: 2 + Math.random() * 4,
                speed: 0.3 + Math.random() * 0.5,
            })
        }
    }

    private addIon(isHydrogen: boolean): void {
        const beakerLeft = this.centerX - 70
        const beakerRight = this.centerX + 70
        const beakerTop = this.centerY - 40
        const beakerBottom = this.centerY + 80

        const x = beakerLeft + 20 + Math.random() * (beakerRight - beakerLeft - 40)
        const y = beakerTop + 20 + Math.random() * (beakerBottom - beakerTop - 40)

        const blob = new Blob({
            size: isHydrogen ? 16 : 12,
            color: isHydrogen ? 0xe74c3c : 0x3498db,
            shape: 'circle',
            expression: isHydrogen ? 'excited' : 'sleepy',
        })
        blob.setPosition(x, y)
        this.container.addChild(blob)
        this.ionBlobs.push(blob)

        this.ions.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: isHydrogen ? 16 : 12,
            isHydrogen,
        })
    }

    private removeIon(isHydrogen: boolean): void {
        for (let i = this.ions.length - 1; i >= 0; i--) {
            if (this.ions[i].isHydrogen === isHydrogen) {
                const blob = this.ionBlobs[i]
                this.container.removeChild(blob)
                blob.destroy()
                this.ionBlobs.splice(i, 1)
                this.ions.splice(i, 1)
                return
            }
        }
    }

    protected onVariablesChange(): void {
        const hConc = this.variables['[H⁺]'] || 0.0001

        // Calculate target H+ ion count based on concentration (log scale)
        // Range: 0.0000001 (pH 7) to 1 (pH 0)
        const logConc = -Math.log10(hConc) // 0 to 7
        const targetHIons = Math.max(3, Math.min(20, Math.floor(20 - logConc * 2.5)))

        // Count current H+ ions
        const currentHIons = this.ions.filter((i) => i.isHydrogen).length

        // Add or remove H+ ions to match target
        if (currentHIons < targetHIons) {
            for (let i = 0; i < targetHIons - currentHIons; i++) {
                this.addIon(true)
            }
        } else if (currentHIons > targetHIons) {
            for (let i = 0; i < currentHIons - targetHIons; i++) {
                this.removeIon(true)
            }
        }

        // Adjust OH- ions (inverse relationship)
        const targetOHIons = Math.max(3, Math.min(15, Math.floor(logConc * 2)))
        const currentOHIons = this.ions.filter((i) => !i.isHydrogen).length

        if (currentOHIons < targetOHIons) {
            for (let i = 0; i < targetOHIons - currentOHIons; i++) {
                this.addIon(false)
            }
        } else if (currentOHIons > targetOHIons) {
            for (let i = 0; i < currentOHIons - targetOHIons; i++) {
                this.removeIon(false)
            }
        }
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const hConc = this.variables['[H⁺]'] || 0.0001
        const pH = -Math.log10(hConc)

        // Beaker boundaries
        const beakerLeft = this.centerX - 70
        const beakerRight = this.centerX + 70
        const beakerTop = this.centerY - 40
        const beakerBottom = this.centerY + 80

        // Update ions
        this.ions.forEach((ion, i) => {
            // Speed based on whether acidic or basic
            const speedMult = ion.isHydrogen ? 1.5 : 0.8
            ion.x += ion.vx * delta * speedMult
            ion.y += ion.vy * delta * speedMult

            // Bounce off beaker walls
            if (ion.x < beakerLeft + 15) {
                ion.x = beakerLeft + 15
                ion.vx = Math.abs(ion.vx)
            }
            if (ion.x > beakerRight - 15) {
                ion.x = beakerRight - 15
                ion.vx = -Math.abs(ion.vx)
            }
            if (ion.y < beakerTop + 15) {
                ion.y = beakerTop + 15
                ion.vy = Math.abs(ion.vy)
            }
            if (ion.y > beakerBottom - 15) {
                ion.y = beakerBottom - 15
                ion.vy = -Math.abs(ion.vy)
            }

            // Random velocity changes
            if (Math.random() < 0.02) {
                ion.vx += (Math.random() - 0.5) * 0.5
                ion.vy += (Math.random() - 0.5) * 0.5
            }

            // Update blob
            if (this.ionBlobs[i]) {
                this.ionBlobs[i].setPosition(ion.x, ion.y)
                this.ionBlobs[i].updateOptions({
                    wobblePhase: this.time * 3 + i,
                })
            }
        })

        // Update bubbles
        this.bubbles.forEach((bubble) => {
            bubble.y -= bubble.speed * delta
            bubble.x += Math.sin(this.time * 2 + bubble.y * 0.1) * 0.3

            // Reset bubble when it reaches top
            if (bubble.y < beakerTop + 10) {
                bubble.y = beakerBottom - 10
                bubble.x = this.centerX - 60 + Math.random() * 120
            }
        })

        this.drawBeaker(pH)
        this.drawPhIndicator(pH)
    }

    private drawBeaker(pH: number): void {
        const g = this.beaker
        const s = this.solution
        g.clear()
        s.clear()

        const beakerLeft = this.centerX - 70
        const beakerRight = this.centerX + 70
        const beakerTop = this.centerY - 40
        const beakerBottom = this.centerY + 80
        const beakerWidth = beakerRight - beakerLeft
        const beakerHeight = beakerBottom - beakerTop

        // Solution color based on pH (pH indicator colors)
        // pH 0-3: Red, 4-6: Orange/Yellow, 7: Green, 8-10: Blue, 11-14: Purple
        let solutionColor: number
        if (pH < 3) {
            solutionColor = 0xe74c3c // Red (strong acid)
        } else if (pH < 5) {
            const t = (pH - 3) / 2
            solutionColor = this.lerpColor(0xe74c3c, 0xf39c12, t) // Red to Orange
        } else if (pH < 7) {
            const t = (pH - 5) / 2
            solutionColor = this.lerpColor(0xf39c12, 0x2ecc71, t) // Orange to Green
        } else if (pH < 9) {
            const t = (pH - 7) / 2
            solutionColor = this.lerpColor(0x2ecc71, 0x3498db, t) // Green to Blue
        } else if (pH < 12) {
            const t = (pH - 9) / 3
            solutionColor = this.lerpColor(0x3498db, 0x9b59b6, t) // Blue to Purple
        } else {
            solutionColor = 0x9b59b6 // Purple (strong base)
        }

        // Draw solution with wave effect
        s.moveTo(beakerLeft + 5, beakerTop + 10)
        for (let x = beakerLeft + 5; x <= beakerRight - 5; x += 5) {
            const wave = Math.sin(this.time * 2 + x * 0.05) * 3
            s.lineTo(x, beakerTop + 10 + wave)
        }
        s.lineTo(beakerRight - 5, beakerBottom - 5)
        s.lineTo(beakerLeft + 5, beakerBottom - 5)
        s.closePath()
        s.fill({ color: solutionColor, alpha: 0.6 })

        // Draw bubbles in solution
        this.bubbles.forEach((bubble) => {
            s.circle(bubble.x, bubble.y, bubble.size)
            s.fill({ color: 0xffffff, alpha: 0.3 })
        })

        // Beaker outline
        g.moveTo(beakerLeft, beakerTop)
        g.lineTo(beakerLeft, beakerBottom)
        g.lineTo(beakerRight, beakerBottom)
        g.lineTo(beakerRight, beakerTop)
        g.stroke({ color: 0xffffff, width: 3, alpha: 0.6 })

        // Beaker spout
        g.moveTo(beakerLeft, beakerTop)
        g.lineTo(beakerLeft - 10, beakerTop - 10)
        g.moveTo(beakerRight, beakerTop)
        g.lineTo(beakerRight + 10, beakerTop - 10)
        g.stroke({ color: 0xffffff, width: 3, alpha: 0.6 })

        // Glass highlight
        g.rect(beakerLeft + 5, beakerTop + 5, 6, beakerHeight - 10)
        g.fill({ color: 0xffffff, alpha: 0.15 })

        // Measurement marks
        for (let i = 1; i <= 4; i++) {
            const markY = beakerTop + (i / 5) * beakerHeight
            g.moveTo(beakerRight, markY)
            g.lineTo(beakerRight + 8, markY)
            g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
        }
    }

    private drawPhIndicator(pH: number): void {
        const g = this.beaker

        // pH scale bar at bottom
        const scaleX = this.centerX - 100
        const scaleY = this.height - 50
        const scaleWidth = 200
        const scaleHeight = 20

        // Draw gradient scale
        for (let i = 0; i <= 14; i++) {
            const x = scaleX + (i / 14) * scaleWidth
            const width = scaleWidth / 14
            let color: number
            if (i < 3) color = 0xe74c3c
            else if (i < 5) color = 0xf39c12
            else if (i < 8) color = 0x2ecc71
            else if (i < 11) color = 0x3498db
            else color = 0x9b59b6

            g.rect(x, scaleY, width + 1, scaleHeight)
            g.fill({ color, alpha: 0.7 })
        }

        // Scale outline
        g.roundRect(scaleX, scaleY, scaleWidth, scaleHeight, 4)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })

        // pH indicator pointer
        const pointerX = scaleX + (pH / 14) * scaleWidth
        g.moveTo(pointerX, scaleY - 5)
        g.lineTo(pointerX - 6, scaleY - 15)
        g.lineTo(pointerX + 6, scaleY - 15)
        g.closePath()
        g.fill({ color: 0xffffff, alpha: 0.9 })

        // Scale labels
        g.circle(scaleX + 5, scaleY + scaleHeight + 10, 0) // Placeholder for text positioning
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
