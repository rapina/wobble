import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface SoluteBlob {
    blob: Blob
    x: number
    y: number
    vx: number
    vy: number
}

interface WaterDrop {
    x: number
    y: number
    vy: number
    size: number
}

export class DilutionScene extends BaseScene {
    declare private beakers: Graphics
    declare private soluteBlobs: SoluteBlob[]
    declare private waterDrops: WaterDrop[]
    declare private time: number
    declare private targetVolume: number
    declare private currentVolume: number

    protected setup(): void {
        this.time = 0
        this.soluteBlobs = []
        this.waterDrops = []
        this.targetVolume = 400
        this.currentVolume = 100

        this.beakers = new Graphics()
        this.container.addChild(this.beakers)

        // Initialize solute blobs (molecules)
        const numSolutes = 12
        for (let i = 0; i < numSolutes; i++) {
            this.addSoluteBlob()
        }
    }

    private addSoluteBlob(): void {
        const beakerLeft = this.centerX - 50
        const beakerRight = this.centerX + 50
        const beakerBottom = this.centerY + 60

        const x = beakerLeft + 15 + Math.random() * (beakerRight - beakerLeft - 30)
        const y = beakerBottom - 20 - Math.random() * 60

        const blob = new Blob({
            size: 14,
            color: 0x9b59b6, // Purple for solute
            shape: 'circle',
            expression: 'happy',
        })
        blob.setPosition(x, y)
        this.container.addChild(blob)

        this.soluteBlobs.push({
            blob,
            x,
            y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
        })
    }

    protected onVariablesChange(): void {
        const V1 = this.variables['V₁'] || 100
        const V2 = this.variables['V₂'] || 400

        this.targetVolume = V2

        // Add water drops when volume is increasing
        if (V2 > this.currentVolume && this.waterDrops.length < 5) {
            const dropCount = Math.min(3, Math.floor((V2 - this.currentVolume) / 50))
            for (let i = 0; i < dropCount; i++) {
                this.waterDrops.push({
                    x: this.centerX - 20 + Math.random() * 40,
                    y: this.centerY - 100,
                    vy: 2 + Math.random() * 2,
                    size: 6 + Math.random() * 4,
                })
            }
        }
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const M1 = this.variables['M₁'] || 2
        const V1 = this.variables['V₁'] || 100
        const V2 = this.variables['V₂'] || 400
        const M2 = (M1 * V1) / V2

        // Smoothly interpolate current volume
        this.currentVolume += (this.targetVolume - this.currentVolume) * 0.05 * delta

        // Calculate beaker dimensions based on volume
        const baseWidth = 100
        const baseHeight = 120
        const volumeScale = Math.sqrt(this.currentVolume / 100) // Scale with sqrt for area
        const beakerWidth = baseWidth * Math.min(volumeScale, 1.3)
        const beakerHeight = baseHeight * Math.min(volumeScale, 1.5)

        const beakerLeft = this.centerX - beakerWidth / 2
        const beakerRight = this.centerX + beakerWidth / 2
        const beakerTop = this.centerY + 70 - beakerHeight
        const beakerBottom = this.centerY + 70

        // Solution height based on current volume
        const solutionHeight = Math.min(
            beakerHeight - 10,
            (this.currentVolume / 1000) * beakerHeight * 2
        )
        const solutionTop = beakerBottom - solutionHeight

        // Update solute blobs
        this.soluteBlobs.forEach((solute, i) => {
            // Spread based on volume (more volume = more spread)
            const spreadFactor = Math.sqrt(this.currentVolume / 100)
            solute.x += solute.vx * delta * spreadFactor
            solute.y += solute.vy * delta

            // Bounce off beaker walls (adjusted for current size)
            const margin = 12
            if (solute.x < beakerLeft + margin) {
                solute.x = beakerLeft + margin
                solute.vx = Math.abs(solute.vx)
            }
            if (solute.x > beakerRight - margin) {
                solute.x = beakerRight - margin
                solute.vx = -Math.abs(solute.vx)
            }
            if (solute.y < solutionTop + margin) {
                solute.y = solutionTop + margin
                solute.vy = Math.abs(solute.vy)
            }
            if (solute.y > beakerBottom - margin) {
                solute.y = beakerBottom - margin
                solute.vy = -Math.abs(solute.vy)
            }

            // Random velocity changes
            if (Math.random() < 0.02) {
                solute.vx += (Math.random() - 0.5) * 0.3
                solute.vy += (Math.random() - 0.5) * 0.3
            }

            // Update blob visual - size and alpha based on concentration
            const sizeScale = Math.max(0.6, Math.min(1.2, M2 / 2))
            solute.blob.setPosition(solute.x, solute.y)
            solute.blob.updateOptions({
                size: 14 * sizeScale,
                wobblePhase: this.time * 2 + i,
            })
        })

        // Update water drops
        this.waterDrops.forEach((drop) => {
            drop.y += drop.vy * delta
        })

        // Remove drops that hit the solution
        this.waterDrops = this.waterDrops.filter((drop) => drop.y < solutionTop - 10)

        this.drawScene(M1, V1, V2, M2, solutionTop, beakerLeft, beakerRight, beakerTop, beakerBottom)
    }

    private drawScene(
        M1: number,
        V1: number,
        V2: number,
        M2: number,
        solutionTop: number,
        beakerLeft: number,
        beakerRight: number,
        beakerTop: number,
        beakerBottom: number
    ): void {
        const g = this.beakers
        g.clear()

        const beakerWidth = beakerRight - beakerLeft
        const beakerHeight = beakerBottom - beakerTop

        // Solution (color intensity based on concentration)
        const concentrationIntensity = Math.min(1, M2 / 5)
        const solutionColor = this.lerpColor(0x85c1e9, 0x9b59b6, concentrationIntensity)

        // Draw solution with wave effect
        g.moveTo(beakerLeft + 5, solutionTop)
        for (let x = beakerLeft + 5; x <= beakerRight - 5; x += 5) {
            const wave = Math.sin(this.time * 2 + x * 0.08) * 2
            g.lineTo(x, solutionTop + wave)
        }
        g.lineTo(beakerRight - 5, beakerBottom - 5)
        g.lineTo(beakerLeft + 5, beakerBottom - 5)
        g.closePath()
        g.fill({ color: solutionColor, alpha: 0.5 + concentrationIntensity * 0.3 })

        // Draw water drops
        this.waterDrops.forEach((drop) => {
            // Drop shape
            g.moveTo(drop.x, drop.y - drop.size)
            g.quadraticCurveTo(drop.x + drop.size, drop.y, drop.x, drop.y + drop.size * 0.5)
            g.quadraticCurveTo(drop.x - drop.size, drop.y, drop.x, drop.y - drop.size)
            g.fill({ color: 0x85c1e9, alpha: 0.7 })

            // Drop highlight
            g.circle(drop.x - drop.size * 0.3, drop.y - drop.size * 0.3, drop.size * 0.2)
            g.fill({ color: 0xffffff, alpha: 0.5 })
        })

        // Beaker outline
        g.moveTo(beakerLeft, beakerTop)
        g.lineTo(beakerLeft, beakerBottom)
        g.lineTo(beakerRight, beakerBottom)
        g.lineTo(beakerRight, beakerTop)
        g.stroke({ color: 0xffffff, width: 3, alpha: 0.6 })

        // Beaker spout
        g.moveTo(beakerLeft, beakerTop)
        g.lineTo(beakerLeft - 8, beakerTop - 8)
        g.moveTo(beakerRight, beakerTop)
        g.lineTo(beakerRight + 8, beakerTop - 8)
        g.stroke({ color: 0xffffff, width: 3, alpha: 0.6 })

        // Glass highlight
        g.rect(beakerLeft + 4, beakerTop + 4, 5, beakerHeight - 8)
        g.fill({ color: 0xffffff, alpha: 0.15 })

        // Volume measurement marks
        const maxMarks = 5
        for (let i = 1; i <= maxMarks; i++) {
            const markY = beakerBottom - (i / maxMarks) * beakerHeight * 0.9
            const markLength = i % 2 === 0 ? 10 : 6
            g.moveTo(beakerRight, markY)
            g.lineTo(beakerRight + markLength, markY)
            g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
        }

        // Draw pipette (water source)
        this.drawPipette(g)

        // Draw concentration indicator bar
        this.drawConcentrationBar(g, M1, M2)

        // Draw moles conservation indicator
        this.drawMolesIndicator(g, M1, V1, M2, V2)
    }

    private drawPipette(g: Graphics): void {
        const pipetteX = this.centerX
        const pipetteTop = this.centerY - 130
        const pipetteBottom = this.centerY - 80

        // Pipette body
        g.roundRect(pipetteX - 8, pipetteTop, 16, pipetteBottom - pipetteTop, 4)
        g.fill({ color: 0x555555, alpha: 0.8 })

        // Pipette tip
        g.moveTo(pipetteX - 6, pipetteBottom)
        g.lineTo(pipetteX - 3, pipetteBottom + 20)
        g.lineTo(pipetteX + 3, pipetteBottom + 20)
        g.lineTo(pipetteX + 6, pipetteBottom)
        g.fill({ color: 0x666666, alpha: 0.8 })

        // Water in pipette
        g.roundRect(pipetteX - 5, pipetteTop + 5, 10, 30, 2)
        g.fill({ color: 0x85c1e9, alpha: 0.6 })

        // Highlight
        g.rect(pipetteX - 6, pipetteTop + 2, 3, pipetteBottom - pipetteTop - 4)
        g.fill({ color: 0xffffff, alpha: 0.2 })
    }

    private drawConcentrationBar(g: Graphics, M1: number, M2: number): void {
        const barX = this.centerX - 80
        const barY = this.height - 40
        const barWidth = 160
        const barHeight = 12

        // Background
        g.roundRect(barX, barY, barWidth, barHeight, 4)
        g.fill({ color: 0x333333, alpha: 0.6 })

        // Fill based on M2 relative to M1
        const fillRatio = Math.min(1, M2 / M1)
        g.roundRect(barX, barY, barWidth * fillRatio, barHeight, 4)
        g.fill({ color: 0x9b59b6, alpha: 0.8 })

        // Border
        g.roundRect(barX, barY, barWidth, barHeight, 4)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })
    }

    private drawMolesIndicator(g: Graphics, M1: number, V1: number, M2: number, V2: number): void {
        // Show that M1*V1 = M2*V2 (moles conserved)
        const moles1 = M1 * V1
        const moles2 = M2 * V2
        const isConserved = Math.abs(moles1 - moles2) < 1

        // Small indicator dot
        const indicatorX = this.centerX + 90
        const indicatorY = this.height - 34

        g.circle(indicatorX, indicatorY, 6)
        g.fill({ color: isConserved ? 0x2ecc71 : 0xe74c3c, alpha: 0.8 })
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
