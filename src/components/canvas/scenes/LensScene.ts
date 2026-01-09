import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

export class LensScene extends BaseScene {
    declare private objectBlob: Blob
    declare private imageBlob: Blob
    declare private lensGraphics: Graphics
    declare private rayGraphics: Graphics
    declare private time: number
    declare private objectHeight: number

    protected setup(): void {
        this.time = 0
        this.objectHeight = 50

        this.lensGraphics = new Graphics()
        this.container.addChild(this.lensGraphics)

        this.rayGraphics = new Graphics()
        this.container.addChild(this.rayGraphics)

        // Object (circle - light source/object)
        this.objectBlob = new Blob({
            size: 35,
            color: 0x3498db,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: 0x3498db,
        })
        this.objectBlob.setPosition(this.width * 0.2, this.centerY - 40)
        this.container.addChild(this.objectBlob)

        // Image (square - to differentiate from object)
        this.imageBlob = new Blob({
            size: 30,
            color: 0x9b59b6,
            shape: 'square',
            expression: 'happy',
            glowIntensity: 0.2,
            glowColor: 0x9b59b6,
        })
        this.imageBlob.setPosition(this.width * 0.8, this.centerY + 30)
        this.container.addChild(this.imageBlob)
    }

    protected onVariablesChange(): void {
        const a = this.variables['a'] || 30 // Object distance
        const b = this.variables['b'] || 15 // Image distance
        const f = (a * b) / (a + b) // Focal length

        // Scale distances for display (max ~120px each side)
        const maxDist = 100
        const scaleA = Math.min(a / 100, 1) * maxDist
        const scaleB = Math.min(b / 100, 1) * maxDist

        // Object position
        const lensX = this.centerX
        const objX = lensX - scaleA - 20
        this.objectBlob.setPosition(objX, this.centerY - 40)

        // Image position and size (magnification = b/a)
        const magnification = b / a
        const imgX = lensX + scaleB + 20
        const imgY = this.centerY + 40 * magnification // Inverted image
        const imgSize = Math.max(15, Math.min(35 * magnification, 60))

        this.imageBlob.setPosition(imgX, imgY)
        this.imageBlob.updateOptions({
            size: imgSize,
            // Inverted = different expression
            expression: magnification > 1 ? 'surprised' : 'sleepy',
        })
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        this.objectBlob.updateOptions({ wobblePhase: this.time * 2 })
        this.imageBlob.updateOptions({ wobblePhase: this.time * 2.5 })

        this.drawLens()
        this.drawRays()
        this.drawLabels()
    }

    private drawLens(): void {
        const g = this.lensGraphics
        g.clear()

        const lensX = this.centerX
        const lensHeight = 130

        // Optical axis
        g.moveTo(30, this.centerY)
        g.lineTo(this.width - 30, this.centerY)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })

        // Convex lens shape
        g.moveTo(lensX, this.centerY - lensHeight / 2)
        g.bezierCurveTo(
            lensX + 25,
            this.centerY - lensHeight / 3,
            lensX + 25,
            this.centerY + lensHeight / 3,
            lensX,
            this.centerY + lensHeight / 2
        )
        g.bezierCurveTo(
            lensX - 25,
            this.centerY + lensHeight / 3,
            lensX - 25,
            this.centerY - lensHeight / 3,
            lensX,
            this.centerY - lensHeight / 2
        )
        g.fill({ color: 0x87ceeb, alpha: 0.35 })
        g.stroke({ color: 0x5dade2, width: 3, alpha: 0.8 })

        // Focal points
        const a = this.variables['a'] || 30
        const b = this.variables['b'] || 15
        const f = (a * b) / (a + b)
        const fPixels = Math.min(f * 1.5, 70)

        // Left focal point (F)
        g.circle(lensX - fPixels, this.centerY, 5)
        g.fill({ color: 0xf39c12, alpha: 0.8 })

        // Right focal point (F')
        g.circle(lensX + fPixels, this.centerY, 5)
        g.fill({ color: 0xf39c12, alpha: 0.8 })

        // Object arrow
        const objX = this.objectBlob.position.x
        g.moveTo(objX, this.centerY)
        g.lineTo(objX, this.centerY - 50)
        g.stroke({ color: 0x3498db, width: 4, alpha: 0.8 })
        // Arrow head
        g.moveTo(objX, this.centerY - 50)
        g.lineTo(objX - 6, this.centerY - 40)
        g.moveTo(objX, this.centerY - 50)
        g.lineTo(objX + 6, this.centerY - 40)
        g.stroke({ color: 0x3498db, width: 4, alpha: 0.8 })

        // Image arrow (inverted)
        const imgX = this.imageBlob.position.x
        const magnification = b / a
        const imgHeight = 50 * magnification
        g.moveTo(imgX, this.centerY)
        g.lineTo(imgX, this.centerY + Math.min(imgHeight, 80))
        g.stroke({ color: 0x9b59b6, width: 4, alpha: 0.8 })
        // Arrow head (pointing down = inverted)
        const arrowY = this.centerY + Math.min(imgHeight, 80)
        g.moveTo(imgX, arrowY)
        g.lineTo(imgX - 6, arrowY - 10)
        g.moveTo(imgX, arrowY)
        g.lineTo(imgX + 6, arrowY - 10)
        g.stroke({ color: 0x9b59b6, width: 4, alpha: 0.8 })
    }

    private drawRays(): void {
        const g = this.rayGraphics
        g.clear()

        const objX = this.objectBlob.position.x
        const objY = this.centerY - 50 // Top of object arrow
        const imgX = this.imageBlob.position.x
        const lensX = this.centerX

        const a = this.variables['a'] || 30
        const b = this.variables['b'] || 15
        const f = (a * b) / (a + b)
        const fPixels = Math.min(f * 1.5, 70)
        const magnification = b / a
        const imgY = this.centerY + Math.min(50 * magnification, 80)

        // Ray 1: Parallel to axis → through focal point
        g.moveTo(objX, objY)
        g.lineTo(lensX, objY)
        g.lineTo(imgX, imgY)
        g.stroke({ color: 0xff6b6b, width: 2, alpha: 0.7 })

        // Ray 2: Through center → undeviated
        g.moveTo(objX, objY)
        g.lineTo(imgX, imgY)
        g.stroke({ color: 0x4ecdc4, width: 2, alpha: 0.7 })

        // Ray 3: Through F → parallel after lens
        g.moveTo(objX, objY)
        g.lineTo(lensX, this.centerY + (this.centerY - objY) * magnification)
        g.lineTo(imgX, imgY)
        g.stroke({ color: 0xf7dc6f, width: 2, alpha: 0.7 })
    }

    private drawLabels(): void {
        const g = this.lensGraphics

        const a = this.variables['a'] || 30
        const b = this.variables['b'] || 15
        const magnification = b / a

        // Distance indicators
        const objX = this.objectBlob.position.x
        const imgX = this.imageBlob.position.x
        const lensX = this.centerX

        // Object distance line
        g.moveTo(objX, this.height - 50)
        g.lineTo(lensX, this.height - 50)
        g.stroke({ color: 0x3498db, width: 2, alpha: 0.5 })

        // Image distance line
        g.moveTo(lensX, this.height - 50)
        g.lineTo(imgX, this.height - 50)
        g.stroke({ color: 0x9b59b6, width: 2, alpha: 0.5 })

        // Magnification indicator
        const magBarWidth = 60
        const magBarHeight = 8
        const magBarX = this.width - 80
        const magBarY = 50

        g.roundRect(magBarX, magBarY, magBarWidth, magBarHeight, 3)
        g.fill({ color: 0x333333, alpha: 0.5 })

        const fillWidth = (Math.min(magnification, 2) / 2) * magBarWidth
        g.roundRect(magBarX, magBarY, fillWidth, magBarHeight, 3)
        g.fill({ color: 0x9b59b6, alpha: 0.7 })
    }
}
