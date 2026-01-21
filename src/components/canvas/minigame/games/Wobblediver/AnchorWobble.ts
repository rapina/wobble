/**
 * AnchorWobble.ts - Helper wobble that presses a switch to shake the rope
 *
 * A cute character sits next to a big switch/lever. Periodically jumps on
 * the switch to add energy to the pendulum, causing the swinging wobble
 * to react with a pained expression.
 */

import { Container, Graphics } from 'pixi.js'
import { Blob, BlobExpression } from '@/components/canvas/Blob'

export class AnchorWobble {
    public container: Container
    private blob: Blob
    private switchGraphics: Graphics
    private leverGraphics: Graphics

    // Animation state
    private time = 0
    private pressTimer = 0
    private pressCooldown = 5.0 // Seconds between presses
    private isPressing = false
    private pressProgress = 0
    private hasTriggeredCallback = false // Prevent multiple callback calls per press

    // Switch state
    private leverAngle = 0 // 0 = up, 1 = down

    // Position
    public x: number
    public y: number

    // Callbacks
    public onPress?: () => void

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.container = new Container()
        this.container.position.set(x, y)

        // Create switch base
        this.switchGraphics = new Graphics()
        this.drawSwitchBase()
        this.container.addChild(this.switchGraphics)

        // Create lever
        this.leverGraphics = new Graphics()
        this.drawLever(0)
        this.container.addChild(this.leverGraphics)

        // Create wobble (positioned to the side, ready to jump on switch)
        this.blob = new Blob({
            size: 18,
            color: 0x9b59b6, // Purple color
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.2,
            glowColor: 0x9b59b6,
        })
        this.blob.setPosition(35, -8)
        this.container.addChild(this.blob)
    }

    private drawSwitchBase(): void {
        const g = this.switchGraphics
        g.clear()

        // Switch base/housing
        g.roundRect(-15, -8, 30, 16, 4)
        g.fill({ color: 0x4a4a5a })
        g.stroke({ color: 0x3a3a4a, width: 2 })

        // Decorative dots (like indicator lights)
        g.circle(-8, 0, 3)
        g.fill({ color: 0x2ecc71, alpha: 0.8 }) // Green light

        g.circle(8, 0, 3)
        g.fill({ color: 0x333344 }) // Off light
    }

    private drawLever(pressAmount: number): void {
        const g = this.leverGraphics
        g.clear()

        // Lever pivot point
        const pivotX = 0
        const pivotY = -8

        // Lever arm - rotates based on press amount
        const leverLength = 25
        const baseAngle = -Math.PI / 6 // Starting angle (up)
        const pressedAngle = Math.PI / 6 // Pressed angle (down)
        const currentAngle = baseAngle + (pressedAngle - baseAngle) * pressAmount

        const endX = pivotX + Math.sin(currentAngle) * leverLength
        const endY = pivotY - Math.cos(currentAngle) * leverLength

        // Lever arm
        g.moveTo(pivotX, pivotY)
        g.lineTo(endX, endY)
        g.stroke({ color: 0xc9a227, width: 6 }) // Gold lever
        g.stroke({ color: 0xa88a17, width: 4 })

        // Lever handle (big button on top)
        g.circle(endX, endY, 10)
        g.fill({ color: 0xe74c3c }) // Red button
        g.stroke({ color: 0xc0392b, width: 2 })

        // Highlight on button
        g.circle(endX - 2, endY - 2, 4)
        g.fill({ color: 0xec7063, alpha: 0.6 })

        // Pivot joint
        g.circle(pivotX, pivotY, 5)
        g.fill({ color: 0x5d5d6d })
        g.stroke({ color: 0x4d4d5d, width: 2 })
    }

    /**
     * Update animation
     */
    update(deltaSeconds: number): void {
        this.time += deltaSeconds
        this.pressTimer += deltaSeconds

        // Check if it's time to press
        if (!this.isPressing && this.pressTimer >= this.pressCooldown) {
            this.startPress()
        }

        // Update press animation
        if (this.isPressing) {
            this.updatePress(deltaSeconds)
        } else {
            // Idle animation - wobble anticipates the press
            const timeToPress = this.pressCooldown - this.pressTimer

            if (timeToPress < 0.8) {
                // Getting ready to jump - crouch and prepare
                const prepProgress = 1 - timeToPress / 0.8
                const crouch = Math.sin(prepProgress * Math.PI * 0.5) * 5
                this.blob.setPosition(35 - prepProgress * 15, -8 + crouch)
                this.blob.updateOptions({
                    scaleX: 1 + prepProgress * 0.15,
                    scaleY: 1 - prepProgress * 0.1,
                })
            } else {
                // Normal idle - gentle bounce
                this.blob.setPosition(35, -8 + Math.sin(this.time * 3) * 2)
                this.blob.updateOptions({
                    scaleX: 1,
                    scaleY: 1,
                })
            }
        }

        // Update expression
        this.updateExpression()
    }

    private startPress(): void {
        this.isPressing = true
        this.pressProgress = 0
        this.pressTimer = 0
        this.hasTriggeredCallback = false
    }

    private updatePress(deltaSeconds: number): void {
        this.pressProgress += deltaSeconds

        const jumpDuration = 0.15 // Jump to switch
        const pressDuration = 0.1 // Press down
        const bounceDuration = 0.25 // Bounce back up
        const returnDuration = 0.2 // Return to position
        const totalDuration = jumpDuration + pressDuration + bounceDuration + returnDuration

        if (this.pressProgress >= totalDuration) {
            this.isPressing = false
            this.pressProgress = 0
            this.leverAngle = 0
            this.drawLever(0)
            return
        }

        let blobX = 35
        let blobY = -8
        let scaleX = 1
        let scaleY = 1

        if (this.pressProgress < jumpDuration) {
            // Jump arc to the switch
            const t = this.pressProgress / jumpDuration
            const arcHeight = 20
            blobX = 35 - t * 35 // Move from side to center
            blobY = -8 - Math.sin(t * Math.PI) * arcHeight // Arc up
            scaleY = 1 + Math.sin(t * Math.PI) * 0.2 // Stretch while jumping
            scaleX = 1 - Math.sin(t * Math.PI) * 0.1
        } else if (this.pressProgress < jumpDuration + pressDuration) {
            // Press down on switch
            const t = (this.pressProgress - jumpDuration) / pressDuration
            blobX = 0
            blobY = -28 + t * 10 // Press down
            this.leverAngle = t
            this.drawLever(t)
            scaleX = 1 + t * 0.3 // Squish on impact
            scaleY = 1 - t * 0.2

            // Trigger callback at the press moment (only once per press)
            if (t > 0.5 && this.onPress && !this.hasTriggeredCallback) {
                this.onPress()
                this.hasTriggeredCallback = true
            }
        } else if (this.pressProgress < jumpDuration + pressDuration + bounceDuration) {
            // Bounce back up
            const t = (this.pressProgress - jumpDuration - pressDuration) / bounceDuration
            blobX = 0 + t * 20 // Move toward return position
            blobY = -18 - Math.sin(t * Math.PI) * 15 // Bounce up
            this.leverAngle = 1 - t
            this.drawLever(1 - t)
            scaleX = 1.3 - t * 0.3
            scaleY = 0.8 + t * 0.2
        } else {
            // Return to idle position
            const t =
                (this.pressProgress - jumpDuration - pressDuration - bounceDuration) /
                returnDuration
            blobX = 20 + t * 15
            blobY = -18 + t * 10
            this.leverAngle = 0
            this.drawLever(0)
        }

        this.blob.setPosition(blobX, blobY)
        this.blob.updateOptions({ scaleX, scaleY })
    }

    private updateExpression(): void {
        let expression: BlobExpression = 'happy'

        if (this.isPressing) {
            const jumpDuration = 0.15
            const pressDuration = 0.1

            if (this.pressProgress < jumpDuration) {
                expression = 'excited' // Jumping
            } else if (this.pressProgress < jumpDuration + pressDuration) {
                expression = 'effort' // Pressing hard
            } else {
                expression = 'happy' // Bouncing back
            }
        } else {
            // Idle - anticipate press
            const timeToPress = this.pressCooldown - this.pressTimer
            if (timeToPress < 0.5) {
                expression = 'angry' // Concentrating before jump
            } else if (timeToPress < 0.8) {
                expression = 'excited' // Getting ready
            }
        }

        this.blob.updateOptions({
            expression,
            wobblePhase: this.time * 2,
        })
    }

    /**
     * Set press cooldown (difficulty adjustment)
     */
    setPressCooldown(seconds: number): void {
        this.pressCooldown = seconds
    }

    destroy(): void {
        this.container.destroy({ children: true })
    }
}
