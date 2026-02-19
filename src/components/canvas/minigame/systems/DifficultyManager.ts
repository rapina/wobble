/**
 * DifficultyManager.ts - Manages difficulty progression for minigames
 */

import { DifficultyConfig, DifficultyPhase, getDifficultyForTime } from '../MiniGameTypes'

export type DifficultyChangeCallback = (
    config: DifficultyConfig,
    previousPhase: DifficultyPhase
) => void

export class DifficultyManager {
    private currentConfig: DifficultyConfig
    private previousPhase: DifficultyPhase | null = null
    private onPhaseChange: DifficultyChangeCallback | null = null

    constructor() {
        this.currentConfig = getDifficultyForTime(0)
    }

    get config(): DifficultyConfig {
        return this.currentConfig
    }

    get phase(): DifficultyPhase {
        return this.currentConfig.phase
    }

    /**
     * Set callback for difficulty phase changes
     */
    setOnPhaseChange(callback: DifficultyChangeCallback): void {
        this.onPhaseChange = callback
    }

    /**
     * Update difficulty based on game time
     */
    update(gameTime: number): void {
        const newConfig = getDifficultyForTime(gameTime)

        if (newConfig.phase !== this.currentConfig.phase) {
            const oldPhase = this.currentConfig.phase
            this.previousPhase = oldPhase
            this.currentConfig = newConfig

            if (this.onPhaseChange) {
                this.onPhaseChange(newConfig, oldPhase)
            }
        }
    }

    /**
     * Get target spawn interval for current difficulty
     */
    getSpawnInterval(): number {
        return this.currentConfig.spawnInterval
    }

    /**
     * Get target size multiplier for current difficulty
     */
    getTargetSizeMultiplier(): number {
        return this.currentConfig.targetSize
    }

    /**
     * Get target speed multiplier for current difficulty
     */
    getTargetSpeedMultiplier(): number {
        return this.currentConfig.targetSpeed
    }

    /**
     * Get hit zone tolerance multiplier
     */
    getHitZoneMultiplier(): number {
        return this.currentConfig.hitZoneMultiplier
    }

    /**
     * Check if targets should move
     */
    shouldTargetsMove(): boolean {
        return this.currentConfig.movingTargets
    }

    /**
     * Check if wind effect is active
     */
    isWindActive(): boolean {
        return this.currentConfig.windEffect
    }

    /**
     * Reset to initial difficulty
     */
    reset(): void {
        this.currentConfig = getDifficultyForTime(0)
        this.previousPhase = null
    }
}
