import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../../../Wobble'
import { easeOutBack, easeOutQuad } from '../utils'
import { StageConfig, getDefaultStage } from '../PhysicsModifiers'

export interface OpeningScreenContext {
    container: Container
    width: number
    height: number
}

export class OpeningScreen {
    private screenContainer: Container
    private width: number
    private height: number
    private centerX: number
    private centerY: number

    // Animation state
    private animTime = 0
    private isVisible = false
    private phase: 'intro' | 'ready' | 'go' = 'intro'

    // UI elements
    private bgGraphics: Graphics | null = null
    private entityGraphics: Graphics | null = null
    private playerWobble: Wobble | null = null
    private titleText: Text | null = null
    private subtitleText: Text | null = null
    private tipText: Text | null = null
    private skipText: Text | null = null
    private readyText: Text | null = null

    // Selected character and stage
    private selectedCharacter: WobbleShape = 'circle'
    private selectedStage: StageConfig = getDefaultStage()

    // Timing
    private readonly INTRO_DURATION = 2.8
    private readonly READY_DURATION = 1.0
    private readonly GO_DURATION = 0.5
    private readonly TOTAL_DURATION = this.INTRO_DURATION + this.READY_DURATION + this.GO_DURATION

    // Callbacks
    onComplete?: () => void
    onSkip?: () => void

    constructor(context: OpeningScreenContext) {
        this.screenContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
        this.centerY = context.height / 2
    }

    get visible(): boolean {
        return this.isVisible
    }

    show(character: WobbleShape, stage?: StageConfig): void {
        this.isVisible = true
        this.animTime = 0
        this.phase = 'intro'
        this.selectedCharacter = character
        this.selectedStage = stage || getDefaultStage()
        this.screenContainer.visible = true

        this.screenContainer.removeChildren()
        this.createUI()

        // Make interactive for skip
        this.screenContainer.eventMode = 'static'
        this.screenContainer.cursor = 'pointer'
        this.screenContainer.on('pointerdown', () => this.skip())
    }

    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
        this.screenContainer.eventMode = 'none'
        this.screenContainer.off('pointerdown')

        if (this.playerWobble) {
            this.playerWobble.destroy()
            this.playerWobble = null
        }
    }

    private skip(): void {
        this.onSkip?.()
        this.onComplete?.()
    }

    update(deltaSeconds: number): void {
        if (!this.isVisible) return

        this.animTime += deltaSeconds

        // Update phase
        if (this.animTime < this.INTRO_DURATION) {
            this.phase = 'intro'
        } else if (this.animTime < this.INTRO_DURATION + this.READY_DURATION) {
            this.phase = 'ready'
        } else if (this.animTime < this.TOTAL_DURATION) {
            this.phase = 'go'
        } else {
            this.onComplete?.()
            return
        }

        this.updateAnimations()
    }

    private createUI(): void {
        // Background with stage theme
        this.bgGraphics = new Graphics()
        this.screenContainer.addChild(this.bgGraphics)
        this.drawBackground()

        // Entity graphics layer
        this.entityGraphics = new Graphics()
        this.screenContainer.addChild(this.entityGraphics)

        // Player wobble (center, will animate in)
        const charData = WOBBLE_CHARACTERS[this.selectedCharacter]
        this.playerWobble = new Wobble({
            size: 70,
            shape: this.selectedCharacter,
            color: charData.color,
            expression: 'happy',
            showShadow: true,
        })
        this.playerWobble.position.set(this.centerX, this.centerY + 60)
        this.playerWobble.scale.set(0)
        this.screenContainer.addChild(this.playerWobble)

        // Stage name text (large)
        this.titleText = new Text({
            text: this.selectedStage.nameKo,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 32,
                fontWeight: 'bold',
                fill: this.getTextColor(),
                align: 'center',
                dropShadow: {
                    color: 0x000000,
                    blur: 6,
                    distance: 2,
                    alpha: 0.5,
                },
            }),
        })
        this.titleText.anchor.set(0.5)
        this.titleText.position.set(this.centerX, 45)
        this.titleText.alpha = 0
        this.screenContainer.addChild(this.titleText)

        // Stage trait description
        this.subtitleText = new Text({
            text: this.selectedStage.trait,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fill: this.getSubtextColor(),
                align: 'center',
                fontStyle: 'italic',
            }),
        })
        this.subtitleText.anchor.set(0.5)
        this.subtitleText.position.set(this.centerX, 80)
        this.subtitleText.alpha = 0
        this.screenContainer.addChild(this.subtitleText)

        // Gameplay tip (bottom area)
        this.tipText = new Text({
            text: `TIP: ${this.selectedStage.tip}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fill: this.getTextColor(),
                align: 'center',
                fontWeight: 'bold',
            }),
        })
        this.tipText.anchor.set(0.5)
        this.tipText.position.set(this.centerX, this.height - 70)
        this.tipText.alpha = 0
        this.screenContainer.addChild(this.tipText)

        // Ready text (hidden initially) - Balatro gold
        this.readyText = new Text({
            text: 'READY',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 48,
                fontWeight: 'bold',
                fill: 0xc9a227,
                align: 'center',
                dropShadow: {
                    color: 0x1a1a1a,
                    blur: 8,
                    distance: 2,
                    alpha: 0.6,
                },
            }),
        })
        this.readyText.anchor.set(0.5)
        this.readyText.position.set(this.centerX, this.centerY - 40)
        this.readyText.alpha = 0
        this.readyText.scale.set(0)
        this.screenContainer.addChild(this.readyText)

        // Skip instruction
        this.skipText = new Text({
            text: '탭하여 건너뛰기',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: this.getSubtextColor(),
            }),
        })
        this.skipText.anchor.set(0.5)
        this.skipText.position.set(this.centerX, this.height - 25)
        this.screenContainer.addChild(this.skipText)
    }

    private getTextColor(): number {
        // Light text for dark backgrounds, dark text for light backgrounds
        const bg = this.selectedStage.bgColor
        const brightness = ((bg >> 16) & 0xff) + ((bg >> 8) & 0xff) + (bg & 0xff)
        return brightness < 384 ? 0xffffff : 0x2d2d2d
    }

    private getSubtextColor(): number {
        const bg = this.selectedStage.bgColor
        const brightness = ((bg >> 16) & 0xff) + ((bg >> 8) & 0xff) + (bg & 0xff)
        return brightness < 384 ? 0xcccccc : 0x555555
    }

    private drawBackground(): void {
        if (!this.bgGraphics) return

        this.bgGraphics.clear()

        const baseColor = this.selectedStage.bgColor
        const darkerColor = this.darkenColor(baseColor, 0.3)

        // Gradient background
        const bands = 10
        for (let i = 0; i < bands; i++) {
            const y = (i / bands) * this.height
            const h = this.height / bands + 1
            const blend = i / (bands - 1)
            const color = this.lerpColor(baseColor, darkerColor, blend)

            this.bgGraphics.rect(0, y, this.width, h)
            this.bgGraphics.fill(color)
        }

        // Vignette effect
        for (let i = 0; i < 5; i++) {
            const alpha = 0.15 * (1 - i / 5)
            this.bgGraphics.rect(0, i * 20, this.width, 20)
            this.bgGraphics.fill({ color: 0x000000, alpha })
            this.bgGraphics.rect(0, this.height - (i + 1) * 20, this.width, 20)
            this.bgGraphics.fill({ color: 0x000000, alpha })
        }
    }

    private updateAnimations(): void {
        const t = this.animTime

        // Intro phase animations
        if (this.phase === 'intro') {
            const introProgress = Math.min(1, t / 0.8)

            // Title fade in
            if (this.titleText) {
                this.titleText.alpha = easeOutQuad(introProgress)
                this.titleText.position.y = 45 + (1 - easeOutQuad(introProgress)) * -20
            }

            // Subtitle fade in (delayed)
            if (this.subtitleText) {
                const subtitleProgress = Math.max(0, Math.min(1, (t - 0.3) / 0.5))
                this.subtitleText.alpha = easeOutQuad(subtitleProgress)
            }

            // Tip fade in (delayed more)
            if (this.tipText) {
                const tipProgress = Math.max(0, Math.min(1, (t - 1.2) / 0.6))
                this.tipText.alpha = easeOutQuad(tipProgress)
            }

            // Player wobble entrance
            if (this.playerWobble) {
                const wobbleProgress = Math.max(0, Math.min(1, (t - 0.4) / 0.6))
                const scale = easeOutBack(wobbleProgress)
                this.playerWobble.scale.set(scale)

                // Breathing animation
                const breathe = Math.sin(t * 2) * 0.05
                this.playerWobble.updateOptions({
                    wobblePhase: t,
                    scaleX: scale * (1 + breathe),
                    scaleY: scale * (1 - breathe),
                    expression: 'happy',
                })
            }

            // Draw stage entity
            this.drawStageEntity(introProgress)
        }

        // Ready phase
        if (this.phase === 'ready') {
            const readyT = (t - this.INTRO_DURATION) / this.READY_DURATION

            if (this.readyText) {
                this.readyText.text = 'READY'
                this.readyText.style.fill = 0xc9a227 // Balatro gold

                const scaleProgress = Math.min(1, readyT * 3)
                this.readyText.scale.set(easeOutBack(scaleProgress))
                this.readyText.alpha = 1

                // Pulse effect
                const pulse = Math.sin(readyT * Math.PI * 4) * 0.1
                this.readyText.scale.set(1 + pulse)
            }

            // Player gets determined expression
            if (this.playerWobble) {
                this.playerWobble.updateOptions({ expression: 'effort' })
            }

            // Fade out texts
            if (this.titleText) this.titleText.alpha = 1 - readyT
            if (this.subtitleText) this.subtitleText.alpha = 1 - readyT
            if (this.tipText) this.tipText.alpha = 1 - readyT

            // Keep entity visible but fade
            this.drawStageEntity(1 - readyT * 0.5)
        }

        // Go phase
        if (this.phase === 'go') {
            const goT = (t - this.INTRO_DURATION - this.READY_DURATION) / this.GO_DURATION

            if (this.readyText) {
                this.readyText.text = 'GO!'
                this.readyText.style.fill = 0xffdd00

                // Scale up and fade out
                this.readyText.scale.set(1 + goT * 0.5)
                this.readyText.alpha = 1 - goT
            }

            // Player zoom forward
            if (this.playerWobble) {
                this.playerWobble.scale.set(1 + goT * 0.3)
                this.playerWobble.alpha = 1 - goT
            }

            // Fade out everything
            if (this.bgGraphics) this.bgGraphics.alpha = 1 - goT
            if (this.entityGraphics) this.entityGraphics.alpha = 1 - goT
            if (this.skipText) this.skipText.alpha = 1 - goT
        }

        // Skip text blink
        if (this.skipText && this.phase === 'intro') {
            this.skipText.alpha = 0.5 + Math.sin(t * 4) * 0.3
        }
    }

    private drawStageEntity(progress: number): void {
        if (!this.entityGraphics) return
        this.entityGraphics.clear()

        const alpha = progress * 0.8
        const t = this.animTime

        switch (this.selectedStage.id) {
            case 'normal':
                this.drawNormalEntity(alpha, t)
                break
            case 'low-gravity':
                this.drawGravityWells(alpha, t)
                break
            case 'elastic':
                this.drawRepulsionBarriers(alpha, t)
                break
            case 'momentum':
                this.drawCrushers(alpha, t)
                break
            case 'vortex':
                this.drawBlackHole(alpha, t)
                break
        }
    }

    private drawNormalEntity(alpha: number, t: number): void {
        if (!this.entityGraphics) return

        // Draw approaching enemy silhouettes for normal stage
        const count = 8
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count
            const baseDistance = Math.max(this.width, this.height) * 0.45
            const wobble = Math.sin(t * 2 + i) * 10
            const distance = baseDistance + wobble

            const x = this.centerX + Math.cos(angle) * distance
            const y = this.centerY + Math.sin(angle) * distance
            const size = 25 + Math.sin(i * 1.5) * 10

            // Enemy silhouette
            this.entityGraphics.circle(x, y, size)
            this.entityGraphics.fill({ color: 0x333333, alpha: alpha * 0.5 })

            // Eyes
            const eyeOffset = size * 0.3
            const eyeSize = size * 0.15
            this.entityGraphics.circle(x - eyeOffset, y - eyeSize, eyeSize)
            this.entityGraphics.circle(x + eyeOffset, y - eyeSize, eyeSize)
            this.entityGraphics.fill({ color: 0xff4444, alpha: alpha * 0.6 })
        }
    }

    private drawGravityWells(alpha: number, t: number): void {
        if (!this.entityGraphics) return

        // Draw 3 gravity wells
        const wells = [
            { x: this.centerX - 80, y: this.centerY - 80 },
            { x: this.centerX + 90, y: this.centerY - 40 },
            { x: this.centerX, y: this.centerY + 100 },
        ]

        for (let w = 0; w < wells.length; w++) {
            const well = wells[w]
            const phase = t * 2 + w * 2
            const pulse = 1 + Math.sin(phase) * 0.1
            const radius = 25 * pulse

            // Pull radius indicator
            this.entityGraphics.circle(well.x, well.y, radius * 4)
            this.entityGraphics.stroke({ color: 0x6666ff, width: 1, alpha: alpha * 0.2 })

            // Outer glow rings
            for (let i = 3; i >= 0; i--) {
                const ringRadius = (radius + i * 8) * pulse
                const ringAlpha = (0.15 - i * 0.03) * alpha
                this.entityGraphics.circle(well.x, well.y, ringRadius)
                this.entityGraphics.fill({ color: 0x4444aa, alpha: ringAlpha })
            }

            // Swirling particles
            const particleCount = 6
            for (let i = 0; i < particleCount; i++) {
                const angle = phase * 1.5 + (i * Math.PI * 2) / particleCount
                const orbitRadius = radius * 1.5 * pulse
                const px = well.x + Math.cos(angle) * orbitRadius
                const py = well.y + Math.sin(angle) * orbitRadius
                this.entityGraphics.circle(px, py, 3)
                this.entityGraphics.fill({ color: 0xaaaaff, alpha: alpha * 0.7 })
            }

            // Core
            this.entityGraphics.circle(well.x, well.y, radius * pulse)
            this.entityGraphics.fill({ color: 0x2222aa, alpha: alpha * 0.9 })

            // Bright center
            this.entityGraphics.circle(well.x, well.y, radius * 0.4 * pulse)
            this.entityGraphics.fill({ color: 0x6666ff, alpha: alpha })
        }
    }

    private drawRepulsionBarriers(alpha: number, t: number): void {
        if (!this.entityGraphics) return

        // Draw 4 rotating barriers
        const barriers = [
            { x: this.centerX - 70, y: this.centerY - 60, angle: t * 0.3 },
            { x: this.centerX + 80, y: this.centerY - 30, angle: -t * 0.4 + 1 },
            { x: this.centerX - 50, y: this.centerY + 80, angle: t * 0.35 + 2 },
            { x: this.centerX + 60, y: this.centerY + 60, angle: -t * 0.3 + 3 },
        ]

        for (const barrier of barriers) {
            const pulse = 1 + Math.sin(t * 3 + barrier.angle) * 0.1
            const width = 70 * pulse
            const height = 12 * pulse

            // Draw rotated rectangle
            this.drawRotatedRect(
                barrier.x, barrier.y, width + 10, height + 10,
                barrier.angle, 0xff69b4, alpha * 0.3
            )
            this.drawRotatedRect(
                barrier.x, barrier.y, width, height,
                barrier.angle, 0xff69b4, alpha * 0.9
            )

            // End caps
            const cos = Math.cos(barrier.angle)
            const sin = Math.sin(barrier.angle)
            const endOffset = width / 2
            const leftX = barrier.x - endOffset * cos
            const leftY = barrier.y - endOffset * sin
            const rightX = barrier.x + endOffset * cos
            const rightY = barrier.y + endOffset * sin

            this.entityGraphics.circle(leftX, leftY, height / 2)
            this.entityGraphics.fill({ color: 0xffaacc, alpha: alpha * 0.9 })
            this.entityGraphics.circle(rightX, rightY, height / 2)
            this.entityGraphics.fill({ color: 0xffaacc, alpha: alpha * 0.9 })
        }
    }

    private drawCrushers(alpha: number, t: number): void {
        if (!this.entityGraphics) return

        // Draw 2 heavy crushers
        const crushers = [
            { x: this.centerX - 90, y: this.centerY - 50, size: 55 },
            { x: this.centerX + 80, y: this.centerY + 30, size: 65 },
        ]

        for (let c = 0; c < crushers.length; c++) {
            const crusher = crushers[c]
            const shake = Math.sin(t * 15 + c * 2) * 2
            const pulse = 1 + Math.sin(t * 2 + c) * 0.05

            const drawX = crusher.x + shake
            const drawY = crusher.y
            const halfSize = (crusher.size / 2) * pulse

            // Warning ring (pulsing)
            const warningPulse = Math.sin(t * 6) * 0.5 + 0.5
            this.entityGraphics.circle(drawX, drawY, crusher.size * 0.7)
            this.entityGraphics.stroke({ color: 0xff0000, width: 2, alpha: alpha * warningPulse * 0.5 })

            // Shadow
            this.entityGraphics.roundRect(
                drawX - halfSize + 4, drawY - halfSize + 6,
                crusher.size * pulse, crusher.size * pulse, 8
            )
            this.entityGraphics.fill({ color: 0x000000, alpha: alpha * 0.3 })

            // Main body
            this.entityGraphics.roundRect(
                drawX - halfSize, drawY - halfSize,
                crusher.size * pulse, crusher.size * pulse, 8
            )
            this.entityGraphics.fill({ color: 0x666666, alpha: alpha * 0.95 })

            // Border
            this.entityGraphics.roundRect(
                drawX - halfSize, drawY - halfSize,
                crusher.size * pulse, crusher.size * pulse, 8
            )
            this.entityGraphics.stroke({ color: 0x444444, width: 3, alpha: alpha })

            // Face - eyes
            const faceSize = crusher.size * 0.3
            this.entityGraphics.circle(drawX - faceSize * 0.5, drawY - faceSize * 0.2, faceSize * 0.25)
            this.entityGraphics.fill({ color: 0xffaa00, alpha: alpha * 0.9 })
            this.entityGraphics.circle(drawX - faceSize * 0.5, drawY - faceSize * 0.2, faceSize * 0.12)
            this.entityGraphics.fill({ color: 0x000000, alpha: alpha * 0.9 })

            this.entityGraphics.circle(drawX + faceSize * 0.5, drawY - faceSize * 0.2, faceSize * 0.25)
            this.entityGraphics.fill({ color: 0xffaa00, alpha: alpha * 0.9 })
            this.entityGraphics.circle(drawX + faceSize * 0.5, drawY - faceSize * 0.2, faceSize * 0.12)
            this.entityGraphics.fill({ color: 0x000000, alpha: alpha * 0.9 })

            // Mouth
            this.entityGraphics.moveTo(drawX - faceSize * 0.3, drawY + faceSize * 0.3)
            this.entityGraphics.lineTo(drawX + faceSize * 0.3, drawY + faceSize * 0.3)
            this.entityGraphics.stroke({ color: 0x000000, width: 3, alpha: alpha })
        }
    }

    private drawBlackHole(alpha: number, t: number): void {
        if (!this.entityGraphics) return

        const x = this.centerX
        const y = this.centerY - 30
        const baseRadius = 40
        const pulse = 1 + Math.sin(t * 2) * 0.1

        // Danger zone ring (outermost)
        this.entityGraphics.circle(x, y, baseRadius * 3.5)
        this.entityGraphics.stroke({ color: 0xff0000, width: 2, alpha: alpha * 0.3 })

        // Accretion disk (multiple rings)
        for (let i = 5; i >= 0; i--) {
            const ringRadius = (baseRadius * 2.5 - i * 15) * pulse
            const hue = (t * 50 + i * 30) % 360
            const color = this.hslToHex(hue, 0.8, 0.5)
            const ringAlpha = (0.4 - i * 0.05) * alpha

            this.entityGraphics.circle(x, y, ringRadius)
            this.entityGraphics.stroke({ color, width: 8 - i, alpha: ringAlpha })
        }

        // Spiral arms
        for (let arm = 0; arm < 3; arm++) {
            const armOffset = (arm * Math.PI * 2) / 3
            for (let i = 0; i < 20; i++) {
                const angle = t * 2 + armOffset + i * 0.3
                const dist = baseRadius * 0.8 + i * 4
                const px = x + Math.cos(angle) * dist
                const py = y + Math.sin(angle) * dist
                const size = 4 - i * 0.15

                if (size > 0.5) {
                    this.entityGraphics.circle(px, py, size)
                    this.entityGraphics.fill({ color: 0xaa44ff, alpha: alpha * (1 - i / 25) })
                }
            }
        }

        // Event horizon (dark center)
        this.entityGraphics.circle(x, y, baseRadius * pulse)
        this.entityGraphics.fill({ color: 0x000000, alpha: alpha })

        // Inner glow
        this.entityGraphics.circle(x, y, baseRadius * 0.7 * pulse)
        this.entityGraphics.fill({ color: 0x1a0a2e, alpha: alpha * 0.8 })

        // Bright ring at event horizon
        this.entityGraphics.circle(x, y, baseRadius * pulse)
        this.entityGraphics.stroke({ color: 0xaa44ff, width: 3, alpha: alpha * 0.9 })
    }

    private drawRotatedRect(
        cx: number, cy: number,
        width: number, height: number,
        angle: number,
        color: number, alpha: number
    ): void {
        if (!this.entityGraphics) return

        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const hw = width / 2
        const hh = height / 2

        const corners = [
            { x: -hw, y: -hh },
            { x: hw, y: -hh },
            { x: hw, y: hh },
            { x: -hw, y: hh },
        ]

        const points: number[] = []
        for (const c of corners) {
            points.push(cx + c.x * cos - c.y * sin)
            points.push(cy + c.x * sin + c.y * cos)
        }

        this.entityGraphics.poly(points)
        this.entityGraphics.fill({ color, alpha })
    }

    private hslToHex(h: number, s: number, l: number): number {
        const c = (1 - Math.abs(2 * l - 1)) * s
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
        const m = l - c / 2

        let r = 0, g = 0, b = 0
        if (h < 60) { r = c; g = x; b = 0 }
        else if (h < 120) { r = x; g = c; b = 0 }
        else if (h < 180) { r = 0; g = c; b = x }
        else if (h < 240) { r = 0; g = x; b = c }
        else if (h < 300) { r = x; g = 0; b = c }
        else { r = c; g = 0; b = x }

        const toHex = (v: number) => Math.round((v + m) * 255)
        return (toHex(r) << 16) | (toHex(g) << 8) | toHex(b)
    }

    private lerpColor(from: number, to: number, t: number): number {
        const fromR = (from >> 16) & 0xff
        const fromG = (from >> 8) & 0xff
        const fromB = from & 0xff

        const toR = (to >> 16) & 0xff
        const toG = (to >> 8) & 0xff
        const toB = to & 0xff

        const r = Math.round(fromR + (toR - fromR) * t)
        const g = Math.round(fromG + (toG - fromG) * t)
        const b = Math.round(fromB + (toB - fromB) * t)

        return (r << 16) | (g << 8) | b
    }

    private darkenColor(color: number, amount: number): number {
        const r = Math.round(((color >> 16) & 0xff) * (1 - amount))
        const g = Math.round(((color >> 8) & 0xff) * (1 - amount))
        const b = Math.round((color & 0xff) * (1 - amount))
        return (r << 16) | (g << 8) | b
    }

    reset(): void {
        this.hide()
        this.animTime = 0
        this.phase = 'intro'
    }
}
