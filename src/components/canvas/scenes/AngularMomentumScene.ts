import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface TrailPoint {
    x: number
    y: number
    alpha: number
}

export class AngularMomentumScene extends BaseScene {
    declare private graphics: Graphics
    declare private skaterBlob: Blob
    declare private rotation: number
    declare private armExtension: number
    declare private targetArmExtension: number
    declare private trailPoints: TrailPoint[]
    declare private time: number

    protected setup(): void {
        this.rotation = 0
        this.armExtension = 0.5
        this.targetArmExtension = 0.5
        this.trailPoints = []
        this.time = 0

        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        // Skater blob
        this.skaterBlob = new Blob({
            size: 40,
            color: 0x5dade2,
            shape: 'circle',
            expression: 'happy',
        })
        this.skaterBlob.setPosition(this.centerX, this.centerY - 20)
        this.container.addChild(this.skaterBlob)
    }

    protected onVariablesChange(): void {
        const I = this.variables['I'] || 10
        // Arm extension based on moment of inertia (1-20 maps to 0.1-1.0)
        this.targetArmExtension = (I - 1) / 19
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.01

        const L = this.variables['L'] || 50
        const I = this.variables['I'] || 10
        const omega = L / I

        // Smoothly animate arm extension
        this.armExtension += (this.targetArmExtension - this.armExtension) * 0.1 * delta

        // Update rotation based on angular velocity
        this.rotation += omega * 0.05 * delta

        // Update blob expression based on speed
        const expression =
            omega > 20 ? 'dizzy' : omega > 10 ? 'excited' : omega > 5 ? 'happy' : 'neutral'

        this.skaterBlob.setPosition(this.centerX, this.centerY - 20)
        this.skaterBlob.updateOptions({
            size: 35 + this.armExtension * 15,
            wobblePhase: this.time * omega * 0.5,
            expression,
        })

        // Add trail points for fast rotations
        if (omega > 8) {
            const armRadius = 30 + this.armExtension * 50
            const leftArmX = this.centerX + Math.cos(this.rotation) * armRadius
            const leftArmY = this.centerY - 20 + Math.sin(this.rotation) * armRadius
            const rightArmX = this.centerX + Math.cos(this.rotation + Math.PI) * armRadius
            const rightArmY = this.centerY - 20 + Math.sin(this.rotation + Math.PI) * armRadius

            this.trailPoints.push(
                { x: leftArmX, y: leftArmY, alpha: 0.6 },
                { x: rightArmX, y: rightArmY, alpha: 0.6 }
            )
        }

        // Update trail points
        this.trailPoints.forEach((point) => {
            point.alpha -= 0.02 * delta
        })
        this.trailPoints = this.trailPoints.filter((p) => p.alpha > 0)

        // Keep only recent trail points
        if (this.trailPoints.length > 100) {
            this.trailPoints = this.trailPoints.slice(-100)
        }

        this.drawScene(L, I, omega)
    }

    private drawScene(L: number, I: number, omega: number): void {
        const g = this.graphics
        g.clear()

        const cx = this.centerX
        const cy = this.centerY - 20
        const armRadius = 30 + this.armExtension * 50

        // Draw rotation circle guide
        g.circle(cx, cy, armRadius + 10)
        g.stroke({ color: 0x5dade2, width: 1, alpha: 0.2 })

        // Draw trail
        this.trailPoints.forEach((point) => {
            g.circle(point.x, point.y, 4)
            g.fill({ color: 0x5dade2, alpha: point.alpha * 0.5 })
        })

        // Draw arms with hands
        const leftAngle = this.rotation
        const rightAngle = this.rotation + Math.PI

        // Left arm
        const leftHandX = cx + Math.cos(leftAngle) * armRadius
        const leftHandY = cy + Math.sin(leftAngle) * armRadius
        g.moveTo(cx, cy)
        g.lineTo(leftHandX, leftHandY)
        g.stroke({ color: 0xf5b041, width: 6, alpha: 0.9 })
        g.circle(leftHandX, leftHandY, 8)
        g.fill({ color: 0xf5b041, alpha: 0.9 })

        // Right arm
        const rightHandX = cx + Math.cos(rightAngle) * armRadius
        const rightHandY = cy + Math.sin(rightAngle) * armRadius
        g.moveTo(cx, cy)
        g.lineTo(rightHandX, rightHandY)
        g.stroke({ color: 0xf5b041, width: 6, alpha: 0.9 })
        g.circle(rightHandX, rightHandY, 8)
        g.fill({ color: 0xf5b041, alpha: 0.9 })

        // Draw rotation indicator (angular velocity visualization)
        this.drawRotationIndicator(g, cx, cy + 100, omega)

        // Draw angular momentum meter
        this.drawMomentumMeter(g, L, I, omega)
    }

    private drawRotationIndicator(g: Graphics, x: number, y: number, omega: number): void {
        const radius = 35

        // Background circle
        g.circle(x, y, radius)
        g.fill({ color: 0x000000, alpha: 0.3 })

        // Speed arc (shows angular velocity)
        const arcLength = Math.min(omega / 20, 1) * Math.PI * 1.5
        if (arcLength > 0) {
            g.moveTo(x, y)
            g.arc(x, y, radius - 5, -Math.PI / 2, -Math.PI / 2 + arcLength)
            g.lineTo(x, y)
            g.closePath()
            g.fill({
                color: omega > 15 ? 0xe74c3c : omega > 8 ? 0xf39c12 : 0x2ecc71,
                alpha: 0.7,
            })
        }

        // Center indicator rotating
        const indicatorAngle = this.rotation * 2
        const indicatorLength = radius - 10
        g.moveTo(x, y)
        g.lineTo(
            x + Math.cos(indicatorAngle) * indicatorLength,
            y + Math.sin(indicatorAngle) * indicatorLength
        )
        g.stroke({ color: 0xffffff, width: 3, alpha: 0.9 })

        // Center dot
        g.circle(x, y, 4)
        g.fill({ color: 0xffffff, alpha: 0.9 })

        // Border
        g.circle(x, y, radius)
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.5 })
    }

    private drawMomentumMeter(g: Graphics, L: number, I: number, omega: number): void {
        const meterX = this.centerX - 70
        const meterY = this.height - 35
        const meterWidth = 140
        const meterHeight = 14

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.fill({ color: 0x222222, alpha: 0.7 })

        // Fill based on omega (capped at certain value for display)
        const fillRatio = Math.min(omega / 30, 1)
        const fillWidth = meterWidth * fillRatio

        if (fillWidth > 0) {
            const fillColor = omega > 20 ? 0xe74c3c : omega > 10 ? 0xf39c12 : 0x5dade2
            g.roundRect(meterX, meterY, fillWidth, meterHeight, 5)
            g.fill({ color: fillColor, alpha: 0.85 })
        }

        // Border
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })

        // I indicator (where arm extension maps to)
        const iRatio = (I - 1) / 19
        const iMarkerX = meterX + 10 + iRatio * (meterWidth - 20)

        // Draw small triangle marker for I
        g.moveTo(iMarkerX, meterY - 3)
        g.lineTo(iMarkerX - 4, meterY - 8)
        g.lineTo(iMarkerX + 4, meterY - 8)
        g.closePath()
        g.fill({ color: 0xf5b041, alpha: 0.9 })
    }
}
