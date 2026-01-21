/**
 * LifeSystem.ts - Manages player lives for minigames
 */

import { LifeState, LIFE_CONFIG } from '../MiniGameTypes'

export type LifeChangeCallback = (lives: number, maxLives: number) => void
export type GameOverCallback = () => void

export class LifeSystem {
    private state: LifeState = {
        lives: LIFE_CONFIG.initialLives,
        maxLives: LIFE_CONFIG.maxLives,
    }

    private onLifeChange: LifeChangeCallback | null = null
    private onGameOver: GameOverCallback | null = null

    get lives(): number {
        return this.state.lives
    }

    get maxLives(): number {
        return this.state.maxLives
    }

    get isGameOver(): boolean {
        return this.state.lives <= 0
    }

    get currentState(): LifeState {
        return { ...this.state }
    }

    /**
     * Set callback for life changes
     */
    setOnLifeChange(callback: LifeChangeCallback): void {
        this.onLifeChange = callback
    }

    /**
     * Set callback for game over
     */
    setOnGameOver(callback: GameOverCallback): void {
        this.onGameOver = callback
    }

    /**
     * Lose a life
     */
    loseLife(): void {
        if (this.state.lives > 0) {
            this.state.lives--

            if (this.onLifeChange) {
                this.onLifeChange(this.state.lives, this.state.maxLives)
            }

            if (this.state.lives <= 0 && this.onGameOver) {
                this.onGameOver()
            }
        }
    }

    /**
     * Gain a life (if under max)
     */
    gainLife(): boolean {
        if (this.state.lives < this.state.maxLives) {
            this.state.lives++

            if (this.onLifeChange) {
                this.onLifeChange(this.state.lives, this.state.maxLives)
            }

            return true
        }
        return false
    }

    /**
     * Configure life system with custom values
     */
    configure(maxLives: number, initialLives?: number): void {
        this.state.maxLives = maxLives
        this.state.lives = initialLives ?? maxLives

        if (this.onLifeChange) {
            this.onLifeChange(this.state.lives, this.state.maxLives)
        }
    }

    /**
     * Reset to initial state
     */
    reset(): void {
        this.state.lives = this.state.maxLives // Reset to current maxLives

        if (this.onLifeChange) {
            this.onLifeChange(this.state.lives, this.state.maxLives)
        }
    }
}
