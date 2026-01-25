import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import i18n from 'i18next'
import { Wobble } from '../Wobble'
import { t as localizeText, LocalizedText } from '@/utils/localization'

interface IntroSceneContext {
    container: Container
    width: number
    height: number
}

interface IntroStep {
    title: LocalizedText
    subtitle?: LocalizedText
    message: LocalizedText
    wobbleExpression: 'happy' | 'excited' | 'surprised' | 'sleepy'
    embedType: 'none' | 'particles' | 'game' | 'orbit' | 'celebration'
}

const INTRO_STEPS: IntroStep[] = [
    {
        title: {
            ko: '워블 행성에 온 걸 환영해!',
            en: 'Welcome to Planet Wobble!',
            ja: 'ワブル星へようこそ！',
            es: '¡Bienvenido al Planeta Wobble!',
            pt: 'Bem-vindo ao Planeta Wobble!',
            'zh-CN': '欢迎来到Wobble星球！',
            'zh-TW': '歡迎來到Wobble星球！',
        },
        message: {
            ko: '나는 워비야.\n물리와 함께 놀면서\n다양한 모험을 즐겨보자!',
            en: "I'm Wobi.\nLet's play with physics\nand enjoy adventures!",
            ja: '僕はワビだよ。\n物理と遊びながら\n冒険を楽しもう！',
            es: 'Soy Wobi.\n¡Juguemos con la física\ny disfrutemos aventuras!',
            pt: 'Eu sou Wobi.\nVamos brincar com física\ne curtir aventuras!',
            'zh-CN': '我是Wobi。\n让我们和物理一起玩，\n享受各种冒险！',
            'zh-TW': '我是Wobi。\n讓我們和物理一起玩，\n享受各種冒險！',
        },
        wobbleExpression: 'happy',
        embedType: 'orbit',
    },
    {
        title: { ko: 'SANDBOX', en: 'SANDBOX', ja: 'SANDBOX', es: 'SANDBOX', pt: 'SANDBOX', 'zh-CN': 'SANDBOX', 'zh-TW': 'SANDBOX' },
        subtitle: {
            ko: '물리 놀이터',
            en: 'Physics Playground',
            ja: '物理の遊び場',
            es: 'Patio de Física',
            pt: 'Parquinho de Física',
            'zh-CN': '物理游乐场',
            'zh-TW': '物理遊樂場',
        },
        message: {
            ko: '물리 공식을 직접 만져보며\n직관적으로 느껴봐!',
            en: 'Touch physics formulas\nand feel them intuitively!',
            ja: '物理公式を直接触って\n直感的に感じてみよう！',
            es: '¡Toca las fórmulas de física\ny siéntelas intuitivamente!',
            pt: 'Toque nas fórmulas de física\ne sinta-as intuitivamente!',
            'zh-CN': '直接触碰物理公式，\n直观地感受它们！',
            'zh-TW': '直接觸碰物理公式，\n直觀地感受它們！',
        },
        wobbleExpression: 'surprised',
        embedType: 'particles',
    },
    {
        title: { ko: 'GAME', en: 'GAME', ja: 'GAME', es: 'JUEGO', pt: 'JOGO', 'zh-CN': 'GAME', 'zh-TW': 'GAME' },
        subtitle: {
            ko: '물리 게임',
            en: 'Physics Games',
            ja: '物理ゲーム',
            es: 'Juegos de Física',
            pt: 'Jogos de Física',
            'zh-CN': '物理游戏',
            'zh-TW': '物理遊戲',
        },
        message: {
            ko: '물리 법칙을 활용한\n다양한 게임을 즐겨봐!',
            en: 'Enjoy various games\npowered by physics!',
            ja: '物理法則を使った\n様々なゲームを楽しもう！',
            es: '¡Disfruta varios juegos\nimpulsados por la física!',
            pt: 'Curta vários jogos\nmovidos pela física!',
            'zh-CN': '享受各种\n物理驱动的游戏！',
            'zh-TW': '享受各種\n物理驅動的遊戲！',
        },
        wobbleExpression: 'excited',
        embedType: 'game',
    },
    {
        title: {
            ko: '모험을 시작하자!',
            en: "Let's start the adventure!",
            ja: '冒険を始めよう！',
            es: '¡Comencemos la aventura!',
            pt: 'Vamos começar a aventura!',
            'zh-CN': '开始冒险吧！',
            'zh-TW': '開始冒險吧！',
        },
        message: {
            ko: '공식이 아닌,\n물리와 놀아보자!',
            en: 'Play with physics,\nnot formulas!',
            ja: '公式じゃなく、\n物理と遊ぼう！',
            es: '¡Juega con la física,\nno con fórmulas!',
            pt: 'Brinque com a física,\nnão com fórmulas!',
            'zh-CN': '玩物理，\n不是玩公式！',
            'zh-TW': '玩物理，\n不是玩公式！',
        },
        wobbleExpression: 'excited',
        embedType: 'celebration',
    },
]

// Localized UI text
const UI_TEXT = {
    skip: {
        ko: 'Skip',
        en: 'Skip',
        ja: 'スキップ',
        es: 'Saltar',
        pt: 'Pular',
        'zh-CN': '跳过',
        'zh-TW': '跳過',
    },
    next: {
        ko: '다음',
        en: 'Next',
        ja: '次へ',
        es: 'Siguiente',
        pt: 'Próximo',
        'zh-CN': '下一步',
        'zh-TW': '下一步',
    },
    start: {
        ko: '시작하기',
        en: 'Start',
        ja: '始める',
        es: 'Empezar',
        pt: 'Começar',
        'zh-CN': '开始',
        'zh-TW': '開始',
    },
}

// Mini orbit display for welcome - wobbles orbiting around center (planetary theme)
class MiniOrbitDisplay extends Container {
    private orbiters: { blob: Wobble; angle: number; radius: number; speed: number }[] = []
    private centerStar: Graphics
    private time = 0
    private displayWidth: number
    private displayHeight: number

    constructor(width: number, height: number) {
        super()
        this.displayWidth = width
        this.displayHeight = height
        this.centerStar = new Graphics()
        this.setup()
    }

    private setup(): void {
        // Background - space
        const bg = new Graphics()
        bg.roundRect(0, 0, this.displayWidth, this.displayHeight, 12)
        bg.fill({ color: 0x0a0a1a, alpha: 0.95 })
        this.addChild(bg)

        // Twinkling stars in background
        for (let i = 0; i < 30; i++) {
            const star = new Graphics()
            const x = Math.random() * this.displayWidth
            const y = Math.random() * this.displayHeight
            const size = Math.random() * 1.5 + 0.5
            star.circle(x, y, size)
            star.fill({ color: 0xffffff, alpha: Math.random() * 0.5 + 0.2 })
            this.addChild(star)
        }

        // Center star/sun
        const centerX = this.displayWidth / 2
        const centerY = this.displayHeight / 2
        this.centerStar.circle(0, 0, 15)
        this.centerStar.fill(0xf5b041)
        this.centerStar.position.set(centerX, centerY)
        this.addChild(this.centerStar)

        // Orbit rings (visual guides)
        const orbitGraphics = new Graphics()
        const radii = [35, 55, 75]
        for (const r of radii) {
            orbitGraphics.circle(centerX, centerY, r)
            orbitGraphics.stroke({ color: 0xffffff, width: 1, alpha: 0.15 })
        }
        this.addChild(orbitGraphics)

        // Create orbiting wobbles
        const colors = [0x4ecdc4, 0xff6b6b, 0xa29bfe, 0x74b9ff, 0xffeaa7]
        const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'triangle', 'square']

        for (let i = 0; i < 5; i++) {
            const blob = new Wobble({
                size: 10 + Math.random() * 4,
                color: colors[i],
                shape: shapes[i % shapes.length],
                expression: 'happy',
            })
            this.addChild(blob)

            this.orbiters.push({
                blob,
                angle: (Math.PI * 2 * i) / 5 + Math.random() * 0.5,
                radius: 35 + i * 12,
                speed: 1.5 - i * 0.2,
            })
        }
    }

    update(delta: number): void {
        this.time += delta

        const centerX = this.displayWidth / 2
        const centerY = this.displayHeight / 2

        // Pulse center star
        const starScale = 1 + Math.sin(this.time * 3) * 0.1
        this.centerStar.scale.set(starScale)

        // Update orbiters
        for (let i = 0; i < this.orbiters.length; i++) {
            const o = this.orbiters[i]
            o.angle += o.speed * delta

            const x = centerX + Math.cos(o.angle) * o.radius
            const y = centerY + Math.sin(o.angle) * o.radius * 0.6 // Elliptical orbit

            o.blob.position.set(x, y)
            o.blob.updateOptions({
                wobblePhase: this.time * 2 + i,
                expression: 'happy',
            })
        }
    }
}

// Mini celebration display for final step - wobbles jumping together
class MiniCelebrationDisplay extends Container {
    private wobbles: { blob: Wobble; baseY: number; phase: number; jumpHeight: number }[] = []
    private time = 0
    private displayWidth: number
    private displayHeight: number
    private sparkles: { g: Graphics; x: number; y: number; life: number; vy: number }[] = []

    constructor(width: number, height: number) {
        super()
        this.displayWidth = width
        this.displayHeight = height
        this.setup()
    }

    private setup(): void {
        // Background - festive gradient feel
        const bg = new Graphics()
        bg.roundRect(0, 0, this.displayWidth, this.displayHeight, 12)
        bg.fill({ color: 0x1a1a2e, alpha: 0.9 })
        this.addChild(bg)

        // Create celebrating wobbles in a row
        const colors = [0x4ecdc4, 0xf5b041, 0xff6b6b, 0xa29bfe, 0x74b9ff, 0xffeaa7, 0xfd79a8]
        const shapes: ('circle' | 'square' | 'triangle' | 'diamond' | 'star')[] = [
            'circle', 'triangle', 'square', 'diamond', 'star', 'circle', 'triangle'
        ]

        const numWobbles = 7
        const spacing = this.displayWidth / (numWobbles + 1)
        const baseY = this.displayHeight * 0.65

        for (let i = 0; i < numWobbles; i++) {
            const blob = new Wobble({
                size: 16 + Math.random() * 6,
                color: colors[i % colors.length],
                shape: shapes[i % shapes.length],
                expression: 'excited',
            })

            const x = spacing * (i + 1)
            blob.position.set(x, baseY)
            this.addChild(blob)

            this.wobbles.push({
                blob,
                baseY,
                phase: (Math.PI * 2 * i) / numWobbles,
                jumpHeight: 20 + Math.random() * 15,
            })
        }
    }

    private spawnSparkle(): void {
        const g = new Graphics()
        const x = Math.random() * this.displayWidth
        const y = this.displayHeight + 5

        g.star(0, 0, 4, 3, 1.5)
        g.fill({ color: [0xffd700, 0xff69b4, 0x00ffff, 0xff6b6b][Math.floor(Math.random() * 4)] })
        g.position.set(x, y)
        this.addChild(g)

        this.sparkles.push({
            g,
            x,
            y,
            life: 1,
            vy: -40 - Math.random() * 30,
        })
    }

    update(delta: number): void {
        this.time += delta

        // Spawn sparkles occasionally
        if (Math.random() < 0.3) {
            this.spawnSparkle()
        }

        // Update sparkles
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const s = this.sparkles[i]
            s.y += s.vy * delta
            s.life -= delta * 0.8
            s.g.position.set(s.x + Math.sin(this.time * 10 + i) * 3, s.y)
            s.g.alpha = s.life
            s.g.rotation += delta * 3

            if (s.life <= 0 || s.y < -10) {
                this.removeChild(s.g)
                this.sparkles.splice(i, 1)
            }
        }

        // Update wobbles - synchronized jumping wave
        for (let i = 0; i < this.wobbles.length; i++) {
            const w = this.wobbles[i]
            const jumpProgress = Math.sin(this.time * 4 + w.phase)
            const jump = Math.max(0, jumpProgress) * w.jumpHeight

            w.blob.position.y = w.baseY - jump

            // Squash and stretch
            const squash = jumpProgress > 0 ? 1 - jump / w.jumpHeight * 0.2 : 1 + Math.abs(jumpProgress) * 0.1
            w.blob.updateOptions({
                wobblePhase: this.time * 3 + i,
                scaleX: 1 / squash,
                scaleY: squash,
                expression: jump > 10 ? 'excited' : 'happy',
            })
        }
    }
}

// Mini particle display for sandbox preview - interactive physics playground
class MiniParticleDisplay extends Container {
    private particles: { blob: Wobble; x: number; y: number; vx: number; vy: number; trail: Graphics }[] = []
    private time = 0
    private displayWidth: number
    private displayHeight: number
    private wallGraphics: Graphics
    private sliderContainer: Container
    private sliderKnob: Graphics
    private gravityX = 0
    private gravityY = 0
    private formulaSymbols: { text: Text; x: number; y: number; alpha: number }[] = []

    constructor(width: number, height: number) {
        super()
        this.displayWidth = width
        this.displayHeight = height
        this.wallGraphics = new Graphics()
        this.sliderContainer = new Container()
        this.sliderKnob = new Graphics()
        this.setup()
    }

    private setup(): void {
        // Background with gradient feel
        const bg = new Graphics()
        bg.roundRect(0, 0, this.displayWidth, this.displayHeight, 12)
        bg.fill({ color: 0x0f0f1a, alpha: 0.95 })
        this.addChild(bg)

        // Grid lines for scientific feel
        const grid = new Graphics()
        for (let x = 20; x < this.displayWidth; x += 30) {
            grid.moveTo(x, 10)
            grid.lineTo(x, this.displayHeight - 10)
        }
        for (let y = 20; y < this.displayHeight; y += 30) {
            grid.moveTo(10, y)
            grid.lineTo(this.displayWidth - 10, y)
        }
        grid.stroke({ color: 0x4ecdc4, width: 1, alpha: 0.1 })
        this.addChild(grid)

        // Wall graphics
        this.addChild(this.wallGraphics)

        // Slider UI (left side)
        this.sliderContainer.position.set(25, 25)
        const sliderTrack = new Graphics()
        sliderTrack.roundRect(-4, 0, 8, this.displayHeight - 50, 4)
        sliderTrack.fill({ color: 0xffffff, alpha: 0.2 })
        this.sliderContainer.addChild(sliderTrack)

        this.sliderKnob.circle(0, 0, 8)
        this.sliderKnob.fill(0xf5b041)
        this.sliderKnob.position.set(0, (this.displayHeight - 50) / 2)
        this.sliderContainer.addChild(this.sliderKnob)

        // Slider label
        const sliderLabel = new Text({
            text: 'g',
            style: new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: 0xffffff, fontStyle: 'italic' }),
        })
        sliderLabel.anchor.set(0.5)
        sliderLabel.position.set(0, this.displayHeight - 35)
        this.sliderContainer.addChild(sliderLabel)
        this.addChild(this.sliderContainer)

        // Create bouncing particles with trails
        const numParticles = 6
        const colors = [0x4ecdc4, 0xff6b6b, 0xa29bfe, 0xffeaa7, 0x74b9ff, 0xfd79a8]
        const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle']

        for (let i = 0; i < numParticles; i++) {
            // Trail
            const trail = new Graphics()
            this.addChild(trail)

            const blob = new Wobble({
                size: 12 + Math.random() * 4,
                color: colors[i % colors.length],
                shape: shapes[i % shapes.length],
                expression: 'happy',
            })

            const x = 60 + Math.random() * (this.displayWidth - 100)
            const y = 30 + Math.random() * (this.displayHeight - 60)
            const angle = Math.random() * Math.PI * 2
            const speed = 50 + Math.random() * 30

            blob.position.set(x, y)
            this.addChild(blob)

            this.particles.push({
                blob,
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                trail,
            })
        }

        // Floating formula symbols
        const symbols = ['F=ma', 'E=mc²', 'PV=nRT', 'v²', 'Δx']
        for (let i = 0; i < 3; i++) {
            const text = new Text({
                text: symbols[i],
                style: new TextStyle({
                    fontFamily: 'Arial',
                    fontSize: 11,
                    fill: 0xffffff,
                    fontStyle: 'italic',
                }),
            })
            text.anchor.set(0.5)
            text.alpha = 0
            this.addChild(text)
            this.formulaSymbols.push({
                text,
                x: 80 + Math.random() * (this.displayWidth - 120),
                y: 30 + Math.random() * (this.displayHeight - 60),
                alpha: 0,
            })
        }
    }

    update(delta: number): void {
        this.time += delta

        // Animate gravity direction (cycling)
        const gravityAngle = this.time * 0.5
        this.gravityX = Math.sin(gravityAngle) * 80
        this.gravityY = Math.cos(gravityAngle) * 80

        // Animate slider knob
        const sliderY = ((Math.sin(gravityAngle) + 1) / 2) * (this.displayHeight - 50)
        this.sliderKnob.position.y = sliderY

        const padding = 18
        const left = 50 // Account for slider
        const right = this.displayWidth - padding
        const top = padding
        const bottom = this.displayHeight - padding

        // Update particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]

            // Apply gravity
            p.vx += this.gravityX * delta * 0.5
            p.vy += this.gravityY * delta * 0.5

            // Damping
            p.vx *= 0.995
            p.vy *= 0.995

            // Move
            p.x += p.vx * delta
            p.y += p.vy * delta

            // Wall collisions with bounce
            let hitWall = false
            if (p.x < left) { p.x = left; p.vx *= -0.8; hitWall = true }
            if (p.x > right) { p.x = right; p.vx *= -0.8; hitWall = true }
            if (p.y < top) { p.y = top; p.vy *= -0.8; hitWall = true }
            if (p.y > bottom) { p.y = bottom; p.vy *= -0.8; hitWall = true }

            // Update blob
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
            p.blob.position.set(p.x, p.y)
            p.blob.updateOptions({
                wobblePhase: this.time * 3 + i,
                scaleX: 1 + (speed / 150) * 0.1,
                scaleY: 1 - (speed / 150) * 0.08,
                expression: hitWall ? 'surprised' : speed > 60 ? 'excited' : 'happy',
            })

            // Draw trail
            p.trail.clear()
            p.trail.circle(p.x, p.y, 3)
            p.trail.fill({ color: 0xffffff, alpha: 0.3 })
            p.trail.moveTo(p.x, p.y)
            p.trail.lineTo(p.x - p.vx * 0.15, p.y - p.vy * 0.15)
            p.trail.stroke({ color: 0xffffff, width: 2, alpha: 0.2 })
        }

        // Animate formula symbols (fade in/out)
        for (let i = 0; i < this.formulaSymbols.length; i++) {
            const s = this.formulaSymbols[i]
            const phase = this.time * 0.3 + i * 2
            s.alpha = Math.max(0, Math.sin(phase) * 0.4)
            s.text.alpha = s.alpha
            s.text.position.set(s.x + Math.sin(this.time + i) * 5, s.y + Math.cos(this.time * 0.7 + i) * 3)
        }

        this.drawWalls()
    }

    private drawWalls(): void {
        const g = this.wallGraphics
        g.clear()

        const padding = 12
        g.roundRect(45, padding, this.displayWidth - 45 - padding, this.displayHeight - padding * 2, 8)
        g.stroke({ color: 0x4ecdc4, width: 3, alpha: 0.6 })

        // Gravity direction indicator
        const cx = this.displayWidth / 2 + 20
        const cy = this.displayHeight / 2
        const arrowLen = 20
        const ax = cx + (this.gravityX / 80) * arrowLen
        const ay = cy + (this.gravityY / 80) * arrowLen
        g.moveTo(cx, cy)
        g.lineTo(ax, ay)
        g.stroke({ color: 0xf5b041, width: 2, alpha: 0.6 })
        g.circle(ax, ay, 3)
        g.fill({ color: 0xf5b041, alpha: 0.8 })
    }
}

// Mini game display for game preview - action-packed physics game showcase
class MiniGameDisplay extends Container {
    private player: Wobble
    private enemies: { graphics: Graphics; x: number; y: number; vx: number; vy: number; size: number; color: number }[] = []
    private projectiles: { graphics: Graphics; x: number; y: number; vx: number; vy: number }[] = []
    private orbitals: { graphics: Graphics; angle: number }[] = []
    private xpOrbs: { graphics: Graphics; x: number; y: number; targetX: number; targetY: number; t: number }[] = []
    private damageNumbers: { text: Text; x: number; y: number; life: number; vy: number }[] = []
    private auraGraphics: Graphics
    private time = 0
    private shootTimer = 0
    private displayWidth: number
    private displayHeight: number

    constructor(width: number, height: number) {
        super()
        this.displayWidth = width
        this.displayHeight = height
        this.auraGraphics = new Graphics()
        this.player = new Wobble({
            size: 16,
            color: 0xf5b041,
            shape: 'circle',
            expression: 'excited',
        })
        this.setup()
    }

    private setup(): void {
        // Background - darker with vignette feel
        const bg = new Graphics()
        bg.roundRect(0, 0, this.displayWidth, this.displayHeight, 12)
        bg.fill({ color: 0x0a0a15, alpha: 0.95 })
        this.addChild(bg)

        // Danger zone border pulse
        const dangerBorder = new Graphics()
        dangerBorder.roundRect(2, 2, this.displayWidth - 4, this.displayHeight - 4, 10)
        dangerBorder.stroke({ color: 0xff6b6b, width: 2, alpha: 0.3 })
        this.addChild(dangerBorder)

        // Aura effect (behind player)
        this.addChild(this.auraGraphics)

        // Player
        const cx = this.displayWidth / 2
        const cy = this.displayHeight / 2
        this.player.position.set(cx, cy)
        this.addChild(this.player)

        // Create orbital skills
        for (let i = 0; i < 3; i++) {
            const orbital = new Graphics()
            orbital.circle(0, 0, 6)
            orbital.fill(0x4ecdc4)
            // Glow effect
            orbital.circle(0, 0, 8)
            orbital.fill({ color: 0x4ecdc4, alpha: 0.3 })
            this.addChild(orbital)
            this.orbitals.push({ graphics: orbital, angle: (Math.PI * 2 * i) / 3 })
        }

        // Create initial enemies
        for (let i = 0; i < 5; i++) {
            this.spawnEnemy()
        }
    }

    private spawnEnemy(): void {
        const enemy = new Graphics()
        const angle = Math.random() * Math.PI * 2
        const dist = 70 + Math.random() * 20
        const cx = this.displayWidth / 2
        const cy = this.displayHeight / 2
        const x = cx + Math.cos(angle) * dist
        const y = cy + Math.sin(angle) * dist

        // Varied enemy types
        const types = [
            { size: 6, color: 0xff6b6b, speed: 18 },
            { size: 8, color: 0xff4757, speed: 12 },
            { size: 10, color: 0xee5a24, speed: 8 },
        ]
        const type = types[Math.floor(Math.random() * types.length)]

        enemy.circle(0, 0, type.size)
        enemy.fill(type.color)
        // Evil eye
        enemy.circle(-2, -1, 2)
        enemy.circle(2, -1, 2)
        enemy.fill(0x000000)
        enemy.position.set(x, y)
        this.addChild(enemy)

        const dx = cx - x
        const dy = cy - y
        const len = Math.sqrt(dx * dx + dy * dy)

        this.enemies.push({
            graphics: enemy,
            x, y,
            vx: (dx / len) * type.speed,
            vy: (dy / len) * type.speed,
            size: type.size,
            color: type.color,
        })
    }

    private shoot(): void {
        if (this.enemies.length === 0) return

        const cx = this.displayWidth / 2
        const cy = this.displayHeight / 2

        // Find nearest enemy
        let nearest = this.enemies[0]
        let minDist = Infinity
        for (const e of this.enemies) {
            const dx = e.x - cx
            const dy = e.y - cy
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < minDist) { minDist = dist; nearest = e }
        }

        const dx = nearest.x - cx
        const dy = nearest.y - cy
        const len = Math.sqrt(dx * dx + dy * dy)

        const proj = new Graphics()
        proj.circle(0, 0, 4)
        proj.fill(0xf5b041)
        // Trail glow
        proj.moveTo(0, 0)
        proj.lineTo(-dx / len * 8, -dy / len * 8)
        proj.stroke({ color: 0xf5b041, width: 3, alpha: 0.5 })
        proj.position.set(cx, cy)
        this.addChild(proj)

        this.projectiles.push({ graphics: proj, x: cx, y: cy, vx: (dx / len) * 150, vy: (dy / len) * 150 })
    }

    private spawnDamageNumber(x: number, y: number, damage: number): void {
        const text = new Text({
            text: damage.toString(),
            style: new TextStyle({ fontFamily: 'Arial', fontSize: 10, fontWeight: 'bold', fill: 0xffd700 }),
        })
        text.anchor.set(0.5)
        text.position.set(x, y)
        this.addChild(text)
        this.damageNumbers.push({ text, x, y, life: 1, vy: -30 })
    }

    private spawnXpOrb(x: number, y: number): void {
        const orb = new Graphics()
        orb.circle(0, 0, 4)
        orb.fill(0x00ff88)
        orb.circle(0, 0, 6)
        orb.fill({ color: 0x00ff88, alpha: 0.3 })
        orb.position.set(x, y)
        this.addChild(orb)
        this.xpOrbs.push({ graphics: orb, x, y, targetX: this.displayWidth / 2, targetY: this.displayHeight / 2, t: 0 })
    }

    update(delta: number): void {
        this.time += delta
        this.shootTimer += delta

        const cx = this.displayWidth / 2
        const cy = this.displayHeight / 2

        // Auto-shoot
        if (this.shootTimer > 0.35) { this.shoot(); this.shootTimer = 0 }

        // Draw aura
        this.auraGraphics.clear()
        const auraRadius = 25 + Math.sin(this.time * 3) * 3
        this.auraGraphics.circle(cx, cy, auraRadius)
        this.auraGraphics.fill({ color: 0x4ecdc4, alpha: 0.15 })
        this.auraGraphics.circle(cx, cy, auraRadius + 5)
        this.auraGraphics.stroke({ color: 0x4ecdc4, width: 2, alpha: 0.2 })

        // Update player
        this.player.updateOptions({
            wobblePhase: this.time * 3,
            scaleX: 1 + Math.sin(this.time * 5) * 0.05,
            scaleY: 1 - Math.sin(this.time * 5) * 0.05,
        })

        // Update orbitals
        for (let i = 0; i < this.orbitals.length; i++) {
            const o = this.orbitals[i]
            o.angle += delta * 3
            const ox = cx + Math.cos(o.angle) * 28
            const oy = cy + Math.sin(o.angle) * 28
            o.graphics.position.set(ox, oy)

            // Check orbital collision with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j]
                const dx = ox - e.x
                const dy = oy - e.y
                if (Math.sqrt(dx * dx + dy * dy) < e.size + 6) {
                    this.spawnDamageNumber(e.x, e.y - 10, 5)
                    this.spawnXpOrb(e.x, e.y)
                    this.removeChild(e.graphics)
                    this.enemies.splice(j, 1)
                    this.spawnEnemy()
                }
            }
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i]
            e.x += e.vx * delta
            e.y += e.vy * delta
            e.graphics.position.set(e.x, e.y)
            e.graphics.scale.set(1 + Math.sin(this.time * 5 + i) * 0.1)

            // Respawn if too close
            const dx = e.x - cx
            const dy = e.y - cy
            if (Math.sqrt(dx * dx + dy * dy) < 18) {
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

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j]
                const dx = p.x - e.x
                const dy = p.y - e.y
                if (Math.sqrt(dx * dx + dy * dy) < e.size + 4) {
                    this.spawnDamageNumber(e.x, e.y - 10, 10)
                    this.spawnXpOrb(e.x, e.y)
                    this.removeChild(e.graphics)
                    this.removeChild(p.graphics)
                    this.enemies.splice(j, 1)
                    this.projectiles.splice(i, 1)
                    this.spawnEnemy()
                    break
                }
            }

            if (p.x < 0 || p.x > this.displayWidth || p.y < 0 || p.y > this.displayHeight) {
                this.removeChild(p.graphics)
                this.projectiles.splice(i, 1)
            }
        }

        // Update XP orbs (fly toward player)
        for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
            const orb = this.xpOrbs[i]
            orb.t += delta * 3
            const t = Math.min(orb.t, 1)
            const ease = t * t * (3 - 2 * t)
            orb.graphics.position.set(
                orb.x + (orb.targetX - orb.x) * ease,
                orb.y + (orb.targetY - orb.y) * ease
            )
            orb.graphics.alpha = 1 - t * 0.5

            if (t >= 1) {
                this.removeChild(orb.graphics)
                this.xpOrbs.splice(i, 1)
            }
        }

        // Update damage numbers
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const d = this.damageNumbers[i]
            d.life -= delta * 2
            d.y += d.vy * delta
            d.text.position.set(d.x, d.y)
            d.text.alpha = d.life

            if (d.life <= 0) {
                this.removeChild(d.text)
                this.damageNumbers.splice(i, 1)
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
    private miniOrbit: MiniOrbitDisplay | null = null
    private miniParticles: MiniParticleDisplay | null = null
    private miniGame: MiniGameDisplay | null = null
    private miniCelebration: MiniCelebrationDisplay | null = null

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
        if (this.miniOrbit) {
            this.miniOrbit.update(deltaSeconds)
        }
        if (this.miniParticles) {
            this.miniParticles.update(deltaSeconds)
        }
        if (this.miniGame) {
            this.miniGame.update(deltaSeconds)
        }
        if (this.miniCelebration) {
            this.miniCelebration.update(deltaSeconds)
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
        this.miniOrbit = null
        this.miniParticles = null
        this.miniGame = null
        this.miniCelebration = null
        this.titleAnimator = null
        this.messageAnimator = null
        this.buttonAnimator = null
        this.animationsComplete = false

        // Get current language
        const lang = i18n.language

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
        const cardHeight = hasEmbed ? 330 : 180
        const cardY = hasEmbed ? this.centerY - 60 : this.centerY + 30

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
        this.titleAnimator = TextAnimator.typewriter(title, localizeText(step.title, lang), 0.6, () => {
            this.animationsComplete = true
        })

        // Subtitle (if exists)
        let contentY = titleY + 28
        if (step.subtitle) {
            const subtitleContainer = new Container()
            const subtitle = new Text({
                text: localizeText(step.subtitle, lang),
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

            if (step.embedType === 'orbit') {
                this.miniOrbit = new MiniOrbitDisplay(embedWidth, embedHeight)
                this.miniOrbit.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniOrbit)
            } else if (step.embedType === 'particles') {
                this.miniParticles = new MiniParticleDisplay(embedWidth, embedHeight)
                this.miniParticles.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniParticles)
            } else if (step.embedType === 'game') {
                this.miniGame = new MiniGameDisplay(embedWidth, embedHeight)
                this.miniGame.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniGame)
            } else if (step.embedType === 'celebration') {
                this.miniCelebration = new MiniCelebrationDisplay(embedWidth, embedHeight)
                this.miniCelebration.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniCelebration)
            }

            contentY = embedY + embedHeight + 12
        }

        // Message container with fade-in animation
        const messageContainer = new Container()
        const message = new Text({
            text: localizeText(step.message, lang),
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
        this.dotsContainer.position.set(this.centerX, cardY + cardHeight + 20)
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
                text: localizeText(UI_TEXT.skip, lang),
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

        // Next/Start button (positioned above ad banner)
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
            text: localizeText(isLastStep ? UI_TEXT.start : UI_TEXT.next, lang),
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
