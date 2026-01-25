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
import { StageGenerator } from './StageGenerator'
import { AbyssTentacle } from './AbyssTentacle'
import {
    StageConfig,
    AnchorPersonalityConfig,
    ANCHOR_PERSONALITIES,
    GAME_WIDTH,
} from './StageConfig'
import { musicManager, AudioBands } from '@/services/MusicManager'
import i18n from '@/i18n'
import { useRunStore } from '@/stores/runStore'
import { MapNode, RunNodeType } from './run/RunMapTypes'
import { RunMapDisplay } from './run/RunMapDisplay'
import { PerkSelectionUI } from './run/PerkSelectionUI'
import {
    PerkEffect,
    PerkDefinition,
    PerkInstance,
    getPerkById,
    getCombinedPerkEffects,
    selectRandomPerks,
    PERK_DEFINITIONS,
} from './run/PerkConfig'

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
    openness: number // 0 = closed, 1 = fully open
    targetOpenness: number
    teethCount: number
}

// Splash effect
interface AbyssSplash {
    x: number
    y: number
    progress: number // 0 to 1
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
    intensity: number // Glow intensity
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
    declare private wobble: SwingingWobble | null
    declare private goal: Goal // Kept for backward compatibility
    declare private wormhole: Wormhole // New wormhole finish portal
    declare private portalPairs: PortalPair[] // Teleportation portals
    declare private obstacles: ObstacleWobble[]
    declare private anchorWobble: AnchorWobble
    declare private abyssTentacles: AbyssTentacle[] // Tentacles that pull the wormhole

    // Stage generation
    declare private stageGenerator: StageGenerator
    private currentStageConfig: StageConfig | null = null
    private gameSeed: number = 0

    // Run mode state
    private runMode: boolean = false
    private runNodeId: string | null = null
    private runNodeType: RunNodeType | null = null
    private runMapDisplay: RunMapDisplay | null = null
    private isShowingRunMap: boolean = false
    private runHpLostThisStage: number = 0

    // Perk system state
    private perkSelectionUI: PerkSelectionUI | null = null
    private isPerkSelectionActive: boolean = false
    private currentPerkEffects: PerkEffect = {}
    private phaseUsesThisStage: number = 0 // Track phase shift uses per stage
    private doubleJumpAvailable: boolean = false // Reset per release
    private slowMoActive: boolean = false
    private slowMoTimer: number = 0

    // Shield system (from Barrier perk)
    private currentShield: number = 0
    private maxShield: number = 0
    private shieldGraphics: Graphics | null = null
    private shieldAnimTime: number = 0

    // Slow motion visual overlay (from Slow Motion perk)
    private slowMoGraphics: Graphics | null = null

    // Active perk icons display
    private perkIconsContainer: Container | null = null
    private perkIconTexts: Text[] = []

    // Gravity visual effect (from Featherfall/Heavy Drop perks)
    private gravityParticles: {
        x: number
        y: number
        vx: number
        vy: number
        size: number
        alpha: number
        life: number
    }[] = []
    private gravityEffectGraphics: Graphics | null = null
    private currentGravityMultiplier: number = 1.0

    // Local perk state (for endless mode - run mode uses runStore)
    private localPerks: PerkInstance[] = []
    private localExtraLives: number = 0
    private localPerkSeed: number = 0

    // Pending timeout IDs for cleanup
    private pendingTimeoutIds: number[] = []

    // Visual elements
    declare private backgroundGraphics: Graphics
    declare private boundaryGraphics: Graphics
    declare private outerAbyssGraphics: Graphics // Fill area outside game boundaries
    declare private wallTentaclesGraphics: Graphics // Animated boundary tentacles
    private wallTentacleTime = 0 // Animation time for wall tentacles
    private wallTentacleTips: { x: number; y: number; side: 'left' | 'right' }[] = [] // For collision
    private wallTentacleDamageCooldown = 0 // Cooldown to prevent rapid damage
    private wallTentacleReachTarget: { x: number; y: number } | null = null // Player pos when close
    declare private instructionText: Text
    declare private outText: Text

    // Animated background (Balatro-style)
    declare private abyssBackgroundSprite: Sprite
    declare private abyssBackgroundFilter: BalatroFilter
    private abyssBackgroundTime = 0

    // Abyss danger zone
    declare private abyssBackContainer: Container // Behind wobble (eyes, particles)
    declare private abyssFrontContainer: Container // In front of wobble (fluid surface)
    declare private abyssBackGraphics: Graphics
    declare private abyssFrontGraphics: Graphics
    declare private abyssFluidSprite: Sprite // Sprite for shader-based fluid
    declare private abyssFluidFilter: AbyssFluidFilter
    declare private abyssEyes: AbyssEye[]
    declare private abyssParticles: AbyssParticle[]
    declare private abyssBubbles: AbyssBubble[]
    declare private abyssMouth: AbyssMouth
    private abyssTime = 0
    private abyssSurfacePoints: number[] = [] // Y offsets for wavy surface
    private abyssBloodLevel = 0 // 0 = normal, 1 = fully red
    private abyssSplashEffects: AbyssSplash[] = []
    private drowningBubbles: DrowningBubble[] = [] // Initialized as empty array
    private surfaceRipples: SurfaceRipple[] = [] // Initialized as empty array
    private drowningX = 0 // Where wobble drowned
    private isDrowningActive = false

    // Game boundary
    declare private boundaryPadding: number
    declare private boundaryLeft: number
    declare private boundaryRight: number
    declare private boundaryTop: number
    declare private boundaryBottom: number
    declare private gameOffsetX: number // Offset to center fixed-width game area
    declare private effectiveGameWidth: number // Actual game width (may be less than GAME_WIDTH on narrow screens)

    // Game state
    declare private roundNumber: number
    declare private isWaitingForTap: boolean
    declare private roundTransitionTime: number
    declare private roundStartTime: number // Time tracking for scoring
    private isWaitingForRetry = false // True when waiting to restart after death

    // HP bar (legacy - now on wobble)
    declare private hpBarContainer: Container
    declare private hpBarBackground: Graphics
    declare private hpBarFill: Graphics

    // Stage result popup
    declare private stageResultContainer: Container
    declare private stageResultGraphics: Graphics
    declare private stageResultText: Text
    declare private stageGradeText: Text
    declare private stageScoreText: Text
    declare private stageHpLabelText: Text
    declare private stageHpValueText: Text
    declare private stageTimeLabelText: Text
    declare private stageTimeValueText: Text
    declare private stageTotalLabelText: Text
    declare private stageTotalValueText: Text
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
    private readonly SUCTION_ANIMATION_DURATION = 0.7 // Slightly longer than wormhole's suckDuration

    // Result screen abyss effects
    declare private resultEffectContainer: Container
    declare private resultEffectGraphics: Graphics
    private resultEyes: ResultEye[] = []
    private resultTentacles: ResultTentacle[] = []
    private resultEffectTime = 0
    private resultVignetteAlpha = 0

    // Difficulty parameters (wormhole movement now controlled by abyss tentacles)
    declare private goalWidthScale: number // Wormhole target width (set from config)
    private currentWormholeScale = 2.5 // Current wormhole scale (shrinks over time)
    declare private obstacleCount: number
    declare private minRopeLength: number
    declare private maxRopeLength: number

    // Trajectory visibility settings (per difficulty)
    declare private trajectoryMode: 'always' | 'timed' | 'flicker' | 'hidden'
    declare private trajectoryDuration: number
    declare private trajectoryFlickerInterval: number
    declare private trajectoryFlickerOnRatio: number

    // Intro system
    declare private introContainer: Container
    declare private intro: WobblediverIntro | null
    private isShowingIntro = false

    // Stage transition effect
    declare private transitionContainer: Container
    declare private transitionGraphics: Graphics
    declare private transitionStageText: Text
    declare private transitionSubText: Text
    declare private transitionHintText: Text // Difficulty hint messages
    declare private transitionTapText: Text // Tap to start prompt
    private isTransitioning = false
    private transitionTime = 0
    private transitionAnimTime = 0 // Separate time for animations (always advances)
    private transitionDuration = 3.2 // Total transition time (close: 0.5s, hold phase, open: 0.7s)
    private transitionWaitingForTap = false // Waiting for user tap to close
    private transitionTentacles: {
        x: number
        y: number
        angle: number
        length: number
        phase: number
    }[] = []
    private transitionEyes: {
        x: number
        y: number
        size: number
        openness: number
        targetOpenness: number
        blinkTimer: number
        nextBlink: number
        phase: number // For unique animation offset
    }[] = []
    private transitionDepthParticles: {
        x: number
        y: number
        size: number
        speed: number
        alpha: number
    }[] = []

    // Custom in-game HUD (replaces default HUD)
    declare private customHudContainer: Container
    declare private playerHeartsGraphics: Graphics // Hearts above player
    declare private cornerHudGraphics: Graphics // Stage/time/score in corner
    declare private stageText: Text
    declare private timeText: Text
    declare private cornerScoreText: Text
    private customHudLives = 3 // Track lives for heart display

    constructor(app: Application, callbacks?: MiniGameCallbacks) {
        super(app, callbacks)
    }

    protected setupGame(): void {
        // Use default 3 lives - death restarts current stage, game over when all lives lost
        // (LifeSystem uses LIFE_CONFIG defaults: 3 lives)

        // Initialize stage generator with a new seed
        this.stageGenerator = new StageGenerator()
        this.gameSeed = this.stageGenerator.getSeed()
        this.currentStageConfig = null

        // Initialize state
        this.obstacles = []
        this.abyssTentacles = []
        this.wobble = null
        this.roundNumber = 0
        this.isWaitingForTap = false
        this.roundTransitionTime = 0
        this.roundStartTime = 0

        // Initialize local perk state (for endless mode)
        this.localPerks = []
        this.localExtraLives = 0
        this.localPerkSeed = Date.now()
        this.currentPerkEffects = {}

        // Define game boundary - use fixed width centered, leave space for banner ad at bottom
        // On narrow screens (like Galaxy Flip folded), use full screen width instead
        this.effectiveGameWidth = Math.min(this.width, GAME_WIDTH)
        this.gameOffsetX = Math.max(0, (this.width - this.effectiveGameWidth) / 2)
        this.boundaryPadding = 0 // No side padding within game area
        this.boundaryLeft = this.gameOffsetX
        this.boundaryRight = this.gameOffsetX + this.effectiveGameWidth
        this.boundaryTop = 0 // Start from top
        this.boundaryBottom = this.height - 60 // Leave 60px for banner ad

        // Difficulty defaults (wormhole movement now controlled by abyss tentacles)
        this.goalWidthScale = 2.5 // Start with wide wormhole
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
        this.updateDepthColors(1) // Initialize with depth 1 colors
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
        this.setupPerkSelection()

        // Hide default HUD - we use custom in-game HUD
        this.hud.setVisible(false)
        this.setupCustomHUD()

        // Apply abyss theme to game over screen
        this.resultScreen.setTheme('abyss')
    }

    private setupPerkSelection(): void {
        // Create perk selection UI (will be shown after stage completion in run mode)
        this.perkSelectionUI = new PerkSelectionUI({
            width: this.width,
            height: this.height,
            onPerkSelected: (perkId: string) => {
                this.onPerkSelected(perkId)
            },
        })
        // Add to main container to ensure it's on top of everything
        this.container.addChild(this.perkSelectionUI.container)
    }

    private onPerkSelected(perkId: string): void {
        const perkDef = getPerkById(perkId)
        if (!perkDef) return

        if (this.runMode) {
            // Run mode: use runStore
            const runState = useRunStore.getState()
            const success = runState.selectPerk(perkId)

            if (success) {
                this.currentPerkEffects = runState.getPerkEffects()

                if (runState.activeRun) {
                    const extraLives = runState.activeRun.extraLives
                    const totalLives = 3 + extraLives
                    if (this.lifeSystem.lives < totalLives) {
                        this.lifeSystem.configure(totalLives, totalLives)
                        this.customHudLives = totalLives
                    }
                }
            }

            this.hidePerkSelection()
            this.showRunMap()
        } else {
            // Endless mode: use local perk state
            const existingIndex = this.localPerks.findIndex((p) => p.perkId === perkId)

            if (existingIndex >= 0) {
                // Increment stacks
                if (this.localPerks[existingIndex].stacks < perkDef.maxStacks) {
                    this.localPerks[existingIndex].stacks++
                }
            } else {
                // Add new perk
                this.localPerks.push({
                    perkId,
                    stacks: 1,
                    acquiredAtDepth: this.roundNumber,
                })
            }

            // Update effects
            this.currentPerkEffects = getCombinedPerkEffects(this.localPerks)

            // Apply extra lives
            if (perkDef.effect.extraLives) {
                this.localExtraLives += perkDef.effect.extraLives
                const totalLives = 3 + this.localExtraLives
                this.lifeSystem.configure(
                    totalLives,
                    this.lifeSystem.lives + perkDef.effect.extraLives
                )
                this.customHudLives = this.lifeSystem.lives
            }

            this.hidePerkSelection()
            // In endless mode, start next round after perk selection
            this.startNewRound()
        }
    }

    private showPerkSelection(): void {
        // Lazy initialization of perk selection UI
        if (!this.perkSelectionUI) {
            console.log('[Wobblediver] Creating perkSelectionUI lazily')
            this.perkSelectionUI = new PerkSelectionUI({
                width: this.width,
                height: this.height,
                onPerkSelected: (perkId: string) => {
                    this.onPerkSelected(perkId)
                },
            })
            // Add to main container (not uiContainer) to ensure it's on top of everything
            this.container.addChild(this.perkSelectionUI.container)
        }

        let perkOptions: PerkDefinition[]

        if (this.runMode) {
            // Run mode: get perks from runStore
            const runState = useRunStore.getState()
            perkOptions = runState.getPerkOptions()

            if (perkOptions.length === 0) {
                this.showRunMap()
                return
            }
        } else {
            // Endless mode: generate perks locally
            this.localPerkSeed += this.roundNumber * 1000
            perkOptions = selectRandomPerks(this.localPerks, this.localPerkSeed, 3)

            // Fallback: if random selection fails, use first 3 common perks
            if (perkOptions.length === 0) {
                console.warn('[Wobblediver] selectRandomPerks returned empty, using fallback')
                perkOptions = PERK_DEFINITIONS.filter((p) => p.rarity === 'common').slice(0, 3)
            }

            // If still no perks (shouldn't happen), skip perk selection
            if (perkOptions.length === 0) {
                console.warn('[Wobblediver] No perks available, skipping perk selection')
                this.startNewRound()
                return
            }
        }

        console.log('[Wobblediver] Showing perk selection with', perkOptions.length, 'perks')
        this.isPerkSelectionActive = true

        // Set game phase to 'playing' so updateGame() is called
        // This allows the perk selection UI to animate (cards start with alpha=0)
        this.gamePhase = 'playing'

        // Ensure perk selection UI is on top of everything
        if (this.perkSelectionUI.container.parent) {
            this.perkSelectionUI.container.parent.removeChild(this.perkSelectionUI.container)
        }
        this.container.addChild(this.perkSelectionUI.container)

        this.perkSelectionUI.show(perkOptions)
    }

    private hidePerkSelection(): void {
        this.isPerkSelectionActive = false
        if (this.perkSelectionUI) {
            this.perkSelectionUI.hide()
        }
    }

    /**
     * Load and apply perk effects at the start of a stage
     */
    private applyPerkEffectsForStage(): void {
        if (this.runMode) {
            const runState = useRunStore.getState()
            this.currentPerkEffects = runState.getPerkEffects()
        } else {
            // Endless mode: use local perks
            this.currentPerkEffects = getCombinedPerkEffects(this.localPerks)
        }

        // Reset per-stage perk state
        this.phaseUsesThisStage = this.currentPerkEffects.phaseUses || 0
        this.doubleJumpAvailable = false
        this.slowMoActive = false
        this.slowMoTimer = 0

        // Refill shield to max at stage start
        this.maxShield = this.currentPerkEffects.shieldAmount || 0
        this.currentShield = this.maxShield

        // Apply trajectory visibility perk
        if (this.currentPerkEffects.trajectoryAlwaysVisible) {
            this.trajectoryMode = 'always'
        }

        // Apply wormhole size perk
        if (this.currentPerkEffects.wormholeSizeMultiplier && this.wormhole) {
            const baseScale = this.currentWormholeScale
            const multiplier = this.currentPerkEffects.wormholeSizeMultiplier
            this.wormhole.setWidthScale(baseScale * multiplier)
        }

        // Update perk icons display
        this.updatePerkIconsDisplay()
    }

    private setupIntro(): void {
        // Create intro container (on top of everything)
        this.introContainer = new Container()
        this.introContainer.visible = false
        this.container.addChild(this.introContainer)

        // Create intro instance
        this.intro = new WobblediverIntro(this.introContainer, this.width, this.height, {
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
        })
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

        // Score text (top-left corner, below time)
        this.cornerScoreText = new Text({
            text: '0',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: ABYSS.gold,
            }),
        })
        this.cornerScoreText.anchor.set(0, 0) // Left-aligned
        this.cornerScoreText.position.set(24, 50)
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

        // Update jellyfish patience based on lives
        this.anchorWobble.setPatience(this.lifeSystem.lives, this.lifeSystem.maxLives)

        // Draw patience orbs above jellyfish
        this.drawPlayerHearts()
    }

    private drawPlayerHearts(): void {
        const g = this.playerHeartsGraphics
        g.clear()

        // Always show patience orbs (jellyfish's patience indicator)
        this.drawPatienceOrbs(g)
    }

    /**
     * Draw glowing orbs representing jellyfish's patience
     * Color changes based on jellyfish's mood (patience level)
     */
    private drawPatienceOrbs(g: Graphics): void {
        const maxLives = this.lifeSystem.maxLives
        const currentLives = this.customHudLives

        // Position above the jellyfish (anchorWobble is at y=100)
        const centerX = (this.boundaryLeft + this.boundaryRight) / 2
        const orbY = 55 // Above jellyfish

        const orbSize = 8
        const orbGap = 14
        const totalWidth = maxLives * orbGap - orbGap + orbSize
        const startX = centerX - totalWidth / 2

        // Get current color from jellyfish (changes with patience)
        const jellyfishColor = this.anchorWobble.getColor()

        // Calculate lighter version for glow
        const r = (jellyfishColor >> 16) & 0xff
        const gr = (jellyfishColor >> 8) & 0xff
        const b = jellyfishColor & 0xff
        const lighterColor =
            (Math.min(255, r + 60) << 16) | (Math.min(255, gr + 60) << 8) | Math.min(255, b + 60)
        const coreColor =
            (Math.min(255, r + 100) << 16) | (Math.min(255, gr + 100) << 8) | Math.min(255, b + 100)

        // Animated time for glow effect
        const time = performance.now() / 1000

        for (let i = 0; i < maxLives; i++) {
            const x = startX + i * orbGap
            const filled = i < currentLives

            if (filled) {
                // Glowing orb - pulsing bioluminescent effect
                const pulse = 0.8 + Math.sin(time * 3 + i * 0.5) * 0.2
                const glowSize = orbSize + 4 + Math.sin(time * 2 + i) * 2

                // Outer glow (jellyfish color)
                g.circle(x, orbY, glowSize)
                g.fill({ color: jellyfishColor, alpha: 0.2 * pulse })

                // Middle glow
                g.circle(x, orbY, orbSize + 2)
                g.fill({ color: lighterColor, alpha: 0.4 * pulse })

                // Core orb
                g.circle(x, orbY, orbSize)
                g.fill({ color: coreColor, alpha: 0.9 })

                // Inner bright spot
                g.circle(x - 2, orbY - 2, orbSize * 0.4)
                g.fill({ color: 0xffffff, alpha: 0.7 })
            } else {
                // Empty orb - dim and hollow
                g.circle(x, orbY, orbSize)
                g.fill({ color: 0x1a1025, alpha: 0.5 })
                g.circle(x, orbY, orbSize)
                g.stroke({ color: 0x3a2a4a, width: 1.5, alpha: 0.4 })
            }
        }
    }

    private setupAnchorWobble(): void {
        // Center anchor in game area (not screen)
        const anchorX = this.gameOffsetX + this.effectiveGameWidth / 2
        const anchorY = 100 // Fixed position from top (below hearts HUD)

        this.anchorWobble = new AnchorWobble(anchorX, anchorY)
        this.gameContainer.addChild(this.anchorWobble.container)

        // Connect switch press to add energy
        this.anchorWobble.onPress = () => {
            if (this.wobble && this.wobble.state === 'swinging') {
                this.wobble.addEnergy(0.8) // Add angular velocity
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
            color1: [0.08, 0.04, 0.15, 1.0], // Deep purple-black
            color2: [0.05, 0.15, 0.18, 1.0], // Dark teal
            color3: [0.02, 0.02, 0.05, 1.0], // Near black
            spinSpeed: 3.0, // Slower, more ominous
            contrast: 2.5,
            lighting: 0.15, // Dim
            spinAmount: 0.3,
            pixelFilter: 600.0, // Less pixelated
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
        const fluidHeight = this.height - fluidSurfaceY + 20 // Extend beyond screen bottom
        const fluidWidth = this.boundaryRight - this.boundaryLeft

        // Create a white sprite as base for the filter
        this.abyssFluidSprite = new Sprite(Texture.WHITE)
        this.abyssFluidSprite.width = fluidWidth
        this.abyssFluidSprite.height = fluidHeight
        this.abyssFluidSprite.position.set(this.boundaryLeft, fluidSurfaceY)

        // Create and apply the filter
        // surfaceY = 0 means surface at the very top of the sprite
        this.abyssFluidFilter = new AbyssFluidFilter({
            surfaceY: 0.0, // Surface at the top of the sprite
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
        const eyeCount = 4 + Math.floor(Math.random() * 3) // 4-6 eyes
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

    /**
     * Update colors based on current depth
     * Creates a gradual transition from teal shallows to crimson depths
     */
    private updateDepthColors(depth: number): void {
        // Define color palettes for different depth ranges
        // Each palette: [background colors, fluid colors]
        // Background: color1 (primary), color2 (secondary), color3 (dark)
        // Fluid: colorDeep, colorMid, colorSurface

        // Calculate depth factor (0 = shallow, 1 = deepest)
        const maxDepth = 15
        const depthFactor = Math.min(1, (depth - 1) / (maxDepth - 1))

        // Background colors transition: Teal -> Purple -> Crimson -> Near Black
        // Using smooth interpolation through multiple color stops
        let bgColor1: [number, number, number, number]
        let bgColor2: [number, number, number, number]
        let bgColor3: [number, number, number, number]

        // Fluid colors transition similarly
        let fluidDeep: [number, number, number, number]
        let fluidMid: [number, number, number, number]
        let fluidSurface: [number, number, number, number]

        if (depthFactor < 0.25) {
            // Depth 1-4: Teal/Cyan zone (relatively bright, inviting)
            const t = depthFactor / 0.25
            bgColor1 = [
                0.05 + t * 0.03, // R: 0.05 -> 0.08
                0.15 - t * 0.05, // G: 0.15 -> 0.10
                0.2 - t * 0.02, // B: 0.20 -> 0.18
                1.0,
            ]
            bgColor2 = [0.08 + t * 0.02, 0.18 - t * 0.06, 0.22 - t * 0.04, 1.0]
            bgColor3 = [0.02, 0.04, 0.06, 1.0]

            fluidDeep = [0.15, 0.25 - t * 0.05, 0.3, 1.0]
            fluidMid = [0.2, 0.35 - t * 0.05, 0.4, 1.0]
            fluidSurface = [0.3, 0.5 - t * 0.08, 0.55, 1.0]
        } else if (depthFactor < 0.5) {
            // Depth 5-8: Purple transition zone
            const t = (depthFactor - 0.25) / 0.25
            bgColor1 = [
                0.08 + t * 0.04, // R: 0.08 -> 0.12
                0.1 - t * 0.04, // G: 0.10 -> 0.06
                0.18 - t * 0.03, // B: 0.18 -> 0.15
                1.0,
            ]
            bgColor2 = [0.1 + t * 0.05, 0.12 - t * 0.05, 0.18 - t * 0.02, 1.0]
            bgColor3 = [0.02, 0.02 + t * 0.01, 0.05, 1.0]

            fluidDeep = [0.24 + t * 0.06, 0.1, 0.31 - t * 0.05, 1.0]
            fluidMid = [0.36 + t * 0.04, 0.15, 0.4 - t * 0.05, 1.0]
            fluidSurface = [0.48 + t * 0.02, 0.22, 0.5 - t * 0.05, 1.0]
        } else if (depthFactor < 0.75) {
            // Depth 9-12: Dark violet/maroon zone
            const t = (depthFactor - 0.5) / 0.25
            bgColor1 = [
                0.12 + t * 0.06, // R: 0.12 -> 0.18
                0.06 - t * 0.03, // G: 0.06 -> 0.03
                0.15 - t * 0.08, // B: 0.15 -> 0.07
                1.0,
            ]
            bgColor2 = [0.15 + t * 0.08, 0.07 - t * 0.04, 0.16 - t * 0.1, 1.0]
            bgColor3 = [0.03, 0.02, 0.04, 1.0]

            fluidDeep = [0.3 + t * 0.08, 0.08, 0.2 - t * 0.1, 1.0]
            fluidMid = [0.4 + t * 0.1, 0.12, 0.28 - t * 0.12, 1.0]
            fluidSurface = [0.5 + t * 0.1, 0.18, 0.35 - t * 0.15, 1.0]
        } else {
            // Depth 13+: Near-black crimson abyss
            const t = (depthFactor - 0.75) / 0.25
            bgColor1 = [
                0.18 - t * 0.08, // R: darker
                0.03 - t * 0.02,
                0.07 - t * 0.04,
                1.0,
            ]
            bgColor2 = [0.23 - t * 0.1, 0.03 - t * 0.02, 0.06 - t * 0.03, 1.0]
            bgColor3 = [0.02 - t * 0.01, 0.01, 0.02, 1.0]

            fluidDeep = [0.38 - t * 0.15, 0.06, 0.1, 1.0]
            fluidMid = [0.5 - t * 0.15, 0.1, 0.15, 1.0]
            fluidSurface = [0.6 - t * 0.15, 0.15, 0.2, 1.0]
        }

        // Apply background colors to Balatro filter
        if (this.abyssBackgroundFilter) {
            this.abyssBackgroundFilter.resources.balatroUniforms.uniforms.uColor1.set(bgColor1)
            this.abyssBackgroundFilter.resources.balatroUniforms.uniforms.uColor2.set(bgColor2)
            this.abyssBackgroundFilter.resources.balatroUniforms.uniforms.uColor3.set(bgColor3)

            // Also adjust lighting - darker as we go deeper
            const lighting = 0.15 - depthFactor * 0.08
            this.abyssBackgroundFilter.resources.balatroUniforms.uniforms.uLighting = lighting

            // Slower, more oppressive spin in deeper areas
            const spinSpeed = 3.0 - depthFactor * 1.5
            this.abyssBackgroundFilter.resources.balatroUniforms.uniforms.uSpinSpeed = spinSpeed
        }

        // Apply fluid colors
        if (this.abyssFluidFilter) {
            this.abyssFluidFilter.uniforms.uColorDeep.set(fluidDeep)
            this.abyssFluidFilter.uniforms.uColorMid.set(fluidMid)
            this.abyssFluidFilter.uniforms.uColorSurface.set(fluidSurface)
        }
    }

    private createAbyssBubble(): AbyssBubble {
        return {
            x:
                this.boundaryLeft +
                30 +
                Math.random() * (this.boundaryRight - this.boundaryLeft - 60),
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
            x:
                this.boundaryLeft +
                40 +
                Math.random() * (this.boundaryRight - this.boundaryLeft - 80),
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
        const fluidSurfaceY = this.boundaryBottom - 80 // Match setupAbyss
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
        const fluidHeight = this.height - fluidSurfaceY + 20 // Match setupAbyss
        const flowTime = this.abyssTime * 1.2 // Match shader's flowSpeed (uFlowSpeed = 1.2)

        gFront.moveTo(waterLeft, fluidSurfaceY)
        for (let x = waterLeft; x <= waterRight; x += 2) {
            const normalizedX = (x - waterLeft) / (waterRight - waterLeft)
            // Match shader's wave formula exactly - same coefficients as GLSL/WGSL
            const wave =
                Math.sin(normalizedX * 15.0 + flowTime * 2.0) * 0.025 * fluidHeight +
                Math.sin(normalizedX * 8.0 - flowTime * 1.5) * 0.0175 * fluidHeight +
                Math.sin(normalizedX * 25.0 + flowTime * 4.0) * 0.01 * fluidHeight
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
            gFront.circle(
                bubble.x + wobbleX - bubble.size * 0.3,
                bubble.y - bubble.size * 0.3,
                bubble.size * 0.2
            )
            gFront.fill({ color: 0xffffff, alpha: bubble.alpha * 0.4 })
        }

        // Draw surface ripples
        for (const ripple of this.surfaceRipples) {
            gFront.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius * 0.3)
            gFront.stroke({
                color: blood > 0.5 ? 0x8b4444 : 0x7a5a90,
                width: 2,
                alpha: ripple.alpha,
            })
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
            const angle = -Math.PI + Math.random() * Math.PI // Upward arc
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
            const timeoutId = window.setTimeout(() => {
                // Check if scene is still active before modifying state
                if (this.surfaceRipples) {
                    this.surfaceRipples.push({
                        x: pos.x,
                        y: abyssTop,
                        radius: 5,
                        maxRadius: 60 + i * 20,
                        alpha: 0.8,
                    })
                }
            }, i * 200)
            this.pendingTimeoutIds.push(timeoutId)
        }

        // Start blood rise
        this.abyssBloodLevel = 0.3

        // Make all eyes snap to look at drowning position
        for (const eye of this.abyssEyes) {
            const dx = pos.x - eye.x
            const dy = abyssTop - eye.y
            eye.targetLookAngle = Math.atan2(dy, dx)
            eye.nextBlink = 3 // Don't blink while watching
        }

        // Open mouth in anticipation
        this.abyssMouth.targetOpenness = 1
        this.abyssMouth.x = pos.x // Move mouth to drowning spot
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
        if (mouth.openness < 0.05) return // Don't draw if barely open

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
            g.ellipse(
                mouth.x + tongueWiggle,
                mouth.y + openHeight * 0.2,
                halfWidth * 0.4,
                openHeight * 0.3
            )
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
            g.fill({ color: this.isDrowningActive ? 0xffffee : 0xf5f5dc }) // Brighter when scary
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

        if (eyeOpenness < 0.1) return // Fully closed

        const size = eye.size

        // Outer red glow
        g.ellipse(eye.x, eye.y, size * 1.3, size * 0.6 * eyeOpenness)
        g.fill({ color: 0xef4444, alpha: 0.3 })

        // Main eye (red ellipse)
        g.ellipse(eye.x, eye.y, size, size * 0.45 * eyeOpenness)
        g.fill({ color: 0xdc2626, alpha: 0.8 })

        // Vertical slit pupil
        const pupilW = size * 0.15
        const pupilH = size * 0.35 * eyeOpenness
        g.ellipse(eye.x, eye.y, pupilW, pupilH)
        g.fill({ color: 0x000000, alpha: 0.95 })
    }

    /**
     * Draw eye overlaid on water surface with glowing effect
     */
    private drawAbyssEyeOverlay(g: Graphics, eye: AbyssEye, blood: number): void {
        // Check if blinking - but don't blink when scary/drowning
        const isBlinking = eye.blinkTimer > 0 && !this.isDrowningActive
        const blinkProgress = isBlinking ? eye.blinkTimer / eye.blinkDuration : 0
        const eyeOpenness = isBlinking ? Math.abs(Math.sin(blinkProgress * Math.PI)) : 1

        if (eyeOpenness < 0.1) return // Fully closed

        // Scary mode - eyes get bigger and more intense
        const scaryScale = this.isDrowningActive ? 1.4 : 1.0
        const pulseScale = this.isDrowningActive
            ? 1.0 + Math.sin(this.abyssTime * 6 + eye.x * 0.1) * 0.15
            : 1.0
        const totalScale = scaryScale * pulseScale

        const size = eye.size * totalScale

        // Outer red glow - brighter when scary
        const glowAlpha = this.isDrowningActive ? 0.5 : 0.3
        g.ellipse(eye.x, eye.y, size * 1.3, size * 0.6 * eyeOpenness)
        g.fill({ color: 0xef4444, alpha: glowAlpha })

        // Extra scary outer glow
        if (this.isDrowningActive) {
            g.ellipse(eye.x, eye.y, size * 1.6, size * 0.75 * eyeOpenness)
            g.fill({ color: 0xff0000, alpha: 0.2 })
        }

        // Main eye (red ellipse) - brighter when scary
        const eyeAlpha = this.isDrowningActive ? 0.95 : 0.8
        g.ellipse(eye.x, eye.y, size, size * 0.45 * eyeOpenness)
        g.fill({ color: 0xdc2626, alpha: eyeAlpha })

        // Vertical slit pupil
        const pupilW = size * 0.15
        const pupilH = size * 0.35 * eyeOpenness

        // Scary pupil shake
        const shakeX = this.isDrowningActive ? Math.sin(this.abyssTime * 20) * 1 : 0
        const shakeY = this.isDrowningActive ? Math.cos(this.abyssTime * 25) * 0.5 : 0

        g.ellipse(eye.x + shakeX, eye.y + shakeY, pupilW, pupilH)
        g.fill({ color: 0x000000, alpha: 0.95 })
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
                particle.x =
                    this.boundaryLeft + Math.random() * (this.boundaryRight - this.boundaryLeft)
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
                this.abyssMouth.targetOpenness = 1 - distanceToAbyss / openThreshold
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
        // Outer abyss areas (behind everything in game area)
        this.outerAbyssGraphics = new Graphics()
        this.gameContainer.addChild(this.outerAbyssGraphics)

        this.boundaryGraphics = new Graphics()
        this.gameContainer.addChild(this.boundaryGraphics)

        // Animated wall tentacles (on top of boundary)
        this.wallTentaclesGraphics = new Graphics()
        this.gameContainer.addChild(this.wallTentaclesGraphics)

        this.drawOuterAbyss()
        this.drawBoundary()
        this.drawWallTentacles({ bass: 0, mid: 0, high: 0, overall: 0 }) // Initial draw
    }

    /**
     * Draw the dark abyss areas outside the game boundaries
     */
    private drawOuterAbyss(): void {
        const g = this.outerAbyssGraphics
        g.clear()

        const left = this.boundaryLeft
        const right = this.boundaryRight
        const screenWidth = this.width
        const screenHeight = this.height

        // Dark abyss color
        const abyssColor = 0x0a0510

        // Left outer area (from screen edge to game boundary)
        if (left > 0) {
            // Solid dark fill
            g.rect(0, 0, left, screenHeight)
            g.fill({ color: abyssColor, alpha: 0.95 })

            // Gradient edge (lighter toward game area)
            for (let i = 0; i < 20; i++) {
                const alpha = 0.4 * (1 - i / 20)
                g.rect(left - 20 + i, 0, 1, screenHeight)
                g.fill({ color: 0x1a0820, alpha })
            }

            // Purple glow edge
            for (let i = 0; i < 8; i++) {
                const alpha = 0.15 * (1 - i / 8)
                g.rect(left - 8 + i, 0, 1, screenHeight)
                g.fill({ color: 0x6622aa, alpha })
            }
        }

        // Right outer area (from game boundary to screen edge)
        if (right < screenWidth) {
            // Solid dark fill
            g.rect(right, 0, screenWidth - right, screenHeight)
            g.fill({ color: abyssColor, alpha: 0.95 })

            // Gradient edge (lighter toward game area)
            for (let i = 0; i < 20; i++) {
                const alpha = 0.4 * (i / 20)
                g.rect(right + i, 0, 1, screenHeight)
                g.fill({ color: 0x1a0820, alpha })
            }

            // Purple glow edge
            for (let i = 0; i < 8; i++) {
                const alpha = 0.15 * (i / 8)
                g.rect(right + i, 0, 1, screenHeight)
                g.fill({ color: 0x6622aa, alpha })
            }
        }
    }

    /**
     * Draw audio-reactive wall tentacles that react to player proximity
     */
    private drawWallTentacles(audioBands: AudioBands, playerX?: number, playerY?: number): void {
        const g = this.wallTentaclesGraphics
        g.clear()

        // Clear tip positions for collision detection
        this.wallTentacleTips = []

        const left = this.boundaryLeft
        const top = this.boundaryTop + 100 // Start below HUD
        const right = this.boundaryRight
        const bottom = this.boundaryBottom - 80 // Stop above water
        const wallHeight = bottom - top

        const tentacleSpacing = 45 // Spacing between tentacles
        const tentacleCount = Math.floor(wallHeight / tentacleSpacing)
        const time = this.wallTentacleTime

        // Detection range for player proximity
        const detectionRange = 70 // How close player needs to be to trigger reaction
        const maxReachBonus = 25 // How much extra the tentacle extends when reaching

        // Abyss tentacle colors
        const tentacleBaseColor = 0x3a1a4a // Dark purple
        const tentacleGlowColor = 0x6633aa // Purple glow
        const tentacleTipColor = 0x9944cc // Brighter tip
        const aggressiveColor = 0xaa2244 // Red when aggressive
        const aggressiveGlow = 0xff4466 // Red glow when aggressive

        // Left wall tentacles (reaching right into game area)
        for (let i = 0; i < tentacleCount; i++) {
            const baseY = top + 30 + i * tentacleSpacing

            // Audio reactivity (equalizer style)
            const normalizedPos = i / tentacleCount
            let audioLevel: number
            if (normalizedPos < 0.33) {
                audioLevel = audioBands.bass
            } else if (normalizedPos < 0.66) {
                audioLevel = audioBands.mid
            } else {
                audioLevel = audioBands.high
            }

            // Check if player is close to this tentacle
            let reachFactor = 0
            let targetAngle = 0
            if (playerX !== undefined && playerY !== undefined) {
                const distToPlayer = Math.sqrt(
                    Math.pow(playerX - left, 2) + Math.pow(playerY - baseY, 2)
                )
                if (distToPlayer < detectionRange + 50) {
                    // Tentacle is alerted - calculate reach
                    reachFactor = Math.max(0, 1 - distToPlayer / (detectionRange + 50))
                    targetAngle = Math.atan2(playerY - baseY, playerX - left)
                }
            }

            // Tentacle parameters (varying per tentacle) - shorter lengths
            const phaseOffset = i * 0.7 + i * i * 0.1
            const baseLength = 12 + (i % 3) * 5 + audioLevel * 12 + reachFactor * maxReachBonus
            const segments = 4
            const waveAmp = (6 + audioLevel * 4) * (1 - reachFactor * 0.5) // Less wave when reaching

            // Choose colors based on aggression
            const currentBaseColor = reachFactor > 0.3 ? aggressiveColor : tentacleBaseColor
            const currentGlowColor = reachFactor > 0.3 ? aggressiveGlow : tentacleGlowColor
            const currentTipColor = reachFactor > 0.3 ? 0xff6688 : tentacleTipColor

            // Draw tentacle as connected segments
            const points: { x: number; y: number }[] = []
            points.push({ x: left, y: baseY })

            for (let s = 1; s <= segments; s++) {
                const t = s / segments
                // Normal wave motion
                const wave = Math.sin(time * 2 + phaseOffset + t * Math.PI * 1.5) * waveAmp * t
                // Base direction (right)
                let x = left + baseLength * t * (0.9 + Math.sin(time * 1.5 + phaseOffset) * 0.1)
                let y = baseY + wave + Math.sin(time * 3 + phaseOffset + s) * 3

                // Bend toward player when reaching
                if (reachFactor > 0) {
                    const bendStrength = reachFactor * t * 30
                    x += Math.cos(targetAngle) * bendStrength * 0.3
                    y += Math.sin(targetAngle) * bendStrength
                }

                points.push({ x, y })
            }

            // Draw tentacle with gradient thickness
            for (let p = 0; p < points.length - 1; p++) {
                const t = p / (points.length - 1)
                const thickness = (6 - t * 4) * (1 + audioLevel * 0.3) * (1 + reachFactor * 0.3)
                const alpha = 0.7 - t * 0.3 + audioLevel * 0.2 + reachFactor * 0.2

                // Glow (behind)
                g.moveTo(points[p].x, points[p].y)
                g.lineTo(points[p + 1].x, points[p + 1].y)
                g.stroke({ color: currentGlowColor, width: thickness + 4, alpha: alpha * 0.3 })

                // Main tentacle
                g.moveTo(points[p].x, points[p].y)
                g.lineTo(points[p + 1].x, points[p + 1].y)
                g.stroke({ color: currentBaseColor, width: thickness, alpha })
            }

            // Tip glow (larger when aggressive)
            const tip = points[points.length - 1]
            const tipSize = 2 + audioLevel * 2 + reachFactor * 4
            g.circle(tip.x, tip.y, tipSize)
            g.fill({ color: currentTipColor, alpha: 0.5 + audioLevel * 0.3 + reachFactor * 0.3 })

            // Store tip position for collision detection
            this.wallTentacleTips.push({ x: tip.x, y: tip.y, side: 'left' })
        }

        // Right wall tentacles (reaching left into game area)
        for (let i = 0; i < tentacleCount; i++) {
            const baseY = top + 50 + i * tentacleSpacing // Offset from left side

            // Audio reactivity (inverted for variety)
            const normalizedPos = i / tentacleCount
            let audioLevel: number
            if (normalizedPos < 0.33) {
                audioLevel = audioBands.high
            } else if (normalizedPos < 0.66) {
                audioLevel = audioBands.mid
            } else {
                audioLevel = audioBands.bass
            }

            // Check if player is close to this tentacle
            let reachFactor = 0
            let targetAngle = 0
            if (playerX !== undefined && playerY !== undefined) {
                const distToPlayer = Math.sqrt(
                    Math.pow(playerX - right, 2) + Math.pow(playerY - baseY, 2)
                )
                if (distToPlayer < detectionRange + 50) {
                    reachFactor = Math.max(0, 1 - distToPlayer / (detectionRange + 50))
                    targetAngle = Math.atan2(playerY - baseY, playerX - right)
                }
            }

            const phaseOffset = i * 0.8 + i * i * 0.15 + Math.PI
            const baseLength =
                12 + ((i + 1) % 3) * 5 + audioLevel * 12 + reachFactor * maxReachBonus
            const segments = 4
            const waveAmp = (6 + audioLevel * 4) * (1 - reachFactor * 0.5)

            const currentBaseColor = reachFactor > 0.3 ? aggressiveColor : tentacleBaseColor
            const currentGlowColor = reachFactor > 0.3 ? aggressiveGlow : tentacleGlowColor
            const currentTipColor = reachFactor > 0.3 ? 0xff6688 : tentacleTipColor

            const points: { x: number; y: number }[] = []
            points.push({ x: right, y: baseY })

            for (let s = 1; s <= segments; s++) {
                const t = s / segments
                const wave = Math.sin(time * 2 + phaseOffset + t * Math.PI * 1.5) * waveAmp * t
                let x = right - baseLength * t * (0.9 + Math.sin(time * 1.5 + phaseOffset) * 0.1)
                let y = baseY + wave + Math.sin(time * 3 + phaseOffset + s) * 3

                if (reachFactor > 0) {
                    const bendStrength = reachFactor * t * 30
                    x += Math.cos(targetAngle) * bendStrength * 0.3
                    y += Math.sin(targetAngle) * bendStrength
                }

                points.push({ x, y })
            }

            for (let p = 0; p < points.length - 1; p++) {
                const t = p / (points.length - 1)
                const thickness = (6 - t * 4) * (1 + audioLevel * 0.3) * (1 + reachFactor * 0.3)
                const alpha = 0.7 - t * 0.3 + audioLevel * 0.2 + reachFactor * 0.2

                g.moveTo(points[p].x, points[p].y)
                g.lineTo(points[p + 1].x, points[p + 1].y)
                g.stroke({ color: currentGlowColor, width: thickness + 4, alpha: alpha * 0.3 })

                g.moveTo(points[p].x, points[p].y)
                g.lineTo(points[p + 1].x, points[p + 1].y)
                g.stroke({ color: currentBaseColor, width: thickness, alpha })
            }

            const tip = points[points.length - 1]
            const tipSize = 2 + audioLevel * 2 + reachFactor * 4
            g.circle(tip.x, tip.y, tipSize)
            g.fill({ color: currentTipColor, alpha: 0.5 + audioLevel * 0.3 + reachFactor * 0.3 })

            // Store tip position for collision detection
            this.wallTentacleTips.push({ x: tip.x, y: tip.y, side: 'right' })
        }
    }

    /**
     * Check wall tentacle collision with player and deal damage
     */
    private checkWallTentacleCollision(playerX: number, playerY: number): boolean {
        const collisionRadius = 15 // How close player needs to be to take damage

        for (const tip of this.wallTentacleTips) {
            const dist = Math.sqrt(Math.pow(playerX - tip.x, 2) + Math.pow(playerY - tip.y, 2))
            if (dist < collisionRadius) {
                return true
            }
        }
        return false
    }

    /**
     * Apply damage with shield absorption
     * Returns the actual HP damage dealt (after shield absorption)
     */
    private applyDamageWithShield(baseDamage: number): number {
        // Apply damage reduction perk first
        let damage = baseDamage
        if (this.currentPerkEffects.damageReduction) {
            damage = Math.ceil(damage * this.currentPerkEffects.damageReduction)
        }

        // Shield absorbs damage first
        if (this.currentShield > 0) {
            const shieldAbsorbed = Math.min(this.currentShield, damage)
            this.currentShield -= shieldAbsorbed
            damage -= shieldAbsorbed

            // Visual feedback for shield hit
            if (this.wobble) {
                this.showShieldHitEffect(this.wobble.x, this.wobble.y)
            }

            // If all damage absorbed by shield, return 0
            if (damage <= 0) {
                return 0
            }
        }

        // Apply remaining damage to HP in run mode
        if (this.runMode) {
            const runState = useRunStore.getState()
            if (runState.activeRun) {
                runState.damageHP(damage)
                this.runHpLostThisStage += damage
            }
        }

        return damage
    }

    /**
     * Visual effect when shield absorbs damage
     */
    private showShieldHitEffect(x: number, y: number): void {
        const ring = new Graphics()
        ring.circle(x, y, 30)
        ring.stroke({ color: 0x44aaff, width: 3, alpha: 0.9 })
        this.gameContainer.addChild(ring)

        let elapsed = 0
        const animate = () => {
            elapsed += 1 / 60
            const progress = elapsed / 0.3

            ring.clear()
            ring.circle(x, y, 30 + progress * 20)
            ring.stroke({ color: 0x44aaff, width: 3 * (1 - progress), alpha: 0.9 * (1 - progress) })

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                this.gameContainer.removeChild(ring)
                ring.destroy()
            }
        }
        requestAnimationFrame(animate)
    }

    /**
     * Update shield visual effect around wobble
     */
    private updateShieldVisual(deltaSeconds: number): void {
        if (!this.wobble) {
            // Hide shield if no wobble
            if (this.shieldGraphics) {
                this.shieldGraphics.visible = false
            }
            return
        }

        // Create shield graphics if needed
        if (!this.shieldGraphics) {
            this.shieldGraphics = new Graphics()
            this.gameContainer.addChild(this.shieldGraphics)
        }

        // Hide if no shield
        if (this.maxShield <= 0 || this.currentShield <= 0) {
            this.shieldGraphics.visible = false
            return
        }

        this.shieldGraphics.visible = true
        this.shieldAnimTime += deltaSeconds

        // Calculate shield properties
        const shieldRatio = this.currentShield / this.maxShield
        const baseRadius = 35
        const pulseAmount = 3 * Math.sin(this.shieldAnimTime * 4)
        const radius = baseRadius + pulseAmount

        // Shield color based on remaining amount
        // Full: cyan, Low: purple/red
        const fullColor = 0x44ddff
        const lowColor = 0x9944ff
        const r1 = (fullColor >> 16) & 0xff
        const g1 = (fullColor >> 8) & 0xff
        const b1 = fullColor & 0xff
        const r2 = (lowColor >> 16) & 0xff
        const g2 = (lowColor >> 8) & 0xff
        const b2 = lowColor & 0xff
        const rCol = Math.round(r2 + (r1 - r2) * shieldRatio)
        const gCol = Math.round(g2 + (g1 - g2) * shieldRatio)
        const bCol = Math.round(b2 + (b1 - b2) * shieldRatio)
        const shieldColor = (rCol << 16) | (gCol << 8) | bCol

        // Draw shield bubble
        const gfx = this.shieldGraphics
        gfx.clear()
        gfx.position.set(this.wobble.x, this.wobble.y)

        // Outer glow ring
        const glowAlpha = 0.2 + 0.1 * Math.sin(this.shieldAnimTime * 3)
        gfx.circle(0, 0, radius + 8)
        gfx.stroke({ color: shieldColor, width: 2, alpha: glowAlpha * shieldRatio })

        // Main shield ring
        const mainAlpha = 0.4 + 0.2 * Math.sin(this.shieldAnimTime * 5)
        gfx.circle(0, 0, radius)
        gfx.stroke({ color: shieldColor, width: 3, alpha: mainAlpha * shieldRatio })

        // Inner shimmer
        const shimmerAlpha = 0.1 + 0.05 * Math.sin(this.shieldAnimTime * 7)
        gfx.circle(0, 0, radius - 5)
        gfx.fill({ color: shieldColor, alpha: shimmerAlpha * shieldRatio })

        // Floating particles around the shield
        const particleCount = Math.ceil(3 * shieldRatio)
        for (let i = 0; i < particleCount; i++) {
            const angle = this.shieldAnimTime * 2 + (i * Math.PI * 2) / particleCount
            const particleRadius = radius + 5 + Math.sin(this.shieldAnimTime * 3 + i) * 3
            const px = Math.cos(angle) * particleRadius
            const py = Math.sin(angle) * particleRadius
            const particleSize = 2 + Math.sin(this.shieldAnimTime * 4 + i * 2) * 1
            gfx.circle(px, py, particleSize)
            gfx.fill({ color: 0xffffff, alpha: 0.6 })
        }
    }

    /**
     * Apply perk effects while wobble is falling (released state)
     */
    private applyFallingPerkEffects(deltaSeconds: number): void {
        if (!this.wobble || this.wobble.state !== 'released') return

        // Magnet effect - pull toward wormhole
        if (this.currentPerkEffects.magnetStrength && this.wormhole) {
            const dx = this.wormhole.x - this.wobble.x
            const dy = this.wormhole.y - this.wobble.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist > 10) {
                // Magnet strength scales with distance (stronger when closer)
                const magnetForce = this.currentPerkEffects.magnetStrength * 150
                const falloffDist = 200
                const strength = Math.min(1, falloffDist / dist)
                const forceX = (dx / dist) * magnetForce * strength * deltaSeconds
                const forceY = (dy / dist) * magnetForce * strength * deltaSeconds
                this.wobble.applyImpulse(
                    dx / dist,
                    dy / dist,
                    magnetForce * strength * deltaSeconds
                )
            }
        }

        // Air control - apply horizontal force based on touch/tilt
        if (this.currentPerkEffects.hasAirControl && this.lastTouchX !== null) {
            const centerX = this.width / 2
            const offset = this.lastTouchX - centerX
            const airControlForce = 100
            const normalizedOffset = Math.max(-1, Math.min(1, offset / (this.width / 3)))
            this.wobble.applyImpulse(normalizedOffset, 0, airControlForce * deltaSeconds)
        }
    }

    // Track last touch position for air control
    private lastTouchX: number | null = null

    /**
     * Update slow motion visual effect
     */
    private updateSlowMoVisual(remainingTime: number): void {
        // Create graphics if needed
        if (!this.slowMoGraphics) {
            this.slowMoGraphics = new Graphics()
            this.container.addChild(this.slowMoGraphics)
        }

        this.slowMoGraphics.visible = true

        const gfx = this.slowMoGraphics
        gfx.clear()

        // Calculate intensity based on remaining time
        const maxDuration = this.currentPerkEffects.slowMoDuration || 0.5
        const intensity = Math.min(1, remainingTime / maxDuration)

        // Screen edge vignette effect (purple tint for time distortion)
        const edgeWidth = 60 * intensity
        const alpha = 0.3 * intensity

        // Draw gradient edges
        for (let i = 0; i < edgeWidth; i++) {
            const edgeAlpha = alpha * (1 - i / edgeWidth)

            // Left edge
            gfx.rect(i, 0, 1, this.height)
            gfx.fill({ color: 0x6a4a8a, alpha: edgeAlpha })

            // Right edge
            gfx.rect(this.width - i - 1, 0, 1, this.height)
            gfx.fill({ color: 0x6a4a8a, alpha: edgeAlpha })

            // Top edge
            gfx.rect(0, i, this.width, 1)
            gfx.fill({ color: 0x6a4a8a, alpha: edgeAlpha * 0.7 })

            // Bottom edge
            gfx.rect(0, this.height - i - 1, this.width, 1)
            gfx.fill({ color: 0x6a4a8a, alpha: edgeAlpha * 0.7 })
        }

        // Pulsing time icon in corner
        const iconX = 30
        const iconY = 120
        const pulse = 1 + Math.sin(performance.now() / 100) * 0.1
        const iconRadius = 12 * pulse

        // Clock icon background
        gfx.circle(iconX, iconY, iconRadius + 3)
        gfx.fill({ color: 0x2a1a3a, alpha: 0.8 })

        gfx.circle(iconX, iconY, iconRadius)
        gfx.stroke({ color: 0x9b59b6, width: 2, alpha: intensity })

        // Clock hands
        const handAngle = performance.now() / 200
        gfx.moveTo(iconX, iconY)
        gfx.lineTo(iconX + Math.cos(handAngle) * 6, iconY + Math.sin(handAngle) * 6)
        gfx.stroke({ color: 0xffffff, width: 2, alpha: intensity })

        gfx.moveTo(iconX, iconY)
        gfx.lineTo(iconX + Math.cos(handAngle * 0.1) * 8, iconY + Math.sin(handAngle * 0.1) * 8)
        gfx.stroke({ color: 0xffffff, width: 1.5, alpha: intensity })
    }

    /**
     * Hide slow motion visual
     */
    private hideSlowMoVisual(): void {
        if (this.slowMoGraphics) {
            this.slowMoGraphics.visible = false
            this.slowMoGraphics.clear()
        }
    }

    /**
     * Update active perk icons display
     * Shows icons of all currently active perks
     */
    private updatePerkIconsDisplay(): void {
        // Get current perks
        let perks: PerkInstance[]
        if (this.runMode) {
            const runState = useRunStore.getState()
            perks = runState.activeRun?.perks || []
        } else {
            perks = this.localPerks
        }

        if (perks.length === 0) {
            if (this.perkIconsContainer) {
                this.perkIconsContainer.visible = false
            }
            return
        }

        // Create container if needed
        if (!this.perkIconsContainer) {
            this.perkIconsContainer = new Container()
            this.container.addChild(this.perkIconsContainer)
        }

        this.perkIconsContainer.visible = true
        this.perkIconsContainer.position.set(this.width - 10, 80)

        // Clear old icons
        for (const text of this.perkIconTexts) {
            this.perkIconsContainer.removeChild(text)
            text.destroy()
        }
        this.perkIconTexts = []

        // Create icon for each perk
        const iconSize = 24
        const gap = 4
        const maxPerRow = 4
        let currentX = 0
        let currentY = 0

        for (let i = 0; i < perks.length; i++) {
            const perkInstance = perks[i]
            const perkDef = getPerkById(perkInstance.perkId)
            if (!perkDef) continue

            // Position in grid
            const col = i % maxPerRow
            const row = Math.floor(i / maxPerRow)
            currentX = -(col * (iconSize + gap)) - iconSize
            currentY = row * (iconSize + gap)

            // Background circle
            const bg = new Graphics()
            bg.circle(currentX + iconSize / 2, currentY + iconSize / 2, iconSize / 2 + 2)
            bg.fill({ color: 0x1a1025, alpha: 0.8 })
            bg.stroke({ color: this.getPerkRarityColor(perkDef.rarity), width: 2, alpha: 0.8 })
            this.perkIconsContainer.addChild(bg)

            // Icon emoji
            const iconText = new Text({
                text: perkDef.icon,
                style: new TextStyle({
                    fontSize: 16,
                }),
            })
            iconText.anchor.set(0.5)
            iconText.position.set(currentX + iconSize / 2, currentY + iconSize / 2)
            this.perkIconsContainer.addChild(iconText)
            this.perkIconTexts.push(iconText)

            // Stack count badge if > 1
            if (perkInstance.stacks > 1) {
                const stackBg = new Graphics()
                stackBg.circle(currentX + iconSize - 2, currentY + iconSize - 2, 8)
                stackBg.fill({ color: 0x6a4a8a, alpha: 0.9 })
                this.perkIconsContainer.addChild(stackBg)

                const stackText = new Text({
                    text: `${perkInstance.stacks}`,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 10,
                        fontWeight: 'bold',
                        fill: 0xffffff,
                    }),
                })
                stackText.anchor.set(0.5)
                stackText.position.set(currentX + iconSize - 2, currentY + iconSize - 2)
                this.perkIconsContainer.addChild(stackText)
            }
        }
    }

    /**
     * Get color for perk rarity
     */
    private getPerkRarityColor(rarity: 'common' | 'rare' | 'legendary'): number {
        switch (rarity) {
            case 'common':
                return 0x8899aa
            case 'rare':
                return 0x5588dd
            case 'legendary':
                return 0xffaa00
        }
    }

    /**
     * Update gravity visual effect around player
     * Shows particles floating up (low gravity) or falling fast (high gravity)
     */
    private updateGravityEffect(deltaSeconds: number): void {
        // Show effect when swinging OR released (not during success/failed/drowning)
        const validStates = ['swinging', 'released']
        if (!this.wobble || !validStates.includes(this.wobble.state)) {
            // Hide effect when not in valid state
            if (this.gravityEffectGraphics) {
                this.gravityEffectGraphics.visible = false
            }
            this.gravityParticles = [] // Clear particles when not active
            return
        }

        // Check if gravity is modified by perk
        const gravityMod = this.currentPerkEffects.gravityMultiplier
        if (!gravityMod || Math.abs(gravityMod - 1.0) < 0.01) {
            // No gravity modification from perk
            if (this.gravityEffectGraphics) {
                this.gravityEffectGraphics.visible = false
            }
            this.gravityParticles = []
            return
        }

        // Create graphics if needed
        if (!this.gravityEffectGraphics) {
            this.gravityEffectGraphics = new Graphics()
        }

        // Ensure graphics is in the container and on top of wobble
        if (!this.gravityEffectGraphics.parent) {
            this.gameContainer.addChild(this.gravityEffectGraphics)
        }
        // Bring to front
        this.gameContainer.setChildIndex(
            this.gravityEffectGraphics,
            this.gameContainer.children.length - 1
        )
        this.gravityEffectGraphics.visible = true

        const pos = this.wobble.getPosition()
        const isLightGravity = gravityMod < 1.0

        // Spawn particles sparingly for subtle effect
        const spawnRate = 3 // Low spawn rate
        if (Math.random() < spawnRate * deltaSeconds && this.gravityParticles.length < 8) {
            const angle = Math.random() * Math.PI * 2
            const distance = 15 + Math.random() * 20
            const particle = {
                x: pos.x + Math.cos(angle) * distance,
                y: pos.y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 20,
                vy: isLightGravity ? -50 - Math.random() * 30 : 60 + Math.random() * 40,
                size: isLightGravity ? 2 + Math.random() * 2 : 2 + Math.random() * 2.5,
                alpha: 0.4 + Math.random() * 0.2,
                life: 0.6 + Math.random() * 0.4,
            }
            this.gravityParticles.push(particle)
        }

        // Update and draw particles
        const gfx = this.gravityEffectGraphics
        gfx.clear()

        // Particle colors based on gravity type
        const particleColor = isLightGravity ? 0x88ddff : 0xffaa44 // Light blue for feather, orange for heavy

        for (let i = this.gravityParticles.length - 1; i >= 0; i--) {
            const p = this.gravityParticles[i]

            // Update position
            p.x += p.vx * deltaSeconds
            p.y += p.vy * deltaSeconds
            p.life -= deltaSeconds

            // Add some drift
            p.vx += (Math.random() - 0.5) * 20 * deltaSeconds

            if (p.life <= 0) {
                this.gravityParticles.splice(i, 1)
                continue
            }

            // Fade based on life
            const lifeFade = Math.min(1, p.life * 2)
            const alpha = p.alpha * lifeFade

            // Draw simple particle
            if (isLightGravity) {
                // Light gravity: small soft circles
                gfx.circle(p.x, p.y, p.size)
                gfx.fill({ color: particleColor, alpha: alpha * 0.6 })
            } else {
                // Heavy gravity: small falling dots
                gfx.circle(p.x, p.y, p.size)
                gfx.fill({ color: particleColor, alpha: alpha * 0.6 })
            }
        }

        // Draw subtle aura ring only
        const auraAlpha = 0.15 + Math.sin(performance.now() / 300) * 0.05
        const auraRadius = 30
        const auraColor = isLightGravity ? 0x88ddff : 0xffaa44

        // Single subtle ring
        gfx.circle(pos.x, pos.y, auraRadius)
        gfx.stroke({ color: auraColor, width: 1.5, alpha: auraAlpha })
    }

    /**
     * Handle wall tentacle damage to player
     * Only deals damage - doesn't push player (obstacle tentacles handle that)
     */
    private handleWallTentacleDamage(): void {
        if (!this.wobble) return

        // Visual feedback - red flash
        this.showWallTentacleHit(this.wobble.x, this.wobble.y)

        // Apply damage with shield absorption
        const actualDamage = this.applyDamageWithShield(5)

        // Show pain speech bubble only if HP was damaged
        if (actualDamage > 0 && this.wobble) {
            const painPhrases = ['Ow!', 'Ugh!', 'Ouch!', 'Agh!']
            const phrase = painPhrases[Math.floor(Math.random() * painPhrases.length)]
            this.wobble.showSpeechBubble(phrase, 0.5)
        } else if (this.wobble) {
            // Shield absorbed all damage
            this.wobble.showSpeechBubble('Blocked!', 0.5)
        }
    }

    /**
     * Visual effect when hit by wall tentacle
     */
    private showWallTentacleHit(x: number, y: number): void {
        const ring = new Graphics()
        ring.circle(x, y, 20)
        ring.stroke({ color: 0xff4466, width: 4, alpha: 0.9 })
        this.gameContainer.addChild(ring)

        let elapsed = 0
        const animate = () => {
            elapsed += 1 / 60
            const progress = elapsed / 0.25

            ring.clear()
            ring.circle(x, y, 20 + progress * 25)
            ring.stroke({ color: 0xff4466, width: 4, alpha: 0.9 * (1 - progress) })

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                this.gameContainer.removeChild(ring)
                ring.destroy()
            }
        }
        requestAnimationFrame(animate)
    }

    private drawBoundary(): void {
        const g = this.boundaryGraphics
        g.clear()

        const left = this.boundaryLeft
        const top = this.boundaryTop
        const right = this.boundaryRight
        const bottom = this.boundaryBottom - 80 // Stop above water
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
                fill: 0x8b0000, // Dark blood red
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
                fill: 0x888899, // Muted color
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
        this.hpBarContainer.visible = false // HP bar now on wobble
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

        this.updateHpBar(1) // Start full
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
            color = BALATRO.cyan // Healthy
        } else if (hpPercent > 0.25) {
            color = BALATRO.accent // Caution (gold)
        } else {
            color = BALATRO.red // Danger
        }

        g.roundRect(2, 2, fillWidth, barHeight - 4, 4)
        g.fill({ color })
    }

    private setupStageResult(): void {
        // Abyss theme colors
        const ABYSS = {
            purple: 0x6a3d7a, // Deep purple
            darkPurple: 0x2a1a30, // Very dark purple
            red: 0x8b2020, // Blood red
            gold: 0xc9a227, // Eldritch gold
            text: 0xccbbdd, // Pale purple text
            glow: 0x5a2d70, // Purple glow
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
            fill: 0x8877aa, // Muted purple
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
        const w = 230 // Slightly narrower for mobile
        const h = 210
        const yOffset = -110

        // Abyss theme colors
        const bgColor = 0x1a0a20 // Very dark purple
        const borderColor = 0x6a3d7a // Deep purple
        const glowColor = 0x8b2020 // Blood red glow
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
                    this.height / 2 -
                        20 -
                        (this.height / 2 - 20 + Math.sin(angle) * distance * 0.6),
                    this.width / 2 - (this.width / 2 + Math.cos(angle) * distance)
                ),
                targetLookAngle: Math.atan2(-Math.sin(angle), -Math.cos(angle)),
                blinkTimer: 0,
                intensity: 0.5 + Math.random() * 0.5,
            })
        }

        // Create tentacles reaching toward the result card
        // More tentacles for better visual density
        const tentacleCount = isPerfect ? 16 : 12
        for (let i = 0; i < tentacleCount; i++) {
            const side = i % 4
            let x, y, angle
            switch (side) {
                case 0: // Top
                    x = this.width * 0.15 + Math.random() * this.width * 0.7
                    y = -10
                    angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5
                    break
                case 1: // Right
                    x = this.width + 10
                    y = this.height * 0.15 + Math.random() * this.height * 0.7
                    angle = Math.PI + (Math.random() - 0.5) * 0.5
                    break
                case 2: // Bottom
                    x = this.width * 0.15 + Math.random() * this.width * 0.7
                    y = this.height + 10
                    angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5
                    break
                default: // Left
                    x = -10
                    y = this.height * 0.15 + Math.random() * this.height * 0.7
                    angle = (Math.random() - 0.5) * 0.5
                    break
            }
            // Longer tentacles reaching more toward center
            const baseLength = 100 + Math.random() * 80
            this.resultTentacles.push({
                startX: x,
                startY: y,
                angle,
                length: 0,
                targetLength: baseLength,
                phase: Math.random() * Math.PI * 2,
                waveSpeed: 1.5 + Math.random() * 2.5,
            })
        }

        // Add corner tentacles for extra drama
        const corners = [
            { x: -10, y: -10, angle: Math.PI / 4 },
            { x: this.width + 10, y: -10, angle: (Math.PI * 3) / 4 },
            { x: this.width + 10, y: this.height + 10, angle: (-Math.PI * 3) / 4 },
            { x: -10, y: this.height + 10, angle: -Math.PI / 4 },
        ]
        for (const corner of corners) {
            this.resultTentacles.push({
                startX: corner.x,
                startY: corner.y,
                angle: corner.angle + (Math.random() - 0.5) * 0.3,
                length: 0,
                targetLength: 120 + Math.random() * 60,
                phase: Math.random() * Math.PI * 2,
                waveSpeed: 1.2 + Math.random() * 1.5,
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

        const segments = 12
        const segmentLength = tentacle.length / segments
        // Pulsating width based on time
        const pulse = 1 + Math.sin(time * 3 + tentacle.phase) * 0.15
        const baseWidth = 18 * pulse

        // Store segment positions for multi-pass drawing
        const segmentPositions: { x: number; y: number; angle: number; width: number }[] = []

        let x = tentacle.startX
        let y = tentacle.startY
        let angle = tentacle.angle

        // Calculate all segment positions first
        for (let i = 0; i <= segments; i++) {
            const t = i / segments
            const width = baseWidth * (1 - t * 0.6)
            segmentPositions.push({ x, y, angle, width })

            if (i < segments) {
                // More dramatic wave with secondary oscillation
                const wave1 =
                    Math.sin(time * tentacle.waveSpeed + tentacle.phase + i * 0.5) * 12 * t
                const wave2 =
                    Math.sin(time * tentacle.waveSpeed * 0.7 + tentacle.phase * 1.5 + i * 0.3) *
                    6 *
                    t
                const wave = wave1 + wave2

                // Curve toward center with slight random drift
                const toCenterX = this.width / 2 - x
                const toCenterY = this.height / 2 - 20 - y
                const toCenterAngle = Math.atan2(toCenterY, toCenterX)
                angle += (toCenterAngle - angle) * 0.12

                x += Math.cos(angle) * segmentLength + Math.cos(angle + Math.PI / 2) * wave
                y += Math.sin(angle) * segmentLength + Math.sin(angle + Math.PI / 2) * wave
            }
        }

        // Pass 1: Draw outer glow
        for (let i = 0; i < segments; i++) {
            const seg = segmentPositions[i]
            const nextSeg = segmentPositions[i + 1]
            const t = i / segments

            const glowWidth = seg.width * 1.8
            const perpX = (Math.cos(seg.angle + Math.PI / 2) * glowWidth) / 2
            const perpY = (Math.sin(seg.angle + Math.PI / 2) * glowWidth) / 2
            const nextPerpX = (Math.cos(nextSeg.angle + Math.PI / 2) * nextSeg.width * 1.8) / 2
            const nextPerpY = (Math.sin(nextSeg.angle + Math.PI / 2) * nextSeg.width * 1.8) / 2

            g.moveTo(seg.x + perpX, seg.y + perpY)
            g.lineTo(nextSeg.x + nextPerpX * 0.85, nextSeg.y + nextPerpY * 0.85)
            g.lineTo(nextSeg.x - nextPerpX * 0.85, nextSeg.y - nextPerpY * 0.85)
            g.lineTo(seg.x - perpX, seg.y - perpY)
            g.closePath()

            const glowColor = this.lerpColor(0x6a3090, 0x2a1040, t)
            g.fill({ color: glowColor, alpha: 0.25 })
        }

        // Pass 2: Draw main tentacle body
        for (let i = 0; i < segments; i++) {
            const seg = segmentPositions[i]
            const nextSeg = segmentPositions[i + 1]
            const t = i / segments

            const perpX = (Math.cos(seg.angle + Math.PI / 2) * seg.width) / 2
            const perpY = (Math.sin(seg.angle + Math.PI / 2) * seg.width) / 2
            const nextPerpX = (Math.cos(nextSeg.angle + Math.PI / 2) * nextSeg.width) / 2
            const nextPerpY = (Math.sin(nextSeg.angle + Math.PI / 2) * nextSeg.width) / 2

            g.moveTo(seg.x + perpX, seg.y + perpY)
            g.lineTo(nextSeg.x + nextPerpX * 0.85, nextSeg.y + nextPerpY * 0.85)
            g.lineTo(nextSeg.x - nextPerpX * 0.85, nextSeg.y - nextPerpY * 0.85)
            g.lineTo(seg.x - perpX, seg.y - perpY)
            g.closePath()

            // Gradient from deep purple at base to dark at tip
            const tentacleColor = this.lerpColor(0x5a2878, 0x1a0a20, t)
            g.fill({ color: tentacleColor, alpha: 0.9 })
        }

        // Pass 3: Draw highlight/shine on one side
        for (let i = 0; i < segments; i++) {
            const seg = segmentPositions[i]
            const nextSeg = segmentPositions[i + 1]
            const t = i / segments

            const perpX = Math.cos(seg.angle + Math.PI / 2) * (seg.width * 0.35)
            const perpY = Math.sin(seg.angle + Math.PI / 2) * (seg.width * 0.35)
            const nextPerpX = Math.cos(nextSeg.angle + Math.PI / 2) * (nextSeg.width * 0.35)
            const nextPerpY = Math.sin(nextSeg.angle + Math.PI / 2) * (nextSeg.width * 0.35)

            g.moveTo(seg.x + perpX, seg.y + perpY)
            g.lineTo(nextSeg.x + nextPerpX, nextSeg.y + nextPerpY)
            g.lineTo(nextSeg.x + nextPerpX * 0.5, nextSeg.y + nextPerpY * 0.5)
            g.lineTo(seg.x + perpX * 0.5, seg.y + perpY * 0.5)
            g.closePath()

            const highlightColor = this.lerpColor(0x8a4098, 0x3a1848, t)
            g.fill({ color: highlightColor, alpha: 0.4 * (1 - t * 0.5) })
        }

        // Pass 4: Draw suckers with glow
        for (let i = 2; i < segments; i += 2) {
            if (tentacle.length < 30) continue

            const seg = segmentPositions[i]
            const suckerSize = seg.width * 0.28
            const suckerPulse = 1 + Math.sin(time * 4 + tentacle.phase + i) * 0.2

            // Sucker glow
            g.circle(seg.x, seg.y, suckerSize * 1.5 * suckerPulse)
            g.fill({ color: 0x8a40a0, alpha: 0.2 })

            // Outer sucker ring
            g.circle(seg.x, seg.y, suckerSize * suckerPulse)
            g.fill({ color: 0x7a3890, alpha: 0.7 })

            // Inner dark hole
            g.circle(seg.x, seg.y, suckerSize * 0.5 * suckerPulse)
            g.fill({ color: 0x150810, alpha: 0.85 })

            // Tiny highlight
            g.circle(seg.x - suckerSize * 0.2, seg.y - suckerSize * 0.2, suckerSize * 0.15)
            g.fill({ color: 0xaa60b0, alpha: 0.5 })
        }
    }

    /**
     * Draw a single result screen eye - Simple red eye with vertical slit pupil
     */
    private drawResultEye(g: Graphics, eye: ResultEye, time: number): void {
        if (eye.openness < 0.1) return

        const size = eye.size

        // Outer red glow
        g.ellipse(eye.x, eye.y, size * 1.3, size * 0.6 * eye.openness)
        g.fill({ color: 0xef4444, alpha: 0.3 * eye.intensity })

        // Main eye (red ellipse)
        g.ellipse(eye.x, eye.y, size, size * 0.45 * eye.openness)
        g.fill({ color: 0xdc2626, alpha: 0.8 * eye.intensity })

        // Vertical slit pupil
        const pupilW = size * 0.15
        const pupilH = size * 0.35 * eye.openness
        g.ellipse(eye.x, eye.y, pupilW, pupilH)
        g.fill({ color: 0x000000, alpha: 0.95 })
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

        // Tentacles react dramatically
        for (const tentacle of this.resultTentacles) {
            if (isGoodGrade) {
                // Tentacles recoil in fear/respect
                tentacle.targetLength *= 0.6
                tentacle.waveSpeed *= 1.5 // Faster retreat animation
            } else {
                // Tentacles reach hungrily closer
                tentacle.targetLength *= 1.4
                tentacle.waveSpeed *= 0.7 // Slower, more menacing
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
        this.transitionStageText.position.set(this.width / 2, this.height * 0.28)
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
        this.transitionSubText.position.set(this.width / 2, this.height * 0.28 + 50)
        this.transitionContainer.addChild(this.transitionSubText)

        // Hint text - difficulty change messages (loading-style)
        this.transitionHintText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: 0x4ecdc4, // Teal color to stand out
                letterSpacing: 1,
                lineHeight: 18,
            }),
        })
        this.transitionHintText.anchor.set(0.5, 0) // Anchor top-center for multi-line
        this.transitionHintText.position.set(this.width / 2, this.height * 0.28 + 90)
        this.transitionContainer.addChild(this.transitionHintText)

        // Tap to start prompt
        this.transitionTapText = new Text({
            text: i18n.t('wobblediver.transitions.tapToStart'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fill: 0x888899,
                letterSpacing: 2,
            }),
        })
        this.transitionTapText.anchor.set(0.5)
        this.transitionTapText.position.set(this.width / 2, this.height - 80)
        this.transitionContainer.addChild(this.transitionTapText)
    }

    /**
     * Generate difficulty hint messages based on activated factors
     * Shows hints for ALL active gimmicks in this stage
     */
    private getDifficultyHints(_stageNumber: number): string[] {
        const hints: string[] = []

        if (!this.currentStageConfig) return hints

        const factors = this.currentStageConfig.activatedFactors

        // Wormhole shrinks during stage
        if (factors.wormholeShrinkActivated) {
            hints.push(i18n.t('wobblediver.hints.wormholeShrinks'))
        }

        // Abyss tentacles pulling wormhole
        if (factors.abyssTentacleCount > 0) {
            hints.push(i18n.t('wobblediver.hints.abyssTentacles'))
        }

        // Portal appears
        if (factors.portalPairCount > 0) {
            hints.push(i18n.t('wobblediver.hints.portalAppears'))
        }

        // Wall tentacle obstacles - show different hints based on count
        if (factors.wallTentacleCount >= 3) {
            hints.push(i18n.t('wobblediver.hints.maxObstacles'))
        } else if (factors.wallTentacleCount >= 2) {
            hints.push(i18n.t('wobblediver.hints.moreObstacles'))
        } else if (factors.wallTentacleCount >= 1) {
            hints.push(i18n.t('wobblediver.hints.obstacleAppears'))
        }

        // Trajectory visibility changes
        if (factors.trajectoryFlickerActivated) {
            hints.push(i18n.t('wobblediver.hints.trajectoryFlicker'))
        } else if (factors.trajectoryTimedActivated) {
            hints.push(i18n.t('wobblediver.hints.trajectoryTimed'))
        }

        // Water pressure (increased gravity)
        if (factors.waterLevelRiseAmount > 0) {
            hints.push(i18n.t('wobblediver.hints.waterPressure'))
        }

        return hints
    }

    private startStageTransition(stageNumber: number): void {
        this.isTransitioning = true
        this.transitionTime = 0
        this.transitionAnimTime = 0
        this.transitionWaitingForTap = false
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

        // Get difficulty hints for this stage
        const hints = this.getDifficultyHints(stageNumber)
        if (hints.length > 0) {
            // Show hints with loading-style dots animation
            this.transitionHintText.text = `▸ ${hints.join('\n▸ ')}`
        } else {
            this.transitionHintText.text = ''
        }
        this.transitionHintText.alpha = 0

        // Generate tentacles from edges
        this.transitionTentacles = []
        const tentacleCount = 8 + Math.min(stageNumber, 8)
        for (let i = 0; i < tentacleCount; i++) {
            const side = i % 4 // 0=top, 1=right, 2=bottom, 3=left
            let x, y, angle
            switch (side) {
                case 0: // Top
                    x = Math.random() * this.width
                    y = 0
                    angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5
                    break
                case 1: // Right
                    x = this.width
                    y = Math.random() * this.height
                    angle = Math.PI + (Math.random() - 0.5) * 0.5
                    break
                case 2: // Bottom
                    x = Math.random() * this.width
                    y = this.height
                    angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5
                    break
                default: // Left
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

        // Generate transition eyes (positioned below text area to avoid overlap)
        this.transitionEyes = []
        const eyeCount = 3 + Math.min(stageNumber, 5)
        for (let i = 0; i < eyeCount; i++) {
            this.transitionEyes.push({
                x: this.width * 0.15 + Math.random() * this.width * 0.7,
                y: this.height * 0.45 + Math.random() * this.height * 0.4, // Lower area (45-85%)
                size: 15 + Math.random() * 25,
                openness: 0,
                targetOpenness: 1,
                blinkTimer: 0,
                nextBlink: 2 + Math.random() * 4, // Random time until first blink
                phase: Math.random() * Math.PI * 2, // Unique animation offset
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
    }

    private updateTransition(deltaSeconds: number): void {
        if (!this.isTransitioning) return

        // Always advance animation time for visual effects
        this.transitionAnimTime += deltaSeconds

        // Don't advance phase time if waiting for tap (freeze at hold phase)
        if (!this.transitionWaitingForTap) {
            this.transitionTime += deltaSeconds
        }
        const t = this.transitionTime
        const animT = this.transitionAnimTime // Use for animations that should continue
        const duration = this.transitionDuration

        const g = this.transitionGraphics
        g.clear()

        // Phase 1: Darkness closes in completely (0 - 0.5s)
        // Phase 2: Full darkness with effects (0.5 - 2.5s)
        // Phase 3: Abyss opens - vertical split reveal (2.5 - 3.2s)

        const cx = this.width / 2
        const cy = this.height / 2

        // Calculate phase-specific values
        const closePhaseEnd = 0.5
        const holdPhaseEnd = 2.5
        const openPhaseEnd = duration

        if (t < closePhaseEnd) {
            // Phase 1: Iris closing effect (circular mask shrinking)
            const closeProgress = t / closePhaseEnd
            const easeClose = 1 - Math.pow(1 - closeProgress, 3) // Ease out cubic

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
            const pulseIntensity = 0.3 + Math.sin(animT * 4) * 0.1
            for (let i = 0; i < 4; i++) {
                const glowRadius = 50 + i * 40
                g.ellipse(cx, cy, glowRadius, glowRadius * 0.7)
                g.fill({ color: 0x6b5b95, alpha: pulseIntensity * (0.15 - i * 0.03) })
            }
        } else {
            // Phase 3: Abyss opening - vertical split like an eye opening
            const openProgress = (t - holdPhaseEnd) / (openPhaseEnd - holdPhaseEnd)
            const easeOpen = openProgress * openProgress * (3 - 2 * openProgress) // Smoothstep

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
                this.drawTransitionTentacle(g, tentacle, tentacleProgress * effectsFade, animT)
            }
        }

        // Draw eyes (only during hold phase)
        if (effectsVisible) {
            const eyeProgress = Math.min(1, (t - closePhaseEnd - 0.1) / 0.3)

            for (const eye of this.transitionEyes) {
                // Blink logic
                eye.blinkTimer += deltaSeconds
                if (eye.blinkTimer >= eye.nextBlink) {
                    // Start blink - close eye
                    eye.targetOpenness = 0
                    if (eye.openness < 0.1) {
                        // Eye is closed, reopen it
                        eye.targetOpenness = 1
                        eye.blinkTimer = 0
                        eye.nextBlink = 2 + Math.random() * 5 // Next blink in 2-7 seconds
                    }
                }

                // Smooth interpolation toward target
                eye.openness += (eye.targetOpenness - eye.openness) * deltaSeconds * 8
                // Apply eye progress for fade-in effect
                const effectiveOpenness = eye.openness * eyeProgress
                const drawEye = { ...eye, openness: effectiveOpenness }
                this.drawTransitionEye(g, drawEye, effectsFade, animT)
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

        // Stage text animation (only during hold phase)
        if (effectsVisible) {
            const textProgress = Math.min(1, (t - closePhaseEnd) / 0.3)

            this.transitionStageText.alpha = textProgress * effectsFade
            this.transitionStageText.scale.set(0.5 + textProgress * 0.5)

            // Shake effect
            const shake = Math.sin(animT * 30) * 3 * (1 - textProgress)
            this.transitionStageText.position.set(this.width / 2 + shake, this.height * 0.28)

            // Sub text (slightly delayed)
            const subProgress = Math.min(1, (t - closePhaseEnd - 0.2) / 0.3)
            this.transitionSubText.alpha = Math.max(0, subProgress) * effectsFade * 0.8

            // Hint text (appears after sub text, typewriter-style fade in)
            const hintDelay = 0.6 // Delay after hold phase starts
            const hintProgress = Math.min(1, (t - closePhaseEnd - hintDelay) / 0.5)
            if (hintProgress > 0 && this.transitionHintText.text) {
                this.transitionHintText.alpha = Math.max(0, hintProgress) * effectsFade * 0.9
                // Subtle pulse effect
                const pulse = 1 + Math.sin(animT * 4) * 0.02
                this.transitionHintText.scale.set(pulse)
            }

            // Tap to start prompt (appears after all text, pulsing)
            const tapDelay = 1.2
            const tapProgress = Math.min(1, (t - closePhaseEnd - tapDelay) / 0.3)
            if (tapProgress > 0) {
                const tapPulse = 0.5 + Math.sin(animT * 3) * 0.3
                this.transitionTapText.alpha = tapProgress * tapPulse * effectsFade

                // Set waiting for tap once animations are mostly done
                if (!this.transitionWaitingForTap && tapProgress >= 1) {
                    this.transitionWaitingForTap = true
                }
            }
        } else if (t >= holdPhaseEnd) {
            // Opening phase - fade out all text
            const openProgress = (t - holdPhaseEnd) / (openPhaseEnd - holdPhaseEnd)
            this.transitionStageText.alpha = 1 - openProgress
            this.transitionSubText.alpha = (1 - openProgress) * 0.8
            this.transitionHintText.alpha = (1 - openProgress) * 0.9
            this.transitionTapText.alpha = 0
        } else {
            this.transitionStageText.alpha = 0
            this.transitionSubText.alpha = 0
            this.transitionHintText.alpha = 0
            this.transitionTapText.alpha = 0
        }

        // End transition (after opening animation completes)
        if (t >= duration && !this.transitionWaitingForTap) {
            this.isTransitioning = false
            this.transitionContainer.visible = false
        }
    }

    /**
     * Handle tap during transition to close it
     */
    private onTransitionTap(): void {
        if (!this.transitionWaitingForTap) return

        this.transitionWaitingForTap = false
        // Jump to the opening phase
        this.transitionTime = 2.5 // Start of open phase
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

            const nextX =
                x + Math.cos(angle) * segmentLength + Math.cos(angle + Math.PI / 2) * waveOffset
            const nextY =
                y + Math.sin(angle) * segmentLength + Math.sin(angle + Math.PI / 2) * waveOffset

            // Draw tentacle segment
            const perpX = (Math.cos(angle + Math.PI / 2) * width) / 2
            const perpY = (Math.sin(angle + Math.PI / 2) * width) / 2

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
        eye: { x: number; y: number; size: number; openness: number; phase?: number },
        fade: number,
        time: number
    ): void {
        if (eye.openness < 0.05) return

        const size = eye.size
        const openness = eye.openness

        // Outer red glow
        g.ellipse(eye.x, eye.y, size * 1.3, size * 0.6 * openness)
        g.fill({ color: 0xef4444, alpha: 0.3 * fade })

        // Main eye (red ellipse)
        g.ellipse(eye.x, eye.y, size, size * 0.45 * openness)
        g.fill({ color: 0xdc2626, alpha: 0.8 * fade })

        // Vertical slit pupil
        const pupilW = size * 0.15
        const pupilH = size * 0.35 * openness
        g.ellipse(eye.x, eye.y, pupilW, pupilH)
        g.fill({ color: 0x000000, alpha: 0.95 * fade })
    }

    private showStageResult(
        score: number,
        hpPercent: number,
        timeTaken: number,
        perfect: boolean
    ): void {
        this.isShowingResult = true
        this.resultDisplayTime = 0
        this.resultPhase = 'hp'

        // Initialize abyss effects (eyes and tentacles watching)
        this.initResultEffects(perfect)

        // Calculate individual score components
        const basePoints = 100
        const stageMultiplier = 1 + (this.roundNumber - 1) * 0.1

        // Perfect multiplier (with perk bonus)
        let perfectMultiplier = perfect ? 2.0 : 1.0
        if (perfect && this.currentPerkEffects.perfectBonusMultiplier) {
            perfectMultiplier *= this.currentPerkEffects.perfectBonusMultiplier
        }

        // HP bonus: 0-150 points based on remaining HP
        const hpBonus = Math.round(150 * hpPercent * stageMultiplier)

        // Time bonus: 0-100 points based on speed (max at 0s, decays over 10s)
        const timeDecay = Math.max(0, 1 - timeTaken / 10)
        let timeBonus = Math.round(100 * timeDecay * stageMultiplier)

        // Speed bonus perk: extra points per second saved
        if (this.currentPerkEffects.speedBonusPerSecond && timeTaken < 10) {
            const secondsSaved = 10 - timeTaken
            timeBonus += Math.round(secondsSaved * this.currentPerkEffects.speedBonusPerSecond)
        }

        // Base score for landing
        const baseScore = Math.round(basePoints * perfectMultiplier * stageMultiplier)

        // Total score with perk score multiplier
        let totalScore = hpBonus + timeBonus + baseScore
        if (this.currentPerkEffects.scoreMultiplier) {
            totalScore = Math.round(totalScore * this.currentPerkEffects.scoreMultiplier)
        }

        // Set targets for counting animation
        this.resultCountTarget = { hp: hpBonus, time: timeBonus, total: totalScore }
        this.resultCountCurrent = { hp: 0, time: 0, total: 0 }

        // Calculate grade based on total score and conditions
        const grade = this.calculateGrade(totalScore, hpPercent, timeTaken, perfect)

        // Grade colors (abyss theme)
        const gradeColors: Record<string, number> = {
            S: 0xffd700, // Eldritch gold - escaped the abyss
            A: 0xc9a227, // Gold
            B: 0x8b6914, // Dark gold
            C: 0x6a3d7a, // Deep purple
            D: 0x8b2020, // Blood red - barely survived
        }
        this.resultGrade = {
            letter: grade.letter,
            color: gradeColors[grade.letter] || BALATRO.accent,
        }

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
        const countSpeed = 300 // Points per second
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
                        this.resultCountCurrent.total + increment * 1.5, // Count total faster
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

        // Make tentacles retract to edges (set targetLength to 0)
        for (const tentacle of this.resultTentacles) {
            tentacle.targetLength = 0
        }

        // Animate out with longer duration for tentacle retraction
        let elapsed = 0
        const fadeOutDuration = 0.6 // Longer duration for dramatic tentacle retract
        const animateOut = () => {
            const dt = 1 / 60
            elapsed += dt
            const progress = Math.min(elapsed / fadeOutDuration, 1)

            // Keep time incrementing for tentacle animation
            this.resultEffectTime += dt

            // Update tentacles - faster retraction
            for (const tentacle of this.resultTentacles) {
                tentacle.length += (tentacle.targetLength - tentacle.length) * dt * 4
            }

            // Fade out UI card faster than effects
            const cardProgress = Math.min(elapsed / 0.3, 1)
            this.stageResultContainer.alpha = 1 - cardProgress
            this.stageResultContainer.scale.set(1 - cardProgress * 0.3)

            // Fade out vignette and eyes more slowly
            this.resultVignetteAlpha = 0.7 * (1 - progress)

            // Eyes close during fade-out
            for (const eye of this.resultEyes) {
                eye.targetOpenness = 0
                eye.openness += (eye.targetOpenness - eye.openness) * dt * 3
            }

            this.drawResultEffects()

            if (progress < 1) {
                requestAnimationFrame(animateOut)
            } else {
                this.stageResultContainer.visible = false
                this.cleanupResultEffects()
                // Trigger perk selection or next stage after result fade out completes
                this.onResultFadeOutComplete()
            }
        }
        requestAnimationFrame(animateOut)
    }

    /**
     * Called when result screen fade out animation completes
     */
    private onResultFadeOutComplete(): void {
        console.log('[Wobblediver] onResultFadeOutComplete called, runMode:', this.runMode)
        if (this.runMode && this.runNodeId) {
            // Run mode: complete the node and show map
            const rank = this.resultGrade.letter as 'S' | 'A' | 'B' | 'C' | 'D'
            const stageScore = this.resultCountTarget?.total || 0
            this.completeRunNode(rank, stageScore)
        } else {
            // Endless mode: show perk selection
            console.log('[Wobblediver] Calling showPerkSelection for endless mode')
            this.showPerkSelection()
        }
    }

    private calculateGrade(
        score: number,
        hpPercent: number,
        timeTaken: number,
        perfect: boolean
    ): { letter: string; description: string } {
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

        this.gameContainer.on('pointerdown', (e) => {
            this.lastTouchX = e.globalX
            this.onTap()
        })

        // Track pointer movement for air control perk
        this.gameContainer.on('pointermove', (e) => {
            this.lastTouchX = e.globalX
        })

        this.gameContainer.on('pointerup', () => {
            this.lastTouchX = null
        })

        this.gameContainer.on('pointerupoutside', () => {
            this.lastTouchX = null
        })
    }

    private onTap(): void {
        // Initialize audio analyser on first tap (requires user interaction)
        musicManager.initializeAnalyser()

        // Handle tap during transition
        if (this.isTransitioning) {
            this.onTransitionTap()
            return
        }

        if (!this.wobble) return

        // Double jump - tap while falling
        if (
            this.wobble.state === 'released' &&
            this.doubleJumpAvailable &&
            this.currentPerkEffects.hasDoubleJump
        ) {
            this.performDoubleJump()
            return
        }

        if (!this.isWaitingForTap) return
        if (this.wobble.state !== 'swinging') return

        // Cut the rope!
        this.wobble.release()
        this.isWaitingForTap = false
        this.instructionText.alpha = 0

        // Reset double jump availability on release
        if (this.currentPerkEffects.hasDoubleJump) {
            this.doubleJumpAvailable = true
        }

        // Activate slow motion if perk is available
        if (this.currentPerkEffects.slowMoDuration && this.currentPerkEffects.slowMoDuration > 0) {
            this.slowMoActive = true
            this.slowMoTimer = this.currentPerkEffects.slowMoDuration
        }
    }

    /**
     * Perform double jump (tap while falling)
     */
    private performDoubleJump(): void {
        if (!this.wobble) return

        // Apply upward impulse
        const jumpForce = 350
        this.wobble.applyImpulse(0, -1, jumpForce)
        this.doubleJumpAvailable = false

        // Visual and audio feedback
        this.wobble.showSpeechBubble('Hyah!', 0.4)
        this.showDoubleJumpEffect()
    }

    /**
     * Visual effect for double jump
     */
    private showDoubleJumpEffect(): void {
        if (!this.wobble) return

        const pos = this.wobble.getPosition()

        // Create burst ring effect
        const ring = new Graphics()
        this.gameContainer.addChild(ring)

        let elapsed = 0
        const animate = () => {
            elapsed += 1 / 60
            const progress = elapsed / 0.3

            ring.clear()
            const radius = 10 + progress * 40
            ring.circle(pos.x, pos.y + 10, radius)
            ring.stroke({ color: 0x4ecdc4, width: 3, alpha: 0.8 * (1 - progress) })

            // Inner sparkles
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + elapsed * 5
                const sparkleR = radius * 0.6
                const sx = pos.x + Math.cos(angle) * sparkleR
                const sy = pos.y + 10 + Math.sin(angle) * sparkleR
                ring.circle(sx, sy, 3 * (1 - progress))
                ring.fill({ color: 0xffffff, alpha: 0.8 * (1 - progress) })
            }

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                this.gameContainer.removeChild(ring)
                ring.destroy()
            }
        }
        requestAnimationFrame(animate)
    }

    private startNewRound(): void {
        this.roundNumber++
        this.roundTransitionTime = 0
        this.roundStartTime = Date.now() / 1000 // Track start time for scoring

        // Apply perk effects for this stage (works for both endless and run mode)
        this.applyPerkEffectsForStage()

        // Update background and water colors based on depth
        this.updateDepthColors(this.roundNumber)

        // Generate stage configuration using seeded generator
        // Use effectiveGameWidth for proper positioning (adapts to narrow screens)
        this.currentStageConfig = this.stageGenerator.generate(
            this.roundNumber,
            this.effectiveGameWidth,
            this.height
        )

        // Apply stage configuration
        this.applyStageConfig(this.currentStageConfig)

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

        // Generate new positions using stage config
        const anchorX = this.getAnchorX() // Always center
        const config = this.currentStageConfig
        const ropeLength =
            config.ropeLength.min + Math.random() * (config.ropeLength.max - config.ropeLength.min)
        const startAngle =
            config.startAngle.min + Math.random() * (config.startAngle.max - config.startAngle.min)
        const startAngleSigned = Math.random() > 0.5 ? startAngle : -startAngle

        // Create new wobble (anchor Y matches AnchorWobble position)
        this.wobble = new SwingingWobble(
            anchorX,
            this.boundaryTop + 100,
            ropeLength,
            startAngleSigned
        )
        this.wobble.resetHp() // Ensure full HP for new round
        this.wobble.setTentacleColor(this.anchorWobble.getColor()) // Sync tentacle color with jellyfish
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
        this.abyssSplashEffects = []

        // Apply trajectory visibility (perk can override to always show)
        const trajectoryMode = this.currentPerkEffects.trajectoryAlwaysVisible
            ? 'always'
            : config.trajectoryMode
        this.wobble.setTrajectoryMode(trajectoryMode, {
            duration: config.trajectoryDuration,
            flickerInterval: config.trajectoryFlickerInterval,
            flickerOnRatio: config.trajectoryFlickerOnRatio,
        })

        // Apply water pressure effect (increases gravity, making landing harder)
        // Higher water level = more pressure = stronger gravity pull
        // gravityMultiplier: 1.0 (no rise) to 2.0 (max rise)
        // Also apply perk gravity multiplier
        let gravityMultiplier = 1.0 + config.waterLevelRise
        if (this.currentPerkEffects.gravityMultiplier) {
            gravityMultiplier *= this.currentPerkEffects.gravityMultiplier
        }
        this.wobble.setGravityMultiplier(gravityMultiplier)

        // Apply swing speed multiplier (from Momentum perk)
        if (this.currentPerkEffects.swingSpeedMultiplier) {
            this.wobble.setSwingSpeedMultiplier(this.currentPerkEffects.swingSpeedMultiplier)
        }

        // Position goal using stage config
        this.positionGoalFromConfig(config)

        // Tell wobble where goal is for expression tracking
        this.wobble.setGoalPosition(this.wormhole.x, this.wormhole.y)

        // Update HUD stage display
        this.hud.updateStage(this.roundNumber)

        // Update obstacles using stage config
        this.updateObstaclesFromConfig(config)

        // Update abyss tentacles
        this.updateAbyssTentacles(config)

        // Ready for tap
        this.isWaitingForTap = true

        // Show instruction with fade
        this.instructionText.alpha = 1
    }

    /**
     * Apply stage configuration settings
     */
    private applyStageConfig(config: StageConfig): void {
        // Apply anchor personality
        this.anchorWobble.setPersonality(config.anchorPersonality)

        // Update local difficulty parameters for compatibility
        this.goalWidthScale = config.wormhole.widthScale
        this.obstacleCount = config.wallTentacles.length
        this.minRopeLength = config.ropeLength.min
        this.maxRopeLength = config.ropeLength.max
        this.trajectoryMode = config.trajectoryMode
        this.trajectoryDuration = config.trajectoryDuration
        this.trajectoryFlickerInterval = config.trajectoryFlickerInterval
        this.trajectoryFlickerOnRatio = config.trajectoryFlickerOnRatio
    }

    /**
     * Position goal (wormhole) using stage config
     * Config positions are relative to game area, so we add gameOffsetX
     */
    private positionGoalFromConfig(config: StageConfig): void {
        const { wormhole } = config
        const screenX = wormhole.x + this.gameOffsetX

        this.goal.moveTo(screenX, wormhole.y)
        this.goal.setRadius(wormhole.radius)

        // Position wormhole at same location
        // Always start at full size - shrinking happens during gameplay
        this.currentWormholeScale = 2.5
        // Apply wormhole size perk
        if (this.currentPerkEffects.wormholeSizeMultiplier) {
            this.currentWormholeScale *= this.currentPerkEffects.wormholeSizeMultiplier
        }
        this.wormhole.moveTo(screenX, wormhole.y)
        this.wormhole.setRadius(wormhole.radius)
        this.wormhole.setWidthScale(this.currentWormholeScale)
        this.wormhole.setOrientation(wormhole.orientation)

        // Spawn portal pairs from config
        this.spawnPortalPairsFromConfig(config)
    }

    /**
     * Spawn portal pairs from stage config
     * Config positions are relative to game area, so we add gameOffsetX
     */
    private spawnPortalPairsFromConfig(config: StageConfig): void {
        // Clear existing portals
        for (const portal of this.portalPairs) {
            this.gameContainer.removeChild(portal.container)
            portal.destroy()
        }
        this.portalPairs = []

        // Create portals from config (add gameOffsetX to x positions)
        for (const portalConfig of config.portalPairs) {
            const portalPair = new PortalPair({
                entrance: {
                    x: portalConfig.entrance.x + this.gameOffsetX,
                    y: portalConfig.entrance.y,
                    radius: portalConfig.entrance.radius,
                    orientation: portalConfig.entrance.orientation,
                },
                exit: {
                    x: portalConfig.exit.x + this.gameOffsetX,
                    y: portalConfig.exit.y,
                    radius: portalConfig.exit.radius,
                    orientation: portalConfig.exit.orientation,
                },
                color: portalConfig.color,
            })

            this.portalPairs.push(portalPair)
            this.gameContainer.addChild(portalPair.container)
        }
    }

    /**
     * Update obstacles from stage config
     */
    private updateObstaclesFromConfig(config: StageConfig): void {
        // Remove all existing obstacles
        for (const obstacle of this.obstacles) {
            this.gameContainer.removeChild(obstacle.container)
            obstacle.destroy()
        }
        this.obstacles = []

        // Create obstacles from config
        for (const tentacleConfig of config.wallTentacles) {
            const x = tentacleConfig.side === 'left' ? this.boundaryLeft : this.boundaryRight
            const obstacle = new ObstacleWobble({
                x,
                y: tentacleConfig.y,
                radius: 18,
                movement: tentacleConfig.movement,
                speed: tentacleConfig.speed,
                range: tentacleConfig.range,
                tentacleLength: tentacleConfig.length,
                side: tentacleConfig.side,
                attackRange: tentacleConfig.attackRange,
            })
            this.obstacles.push(obstacle)
            this.gameContainer.addChild(obstacle.container)
        }
    }

    /**
     * Update abyss tentacles from stage config
     * Config positions are relative to game area, so we add gameOffsetX
     */
    private updateAbyssTentacles(config: StageConfig): void {
        // Clear existing tentacles
        for (const tentacle of this.abyssTentacles) {
            this.gameContainer.removeChild(tentacle.container)
            tentacle.destroy()
        }
        this.abyssTentacles = []

        // Calculate water surface level based on waterLevelRise
        // Base water level is at boundaryBottom - 80
        // Maximum rise is 150 pixels (toward the wormhole)
        const baseWaterLevel = this.boundaryBottom - 80
        const maxRise = 150
        const waterSurfaceY = baseWaterLevel - config.waterLevelRise * maxRise

        // Create tentacles from config (add gameOffsetX to x positions)
        for (const tentacleConfig of config.abyssTentacles) {
            // Create a modified config with offset x position
            const offsetConfig = {
                ...tentacleConfig,
                baseX: tentacleConfig.baseX + this.gameOffsetX,
            }
            const tentacle = new AbyssTentacle(offsetConfig, waterSurfaceY)
            tentacle.setWormholePosition(config.wormhole.x + this.gameOffsetX, config.wormhole.y)
            tentacle.setWaterLevel(waterSurfaceY, this.height)
            this.abyssTentacles.push(tentacle)
            this.gameContainer.addChild(tentacle.container)
        }
    }

    /**
     * Update abyss tentacle animation and apply displacement to wormhole
     * Tentacles pull the wormhole based on water level
     * Config positions are relative to game area, so we add gameOffsetX
     */
    private updateAbyssTentacleAnimation(deltaSeconds: number): void {
        if (this.abyssTentacles.length === 0 || !this.currentStageConfig) return

        // Calculate current water surface level
        const baseWaterLevel = this.boundaryBottom - 80
        const maxRise = 150
        const waterSurfaceY = baseWaterLevel - this.currentStageConfig.waterLevelRise * maxRise

        // Use BASE wormhole position for tentacle targeting (not current position!)
        // This prevents feedback loop where tentacles chase the displaced wormhole
        // Add gameOffsetX since config positions are relative to game area
        const baseX = this.currentStageConfig.wormhole.x + this.gameOffsetX
        const baseY = this.currentStageConfig.wormhole.y

        // Update wormhole position and water level for tentacles
        for (const tentacle of this.abyssTentacles) {
            tentacle.setWormholePosition(baseX, baseY) // Use base position, not current!
            tentacle.setWaterLevel(waterSurfaceY, this.height)
            tentacle.update(deltaSeconds)
        }

        // Calculate total displacement from all tentacles
        let totalDisplacementX = 0
        let totalDisplacementY = 0
        for (const tentacle of this.abyssTentacles) {
            const displacement = tentacle.getDisplacement()
            totalDisplacementX += displacement.x
            totalDisplacementY += displacement.y
        }

        // Max displacement - much larger range for dramatic movement
        // X: 100-180 pixels, Y: 50-100 pixels based on water level
        const maxDisplacementX = 100 + this.currentStageConfig.waterLevelRise * 80
        const maxDisplacementY = 50 + this.currentStageConfig.waterLevelRise * 50

        // Clamp displacement
        totalDisplacementX = Math.max(
            -maxDisplacementX,
            Math.min(maxDisplacementX, totalDisplacementX)
        )
        totalDisplacementY = Math.max(
            -maxDisplacementY,
            Math.min(maxDisplacementY, totalDisplacementY)
        )

        // Apply displacement
        const newX = baseX + totalDisplacementX
        const newY = baseY + totalDisplacementY

        // Ensure wormhole stays within game bounds (use boundaryLeft/Right)
        const padding = 60
        const clampedX = Math.max(
            this.boundaryLeft + padding,
            Math.min(this.boundaryRight - padding, newX)
        )
        // Don't let the wormhole go too close to the water
        const minWormholeY = this.boundaryTop + 100
        const maxWormholeY = waterSurfaceY - 50 // Keep above water
        const clampedY = Math.max(minWormholeY, Math.min(maxWormholeY, newY))

        this.wormhole.moveTo(clampedX, clampedY)
        this.goal.moveTo(clampedX, clampedY)

        // Update wobble's goal position for trajectory
        if (this.wobble) {
            this.wobble.setGoalPosition(clampedX, clampedY)
        }
    }

    /**
     * Update wormhole shrinking animation
     * The wormhole gradually shrinks during gameplay based on shrinkRate
     */
    private updateWormholeShrinking(deltaSeconds: number): void {
        if (!this.currentStageConfig) return

        const { wormholeShrinkRate, wormholeMinWidthScale } = this.currentStageConfig

        // Only shrink if there's a shrink rate
        if (wormholeShrinkRate <= 0) return

        // Shrink the wormhole over time
        const previousScale = this.currentWormholeScale
        this.currentWormholeScale -= wormholeShrinkRate * deltaSeconds

        // Clamp to minimum scale
        this.currentWormholeScale = Math.max(wormholeMinWidthScale, this.currentWormholeScale)

        // Only update visual if scale changed
        if (this.currentWormholeScale !== previousScale) {
            this.wormhole.setWidthScale(this.currentWormholeScale)
        }
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
        this.wobble = new SwingingWobble(anchorX, this.boundaryTop + 100, ropeLength, startAngle)
        this.wobble.resetHp()
        this.wobble.setTentacleColor(this.anchorWobble.getColor()) // Sync tentacle color with jellyfish
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
        this.abyssSplashEffects = []

        // Apply trajectory visibility based on current difficulty
        this.wobble.setTrajectoryMode(this.trajectoryMode, {
            duration: this.trajectoryDuration,
            flickerInterval: this.trajectoryFlickerInterval,
            flickerOnRatio: this.trajectoryFlickerOnRatio,
        })

        // Reset wormhole to original position (abyss tentacles may have displaced it)
        if (this.currentStageConfig) {
            const { wormhole } = this.currentStageConfig
            this.wormhole.moveTo(wormhole.x, wormhole.y)
            this.goal.moveTo(wormhole.x, wormhole.y)
        }

        // Position goal (keep same position for retry)
        this.wobble.setGoalPosition(this.wormhole.x, this.wormhole.y)

        // Ready for tap
        this.isWaitingForTap = true
        this.instructionText.alpha = 1
    }

    private getAnchorX(): number {
        // Pendulum anchor is always at horizontal center of game area
        return this.gameOffsetX + this.effectiveGameWidth / 2
    }

    private getRandomRopeLength(): number {
        return this.minRopeLength + Math.random() * (this.maxRopeLength - this.minRopeLength)
    }

    private getRandomStartAngle(): number {
        // Start from either left or right side
        const side = Math.random() > 0.5 ? 1 : -1
        const angle = Math.PI / 6 + Math.random() * (Math.PI / 4)
        return angle * side
    }

    private positionGoal(): void {
        // Goal spawns in a limited range above the abyss water surface
        // This ensures it's far enough from the starting anchor point at the top
        const padding = 60
        const abyssTop = this.boundaryBottom - 80 // Water surface level

        // Goal spawn range: from water surface up to 180px above it
        const GOAL_RANGE_ABOVE_WATER = 180
        const GOAL_MIN_DISTANCE_FROM_WATER = 50 // Buffer above water

        const maxY = abyssTop - GOAL_MIN_DISTANCE_FROM_WATER
        const minY = abyssTop - GOAL_RANGE_ABOVE_WATER

        const x =
            this.boundaryLeft +
            padding +
            Math.random() * (this.boundaryRight - this.boundaryLeft - padding * 2)
        const y = minY + Math.random() * (maxY - minY)

        // Fixed vertical radius, horizontal width may shrink during gameplay
        const baseRadius = 35 // Vertical size stays constant

        // Wormhole always starts at full size - shrinking happens during gameplay
        this.currentWormholeScale = 2.5
        this.goalWidthScale = 2.5

        // Wormhole movement is now controlled by abyss tentacles, not periodic oscillation

        this.goal.moveTo(x, y)
        this.goal.setRadius(baseRadius)

        // Position wormhole at same location with width scale
        this.wormhole.moveTo(x, y)
        this.wormhole.setRadius(baseRadius)
        this.wormhole.setWidthScale(this.currentWormholeScale)

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

        const portalCount = Math.min(Math.floor((this.roundNumber - 4) / 3), 2) // Max 2 portal pairs
        const padding = 80
        const abyssTop = this.boundaryBottom - 80

        const colors: Array<'purple' | 'teal' | 'red'> = ['purple', 'teal', 'red']

        for (let i = 0; i < portalCount; i++) {
            const color = colors[i % colors.length]

            // Entrance on left/top side (within game area)
            const entranceX =
                this.boundaryLeft + padding + Math.random() * (this.effectiveGameWidth * 0.3)
            const entranceY =
                this.boundaryTop + 100 + Math.random() * (abyssTop - this.boundaryTop - 200)

            // Exit on right/bottom side (strategic placement within game area)
            const exitX =
                this.boundaryRight - padding - Math.random() * (this.effectiveGameWidth * 0.3)
            const exitY =
                this.boundaryTop + 100 + Math.random() * (abyssTop - this.boundaryTop - 200)

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
        const maxY = this.height - 200 // Above the abyss

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
        // Update perk selection UI
        if (this.perkSelectionUI && this.isPerkSelectionActive) {
            this.perkSelectionUI.update(deltaSeconds)
            return // Skip other updates during perk selection
        }

        // Apply slow motion effect (from slow motion perk)
        let effectiveDelta = deltaSeconds
        if (this.slowMoActive && this.slowMoTimer > 0) {
            this.slowMoTimer -= deltaSeconds
            // Slow down game time by 50%
            effectiveDelta = deltaSeconds * 0.5
            // Update slow motion visual
            this.updateSlowMoVisual(this.slowMoTimer)
            if (this.slowMoTimer <= 0) {
                this.slowMoActive = false
                this.hideSlowMoVisual()
            }
        }

        // Update stage transition effect
        this.updateTransition(effectiveDelta)

        // Skip game updates during transition
        if (this.isTransitioning) return

        // Update anchor wobble (shakes rope to maintain momentum)
        this.anchorWobble.update(effectiveDelta)

        // Update abyss animation
        this.updateAbyss(effectiveDelta)

        // Update abyss tentacles and apply displacement to wormhole
        this.updateAbyssTentacleAnimation(effectiveDelta)

        // Update wormhole shrinking animation
        this.updateWormholeShrinking(effectiveDelta)

        // Update wobble
        if (this.wobble) {
            this.wobble.update(effectiveDelta)
            this.wobble.applyFadeAlpha()

            // Update shield visual effect
            this.updateShieldVisual(effectiveDelta)

            // Update gravity visual effect (shows during swinging and released)
            this.updateGravityEffect(effectiveDelta)

            // Check for released state
            if (this.wobble.state === 'released') {
                this.checkCollisions()
                this.checkWallCollisions()

                // Apply perk effects while falling
                this.applyFallingPerkEffects(effectiveDelta)
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
                this.updateDrowningEffects(effectiveDelta)
                if (this.wobble.isDrowningComplete()) {
                    this.wobble.markFailed()
                    this.handleDeath()
                }
            }

            // Handle pending result (wait for suction animation to complete)
            if (this.pendingResult && this.pendingResultTimer > 0) {
                this.pendingResultTimer -= effectiveDelta

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
                    const spiralAngle = progress * Math.PI * 3 // 1.5 rotations
                    const spiralX = Math.cos(spiralAngle) * spiralRadius
                    const spiralY = Math.sin(spiralAngle) * spiralRadius * 0.35 // Flatten for perspective

                    // Move towards center + sink into funnel
                    const newX = startX + (targetX - startX) * easeIn + spiralX
                    const newY = startY + (targetY - startY) * easeIn + spiralY
                    const funnelDepth = this.wormhole.radius * 0.4 * easeIn // Sink into funnel
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
            if (
                this.wobble.isAnimationComplete() &&
                this.roundTransitionTime <= 0 &&
                !this.isShowingResult &&
                !this.isWaitingForRetry &&
                !this.pendingResult
            ) {
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
                    // Perk selection is triggered in hideStageResult -> onResultFadeOutComplete
                    if (this.resultDisplayTime >= 1.0) {
                        this.hideStageResult()
                    }
                }
            }
        }

        // Update goal (old, hidden)
        this.goal.update(effectiveDelta)

        // Update wormhole proximity based on player distance
        if (this.wobble) {
            const dx = this.wobble.x - this.wormhole.x
            const dy = this.wobble.y - this.wormhole.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const normalizedDistance = distance / this.wormhole.radius
            this.wormhole.setProximity(normalizedDistance)
        }

        // Update wormhole
        this.wormhole.update(effectiveDelta)

        // Update portal pairs
        for (const portalPair of this.portalPairs) {
            portalPair.update(effectiveDelta)
        }

        // Get audio bands for equalizer effect
        const audioBands = musicManager.getAudioBands()

        // Update wall tentacles with audio reactivity, animation, and player tracking
        this.wallTentacleTime += effectiveDelta
        const playerX = this.wobble?.x
        const playerY = this.wobble?.y
        this.drawWallTentacles(audioBands, playerX, playerY)

        // Check wall tentacle collision and deal damage (with cooldown)
        if (this.wallTentacleDamageCooldown > 0) {
            this.wallTentacleDamageCooldown -= effectiveDelta
        }
        if (
            this.wobble &&
            this.wobble.state === 'released' &&
            this.wallTentacleDamageCooldown <= 0
        ) {
            if (this.checkWallTentacleCollision(this.wobble.x, this.wobble.y)) {
                this.handleWallTentacleDamage()
                this.wallTentacleDamageCooldown = 0.8 // 0.8 second cooldown between hits
            }
        }

        // Update obstacles with audio reactivity (equalizer effect)
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i]

            // Distribute audio bands across obstacles for equalizer effect
            // Alternate between bass, mid, high based on position
            let audioLevel: number
            if (this.obstacles.length <= 2) {
                // Few obstacles: use overall level
                audioLevel = audioBands.overall
            } else {
                // Multiple obstacles: distribute bands like an equalizer
                const bandIndex = i % 3
                if (bandIndex === 0) {
                    audioLevel = audioBands.bass
                } else if (bandIndex === 1) {
                    audioLevel = audioBands.mid
                } else {
                    audioLevel = audioBands.high
                }
            }

            obstacle.setAudioLevel(audioLevel)
            obstacle.update(effectiveDelta)

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

        // Round transition (for failure case only - success is handled by onResultFadeOutComplete)
        if (this.roundTransitionTime > 0) {
            this.roundTransitionTime -= deltaSeconds
            if (this.roundTransitionTime <= 0) {
                // Failure case: start new round directly (no perk selection on failure)
                this.startNewRound()
            }
        }

        // Note: Run mode UI updates moved to animate() so they work even before game starts
    }

    private checkCollisions(): void {
        if (!this.wobble || this.wobble.state !== 'released') return

        const pos = this.wobble.getPosition()

        // Check wormhole hit (new finish portal)
        const wormholeHit = this.wormhole.checkHit(pos.x, pos.y)
        if (wormholeHit.hit && !this.pendingResult) {
            this.wobble.markSuccess()
            this.wormhole.showHit(wormholeHit.perfect)

            // Jellyfish friend celebrates
            this.anchorWobble.speakOnSuccess()

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
        const wobbleRadius = 15 // Approximate wobble radius
        const hasBounce = this.currentPerkEffects.hasBounce

        // Check left wall
        if (pos.x < this.boundaryLeft + wobbleRadius) {
            if (hasBounce) {
                // Bounce perk - no damage, just bounce
                this.wobble.bounceOffWallNoDamage('left', this.boundaryLeft)
                this.showWallBounce('left')
                this.wobble.showSpeechBubble('Boing!', 0.3)
            } else {
                const survived = this.wobble.bounceOffWall('left', this.boundaryLeft)
                this.showWallBounce('left')
                this.showPainBubble()

                if (!survived) {
                    // HP depleted
                    this.wobble.markFailed()
                    this.handleDeath()
                }
            }
        }

        // Check right wall
        if (pos.x > this.boundaryRight - wobbleRadius) {
            if (hasBounce) {
                this.wobble.bounceOffWallNoDamage('right', this.boundaryRight)
                this.showWallBounce('right')
                this.wobble.showSpeechBubble('Boing!', 0.3)
            } else {
                const survived = this.wobble.bounceOffWall('right', this.boundaryRight)
                this.showWallBounce('right')
                this.showPainBubble()

                if (!survived) {
                    // HP depleted
                    this.wobble.markFailed()
                    this.handleDeath()
                }
            }
        }

        // Check top wall (ceiling)
        if (pos.y < this.boundaryTop + wobbleRadius) {
            if (hasBounce) {
                this.wobble.bounceOffWallNoDamage('top', this.boundaryTop)
                this.showWallBounce('top')
                this.wobble.showSpeechBubble('Boing!', 0.3)
            } else {
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
        // Jellyfish friend mourns
        this.anchorWobble.speakOnDeath()

        // Reduce life (no visual feedback - the drowning/death animation is enough)
        this.scoreSystem.recordMiss()
        this.lifeSystem.loseLife()

        // Track HP loss in run mode (each death = significant HP loss)
        // Shield can absorb this damage too
        this.applyDamageWithShield(20)

        // Check if we have lives remaining (after losing one)
        if (this.lifeSystem.lives > 0) {
            // Set flag to prevent handleRoundEnd from triggering startNewRound
            this.isWaitingForRetry = true

            // Wait for death animation, then restart current stage
            const timeoutId = window.setTimeout(() => {
                // Check if scene is still active
                if (!this.isWaitingForRetry) return
                this.restartCurrentStage()
            }, 1200)
            this.pendingTimeoutIds.push(timeoutId)
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
        const duration = 1.0 // Longer duration for death screen
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

        // Update run mode UI (always runs, even when game is not in 'playing' phase)
        // This ensures the map displays correctly at run start before any stage is selected
        if (this.runMode) {
            if (this.runMapDisplay && this.isShowingRunMap) {
                this.runMapDisplay.update(deltaSeconds)
            }
        }
    }

    protected onDifficultyChange(config: DifficultyConfig, previousPhase: DifficultyPhase): void {
        // Note: goalWidthScale is now controlled by StageGenerator, wormhole movement by abyss tentacles
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
                this.trajectoryFlickerOnRatio = 0.4 // 40% visible
                break

            case 'insane':
                // Trajectory barely visible - quick flashes
                this.obstacleCount = 3
                this.minRopeLength = 60
                this.maxRopeLength = 250
                this.trajectoryMode = 'flicker'
                this.trajectoryFlickerInterval = 0.6
                this.trajectoryFlickerOnRatio = 0.15 // 15% visible (brief flashes)
                break
        }
    }

    protected onGameStart(): void {
        // In run mode, initialize a new run instead of showing intro
        if (this.runMode) {
            this.initializeRunMode()
            return
        }

        // Endless mode: show intro before starting
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

        // Clear abyss tentacles
        for (const tentacle of this.abyssTentacles) {
            this.gameContainer.removeChild(tentacle.container)
            tentacle.destroy()
        }
        this.abyssTentacles = []

        // Clear portal pairs
        for (const portal of this.portalPairs) {
            this.gameContainer.removeChild(portal.container)
            portal.destroy()
        }
        this.portalPairs = []

        // Generate new seed for new game
        this.gameSeed = this.stageGenerator.newGame()
        this.currentStageConfig = null

        // Reset state
        this.roundNumber = 0
        this.isWaitingForTap = false
        this.isWaitingForRetry = false
        this.roundTransitionTime = 0
        this.roundStartTime = 0

        // Reset difficulty params
        this.goalWidthScale = 2.5
        this.obstacleCount = 0
        this.minRopeLength = 100
        this.maxRopeLength = 200

        // Reset anchor wobble to default personality
        this.anchorWobble.setPersonality(ANCHOR_PERSONALITIES.steady)

        // Reset goal position (center in game area)
        this.goal.moveTo(this.gameOffsetX + this.effectiveGameWidth / 2, this.height - 200)
        this.goal.setRadius(35)
        this.wormhole.setWidthScale(2.5)
        this.wormhole.setOrientation('horizontal')

        // Hide instruction and HP bar
        this.instructionText.alpha = 0
        this.hpBarContainer.alpha = 0

        // Reset drowning state
        this.isDrowningActive = false
        this.drowningBubbles = []
        this.surfaceRipples = []
        this.abyssBloodLevel = 0
        this.abyssSplashEffects = []

        // Reset transition state
        this.isTransitioning = false
        this.transitionTime = 0
        this.transitionContainer.visible = false

        // Reset run mode state (but preserve runMode flag itself)
        // The run will be reinitialized in onGameStart() -> initializeRunMode()
        this.runNodeId = null
        this.runNodeType = null
        this.runHpLostThisStage = 0
        this.isShowingRunMap = false

        // Reset perk state (for endless mode)
        this.localPerks = []
        this.localExtraLives = 0
        this.localPerkSeed = Date.now()
        this.currentPerkEffects = {}
        this.phaseUsesThisStage = 0
        this.doubleJumpAvailable = false
        this.slowMoActive = false
        this.slowMoTimer = 0
        this.currentShield = 0
        this.maxShield = 0

        // Hide perk icons display
        if (this.perkIconsContainer) {
            this.perkIconsContainer.visible = false
        }

        // Hide slow mo visual
        this.hideSlowMoVisual()

        // Hide shield visual
        if (this.shieldGraphics) {
            this.shieldGraphics.visible = false
        }

        // Clear gravity effect
        this.gravityParticles = []
        if (this.gravityEffectGraphics) {
            this.gravityEffectGraphics.visible = false
            this.gravityEffectGraphics.clear()
        }
    }

    /**
     * Handle continue after ad revival - restore full lives and restart current stage
     */
    protected onGameContinue(): void {
        // Reset lives to full (base class only restores 1 life)
        this.lifeSystem.reset()

        // Update custom HUD
        this.customHudLives = this.lifeSystem.lives
        this.hud.updateLives(this.lifeSystem.lives, this.lifeSystem.maxLives)

        // Reset drowning state
        this.isDrowningActive = false
        this.drowningBubbles = []
        this.surfaceRipples = []
        this.abyssBloodLevel = 0
        this.abyssSplashEffects = []

        // Restart from current stage (not increment round)
        this.restartCurrentStage()
    }

    public destroy(): void {
        // Clear all pending timeouts to prevent callbacks on destroyed scene
        for (const timeoutId of this.pendingTimeoutIds) {
            window.clearTimeout(timeoutId)
        }
        this.pendingTimeoutIds = []

        // Cleanup run mode UI (including minimap)
        this.cleanupRunModeUI()

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

        // Cleanup abyss tentacles
        for (const tentacle of this.abyssTentacles) {
            tentacle.destroy()
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

        // Cleanup PixiJS filters to prevent GPU memory leaks
        if (this.abyssBackgroundFilter) {
            this.abyssBackgroundSprite.filters = []
            this.abyssBackgroundFilter.destroy()
        }
        if (this.abyssFluidFilter) {
            this.abyssFluidSprite.filters = []
            this.abyssFluidFilter.destroy()
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
            // Run mode data
            runMode: this.runMode,
            runNodeId: this.runNodeId,
        }
    }

    // ============ RUN MODE METHODS ============

    /**
     * Enable run mode and setup run-specific UI
     * Should be called before start() when playing a run
     */
    public setRunMode(enabled: boolean): void {
        this.runMode = enabled

        if (enabled) {
            this.setupRunModeUI()
        } else {
            this.cleanupRunModeUI()
        }
    }

    /**
     * Initialize run mode - start a new run and show the map
     * Called from MiniGameCanvas when mode='run'
     */
    public initializeRunMode(): void {
        if (!this.runMode) {
            this.setRunMode(true)
        }

        const runState = useRunStore.getState()

        // Always start a fresh run for now (TODO: add resume option in UI)
        // Abandon any existing run
        if (runState.activeRun) {
            runState.abandonRun()
        }

        // Start a new run
        runState.startNewRun()
        // Show the map for node selection
        this.showRunMap()
    }

    /**
     * Setup run mode UI components
     */
    private setupRunModeUI(): void {
        // Create run map display
        if (!this.runMapDisplay) {
            this.runMapDisplay = new RunMapDisplay(this.width, this.height)
            this.runMapDisplay.container.visible = false
            // onNodeSelected is called when transition STARTS (for sound effects)
            this.runMapDisplay.onNodeSelected = (_nodeId) => {
                // Could play selection sound here
            }
            // onTransitionComplete is called when transition FINISHES (start the stage)
            this.runMapDisplay.onTransitionComplete = (nodeId) => this.onRunNodeSelected(nodeId)
            this.uiContainer.addChild(this.runMapDisplay.container)
        }
    }

    /**
     * Cleanup run mode UI components
     */
    private cleanupRunModeUI(): void {
        if (this.runMapDisplay) {
            // Clear callbacks before destroying to break reference cycles
            this.runMapDisplay.onNodeSelected = null
            this.runMapDisplay.onTransitionComplete = null

            this.uiContainer.removeChild(this.runMapDisplay.container)
            this.runMapDisplay.destroy()
            this.runMapDisplay = null
        }
    }

    /**
     * Show the run map for node selection
     */
    public showRunMap(): void {
        if (!this.runMode || !this.runMapDisplay) return

        const runState = useRunStore.getState()
        if (!runState.activeRun) return

        const { map, currentNodeId, completedNodeIds } = runState.activeRun
        const availableNodes = runState.getAvailableNodes()
        const availableNodeIds = availableNodes.map((n) => n.id)

        // Pause game while showing map to prevent input conflicts
        this.gamePhase = 'paused'

        // Hide game elements that might interfere
        this.gameContainer.visible = false

        this.runMapDisplay.setMap(map, currentNodeId, completedNodeIds, availableNodeIds)
        this.runMapDisplay.setVisible(true)
        this.isShowingRunMap = true
    }

    /**
     * Hide the run map
     */
    public hideRunMap(): void {
        if (this.runMapDisplay) {
            this.runMapDisplay.setVisible(false)
        }
        this.isShowingRunMap = false

        // Show game elements again
        this.gameContainer.visible = true
    }

    /**
     * Handle node selection from run map (linear progression - all stages are the same)
     */
    private onRunNodeSelected(nodeId: string): void {
        const runState = useRunStore.getState()

        // Validate and select the node
        if (!runState.selectNode(nodeId)) {
            console.warn(`Failed to select node: ${nodeId}`)
            return
        }

        this.hideRunMap()

        // Get the selected node
        const node = runState.getCurrentNode()
        if (!node) return

        this.runNodeId = node.id
        this.runNodeType = node.type

        // Start the stage (all nodes are dive stages in linear mode)
        this.startRunStage(node)
    }

    /**
     * Start a run stage based on node
     */
    private startRunStage(node: MapNode): void {
        const runState = useRunStore.getState()
        if (!runState.activeRun) return

        // Reset HP tracking for this stage
        this.runHpLostThisStage = 0

        // Generate stage config based on node type
        // Use effectiveGameWidth for proper positioning (adapts to narrow screens)
        this.stageGenerator.setSeed(node.stageSeed)
        const config = this.stageGenerator.generateForRunNode(
            node.type,
            node.depth,
            this.effectiveGameWidth,
            this.height,
            node.stageSeed
        )

        if (config) {
            this.currentStageConfig = config
            this.roundNumber = node.depth

            // Apply the config and start round
            this.applyStageConfig(config)
            this.startStageFromConfig(config)
        }
    }

    /**
     * Apply a stage config and start the stage
     * Used by run mode to start stages with pre-generated configs
     */
    private startStageFromConfig(config: StageConfig): void {
        // Apply perk effects for this stage (in run mode)
        this.applyPerkEffectsForStage()

        // Update background colors
        this.updateDepthColors(config.depth)

        // Clear old wobble
        if (this.wobble) {
            this.gameContainer.removeChild(this.wobble.container)
            this.wobble.destroy()
            this.wobble = null
        }

        // Generate new positions using stage config
        const anchorX = this.getAnchorX()
        const ropeLength =
            config.ropeLength.min + Math.random() * (config.ropeLength.max - config.ropeLength.min)
        const startAngle =
            config.startAngle.min + Math.random() * (config.startAngle.max - config.startAngle.min)
        const startAngleSigned = Math.random() > 0.5 ? startAngle : -startAngle

        // Create new wobble
        this.wobble = new SwingingWobble(
            anchorX,
            this.boundaryTop + 100,
            ropeLength,
            startAngleSigned
        )
        this.wobble.resetHp()
        this.wobble.setTentacleColor(this.anchorWobble.getColor())
        this.gameContainer.addChild(this.wobble.container)

        // Add abyss front container AFTER wobble
        if (this.abyssFrontContainer.parent) {
            this.gameContainer.removeChild(this.abyssFrontContainer)
        }
        this.gameContainer.addChild(this.abyssFrontContainer)

        // Reset abyss effects
        this.abyssBloodLevel = 0
        this.isDrowningActive = false
        this.drowningBubbles = []
        this.surfaceRipples = []
        this.abyssSplashEffects = []

        // Apply trajectory visibility (perk can override to always show)
        const trajectoryMode = this.currentPerkEffects.trajectoryAlwaysVisible
            ? 'always'
            : config.trajectoryMode
        this.wobble.setTrajectoryMode(trajectoryMode, {
            duration: config.trajectoryDuration,
            flickerInterval: config.trajectoryFlickerInterval,
            flickerOnRatio: config.trajectoryFlickerOnRatio,
        })

        // Apply gravity multiplier (stage config + perk effect)
        let gravityMultiplier = 1.0 + config.waterLevelRise
        if (this.currentPerkEffects.gravityMultiplier) {
            gravityMultiplier *= this.currentPerkEffects.gravityMultiplier
        }
        this.wobble.setGravityMultiplier(gravityMultiplier)

        // Apply swing speed multiplier (from Momentum perk)
        if (this.currentPerkEffects.swingSpeedMultiplier) {
            this.wobble.setSwingSpeedMultiplier(this.currentPerkEffects.swingSpeedMultiplier)
        }

        // Position goal
        this.positionGoalFromConfig(config)
        this.wobble.setGoalPosition(this.wormhole.x, this.wormhole.y)

        // Update HUD
        this.hud.updateStage(config.depth)

        // Update obstacles
        this.updateObstaclesFromConfig(config)

        // Update abyss tentacles
        this.updateAbyssTentacles(config)

        // Ready for tap
        this.isWaitingForTap = true
        this.instructionText.alpha = 1
        this.roundStartTime = Date.now() / 1000

        // Ensure game phase is 'playing' so the game loop runs
        this.gamePhase = 'playing'
    }

    /**
     * Complete the current run node
     */
    public completeRunNode(rank: 'S' | 'A' | 'B' | 'C' | 'D', stageScore: number): void {
        const runState = useRunStore.getState()

        // HP loss is already tracked via damageHP calls during the stage
        // Complete the node in run state (hpLost = 0 since it's already applied)
        runState.completeNode(rank, stageScore, 0)

        // Apply healOnClear perk effect
        if (this.currentPerkEffects.healOnClear && runState.activeRun) {
            runState.healHP(this.currentPerkEffects.healOnClear)
        }

        // Reset node tracking
        this.runNodeId = null
        this.runNodeType = null

        // Check if run is complete
        if (runState.isRunComplete()) {
            if (runState.isPlayerAlive()) {
                // Victory! Show run completion
                this.handleRunComplete(true)
            } else {
                // Death - run failed
                this.handleRunComplete(false)
            }
        } else {
            // Show perk selection, then map
            this.showPerkSelection()
        }
    }

    /**
     * Handle run completion (victory or defeat)
     */
    private handleRunComplete(victory: boolean): void {
        const runState = useRunStore.getState()
        if (!runState.activeRun) return

        // Record the run via minigameRecordStore
        // Note: The store is already imported via useMinigameRecordStore in MiniGameCanvas
        // We'll call the callback and let the parent handle recording

        // Show appropriate end screen
        if (victory) {
            // TODO: Show victory screen with run stats
            this.callbacks.onGameOver?.(this.getCurrentState())
        } else {
            // Game over
            this.callbacks.onGameOver?.(this.getCurrentState())
        }

        // Clear run state
        runState.abandonRun()
    }

    /**
     * Override to track HP loss in run mode
     */
    private trackRunHpLoss(amount: number): void {
        if (this.runMode) {
            this.runHpLostThisStage += amount
        }
    }

    /**
     * Check if intro is currently showing
     */
    public isIntroShowing(): boolean {
        return this.intro?.visible ?? false
    }

    protected onResize(): void {
        // Update intro dimensions
        if (this.intro) {
            this.intro.resize(this.width, this.height)
        }
    }
}
