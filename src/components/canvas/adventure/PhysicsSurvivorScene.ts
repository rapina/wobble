import { Application, Container, Graphics, Ticker, Text, TextStyle } from 'pixi.js'
import { AdventureScene, AdventureSceneOptions } from './AdventureScene'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../Wobble'
import {
    PlayerSkill,
    SKILL_DEFINITIONS,
    getSkillDefinition,
    getCharacterSkillConfig,
    calculateCombinedSkillStats,
} from './survivor/skills'
import { t } from '@/utils/localization'
// CRT Filter removed for cleaner visuals
import { WobbleWorldFilter } from '../filters/WobbleWorldFilter'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore } from '@/stores/progressStore'
import {
    GameState,
    PlayerStats,
    DEFAULT_PLAYER_STATS,
    TextEffect,
    HitEffect,
    getRankFromTime,
    WOBBLE_STATS,
    EnemyTier,
    PlayerProgress,
    getXpForLevel,
    getLevelFromXp,
    GAME_DURATION_SECONDS,
    BOSS_SPAWN_TIME,
    DifficultyConfig,
    DEFAULT_DIFFICULTY,
    getDifficultyValue,
    getTierWeights,
    EnemySystem,
    ProjectileSystem,
    BackgroundSystem,
    ExperienceOrbSystem,
    EffectsManager,
    ComboSystem,
    HudSystem,
    SkillSelectionScreen,
    ResultScreen,
    PhysicsStats,
    CharacterSelectScreen,
    OpeningScreen,
    PauseScreen,
    StageSelectScreen,
    LoadingScreen,
    STAGES,
    getDefaultStage,
    getStageById,
    WorldGenerator,
    BlackHoleSystem,
    PickupSystem,
    type StageConfig,
    type BlackHoleInfo,
    type GeneratedWorld,
    type Enemy,
    type SkillCooldown,
} from './survivor'
import { VirtualJoystick } from './VirtualJoystick'
import { FloatingDamageText } from './FloatingDamageText'
import { ImpactEffectSystem } from './ImpactEffectSystem'
// PhysicsSkillVisuals disabled due to PixiJS Batcher conflicts
// import { PhysicsSkillVisuals } from './survivor/PhysicsSkillVisuals'

export class PhysicsSurvivorScene extends AdventureScene {
    // Game state
    private gameTime = 0
    private score = 0
    private playerHealth = 100

    // Physics stats tracking for result screen
    private physicsStats: PhysicsStats = {
        totalMomentum: 0,
        elasticBounces: 0,
        mergedMass: 0,
        slingshotCount: 0,
    }
    private maxPlayerHealth = 100
    private gameState: GameState = 'character-select'
    private bossSpawned = false

    // Experience & Level system
    private playerProgress: PlayerProgress = { xp: 0, level: 1, pendingLevelUps: 0 }

    // Skill system
    private playerSkills: PlayerSkill[] = []
    private passiveTrait: string = ''
    private studiedFormulas: Set<string> = new Set()

    // Skill stats tracking (accumulated effects per skill)
    private skillDamageStats: Map<
        string,
        {
            totalDamage: number
            activations: number
            slowTime?: number
            deflections?: number
            pushForce?: number
            pullForce?: number
            chaosApplied?: number
            bounces?: number
            pierces?: number
        }
    > = new Map()

    // Auto-fire projectile timer
    private shootTimer = 0
    private readonly baseFireInterval = 0.5 // Base fire rate: 2 shots per second

    // Shockwave skill timer and charging effect
    private shockwaveTimer = 0
    private shockwaveChargeGraphics: Graphics | null = null
    private shockwaveChargeParticles: Array<{
        angle: number
        radius: number
        speed: number
        size: number
    }> = []

    // Phase 3 cooldown-based skill timers
    private wavePulseTimer = 0
    private auraTimer = 0
    private beatPulseTimer = 0
    private beatPhase = 0 // For beat frequency calculation

    // Wave pulse state
    private activeWaves: Array<{
        x: number
        y: number
        radius: number
        maxRadius: number
        graphics: Graphics
        hitEnemies: Set<number> // Track enemies hit by this wave ring
        ringIndex: number // Which ring in the wave set
        spawnTime: number // When this ring was spawned (for staggered timing)
    }> = []
    private waveChargeGraphics: Graphics | null = null
    private waveRipples: Array<{ angle: number; dist: number; size: number }> = []

    // New skill timers and state
    private pendulumPhase = 0 // Current phase of pendulum rhythm (radians)
    private pendulumDamageMultiplier = 1 // Current damage multiplier from pendulum rhythm
    private slashAngle = 0 // Current rotation of torque slash
    private slashHitCooldowns: Map<number, number> = new Map() // Enemy ID -> cooldown

    // Buoyant bomb state
    private buoyantBombTimer = 0
    private buoyantBombs: Array<{
        x: number
        y: number
        floatTime: number
        graphics: Graphics
    }> = []

    // Phase 6: Orbital strike state
    private orbitAngle = 0 // Current rotation angle
    private orbitalProjectiles: Array<{
        angle: number // Individual angle offset
        graphics: Graphics
        hitCooldowns: Map<number, number> // Enemy ID -> cooldown
    }> = []
    private lastOrbitCount = 0 // Track changes to recreate orbitals

    // Ghost mode state (Quantum Tunneling skill)
    private isGhostMode = false
    private ghostTimer = 0 // Time remaining in ghost mode
    private ghostCooldownTimer = 0 // Time until ghost mode can be used again
    private ghostTrailTimer = 0 // Timer for spawning afterimages
    private ghostTrailPositions: Array<{
        x: number
        y: number
        alpha: number
        graphics: Graphics
    }> = []
    private ghostHitEnemies: Set<number> = new Set() // Enemies hit during this ghost mode

    // Plasma Discharge state (Raiden-style lightning laser)
    private laserGraphics: Graphics | null = null
    private laserGlowGraphics: Graphics | null = null
    private laserChainTargets: Array<{ x: number; y: number; enemy: Enemy }> = []
    private laserFlickerPhase = 0 // For lightning flicker effect

    // Persistent Aura Visuals (always shown for aura-type skills)
    private auraRingsContainer: Container | null = null
    private auraAnimPhase = 0 // For animated aura effects

    // Beat Pulse visual
    private beatPulseGraphics: Graphics | null = null

    // Passive state tracking
    private momentumSpeedBonus = 0
    private consecutiveHits = 0
    private isMoving = false

    // Accumulated stats from skills
    private stats: PlayerStats = { ...DEFAULT_PLAYER_STATS }

    // Containers
    declare private gameContainer: Container
    declare private projectileContainer: Container
    declare private enemyContainer: Container
    declare private effectContainer: Container
    declare private uiContainer: Container

    // CRT Filter removed
    // Wobble World Filter - physics atmosphere (main scene effects, no grid)
    declare private wobbleFilter: WobbleWorldFilter
    // Grid Filter - background only (grid effect behind characters)
    declare private gridFilter: WobbleWorldFilter
    // Base CRT filter values (for black hole distortion effect)
    private baseChromaticAberration = 0.08
    private baseCurvatureStrength = 0.005
    private baseVignetteStrength = 0.12
    private baseFlickerIntensity = 0.002
    // Current black hole proximity effect (0-1)
    private blackHoleProximityEffect = 0

    // Base wobble filter values (for dynamic intensity)
    private baseWobbleIntensity = 0.15
    private baseWobbleSpeed = 1.5
    private baseEnergyPulse = 0.2
    // Combat intensity for wobble effect (0-1)
    private combatIntensity = 0

    // Player (world coordinates - infinite map)
    declare private player: Wobble
    declare private playerHealthBar: Graphics // HP gauge below player
    private playerX = 0
    private playerY = 0
    private playerVx = 0
    private playerVy = 0

    // Player collision size (fixed, no mass system)
    private readonly playerSize = 25

    // Camera system (follows player)
    private cameraX = 0
    private cameraY = 0

    // Coordinate overflow prevention - reset all positions when too far from origin
    private readonly WORLD_RESET_THRESHOLD = 10000
    // External velocity (knockback, bounce, pull) - separate from input
    private externalVx = 0
    private externalVy = 0
    private readonly externalVelocityDecay = 0.92
    private recoilDecay = 0.9
    private readonly playerBaseSpeed = 4
    private readonly baseMaxHealth = 100

    // Selected character
    private selectedCharacter: WobbleShape = 'circle'

    // Stage system
    private currentStage: StageConfig = getDefaultStage()

    // Core Systems
    declare private enemySystem: EnemySystem
    declare private projectileSystem: ProjectileSystem
    declare private backgroundSystem: BackgroundSystem
    declare private xpOrbSystem: ExperienceOrbSystem
    declare private pickupSystem: PickupSystem
    declare private damageTextSystem: FloatingDamageText
    declare private impactSystem: ImpactEffectSystem
    declare private effectsManager: EffectsManager
    declare private comboSystem: ComboSystem
    // PhysicsSkillVisuals disabled due to PixiJS Batcher conflicts
    // declare private physicsSkillVisuals: PhysicsSkillVisuals

    // UI Systems
    declare private hudSystem: HudSystem
    declare private skillSelectionScreen: SkillSelectionScreen
    declare private resultScreen: ResultScreen
    declare private characterSelectScreen: CharacterSelectScreen
    declare private stageSelectScreen: StageSelectScreen
    declare private openingScreen: OpeningScreen
    declare private pauseScreen: PauseScreen
    declare private loadingScreen: LoadingScreen

    // World generation
    private worldGenerator: WorldGenerator | null = null
    private generatedWorld: GeneratedWorld | null = null

    // Black hole system
    private blackHoleContainer: Container | null = null
    private blackHoleSystem: BlackHoleSystem | null = null
    private blackHoleDamageCooldown = 0 // Cooldown between damage ticks

    // Enemy spawn (controlled by difficulty config)
    private spawnTimer = 0
    private _difficulty: DifficultyConfig | null = null
    private get difficulty(): DifficultyConfig {
        return this._difficulty ?? DEFAULT_DIFFICULTY
    }

    // Animation
    private animPhase = 0

    // Virtual joystick
    declare private joystick: VirtualJoystick

    // Background container (world-space, inside gameContainer)
    declare private bgContainer: Container
    declare private filterBaseGraphic: Graphics // Ensures filter always has content to render

    // Hit effects (shared with systems)
    private hitEffects: HitEffect[] = []

    // Deferred destruction queue - PixiJS v8 requires destruction outside render cycle
    private destructionQueue: Graphics[] = []
    private destructionScheduled = false

    // Debug system - reads from localStorage, set via Settings
    private debugEnabled = localStorage.getItem('wobble-debug-enabled') === 'true'
    declare private debugText: Text
    private debugSessionId = 0
    private debugStateHistory: string[] = []
    private debugDomElement: HTMLDivElement | null = null

    // Scene instance tracking
    private static instanceCounter = 0
    private instanceId: number

    // Track if this scene has been destroyed to prevent stale operations
    private isDestroyed = false

    constructor(app: Application, options?: AdventureSceneOptions) {
        super(app, options)

        // Track scene instances
        PhysicsSurvivorScene.instanceCounter++
        this.instanceId = PhysicsSurvivorScene.instanceCounter
        console.log(
            `[SCENE #${this.instanceId}] PhysicsSurvivorScene CREATED (total created: ${PhysicsSurvivorScene.instanceCounter})`
        )

        if (options?.studiedFormulas) {
            this.studiedFormulas = options.studiedFormulas
        }
    }

    /**
     * Clean up resources when scene is destroyed
     */
    protected onDestroy(): void {
        this.isDestroyed = true
        console.log(`[SCENE #${this.instanceId}] PhysicsSurvivorScene DESTROYED`)

        // Clean up DOM debug overlay
        if (this.debugDomElement) {
            this.debugDomElement.remove()
            this.debugDomElement = null
        }
    }

    protected setup(): void {
        // Initialize difficulty config
        this._difficulty = DEFAULT_DIFFICULTY

        // Game container (holds all world-space elements including background)
        this.gameContainer = new Container()
        this.gameContainer.scale.set(0.75) // Zoom out to show more of the battlefield
        this.container.addChild(this.gameContainer)

        // Background container - inside gameContainer (world-space)
        this.bgContainer = new Container()
        this.gameContainer.addChild(this.bgContainer)

        // Add a fullscreen base graphic to ensure filter always has content to render
        // Without this, PixiJS may skip the filter when bgContainer appears empty
        this.filterBaseGraphic = new Graphics()
        this.bgContainer.addChild(this.filterBaseGraphic)

        this.enemyContainer = new Container()
        this.gameContainer.addChild(this.enemyContainer)

        this.projectileContainer = new Container()
        this.gameContainer.addChild(this.projectileContainer)

        this.effectContainer = new Container()
        this.gameContainer.addChild(this.effectContainer)

        // Persistent aura visuals container (always visible for aura skills)
        this.auraRingsContainer = new Container()
        this.effectContainer.addChild(this.auraRingsContainer)

        this.uiContainer = new Container()
        this.container.addChild(this.uiContainer)

        // Skill selection container
        const skillContainer = new Container()
        skillContainer.visible = false
        this.container.addChild(skillContainer)

        // Result screen container
        const resultContainer = new Container()
        resultContainer.visible = false
        this.container.addChild(resultContainer)

        // Character selection container
        const characterSelectContainer = new Container()
        characterSelectContainer.visible = false
        this.container.addChild(characterSelectContainer)

        // Stage selection container
        const stageSelectContainer = new Container()
        stageSelectContainer.visible = false
        this.container.addChild(stageSelectContainer)

        // Opening screen container
        const openingContainer = new Container()
        openingContainer.visible = false
        this.container.addChild(openingContainer)

        // Wobble World Filter - physics atmosphere (no grid, applies to whole scene)
        this.wobbleFilter = WobbleWorldFilter.subtle()
        this.wobbleFilter.setDimensions(this.width, this.height)
        this.wobbleFilter.gridEnabled = false // Grid is drawn separately on background

        // Grid Filter - background only (grid behind characters)
        this.gridFilter = WobbleWorldFilter.subtle()
        this.gridFilter.setDimensions(this.width, this.height)
        this.gridFilter.gridEnabled = true // Enable grid on background
        // Offset to fix coordinate mismatch between filter UV and screen position
        // (determined empirically using debugMode = true)
        this.gridFilter.setGravityOffset(-0.68, -0.65)
        this.bgContainer.filters = [this.gridFilter] // Apply grid to background only

        // Apply wobble filter only to game container, not UI
        this.gameContainer.filters = [this.wobbleFilter]

        // Initialize core systems
        this.backgroundSystem = new BackgroundSystem({
            worldContainer: this.bgContainer,
            width: this.width,
            height: this.height,
            scale: 0.75, // Match gameContainer scale for proper coverage
        })

        this.enemySystem = new EnemySystem({
            enemyContainer: this.enemyContainer,
            effectContainer: this.effectContainer,
            width: this.width,
            height: this.height,
            baseEnemySpeed: 1.5,
            maxEnemyCount: this.difficulty.maxEnemies,
        })

        this.projectileSystem = new ProjectileSystem({
            projectileContainer: this.projectileContainer,
            effectContainer: this.effectContainer,
            width: this.width,
            height: this.height,
        })

        this.damageTextSystem = new FloatingDamageText(this.effectContainer, {
            poolSize: 30,
        })

        // Use gameContainer (with camera transform) so particles appear at correct world coordinates
        this.impactSystem = new ImpactEffectSystem(this.gameContainer, this.width, this.height, {
            particlePoolSize: 100,
        })

        this.xpOrbSystem = new ExperienceOrbSystem(
            {
                container: this.effectContainer,
                width: this.width,
                height: this.height,
            },
            { poolSize: 100, magnetRadius: 80, collectRadius: 25 }
        )
        this.xpOrbSystem.onXpCollected = (xp) => {
            this.onXpCollected(xp)
        }

        // Pickup system (magnet, health, bomb pickups)
        this.pickupSystem = new PickupSystem(
            {
                container: this.effectContainer,
                width: this.width,
                height: this.height,
            },
            {
                magnetSpawnInterval: 25, // Spawn magnet every 25 seconds
                magnetSpawnChance: 0.6, // 60% chance
                magnetDuration: 4, // 4 seconds of attraction
                spawnRadius: 250,
            }
        )
        this.pickupSystem.onMagnetCollected = () => {
            // Show effect text
            this.damageTextSystem.spawnCustom(
                this.playerX,
                this.playerY - 40,
                '🧲 MAGNET!',
                'combo'
            )
        }

        // World entity systems for each stage
        this.effectsManager = new EffectsManager({
            effectContainer: this.effectContainer,
        })

        // Connect EnemySystem to EffectsManager for physics visualization
        this.enemySystem.updateContext({
            onAddTrailPoint: (trail, x, y) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.effectsManager.addTrailPoint(trail as any, x, y)
            },
            onShowMergeFormula: (x, y, mass1, mass2, totalMass) => {
                this.effectsManager.showMergeFormula(x, y, mass1, mass2, totalMass)
                // Track merged mass for physics stats (momentum conservation)
                this.physicsStats.mergedMass += totalMass
            },
        })

        // PhysicsSkillVisuals disabled due to PixiJS Batcher conflicts
        // this.physicsSkillVisuals = new PhysicsSkillVisuals(this.effectContainer)

        // Initialize combo system (multi-kill mode)
        this.comboSystem = new ComboSystem()
        this.comboSystem.onMultiKill = (killCount, name) => {
            this.handleMultiKill(killCount, name)
        }

        // Initialize UI systems
        this.hudSystem = new HudSystem({
            uiContainer: this.uiContainer,
            width: this.width,
            height: this.height,
        })

        this.skillSelectionScreen = new SkillSelectionScreen({
            container: skillContainer,
            width: this.width,
            height: this.height,
        })
        this.skillSelectionScreen.onSkillSelected = (skillId, newLevel) => {
            this.handleSkillUpgrade(skillId, newLevel)
        }
        this.skillSelectionScreen.onSelectionComplete = () => {
            this.finishLevelUp()
        }
        this.skillSelectionScreen.onImpact = (x, y) => {
            this.impactSystem.trigger(x, y, 'combo')
        }

        this.resultScreen = new ResultScreen({
            container: resultContainer,
            width: this.width,
            height: this.height,
        })
        this.resultScreen.onRetry = () => {
            this.debugLog('resultScreen.onRetry called')
            this.resultScreen.hide()
            this.reset()
            this.play()
        }
        this.resultScreen.onExit = () => {
            this.debugLog('resultScreen.onExit called')
            this.onPlayComplete?.('success')
        }

        this.characterSelectScreen = new CharacterSelectScreen({
            container: characterSelectContainer,
            width: this.width,
            height: this.height,
        })
        this.characterSelectScreen.onSelectCharacter = (character) => {
            this.debugLog(`characterSelectScreen.onSelectCharacter: ${character}`)
            this.showStageSelect(character)
        }
        this.characterSelectScreen.onExit = () => {
            this.debugLog('characterSelectScreen.onExit called')
            this.onPlayComplete?.('success') // This triggers GameScreen's onBack()
        }

        this.stageSelectScreen = new StageSelectScreen({
            container: stageSelectContainer,
            width: this.width,
            height: this.height,
        })
        this.stageSelectScreen.onSelectStage = (stageId) => {
            this.debugLog(`stageSelectScreen.onSelectStage: ${stageId}`)
            this.startWithStage(this.selectedCharacter, stageId)
        }
        this.stageSelectScreen.onBack = () => {
            this.debugLog('stageSelectScreen.onBack called')
            this.showCharacterSelect()
        }

        this.openingScreen = new OpeningScreen({
            container: openingContainer,
            width: this.width,
            height: this.height,
        })
        this.openingScreen.onComplete = () => {
            this.debugLog('openingScreen.onComplete called')
            this.startGameAfterOpening()
        }

        // Loading screen container
        const loadingContainer = new Container()
        loadingContainer.visible = false
        this.container.addChild(loadingContainer)

        this.loadingScreen = new LoadingScreen({
            container: loadingContainer,
            width: this.width,
            height: this.height,
        })

        // Pause screen container
        const pauseContainer = new Container()
        pauseContainer.visible = false
        this.container.addChild(pauseContainer)

        this.pauseScreen = new PauseScreen({
            container: pauseContainer,
            width: this.width,
            height: this.height,
        })
        this.pauseScreen.onResume = () => {
            this.resumeGame()
        }
        this.pauseScreen.onExit = () => {
            this.debugLog('pauseScreen.onExit called')
            this.pauseScreen.hide()
            // Reset isPlaying flag so next play() call triggers onPlayStart()
            // This is critical for mobile where component may not fully unmount
            this.isPlaying = false
            this.debugLog(`isPlaying set to false, calling onPlayComplete`)
            this.onPlayComplete?.('success')
        }

        // Initialize joystick (must be in setup() to be available for onReset)
        this.joystick = new VirtualJoystick({
            maxRadius: 60,
            baseColor: 0x000000,
            knobColor: 0xffffff,
            baseAlpha: 0.2,
            knobAlpha: 0.5,
        })
        this.uiContainer.addChild(this.joystick)
        // Attach to uiContainer for pointer events (not gameContainer which has camera transform)
        this.joystick.attachTo(this.uiContainer)

        // Debug overlay - use DOM element for guaranteed visibility
        if (this.debugEnabled) {
            this.createDebugDomOverlay()
        }

        console.log(`[SCENE #${this.instanceId}] setup() COMPLETED - systems initialized`)
    }

    private createDebugDomOverlay(): void {
        // Remove ALL existing debug overlays (including from other scene instances)
        const existingOverlays = document.querySelectorAll('#survivor-debug-overlay')
        existingOverlays.forEach((el) => el.remove())
        console.log(`[DEBUG] Removed ${existingOverlays.length} existing overlay(s)`)

        if (this.debugDomElement) {
            this.debugDomElement.remove()
            this.debugDomElement = null
        }

        const div = document.createElement('div')
        div.id = 'survivor-debug-overlay'
        div.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 240px;
            max-height: 300px;
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #ff0;
            border-radius: 8px;
            padding: 8px;
            font-family: monospace;
            font-size: 10px;
            color: #0f0;
            z-index: 999999;
            overflow-y: auto;
            pointer-events: none;
        `
        div.innerHTML = '<b style="color:#ff0">DEBUG INIT</b>'
        document.body.appendChild(div)
        this.debugDomElement = div
        console.log('[DEBUG] DOM debug overlay created')
    }

    protected drawBackground(): void {
        this.backgroundSystem.initialize(this.background)
    }

    protected onResize(): void {
        if (this.wobbleFilter) {
            this.wobbleFilter.setDimensions(this.width, this.height)
        }
        if (this.gridFilter) {
            this.gridFilter.setDimensions(this.width, this.height)
        }
    }

    protected onInitialDraw(): void {
        this.gridOverlay.visible = false

        // Infinite map - start at world origin
        this.playerX = 0
        this.playerY = 0
        this.cameraX = 0
        this.cameraY = 0

        this.player = new Wobble({
            size: 35, // Reduced from 50 for zoom-out view
            shape: 'circle',
            expression: 'happy',
            color: 0xf5b041,
            showShadow: true,
        })
        this.player.position.set(this.playerX, this.playerY)
        this.gameContainer.addChild(this.player)

        // Player HP gauge (below player character)
        this.playerHealthBar = new Graphics()
        this.gameContainer.addChild(this.playerHealthBar)
        this.updatePlayerHealthBar()

        // Initialize camera position
        this.gameContainer.pivot.set(this.cameraX, this.cameraY)
        this.gameContainer.position.set(this.centerX, this.centerY)
        // Note: joystick is now initialized in setup() to ensure it's available for onReset()
    }

    private onXpCollected(xp: number): void {
        const oldLevel = this.playerProgress.level
        this.playerProgress.xp += xp

        // Trigger gulp animation when eating XP orbs (Kirby-style)
        if (this.player) {
            this.player.gulp(200)
        }

        const newLevel = getLevelFromXp(this.playerProgress.xp)
        if (newLevel > oldLevel) {
            const levelsGained = newLevel - oldLevel
            this.playerProgress.level = newLevel
            this.playerProgress.pendingLevelUps += levelsGained

            this.damageTextSystem.spawnCustom(
                this.playerX,
                this.playerY - 50,
                `LEVEL ${newLevel}!`,
                'combo'
            )

            if (this.gameState === 'playing') {
                this.showSkillSelection()
            }
        }
    }

    private showSkillSelection(): void {
        this.setGameState('skill-selection', 'showSkillSelection')
        this.skillSelectionScreen.show(this.playerSkills, this.playerProgress.level)
    }

    private handleSkillUpgrade(skillId: string, newLevel: number): void {
        const def = getSkillDefinition(skillId)
        if (!def) return

        // Check if player already has this skill
        const playerSkill = this.playerSkills.find((s) => s.skillId === skillId)

        if (playerSkill) {
            // Upgrade existing skill
            if (playerSkill.level < def.maxLevel) {
                playerSkill.level = newLevel
                this.damageTextSystem.spawnCustom(
                    this.width / 2,
                    this.height / 2 - 50,
                    `${t(def.name, 'ko')} Lv.${newLevel}!`,
                    'combo'
                )
            }
        } else {
            // Add new skill
            this.playerSkills.push({ skillId, level: 1 })
        }

        this.recalculateStats()
    }

    private finishLevelUp(): void {
        this.playerProgress.pendingLevelUps = Math.max(0, this.playerProgress.pendingLevelUps - 1)

        if (this.playerProgress.pendingLevelUps > 0) {
            this.showSkillSelection()
        } else {
            this.skillSelectionScreen.hide()
            this.setGameState('playing', 'finishLevelUp')
            this.updateHUD()
        }
    }

    private handleMultiKill(killCount: number, name: string): void {
        // Visual celebration based on multi-kill count
        if (killCount >= 5) {
            // Epic multi-kill (5+)
            this.impactSystem.triggerSlowMotion(0.3, 0.2)
            this.damageTextSystem.spawnCustom(this.playerX, this.playerY - 70, name, 'critical')
        } else if (killCount >= 3) {
            // Good multi-kill (3-4)
            this.damageTextSystem.spawnCustom(this.playerX, this.playerY - 70, name, 'combo')
        } else {
            // Double kill
            this.damageTextSystem.spawnCustom(this.playerX, this.playerY - 70, name, 'normal')
        }
    }

    private recalculateStats(): void {
        this.stats = { ...DEFAULT_PLAYER_STATS }

        const wobbleStats = WOBBLE_STATS[this.selectedCharacter]
        this.stats.damageMultiplier = wobbleStats.damageMultiplier
        this.stats.fireRateMultiplier = 1 / wobbleStats.fireRateMultiplier
        this.stats.moveSpeedMultiplier = wobbleStats.moveSpeedMultiplier

        const skillStats = calculateCombinedSkillStats(this.playerSkills)

        this.stats.damageMultiplier *= skillStats.damageMultiplier
        this.stats.fireRateMultiplier *= skillStats.fireRateMultiplier
        this.stats.knockbackMultiplier *= skillStats.knockbackMultiplier

        // Original skills
        this.stats.bounceCount = skillStats.bounceCount
        this.stats.piercingCount = skillStats.pierceCount
        this.stats.pierceDamageDecay = skillStats.pierceDamageDecay
        this.stats.explosionRadius = skillStats.explosionRadius
        this.stats.homingTurnRate = skillStats.homingTurnRate
        this.stats.spreadCount = skillStats.spreadCount
        this.stats.spreadAngle = skillStats.spreadAngle
        this.stats.shockwaveInterval = skillStats.shockwaveInterval
        this.stats.shockwaveRadius = skillStats.shockwaveRadius
        this.stats.shockwaveKnockback = skillStats.shockwaveKnockback
        this.stats.shockwaveDamage = skillStats.shockwaveDamage

        // New skills
        this.stats.returnDistance = skillStats.returnDistance
        this.stats.returnDamageMultiplier = skillStats.returnDamageMultiplier
        this.stats.shieldRadius = skillStats.shieldRadius
        this.stats.deflectionStrength = skillStats.deflectionStrength
        this.stats.repulsionRadius = skillStats.repulsionRadius
        this.stats.repulsionForce = skillStats.repulsionForce
        this.stats.floatDuration = skillStats.floatDuration
        this.stats.dropRadius = skillStats.dropRadius
        this.stats.dropDamage = skillStats.dropDamage
        this.stats.ghostCooldown = skillStats.ghostCooldown
        this.stats.ghostDuration = skillStats.ghostDuration
        this.stats.ghostDamage = skillStats.ghostDamage
        this.stats.ghostTrailCount = skillStats.ghostTrailCount
        this.stats.rhythmPeriod = skillStats.rhythmPeriod
        this.stats.peakDamageBonus = skillStats.peakDamageBonus
        this.stats.slashRadius = skillStats.slashRadius
        this.stats.slashDamage = skillStats.slashDamage
        this.stats.slashSpeed = skillStats.slashSpeed
        this.stats.warpRadius = skillStats.warpRadius
        this.stats.slowFactor = skillStats.slowFactor

        // Phase 3 cooldown skills
        this.stats.wavePulseInterval = skillStats.wavePulseInterval
        this.stats.wavelength = skillStats.wavelength
        this.stats.waveAmplitude = skillStats.waveAmplitude
        this.stats.waveSpeed = skillStats.waveSpeed
        this.stats.waveDamage = skillStats.waveDamage
        this.stats.waveCount = skillStats.waveCount
        this.stats.auraRadius = skillStats.auraRadius
        this.stats.radiationDamage = skillStats.radiationDamage
        this.stats.beatFreq1 = skillStats.beatFreq1
        this.stats.beatFreq2 = skillStats.beatFreq2
        this.stats.beatAmplitude = skillStats.beatAmplitude

        // Phase 4 area effect skills
        this.stats.chaosFieldRadius = skillStats.chaosFieldRadius
        this.stats.chaosStrength = skillStats.chaosStrength
        this.stats.flowSpeed = skillStats.flowSpeed
        this.stats.suctionForce = skillStats.suctionForce
        this.stats.streamWidth = skillStats.streamWidth
        this.stats.magneticPullRadius = skillStats.magneticPullRadius
        this.stats.magneticPullStrength = skillStats.magneticPullStrength

        // Phase 5 conditional trigger skills
        this.stats.decayChance = skillStats.decayChance
        this.stats.chainRadius = skillStats.chainRadius
        this.stats.conductRange = skillStats.conductRange
        this.stats.conductRatio = skillStats.conductRatio
        this.stats.maxChain = skillStats.maxChain
        this.stats.velocityThreshold = skillStats.velocityThreshold
        this.stats.escapeBonus = skillStats.escapeBonus
        this.stats.escapeBurstRadius = skillStats.escapeBurstRadius
        this.stats.approachBonus = skillStats.approachBonus
        this.stats.recedeReduction = skillStats.recedeReduction

        // Phase 6 orbital skills
        this.stats.orbitCount = skillStats.orbitCount
        this.stats.orbitRadius = skillStats.orbitRadius
        this.stats.orbitDamage = skillStats.orbitDamage

        // Plasma Discharge (Raiden-style laser)
        this.stats.laserDamage = skillStats.laserDamage
        this.stats.laserChainCount = skillStats.laserChainCount
        this.stats.laserRange = skillStats.laserRange
        this.stats.laserChainRange = skillStats.laserChainRange

        this.applyPassiveToStats()
    }

    private applyPassiveToStats(): void {
        switch (this.passiveTrait) {
            case 'fortitude':
                this.stats.damageReduction = 0.15 + this.playerProgress.level * 0.02
                break
            case 'critical-edge':
                this.stats.critChance = 0.15
                this.stats.critMultiplier = 2.5
                break
            case 'lucky-star':
                this.stats.xpMultiplier = 1.2
                break
            case 'guardian-aura':
                this.stats.guardianAuraRadius = 100
                break
        }
    }

    private updateHUD(): void {
        // Calculate cooldowns for skills that have them
        const cooldowns: SkillCooldown[] = []

        // Shockwave (centripetal-pulse)
        if (this.stats.shockwaveInterval > 0) {
            cooldowns.push({
                skillId: 'centripetal-pulse',
                current: this.stats.shockwaveInterval - this.shockwaveTimer,
                max: this.stats.shockwaveInterval,
            })
        }

        // Wave Pulse (wave)
        if (this.stats.wavePulseInterval > 0) {
            cooldowns.push({
                skillId: 'wave-pulse',
                current: this.stats.wavePulseInterval - this.wavePulseTimer,
                max: this.stats.wavePulseInterval,
            })
        }

        // Buoyant Bomb (buoyancy)
        if (this.stats.floatDuration > 0) {
            const bombInterval = 3 // Bomb spawns every 3 seconds
            cooldowns.push({
                skillId: 'buoyant-bomb',
                current: bombInterval - this.buoyantBombTimer,
                max: bombInterval,
            })
        }

        // Ghost Mode (Quantum Tunneling)
        if (this.stats.ghostCooldown > 0) {
            // Show cooldown timer when not in ghost mode
            // Show duration remaining when in ghost mode
            if (this.isGhostMode) {
                cooldowns.push({
                    skillId: 'quantum-tunnel',
                    current: 0, // Active = no cooldown shown
                    max: this.stats.ghostDuration,
                })
            } else {
                cooldowns.push({
                    skillId: 'quantum-tunnel',
                    current: this.ghostCooldownTimer,
                    max: this.stats.ghostCooldown,
                })
            }
        }

        // Convert skill damage stats to array for HUD
        const skillStats = Array.from(this.skillDamageStats.entries()).map(([skillId, data]) => ({
            skillId,
            totalDamage: data.totalDamage,
            activations: data.activations,
            slowTime: data.slowTime,
            deflections: data.deflections,
            pushForce: data.pushForce,
            pullForce: data.pullForce,
            chaosApplied: data.chaosApplied,
            bounces: data.bounces,
            pierces: data.pierces,
        }))

        this.hudSystem.update({
            health: this.playerHealth,
            maxHealth: this.maxPlayerHealth,
            progress: this.playerProgress,
            gameTime: this.gameTime,
            skills: this.playerSkills,
            cooldowns,
            skillStats,
        })

        // Update combo display
        this.hudSystem.updateCombo(this.comboSystem.getState(), this.comboSystem.getComboWindow())
    }

    /**
     * Update player HP gauge (follows player in world space)
     */
    private updatePlayerHealthBar(): void {
        if (!this.playerHealthBar) return

        this.playerHealthBar.clear()

        const barWidth = 40
        const barHeight = 4
        const barY = 28 // Distance below player center

        // Position bar below player
        const barX = this.playerX - barWidth / 2
        const barYPos = this.playerY + barY

        // Background (dark)
        this.playerHealthBar.roundRect(barX, barYPos, barWidth, barHeight, 2)
        this.playerHealthBar.fill({ color: 0x1a1a2e, alpha: 0.8 })

        // Health fill
        const healthRatio = Math.max(0, this.playerHealth / this.maxPlayerHealth)
        const fillWidth = barWidth * healthRatio

        if (fillWidth > 0) {
            // Color based on health
            let fillColor = 0x2ecc71 // Green
            if (healthRatio < 0.3) {
                fillColor = 0xe74c3c // Red
            } else if (healthRatio < 0.6) {
                fillColor = 0xf39c12 // Orange
            }

            this.playerHealthBar.roundRect(barX, barYPos, fillWidth, barHeight, 2)
            this.playerHealthBar.fill({ color: fillColor, alpha: 0.9 })
        }

        // Border
        this.playerHealthBar.roundRect(barX, barYPos, barWidth, barHeight, 2)
        this.playerHealthBar.stroke({ color: 0x2a2a4e, width: 1 })
    }

    /**
     * Track damage dealt by a specific skill
     */
    private trackSkillDamage(skillId: string, damage: number): void {
        const existing = this.skillDamageStats.get(skillId)
        if (existing) {
            existing.totalDamage += damage
            existing.activations++
        } else {
            this.skillDamageStats.set(skillId, { totalDamage: damage, activations: 1 })
        }
    }

    /**
     * Track special effect for a skill (slow, deflect, push, pull, chaos, etc.)
     */
    private trackSkillEffect(
        skillId: string,
        effectType:
            | 'slowTime'
            | 'deflections'
            | 'pushForce'
            | 'pullForce'
            | 'chaosApplied'
            | 'bounces'
            | 'pierces',
        value: number
    ): void {
        const existing = this.skillDamageStats.get(skillId)
        if (existing) {
            existing[effectType] = (existing[effectType] || 0) + value
        } else {
            this.skillDamageStats.set(skillId, {
                totalDamage: 0,
                activations: 0,
                [effectType]: value,
            })
        }
    }

    /**
     * Auto-fire projectiles based on fire rate
     * Only fires if player has a projectile-based skill active (kinetic-shot)
     */
    private updateAutoFire(deltaSeconds: number): void {
        // Only fire if player has kinetic-shot skill (projectile base skill)
        const hasProjectileSkill = this.playerSkills.some((s) => s.skillId === 'kinetic-shot')
        if (!hasProjectileSkill) return

        // Fire rate is controlled by fireRateMultiplier (lower = faster)
        const fireInterval = this.baseFireInterval * this.stats.fireRateMultiplier

        this.shootTimer += deltaSeconds

        if (this.shootTimer >= fireInterval) {
            this.shootTimer = 0

            // Fire projectile toward nearest enemy
            this.projectileSystem.fire(
                this.playerX,
                this.playerY,
                this.enemySystem.enemies,
                this.stats
            )
        }
    }

    private updateProjectiles(delta: number): void {
        this.projectileSystem.update(
            delta,
            this.enemySystem.enemies,
            this.stats,
            this.cameraX,
            this.cameraY
        )

        // Track elastic bounces for physics stats and skill stats
        const bounceCount = this.projectileSystem.getAndResetBounceCount()
        this.physicsStats.elasticBounces += bounceCount
        if (bounceCount > 0) {
            this.trackSkillEffect('elastic-bounce', 'bounces', bounceCount)
        }

        // Track pierces for skill stats
        const pierceCount = this.projectileSystem.getAndResetPierceCount()
        if (pierceCount > 0) {
            this.trackSkillEffect('momentum-pierce', 'pierces', pierceCount)
        }

        this.projectileSystem.checkCollisions(
            this.enemySystem.enemies,
            this.stats,
            this.hitEffects,
            () => {
                this.score += 10
                useCollectionStore.getState().unlockWobble('shadow')
            },
            (x, y) => this.createExplosion(x, y),
            (x, y, damage, isCritical) => {
                this.damageTextSystem.spawn(x, y, damage, isCritical ? 'critical' : 'normal')
                this.impactSystem.trigger(x, y, isCritical ? 'critical' : 'hit')

                for (const enemy of this.enemySystem.enemies) {
                    const dx = enemy.x - x
                    const dy = enemy.y - (y + enemy.size / 2)
                    if (Math.abs(dx) < enemy.size && Math.abs(dy) < enemy.size && enemy.wobble) {
                        break
                    }
                }
            },
            // Knockback trail callback - visualizes F=ma (lighter = thicker trail)
            (enemy, knockbackVx, knockbackVy) => {
                // Track momentum transfer (p = mv)
                const knockbackMag = Math.sqrt(
                    knockbackVx * knockbackVx + knockbackVy * knockbackVy
                )
                this.physicsStats.totalMomentum += enemy.mass * knockbackMag

                // Only show trail for significant knockback
                if (knockbackMag > 3) {
                    const tierColors: Record<EnemyTier, number> = {
                        small: 0xff6666,
                        medium: 0xff9944,
                        large: 0xcc44ff,
                        boss: 0xffdd00,
                    }
                    const trail = this.effectsManager.startKnockbackTrail(
                        enemy.x,
                        enemy.y,
                        enemy.mass,
                        tierColors[enemy.tier]
                    )
                    // Store trail reference on enemy for position updates
                    enemy.knockbackTrail = trail
                }
            },
            // Physics impact callback - particle count proportional to KE = ½mv²
            (x, y, damage, projectileSpeed, enemyMass, knockbackDir) => {
                this.impactSystem.triggerPhysicsImpact(
                    x,
                    y,
                    damage,
                    projectileSpeed,
                    enemyMass,
                    undefined, // auto-color based on energy
                    knockbackDir
                )
            }
        )
    }

    private updateEnemiesAndMerges(delta: number, deltaSeconds: number): void {
        this.enemySystem.update(delta, this.playerX, this.playerY, this.animPhase)

        this.enemySystem.checkCollisions(deltaSeconds, this.hitEffects)
        this.enemySystem.updateMerges(this.gameTime, this.hitEffects)
        this.enemySystem.cleanupOverlapTracker()
        // Clean up enemies that drifted too far from camera (infinite map)
        this.enemySystem.cleanupOffScreen(this.cameraX, this.cameraY)

        const deadEnemies = this.enemySystem.getDeadEnemies()
        for (const enemy of deadEnemies) {
            // Register kill with combo system
            this.comboSystem.registerKill()

            const tierColors: Record<EnemyTier, number> = {
                small: 0xff6666,
                medium: 0xff9944,
                large: 0xcc44ff,
                boss: 0xffdd00,
            }
            const enemyColor = tierColors[enemy.tier]
            this.impactSystem.triggerKill(enemy.x, enemy.y, enemyColor)

            this.xpOrbSystem.spawnFromEnemy(enemy.x, enemy.y, enemy.tier)

            if (enemy.tier === 'large' || enemy.tier === 'boss') {
                this.impactSystem.triggerSlowMotion(0.2, 0.15)
            }

            // Grid ripple effect - amplitude based on mass (physics: E = ½mv²)
            const rippleAmplitude =
                enemy.tier === 'boss'
                    ? 1.5
                    : enemy.tier === 'large'
                      ? 1.0
                      : enemy.tier === 'medium'
                        ? 0.6
                        : 0.3
            this.gridFilter.addRipple(enemy.x, enemy.y, rippleAmplitude)

            // Phase 5: Decay Chain - chance to trigger chain explosion on death
            this.handleDecayChain(enemy.x, enemy.y)
        }

        this.score += this.enemySystem.cleanupDead()
    }

    private spawnEnemy(): void {
        // Determine tier based on game time
        const tierWeights = getTierWeights(this.gameTime, this.difficulty)
        const roll = Math.random()
        let tier: 'small' | 'medium' | 'large' = 'small'

        if (roll < tierWeights.large) {
            tier = 'large'
        } else if (roll < tierWeights.large + tierWeights.medium) {
            tier = 'medium'
        }

        this.enemySystem.spawnAtEdge(this.gameTime, this.playerX, this.playerY, tier)
    }

    /**
     * Check collisions between player and enemies
     * All enemy contact deals damage (vampire survivors style)
     * Skip damage during ghost mode (quantum tunneling)
     */
    private checkPlayerCollisions(): void {
        // Skip collision damage during ghost mode (player is invincible)
        if (this.isGhostMode) return

        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            const minDist = this.playerSize + enemy.size / 2

            if (dist < minDist) {
                // Take damage from any enemy contact
                this.playerHealth -= 1

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

    /**
     * Apply damage to player (from black hole or other sources)
     */
    private takeDamage(damage: number): void {
        this.playerHealth -= damage

        if (this.playerHealth <= 0) {
            this.playerHealth = 0
            this.gameOver()
        }
    }

    /**
     * Update visual distortion based on black hole proximity
     * CRT filter removed - this is now a no-op but kept for compatibility
     */
    private updateBlackHoleDistortion(): void {
        // CRT distortion removed for cleaner visuals
    }

    /**
     * Update wobble filter intensity based on combat state
     * Creates more dynamic physics atmosphere during intense moments
     */
    private updateWobbleIntensity(): void {
        if (!this.wobbleFilter) return

        // Calculate combat intensity from various factors
        const enemyCount = this.enemySystem.enemies.length
        const enemyFactor = Math.min(enemyCount / 30, 1) * 0.3 // Max 0.3 from enemies

        // Combo factor - more intense during multi-kills
        const multiKillState = this.comboSystem.getMultiKillState()
        const comboFactor = multiKillState.windowTimer > 0 ? 0.2 : 0

        // Health factor - wobble increases as health decreases (danger!)
        const healthPercent = this.playerHealth / this.maxPlayerHealth
        const healthFactor = (1 - healthPercent) * 0.3 // Max 0.3 from low health

        // Combine factors with smooth interpolation
        const targetIntensity = Math.min(enemyFactor + comboFactor + healthFactor, 1)
        this.combatIntensity += (targetIntensity - this.combatIntensity) * 0.05 // Smooth transition

        // Apply to wobble filter
        this.wobbleFilter.wobbleIntensity = this.baseWobbleIntensity + this.combatIntensity * 0.3
        this.wobbleFilter.wobbleSpeed = this.baseWobbleSpeed + this.combatIntensity * 1.5
        this.wobbleFilter.energyPulse = this.baseEnergyPulse + this.combatIntensity * 0.4
    }

    /**
     * Update the filter base graphic to cover the visible area
     * This ensures the gridFilter always has content to render
     * Without content, PixiJS may skip the filter entirely
     */
    private updateFilterBaseGraphic(): void {
        if (!this.filterBaseGraphic) return

        // Calculate visible area in world coordinates (accounting for gameContainer scale)
        const scale = 0.75 // gameContainer scale
        const visibleWidth = this.width / scale
        const visibleHeight = this.height / scale
        const margin = 200 // Extra margin for safety

        // Position centered on camera
        const left = this.cameraX - visibleWidth / 2 - margin
        const top = this.cameraY - visibleHeight / 2 - margin
        const w = visibleWidth + margin * 2
        const h = visibleHeight + margin * 2

        // Draw a transparent rect to give the filter something to work with
        this.filterBaseGraphic.clear()
        this.filterBaseGraphic.rect(left, top, w, h)
        this.filterBaseGraphic.fill({ color: 0x000000, alpha: 0.001 }) // Nearly invisible but gives filter content
    }

    /**
     * Collect gravity sources (enemies, black holes) for grid distortion
     * Sends largest/closest mass objects to shader (max 8)
     */
    private updateGridGravitySources(): void {
        if (!this.gridFilter) return

        const gravitySources: Array<{ x: number; y: number; mass: number }> = []
        const screenRadius = Math.max(this.width, this.height) * 1.5

        // === PROJECTILES - faster = more mass (relativistic effect!) ===
        // Use world coordinates for all positions (filter is on bgContainer which uses world coords)
        const visibleProjectiles = this.projectileSystem.projectiles
            .filter((proj) => {
                const dx = proj.x - this.cameraX
                const dy = proj.y - this.cameraY
                return Math.abs(dx) < screenRadius && Math.abs(dy) < screenRadius
            })
            .map((proj) => {
                // Speed determines mass - faster projectiles warp space more
                const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy)
                const speedMass = speed * 0.015 // Convert speed to mass effect
                // World position (not camera-relative)
                return { x: proj.x, y: proj.y, mass: speedMass * proj.scale }
            })
            .sort((a, b) => b.mass - a.mass)
            .slice(0, 4) // Top 4 fastest projectiles

        for (const proj of visibleProjectiles) {
            gravitySources.push(proj)
        }

        // === ENEMIES - collect largest visible enemies ===
        const visibleEnemies = this.enemySystem.enemies
            .filter((enemy) => {
                const dx = enemy.x - this.cameraX
                const dy = enemy.y - this.cameraY
                return Math.abs(dx) < screenRadius && Math.abs(dy) < screenRadius
            })
            .sort((a, b) => b.mass - a.mass) // Sort by mass descending
            .slice(0, 4) // Take top 4 largest (reduced to make room for projectiles)

        for (const enemy of visibleEnemies) {
            // World position (not camera-relative)
            gravitySources.push({
                x: enemy.x,
                y: enemy.y,
                mass: enemy.mass * 0.06, // Scale mass for visual effect
            })
        }

        this.gridFilter.setGravitySources(gravitySources)
    }

    /**
     * Update all world entity systems and apply their effects
     */
    private updateWorldEntities(deltaSeconds: number): void {
        // Update black hole system
        if (this.blackHoleSystem) {
            this.blackHoleSystem.update(deltaSeconds)

            // Apply gravity to player
            const gravity = this.blackHoleSystem.getGravityAt(this.playerX, this.playerY)
            this.externalVx += gravity.fx * deltaSeconds * 0.1
            this.externalVy += gravity.fy * deltaSeconds * 0.1

            // Apply gravity to enemies
            for (const enemy of this.enemySystem.enemies) {
                const enemyGravity = this.blackHoleSystem.getGravityAt(enemy.x, enemy.y)
                enemy.vx += enemyGravity.fx * deltaSeconds * 0.05
                enemy.vy += enemyGravity.fy * deltaSeconds * 0.05

                // Check if enemy is absorbed by black hole
                if (this.blackHoleSystem.isInsideEventHorizon(enemy.x, enemy.y)) {
                    this.blackHoleSystem.absorbObject(enemy.x, enemy.y, enemy.size, 0xff0000)
                    enemy.health = 0 // Kill the enemy
                }
            }

            // Apply gravity to projectiles
            for (const proj of this.projectileSystem.projectiles) {
                const projGravity = this.blackHoleSystem.getGravityAt(proj.x, proj.y)
                proj.vx += projGravity.fx * deltaSeconds * 0.08
                proj.vy += projGravity.fy * deltaSeconds * 0.08
            }

            // Check if player is inside event horizon
            if (this.blackHoleSystem.isInsideEventHorizon(this.playerX, this.playerY)) {
                // Damage with cooldown (1 damage per 0.5 seconds)
                this.blackHoleDamageCooldown -= deltaSeconds
                if (this.blackHoleDamageCooldown <= 0) {
                    this.takeDamage(3)
                    this.blackHoleDamageCooldown = 0.5
                    // Camera shake disabled - felt like lag
                }

                // Strong push to escape (slingshot effect)
                const bhPos = this.blackHoleSystem.getPosition()
                const escapeX = this.playerX - bhPos.x
                const escapeY = this.playerY - bhPos.y
                const escapeDist = Math.sqrt(escapeX * escapeX + escapeY * escapeY) || 1
                this.externalVx += (escapeX / escapeDist) * 15 * deltaSeconds
                this.externalVy += (escapeY / escapeDist) * 15 * deltaSeconds
            } else {
                // Reset cooldown when outside
                this.blackHoleDamageCooldown = 0
            }

            // Calculate proximity effect for CRT distortion
            const bhPos = this.blackHoleSystem.getPosition()
            const dx = this.playerX - bhPos.x
            const dy = this.playerY - bhPos.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const distortionParams = this.blackHoleSystem.getDistortionParams()
            const maxProximity = distortionParams.radius * 2
            this.blackHoleProximityEffect =
                Math.max(0, 1 - dist / maxProximity) * distortionParams.strength

            // Add black hole to grid distortion
            // Position needs to be relative to camera for shader alignment
            if (this.gridFilter) {
                const sources = [
                    {
                        x: bhPos.x - this.cameraX,
                        y: bhPos.y - this.cameraY,
                        mass: distortionParams.mass * 0.02, // Strong grid distortion
                    },
                ]
                // Add to existing gravity sources
                const existingCount = this.enemySystem.enemies.length
                if (existingCount < 7) {
                    this.gridFilter.setGravitySources([...sources])
                }
            }
        }

        // Update visual distortion based on proximity to any world entity
        this.updateBlackHoleDistortion()

        // Update wobble physics atmosphere based on combat intensity
        this.updateWobbleIntensity()
    }

    private createExplosion(x: number, y: number): void {
        const radius = this.stats.explosionRadius
        const damage = 5 * this.stats.damageMultiplier

        const explosion = new Graphics()
        explosion.circle(0, 0, radius)
        explosion.fill({ color: 0xff6600, alpha: 0.5 })
        explosion.position.set(x, y)
        this.effectContainer.addChild(explosion)

        // PhysicsSkillVisuals disabled due to PixiJS Batcher conflicts
        // this.physicsSkillVisuals.renderPressureWave({ x, y, radius, color: 0xf39c12 })

        this.impactSystem.trigger(x, y, 'explosion')

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

                this.damageTextSystem.spawn(enemy.x, enemy.y - enemy.size / 2, damage, 'explosion')

                if (enemy.wobble) {
                    // Scale punch disabled
                    // this.impactSystem.addScalePunch(enemy.wobble, 0.35, 0.15)
                }
            }
        }

        // Auto-remove explosion effect
        setTimeout(() => {
            this.effectContainer.removeChild(explosion)
            explosion.destroy()
        }, 200)
    }

    private updateHitEffects(delta: number): void {
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i]
            effect.timer -= delta / 60
            effect.graphics.alpha = effect.timer / 0.2
            effect.graphics.scale.set(1 + (0.2 - effect.timer) * 3)

            if (effect.timer <= 0) {
                this.effectContainer.removeChild(effect.graphics)
                this.queueDestroy(effect.graphics)
                this.hitEffects.splice(i, 1)
            }
        }
    }

    /**
     * Queue a Graphics object for deferred destruction.
     * PixiJS v8 with Vulkan/WebGL batching requires destruction outside render cycle.
     */
    private queueDestroy(graphics: Graphics): void {
        this.destructionQueue.push(graphics)
        if (!this.destructionScheduled) {
            this.destructionScheduled = true
            // Use queueMicrotask to defer destruction until after current render cycle
            queueMicrotask(() => this.processDestructionQueue())
        }
    }

    /**
     * Process the destruction queue - called after render cycle completes
     */
    private processDestructionQueue(): void {
        this.destructionScheduled = false
        for (const graphics of this.destructionQueue) {
            if (!graphics.destroyed) {
                graphics.destroy()
            }
        }
        this.destructionQueue.length = 0
    }

    /**
     * Update shockwave skill (원심력 펄스)
     * Shows charging effect while on cooldown
     */
    private updateShockwave(deltaSeconds: number): void {
        // Check if shockwave skill is active
        if (this.stats.shockwaveInterval <= 0) {
            // Clean up graphics if skill was removed
            if (this.shockwaveChargeGraphics) {
                this.effectContainer.removeChild(this.shockwaveChargeGraphics)
                this.shockwaveChargeGraphics.destroy()
                this.shockwaveChargeGraphics = null
            }
            return
        }

        this.shockwaveTimer += deltaSeconds

        // Calculate charge progress (0 to 1)
        const chargeProgress = Math.min(1, this.shockwaveTimer / this.stats.shockwaveInterval)

        // Update charging visual effect
        this.updateShockwaveChargeEffect(chargeProgress, deltaSeconds)

        if (this.shockwaveTimer >= this.stats.shockwaveInterval) {
            this.shockwaveTimer = 0
            this.triggerShockwave()
        }
    }

    /**
     * Update the charging visual effect for shockwave
     */
    private updateShockwaveChargeEffect(progress: number, deltaSeconds: number): void {
        const px = this.playerX
        const py = this.playerY
        const maxRadius = this.stats.shockwaveRadius

        // Create graphics if needed
        if (!this.shockwaveChargeGraphics) {
            this.shockwaveChargeGraphics = new Graphics()
            this.effectContainer.addChild(this.shockwaveChargeGraphics)

            // Initialize orbiting particles
            this.shockwaveChargeParticles = []
            for (let i = 0; i < 6; i++) {
                this.shockwaveChargeParticles.push({
                    angle: (Math.PI * 2 * i) / 6,
                    radius: maxRadius * 0.8,
                    speed: 2 + Math.random() * 0.5,
                    size: 3 + Math.random() * 2,
                })
            }
        }

        const g = this.shockwaveChargeGraphics
        g.clear()

        // Colors
        const baseColor = 0x2ecc71
        const glowColor = 0x58d68d

        // === Effect 1: Outer charging ring (grows with progress) ===
        const ringRadius = 20 + (maxRadius - 20) * progress * 0.4
        const ringAlpha = 0.15 + progress * 0.2

        // Dashed/segmented ring effect
        const segments = 8
        for (let i = 0; i < segments; i++) {
            const startAngle = (Math.PI * 2 * i) / segments + this.animPhase * 0.5
            const endAngle = startAngle + ((Math.PI * 2) / segments) * 0.6 * progress

            g.arc(px, py, ringRadius, startAngle, endAngle)
            g.stroke({
                color: baseColor,
                width: 2 + progress * 2,
                alpha: ringAlpha,
            })
        }

        // === Effect 2: Inner pulsing glow ===
        if (progress > 0.3) {
            const pulsePhase = Math.sin(this.animPhase * 4) * 0.5 + 0.5
            const innerRadius = 15 + pulsePhase * 10 * progress
            const innerAlpha = (progress - 0.3) * 0.3 * (0.5 + pulsePhase * 0.5)

            g.circle(px, py, innerRadius)
            g.fill({ color: baseColor, alpha: innerAlpha })
        }

        // === Effect 3: Orbiting energy particles (spiral inward as charging) ===
        for (const particle of this.shockwaveChargeParticles) {
            // Rotate and spiral inward
            particle.angle += particle.speed * deltaSeconds
            particle.radius = maxRadius * (0.8 - progress * 0.5) + Math.sin(particle.angle * 2) * 10

            const particleX = px + Math.cos(particle.angle) * particle.radius
            const particleY = py + Math.sin(particle.angle) * particle.radius

            // Particle grows with progress
            const particleSize = particle.size * (0.5 + progress * 0.8)
            const particleAlpha = 0.3 + progress * 0.5

            g.circle(particleX, particleY, particleSize)
            g.fill({ color: glowColor, alpha: particleAlpha })
        }

        // === Effect 4: Ready flash when fully charged ===
        if (progress > 0.9) {
            const readyPulse = Math.sin(this.animPhase * 10) * 0.5 + 0.5
            const readyRadius = 25 + readyPulse * 15

            g.circle(px, py, readyRadius)
            g.fill({ color: baseColor, alpha: 0.2 + readyPulse * 0.2 })

            // Outer ready ring
            g.circle(px, py, ringRadius + 5)
            g.stroke({
                color: 0xffffff,
                width: 2,
                alpha: 0.3 + readyPulse * 0.3,
            })
        }
    }

    /**
     * Trigger shockwave effect - pushes enemies away from player
     * Physics: Centripetal Force F = mv²/r creates outward pressure wave
     */
    private triggerShockwave(): void {
        const radius = this.stats.shockwaveRadius
        const knockback = this.stats.shockwaveKnockback
        const px = this.playerX
        const py = this.playerY

        // Colors for the pulse effect
        const primaryColor = 0x2ecc71 // Green
        const secondaryColor = 0x27ae60 // Darker green
        const accentColor = 0x58d68d // Light green

        // === VISUAL EFFECT 1: Multi-ring expansion ===
        // Create 3 rings with staggered timing for depth
        for (let i = 0; i < 3; i++) {
            const delay = i * 50 // 50ms stagger
            setTimeout(() => {
                const ring = new Graphics()
                ring.position.set(px, py)
                this.effectContainer.addChild(ring)

                let ringRadius = 15
                const ringColor = i === 0 ? primaryColor : i === 1 ? secondaryColor : accentColor
                const baseWidth = 6 - i * 1.5 // Outer rings thinner
                const expandDuration = 0.3 + i * 0.05

                const startTime = performance.now()
                const ringUpdate = () => {
                    const elapsed = (performance.now() - startTime) / 1000
                    const progress = Math.min(1, elapsed / expandDuration)

                    if (progress >= 1 || ring.destroyed) {
                        if (!ring.destroyed) {
                            this.effectContainer.removeChild(ring)
                            ring.destroy()
                        }
                        return
                    }

                    // Ease out for smooth expansion
                    const eased = 1 - Math.pow(1 - progress, 3)
                    ringRadius = 15 + (radius - 15) * eased

                    ring.clear()
                    ring.circle(0, 0, ringRadius)
                    ring.stroke({
                        color: ringColor,
                        width: baseWidth * (1 - progress * 0.7),
                        alpha: 0.9 * (1 - progress),
                    })

                    requestAnimationFrame(ringUpdate)
                }
                requestAnimationFrame(ringUpdate)
            }, delay)
        }

        // === VISUAL EFFECT 2: Center flash/glow ===
        const centerGlow = new Graphics()
        centerGlow.circle(0, 0, 30)
        centerGlow.fill({ color: primaryColor, alpha: 0.6 })
        centerGlow.position.set(px, py)
        this.effectContainer.addChild(centerGlow)

        let glowPhase = 0
        const glowUpdate = () => {
            glowPhase += 1 / 10 // 10 frames
            if (glowPhase >= 1 || centerGlow.destroyed) {
                if (!centerGlow.destroyed) {
                    this.effectContainer.removeChild(centerGlow)
                    centerGlow.destroy()
                }
                return
            }

            centerGlow.clear()
            const glowRadius = 30 + 20 * glowPhase
            centerGlow.circle(0, 0, glowRadius)
            centerGlow.fill({ color: primaryColor, alpha: 0.6 * (1 - glowPhase) })

            requestAnimationFrame(glowUpdate)
        }
        requestAnimationFrame(glowUpdate)

        // === VISUAL EFFECT 3: Radial energy particles ===
        const particleCount = 12
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3
            const speed = 4 + Math.random() * 3
            const particle = new Graphics()

            // Diamond/energy shape
            const size = 4 + Math.random() * 3
            particle.moveTo(0, -size)
            particle.lineTo(size * 0.5, 0)
            particle.lineTo(0, size)
            particle.lineTo(-size * 0.5, 0)
            particle.closePath()
            particle.fill(accentColor)
            particle.position.set(px, py)
            particle.rotation = angle
            this.effectContainer.addChild(particle)

            let pLife = 1
            const pVx = Math.cos(angle) * speed
            const pVy = Math.sin(angle) * speed
            const pUpdate = () => {
                pLife -= 0.04
                if (pLife <= 0 || particle.destroyed) {
                    if (!particle.destroyed) {
                        this.effectContainer.removeChild(particle)
                        particle.destroy()
                    }
                    return
                }

                particle.position.x += pVx
                particle.position.y += pVy
                particle.alpha = pLife
                particle.scale.set(pLife)

                requestAnimationFrame(pUpdate)
            }
            requestAnimationFrame(pUpdate)
        }

        // === GAMEPLAY: Apply knockback and damage ===
        let hitCount = 0
        let totalDamage = 0
        const baseDamage = this.stats.shockwaveDamage || 40 // Use skill damage
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - px
            const dy = enemy.y - py
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < radius && dist > 0) {
                // Knockback force: stronger when closer (F ∝ 1/r)
                const distFactor = 1 - dist / radius
                const force = (knockback * distFactor) / Math.sqrt(enemy.mass)

                // Push away from player
                const nx = dx / dist
                const ny = dy / dist
                enemy.vx += nx * force * 0.2 // Strong knockback
                enemy.vy += ny * force * 0.2

                // Damage: full at center, 50% at edge (0.5 + distFactor * 0.5)
                const damageScale = 0.5 + distFactor * 0.5
                const damage = baseDamage * damageScale * this.stats.damageMultiplier
                enemy.health -= damage
                totalDamage += damage

                // Track damage
                this.trackSkillDamage('centripetal-pulse', damage)
                hitCount++

                // === VISUAL EFFECT 4: Hit sparks on enemies ===
                this.spawnPulseHitEffect(enemy.x, enemy.y, nx, ny, distFactor)

                // Show damage number on each enemy hit
                this.damageTextSystem.spawn(enemy.x, enemy.y - 20, Math.round(damage))
            }
        }

        // Show hit summary
        if (hitCount > 0) {
            this.damageTextSystem.spawnCustom(px, py - 50, `PULSE ×${hitCount}`, 'combo')
        }
    }

    /**
     * Spawn hit effect when pulse hits an enemy
     */
    private spawnPulseHitEffect(
        x: number,
        y: number,
        nx: number,
        ny: number,
        intensity: number
    ): void {
        // Create small burst particles in knockback direction
        const sparkCount = 3 + Math.floor(intensity * 3)
        const baseAngle = Math.atan2(ny, nx)

        for (let i = 0; i < sparkCount; i++) {
            const spark = new Graphics()
            const angle = baseAngle + (Math.random() - 0.5) * 1.2
            const speed = 2 + Math.random() * 3 * intensity
            const size = 2 + Math.random() * 2

            spark.circle(0, 0, size)
            spark.fill(0x58d68d)
            spark.position.set(x, y)
            this.effectContainer.addChild(spark)

            let life = 1
            const vx = Math.cos(angle) * speed
            const vy = Math.sin(angle) * speed
            const sparkUpdate = () => {
                life -= 0.08
                if (life <= 0 || spark.destroyed) {
                    if (!spark.destroyed) {
                        this.effectContainer.removeChild(spark)
                        spark.destroy()
                    }
                    return
                }

                spark.position.x += vx
                spark.position.y += vy
                spark.alpha = life
                spark.scale.set(0.5 + life * 0.5)

                requestAnimationFrame(sparkUpdate)
            }
            requestAnimationFrame(sparkUpdate)
        }

        // Impact flash at hit position
        const flash = new Graphics()
        flash.circle(0, 0, 8 + intensity * 8)
        flash.fill({ color: 0x2ecc71, alpha: 0.5 })
        flash.position.set(x, y)
        this.effectContainer.addChild(flash)

        let flashLife = 1
        const flashUpdate = () => {
            flashLife -= 0.15
            if (flashLife <= 0 || flash.destroyed) {
                if (!flash.destroyed) {
                    this.effectContainer.removeChild(flash)
                    flash.destroy()
                }
                return
            }
            flash.alpha = flashLife * 0.5
            flash.scale.set(1 + (1 - flashLife) * 0.5)
            requestAnimationFrame(flashUpdate)
        }
        requestAnimationFrame(flashUpdate)
    }

    // ============================================
    // PHASE 3: COOLDOWN-BASED SKILLS
    // ============================================

    /**
     * Wave Pulse (파동 펄스) - periodic expanding wave that damages enemies
     * Based on wave physics: amplitude decreases with distance
     * Differentiated from Centripetal Pulse: multiple sine-wave rings, multi-hit, faster cooldown
     */
    private updateWavePulse(deltaSeconds: number): void {
        // Check if wave pulse skill is active
        if (this.stats.wavePulseInterval <= 0 || this.stats.waveAmplitude <= 0) return

        this.wavePulseTimer += deltaSeconds

        // Calculate charge progress for visual effect
        const chargeProgress = Math.min(1, this.wavePulseTimer / this.stats.wavePulseInterval)
        this.updateWaveChargeEffect(chargeProgress, deltaSeconds)

        if (this.wavePulseTimer >= this.stats.wavePulseInterval) {
            this.wavePulseTimer = 0
            this.triggerWavePulse()
        }

        // Update active waves
        this.updateActiveWaves(deltaSeconds)
    }

    /**
     * Update wave charge visual effect - concentric ripples building up
     */
    private updateWaveChargeEffect(progress: number, deltaSeconds: number): void {
        if (progress <= 0) {
            if (this.waveChargeGraphics) {
                this.effectContainer.removeChild(this.waveChargeGraphics)
                this.waveChargeGraphics.destroy()
                this.waveChargeGraphics = null
            }
            this.waveRipples = []
            return
        }

        if (!this.waveChargeGraphics) {
            this.waveChargeGraphics = new Graphics()
            this.effectContainer.addChild(this.waveChargeGraphics)
        }

        // Spawn ripples that converge to center (opposite of Centripetal which diverges)
        const rippleSpawnRate = 3 + progress * 5
        if (Math.random() < rippleSpawnRate * deltaSeconds) {
            const angle = Math.random() * Math.PI * 2
            const maxDist = 40 + progress * 30
            this.waveRipples.push({
                angle,
                dist: maxDist,
                size: 2 + Math.random() * 3,
            })
        }

        // Update ripples (move toward center)
        for (let i = this.waveRipples.length - 1; i >= 0; i--) {
            const ripple = this.waveRipples[i]
            ripple.dist -= 60 * deltaSeconds // Move inward
            if (ripple.dist <= 5) {
                this.waveRipples.splice(i, 1)
            }
        }

        const g = this.waveChargeGraphics
        g.clear()
        g.position.set(this.playerX, this.playerY)

        // Draw concentric charging rings (like water ripples converging)
        const ringCount = Math.floor(progress * 3) + 1
        for (let i = 0; i < ringCount; i++) {
            const ringProgress = (i / ringCount + this.gameTime * 0.5) % 1
            const ringRadius = 50 * (1 - ringProgress) + 5
            const ringAlpha = ringProgress * 0.3 * progress

            g.circle(0, 0, ringRadius)
            g.stroke({ color: 0x44ccff, width: 1.5, alpha: ringAlpha })
        }

        // Central glow builds up
        if (progress > 0.3) {
            const glowAlpha = (progress - 0.3) * 0.4
            const glowRadius = 8 + progress * 12
            g.circle(0, 0, glowRadius)
            g.fill({ color: 0x66ddff, alpha: glowAlpha })
        }

        // Draw converging ripple particles
        for (const ripple of this.waveRipples) {
            const rx = Math.cos(ripple.angle) * ripple.dist
            const ry = Math.sin(ripple.angle) * ripple.dist
            const alpha = 0.3 + (1 - ripple.dist / 70) * 0.5

            g.circle(rx, ry, ripple.size)
            g.fill({ color: 0x88eeff, alpha })
        }

        // Ready flash when fully charged
        if (progress > 0.9) {
            const flashAlpha = Math.sin(this.gameTime * 15) * 0.2 + 0.3
            g.circle(0, 0, 25)
            g.fill({ color: 0xaaffff, alpha: flashAlpha * (progress - 0.9) * 10 })
        }
    }

    /**
     * Trigger a new wave pulse from player position
     * Spawns multiple staggered sine-wave rings
     */
    private triggerWavePulse(): void {
        const maxRadius = this.stats.wavelength * 4 // Wave extends further
        const waveCount = this.stats.waveCount || 2

        // Clear charge graphics
        if (this.waveChargeGraphics) {
            this.waveChargeGraphics.clear()
        }
        this.waveRipples = []

        // Center burst effect
        this.spawnWaveBurstEffect()

        // Spawn multiple wave rings with staggered timing
        for (let i = 0; i < waveCount; i++) {
            const wave = new Graphics()
            wave.position.set(this.playerX, this.playerY)
            this.effectContainer.addChild(wave)

            this.activeWaves.push({
                x: this.playerX,
                y: this.playerY,
                radius: 5, // Start small
                maxRadius,
                graphics: wave,
                hitEnemies: new Set(),
                ringIndex: i,
                spawnTime: this.gameTime + i * 0.15, // Stagger spawn
            })
        }

        // Visual feedback
        this.damageTextSystem.spawnCustom(this.playerX, this.playerY - 30, `∿ WAVE`, 'combo')
    }

    /**
     * Spawn burst effect at wave origin
     */
    private spawnWaveBurstEffect(): void {
        const burstGraphics = new Graphics()
        burstGraphics.position.set(this.playerX, this.playerY)
        this.effectContainer.addChild(burstGraphics)

        // Animate the burst
        let burstProgress = 0
        const animateBurst = () => {
            burstProgress += 0.08
            if (burstProgress >= 1) {
                this.effectContainer.removeChild(burstGraphics)
                burstGraphics.destroy()
                return
            }

            burstGraphics.clear()

            // Central flash
            const flashAlpha = (1 - burstProgress) * 0.8
            const flashRadius = 15 + burstProgress * 25
            burstGraphics.circle(0, 0, flashRadius)
            burstGraphics.fill({ color: 0xaaffff, alpha: flashAlpha })

            // Radiating lines
            const lineCount = 8
            for (let i = 0; i < lineCount; i++) {
                const angle = (i / lineCount) * Math.PI * 2
                const innerR = 10 + burstProgress * 30
                const outerR = 20 + burstProgress * 50
                const x1 = Math.cos(angle) * innerR
                const y1 = Math.sin(angle) * innerR
                const x2 = Math.cos(angle) * outerR
                const y2 = Math.sin(angle) * outerR

                burstGraphics.moveTo(x1, y1)
                burstGraphics.lineTo(x2, y2)
                burstGraphics.stroke({
                    color: 0x66ddff,
                    width: 2,
                    alpha: (1 - burstProgress) * 0.6,
                })
            }

            requestAnimationFrame(animateBurst)
        }
        requestAnimationFrame(animateBurst)
    }

    /**
     * Spawn hit effect when wave damages enemy
     */
    private spawnWaveHitEffect(x: number, y: number): void {
        const hitGraphics = new Graphics()
        hitGraphics.position.set(x, y)
        this.effectContainer.addChild(hitGraphics)

        let hitProgress = 0
        const animateHit = () => {
            hitProgress += 0.12
            if (hitProgress >= 1) {
                this.effectContainer.removeChild(hitGraphics)
                hitGraphics.destroy()
                return
            }

            hitGraphics.clear()

            // Small ripple effect
            const rippleRadius = 5 + hitProgress * 15
            const alpha = (1 - hitProgress) * 0.6
            hitGraphics.circle(0, 0, rippleRadius)
            hitGraphics.stroke({ color: 0x66eeff, width: 2, alpha })

            // Inner glow
            hitGraphics.circle(0, 0, rippleRadius * 0.5)
            hitGraphics.fill({ color: 0xaaffff, alpha: alpha * 0.5 })

            requestAnimationFrame(animateHit)
        }
        requestAnimationFrame(animateHit)
    }

    /**
     * Update active wave visuals and damage
     * Features: sine-wave distortion, multi-hit with tracking, flowing visuals
     */
    private updateActiveWaves(deltaSeconds: number): void {
        for (let i = this.activeWaves.length - 1; i >= 0; i--) {
            const wave = this.activeWaves[i]

            // Wait for staggered spawn time
            if (this.gameTime < wave.spawnTime) {
                continue
            }

            // Expand wave
            wave.radius += this.stats.waveSpeed * deltaSeconds
            const progress = wave.radius / wave.maxRadius

            // Remove completed waves
            if (progress >= 1) {
                this.effectContainer.removeChild(wave.graphics)
                wave.graphics.destroy()
                this.activeWaves.splice(i, 1)
                continue
            }

            // Draw sine-wave ring (wavy circle)
            const g = wave.graphics
            g.clear()

            // Calculate wave properties
            const wavePhase = (wave.radius / this.stats.wavelength) * Math.PI * 2
            const baseAlpha = (1 - progress) * 0.7

            // Draw wavy ring with sine distortion
            const segments = 48
            const points: Array<{ x: number; y: number }> = []

            for (let s = 0; s <= segments; s++) {
                const angle = (s / segments) * Math.PI * 2
                // Sine wave distortion on the radius
                const sineOffset =
                    Math.sin(angle * 6 + wavePhase + (wave.ringIndex * Math.PI) / 3) *
                    this.stats.waveAmplitude *
                    0.15
                const r = wave.radius + sineOffset

                points.push({
                    x: Math.cos(angle) * r,
                    y: Math.sin(angle) * r,
                })
            }

            // Draw the wavy ring
            if (points.length > 0) {
                g.moveTo(points[0].x, points[0].y)
                for (let p = 1; p < points.length; p++) {
                    g.lineTo(points[p].x, points[p].y)
                }
                g.closePath()

                // Main wave stroke - cyan/blue gradient based on ring index
                const hueShift = wave.ringIndex * 0.1
                const baseColor = 0x44ccff
                const strokeWidth = 2 + Math.sin(wavePhase) * 1.5

                g.stroke({ color: baseColor, width: strokeWidth, alpha: baseAlpha })

                // Inner glow line
                g.moveTo(points[0].x * 0.97, points[0].y * 0.97)
                for (let p = 1; p < points.length; p++) {
                    g.lineTo(points[p].x * 0.97, points[p].y * 0.97)
                }
                g.stroke({ color: 0x88eeff, width: 1, alpha: baseAlpha * 0.5 })
            }

            // Add flowing particles along the wave
            if (Math.random() < 0.3) {
                const particleAngle = Math.random() * Math.PI * 2
                const sineOffset =
                    Math.sin(particleAngle * 6 + wavePhase) * this.stats.waveAmplitude * 0.15
                const r = wave.radius + sineOffset
                const px = Math.cos(particleAngle) * r
                const py = Math.sin(particleAngle) * r

                g.circle(px, py, 2 + Math.random() * 2)
                g.fill({ color: 0xaaffff, alpha: baseAlpha * 0.8 })
            }

            // Damage enemies that the wave passes through
            const waveDamage = this.stats.waveDamage || this.stats.waveAmplitude * 0.3
            const waveBandWidth = this.stats.wavelength * 0.4

            for (const enemy of this.enemySystem.enemies) {
                // Skip if already hit by this wave ring
                if (wave.hitEnemies.has(enemy.id)) continue

                const dx = enemy.x - wave.x
                const dy = enemy.y - wave.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                // Check if enemy is in wave band
                if (dist > wave.radius - waveBandWidth && dist < wave.radius + waveBandWidth) {
                    // Mark as hit
                    wave.hitEnemies.add(enemy.id)

                    // Damage scales with progress (stronger at start)
                    const damageMultiplier = 1 - progress * 0.5
                    const actualDamage = waveDamage * damageMultiplier * this.stats.damageMultiplier
                    enemy.health -= actualDamage
                    this.trackSkillDamage('wave-pulse', actualDamage)

                    // Gentle push (not knockback - waves flow through)
                    if (dist > 0) {
                        const nx = dx / dist
                        const ny = dy / dist
                        const push = 3 / Math.sqrt(enemy.mass)
                        enemy.vx += nx * push
                        enemy.vy += ny * push
                    }

                    // Spawn hit effect
                    this.spawnWaveHitEffect(enemy.x, enemy.y)
                }
            }
        }
    }

    /**
     * Radiant Aura (복사 오라) - continuous damage to nearby enemies
     * Based on Stefan-Boltzmann law: radiation intensity
     */
    private updateRadiantAura(deltaSeconds: number): void {
        if (this.stats.auraRadius <= 0 || this.stats.radiationDamage <= 0) return

        this.auraTimer += deltaSeconds

        // Apply damage every 0.5 seconds to prevent excessive damage
        if (this.auraTimer >= 0.5) {
            this.auraTimer = 0

            let hitCount = 0
            const auraRadius = this.stats.auraRadius
            const auraRadiusSq = auraRadius * auraRadius
            for (const enemy of this.enemySystem.enemies) {
                const dx = enemy.x - this.playerX
                const dy = enemy.y - this.playerY

                // Early culling with Manhattan distance
                if (Math.abs(dx) > auraRadius || Math.abs(dy) > auraRadius) continue

                const distSq = dx * dx + dy * dy
                if (distSq < auraRadiusSq) {
                    // Only sqrt when confirmed in range
                    const dist = Math.sqrt(distSq)
                    // Radiation damage decreases with distance (inverse square)
                    const distFactor = 1 - dist / this.stats.auraRadius
                    const damage = this.stats.radiationDamage * distFactor * distFactor * 0.5
                    const actualDamage = damage * this.stats.damageMultiplier
                    enemy.health -= actualDamage
                    this.trackSkillDamage('radiant-aura', actualDamage)
                    hitCount++

                    // Visual feedback - small glow on damaged enemy
                    if (enemy.wobble && distFactor > 0.5) {
                        // Scale punch disabled
                        // this.impactSystem.addScalePunch(enemy.wobble, 0.05, 0.1)
                    }
                }
            }

            // Visual aura pulse
            if (hitCount > 0) {
                this.createAuraPulseEffect()
            }
        }
    }

    /**
     * Create visual effect for aura pulse
     */
    private createAuraPulseEffect(): void {
        const aura = new Graphics()
        aura.circle(0, 0, this.stats.auraRadius)
        aura.fill({ color: 0xff6644, alpha: 0.1 })
        aura.circle(0, 0, this.stats.auraRadius)
        aura.stroke({ color: 0xff6644, width: 2, alpha: 0.3 })
        aura.position.set(this.playerX, this.playerY)
        this.effectContainer.addChild(aura)

        // Fade out animation
        let alpha = 0.3
        const fadeOut = () => {
            alpha -= 0.02
            if (alpha <= 0) {
                this.effectContainer.removeChild(aura)
                aura.destroy()
                return
            }
            aura.alpha = alpha
            requestAnimationFrame(fadeOut)
        }
        requestAnimationFrame(fadeOut)
    }

    /**
     * Render persistent aura visuals for all active aura-type skills
     * These visuals are always visible around the player when the skill is active
     */
    private renderAuraVisuals(deltaSeconds: number): void {
        if (!this.auraRingsContainer) return

        // Clear previous frame's aura graphics
        this.auraRingsContainer.removeChildren()

        // Update animation phase
        this.auraAnimPhase += deltaSeconds * 2

        // Track which auras to render
        let yOffset = 0 // For stacking multiple aura rings

        // Radiant Aura - Stefan-Boltzmann radiation (P = σAT⁴)
        if (this.stats.auraRadius > 0 && this.stats.radiationDamage > 0) {
            const auraGraphics = new Graphics()
            const radius = this.stats.auraRadius
            const intensity = Math.min(1, this.stats.radiationDamage / 20)

            // Outer boundary - effect range
            auraGraphics.circle(0, 0, radius)
            auraGraphics.stroke({ color: 0xff6644, width: 2, alpha: 0.25 })

            // Inner hot zone - gradient fill
            auraGraphics.circle(0, 0, radius * 0.5)
            auraGraphics.fill({ color: 0xff4422, alpha: 0.1 * intensity })
            auraGraphics.circle(0, 0, radius * 0.25)
            auraGraphics.fill({ color: 0xff6644, alpha: 0.15 * intensity })

            // Radiating heat waves (expanding rings)
            const waveCount = 3
            for (let i = 0; i < waveCount; i++) {
                const phase = (this.auraAnimPhase * 0.8 + i / waveCount) % 1
                const waveRadius = radius * (0.2 + phase * 0.8)
                const waveAlpha = (1 - phase) * 0.25 * intensity

                if (waveAlpha > 0.05) {
                    auraGraphics.circle(0, 0, waveRadius)
                    auraGraphics.stroke({ color: 0xff7755, width: 2, alpha: waveAlpha })
                }
            }

            // Wavy radial heat lines (like heat distortion)
            const lineCount = 12
            for (let i = 0; i < lineCount; i++) {
                const angle = (i / lineCount) * Math.PI * 2
                const waveOffset = Math.sin(this.auraAnimPhase * 3 + i * 0.5) * 0.1

                const innerR = radius * 0.3
                const outerR = radius * 0.9
                const midR = (innerR + outerR) / 2

                auraGraphics.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR)
                auraGraphics.quadraticCurveTo(
                    Math.cos(angle + waveOffset) * midR,
                    Math.sin(angle + waveOffset) * midR,
                    Math.cos(angle) * outerR,
                    Math.sin(angle) * outerR
                )
                auraGraphics.stroke({ color: 0xff8866, width: 1, alpha: 0.15 })
            }

            // Heat particles rising outward
            const particleCount = 10
            for (let i = 0; i < particleCount; i++) {
                const phase = (this.auraAnimPhase + i * 0.1) % 1
                const pAngle =
                    (i / particleCount) * Math.PI * 2 + Math.sin(phase * Math.PI * 2) * 0.2
                const pDist = radius * (0.2 + phase * 0.7)
                const px = Math.cos(pAngle) * pDist
                const py = Math.sin(pAngle) * pDist
                const pAlpha = Math.sin(phase * Math.PI) * 0.4 * intensity

                if (pAlpha > 0.1) {
                    auraGraphics.circle(px, py, 2 + intensity * 2)
                    auraGraphics.fill({ color: 0xffaa77, alpha: pAlpha })
                }
            }

            auraGraphics.position.set(this.playerX, this.playerY)
            this.auraRingsContainer.addChild(auraGraphics)
            yOffset += 5
        }

        // Chaos Field - entropy visualization (ΔS > 0)
        if (this.stats.chaosFieldRadius > 0 && this.stats.chaosStrength > 0) {
            const chaosGraphics = new Graphics()
            const radius = this.stats.chaosFieldRadius
            const strength = this.stats.chaosStrength

            // Outer boundary - wobbling/distorted circle showing effect range
            const boundarySegments = 24
            chaosGraphics.moveTo(radius, 0)
            for (let i = 1; i <= boundarySegments; i++) {
                const angle = (i / boundarySegments) * Math.PI * 2
                const wobble = Math.sin(angle * 5 + this.auraAnimPhase * 3) * strength * 0.08
                const r = radius * (1 + wobble)
                chaosGraphics.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
            }
            chaosGraphics.closePath()
            chaosGraphics.stroke({ color: 0x9b59b6, width: 2, alpha: 0.35 })

            // Inner chaotic zone fill
            chaosGraphics.circle(0, 0, radius * 0.9)
            chaosGraphics.fill({ color: 0x9b59b6, alpha: 0.06 })

            // Random entropy particles floating inside the field
            const particleCount = 16
            for (let i = 0; i < particleCount; i++) {
                // Use deterministic pseudo-random based on index and phase
                const seed = i * 137.5 + this.auraAnimPhase * 0.5
                const randAngle = seed % 6.28
                const randDist = ((seed * 0.618) % 1) * radius * 0.85
                const px = Math.cos(randAngle) * randDist
                const py = Math.sin(randAngle) * randDist

                // Varying sizes and alpha for chaos effect
                const size = 2 + (i % 3)
                const alpha = 0.2 + Math.sin(seed * 2) * 0.15

                chaosGraphics.circle(px, py, size)
                chaosGraphics.fill({ color: 0xbb6bd9, alpha })
            }

            // Chaotic motion arrows showing random perturbation directions
            const arrowCount = 6
            for (let i = 0; i < arrowCount; i++) {
                const angle = (i / arrowCount) * Math.PI * 2 + this.auraAnimPhase * 0.5
                const dist = radius * 0.6
                const ax = Math.cos(angle) * dist
                const ay = Math.sin(angle) * dist

                // Arrow points in random-looking direction (changes with phase)
                const randomDir = angle + Math.sin(this.auraAnimPhase * 3 + i * 2) * Math.PI * 0.5
                const arrowLen = 12 * strength
                const arrowAlpha = 0.25 + Math.sin(this.auraAnimPhase * 2 + i) * 0.1

                chaosGraphics.moveTo(ax, ay)
                chaosGraphics.lineTo(
                    ax + Math.cos(randomDir) * arrowLen,
                    ay + Math.sin(randomDir) * arrowLen
                )
                chaosGraphics.stroke({ color: 0xd68fff, width: 1.5, alpha: arrowAlpha })
            }

            chaosGraphics.position.set(this.playerX, this.playerY)
            this.auraRingsContainer.addChild(chaosGraphics)
            yOffset += 5
        }

        // Magnetic Shield - magnetic field lines (Lorentz force visualization)
        if (this.stats.shieldRadius > 0 && this.stats.deflectionStrength > 0) {
            const shieldGraphics = new Graphics()
            const radius = this.stats.shieldRadius
            const strength = this.stats.deflectionStrength

            // Shield boundary - pulsing circle showing effect radius
            const pulseScale = 1 + Math.sin(this.auraAnimPhase * Math.PI * 2) * 0.03
            const boundaryAlpha = 0.2 + strength * 0.1
            shieldGraphics.circle(0, 0, radius * pulseScale)
            shieldGraphics.stroke({ color: 0x3498db, width: 2, alpha: boundaryAlpha })

            // Inner activation zone
            shieldGraphics.circle(0, 0, radius * 0.3)
            shieldGraphics.fill({ color: 0x3498db, alpha: 0.08 })

            // Curved magnetic field lines (showing deflection paths)
            const fieldLineCount = 12
            for (let i = 0; i < fieldLineCount; i++) {
                const baseAngle = (i / fieldLineCount) * Math.PI * 2
                const rotationOffset = this.auraAnimPhase * 0.3

                // Draw curved field line (like B-field around a magnet)
                const segments = 12
                const curveStrength = strength * 0.4

                shieldGraphics.moveTo(
                    Math.cos(baseAngle + rotationOffset) * radius * 0.35,
                    Math.sin(baseAngle + rotationOffset) * radius * 0.35
                )

                for (let s = 1; s <= segments; s++) {
                    const t = s / segments
                    const r = radius * (0.35 + t * 0.65)
                    const curveOffset =
                        Math.sin(t * Math.PI) * curveStrength * (i % 2 === 0 ? 1 : -1)
                    const angle = baseAngle + rotationOffset + curveOffset
                    shieldGraphics.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
                }

                const lineAlpha = 0.15 + Math.sin(this.auraAnimPhase * Math.PI * 4 + i * 0.5) * 0.1
                shieldGraphics.stroke({ color: 0x5dade2, width: 1.5, alpha: lineAlpha })
            }

            // Rotating deflection arrows showing the Lorentz force direction
            const arrowCount = 6
            for (let i = 0; i < arrowCount; i++) {
                const angle = (i / arrowCount) * Math.PI * 2 + this.auraAnimPhase
                const arrowDist = radius * 0.7
                const ax = Math.cos(angle) * arrowDist
                const ay = Math.sin(angle) * arrowDist
                const tangentAngle = angle + Math.PI / 2
                const arrowLen = 12 * strength
                const arrowAlpha = 0.4 + Math.sin(this.auraAnimPhase * Math.PI * 2 + i) * 0.2

                // Arrow body
                shieldGraphics.moveTo(
                    ax - Math.cos(tangentAngle) * arrowLen * 0.5,
                    ay - Math.sin(tangentAngle) * arrowLen * 0.5
                )
                shieldGraphics.lineTo(
                    ax + Math.cos(tangentAngle) * arrowLen * 0.5,
                    ay + Math.sin(tangentAngle) * arrowLen * 0.5
                )
                shieldGraphics.stroke({ color: 0x85c1e9, width: 2, alpha: arrowAlpha })

                // Arrow head
                const headX = ax + Math.cos(tangentAngle) * arrowLen * 0.5
                const headY = ay + Math.sin(tangentAngle) * arrowLen * 0.5
                shieldGraphics.moveTo(headX, headY)
                shieldGraphics.lineTo(
                    headX - Math.cos(tangentAngle - 0.5) * 5,
                    headY - Math.sin(tangentAngle - 0.5) * 5
                )
                shieldGraphics.moveTo(headX, headY)
                shieldGraphics.lineTo(
                    headX - Math.cos(tangentAngle + 0.5) * 5,
                    headY - Math.sin(tangentAngle + 0.5) * 5
                )
                shieldGraphics.stroke({ color: 0x85c1e9, width: 2, alpha: arrowAlpha })
            }

            // Animated particles spiraling (charged particles being deflected)
            const particleCount = 8
            for (let i = 0; i < particleCount; i++) {
                const particlePhase = (this.auraAnimPhase * 1.5 + i / particleCount) % 1
                const spiralAngle = particlePhase * Math.PI * 4 + i * (Math.PI / 4)
                const spiralDist = radius * (0.4 + particlePhase * 0.5)
                const px = Math.cos(spiralAngle) * spiralDist
                const py = Math.sin(spiralAngle) * spiralDist
                const particleAlpha = Math.sin(particlePhase * Math.PI) * 0.7

                if (particleAlpha > 0.1) {
                    shieldGraphics.circle(px, py, 3 + strength * 2)
                    shieldGraphics.fill({ color: 0xaed6f1, alpha: particleAlpha })
                }
            }

            // Center magnetic pole indicator
            const bAlpha = 0.3 + Math.sin(this.auraAnimPhase * Math.PI * 2) * 0.1
            shieldGraphics.circle(0, 0, 8)
            shieldGraphics.stroke({ color: 0x3498db, width: 2, alpha: bAlpha })
            shieldGraphics.moveTo(-5, 0)
            shieldGraphics.lineTo(5, 0)
            shieldGraphics.moveTo(0, -5)
            shieldGraphics.lineTo(0, 5)
            shieldGraphics.stroke({ color: 0x3498db, width: 1.5, alpha: bAlpha })

            shieldGraphics.position.set(this.playerX, this.playerY)
            this.auraRingsContainer.addChild(shieldGraphics)
            yOffset += 5
        }

        // Static Repulsion - Coulomb force visualization (F = kq₁q₂/r²)
        if (this.stats.repulsionRadius > 0 && this.stats.repulsionForce > 0) {
            const repulseGraphics = new Graphics()
            const radius = this.stats.repulsionRadius
            const force = Math.min(1, this.stats.repulsionForce / 200)

            // Outer boundary - pulsing ring showing effect range
            const pulseScale = 1 + Math.sin(this.auraAnimPhase * 3) * 0.03
            repulseGraphics.circle(0, 0, radius * pulseScale)
            repulseGraphics.stroke({ color: 0xf1c40f, width: 2, alpha: 0.25 })

            // Inner charged zone
            repulseGraphics.circle(0, 0, radius * 0.2)
            repulseGraphics.fill({ color: 0xf1c40f, alpha: 0.15 })
            repulseGraphics.circle(0, 0, radius * 0.1)
            repulseGraphics.fill({ color: 0xffffff, alpha: 0.3 })

            // Outward repulsion arrows showing force direction
            const arrowCount = 8
            for (let i = 0; i < arrowCount; i++) {
                const angle = (i / arrowCount) * Math.PI * 2
                const innerDist = radius * 0.25
                const outerDist = radius * (0.6 + force * 0.2)
                const arrowAlpha = 0.3 + Math.sin(this.auraAnimPhase * 4 + i) * 0.15

                // Arrow shaft
                repulseGraphics.moveTo(Math.cos(angle) * innerDist, Math.sin(angle) * innerDist)
                repulseGraphics.lineTo(Math.cos(angle) * outerDist, Math.sin(angle) * outerDist)
                repulseGraphics.stroke({ color: 0xf39c12, width: 2, alpha: arrowAlpha })

                // Arrow head
                const headDist = outerDist
                const headSize = 6
                repulseGraphics.moveTo(Math.cos(angle) * headDist, Math.sin(angle) * headDist)
                repulseGraphics.lineTo(
                    Math.cos(angle - 0.3) * (headDist - headSize),
                    Math.sin(angle - 0.3) * (headDist - headSize)
                )
                repulseGraphics.moveTo(Math.cos(angle) * headDist, Math.sin(angle) * headDist)
                repulseGraphics.lineTo(
                    Math.cos(angle + 0.3) * (headDist - headSize),
                    Math.sin(angle + 0.3) * (headDist - headSize)
                )
                repulseGraphics.stroke({ color: 0xf39c12, width: 2, alpha: arrowAlpha })
            }

            // Electric spark particles moving outward
            const sparkCount = 10
            for (let i = 0; i < sparkCount; i++) {
                const phase = (this.auraAnimPhase * 2 + i * (1 / sparkCount)) % 1
                const sparkAngle = (i / sparkCount) * Math.PI * 2 + this.auraAnimPhase * 0.3
                const sparkDist = radius * (0.2 + phase * 0.7)
                const sx = Math.cos(sparkAngle) * sparkDist
                const sy = Math.sin(sparkAngle) * sparkDist
                const sparkAlpha = Math.sin(phase * Math.PI) * 0.5

                if (sparkAlpha > 0.1) {
                    repulseGraphics.circle(sx, sy, 2 + force * 2)
                    repulseGraphics.fill({ color: 0xf7dc6f, alpha: sparkAlpha })
                }
            }

            // Jagged lightning arcs (occasional)
            const arcCount = 4
            for (let i = 0; i < arcCount; i++) {
                const arcPhase = (this.auraAnimPhase * 3 + i * 0.7) % 1
                if (arcPhase < 0.3) {
                    const angle = (i / arcCount) * Math.PI * 2 + this.auraAnimPhase
                    const startR = radius * 0.3
                    const endR = radius * 0.85

                    // Jagged lightning path
                    repulseGraphics.moveTo(Math.cos(angle) * startR, Math.sin(angle) * startR)
                    const midR = (startR + endR) / 2
                    const jag = (Math.random() - 0.5) * 0.3
                    repulseGraphics.lineTo(
                        Math.cos(angle + jag) * midR,
                        Math.sin(angle + jag) * midR
                    )
                    repulseGraphics.lineTo(Math.cos(angle) * endR, Math.sin(angle) * endR)
                    repulseGraphics.stroke({
                        color: 0xffffff,
                        width: 1.5,
                        alpha: (0.6 * (0.3 - arcPhase)) / 0.3,
                    })
                }
            }

            repulseGraphics.position.set(this.playerX, this.playerY)
            this.auraRingsContainer.addChild(repulseGraphics)
            yOffset += 5
        }

        // Time Warp - time dilation visualization (t = t₀/√(1-v²/c²))
        if (this.stats.warpRadius > 0 && this.stats.slowFactor > 0) {
            const timeGraphics = new Graphics()
            const radius = this.stats.warpRadius
            const slowness = Math.min(1, this.stats.slowFactor)

            // Outer boundary - clear effect range
            timeGraphics.circle(0, 0, radius)
            timeGraphics.stroke({ color: 0x5d6d7e, width: 2, alpha: 0.3 })

            // Inner distortion zone - darker fill
            timeGraphics.circle(0, 0, radius * 0.9)
            timeGraphics.fill({ color: 0x1a252f, alpha: 0.12 * slowness })

            // Warped space-time grid lines (bent inward)
            const gridLines = 8
            for (let i = 0; i < gridLines; i++) {
                const angle = (i / gridLines) * Math.PI * 2

                // Lines curve inward showing space-time warping
                const startR = radius
                const midR = radius * (0.5 - slowness * 0.1)

                timeGraphics.moveTo(Math.cos(angle) * startR, Math.sin(angle) * startR)
                timeGraphics.quadraticCurveTo(
                    Math.cos(angle) * midR * 0.7,
                    Math.sin(angle) * midR * 0.7,
                    0,
                    0
                )
                timeGraphics.stroke({ color: 0x5d6d7e, width: 1, alpha: 0.15 })
            }

            // Clock hands showing slowed time (move slowly)
            const slowPhase = this.auraAnimPhase * (1 - slowness * 0.7) // Slower with more slowness
            const handLen = radius * 0.3

            // Hour hand (slowest)
            const hourAngle = slowPhase * 0.1 - Math.PI / 2
            timeGraphics.moveTo(0, 0)
            timeGraphics.lineTo(
                Math.cos(hourAngle) * handLen * 0.6,
                Math.sin(hourAngle) * handLen * 0.6
            )
            timeGraphics.stroke({ color: 0x85929e, width: 2, alpha: 0.4 })

            // Minute hand
            const minAngle = slowPhase * 0.5 - Math.PI / 2
            timeGraphics.moveTo(0, 0)
            timeGraphics.lineTo(Math.cos(minAngle) * handLen, Math.sin(minAngle) * handLen)
            timeGraphics.stroke({ color: 0x85929e, width: 1.5, alpha: 0.35 })

            // Center pivot
            timeGraphics.circle(0, 0, 4)
            timeGraphics.fill({ color: 0x5d6d7e, alpha: 0.5 })

            // Concentric time ripples (inner moves slower)
            for (let i = 0; i < 3; i++) {
                const ringRadius = radius * (0.4 + i * 0.25)
                const speed = 1 - i * 0.25 * slowness // Inner rings rotate slower
                const dashAngle = this.auraAnimPhase * speed

                // Dashed ring
                const segments = 8
                for (let j = 0; j < segments; j += 2) {
                    const startAngle = dashAngle + (j / segments) * Math.PI * 2
                    const endAngle = dashAngle + ((j + 0.8) / segments) * Math.PI * 2

                    timeGraphics.moveTo(
                        Math.cos(startAngle) * ringRadius,
                        Math.sin(startAngle) * ringRadius
                    )
                    timeGraphics.arc(0, 0, ringRadius, startAngle, endAngle)
                }
                timeGraphics.stroke({ color: 0x7f8c8d, width: 1.5, alpha: 0.2 - i * 0.04 })
            }

            // Slow particles drifting inside
            const particleCount = 8
            for (let i = 0; i < particleCount; i++) {
                // Move very slowly to show time dilation
                const phase = (this.auraAnimPhase * 0.3 * (1 - slowness * 0.5) + i * 0.125) % 1
                const pAngle = (i / particleCount) * Math.PI * 2 + this.auraAnimPhase * 0.1
                const pDist = radius * (0.3 + phase * 0.5)
                const px = Math.cos(pAngle) * pDist
                const py = Math.sin(pAngle) * pDist
                const pAlpha = Math.sin(phase * Math.PI) * 0.4

                if (pAlpha > 0.1) {
                    timeGraphics.circle(px, py, 3)
                    timeGraphics.fill({ color: 0xaab7b8, alpha: pAlpha })
                }
            }

            timeGraphics.position.set(this.playerX, this.playerY)
            this.auraRingsContainer.addChild(timeGraphics)
            yOffset += 5
        }

        // Flow Stream - fluid flow visualization (Bernoulli's principle)
        if (this.stats.flowSpeed > 0 && this.stats.suctionForce > 0) {
            const flowGraphics = new Graphics()
            const streamWidth = this.stats.streamWidth
            const streamRange = this.stats.flowSpeed * 3 // Match actual effect range

            // Flow direction based on player movement
            const speed = Math.sqrt(this.playerVx * this.playerVx + this.playerVy * this.playerVy)
            const flowDirX = speed > 0.1 ? this.playerVx / speed : 1
            const flowDirY = speed > 0.1 ? this.playerVy / speed : 0
            const perpX = -flowDirY
            const perpY = flowDirX

            // Draw stream boundary (the actual effect area)
            const boundaryAlpha = 0.15 + Math.sin(this.auraAnimPhase * Math.PI * 2) * 0.05
            flowGraphics.moveTo(perpX * streamWidth, perpY * streamWidth)
            flowGraphics.lineTo(
                flowDirX * streamRange + perpX * streamWidth,
                flowDirY * streamRange + perpY * streamWidth
            )
            flowGraphics.lineTo(
                flowDirX * streamRange - perpX * streamWidth,
                flowDirY * streamRange - perpY * streamWidth
            )
            flowGraphics.lineTo(-perpX * streamWidth, -perpY * streamWidth)
            flowGraphics.closePath()
            flowGraphics.fill({ color: 0x1abc9c, alpha: boundaryAlpha })
            flowGraphics.stroke({ color: 0x1abc9c, width: 1, alpha: 0.3 })

            // Draw flowing stream lines (water/fluid effect)
            const lineCount = 7
            for (let i = 0; i < lineCount; i++) {
                const lateralOffset =
                    ((i - (lineCount - 1) / 2) / ((lineCount - 1) / 2)) * streamWidth * 0.8
                const lineStartX = perpX * lateralOffset
                const lineStartY = perpY * lateralOffset

                // Multiple animated segments per line
                const segmentCount = 4
                for (let s = 0; s < segmentCount; s++) {
                    const phase = (this.auraAnimPhase * 2 + i * 0.15 + s * 0.25) % 1
                    const segmentStart = phase * streamRange
                    const segmentLength = streamRange * 0.2

                    // Fade in/out at edges
                    const fadeIn = Math.min(1, segmentStart / (streamRange * 0.1))
                    const fadeOut = Math.min(1, (streamRange - segmentStart) / (streamRange * 0.2))
                    const alpha = 0.4 * fadeIn * fadeOut

                    if (alpha > 0.05) {
                        const sx = lineStartX + flowDirX * segmentStart
                        const sy = lineStartY + flowDirY * segmentStart
                        const ex =
                            lineStartX +
                            flowDirX * Math.min(segmentStart + segmentLength, streamRange)
                        const ey =
                            lineStartY +
                            flowDirY * Math.min(segmentStart + segmentLength, streamRange)

                        flowGraphics.moveTo(sx, sy)
                        flowGraphics.lineTo(ex, ey)
                        flowGraphics.stroke({ color: 0x2eecbc, width: 2, alpha })
                    }
                }
            }

            // Draw flow particles/droplets
            const particleCount = 12
            for (let i = 0; i < particleCount; i++) {
                const phase = (this.auraAnimPhase * 1.5 + i * (1 / particleCount)) % 1
                const dist = phase * streamRange
                const lateralWave = Math.sin(phase * Math.PI * 4 + i) * streamWidth * 0.3
                const px = flowDirX * dist + perpX * lateralWave
                const py = flowDirY * dist + perpY * lateralWave

                // Fade at start and end
                const particleAlpha = Math.sin(phase * Math.PI) * 0.6
                const particleSize = 3 + Math.sin(phase * Math.PI) * 2

                if (particleAlpha > 0.1) {
                    flowGraphics.circle(px, py, particleSize)
                    flowGraphics.fill({ color: 0x5dffce, alpha: particleAlpha })
                }
            }

            // Arrow indicators showing suction direction
            const arrowCount = 3
            for (let i = 0; i < arrowCount; i++) {
                const arrowDist = (i + 1) * (streamRange / (arrowCount + 1))
                const arrowPhase = (this.auraAnimPhase + i * 0.33) % 1
                const arrowAlpha = 0.3 + Math.sin(arrowPhase * Math.PI * 2) * 0.15

                // Draw small arrow pointing inward (suction)
                const arrowX = flowDirX * arrowDist
                const arrowY = flowDirY * arrowDist
                const arrowSize = 8

                flowGraphics.moveTo(arrowX - perpX * arrowSize, arrowY - perpY * arrowSize)
                flowGraphics.lineTo(arrowX, arrowY)
                flowGraphics.lineTo(arrowX + perpX * arrowSize, arrowY + perpY * arrowSize)
                flowGraphics.stroke({ color: 0x1abc9c, width: 2, alpha: arrowAlpha })
            }

            flowGraphics.position.set(this.playerX, this.playerY)
            this.auraRingsContainer.addChild(flowGraphics)
            yOffset += 5
        }

        // Magnetic Pull - magnetic field attraction (B = μ₀I/2πr)
        if (this.stats.magneticPullRadius > 0 && this.stats.magneticPullStrength > 0) {
            const pullGraphics = new Graphics()
            const radius = this.stats.magneticPullRadius
            const strength = Math.min(1, this.stats.magneticPullStrength / 150)

            // Outer boundary - effect range
            pullGraphics.circle(0, 0, radius)
            pullGraphics.stroke({ color: 0x5d6d7e, width: 2, alpha: 0.25 })

            // Inner magnetic core
            pullGraphics.circle(0, 0, radius * 0.15)
            pullGraphics.fill({ color: 0x34495e, alpha: 0.4 })

            // Magnetic field lines (curved, pointing inward)
            const lineCount = 8
            for (let i = 0; i < lineCount; i++) {
                const angle = (i / lineCount) * Math.PI * 2

                // Draw curved field line from outer to center
                const segments = 8
                pullGraphics.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)

                for (let s = 1; s <= segments; s++) {
                    const t = s / segments
                    const r = radius * (1 - t * 0.85)
                    // Curve slightly as it approaches center
                    const curveAngle = angle + t * 0.3 * (i % 2 === 0 ? 1 : -1)
                    pullGraphics.lineTo(Math.cos(curveAngle) * r, Math.sin(curveAngle) * r)
                }

                pullGraphics.stroke({ color: 0x5d6d7e, width: 1.5, alpha: 0.2 })
            }

            // Inward pointing arrows showing attraction
            const arrowCount = 6
            for (let i = 0; i < arrowCount; i++) {
                const angle = (i / arrowCount) * Math.PI * 2 + this.auraAnimPhase * 0.5
                const dist = radius * 0.65
                const ax = Math.cos(angle) * dist
                const ay = Math.sin(angle) * dist
                const arrowAlpha = 0.3 + Math.sin(this.auraAnimPhase * 3 + i) * 0.1

                // Arrow pointing inward (toward center)
                const inwardAngle = angle + Math.PI
                const arrowLen = 10 + strength * 5

                pullGraphics.moveTo(ax, ay)
                pullGraphics.lineTo(
                    ax + Math.cos(inwardAngle) * arrowLen,
                    ay + Math.sin(inwardAngle) * arrowLen
                )
                pullGraphics.stroke({ color: 0x7f8c8d, width: 2, alpha: arrowAlpha })

                // Arrow head
                const headX = ax + Math.cos(inwardAngle) * arrowLen
                const headY = ay + Math.sin(inwardAngle) * arrowLen
                pullGraphics.moveTo(headX, headY)
                pullGraphics.lineTo(
                    headX - Math.cos(inwardAngle - 0.4) * 5,
                    headY - Math.sin(inwardAngle - 0.4) * 5
                )
                pullGraphics.moveTo(headX, headY)
                pullGraphics.lineTo(
                    headX - Math.cos(inwardAngle + 0.4) * 5,
                    headY - Math.sin(inwardAngle + 0.4) * 5
                )
                pullGraphics.stroke({ color: 0x7f8c8d, width: 2, alpha: arrowAlpha })
            }

            // Particles being pulled inward
            const particleCount = 12
            for (let i = 0; i < particleCount; i++) {
                const phase = (this.auraAnimPhase * 1.5 + i * (1 / particleCount)) % 1
                const pAngle = (i / particleCount) * Math.PI * 2 + i * 0.3
                // Move from outer to inner (reverse direction shows attraction)
                const pDist = radius * (1 - phase * 0.8)
                const px = Math.cos(pAngle) * pDist
                const py = Math.sin(pAngle) * pDist
                const pAlpha = Math.sin(phase * Math.PI) * 0.5

                if (pAlpha > 0.1) {
                    pullGraphics.circle(px, py, 2 + strength * 2)
                    pullGraphics.fill({ color: 0x85929e, alpha: pAlpha })
                }
            }

            pullGraphics.position.set(this.playerX, this.playerY)
            this.auraRingsContainer.addChild(pullGraphics)
        }

        // Orbital Strike (aura type) - Kepler's law visualization (T² ∝ a³)
        if (this.stats.orbitCount > 0 && this.stats.orbitRadius > 0) {
            const orbitGraphics = new Graphics()
            const radius = this.stats.orbitRadius
            const count = this.stats.orbitCount

            // Orbit path ring - dashed for effect range visibility
            const dashCount = 16
            for (let i = 0; i < dashCount; i += 2) {
                const startAngle = (i / dashCount) * Math.PI * 2
                const endAngle = ((i + 1) / dashCount) * Math.PI * 2
                orbitGraphics.arc(0, 0, radius, startAngle, endAngle)
            }
            orbitGraphics.stroke({ color: 0x8e44ad, width: 1.5, alpha: 0.25 })

            // Satellite positions (actual orbiters shown as glowing points)
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + this.auraAnimPhase * 2
                const sx = Math.cos(angle) * radius
                const sy = Math.sin(angle) * radius

                // Satellite glow
                orbitGraphics.circle(sx, sy, 8)
                orbitGraphics.fill({ color: 0x8e44ad, alpha: 0.2 })
                orbitGraphics.circle(sx, sy, 5)
                orbitGraphics.fill({ color: 0xbb6bd9, alpha: 0.5 })
                orbitGraphics.circle(sx, sy, 3)
                orbitGraphics.fill({ color: 0xffffff, alpha: 0.7 })

                // Orbit trail behind each satellite
                const trailAngle = angle - 0.5
                orbitGraphics.arc(0, 0, radius, trailAngle, angle)
                orbitGraphics.stroke({ color: 0x9b59b6, width: 2, alpha: 0.3 })
            }

            orbitGraphics.position.set(this.playerX, this.playerY)
            this.auraRingsContainer.addChild(orbitGraphics)
        }

        // Torque Slash (aura type) - rotating blade visualization (τ = rF sin θ)
        if (this.stats.slashRadius > 0 && this.stats.slashDamage > 0) {
            const slashGraphics = new Graphics()
            const radius = this.stats.slashRadius

            // Blade effect range boundary
            slashGraphics.circle(0, 0, radius)
            slashGraphics.stroke({ color: 0xc0392b, width: 1.5, alpha: 0.15 })

            // Rotating blade arc with motion blur effect
            const bladeWidth = Math.PI * 0.3
            const trailLength = Math.PI * 0.6

            // Motion blur trail (fading behind blade)
            for (let i = 0; i < 5; i++) {
                const trailAngle = this.slashAngle - i * 0.15
                const trailAlpha = 0.2 * (1 - i / 5)
                slashGraphics.arc(
                    0,
                    0,
                    radius,
                    trailAngle - bladeWidth / 2,
                    trailAngle + bladeWidth / 2
                )
                slashGraphics.stroke({ color: 0xc0392b, width: 3 - i * 0.4, alpha: trailAlpha })
            }

            // Main blade arc (current position)
            slashGraphics.arc(
                0,
                0,
                radius,
                this.slashAngle - bladeWidth / 2,
                this.slashAngle + bladeWidth / 2
            )
            slashGraphics.stroke({ color: 0xe74c3c, width: 4, alpha: 0.5 })

            // Blade tip glow
            const tipX = Math.cos(this.slashAngle) * radius
            const tipY = Math.sin(this.slashAngle) * radius
            slashGraphics.circle(tipX, tipY, 6)
            slashGraphics.fill({ color: 0xe74c3c, alpha: 0.3 })
            slashGraphics.circle(tipX, tipY, 3)
            slashGraphics.fill({ color: 0xffffff, alpha: 0.5 })

            slashGraphics.position.set(this.playerX, this.playerY)
            this.auraRingsContainer.addChild(slashGraphics)
        }
    }

    /**
     * Beat Pulse (맥놀이 펄스) - periodic damage based on beat frequency
     * Based on beat phenomenon: f_beat = |f1 - f2|
     * Visual: Two overlapping wave patterns showing interference
     */
    private updateBeatPulse(deltaSeconds: number): void {
        const hasBeatPulse = this.stats.beatFreq1 > 0 && this.stats.beatFreq2 > 0

        // Clean up if skill not active
        if (!hasBeatPulse) {
            if (this.beatPulseGraphics) {
                this.effectContainer.removeChild(this.beatPulseGraphics)
                this.beatPulseGraphics.destroy()
                this.beatPulseGraphics = null
            }
            return
        }

        // Create graphics if needed
        if (!this.beatPulseGraphics) {
            this.beatPulseGraphics = new Graphics()
            this.effectContainer.addChild(this.beatPulseGraphics)
        }

        // Calculate beat frequency
        const beatFrequency = Math.abs(this.stats.beatFreq1 - this.stats.beatFreq2)
        if (beatFrequency <= 0) return

        // Update beat phase (continuous)
        this.beatPhase += deltaSeconds * Math.PI * 2 * beatFrequency
        if (this.beatPhase > Math.PI * 2) {
            this.beatPhase -= Math.PI * 2
        }

        // Beat envelope: amplitude modulation from interference
        const beatEnvelope = Math.abs(Math.cos(this.beatPhase))
        const radius = 80 + this.stats.beatAmplitude * 50

        // Draw beat visualization
        this.beatPulseGraphics.clear()
        this.beatPulseGraphics.position.set(this.playerX, this.playerY)

        // Outer ring - shows beat envelope (pulses with beat frequency)
        const outerAlpha = 0.15 + beatEnvelope * 0.35
        this.beatPulseGraphics.circle(0, 0, radius)
        this.beatPulseGraphics.stroke({
            color: 0x9966ff,
            width: 2 + beatEnvelope * 3,
            alpha: outerAlpha,
        })

        // Inner ring - inverse phase for interference pattern
        const innerRadius = radius * 0.6
        const innerAlpha = 0.15 + (1 - beatEnvelope) * 0.2
        this.beatPulseGraphics.circle(0, 0, innerRadius)
        this.beatPulseGraphics.stroke({ color: 0x66ffff, width: 1.5, alpha: innerAlpha })

        // Radial lines showing wave nodes (where amplitude is zero)
        const nodeCount = 8
        for (let i = 0; i < nodeCount; i++) {
            const angle = (i / nodeCount) * Math.PI * 2
            const lineAlpha = 0.1 + beatEnvelope * 0.15
            const x1 = Math.cos(angle) * innerRadius
            const y1 = Math.sin(angle) * innerRadius
            const x2 = Math.cos(angle) * radius
            const y2 = Math.sin(angle) * radius
            this.beatPulseGraphics.moveTo(x1, y1)
            this.beatPulseGraphics.lineTo(x2, y2)
            this.beatPulseGraphics.stroke({ color: 0xaa88ff, width: 1, alpha: lineAlpha })
        }

        // Apply damage when beat intensity is high (near antinode)
        if (beatEnvelope > 0.9) {
            this.beatPulseTimer += deltaSeconds

            // Trigger damage at beat peaks (once per beat cycle)
            if (this.beatPulseTimer >= 0.1) {
                this.beatPulseTimer = 0
                this.triggerBeatDamage(beatEnvelope, radius)
            }
        }
    }

    /**
     * Trigger damage from beat pulse
     */
    private triggerBeatDamage(intensity: number, radius: number): void {
        const damage = this.stats.beatAmplitude * intensity * 0.3

        // Damage enemies in radius
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < radius) {
                const actualDamage = damage * this.stats.damageMultiplier
                enemy.health -= actualDamage
                this.trackSkillDamage('beat-pulse', actualDamage)
            }
        }
    }

    // ============================================
    // PHASE 4: AREA EFFECT SKILLS
    // ============================================

    /**
     * Chaos Field (혼돈장) - randomize enemy movement paths
     * Based on entropy: increases disorder in enemy movement
     */
    private updateChaosField(deltaSeconds: number): void {
        if (this.stats.chaosFieldRadius <= 0 || this.stats.chaosStrength <= 0) return

        const chaosRadius = this.stats.chaosFieldRadius
        const chaosRadiusSq = chaosRadius * chaosRadius
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY

            // Early culling
            if (Math.abs(dx) > chaosRadius || Math.abs(dy) > chaosRadius) continue

            const distSq = dx * dx + dy * dy
            if (distSq < chaosRadiusSq) {
                const dist = Math.sqrt(distSq)
                // Apply random velocity perturbation
                const chaosIntensity = 1 - dist / this.stats.chaosFieldRadius
                const perturbation = this.stats.chaosStrength * chaosIntensity * deltaSeconds

                // Random angle for chaos direction
                const randomAngle = Math.random() * Math.PI * 2
                enemy.vx += Math.cos(randomAngle) * perturbation
                enemy.vy += Math.sin(randomAngle) * perturbation

                // Track chaos applied
                this.trackSkillEffect('chaos-field', 'chaosApplied', perturbation)

                // Small random spin (visual chaos)
                if (enemy.wobble && Math.random() < 0.02) {
                    // Scale punch disabled
                    // this.impactSystem.addScalePunch(enemy.wobble, 0.08, 0.15)
                }
            }
        }
    }

    /**
     * Flow Stream (유체 흐름) - create a directional flow that pulls enemies
     * Based on Bernoulli's principle: fluid dynamics
     */
    private updateFlowStream(deltaSeconds: number): void {
        if (this.stats.flowSpeed <= 0 || this.stats.suctionForce <= 0) return

        // Flow direction based on player's facing direction or movement
        const flowDirX =
            this.playerVx !== 0 || this.playerVy !== 0
                ? this.playerVx /
                  (Math.sqrt(this.playerVx * this.playerVx + this.playerVy * this.playerVy) || 1)
                : 1 // Default right
        const flowDirY =
            this.playerVx !== 0 || this.playerVy !== 0
                ? this.playerVy /
                  (Math.sqrt(this.playerVx * this.playerVx + this.playerVy * this.playerVy) || 1)
                : 0

        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Check if enemy is within the stream
            const streamRange = this.stats.flowSpeed * 3 // Stream length
            if (dist < streamRange) {
                // Calculate perpendicular distance to stream line
                const perpDist = Math.abs(dx * -flowDirY + dy * flowDirX)

                if (perpDist < this.stats.streamWidth) {
                    // Apply suction toward stream center
                    const suctionIntensity = 1 - perpDist / this.stats.streamWidth
                    const force =
                        (this.stats.suctionForce * suctionIntensity * deltaSeconds) /
                        Math.sqrt(enemy.mass)

                    // Pull toward stream line
                    const toStreamX = -flowDirY * (dx * -flowDirY + dy * flowDirX > 0 ? 1 : -1)
                    const toStreamY = flowDirX * (dx * -flowDirY + dy * flowDirX > 0 ? 1 : -1)

                    enemy.vx += toStreamX * force * 0.5
                    enemy.vy += toStreamY * force * 0.5

                    // Also push along stream direction (Bernoulli effect)
                    enemy.vx += flowDirX * this.stats.flowSpeed * deltaSeconds * 0.1
                    enemy.vy += flowDirY * this.stats.flowSpeed * deltaSeconds * 0.1

                    // Track pull force applied
                    this.trackSkillEffect('flow-stream', 'pullForce', force)
                }
            }
        }
    }

    /**
     * Magnetic Pull (자기 흡인) - attract enemies toward player
     * Based on magnetic field: inverse square attraction
     */
    private updateMagneticPull(deltaSeconds: number): void {
        if (this.stats.magneticPullRadius <= 0 || this.stats.magneticPullStrength <= 0) return

        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < this.stats.magneticPullRadius && dist > 30) {
                // Magnetic force: stronger when closer (1/r²), but capped
                const normalizedDist = dist / this.stats.magneticPullRadius
                const forceFactor = 1 / (normalizedDist * normalizedDist + 0.3)
                const force =
                    (this.stats.magneticPullStrength * forceFactor * deltaSeconds) /
                    Math.sqrt(enemy.mass)

                // Pull toward player
                const nx = -dx / dist
                const ny = -dy / dist
                enemy.vx += nx * force
                enemy.vy += ny * force

                // Track pull force applied
                this.trackSkillEffect('magnetic-pull', 'pullForce', force)
            }
        }
    }

    // ============================================
    // PHASE 5: CONDITIONAL TRIGGER SKILLS
    // ============================================

    /**
     * Decay Chain (붕괴 연쇄) - triggers chain explosion on enemy death
     * Based on radioactive decay: probability-based chain reaction
     * Called from enemy death handling
     */
    private handleDecayChain(deadX: number, deadY: number): void {
        if (this.stats.decayChance <= 0) return
        if (Math.random() > this.stats.decayChance) return

        // Chain explosion damages nearby enemies
        const damage = 15 * this.stats.damageMultiplier
        let chainHits = 0

        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - deadX
            const dy = enemy.y - deadY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < this.stats.chainRadius && dist > 0) {
                const actualDamage = damage * (1 - dist / this.stats.chainRadius)
                enemy.health -= actualDamage
                chainHits++

                // Track damage
                this.trackSkillDamage('decay-chain', actualDamage)

                // Small knockback
                const nx = dx / dist
                const ny = dy / dist
                enemy.vx += nx * 3
                enemy.vy += ny * 3
            }
        }

        // Visual effect
        if (chainHits > 0) {
            const ring = new Graphics()
            ring.circle(0, 0, this.stats.chainRadius)
            ring.stroke({ color: 0x44ff44, width: 3, alpha: 0.6 })
            ring.position.set(deadX, deadY)
            this.effectContainer.addChild(ring)

            // Fade out
            let alpha = 0.6
            const fade = () => {
                alpha -= 0.06
                if (alpha <= 0) {
                    this.effectContainer.removeChild(ring)
                    ring.destroy()
                    return
                }
                ring.alpha = alpha
                requestAnimationFrame(fade)
            }
            requestAnimationFrame(fade)

            this.damageTextSystem.spawnCustom(deadX, deadY - 20, `CHAIN!`, 'explosion')
        }
    }

    /**
     * Heat Chain (열 전도 체인) - transfers damage to nearby enemies
     * Based on thermal conduction: damage spreads like heat
     * Called when dealing damage to an enemy
     */
    private handleHeatChain(
        sourceX: number,
        sourceY: number,
        damage: number,
        depth: number = 0
    ): void {
        if (this.stats.conductRange <= 0 || this.stats.conductRatio <= 0) return
        if (depth >= this.stats.maxChain) return

        const chainDamage = damage * this.stats.conductRatio

        // Find nearest enemy to chain to
        let nearest: { enemy: Enemy; dist: number } | null = null
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - sourceX
            const dy = enemy.y - sourceY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < this.stats.conductRange && dist > 10) {
                if (!nearest || dist < nearest.dist) {
                    nearest = { enemy, dist }
                }
            }
        }

        if (nearest) {
            nearest.enemy.health -= chainDamage

            // Track damage
            this.trackSkillDamage('heat-chain', chainDamage)

            // Visual chain line
            const line = new Graphics()
            line.moveTo(sourceX, sourceY)
            line.lineTo(nearest.enemy.x, nearest.enemy.y)
            line.stroke({ color: 0xff8844, width: 2, alpha: 0.7 })
            this.effectContainer.addChild(line)

            // Fade out
            let alpha = 0.7
            const fade = () => {
                alpha -= 0.1
                if (alpha <= 0) {
                    this.effectContainer.removeChild(line)
                    line.destroy()
                    return
                }
                line.alpha = alpha
                requestAnimationFrame(fade)
            }
            requestAnimationFrame(fade)

            // Recursive chain
            this.handleHeatChain(nearest.enemy.x, nearest.enemy.y, chainDamage, depth + 1)
        }
    }

    /**
     * Escape Burst (탈출 속도 폭발) - triggers explosion at high speed
     * Based on escape velocity: kinetic energy release
     */
    private updateEscapeBurst(deltaSeconds: number): void {
        if (this.stats.velocityThreshold <= 0) return

        const speed = Math.sqrt(this.playerVx * this.playerVx + this.playerVy * this.playerVy)

        if (speed > this.stats.velocityThreshold) {
            // Create explosion at player position
            const damage = this.stats.escapeBonus * this.stats.damageMultiplier
            let hitCount = 0

            for (const enemy of this.enemySystem.enemies) {
                const dx = enemy.x - this.playerX
                const dy = enemy.y - this.playerY
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < this.stats.escapeBurstRadius) {
                    enemy.health -= damage * (1 - dist / this.stats.escapeBurstRadius)
                    hitCount++

                    // Knockback away
                    if (dist > 0) {
                        const nx = dx / dist
                        const ny = dy / dist
                        enemy.vx += nx * 5
                        enemy.vy += ny * 5
                    }
                }
            }

            // Visual burst effect (once per threshold crossing)
            if (hitCount > 0) {
                const burst = new Graphics()
                burst.circle(0, 0, this.stats.escapeBurstRadius)
                burst.fill({ color: 0xff44ff, alpha: 0.2 })
                burst.circle(0, 0, this.stats.escapeBurstRadius)
                burst.stroke({ color: 0xff44ff, width: 3, alpha: 0.5 })
                burst.position.set(this.playerX, this.playerY)
                this.effectContainer.addChild(burst)

                let alpha = 0.5
                const fade = () => {
                    alpha -= 0.08
                    if (alpha <= 0) {
                        this.effectContainer.removeChild(burst)
                        burst.destroy()
                        return
                    }
                    burst.alpha = alpha
                    requestAnimationFrame(fade)
                }
                requestAnimationFrame(fade)
            }
        }
    }

    /**
     * Calculate Doppler damage modifier based on enemy approach/recede
     * Based on Doppler effect: frequency shift with relative velocity
     */
    private getDopplerDamageModifier(
        enemyX: number,
        enemyY: number,
        enemyVx: number,
        enemyVy: number
    ): number {
        if (this.stats.approachBonus <= 0 && this.stats.recedeReduction <= 0) return 1

        // Direction from player to enemy
        const dx = enemyX - this.playerX
        const dy = enemyY - this.playerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist === 0) return 1

        const nx = dx / dist
        const ny = dy / dist

        // Relative velocity along the line between player and enemy
        // Negative = approaching, Positive = receding
        const relVelToPlayer = (enemyVx - this.playerVx) * nx + (enemyVy - this.playerVy) * ny

        if (relVelToPlayer < 0) {
            // Approaching - bonus damage
            return 1 + this.stats.approachBonus * Math.min(1, Math.abs(relVelToPlayer) / 100)
        } else if (relVelToPlayer > 0) {
            // Receding - reduced damage
            return 1 - this.stats.recedeReduction * Math.min(1, relVelToPlayer / 100)
        }

        return 1
    }

    /**
     * Apply Doppler visual effect to enemies
     * Approaching enemies appear redder, receding enemies appear bluer
     * Based on Doppler effect: red shift (receding) and blue shift (approaching)
     * Note: In astronomy, approaching = blue shift, receding = red shift
     * Here we reverse it for intuitive "danger" visualization: approaching = red (danger)
     */
    private updateDopplerVisuals(): void {
        // Only apply if frequency shift skill is active
        if (this.stats.approachBonus <= 0 && this.stats.recedeReduction <= 0) {
            // Reset any tints if skill was removed
            for (const enemy of this.enemySystem.enemies) {
                if (enemy.graphics.tint !== 0xffffff) {
                    enemy.graphics.tint = 0xffffff
                }
            }
            return
        }

        for (const enemy of this.enemySystem.enemies) {
            // Direction from player to enemy
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < 20) {
                enemy.graphics.tint = 0xffffff
                continue
            }

            const nx = dx / dist
            const ny = dy / dist

            // Relative velocity along the line between player and enemy
            // Negative = approaching, Positive = receding
            const relVelToPlayer = (enemy.vx - this.playerVx) * nx + (enemy.vy - this.playerVy) * ny

            // Normalize velocity for color intensity (-100 to +100 range)
            const normalizedVel = Math.max(-1, Math.min(1, relVelToPlayer / 80))

            if (normalizedVel < -0.1) {
                // Approaching - red tint (danger!)
                const intensity = Math.abs(normalizedVel)
                // Lerp from white (0xffffff) to red (0xff6666)
                const r = 255
                const g = Math.round(255 - intensity * 153) // 255 -> 102
                const b = Math.round(255 - intensity * 153)
                enemy.graphics.tint = (r << 16) | (g << 8) | b
            } else if (normalizedVel > 0.1) {
                // Receding - blue tint (safer)
                const intensity = normalizedVel
                // Lerp from white (0xffffff) to blue (0x6699ff)
                const r = Math.round(255 - intensity * 153) // 255 -> 102
                const g = Math.round(255 - intensity * 102) // 255 -> 153
                const b = 255
                enemy.graphics.tint = (r << 16) | (g << 8) | b
            } else {
                // Nearly stationary - no tint
                enemy.graphics.tint = 0xffffff
            }
        }
    }

    // ============================================
    // PHASE 6: ORBITAL/ROTATING WEAPON SKILLS
    // ============================================

    /**
     * Orbital Strike (궤도 폭격) - projectiles orbiting around player
     * Based on Kepler's laws: orbital mechanics
     */
    private updateOrbitalStrike(deltaSeconds: number): void {
        // Check if orbital skill is active
        if (this.stats.orbitCount <= 0) {
            // Clean up if disabled
            if (this.orbitalProjectiles.length > 0) {
                this.cleanupOrbitals()
            }
            this.lastOrbitCount = 0
            return
        }

        // Recreate orbitals if count changed
        if (this.stats.orbitCount !== this.lastOrbitCount) {
            this.cleanupOrbitals()
            this.createOrbitals()
            this.lastOrbitCount = this.stats.orbitCount
        }

        // Update orbital rotation (Kepler's third law: T² ∝ a³)
        // Faster rotation for smaller orbits
        const orbitalSpeed = (2 * Math.PI) / Math.max(1, this.stats.orbitRadius / 50)
        this.orbitAngle += orbitalSpeed * deltaSeconds
        if (this.orbitAngle > Math.PI * 2) {
            this.orbitAngle -= Math.PI * 2
        }

        // Update each orbital position and check collisions
        for (const orbital of this.orbitalProjectiles) {
            const angle = this.orbitAngle + orbital.angle
            const orbitalX = this.playerX + Math.cos(angle) * this.stats.orbitRadius
            const orbitalY = this.playerY + Math.sin(angle) * this.stats.orbitRadius

            // Update graphics position
            orbital.graphics.position.set(orbitalX, orbitalY)

            // Update cooldowns
            for (const [enemyId, cooldown] of orbital.hitCooldowns) {
                if (cooldown > 0) {
                    orbital.hitCooldowns.set(enemyId, cooldown - deltaSeconds)
                } else {
                    orbital.hitCooldowns.delete(enemyId)
                }
            }

            // Check collisions with enemies
            for (const enemy of this.enemySystem.enemies) {
                const dx = enemy.x - orbitalX
                const dy = enemy.y - orbitalY
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < enemy.size / 2 + 15) {
                    // Check cooldown for this enemy
                    const cooldown = orbital.hitCooldowns.get(enemy.id) || 0
                    if (cooldown <= 0) {
                        // Apply damage
                        const damage = this.stats.orbitDamage * this.stats.damageMultiplier
                        enemy.health -= damage

                        // Track damage
                        this.trackSkillDamage('orbital-strike', damage)

                        // Set hit cooldown
                        orbital.hitCooldowns.set(enemy.id, 0.3)

                        // Visual feedback
                        if (enemy.wobble) {
                            // Scale punch disabled
                            // this.impactSystem.addScalePunch(enemy.wobble, 0.15, 0.1)
                        }

                        // Small knockback
                        if (dist > 0) {
                            const nx = dx / dist
                            const ny = dy / dist
                            enemy.vx += (nx * 3) / Math.sqrt(enemy.mass)
                            enemy.vy += (ny * 3) / Math.sqrt(enemy.mass)
                        }

                        // Damage number
                        this.damageTextSystem.spawn(orbitalX, orbitalY - 10, Math.round(damage))
                    }
                }
            }
        }
    }

    /**
     * Create orbital projectiles evenly spaced around player
     */
    private createOrbitals(): void {
        const angleStep = (Math.PI * 2) / this.stats.orbitCount

        for (let i = 0; i < this.stats.orbitCount; i++) {
            const angle = i * angleStep

            // Create orbital graphic
            const orbital = new Graphics()
            orbital.circle(0, 0, 12)
            orbital.fill({ color: 0x44ccff, alpha: 0.8 })
            orbital.circle(0, 0, 12)
            orbital.stroke({ color: 0xffffff, width: 2, alpha: 0.9 })
            // Inner glow
            orbital.circle(0, 0, 6)
            orbital.fill({ color: 0xffffff, alpha: 0.5 })

            this.effectContainer.addChild(orbital)

            this.orbitalProjectiles.push({
                angle,
                graphics: orbital,
                hitCooldowns: new Map(),
            })
        }
    }

    /**
     * Clean up all orbital projectiles
     */
    private cleanupOrbitals(): void {
        for (const orbital of this.orbitalProjectiles) {
            this.effectContainer.removeChild(orbital.graphics)
            orbital.graphics.destroy()
        }
        this.orbitalProjectiles = []
    }

    // ============================================
    // GHOST MODE (Quantum Tunneling)
    // ============================================

    /**
     * Update Ghost Mode (양자 터널링) - phase through enemies dealing damage
     * Player becomes invincible and deals damage to enemies they pass through
     */
    private updateGhostMode(deltaSeconds: number): void {
        // Check if ghost mode skill is active
        if (this.stats.ghostCooldown <= 0) {
            this.isGhostMode = false
            return
        }

        // Update cooldown timer
        if (this.ghostCooldownTimer > 0) {
            this.ghostCooldownTimer -= deltaSeconds
        }

        // Update ghost mode duration
        if (this.isGhostMode) {
            this.ghostTimer -= deltaSeconds

            // Update afterimage trails
            this.updateGhostTrails(deltaSeconds)

            // Check collision with enemies for damage (pass-through damage)
            this.checkGhostCollisions()

            // End ghost mode
            if (this.ghostTimer <= 0) {
                this.endGhostMode()
            }
        } else if (this.ghostCooldownTimer <= 0) {
            // Auto-activate ghost mode when cooldown is ready
            this.activateGhostMode()
        }
    }

    /**
     * Activate ghost mode
     */
    private activateGhostMode(): void {
        if (this.isGhostMode) return

        this.isGhostMode = true
        this.ghostTimer = this.stats.ghostDuration
        this.ghostCooldownTimer = this.stats.ghostCooldown
        this.ghostHitEnemies.clear()
        this.ghostTrailTimer = 0

        // Visual effect - player becomes semi-transparent
        if (this.player) {
            this.player.alpha = 0.5
        }

        // Activation effect
        this.showGhostActivationEffect()

        // Feedback
        this.damageTextSystem.spawnCustom(this.playerX, this.playerY - 40, '👻 GHOST!', 'combo')
    }

    /**
     * End ghost mode
     */
    private endGhostMode(): void {
        this.isGhostMode = false
        this.ghostTimer = 0

        // Restore player visibility
        if (this.player) {
            this.player.alpha = 1.0
        }

        // Clean up trails
        this.cleanupGhostTrails()
    }

    /**
     * Update ghost trails (afterimages)
     */
    private updateGhostTrails(deltaSeconds: number): void {
        const trailInterval = this.stats.ghostDuration / Math.max(1, this.stats.ghostTrailCount)

        this.ghostTrailTimer += deltaSeconds

        // Spawn new trail
        if (
            this.ghostTrailTimer >= trailInterval &&
            this.ghostTrailPositions.length < this.stats.ghostTrailCount
        ) {
            this.ghostTrailTimer = 0
            this.spawnGhostTrail()
        }

        // Update existing trails (fade out)
        for (let i = this.ghostTrailPositions.length - 1; i >= 0; i--) {
            const trail = this.ghostTrailPositions[i]
            trail.alpha -= deltaSeconds * 2 // Fade over 0.5 seconds

            if (trail.alpha <= 0) {
                this.effectContainer.removeChild(trail.graphics)
                trail.graphics.destroy()
                this.ghostTrailPositions.splice(i, 1)
            } else {
                trail.graphics.alpha = trail.alpha * 0.6
            }
        }
    }

    /**
     * Spawn a ghost trail at current player position
     */
    private spawnGhostTrail(): void {
        // Create a semi-transparent copy of player silhouette
        const trail = new Graphics()
        const size = this.playerSize

        // Draw ghost silhouette
        trail.circle(0, 0, size)
        trail.fill({ color: 0x88ffff, alpha: 0.4 })
        trail.circle(0, 0, size * 0.8)
        trail.fill({ color: 0xaaffff, alpha: 0.3 })
        trail.circle(0, 0, size * 0.5)
        trail.fill({ color: 0xffffff, alpha: 0.2 })

        trail.position.set(this.playerX, this.playerY)
        trail.alpha = 0.6
        this.effectContainer.addChild(trail)

        this.ghostTrailPositions.push({
            x: this.playerX,
            y: this.playerY,
            alpha: 1.0,
            graphics: trail,
        })
    }

    /**
     * Clean up all ghost trails
     */
    private cleanupGhostTrails(): void {
        for (const trail of this.ghostTrailPositions) {
            this.effectContainer.removeChild(trail.graphics)
            trail.graphics.destroy()
        }
        this.ghostTrailPositions = []
    }

    /**
     * Check ghost collision with enemies and deal damage
     */
    private checkGhostCollisions(): void {
        for (const enemy of this.enemySystem.enemies) {
            // Skip already hit enemies
            if (this.ghostHitEnemies.has(enemy.id)) continue

            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            const hitRange = this.playerSize + enemy.size / 2

            if (dist < hitRange) {
                // Mark as hit
                this.ghostHitEnemies.add(enemy.id)

                // Deal damage
                const damage = this.stats.ghostDamage * this.stats.damageMultiplier
                enemy.health -= damage

                // Track damage
                this.trackSkillDamage('quantum-tunnel', damage)

                // Visual feedback
                if (enemy.wobble) {
                    // Scale punch disabled
                    // this.impactSystem.addScalePunch(enemy.wobble, 0.2, 0.15)
                }

                // Damage number
                this.damageTextSystem.spawn(enemy.x, enemy.y - 20, Math.round(damage), 'critical')

                // Hit effect
                this.showGhostHitEffect(enemy.x, enemy.y)
            }
        }
    }

    /**
     * Show ghost mode activation effect
     */
    private showGhostActivationEffect(): void {
        // Expanding ring effect
        const ring = new Graphics()
        ring.circle(0, 0, 10)
        ring.stroke({ color: 0x88ffff, width: 3, alpha: 0.8 })
        ring.position.set(this.playerX, this.playerY)
        this.effectContainer.addChild(ring)

        let ringRadius = 10
        const maxRadius = 60
        const expandSpeed = 200

        const animate = () => {
            ringRadius += expandSpeed / 60
            const progress = ringRadius / maxRadius

            if (progress >= 1) {
                this.effectContainer.removeChild(ring)
                ring.destroy()
                return
            }

            ring.clear()
            ring.circle(0, 0, ringRadius)
            ring.stroke({
                color: 0x88ffff,
                width: 3 * (1 - progress),
                alpha: 0.8 * (1 - progress),
            })

            requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }

    /**
     * Show ghost hit effect on enemy
     */
    private showGhostHitEffect(x: number, y: number): void {
        const effect = new Graphics()
        effect.circle(0, 0, 15)
        effect.fill({ color: 0x88ffff, alpha: 0.6 })
        effect.position.set(x, y)
        this.effectContainer.addChild(effect)

        let timer = 0.2

        const animate = () => {
            timer -= 1 / 60
            if (timer <= 0) {
                this.effectContainer.removeChild(effect)
                effect.destroy()
                return
            }

            const progress = 1 - timer / 0.2
            effect.alpha = 0.6 * (1 - progress)
            effect.scale.set(1 + progress * 1.5)

            requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }

    // ============================================
    // PLASMA DISCHARGE (Raiden-style Lightning Laser)
    // ============================================

    /**
     * Update Plasma Discharge - lightning laser that chains between enemies
     * Inspired by Raiden's iconic lightning weapon
     */
    private updatePlasmaLaser(deltaSeconds: number): void {
        // Check if laser skill is active
        if (this.stats.laserDamage <= 0) {
            this.cleanupLaser()
            return
        }

        // Update flicker phase for lightning effect
        this.laserFlickerPhase += deltaSeconds * 30 // Fast flicker

        // Find chain targets
        this.updateLaserChainTargets()

        // Apply damage to chain targets
        if (this.laserChainTargets.length > 0) {
            const damagePerSecond = this.stats.laserDamage * this.stats.damageMultiplier
            const damageThisFrame = damagePerSecond * deltaSeconds

            for (const target of this.laserChainTargets) {
                target.enemy.health -= damageThisFrame

                // Track damage
                this.trackSkillDamage('plasma-discharge', damageThisFrame)

                // Small visual feedback
                if (target.enemy.wobble && Math.random() < 0.1) {
                    // Scale punch disabled
                    // this.impactSystem.addScalePunch(target.enemy.wobble, 0.1, 0.05)
                }
            }
        }

        // Update visual
        this.drawLaserBeam()
    }

    /**
     * Find enemies to chain the laser to
     */
    private updateLaserChainTargets(): void {
        this.laserChainTargets = []

        if (this.enemySystem.enemies.length === 0) return

        const maxChains = this.stats.laserChainCount
        const maxRange = this.stats.laserRange
        const chainRange = this.stats.laserChainRange

        // Find first target (closest enemy within range)
        let closestEnemy: Enemy | null = null
        let closestDist = maxRange

        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < closestDist) {
                closestDist = dist
                closestEnemy = enemy
            }
        }

        if (!closestEnemy) return

        // Add first target
        this.laserChainTargets.push({
            x: closestEnemy.x,
            y: closestEnemy.y,
            enemy: closestEnemy,
        })

        // Chain to additional enemies
        const usedEnemies = new Set<number>([closestEnemy.id])
        let lastX = closestEnemy.x
        let lastY = closestEnemy.y

        for (let i = 1; i < maxChains; i++) {
            let nextEnemy: Enemy | null = null
            let nextDist = chainRange

            for (const enemy of this.enemySystem.enemies) {
                if (usedEnemies.has(enemy.id)) continue

                const dx = enemy.x - lastX
                const dy = enemy.y - lastY
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < nextDist) {
                    nextDist = dist
                    nextEnemy = enemy
                }
            }

            if (!nextEnemy) break

            usedEnemies.add(nextEnemy.id)
            this.laserChainTargets.push({
                x: nextEnemy.x,
                y: nextEnemy.y,
                enemy: nextEnemy,
            })

            lastX = nextEnemy.x
            lastY = nextEnemy.y
        }
    }

    /**
     * Draw the lightning laser beam with zigzag effect
     */
    private drawLaserBeam(): void {
        // Create graphics if needed
        if (!this.laserGlowGraphics) {
            this.laserGlowGraphics = new Graphics()
            this.effectContainer.addChild(this.laserGlowGraphics)
        }
        if (!this.laserGraphics) {
            this.laserGraphics = new Graphics()
            this.effectContainer.addChild(this.laserGraphics)
        }

        // Clear previous frame
        this.laserGlowGraphics.clear()
        this.laserGraphics.clear()

        if (this.laserChainTargets.length === 0) return

        // Draw glow layer (wider, more transparent)
        this.drawLightningPath(this.laserGlowGraphics, 0x00ffff, 8, 0.3)

        // Draw main beam (thinner, brighter)
        this.drawLightningPath(this.laserGraphics, 0xffffff, 3, 0.9)
    }

    /**
     * Draw lightning path with zigzag segments
     */
    private drawLightningPath(
        graphics: Graphics,
        color: number,
        width: number,
        alpha: number
    ): void {
        // Start from player
        let startX = this.playerX
        let startY = this.playerY

        for (const target of this.laserChainTargets) {
            // Draw zigzag lightning to this target
            this.drawLightningSegment(
                graphics,
                startX,
                startY,
                target.x,
                target.y,
                color,
                width,
                alpha
            )

            // Next segment starts from this target
            startX = target.x
            startY = target.y
        }
    }

    /**
     * Draw a single lightning segment with zigzag effect
     */
    private drawLightningSegment(
        graphics: Graphics,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: number,
        width: number,
        alpha: number
    ): void {
        const dx = x2 - x1
        const dy = y2 - y1
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 1) return

        // Number of zigzag segments based on distance
        const segments = Math.max(3, Math.floor(dist / 20))

        // Perpendicular direction for zigzag
        const perpX = -dy / dist
        const perpY = dx / dist

        // Flicker intensity
        const flickerIntensity = 0.7 + Math.sin(this.laserFlickerPhase) * 0.3

        // Build path
        let currentX = x1
        let currentY = y1

        graphics.moveTo(currentX, currentY)

        for (let i = 1; i <= segments; i++) {
            const t = i / segments

            // Base position along line
            const baseX = x1 + dx * t
            const baseY = y1 + dy * t

            // Add zigzag offset (except for last point)
            let offsetX = 0
            let offsetY = 0

            if (i < segments) {
                // Randomize zigzag each frame for lightning effect
                const zigzagAmount = 8 + Math.sin(this.laserFlickerPhase * 2 + i * 3) * 6
                const direction =
                    ((i % 2) * 2 - 1) * (Math.sin(this.laserFlickerPhase + i) > 0 ? 1 : -1)
                offsetX = perpX * zigzagAmount * direction * flickerIntensity
                offsetY = perpY * zigzagAmount * direction * flickerIntensity
            }

            currentX = baseX + offsetX
            currentY = baseY + offsetY

            graphics.lineTo(currentX, currentY)
        }

        graphics.stroke({
            color,
            width: width * flickerIntensity,
            alpha: alpha * flickerIntensity,
        })

        // Draw impact point at target
        graphics.circle(x2, y2, 6 * flickerIntensity)
        graphics.fill({ color, alpha: alpha * 0.5 * flickerIntensity })
    }

    /**
     * Clean up laser graphics
     */
    private cleanupLaser(): void {
        if (this.laserGraphics) {
            this.effectContainer.removeChild(this.laserGraphics)
            this.laserGraphics.destroy()
            this.laserGraphics = null
        }
        if (this.laserGlowGraphics) {
            this.effectContainer.removeChild(this.laserGlowGraphics)
            this.laserGlowGraphics.destroy()
            this.laserGlowGraphics = null
        }
        this.laserChainTargets = []
    }

    // ============================================
    // NEW SKILL UPDATE METHODS
    // ============================================

    /**
     * Pendulum Rhythm - damage oscillates over time
     * Updates the pendulumDamageMultiplier based on rhythm phase
     */
    private updatePendulumRhythm(deltaSeconds: number): void {
        if (this.stats.rhythmPeriod <= 0) {
            this.pendulumDamageMultiplier = 1
            return
        }

        // Update phase (full cycle = 2π)
        const angularSpeed = (2 * Math.PI) / this.stats.rhythmPeriod
        this.pendulumPhase += angularSpeed * deltaSeconds
        if (this.pendulumPhase > Math.PI * 2) {
            this.pendulumPhase -= Math.PI * 2
        }

        // Damage multiplier: 1 at trough, 1 + peakDamageBonus at peak
        // Using (1 + cos) / 2 to get 0-1 range, then scale
        const rhythmValue = (1 + Math.cos(this.pendulumPhase)) / 2
        this.pendulumDamageMultiplier = 1 + this.stats.peakDamageBonus * rhythmValue
    }

    /**
     * Static Repulsion - constant push aura (like Coulomb's law)
     * Pushes enemies away from player continuously
     */
    private updateStaticRepulsion(deltaSeconds: number): void {
        if (this.stats.repulsionRadius <= 0) return

        let totalPush = 0
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < this.stats.repulsionRadius && dist > 10) {
                // Coulomb-like force: stronger when closer (1/r²)
                const normalizedDist = dist / this.stats.repulsionRadius
                const forceFactor = 1 / (normalizedDist * normalizedDist + 0.1)
                const force = this.stats.repulsionForce * forceFactor * deltaSeconds

                // Apply force away from player
                const nx = dx / dist
                const ny = dy / dist
                enemy.vx += (nx * force) / Math.sqrt(enemy.mass)
                enemy.vy += (ny * force) / Math.sqrt(enemy.mass)
                totalPush += force
            }
        }
        if (totalPush > 0) {
            this.trackSkillEffect('static-repulsion', 'pushForce', totalPush)
        }
    }

    /**
     * Time Warp - slow enemies within radius
     */
    private updateTimeWarp(deltaSeconds: number): void {
        if (this.stats.warpRadius <= 0) return

        let totalSlowApplied = 0
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < this.stats.warpRadius) {
                // Slow enemy speed
                const slowAmount = this.stats.slowFactor
                enemy.speed = enemy.speed * (1 - slowAmount * deltaSeconds * 2)
                totalSlowApplied += deltaSeconds * slowAmount
                // Minimum speed floor
                const baseSpeed = 1.0
                if (enemy.speed < baseSpeed * 0.3) {
                    enemy.speed = baseSpeed * 0.3
                }
            }
        }
        if (totalSlowApplied > 0) {
            this.trackSkillEffect('time-warp', 'slowTime', totalSlowApplied)
        }
    }

    /**
     * Magnetic Shield - deflects enemy movement direction
     */
    private updateMagneticShield(deltaSeconds: number): void {
        if (this.stats.shieldRadius <= 0) return

        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < this.stats.shieldRadius && dist > 20) {
                // Calculate tangent direction (perpendicular to radius)
                const nx = dx / dist
                const ny = dy / dist
                const tx = -ny // Tangent (counterclockwise)
                const ty = nx

                // Current velocity toward player
                const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy)
                if (currentSpeed < 0.1) continue

                // Determine which tangent direction to use (based on which side enemy approaches from)
                const approachAngle = Math.atan2(enemy.vy, enemy.vx)
                const radialAngle = Math.atan2(-dy, -dx)
                let angleDiff = approachAngle - radialAngle
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

                const tangentDir = angleDiff > 0 ? 1 : -1
                const deflectX = tx * tangentDir
                const deflectY = ty * tangentDir

                // Apply deflection force
                const deflectStrength = this.stats.deflectionStrength * deltaSeconds * 5
                const normalizedDist = dist / this.stats.shieldRadius
                const distFactor = 1 - normalizedDist

                enemy.vx += deflectX * deflectStrength * currentSpeed * distFactor
                enemy.vy += deflectY * deflectStrength * currentSpeed * distFactor

                // Track deflection
                this.trackSkillEffect('magnetic-shield', 'deflections', 1)
            }
        }
    }

    /**
     * Torque Slash - spinning blade damages nearby enemies
     */
    private updateTorqueSlash(deltaSeconds: number): void {
        if (this.stats.slashRadius <= 0) return

        // Update rotation
        this.slashAngle += this.stats.slashSpeed * Math.PI * 2 * deltaSeconds
        if (this.slashAngle > Math.PI * 2) {
            this.slashAngle -= Math.PI * 2
        }

        // Update cooldowns
        for (const [enemyId, cooldown] of this.slashHitCooldowns) {
            const newCooldown = cooldown - deltaSeconds
            if (newCooldown <= 0) {
                this.slashHitCooldowns.delete(enemyId)
            } else {
                this.slashHitCooldowns.set(enemyId, newCooldown)
            }
        }

        // Check collision with enemies
        for (const enemy of this.enemySystem.enemies) {
            // Skip if on cooldown
            if (this.slashHitCooldowns.has(enemy.id)) continue

            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < this.stats.slashRadius + enemy.size / 2) {
                // Hit!
                const actualDamage = this.stats.slashDamage * this.stats.damageMultiplier
                enemy.health -= actualDamage
                this.trackSkillDamage('torque-slash', actualDamage)
                this.slashHitCooldowns.set(enemy.id, 0.3) // 0.3s cooldown

                // Small knockback in blade direction
                const bladeX = Math.cos(this.slashAngle)
                const bladeY = Math.sin(this.slashAngle)
                enemy.vx += bladeX * 3
                enemy.vy += bladeY * 3

                // Visual feedback
                this.impactSystem.trigger(enemy.x, enemy.y, 'hit')
            }
        }
    }

    /**
     * Buoyant Bomb - floating bombs that drop and explode
     */
    private updateBuoyantBombs(deltaSeconds: number): void {
        if (this.stats.floatDuration <= 0) return

        // Spawn new bomb every 3 seconds
        const spawnInterval = 3
        this.buoyantBombTimer += deltaSeconds
        if (this.buoyantBombTimer >= spawnInterval) {
            this.buoyantBombTimer = 0
            this.spawnBuoyantBomb()
        }

        // Update existing bombs
        for (let i = this.buoyantBombs.length - 1; i >= 0; i--) {
            const bomb = this.buoyantBombs[i]
            bomb.floatTime += deltaSeconds

            // Floating animation (bob up and down)
            const bobOffset = Math.sin(bomb.floatTime * 3) * 5
            bomb.graphics.position.y = bomb.y + bobOffset - bomb.floatTime * 10 // Float upward slowly

            // Pulse effect
            const pulse = 1 + Math.sin(bomb.floatTime * 5) * 0.1
            bomb.graphics.scale.set(pulse)

            // Check if time to drop
            if (bomb.floatTime >= this.stats.floatDuration) {
                // Explode!
                this.createBombExplosion(bomb.x, bomb.graphics.position.y)

                // Remove bomb
                this.effectContainer.removeChild(bomb.graphics)
                bomb.graphics.destroy()
                this.buoyantBombs.splice(i, 1)
            }
        }
    }

    private spawnBuoyantBomb(): void {
        // Spawn at random position near player
        const angle = Math.random() * Math.PI * 2
        const distance = 50 + Math.random() * 100
        const x = this.playerX + Math.cos(angle) * distance
        const y = this.playerY + Math.sin(angle) * distance

        // Create bomb graphics
        const graphics = new Graphics()
        // Bomb body
        graphics.circle(0, 0, 12)
        graphics.fill(0x9b59b6) // Purple
        graphics.circle(0, 0, 12)
        graphics.stroke({ color: 0xe74c3c, width: 2 })
        // Fuse spark
        graphics.circle(0, -14, 3)
        graphics.fill(0xf39c12)

        graphics.position.set(x, y)
        this.effectContainer.addChild(graphics)

        this.buoyantBombs.push({
            x,
            y,
            floatTime: 0,
            graphics,
        })
    }

    private createBombExplosion(x: number, y: number): void {
        const radius = this.stats.dropRadius
        const damage = this.stats.dropDamage * this.stats.damageMultiplier

        // Damage enemies in radius
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - x
            const dy = enemy.y - y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < radius + enemy.size / 2) {
                // Damage falls off with distance
                const falloff = 1 - dist / radius
                const finalDamage = damage * Math.max(0.3, falloff)
                enemy.health -= finalDamage

                // Track damage
                this.trackSkillDamage('buoyant-bomb', finalDamage)

                // Knockback away from explosion
                const knockDir = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 0, y: -1 }
                const knockForce = (8 * falloff) / Math.sqrt(enemy.mass)
                enemy.vx += knockDir.x * knockForce
                enemy.vy += knockDir.y * knockForce
            }
        }

        // Visual explosion effect
        this.impactSystem.trigger(x, y, 'explosion')
    }

    private updatePlayer(delta: number): void {
        const input = this.joystick.getInput()
        const speed = this.playerBaseSpeed * this.stats.moveSpeedMultiplier

        const deadzone = 0.1

        // Input velocity from joystick
        if (input.magnitude > deadzone) {
            this.playerVx = input.dirX * speed
            this.playerVy = input.dirY * speed
        } else {
            this.playerVx = 0
            this.playerVy = 0
        }

        // Combine input velocity with external velocity (knockback, bounce, etc.)
        const totalVx = this.playerVx + this.externalVx
        const totalVy = this.playerVy + this.externalVy

        // Apply combined velocity
        this.playerX += totalVx * delta
        this.playerY += totalVy * delta

        // Decay external velocity
        this.externalVx *= this.externalVelocityDecay
        this.externalVy *= this.externalVelocityDecay

        // Clear tiny external velocities
        if (Math.abs(this.externalVx) < 0.1) this.externalVx = 0
        if (Math.abs(this.externalVy) < 0.1) this.externalVy = 0

        // Infinite map - no boundary restrictions
        // Player can move freely in any direction

        // Update player position in world space
        this.player.position.set(this.playerX, this.playerY)

        // Update gulp animation (Kirby eating effect)
        this.player.updateGulp(delta / 60) // Convert frame delta to seconds

        // Update player HP gauge
        this.updatePlayerHealthBar()

        // Camera follows player
        this.cameraX = this.playerX
        this.cameraY = this.playerY

        // Apply camera transform to gameContainer
        // This makes the player appear centered on screen
        this.gameContainer.pivot.set(this.cameraX, this.cameraY)
        this.gameContainer.position.set(this.centerX, this.centerY)

        const velMag = Math.sqrt(totalVx * totalVx + totalVy * totalVy)
        if (velMag > 0.5) {
            this.player.updateOptions({
                lookDirection: { x: totalVx / velMag, y: totalVy / velMag },
            })
        }

        // Check for coordinate overflow and reset if needed
        if (
            Math.abs(this.playerX) > this.WORLD_RESET_THRESHOLD ||
            Math.abs(this.playerY) > this.WORLD_RESET_THRESHOLD
        ) {
            this.resetWorldCoordinates()
        }
    }

    /**
     * Reset all world coordinates to prevent floating point overflow
     * Shifts everything so player is back at origin (0,0)
     */
    private resetWorldCoordinates(): void {
        const offsetX = this.playerX
        const offsetY = this.playerY

        // Reset player to origin
        this.playerX = 0
        this.playerY = 0
        this.player.position.set(0, 0)

        // Offset all enemies
        for (const enemy of this.enemySystem.enemies) {
            enemy.x -= offsetX
            enemy.y -= offsetY
            enemy.graphics.position.set(enemy.x, enemy.y)
        }

        // Offset all projectiles
        for (const proj of this.projectileSystem.projectiles) {
            proj.x -= offsetX
            proj.y -= offsetY
            proj.graphics.position.set(proj.x, proj.y)
        }

        // Offset all experience orbs
        for (const orb of this.xpOrbSystem.orbs) {
            orb.x -= offsetX
            orb.y -= offsetY
            orb.graphics.position.set(orb.x, orb.y)
        }

        // Offset all pickups
        for (const pickup of this.pickupSystem.getPickups()) {
            pickup.x -= offsetX
            pickup.y -= offsetY
            pickup.graphics.position.set(pickup.x, pickup.y)
            pickup.glowGraphics.position.set(pickup.x, pickup.y)
        }

        // Update camera to new player position
        this.cameraX = 0
        this.cameraY = 0
        this.gameContainer.pivot.set(0, 0)
        this.gameContainer.position.set(this.centerX, this.centerY)
    }

    private gameOver(): void {
        this.setGameState('game-over', 'gameOver')
        this.player.updateOptions({ expression: 'dizzy' })
        this.backgroundSystem.startCollapse()

        // Reset black hole distortion effect
        this.blackHoleProximityEffect = 0
        this.updateBlackHoleDistortion()
    }

    private triggerVictory(): void {
        this.setGameState('victory', 'triggerVictory')
        this.player.updateOptions({ expression: 'happy' })

        // Reset black hole distortion effect
        this.blackHoleProximityEffect = 0
        this.updateBlackHoleDistortion()

        // Dramatic victory announcement
        this.damageTextSystem.spawnCustom(this.width / 2, this.height / 2, 'VICTORY!', 'critical')

        // Slow motion celebration
        this.impactSystem.triggerSlowMotion(0.1, 1.0)

        // Show result after celebration delay
        setTimeout(() => {
            this.showResult()
        }, 2000)
    }

    private spawnFinalBoss(): void {
        this.bossSpawned = true

        // Boss warning announcement
        this.damageTextSystem.spawnCustom(
            this.width / 2,
            this.height / 2 - 50,
            'WARNING: BOSS!',
            'critical'
        )
        this.impactSystem.triggerSlowMotion(0.3, 0.5)

        // Spawn boss at random edge after brief delay
        setTimeout(() => {
            const side = Math.floor(Math.random() * 4)
            let x: number, y: number
            const size = 100

            switch (side) {
                case 0: // top
                    x = Math.random() * this.width
                    y = -size
                    break
                case 1: // right
                    x = this.width + size
                    y = Math.random() * this.height
                    break
                case 2: // bottom
                    x = Math.random() * this.width
                    y = this.height + size
                    break
                default: // left
                    x = -size
                    y = Math.random() * this.height
                    break
            }

            this.enemySystem.spawnAtTier(x, y, 'boss', this.gameTime)
        }, 500)
    }

    private showResult(): void {
        this.setGameState('result', 'showResult')

        const rank = getRankFromTime(this.gameTime)
        const kills = Math.floor(this.score / 10)
        useProgressStore
            .getState()
            .recordGameResult(this.gameTime, this.playerProgress.level, kills, rank)

        this.resultScreen.show({
            gameTime: this.gameTime,
            score: this.score,
            level: this.playerProgress.level,
            skills: this.playerSkills,
            physicsStats: { ...this.physicsStats },
        })
    }

    private showStageSelect(character: WobbleShape): void {
        this.debugLog(`showStageSelect: ${character}`)
        this.selectedCharacter = character
        this.characterSelectScreen.hide()
        this.setGameState('stage-select', 'showStageSelect')
        this.stageSelectScreen.show()
    }

    private showCharacterSelect(): void {
        this.debugLog('showCharacterSelect called')
        this.stageSelectScreen.hide()
        this.setGameState('character-select', 'showCharacterSelect')
        this.characterSelectScreen.show()
    }

    private startWithStage(character: WobbleShape, stageId: string): void {
        this.debugLog(`startWithStage: ${character}, stage: ${stageId}`)
        this.selectedCharacter = character
        this.currentStage = getStageById(stageId) || getDefaultStage()
        this.stageSelectScreen.hide()

        // Start world generation with loading screen
        this.startWorldGeneration()
    }

    private async startWorldGeneration(): Promise<void> {
        // Create world generator with random seed
        this.worldGenerator = new WorldGenerator()
        const seed = this.worldGenerator.getSeed()

        this.debugLog(`Starting world generation with seed: 0x${seed.toString(16)}`)
        this.setGameState('loading', 'startWorldGeneration')

        // Show loading screen
        this.loadingScreen.show(seed)

        // Connect progress callback
        this.worldGenerator.onProgress = (progress, phase, detail) => {
            this.loadingScreen.setProgress(progress, phase, detail)
        }

        // Generate world
        const difficulty = this.currentStage.physics.gravity || 5
        this.generatedWorld = await this.worldGenerator.generate(difficulty)

        this.debugLog(
            `World generated: ${this.generatedWorld.enemySpawns.length} spawns, ${this.generatedWorld.worldEvents.length} events`
        )

        // Brief delay to show "READY" state
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Transition to opening
        this.loadingScreen.hide()
        this.showOpening(this.selectedCharacter)
    }

    private applyStagePhysics(): void {
        // Apply physics modifiers to all systems
        this.enemySystem.setPhysicsModifiers(this.currentStage.physics)
        this.projectileSystem.setPhysicsModifiers(this.currentStage.physics)

        // Update background theme
        this.backgroundSystem.setTheme(this.currentStage.bgColor)

        // Apply stage-specific quantum/visual effects to wobble filter
        if (this.wobbleFilter) {
            this.wobbleFilter.applyStagePreset(this.currentStage.id)
            this.wobbleFilter.gridEnabled = false // Keep grid disabled on main filter
            // Update base values for dynamic intensity scaling
            this.baseWobbleIntensity = this.wobbleFilter.wobbleIntensity
            this.baseWobbleSpeed = this.wobbleFilter.wobbleSpeed
            this.baseEnergyPulse = this.wobbleFilter.energyPulse
        }
        // Apply stage preset to grid filter (background only)
        if (this.gridFilter) {
            this.gridFilter.applyStagePreset(this.currentStage.id)
            this.gridFilter.gridEnabled = true // Keep grid enabled on background
        }
    }

    private showOpening(character: WobbleShape): void {
        this.selectedCharacter = character
        this.setGameState('opening', 'showOpening')
        this.openingScreen.show(character, this.currentStage)

        // Hide player during opening (opening has its own wobble)
        if (this.player) {
            this.player.visible = false
        }
    }

    private startGameAfterOpening(): void {
        this.debugLog('startGameAfterOpening called')
        this.openingScreen.hide()
        this.initializeCharacterSkills()
        this.applyCharacterStats()
        this.applyStagePhysics()

        // Create black hole system if world was generated
        this.createBlackHoleSystem()

        const charData = WOBBLE_CHARACTERS[this.selectedCharacter]
        this.player.updateOptions({
            shape: this.selectedCharacter,
            color: charData.color,
            expression: 'happy',
        })
        this.player.visible = true

        this.gameTime = 0
        this.score = 0
        this.physicsStats = {
            totalMomentum: 0,
            elasticBounces: 0,
            mergedMass: 0,
            slingshotCount: 0,
        }
        // Set pendingLevelUps to 1 for initial skill selection before game starts
        this.playerProgress = { xp: 0, level: 1, pendingLevelUps: 1 }
        this.updateHUD()
        // Show initial skill selection - player must choose a starting skill
        this.showSkillSelection()
    }

    /**
     * Create the Interstellar-style black hole from generated world
     */
    private createBlackHoleSystem(): void {
        // Clean up existing black hole
        if (this.blackHoleSystem) {
            this.blackHoleSystem.destroy()
            this.blackHoleSystem = null
        }
        if (this.blackHoleContainer) {
            this.gameContainer.removeChild(this.blackHoleContainer)
            this.blackHoleContainer = null
        }

        // Create new black hole from generated world
        if (this.generatedWorld?.blackHole) {
            this.blackHoleContainer = new Container()
            // Add behind player but above background
            this.gameContainer.addChildAt(this.blackHoleContainer, 1)

            this.blackHoleSystem = new BlackHoleSystem(
                this.blackHoleContainer,
                this.generatedWorld.blackHole
            )

            this.debugLog(
                `Black hole created at (${this.generatedWorld.blackHole.x.toFixed(0)}, ${this.generatedWorld.blackHole.y.toFixed(0)}) with mass ${this.generatedWorld.blackHole.mass}`
            )
        }
    }

    private initializeCharacterSkills(): void {
        const config = getCharacterSkillConfig(this.selectedCharacter)

        // Roguelike style: player starts with no skills, gains them through level-ups
        this.playerSkills = []

        // Character provides passive only
        this.passiveTrait = config.passive
        this.momentumSpeedBonus = 0
        this.consecutiveHits = 0
        this.shootTimer = 0
        this.shockwaveTimer = 0
        if (this.shockwaveChargeGraphics) {
            this.effectContainer.removeChild(this.shockwaveChargeGraphics)
            this.shockwaveChargeGraphics.destroy()
            this.shockwaveChargeGraphics = null
        }
        this.shockwaveChargeParticles = []
        this.pendulumPhase = 0
        this.pendulumDamageMultiplier = 1
        this.slashAngle = 0
        this.slashHitCooldowns.clear()
        this.buoyantBombTimer = 0
        for (const bomb of this.buoyantBombs) {
            this.effectContainer.removeChild(bomb.graphics)
            bomb.graphics.destroy()
        }
        this.buoyantBombs = []

        // Phase 3 timer resets
        this.wavePulseTimer = 0
        this.auraTimer = 0
        this.beatPulseTimer = 0
        this.beatPhase = 0
        if (this.beatPulseGraphics) {
            this.effectContainer.removeChild(this.beatPulseGraphics)
            this.beatPulseGraphics.destroy()
            this.beatPulseGraphics = null
        }
        for (const wave of this.activeWaves) {
            this.effectContainer.removeChild(wave.graphics)
            wave.graphics.destroy()
        }
        this.activeWaves = []
        if (this.waveChargeGraphics) {
            this.effectContainer.removeChild(this.waveChargeGraphics)
            this.waveChargeGraphics.destroy()
            this.waveChargeGraphics = null
        }
        this.waveRipples = []

        // Phase 6 orbital cleanup
        this.cleanupOrbitals()
        this.orbitAngle = 0
        this.lastOrbitCount = 0

        // Ghost mode (Quantum Tunneling) reset
        this.isGhostMode = false
        this.ghostTimer = 0
        this.ghostCooldownTimer = 0
        this.ghostTrailTimer = 0
        this.ghostHitEnemies.clear()
        this.cleanupGhostTrails()

        // Plasma Discharge reset
        this.laserFlickerPhase = 0
        this.cleanupLaser()
    }

    private applyCharacterStats(): void {
        const wobbleStats = WOBBLE_STATS[this.selectedCharacter]
        this.maxPlayerHealth = Math.round(this.baseMaxHealth * wobbleStats.healthMultiplier)
        this.playerHealth = this.maxPlayerHealth
        this.recalculateStats()
    }

    protected animateIdle(ticker: Ticker): void {
        // Prevent operation on destroyed scene
        if (this.isDestroyed) return

        const delta = ticker.deltaMS / 16.67
        const deltaSeconds = ticker.deltaMS / 1000
        this.animPhase += deltaSeconds

        if (this.wobbleFilter) {
            this.wobbleFilter.time = this.animPhase
            this.wobbleFilter.setCameraPosition(this.cameraX, this.cameraY)
        }
        if (this.gridFilter) {
            this.gridFilter.time = this.animPhase
            this.gridFilter.setCameraPosition(this.cameraX, this.cameraY)
            // Player position in world coordinates (filter is on bgContainer which uses world coords)
            this.gridFilter.setPlayerPosition(this.playerX, this.playerY)
        }

        // Update filter base graphic to ensure filter always has content
        this.updateFilterBaseGraphic()

        this.backgroundSystem.update(
            delta,
            this.playerSkills.length,
            this.gameTime,
            this.cameraX,
            this.cameraY
        )

        if (this.gameState === 'skill-selection') {
            this.skillSelectionScreen.update(deltaSeconds)
        }

        if (this.gameState === 'game-over') {
            const collapseComplete = this.backgroundSystem.updateCollapse(delta)
            if (collapseComplete) {
                this.showResult()
            }
        }

        if (this.gameState === 'victory') {
            // Victory state - keep updating effects while waiting for result screen
            this.damageTextSystem.update(deltaSeconds)
            this.impactSystem.update(deltaSeconds)
        }

        if (this.gameState === 'result') {
            this.resultScreen.update(deltaSeconds)
        }

        if (this.gameState === 'character-select') {
            this.characterSelectScreen.update(deltaSeconds)
        }

        if (this.gameState === 'stage-select') {
            this.stageSelectScreen.update(deltaSeconds)
        }

        if (this.gameState === 'opening') {
            this.openingScreen.update(deltaSeconds)
        }

        if (this.gameState === 'loading') {
            this.loadingScreen.update(deltaSeconds)
        }

        if (this.gameState === 'paused') {
            this.pauseScreen.update(deltaSeconds)
        }

        const breathe = Math.sin(this.animPhase * 2) * 0.03
        this.player?.updateOptions({
            wobblePhase: this.animPhase,
            scaleX: 1 + breathe,
            scaleY: 1 - breathe,
        })

        // Update debug overlay
        this.updateDebugText()
    }

    protected animatePlay(ticker: Ticker): void {
        // Prevent operation on destroyed scene
        if (this.isDestroyed) return

        if (this.gameState !== 'playing') {
            this.animateIdle(ticker)
            return
        }

        const rawDeltaSeconds = ticker.deltaMS / 1000
        const adjustedDeltaSeconds = this.impactSystem.update(rawDeltaSeconds)

        if (this.impactSystem.isHitstopActive) {
            this.animPhase += rawDeltaSeconds

            // Update filter time and camera during hitstop
            if (this.wobbleFilter) {
                this.wobbleFilter.time = this.animPhase
                this.wobbleFilter.setCameraPosition(this.cameraX, this.cameraY)
            }
            if (this.gridFilter) {
                this.gridFilter.time = this.animPhase
                this.gridFilter.setCameraPosition(this.cameraX, this.cameraY)
            }

            // Update filter base graphic during hitstop too
            this.updateFilterBaseGraphic()

            this.backgroundSystem.update(
                rawDeltaSeconds * 60,
                this.playerSkills.length,
                this.gameTime,
                this.cameraX,
                this.cameraY
            )
            this.damageTextSystem.update(rawDeltaSeconds)

            const breathe = Math.sin(this.animPhase * 3) * 0.02
            this.player?.updateOptions({
                wobblePhase: this.animPhase,
                scaleX: 1 + breathe,
                scaleY: 1 - breathe,
            })
            return
        }

        const deltaSeconds = adjustedDeltaSeconds
        const delta = deltaSeconds * 60

        this.animPhase += deltaSeconds
        this.gameTime += deltaSeconds

        // Update filter time and camera during gameplay
        if (this.wobbleFilter) {
            this.wobbleFilter.time = this.animPhase
            this.wobbleFilter.setCameraPosition(this.cameraX, this.cameraY)
        }
        if (this.gridFilter) {
            this.gridFilter.time = this.animPhase
            this.gridFilter.setCameraPosition(this.cameraX, this.cameraY)
            // Player position in world coordinates (filter is on bgContainer which uses world coords)
            this.gridFilter.setPlayerPosition(this.playerX, this.playerY)
            this.gridFilter.cleanupRipples() // Clean up expired ripple effects
            this.updateGridGravitySources()
        }

        // Update filter base graphic to ensure filter always has content
        this.updateFilterBaseGraphic()

        this.backgroundSystem.update(
            delta,
            this.playerSkills.length,
            this.gameTime,
            this.cameraX,
            this.cameraY
        )

        // Update world entities and their effects
        this.updateWorldEntities(deltaSeconds)

        // Update pickups (magnet, health, etc.)
        this.pickupSystem.update(deltaSeconds, this.playerX, this.playerY)

        // Sync magnet effect to XP orb system
        this.xpOrbSystem.setSuperMagnet(this.pickupSystem.isMagnetActive())

        // Update XP orbs
        this.xpOrbSystem.update(deltaSeconds, this.playerX, this.playerY)

        this.spawnTimer += deltaSeconds

        // Determine current tier weights
        const tierWeights = getTierWeights(this.gameTime, this.difficulty)
        const tierRoll = Math.random()
        let currentTier: 'small' | 'medium' | 'large' = 'small'
        if (tierRoll < tierWeights.large) {
            currentTier = 'large'
        } else if (tierRoll < tierWeights.large + tierWeights.medium) {
            currentTier = 'medium'
        }

        // Try to spawn formations (this handles its own timing)
        this.enemySystem.trySpawnFormation(
            this.gameTime,
            deltaSeconds,
            this.playerX,
            this.playerY,
            currentTier
        )

        // Spawn rate from difficulty config
        const { spawnInterval, spawnCount } = this.difficulty
        const currentSpawnRate = getDifficultyValue(
            this.gameTime,
            spawnInterval.start,
            spawnInterval.end,
            spawnInterval.rampTime
        )
        if (this.spawnTimer >= currentSpawnRate) {
            // Spawn multiple enemies at once
            const enemyCount = Math.floor(
                getDifficultyValue(
                    this.gameTime,
                    spawnCount.start,
                    spawnCount.end,
                    spawnCount.rampTime
                )
            )
            for (let i = 0; i < enemyCount; i++) {
                this.spawnEnemy()
            }
            this.spawnTimer = 0
        }

        // Victory condition check
        if (this.gameTime >= GAME_DURATION_SECONDS) {
            this.triggerVictory()
            return
        }

        // Boss spawn at 9:00
        if (this.gameTime >= BOSS_SPAWN_TIME && !this.bossSpawned) {
            this.spawnFinalBoss()
        }

        this.updatePlayer(delta)
        this.updateAutoFire(deltaSeconds)
        this.updateProjectiles(delta)
        this.updateEnemiesAndMerges(delta, deltaSeconds)
        this.checkPlayerCollisions()
        this.updateShockwave(deltaSeconds)

        // New skill updates
        this.updatePendulumRhythm(deltaSeconds)
        this.updateStaticRepulsion(deltaSeconds)
        this.updateTimeWarp(deltaSeconds)
        this.updateMagneticShield(deltaSeconds)
        this.updateTorqueSlash(deltaSeconds)
        this.updateBuoyantBombs(deltaSeconds)

        // Phase 3 cooldown-based skills
        this.updateWavePulse(deltaSeconds)
        this.updateRadiantAura(deltaSeconds)
        this.updateBeatPulse(deltaSeconds)

        // Phase 4 area effect skills
        this.updateChaosField(deltaSeconds)
        this.updateFlowStream(deltaSeconds)
        this.updateMagneticPull(deltaSeconds)

        // Phase 5 conditional trigger skills
        this.updateEscapeBurst(deltaSeconds)
        this.updateDopplerVisuals()

        // Phase 6 orbital skills
        this.updateOrbitalStrike(deltaSeconds)

        // Render persistent aura visuals (for aura-type skills)
        this.renderAuraVisuals(deltaSeconds)

        // Ghost mode (Quantum Tunneling)
        this.updateGhostMode(deltaSeconds)

        // Plasma Discharge (Raiden-style laser)
        this.updatePlasmaLaser(deltaSeconds)

        this.effectsManager.update(delta)
        // PhysicsSkillVisuals disabled due to PixiJS Batcher conflicts
        // this.physicsSkillVisuals.update(delta)
        this.updateHitEffects(delta)
        this.damageTextSystem.update(deltaSeconds)
        this.comboSystem.update(deltaSeconds)

        this.updateHUD()

        const breathe = Math.sin(this.animPhase * 3) * 0.02
        const healthPercent = this.playerHealth / this.maxPlayerHealth

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

        // Update debug overlay
        this.updateDebugText()
    }

    protected updatePreview(): void {
        // No preview needed
    }

    protected checkSuccess(): boolean {
        return true
    }

    protected onPlayStart(): void {
        console.log(
            `[SCENE #${this.instanceId}] onPlayStart CALLED - isDestroyed: ${this.isDestroyed}, isPlaying: ${this.isPlaying}`
        )

        // Prevent operation on destroyed scene
        if (this.isDestroyed) {
            console.log(`[SCENE #${this.instanceId}] onPlayStart BLOCKED - scene is destroyed`)
            return
        }

        this.debugSessionId++
        this.debugStateHistory = []
        this.debugLog(`onPlayStart called (isPlaying was: ${this.isPlaying})`)

        // Full reset before starting to ensure clean state
        console.log(`[SCENE #${this.instanceId}] Calling onReset...`)
        this.onReset()
        console.log(
            `[SCENE #${this.instanceId}] onReset completed, now calling characterSelectScreen.show()`
        )

        // Verify characterSelectScreen exists before calling show()
        if (!this.characterSelectScreen) {
            console.error(`[SCENE #${this.instanceId}] ERROR: characterSelectScreen is undefined!`)
            this.debugLog('ERROR: characterSelectScreen is undefined in onPlayStart')
            return
        }

        this.debugLog('Showing character select screen')
        this.characterSelectScreen.show()

        // Check both the internal flag and the actual PixiJS container state
        const charScreen = this.characterSelectScreen as unknown as {
            screenContainer?: { visible?: boolean; parent?: unknown; children?: unknown[] }
        }
        const containerVisible = charScreen.screenContainer?.visible ?? 'N/A'
        const hasParent = !!charScreen.screenContainer?.parent
        const childCount = charScreen.screenContainer?.children?.length ?? 0
        console.log(
            `[SCENE #${this.instanceId}] characterSelectScreen.show() completed - visible: ${containerVisible}, children: ${childCount}, hasParent: ${hasParent}`
        )
        this.debugLog(
            `characterSelectScreen.show() completed - flag: ${this.characterSelectScreen.visible}, container: ${containerVisible}, hasParent: ${hasParent}, children: ${childCount}`
        )
    }

    private resetStats(): void {
        this.stats = { ...DEFAULT_PLAYER_STATS }
    }

    /**
     * Get current game state snapshot for pause menu
     */
    public getGameStateSnapshot() {
        return {
            level: this.playerProgress.level,
            xp: this.playerProgress.xp,
            xpToNextLevel: getXpForLevel(this.playerProgress.level + 1) - this.playerProgress.xp,
            gameTime: this.gameTime,
            skills: [...this.playerSkills],
            characterId: this.selectedCharacter,
            health: this.playerHealth,
            maxHealth: this.maxPlayerHealth,
        }
    }

    /**
     * Get current game phase/state
     */
    public getGamePhase(): GameState {
        return this.gameState
    }

    /**
     * Pause the game and show pause screen
     */
    public pauseGame(): void {
        this.debugLog(`pauseGame called (current state: ${this.gameState})`)
        if (this.gameState !== 'playing') return

        this.setGameState('paused', 'pauseGame')
        this.pauseScreen.show({
            level: this.playerProgress.level,
            xp: this.playerProgress.xp,
            xpToNextLevel: getXpForLevel(this.playerProgress.level + 1) - this.playerProgress.xp,
            gameTime: this.gameTime,
            skills: [...this.playerSkills],
            health: this.playerHealth,
            maxHealth: this.maxPlayerHealth,
        })
    }

    /**
     * Resume the game from pause
     */
    public resumeGame(): void {
        this.debugLog(`resumeGame called (current state: ${this.gameState})`)
        if (this.gameState !== 'paused') return

        this.pauseScreen.hide()
        this.setGameState('playing', 'resumeGame')
    }

    /**
     * Check if game is paused
     */
    public get gamePaused(): boolean {
        return this.gameState === 'paused'
    }

    protected onReset(): void {
        console.log(`[SCENE #${this.instanceId}] onReset CALLED - state: ${this.gameState}`)
        this.debugLog(`onReset called (current state: ${this.gameState})`)

        // Safety check - ensure ALL systems are initialized
        const systems = {
            projectileSystem: !!this.projectileSystem,
            enemySystem: !!this.enemySystem,
            backgroundSystem: !!this.backgroundSystem,
            xpOrbSystem: !!this.xpOrbSystem,
            damageTextSystem: !!this.damageTextSystem,
            impactSystem: !!this.impactSystem,
            effectsManager: !!this.effectsManager,
            comboSystem: !!this.comboSystem,
            hudSystem: !!this.hudSystem,
            skillSelectionScreen: !!this.skillSelectionScreen,
            resultScreen: !!this.resultScreen,
            characterSelectScreen: !!this.characterSelectScreen,
            stageSelectScreen: !!this.stageSelectScreen,
            openingScreen: !!this.openingScreen,
            pauseScreen: !!this.pauseScreen,
            loadingScreen: !!this.loadingScreen,
            joystick: !!this.joystick,
        }

        const missingSystems = Object.entries(systems)
            .filter(([, exists]) => !exists)
            .map(([name]) => name)

        console.log(
            `[SCENE #${this.instanceId}] onReset safety check - missing: ${missingSystems.length > 0 ? missingSystems.join(', ') : 'none'}`
        )

        if (missingSystems.length > 0) {
            console.error(
                `[SCENE #${this.instanceId}] onReset ABORTING - systems not initialized: ${missingSystems.join(', ')}`
            )
            this.debugLog(`ERROR: Systems not initialized: ${missingSystems.join(', ')}`)
            return
        }

        console.log(`[SCENE #${this.instanceId}] onReset proceeding with reset...`)

        // Reset all systems
        this.projectileSystem.reset()
        this.enemySystem.reset()
        this.backgroundSystem.reset()
        this.damageTextSystem.reset()
        this.impactSystem.reset()
        this.xpOrbSystem.reset()
        this.pickupSystem.reset()
        // Reset visual distortion
        this.blackHoleProximityEffect = 0
        this.updateBlackHoleDistortion()
        this.effectsManager.reset()
        // PhysicsSkillVisuals disabled due to PixiJS Batcher conflicts
        // this.physicsSkillVisuals.reset()
        this.comboSystem.reset()

        // Reset UI systems
        this.hudSystem.reset()
        this.skillSelectionScreen.reset()
        this.resultScreen.reset()
        this.characterSelectScreen.reset()
        this.stageSelectScreen.reset()
        this.openingScreen.reset()
        this.pauseScreen.reset()
        this.loadingScreen.reset()

        // Reset black hole system
        if (this.blackHoleSystem) {
            this.blackHoleSystem.destroy()
            this.blackHoleSystem = null
        }
        if (this.blackHoleContainer) {
            this.gameContainer.removeChild(this.blackHoleContainer)
            this.blackHoleContainer = null
        }
        this.worldGenerator = null
        this.generatedWorld = null
        this.blackHoleDamageCooldown = 0

        // Reset hit effects - use deferred destruction for PixiJS v8 compatibility
        for (const effect of this.hitEffects) {
            this.effectContainer.removeChild(effect.graphics)
            this.queueDestroy(effect.graphics)
        }
        this.hitEffects = []

        this.gameContainer.position.set(this.centerX, this.centerY)

        // Reset state
        this.gameTime = 0
        this.score = 0
        this.physicsStats = {
            totalMomentum: 0,
            elasticBounces: 0,
            mergedMass: 0,
            slingshotCount: 0,
        }
        this.playerProgress = { xp: 0, level: 1, pendingLevelUps: 0 }
        this.maxPlayerHealth = this.baseMaxHealth
        this.playerHealth = this.maxPlayerHealth
        this.setGameState('character-select', 'onReset')
        this.bossSpawned = false
        this.playerSkills = []
        this.passiveTrait = ''
        this.momentumSpeedBonus = 0
        this.consecutiveHits = 0
        this.shootTimer = 0
        this.shockwaveTimer = 0
        if (this.shockwaveChargeGraphics) {
            this.effectContainer.removeChild(this.shockwaveChargeGraphics)
            this.shockwaveChargeGraphics.destroy()
            this.shockwaveChargeGraphics = null
        }
        this.shockwaveChargeParticles = []
        this.pendulumPhase = 0
        this.pendulumDamageMultiplier = 1
        this.slashAngle = 0
        this.slashHitCooldowns.clear()
        this.buoyantBombTimer = 0
        // Clean up buoyant bombs
        for (const bomb of this.buoyantBombs) {
            this.effectContainer.removeChild(bomb.graphics)
            bomb.graphics.destroy()
        }
        this.buoyantBombs = []

        // Phase 3 timer resets
        this.wavePulseTimer = 0
        this.auraTimer = 0
        this.beatPulseTimer = 0
        this.beatPhase = 0
        if (this.beatPulseGraphics) {
            this.effectContainer.removeChild(this.beatPulseGraphics)
            this.beatPulseGraphics.destroy()
            this.beatPulseGraphics = null
        }
        for (const wave of this.activeWaves) {
            this.effectContainer.removeChild(wave.graphics)
            wave.graphics.destroy()
        }
        this.activeWaves = []
        if (this.waveChargeGraphics) {
            this.effectContainer.removeChild(this.waveChargeGraphics)
            this.waveChargeGraphics.destroy()
            this.waveChargeGraphics = null
        }
        this.waveRipples = []

        // Phase 6 orbital cleanup
        this.cleanupOrbitals()
        this.orbitAngle = 0
        this.lastOrbitCount = 0

        // Ghost mode (Quantum Tunneling) reset
        this.isGhostMode = false
        this.ghostTimer = 0
        this.ghostCooldownTimer = 0
        this.ghostTrailTimer = 0
        this.ghostHitEnemies.clear()
        this.cleanupGhostTrails()

        // Plasma Discharge reset
        this.laserFlickerPhase = 0
        this.cleanupLaser()

        this.resetStats()
        this.spawnTimer = 0
        // Infinite map - start at origin
        this.playerX = 0
        this.playerY = 0
        this.playerVx = 0
        this.playerVy = 0
        this.externalVx = 0
        this.externalVy = 0
        this.cameraX = 0
        this.cameraY = 0
        this.gameContainer.pivot.set(0, 0)
        this.selectedCharacter = 'circle'

        this.joystick.reset()

        // Reset stage to default
        this.currentStage = getDefaultStage()

        this.player?.position.set(this.playerX, this.playerY)
        this.player?.updateOptions({ expression: 'happy' })
        if (this.player) {
            this.player.visible = true
        }
        this.updateHUD()
        this.debugLog('onReset complete')
    }

    // ==================== DEBUG METHODS ====================

    private debugLog(message: string): void {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 12)
        const logEntry = `[${timestamp}] S${this.debugSessionId}: ${message}`
        console.log(`[PhysicsSurvivor] ${logEntry}`)

        // Keep last 10 entries in history
        this.debugStateHistory.push(logEntry)
        if (this.debugStateHistory.length > 10) {
            this.debugStateHistory.shift()
        }
    }

    private setGameState(newState: GameState, reason: string): void {
        const oldState = this.gameState
        this.gameState = newState
        this.debugLog(`STATE: ${oldState} -> ${newState} (${reason})`)

        // Toggle filters based on game state
        // Disable CRT/scanline effects during selection screens
        const isSelectionScreen = newState === 'character-select' || newState === 'stage-select'
        this.updateFilterVisibility(!isSelectionScreen)
    }

    /**
     * Toggle filter effects visibility
     * Disabled during character/stage selection, enabled during gameplay
     */
    private updateFilterVisibility(enabled: boolean): void {
        if (this.wobbleFilter) {
            // Disable wobble effects during selection
            this.wobbleFilter.wobbleIntensity = enabled ? this.baseWobbleIntensity : 0
        }
    }

    private updateDebugText(): void {
        if (!this.debugEnabled) return

        // Create DOM overlay if not exists
        if (!this.debugDomElement) {
            this.createDebugDomOverlay()
        }

        // Access private screenContainer via any cast for debugging
        const getScreenInfo = (
            screen: unknown
        ): { visible: boolean; children: number; hasParent: boolean } => {
            try {
                const s = screen as {
                    screenContainer?: { visible?: boolean; children?: unknown[]; parent?: unknown }
                }
                return {
                    visible: s.screenContainer?.visible ?? false,
                    children: s.screenContainer?.children?.length ?? 0,
                    hasParent: !!s.screenContainer?.parent,
                }
            } catch {
                return { visible: false, children: 0, hasParent: false }
            }
        }

        const charInfo = getScreenInfo(this.characterSelectScreen)
        const stageInfo = getScreenInfo(this.stageSelectScreen)
        const openingInfo = getScreenInfo(this.openingScreen)
        const pauseInfo = getScreenInfo(this.pauseScreen)
        const resultInfo = getScreenInfo(this.resultScreen)
        const skillInfo = getScreenInfo(this.skillSelectionScreen)

        const lines = [
            `<b style="color:#ff0">=== DEBUG S${this.debugSessionId} ===</b>`,
            `<b style="color:#f00">Instance #${this.instanceId} (total: ${PhysicsSurvivorScene.instanceCounter})</b>`,
            `<span style="color:#0ff">gameState:</span> <b>${this.gameState}</b>`,
            `<span style="color:#0ff">isPlaying:</span> ${this.isPlaying}`,
            `<span style="color:#0ff">isDestroyed:</span> ${this.isDestroyed}`,
            `<span style="color:#0ff">gameTime:</span> ${this.gameTime.toFixed(1)}s`,
            `<span style="color:#888">--- Screens (v/c/p) ---</span>`,
            `charSelect: ${charInfo.visible}/${charInfo.children}/${charInfo.hasParent}`,
            `stageSelect: ${stageInfo.visible}/${stageInfo.children}/${stageInfo.hasParent}`,
            `opening: ${openingInfo.visible}/${openingInfo.children}/${openingInfo.hasParent}`,
            `pause: ${pauseInfo.visible}/${pauseInfo.children}/${pauseInfo.hasParent}`,
            `result: ${resultInfo.visible}/${resultInfo.children}/${resultInfo.hasParent}`,
            `skillSelect: ${skillInfo.visible}/${skillInfo.children}/${skillInfo.hasParent}`,
            `<span style="color:#888">--- History ---</span>`,
            ...this.debugStateHistory.slice(-5).map((h) => `<span style="color:#aaa">${h}</span>`),
        ]

        if (this.debugDomElement) {
            this.debugDomElement.innerHTML = lines.join('<br>')
        }
    }
}
