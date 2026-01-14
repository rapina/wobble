import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble } from '../Wobble'

interface IntroSceneContext {
    container: Container
    width: number
    height: number
}

interface IntroStep {
    title: string
    subtitle?: string
    message: string
    wobbleExpression: 'happy' | 'excited' | 'surprised' | 'sleepy'
    embedType: 'none' | 'particles' | 'game'
}

const INTRO_STEPS: IntroStep[] = [
    {
        title: '워블 행성에 온 걸 환영해!',
        message: '나는 워비야.\n이곳에서 물리 법칙을 배우고\n다양한 모험을 떠나보자!',
        wobbleExpression: 'happy',
        embedType: 'none',
    },
    {
        title: 'SANDBOX',
        subtitle: '물리 실험실',
        message: '물리 공식을 직접\n만져보고 배울 수 있어!',
        wobbleExpression: 'surprised',
        embedType: 'particles',
    },
    {
        title: 'GAME',
        subtitle: '물리 게임',
        message: '배운 물리 법칙이\n게임에서 스킬이 돼!',
        wobbleExpression: 'excited',
        embedType: 'game',
    },
    {
        title: '모험을 시작하자!',
        message: '새로운 공식을 해금하면\n더 많은 가능성이 열려!',
        wobbleExpression: 'excited',
        embedType: 'none',
    },
]

// Mini particle display for sandbox preview (IdealGas style - bouncing particles)
class MiniParticleDisplay extends Container {
    private particles: { blob: Wobble; x: number; y: number; vx: number; vy: number }[] = []
    private time = 0
    private displayWidth: number
    private displayHeight: number
    private wallGraphics: Graphics

    constructor(width: number, height: number) {
        super()
        this.displayWidth = width
        this.displayHeight = height
        this.wallGraphics = new Graphics()
        this.setup()
    }

    private setup(): void {
        // Background
        const bg = new Graphics()
        bg.roundRect(0, 0, this.displayWidth, this.displayHeight, 12)
        bg.fill({ color: 0x1a1a2e, alpha: 0.9 })
        this.addChild(bg)

        // Wall graphics
        this.addChild(this.wallGraphics)

        // Create bouncing particles
        const numParticles = 8
        const colors = [0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xff6b6b, 0xa29bfe, 0xfd79a8, 0x74b9ff]
        const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle']

        for (let i = 0; i < numParticles; i++) {
            const blob = new Wobble({
                size: 14,
                color: colors[i % colors.length],
                shape: shapes[i % shapes.length],
                expression: 'happy',
            })

            const x = 30 + Math.random() * (this.displayWidth - 60)
            const y = 30 + Math.random() * (this.displayHeight - 60)
            const angle = Math.random() * Math.PI * 2
            const speed = 60 + Math.random() * 40

            blob.position.set(x, y)
            this.addChild(blob)

            this.particles.push({
                blob,
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
            })
        }
    }

    update(delta: number): void {
        this.time += delta

        const padding = 18
        const left = padding
        const right = this.displayWidth - padding
        const top = padding
        const bottom = this.displayHeight - padding

        // Update particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]

            // Move
            p.x += p.vx * delta
            p.y += p.vy * delta

            // Wall collisions
            let hitWall = false
            if (p.x < left) {
                p.x = left
                p.vx *= -1
                hitWall = true
            }
            if (p.x > right) {
                p.x = right
                p.vx *= -1
                hitWall = true
            }
            if (p.y < top) {
                p.y = top
                p.vy *= -1
                hitWall = true
            }
            if (p.y > bottom) {
                p.y = bottom
                p.vy *= -1
                hitWall = true
            }

            // Particle-particle collisions
            for (let j = i + 1; j < this.particles.length; j++) {
                const other = this.particles[j]
                const dx = other.x - p.x
                const dy = other.y - p.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const minDist = 20

                if (dist < minDist && dist > 0) {
                    // Push apart
                    const nx = dx / dist
                    const ny = dy / dist
                    const overlap = minDist - dist

                    p.x -= nx * overlap * 0.5
                    p.y -= ny * overlap * 0.5
                    other.x += nx * overlap * 0.5
                    other.y += ny * overlap * 0.5

                    // Swap velocities
                    const tempVx = p.vx
                    const tempVy = p.vy
                    p.vx = other.vx
                    p.vy = other.vy
                    other.vx = tempVx
                    other.vy = tempVy
                }
            }

            // Update blob
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
            p.blob.position.set(p.x, p.y)
            p.blob.updateOptions({
                wobblePhase: this.time * 3 + i,
                scaleX: 1 + (speed / 150) * 0.15,
                scaleY: 1 - (speed / 150) * 0.1,
                expression: hitWall ? 'surprised' : speed > 80 ? 'excited' : 'happy',
            })
        }

        // Draw walls
        this.drawWalls()
    }

    private drawWalls(): void {
        const g = this.wallGraphics
        g.clear()

        const padding = 12
        const thickness = 4

        // Container walls with glow effect
        g.roundRect(padding, padding, this.displayWidth - padding * 2, this.displayHeight - padding * 2, 8)
        g.stroke({ color: 0x4ecdc4, width: thickness, alpha: 0.6 })

        // Inner glow
        g.roundRect(padding + 2, padding + 2, this.displayWidth - padding * 2 - 4, this.displayHeight - padding * 2 - 4, 6)
        g.stroke({ color: 0x4ecdc4, width: 1, alpha: 0.3 })
    }
}

// Mini game display for game preview
class MiniGameDisplay extends Container {
    private player: Wobble
    private enemies: { graphics: Graphics; x: number; y: number; vx: number; vy: number }[] = []
    private projectiles: { graphics: Graphics; x: number; y: number; vx: number; vy: number }[] = []
    private time = 0
    private shootTimer = 0
    private displayWidth: number
    private displayHeight: number

    constructor(width: number, height: number) {
        super()
        this.displayWidth = width
        this.displayHeight = height
        this.player = new Wobble({ size: 18, color: 0xf5b041, shape: 'circle', expression: 'excited' })
        this.setup()
    }

    private setup(): void {
        // Background
        const bg = new Graphics()
        bg.roundRect(0, 0, this.displayWidth, this.displayHeight, 12)
        bg.fill({ color: 0x1a1a2e, alpha: 0.8 })
        bg.stroke({ color: 0xff6b6b, width: 1, alpha: 0.3 })
        this.addChild(bg)

        // Player
        this.player.position.set(this.displayWidth / 2, this.displayHeight / 2)
        this.addChild(this.player)

        // Create initial enemies
        for (let i = 0; i < 4; i++) {
            this.spawnEnemy()
        }
    }

    private spawnEnemy(): void {
        const enemy = new Graphics()
        const angle = Math.random() * Math.PI * 2
        const dist = 80
        const x = this.displayWidth / 2 + Math.cos(angle) * dist
        const y = this.displayHeight / 2 + Math.sin(angle) * dist

        enemy.circle(0, 0, 8)
        enemy.fill(0xff6b6b)
        enemy.position.set(x, y)
        this.addChild(enemy)

        // Move toward center
        const dx = this.displayWidth / 2 - x
        const dy = this.displayHeight / 2 - y
        const len = Math.sqrt(dx * dx + dy * dy)

        this.enemies.push({
            graphics: enemy,
            x,
            y,
            vx: (dx / len) * 15,
            vy: (dy / len) * 15,
        })
    }

    private shoot(): void {
        if (this.enemies.length === 0) return

        // Find nearest enemy
        let nearest = this.enemies[0]
        let minDist = Infinity
        for (const e of this.enemies) {
            const dx = e.x - this.displayWidth / 2
            const dy = e.y - this.displayHeight / 2
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < minDist) {
                minDist = dist
                nearest = e
            }
        }

        const dx = nearest.x - this.displayWidth / 2
        const dy = nearest.y - this.displayHeight / 2
        const len = Math.sqrt(dx * dx + dy * dy)

        const proj = new Graphics()
        proj.circle(0, 0, 4)
        proj.fill(0xf5b041)
        proj.position.set(this.displayWidth / 2, this.displayHeight / 2)
        this.addChild(proj)

        this.projectiles.push({
            graphics: proj,
            x: this.displayWidth / 2,
            y: this.displayHeight / 2,
            vx: (dx / len) * 120,
            vy: (dy / len) * 120,
        })
    }

    update(delta: number): void {
        this.time += delta
        this.shootTimer += delta

        // Auto-shoot
        if (this.shootTimer > 0.4) {
            this.shoot()
            this.shootTimer = 0
        }

        // Update player
        this.player.updateOptions({
            wobblePhase: this.time * 3,
            scaleX: 1 + Math.sin(this.time * 5) * 0.05,
            scaleY: 1 - Math.sin(this.time * 5) * 0.05,
        })

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i]
            e.x += e.vx * delta
            e.y += e.vy * delta
            e.graphics.position.set(e.x, e.y)

            // Respawn if too close to center
            const dx = e.x - this.displayWidth / 2
            const dy = e.y - this.displayHeight / 2
            if (Math.sqrt(dx * dx + dy * dy) < 20) {
                this.removeChild(e.graphics)
                this.enemies.splice(i, 1)
                this.spawnEnemy()
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i]
            p.x += p.vx * delta
            p.y += p.vy * delta
            p.graphics.position.set(p.x, p.y)

            // Check collision with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j]
                const dx = p.x - e.x
                const dy = p.y - e.y
                if (Math.sqrt(dx * dx + dy * dy) < 12) {
                    // Hit!
                    this.removeChild(e.graphics)
                    this.removeChild(p.graphics)
                    this.enemies.splice(j, 1)
                    this.projectiles.splice(i, 1)
                    this.spawnEnemy()
                    break
                }
            }

            // Remove if out of bounds
            if (p.x < 0 || p.x > this.displayWidth || p.y < 0 || p.y > this.displayHeight) {
                this.removeChild(p.graphics)
                this.projectiles.splice(i, 1)
            }
        }
    }
}

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

        return {
            update: (delta: number) => {
                elapsed += delta
                const targetLength = Math.min(Math.floor(elapsed / charDuration), fullText.length)

                if (targetLength !== currentLength) {
                    currentLength = targetLength
                    text.text = fullText.substring(0, currentLength)
                }

                if (currentLength >= fullText.length && onComplete) {
                    onComplete()
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

export class IntroScene {
    private sceneContainer: Container
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

    // Embed displays
    private miniParticles: MiniParticleDisplay | null = null
    private miniGame: MiniGameDisplay | null = null

    // Animations
    private titleAnimator: { update: (delta: number) => void } | null = null
    private messageAnimator: { update: (delta: number) => void } | null = null
    private buttonAnimator: { update: (time: number) => void } | null = null
    private animationsComplete = false

    // Callbacks
    onComplete?: () => void

    constructor(context: IntroSceneContext) {
        this.sceneContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
        this.centerY = context.height / 2
    }

    get visible(): boolean {
        return this.isVisible
    }

    show(): void {
        this.isVisible = true
        this.currentStep = 0
        this.animPhase = 0
        this.sceneContainer.visible = true
        this.createUI()
    }

    hide(): void {
        this.isVisible = false
        this.sceneContainer.visible = false
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
            const wobbleY = step.embedType !== 'none' ? this.centerY - 140 : this.centerY - 80
            this.wobble.y = wobbleY + bounce
        }

        // Update embed displays
        if (this.miniParticles) {
            this.miniParticles.update(deltaSeconds)
        }
        if (this.miniGame) {
            this.miniGame.update(deltaSeconds)
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
        this.sceneContainer.removeChildren()

        // Reset animation state
        this.miniParticles = null
        this.miniGame = null
        this.titleAnimator = null
        this.messageAnimator = null
        this.buttonAnimator = null
        this.animationsComplete = false

        const step = INTRO_STEPS[this.currentStep]
        const isLastStep = this.currentStep === INTRO_STEPS.length - 1
        const hasEmbed = step.embedType !== 'none'

        // Theme colors
        const bgColor = 0x1a1a2e
        const starColor = 0xffffff
        const textColor = 0xffffff
        const accentColor = 0xf5b041
        const cardColor = 0x2d2d44

        // Background - space/planet theme
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(bgColor)
        this.sceneContainer.addChild(bg)

        // Stars
        for (let i = 0; i < 50; i++) {
            const star = new Graphics()
            const x = Math.random() * this.width
            const y = Math.random() * this.height * 0.6
            const size = Math.random() * 2 + 0.5
            const alpha = Math.random() * 0.5 + 0.3
            star.circle(x, y, size)
            star.fill({ color: starColor, alpha })
            this.sceneContainer.addChild(star)
        }

        // Planet surface curve at bottom
        const planet = new Graphics()
        planet.ellipse(this.centerX, this.height + 200, this.width * 0.8, 280)
        planet.fill({ color: 0x4a6fa5, alpha: 0.3 })
        this.sceneContainer.addChild(planet)

        // Content container
        this.contentContainer = new Container()
        this.sceneContainer.addChild(this.contentContainer)

        // Wobble character (smaller and higher if embed exists)
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
        const cardHeight = hasEmbed ? 310 : 160
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

        // Start typewriter animation for title
        this.titleAnimator = TextAnimator.typewriter(title, step.title, 0.6, () => {
            this.animationsComplete = true
        })

        // Subtitle (if exists)
        let contentY = titleY + 28
        if (step.subtitle) {
            const subtitleContainer = new Container()
            const subtitle = new Text({
                text: step.subtitle,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 12,
                    fill: textColor,
                }),
            })
            subtitle.anchor.set(0.5)
            subtitleContainer.addChild(subtitle)
            subtitleContainer.position.set(this.centerX, contentY)
            subtitleContainer.alpha = 0.7
            this.contentContainer.addChild(subtitleContainer)
            contentY += 24
        }

        // Embed display area
        if (hasEmbed) {
            const embedWidth = cardWidth - 40
            const embedHeight = 150
            const embedY = contentY + 5

            if (step.embedType === 'particles') {
                this.miniParticles = new MiniParticleDisplay(embedWidth, embedHeight)
                this.miniParticles.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniParticles)
            } else if (step.embedType === 'game') {
                this.miniGame = new MiniGameDisplay(embedWidth, embedHeight)
                this.miniGame.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniGame)
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

        // Start fade-in animation for message
        this.messageAnimator = TextAnimator.fadeSlideUp(messageContainer, contentY, 0.5, 0.3)

        // Progress dots
        this.dotsContainer = new Container()
        this.dotsContainer.position.set(this.centerX, cardY + cardHeight + 25)
        this.sceneContainer.addChild(this.dotsContainer)

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
            this.sceneContainer.addChild(this.skipButton)
        }

        // Next/Start button
        const btnWidth = isLastStep ? 160 : 120
        const btnHeight = 44
        const btnY = this.height - 70

        this.nextButton = new Container()
        this.nextButton.position.set(this.centerX, btnY)
        this.nextButton.eventMode = 'static'
        this.nextButton.cursor = 'pointer'

        const btnBg = new Graphics()
        btnBg.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 22)
        btnBg.fill(accentColor)
        this.nextButton.addChild(btnBg)

        const btnText = new Text({
            text: isLastStep ? '시작하기' : '다음',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0x1a1a2e,
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

        this.sceneContainer.addChild(this.nextButton)

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
        this.sceneContainer.addChildAt(tapArea, this.sceneContainer.children.length - 1)
    }

    private nextStep(): void {
        if (this.currentStep < INTRO_STEPS.length - 1) {
            this.currentStep++
            this.createUI()
        }
    }

    private complete(): void {
        // Mark intro as seen
        localStorage.setItem('wobble-intro-seen', 'true')
        this.hide()
        this.onComplete?.()
    }

    static hasSeenIntro(): boolean {
        return localStorage.getItem('wobble-intro-seen') === 'true'
    }

    static resetIntro(): void {
        localStorage.removeItem('wobble-intro-seen')
    }
}
