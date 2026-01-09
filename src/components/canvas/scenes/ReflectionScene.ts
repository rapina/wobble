import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

export class ReflectionScene extends BaseScene {
    declare private lightBlob: Blob
    declare private mirrorGraphics: Graphics
    declare private rayGraphics: Graphics
    declare private time: number
    declare private incidentAngle: number

    protected setup(): void {
        this.time = 0
        this.incidentAngle = Math.PI / 4

        this.mirrorGraphics = new Graphics()
        this.container.addChild(this.mirrorGraphics)

        this.rayGraphics = new Graphics()
        this.container.addChild(this.rayGraphics)

        this.lightBlob = new Blob({
            size: 30,
            color: 0xffd700,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.5,
            glowColor: 0xffd700,
        })
        this.container.addChild(this.lightBlob)
    }

    protected onVariablesChange(): void {
        const thetaI = this.variables['θᵢ'] || 45
        this.incidentAngle = (thetaI * Math.PI) / 180
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.025

        const progress = (this.time % 2) / 2
        const mirrorY = this.centerY + 30
        const mirrorX = this.centerX

        let blobX: number, blobY: number

        if (progress < 0.5) {
            // Incident ray - coming down to mirror
            const t = progress * 2
            const startX = mirrorX - Math.sin(this.incidentAngle) * 120
            const startY = mirrorY - Math.cos(this.incidentAngle) * 120
            blobX = startX + (mirrorX - startX) * t
            blobY = startY + (mirrorY - startY) * t
        } else {
            // Reflected ray - going up from mirror
            const t = (progress - 0.5) * 2
            const endX = mirrorX + Math.sin(this.incidentAngle) * 120
            const endY = mirrorY - Math.cos(this.incidentAngle) * 120
            blobX = mirrorX + (endX - mirrorX) * t
            blobY = mirrorY + (endY - mirrorY) * t
        }

        this.lightBlob.setPosition(blobX, blobY)
        this.lightBlob.updateOptions({ wobblePhase: this.time * 3 })

        this.drawMirror(mirrorY)
        this.drawRays(mirrorX, mirrorY)
        this.drawAngleIndicators(mirrorX, mirrorY)
    }

    private drawMirror(mirrorY: number): void {
        const g = this.mirrorGraphics
        g.clear()

        // Mirror surface
        const mirrorWidth = this.width - 60
        const mirrorX = 30

        // Mirror backing
        g.rect(mirrorX, mirrorY, mirrorWidth, 12)
        g.fill({ color: 0x444444, alpha: 0.9 })

        // Reflective surface
        g.rect(mirrorX, mirrorY - 3, mirrorWidth, 6)
        g.fill({ color: 0xc0c0c0, alpha: 0.9 })

        // Shine effect
        g.rect(mirrorX, mirrorY - 2, mirrorWidth, 2)
        g.fill({ color: 0xffffff, alpha: 0.4 })

        // Hash marks to indicate mirror
        for (let x = mirrorX + 15; x < mirrorX + mirrorWidth - 10; x += 20) {
            g.moveTo(x, mirrorY + 4)
            g.lineTo(x - 8, mirrorY + 10)
            g.stroke({ color: 0x666666, width: 1.5, alpha: 0.6 })
        }
    }

    private drawRays(mirrorX: number, mirrorY: number): void {
        const g = this.rayGraphics
        g.clear()

        // Normal line (dashed)
        g.moveTo(mirrorX, mirrorY - 100)
        g.lineTo(mirrorX, mirrorY + 20)
        g.stroke({ color: 0xaaaaaa, width: 1.5, alpha: 0.5 })

        // Normal line label (N)
        g.circle(mirrorX, mirrorY - 105, 8)
        g.fill({ color: 0x333333, alpha: 0.7 })

        // Incident ray
        const incStartX = mirrorX - Math.sin(this.incidentAngle) * 120
        const incStartY = mirrorY - Math.cos(this.incidentAngle) * 120

        g.moveTo(incStartX, incStartY)
        g.lineTo(mirrorX, mirrorY)
        g.stroke({ color: 0xffd700, width: 3, alpha: 0.8 })

        // Arrow on incident ray
        this.drawArrow(g, incStartX, incStartY, mirrorX, mirrorY, 0xffd700)

        // Reflected ray
        const refEndX = mirrorX + Math.sin(this.incidentAngle) * 120
        const refEndY = mirrorY - Math.cos(this.incidentAngle) * 120

        g.moveTo(mirrorX, mirrorY)
        g.lineTo(refEndX, refEndY)
        g.stroke({ color: 0xff6b6b, width: 3, alpha: 0.8 })

        // Arrow on reflected ray
        this.drawArrow(g, mirrorX, mirrorY, refEndX, refEndY, 0xff6b6b)
    }

    private drawArrow(
        g: Graphics,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        color: number
    ): void {
        const angle = Math.atan2(toY - fromY, toX - fromX)
        const midX = (fromX + toX) / 2
        const midY = (fromY + toY) / 2
        const arrowSize = 10

        g.moveTo(midX, midY)
        g.lineTo(
            midX - arrowSize * Math.cos(angle - Math.PI / 6),
            midY - arrowSize * Math.sin(angle - Math.PI / 6)
        )
        g.moveTo(midX, midY)
        g.lineTo(
            midX - arrowSize * Math.cos(angle + Math.PI / 6),
            midY - arrowSize * Math.sin(angle + Math.PI / 6)
        )
        g.stroke({ color, width: 3, alpha: 0.8 })
    }

    private drawAngleIndicators(mirrorX: number, mirrorY: number): void {
        const g = this.rayGraphics
        const arcRadius = 35

        // Incident angle arc (left of normal)
        g.arc(mirrorX, mirrorY, arcRadius, -Math.PI / 2, -Math.PI / 2 + this.incidentAngle, false)
        g.stroke({ color: 0xffd700, width: 2.5, alpha: 0.7 })

        // Reflected angle arc (right of normal)
        g.arc(mirrorX, mirrorY, arcRadius, -Math.PI / 2 - this.incidentAngle, -Math.PI / 2, false)
        g.stroke({ color: 0xff6b6b, width: 2.5, alpha: 0.7 })

        // Equal sign between angles
        const equalX = mirrorX
        const equalY = mirrorY - arcRadius - 20
        g.moveTo(equalX - 8, equalY - 3)
        g.lineTo(equalX + 8, equalY - 3)
        g.moveTo(equalX - 8, equalY + 3)
        g.lineTo(equalX + 8, equalY + 3)
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.7 })
    }
}
