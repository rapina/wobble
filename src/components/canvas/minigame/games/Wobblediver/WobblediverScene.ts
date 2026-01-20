/**
 * WobblediverScene.ts - Wobblediver: Timing-based diving game
 *
 * Core mechanic: Swing on a pendulum and release at the right moment to dive onto the target.
 * Physics formula: T = 2π√(L/g) (pendulum period) + freefall
 *
 * Endless mode with increasing difficulty:
 * - Phase 1: Simple swing → dive to target
 * - Phase 2: Obstacle wobbles appear
 * - Phase 3: Moving targets
 * - Phase 4: Multiple obstacles, wind effects
 */

import { Application, Ticker, Graphics, Container, Text, TextStyle, Sprite, Texture } from 'pixi.js'
import { BaseMiniGameScene, MiniGameCallbacks } from '../../BaseMiniGameScene'
import { DifficultyConfig, DifficultyPhase, HitResult } from '../../MiniGameTypes'
import { SwingingWobble } from './SwingingWobble'
import { Goal } from './Goal'
import { Wormhole } from './Wormhole'
import { PortalPair } from './PortalPair'
import { ObstacleWobble, ObstacleMovement } from './ObstacleWobble'
import { AnchorWobble } from './AnchorWobble'
import { WobblediverIntro } from './WobblediverIntro'
import { AbyssFluidFilter } from '@/components/canvas/filters/AbyssFluidFilter'
import { BalatroFilter } from '@/components/canvas/filters/BalatroFilter'
import i18n from '@/i18n'

// Balatro-style colors
const BALATRO = {
    bgDark: 0x0d1117,
    bgCard: 0x1a1a2e,
    accent: 0xc9a227,
    red: 0xe85d4c,
    purple: 0x9b59b6,
    cyan: 0x4ecdc4,
    border: 0x2d2d44,
}

// Abyss eye type
interface AbyssEye {
    x: number
    y: number
    size: number
    blinkTimer: number
    blinkDuration: number
    nextBlink: number
    lookAngle: number
    targetLookAngle: number
    pupilOffset: number
}

// Abyss particle type
interface AbyssParticle {
    x: number
    y: number
    speed: number
    size: number
    alpha: number
}

// Abyss bubble type
interface AbyssBubble {
    x: number
    y: number
    size: number
    speed: number
    wobble: number
    phase: number
    popping: boolean
    popProgress: number
}

// Abyss mouth state
interface AbyssMouth {
    x: number
    y: number
    width: number
    openness: number  // 0 = closed, 1 = fully open
    targetOpenness: number
    teethCount: number
}

// Splash effect
interface AbyssSplash {
    x: number
    y: number
    progress: number  // 0 to 1
    size: number
    droplets: { x: number; y: number; vx: number; vy: number; size: number }[]
}

// Drowning bubble (rises from drowning position)
interface DrowningBubble {
    x: number
    y: number
    size: number
    speed: number
    wobble: number
    alpha: number
}

// Ripple effect
interface SurfaceRipple {
    x: number
    y: number
    radius: number
    maxRadius: number
    alpha: number
}

// Result screen eye (watching the player's escape)
interface ResultEye {
    x: number
    y: number
    size: number
    openness: number
    targetOpenness: number
    lookAngle: number
    targetLookAngle: number
    blinkTimer: number
    intensity: number  // Glow intensity
}

// Result screen tentacle (framing the result card)
interface ResultTentacle {
    startX: number
    startY: number
    angle: number
    length: number
    phase: number
    targetLength: number
    waveSpeed: number
}

export class WobblediverScene extends BaseMiniGameScene {
    // Game objects
    private declare wobble: SwingingWobble | null
    private declare goal: Goal  // Kept for backward compatibility
    private declare wormhole: Wormhole  // New wormhole finish portal
    private declare portalPairs: PortalPair[]  // Teleportation portals
    private declare obstacles: ObstacleWobble[]
    private declare anchorWobble: AnchorWobble

    // Visual elements
    private declare backgroundGraphics: Graphics
    private declare boundaryGraphics: Graphics
    private declare instructionText: Text
    private declare outText: Text

    // Animated background (Balatro-style)
    private declare abyssBackgroundSprite: Sprite
    private declare abyssBackgroundFilter: BalatroFilter
    private abyssBackgroundTime = 0

    // Abyss danger zone
    private declare abyssBackContainer: Container  // Behind wobble (eyes, particles)
    private declare abyssFrontContainer: Container  // In front of wobble (fluid surface)
    private declare abyssBackGraphics: Graphics
    private declare abyssFrontGraphics: Graphics
    private declare abyssFluidSprite: Sprite  // Sprite for shader-based fluid
    private declare abyssFluidFilter: AbyssFluidFilter
    private declare abyssEyes: AbyssEye[]
    private declare abyssParticles: AbyssParticle[]
    private declare abyssBubbles: AbyssBubble[]
    private declare abyssMouth: AbyssMouth
    private abyssTime = 0
    private abyssSurfacePoints: number[] = []  // Y offsets for wavy surface
    private abyssBloodLevel = 0  // 0 = normal, 1 = fully red
    private abyssSplashEffects: AbyssSplash[] = []
    private drowningBubbles: DrowningBubble[] = []  // Initialized as empty array
    private surfaceRipples: SurfaceRipple[] = []  // Initialized as empty array
    private drowningX = 0  // Where wobble drowned
    private isDrowningActive = false

    // Game boundary
    private declare boundaryPadding: number
    private declare boundaryLeft: number
    private declare boundaryRight: number
    private declare boundaryTop: number
    private declare boundaryBottom: number

    // Game state
    private declare roundNumber: number
    private declare isWaitingForTap: boolean
    private declare roundTransitionTime: number
    private declare roundStartTime: number  // Time tracking for scoring
    private isWaitingForRetry = false  // True when waiting to restart after death

    // HP bar (legacy - now on wobble)
    private declare hpBarContainer: Container
    private declare hpBarBackground: Graphics
    private declare hpBarFill: Graphics

    // Stage result popup
    private declare stageResultContainer: Container
    private declare stageResultGraphics: Graphics
    private declare stageResultText: Text
    private declare stageGradeText: Text
    private declare stageScoreText: Text
    private declare stageHpLabelText: Text
    private declare stageHpValueText: Text
    private declare stageTimeLabelText: Text
    private declare stageTimeValueText: Text
    private declare stageTotalLabelText: Text
    private declare stageTotalValueText: Text
    private isShowingResult = false
    private resultDisplayTime = 0
    private resultPhase: 'hp' | 'time' | 'total' | 'grade' | 'done' = 'hp'
    private resultCountTarget = { hp: 0, time: 0, total: 0 }
    private resultCountCurrent = { hp: 0, time: 0, total: 0 }
    private resultGrade = { letter: 'D', color: 0xe85d4c }

    // Pending result (wait for suction animation)
    private pendingResult: {
        hpPercent: number
        timeTaken: number
        perfect: boolean
        startX: number
        startY: number
        targetX: number
        targetY: number
    } | null = null
    private pendingResultTimer = 0
    private readonly SUCTION_ANIMATION_DURATION = 0.7  // Slightly longer than wormhole's suckDuration

    // Result screen abyss effects
    private declare resultEffectContainer: Container
    private declare resultEffectGraphics: Graphics
    private resultEyes: ResultEye[] = []
    private resultTentacles: ResultTentacle[] = []
    private resultEffectTime = 0
    private resultVignetteAlpha = 0

    // Difficulty parameters
    private declare goalMoves: boolean
    private declare goalMoveSpeed: number
    private declare goalMoveRange: number
    private declare goalWidthScale: number      // Wormhole horizontal width (starts large, shrinks)
    private goalMoveTimer = 0                   // Timer for periodic movement
    private goalMoveDuration = 0                // How long current movement lasts
    private goalMoveActive = false              // Is goal currently moving?
    private declare obstacleCount: number
    private declare minRopeLength: number
    private declare maxRopeLength: number

    // Trajectory visibility settings (per difficulty)
    private declare trajectoryMode: 'always' | 'timed' | 'flicker' | 'hidden'
    private declare trajectoryDuration: number
    private declare trajectoryFlickerInterval: number
    private declare trajectoryFlickerOnRatio: number

    // Intro system
    private declare introContainer: Container
    private declare intro: WobblediverIntro | null
    private isShowingIntro = false

    // Stage transition effect
    private declare transitionContainer: Container
    private declare transitionGraphics: Graphics
    private declare transitionStageText: Text
    private declare transitionSubText: Text
    private isTransitioning = false
    private transitionTime = 0
    private transitionDuration = 2.5  // Total transition time (close: 0.5s, hold: 1.3s, open: 0.7s)
    private transitionTentacles: { x: number; y: number; angle: number; length: number; phase: number }[] = []
    private transitionEyes: { x: number; y: number; size: number; openness: number; targetOpenness: number }[] = []
    private transitionDepthParticles: { x: number; y: number; size: number; speed: number; alpha: number }[] = []
    private transitionDepthMeter = 0  // Progress from 0 to 1 for depth descent animation

    // Custom in-game HUD (replaces default HUD)
    private declare customHudContainer: Container
    private declare playerHeartsGraphics: Graphics  // Hearts above player
    private declare cornerHudGraphics: Graphics     // Stage/time/score in corner
    private declare stageText: Text
    private declare timeText: Text
    private declare cornerScoreText: Text
    private customHudLives = 3  // Track lives for heart display

    constructor(app: Application, callbacks?: MiniGameCallbacks) {
        super(app, callbacks)
    }

    protected setupGame(): void {
        // Use default 3 lives - death restarts current stage, game over when all lives lost
        // (LifeSystem uses LIFE_CONFIG defaults: 3 lives)

        // Initialize state
        this.obstacles = []
        this.wobble = null
        this.roundNumber = 0
        this.isWaitingForTap = false
        this.roundTransitionTime = 0
        this.roundStartTime = 0

        // Define game boundary - use full screen, leave space for banner ad at bottom
        this.boundaryPadding = 0  // No side padding - use full width
        this.boundaryLeft = 0
        this.boundaryRight = this.width
        this.boundaryTop = 0  // Start from top
        this.boundaryBottom = this.height - 60  // Leave 60px for banner ad

        // Difficulty defaults
        this.goalMoves = false
        this.goalMoveSpeed = 1
        this.goalMoveRange = 40
        this.goalWidthScale = 2.5  // Start with wide wormhole
        this.obstacleCount = 0
        this.minRopeLength = 100
        this.maxRopeLength = 200

        // Trajectory defaults (easy mode)
        this.trajectoryMode = 'always'
        this.trajectoryDuration = 0
        this.trajectoryFlickerInterval = 0.3
        this.trajectoryFlickerOnRatio = 0.5

        // Create visuals
        this.setupBackground()
        this.setupAbyss()
        this.setupBoundary()
        this.setupAnchorWobble()
        this.setupGoal()
        this.setupInstruction()
        this.setupOutText()
        this.setupHpBar()
        this.setupStageResult()
        this.setupTransition()
        this.setupInteraction()
        this.setupIntro()

        // Hide default HUD - we use custom in-game HUD
        this.hud.setVisible(false)
        this.setupCustomHUD()

        // Apply abyss theme to game over screen
        this.resultScreen.setTheme('abyss')
    }

    private setupIntro(): void {
        // Create intro container (on top of everything)
        this.introContainer = new Container()
        this.introContainer.visible = false
        this.container.addChild(this.introContainer)

        // Create intro instance
        this.intro = new WobblediverIntro(
            this.introContainer,
            this.width,
            this.height,
            {
                onStart: () => {
                    this.isShowingIntro = false
                    this.introContainer.visible = false
                    // Actually start the game now
                    this.startNewRound()
                },
                onSkip: () => {
                    this.isShowingIntro = false
                    this.introContainer.visible = false
                    this.startNewRound()
                },
            }
        )
    }

    private setupCustomHUD(): void {
        // Abyss theme colors
        const ABYSS = {
            purple: 0x6a3d7a,
            darkPurple: 0x2a1a30,
            red: 0x8b2020,
            gold: 0xc9a227,
            text: 0xccbbdd,
        }

        // Custom HUD container (on top of game, but below intro/transition)
        this.customHudContainer = new Container()
        this.uiContainer.addChild(this.customHudContainer)

        // Hearts graphics (will be positioned above player in updateCustomHUD)
        this.playerHeartsGraphics = new Graphics()
        this.customHudContainer.addChild(this.playerHeartsGraphics)

        // Corner HUD (top-left corner inside game area)
        this.cornerHudGraphics = new Graphics()
        this.cornerHudGraphics.position.set(20, 20)
        this.customHudContainer.addChild(this.cornerHudGraphics)

        // Stage text (DEPTH indicator)
        this.stageText = new Text({
            text: 'DEPTH 1',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: ABYSS.purple,
                letterSpacing: 2,
            }),
        })
        this.stageText.position.set(24, 20)
        this.customHudContainer.addChild(this.stageText)

        // Time text
        this.timeText = new Text({
            text: '00:00',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: ABYSS.text,
            }),
        })
        this.timeText.position.set(24, 36)
        this.customHudContainer.addChild(this.timeText)

        // Score text (top-right corner)
        this.cornerScoreText = new Text({
            text: '0',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: ABYSS.gold,
            }),
        })
        this.cornerScoreText.anchor.set(1, 0)  // Right-aligned
        this.cornerScoreText.position.set(this.width - 24, 20)
        this.customHudContainer.addChild(this.cornerScoreText)

        // Initialize lives tracking
        this.customHudLives = this.lifeSystem.lives
    }

    private updateCustomHUD(): void {
        // Update corner HUD text
        this.stageText.text = `DEPTH ${this.roundNumber}`
        const minutes = Math.floor(this.gameTime / 60)
        const seconds = Math.floor(this.gameTime % 60)
        this.timeText.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        this.cornerScoreText.text = this.scoreSystem.score.toLocaleString()

        // Track lives from life system
        this.customHudLives = this.lifeSystem.lives

        // Draw hearts above player
        this.drawPlayerHearts()
    }

    private drawPlayerHearts(): void {
        const g = this.playerHeartsGraphics
        g.clear()

        // Don't draw if no wobble
        if (!this.wobble) return

        // Hide hearts during certain states (like speech bubbles do)
        const hideStates = ['drowning', 'success', 'failed']
        if (hideStates.includes(this.wobble.state)) return

        // Hide during pending result (suction animation)
        if (this.pendingResult) return

        // Hide during transitions
        if (this.isTransitioning || this.isShowingResult) return

        // Get position and validate it
        const pos = this.wobble.getPosition()
        if (!pos || isNaN(pos.x) || isNaN(pos.y)) return

        // Check if position is within reasonable bounds
        if (pos.x < -100 || pos.x > this.width + 100 || pos.y < -100 || pos.y > this.height + 100) return

        const heartSize = 10
        const heartGap = 4
        const totalWidth = this.customHudLives * (heartSize + heartGap) - heartGap
        const startX = pos.x - totalWidth / 2
        const heartY = pos.y - 45  // Above the wobble

        // Draw each heart
        for (let i = 0; i < 3; i++) {
            const x = startX + i * (heartSize + heartGap)
            const filled = i < this.customHudLives

            this.drawMiniHeart(g, x, heartY, heartSize, filled)
        }
    }

    private drawMiniHeart(g: Graphics, x: number, y: number, size: number, filled: boolean): void {
        const s = size / 18

        // Heart shape using bezier curves
        g.moveTo(x + 9 * s, y + 16 * s)
        g.bezierCurveTo(x + 9 * s, y + 15 * s, x + 9 * s, y + 12 * s, x + 9 * s, y + 12 * s)
        g.bezierCurveTo(x + 9 * s, y + 8 * s, x + 5 * s, y + 4 * s, x + 1 * s, y + 4 * s)
        g.bezierCurveTo(x - 3 * s, y + 4 * s, x - 3 * s, y + 9 * s, x - 3 * s, y + 9 * s)
        g.bezierCurveTo(x - 3 * s, y + 11 * s, x - 2 * s, y + 13 * s, x + 9 * s, y + 18 * s)
        g.bezierCurveTo(x + 20 * s, y + 13 * s, x + 21 * s, y + 11 * s, x + 21 * s, y + 9 * s)
        g.bezierCurveTo(x + 21 * s, y + 9 * s, x + 21 * s, y + 4 * s, x + 17 * s, y + 4 * s)
        g.bezierCurveTo(x + 13 * s, y + 4 * s, x + 9 * s, y + 8 * s, x + 9 * s, y + 12 * s)

        if (filled) {
            // Filled heart - red with slight glow effect
            g.fill({ color: 0xe85d4c })
            // Add small highlight
            g.circle(x + 4 * s, y + 8 * s, 2 * s)
            g.fill({ color: 0xff8888, alpha: 0.5 })
        } else {
            // Empty heart - dark outline
            g.fill({ color: 0x2a1a30, alpha: 0.6 })
            g.stroke({ color: 0x4a3a50, width: 1 })
        }
    }

    private setupAnchorWobble(): void {
        const anchorX = this.width / 2
        const anchorY = 70  // Fixed position from top (clear of HUD)

        this.anchorWobble = new AnchorWobble(anchorX, anchorY)
        this.gameContainer.addChild(this.anchorWobble.container)

        // Connect switch press to add energy
        this.anchorWobble.onPress = () => {
            if (this.wobble && this.wobble.state === 'swinging') {
                this.wobble.addEnergy(0.8)  // Add angular velocity
            }
        }
    }

    private setupBackground(): void {
        // Animated Balatro-style background (behind everything)
        this.abyssBackgroundSprite = new Sprite(Texture.WHITE)
        this.abyssBackgroundSprite.width = this.width
        this.abyssBackgroundSprite.height = this.height
        this.gameContainer.addChildAt(this.abyssBackgroundSprite, 0)

        // Create Balatro filter with abyss colors - dark purple/teal theme
        this.abyssBackgroundFilter = new BalatroFilter({
            color1: [0.08, 0.04, 0.15, 1.0],   // Deep purple-black
            color2: [0.05, 0.15, 0.18, 1.0],   // Dark teal
            color3: [0.02, 0.02, 0.05, 1.0],   // Near black
            spinSpeed: 3.0,                     // Slower, more ominous
            contrast: 2.5,
            lighting: 0.15,                     // Dim
            spinAmount: 0.3,
            pixelFilter: 600.0,                 // Less pixelated
            spinEase: 0.8,
        })
        this.abyssBackgroundFilter.setDimensions(this.width, this.height)
        this.abyssBackgroundSprite.filters = [this.abyssBackgroundFilter]

        // Static graphics overlay (grid pattern, etc.)
        this.backgroundGraphics = new Graphics()
        this.gameContainer.addChild(this.backgroundGraphics)

        this.drawGameArea()
    }

    private setupAbyss(): void {
        // Back container (behind wobble) - for eyes and deep elements
        this.abyssBackContainer = new Container()
        this.gameContainer.addChild(this.abyssBackContainer)

        this.abyssBackGraphics = new Graphics()
        this.abyssBackContainer.addChild(this.abyssBackGraphics)

        // Front container will be added after wobble in startNewRound
        this.abyssFrontContainer = new Container()
        this.abyssFrontGraphics = new Graphics()
        this.abyssFrontContainer.addChild(this.abyssFrontGraphics)

        // Create shader-based fluid
        // Fluid covers from boundaryBottom - 80 (surface) to bottom of screen
        const fluidSurfaceY = this.boundaryBottom - 80
        const fluidHeight = this.height - fluidSurfaceY + 20  // Extend beyond screen bottom
        const fluidWidth = this.boundaryRight - this.boundaryLeft

        // Create a white sprite as base for the filter
        this.abyssFluidSprite = new Sprite(Texture.WHITE)
        this.abyssFluidSprite.width = fluidWidth
        this.abyssFluidSprite.height = fluidHeight
        this.abyssFluidSprite.position.set(this.boundaryLeft, fluidSurfaceY)

        // Create and apply the filter
        // surfaceY = 0 means surface at the very top of the sprite
        this.abyssFluidFilter = new AbyssFluidFilter({
            surfaceY: 0.0,  // Surface at the top of the sprite
            flowSpeed: 1.2,
            waveIntensity: 1.0,
        })
        this.abyssFluidFilter.setDimensions(fluidWidth, fluidHeight)
        this.abyssFluidSprite.filters = [this.abyssFluidFilter]

        // Add fluid sprite to front container
        this.abyssFrontContainer.addChildAt(this.abyssFluidSprite, 0)

        // Initialize surface points for wavy effect
        const surfacePointCount = 20
        this.abyssSurfacePoints = []
        for (let i = 0; i < surfacePointCount; i++) {
            this.abyssSurfacePoints.push(0)
        }

        // Initialize mouth
        this.abyssMouth = {
            x: (this.boundaryLeft + this.boundaryRight) / 2,
            y: this.boundaryBottom - 30,
            width: 120,
            openness: 0,
            targetOpenness: 0,
            teethCount: 8,
        }

        // Initialize eyes (positioned around the mouth)
        this.abyssEyes = []
        const eyeCount = 4 + Math.floor(Math.random() * 3)  // 4-6 eyes
        for (let i = 0; i < eyeCount; i++) {
            this.abyssEyes.push(this.createAbyssEye())
        }

        // Initialize particles
        this.abyssParticles = []
        for (let i = 0; i < 15; i++) {
            this.abyssParticles.push(this.createAbyssParticle())
        }

        // Initialize bubbles
        this.abyssBubbles = []
        for (let i = 0; i < 8; i++) {
            this.abyssBubbles.push(this.createAbyssBubble())
        }

        // Initialize splash effects
        this.abyssSplashEffects = []

        // Initialize drowning effects
        this.drowningBubbles = []
        this.surfaceRipples = []

        this.drawAbyss()
    }

    private createAbyssBubble(): AbyssBubble {
        return {
            x: this.boundaryLeft + 30 + Math.random() * (this.boundaryRight - this.boundaryLeft - 60),
            y: this.boundaryBottom - 20 - Math.random() * 40,
            size: 3 + Math.random() * 6,
            speed: 15 + Math.random() * 25,
            wobble: Math.random() * Math.PI * 2,
            phase: Math.random() * Math.PI * 2,
            popping: false,
            popProgress: 0,
        }
    }

    private createAbyssEye(): AbyssEye {
        const abyssTop = this.boundaryBottom - 80
        return {
            x: this.boundaryLeft + 40 + Math.random() * (this.boundaryRight - this.boundaryLeft - 80),
            y: abyssTop + 20 + Math.random() * 50,
            size: 8 + Math.random() * 12,
            blinkTimer: 0,
            blinkDuration: 0.15,
            nextBlink: 2 + Math.random() * 4,
            lookAngle: Math.random() * Math.PI * 2,
            targetLookAngle: 0,
            pupilOffset: 0.3 + Math.random() * 0.2,
        }
    }

    private createAbyssParticle(): AbyssParticle {
        return {
            x: this.boundaryLeft + Math.random() * (this.boundaryRight - this.boundaryLeft),
            y: this.boundaryBottom - 100 - Math.random() * 60,
            speed: 20 + Math.random() * 30,
            size: 2 + Math.random() * 3,
            alpha: 0.3 + Math.random() * 0.4,
        }
    }

    private drawAbyss(): void {
        const gBack = this.abyssBackGraphics
        const gFront = this.abyssFrontGraphics
        gBack.clear()
        gFront.clear()

        const blood = this.abyssBloodLevel

        // Update shader filter
        if (this.abyssFluidFilter) {
            this.abyssFluidFilter.time = this.abyssTime
            this.abyssFluidFilter.bloodLevel = blood
        }

        // Calculate fluid area bounds for overlay positioning
        const fluidSurfaceY = this.boundaryBottom - 80  // Match setupAbyss
        const waterLeft = this.boundaryLeft
        const waterRight = this.boundaryRight

        // --- BACK GRAPHICS (behind wobble) ---
        // Draw particles in back layer
        for (const particle of this.abyssParticles) {
            gBack.circle(particle.x, particle.y, particle.size)
            gBack.fill({ color: blood > 0.5 ? 0x8b4444 : 0x6b4d8a, alpha: particle.alpha * 0.5 })
        }
        this.drawAbyssMouth(gBack)

        // --- FRONT GRAPHICS (overlay elements on top of shader fluid) ---

        // Surface tension line - synced with shader's wave formula exactly
        // Shader: surfaceWave = sin(x * 15 + t * 2) * 0.025 + sin(x * 8 - t * 1.5) * 0.0175 + sin(x * 25 + t * 4) * 0.01
        const surfaceLineColor = this.lerpColor(0xc88ee0, 0xee8888, blood)
        const fluidHeight = this.height - fluidSurfaceY + 20  // Match setupAbyss
        const flowTime = this.abyssTime * 1.2  // Match shader's flowSpeed (uFlowSpeed = 1.2)

        gFront.moveTo(waterLeft, fluidSurfaceY)
        for (let x = waterLeft; x <= waterRight; x += 2) {
            const normalizedX = (x - waterLeft) / (waterRight - waterLeft)
            // Match shader's wave formula exactly - same coefficients as GLSL/WGSL
            const wave = Math.sin(normalizedX * 15.0 + flowTime * 2.0) * 0.025 * fluidHeight
                       + Math.sin(normalizedX * 8.0 - flowTime * 1.5) * 0.0175 * fluidHeight
                       + Math.sin(normalizedX * 25.0 + flowTime * 4.0) * 0.01 * fluidHeight
            gFront.lineTo(x, fluidSurfaceY + wave)
        }
        gFront.stroke({ color: surfaceLineColor, width: 3, alpha: 0.9 })

        // Draw bubbles on front
        for (const bubble of this.abyssBubbles) {
            this.drawAbyssBubble(gFront, bubble, blood)
        }

        // Draw eyes OVERLAID on water surface
        for (const eye of this.abyssEyes) {
            this.drawAbyssEyeOverlay(gFront, eye, blood)
        }

        // Draw splash effects
        for (const splash of this.abyssSplashEffects) {
            this.drawSplash(gFront, splash)
        }

        // Draw drowning bubbles
        for (const bubble of this.drowningBubbles) {
            const wobbleX = Math.sin(bubble.wobble) * 3
            gFront.circle(bubble.x + wobbleX, bubble.y, bubble.size)
            gFront.fill({ color: blood > 0.5 ? 0x8b4444 : 0x6b5080, alpha: bubble.alpha * 0.8 })
            gFront.circle(bubble.x + wobbleX - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.2)
            gFront.fill({ color: 0xffffff, alpha: bubble.alpha * 0.4 })
        }

        // Draw surface ripples
        for (const ripple of this.surfaceRipples) {
            gFront.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius * 0.3)
            gFront.stroke({ color: blood > 0.5 ? 0x8b4444 : 0x7a5a90, width: 2, alpha: ripple.alpha })
        }
    }

    /**
     * Lerp between two colors
     */
    private lerpColor(color1: number, color2: number, t: number): number {
        const r1 = (color1 >> 16) & 0xff
        const g1 = (color1 >> 8) & 0xff
        const b1 = color1 & 0xff

        const r2 = (color2 >> 16) & 0xff
        const g2 = (color2 >> 8) & 0xff
        const b2 = color2 & 0xff

        const r = Math.round(r1 + (r2 - r1) * t)
        const g = Math.round(g1 + (g2 - g1) * t)
        const b = Math.round(b1 + (b2 - b1) * t)

        return (r << 16) | (g << 8) | b
    }

    /**
     * Create splash effect at position
     */
    private createSplash(x: number, y: number, size: number = 1): void {
        const droplets: AbyssSplash['droplets'] = []

        // Create droplets that fly up and out
        const dropletCount = 8 + Math.floor(Math.random() * 5)
        for (let i = 0; i < dropletCount; i++) {
            const angle = -Math.PI + Math.random() * Math.PI  // Upward arc
            const speed = 80 + Math.random() * 120
            droplets.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
            })
        }

        this.abyssSplashEffects.push({
            x,
            y,
            progress: 0,
            size,
            droplets,
        })
    }

    /**
     * Draw splash effect
     */
    private drawSplash(g: Graphics, splash: AbyssSplash): void {
        const alpha = 1 - splash.progress
        const blood = this.abyssBloodLevel

        // Main splash ring - bright and visible
        const ringSize = 30 + splash.progress * 60 * splash.size
        g.circle(splash.x, splash.y, ringSize)
        g.stroke({ color: this.lerpColor(0x9b7ab0, 0xbb7777, blood), width: 3, alpha: alpha * 0.7 })

        // Inner splash
        g.circle(splash.x, splash.y, ringSize * 0.6)
        g.fill({ color: this.lerpColor(0x5a3d70, 0x8b4040, blood), alpha: alpha * 0.5 })

        // Droplets - bright
        for (const drop of splash.droplets) {
            const dropAlpha = alpha * (1 - splash.progress * 0.5)
            g.circle(drop.x, drop.y, drop.size * (1 - splash.progress * 0.5))
            g.fill({ color: this.lerpColor(0x7a5a90, 0xaa5555, blood), alpha: dropAlpha })
        }
    }

    /**
     * Update splash effects
     */
    private updateSplashEffects(deltaSeconds: number): void {
        const gravity = 400

        for (let i = this.abyssSplashEffects.length - 1; i >= 0; i--) {
            const splash = this.abyssSplashEffects[i]
            splash.progress += deltaSeconds * 1.5

            // Update droplets with gravity
            for (const drop of splash.droplets) {
                drop.x += drop.vx * deltaSeconds
                drop.vy += gravity * deltaSeconds
                drop.y += drop.vy * deltaSeconds
            }

            // Remove finished splashes
            if (splash.progress >= 1) {
                this.abyssSplashEffects.splice(i, 1)
            }
        }
    }

    /**
     * Start the dramatic drowning sequence
     */
    private startDrowningSequence(): void {
        if (!this.wobble || this.isDrowningActive) return

        this.isDrowningActive = true
        const pos = this.wobble.getPosition()
        const abyssTop = this.boundaryBottom - 80

        // Show panic speech bubble
        const panicPhrases = [
            i18n.t('wobblediver.panic.phrase1'),
            i18n.t('wobblediver.panic.phrase2'),
            i18n.t('wobblediver.panic.phrase3'),
            i18n.t('wobblediver.panic.phrase4'),
            i18n.t('wobblediver.panic.phrase5'),
        ]
        const phrase = panicPhrases[Math.floor(Math.random() * panicPhrases.length)]
        this.wobble.showSpeechBubble(phrase, 1.0)

        // Store drowning position
        this.drowningX = pos.x

        // Start wobble drowning animation
        this.wobble.startDrowning(abyssTop + 10)

        // Create dramatic splash
        this.createSplash(pos.x, abyssTop, 2.0)

        // Create surface ripples
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.surfaceRipples.push({
                    x: pos.x,
                    y: abyssTop,
                    radius: 5,
                    maxRadius: 60 + i * 20,
                    alpha: 0.8,
                })
            }, i * 200)
        }

        // Start blood rise
        this.abyssBloodLevel = 0.3

        // Make all eyes snap to look at drowning position
        for (const eye of this.abyssEyes) {
            const dx = pos.x - eye.x
            const dy = abyssTop - eye.y
            eye.targetLookAngle = Math.atan2(dy, dx)
            eye.nextBlink = 3  // Don't blink while watching
        }

        // Open mouth in anticipation
        this.abyssMouth.targetOpenness = 1
        this.abyssMouth.x = pos.x  // Move mouth to drowning spot
    }

    /**
     * Update drowning visual effects
     */
    private updateDrowningEffects(deltaSeconds: number): void {
        if (!this.wobble || this.wobble.state !== 'drowning') return

        const pos = this.wobble.getPosition()
        const progress = this.wobble.getDrowningProgress()
        const abyssTop = this.boundaryBottom - 80

        // Gradually increase blood level
        this.abyssBloodLevel = Math.min(1, 0.3 + progress * 0.7)

        // Spawn panic bubbles from wobble position
        if (Math.random() < 0.3 && progress < 0.8) {
            this.drowningBubbles.push({
                x: pos.x + (Math.random() - 0.5) * 20,
                y: pos.y - 10,
                size: 4 + Math.random() * 6,
                speed: 60 + Math.random() * 40,
                wobble: Math.random() * Math.PI * 2,
                alpha: 0.8,
            })
        }

        // Update drowning bubbles
        for (let i = this.drowningBubbles.length - 1; i >= 0; i--) {
            const bubble = this.drowningBubbles[i]
            bubble.y -= bubble.speed * deltaSeconds
            bubble.wobble += deltaSeconds * 6
            bubble.x += Math.sin(bubble.wobble) * 20 * deltaSeconds
            bubble.alpha -= deltaSeconds * 0.5

            // Remove when reaching surface or faded
            if (bubble.y < abyssTop - 5 || bubble.alpha <= 0) {
                this.drowningBubbles.splice(i, 1)
            }
        }

        // Update surface ripples
        for (let i = this.surfaceRipples.length - 1; i >= 0; i--) {
            const ripple = this.surfaceRipples[i]
            ripple.radius += 80 * deltaSeconds
            ripple.alpha = 0.8 * (1 - ripple.radius / ripple.maxRadius)

            if (ripple.radius >= ripple.maxRadius) {
                this.surfaceRipples.splice(i, 1)
            }
        }

        // Keep eyes focused on drowning position
        for (const eye of this.abyssEyes) {
            const dx = pos.x - eye.x
            const dy = pos.y - eye.y
            eye.targetLookAngle = Math.atan2(dy, dx)
        }
    }

    private drawAbyssBubble(g: Graphics, bubble: AbyssBubble, blood: number = 0): void {
        // Bright visible colors
        const strokeColor = this.lerpColor(0x9b7ab0, 0xbb7777, blood)
        const fillColor = this.lerpColor(0x5a3d70, 0x8b4040, blood)
        const highlightColor = this.lerpColor(0xb090c0, 0xcc9999, blood)

        if (bubble.popping) {
            // Pop animation - expanding ring
            const popSize = bubble.size * (1 + bubble.popProgress * 2)
            const popAlpha = 0.6 * (1 - bubble.popProgress)

            g.circle(bubble.x, bubble.y, popSize)
            g.stroke({ color: strokeColor, width: 1, alpha: popAlpha })

            // Smaller scattered bubbles
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2 + bubble.phase
                const dist = bubble.popProgress * 10
                const miniX = bubble.x + Math.cos(angle) * dist
                const miniY = bubble.y + Math.sin(angle) * dist
                const miniSize = 2 * (1 - bubble.popProgress)

                g.circle(miniX, miniY, miniSize)
                g.fill({ color: strokeColor, alpha: popAlpha * 0.5 })
            }
        } else {
            // Normal bubble with wobble
            const wobbleX = Math.sin(bubble.wobble) * 2
            const bx = bubble.x + wobbleX
            const by = bubble.y

            // Bubble body
            g.circle(bx, by, bubble.size)
            g.fill({ color: fillColor, alpha: 0.6 })
            g.stroke({ color: strokeColor, width: 1, alpha: 0.4 })

            // Bubble highlight
            g.circle(bx - bubble.size * 0.3, by - bubble.size * 0.3, bubble.size * 0.3)
            g.fill({ color: highlightColor, alpha: 0.5 })
        }
    }

    private drawAbyssMouth(g: Graphics): void {
        const mouth = this.abyssMouth
        if (mouth.openness < 0.05) return  // Don't draw if barely open

        // Scary mode when drowning - bigger and more menacing
        const scaryScale = this.isDrowningActive ? 1.5 : 1.0
        const pulseScale = this.isDrowningActive ? 1.0 + Math.sin(this.abyssTime * 8) * 0.1 : 1.0

        const halfWidth = (mouth.width / 2) * scaryScale * pulseScale
        const openHeight = mouth.openness * 50 * scaryScale * pulseScale

        // Mouth glow (red danger glow) - more intense when drowning
        const glowAlpha = this.isDrowningActive ? 0.6 : 0.3
        const glowSize = this.isDrowningActive ? 25 : 10

        g.ellipse(mouth.x, mouth.y, halfWidth + glowSize, openHeight + glowSize)
        g.fill({ color: 0xff0000, alpha: glowAlpha * mouth.openness })

        if (this.isDrowningActive) {
            // Extra outer glow when scary
            g.ellipse(mouth.x, mouth.y, halfWidth + 40, openHeight + 40)
            g.fill({ color: 0x8b0000, alpha: 0.2 * mouth.openness })
        }

        // Upper lip
        g.moveTo(mouth.x - halfWidth, mouth.y)
        g.quadraticCurveTo(mouth.x, mouth.y - openHeight, mouth.x + halfWidth, mouth.y)
        g.fill({ color: 0x1a0a0a })

        // Lower lip
        g.moveTo(mouth.x - halfWidth, mouth.y)
        g.quadraticCurveTo(mouth.x, mouth.y + openHeight * 0.6, mouth.x + halfWidth, mouth.y)
        g.fill({ color: 0x1a0a0a })

        // Inner mouth (dark void) - deeper red when scary
        const voidColor = this.isDrowningActive ? 0x200008 : 0x050005
        g.ellipse(mouth.x, mouth.y, halfWidth * 0.8, openHeight * 0.7)
        g.fill({ color: voidColor })

        // Tongue (if open enough) - more active when scary
        if (mouth.openness > 0.3) {
            const tongueSpeed = this.isDrowningActive ? 12 : 5
            const tongueRange = this.isDrowningActive ? 10 : 5
            const tongueWiggle = Math.sin(this.abyssTime * tongueSpeed) * tongueRange
            g.ellipse(mouth.x + tongueWiggle, mouth.y + openHeight * 0.2, halfWidth * 0.4, openHeight * 0.3)
            g.fill({ color: this.isDrowningActive ? 0xaa2255 : 0x8b2252, alpha: 0.9 })
        }

        // Upper teeth - longer and sharper when scary
        const teethScale = this.isDrowningActive ? 1.8 : 1.0
        const teethWidth = (mouth.width * scaryScale) / mouth.teethCount
        for (let i = 0; i < mouth.teethCount; i++) {
            const toothX = mouth.x - halfWidth + teethWidth * (i + 0.5)
            const toothHeight = (8 + Math.sin(i * 1.5) * 3) * teethScale
            const toothY = mouth.y - openHeight * 0.3

            // Sharp triangular tooth
            g.moveTo(toothX - teethWidth * 0.3, toothY)
            g.lineTo(toothX, toothY + toothHeight * mouth.openness)
            g.lineTo(toothX + teethWidth * 0.3, toothY)
            g.closePath()
            g.fill({ color: this.isDrowningActive ? 0xffffee : 0xf5f5dc })  // Brighter when scary
        }

        // Lower teeth (smaller) - also bigger when scary
        for (let i = 0; i < mouth.teethCount - 1; i++) {
            const toothX = mouth.x - halfWidth + teethWidth * (i + 1)
            const toothHeight = (5 + Math.sin(i * 1.2) * 2) * teethScale
            const toothY = mouth.y + openHeight * 0.2

            g.moveTo(toothX - teethWidth * 0.25, toothY)
            g.lineTo(toothX, toothY - toothHeight * mouth.openness)
            g.lineTo(toothX + teethWidth * 0.25, toothY)
            g.closePath()
            g.fill({ color: this.isDrowningActive ? 0xffffee : 0xf5f5dc })
        }
    }

    private drawAbyssEye(g: Graphics, eye: AbyssEye): void {
        // Check if blinking
        const isBlinking = eye.blinkTimer > 0
        const blinkProgress = isBlinking ? eye.blinkTimer / eye.blinkDuration : 0
        const eyeOpenness = isBlinking ? Math.abs(Math.sin(blinkProgress * Math.PI)) : 1

        if (eyeOpenness < 0.1) return  // Fully closed

        // Eye glow
        g.ellipse(eye.x, eye.y, eye.size + 4, (eye.size * 0.6 + 4) * eyeOpenness)
        g.fill({ color: BALATRO.purple, alpha: 0.2 })

        // White of eye (slightly yellowish for creepy effect)
        g.ellipse(eye.x, eye.y, eye.size, eye.size * 0.6 * eyeOpenness)
        g.fill({ color: 0xf5f5dc, alpha: 0.9 })

        // Iris
        const irisSize = eye.size * 0.6
        const pupilX = eye.x + Math.cos(eye.lookAngle) * eye.size * eye.pupilOffset * 0.5
        const pupilY = eye.y + Math.sin(eye.lookAngle) * eye.size * 0.3 * eye.pupilOffset * eyeOpenness

        g.ellipse(pupilX, pupilY, irisSize, irisSize * 0.6 * eyeOpenness)
        g.fill({ color: 0x8b0000, alpha: 0.95 })  // Dark red iris

        // Pupil
        const pupilSize = irisSize * 0.5
        g.ellipse(pupilX, pupilY, pupilSize, pupilSize * 0.6 * eyeOpenness)
        g.fill({ color: 0x000000 })

        // Highlight
        g.circle(pupilX - pupilSize * 0.3, pupilY - pupilSize * 0.2 * eyeOpenness, pupilSize * 0.25)
        g.fill({ color: 0xffffff, alpha: 0.7 })
    }

    /**
     * Draw eye overlaid on water surface with glowing effect
     */
    private drawAbyssEyeOverlay(g: Graphics, eye: AbyssEye, blood: number): void {
        // Check if blinking - but don't blink when scary/drowning
        const isBlinking = eye.blinkTimer > 0 && !this.isDrowningActive
        const blinkProgress = isBlinking ? eye.blinkTimer / eye.blinkDuration : 0
        const eyeOpenness = isBlinking ? Math.abs(Math.sin(blinkProgress * Math.PI)) : 1

        if (eyeOpenness < 0.1) return  // Fully closed

        // Scary mode - eyes get bigger and more intense
        const scaryScale = this.isDrowningActive ? 1.4 : 1.0
        const pulseScale = this.isDrowningActive ? 1.0 + Math.sin(this.abyssTime * 6 + eye.x * 0.1) * 0.15 : 1.0
        const totalScale = scaryScale * pulseScale

        const scaledSize = eye.size * totalScale

        // Glowing outer aura - much brighter when scary
        const glowColor = this.isDrowningActive ? 0xff2222 : this.lerpColor(0x7a5a90, 0xaa5555, blood)
        const glowAlpha = this.isDrowningActive
            ? 0.5 + Math.sin(this.abyssTime * 8 + eye.x * 0.05) * 0.2
            : 0.25 + Math.sin(this.abyssTime * 2 + eye.x * 0.01) * 0.1

        // Extra scary outer glow
        if (this.isDrowningActive) {
            g.ellipse(eye.x, eye.y, scaledSize + 35, (scaledSize * 0.6 + 35) * eyeOpenness)
            g.fill({ color: 0xff0000, alpha: glowAlpha * 0.2 })

            g.ellipse(eye.x, eye.y, scaledSize + 25, (scaledSize * 0.6 + 25) * eyeOpenness)
            g.fill({ color: 0xff2200, alpha: glowAlpha * 0.3 })
        }

        g.ellipse(eye.x, eye.y, scaledSize + 15, (scaledSize * 0.6 + 15) * eyeOpenness)
        g.fill({ color: glowColor, alpha: glowAlpha * 0.4 })

        g.ellipse(eye.x, eye.y, scaledSize + 8, (scaledSize * 0.6 + 8) * eyeOpenness)
        g.fill({ color: glowColor, alpha: glowAlpha * 0.7 })

        // Eye glow ring - bright
        const ringColor = this.isDrowningActive ? 0xaa2020 : this.lerpColor(0x5a3d70, 0x8b4040, blood)
        g.ellipse(eye.x, eye.y, scaledSize + 3, (scaledSize * 0.6 + 3) * eyeOpenness)
        g.fill({ color: ringColor, alpha: this.isDrowningActive ? 0.6 : 0.4 })

        // White of eye - bloodshot when scary
        const whiteColor = this.isDrowningActive ? 0xffddcc : 0xf0eedd
        g.ellipse(eye.x, eye.y, scaledSize, scaledSize * 0.6 * eyeOpenness)
        g.fill({ color: whiteColor, alpha: this.isDrowningActive ? 0.9 : 0.75 })

        // Bloodshot veins when scary
        if (this.isDrowningActive) {
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + this.abyssTime * 0.5
                const veinX = eye.x + Math.cos(angle) * scaledSize * 0.6
                const veinY = eye.y + Math.sin(angle) * scaledSize * 0.35 * eyeOpenness
                g.moveTo(eye.x, eye.y)
                g.lineTo(veinX, veinY)
                g.stroke({ color: 0xcc3333, width: 1.5, alpha: 0.5 })
            }
        }

        // Iris - much larger iris when scary (predator look)
        const irisScale = this.isDrowningActive ? 0.75 : 0.6
        const irisSize = scaledSize * irisScale
        const pupilX = eye.x + Math.cos(eye.lookAngle) * scaledSize * eye.pupilOffset * 0.5
        const pupilY = eye.y + Math.sin(eye.lookAngle) * scaledSize * 0.3 * eye.pupilOffset * eyeOpenness

        const irisColor = this.isDrowningActive ? 0xee0000 : this.lerpColor(0x8b0000, 0xcc2222, blood)
        g.ellipse(pupilX, pupilY, irisSize, irisSize * 0.6 * eyeOpenness)
        g.fill({ color: irisColor, alpha: 0.95 })

        // Pupil - smaller/contracted when scary (intense focus)
        const pupilScale = this.isDrowningActive ? 0.3 : 0.5
        const pupilSize = irisSize * pupilScale

        // Scary pupil shake
        const shakeX = this.isDrowningActive ? Math.sin(this.abyssTime * 20) * 1 : 0
        const shakeY = this.isDrowningActive ? Math.cos(this.abyssTime * 25) * 0.5 : 0

        g.ellipse(pupilX + shakeX, pupilY + shakeY, pupilSize, pupilSize * 0.6 * eyeOpenness)
        g.fill({ color: 0x000000, alpha: 0.98 })

        // Bright highlight for menacing look
        const highlightSize = this.isDrowningActive ? pupilSize * 0.3 : pupilSize * 0.2
        g.circle(pupilX - pupilSize * 0.3 + shakeX, pupilY - pupilSize * 0.2 * eyeOpenness + shakeY, highlightSize)
        g.fill({ color: 0xffffff, alpha: 0.9 })

        // Small secondary highlight
        g.circle(pupilX + pupilSize * 0.2 + shakeX, pupilY + pupilSize * 0.1 * eyeOpenness + shakeY, highlightSize * 0.5)
        g.fill({ color: 0xffffff, alpha: 0.5 })
    }

    private updateAbyss(deltaSeconds: number): void {
        this.abyssTime += deltaSeconds

        // Update animated background
        this.abyssBackgroundTime += deltaSeconds
        this.abyssBackgroundFilter.time = this.abyssBackgroundTime

        // Adjust background intensity based on depth (round number)
        // Deeper = more intense, faster, more contrast
        const depthProgress = Math.min(this.roundNumber / 20, 1) // Max intensity at depth 20
        const baseSpinSpeed = 3.0 + depthProgress * 5.0 // 3 -> 8
        const baseContrast = 2.5 + depthProgress * 2.0 // 2.5 -> 4.5
        const baseLighting = 0.15 - depthProgress * 0.1 // 0.15 -> 0.05 (darker)
        const baseSpinAmount = 0.3 + depthProgress * 0.4 // 0.3 -> 0.7

        this.abyssBackgroundFilter.uniforms.uSpinSpeed = baseSpinSpeed
        this.abyssBackgroundFilter.uniforms.uContrast = baseContrast
        this.abyssBackgroundFilter.uniforms.uLighting = baseLighting
        this.abyssBackgroundFilter.uniforms.uSpinAmount = baseSpinAmount

        const abyssTop = this.boundaryBottom - 80

        // Update particles (falling into abyss)
        for (const particle of this.abyssParticles) {
            particle.y += particle.speed * deltaSeconds
            particle.alpha -= deltaSeconds * 0.3

            // Reset particle when it goes too low or fades
            if (particle.y > this.boundaryBottom || particle.alpha <= 0) {
                particle.x = this.boundaryLeft + Math.random() * (this.boundaryRight - this.boundaryLeft)
                particle.y = this.boundaryBottom - 100 - Math.random() * 30
                particle.alpha = 0.3 + Math.random() * 0.4
            }
        }

        // Update bubbles
        for (const bubble of this.abyssBubbles) {
            if (bubble.popping) {
                bubble.popProgress += deltaSeconds * 3
                if (bubble.popProgress >= 1) {
                    // Reset bubble
                    Object.assign(bubble, this.createAbyssBubble())
                }
            } else {
                // Rise up
                bubble.y -= bubble.speed * deltaSeconds
                bubble.wobble += deltaSeconds * 4

                // Pop when reaching surface
                if (bubble.y < abyssTop + 5) {
                    bubble.popping = true
                    bubble.popProgress = 0
                }
            }
        }

        // Update eyes and mouth
        const playerPos = this.wobble?.getPosition()
        const isReleased = this.wobble?.state === 'released'

        // Update mouth - opens based on player proximity to bottom
        if (playerPos && isReleased) {
            const abyssTop = this.boundaryBottom - 100
            const distanceToAbyss = this.boundaryBottom - playerPos.y

            // Start opening when player is in bottom 40% of play area
            const openThreshold = (this.boundaryBottom - this.boundaryTop) * 0.4
            if (distanceToAbyss < openThreshold) {
                // The closer to bottom, the more open (0 to 1)
                this.abyssMouth.targetOpenness = 1 - (distanceToAbyss / openThreshold)
                // Move mouth toward player X position
                this.abyssMouth.x += (playerPos.x - this.abyssMouth.x) * deltaSeconds * 2
            } else {
                this.abyssMouth.targetOpenness = 0
            }
        } else {
            this.abyssMouth.targetOpenness = 0
            // Return mouth to center when no player
            const centerX = (this.boundaryLeft + this.boundaryRight) / 2
            this.abyssMouth.x += (centerX - this.abyssMouth.x) * deltaSeconds
        }

        // Smooth mouth opening animation
        const mouthDiff = this.abyssMouth.targetOpenness - this.abyssMouth.openness
        this.abyssMouth.openness += mouthDiff * deltaSeconds * 5

        for (const eye of this.abyssEyes) {
            // Blink timer
            eye.nextBlink -= deltaSeconds
            if (eye.nextBlink <= 0) {
                eye.blinkTimer = eye.blinkDuration
                eye.nextBlink = 2 + Math.random() * 5
            }
            if (eye.blinkTimer > 0) {
                eye.blinkTimer -= deltaSeconds
            }

            // Look at player if exists and released
            if (playerPos && isReleased) {
                const dx = playerPos.x - eye.x
                const dy = playerPos.y - eye.y
                eye.targetLookAngle = Math.atan2(dy, dx)
            } else {
                // Random looking around
                if (Math.random() < 0.01) {
                    eye.targetLookAngle = Math.random() * Math.PI * 2
                }
            }

            // Smoothly interpolate look angle
            const angleDiff = eye.targetLookAngle - eye.lookAngle
            eye.lookAngle += angleDiff * deltaSeconds * 3
        }

        // Update splash effects
        this.updateSplashEffects(deltaSeconds)

        // Decay blood level over time (slowly return to normal)
        if (this.abyssBloodLevel > 0) {
            // Very slow decay - blood stays visible for a long time (about 30+ seconds to fade)
            this.abyssBloodLevel = Math.max(0, this.abyssBloodLevel - deltaSeconds * 0.03)
        }

        this.drawAbyss()
    }

    private drawGameArea(): void {
        const g = this.backgroundGraphics
        g.clear()
        // No solid fill or grid - let the animated Balatro background show through
    }

    private setupBoundary(): void {
        this.boundaryGraphics = new Graphics()
        this.gameContainer.addChild(this.boundaryGraphics)
        this.drawBoundary()
    }

    private drawBoundary(): void {
        const g = this.boundaryGraphics
        g.clear()

        const left = this.boundaryLeft
        const top = this.boundaryTop
        const right = this.boundaryRight
        const bottom = this.boundaryBottom - 80  // Stop above water
        const wallHeight = bottom - top
        const dangerWidth = 10

        // === LEFT WALL - Dangerous gradient zone ===
        // Dark inner gradient
        for (let i = 0; i < dangerWidth; i++) {
            const alpha = 0.25 * (1 - i / dangerWidth)
            g.rect(left + i, top, 1, wallHeight)
            g.fill({ color: 0x1a0a0a, alpha })
        }
        // Red glow
        for (let i = 0; i < 6; i++) {
            const alpha = 0.12 * (1 - i / 6)
            g.rect(left + i, top, 1, wallHeight)
            g.fill({ color: BALATRO.red, alpha })
        }

        // Left wall horizontal spikes/thorns (pointing right)
        const spikeSpacing = 30
        const spikeCount = Math.floor(wallHeight / spikeSpacing)
        for (let i = 0; i < spikeCount; i++) {
            const spikeY = top + 20 + i * spikeSpacing
            const spikeWidth = 14 + (i % 3) * 3  // Horizontal length (pointing inward)
            const spikeHeight = 8 + (i % 2) * 2   // Vertical thickness

            // Main spike shape (horizontal triangle pointing right)
            g.moveTo(left, spikeY - spikeHeight / 2)
            g.lineTo(left + spikeWidth, spikeY)
            g.lineTo(left, spikeY + spikeHeight / 2)
            g.closePath()
            g.fill({ color: BALATRO.red, alpha: 0.55 })

            // Spike glow/shadow
            g.moveTo(left, spikeY - spikeHeight / 2 - 1)
            g.lineTo(left + spikeWidth + 3, spikeY)
            g.lineTo(left, spikeY + spikeHeight / 2 + 1)
            g.closePath()
            g.fill({ color: BALATRO.red, alpha: 0.12 })
        }

        // === RIGHT WALL - Dangerous gradient zone ===
        // Dark inner gradient
        for (let i = 0; i < dangerWidth; i++) {
            const alpha = 0.25 * (1 - i / dangerWidth)
            g.rect(right - i - 1, top, 1, wallHeight)
            g.fill({ color: 0x1a0a0a, alpha })
        }
        // Red glow
        for (let i = 0; i < 6; i++) {
            const alpha = 0.12 * (1 - i / 6)
            g.rect(right - i - 1, top, 1, wallHeight)
            g.fill({ color: BALATRO.red, alpha })
        }

        // Right wall horizontal spikes/thorns (pointing left)
        for (let i = 0; i < spikeCount; i++) {
            const spikeY = top + 35 + i * spikeSpacing  // Offset from left wall
            const spikeWidth = 14 + ((i + 1) % 3) * 3
            const spikeHeight = 8 + ((i + 1) % 2) * 2

            // Main spike shape (horizontal triangle pointing left)
            g.moveTo(right, spikeY - spikeHeight / 2)
            g.lineTo(right - spikeWidth, spikeY)
            g.lineTo(right, spikeY + spikeHeight / 2)
            g.closePath()
            g.fill({ color: BALATRO.red, alpha: 0.55 })

            // Spike glow/shadow
            g.moveTo(right, spikeY - spikeHeight / 2 - 1)
            g.lineTo(right - spikeWidth - 3, spikeY)
            g.lineTo(right, spikeY + spikeHeight / 2 + 1)
            g.closePath()
            g.fill({ color: BALATRO.red, alpha: 0.12 })
        }

        // === TOP BOUNDARY ===
        // Dark gradient
        for (let i = 0; i < 6; i++) {
            const alpha = 0.2 * (1 - i / 6)
            g.rect(left, top + i, right - left, 1)
            g.fill({ color: 0x1a0a0a, alpha })
        }
        // Subtle red glow line
        g.rect(left, top, right - left, 1)
        g.fill({ color: BALATRO.red, alpha: 0.4 })
    }

    private setupOutText(): void {
        // Optimized for mobile 9:16
        this.outText = new Text({
            text: 'DIE',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 40,
                fontWeight: 'bold',
                fill: 0x8b0000,  // Dark blood red
                stroke: { color: 0x1a0a0a, width: 3 },
                align: 'center',
                letterSpacing: 6,
            }),
        })
        this.outText.anchor.set(0.5)
        this.outText.position.set(this.width / 2, this.height / 2)
        this.outText.alpha = 0
        this.uiContainer.addChild(this.outText)
    }

    private setupGoal(): void {
        // Initial goal position (center of play area)
        const goalX = (this.boundaryLeft + this.boundaryRight) / 2
        const goalY = (this.boundaryTop + this.boundaryBottom) / 2 + 50

        // Create wormhole finish portal (teal matches Abyss theme)
        this.wormhole = new Wormhole({
            x: goalX,
            y: goalY,
            radius: 50,
            perfectRadius: 20,
            isFinish: true,
            portalColor: 'teal',
        })
        this.gameContainer.addChild(this.wormhole.container)

        // Keep old goal for backward compatibility (but hide it)
        this.goal = new Goal({
            x: goalX,
            y: goalY,
            radius: 50,
            perfectRadius: 20,
        })
        this.goal.container.visible = false
        this.gameContainer.addChild(this.goal.container)

        // Initialize portal pairs array
        this.portalPairs = []
    }

    private setupInstruction(): void {
        // Optimized for mobile 9:16
        this.instructionText = new Text({
            text: 'TAP TO RELEASE',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0x888899,  // Muted color
                stroke: { color: BALATRO.bgDark, width: 2 },
                align: 'center',
                letterSpacing: 2,
            }),
        })
        this.instructionText.anchor.set(0.5)
        this.instructionText.position.set(this.width / 2, this.height - 70)
        this.instructionText.alpha = 0
        this.uiContainer.addChild(this.instructionText)
    }

    private setupHpBar(): void {
        // HP bar is now displayed directly on the wobble
        // This HUD version is kept as backup but hidden
        this.hpBarContainer = new Container()
        this.hpBarContainer.position.set(this.width / 2 - 60, this.height - 60)
        this.hpBarContainer.alpha = 0
        this.hpBarContainer.visible = false  // HP bar now on wobble
        this.uiContainer.addChild(this.hpBarContainer)

        const barWidth = 120
        const barHeight = 12

        // Background (dark)
        this.hpBarBackground = new Graphics()
        this.hpBarBackground.roundRect(0, 0, barWidth, barHeight, 6)
        this.hpBarBackground.fill({ color: BALATRO.bgCard })
        this.hpBarBackground.stroke({ color: BALATRO.border, width: 2 })
        this.hpBarContainer.addChild(this.hpBarBackground)

        // Fill (red to yellow gradient based on HP)
        this.hpBarFill = new Graphics()
        this.hpBarContainer.addChild(this.hpBarFill)

        this.updateHpBar(1)  // Start full
    }

    private updateHpBar(hpPercent: number): void {
        const g = this.hpBarFill
        g.clear()

        const barWidth = 120
        const barHeight = 12
        const fillWidth = Math.max(0, (barWidth - 4) * hpPercent)

        if (fillWidth <= 0) return

        // Color based on HP level
        let color: number
        if (hpPercent > 0.5) {
            color = BALATRO.cyan  // Healthy
        } else if (hpPercent > 0.25) {
            color = BALATRO.accent  // Caution (gold)
        } else {
            color = BALATRO.red  // Danger
        }

        g.roundRect(2, 2, fillWidth, barHeight - 4, 4)
        g.fill({ color })
    }

    private setupStageResult(): void {
        // Abyss theme colors
        const ABYSS = {
            purple: 0x6a3d7a,      // Deep purple
            darkPurple: 0x2a1a30,  // Very dark purple
            red: 0x8b2020,         // Blood red
            gold: 0xc9a227,        // Eldritch gold
            text: 0xccbbdd,        // Pale purple text
            glow: 0x5a2d70,        // Purple glow
        }

        // Result effect container (behind result card - for eyes, tentacles, vignette)
        this.resultEffectContainer = new Container()
        this.resultEffectContainer.visible = false
        this.uiContainer.addChild(this.resultEffectContainer)

        this.resultEffectGraphics = new Graphics()
        this.resultEffectContainer.addChild(this.resultEffectGraphics)

        this.stageResultContainer = new Container()
        this.stageResultContainer.position.set(this.width / 2, this.height / 2 - 20)
        this.stageResultContainer.alpha = 0
        this.stageResultContainer.visible = false
        this.uiContainer.addChild(this.stageResultContainer)

        // Background card
        this.stageResultGraphics = new Graphics()
        this.stageResultContainer.addChild(this.stageResultGraphics)

        // Optimized for mobile 9:16
        const labelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            fill: 0x8877aa,  // Muted purple
        })

        const valueStyle = new TextStyle({
            fontFamily: 'Arial Black, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: ABYSS.gold,
        })

        // "ESCAPED" text (abyss theme, optimized for mobile)
        this.stageResultText = new Text({
            text: 'ESCAPED',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: ABYSS.gold,
                stroke: { color: 0x1a0a20, width: 3 },
            }),
        })
        this.stageResultText.anchor.set(0.5)
        this.stageResultText.position.set(0, -90)
        this.stageResultContainer.addChild(this.stageResultText)

        // Survival Bonus row (was HP Bonus, positions optimized for mobile)
        this.stageHpLabelText = new Text({ text: 'Survival', style: labelStyle })
        this.stageHpLabelText.anchor.set(0, 0.5)
        this.stageHpLabelText.position.set(-95, -50)
        this.stageResultContainer.addChild(this.stageHpLabelText)

        this.stageHpValueText = new Text({ text: '+0', style: valueStyle })
        this.stageHpValueText.anchor.set(1, 0.5)
        this.stageHpValueText.position.set(95, -50)
        this.stageResultContainer.addChild(this.stageHpValueText)

        // Swift Bonus row (was Time Bonus, positions optimized for mobile)
        this.stageTimeLabelText = new Text({ text: 'Swift', style: labelStyle })
        this.stageTimeLabelText.anchor.set(0, 0.5)
        this.stageTimeLabelText.position.set(-95, -25)
        this.stageResultContainer.addChild(this.stageTimeLabelText)

        this.stageTimeValueText = new Text({ text: '+0', style: valueStyle })
        this.stageTimeValueText.anchor.set(1, 0.5)
        this.stageTimeValueText.position.set(95, -25)
        this.stageResultContainer.addChild(this.stageTimeValueText)

        // Total row (optimized for mobile)
        this.stageTotalLabelText = new Text({
            text: 'Tribute',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0xddccee,
            }),
        })
        this.stageTotalLabelText.anchor.set(0, 0.5)
        this.stageTotalLabelText.position.set(-95, 10)
        this.stageResultContainer.addChild(this.stageTotalLabelText)

        this.stageTotalValueText = new Text({
            text: '+0',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: ABYSS.gold,
            }),
        })
        this.stageTotalValueText.anchor.set(1, 0.5)
        this.stageTotalValueText.position.set(95, 10)
        this.stageResultContainer.addChild(this.stageTotalValueText)

        // Grade text (S, A, B, C, D) - eldritch style (optimized for mobile)
        this.stageGradeText = new Text({
            text: 'S',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 40,
                fontWeight: 'bold',
                fill: ABYSS.gold,
                stroke: { color: 0x1a0a20, width: 3 },
            }),
        })
        this.stageGradeText.anchor.set(0.5)
        this.stageGradeText.position.set(0, 60)
        this.stageGradeText.alpha = 0
        this.stageResultContainer.addChild(this.stageGradeText)

        // Legacy score text (hidden, optimized)
        this.stageScoreText = new Text({
            text: '+100',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        })
        this.stageScoreText.anchor.set(0.5)
        this.stageScoreText.position.set(0, 90)
        this.stageScoreText.visible = false
        this.stageResultContainer.addChild(this.stageScoreText)

        this.drawStageResultBg()
    }

    private drawStageResultBg(): void {
        const g = this.stageResultGraphics
        g.clear()

        // Optimized for mobile 9:16
        const w = 230  // Slightly narrower for mobile
        const h = 210
        const yOffset = -110

        // Abyss theme colors
        const bgColor = 0x1a0a20      // Very dark purple
        const borderColor = 0x6a3d7a  // Deep purple
        const glowColor = 0x8b2020    // Blood red glow
        const dividerColor = 0x3d1a50 // Purple divider

        // Outer glow (eldritch)
        g.roundRect(-w / 2 - 6, yOffset - 6, w + 12, h + 12, 20)
        g.fill({ color: glowColor, alpha: 0.3 })

        // Shadow
        g.roundRect(-w / 2 + 4, yOffset + 4, w, h, 16)
        g.fill({ color: 0x000000, alpha: 0.6 })

        // Background
        g.roundRect(-w / 2, yOffset, w, h, 16)
        g.fill({ color: bgColor })

        // Border
        g.roundRect(-w / 2, yOffset, w, h, 16)
        g.stroke({ color: borderColor, width: 3 })

        // Inner glow
        g.roundRect(-w / 2 + 4, yOffset + 4, w - 8, h - 8, 12)
        g.stroke({ color: borderColor, width: 1, alpha: 0.4 })

        // Divider line before total
        g.moveTo(-w / 2 + 20, -8)
        g.lineTo(w / 2 - 20, -8)
        g.stroke({ color: dividerColor, width: 1, alpha: 0.6 })

        // Divider line before grade
        g.moveTo(-w / 2 + 20, 35)
        g.lineTo(w / 2 - 20, 35)
        g.stroke({ color: dividerColor, width: 1, alpha: 0.6 })
    }

    /**
     * Initialize result screen abyss effects
     */
    private initResultEffects(isPerfect: boolean): void {
        this.resultEffectTime = 0
        this.resultVignetteAlpha = 0
        this.resultEyes = []
        this.resultTentacles = []

        // Create watching eyes in the darkness
        const eyeCount = isPerfect ? 8 : 5
        for (let i = 0; i < eyeCount; i++) {
            // Position eyes around the edges, watching the result
            const angle = (i / eyeCount) * Math.PI * 2 + Math.random() * 0.5
            const distance = 180 + Math.random() * 80
            this.resultEyes.push({
                x: this.width / 2 + Math.cos(angle) * distance,
                y: this.height / 2 - 20 + Math.sin(angle) * distance * 0.6,
                size: 12 + Math.random() * 10,
                openness: 0,
                targetOpenness: 1,
                lookAngle: Math.atan2(
                    this.height / 2 - 20 - (this.height / 2 - 20 + Math.sin(angle) * distance * 0.6),
                    this.width / 2 - (this.width / 2 + Math.cos(angle) * distance)
                ),
                targetLookAngle: Math.atan2(-Math.sin(angle), -Math.cos(angle)),
                blinkTimer: 0,
                intensity: 0.5 + Math.random() * 0.5,
            })
        }

        // Create tentacles reaching toward the result card
        const tentacleCount = isPerfect ? 12 : 8
        for (let i = 0; i < tentacleCount; i++) {
            const side = i % 4
            let x, y, angle
            switch (side) {
                case 0:  // Top
                    x = this.width * 0.2 + Math.random() * this.width * 0.6
                    y = 0
                    angle = Math.PI / 2 + (Math.random() - 0.5) * 0.4
                    break
                case 1:  // Right
                    x = this.width
                    y = this.height * 0.2 + Math.random() * this.height * 0.6
                    angle = Math.PI + (Math.random() - 0.5) * 0.4
                    break
                case 2:  // Bottom
                    x = this.width * 0.2 + Math.random() * this.width * 0.6
                    y = this.height
                    angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4
                    break
                default:  // Left
                    x = 0
                    y = this.height * 0.2 + Math.random() * this.height * 0.6
                    angle = (Math.random() - 0.5) * 0.4
                    break
            }
            this.resultTentacles.push({
                startX: x,
                startY: y,
                angle,
                length: 0,
                targetLength: 80 + Math.random() * 60,
                phase: Math.random() * Math.PI * 2,
                waveSpeed: 2 + Math.random() * 2,
            })
        }

        this.resultEffectContainer.visible = true
    }

    /**
     * Update result screen effects
     */
    private updateResultEffects(deltaSeconds: number): void {
        if (!this.isShowingResult) return

        this.resultEffectTime += deltaSeconds

        // Fade in vignette
        this.resultVignetteAlpha = Math.min(0.7, this.resultVignetteAlpha + deltaSeconds * 2)

        // Update eyes
        for (const eye of this.resultEyes) {
            // Open eyes gradually
            eye.openness += (eye.targetOpenness - eye.openness) * deltaSeconds * 3

            // Look toward center (result card)
            const angleDiff = eye.targetLookAngle - eye.lookAngle
            eye.lookAngle += angleDiff * deltaSeconds * 2

            // Intensity pulse
            eye.intensity = 0.5 + Math.sin(this.resultEffectTime * 3 + eye.x * 0.01) * 0.3
        }

        // Update tentacles
        for (const tentacle of this.resultTentacles) {
            // Grow tentacles
            tentacle.length += (tentacle.targetLength - tentacle.length) * deltaSeconds * 2
        }

        this.drawResultEffects()
    }

    /**
     * Draw result screen abyss effects
     */
    private drawResultEffects(): void {
        const g = this.resultEffectGraphics
        g.clear()

        const time = this.resultEffectTime

        // Dark vignette background
        g.rect(0, 0, this.width, this.height)
        g.fill({ color: 0x0a0510, alpha: this.resultVignetteAlpha })

        // Radial gradient (darker at edges)
        const cx = this.width / 2
        const cy = this.height / 2 - 20
        for (let r = 0; r < 6; r++) {
            const radius = this.width * 0.15 + r * this.width * 0.12
            const alpha = (r / 6) * 0.4 * this.resultVignetteAlpha
            g.ellipse(cx, cy, radius, radius * 0.7)
            g.fill({ color: 0x0a0510, alpha })
        }

        // Draw tentacles
        for (const tentacle of this.resultTentacles) {
            this.drawResultTentacle(g, tentacle, time)
        }

        // Draw eyes
        for (const eye of this.resultEyes) {
            this.drawResultEye(g, eye, time)
        }
    }

    /**
     * Draw a single result screen tentacle
     */
    private drawResultTentacle(g: Graphics, tentacle: ResultTentacle, time: number): void {
        if (tentacle.length < 5) return

        const segments = 10
        const segmentLength = tentacle.length / segments
        const baseWidth = 15

        let x = tentacle.startX
        let y = tentacle.startY
        let angle = tentacle.angle

        for (let i = 0; i < segments; i++) {
            const t = i / segments
            const width = baseWidth * (1 - t * 0.7)
            const wave = Math.sin(time * tentacle.waveSpeed + tentacle.phase + i * 0.4) * 10 * t

            // Curve toward center
            const toCenterX = this.width / 2 - x
            const toCenterY = this.height / 2 - 20 - y
            const toCenterAngle = Math.atan2(toCenterY, toCenterX)
            angle += (toCenterAngle - angle) * 0.1

            const nextX = x + Math.cos(angle) * segmentLength + Math.cos(angle + Math.PI / 2) * wave
            const nextY = y + Math.sin(angle) * segmentLength + Math.sin(angle + Math.PI / 2) * wave

            // Draw segment
            const perpX = Math.cos(angle + Math.PI / 2) * width / 2
            const perpY = Math.sin(angle + Math.PI / 2) * width / 2

            g.moveTo(x + perpX, y + perpY)
            g.lineTo(nextX + perpX * 0.8, nextY + perpY * 0.8)
            g.lineTo(nextX - perpX * 0.8, nextY - perpY * 0.8)
            g.lineTo(x - perpX, y - perpY)
            g.closePath()

            const tentacleColor = this.lerpColor(0x4a2060, 0x1a0a20, t)
            g.fill({ color: tentacleColor, alpha: 0.8 })

            // Suckers
            if (i > 1 && i % 2 === 0 && tentacle.length > 30) {
                g.circle(x, y, width * 0.25)
                g.fill({ color: 0x6a3080, alpha: 0.5 })
                g.circle(x, y, width * 0.12)
                g.fill({ color: 0x1a0a20, alpha: 0.7 })
            }

            x = nextX
            y = nextY
        }
    }

    /**
     * Draw a single result screen eye
     */
    private drawResultEye(g: Graphics, eye: ResultEye, time: number): void {
        if (eye.openness < 0.1) return

        const size = eye.size

        // Outer glow
        const glowColor = this.lerpColor(0x6a3080, 0x8b2040, eye.intensity)
        g.ellipse(eye.x, eye.y, size + 15, (size + 15) * 0.5 * eye.openness)
        g.fill({ color: glowColor, alpha: 0.2 * eye.intensity })

        g.ellipse(eye.x, eye.y, size + 8, (size + 8) * 0.5 * eye.openness)
        g.fill({ color: glowColor, alpha: 0.35 * eye.intensity })

        // Eye white
        g.ellipse(eye.x, eye.y, size, size * 0.5 * eye.openness)
        g.fill({ color: 0xeeeedd, alpha: 0.85 })

        // Iris
        const irisSize = size * 0.65
        const lookDist = size * 0.15
        const pupilX = eye.x + Math.cos(eye.lookAngle) * lookDist
        const pupilY = eye.y + Math.sin(eye.lookAngle) * lookDist * eye.openness

        g.ellipse(pupilX, pupilY, irisSize, irisSize * 0.5 * eye.openness)
        g.fill({ color: 0xaa1133, alpha: 0.95 })

        // Pupil
        const pupilSize = irisSize * 0.4
        g.ellipse(pupilX, pupilY, pupilSize, pupilSize * 0.5 * eye.openness)
        g.fill({ color: 0x000000, alpha: 0.98 })

        // Highlight
        g.circle(pupilX - pupilSize * 0.4, pupilY - pupilSize * 0.2 * eye.openness, pupilSize * 0.25)
        g.fill({ color: 0xffffff, alpha: 0.8 })
    }

    /**
     * Make eyes react to grade reveal (widen in surprise/respect)
     */
    private triggerEyeReaction(grade: string): void {
        const isGoodGrade = grade === 'S' || grade === 'A'

        for (const eye of this.resultEyes) {
            if (isGoodGrade) {
                // Eyes widen in respect/fear
                eye.targetOpenness = 1.3
                eye.intensity = 1
            } else {
                // Eyes narrow (disappointed/hungry)
                eye.targetOpenness = 0.7
            }
        }

        // Tentacles react too
        for (const tentacle of this.resultTentacles) {
            if (isGoodGrade) {
                // Tentacles recoil slightly
                tentacle.targetLength *= 0.8
            } else {
                // Tentacles reach closer
                tentacle.targetLength *= 1.2
            }
        }
    }

    /**
     * Clean up result effects
     */
    private cleanupResultEffects(): void {
        this.resultEffectContainer.visible = false
        this.resultEyes = []
        this.resultTentacles = []
        this.resultVignetteAlpha = 0
        this.resultEffectGraphics.clear()
    }

    private setupTransition(): void {
        // Create transition container (above game, below intro)
        this.transitionContainer = new Container()
        this.transitionContainer.visible = false
        this.container.addChild(this.transitionContainer)

        // Graphics for transition effects
        this.transitionGraphics = new Graphics()
        this.transitionContainer.addChild(this.transitionGraphics)

        // Depth number text - eldritch style (optimized for mobile 9:16)
        this.transitionStageText = new Text({
            text: 'DEPTH 1',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 42,
                fontWeight: 'bold',
                fill: 0xcc88ff,
                stroke: { color: 0x1a0a2e, width: 4 },
                letterSpacing: 6,
            }),
        })
        this.transitionStageText.anchor.set(0.5)
        this.transitionStageText.position.set(this.width / 2, this.height / 2 - 20)
        this.transitionContainer.addChild(this.transitionStageText)

        // Sub text - ominous message (optimized for mobile 9:16)
        this.transitionSubText = new Text({
            text: i18n.t('wobblediver.transitions.awaken'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fill: 0x9966cc,
                letterSpacing: 3,
            }),
        })
        this.transitionSubText.anchor.set(0.5)
        this.transitionSubText.position.set(this.width / 2, this.height / 2 + 20)
        this.transitionContainer.addChild(this.transitionSubText)
    }

    private startStageTransition(stageNumber: number): void {
        this.isTransitioning = true
        this.transitionTime = 0
        this.transitionContainer.visible = true

        // Update depth text
        this.transitionStageText.text = `DEPTH ${stageNumber}`
        this.transitionStageText.alpha = 0
        this.transitionStageText.scale.set(0.5)

        // Ominous messages about descending deeper
        const messages = [
            i18n.t('wobblediver.transitions.depth1'),
            i18n.t('wobblediver.transitions.depth2'),
            i18n.t('wobblediver.transitions.depth3'),
            i18n.t('wobblediver.transitions.depth4'),
            i18n.t('wobblediver.transitions.depth5'),
            i18n.t('wobblediver.transitions.depth6'),
            i18n.t('wobblediver.transitions.depth7'),
            i18n.t('wobblediver.transitions.depth8'),
        ]
        this.transitionSubText.text = messages[(stageNumber - 1) % messages.length]
        this.transitionSubText.alpha = 0

        // Generate tentacles from edges
        this.transitionTentacles = []
        const tentacleCount = 8 + Math.min(stageNumber, 8)
        for (let i = 0; i < tentacleCount; i++) {
            const side = i % 4  // 0=top, 1=right, 2=bottom, 3=left
            let x, y, angle
            switch (side) {
                case 0:  // Top
                    x = Math.random() * this.width
                    y = 0
                    angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5
                    break
                case 1:  // Right
                    x = this.width
                    y = Math.random() * this.height
                    angle = Math.PI + (Math.random() - 0.5) * 0.5
                    break
                case 2:  // Bottom
                    x = Math.random() * this.width
                    y = this.height
                    angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5
                    break
                default:  // Left
                    x = 0
                    y = Math.random() * this.height
                    angle = (Math.random() - 0.5) * 0.5
                    break
            }
            this.transitionTentacles.push({
                x,
                y,
                angle,
                length: 100 + Math.random() * 150,
                phase: Math.random() * Math.PI * 2,
            })
        }

        // Generate transition eyes
        this.transitionEyes = []
        const eyeCount = 3 + Math.min(stageNumber, 5)
        for (let i = 0; i < eyeCount; i++) {
            this.transitionEyes.push({
                x: this.width * 0.2 + Math.random() * this.width * 0.6,
                y: this.height * 0.3 + Math.random() * this.height * 0.4,
                size: 15 + Math.random() * 25,
                openness: 0,
                targetOpenness: 1,
            })
        }

        // Generate depth descent particles (float upward to show sinking)
        this.transitionDepthParticles = []
        const particleCount = 30 + stageNumber * 5
        for (let i = 0; i < particleCount; i++) {
            this.transitionDepthParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 1 + Math.random() * 3,
                speed: 100 + Math.random() * 200,
                alpha: 0.2 + Math.random() * 0.4,
            })
        }

        // Reset depth meter
        this.transitionDepthMeter = 0
    }

    private updateTransition(deltaSeconds: number): void {
        if (!this.isTransitioning) return

        this.transitionTime += deltaSeconds
        const t = this.transitionTime
        const duration = this.transitionDuration

        const g = this.transitionGraphics
        g.clear()

        // Phase 1: Darkness closes in completely (0 - 0.5s)
        // Phase 2: Full darkness with effects (0.5 - 1.8s)
        // Phase 3: Abyss opens - vertical split reveal (1.8 - 2.5s)

        const cx = this.width / 2
        const cy = this.height / 2

        // Calculate phase-specific values
        const closePhaseEnd = 0.5
        const holdPhaseEnd = 1.8
        const openPhaseEnd = duration

        if (t < closePhaseEnd) {
            // Phase 1: Iris closing effect (circular mask shrinking)
            const closeProgress = t / closePhaseEnd
            const easeClose = 1 - Math.pow(1 - closeProgress, 3)  // Ease out cubic

            // Draw closing iris - reveal shrinks from edges
            const maxRadius = Math.sqrt(cx * cx + cy * cy) * 1.2
            const irisRadius = maxRadius * (1 - easeClose)

            // Full dark background
            g.rect(0, 0, this.width, this.height)
            g.fill({ color: 0x0a0510, alpha: 1.0 })

            // Cut out the visible area (circular reveal getting smaller)
            if (irisRadius > 10) {
                g.ellipse(cx, cy, irisRadius, irisRadius * 0.8)
                g.cut()
            }

            // Glowing edge around the iris
            if (irisRadius > 20) {
                for (let i = 0; i < 3; i++) {
                    const glowRadius = irisRadius + i * 8
                    g.ellipse(cx, cy, glowRadius, glowRadius * 0.8)
                    g.stroke({ color: 0x6b5b95, width: 4 - i, alpha: 0.4 - i * 0.1 })
                }
            }

        } else if (t < holdPhaseEnd) {
            // Phase 2: Full darkness - show all the spooky effects
            g.rect(0, 0, this.width, this.height)
            g.fill({ color: 0x0a0510, alpha: 1.0 })

            // Subtle inner glow from center
            const pulseIntensity = 0.3 + Math.sin((t - closePhaseEnd) * 4) * 0.1
            for (let i = 0; i < 4; i++) {
                const glowRadius = 50 + i * 40
                g.ellipse(cx, cy, glowRadius, glowRadius * 0.7)
                g.fill({ color: 0x6b5b95, alpha: pulseIntensity * (0.15 - i * 0.03) })
            }

        } else {
            // Phase 3: Abyss opening - vertical split like an eye opening
            const openProgress = (t - holdPhaseEnd) / (openPhaseEnd - holdPhaseEnd)
            const easeOpen = openProgress * openProgress * (3 - 2 * openProgress)  // Smoothstep

            // The "eyelids" split apart vertically
            const splitDistance = cy * easeOpen * 1.2

            // Top half (slides up)
            g.rect(0, 0, this.width, cy - splitDistance)
            g.fill({ color: 0x0a0510, alpha: 1.0 })

            // Bottom half (slides down)
            g.rect(0, cy + splitDistance, this.width, this.height - cy - splitDistance)
            g.fill({ color: 0x0a0510, alpha: 1.0 })

            // Glowing edges where the split happens
            const glowAlpha = 0.6 * (1 - easeOpen)

            // Top edge glow
            for (let i = 0; i < 4; i++) {
                const edgeY = cy - splitDistance + i * 3
                g.moveTo(0, edgeY)
                g.lineTo(this.width, edgeY)
                g.stroke({ color: 0x4ecdc4, width: 4 - i, alpha: glowAlpha * (1 - i * 0.2) })
            }

            // Bottom edge glow
            for (let i = 0; i < 4; i++) {
                const edgeY = cy + splitDistance - i * 3
                g.moveTo(0, edgeY)
                g.lineTo(this.width, edgeY)
                g.stroke({ color: 0x4ecdc4, width: 4 - i, alpha: glowAlpha * (1 - i * 0.2) })
            }

            // Tentacles reaching from the edges during open
            if (easeOpen < 0.7) {
                const tentacleAlpha = (0.7 - easeOpen) / 0.7
                // Top tentacles
                for (let i = 0; i < 5; i++) {
                    const tx = this.width * (0.1 + i * 0.2)
                    const reachY = cy - splitDistance + 30 * tentacleAlpha
                    g.moveTo(tx - 10, cy - splitDistance)
                    g.quadraticCurveTo(tx, reachY, tx + 10, cy - splitDistance)
                    g.fill({ color: 0x4a1a55, alpha: tentacleAlpha * 0.6 })
                }
                // Bottom tentacles
                for (let i = 0; i < 5; i++) {
                    const tx = this.width * (0.15 + i * 0.2)
                    const reachY = cy + splitDistance - 30 * tentacleAlpha
                    g.moveTo(tx - 10, cy + splitDistance)
                    g.quadraticCurveTo(tx, reachY, tx + 10, cy + splitDistance)
                    g.fill({ color: 0x4a1a55, alpha: tentacleAlpha * 0.6 })
                }
            }
        }

        // Calculate visibility for effects (only during hold phase)
        const effectsVisible = t >= closePhaseEnd && t < holdPhaseEnd
        const effectsFade = t > holdPhaseEnd - 0.3 ? Math.max(0, (holdPhaseEnd - t) / 0.3) : 1

        // Draw tentacles (only during hold phase)
        if (effectsVisible) {
            const tentacleProgress = Math.min(1, (t - closePhaseEnd) / 0.5)
            for (const tentacle of this.transitionTentacles) {
                this.drawTransitionTentacle(g, tentacle, tentacleProgress * effectsFade, t)
            }
        }

        // Draw eyes (only during hold phase)
        if (effectsVisible) {
            const eyeProgress = Math.min(1, (t - closePhaseEnd - 0.1) / 0.3)

            for (const eye of this.transitionEyes) {
                eye.openness = Math.min(eye.openness + deltaSeconds * 3, eye.targetOpenness) * eyeProgress
                this.drawTransitionEye(g, eye, effectsFade, t)
            }
        }

        // Draw depth descent particles (only during hold phase)
        if (effectsVisible) {
            for (const particle of this.transitionDepthParticles) {
                // Move particles upward (we're sinking, so particles go up)
                particle.y -= particle.speed * deltaSeconds

                // Reset particles that go off screen
                if (particle.y < -10) {
                    particle.y = this.height + 10
                    particle.x = Math.random() * this.width
                }

                // Draw particle with trailing effect
                const trailLength = particle.speed * 0.05
                g.moveTo(particle.x, particle.y)
                g.lineTo(particle.x, particle.y + trailLength)
                g.stroke({
                    color: 0x4ecdc4,
                    width: particle.size,
                    alpha: particle.alpha * effectsFade,
                    cap: 'round',
                })

                // Small glow
                g.circle(particle.x, particle.y, particle.size * 1.5)
                g.fill({ color: 0x4ecdc4, alpha: particle.alpha * 0.3 * effectsFade })
            }
        }

        // Draw depth meter (only during hold phase)
        if (effectsVisible) {
            const meterFade = effectsFade
            this.transitionDepthMeter = Math.min(1, this.transitionDepthMeter + deltaSeconds * 0.6)

            const meterX = this.width - 40
            const meterY = this.height * 0.25
            const meterHeight = this.height * 0.5
            const meterWidth = 8

            // Meter background
            g.roundRect(meterX - meterWidth / 2, meterY, meterWidth, meterHeight, 4)
            g.fill({ color: 0x1a0a20, alpha: 0.6 * meterFade })
            g.stroke({ color: 0x4ecdc4, width: 1, alpha: 0.4 * meterFade })

            // Meter fill (fills from top to bottom = descending)
            const fillHeight = meterHeight * this.transitionDepthMeter
            g.roundRect(meterX - meterWidth / 2 + 1, meterY + 1, meterWidth - 2, fillHeight - 2, 3)
            g.fill({ color: 0x4ecdc4, alpha: 0.8 * meterFade })

            // Depth markers
            for (let i = 0; i <= 4; i++) {
                const markerY = meterY + (meterHeight * i) / 4
                g.moveTo(meterX - meterWidth / 2 - 5, markerY)
                g.lineTo(meterX - meterWidth / 2, markerY)
                g.stroke({ color: 0x4ecdc4, width: 1, alpha: 0.5 * meterFade })
            }

            // Depth arrow indicator at current position
            const arrowY = meterY + fillHeight
            g.moveTo(meterX + meterWidth / 2 + 3, arrowY - 4)
            g.lineTo(meterX + meterWidth / 2 + 10, arrowY)
            g.lineTo(meterX + meterWidth / 2 + 3, arrowY + 4)
            g.fill({ color: 0xff6b6b, alpha: meterFade })
        }

        // Stage text animation (only during hold phase)
        if (effectsVisible) {
            const textProgress = Math.min(1, (t - closePhaseEnd) / 0.3)

            this.transitionStageText.alpha = textProgress * effectsFade
            this.transitionStageText.scale.set(0.5 + textProgress * 0.5)

            // Shake effect
            const shake = Math.sin(t * 30) * 3 * (1 - textProgress)
            this.transitionStageText.position.set(this.width / 2 + shake, this.height / 2 - 30)

            // Sub text (slightly delayed)
            const subProgress = Math.min(1, (t - closePhaseEnd - 0.2) / 0.3)
            this.transitionSubText.alpha = Math.max(0, subProgress) * effectsFade * 0.8
        } else {
            this.transitionStageText.alpha = 0
            this.transitionSubText.alpha = 0
        }

        // End transition
        if (t >= duration) {
            this.isTransitioning = false
            this.transitionContainer.visible = false
        }
    }

    private drawTransitionTentacle(
        g: Graphics,
        tentacle: { x: number; y: number; angle: number; length: number; phase: number },
        progress: number,
        time: number
    ): void {
        const segments = 12
        const segmentLength = (tentacle.length * progress) / segments
        const baseWidth = 20

        let x = tentacle.x
        let y = tentacle.y
        let angle = tentacle.angle

        g.moveTo(x, y)

        for (let i = 0; i < segments; i++) {
            const t = i / segments
            const width = baseWidth * (1 - t * 0.8)
            const waveOffset = Math.sin(time * 4 + tentacle.phase + i * 0.5) * 15 * t

            // Curve the tentacle
            angle += Math.sin(time * 3 + tentacle.phase + i * 0.3) * 0.15

            const nextX = x + Math.cos(angle) * segmentLength + Math.cos(angle + Math.PI / 2) * waveOffset
            const nextY = y + Math.sin(angle) * segmentLength + Math.sin(angle + Math.PI / 2) * waveOffset

            // Draw tentacle segment
            const perpX = Math.cos(angle + Math.PI / 2) * width / 2
            const perpY = Math.sin(angle + Math.PI / 2) * width / 2

            g.moveTo(x + perpX, y + perpY)
            g.lineTo(nextX + perpX * 0.8, nextY + perpY * 0.8)
            g.lineTo(nextX - perpX * 0.8, nextY - perpY * 0.8)
            g.lineTo(x - perpX, y - perpY)
            g.closePath()

            const tentacleColor = this.lerpColor(0x3d1a50, 0x1a0a20, t)
            g.fill({ color: tentacleColor, alpha: 0.9 * progress })

            // Suckers on larger segments
            if (i > 2 && i % 2 === 0 && progress > 0.5) {
                g.circle(x, y, width * 0.3)
                g.fill({ color: 0x5a2d70, alpha: 0.6 * progress })
                g.circle(x, y, width * 0.15)
                g.fill({ color: 0x1a0a20, alpha: 0.8 * progress })
            }

            x = nextX
            y = nextY
        }
    }

    private drawTransitionEye(
        g: Graphics,
        eye: { x: number; y: number; size: number; openness: number },
        fade: number,
        time: number
    ): void {
        if (eye.openness < 0.1) return

        const size = eye.size
        const openness = eye.openness

        // Outer glow
        g.ellipse(eye.x, eye.y, size + 20, (size + 20) * 0.5 * openness)
        g.fill({ color: 0xff0000, alpha: 0.15 * fade })

        g.ellipse(eye.x, eye.y, size + 10, (size + 10) * 0.5 * openness)
        g.fill({ color: 0x8b0000, alpha: 0.3 * fade })

        // Eye white
        g.ellipse(eye.x, eye.y, size, size * 0.5 * openness)
        g.fill({ color: 0xf0eedd, alpha: 0.9 * fade })

        // Iris
        const irisSize = size * 0.7
        const lookX = Math.sin(time * 2 + eye.x * 0.01) * size * 0.1
        const lookY = Math.cos(time * 1.5 + eye.y * 0.01) * size * 0.05 * openness

        g.ellipse(eye.x + lookX, eye.y + lookY, irisSize, irisSize * 0.5 * openness)
        g.fill({ color: 0xcc0000, alpha: 0.95 * fade })

        // Pupil (contracted, predatory)
        const pupilSize = irisSize * 0.3
        g.ellipse(eye.x + lookX, eye.y + lookY, pupilSize, pupilSize * 0.5 * openness)
        g.fill({ color: 0x000000, alpha: 0.98 * fade })

        // Highlight
        g.circle(eye.x + lookX - pupilSize * 0.5, eye.y + lookY - pupilSize * 0.2 * openness, pupilSize * 0.3)
        g.fill({ color: 0xffffff, alpha: 0.8 * fade })
    }

    private showStageResult(score: number, hpPercent: number, timeTaken: number, perfect: boolean): void {
        this.isShowingResult = true
        this.resultDisplayTime = 0
        this.resultPhase = 'hp'

        // Initialize abyss effects (eyes and tentacles watching)
        this.initResultEffects(perfect)

        // Calculate individual score components
        const basePoints = 100
        const stageMultiplier = 1 + (this.roundNumber - 1) * 0.1
        const perfectMultiplier = perfect ? 2.0 : 1.0

        // HP bonus: 0-150 points based on remaining HP
        const hpBonus = Math.round(150 * hpPercent * stageMultiplier)

        // Time bonus: 0-100 points based on speed (max at 0s, decays over 10s)
        const timeDecay = Math.max(0, 1 - timeTaken / 10)
        const timeBonus = Math.round(100 * timeDecay * stageMultiplier)

        // Base score for landing
        const baseScore = Math.round(basePoints * perfectMultiplier * stageMultiplier)

        const totalScore = hpBonus + timeBonus + baseScore

        // Set targets for counting animation
        this.resultCountTarget = { hp: hpBonus, time: timeBonus, total: totalScore }
        this.resultCountCurrent = { hp: 0, time: 0, total: 0 }

        // Calculate grade based on total score and conditions
        const grade = this.calculateGrade(totalScore, hpPercent, timeTaken, perfect)

        // Grade colors (abyss theme)
        const gradeColors: Record<string, number> = {
            'S': 0xffd700,   // Eldritch gold - escaped the abyss
            'A': 0xc9a227,   // Gold
            'B': 0x8b6914,   // Dark gold
            'C': 0x6a3d7a,   // Deep purple
            'D': 0x8b2020,   // Blood red - barely survived
        }
        this.resultGrade = { letter: grade.letter, color: gradeColors[grade.letter] || BALATRO.accent }

        // Update texts (initially zeros)
        this.stageResultText.text = perfect ? 'FLAWLESS' : 'ESCAPED'
        this.stageHpValueText.text = '+0'
        this.stageTimeValueText.text = '+0'
        this.stageTotalValueText.text = '+0'
        this.stageGradeText.text = grade.letter
        this.stageGradeText.style.fill = this.resultGrade.color
        this.stageGradeText.alpha = 0
        this.stageGradeText.scale.set(0.5)

        // Show with animation
        this.stageResultContainer.visible = true
        this.stageResultContainer.alpha = 0
        this.stageResultContainer.scale.set(0.5)

        // Animate in
        let elapsed = 0
        const animateIn = () => {
            elapsed += 1 / 60
            const progress = Math.min(elapsed / 0.3, 1)

            // Ease out back
            const overshoot = 1.5
            const t = progress - 1
            const eased = t * t * ((overshoot + 1) * t + overshoot) + 1

            this.stageResultContainer.alpha = progress
            this.stageResultContainer.scale.set(0.5 + eased * 0.5)

            if (progress < 1) {
                requestAnimationFrame(animateIn)
            }
        }
        requestAnimationFrame(animateIn)
    }

    /**
     * Update result display counting animation
     */
    private updateResultCounting(deltaSeconds: number): void {
        const countSpeed = 300  // Points per second
        const increment = countSpeed * deltaSeconds

        switch (this.resultPhase) {
            case 'hp':
                if (this.resultCountCurrent.hp < this.resultCountTarget.hp) {
                    this.resultCountCurrent.hp = Math.min(
                        this.resultCountCurrent.hp + increment,
                        this.resultCountTarget.hp
                    )
                    this.stageHpValueText.text = `+${Math.round(this.resultCountCurrent.hp)}`
                } else {
                    this.resultPhase = 'time'
                }
                break

            case 'time':
                if (this.resultCountCurrent.time < this.resultCountTarget.time) {
                    this.resultCountCurrent.time = Math.min(
                        this.resultCountCurrent.time + increment,
                        this.resultCountTarget.time
                    )
                    this.stageTimeValueText.text = `+${Math.round(this.resultCountCurrent.time)}`
                } else {
                    this.resultPhase = 'total'
                }
                break

            case 'total':
                if (this.resultCountCurrent.total < this.resultCountTarget.total) {
                    this.resultCountCurrent.total = Math.min(
                        this.resultCountCurrent.total + increment * 1.5,  // Count total faster
                        this.resultCountTarget.total
                    )
                    this.stageTotalValueText.text = `+${Math.round(this.resultCountCurrent.total)}`
                } else {
                    this.resultPhase = 'grade'
                    // Trigger grade reveal animation
                    this.revealGrade()
                }
                break

            case 'grade':
                // Animate grade (handled in revealGrade)
                break

            case 'done':
                // Wait for timer to proceed
                break
        }
    }

    /**
     * Animate grade reveal
     */
    private revealGrade(): void {
        // Trigger eye/tentacle reaction to the grade
        this.triggerEyeReaction(this.resultGrade.letter)

        let elapsed = 0
        const animate = () => {
            elapsed += 1 / 60
            const progress = Math.min(elapsed / 0.4, 1)

            // Ease out back for bouncy effect
            const overshoot = 2
            const t = progress - 1
            const eased = t * t * ((overshoot + 1) * t + overshoot) + 1

            this.stageGradeText.alpha = progress
            this.stageGradeText.scale.set(0.5 + eased * 0.5)

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                this.resultPhase = 'done'
            }
        }
        requestAnimationFrame(animate)
    }

    private hideStageResult(): void {
        this.isShowingResult = false

        // Add the counted score to the score system
        this.scoreSystem.addPoints(this.resultCountTarget.total)

        // Animate out
        let elapsed = 0
        const animateOut = () => {
            elapsed += 1 / 60
            const progress = Math.min(elapsed / 0.2, 1)

            this.stageResultContainer.alpha = 1 - progress
            this.stageResultContainer.scale.set(1 - progress * 0.3)

            // Fade out effects too
            this.resultVignetteAlpha = 0.7 * (1 - progress)
            this.drawResultEffects()

            if (progress < 1) {
                requestAnimationFrame(animateOut)
            } else {
                this.stageResultContainer.visible = false
                this.cleanupResultEffects()
            }
        }
        requestAnimationFrame(animateOut)
    }

    private calculateGrade(score: number, hpPercent: number, timeTaken: number, perfect: boolean): { letter: string; description: string } {
        // Grade formula:
        // S: Perfect hit + full HP + fast (<3s)
        // A: Good score (>250) or perfect hit
        // B: Decent score (>150)
        // C: Low score (>100)
        // D: Barely made it

        if (perfect && hpPercent >= 1 && timeTaken < 3) {
            return { letter: 'S', description: 'Perfect!' }
        }

        if (score >= 250 || (perfect && hpPercent >= 0.75)) {
            return { letter: 'A', description: 'Excellent!' }
        }

        if (score >= 150 || hpPercent >= 0.75) {
            return { letter: 'B', description: 'Good!' }
        }

        if (score >= 100 || hpPercent >= 0.5) {
            return { letter: 'C', description: 'OK' }
        }

        return { letter: 'D', description: 'Close call!' }
    }

    private setupInteraction(): void {
        // Make game area tappable
        this.gameContainer.eventMode = 'static'
        this.gameContainer.hitArea = {
            contains: () => true,
        }

        this.gameContainer.on('pointerdown', () => {
            this.onTap()
        })
    }

    private onTap(): void {
        if (this.isTransitioning) return  // Block input during transition
        if (!this.isWaitingForTap || !this.wobble) return
        if (this.wobble.state !== 'swinging') return

        // Cut the rope!
        this.wobble.release()
        this.isWaitingForTap = false
        this.instructionText.alpha = 0
    }

    private startNewRound(): void {
        this.roundNumber++
        this.roundTransitionTime = 0
        this.roundStartTime = Date.now() / 1000  // Track start time for scoring

        // Start stage transition effect (skip for first round as intro handles it)
        if (this.roundNumber > 1) {
            this.startStageTransition(this.roundNumber)
        }

        // Hide HP bar until released
        this.hpBarContainer.alpha = 0

        // Clear old wobble
        if (this.wobble) {
            this.gameContainer.removeChild(this.wobble.container)
            this.wobble.destroy()
            this.wobble = null
        }

        // Generate new positions
        const anchorX = this.getAnchorX()  // Always center
        const ropeLength = this.getRandomRopeLength()
        const startAngle = this.getRandomStartAngle()

        // Create new wobble (anchor Y matches AnchorWobble position)
        this.wobble = new SwingingWobble(anchorX, this.boundaryTop + 60, ropeLength, startAngle)
        this.wobble.resetHp()  // Ensure full HP for new round
        this.gameContainer.addChild(this.wobble.container)

        // Add abyss front container AFTER wobble so it renders on top
        if (this.abyssFrontContainer.parent) {
            this.gameContainer.removeChild(this.abyssFrontContainer)
        }
        this.gameContainer.addChild(this.abyssFrontContainer)

        // Reset blood level and drowning state for new round
        this.abyssBloodLevel = 0
        this.isDrowningActive = false
        this.drowningBubbles = []
        this.surfaceRipples = []

        // Apply trajectory visibility based on current difficulty
        this.wobble.setTrajectoryMode(this.trajectoryMode, {
            duration: this.trajectoryDuration,
            flickerInterval: this.trajectoryFlickerInterval,
            flickerOnRatio: this.trajectoryFlickerOnRatio,
        })

        // Position goal (before setting wobble's goal reference)
        this.positionGoal()

        // Tell wobble where goal is for expression tracking
        this.wobble.setGoalPosition(this.wormhole.x, this.wormhole.y)

        // Update HUD stage display
        this.hud.updateStage(this.roundNumber)

        // Update obstacles
        this.updateObstacles()

        // Ready for tap
        this.isWaitingForTap = true

        // Show instruction with fade
        this.instructionText.alpha = 1
    }

    /**
     * Restart the current stage (after death, if lives remain)
     * Unlike startNewRound, this doesn't increment roundNumber
     */
    private restartCurrentStage(): void {
        this.isWaitingForRetry = false
        this.roundTransitionTime = 0
        this.roundStartTime = Date.now() / 1000

        // Hide HP bar until released
        this.hpBarContainer.alpha = 0

        // Clear old wobble
        if (this.wobble) {
            this.gameContainer.removeChild(this.wobble.container)
            this.wobble.destroy()
            this.wobble = null
        }

        // Generate new positions
        const anchorX = this.getAnchorX()
        const ropeLength = this.getRandomRopeLength()
        const startAngle = this.getRandomStartAngle()

        // Create new wobble
        this.wobble = new SwingingWobble(anchorX, this.boundaryTop + 60, ropeLength, startAngle)
        this.wobble.resetHp()
        this.gameContainer.addChild(this.wobble.container)

        // Add abyss front container AFTER wobble so it renders on top
        if (this.abyssFrontContainer.parent) {
            this.gameContainer.removeChild(this.abyssFrontContainer)
        }
        this.gameContainer.addChild(this.abyssFrontContainer)

        // Reset blood level and drowning state
        this.abyssBloodLevel = 0
        this.isDrowningActive = false
        this.drowningBubbles = []
        this.surfaceRipples = []

        // Apply trajectory visibility based on current difficulty
        this.wobble.setTrajectoryMode(this.trajectoryMode, {
            duration: this.trajectoryDuration,
            flickerInterval: this.trajectoryFlickerInterval,
            flickerOnRatio: this.trajectoryFlickerOnRatio,
        })

        // Position goal (keep same position for retry)
        this.wobble.setGoalPosition(this.wormhole.x, this.wormhole.y)

        // Ready for tap
        this.isWaitingForTap = true
        this.instructionText.alpha = 1
    }

    private getAnchorX(): number {
        // Pendulum anchor is always at horizontal center
        return this.width / 2
    }

    private getRandomRopeLength(): number {
        return this.minRopeLength + Math.random() * (this.maxRopeLength - this.minRopeLength)
    }

    private getRandomStartAngle(): number {
        // Start from either left or right side
        const side = Math.random() > 0.5 ? 1 : -1
        const angle = (Math.PI / 6) + Math.random() * (Math.PI / 4)
        return angle * side
    }

    private positionGoal(): void {
        // Goal spawns in a limited range above the abyss water surface
        // This ensures it's far enough from the starting anchor point at the top
        const padding = 60
        const abyssTop = this.boundaryBottom - 80  // Water surface level

        // Goal spawn range: from water surface up to 180px above it
        const GOAL_RANGE_ABOVE_WATER = 180
        const GOAL_MIN_DISTANCE_FROM_WATER = 50  // Buffer above water

        const maxY = abyssTop - GOAL_MIN_DISTANCE_FROM_WATER
        const minY = abyssTop - GOAL_RANGE_ABOVE_WATER

        const x = this.boundaryLeft + padding + Math.random() * (this.boundaryRight - this.boundaryLeft - padding * 2)
        const y = minY + Math.random() * (maxY - minY)

        // Fixed vertical radius, but horizontal width shrinks over rounds
        const baseRadius = 35  // Vertical size stays constant

        // Width scale: starts at 2.5 (wide), shrinks to 1.0 (circular) over ~15 rounds
        this.goalWidthScale = Math.max(1.0, 2.5 - this.roundNumber * 0.1)

        // Enable periodic movement after round 5
        if (this.roundNumber >= 5) {
            this.goalMoves = true
            this.goalMoveSpeed = 0.8 + Math.min(this.roundNumber - 5, 10) * 0.1
            this.goalMoveRange = 30 + Math.min(this.roundNumber - 5, 10) * 3
        } else {
            this.goalMoves = false
        }

        // Reset movement timer for periodic movement
        this.goalMoveTimer = 3 + Math.random() * 2  // Wait 3-5 seconds before moving
        this.goalMoveDuration = 0
        this.goalMoveActive = false

        this.goal.moveTo(x, y)
        this.goal.setRadius(baseRadius)

        // Position wormhole at same location with width scale
        this.wormhole.moveTo(x, y)
        this.wormhole.setRadius(baseRadius)
        this.wormhole.setWidthScale(this.goalWidthScale)

        // Clear and spawn portal pairs based on difficulty
        this.spawnPortalPairs()
    }

    private spawnPortalPairs(): void {
        // Clear existing portals
        for (const portal of this.portalPairs) {
            this.gameContainer.removeChild(portal.container)
            portal.destroy()
        }
        this.portalPairs = []

        // Add portals starting from round 5
        if (this.roundNumber < 5) return

        const portalCount = Math.min(Math.floor((this.roundNumber - 4) / 3), 2)  // Max 2 portal pairs
        const padding = 80
        const abyssTop = this.boundaryBottom - 80

        const colors: Array<'purple' | 'teal' | 'red'> = ['purple', 'teal', 'red']

        for (let i = 0; i < portalCount; i++) {
            const color = colors[i % colors.length]

            // Entrance on left/top side
            const entranceX = this.boundaryLeft + padding + Math.random() * (this.width * 0.3)
            const entranceY = this.boundaryTop + 100 + Math.random() * (abyssTop - this.boundaryTop - 200)

            // Exit on right/bottom side (strategic placement)
            const exitX = this.width - padding - Math.random() * (this.width * 0.3)
            const exitY = this.boundaryTop + 100 + Math.random() * (abyssTop - this.boundaryTop - 200)

            const portalPair = new PortalPair({
                entrance: {
                    x: entranceX,
                    y: entranceY,
                    radius: 35,
                },
                exit: {
                    x: exitX,
                    y: exitY,
                    radius: 35,
                },
                color,
            })

            this.portalPairs.push(portalPair)
            this.gameContainer.addChild(portalPair.container)
        }
    }

    private updateObstacles(): void {
        // Remove excess obstacles
        while (this.obstacles.length > this.obstacleCount) {
            const obstacle = this.obstacles.pop()!
            this.gameContainer.removeChild(obstacle.container)
            obstacle.destroy()
        }

        // Add new obstacles if needed
        while (this.obstacles.length < this.obstacleCount) {
            const obstacle = this.createRandomObstacle()
            this.obstacles.push(obstacle)
            this.gameContainer.addChild(obstacle.container)
        }

        // Reposition existing obstacles
        for (const obstacle of this.obstacles) {
            this.repositionObstacle(obstacle)
        }
    }

    private createRandomObstacle(): ObstacleWobble {
        const movements: ObstacleMovement[] = ['static', 'sway', 'vertical']
        const movement = movements[Math.floor(Math.random() * movements.length)]

        // Alternate between left and right walls
        const side: 'left' | 'right' = this.obstacles.length % 2 === 0 ? 'left' : 'right'

        return new ObstacleWobble({
            x: 0,
            y: 0,
            radius: 18,
            movement,
            speed: 0.8 + Math.random() * 0.8,
            range: 25 + Math.random() * 30,
            tentacleLength: 120 + Math.random() * 60,
            side,
            attackRange: 100 + Math.random() * 40,
        })
    }

    private repositionObstacle(obstacle: ObstacleWobble): void {
        // Position on walls - tentacles extend from left/right boundaries
        const minY = 120
        const maxY = this.height - 200  // Above the abyss

        // Get the side from obstacle
        const side = obstacle.side

        // Position on the wall
        const x = side === 'left' ? this.boundaryLeft : this.boundaryRight
        let y: number
        let attempts = 0
        const maxAttempts = 20

        do {
            y = minY + Math.random() * (maxY - minY)
            attempts++
        } while (
            attempts < maxAttempts &&
            (this.isNearGoal(x, y, 100) || this.isNearAnchor(x, y, 80))
        )

        obstacle.moveTo(x, y)
    }

    private isNearGoal(x: number, y: number, distance: number): boolean {
        const dx = x - this.goal.x
        const dy = y - this.goal.y
        return Math.sqrt(dx * dx + dy * dy) < distance
    }

    private isNearAnchor(x: number, y: number, distance: number): boolean {
        if (!this.wobble) return false
        const dx = x - this.wobble.physics.anchorX
        const dy = y - this.wobble.physics.anchorY
        return Math.sqrt(dx * dx + dy * dy) < distance
    }

    protected updateGame(deltaSeconds: number): void {
        // Update stage transition effect
        this.updateTransition(deltaSeconds)

        // Skip game updates during transition
        if (this.isTransitioning) return

        // Update anchor wobble (shakes rope to maintain momentum)
        this.anchorWobble.update(deltaSeconds)

        // Update abyss animation
        this.updateAbyss(deltaSeconds)

        // Update wobble
        if (this.wobble) {
            this.wobble.update(deltaSeconds)
            this.wobble.applyFadeAlpha()

            // Check for released state
            if (this.wobble.state === 'released') {
                this.checkCollisions()
                this.checkWallCollisions()
                // HP bar is now displayed directly on the wobble
            }

            // Check bottom boundary (falling into abyss) - instant death
            // Top boundary is now handled by checkWallCollisions() with bounce
            // IMPORTANT: Must check death conditions BEFORE handleRoundEnd check
            const abyssTop = this.boundaryBottom - 80
            if (this.wobble.state === 'released' && this.wobble.y > abyssTop) {
                // Start dramatic drowning sequence
                this.startDrowningSequence()
            }

            // Handle drowning animation completion
            // IMPORTANT: Must check BEFORE handleRoundEnd to set isWaitingForRetry flag first
            if (this.wobble.state === 'drowning') {
                this.updateDrowningEffects(deltaSeconds)
                if (this.wobble.isDrowningComplete()) {
                    this.wobble.markFailed()
                    this.handleDeath()
                }
            }

            // Handle pending result (wait for suction animation to complete)
            if (this.pendingResult && this.pendingResultTimer > 0) {
                this.pendingResultTimer -= deltaSeconds

                // Animate wobble getting sucked into the funnel
                if (this.wobble) {
                    const totalDuration = this.SUCTION_ANIMATION_DURATION
                    const elapsed = totalDuration - this.pendingResultTimer
                    const progress = Math.min(1, elapsed / totalDuration)

                    // Ease-in for acceleration effect (being pulled in faster)
                    const easeIn = progress * progress

                    // Spiral into the funnel center
                    const { startX, startY, targetX, targetY } = this.pendingResult

                    // Spiral: starts at 0, peaks in middle, ends at 0
                    const spiralIntensity = Math.sin(progress * Math.PI)
                    const spiralRadius = 12 * spiralIntensity
                    const spiralAngle = progress * Math.PI * 3  // 1.5 rotations
                    const spiralX = Math.cos(spiralAngle) * spiralRadius
                    const spiralY = Math.sin(spiralAngle) * spiralRadius * 0.35  // Flatten for perspective

                    // Move towards center + sink into funnel
                    const newX = startX + (targetX - startX) * easeIn + spiralX
                    const newY = startY + (targetY - startY) * easeIn + spiralY
                    const funnelDepth = this.wormhole.radius * 0.4 * easeIn  // Sink into funnel
                    this.wobble.container.position.set(newX, newY + funnelDepth)

                    // Scale down as it enters the funnel
                    const scale = Math.max(0, 1 - easeIn * 1.3)
                    this.wobble.container.scale.set(scale)

                    // Fade out in the last portion
                    if (progress > 0.5) {
                        const fadeProgress = (progress - 0.5) / 0.5
                        this.wobble.container.alpha = 1 - fadeProgress
                    }

                    // Gentle rotation as it spirals
                    this.wobble.container.rotation = spiralAngle * 0.3
                }

                if (this.pendingResultTimer <= 0) {
                    // Animation complete - show result
                    const { hpPercent, timeTaken, perfect } = this.pendingResult
                    this.showStageResult(0, hpPercent, timeTaken, perfect)
                    this.pendingResult = null

                    // Reset wobble transform for next round
                    if (this.wobble) {
                        this.wobble.container.rotation = 0
                        this.wobble.container.alpha = 1
                        this.wobble.container.scale.set(1)
                    }
                }
            }

            // Check if animation complete - handle round end (skip if waiting for retry or pending result)
            if (this.wobble.isAnimationComplete() && this.roundTransitionTime <= 0 && !this.isShowingResult && !this.isWaitingForRetry && !this.pendingResult) {
                this.handleRoundEnd()
            }

            // Update result display and counting animation
            if (this.isShowingResult) {
                const resultDelta = 1 / 60
                this.updateResultCounting(resultDelta)
                this.updateResultEffects(resultDelta)

                // Only start timing after counting is done
                if (this.resultPhase === 'done') {
                    this.resultDisplayTime += resultDelta
                    // Wait 1 second after grade reveal, then proceed
                    if (this.resultDisplayTime >= 1.0) {
                        this.hideStageResult()
                        this.roundTransitionTime = 0.3
                    }
                }
            }
        }

        // Update goal (old, hidden)
        this.goal.update(deltaSeconds)

        // Update wormhole proximity based on player distance
        if (this.wobble) {
            const dx = this.wobble.x - this.wormhole.x
            const dy = this.wobble.y - this.wormhole.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const normalizedDistance = distance / this.wormhole.radius
            this.wormhole.setProximity(normalizedDistance)
        }

        // Update wormhole
        this.wormhole.update(deltaSeconds)

        // Update portal pairs
        for (const portalPair of this.portalPairs) {
            portalPair.update(deltaSeconds)
        }

        // Move goal if enabled and update wobble's goal tracking
        if (this.goalMoves) {
            this.updateGoalMovement(deltaSeconds)
            // Update wobble's goal position for expression tracking
            if (this.wobble) {
                this.wobble.setGoalPosition(this.wormhole.x, this.wormhole.y)
            }
        }

        // Update obstacles and check proximity for attack
        for (const obstacle of this.obstacles) {
            obstacle.update(deltaSeconds)
            // Check if player is near - triggers attack behavior
            if (this.wobble && this.wobble.state === 'released') {
                const pos = this.wobble.getPosition()
                obstacle.checkProximity(pos.x, pos.y)
            }
        }

        // Update instruction pulse (Balatro-style glow)
        if (this.isWaitingForTap) {
            const pulse = 0.6 + Math.sin(Date.now() / 150) * 0.4
            this.instructionText.alpha = pulse
        }

        // Update custom HUD (hearts above player, corner info)
        this.updateCustomHUD()

        // Round transition
        if (this.roundTransitionTime > 0) {
            this.roundTransitionTime -= deltaSeconds
            if (this.roundTransitionTime <= 0) {
                this.startNewRound()
            }
        }
    }

    private updateGoalMovement(deltaSeconds: number): void {
        // Periodic movement: wait, then move for a duration, then stop
        if (!this.goalMoveActive) {
            // Waiting phase
            this.goalMoveTimer -= deltaSeconds
            if (this.goalMoveTimer <= 0) {
                // Start moving
                this.goalMoveActive = true
                this.goalMoveDuration = 2.5 + Math.random() * 1.5  // Move for 2.5-4 seconds
            }
        } else {
            // Moving phase
            this.goalMoveDuration -= deltaSeconds

            // Smooth oscillation while moving
            const time = Date.now() / 1000
            const baseX = (this.boundaryLeft + this.boundaryRight) / 2
            const newX = baseX + Math.sin(time * this.goalMoveSpeed) * this.goalMoveRange

            this.goal.moveTo(newX, this.goal.y)
            this.wormhole.moveTo(newX, this.wormhole.y)

            if (this.goalMoveDuration <= 0) {
                // Stop moving, wait again
                this.goalMoveActive = false
                this.goalMoveTimer = 4 + Math.random() * 3  // Wait 4-7 seconds
            }
        }
    }

    private checkCollisions(): void {
        if (!this.wobble || this.wobble.state !== 'released') return

        const pos = this.wobble.getPosition()

        // Check wormhole hit (new finish portal)
        const wormholeHit = this.wormhole.checkHit(pos.x, pos.y)
        if (wormholeHit.hit && !this.pendingResult) {
            this.wobble.markSuccess()
            this.wormhole.showHit(wormholeHit.perfect)

            // Show relief/success speech bubble
            if (wormholeHit.perfect) {
                const perfectPhrases = [
                    i18n.t('wobblediver.perfect.phrase1'),
                    i18n.t('wobblediver.perfect.phrase2'),
                    i18n.t('wobblediver.perfect.phrase3'),
                    i18n.t('wobblediver.perfect.phrase4'),
                    i18n.t('wobblediver.perfect.phrase5'),
                ]
                const phrase = perfectPhrases[Math.floor(Math.random() * perfectPhrases.length)]
                this.wobble.showSpeechBubble(phrase, 1.0)
            } else {
                const successPhrases = [
                    i18n.t('wobblediver.success.phrase1'),
                    i18n.t('wobblediver.success.phrase2'),
                    i18n.t('wobblediver.success.phrase3'),
                    i18n.t('wobblediver.success.phrase4'),
                    i18n.t('wobblediver.success.phrase5'),
                ]
                const phrase = successPhrases[Math.floor(Math.random() * successPhrases.length)]
                this.wobble.showSpeechBubble(phrase, 1.0)
            }

            // Get stats for grade calculation (score will be calculated in showStageResult)
            const hpPercent = this.wobble.getHpPercent()
            const timeTaken = Date.now() / 1000 - this.roundStartTime

            // Store pending result with position info for suction animation
            this.pendingResult = {
                hpPercent,
                timeTaken,
                perfect: wormholeHit.perfect,
                startX: pos.x,
                startY: pos.y,
                targetX: this.wormhole.x,
                targetY: this.wormhole.y,
            }
            this.pendingResultTimer = this.SUCTION_ANIMATION_DURATION
            return
        }

        // Check portal pair teleportation
        for (const portalPair of this.portalPairs) {
            const teleportResult = portalPair.checkTeleport(this.wobble, pos.x, pos.y)
            if (teleportResult && teleportResult.teleported) {
                // Teleport wobble to exit portal
                this.wobble.teleportTo(teleportResult.exitX, teleportResult.exitY)

                // Show teleport speech bubble
                const teleportPhrases = [
                    i18n.t('wobblediver.teleport.phrase1'),
                    i18n.t('wobblediver.teleport.phrase2'),
                    i18n.t('wobblediver.teleport.phrase3'),
                    i18n.t('wobblediver.teleport.phrase4'),
                ]
                const phrase = teleportPhrases[Math.floor(Math.random() * teleportPhrases.length)]
                this.wobble.showSpeechBubble(phrase, 0.8)

                return
            }
        }

        // Check obstacle collision - push player instead of instant fail
        for (const obstacle of this.obstacles) {
            if (obstacle.checkCollision(pos.x, pos.y) && obstacle.canBump()) {
                // Push player away from obstacle
                this.wobble.pushAwayFrom(obstacle.x, obstacle.y, 350)
                obstacle.showBump()

                // Show bump effect
                this.showObstacleBump(obstacle.x, obstacle.y)
                return
            }
        }
    }

    /**
     * Visual feedback when wobble bumps into obstacle
     */
    private showObstacleBump(x: number, y: number): void {
        // Create expanding ring effect
        const ring = new Graphics()
        ring.circle(x, y, 30)
        ring.stroke({ color: BALATRO.purple, width: 3, alpha: 0.8 })
        this.gameContainer.addChild(ring)

        // Animate ring expanding and fading
        let elapsed = 0
        const animate = () => {
            elapsed += 1 / 60
            const progress = elapsed / 0.3

            ring.clear()
            ring.circle(x, y, 30 + progress * 30)
            ring.stroke({ color: BALATRO.purple, width: 3, alpha: 0.8 * (1 - progress) })

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                this.gameContainer.removeChild(ring)
                ring.destroy()
            }
        }
        requestAnimationFrame(animate)
    }

    private handleRoundEnd(): void {
        // Failure case - no result shown, go to next round
        this.roundTransitionTime = 0.5
    }

    /**
     * Check if position is outside the game boundary
     */
    private isOutOfBoundary(x: number, y: number): boolean {
        return (
            x < this.boundaryLeft ||
            x > this.boundaryRight ||
            y < this.boundaryTop ||
            y > this.boundaryBottom
        )
    }

    /**
     * Check if Y position is outside top/bottom boundary (failure condition)
     */
    private isOutOfVerticalBoundary(y: number): boolean {
        return y < this.boundaryTop || y > this.boundaryBottom
    }

    // Pain phrases for wall bounces
    private getPainPhrases(): string[] {
        return [
            i18n.t('wobblediver.pain.phrase1'),
            i18n.t('wobblediver.pain.phrase2'),
            i18n.t('wobblediver.pain.phrase3'),
            i18n.t('wobblediver.pain.phrase4'),
            i18n.t('wobblediver.pain.phrase5'),
            i18n.t('wobblediver.pain.phrase6'),
        ]
    }

    /**
     * Check for wall collisions and handle bouncing
     */
    private checkWallCollisions(): void {
        if (!this.wobble || this.wobble.state !== 'released') return

        const pos = this.wobble.getPosition()
        const wobbleRadius = 15  // Approximate wobble radius

        // Check left wall
        if (pos.x < this.boundaryLeft + wobbleRadius) {
            const survived = this.wobble.bounceOffWall('left', this.boundaryLeft)
            this.showWallBounce('left')
            this.showPainBubble()

            if (!survived) {
                // HP depleted
                this.wobble.markFailed()
                this.handleDeath()
            }
        }

        // Check right wall
        if (pos.x > this.boundaryRight - wobbleRadius) {
            const survived = this.wobble.bounceOffWall('right', this.boundaryRight)
            this.showWallBounce('right')
            this.showPainBubble()

            if (!survived) {
                // HP depleted
                this.wobble.markFailed()
                this.handleDeath()
            }
        }

        // Check top wall (ceiling)
        if (pos.y < this.boundaryTop + wobbleRadius) {
            const survived = this.wobble.bounceOffWall('top', this.boundaryTop)
            this.showWallBounce('top')
            this.showPainBubble()

            if (!survived) {
                // HP depleted
                this.wobble.markFailed()
                this.handleDeath()
            }
        }
    }

    /**
     * Show a random pain phrase in speech bubble
     */
    private showPainBubble(): void {
        if (!this.wobble) return
        const painPhrases = this.getPainPhrases()
        const phrase = painPhrases[Math.floor(Math.random() * painPhrases.length)]
        this.wobble.showSpeechBubble(phrase, 0.8)
    }

    /**
     * Visual feedback when wobble bounces off wall
     */
    private showWallBounce(side: 'left' | 'right' | 'top'): void {
        // Flash the wall
        const g = new Graphics()
        if (side === 'top') {
            g.rect(this.boundaryLeft, this.boundaryTop, this.boundaryRight - this.boundaryLeft, 8)
        } else {
            const wallX = side === 'left' ? this.boundaryLeft : this.boundaryRight - 8
            g.rect(wallX, this.boundaryTop, 8, this.boundaryBottom - this.boundaryTop)
        }
        g.fill({ color: BALATRO.red, alpha: 0.8 })
        this.gameContainer.addChild(g)

        // Animate flash out
        let elapsed = 0
        const animate = () => {
            elapsed += 1 / 60
            const progress = elapsed / 0.2

            g.alpha = 1 - progress

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                this.gameContainer.removeChild(g)
                g.destroy()
            }
        }
        requestAnimationFrame(animate)
    }

    /**
     * Handle player death - reduce life, then retry or game over
     */
    private handleDeath(): void {
        // Reduce life (no visual feedback - the drowning/death animation is enough)
        this.scoreSystem.recordMiss()
        this.lifeSystem.loseLife()

        // Check if we have lives remaining (after losing one)
        if (this.lifeSystem.lives > 0) {
            // Set flag to prevent handleRoundEnd from triggering startNewRound
            this.isWaitingForRetry = true

            // Wait for death animation, then restart current stage
            setTimeout(() => {
                this.restartCurrentStage()
            }, 1200)
        }
        // If lives == 0, LifeSystem will trigger game over automatically
    }

    /**
     * Show "DIE" feedback when wobble dies
     * Minimal Balatro-style animation (simple fade, no scale)
     */
    private showOutOfBounds(): void {
        // Flash the boundary briefly
        this.boundaryGraphics.alpha = 1

        // Show DIE text - simple fade only, no scale animation
        this.outText.alpha = 1
        this.outText.scale.set(1)

        // Minimal animation - just fade
        let elapsed = 0
        const duration = 1.0  // Longer duration for death screen
        const animate = () => {
            elapsed += 1 / 60
            const progress = Math.min(elapsed / duration, 1)

            // Simple fade out after brief hold
            if (progress > 0.5) {
                const fadeProgress = (progress - 0.5) / 0.5
                this.outText.alpha = 1 - fadeProgress
            }

            // Fade boundary back
            this.boundaryGraphics.alpha = 1 - progress * 0.4

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                this.outText.alpha = 0
                this.boundaryGraphics.alpha = 1
            }
        }
        requestAnimationFrame(animate)
    }

    protected animate(ticker: Ticker): void {
        const deltaSeconds = ticker.deltaMS / 1000

        // Update intro if showing
        if (this.isShowingIntro && this.intro) {
            this.intro.update(deltaSeconds)
        }
    }

    protected onDifficultyChange(config: DifficultyConfig, previousPhase: DifficultyPhase): void {
        // Note: goalMoves and goalWidthScale are now controlled by round number in positionGoal()
        switch (config.phase) {
            case 'easy':
                // Full trajectory visibility
                this.obstacleCount = 0
                this.minRopeLength = 120
                this.maxRopeLength = 180
                this.trajectoryMode = 'always'
                break

            case 'medium':
                // Trajectory visible for first 2 seconds only
                this.obstacleCount = 1
                this.minRopeLength = 100
                this.maxRopeLength = 200
                this.trajectoryMode = 'timed'
                this.trajectoryDuration = 2.0
                break

            case 'hard':
                // Trajectory flickers on/off
                this.obstacleCount = 2
                this.minRopeLength = 80
                this.maxRopeLength = 220
                this.trajectoryMode = 'flicker'
                this.trajectoryFlickerInterval = 0.4
                this.trajectoryFlickerOnRatio = 0.4  // 40% visible
                break

            case 'insane':
                // Trajectory barely visible - quick flashes
                this.obstacleCount = 3
                this.minRopeLength = 60
                this.maxRopeLength = 250
                this.trajectoryMode = 'flicker'
                this.trajectoryFlickerInterval = 0.6
                this.trajectoryFlickerOnRatio = 0.15  // 15% visible (brief flashes)
                break
        }
    }

    protected onGameStart(): void {
        // Always show intro before starting
        if (this.intro) {
            this.isShowingIntro = true
            this.introContainer.visible = true
            this.intro.show()
        } else {
            this.startNewRound()
        }
    }

    protected onGameReset(): void {
        // Life system resets to default 3 lives via base class reset()
        // Game over → retry starts from stage 1

        // Clear wobble
        if (this.wobble) {
            this.gameContainer.removeChild(this.wobble.container)
            this.wobble.destroy()
            this.wobble = null
        }

        // Clear obstacles
        for (const obstacle of this.obstacles) {
            this.gameContainer.removeChild(obstacle.container)
            obstacle.destroy()
        }
        this.obstacles = []

        // Reset state
        this.roundNumber = 0
        this.isWaitingForTap = false
        this.isWaitingForRetry = false
        this.roundTransitionTime = 0
        this.roundStartTime = 0

        // Reset difficulty params
        this.goalMoves = false
        this.goalWidthScale = 2.5
        this.goalMoveTimer = 0
        this.goalMoveDuration = 0
        this.goalMoveActive = false
        this.obstacleCount = 0
        this.minRopeLength = 100
        this.maxRopeLength = 200

        // Reset goal position
        this.goal.moveTo(this.width / 2, this.height - 200)
        this.goal.setRadius(35)
        this.wormhole.setWidthScale(2.5)

        // Hide instruction and HP bar
        this.instructionText.alpha = 0
        this.hpBarContainer.alpha = 0

        // Reset drowning state
        this.isDrowningActive = false
        this.drowningBubbles = []
        this.surfaceRipples = []
        this.abyssBloodLevel = 0

        // Reset transition state
        this.isTransitioning = false
        this.transitionTime = 0
        this.transitionContainer.visible = false
    }

    public destroy(): void {
        // Cleanup wobble
        if (this.wobble) {
            this.wobble.destroy()
        }

        // Cleanup anchor wobble
        this.anchorWobble.destroy()

        // Cleanup obstacles
        for (const obstacle of this.obstacles) {
            obstacle.destroy()
        }

        // Cleanup goal
        this.goal.destroy()

        // Cleanup wormhole
        this.wormhole.destroy()

        // Cleanup portal pairs
        for (const portal of this.portalPairs) {
            portal.destroy()
        }

        // Cleanup intro
        if (this.intro) {
            this.intro.hide()
            this.intro = null
        }

        super.destroy()
    }

    /**
     * Get Wobblediver-specific game data for records
     */
    public override getGameData(): Record<string, unknown> {
        return {
            ...super.getGameData(),
            depth: this.roundNumber,
            rank: this.resultGrade.letter,
            isPerfect: this.resultGrade.letter === 'S',
        }
    }

    protected onResize(): void {
        // Update intro dimensions
        if (this.intro) {
            this.intro.resize(this.width, this.height)
        }
    }
}
