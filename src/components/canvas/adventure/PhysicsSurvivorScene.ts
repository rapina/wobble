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
import { CRTFilter } from '../filters/CRTFilter'
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
    EnemySystem,
    ProjectileSystem,
    BackgroundSystem,
    ExperienceOrbSystem,
    BlackHoleSystem,
    GravityWellSystem,
    RepulsionBarrierSystem,
    CrusherSystem,
    EffectsManager,
    ComboSystem,
    HudSystem,
    SkillSelectionScreen,
    ResultScreen,
    CharacterSelectScreen,
    OpeningScreen,
    PauseScreen,
    StageSelectScreen,
    STAGES,
    getDefaultStage,
    getStageById,
    type StageConfig,
    type BlackHoleInfo,
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
    private maxPlayerHealth = 100
    private gameState: GameState = 'character-select'
    private bossSpawned = false

    // Experience & Level system
    private playerProgress: PlayerProgress = { xp: 0, level: 1, pendingLevelUps: 0 }

    // Skill system
    private playerSkills: PlayerSkill[] = []
    private passiveTrait: string = ''
    private studiedFormulas: Set<string> = new Set()

    // Shockwave skill timer
    private shockwaveTimer = 0

    // New skill timers and state
    private pendulumPhase = 0 // Current phase of pendulum rhythm (radians)
    private pendulumDamageMultiplier = 1 // Current damage multiplier from pendulum rhythm
    private slashAngle = 0 // Current rotation of torque slash
    private slashHitCooldowns: Map<number, number> = new Map() // Enemy ID -> cooldown

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

    // CRT Filter
    declare private crtFilter: CRTFilter
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
    private playerX = 0
    private playerY = 0
    private playerVx = 0
    private playerVy = 0

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
    declare private blackHoleSystem: BlackHoleSystem
    declare private gravityWellSystem: GravityWellSystem
    declare private repulsionBarrierSystem: RepulsionBarrierSystem
    declare private crusherSystem: CrusherSystem
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

    // Fire system - faster baseline for power fantasy (was 0.5)
    private fireRate = 0.35
    private fireTimer = 0

    // Enemy spawn
    private spawnRate = 1.0 // Faster initial spawn (was 2)
    private spawnTimer = 0

    // Animation
    private animPhase = 0

    // Virtual joystick
    declare private joystick: VirtualJoystick

    // Background container (world-space, inside gameContainer)
    declare private bgContainer: Container

    // Camera shake system
    private shakeIntensity = 0
    private shakeDuration = 0
    private readonly shakeDecay = 0.9

    // Hit effects (shared with systems)
    private hitEffects: HitEffect[] = []

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
        // Game container (holds all world-space elements including background)
        this.gameContainer = new Container()
        this.gameContainer.scale.set(0.75) // Zoom out to show more of the battlefield
        this.container.addChild(this.gameContainer)

        // Background container - inside gameContainer (world-space)
        this.bgContainer = new Container()
        this.gameContainer.addChild(this.bgContainer)

        this.enemyContainer = new Container()
        this.gameContainer.addChild(this.enemyContainer)

        this.projectileContainer = new Container()
        this.gameContainer.addChild(this.projectileContainer)

        this.effectContainer = new Container()
        this.gameContainer.addChild(this.effectContainer)

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

        // CRT Filter
        this.crtFilter = CRTFilter.subtle()
        this.crtFilter.setDimensions(this.width, this.height)

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
        this.gridFilter.setGravityOffset(-0.42, -0.65)
        this.bgContainer.filters = [this.gridFilter] // Apply grid to background only

        this.container.filters = [this.wobbleFilter, this.crtFilter]

        // Initialize core systems
        this.backgroundSystem = new BackgroundSystem({
            worldContainer: this.bgContainer,
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

        this.damageTextSystem = new FloatingDamageText(this.effectContainer, {
            poolSize: 30,
        })

        this.impactSystem = new ImpactEffectSystem(this.container, this.width, this.height, {
            particlePoolSize: 100,
        })
        this.impactSystem.onShake = (intensity, duration) => {
            this.triggerShake(intensity, duration)
        }

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

        // World entity systems for each stage
        this.blackHoleSystem = new BlackHoleSystem({
            container: this.effectContainer,
            width: this.width,
            height: this.height,
        })

        this.gravityWellSystem = new GravityWellSystem({
            container: this.effectContainer,
            width: this.width,
            height: this.height,
        })

        this.repulsionBarrierSystem = new RepulsionBarrierSystem({
            container: this.effectContainer,
            width: this.width,
            height: this.height,
        })

        this.crusherSystem = new CrusherSystem({
            container: this.effectContainer,
            width: this.width,
            height: this.height,
        })

        this.effectsManager = new EffectsManager({
            effectContainer: this.effectContainer,
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
        this.skillSelectionScreen.onSkillSelected = (skill, newLevel) => {
            this.handleSkillUpgrade(skill, newLevel)
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
        this.characterSelectScreen.onSelectCharacter = (character, selectedSkills) => {
            this.debugLog(
                `characterSelectScreen.onSelectCharacter: ${character}, skills: ${selectedSkills.join(', ')}`
            )
            this.showStageSelect(character, selectedSkills)
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
            this.startWithStage(this.selectedCharacter, stageId, this.playerSelectedSkills)
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
        if (this.crtFilter) {
            this.crtFilter.setDimensions(this.width, this.height)
        }
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

        // Initialize camera position
        this.gameContainer.pivot.set(this.cameraX, this.cameraY)
        this.gameContainer.position.set(this.centerX, this.centerY)
        // Note: joystick is now initialized in setup() to ensure it's available for onReset()
    }

    private onXpCollected(xp: number): void {
        const oldLevel = this.playerProgress.level
        this.playerProgress.xp += xp

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

    private handleSkillUpgrade(skill: PlayerSkill, newLevel: number): void {
        const playerSkill = this.playerSkills.find((s) => s.skillId === skill.skillId)
        if (playerSkill) {
            const def = getSkillDefinition(playerSkill.skillId)
            if (def && playerSkill.level < def.maxLevel) {
                playerSkill.level = newLevel

                this.damageTextSystem.spawnCustom(
                    this.width / 2,
                    this.height / 2 - 50,
                    `${t(def.name, 'ko')} Lv.${playerSkill.level}!`,
                    'combo'
                )
            }
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
            this.triggerShake(12, 0.25)
            this.impactSystem.triggerSlowMotion(0.3, 0.2)
            this.damageTextSystem.spawnCustom(this.playerX, this.playerY - 70, name, 'critical')
        } else if (killCount >= 3) {
            // Good multi-kill (3-4)
            this.triggerShake(6, 0.15)
            this.damageTextSystem.spawnCustom(this.playerX, this.playerY - 70, name, 'combo')
        } else {
            // Double kill
            this.triggerShake(3, 0.1)
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
        this.stats.tunnelChance = skillStats.tunnelChance
        this.stats.tunnelDamageBonus = skillStats.tunnelDamageBonus
        this.stats.rhythmPeriod = skillStats.rhythmPeriod
        this.stats.peakDamageBonus = skillStats.peakDamageBonus
        this.stats.slashRadius = skillStats.slashRadius
        this.stats.slashDamage = skillStats.slashDamage
        this.stats.slashSpeed = skillStats.slashSpeed
        this.stats.warpRadius = skillStats.warpRadius
        this.stats.slowFactor = skillStats.slowFactor

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
        this.hudSystem.update({
            health: this.playerHealth,
            maxHealth: this.maxPlayerHealth,
            progress: this.playerProgress,
            gameTime: this.gameTime,
            skills: this.playerSkills,
        })

        // Update combo display
        this.hudSystem.updateCombo(this.comboSystem.getState(), this.comboSystem.getComboWindow())
    }

    private fireProjectile(): void {
        // Apply pendulum rhythm damage multiplier
        const effectiveStats = {
            ...this.stats,
            damageMultiplier: this.stats.damageMultiplier * this.pendulumDamageMultiplier,
        }
        this.projectileSystem.fire(
            this.playerX,
            this.playerY,
            this.enemySystem.enemies,
            effectiveStats
        )
    }

    private updateProjectiles(delta: number): void {
        this.projectileSystem.update(
            delta,
            this.enemySystem.enemies,
            this.stats,
            this.cameraX,
            this.cameraY
        )

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
                        this.impactSystem.addScalePunch(
                            enemy.wobble,
                            isCritical ? 0.4 : 0.25,
                            isCritical ? 0.2 : 0.12
                        )
                        break
                    }
                }
            }
        )
    }

    private updateEnemiesAndMerges(delta: number, deltaSeconds: number): void {
        this.enemySystem.update(delta, this.playerX, this.playerY, this.animPhase)

        // Apply gravity well pull to enemies (they get sucked in too!)
        if (this.gravityWellSystem.getIsActive()) {
            for (const enemy of this.enemySystem.enemies) {
                const pull = this.gravityWellSystem.applyGravityPull(
                    enemy.x,
                    enemy.y,
                    enemy.vx,
                    enemy.vy,
                    deltaSeconds
                )
                enemy.vx = pull.vx
                enemy.vy = pull.vy
            }
        }

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
        }

        this.score += this.enemySystem.cleanupDead()
    }

    private spawnEnemy(): void {
        this.enemySystem.spawnAtEdge(this.gameTime, this.playerX, this.playerY)
    }

    private checkPlayerCollisions(): void {
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            const minDist = 25 + enemy.size / 2

            if (dist < minDist) {
                this.playerHealth -= 1

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
     * Update CRT filter distortion based on black hole proximity
     */
    private updateBlackHoleDistortion(): void {
        if (!this.crtFilter) return

        const intensity = this.blackHoleProximityEffect

        // Increase chromatic aberration (RGB split) - creates "being pulled apart" feel
        this.crtFilter.chromaticAberration = this.baseChromaticAberration + intensity * 2.5

        // Increase curvature (barrel distortion) - screen warping
        this.crtFilter.curvatureStrength = this.baseCurvatureStrength + intensity * 0.08

        // Increase vignette (tunnel vision) - darkness closing in
        this.crtFilter.vignetteStrength = this.baseVignetteStrength + intensity * 0.6

        // Increase flicker - instability
        this.crtFilter.flickerIntensity = this.baseFlickerIntensity + intensity * 0.03
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

        // === BLACK HOLE (Vortex Stage) ===
        if (this.blackHoleSystem.getIsActive()) {
            const bhPos = this.blackHoleSystem.getPosition()
            // World position
            gravitySources.push({
                x: bhPos.x,
                y: bhPos.y,
                mass: 0.8, // Strong gravity for black hole
            })
        }

        // === GRAVITY WELLS (Gravity Stage) ===
        if (this.gravityWellSystem.getIsActive()) {
            const wells = this.gravityWellSystem.getWells()
            for (const well of wells.slice(0, 2)) {
                // World position
                gravitySources.push({
                    x: well.x,
                    y: well.y,
                    mass: 0.5, // Medium gravity for wells
                })
            }
        }

        this.gridFilter.setGravitySources(gravitySources)
    }

    /**
     * Update all world entity systems and apply their effects
     */
    private updateWorldEntities(deltaSeconds: number): void {
        // Track total proximity effect for visual feedback
        let totalProximityEffect = 0

        // === BLACK HOLE (Vortex Stage) ===
        if (this.blackHoleSystem.getIsActive()) {
            this.blackHoleSystem.update(deltaSeconds, this.playerX, this.playerY)

            // Update physics vortex center to follow black hole
            const bhPos = this.blackHoleSystem.getPositionRatio()
            if (this.currentStage.physics.vortexCenter) {
                this.currentStage.physics.vortexCenter.x = bhPos.x
                this.currentStage.physics.vortexCenter.y = bhPos.y
            }

            // Check player proximity and apply damage
            const bhProximity = this.blackHoleSystem.getPlayerProximityEffect(
                this.playerX,
                this.playerY
            )
            if (bhProximity > 0) {
                const damage =
                    this.blackHoleSystem.getDamagePerSecond() * bhProximity * deltaSeconds
                this.takeDamage(damage)
            }
            totalProximityEffect = Math.max(totalProximityEffect, bhProximity)
        }

        // === GRAVITY WELLS (Low-Gravity Stage) ===
        if (this.gravityWellSystem.getIsActive()) {
            this.gravityWellSystem.update(deltaSeconds, this.playerX, this.playerY)

            // Apply gentle drift to player (can escape, but pulled slightly)
            const drift = this.gravityWellSystem.applyPlayerDrift(
                this.playerX,
                this.playerY,
                deltaSeconds
            )
            this.externalVx += drift.dvx
            this.externalVy += drift.dvy

            // Check player proximity for visual effect
            const gwProximity = this.gravityWellSystem.getPlayerProximityEffect(
                this.playerX,
                this.playerY
            )
            totalProximityEffect = Math.max(totalProximityEffect, gwProximity)
        }

        // === REPULSION BARRIERS (Elastic Stage) ===
        if (this.repulsionBarrierSystem.getIsActive()) {
            this.repulsionBarrierSystem.update(deltaSeconds, this.playerX, this.playerY)

            // Check player collision with barriers (use combined velocity for collision detection)
            const totalVx = this.playerVx + this.externalVx
            const totalVy = this.playerVy + this.externalVy
            const barrierCollision = this.repulsionBarrierSystem.checkCollision(
                this.playerX,
                this.playerY,
                totalVx,
                totalVy,
                25 // Player radius
            )
            if (barrierCollision && barrierCollision.bounced) {
                // Player is blocked but NOT bounced - just stop movement in that direction
                this.externalVx = 0
                this.externalVy = 0
                this.triggerShake(3, 0.1)
            }

            // Check projectile collisions with barriers
            this.projectileSystem.checkBarrierCollisions((x, y, vx, vy, radius) =>
                this.repulsionBarrierSystem.checkCollision(x, y, vx, vy, radius)
            )

            // Check player proximity for visual effect
            const rbProximity = this.repulsionBarrierSystem.getPlayerProximityEffect(
                this.playerX,
                this.playerY
            )
            totalProximityEffect = Math.max(totalProximityEffect, rbProximity)
        }

        // === CRUSHERS (Momentum Stage) ===
        if (this.crusherSystem.getIsActive()) {
            this.crusherSystem.update(deltaSeconds, this.playerX, this.playerY)

            // Check player collision with crushers
            const crusherCollision = this.crusherSystem.checkCollision(
                this.playerX,
                this.playerY,
                25
            )
            if (crusherCollision) {
                // Apply push to external velocity
                this.externalVx += crusherCollision.pushVx
                this.externalVy += crusherCollision.pushVy
                // Apply damage
                this.takeDamage(crusherCollision.damage * deltaSeconds)
                this.triggerShake(5, 0.15)
            }

            // Check player proximity for visual effect
            const crProximity = this.crusherSystem.getPlayerProximityEffect(
                this.playerX,
                this.playerY
            )
            totalProximityEffect = Math.max(totalProximityEffect, crProximity)
        }

        // Update visual distortion based on proximity to any world entity
        this.blackHoleProximityEffect = totalProximityEffect
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
                    this.impactSystem.addScalePunch(enemy.wobble, 0.35, 0.15)
                }
            }
        }

        // Auto-remove explosion effect
        setTimeout(() => {
            this.effectContainer.removeChild(explosion)
            explosion.destroy()
        }, 200)
    }

    private triggerShake(intensity: number, duration: number): void {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity)
        this.shakeDuration = Math.max(this.shakeDuration, duration)
    }

    private updateShake(delta: number): void {
        if (this.shakeDuration > 0) {
            const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2
            const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2

            // Apply shake offset relative to camera center position
            this.gameContainer.position.set(this.centerX + offsetX, this.centerY + offsetY)

            this.shakeIntensity *= this.shakeDecay
            this.shakeDuration -= delta / 60

            if (this.shakeDuration <= 0) {
                this.gameContainer.position.set(this.centerX, this.centerY)
                this.shakeIntensity = 0
                this.shakeDuration = 0
            }
        }
    }

    private updateHitEffects(delta: number): void {
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i]
            effect.timer -= delta / 60
            effect.graphics.alpha = effect.timer / 0.2
            effect.graphics.scale.set(1 + (0.2 - effect.timer) * 3)

            if (effect.timer <= 0) {
                this.effectContainer.removeChild(effect.graphics)
                // Don't call destroy() during render cycle - let GC handle it
                this.hitEffects.splice(i, 1)
            }
        }
    }

    /**
     * Update shockwave skill (원심력 펄스)
     */
    private updateShockwave(deltaSeconds: number): void {
        // Check if shockwave skill is active
        if (this.stats.shockwaveInterval <= 0) return

        this.shockwaveTimer += deltaSeconds

        if (this.shockwaveTimer >= this.stats.shockwaveInterval) {
            this.shockwaveTimer = 0
            this.triggerShockwave()
        }
    }

    /**
     * Trigger shockwave effect - pushes enemies away from player
     */
    private triggerShockwave(): void {
        const radius = this.stats.shockwaveRadius
        const knockback = this.stats.shockwaveKnockback

        // Visual effect - expanding ring
        const ring = new Graphics()
        ring.circle(0, 0, 10)
        ring.stroke({ color: 0x2ecc71, width: 4, alpha: 0.8 })
        ring.position.set(this.playerX, this.playerY)
        this.effectContainer.addChild(ring)

        // Animate ring expansion
        let ringRadius = 10
        const expandSpeed = radius * 4 // Expand to full radius in 0.25 seconds
        const ringUpdate = () => {
            ringRadius += expandSpeed / 60
            const progress = ringRadius / radius

            if (progress >= 1) {
                this.effectContainer.removeChild(ring)
                ring.destroy()
                return
            }

            ring.clear()
            ring.circle(0, 0, ringRadius)
            ring.stroke({
                color: 0x2ecc71,
                width: 4 * (1 - progress),
                alpha: 0.8 * (1 - progress),
            })

            requestAnimationFrame(ringUpdate)
        }
        requestAnimationFrame(ringUpdate)

        // Apply knockback to enemies within radius
        let hitCount = 0
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < radius && dist > 0) {
                // Knockback force decreases with distance
                const distFactor = 1 - dist / radius
                const force = (knockback * distFactor) / Math.sqrt(enemy.mass)

                // Push away from player
                const nx = dx / dist
                const ny = dy / dist
                enemy.vx += nx * force * 0.1
                enemy.vy += ny * force * 0.1

                // Small damage
                const damage = 5 * distFactor * this.stats.damageMultiplier
                enemy.health -= damage
                hitCount++

                // Visual feedback
                if (enemy.wobble) {
                    this.impactSystem.addScalePunch(enemy.wobble, 0.2, 0.1)
                }
            }
        }

        // Screen shake based on hit count
        if (hitCount > 0) {
            this.triggerShake(3 + hitCount * 0.5, 0.15)
            this.damageTextSystem.spawnCustom(this.playerX, this.playerY - 40, `PULSE!`, 'combo')
        }
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
            }
        }
    }

    /**
     * Time Warp - slow enemies within radius
     */
    private updateTimeWarp(deltaSeconds: number): void {
        if (this.stats.warpRadius <= 0) return

        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX
            const dy = enemy.y - this.playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < this.stats.warpRadius) {
                // Slow enemy speed
                const slowAmount = this.stats.slowFactor
                enemy.speed = enemy.speed * (1 - slowAmount * deltaSeconds * 2)
                // Minimum speed floor
                const baseSpeed = 1.0
                if (enemy.speed < baseSpeed * 0.3) {
                    enemy.speed = baseSpeed * 0.3
                }
            }
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
                enemy.health -= this.stats.slashDamage * this.stats.damageMultiplier
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

    private updatePlayer(delta: number): void {
        const input = this.joystick.getInput()
        let speed = this.playerBaseSpeed * this.stats.moveSpeedMultiplier

        // Apply gravity well slowdown (player can escape but moves slower)
        if (this.gravityWellSystem.getIsActive()) {
            const gravitySpeedMult = this.gravityWellSystem.getPlayerSpeedMultiplier(
                this.playerX,
                this.playerY
            )
            speed *= gravitySpeedMult
        }

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

        // Offset world entity systems (stage gimmicks)
        this.blackHoleSystem.offsetPositions(offsetX, offsetY)
        this.gravityWellSystem.offsetPositions(offsetX, offsetY)
        this.repulsionBarrierSystem.offsetPositions(offsetX, offsetY)
        this.crusherSystem.offsetPositions(offsetX, offsetY)

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
        this.triggerShake(15, 0.5)

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
        this.triggerShake(10, 0.3)

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
        })
    }

    // Player-selected skills from character select screen
    private playerSelectedSkills: string[] = []

    private showStageSelect(character: WobbleShape, selectedSkills: string[]): void {
        this.debugLog(`showStageSelect: ${character}, skills: ${selectedSkills.length}`)
        this.selectedCharacter = character
        this.playerSelectedSkills = selectedSkills
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

    private startWithStage(
        character: WobbleShape,
        stageId: string,
        selectedSkills: string[] = []
    ): void {
        this.debugLog(
            `startWithStage: ${character}, stage: ${stageId}, skills: ${selectedSkills.length}`
        )
        this.selectedCharacter = character
        this.currentStage = getStageById(stageId) || getDefaultStage()
        this.playerSelectedSkills = selectedSkills
        this.stageSelectScreen.hide()
        this.showOpening(this.selectedCharacter)
    }

    private applyStagePhysics(): void {
        // Apply physics modifiers to all systems
        this.enemySystem.setPhysicsModifiers(this.currentStage.physics)
        this.projectileSystem.setPhysicsModifiers(this.currentStage.physics)

        // Update background theme
        this.backgroundSystem.setTheme(this.currentStage.bgColor)

        // Deactivate all world entities first
        this.blackHoleSystem.deactivate()
        this.gravityWellSystem.deactivate()
        this.repulsionBarrierSystem.deactivate()
        this.crusherSystem.deactivate()

        // Activate the appropriate world entity for this stage
        switch (this.currentStage.id) {
            case 'vortex':
                this.blackHoleSystem.activate(this.playerX, this.playerY)
                break
            case 'low-gravity':
                this.gravityWellSystem.activate(this.playerX, this.playerY)
                break
            case 'elastic':
                this.repulsionBarrierSystem.activate(this.playerX, this.playerY)
                break
            case 'momentum':
                this.crusherSystem.activate(this.playerX, this.playerY)
                break
        }

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

        const charData = WOBBLE_CHARACTERS[this.selectedCharacter]
        this.player.updateOptions({
            shape: this.selectedCharacter,
            color: charData.color,
            expression: 'happy',
        })
        this.player.visible = true

        this.gameTime = 0
        this.score = 0
        this.playerProgress = { xp: 0, level: 1, pendingLevelUps: 0 }
        this.setGameState('playing', 'startGameAfterOpening')
        this.updateHUD()
    }

    private initializeCharacterSkills(): void {
        const config = getCharacterSkillConfig(this.selectedCharacter)

        // Use player-selected skills from character select screen
        this.playerSkills = this.playerSelectedSkills.map((skillId) => ({
            skillId,
            level: 1,
        }))

        // Character provides passive only
        this.passiveTrait = config.passive
        this.momentumSpeedBonus = 0
        this.consecutiveHits = 0
        this.shockwaveTimer = 0
        this.pendulumPhase = 0
        this.pendulumDamageMultiplier = 1
        this.slashAngle = 0
        this.slashHitCooldowns.clear()
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

        if (this.crtFilter) {
            this.crtFilter.time = this.animPhase
        }
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
            this.updateShake(delta)
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
            if (this.crtFilter) this.crtFilter.time = this.animPhase
            if (this.wobbleFilter) {
                this.wobbleFilter.time = this.animPhase
                this.wobbleFilter.setCameraPosition(this.cameraX, this.cameraY)
            }
            if (this.gridFilter) {
                this.gridFilter.time = this.animPhase
                this.gridFilter.setCameraPosition(this.cameraX, this.cameraY)
            }

            this.backgroundSystem.update(
                rawDeltaSeconds * 60,
                this.playerSkills.length,
                this.gameTime,
                this.cameraX,
                this.cameraY
            )
            this.damageTextSystem.update(rawDeltaSeconds)
            this.updateShake(rawDeltaSeconds * 60)

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
        if (this.crtFilter) this.crtFilter.time = this.animPhase
        if (this.wobbleFilter) {
            this.wobbleFilter.time = this.animPhase
            this.wobbleFilter.setCameraPosition(this.cameraX, this.cameraY)
        }
        if (this.gridFilter) {
            this.gridFilter.time = this.animPhase
            this.gridFilter.setCameraPosition(this.cameraX, this.cameraY)
            // Player position in world coordinates (filter is on bgContainer which uses world coords)
            this.gridFilter.setPlayerPosition(this.playerX, this.playerY)
            this.updateGridGravitySources()
        }

        this.backgroundSystem.update(
            delta,
            this.playerSkills.length,
            this.gameTime,
            this.cameraX,
            this.cameraY
        )

        // Update world entities and their effects
        this.updateWorldEntities(deltaSeconds)

        // Update XP orbs (with black hole info if active)
        if (this.blackHoleSystem.getIsActive()) {
            const bhAbsPos = this.blackHoleSystem.getPosition()
            const blackHoleInfo: BlackHoleInfo = {
                x: bhAbsPos.x,
                y: bhAbsPos.y,
                pullRadius: this.blackHoleSystem.getPullRadius(),
                consumeRadius: this.blackHoleSystem.getConsumeRadius(),
            }
            this.xpOrbSystem.update(deltaSeconds, this.playerX, this.playerY, blackHoleInfo)
        } else {
            this.xpOrbSystem.update(deltaSeconds, this.playerX, this.playerY)
        }

        this.fireTimer += deltaSeconds
        const effectiveFireRate = this.fireRate * this.stats.fireRateMultiplier
        if (this.fireTimer >= effectiveFireRate && this.enemySystem.enemies.length > 0) {
            this.fireProjectile()
            this.fireTimer = 0
        }

        this.spawnTimer += deltaSeconds
        // Slower spawn rate scaling for power fantasy (was /60, min 0.5)
        // Spawn rate: starts at 1.0s, decreases to 0.3s over 3 minutes
        const currentSpawnRate = Math.max(0.3, this.spawnRate - this.gameTime / 200)
        if (this.spawnTimer >= currentSpawnRate) {
            this.spawnEnemy()
            this.spawnTimer = 0
        }

        // Victory condition check
        if (this.gameTime >= GAME_DURATION_SECONDS) {
            this.triggerVictory()
            return
        }

        // Boss spawn at 2:30
        if (this.gameTime >= BOSS_SPAWN_TIME && !this.bossSpawned) {
            this.spawnFinalBoss()
        }

        this.updatePlayer(delta)
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

        this.effectsManager.update(delta)
        // PhysicsSkillVisuals disabled due to PixiJS Batcher conflicts
        // this.physicsSkillVisuals.update(delta)
        this.updateHitEffects(delta)
        this.damageTextSystem.update(deltaSeconds)
        this.comboSystem.update(deltaSeconds)
        this.updateShake(delta)

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
            blackHoleSystem: !!this.blackHoleSystem,
            gravityWellSystem: !!this.gravityWellSystem,
            repulsionBarrierSystem: !!this.repulsionBarrierSystem,
            crusherSystem: !!this.crusherSystem,
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
        // Reset all world entity systems
        this.blackHoleSystem.reset()
        this.gravityWellSystem.reset()
        this.repulsionBarrierSystem.reset()
        this.crusherSystem.reset()
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

        // Reset hit effects
        // Don't call destroy() synchronously as it can corrupt PixiJS v8's shared Batcher
        for (const effect of this.hitEffects) {
            this.effectContainer.removeChild(effect.graphics)
        }
        this.hitEffects = []

        // Reset camera shake
        this.shakeIntensity = 0
        this.shakeDuration = 0
        this.gameContainer.position.set(this.centerX, this.centerY)

        // Reset state
        this.gameTime = 0
        this.score = 0
        this.playerProgress = { xp: 0, level: 1, pendingLevelUps: 0 }
        this.maxPlayerHealth = this.baseMaxHealth
        this.playerHealth = this.maxPlayerHealth
        this.setGameState('character-select', 'onReset')
        this.bossSpawned = false
        this.playerSkills = []
        this.playerSelectedSkills = []
        this.passiveTrait = ''
        this.momentumSpeedBonus = 0
        this.consecutiveHits = 0
        this.shockwaveTimer = 0
        this.pendulumPhase = 0
        this.pendulumDamageMultiplier = 1
        this.slashAngle = 0
        this.slashHitCooldowns.clear()
        this.resetStats()
        this.fireTimer = 0
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
        if (this.crtFilter) {
            // Disable scanlines, chromatic aberration, etc. during selection
            if (enabled) {
                this.crtFilter.scanlineIntensity = 0.015 // subtle preset value
                this.crtFilter.chromaticAberration = this.baseChromaticAberration
            } else {
                this.crtFilter.scanlineIntensity = 0
                this.crtFilter.chromaticAberration = 0
            }
        }

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
