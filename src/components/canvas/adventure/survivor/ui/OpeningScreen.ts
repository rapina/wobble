import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../../../Wobble'
import { easeOutBack, easeOutQuad } from '../utils'

export interface OpeningScreenContext {
    container: Container
    width: number
    height: number
}

interface EnemySilhouette {
    x: number
    y: number
    size: number
    delay: number
    alpha: number
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
    private playerWobble: Wobble | null = null
    private titleText: Text | null = null
    private subtitleText: Text | null = null
    private skipText: Text | null = null
    private readyText: Text | null = null

    // Enemy silhouettes for dramatic effect
    private enemySilhouettes: EnemySilhouette[] = []
    private silhouetteGraphics: Graphics | null = null

    // Selected character
    private selectedCharacter: WobbleShape = 'circle'

    // Timing
    private readonly INTRO_DURATION = 2.5
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

    show(character: WobbleShape): void {
        this.isVisible = true
        this.animTime = 0
        this.phase = 'intro'
        this.selectedCharacter = character
        this.screenContainer.visible = true

        this.screenContainer.removeChildren()
        this.createUI()
        this.createEnemySilhouettes()

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
        // Background - muted gradient
        this.bgGraphics = new Graphics()
        this.screenContainer.addChild(this.bgGraphics)
        this.drawBackground()

        // Silhouette graphics layer
        this.silhouetteGraphics = new Graphics()
        this.screenContainer.addChild(this.silhouetteGraphics)

        // Player wobble (center, will animate in)
        const charData = WOBBLE_CHARACTERS[this.selectedCharacter]
        this.playerWobble = new Wobble({
            size: 80,
            shape: this.selectedCharacter,
            color: charData.color,
            expression: 'happy',
            showShadow: true,
        })
        this.playerWobble.position.set(this.centerX, this.centerY + 30)
        this.playerWobble.scale.set(0)
        this.screenContainer.addChild(this.playerWobble)

        // Title text
        this.titleText = new Text({
            text: '웨이브가 몰려옵니다!',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 24,
                fontWeight: 'bold',
                fill: 0x3d3d3d,
                align: 'center',
                dropShadow: {
                    color: 0xffffff,
                    blur: 4,
                    distance: 0,
                    alpha: 0.8,
                },
            }),
        })
        this.titleText.anchor.set(0.5)
        this.titleText.position.set(this.centerX, 60)
        this.titleText.alpha = 0
        this.screenContainer.addChild(this.titleText)

        // Subtitle
        this.subtitleText = new Text({
            text: `${charData.nameKo}(으)로 생존하세요`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fill: 0x666666,
                align: 'center',
            }),
        })
        this.subtitleText.anchor.set(0.5)
        this.subtitleText.position.set(this.centerX, 90)
        this.subtitleText.alpha = 0
        this.screenContainer.addChild(this.subtitleText)

        // Ready text (hidden initially)
        this.readyText = new Text({
            text: 'READY',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 48,
                fontWeight: 'bold',
                fill: 0x4a7c59,
                align: 'center',
                dropShadow: {
                    color: 0xffffff,
                    blur: 6,
                    distance: 0,
                    alpha: 0.9,
                },
            }),
        })
        this.readyText.anchor.set(0.5)
        this.readyText.position.set(this.centerX, this.centerY - 60)
        this.readyText.alpha = 0
        this.readyText.scale.set(0)
        this.screenContainer.addChild(this.readyText)

        // Skip instruction
        this.skipText = new Text({
            text: '탭하여 건너뛰기',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fill: 0x999999,
            }),
        })
        this.skipText.anchor.set(0.5)
        this.skipText.position.set(this.centerX, this.height - 30)
        this.screenContainer.addChild(this.skipText)
    }

    private drawBackground(): void {
        if (!this.bgGraphics) return

        this.bgGraphics.clear()

        // Muted gradient background
        const topColor = 0xc5d4d0 // Soft gray-green
        const bottomColor = 0xa8b8b4 // Slightly darker

        const bands = 8
        for (let i = 0; i < bands; i++) {
            const y = (i / bands) * this.height
            const h = this.height / bands + 1
            const blend = i / (bands - 1)
            const color = this.lerpColor(topColor, bottomColor, blend)

            this.bgGraphics.rect(0, y, this.width, h)
            this.bgGraphics.fill(color)
        }

        // Vignette effect
        for (let i = 0; i < 4; i++) {
            const alpha = 0.1 * (1 - i / 4)
            this.bgGraphics.rect(0, i * 15, this.width, 15)
            this.bgGraphics.fill({ color: 0x000000, alpha })
            this.bgGraphics.rect(0, this.height - (i + 1) * 15, this.width, 15)
            this.bgGraphics.fill({ color: 0x000000, alpha })
        }
    }

    private createEnemySilhouettes(): void {
        this.enemySilhouettes = []

        // Create enemy silhouettes around the edges
        const count = 12
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count
            const distance = Math.max(this.width, this.height) * 0.5
            const x = this.centerX + Math.cos(angle) * distance
            const y = this.centerY + Math.sin(angle) * distance

            this.enemySilhouettes.push({
                x,
                y,
                size: 20 + Math.random() * 30,
                delay: Math.random() * 0.5,
                alpha: 0,
            })
        }
    }

    private updateAnimations(): void {
        const t = this.animTime

        // Background pulse
        if (this.bgGraphics) {
            const pulse = Math.sin(t * 3) * 0.02
            this.bgGraphics.alpha = 1 + pulse
        }

        // Intro phase animations
        if (this.phase === 'intro') {
            const introProgress = Math.min(1, t / 0.8)

            // Title fade in
            if (this.titleText) {
                this.titleText.alpha = easeOutQuad(introProgress)
                this.titleText.position.y = 60 + (1 - easeOutQuad(introProgress)) * -20
            }

            // Subtitle fade in (delayed)
            if (this.subtitleText) {
                const subtitleProgress = Math.max(0, Math.min(1, (t - 0.3) / 0.5))
                this.subtitleText.alpha = easeOutQuad(subtitleProgress)
            }

            // Player wobble entrance
            if (this.playerWobble) {
                const wobbleProgress = Math.max(0, Math.min(1, (t - 0.2) / 0.6))
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

            // Enemy silhouettes approach
            this.updateSilhouettes(introProgress)
        }

        // Ready phase
        if (this.phase === 'ready') {
            const readyT = (t - this.INTRO_DURATION) / this.READY_DURATION

            if (this.readyText) {
                this.readyText.text = 'READY'
                this.readyText.style.fill = 0x4a7c59

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

            // Fade out title/subtitle
            if (this.titleText) {
                this.titleText.alpha = 1 - readyT
            }
            if (this.subtitleText) {
                this.subtitleText.alpha = 1 - readyT
            }
        }

        // Go phase
        if (this.phase === 'go') {
            const goT = (t - this.INTRO_DURATION - this.READY_DURATION) / this.GO_DURATION

            if (this.readyText) {
                this.readyText.text = 'GO!'
                this.readyText.style.fill = 0xc9a87c

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
            if (this.bgGraphics) {
                this.bgGraphics.alpha = 1 - goT
            }
            if (this.silhouetteGraphics) {
                this.silhouetteGraphics.alpha = 1 - goT
            }
            if (this.skipText) {
                this.skipText.alpha = 1 - goT
            }
        }

        // Skip text blink
        if (this.skipText && this.phase === 'intro') {
            this.skipText.alpha = 0.5 + Math.sin(t * 4) * 0.3
        }
    }

    private updateSilhouettes(progress: number): void {
        if (!this.silhouetteGraphics) return

        this.silhouetteGraphics.clear()

        for (const silhouette of this.enemySilhouettes) {
            const silProgress = Math.max(0, Math.min(1, (progress - silhouette.delay) / 0.5))
            silhouette.alpha = silProgress * 0.4

            // Move towards center slightly
            const moveProgress = easeOutQuad(silProgress)
            const dx = this.centerX - silhouette.x
            const dy = this.centerY - silhouette.y
            const currentX = silhouette.x + dx * moveProgress * 0.3
            const currentY = silhouette.y + dy * moveProgress * 0.3

            // Draw enemy silhouette (simple circle/blob shape)
            this.silhouetteGraphics.circle(currentX, currentY, silhouette.size)
            this.silhouetteGraphics.fill({ color: 0x2d2d2d, alpha: silhouette.alpha })

            // Add menacing "eyes"
            const eyeOffset = silhouette.size * 0.3
            const eyeSize = silhouette.size * 0.15
            this.silhouetteGraphics.circle(currentX - eyeOffset, currentY - eyeSize, eyeSize)
            this.silhouetteGraphics.circle(currentX + eyeOffset, currentY - eyeSize, eyeSize)
            this.silhouetteGraphics.fill({ color: 0xff4444, alpha: silhouette.alpha * 0.8 })
        }
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

    reset(): void {
        this.hide()
        this.animTime = 0
        this.phase = 'intro'
    }
}
