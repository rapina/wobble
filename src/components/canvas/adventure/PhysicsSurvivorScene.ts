import {
    Application,
    Container,
    Graphics,
    Text,
    TextStyle,
    Ticker,
    FederatedPointerEvent,
} from 'pixi.js'
import { AdventureScene, AdventureSceneOptions } from './AdventureScene'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../Wobble'
import { Perk, getRandomPerks, formatPerkEffect, perkDefinitions } from './perks'
import { BalatroFilter } from '../filters/BalatroFilter'
import { useCollectionStore } from '@/stores/collectionStore'
import {
    GameState,
    PlayerStats,
    DEFAULT_PLAYER_STATS,
    TextEffect,
    HitEffect,
    SurvivorRank,
    RANK_CONFIGS,
    getRankFromTime,
    WobbleStats,
    WOBBLE_STATS,
    PLAYABLE_CHARACTERS,
    EnemyTier,
} from './survivor'
import { EnemySystem } from './survivor/EnemySystem'
import { ProjectileSystem } from './survivor/ProjectileSystem'
import { BackgroundSystem } from './survivor/BackgroundSystem'

export class PhysicsSurvivorScene extends AdventureScene {
    // Game state
    private gameTime = 0
    private score = 0
    private playerHealth = 100
    private maxPlayerHealth = 100
    private gameState: GameState = 'playing'

    // Round system
    private currentRound = 1
    private roundTime = 0
    private roundDuration = 30 // 30 seconds per round

    // Perk system
    private studiedFormulas: Set<string> = new Set()
    private activePerks: Perk[] = []
    private perkChoices: Perk[] = []
    private perkButtons: { graphics: Graphics; perk: Perk; index: number }[] = []
    declare private perkContainer: Container

    // Card flip animation state
    private perkCardStates: {
        flipped: boolean
        animating: boolean
        frontContainer: Container
        backContainer: Container
    }[] = []
    private flipAnimations: { index: number; progress: number; direction: 'toFront' | 'toBack' }[] =
        []

    // Card back animation with Balatro filter
    private cardBackFilters: BalatroFilter[] = []
    private cardAnimTime = 0

    // Accumulated stats from perks
    private stats: PlayerStats = { ...DEFAULT_PLAYER_STATS }

    // Containers
    declare private gameContainer: Container
    declare private projectileContainer: Container
    declare private enemyContainer: Container
    declare private effectContainer: Container
    declare private uiContainer: Container

    // Player
    declare private player: Wobble
    private playerX = 0
    private playerY = 0
    private playerVx = 0
    private playerVy = 0
    private recoilDecay = 0.9

    // Systems
    declare private enemySystem: EnemySystem
    declare private projectileSystem: ProjectileSystem
    declare private backgroundSystem: BackgroundSystem

    // Fire system
    private fireRate = 0.5 // seconds between shots
    private fireTimer = 0

    // Enemy spawn
    private spawnRate = 2 // seconds between spawns
    private spawnTimer = 0

    // Effects
    private textEffects: TextEffect[] = []
    private hitEffects: HitEffect[] = []

    // UI
    declare private healthBar: Graphics
    declare private healthBarBg: Graphics
    declare private healthText: Text
    declare private timeText: Text
    declare private waveText: Text
    declare private perkIconsContainer: Container
    private perkIconGraphics: Graphics[] = []

    // Animation
    private animPhase = 0

    // Virtual joystick movement
    private joystickActive = false
    private joystickCenterX = 0
    private joystickCenterY = 0
    private inputDirX = 0 // Normalized input direction (-1 to 1)
    private inputDirY = 0
    private inputMagnitude = 0 // 0 to 1
    private readonly joystickMaxRadius = 60 // Max drag distance from center
    private readonly playerBaseSpeed = 4 // Base movement speed

    // Joystick visual
    declare private joystickContainer: Container
    declare private joystickBase: Graphics
    declare private joystickKnob: Graphics

    // Background container
    declare private bgContainer: Container

    // Result screen
    declare private resultContainer: Container
    private resultAnimTime = 0
    private resultAnimStep = 0
    private resultDisplayedTime = 0
    private resultDisplayedKills = 0
    private resultRankRevealed = false
    declare private resultTimeText: Text
    declare private resultKillsText: Text
    declare private resultWaveText: Text
    declare private resultRankText: Text
    declare private resultRankCard: Container
    declare private resultMessageText: Text
    declare private resultButtons: Container

    // Character selection screen
    declare private characterSelectContainer: Container
    private selectedCharacter: WobbleShape = 'circle'
    private characterWobbles: Map<WobbleShape, Wobble> = new Map()
    private previewWobble: Wobble | null = null
    declare private characterNameText: Text
    declare private characterDescText: Text
    declare private characterStatsContainer: Container
    declare private perkPreviewContainer: Container
    declare private startButton: Container
    private readonly baseMaxHealth = 100

    // Camera shake system
    private shakeIntensity = 0
    private shakeDuration = 0
    private readonly shakeDecay = 0.9

    constructor(app: Application, options?: AdventureSceneOptions) {
        super(app, options)
        // Store studied formulas from options
        if (options?.studiedFormulas) {
            this.studiedFormulas = options.studiedFormulas
        }
    }

    protected setup(): void {
        // Background container (behind everything, but after base background)
        this.bgContainer = new Container()
        this.container.addChild(this.bgContainer)

        // Create containers
        this.gameContainer = new Container()
        this.container.addChild(this.gameContainer)

        this.enemyContainer = new Container()
        this.gameContainer.addChild(this.enemyContainer)

        this.projectileContainer = new Container()
        this.gameContainer.addChild(this.projectileContainer)

        this.effectContainer = new Container()
        this.gameContainer.addChild(this.effectContainer)

        this.uiContainer = new Container()
        this.container.addChild(this.uiContainer)

        // Perk selection container (above everything)
        this.perkContainer = new Container()
        this.perkContainer.visible = false
        this.container.addChild(this.perkContainer)

        // Result screen container (above perk container)
        this.resultContainer = new Container()
        this.resultContainer.visible = false
        this.container.addChild(this.resultContainer)

        // Character selection container (above result container)
        this.characterSelectContainer = new Container()
        this.characterSelectContainer.visible = false
        this.container.addChild(this.characterSelectContainer)

        // Initialize systems
        this.backgroundSystem = new BackgroundSystem({
            bgContainer: this.bgContainer,
            width: this.width,
            height: this.height,
        })

        this.enemySystem = new EnemySystem({
            enemyContainer: this.enemyContainer,
            effectContainer: this.effectContainer,
            width: this.width,
            height: this.height,
            baseEnemySpeed: 1.5,
        })

        this.projectileSystem = new ProjectileSystem({
            projectileContainer: this.projectileContainer,
            effectContainer: this.effectContainer,
            width: this.width,
            height: this.height,
        })
    }

    // Override background to create corrupted world effect
    protected drawBackground(): void {
        this.backgroundSystem.initialize(this.background)
    }

    protected onInitialDraw(): void {
        // Hide the default grid - we use custom background
        this.gridOverlay.visible = false

        // Center position
        this.playerX = this.centerX
        this.playerY = this.centerY

        // Create player (Wobi)
        this.player = new Wobble({
            size: 50,
            shape: 'circle',
            expression: 'happy',
            color: 0xf5b041,
            showShadow: true,
        })
        this.player.position.set(this.playerX, this.playerY)
        this.gameContainer.addChild(this.player)

        // Setup UI
        this.setupUI()

        // Setup touch controls
        this.setupInteraction()
    }

    private setupInteraction(): void {
        // Make game container interactive
        this.gameContainer.eventMode = 'static'
        this.gameContainer.hitArea = { contains: () => true }

        this.gameContainer.on('pointerdown', this.onPointerDown.bind(this))
        this.gameContainer.on('pointermove', this.onPointerMove.bind(this))
        this.gameContainer.on('pointerup', this.onPointerUp.bind(this))
        this.gameContainer.on('pointerupoutside', this.onPointerUp.bind(this))

        // Create virtual joystick visual
        this.joystickContainer = new Container()
        this.joystickContainer.visible = false
        this.uiContainer.addChild(this.joystickContainer)

        // Joystick base (outer ring)
        this.joystickBase = new Graphics()
        this.joystickBase.circle(0, 0, this.joystickMaxRadius)
        this.joystickBase.fill({ color: 0x000000, alpha: 0.2 })
        this.joystickBase.circle(0, 0, this.joystickMaxRadius)
        this.joystickBase.stroke({ color: 0xffffff, width: 2, alpha: 0.4 })
        this.joystickContainer.addChild(this.joystickBase)

        // Joystick knob (inner circle)
        this.joystickKnob = new Graphics()
        this.joystickKnob.circle(0, 0, 20)
        this.joystickKnob.fill({ color: 0xffffff, alpha: 0.5 })
        this.joystickKnob.circle(0, 0, 20)
        this.joystickKnob.stroke({ color: 0xffffff, width: 2, alpha: 0.8 })
        this.joystickContainer.addChild(this.joystickKnob)
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (this.phase === 'narration' || this.gameState !== 'playing') return

        const pos = e.getLocalPosition(this.gameContainer)

        // Set joystick center at touch position
        this.joystickActive = true
        this.joystickCenterX = pos.x
        this.joystickCenterY = pos.y

        // Show joystick visual at touch position
        this.joystickContainer.visible = true
        this.joystickContainer.position.set(pos.x, pos.y)
        this.joystickKnob.position.set(0, 0)

        // Reset input
        this.inputDirX = 0
        this.inputDirY = 0
        this.inputMagnitude = 0
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        if (!this.joystickActive || this.gameState !== 'playing') return

        const pos = e.getLocalPosition(this.gameContainer)

        // Calculate offset from joystick center
        const dx = pos.x - this.joystickCenterX
        const dy = pos.y - this.joystickCenterY
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Calculate input magnitude (0-1)
        this.inputMagnitude = Math.min(1, dist / this.joystickMaxRadius)

        // Calculate normalized direction
        if (dist > 0.1) {
            this.inputDirX = dx / dist
            this.inputDirY = dy / dist
        } else {
            this.inputDirX = 0
            this.inputDirY = 0
        }

        // Update joystick knob position (clamped to max radius)
        const clampedDist = Math.min(dist, this.joystickMaxRadius)
        if (dist > 0) {
            this.joystickKnob.position.set((dx / dist) * clampedDist, (dy / dist) * clampedDist)
        }
    }

    private onPointerUp(_e: FederatedPointerEvent): void {
        this.joystickActive = false
        this.joystickContainer.visible = false

        // Clear input direction (player will decelerate naturally)
        this.inputDirX = 0
        this.inputDirY = 0
        this.inputMagnitude = 0
    }

    // UI helper: draw small hexagon for HUD elements
    private drawUIHexagon(
        g: Graphics,
        x: number,
        y: number,
        size: number,
        fill?: number,
        stroke?: number,
        strokeWidth = 2
    ): void {
        const points: number[] = []
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2
            points.push(x + size * Math.cos(angle))
            points.push(y + size * Math.sin(angle))
        }
        g.poly(points)
        if (fill !== undefined) g.fill(fill)
        if (stroke !== undefined) {
            g.poly(points)
            g.stroke({ color: stroke, width: strokeWidth })
        }
    }

    private setupUI(): void {
        // === Top-left: Health display as hexagonal hearts ===
        // Health badge container (hexagon with heart inside)
        this.healthBarBg = new Graphics()
        this.drawUIHexagon(this.healthBarBg, 28, 28, 22, 0x1a1520, 0x4a3a5a, 3)
        this.uiContainer.addChild(this.healthBarBg)

        // Heart icon inside health badge
        const heartIcon = new Text({
            text: '❤',
            style: new TextStyle({ fontSize: 16 }),
        })
        heartIcon.anchor.set(0.5)
        heartIcon.position.set(28, 26)
        this.uiContainer.addChild(heartIcon)

        // Health hearts container (individual heart icons)
        this.healthBar = new Graphics()
        this.healthBar.position.set(55, 18)
        this.uiContainer.addChild(this.healthBar)
        this.updateHealthBar()

        // HP text (hidden, but kept for compatibility)
        this.healthText = new Text({
            text: '',
            style: new TextStyle({ fontSize: 1, fill: 0x000000 }),
        })
        this.healthText.visible = false
        this.uiContainer.addChild(this.healthText)

        // === Below HP: Timer in hexagonal badge ===
        const timerBadge = new Graphics()
        // Elongated hexagon for timer (below HP hearts)
        const timerX = 95
        const timerY = 68
        timerBadge.moveTo(timerX - 40, timerY)
        timerBadge.lineTo(timerX - 32, timerY - 14)
        timerBadge.lineTo(timerX + 32, timerY - 14)
        timerBadge.lineTo(timerX + 40, timerY)
        timerBadge.lineTo(timerX + 32, timerY + 14)
        timerBadge.lineTo(timerX - 32, timerY + 14)
        timerBadge.closePath()
        timerBadge.fill(0x1a1520)
        timerBadge.stroke({ color: 0x5dade2, width: 2 })
        this.uiContainer.addChild(timerBadge)

        // Timer text
        const timerStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 16,
            fontWeight: 'bold',
            fill: 0x5dade2,
            letterSpacing: 1,
        })
        this.timeText = new Text({ text: '00:30', style: timerStyle })
        this.timeText.anchor.set(0.5)
        this.timeText.position.set(timerX, timerY)
        this.uiContainer.addChild(this.timeText)

        // === Top-right: Wave indicator ===
        const waveX = this.width - 35
        const waveY = 28
        const waveBadge = new Graphics()
        this.drawUIHexagon(waveBadge, waveX, waveY, 22, 0x1a1520, 0xf39c12, 3)
        this.uiContainer.addChild(waveBadge)

        // Wave number
        const waveStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xf39c12,
        })
        this.waveText = new Text({ text: '1', style: waveStyle })
        this.waveText.anchor.set(0.5)
        this.waveText.position.set(waveX, waveY)
        this.uiContainer.addChild(this.waveText)

        // === Bottom-left: Perk icons ===
        this.perkIconsContainer = new Container()
        this.perkIconsContainer.position.set(15, this.height - 50)
        this.uiContainer.addChild(this.perkIconsContainer)
    }

    private updateHealthBar(): void {
        this.healthBar.clear()

        // Calculate hearts to display (max 6 hearts, each represents portion of max health)
        const maxHearts = 6
        const healthPerHeart = this.maxPlayerHealth / maxHearts
        const fullHearts = Math.floor(this.playerHealth / healthPerHeart)
        const partialHeart = (this.playerHealth % healthPerHeart) / healthPerHeart

        const heartSize = 12
        const heartGap = 4

        for (let i = 0; i < maxHearts; i++) {
            const x = i * (heartSize * 2 + heartGap)
            const y = 0

            // Determine heart state
            let fillColor: number
            let strokeColor: number
            let fillAlpha = 1

            if (i < fullHearts) {
                // Full heart
                fillColor = 0xe74c3c
                strokeColor = 0xc0392b
            } else if (i === fullHearts && partialHeart > 0) {
                // Partial heart - show as dimmed
                fillColor = 0xe74c3c
                strokeColor = 0xc0392b
                fillAlpha = 0.3 + partialHeart * 0.7
            } else {
                // Empty heart
                fillColor = 0x2a2030
                strokeColor = 0x4a3a5a
            }

            // Draw hexagonal heart container
            const points: number[] = []
            const cx = x + heartSize
            const cy = y + heartSize
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI / 3) * j - Math.PI / 2
                points.push(cx + heartSize * Math.cos(angle))
                points.push(cy + heartSize * Math.sin(angle))
            }
            this.healthBar.poly(points)
            this.healthBar.fill({ color: fillColor, alpha: fillAlpha })
            this.healthBar.poly(points)
            this.healthBar.stroke({ color: strokeColor, width: 2 })
        }
    }

    private updateUI(): void {
        // Timer in MM:SS format
        const roundTimeLeft = Math.max(0, this.roundDuration - this.roundTime)
        const minutes = Math.floor(roundTimeLeft / 60)
        const seconds = Math.floor(roundTimeLeft % 60)
        this.timeText.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

        // Wave number only (not "Wave X")
        this.waveText.text = `${this.currentRound}`

        // Update perk icons
        this.updatePerkIcons()

        // Update health display
        this.updateHealthBar()
    }

    private updatePerkIcons(): void {
        // Clear existing icons
        this.perkIconsContainer.removeChildren()
        this.perkIconGraphics = []

        // Create hexagonal icon for each active perk
        const hexSize = 16
        const iconGap = 6

        this.activePerks.forEach((perk, index) => {
            const iconContainer = new Container()
            const x = index * (hexSize * 2 + iconGap) + hexSize
            iconContainer.position.set(x, hexSize)

            // Hexagon background
            const bg = new Graphics()
            this.drawUIHexagon(bg, 0, 0, hexSize, 0x1a1520, perk.definition.color, 2)
            iconContainer.addChild(bg)

            // Icon emoji
            const iconText = new Text({
                text: perk.definition.icon,
                style: new TextStyle({ fontSize: 12 }),
            })
            iconText.anchor.set(0.5)
            iconContainer.addChild(iconText)

            this.perkIconsContainer.addChild(iconContainer)
        })
    }

    private showPerkSelection(): void {
        this.gameState = 'perk-selection'
        this.perkContainer.visible = true

        // Clear previous
        this.perkContainer.removeChildren()
        this.perkButtons = []
        this.perkCardStates = []
        this.flipAnimations = []
        this.cardBackFilters = []
        this.cardAnimTime = 0

        // Get 3 random perks (always returns exactly 3)
        this.perkChoices = getRandomPerks(this.studiedFormulas, 3)

        // Dark background matching hexagonal theme
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(0x1a1520)
        this.perkContainer.addChild(bg)

        // Hexagonal pattern overlay
        const pattern = new Graphics()
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 10; col++) {
                const px = col * 45 + (row % 2) * 22
                const py = row * 40
                this.drawUIHexagon(pattern, px, py, 18, undefined, 0x2a2030, 1)
            }
        }
        pattern.alpha = 0.25
        this.perkContainer.addChild(pattern)

        // Title banner - elongated hexagon
        const bannerY = 55
        const banner = new Graphics()
        banner.moveTo(this.centerX - 100, bannerY)
        banner.lineTo(this.centerX - 85, bannerY - 25)
        banner.lineTo(this.centerX + 85, bannerY - 25)
        banner.lineTo(this.centerX + 100, bannerY)
        banner.lineTo(this.centerX + 85, bannerY + 25)
        banner.lineTo(this.centerX - 85, bannerY + 25)
        banner.closePath()
        banner.fill(0x1a1520)
        banner.stroke({ color: 0x9b59b6, width: 3 })
        this.perkContainer.addChild(banner)

        // Title
        const titleStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 16,
            fontWeight: 'bold',
            fill: 0x9b59b6,
            letterSpacing: 2,
        })
        const title = new Text({ text: 'LEVEL UP', style: titleStyle })
        title.anchor.set(0.5)
        title.position.set(this.centerX, bannerY)
        this.perkContainer.addChild(title)

        // Subtitle below banner
        const subtitle = new Text({
            text: '카드를 탭하여 확인',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: 0x6a5a7a,
            }),
        })
        subtitle.anchor.set(0.5)
        subtitle.position.set(this.centerX, bannerY + 38)
        this.perkContainer.addChild(subtitle)

        // Perk cards - narrower and taller for mobile
        const cardWidth = 100
        const cardHeight = 240
        const cardGap = 14
        const totalWidth =
            this.perkChoices.length * cardWidth + (this.perkChoices.length - 1) * cardGap
        const startX = (this.width - totalWidth) / 2
        const cardY = this.centerY - cardHeight / 2 + 20

        this.perkChoices.forEach((perk, index) => {
            const cardCenterX = startX + index * (cardWidth + cardGap) + cardWidth / 2

            // Create card wrapper container for flip animation
            const cardWrapper = new Container()
            cardWrapper.position.set(cardCenterX, cardY + cardHeight / 2)
            this.perkContainer.addChild(cardWrapper)

            // Create back container (shown initially)
            const backContainer = this.createCardBack(cardWidth, cardHeight, index)
            backContainer.visible = true
            cardWrapper.addChild(backContainer)

            // Create front container (hidden initially)
            const frontContainer = this.createCardFront(perk, cardWidth, cardHeight, index)
            frontContainer.visible = false
            cardWrapper.addChild(frontContainer)

            // Store card state
            this.perkCardStates.push({
                flipped: false,
                animating: false,
                frontContainer,
                backContainer,
            })

            // Make wrapper interactive for click handling
            cardWrapper.eventMode = 'static'
            cardWrapper.cursor = 'pointer'
            cardWrapper.hitArea = {
                contains: (x: number, y: number) => {
                    return (
                        x >= -cardWidth / 2 &&
                        x <= cardWidth / 2 &&
                        y >= -cardHeight / 2 &&
                        y <= cardHeight / 2
                    )
                },
            }
            cardWrapper.on('pointerdown', () => this.onPerkCardClick(index))

            this.perkButtons.push({ graphics: backContainer as unknown as Graphics, perk, index })
        })

        // Bottom hint
        const hintStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 11,
            fill: 0x7a9a7a,
        })
        const hint = new Text({
            text: '카드를 탭하여 뒤집기',
            style: hintStyle,
        })
        hint.anchor.set(0.5)
        hint.position.set(this.centerX, this.height - 40)
        this.perkContainer.addChild(hint)
    }

    private createCardBack(cardWidth: number, cardHeight: number, _index: number): Container {
        const container = new Container()

        // Card shadow
        const shadow = new Graphics()
        shadow.roundRect(-cardWidth / 2 + 4, -cardHeight / 2 + 6, cardWidth, cardHeight, 14)
        shadow.fill({ color: 0x000000, alpha: 0.5 })
        container.addChild(shadow)

        // Create a container for the Balatro effect with masking
        const effectContainer = new Container()
        container.addChild(effectContainer)

        // Background rect that will have the Balatro filter
        const balatroRect = new Graphics()
        balatroRect.roundRect(
            -cardWidth / 2 + 3,
            -cardHeight / 2 + 3,
            cardWidth - 6,
            cardHeight - 6,
            12
        )
        balatroRect.fill(0x2a1a3d)
        effectContainer.addChild(balatroRect)

        // Create and apply Balatro filter with purple colors
        const balatroFilter = new BalatroFilter({
            color1: [0.61, 0.35, 0.71, 1.0], // #9B59B6 - Light purple
            color2: [0.42, 0.23, 0.55, 1.0], // #6B3B8C - Purple
            color3: [0.1, 0.04, 0.15, 1.0], // #1A0A26 - Dark purple
            spinSpeed: 5.0,
            contrast: 3.0,
            lighting: 0.3,
            spinAmount: 0.2,
            pixelFilter: 300.0,
            spinEase: 0.8,
        })
        balatroFilter.setDimensions(cardWidth, cardHeight)
        effectContainer.filters = [balatroFilter]

        // Store filter reference for animation
        this.cardBackFilters.push(balatroFilter)

        // Card border - glowing purple with multiple layers
        const border = new Graphics()
        border.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14)
        border.stroke({ color: 0x9b59b6, width: 3 })
        border.roundRect(-cardWidth / 2 - 1, -cardHeight / 2 - 1, cardWidth + 2, cardHeight + 2, 15)
        border.stroke({ color: 0xbb79d6, width: 1, alpha: 0.5 })
        container.addChild(border)

        // Inner border glow
        const innerGlow = new Graphics()
        innerGlow.roundRect(
            -cardWidth / 2 + 4,
            -cardHeight / 2 + 4,
            cardWidth - 8,
            cardHeight - 8,
            11
        )
        innerGlow.stroke({ color: 0x6a3a8a, width: 2, alpha: 0.4 })
        container.addChild(innerGlow)

        // Central glow circle behind question mark
        const centerGlow = new Graphics()
        centerGlow.circle(0, -20, 40)
        centerGlow.fill({ color: 0x000000, alpha: 0.4 })
        centerGlow.circle(0, -20, 32)
        centerGlow.fill({ color: 0x1a0a25, alpha: 0.6 })
        container.addChild(centerGlow)

        // Question mark
        const questionStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 52,
            fontWeight: 'bold',
            fill: 0xffd700,
            dropShadow: {
                color: 0x000000,
                blur: 8,
                distance: 0,
            },
        })
        const question = new Text({ text: '?', style: questionStyle })
        question.anchor.set(0.5)
        question.position.set(0, -20)
        container.addChild(question)

        // "Tap to reveal" text
        const tapStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fill: 0xccaaee,
        })
        const tapText = new Text({ text: '탭하여 확인', style: tapStyle })
        tapText.anchor.set(0.5)
        tapText.position.set(0, cardHeight / 2 - 24)
        container.addChild(tapText)

        return container
    }

    private updateCardBackAnimations(delta: number): void {
        this.cardAnimTime += delta * 0.016 // Convert to roughly seconds

        // Update Balatro filter time for each card
        for (let i = 0; i < this.cardBackFilters.length; i++) {
            const filter = this.cardBackFilters[i]
            const state = this.perkCardStates[i]

            // Only animate if card is not flipped
            if (state && !state.flipped) {
                // Each card has a slightly different time offset for variety
                filter.time = this.cardAnimTime + i * 0.5
            }
        }
    }

    private createCardFront(
        perk: Perk,
        cardWidth: number,
        cardHeight: number,
        _index: number
    ): Container {
        const container = new Container()

        const card = new Graphics()

        // Card shadow
        card.roundRect(-cardWidth / 2 + 4, -cardHeight / 2 + 6, cardWidth, cardHeight, 14)
        card.fill({ color: 0x000000, alpha: 0.5 })

        // Card background - solid color
        card.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14)
        card.fill(0x1e2a30)

        // Card inner area
        card.roundRect(-cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, cardHeight - 8, 11)
        card.fill(0x2d3e44)

        // Card border with perk color
        card.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14)
        card.stroke({ color: perk.definition.color, width: 3 })

        // Top accent bar
        card.roundRect(-cardWidth / 2 + 8, -cardHeight / 2 + 8, cardWidth - 16, 4, 2)
        card.fill(perk.definition.color)

        // Icon background circle with glow
        card.circle(0, -cardHeight / 2 + 55, 28)
        card.fill({ color: perk.definition.color, alpha: 0.15 })
        card.circle(0, -cardHeight / 2 + 55, 24)
        card.fill({ color: perk.definition.color, alpha: 0.1 })

        container.addChild(card)

        // Icon
        const iconStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 32,
        })
        const icon = new Text({ text: perk.definition.icon, style: iconStyle })
        icon.anchor.set(0.5)
        icon.position.set(0, -cardHeight / 2 + 55)
        container.addChild(icon)

        // Name (formula name)
        const nameStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 13,
            fontWeight: 'bold',
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: cardWidth - 14,
            align: 'center',
        })
        const name = new Text({ text: perk.definition.nameKo, style: nameStyle })
        name.anchor.set(0.5, 0)
        name.position.set(0, -cardHeight / 2 + 88)
        container.addChild(name)

        // Description
        const descStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 9,
            fill: 0x90a4ae,
            wordWrap: true,
            wordWrapWidth: cardWidth - 16,
            align: 'center',
            lineHeight: 13,
        })
        const desc = new Text({ text: perk.definition.descriptionKo, style: descStyle })
        desc.anchor.set(0.5, 0)
        desc.position.set(0, -cardHeight / 2 + 112)
        container.addChild(desc)

        // Divider line
        const divider = new Graphics()
        divider.moveTo(-cardWidth / 2 + 10, -cardHeight / 2 + 155)
        divider.lineTo(cardWidth / 2 - 10, -cardHeight / 2 + 155)
        divider.stroke({ color: 0x4a5a60, width: 1 })
        container.addChild(divider)

        // Effects
        const effectStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 11,
            fontWeight: 'bold',
            fill: 0x81c784,
            wordWrap: true,
            wordWrapWidth: cardWidth - 16,
            align: 'center',
            lineHeight: 15,
        })
        const effectTexts = perk.rolledEffects.map((e) => formatPerkEffect(e, true)).join('\n')
        const effects = new Text({ text: effectTexts, style: effectStyle })
        effects.anchor.set(0.5, 0)
        effects.position.set(0, -cardHeight / 2 + 165)
        container.addChild(effects)

        // "Select" hint at bottom with glow effect
        const selectStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fontWeight: 'bold',
            fill: 0xffd700,
            dropShadow: {
                color: 0xffd700,
                blur: 6,
                distance: 0,
                alpha: 0.5,
            },
        })
        const selectHint = new Text({ text: '탭하여 선택', style: selectStyle })
        selectHint.anchor.set(0.5)
        selectHint.position.set(0, cardHeight / 2 - 16)
        container.addChild(selectHint)

        return container
    }

    private onPerkCardClick(index: number): void {
        const state = this.perkCardStates[index]
        if (!state || state.animating) return

        if (!state.flipped) {
            // Start flip animation to reveal front
            this.startFlipAnimation(index, 'toFront')
        } else {
            // Already flipped, select this perk
            this.selectPerk(index)
        }
    }

    private startFlipAnimation(index: number, direction: 'toFront' | 'toBack'): void {
        const state = this.perkCardStates[index]
        if (!state) return

        state.animating = true
        this.flipAnimations.push({
            index,
            progress: 0,
            direction,
        })
    }

    private updateFlipAnimations(delta: number): void {
        const flipSpeed = 0.08 // Animation speed

        for (let i = this.flipAnimations.length - 1; i >= 0; i--) {
            const anim = this.flipAnimations[i]
            const state = this.perkCardStates[anim.index]
            if (!state) {
                this.flipAnimations.splice(i, 1)
                continue
            }

            anim.progress += flipSpeed * delta

            // Find the card wrapper (parent of front/back containers)
            const wrapper = state.frontContainer.parent
            if (!wrapper) {
                this.flipAnimations.splice(i, 1)
                continue
            }

            if (anim.progress <= 0.5) {
                // First half: shrink scale X
                const scaleX = 1 - anim.progress * 2 // 1 -> 0
                wrapper.scale.x = Math.max(0.01, scaleX)
            } else {
                // Second half: expand scale X and switch faces
                const scaleX = (anim.progress - 0.5) * 2 // 0 -> 1
                wrapper.scale.x = Math.max(0.01, scaleX)

                // Switch visibility at midpoint
                if (anim.direction === 'toFront') {
                    state.backContainer.visible = false
                    state.frontContainer.visible = true
                } else {
                    state.backContainer.visible = true
                    state.frontContainer.visible = false
                }
            }

            // Animation complete
            if (anim.progress >= 1) {
                wrapper.scale.x = 1
                state.animating = false
                state.flipped = anim.direction === 'toFront'
                this.flipAnimations.splice(i, 1)
            }
        }
    }

    private selectPerk(index: number): void {
        const perk = this.perkChoices[index]
        if (!perk) return

        // Add to active perks
        this.activePerks.push(perk)

        // Apply perk effects to stats
        this.applyPerkEffects(perk)

        // Start next round
        this.startNextRound()
    }

    private applyPerkEffects(perk: Perk): void {
        for (const effect of perk.rolledEffects) {
            const multiplier = effect.isPercent ? 1 + effect.value / 100 : effect.value

            switch (effect.stat) {
                case 'damage':
                    this.stats.damageMultiplier *= effect.isPercent ? multiplier : 1
                    break
                case 'fireRate':
                    this.stats.fireRateMultiplier *= effect.isPercent ? multiplier : 1
                    break
                case 'projectileSpeed':
                    this.stats.projectileSpeedMultiplier *= effect.isPercent ? multiplier : 1
                    break
                case 'projectileSize':
                    this.stats.projectileSizeMultiplier *= effect.isPercent ? multiplier : 1
                    break
                case 'knockback':
                    this.stats.knockbackMultiplier *= effect.isPercent ? multiplier : 1
                    break
                case 'bounce':
                    this.stats.bounceCount += effect.value
                    break
                case 'piercing':
                    this.stats.piercingCount += effect.value
                    break
                case 'explosionRadius':
                    this.stats.explosionRadius += effect.value
                    break
                case 'moveSpeed':
                    this.stats.moveSpeedMultiplier *= effect.isPercent ? multiplier : 1
                    break
            }
        }
    }

    private startNextRound(): void {
        this.perkContainer.visible = false
        this.currentRound++
        this.roundTime = 0
        this.gameState = 'playing'
        this.updateUI()
    }

    private checkRoundComplete(): void {
        if (this.roundTime >= this.roundDuration) {
            this.showPerkSelection()
        }
    }

    private fireProjectile(): void {
        this.projectileSystem.fire(this.playerX, this.playerY, this.enemySystem.enemies, this.stats)
    }

    private updateProjectiles(delta: number): void {
        this.projectileSystem.update(delta)
        this.projectileSystem.checkCollisions(
            this.enemySystem.enemies,
            this.stats,
            this.hitEffects,
            () => {
                this.score += 10
                useCollectionStore.getState().unlockWobble('shadow')
            },
            (x, y) => this.createExplosion(x, y)
        )
    }

    private updateEnemiesAndMerges(delta: number, deltaSeconds: number): void {
        this.enemySystem.update(delta, this.playerX, this.playerY, this.animPhase)
        this.enemySystem.checkCollisions(deltaSeconds, this.hitEffects)
        this.enemySystem.updateMerges(this.gameTime, this.hitEffects)
        this.enemySystem.cleanupOverlapTracker()

        // Trigger camera shake for dead enemies before cleanup
        const deadEnemies = this.enemySystem.getDeadEnemies()
        for (const enemy of deadEnemies) {
            const shakeConfig: Record<EnemyTier, { intensity: number; duration: number }> = {
                small: { intensity: 3, duration: 0.1 },
                medium: { intensity: 5, duration: 0.15 },
                large: { intensity: 8, duration: 0.2 },
                boss: { intensity: 12, duration: 0.3 },
            }
            const config = shakeConfig[enemy.tier]
            this.triggerShake(config.intensity, config.duration)
        }

        this.score += this.enemySystem.cleanupDead()
    }

    private spawnEnemy(): void {
        this.enemySystem.spawnAtEdge(this.gameTime)
    }

    // Check collisions between enemies and player
    private checkPlayerCollisions(): void {
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            const minDist = 25 + enemy.size / 2

            if (dist < minDist) {
                this.playerHealth -= 1
                this.updateHealthBar()

                // Push enemy back
                const nx = dx / (dist || 1)
                const ny = dy / (dist || 1)
                enemy.vx += nx * 3
                enemy.vy += ny * 3

                if (this.playerHealth <= 0) {
                    this.gameOver()
                }
            }
        }
    }

    private createExplosion(x: number, y: number): void {
        const radius = this.stats.explosionRadius
        const damage = 5 * this.stats.damageMultiplier

        // Visual effect
        const explosion = new Graphics()
        explosion.circle(0, 0, radius)
        explosion.fill({ color: 0xff6600, alpha: 0.5 })
        explosion.position.set(x, y)
        this.effectContainer.addChild(explosion)

        // Damage enemies in radius
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - x
            const dy = enemy.y - y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < radius + enemy.size / 2) {
                enemy.health -= damage
                const nx = dx / (dist || 1)
                const ny = dy / (dist || 1)
                enemy.vx += nx * 5
                enemy.vy += ny * 5
            }
        }

        this.hitEffects.push({ x, y, timer: 0.3, graphics: explosion })
    }

    private updateEffects(delta: number): void {
        // Text effects
        for (let i = this.textEffects.length - 1; i >= 0; i--) {
            const effect = this.textEffects[i]
            effect.timer -= delta / 60

            // Fade and rise
            effect.text.alpha = Math.min(1, effect.timer)
            effect.text.y -= delta * 0.5

            if (effect.timer <= 0) {
                this.effectContainer.removeChild(effect.text)
                effect.text.destroy()
                this.textEffects.splice(i, 1)
            }
        }

        // Hit effects
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i]
            effect.timer -= delta / 60

            effect.graphics.alpha = effect.timer / 0.2
            effect.graphics.scale.set(1 + (0.2 - effect.timer) * 3)

            if (effect.timer <= 0) {
                this.effectContainer.removeChild(effect.graphics)
                effect.graphics.destroy()
                this.hitEffects.splice(i, 1)
            }
        }
    }

    // Camera shake methods
    private triggerShake(intensity: number, duration: number): void {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity)
        this.shakeDuration = Math.max(this.shakeDuration, duration)
    }

    private updateShake(delta: number): void {
        if (this.shakeDuration > 0) {
            // Random offset for shake effect
            const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2
            const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2

            // Apply offset to gameContainer (UI stays stable)
            this.gameContainer.position.set(offsetX, offsetY)

            // Decay intensity
            this.shakeIntensity *= this.shakeDecay
            this.shakeDuration -= delta / 60

            // Reset position when shake ends
            if (this.shakeDuration <= 0) {
                this.gameContainer.position.set(0, 0)
                this.shakeIntensity = 0
                this.shakeDuration = 0
            }
        }
    }

    private updatePlayer(delta: number): void {
        // Calculate target velocity from joystick input
        const speed = this.playerBaseSpeed * this.stats.moveSpeedMultiplier
        const targetVx = this.inputDirX * this.inputMagnitude * speed
        const targetVy = this.inputDirY * this.inputMagnitude * speed

        // Smooth acceleration towards target velocity
        const accel = 0.15
        const friction = 0.85

        if (this.inputMagnitude > 0.1) {
            // Accelerate towards target
            this.playerVx += (targetVx - this.playerVx) * accel * delta
            this.playerVy += (targetVy - this.playerVy) * accel * delta
        } else {
            // Apply friction when no input
            this.playerVx *= friction
            this.playerVy *= friction
        }

        // Apply velocity to position
        this.playerX += this.playerVx * delta
        this.playerY += this.playerVy * delta

        // Keep in bounds
        const margin = 30
        if (this.playerX < margin) {
            this.playerX = margin
            this.playerVx = 0
        } else if (this.playerX > this.width - margin) {
            this.playerX = this.width - margin
            this.playerVx = 0
        }
        if (this.playerY < margin) {
            this.playerY = margin
            this.playerVy = 0
        } else if (this.playerY > this.height - margin) {
            this.playerY = this.height - margin
            this.playerVy = 0
        }

        this.player.position.set(this.playerX, this.playerY)

        // Update player look direction based on velocity
        const velMag = Math.sqrt(this.playerVx * this.playerVx + this.playerVy * this.playerVy)
        if (velMag > 0.5) {
            this.player.updateOptions({
                lookDirection: { x: this.playerVx / velMag, y: this.playerVy / velMag },
            })
        }
    }

    private gameOver(): void {
        this.gameState = 'game-over'
        this.player.updateOptions({ expression: 'dizzy' })

        // Short delay before showing result screen
        setTimeout(() => {
            this.showResult()
        }, 800)
    }

    private showResult(): void {
        this.gameState = 'result'
        this.resultAnimTime = 0
        this.resultAnimStep = 0
        this.resultDisplayedTime = 0
        this.resultDisplayedKills = 0
        this.resultRankRevealed = false

        this.createResultUI()
        this.resultContainer.visible = true
    }

    private createResultUI(): void {
        // Clear previous result UI
        this.resultContainer.removeChildren()

        const centerX = this.width / 2

        // Dark background with hexagonal pattern
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(0x1a1520)
        this.resultContainer.addChild(bg)

        // Hexagonal pattern overlay
        const pattern = new Graphics()
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 10; col++) {
                const px = col * 45 + (row % 2) * 22
                const py = row * 40
                this.drawUIHexagon(pattern, px, py, 18, undefined, 0x2a2030, 1)
            }
        }
        pattern.alpha = 0.2
        this.resultContainer.addChild(pattern)

        // Title in hexagonal banner
        const titleY = 50
        const titleBanner = new Graphics()
        titleBanner.moveTo(centerX - 80, titleY)
        titleBanner.lineTo(centerX - 65, titleY - 22)
        titleBanner.lineTo(centerX + 65, titleY - 22)
        titleBanner.lineTo(centerX + 80, titleY)
        titleBanner.lineTo(centerX + 65, titleY + 22)
        titleBanner.lineTo(centerX - 65, titleY + 22)
        titleBanner.closePath()
        titleBanner.fill(0x1a1520)
        titleBanner.stroke({ color: 0xffd700, width: 3 })
        titleBanner.alpha = 0
        this.resultContainer.addChild(titleBanner)

        const titleStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 18,
            fontWeight: 'bold',
            fill: 0xffd700,
            letterSpacing: 3,
        })
        const title = new Text({ text: 'SURVIVED', style: titleStyle })
        title.anchor.set(0.5)
        title.position.set(centerX, titleY)
        title.alpha = 0
        this.resultContainer.addChild(title)

        // Stats in hexagonal badges
        const statsY = 115
        const statGap = 60

        // Time stat badge
        this.createResultStatBadge(centerX - 70, statsY, '⏱', 0x5dade2)
        this.resultTimeText = new Text({
            text: '00:00',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: 0x5dade2,
            }),
        })
        this.resultTimeText.anchor.set(0, 0.5)
        this.resultTimeText.position.set(centerX - 40, statsY)
        this.resultTimeText.alpha = 0
        this.resultContainer.addChild(this.resultTimeText)

        // Kills stat badge
        this.createResultStatBadge(centerX - 70, statsY + statGap, '💀', 0xe74c3c)
        this.resultKillsText = new Text({
            text: '0',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: 0xe74c3c,
            }),
        })
        this.resultKillsText.anchor.set(0, 0.5)
        this.resultKillsText.position.set(centerX - 40, statsY + statGap)
        this.resultKillsText.alpha = 0
        this.resultContainer.addChild(this.resultKillsText)

        // Wave stat badge
        this.createResultStatBadge(centerX - 70, statsY + statGap * 2, '🌊', 0xf39c12)
        this.resultWaveText = new Text({
            text: `${this.currentRound}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: 0xf39c12,
            }),
        })
        this.resultWaveText.anchor.set(0, 0.5)
        this.resultWaveText.position.set(centerX - 40, statsY + statGap * 2)
        this.resultWaveText.alpha = 0
        this.resultContainer.addChild(this.resultWaveText)

        // Perk icons row (hexagonal)
        const perkY = statsY + statGap * 3
        if (this.activePerks.length > 0) {
            const hexSize = 18
            const iconGap = 8
            const totalWidth =
                this.activePerks.length * (hexSize * 2) + (this.activePerks.length - 1) * iconGap
            const startX = centerX - totalWidth / 2 + hexSize

            this.activePerks.forEach((perk, i) => {
                const iconContainer = new Container()
                iconContainer.position.set(startX + i * (hexSize * 2 + iconGap), perkY)
                iconContainer.alpha = 0
                iconContainer.scale.set(0)

                const iconBg = new Graphics()
                this.drawUIHexagon(iconBg, 0, 0, hexSize, 0x1a1520, perk.definition.color, 2)
                iconContainer.addChild(iconBg)

                const iconText = new Text({
                    text: perk.definition.icon,
                    style: new TextStyle({ fontSize: 14 }),
                })
                iconText.anchor.set(0.5)
                iconContainer.addChild(iconText)

                this.resultContainer.addChild(iconContainer)
            })
        }

        // Rank card (large hexagon)
        const rankY = this.activePerks.length > 0 ? perkY + 100 : statsY + statGap * 3 + 20
        this.resultRankCard = new Container()
        this.resultRankCard.position.set(centerX, rankY)
        this.resultRankCard.scale.set(0)
        this.resultContainer.addChild(this.resultRankCard)

        const rank = getRankFromTime(this.gameTime)
        const rankConfig = RANK_CONFIGS[rank]

        // Large hexagonal rank badge
        const rankHexSize = 55
        const rankHexBg = new Graphics()
        this.drawUIHexagon(rankHexBg, 0, 0, rankHexSize + 5, 0x0a0a10, rankConfig.color, 4)
        this.resultRankCard.addChild(rankHexBg)

        const rankHexInner = new Graphics()
        this.drawUIHexagon(rankHexInner, 0, 0, rankHexSize, 0x1a1520, rankConfig.color, 3)
        this.resultRankCard.addChild(rankHexInner)

        // Rank letter
        this.resultRankText = new Text({
            text: rank,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 48,
                fontWeight: 'bold',
                fill: rankConfig.color,
            }),
        })
        this.resultRankText.anchor.set(0.5)
        this.resultRankCard.addChild(this.resultRankText)

        // Rank message below
        this.resultMessageText = new Text({
            text: rankConfig.message,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: rankConfig.color,
            }),
        })
        this.resultMessageText.anchor.set(0.5)
        this.resultMessageText.position.set(0, 70)
        this.resultRankCard.addChild(this.resultMessageText)

        // Action buttons (hexagonal style)
        this.resultButtons = new Container()
        this.resultButtons.position.set(centerX, this.height - 70)
        this.resultButtons.alpha = 0
        this.resultContainer.addChild(this.resultButtons)

        // Retry button (hexagon)
        const retryBtn = this.createResultButton('▶', -50, 0x2ecc71, () => {
            this.resultContainer.visible = false
            this.reset()
            this.play()
        })
        this.resultButtons.addChild(retryBtn)

        // Menu button (hexagon)
        const menuBtn = this.createResultButton('✕', 50, 0xe74c3c, () => {
            this.onPlayComplete?.('success')
        })
        this.resultButtons.addChild(menuBtn)
    }

    private createResultStatBadge(x: number, y: number, icon: string, color: number): void {
        const badge = new Graphics()
        this.drawUIHexagon(badge, x, y, 20, 0x1a1520, color, 2)
        badge.alpha = 0
        this.resultContainer.addChild(badge)

        const iconText = new Text({
            text: icon,
            style: new TextStyle({ fontSize: 14 }),
        })
        iconText.anchor.set(0.5)
        iconText.position.set(x, y)
        iconText.alpha = 0
        this.resultContainer.addChild(iconText)
    }

    private createStatLabel(text: string, x: number, y: number): Text {
        const label = new Text({
            text,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fill: 0x888888,
            }),
        })
        label.anchor.set(0.5)
        label.position.set(x, y)
        return label
    }

    private createResultButton(
        icon: string,
        offsetX: number,
        color: number,
        onClick: () => void
    ): Container {
        const btn = new Container()
        btn.position.set(offsetX, 0)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'

        // Hexagonal button
        const hexSize = 28
        const bg = new Graphics()
        this.drawUIHexagon(bg, 0, 0, hexSize, 0x1a1520, color, 3)
        btn.addChild(bg)

        const label = new Text({
            text: icon,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: color,
            }),
        })
        label.anchor.set(0.5)
        btn.addChild(label)

        btn.on('pointerdown', onClick)

        return btn
    }

    private animateResult(deltaSeconds: number): void {
        this.resultAnimTime += deltaSeconds

        const children = this.resultContainer.children

        // Step 0: Fade in title banner and text (0.0s - 0.3s)
        if (this.resultAnimTime >= 0 && this.resultAnimStep === 0) {
            const progress = Math.min(1, this.resultAnimTime / 0.3)
            // Title banner is at index 2, title text at index 3
            if (children[2]) children[2].alpha = progress
            if (children[3]) children[3].alpha = progress
            if (this.resultAnimTime >= 0.3) this.resultAnimStep = 1
        }

        // Step 1: Show time stat (0.3s - 0.6s)
        if (this.resultAnimTime >= 0.3 && this.resultAnimStep === 1) {
            const progress = Math.min(1, (this.resultAnimTime - 0.3) / 0.3)
            // Time badge at 4, icon at 5
            if (children[4]) children[4].alpha = progress
            if (children[5]) children[5].alpha = progress
            this.resultTimeText.alpha = progress
            this.resultDisplayedTime = this.gameTime * this.easeOutQuad(progress)
            const mins = Math.floor(this.resultDisplayedTime / 60)
            const secs = Math.floor(this.resultDisplayedTime % 60)
            this.resultTimeText.text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            if (progress >= 1) this.resultAnimStep = 2
        }

        // Step 2: Show kills stat (0.6s - 0.9s)
        if (this.resultAnimTime >= 0.6 && this.resultAnimStep === 2) {
            const progress = Math.min(1, (this.resultAnimTime - 0.6) / 0.3)
            // Kills badge at 7, icon at 8
            if (children[7]) children[7].alpha = progress
            if (children[8]) children[8].alpha = progress
            this.resultKillsText.alpha = progress
            const totalKills = Math.floor(this.score / 10)
            this.resultDisplayedKills = Math.floor(totalKills * this.easeOutQuad(progress))
            this.resultKillsText.text = this.resultDisplayedKills.toString()
            if (progress >= 1) this.resultAnimStep = 3
        }

        // Step 3: Show wave stat (0.9s - 1.1s)
        if (this.resultAnimTime >= 0.9 && this.resultAnimStep === 3) {
            const progress = Math.min(1, (this.resultAnimTime - 0.9) / 0.2)
            // Wave badge at 10, icon at 11
            if (children[10]) children[10].alpha = progress
            if (children[11]) children[11].alpha = progress
            this.resultWaveText.alpha = progress
            if (progress >= 1) this.resultAnimStep = 4
        }

        // Step 4: Pop in perk icons (1.1s - 1.6s)
        if (this.resultAnimTime >= 1.1 && this.resultAnimStep === 4) {
            // Perk icons start after wave text (index 13)
            const perkStartIndex = 13
            if (this.activePerks.length > 0) {
                for (let i = 0; i < this.activePerks.length; i++) {
                    const iconTime = 1.1 + i * 0.08
                    if (this.resultAnimTime >= iconTime) {
                        const icon = children[perkStartIndex + i] as Container
                        if (icon) {
                            const progress = Math.min(1, (this.resultAnimTime - iconTime) / 0.12)
                            icon.alpha = progress
                            icon.scale.set(this.easeOutBack(progress))
                        }
                    }
                }
            }
            const perkAnimDone = 1.1 + this.activePerks.length * 0.08 + 0.15
            if (this.resultAnimTime >= perkAnimDone) {
                this.resultAnimStep = 5
            }
        }

        // Step 5: Reveal rank card (1.6s - 2.0s)
        if (this.resultAnimTime >= 1.6 && this.resultAnimStep === 5) {
            const progress = Math.min(1, (this.resultAnimTime - 1.6) / 0.3)
            this.resultRankCard.scale.set(this.easeOutBack(progress))

            if (progress >= 1 && !this.resultRankRevealed) {
                this.resultRankRevealed = true
            }
            if (this.resultAnimTime >= 1.9) this.resultAnimStep = 6
        }

        // Step 6: Show buttons (1.9s+)
        if (this.resultAnimTime >= 1.9 && this.resultAnimStep === 6) {
            const progress = Math.min(1, (this.resultAnimTime - 1.9) / 0.2)
            this.resultButtons.alpha = progress
            if (progress >= 1) this.resultAnimStep = 7
        }

        // Rank card pulse animation
        if (this.resultRankRevealed) {
            const pulse = 1 + Math.sin(this.resultAnimTime * 4) * 0.03
            this.resultRankCard.scale.set(pulse)
        }
    }

    private easeOutQuad(t: number): number {
        return 1 - (1 - t) * (1 - t)
    }

    private easeOutBack(t: number): number {
        const c1 = 1.70158
        const c3 = c1 + 1
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
    }

    // === Character Selection Screen ===
    // Hexagon drawing helper
    private drawHexagon(
        g: Graphics,
        x: number,
        y: number,
        size: number,
        fill?: number,
        stroke?: number,
        strokeWidth = 3
    ): void {
        const points: number[] = []
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2
            points.push(x + size * Math.cos(angle))
            points.push(y + size * Math.sin(angle))
        }
        g.poly(points)
        if (fill !== undefined) g.fill(fill)
        if (stroke !== undefined) {
            g.poly(points)
            g.stroke({ color: stroke, width: strokeWidth })
        }
    }

    private showCharacterSelect(): void {
        this.gameState = 'character-select'
        this.createCharacterSelectUI()
        this.characterSelectContainer.visible = true
    }

    private createCharacterSelectUI(): void {
        // Clear previous UI
        this.characterSelectContainer.removeChildren()
        this.characterWobbles.clear()

        const centerX = this.width / 2

        // Dark background with subtle pattern
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(0x1a1520)
        this.characterSelectContainer.addChild(bg)

        // Subtle hex pattern in background
        const pattern = new Graphics()
        for (let row = 0; row < 12; row++) {
            for (let col = 0; col < 8; col++) {
                const px = col * 50 + (row % 2) * 25
                const py = row * 45
                this.drawHexagon(pattern, px, py, 20, undefined, 0x2a2030, 1)
            }
        }
        pattern.alpha = 0.3
        this.characterSelectContainer.addChild(pattern)

        // Character selection - responsive layout (2 rows x 3 cols for narrow screens)
        const hexSize = Math.min(28, (this.width - 60) / 8) // Responsive hex size
        const charGap = 10
        const charsPerRow = 3
        const rowGap = 12
        const charStartY = 70

        PLAYABLE_CHARACTERS.forEach((shape, index) => {
            const row = Math.floor(index / charsPerRow)
            const col = index % charsPerRow

            // Calculate row width and center it
            const rowWidth = charsPerRow * (hexSize * 2) + (charsPerRow - 1) * charGap
            const rowStartX = centerX - rowWidth / 2 + hexSize

            const charContainer = new Container()
            const x = rowStartX + col * (hexSize * 2 + charGap)
            const y = charStartY + row * (hexSize * 2 + rowGap)
            charContainer.position.set(x, y)
            charContainer.eventMode = 'static'
            charContainer.cursor = 'pointer'

            const character = WOBBLE_CHARACTERS[shape]
            const isSelected = shape === this.selectedCharacter

            // Outer hexagon frame (selection indicator)
            const outerHex = new Graphics()
            this.drawHexagon(
                outerHex,
                0,
                0,
                hexSize + 6,
                0x0a0a10,
                isSelected ? character.color : 0x3a3040,
                3
            )
            charContainer.addChild(outerHex)

            // Inner hexagon background
            const innerHex = new Graphics()
            this.drawHexagon(
                innerHex,
                0,
                0,
                hexSize,
                isSelected ? 0x2a2530 : 0x15131a,
                character.color,
                2
            )
            charContainer.addChild(innerHex)

            // Character wobble
            const wobbleSize = hexSize * 1.1
            const wobble = new Wobble({
                size: wobbleSize,
                shape: shape,
                expression: 'happy',
                color: character.color,
                showShadow: false,
            })
            wobble.alpha = isSelected ? 1 : 0.5
            charContainer.addChild(wobble)
            this.characterWobbles.set(shape, wobble)

            // Click handler
            charContainer.on('pointerdown', () => {
                this.selectCharacter(shape)
            })

            this.characterSelectContainer.addChild(charContainer)
        })

        // Selected character info badge (hexagonal) - positioned below character grid
        const infoY = charStartY + 2 * (hexSize * 2 + rowGap) + 35
        const selectedChar = WOBBLE_CHARACTERS[this.selectedCharacter]

        const infoBadgeSize = 42
        const infoBadge = new Graphics()
        this.drawHexagon(infoBadge, centerX, infoY, infoBadgeSize, 0x1a1520, selectedChar.color, 3)
        this.characterSelectContainer.addChild(infoBadge)

        // Preview wobble in center badge
        this.previewWobble = new Wobble({
            size: infoBadgeSize * 1.3,
            shape: this.selectedCharacter,
            expression: 'happy',
            color: selectedChar.color,
            showShadow: false,
        })
        this.previewWobble.position.set(centerX, infoY)
        this.characterSelectContainer.addChild(this.previewWobble)

        // Character name below badge
        this.characterNameText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        })
        this.characterNameText.anchor.set(0.5)
        this.characterNameText.position.set(centerX, infoY + infoBadgeSize + 12)
        this.characterSelectContainer.addChild(this.characterNameText)

        // Hidden desc text (not used in new design but kept for compatibility)
        this.characterDescText = new Text({
            text: '',
            style: new TextStyle({ fontSize: 1, fill: 0x000000 }),
        })
        this.characterDescText.visible = false
        this.characterSelectContainer.addChild(this.characterDescText)

        // Stats display - horizontal bar style with hexagon icons
        this.characterStatsContainer = new Container()
        this.characterStatsContainer.position.set(centerX, infoY + infoBadgeSize + 40)
        this.characterSelectContainer.addChild(this.characterStatsContainer)

        // Perk preview section with hexagonal header
        const perkY = infoY + infoBadgeSize + 95
        const perkHeader = new Graphics()
        // Elongated hexagon for header
        perkHeader.moveTo(centerX - 80, perkY - 12)
        perkHeader.lineTo(centerX - 65, perkY - 20)
        perkHeader.lineTo(centerX + 65, perkY - 20)
        perkHeader.lineTo(centerX + 80, perkY - 12)
        perkHeader.lineTo(centerX + 65, perkY - 4)
        perkHeader.lineTo(centerX - 65, perkY - 4)
        perkHeader.closePath()
        perkHeader.fill(0x2a2530)
        perkHeader.stroke({ color: 0x5a4a6a, width: 2 })
        this.characterSelectContainer.addChild(perkHeader)

        const perkLabel = new Text({
            text: 'PERKS',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: 0x8a7a9a,
                letterSpacing: 2,
            }),
        })
        perkLabel.anchor.set(0.5)
        perkLabel.position.set(centerX, perkY - 12)
        this.characterSelectContainer.addChild(perkLabel)

        this.perkPreviewContainer = new Container()
        this.perkPreviewContainer.position.set(centerX, perkY + 25)
        this.characterSelectContainer.addChild(this.perkPreviewContainer)

        // Start button - hexagonal style
        this.startButton = this.createStartButton(centerX, this.height - 60)
        this.characterSelectContainer.addChild(this.startButton)

        // Initial update
        this.updateCharacterSelection()
        this.createPerkPreview()
    }

    private selectCharacter(shape: WobbleShape): void {
        if (this.selectedCharacter === shape) return

        this.selectedCharacter = shape
        this.updateCharacterSelection()
        this.createCharacterSelectUI() // Rebuild UI for clean selection state
    }

    private updateCharacterSelection(): void {
        const character = WOBBLE_CHARACTERS[this.selectedCharacter]
        const stats = WOBBLE_STATS[this.selectedCharacter]

        // Update character name
        this.characterNameText.text = character.nameKo
        this.characterNameText.style.fill = character.color

        // Update stats display
        this.updateStatsDisplay(stats, character.color)
    }

    private updateStatsDisplay(stats: WobbleStats, color: number): void {
        this.characterStatsContainer.removeChildren()

        const statItems = [
            { icon: '❤', color: 0xe74c3c, value: stats.healthMultiplier },
            { icon: '⚔', color: 0xf39c12, value: stats.damageMultiplier },
            { icon: '◈', color: 0x3498db, value: stats.fireRateMultiplier },
            { icon: '»', color: 0x2ecc71, value: stats.moveSpeedMultiplier },
        ]

        // Responsive gap based on screen width
        const barWidth = Math.min(35, (this.width - 80) / 6)
        const itemGap = barWidth + 20
        const totalWidth = (statItems.length - 1) * itemGap
        const startX = -totalWidth / 2

        statItems.forEach((item, index) => {
            const x = startX + index * itemGap

            // Hexagon icon badge
            const badge = new Graphics()
            this.drawHexagon(badge, x, 0, 14, 0x1a1520, item.color, 2)
            this.characterStatsContainer.addChild(badge)

            // Icon
            const icon = new Text({
                text: item.icon,
                style: new TextStyle({
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: item.color,
                }),
            })
            icon.anchor.set(0.5)
            icon.position.set(x, 0)
            this.characterStatsContainer.addChild(icon)

            // Stat bar (visual representation)
            const barHeight = 5
            const barY = 20
            const fillPercent = Math.min(1.3, item.value) / 1.3 // Normalize to 130% max

            // Bar background
            const barBg = new Graphics()
            barBg.roundRect(x - barWidth / 2, barY - barHeight / 2, barWidth, barHeight, 2)
            barBg.fill(0x1a1520)
            barBg.stroke({ color: 0x3a3040, width: 1 })
            this.characterStatsContainer.addChild(barBg)

            // Bar fill
            const barFill = new Graphics()
            const fillWidth = barWidth * fillPercent
            barFill.roundRect(
                x - barWidth / 2 + 1,
                barY - barHeight / 2 + 1,
                fillWidth - 2,
                barHeight - 2,
                1
            )
            barFill.fill(item.color)
            this.characterStatsContainer.addChild(barFill)

            // Notch markers at 100%
            const notchX = x - barWidth / 2 + barWidth * (1.0 / 1.3)
            const notch = new Graphics()
            notch.moveTo(notchX, barY - barHeight / 2 - 2)
            notch.lineTo(notchX, barY + barHeight / 2 + 2)
            notch.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })
            this.characterStatsContainer.addChild(notch)
        })
    }

    private createPerkPreview(): void {
        this.perkPreviewContainer.removeChildren()

        // Responsive perk grid
        const maxPerRow = Math.min(8, Math.floor((this.width - 40) / 40))
        const hexSize = Math.min(14, (this.width - 60) / (maxPerRow * 2.5))
        const hexGap = 4
        const perks = perkDefinitions

        perks.forEach((perk, index) => {
            const row = Math.floor(index / maxPerRow)
            const col = index % maxPerRow
            const perksInRow = Math.min(maxPerRow, perks.length - row * maxPerRow)
            const rowWidth = perksInRow * (hexSize * 2) + (perksInRow - 1) * hexGap
            const rowStartX = -rowWidth / 2 + hexSize

            const x = rowStartX + col * (hexSize * 2 + hexGap)
            const y = row * (hexSize * 2 + hexGap)

            const isUnlocked = this.studiedFormulas.has(perk.formulaId)

            const iconContainer = new Container()
            iconContainer.position.set(x, y)

            // Hexagon background
            const hex = new Graphics()
            if (isUnlocked) {
                this.drawHexagon(hex, 0, 0, hexSize, 0x2a2530, perk.color, 2)
            } else {
                this.drawHexagon(hex, 0, 0, hexSize, 0x15131a, 0x3a3040, 2)
            }
            iconContainer.addChild(hex)

            // Icon or lock symbol
            const iconText = new Text({
                text: isUnlocked ? perk.icon : '?',
                style: new TextStyle({
                    fontSize: isUnlocked ? 12 : 14,
                    fontWeight: 'bold',
                    fill: isUnlocked ? 0xffffff : 0x4a4050,
                }),
            })
            iconText.anchor.set(0.5)
            iconContainer.addChild(iconText)

            this.perkPreviewContainer.addChild(iconContainer)
        })
    }

    private createStartButton(x: number, y: number): Container {
        const btn = new Container()
        btn.position.set(x, y)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'

        // Large hexagon button
        const hexSize = 40

        // Outer glow hexagon
        const glow = new Graphics()
        this.drawHexagon(glow, 0, 0, hexSize + 6, undefined, 0x4a9adb, 2)
        glow.alpha = 0.4
        btn.addChild(glow)

        // Main hexagon
        const mainHex = new Graphics()
        this.drawHexagon(mainHex, 0, 0, hexSize, 0x2980b9, 0x5dade2, 4)
        btn.addChild(mainHex)

        // Play icon (triangle)
        const playIcon = new Graphics()
        playIcon.moveTo(-8, -12)
        playIcon.lineTo(-8, 12)
        playIcon.lineTo(12, 0)
        playIcon.closePath()
        playIcon.fill(0xffffff)
        btn.addChild(playIcon)

        // Click handler
        btn.on('pointerdown', () => {
            this.startGameFromCharacterSelect()
        })

        return btn
    }

    private startGameFromCharacterSelect(): void {
        // Hide character select screen
        this.characterSelectContainer.visible = false

        // Apply character stats
        this.applyCharacterStats()

        // Update player appearance
        const character = WOBBLE_CHARACTERS[this.selectedCharacter]
        this.player.updateOptions({
            shape: this.selectedCharacter,
            color: character.color,
            expression: 'happy',
        })

        // Start the game
        this.gameTime = 0
        this.score = 0
        this.currentRound = 1
        this.roundTime = 0
        this.gameState = 'playing'
        this.updateHealthBar()
        this.updateUI()
    }

    private applyCharacterStats(): void {
        const wobbleStats = WOBBLE_STATS[this.selectedCharacter]

        // Apply health multiplier
        this.maxPlayerHealth = Math.round(this.baseMaxHealth * wobbleStats.healthMultiplier)
        this.playerHealth = this.maxPlayerHealth

        // Apply other stats to base stats
        this.stats = {
            ...DEFAULT_PLAYER_STATS,
            damageMultiplier: wobbleStats.damageMultiplier,
            fireRateMultiplier: 1 / wobbleStats.fireRateMultiplier, // Inverse for fire rate (higher = faster)
            moveSpeedMultiplier: wobbleStats.moveSpeedMultiplier,
        }
    }

    protected animateIdle(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const deltaSeconds = ticker.deltaMS / 1000
        this.animPhase += deltaSeconds

        // Update background effects even in idle
        this.backgroundSystem.update(delta, this.activePerks.length)

        // Update perk card animations
        if (this.gameState === 'perk-selection') {
            // Flip animations
            if (this.flipAnimations.length > 0) {
                this.updateFlipAnimations(delta)
            }
            // Card back Balatro filter animations
            if (this.cardBackFilters.length > 0) {
                this.updateCardBackAnimations(delta)
            }
        }

        // Update result screen animations
        if (this.gameState === 'result') {
            this.animateResult(deltaSeconds)
        }

        // Update character select screen animations
        if (this.gameState === 'character-select') {
            // Animate wobbles with breathing effect
            for (const [shape, wobble] of this.characterWobbles) {
                const isSelected = shape === this.selectedCharacter
                const breathe = Math.sin(this.animPhase * 2) * (isSelected ? 0.08 : 0.03)
                wobble.updateOptions({
                    wobblePhase: this.animPhase,
                    scaleX: 1 + breathe,
                    scaleY: 1 - breathe,
                })
            }

            // Animate preview wobble
            if (this.previewWobble) {
                const breathe = Math.sin(this.animPhase * 2) * 0.06
                this.previewWobble.updateOptions({
                    wobblePhase: this.animPhase,
                    scaleX: 1 + breathe,
                    scaleY: 1 - breathe,
                })
            }

            // Pulse animation for start button
            if (this.startButton) {
                const pulse = 1 + Math.sin(this.animPhase * 4) * 0.05
                this.startButton.scale.set(pulse)
            }
        }

        // Wobble breathing
        const breathe = Math.sin(this.animPhase * 2) * 0.03
        this.player?.updateOptions({
            wobblePhase: this.animPhase,
            scaleX: 1 + breathe,
            scaleY: 1 - breathe,
        })
    }

    protected animatePlay(ticker: Ticker): void {
        // If game over or perk selection, just animate idle
        if (this.gameState !== 'playing') {
            this.animateIdle(ticker)
            return
        }

        const delta = ticker.deltaMS / 16.67
        const deltaSeconds = ticker.deltaMS / 1000

        this.animPhase += deltaSeconds
        this.gameTime += deltaSeconds
        this.roundTime += deltaSeconds

        // Update background effects (corruption/restoration)
        this.backgroundSystem.update(delta, this.activePerks.length)

        // Check round completion
        this.checkRoundComplete()

        // Fire projectiles (apply fireRate stat)
        this.fireTimer += deltaSeconds
        const effectiveFireRate = this.fireRate * this.stats.fireRateMultiplier
        if (this.fireTimer >= effectiveFireRate && this.enemySystem.enemies.length > 0) {
            this.fireProjectile()
            this.fireTimer = 0
        }

        // Spawn enemies (faster over time)
        this.spawnTimer += deltaSeconds
        const currentSpawnRate = Math.max(0.5, this.spawnRate - this.gameTime / 60)
        if (this.spawnTimer >= currentSpawnRate) {
            this.spawnEnemy()
            this.spawnTimer = 0
        }

        // Update game objects (apply moveSpeed stat)
        this.updatePlayer(delta)
        this.updateProjectiles(delta)
        this.updateEnemiesAndMerges(delta, deltaSeconds)
        this.checkPlayerCollisions()
        this.updateEffects(delta)
        this.updateShake(delta)

        // Update UI
        this.updateUI()

        // Player animation with HP-based expression
        const breathe = Math.sin(this.animPhase * 3) * 0.02
        const healthPercent = this.playerHealth / this.maxPlayerHealth

        // Expression changes based on HP
        let expression: 'happy' | 'neutral' | 'effort' | 'worried' | 'struggle' | 'dizzy' = 'happy'
        if (healthPercent <= 0.15) {
            expression = 'dizzy'
        } else if (healthPercent <= 0.3) {
            expression = 'struggle'
        } else if (healthPercent <= 0.5) {
            expression = 'worried'
        } else if (healthPercent <= 0.7) {
            expression = 'effort'
        }

        this.player?.updateOptions({
            wobblePhase: this.animPhase,
            scaleX: 1 + breathe,
            scaleY: 1 - breathe,
            expression,
        })
    }

    protected updatePreview(): void {
        // No preview needed
    }

    protected checkSuccess(): boolean {
        return true
    }

    protected onPlayStart(): void {
        // Reset game state
        this.activePerks = []
        this.perkChoices = []
        this.resetStats()

        // Show character selection screen instead of starting immediately
        this.showCharacterSelect()
    }

    private resetStats(): void {
        this.stats = {
            damageMultiplier: 1,
            fireRateMultiplier: 1,
            projectileSpeedMultiplier: 1,
            projectileSizeMultiplier: 1,
            knockbackMultiplier: 1,
            bounceCount: 0,
            piercingCount: 0,
            explosionRadius: 0,
            moveSpeedMultiplier: 1,
        }
    }

    protected onReset(): void {
        // Reset systems
        this.projectileSystem.reset()
        this.enemySystem.reset()
        this.backgroundSystem.reset()

        // Clear effects
        for (const effect of this.hitEffects) {
            this.effectContainer.removeChild(effect.graphics)
            effect.graphics.destroy()
        }
        this.hitEffects = []

        for (const effect of this.textEffects) {
            this.effectContainer.removeChild(effect.text)
            effect.text.destroy()
        }
        this.textEffects = []

        // Reset camera shake
        this.shakeIntensity = 0
        this.shakeDuration = 0
        this.gameContainer.position.set(0, 0)

        // Hide perk container
        this.perkContainer.visible = false

        // Hide result container
        this.resultContainer.visible = false
        this.resultAnimTime = 0
        this.resultAnimStep = 0
        this.resultRankRevealed = false

        // Hide character select container
        this.characterSelectContainer.visible = false

        // Reset selected character to default
        this.selectedCharacter = 'circle'

        // Reset state
        this.gameTime = 0
        this.score = 0
        this.currentRound = 1
        this.roundTime = 0
        this.maxPlayerHealth = this.baseMaxHealth
        this.playerHealth = this.maxPlayerHealth
        this.gameState = 'playing'
        this.activePerks = []
        this.perkChoices = []
        this.resetStats()
        this.fireTimer = 0
        this.spawnTimer = 0
        this.playerX = this.centerX
        this.playerY = this.centerY
        this.playerVx = 0
        this.playerVy = 0

        // Reset joystick state
        this.joystickActive = false
        this.joystickContainer.visible = false
        this.inputDirX = 0
        this.inputDirY = 0
        this.inputMagnitude = 0

        this.player?.position.set(this.playerX, this.playerY)
        this.player?.updateOptions({ expression: 'happy' })
        this.updateHealthBar()
        this.updateUI()
    }
}
