import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression, BlobShape } from '../Blob'
import { pixiColors, lerp } from '../../../utils/pixiHelpers'

interface Bubble {
    x: number
    y: number
    size: number
    speed: number
    wobble: number
}

interface Splash {
    x: number
    y: number
    vx: number
    vy: number
    life: number
}

interface Ripple {
    x: number
    radius: number
    life: number
}

export class BuoyancyScene extends BaseScene {
    declare private blob: Blob
    declare private waterBackGraphics: Graphics
    declare private waterFrontGraphics: Graphics
    declare private bubbleGraphics: Graphics
    declare private splashGraphics: Graphics
    declare private rippleGraphics: Graphics
    declare private blobY: number
    declare private blobVelocity: number
    declare private targetY: number
    declare private time: number
    declare private bubbles: Bubble[]
    declare private splashes: Splash[]
    declare private ripples: Ripple[]
    declare private waterSurface: number
    declare private wasAboveWater: boolean
    declare private lastSubmergedRatio: number

    protected setup(): void {
        this.waterSurface = this.centerY + 10
        this.blobY = this.waterSurface - 100 // Start above water
        this.blobVelocity = 0
        this.targetY = 0
        this.time = 0
        this.bubbles = []
        this.splashes = []
        this.ripples = []
        this.wasAboveWater = true
        this.lastSubmergedRatio = 0

        // Water behind blob
        this.waterBackGraphics = new Graphics()
        this.container.addChild(this.waterBackGraphics)

        // Ripples
        this.rippleGraphics = new Graphics()
        this.container.addChild(this.rippleGraphics)

        // Bubbles
        this.bubbleGraphics = new Graphics()
        this.container.addChild(this.bubbleGraphics)

        // Blob (물에 빠지는 피해자 역할)
        this.blob = new Blob({
            size: 55,
            color: pixiColors.mass,
            shape: 'square',
            expression: 'happy',
        })
        this.container.addChild(this.blob)

        // Water in front of blob
        this.waterFrontGraphics = new Graphics()
        this.container.addChild(this.waterFrontGraphics)

        // Splashes
        this.splashGraphics = new Graphics()
        this.container.addChild(this.splashGraphics)
    }

    protected onVariablesChange(): void {
        // ρ = fluid density (500-1500 kg/m³), V = volume (1-100 L)
        // Object density is fixed at 1000 kg/m³ (like water)
        // So: ρ > 1000 → object floats, ρ < 1000 → object sinks
        const rho_fluid = this.variables['ρ'] || 1000
        const V = this.variables['V'] || 10
        const rho_obj = 1000 // Fixed object density (same as water at default)

        const blobSize = 40 + V * 0.3
        this.blob.updateOptions({ size: blobSize })

        // Object floats if fluid is denser than object
        const floatLevel = 1 - rho_obj / rho_fluid

        if (floatLevel > 0) {
            // Floating - position based on how much is submerged
            this.targetY = this.waterSurface - blobSize * floatLevel * 0.5
        } else {
            // Sinking - go to bottom
            this.targetY = this.height - 60
        }
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const dt = delta * 0.016
        this.time += dt

        // Use formula variables: ρ (fluid density), V (volume)
        const rho_fluid = this.variables['ρ'] || 1000
        const V = this.variables['V'] || 10
        const rho_obj = 1000 // Fixed object density
        const densityRatio = rho_obj / rho_fluid
        const isFloating = densityRatio < 1 // Floats when fluid is denser
        const blobSize = 40 + V * 0.3

        // Physics simulation
        const isInWater = this.blobY > this.waterSurface - blobSize * 0.5
        const submergedRatio = isInWater
            ? Math.min(1, (this.blobY - this.waterSurface + blobSize * 0.5) / blobSize)
            : 0

        // Gravity (scaled by object density - heavier objects fall faster)
        const gravity = 150 + (rho_obj / 1000) * 100
        let acceleration = gravity

        if (isInWater) {
            // Buoyancy force: F_b = ρ_fluid * V * g (proportional to fluid density)
            // Net force = (ρ_obj - ρ_fluid) * V * g
            // If ρ_fluid < ρ_obj: object sinks
            // If ρ_fluid > ρ_obj: object floats
            const buoyancyForce = submergedRatio * (rho_fluid / rho_obj) * gravity
            acceleration -= buoyancyForce

            // Water resistance (more resistance in denser fluid)
            const resistance = 0.92 + (rho_fluid / 2000) * 0.05
            this.blobVelocity *= resistance
        }

        this.blobVelocity += acceleration * dt
        this.blobY += this.blobVelocity * dt

        // Check for water entry
        const isAboveWater = this.blobY < this.waterSurface - blobSize * 0.3
        if (this.wasAboveWater && !isAboveWater) {
            this.createSplash(Math.abs(this.blobVelocity))
            this.createRipple(this.centerX)
        }
        this.wasAboveWater = isAboveWater

        // Create ripples when moving at surface
        if (submergedRatio > 0.1 && submergedRatio < 0.9 && Math.abs(this.blobVelocity) > 10) {
            if (Math.random() < 0.1) {
                this.createRipple(this.centerX + (Math.random() - 0.5) * 40)
            }
        }

        // Bobbing motion for floating objects
        if (isFloating && Math.abs(this.blobY - this.targetY) < 20) {
            this.blobY += Math.sin(this.time * 3) * 2
        }

        // Keep in bounds
        this.blobY = Math.min(this.height - 60, this.blobY)

        // Create bubbles from submerged blob
        if (submergedRatio > 0.3 && Math.random() < 0.15 * submergedRatio) {
            this.bubbles.push({
                x: this.centerX + (Math.random() - 0.5) * 40,
                y: this.blobY + (Math.random() - 0.5) * 30,
                size: 2 + Math.random() * 4,
                speed: 1.5 + Math.random() * 2,
                wobble: Math.random() * Math.PI * 2,
            })
        }

        // Background bubbles
        if (Math.random() < 0.05) {
            this.bubbles.push({
                x: Math.random() * this.width,
                y: this.height - 10,
                size: 2 + Math.random() * 3,
                speed: 0.8 + Math.random() * 1.5,
                wobble: Math.random() * Math.PI * 2,
            })
        }

        // Update bubbles
        this.bubbles.forEach((b) => {
            b.y -= b.speed * delta
            b.x += Math.sin(b.wobble + this.time * 3) * 0.3
            b.wobble += 0.05
        })
        this.bubbles = this.bubbles.filter((b) => b.y > this.waterSurface)

        // Update splashes
        this.splashes.forEach((s) => {
            s.x += s.vx * delta
            s.y += s.vy * delta
            s.vy += 15 * delta // Gravity
            s.life -= 0.03
        })
        this.splashes = this.splashes.filter((s) => s.life > 0 && s.y < this.height)

        // Update ripples
        this.ripples.forEach((r) => {
            r.radius += 2 * delta
            r.life -= 0.02
        })
        this.ripples = this.ripples.filter((r) => r.life > 0)

        // Expression based on state
        let expression: BlobExpression = 'happy'
        if (!isFloating) {
            // Sinking - show struggle
            if (submergedRatio > 0.9) {
                expression = 'struggle'
            } else if (submergedRatio > 0.5) {
                expression = 'worried'
            } else if (this.blobVelocity > 30) {
                expression = 'surprised'
            }
        } else {
            // Floating
            if (Math.abs(this.blobVelocity) > 50) {
                expression = 'excited'
            } else if (submergedRatio > 0.7) {
                expression = 'effort'
            }
        }

        // Squash/stretch based on velocity
        const squash = 1 - Math.min(0.2, Math.abs(this.blobVelocity) * 0.001)
        const stretch = 1 + Math.min(0.2, Math.abs(this.blobVelocity) * 0.001)

        this.blob.setPosition(this.centerX, this.blobY)
        this.blob.updateOptions({
            wobblePhase: this.time * 2,
            expression,
            scaleX: this.blobVelocity > 0 ? squash : stretch,
            scaleY: this.blobVelocity > 0 ? stretch : squash,
            lookDirection: { x: 0, y: this.blobVelocity > 0 ? 0.5 : -0.5 },
            showSweat: !isFloating && submergedRatio > 0.7,
        })

        this.lastSubmergedRatio = submergedRatio

        this.drawWaterBack()
        this.drawRipples()
        this.drawBubbles()
        this.drawWaterFront()
        this.drawSplashes()
    }

    private createSplash(velocity: number): void {
        const intensity = Math.min(10, Math.floor(velocity / 20))
        for (let i = 0; i < intensity; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8
            const speed = 3 + Math.random() * 4
            this.splashes.push({
                x: this.centerX + (Math.random() - 0.5) * 30,
                y: this.waterSurface,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                life: 1,
            })
        }
    }

    private createRipple(x: number): void {
        this.ripples.push({
            x,
            radius: 5,
            life: 1,
        })
    }

    private drawWaterBack(): void {
        const g = this.waterBackGraphics
        g.clear()

        // Deep water gradient layers
        for (let i = 3; i >= 0; i--) {
            const layerY = this.waterSurface + i * 30
            const alpha = 0.15 + i * 0.1
            g.rect(0, layerY, this.width, this.height - layerY)
            g.fill({ color: 0x004080, alpha })
        }

        // Main water body
        g.rect(0, this.waterSurface, this.width, this.height - this.waterSurface)
        g.fill({ color: 0x0077be, alpha: 0.35 })
    }

    private drawWaterFront(): void {
        const g = this.waterFrontGraphics
        g.clear()

        // Water surface wave
        g.moveTo(0, this.waterSurface)
        for (let x = 0; x <= this.width; x += 8) {
            const waveY =
                this.waterSurface +
                Math.sin(x * 0.03 + this.time * 4) * 4 +
                Math.sin(x * 0.05 - this.time * 2) * 2
            g.lineTo(x, waveY)
        }
        g.lineTo(this.width, this.waterSurface + 15)
        g.lineTo(0, this.waterSurface + 15)
        g.closePath()
        g.fill({ color: 0x40a0ff, alpha: 0.4 })

        // Surface highlight
        g.moveTo(0, this.waterSurface - 2)
        for (let x = 0; x <= this.width; x += 10) {
            const waveY = this.waterSurface - 2 + Math.sin(x * 0.03 + this.time * 4) * 3
            g.lineTo(x, waveY)
        }
        g.stroke({ color: 0x80d0ff, width: 2, alpha: 0.5 })
    }

    private drawBubbles(): void {
        const g = this.bubbleGraphics
        g.clear()

        this.bubbles.forEach((b) => {
            // Bubble body
            g.circle(b.x, b.y, b.size)
            g.fill({ color: 0xffffff, alpha: 0.2 })
            g.circle(b.x, b.y, b.size)
            g.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })

            // Highlight
            g.circle(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.3)
            g.fill({ color: 0xffffff, alpha: 0.4 })
        })
    }

    private drawSplashes(): void {
        const g = this.splashGraphics
        g.clear()

        this.splashes.forEach((s) => {
            g.circle(s.x, s.y, 3 + s.life * 3)
            g.fill({ color: 0x60c0ff, alpha: s.life * 0.8 })
        })
    }

    private drawRipples(): void {
        const g = this.rippleGraphics
        g.clear()

        this.ripples.forEach((r) => {
            g.ellipse(r.x, this.waterSurface, r.radius, r.radius * 0.3)
            g.stroke({ color: 0x80d0ff, width: 2, alpha: r.life * 0.5 })
        })
    }
}
