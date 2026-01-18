/**
 * WorldGenerator - Pre-generates all game elements using a seed
 * Creates a deterministic game world that can be reproduced
 */

export interface EnemySpawnEvent {
    time: number // Seconds from game start
    tier: 'weak' | 'normal' | 'strong' | 'elite' | 'boss'
    count: number
    angle?: number // Spawn angle (if specified)
}

export interface WorldEvent {
    time: number
    type: 'blackhole_pulse' | 'enemy_wave' | 'xp_shower' | 'boss_warning' | 'gravity_shift'
    data?: Record<string, number | string>
}

export interface BlackHoleConfig {
    x: number
    y: number
    mass: number // Affects grid distortion radius
    pullStrength: number
    eventHorizonRadius: number
    accretionDiskRadius: number
    rotationSpeed: number
}

export interface GeneratedWorld {
    seed: number
    blackHole: BlackHoleConfig
    enemySpawns: EnemySpawnEvent[]
    worldEvents: WorldEvent[]
    totalDuration: number // Game length in seconds
    difficulty: number // 1-10
}

/**
 * Seeded random number generator (Mulberry32)
 */
class SeededRandom {
    private state: number

    constructor(seed: number) {
        this.state = seed
    }

    next(): number {
        let t = (this.state += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min
    }

    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min
    }

    pick<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)]
    }
}

export class WorldGenerator {
    private seed: number
    private rng: SeededRandom
    private generationProgress = 0
    private generationPhase = ''
    private totalSteps = 0
    private currentStep = 0

    // Callbacks for loading screen
    onProgress?: (progress: number, phase: string, detail: string) => void

    constructor(seed?: number) {
        this.seed = seed ?? Math.floor(Math.random() * 2147483647)
        this.rng = new SeededRandom(this.seed)
    }

    getSeed(): number {
        return this.seed
    }

    /**
     * Generate the entire game world
     * Returns a promise to allow for async loading screen updates
     */
    async generate(difficulty: number = 5): Promise<GeneratedWorld> {
        this.rng = new SeededRandom(this.seed) // Reset RNG
        this.totalSteps = 100
        this.currentStep = 0

        const gameDuration = 180 // 3 minutes

        // Phase 1: Generate Black Hole (20%)
        this.updateProgress('INITIALIZING SINGULARITY', 'Calculating mass distribution...')
        await this.delay(100)
        const blackHole = this.generateBlackHole(difficulty)
        this.currentStep = 20
        this.updateProgress('INITIALIZING SINGULARITY', 'Event horizon stabilized')
        await this.delay(150)

        // Phase 2: Generate Enemy Spawns (50%)
        this.updateProgress('COMPUTING ENEMY VECTORS', 'Analyzing threat patterns...')
        await this.delay(100)
        const enemySpawns = await this.generateEnemySpawns(gameDuration, difficulty)
        this.currentStep = 70
        this.updateProgress('COMPUTING ENEMY VECTORS', `${enemySpawns.length} hostiles detected`)
        await this.delay(100)

        // Phase 3: Generate World Events (20%)
        this.updateProgress('SIMULATING SPACETIME', 'Predicting anomalies...')
        await this.delay(100)
        const worldEvents = this.generateWorldEvents(gameDuration, difficulty)
        this.currentStep = 90
        this.updateProgress('SIMULATING SPACETIME', `${worldEvents.length} events predicted`)
        await this.delay(100)

        // Phase 4: Finalize (10%)
        this.updateProgress('STABILIZING REALITY', 'Locking coordinates...')
        await this.delay(200)
        this.currentStep = 100
        this.updateProgress('READY', `Seed: ${this.seed.toString(16).toUpperCase()}`)
        await this.delay(300)

        return {
            seed: this.seed,
            blackHole,
            enemySpawns,
            worldEvents,
            totalDuration: gameDuration,
            difficulty,
        }
    }

    private generateBlackHole(difficulty: number): BlackHoleConfig {
        // Black hole positioned at a distance from player start (0,0)
        const distance = this.rng.nextFloat(800, 1200)
        const angle = this.rng.nextFloat(0, Math.PI * 2)

        // Mass scales with difficulty
        const baseMass = 5000 + difficulty * 1000
        const mass = this.rng.nextFloat(baseMass * 0.8, baseMass * 1.2)

        return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            mass,
            pullStrength: 50 + difficulty * 10,
            eventHorizonRadius: 30 + difficulty * 5,
            accretionDiskRadius: 100 + difficulty * 20,
            rotationSpeed: this.rng.nextFloat(0.5, 1.5),
        }
    }

    private async generateEnemySpawns(
        duration: number,
        difficulty: number
    ): Promise<EnemySpawnEvent[]> {
        const spawns: EnemySpawnEvent[] = []

        // Base spawn rate starts slow, increases over time
        let time = 2 // Start spawning at 2 seconds

        while (time < duration) {
            // Progress callback every 10 seconds of game time
            if (Math.floor(time) % 10 === 0) {
                const phase = Math.floor((time / duration) * 50) + 20
                this.currentStep = Math.min(phase, 70)
                this.updateProgress('COMPUTING ENEMY VECTORS', `T+${Math.floor(time)}s analyzed`)
                await this.delay(20)
            }

            // Determine spawn rate based on time
            const timeProgress = time / duration
            const baseInterval = Math.max(0.3, 1.5 - timeProgress * 1.2)
            const interval = baseInterval * this.rng.nextFloat(0.7, 1.3)

            // Determine tier based on time and difficulty
            const tier = this.determineTier(timeProgress, difficulty)

            // Occasionally spawn groups
            const count = this.rng.next() < 0.2 ? this.rng.nextInt(2, 4) : 1

            spawns.push({
                time,
                tier,
                count,
                angle: this.rng.next() < 0.3 ? this.rng.nextFloat(0, Math.PI * 2) : undefined,
            })

            time += interval
        }

        // Add boss at 2:30
        spawns.push({
            time: 150,
            tier: 'boss',
            count: 1,
        })

        return spawns.sort((a, b) => a.time - b.time)
    }

    private determineTier(
        timeProgress: number,
        difficulty: number
    ): 'weak' | 'normal' | 'strong' | 'elite' {
        const roll = this.rng.next()
        const difficultyBonus = difficulty * 0.05

        if (timeProgress < 0.2) {
            // Early game: mostly weak
            if (roll < 0.7 - difficultyBonus) return 'weak'
            if (roll < 0.95) return 'normal'
            return 'strong'
        } else if (timeProgress < 0.5) {
            // Mid game: mixed
            if (roll < 0.3 - difficultyBonus) return 'weak'
            if (roll < 0.7) return 'normal'
            if (roll < 0.9) return 'strong'
            return 'elite'
        } else {
            // Late game: harder enemies
            if (roll < 0.1) return 'weak'
            if (roll < 0.4 - difficultyBonus) return 'normal'
            if (roll < 0.75) return 'strong'
            return 'elite'
        }
    }

    private generateWorldEvents(duration: number, difficulty: number): WorldEvent[] {
        const events: WorldEvent[] = []

        // Black hole pulses - periodic gravity surges
        const pulseInterval = 30 - difficulty * 2 // 20-28 seconds between pulses
        for (
            let t = pulseInterval;
            t < duration;
            t += pulseInterval * this.rng.nextFloat(0.8, 1.2)
        ) {
            events.push({
                time: t,
                type: 'blackhole_pulse',
                data: { intensity: this.rng.nextFloat(0.5, 1.0) + (t / duration) * 0.5 },
            })
        }

        // Enemy waves - coordinated attacks
        const waveCount = 3 + Math.floor(difficulty / 2)
        for (let i = 0; i < waveCount; i++) {
            const waveTime = (duration / (waveCount + 1)) * (i + 1)
            events.push({
                time: waveTime,
                type: 'enemy_wave',
                data: {
                    count: 5 + difficulty + i * 2,
                    tier: i < waveCount - 1 ? 'normal' : 'strong',
                },
            })
        }

        // Boss warning
        events.push({
            time: 145,
            type: 'boss_warning',
        })

        // XP showers - reward moments
        for (let t = 45; t < duration; t += 60) {
            if (this.rng.next() < 0.4) {
                events.push({
                    time: t,
                    type: 'xp_shower',
                    data: { amount: this.rng.nextInt(5, 15) },
                })
            }
        }

        return events.sort((a, b) => a.time - b.time)
    }

    private updateProgress(phase: string, detail: string): void {
        this.generationPhase = phase
        this.generationProgress = this.currentStep / this.totalSteps
        this.onProgress?.(this.generationProgress, phase, detail)
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}
