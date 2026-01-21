/**
 * StageGenerator.ts - Seeded stage generation for Wobblediver
 *
 * Generates deterministic stage configurations based on game seed and depth.
 * Uses probability-based dice rolls for each difficulty factor independently.
 * Deeper = higher probability of each factor activating.
 */

import { SeededRandom } from '@/utils/SeededRandom'
import {
    StageConfig,
    AnchorPersonality,
    AnchorPersonalityConfig,
    ANCHOR_PERSONALITIES,
    WallTentacleConfig,
    PortalPairStageConfig,
    AbyssTentacleConfig,
    PortalOrientation,
    DIFFICULTY_CURVES,
    ActivatedFactors,
    getFactorProbability,
    getPersonalityWeights,
} from './StageConfig'

/**
 * Tracks which features have appeared at least once this game
 * Used to determine "first time" hints
 */
interface GameHistory {
    hasSeenAbyssTentacle: boolean
    hasSeenPortal: boolean
    hasSeenWallTentacle: boolean
    hasSeenTrajectoryTimed: boolean
    hasSeenTrajectoryFlicker: boolean
    hasSeenWaterRise: boolean
    hasSeenWormholeShrink: boolean
}

/**
 * Stage generator that creates deterministic stage configurations
 * using probability-based dice rolls for each difficulty factor
 */
export class StageGenerator {
    private gameSeed: number
    private gameHistory: GameHistory

    constructor(gameSeed?: number) {
        this.gameSeed = gameSeed ?? SeededRandom.generateSeed()
        this.gameHistory = this.createFreshHistory()
    }

    /**
     * Create fresh game history (no features seen yet)
     */
    private createFreshHistory(): GameHistory {
        return {
            hasSeenAbyssTentacle: false,
            hasSeenPortal: false,
            hasSeenWallTentacle: false,
            hasSeenTrajectoryTimed: false,
            hasSeenTrajectoryFlicker: false,
            hasSeenWaterRise: false,
            hasSeenWormholeShrink: false,
        }
    }

    /**
     * Get the current game seed
     */
    getSeed(): number {
        return this.gameSeed
    }

    /**
     * Set a new game seed (for new games)
     */
    setSeed(seed: number): void {
        this.gameSeed = seed
        this.gameHistory = this.createFreshHistory()
    }

    /**
     * Generate a new random seed (for new games)
     */
    newGame(): number {
        this.gameSeed = SeededRandom.generateSeed()
        this.gameHistory = this.createFreshHistory()
        return this.gameSeed
    }

    /**
     * Reset game history (for restarting without changing seed)
     */
    resetHistory(): void {
        this.gameHistory = this.createFreshHistory()
    }

    /**
     * Generate stage configuration for a given depth
     * Each difficulty factor is rolled independently based on its probability curve
     */
    generate(depth: number, width: number, height: number): StageConfig {
        // Create seeded RNG for this specific stage
        const stageSeed = SeededRandom.createStageSeed(this.gameSeed, depth)
        const rng = new SeededRandom(stageSeed)

        // Calculate boundary values
        const boundaryTop = 0
        const boundaryBottom = height - 60 // Space for ad banner
        const abyssTop = boundaryBottom - 80 // Water surface level

        // Roll dice for each difficulty factor
        const activatedFactors = this.rollDifficultyFactors(rng, depth)

        // Update game history and mark first-time appearances
        this.updateHistory(activatedFactors)

        // Generate anchor personality based on depth-scaled weights
        const personalityWeights = getPersonalityWeights(depth)
        const anchorPersonality = this.generateAnchorPersonality(rng, personalityWeights)

        // Generate wormhole (starts at full size, may shrink during gameplay)
        const wormhole = this.generateWormhole(rng, depth, width, abyssTop)

        // Generate obstacles based on activated counts
        const wallTentacles = this.generateWallTentacles(
            rng,
            activatedFactors.wallTentacleCount,
            width,
            boundaryTop,
            abyssTop,
            wormhole
        )

        const portalPairs = this.generatePortalPairs(
            rng,
            activatedFactors.portalPairCount,
            width,
            boundaryTop,
            abyssTop
        )

        const abyssTentacles = this.generateAbyssTentacles(
            rng,
            activatedFactors.abyssTentacleCount,
            width,
            wormhole.x
        )

        // Determine trajectory mode based on activated factors
        const trajectoryMode = activatedFactors.trajectoryFlickerActivated
            ? 'flicker'
            : activatedFactors.trajectoryTimedActivated
              ? 'timed'
              : 'always'
        const trajectorySettings = this.getTrajectorySettings(trajectoryMode, depth)

        return {
            depth,
            seed: stageSeed,
            wormhole,
            anchorPersonality,
            ropeLength: {
                min: this.getRopeLengthMin(depth),
                max: this.getRopeLengthMax(depth),
            },
            startAngle: {
                min: Math.PI / 6,
                max: Math.PI / 6 + Math.PI / 4,
            },
            wallTentacles,
            portalPairs,
            abyssTentacles,
            waterLevelRise: activatedFactors.waterLevelRiseAmount,
            wormholeShrinkRate: activatedFactors.wormholeShrinkRate,
            wormholeMinWidthScale: activatedFactors.wormholeMinWidthScale,
            activatedFactors,
            ...trajectorySettings,
        }
    }

    /**
     * Roll dice for each difficulty factor independently
     * Returns which factors were activated and their values
     */
    private rollDifficultyFactors(rng: SeededRandom, depth: number): ActivatedFactors {
        const curves = DIFFICULTY_CURVES

        // Roll for abyss tentacles (can stack up to 4)
        let abyssTentacleCount = 0
        if (rng.chance(getFactorProbability(curves.abyssTentacle, depth))) {
            abyssTentacleCount = 1
            // Roll for additional tentacles
            for (let i = 0; i < 3; i++) {
                if (rng.chance(getFactorProbability(curves.extraAbyssTentacle, depth))) {
                    abyssTentacleCount++
                }
            }
        }

        // Roll for portal pairs (can stack up to 2)
        let portalPairCount = 0
        if (rng.chance(getFactorProbability(curves.portalPair, depth))) {
            portalPairCount = 1
            if (rng.chance(getFactorProbability(curves.extraPortalPair, depth))) {
                portalPairCount = 2
            }
        }

        // Roll for wall tentacles (can stack up to 3)
        let wallTentacleCount = 0
        if (rng.chance(getFactorProbability(curves.wallTentacle, depth))) {
            wallTentacleCount = 1
            // Roll for additional wall tentacles
            for (let i = 0; i < 2; i++) {
                if (rng.chance(getFactorProbability(curves.extraWallTentacle, depth))) {
                    wallTentacleCount++
                }
            }
        }

        // Roll for trajectory reduction
        const trajectoryTimedActivated = rng.chance(
            getFactorProbability(curves.trajectoryTimed, depth)
        )
        // Flicker only possible if timed is already on
        const trajectoryFlickerActivated =
            trajectoryTimedActivated &&
            rng.chance(getFactorProbability(curves.trajectoryFlicker, depth))

        // Roll for water level rise (stacks for intensity)
        let waterLevelRiseAmount = 0
        if (rng.chance(getFactorProbability(curves.waterLevelRise, depth))) {
            waterLevelRiseAmount = 0.3
            // Roll for extra water rise
            for (let i = 0; i < 3; i++) {
                if (rng.chance(getFactorProbability(curves.extraWaterRise, depth))) {
                    waterLevelRiseAmount += 0.2
                }
            }
            waterLevelRiseAmount = Math.min(1.0, waterLevelRiseAmount)
        }

        // Roll for wormhole shrink (gradual shrinking during stage)
        let wormholeShrinkActivated = false
        let wormholeShrinkRate = 0
        let wormholeMinWidthScale = 2.5 // Default: no shrinking, stays at max
        if (rng.chance(getFactorProbability(curves.wormholeShrink, depth))) {
            wormholeShrinkActivated = true
            // Shrink rate increases with depth (widthScale reduction per second)
            // At depth 2: 0.05/sec, at depth 10: 0.15/sec
            wormholeShrinkRate = 0.04 + depth * 0.01
            // Minimum scale decreases with depth
            // At depth 2: 2.0, at depth 10: 1.2, at depth 15+: 1.0
            wormholeMinWidthScale = Math.max(1.0, 2.3 - depth * 0.1)
        }

        return {
            abyssTentacleCount,
            abyssTentacleFirstTime: false, // Set in updateHistory
            portalPairCount,
            portalFirstTime: false,
            wallTentacleCount,
            wallTentacleFirstTime: false,
            trajectoryTimedActivated,
            trajectoryTimedFirstTime: false,
            trajectoryFlickerActivated,
            trajectoryFlickerFirstTime: false,
            waterLevelRiseAmount,
            waterRiseFirstTime: false,
            wormholeShrinkActivated,
            wormholeShrinkFirstTime: false,
            wormholeShrinkRate,
            wormholeMinWidthScale,
        }
    }

    /**
     * Update game history and set "first time" flags on activated factors
     */
    private updateHistory(factors: ActivatedFactors): void {
        // Abyss tentacle
        if (factors.abyssTentacleCount > 0) {
            factors.abyssTentacleFirstTime = !this.gameHistory.hasSeenAbyssTentacle
            this.gameHistory.hasSeenAbyssTentacle = true
        }

        // Portal
        if (factors.portalPairCount > 0) {
            factors.portalFirstTime = !this.gameHistory.hasSeenPortal
            this.gameHistory.hasSeenPortal = true
        }

        // Wall tentacle
        if (factors.wallTentacleCount > 0) {
            factors.wallTentacleFirstTime = !this.gameHistory.hasSeenWallTentacle
            this.gameHistory.hasSeenWallTentacle = true
        }

        // Trajectory timed
        if (factors.trajectoryTimedActivated) {
            factors.trajectoryTimedFirstTime = !this.gameHistory.hasSeenTrajectoryTimed
            this.gameHistory.hasSeenTrajectoryTimed = true
        }

        // Trajectory flicker
        if (factors.trajectoryFlickerActivated) {
            factors.trajectoryFlickerFirstTime = !this.gameHistory.hasSeenTrajectoryFlicker
            this.gameHistory.hasSeenTrajectoryFlicker = true
        }

        // Water rise
        if (factors.waterLevelRiseAmount > 0) {
            factors.waterRiseFirstTime = !this.gameHistory.hasSeenWaterRise
            this.gameHistory.hasSeenWaterRise = true
        }

        // Wormhole shrink
        if (factors.wormholeShrinkActivated) {
            factors.wormholeShrinkFirstTime = !this.gameHistory.hasSeenWormholeShrink
            this.gameHistory.hasSeenWormholeShrink = true
        }
    }

    /**
     * Generate anchor personality based on weighted probabilities
     */
    private generateAnchorPersonality(
        rng: SeededRandom,
        weights: Record<AnchorPersonality, number>
    ): AnchorPersonalityConfig {
        const items = Object.entries(weights).map(([type, weight]) => ({
            item: type as AnchorPersonality,
            weight,
        }))

        const selectedType = rng.pickWeighted(items)
        return { ...ANCHOR_PERSONALITIES[selectedType] }
    }

    /**
     * Generate wormhole (goal) configuration
     * Wormhole always starts at full size - shrinking happens during gameplay
     */
    private generateWormhole(
        rng: SeededRandom,
        _depth: number,
        width: number,
        abyssTop: number
    ): StageConfig['wormhole'] {
        const padding = 60
        const GOAL_RANGE_ABOVE_WATER = 180
        const GOAL_MIN_DISTANCE_FROM_WATER = 50

        const maxY = abyssTop - GOAL_MIN_DISTANCE_FROM_WATER
        const minY = abyssTop - GOAL_RANGE_ABOVE_WATER

        const x = padding + rng.nextFloat(0, width - padding * 2)
        const y = rng.nextFloat(minY, maxY)

        const orientation: PortalOrientation = 'horizontal'

        // Always start at full size (2.5) - shrinking happens during gameplay
        return {
            x,
            y,
            radius: 35,
            widthScale: 2.5,
            orientation,
        }
    }

    /**
     * Generate wall tentacle obstacles
     */
    private generateWallTentacles(
        rng: SeededRandom,
        count: number,
        width: number,
        boundaryTop: number,
        abyssTop: number,
        wormhole: StageConfig['wormhole']
    ): WallTentacleConfig[] {
        const tentacles: WallTentacleConfig[] = []
        const minY = 120
        const maxY = abyssTop - 80

        const movements: Array<'static' | 'sway' | 'vertical'> = ['static', 'sway', 'vertical']

        for (let i = 0; i < count; i++) {
            const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right'

            let y: number
            let attempts = 0
            do {
                y = rng.nextFloat(minY, maxY)
                attempts++
            } while (attempts < 10 && Math.abs(y - wormhole.y) < 100)

            tentacles.push({
                side,
                y,
                length: rng.nextFloat(120, 180),
                attackRange: rng.nextFloat(100, 140),
                movement: rng.pick(movements),
                speed: rng.nextFloat(0.8, 1.6),
                range: rng.nextFloat(25, 55),
            })
        }

        return tentacles
    }

    /**
     * Generate portal pairs for teleportation
     */
    private generatePortalPairs(
        rng: SeededRandom,
        count: number,
        width: number,
        boundaryTop: number,
        abyssTop: number
    ): PortalPairStageConfig[] {
        const pairs: PortalPairStageConfig[] = []
        const padding = 80
        const colors: Array<'purple' | 'teal' | 'red' | 'gold'> = ['purple', 'teal', 'red', 'gold']

        for (let i = 0; i < count; i++) {
            const color = colors[i % colors.length]

            const entranceX = padding + rng.nextFloat(0, width * 0.3)
            const entranceY = boundaryTop + 100 + rng.nextFloat(0, abyssTop - boundaryTop - 200)

            const exitX = width - padding - rng.nextFloat(0, width * 0.3)
            const exitY = boundaryTop + 100 + rng.nextFloat(0, abyssTop - boundaryTop - 200)

            pairs.push({
                entrance: {
                    x: entranceX,
                    y: entranceY,
                    radius: 35,
                    orientation: 'horizontal',
                },
                exit: {
                    x: exitX,
                    y: exitY,
                    radius: 35,
                    orientation: 'vertical',
                },
                color,
            })
        }

        return pairs
    }

    /**
     * Generate abyss tentacles that pull the wormhole
     */
    private generateAbyssTentacles(
        rng: SeededRandom,
        count: number,
        width: number,
        wormholeX: number
    ): AbyssTentacleConfig[] {
        const tentacles: AbyssTentacleConfig[] = []
        const padding = 100

        for (let i = 0; i < count; i++) {
            let baseX: number
            if (count === 1) {
                baseX = wormholeX + rng.nextFloat(-50, 50)
            } else {
                const spread = width * 0.6
                const startX = wormholeX - spread / 2
                baseX = startX + (spread / (count - 1)) * i + rng.nextFloat(-30, 30)
            }

            baseX = Math.max(padding, Math.min(width - padding, baseX))

            tentacles.push({
                baseX,
                maxLength: rng.nextFloat(150, 250),
                pullStrength: rng.nextFloat(0.3, 0.6),
                directionChangeInterval: rng.nextFloat(2, 4),
                maxDisplacement: rng.nextFloat(30, 60),
                color: 0x4a2040,
                segments: rng.nextInt(5, 8),
            })
        }

        return tentacles
    }

    /**
     * Get rope length minimum based on depth
     */
    private getRopeLengthMin(depth: number): number {
        return Math.max(60, 120 - depth * 4)
    }

    /**
     * Get rope length maximum based on depth
     */
    private getRopeLengthMax(depth: number): number {
        return Math.min(250, 180 + depth * 5)
    }

    /**
     * Get trajectory visibility settings
     */
    private getTrajectorySettings(
        mode: 'always' | 'timed' | 'flicker' | 'hidden',
        depth: number
    ): Pick<
        StageConfig,
        | 'trajectoryMode'
        | 'trajectoryDuration'
        | 'trajectoryFlickerInterval'
        | 'trajectoryFlickerOnRatio'
    > {
        switch (mode) {
            case 'always':
                return {
                    trajectoryMode: 'always',
                    trajectoryDuration: 0,
                    trajectoryFlickerInterval: 0,
                    trajectoryFlickerOnRatio: 1,
                }
            case 'timed':
                return {
                    trajectoryMode: 'timed',
                    trajectoryDuration: Math.max(1.0, 2.5 - depth * 0.1),
                    trajectoryFlickerInterval: 0,
                    trajectoryFlickerOnRatio: 1,
                }
            case 'flicker':
                return {
                    trajectoryMode: 'flicker',
                    trajectoryDuration: 0,
                    trajectoryFlickerInterval: Math.max(0.3, 0.5 - depth * 0.01),
                    trajectoryFlickerOnRatio: Math.max(0.15, 0.4 - depth * 0.02),
                }
            case 'hidden':
                return {
                    trajectoryMode: 'hidden',
                    trajectoryDuration: 0,
                    trajectoryFlickerInterval: 0,
                    trajectoryFlickerOnRatio: 0,
                }
        }
    }
}
