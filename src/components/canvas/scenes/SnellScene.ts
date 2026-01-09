import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobShape } from '../Blob'
import { pixiColors } from '../../../utils/pixiHelpers'

interface Bubble {
    x: number
    y: number
    radius: number
    speed: number
    wobble: number
    wobbleSpeed: number
}

export class SnellScene extends BaseScene {
    declare private lightBlob: Blob
    declare private mediaGraphics: Graphics
    declare private rayGraphics: Graphics
    declare private bubbleGraphics: Graphics
    declare private time: number
    declare private incidentAngle: number
    declare private refractedAngle: number
    declare private n1: number
    declare private n2: number
    declare private bubbles: Bubble[]

    protected setup(): void {
        this.n1 = 1
        this.n2 = 1.5
        this.time = 0
        this.incidentAngle = Math.PI / 4
        this.refractedAngle = Math.PI / 6
        this.bubbles = []

        this.mediaGraphics = new Graphics()
        this.container.addChild(this.mediaGraphics)

        this.bubbleGraphics = new Graphics()
        this.container.addChild(this.bubbleGraphics)

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

        this.initBubbles()
    }

    private initBubbles(): void {
        this.bubbles = []
        const bubbleCount = 12
        for (let i = 0; i < bubbleCount; i++) {
            this.bubbles.push({
                x: Math.random() * this.width,
                y: this.centerY + Math.random() * (this.height / 2 - 20) + 10,
                radius: 3 + Math.random() * 6,
                speed: 0.3 + Math.random() * 0.5,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.02 + Math.random() * 0.03,
            })
        }
    }

    protected onVariablesChange(): void {
        const theta1 = ((this.variables['θ₁'] || 45) * Math.PI) / 180
        this.n1 = this.variables['n₁'] || 1
        this.n2 = this.variables['n₂'] || 1.5

        this.incidentAngle = theta1

        // Snell's law: n1 * sin(θ1) = n2 * sin(θ2)
        const sinTheta2 = (this.n1 * Math.sin(theta1)) / this.n2
        if (Math.abs(sinTheta2) <= 1) {
            this.refractedAngle = Math.asin(sinTheta2)
        } else {
            // Total internal reflection
            this.refractedAngle = Math.PI - theta1
        }
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.03

        // Animate light blob along the ray path
        const progress = (this.time % 2) / 2
        const interfaceY = this.centerY
        const interfaceX = this.centerX

        let blobX: number, blobY: number

        if (progress < 0.5) {
            // Incident ray
            const t = progress * 2
            const startX = interfaceX - Math.sin(this.incidentAngle) * 150
            const startY = interfaceY - Math.cos(this.incidentAngle) * 150
            blobX = startX + (interfaceX - startX) * t
            blobY = startY + (interfaceY - startY) * t
        } else {
            // Refracted ray
            const t = (progress - 0.5) * 2
            const endX = interfaceX + Math.sin(this.refractedAngle) * 150
            const endY = interfaceY + Math.cos(this.refractedAngle) * 150
            blobX = interfaceX + (endX - interfaceX) * t
            blobY = interfaceY + (endY - interfaceY) * t
        }

        this.lightBlob.setPosition(blobX, blobY)
        this.lightBlob.updateOptions({ wobblePhase: this.time * 3 })

        this.updateBubbles(delta)
        this.drawMedia()
        this.drawBubbles()
        this.drawRays()
    }

    private updateBubbles(delta: number): void {
        for (const bubble of this.bubbles) {
            bubble.wobble += bubble.wobbleSpeed * delta
            bubble.y -= bubble.speed * delta

            // Reset bubble when it reaches the surface
            if (bubble.y < this.centerY + 5) {
                bubble.y = this.height - 10
                bubble.x = Math.random() * this.width
            }
        }
    }

    private drawBubbles(): void {
        const g = this.bubbleGraphics
        g.clear()

        for (const bubble of this.bubbles) {
            const wobbleX = Math.sin(bubble.wobble) * 3
            const x = bubble.x + wobbleX

            // Bubble body
            g.circle(x, bubble.y, bubble.radius)
            g.fill({ color: 0xffffff, alpha: 0.3 })
            g.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })

            // Highlight
            g.circle(x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.3)
            g.fill({ color: 0xffffff, alpha: 0.6 })
        }
    }

    private drawMedia(): void {
        const g = this.mediaGraphics
        g.clear()

        // Calculate alpha based on refractive index (n=1 → 0.1, n=2.5 → 0.6)
        const alpha1 = 0.1 + (this.n1 - 1) * 0.33
        const alpha2 = 0.1 + (this.n2 - 1) * 0.33

        // Color varies with density: air=light blue, water=blue, glass=deeper blue, diamond=purple tint
        const color1 = this.getMediaColor(this.n1)
        const color2 = this.getMediaColor(this.n2)

        // Upper medium
        g.rect(0, 0, this.width, this.centerY)
        g.fill({ color: color1, alpha: alpha1 })

        // Lower medium with wavy surface
        const waveAmplitude = 4
        const waveFrequency = 0.03
        const waveSpeed = this.time * 2

        g.moveTo(0, this.centerY)
        for (let x = 0; x <= this.width; x += 4) {
            const waveY = this.centerY + Math.sin(x * waveFrequency + waveSpeed) * waveAmplitude
            g.lineTo(x, waveY)
        }
        g.lineTo(this.width, this.height)
        g.lineTo(0, this.height)
        g.closePath()
        g.fill({ color: color2, alpha: alpha2 })

        // Secondary wave layer for depth
        g.moveTo(0, this.centerY + 3)
        for (let x = 0; x <= this.width; x += 4) {
            const waveY =
                this.centerY +
                3 +
                Math.sin(x * waveFrequency * 1.3 - waveSpeed * 0.7) * (waveAmplitude * 0.6)
            g.lineTo(x, waveY)
        }
        g.lineTo(this.width, this.height)
        g.lineTo(0, this.height)
        g.closePath()
        g.fill({ color: color2, alpha: alpha2 * 0.5 })

        // Wavy interface line
        g.moveTo(0, this.centerY + Math.sin(waveSpeed) * waveAmplitude)
        for (let x = 0; x <= this.width; x += 4) {
            const waveY = this.centerY + Math.sin(x * waveFrequency + waveSpeed) * waveAmplitude
            g.lineTo(x, waveY)
        }
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.7 })

        // Normal line (dashed)
        g.moveTo(this.centerX, this.centerY - 100)
        g.lineTo(this.centerX, this.centerY + 100)
        g.stroke({ color: 0xaaaaaa, width: 1, alpha: 0.6 })
    }

    private getMediaColor(n: number): number {
        // n=1 (air): transparent/very light
        // n=1.33 (water): blue liquid
        // n=1.5 (glass): greenish-gray solid
        // n=2.4 (diamond): clear/sparkly solid
        if (n < 1.2) return 0xf0f8ff // Air - almost invisible white
        if (n < 1.4) return 0x4a90d9 // Water - blue
        if (n < 1.8) return 0x90a090 // Glass - greenish gray
        return 0xb8cce8 // Diamond - clear blueish
    }

    private drawRays(): void {
        const g = this.rayGraphics
        g.clear()

        const interfaceX = this.centerX
        const interfaceY = this.centerY

        // Incident ray
        const incidentStartX = interfaceX - Math.sin(this.incidentAngle) * 150
        const incidentStartY = interfaceY - Math.cos(this.incidentAngle) * 150

        g.moveTo(incidentStartX, incidentStartY)
        g.lineTo(interfaceX, interfaceY)
        g.stroke({ color: 0xffd700, width: 3 })

        // Refracted ray
        const refractedEndX = interfaceX + Math.sin(this.refractedAngle) * 150
        const refractedEndY = interfaceY + Math.cos(this.refractedAngle) * 150

        g.moveTo(interfaceX, interfaceY)
        g.lineTo(refractedEndX, refractedEndY)
        g.stroke({ color: 0xffd700, width: 3 })
    }
}
