/**
 * ScoreSystem.ts - Manages scoring for minigames
 */

import { ScoreState, SCORE_CONFIG, HitResult } from '../MiniGameTypes'

export class ScoreSystem {
    private state: ScoreState = {
        score: 0,
        combo: 0,
        maxCombo: 0,
        perfectHits: 0,
        totalShots: 0,
        hits: 0,
    }

    private lastHitTime = 0 // For speed bonus calculation

    get currentState(): ScoreState {
        return { ...this.state }
    }

    get score(): number {
        return this.state.score
    }

    get combo(): number {
        return this.state.combo
    }

    /**
     * Record a shot attempt
     */
    recordShot(hitResult: HitResult, gameTime: number): number {
        this.state.totalShots++

        if (!hitResult.hit) {
            // Miss - reset combo
            this.state.combo = 0
            return 0
        }

        // Hit!
        this.state.hits++
        this.state.combo++
        this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo)

        // Calculate points
        let points = SCORE_CONFIG.basePoints

        // Perfect hit bonus
        if (hitResult.perfect) {
            points *= SCORE_CONFIG.perfectMultiplier
            this.state.perfectHits++
        }

        // Combo multiplier
        const comboMultiplier = Math.min(
            1 + this.state.combo * SCORE_CONFIG.comboMultiplierBase,
            SCORE_CONFIG.maxComboMultiplier
        )
        points *= comboMultiplier

        // Speed bonus (quick successive hits)
        const timeSinceLastHit = gameTime - this.lastHitTime
        if (timeSinceLastHit < SCORE_CONFIG.speedBonusThreshold && this.lastHitTime > 0) {
            points += SCORE_CONFIG.speedBonus
        }

        this.lastHitTime = gameTime
        this.state.score += Math.round(points)

        return Math.round(points)
    }

    /**
     * Record a miss (target expired or missed shot)
     */
    recordMiss(): void {
        this.state.combo = 0
    }

    /**
     * Add points directly (for custom scoring systems)
     */
    addPoints(points: number): void {
        this.state.score += Math.round(points)
        this.state.hits++
        this.state.totalShots++
    }

    /**
     * Get accuracy percentage
     */
    getAccuracy(): number {
        if (this.state.totalShots === 0) return 0
        return (this.state.hits / this.state.totalShots) * 100
    }

    /**
     * Get combo multiplier display value
     */
    getComboMultiplier(): number {
        return Math.min(
            1 + this.state.combo * SCORE_CONFIG.comboMultiplierBase,
            SCORE_CONFIG.maxComboMultiplier
        )
    }

    /**
     * Reset the score system
     */
    reset(): void {
        this.state = {
            score: 0,
            combo: 0,
            maxCombo: 0,
            perfectHits: 0,
            totalShots: 0,
            hits: 0,
        }
        this.lastHitTime = 0
    }
}
