/**
 * MultiKillSystem - Tracks kills within a short window for multi-kill feedback
 * Only triggers when multiple enemies are killed in quick succession (skill required)
 */

export interface ComboState {
    // For HUD compatibility - but we won't show continuous combo
    count: number
    timer: number
    multiplier: number
    maxCombo: number
}

export interface MultiKillState {
    killCount: number // Kills in current window
    windowTimer: number // Time remaining in current window
    lastMultiKill: number // Last multi-kill count (for display)
    bestMultiKill: number // Best multi-kill this game
}

export interface ComboConfig {
    multiKillWindow: number // Very short window for multi-kill (seconds)
    // Legacy fields for compatibility
    comboWindow: number
    milestones: number[]
    baseMultiplier: number
    multiplierPerMilestone: number
}

const DEFAULT_CONFIG: ComboConfig = {
    multiKillWindow: 0.35, // 350ms window - requires actual skill
    comboWindow: 0.35,
    milestones: [2, 3, 4, 5, 6],
    baseMultiplier: 1.0,
    multiplierPerMilestone: 0.1,
}

// Multi-kill tier names
const MULTI_KILL_NAMES: Record<number, string> = {
    2: 'DOUBLE!',
    3: 'TRIPLE!',
    4: 'QUAD!',
    5: 'PENTA!',
    6: 'HEXA!',
    7: 'ULTRA!',
    8: 'MONSTER!',
    9: 'GODLIKE!',
    10: 'UNSTOPPABLE!',
}

export class ComboSystem {
    private config: ComboConfig
    private multiKillState: MultiKillState = {
        killCount: 0,
        windowTimer: 0,
        lastMultiKill: 0,
        bestMultiKill: 0,
    }

    // Callbacks
    onMultiKill?: (killCount: number, name: string) => void
    onComboMilestone?: (milestone: number, multiplier: number) => void
    onComboBreak?: (finalCount: number) => void
    onComboUpdate?: (state: ComboState) => void

    constructor(config?: Partial<ComboConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config }
    }

    /**
     * Register a kill
     */
    registerKill(): void {
        // Start or extend multi-kill window
        if (this.multiKillState.windowTimer <= 0) {
            // Start new window
            this.multiKillState.killCount = 1
            this.multiKillState.windowTimer = this.config.multiKillWindow
        } else {
            // Add to current window
            this.multiKillState.killCount++
            // Extend window slightly for chain kills
            this.multiKillState.windowTimer = Math.min(
                this.config.multiKillWindow,
                this.multiKillState.windowTimer + 0.1
            )
        }
    }

    /**
     * Update timer and check for multi-kill completion
     */
    update(deltaSeconds: number): void {
        if (this.multiKillState.windowTimer > 0) {
            this.multiKillState.windowTimer -= deltaSeconds

            // Window ended - check for multi-kill
            if (this.multiKillState.windowTimer <= 0) {
                this.processMultiKill()
            }
        }
    }

    /**
     * Process multi-kill when window closes
     */
    private processMultiKill(): void {
        const killCount = this.multiKillState.killCount

        if (killCount >= 2) {
            // Multi-kill achieved!
            this.multiKillState.lastMultiKill = killCount
            if (killCount > this.multiKillState.bestMultiKill) {
                this.multiKillState.bestMultiKill = killCount
            }

            // Get name (cap at 10 for display)
            const displayCount = Math.min(killCount, 10)
            const name = MULTI_KILL_NAMES[displayCount] || `${killCount}x KILL!`

            this.onMultiKill?.(killCount, name)
        }

        // Reset for next window
        this.multiKillState.killCount = 0
        this.multiKillState.windowTimer = 0
    }

    /**
     * Get current state (for HUD compatibility - returns empty state)
     */
    getState(): ComboState {
        // Return minimal state - we don't show continuous combo anymore
        return {
            count: 0,
            timer: 0,
            multiplier: 1.0,
            maxCombo: this.multiKillState.bestMultiKill,
        }
    }

    /**
     * Get multi-kill state
     */
    getMultiKillState(): MultiKillState {
        return { ...this.multiKillState }
    }

    /**
     * Get multiplier (always 1.0 for multi-kill system)
     */
    getMultiplier(): number {
        return 1.0
    }

    /**
     * Get combo window (for legacy compatibility)
     */
    getComboWindow(): number {
        return this.config.multiKillWindow
    }

    /**
     * Reset system
     */
    reset(): void {
        this.multiKillState = {
            killCount: 0,
            windowTimer: 0,
            lastMultiKill: 0,
            bestMultiKill: 0,
        }
    }
}
