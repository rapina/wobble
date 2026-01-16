import { Container, Graphics } from 'pixi.js'
import { Wobble } from '../../Wobble'
import { Enemy, EnemyTier, TIER_CONFIGS, HitEffect } from './types'
import { PhysicsModifiers, DEFAULT_PHYSICS, applyVortex } from './PhysicsModifiers'
import type { KnockbackTrail } from './EffectsManager'

interface EnemySystemContext {
    enemyContainer: Container
    effectContainer: Container
    width: number
    height: number
    baseEnemySpeed: number
    maxEnemyCount?: number
    // Callback to add trail points (from EffectsManager)
    onAddTrailPoint?: (trail: KnockbackTrail, x: number, y: number) => void
    // Callback to show physics formula during merge (momentum conservation)
    onShowMergeFormula?: (x: number, y: number, mass1: number, mass2: number, totalMass: number) => void
}

interface PendingMerge {
    enemy1: Enemy
    enemy2: Enemy
    startTime: number
}

export class EnemySystem {
    private context: EnemySystemContext
    private nextEnemyId = 0
    private overlapTracker: Map<string, number> = new Map()
    private pendingMerges: PendingMerge[] = []

    // Physics modifiers (stage-based)
    private physicsModifiers: PhysicsModifiers = DEFAULT_PHYSICS

    // Maximum enemy count to prevent O(n²) collision explosion
    private readonly maxEnemyCount: number

    readonly mergeThreshold = 0.75 // seconds of overlap before merge
    readonly enemies: Enemy[] = []

    constructor(context: EnemySystemContext) {
        this.context = context
        // Default max 50 enemies - keeps collision checks under 1250 per frame
        this.maxEnemyCount = context.maxEnemyCount ?? 50
    }

    /**
     * Check if more enemies can be spawned
     */
    canSpawn(): boolean {
        return this.enemies.length < this.maxEnemyCount
    }

    updateContext(context: Partial<EnemySystemContext>): void {
        this.context = { ...this.context, ...context }
    }

    /**
     * Set physics modifiers for current stage
     */
    setPhysicsModifiers(modifiers: PhysicsModifiers): void {
        this.physicsModifiers = modifiers
    }

    // Spawn enemy at random edge (relative to player position for infinite map)
    spawnAtEdge(gameTime: number, playerX: number, playerY: number): boolean {
        // Check enemy limit before spawning
        if (!this.canSpawn()) {
            return false
        }

        // Spawn at a random angle around the player, just outside visible area
        const spawnDistance = Math.max(this.context.width, this.context.height) * 0.7
        const angle = Math.random() * Math.PI * 2

        const x = playerX + Math.cos(angle) * spawnDistance
        const y = playerY + Math.sin(angle) * spawnDistance

        this.spawnAtTier(x, y, 'small', gameTime)
        return true
    }

    // Spawn enemy at specific tier
    spawnAtTier(
        x: number,
        y: number,
        tier: EnemyTier,
        gameTime: number,
        overrides?: { vx?: number; vy?: number; health?: number; maxHealth?: number }
    ): void {
        const config = TIER_CONFIGS[tier]
        // Aggressive difficulty scaling: very weak early, strong late
        // t=0: mult=1, t=60: mult=2, t=120: mult=3, t=180: mult=4
        const difficultyMult = 1 + gameTime / 60

        // Low base health for easy early kills (3 HP base)
        // t=0: 3*1*1=3 HP (1-2 shots), t=180: 3*4*1=12 HP (much harder)
        const maxHealth = overrides?.maxHealth ?? 3 * difficultyMult * config.healthMultiplier
        const health = overrides?.health ?? maxHealth
        const speed =
            this.context.baseEnemySpeed * (0.8 + Math.random() * 0.4) * config.speedMultiplier

        const wobble = new Wobble({
            size: config.size,
            color: config.color,
            shape: 'shadow',
            expression: 'angry',
            showShadow: false,
        })
        wobble.position.set(x, y)
        this.context.enemyContainer.addChild(wobble)

        const mass = 2 * config.healthMultiplier

        // Create mass ring - physics visualization (m ∝ ring thickness)
        const massRing = this.createMassRing(config.size, mass, tier)
        massRing.position.set(x, y)
        this.context.enemyContainer.addChild(massRing)

        const enemy: Enemy = {
            graphics: wobble,
            wobble,
            massRing,
            x,
            y,
            vx: overrides?.vx ?? 0,
            vy: overrides?.vy ?? 0,
            health,
            maxHealth,
            speed,
            mass,
            size: config.size,
            tier,
            id: this.nextEnemyId++,
            merging: false,
        }

        this.enemies.push(enemy)
    }

    /**
     * Create a mass ring graphic for physics visualization
     * Ring thickness and intensity scale with mass (F = ma visualization)
     */
    private createMassRing(size: number, mass: number, tier: EnemyTier): Graphics {
        const ring = new Graphics()

        // Ring properties scale with mass
        const ringRadius = size * 0.65
        const strokeWidth = Math.sqrt(mass) * 1.5 + 1 // √m scaling for visual balance
        const baseAlpha = 0.2 + Math.min(mass * 0.03, 0.4) // More opaque for heavier

        // Color based on tier - heavier = more intense blue/purple
        const colors: Record<EnemyTier, number> = {
            small: 0x4488ff, // Light blue
            medium: 0x6644ff, // Blue-purple
            large: 0x8844ff, // Purple
            boss: 0xaa44ff, // Bright purple
        }

        ring.circle(0, 0, ringRadius)
        ring.stroke({
            color: colors[tier],
            width: strokeWidth,
            alpha: baseAlpha,
        })

        // Add inner glow for medium+ tiers
        if (tier !== 'small') {
            ring.circle(0, 0, ringRadius * 0.85)
            ring.stroke({
                color: colors[tier],
                width: strokeWidth * 0.5,
                alpha: baseAlpha * 0.5,
            })
        }

        return ring
    }

    // Update enemy positions (move towards player)
    update(delta: number, playerX: number, playerY: number, animPhase: number): void {
        const { width, height } = this.context

        for (const enemy of this.enemies) {
            const dx = playerX - enemy.x
            const dy = playerY - enemy.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1

            // Add velocity towards player
            const accel = 0.1 * delta
            enemy.vx += (dx / dist) * accel * enemy.speed
            enemy.vy += (dy / dist) * accel * enemy.speed

            // Note: Stage gravity is NOT applied to enemies
            // Enemies should always chase the player regardless of world physics
            // Gravity wells pull enemies via the vortex system instead

            // Apply vortex pull if configured
            if (this.physicsModifiers.vortexCenter && this.physicsModifiers.vortexStrength) {
                const vortexResult = applyVortex(
                    enemy.x,
                    enemy.y,
                    enemy.vx,
                    enemy.vy,
                    width,
                    height,
                    {
                        center: this.physicsModifiers.vortexCenter,
                        strength: this.physicsModifiers.vortexStrength,
                    },
                    delta,
                    50
                )
                enemy.vx = vortexResult.vx
                enemy.vy = vortexResult.vy
            }

            // Limit speed
            const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy)
            if (speed > enemy.speed * 2) {
                // Allow some overspeed from physics
                enemy.vx = (enemy.vx / speed) * enemy.speed * 2
                enemy.vy = (enemy.vy / speed) * enemy.speed * 2
            }

            // Apply velocity
            enemy.x += enemy.vx * delta
            enemy.y += enemy.vy * delta

            // Friction on velocity (from stage physics)
            enemy.vx *= this.physicsModifiers.friction
            enemy.vy *= this.physicsModifiers.friction

            // Infinite map - no wall boundaries
            // Enemies can move freely in world space

            enemy.graphics.position.set(enemy.x, enemy.y)

            // Update mass ring position
            if (enemy.massRing) {
                enemy.massRing.position.set(enemy.x, enemy.y)

                // Boss mass ring pulses to show massive gravity
                if (enemy.tier === 'boss') {
                    const pulseScale = 1 + Math.sin(animPhase * 3) * 0.15
                    enemy.massRing.scale.set(pulseScale)
                    enemy.massRing.alpha = 0.5 + Math.sin(animPhase * 2) * 0.2
                }
            }

            // Update knockback trail (F=ma visualization)
            if (enemy.knockbackTrail && this.context.onAddTrailPoint) {
                const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy)
                // Only add points while moving fast (knockback in progress)
                if (speed > 1) {
                    this.context.onAddTrailPoint(enemy.knockbackTrail, enemy.x, enemy.y)
                } else {
                    // Knockback finished, clear trail reference
                    enemy.knockbackTrail = undefined
                }
            }

            // Animate wobble phase
            if (enemy.wobble) {
                enemy.wobble.updateOptions({
                    wobblePhase: animPhase,
                    lookDirection: { x: dx / dist, y: dy / dist },
                })
            }
        }
    }

    // Check for enemy collisions and potential merges
    checkCollisions(deltaSeconds: number, hitEffects: HitEffect[]): void {
        // Early exit optimization for large enemy counts
        const maxCheckDist = 150 // Max distance to check collisions

        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const e1 = this.enemies[i]
                const e2 = this.enemies[j]

                // Skip if either is already merging
                if (e1.merging || e2.merging) continue

                const dx = e2.x - e1.x
                const dy = e2.y - e1.y

                // Quick distance check - skip if clearly too far (avoid sqrt)
                if (Math.abs(dx) > maxCheckDist || Math.abs(dy) > maxCheckDist) continue

                const dist = Math.sqrt(dx * dx + dy * dy)
                const minDist = e1.size / 2 + e2.size / 2

                if (dist < minDist && dist > 0) {
                    const key = this.getOverlapKey(e1, e2)
                    const tier1 = TIER_CONFIGS[e1.tier]
                    const tier2 = TIER_CONFIGS[e2.tier]

                    // Check merge eligibility: same tier and both can merge
                    if (tier1.canMerge && tier2.canMerge && e1.tier === e2.tier) {
                        const currentOverlap = this.overlapTracker.get(key) || 0
                        const newOverlap = currentOverlap + deltaSeconds
                        this.overlapTracker.set(key, newOverlap)

                        if (newOverlap >= this.mergeThreshold) {
                            this.startMerge(e1, e2)
                            this.overlapTracker.delete(key)
                            continue
                        }
                    } else {
                        this.overlapTracker.delete(key)
                    }

                    // Separate overlapping enemies
                    const nx = dx / dist
                    const ny = dy / dist

                    const dvx = e1.vx - e2.vx
                    const dvy = e1.vy - e2.vy
                    const dvn = dvx * nx + dvy * ny

                    if (dvn > 0) {
                        e1.vx -= dvn * nx
                        e1.vy -= dvn * ny
                        e2.vx += dvn * nx
                        e2.vy += dvn * ny
                    }

                    const overlap = minDist - dist
                    e1.x -= overlap * nx * 0.5
                    e1.y -= overlap * ny * 0.5
                    e2.x += overlap * nx * 0.5
                    e2.y += overlap * ny * 0.5
                } else {
                    const key = this.getOverlapKey(e1, e2)
                    this.overlapTracker.delete(key)
                }
            }
        }
    }

    // Update merge animations
    updateMerges(gameTime: number, hitEffects: HitEffect[]): void {
        const mergeDuration = 0.4

        for (let i = this.pendingMerges.length - 1; i >= 0; i--) {
            const merge = this.pendingMerges[i]
            const elapsed = gameTime - merge.startTime
            const progress = Math.min(1, elapsed / mergeDuration)

            const e1 = merge.enemy1
            const e2 = merge.enemy2

            // Check if either enemy was destroyed
            if (!this.enemies.includes(e1) || !this.enemies.includes(e2)) {
                this.pendingMerges.splice(i, 1)
                continue
            }

            const totalMass = e1.mass + e2.mass
            const centerX = (e1.x * e1.mass + e2.x * e2.mass) / totalMass
            const centerY = (e1.y * e1.mass + e2.y * e2.mass) / totalMass

            const easeProgress = progress * progress

            e1.x = e1.x + (centerX - e1.x) * easeProgress * 0.3
            e1.y = e1.y + (centerY - e1.y) * easeProgress * 0.3
            e2.x = e2.x + (centerX - e2.x) * easeProgress * 0.3
            e2.y = e2.y + (centerY - e2.y) * easeProgress * 0.3

            e1.graphics.position.set(e1.x, e1.y)
            e2.graphics.position.set(e2.x, e2.y)

            const scale = 1 - progress * 0.4
            e1.wobble?.updateOptions({ scaleX: scale, scaleY: scale })
            e2.wobble?.updateOptions({ scaleX: scale, scaleY: scale })

            if (progress >= 1) {
                this.completeMerge(e1, e2, centerX, centerY, gameTime, hitEffects)
                this.pendingMerges.splice(i, 1)
            }
        }
    }

    // Remove specific enemy
    remove(enemy: Enemy): void {
        const index = this.enemies.indexOf(enemy)
        if (index !== -1) {
            this.context.enemyContainer.removeChild(enemy.graphics)
            enemy.graphics.destroy()
            // Clean up mass ring
            if (enemy.massRing) {
                this.context.enemyContainer.removeChild(enemy.massRing)
                enemy.massRing.destroy()
            }
            this.enemies.splice(index, 1)
        }
    }

    // Get dead enemies (call before cleanupDead to know what was killed)
    getDeadEnemies(): Enemy[] {
        return this.enemies.filter((e) => e.health <= 0)
    }

    // Remove dead enemies
    cleanupDead(): number {
        let score = 0
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].health <= 0) {
                const enemy = this.enemies[i]
                this.context.enemyContainer.removeChild(enemy.graphics)
                enemy.graphics.destroy()
                // Clean up mass ring
                if (enemy.massRing) {
                    this.context.enemyContainer.removeChild(enemy.massRing)
                    enemy.massRing.destroy()
                }
                this.enemies.splice(i, 1)
                score += 10
            }
        }
        return score
    }

    /**
     * Remove enemies that have drifted too far from camera
     * For infinite map: uses camera position instead of screen bounds
     */
    cleanupOffScreen(cameraX: number = 0, cameraY: number = 0): number {
        const margin = 600 // Larger margin for infinite map
        let removed = 0

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i]
            const dx = Math.abs(enemy.x - cameraX)
            const dy = Math.abs(enemy.y - cameraY)

            if (dx > margin || dy > margin) {
                this.context.enemyContainer.removeChild(enemy.graphics)
                enemy.graphics.destroy()
                // Clean up mass ring
                if (enemy.massRing) {
                    this.context.enemyContainer.removeChild(enemy.massRing)
                    enemy.massRing.destroy()
                }
                this.enemies.splice(i, 1)
                removed++
            }
        }

        return removed
    }

    // Cleanup stale overlap tracking
    cleanupOverlapTracker(): void {
        const validIds = new Set(this.enemies.map((e) => e.id))

        for (const key of this.overlapTracker.keys()) {
            const [id1, id2] = key.split('-').map(Number)
            if (!validIds.has(id1) || !validIds.has(id2)) {
                this.overlapTracker.delete(key)
            }
        }
    }

    // Reset all enemies
    reset(): void {
        for (const enemy of this.enemies) {
            this.context.enemyContainer.removeChild(enemy.graphics)
            enemy.graphics.destroy()
            // Clean up mass ring
            if (enemy.massRing) {
                this.context.enemyContainer.removeChild(enemy.massRing)
                enemy.massRing.destroy()
            }
        }
        this.enemies.length = 0
        this.overlapTracker.clear()
        this.pendingMerges = []
        this.nextEnemyId = 0
    }

    // Private helpers
    private getOverlapKey(e1: Enemy, e2: Enemy): string {
        const minId = Math.min(e1.id, e2.id)
        const maxId = Math.max(e1.id, e2.id)
        return `${minId}-${maxId}`
    }

    private getNextTier(currentTier: EnemyTier): EnemyTier {
        switch (currentTier) {
            case 'small':
                return 'medium'
            case 'medium':
                return 'large'
            case 'large':
                return 'boss'
            case 'boss':
                return 'boss'
        }
    }

    private startMerge(e1: Enemy, e2: Enemy): void {
        e1.merging = true
        e2.merging = true
        e1.mergeTarget = e2
        e2.mergeTarget = e1

        this.pendingMerges.push({
            enemy1: e1,
            enemy2: e2,
            startTime: 0, // Will be set in updateMerges based on gameTime
        })

        // Store start time on the merge itself
        this.pendingMerges[this.pendingMerges.length - 1].startTime = -1 // Marker for "needs gameTime"
    }

    private completeMerge(
        e1: Enemy,
        e2: Enemy,
        centerX: number,
        centerY: number,
        gameTime: number,
        hitEffects: HitEffect[]
    ): void {
        const nextTier = this.getNextTier(e1.tier)
        const config = TIER_CONFIGS[nextTier]

        // Physics: Conservation of momentum
        const totalMass = e1.mass + e2.mass
        const newVx = (e1.mass * e1.vx + e2.mass * e2.vx) / totalMass
        const newVy = (e1.mass * e1.vy + e2.mass * e2.vy) / totalMass

        // Health calculation (using same values as spawnAtTier)
        const healthRatio1 = e1.health / e1.maxHealth
        const healthRatio2 = e2.health / e2.maxHealth
        const avgHealthRatio = (healthRatio1 + healthRatio2) / 2
        const difficultyMult = 1 + gameTime / 60 // Aggressive scaling
        const newMaxHealth = 3 * difficultyMult * config.healthMultiplier // Low base
        const newHealth = newMaxHealth * avgHealthRatio

        // Remove old enemies
        this.remove(e1)
        this.remove(e2)

        // Create merged enemy
        this.spawnAtTier(centerX, centerY, nextTier, gameTime, {
            vx: newVx,
            vy: newVy,
            health: newHealth,
            maxHealth: newMaxHealth,
        })

        // Create merge effect
        this.createMergeEffect(centerX, centerY, config.size, hitEffects)

        // Show physics formula: momentum conservation p₁ + p₂ = p
        if (this.context.onShowMergeFormula) {
            this.context.onShowMergeFormula(centerX, centerY, e1.mass, e2.mass, totalMass)
        }
    }

    private createMergeEffect(x: number, y: number, size: number, hitEffects: HitEffect[]): void {
        const flash = new Graphics()
        flash.circle(0, 0, size * 0.8)
        flash.fill({ color: 0x9b59b6, alpha: 0.8 })
        flash.position.set(x, y)
        this.context.effectContainer.addChild(flash)

        hitEffects.push({ x, y, timer: 0.35, graphics: flash })

        const ring = new Graphics()
        ring.circle(0, 0, size * 0.5)
        ring.stroke({ color: 0xbb79d6, width: 3 })
        ring.position.set(x, y)
        this.context.effectContainer.addChild(ring)

        hitEffects.push({ x, y, timer: 0.4, graphics: ring })
    }
}
