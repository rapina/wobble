import { Ticker, Graphics, Text, TextStyle } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Wobble, WobbleExpression } from '../Wobble'
import { clamp, lerp } from '../../../utils/pixiHelpers'

/**
 * TorqueScene - 토크 (τ = rF sin θ)
 * Pentagon (Penta) pushes the lever arm to create rotation
 * Penta is at the end of the lever, applying force to rotate around pivot
 */
export class TorqueScene extends BaseScene {
    declare private penta: Wobble
    declare private leverGraphics: Graphics
    declare private forceGraphics: Graphics
    declare private uiGraphics: Graphics
    declare private rotationGraphics: Graphics

    // Displayed values (smoothed)
    declare private displayedR: number
    declare private displayedF: number
    declare private displayedTheta: number

    // Animation state
    declare private time: number
    declare private rotationAngle: number
    declare private rotationVelocity: number

    // Push animation
    declare private pushPhase: number

    declare private statusLabel: Text

    protected setup(): void {
        this.displayedR = 0.5
        this.displayedF = 50
        this.displayedTheta = 90
        this.time = 0
        this.rotationAngle = 0
        this.rotationVelocity = 0
        this.pushPhase = 0

        // Separate graphics for each element to avoid path issues
        this.leverGraphics = new Graphics()
        this.container.addChild(this.leverGraphics)

        this.forceGraphics = new Graphics()
        this.container.addChild(this.forceGraphics)

        this.rotationGraphics = new Graphics()
        this.container.addChild(this.rotationGraphics)

        this.uiGraphics = new Graphics()
        this.container.addChild(this.uiGraphics)

        // Pentagon (Penta) - pushes the lever
        this.penta = new Wobble({
            size: 45,
            color: 0x82e0aa, // Green for Penta
            shape: 'pentagon',
            expression: 'effort',
            showShadow: true,
        })
        this.container.addChild(this.penta)

        // Status label
        const labelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xffffff,
        })
        this.statusLabel = new Text({ text: '', style: labelStyle })
        this.statusLabel.position.set(20, 20)
        this.container.addChild(this.statusLabel)
    }

    protected onVariablesChange(): void {
        // Read in animate()
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67

        // Get target values
        const targetR = this.variables['r'] ?? 0.5
        const targetF = this.variables['F'] ?? 50
        const targetTheta = this.variables['θ'] ?? 90

        // Smooth parameter changes
        this.displayedR = lerp(this.displayedR, targetR, 0.08)
        this.displayedF = lerp(this.displayedF, targetF, 0.08)
        this.displayedTheta = lerp(this.displayedTheta, targetTheta, 0.08)

        // Calculate torque: τ = r × F × sin(θ)
        const thetaRad = (this.displayedTheta * Math.PI) / 180
        const torque = this.displayedR * this.displayedF * Math.sin(thetaRad)

        // Update time
        this.time += delta * 0.02
        this.pushPhase += delta * 0.08

        // Apply torque to rotation (simplified physics)
        const momentOfInertia = 10
        const angularAccel = torque / momentOfInertia
        this.rotationVelocity += angularAccel * delta * 0.001

        // Apply damping
        this.rotationVelocity *= 0.98

        // Update rotation
        this.rotationAngle += this.rotationVelocity * delta

        // Lever geometry
        const pivotX = this.centerX
        const pivotY = this.centerY
        const leverLength = 60 + this.displayedR * 80

        // Penta position at end of lever
        const pentaX = pivotX + Math.cos(this.rotationAngle) * leverLength
        const pentaY = pivotY + Math.sin(this.rotationAngle) * leverLength

        // Expression based on force and effort
        let expression: WobbleExpression = 'effort'
        const absVel = Math.abs(this.rotationVelocity)
        if (absVel > 0.12) {
            expression = 'excited'
        } else if (this.displayedF > 120) {
            expression = 'effort'
        } else if (this.displayedF < 30) {
            expression = 'happy'
        }

        // Push animation - Penta squashes when pushing hard
        const pushIntensity = (this.displayedF / 150) * Math.sin(this.pushPhase)
        const scaleX = 1 + pushIntensity * 0.15
        const scaleY = 1 - pushIntensity * 0.1

        this.penta.setPosition(pentaX, pentaY)
        this.penta.updateOptions({
            expression,
            scaleX: clamp(scaleX, 0.85, 1.15),
            scaleY: clamp(scaleY, 0.85, 1.15),
            wobblePhase: this.time * 2,
        })

        // Draw elements separately
        this.drawLever(pivotX, pivotY, leverLength)
        this.drawForce(pentaX, pentaY)
        this.drawRotationIndicator(pivotX, pivotY)
        this.drawUI(torque)
        this.updateStatus(torque)
    }

    private drawLever(pivotX: number, pivotY: number, leverLength: number): void {
        const g = this.leverGraphics
        g.clear()

        const leverAngle = this.rotationAngle

        // Calculate lever end point (where Penta is)
        const leverEndX = pivotX + Math.cos(leverAngle) * leverLength
        const leverEndY = pivotY + Math.sin(leverAngle) * leverLength

        // Lever outline (draw first for border effect)
        g.moveTo(pivotX, pivotY)
        g.lineTo(leverEndX, leverEndY)
        g.stroke({ color: 0x444455, width: 16, cap: 'round' })

        // Main lever body
        g.moveTo(pivotX, pivotY)
        g.lineTo(leverEndX, leverEndY)
        g.stroke({ color: 0x666677, width: 12, cap: 'round' })

        // Pivot point (center fulcrum)
        g.circle(pivotX, pivotY, 15)
        g.fill(0x555566)
        g.stroke({ color: 0x444455, width: 3 })

        // Inner pivot detail
        g.circle(pivotX, pivotY, 6)
        g.fill(0x333344)

        // Distance marker (r) - curved arc below
        const arcRadius = leverLength + 25
        const arcStartAngle = leverAngle - 0.1
        const arcEndAngle = leverAngle + 0.1

        // Draw r dimension line
        const rMarkerY = pivotY + 50
        g.moveTo(pivotX, rMarkerY)
        g.lineTo(pivotX + Math.cos(leverAngle) * leverLength, rMarkerY)
        g.stroke({ color: 0x82e0aa, width: 2, alpha: 0.7 })

        // Vertical ticks
        g.moveTo(pivotX, rMarkerY - 6)
        g.lineTo(pivotX, rMarkerY + 6)
        g.moveTo(pivotX + Math.cos(leverAngle) * leverLength, rMarkerY - 6)
        g.lineTo(pivotX + Math.cos(leverAngle) * leverLength, rMarkerY + 6)
        g.stroke({ color: 0x82e0aa, width: 2, alpha: 0.7 })

        // r label
        const rLabelX = pivotX + (Math.cos(leverAngle) * leverLength) / 2
        g.roundRect(rLabelX - 12, rMarkerY + 8, 24, 16, 4)
        g.fill({ color: 0x82e0aa, alpha: 0.8 })
    }

    private drawForce(pentaX: number, pentaY: number): void {
        const g = this.forceGraphics
        g.clear()

        const leverAngle = this.rotationAngle

        // Force arrow from Penta (tangent to rotation = perpendicular to lever)
        // θ = 90° means force is tangent (most effective)
        // θ = 0° means force is along lever (no torque)
        const tangentAngle = leverAngle + Math.PI / 2 // Perpendicular to lever
        const forceAngleOffset = ((90 - this.displayedTheta) * Math.PI) / 180
        const absoluteForceAngle = tangentAngle - forceAngleOffset

        const forceLength = 25 + this.displayedF * 0.4

        // Force starts slightly away from Penta
        const forceStartOffset = 30
        const forceStartX = pentaX + Math.cos(absoluteForceAngle + Math.PI) * forceStartOffset
        const forceStartY = pentaY + Math.sin(absoluteForceAngle + Math.PI) * forceStartOffset

        // Force arrow points toward Penta's push direction
        const forceEndX = forceStartX + Math.cos(absoluteForceAngle + Math.PI) * forceLength
        const forceEndY = forceStartY + Math.sin(absoluteForceAngle + Math.PI) * forceLength

        // Draw force arrow (from outside pointing at Penta's push)
        g.moveTo(forceEndX, forceEndY)
        g.lineTo(forceStartX, forceStartY)
        g.stroke({ color: 0xf7dc6f, width: 4 })

        // Arrow head at the start (showing push direction)
        const arrowSize = 12
        const arrowAngle = absoluteForceAngle
        g.moveTo(forceStartX, forceStartY)
        g.lineTo(
            forceStartX + Math.cos(arrowAngle - 2.7) * arrowSize,
            forceStartY + Math.sin(arrowAngle - 2.7) * arrowSize
        )
        g.moveTo(forceStartX, forceStartY)
        g.lineTo(
            forceStartX + Math.cos(arrowAngle + 2.7) * arrowSize,
            forceStartY + Math.sin(arrowAngle + 2.7) * arrowSize
        )
        g.stroke({ color: 0xf7dc6f, width: 4, cap: 'round' })

        // F label
        g.roundRect(forceEndX - 12, forceEndY - 25, 24, 18, 4)
        g.fill({ color: 0xf7dc6f, alpha: 0.8 })
    }

    private drawRotationIndicator(pivotX: number, pivotY: number): void {
        const g = this.rotationGraphics
        g.clear()

        // Only show rotation indicator when rotating noticeably
        if (Math.abs(this.rotationVelocity) < 0.012) return

        const arrowRadius = 35
        const direction = this.rotationVelocity > 0 ? 1 : -1

        // Arc showing rotation direction around pivot
        const arcLength = 1.2
        const startAngle = -Math.PI / 2 - (direction * arcLength) / 2
        const endAngle = -Math.PI / 2 + (direction * arcLength) / 2

        g.arc(pivotX, pivotY, arrowRadius, startAngle, endAngle, direction < 0)
        g.stroke({ color: 0xff6b6b, width: 3, alpha: 0.7 })

        // Arrow tip on arc
        const tipAngle = endAngle
        const tipX = pivotX + Math.cos(tipAngle) * arrowRadius
        const tipY = pivotY + Math.sin(tipAngle) * arrowRadius
        const tangent = tipAngle + (direction * Math.PI) / 2

        g.moveTo(tipX, tipY)
        g.lineTo(tipX - Math.cos(tangent - 0.5) * 8, tipY - Math.sin(tangent - 0.5) * 8)
        g.moveTo(tipX, tipY)
        g.lineTo(tipX - Math.cos(tangent + 0.5) * 8, tipY - Math.sin(tangent + 0.5) * 8)
        g.stroke({ color: 0xff6b6b, width: 3, cap: 'round', alpha: 0.7 })
    }

    private drawUI(torque: number): void {
        const g = this.uiGraphics
        g.clear()

        // Torque indicator (right side)
        const torqueBarX = this.width - 40
        const torqueBarHeight = 120
        const torqueBarY = this.centerY - torqueBarHeight / 2
        const maxTorque = 200
        const torqueRatio = clamp(Math.abs(torque) / maxTorque, 0, 1)

        // Background
        g.roundRect(torqueBarX, torqueBarY, 20, torqueBarHeight, 4)
        g.fill(0x333344)

        // Fill
        const fillHeight = torqueRatio * (torqueBarHeight - 4)
        g.roundRect(
            torqueBarX + 2,
            torqueBarY + torqueBarHeight - 2 - fillHeight,
            16,
            fillHeight,
            2
        )

        const torqueColor =
            Math.abs(torque) > 100 ? 0xff6b6b : Math.abs(torque) > 50 ? 0xf7dc6f : 0x4ecdc4
        g.fill(torqueColor)

        // τ label
        g.roundRect(torqueBarX - 2, torqueBarY - 25, 24, 20, 4)
        g.fill({ color: torqueColor, alpha: 0.8 })

        // Sin(θ) effectiveness indicator (bottom)
        const sinValue = Math.sin((this.displayedTheta * Math.PI) / 180)
        const sinBarX = 50
        const sinBarY = this.height - 40
        const sinBarWidth = 100

        // Label
        g.roundRect(sinBarX - 5, sinBarY - 25, 55, 18, 4)
        g.fill({ color: 0xbb8fce, alpha: 0.7 })

        // Bar background
        g.roundRect(sinBarX, sinBarY, sinBarWidth, 12, 4)
        g.fill(0x333344)

        // Fill based on sin value
        g.roundRect(sinBarX + 2, sinBarY + 2, sinValue * (sinBarWidth - 4), 8, 2)
        g.fill(0xbb8fce)
    }

    private updateStatus(torque: number): void {
        this.statusLabel.text = `τ = ${this.displayedR.toFixed(2)} × ${this.displayedF.toFixed(0)} × sin(${this.displayedTheta.toFixed(0)}°) = ${torque.toFixed(1)} N·m`

        if (Math.abs(torque) > 100) {
            this.statusLabel.style.fill = 0xff6b6b
        } else if (Math.abs(torque) > 50) {
            this.statusLabel.style.fill = 0xf7dc6f
        } else {
            this.statusLabel.style.fill = 0x4ecdc4
        }
    }
}
