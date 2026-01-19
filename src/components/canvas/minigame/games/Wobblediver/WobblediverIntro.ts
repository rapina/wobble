import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble } from '../../../Wobble'

interface IntroStep {
    title: string
    message: string
    wobbleExpression: 'happy' | 'excited' | 'surprised' | 'worried'
    showPendulum?: boolean
    showGoal?: boolean
    showSwamp?: boolean
}

const INTRO_STEPS: IntroStep[] = [
    {
        title: '워블다이버',
        message: '...여기가 어디지?\n아래에서 뭔가 나를 보고 있어...',
        wobbleExpression: 'worried',
        showPendulum: false,
    },
    {
        title: '탈출해야 해',
        message: '진자에 매달려 흔들리다가\n타이밍에 맞춰 탭해서 뛰어내려!',
        wobbleExpression: 'surprised',
        showPendulum: true,
    },
    {
        title: '안전 지대로!',
        message: '노란 지점에 착지하면 살 수 있어!\n정확할수록 점수가 높아.',
        wobbleExpression: 'worried',
        showGoal: true,
    },
    {
        title: '심연을 피해',
        message: '저 아래... 눈들이 기다리고 있어.\n빠지면... 돌아올 수 없어.',
        wobbleExpression: 'worried',
        showSwamp: true,
    },
    {
        title: '...살아남아야 해',
        message: '그것들이 배고파하고 있어.',
        wobbleExpression: 'worried',
    },
]

// Text animation utilities
class TextAnimator {
    static typewriter(
        text: Text,
        fullText: string,
        duration: number,
        onComplete?: () => void
    ): { update: (delta: number) => void } {
        let elapsed = 0
        const charDuration = duration / fullText.length
        let currentLength = 0
        let completed = false

        return {
            update: (delta: number) => {
                if (completed) return

                elapsed += delta
                const targetLength = Math.min(Math.floor(elapsed / charDuration), fullText.length)

                if (targetLength !== currentLength) {
                    currentLength = targetLength
                    text.text = fullText.substring(0, currentLength)
                }

                if (currentLength >= fullText.length && !completed) {
                    completed = true
                    onComplete?.()
                }
            },
        }
    }

    static fadeSlideUp(
        container: Container,
        targetY: number,
        duration: number,
        delay: number = 0
    ): { update: (delta: number) => void } {
        let elapsed = 0
        const startY = targetY + 20
        container.y = startY
        container.alpha = 0

        return {
            update: (delta: number) => {
                elapsed += delta
                if (elapsed < delay) return

                const t = Math.min((elapsed - delay) / duration, 1)
                const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic

                container.y = startY + (targetY - startY) * eased
                container.alpha = eased
            },
        }
    }

    static pulse(container: Container): { update: (time: number) => void } {
        return {
            update: (time: number) => {
                const scale = 1 + Math.sin(time * 4) * 0.03
                container.scale.set(scale)
            },
        }
    }
}

// Mini pendulum preview
class MiniPendulumDisplay extends Container {
    private wobble: Wobble
    private rope: Graphics
    private pivotY = 30
    private ropeLength = 80
    private angle = 0
    private angularVelocity = 0
    private time = 0

    constructor(width: number, height: number) {
        super()
        this.wobble = new Wobble({
            size: 24,
            color: 0xf5b041,
            shape: 'circle',
            expression: 'happy',
        })
        this.rope = new Graphics()
        this.setup(width, height)
    }

    private setup(width: number, height: number): void {
        // Background
        const bg = new Graphics()
        bg.roundRect(0, 0, width, height, 12)
        bg.fill({ color: 0x1a1a2e, alpha: 0.9 })
        this.addChild(bg)

        // Pivot point
        const pivot = new Graphics()
        pivot.circle(width / 2, this.pivotY, 6)
        pivot.fill(0x4a5658)
        this.addChild(pivot)

        this.addChild(this.rope)

        this.wobble.position.set(width / 2, this.pivotY + this.ropeLength)
        this.addChild(this.wobble)

        // Initial angle
        this.angle = Math.PI / 4
    }

    update(delta: number, centerX: number): void {
        this.time += delta

        // Pendulum physics
        const gravity = 9.8
        const angularAccel = (-gravity / this.ropeLength) * Math.sin(this.angle)
        this.angularVelocity += angularAccel * delta * 20
        this.angularVelocity *= 0.995 // Damping
        this.angle += this.angularVelocity * delta

        // Update wobble position
        const wobbleX = centerX + Math.sin(this.angle) * this.ropeLength
        const wobbleY = this.pivotY + Math.cos(this.angle) * this.ropeLength
        this.wobble.position.set(wobbleX, wobbleY)

        // Draw rope
        this.rope.clear()
        this.rope.moveTo(centerX, this.pivotY)
        this.rope.lineTo(wobbleX, wobbleY)
        this.rope.stroke({ color: 0x8b4513, width: 3 })

        // Update wobble animation
        this.wobble.updateOptions({
            wobblePhase: this.time * 3,
            scaleX: 1 + Math.abs(this.angularVelocity) * 0.1,
            scaleY: 1 - Math.abs(this.angularVelocity) * 0.05,
        })
    }
}

// Mini goal preview
class MiniGoalDisplay extends Container {
    private goal: Graphics
    private platform: Graphics
    private time = 0

    constructor(width: number, height: number) {
        super()
        this.goal = new Graphics()
        this.platform = new Graphics()
        this.setup(width, height)
    }

    private setup(width: number, height: number): void {
        // Background
        const bg = new Graphics()
        bg.roundRect(0, 0, width, height, 12)
        bg.fill({ color: 0x1a1a2e, alpha: 0.9 })
        this.addChild(bg)

        // Platform
        this.platform.roundRect(width / 2 - 60, height - 50, 120, 20, 6)
        this.platform.fill(0x4a5658)
        this.addChild(this.platform)

        // Goal (target zone)
        this.goal.roundRect(width / 2 - 35, height - 55, 70, 30, 8)
        this.goal.fill({ color: 0xf5b041, alpha: 0.8 })
        this.goal.roundRect(width / 2 - 25, height - 50, 50, 20, 4)
        this.goal.fill({ color: 0xffd700, alpha: 0.9 })
        this.addChild(this.goal)

        // Center marker
        const center = new Graphics()
        center.circle(width / 2, height - 42, 5)
        center.fill(0xff6b6b)
        this.addChild(center)

        // Arrow pointing down
        const arrow = new Graphics()
        arrow.moveTo(width / 2, height - 90)
        arrow.lineTo(width / 2 - 10, height - 70)
        arrow.lineTo(width / 2 + 10, height - 70)
        arrow.closePath()
        arrow.fill(0xf5b041)
        this.addChild(arrow)
    }

    update(delta: number): void {
        this.time += delta

        // Pulsing effect on goal
        const pulse = 1 + Math.sin(this.time * 4) * 0.05
        this.goal.scale.set(pulse)
    }
}

// Mini swamp preview
class MiniSwampDisplay extends Container {
    private swamp: Graphics
    private time = 0
    private displayWidth: number
    private displayHeight: number

    constructor(width: number, height: number) {
        super()
        this.displayWidth = width
        this.displayHeight = height
        this.swamp = new Graphics()
        this.setup()
    }

    private setup(): void {
        // Background
        const bg = new Graphics()
        bg.roundRect(0, 0, this.displayWidth, this.displayHeight, 12)
        bg.fill({ color: 0x1a1a2e, alpha: 0.9 })
        this.addChild(bg)

        this.addChild(this.swamp)
    }

    update(delta: number): void {
        this.time += delta

        const g = this.swamp
        g.clear()

        const swampTop = this.displayHeight - 60
        const swampHeight = 50

        // Base layer
        g.rect(10, swampTop, this.displayWidth - 20, swampHeight)
        g.fill({ color: 0x1a0a20, alpha: 0.9 })

        // Wave surface
        g.moveTo(10, swampTop)
        for (let x = 10; x <= this.displayWidth - 10; x += 5) {
            const wave = Math.sin(x * 0.05 + this.time * 3) * 3
            g.lineTo(x, swampTop + wave)
        }
        g.lineTo(this.displayWidth - 10, swampTop + swampHeight)
        g.lineTo(10, swampTop + swampHeight)
        g.closePath()
        g.fill({ color: 0x2d1f3d, alpha: 0.8 })

        // Surface shine
        g.moveTo(10, swampTop)
        for (let x = 10; x <= this.displayWidth - 10; x += 5) {
            const wave = Math.sin(x * 0.05 + this.time * 3) * 3
            g.lineTo(x, swampTop + wave)
        }
        g.lineTo(this.displayWidth - 10, swampTop + 5)
        g.lineTo(10, swampTop + 5)
        g.closePath()
        g.fill({ color: 0x6b4d8a, alpha: 0.4 })

        // Danger text
        const dangerY = swampTop + 20
        g.roundRect(this.displayWidth / 2 - 30, dangerY - 8, 60, 16, 4)
        g.fill({ color: 0xff4444, alpha: 0.8 })
    }
}

export interface WobblediverIntroCallbacks {
    onStart: () => void
    onSkip: () => void
}

export class WobblediverIntro {
    private container: Container
    private width: number
    private height: number
    private centerX: number
    private centerY: number

    private currentStep = 0
    private wobble: Wobble | null = null
    private animPhase = 0
    private isVisible = false

    // UI elements
    private contentContainer!: Container
    private skipButton!: Container
    private nextButton!: Container
    private dotsContainer!: Container

    // Preview displays
    private miniPendulum: MiniPendulumDisplay | null = null
    private miniGoal: MiniGoalDisplay | null = null
    private miniSwamp: MiniSwampDisplay | null = null

    // Animations
    private titleAnimator: { update: (delta: number) => void } | null = null
    private messageAnimator: { update: (delta: number) => void } | null = null
    private buttonAnimator: { update: (time: number) => void } | null = null
    private animationsComplete = false

    // Callbacks
    private callbacks: WobblediverIntroCallbacks

    constructor(
        container: Container,
        width: number,
        height: number,
        callbacks: WobblediverIntroCallbacks
    ) {
        this.container = container
        this.width = width
        this.height = height
        this.centerX = width / 2
        this.centerY = height / 2
        this.callbacks = callbacks
    }

    get visible(): boolean {
        return this.isVisible
    }

    show(): void {
        this.isVisible = true
        this.currentStep = 0
        this.animPhase = 0
        this.container.visible = true
        this.createUI()
    }

    hide(): void {
        this.isVisible = false
        this.container.visible = false
        this.container.removeChildren()
    }

    resize(width: number, height: number): void {
        this.width = width
        this.height = height
        this.centerX = width / 2
        this.centerY = height / 2

        if (this.isVisible) {
            this.createUI()
        }
    }

    update(deltaSeconds: number): void {
        if (!this.isVisible) return

        this.animPhase += deltaSeconds

        // Wobble animation
        if (this.wobble) {
            const breathe = Math.sin(this.animPhase * 2.5) * 0.05
            const bounce = Math.sin(this.animPhase * 1.5) * 3
            this.wobble.updateOptions({
                wobblePhase: this.animPhase,
                scaleX: 1 + breathe,
                scaleY: 1 - breathe,
            })

            const step = INTRO_STEPS[this.currentStep]
            const hasEmbed = step.showPendulum || step.showGoal || step.showSwamp
            const wobbleY = hasEmbed ? this.centerY - 140 : this.centerY - 80
            this.wobble.y = wobbleY + bounce
        }

        // Update preview displays
        if (this.miniPendulum) {
            const embedWidth = this.width - 100
            this.miniPendulum.update(deltaSeconds, embedWidth / 2)
        }
        if (this.miniGoal) {
            this.miniGoal.update(deltaSeconds)
        }
        if (this.miniSwamp) {
            this.miniSwamp.update(deltaSeconds)
        }

        // Update text animations
        if (this.titleAnimator) {
            this.titleAnimator.update(deltaSeconds)
        }
        if (this.messageAnimator) {
            this.messageAnimator.update(deltaSeconds)
        }
        if (this.buttonAnimator && this.animationsComplete) {
            this.buttonAnimator.update(this.animPhase)
        }
    }

    private createUI(): void {
        this.container.removeChildren()

        // Reset animation state
        this.miniPendulum = null
        this.miniGoal = null
        this.miniSwamp = null
        this.titleAnimator = null
        this.messageAnimator = null
        this.buttonAnimator = null
        this.animationsComplete = false

        const step = INTRO_STEPS[this.currentStep]
        const isLastStep = this.currentStep === INTRO_STEPS.length - 1
        const hasEmbed = step.showPendulum || step.showGoal || step.showSwamp

        // Theme colors - cosmic horror
        const bgColor = 0x0d0a14
        const textColor = 0xcccccc
        const accentColor = 0x9b59b6 // Ominous purple
        const cardColor = 0x1a1a2e

        // Background
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(bgColor)
        this.container.addChild(bg)

        // Floating particles - eerie
        for (let i = 0; i < 20; i++) {
            const particle = new Graphics()
            const x = Math.random() * this.width
            const y = Math.random() * this.height
            const size = Math.random() * 2 + 1
            const alpha = Math.random() * 0.2 + 0.05
            particle.circle(x, y, size)
            particle.fill({ color: 0x6b4d8a, alpha })
            this.container.addChild(particle)
        }

        // Ominous gradient at bottom (the abyss)
        const abyssGrad = new Graphics()
        abyssGrad.rect(0, this.height - 120, this.width, 120)
        abyssGrad.fill({ color: 0x1a0a20, alpha: 0.7 })
        this.container.addChild(abyssGrad)

        // Subtle eyes hint at bottom
        for (let i = 0; i < 3; i++) {
            const eyeX = this.width * (0.2 + i * 0.3)
            const eyeY = this.height - 30 - Math.random() * 20
            const eye = new Graphics()
            eye.ellipse(eyeX, eyeY, 6, 3)
            eye.fill({ color: 0x8b0000, alpha: 0.3 })
            eye.circle(eyeX, eyeY, 2)
            eye.fill({ color: 0x000000, alpha: 0.5 })
            this.container.addChild(eye)
        }

        // Content container
        this.contentContainer = new Container()
        this.container.addChild(this.contentContainer)

        // Wobble character
        const wobbleSize = hasEmbed ? 50 : 70
        const wobbleY = hasEmbed ? this.centerY - 140 : this.centerY - 80

        this.wobble = new Wobble({
            size: wobbleSize,
            shape: 'circle',
            expression: step.wobbleExpression,
            color: 0xf5b041,
            showShadow: true,
        })
        this.wobble.position.set(this.centerX, wobbleY)
        this.contentContainer.addChild(this.wobble)

        // Speech bubble / card
        const cardWidth = this.width - 60
        const cardHeight = hasEmbed ? 280 : 160
        const cardY = hasEmbed ? this.centerY - 50 : this.centerY + 40

        const card = new Graphics()
        card.roundRect(this.centerX - cardWidth / 2, cardY, cardWidth, cardHeight, 20)
        card.fill({ color: cardColor, alpha: 0.9 })
        this.contentContainer.addChild(card)

        // Bubble pointer
        const pointer = new Graphics()
        pointer.moveTo(this.centerX - 15, cardY)
        pointer.lineTo(this.centerX, cardY - 20)
        pointer.lineTo(this.centerX + 15, cardY)
        pointer.closePath()
        pointer.fill({ color: cardColor, alpha: 0.9 })
        this.contentContainer.addChild(pointer)

        // Title
        const titleY = cardY + 28
        const title = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: hasEmbed ? 18 : 20,
                fontWeight: 'bold',
                fill: accentColor,
            }),
        })
        title.anchor.set(0.5)
        title.position.set(this.centerX, titleY)
        this.contentContainer.addChild(title)

        // Typewriter animation for title
        this.titleAnimator = TextAnimator.typewriter(title, step.title, 0.6, () => {
            this.animationsComplete = true
        })

        // Embed display area
        let contentY = titleY + 28
        if (hasEmbed) {
            const embedWidth = cardWidth - 40
            const embedHeight = 130
            const embedY = contentY + 5

            if (step.showPendulum) {
                this.miniPendulum = new MiniPendulumDisplay(embedWidth, embedHeight)
                this.miniPendulum.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniPendulum)
            } else if (step.showGoal) {
                this.miniGoal = new MiniGoalDisplay(embedWidth, embedHeight)
                this.miniGoal.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniGoal)
            } else if (step.showSwamp) {
                this.miniSwamp = new MiniSwampDisplay(embedWidth, embedHeight)
                this.miniSwamp.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniSwamp)
            }

            contentY = embedY + embedHeight + 12
        }

        // Message container with fade-in animation
        const messageContainer = new Container()
        const message = new Text({
            text: step.message,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fill: textColor,
                align: 'center',
                lineHeight: 22,
            }),
        })
        message.anchor.set(0.5, 0)
        messageContainer.addChild(message)
        messageContainer.position.set(this.centerX, contentY)
        this.contentContainer.addChild(messageContainer)

        // Fade-in animation for message
        this.messageAnimator = TextAnimator.fadeSlideUp(messageContainer, contentY, 0.5, 0.3)

        // Progress dots
        this.dotsContainer = new Container()
        this.dotsContainer.position.set(this.centerX, cardY + cardHeight + 25)
        this.container.addChild(this.dotsContainer)

        const dotGap = 14
        const totalDotsWidth = (INTRO_STEPS.length - 1) * dotGap

        INTRO_STEPS.forEach((_, i) => {
            const dot = new Graphics()
            const dotX = -totalDotsWidth / 2 + i * dotGap
            const isCurrent = i === this.currentStep
            dot.circle(dotX, 0, isCurrent ? 5 : 3)
            dot.fill({
                color: isCurrent ? accentColor : textColor,
                alpha: isCurrent ? 1 : 0.4,
            })
            this.dotsContainer.addChild(dot)
        })

        // Skip button (top right)
        if (!isLastStep) {
            this.skipButton = new Container()
            this.skipButton.position.set(this.width - 50, 40)
            this.skipButton.eventMode = 'static'
            this.skipButton.cursor = 'pointer'

            const skipText = new Text({
                text: 'Skip',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 14,
                    fill: textColor,
                }),
            })
            skipText.anchor.set(0.5)
            skipText.alpha = 0.6
            this.skipButton.addChild(skipText)

            this.skipButton.on('pointerdown', () => {
                this.complete()
            })
            this.container.addChild(this.skipButton)
        }

        // Next/Start button
        const btnWidth = isLastStep ? 160 : 120
        const btnHeight = 44
        const btnY = this.height - 100

        this.nextButton = new Container()
        this.nextButton.position.set(this.centerX, btnY)
        this.nextButton.eventMode = 'static'
        this.nextButton.cursor = 'pointer'

        const btnBg = new Graphics()
        btnBg.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 22)
        btnBg.fill(accentColor)
        this.nextButton.addChild(btnBg)

        const btnText = new Text({
            text: isLastStep ? '...가자' : '다음',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        })
        btnText.anchor.set(0.5)
        this.nextButton.addChild(btnText)

        // Button pulse animation
        this.buttonAnimator = TextAnimator.pulse(this.nextButton)

        this.nextButton.on('pointerdown', () => {
            this.nextButton.scale.set(0.95)
        })
        this.nextButton.on('pointerup', () => {
            this.nextButton.scale.set(1)
            if (isLastStep) {
                this.complete()
            } else {
                this.nextStep()
            }
        })
        this.nextButton.on('pointerupoutside', () => {
            this.nextButton.scale.set(1)
        })

        this.container.addChild(this.nextButton)

        // Tap anywhere to continue (except buttons)
        const tapArea = new Graphics()
        tapArea.rect(0, 0, this.width, this.height - 100)
        tapArea.fill({ color: 0x000000, alpha: 0.001 })
        tapArea.eventMode = 'static'
        tapArea.on('pointerup', () => {
            if (!isLastStep) {
                this.nextStep()
            }
        })
        this.container.addChildAt(tapArea, this.container.children.length - 1)
    }

    private nextStep(): void {
        if (this.currentStep < INTRO_STEPS.length - 1) {
            this.currentStep++
            this.createUI()
        }
    }

    private complete(): void {
        this.hide()
        this.callbacks.onStart()
    }
}
