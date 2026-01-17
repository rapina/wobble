import { Container, Graphics } from 'pixi.js'
import { Wobble } from '../../Wobble'
import { Enemy, EnemyTier, TIER_CONFIGS, HitEffect } from './types'
import { PhysicsModifiers, DEFAULT_PHYSICS, applyVortex } from './PhysicsModifiers'
import type { KnockbackTrail } from './EffectsManager'
import {
    EnemyVariantId,
    EnemyVariantDef,
    ENEMY_VARIANTS,
    getAvailableVariants,
    selectRandomVariant,
    getVariant,
} from './EnemyVariants'
import { FormationSpawner, FormationId, FORMATIONS, SpawnPoint } from './FormationSystem'

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

    // Formation system
    private formationSpawner: FormationSpawner

    // Formation spawn timer
    private formationTimer = 0
    private formationInterval = 8 // 기본 포메이션 간격 (초)

    readonly mergeThreshold = 0.75 // seconds of overlap before merge
    readonly enemies: Enemy[] = []

    constructor(context: EnemySystemContext) {
        this.context = context
        // Default max 50 enemies - keeps collision checks under 1250 per frame
        this.maxEnemyCount = context.maxEnemyCount ?? 50
        this.formationSpawner = new FormationSpawner()
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
    spawnAtEdge(gameTime: number, playerX: number, playerY: number, tier: EnemyTier = 'small'): boolean {
        // Check enemy limit before spawning
        if (!this.canSpawn()) {
            return false
        }

        // Spawn at a random angle around the player, just outside visible area
        const spawnDistance = Math.max(this.context.width, this.context.height) * 0.7
        const angle = Math.random() * Math.PI * 2

        const x = playerX + Math.cos(angle) * spawnDistance
        const y = playerY + Math.sin(angle) * spawnDistance

        // Select a random variant based on game time and tier
        const availableVariants = getAvailableVariants(gameTime, tier)
        const variant = selectRandomVariant(availableVariants)

        this.spawnAtTier(x, y, tier, gameTime, { variant: variant.id })
        return true
    }

    /**
     * Try to spawn a formation
     * Returns true if a formation was spawned
     */
    trySpawnFormation(
        gameTime: number,
        deltaSeconds: number,
        playerX: number,
        playerY: number,
        tier: EnemyTier = 'small'
    ): boolean {
        // Update formation cooldowns
        this.formationSpawner.update(deltaSeconds)

        // Update formation timer
        this.formationTimer += deltaSeconds

        // Process any pending delayed spawns
        const pendingSpawns = this.formationSpawner.getPendingSpawns(gameTime)
        for (const spawn of pendingSpawns) {
            if (!this.canSpawn()) break
            const x = spawn.centerX + spawn.point.offsetX
            const y = spawn.centerY + spawn.point.offsetY
            const spawnTier = spawn.point.tier ?? spawn.tier
            const variantId = spawn.point.variant ?? 'normal'
            this.spawnAtTier(x, y, spawnTier, gameTime, {
                variant: variantId,
                formationId: spawn.formationId,
            })
        }

        // Check if it's time for a new formation
        // Reduce interval as game progresses (more frequent formations)
        const progressivInterval = Math.max(4, this.formationInterval - gameTime / 100)
        if (this.formationTimer < progressivInterval) {
            return false
        }

        this.formationTimer = 0

        // Get available formations
        const available = this.formationSpawner.getAvailableFormations(gameTime, this.enemies.length)
        if (available.length === 0) {
            return false
        }

        // Random chance to spawn a formation (50%)
        if (Math.random() > 0.5) {
            return false
        }

        // Select and spawn formation
        const formation = this.formationSpawner.selectFormation(available)
        const immediatePoints = this.formationSpawner.spawnFormation(
            formation,
            playerX,
            playerY,
            gameTime,
            tier
        )

        // Spawn immediate enemies
        for (const point of immediatePoints) {
            if (!this.canSpawn()) break
            const x = playerX + point.offsetX
            const y = playerY + point.offsetY
            const spawnTier = point.tier ?? tier
            const variantId = point.variant ?? 'normal'
            this.spawnAtTier(x, y, spawnTier, gameTime, {
                variant: variantId,
                formationId: formation.id,
            })
        }

        return true
    }

    /**
     * Force spawn a specific formation
     */
    forceFormation(
        formationId: FormationId,
        gameTime: number,
        playerX: number,
        playerY: number,
        tier: EnemyTier = 'small'
    ): void {
        const formation = this.formationSpawner.forceFormation(formationId)
        const points = this.formationSpawner.spawnFormation(
            formation,
            playerX,
            playerY,
            gameTime,
            tier
        )

        for (const point of points) {
            if (!this.canSpawn()) break
            const x = playerX + point.offsetX
            const y = playerY + point.offsetY
            const spawnTier = point.tier ?? tier
            const variantId = point.variant ?? 'normal'
            this.spawnAtTier(x, y, spawnTier, gameTime, {
                variant: variantId,
                formationId: formation.id,
            })
        }
    }

    // Spawn enemy at specific tier with optional variant
    spawnAtTier(
        x: number,
        y: number,
        tier: EnemyTier,
        gameTime: number,
        overrides?: {
            vx?: number
            vy?: number
            health?: number
            maxHealth?: number
            variant?: EnemyVariantId
            formationId?: FormationId
        }
    ): void {
        const config = TIER_CONFIGS[tier]
        const variantId = overrides?.variant ?? 'normal'
        const variant = getVariant(variantId)

        // 10-minute difficulty curve: exponential scaling for late game pressure
        const progress = gameTime / 600 // 0 to 1 over 10 minutes
        const difficultyMult = 1 + Math.pow(progress, 1.5) * 3

        // Apply variant modifiers
        const maxHealth =
            overrides?.maxHealth ?? 3 * difficultyMult * config.healthMultiplier * variant.healthMult
        const health = overrides?.health ?? maxHealth
        const baseSpeed =
            this.context.baseEnemySpeed * (0.8 + Math.random() * 0.4) * config.speedMultiplier
        const speed = baseSpeed * variant.speedMult

        // Size with variant modifier
        const size = config.size * (variant.scaleModifier ?? 1)

        // Color: blend tier color with variant tint
        const baseColor = config.color
        const tintColor = variant.colorTint ?? baseColor
        const finalColor = variantId === 'normal' ? baseColor : tintColor

        const wobble = new Wobble({
            size,
            color: finalColor,
            shape: 'shadow',
            expression: 'angry',
            showShadow: false,
        })
        wobble.position.set(x, y)
        this.context.enemyContainer.addChild(wobble)

        const mass = 2 * config.healthMultiplier * variant.massMult

        // Create mass ring - physics visualization (m ∝ ring thickness)
        const massRing = this.createMassRing(size, mass, tier, variant)
        massRing.position.set(x, y)
        this.context.enemyContainer.addChild(massRing)

        // Create glow effect if variant has one
        let glowEffect: Graphics | undefined
        if (variant.glowColor && variant.glowIntensity) {
            glowEffect = this.createGlowEffect(size, variant.glowColor, variant.glowIntensity)
            glowEffect.position.set(x, y)
            this.context.enemyContainer.addChild(glowEffect)
        }

        const enemy: Enemy = {
            graphics: wobble,
            wobble,
            massRing,
            glowEffect,
            x,
            y,
            vx: overrides?.vx ?? 0,
            vy: overrides?.vy ?? 0,
            health,
            maxHealth,
            speed,
            mass,
            size,
            tier,
            id: this.nextEnemyId++,
            merging: false,
            // Variant fields
            variant: variantId,
            behavior: variant.behavior,
            behaviorState: this.initBehaviorState(variant),
            // Formation fields
            formationId: overrides?.formationId,
        }

        this.enemies.push(enemy)
    }

    /**
     * Initialize behavior state based on variant
     */
    private initBehaviorState(variant: EnemyVariantDef): Enemy['behaviorState'] {
        switch (variant.behavior) {
            case 'charge':
                return {
                    charging: false,
                    chargeCooldown: variant.behaviorParams?.chargeCooldown ?? 2,
                }
            case 'orbit':
                return {
                    orbitAngle: Math.random() * Math.PI * 2,
                }
            case 'zigzag':
                return {
                    zigzagPhase: Math.random() * Math.PI * 2,
                }
            case 'teleport':
                return {
                    fadeAlpha: 1,
                    teleportCooldown: 3,
                }
            default:
                return undefined
        }
    }

    /**
     * Create glow effect for variants
     */
    private createGlowEffect(size: number, color: number, intensity: number): Graphics {
        const glow = new Graphics()
        const glowRadius = size * 0.8

        // Multiple layers for glow effect
        for (let i = 3; i >= 1; i--) {
            const layerRadius = glowRadius * (1 + i * 0.2)
            const layerAlpha = intensity * (0.2 / i)
            glow.circle(0, 0, layerRadius)
            glow.fill({ color, alpha: layerAlpha })
        }

        return glow
    }

    /**
     * Create a mass ring graphic for physics visualization
     * Ring thickness and intensity scale with mass (F = ma visualization)
     */
    private createMassRing(
        size: number,
        mass: number,
        tier: EnemyTier,
        variant?: EnemyVariantDef
    ): Graphics {
        const ring = new Graphics()

        // Ring properties scale with mass
        const ringRadius = size * 0.65
        const strokeWidth = Math.sqrt(mass) * 1.5 + 1 // √m scaling for visual balance
        const baseAlpha = 0.2 + Math.min(mass * 0.03, 0.4) // More opaque for heavier

        // Color based on tier, or variant color if present
        const tierColors: Record<EnemyTier, number> = {
            small: 0x4488ff, // Light blue
            medium: 0x6644ff, // Blue-purple
            large: 0x8844ff, // Purple
            boss: 0xaa44ff, // Bright purple
        }
        const ringColor = variant?.colorTint ?? tierColors[tier]

        ring.circle(0, 0, ringRadius)
        ring.stroke({
            color: ringColor,
            width: strokeWidth,
            alpha: baseAlpha,
        })

        // Add inner glow for medium+ tiers or special variants
        if (tier !== 'small' || (variant && variant.id !== 'normal')) {
            ring.circle(0, 0, ringRadius * 0.85)
            ring.stroke({
                color: ringColor,
                width: strokeWidth * 0.5,
                alpha: baseAlpha * 0.5,
            })
        }

        return ring
    }

    // Update enemy positions with behavior-based movement
    update(delta: number, playerX: number, playerY: number, animPhase: number): void {
        const { width, height } = this.context
        const deltaSeconds = delta / 60

        for (const enemy of this.enemies) {
            const dx = playerX - enemy.x
            const dy = playerY - enemy.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1

            // Apply behavior-specific movement
            this.applyBehavior(enemy, dx, dy, dist, delta, deltaSeconds, animPhase)

            // Apply vortex pull if configured (affects all behaviors)
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

            // Limit speed (allow more overspeed for chargers)
            const maxSpeedMult = enemy.behavior === 'charge' && enemy.behaviorState?.charging ? 4 : 2
            const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy)
            if (speed > enemy.speed * maxSpeedMult) {
                enemy.vx = (enemy.vx / speed) * enemy.speed * maxSpeedMult
                enemy.vy = (enemy.vy / speed) * enemy.speed * maxSpeedMult
            }

            // Apply velocity
            enemy.x += enemy.vx * delta
            enemy.y += enemy.vy * delta

            // Friction on velocity (from stage physics)
            enemy.vx *= this.physicsModifiers.friction
            enemy.vy *= this.physicsModifiers.friction

            // Update positions
            enemy.graphics.position.set(enemy.x, enemy.y)

            // Update mass ring position
            if (enemy.massRing) {
                enemy.massRing.position.set(enemy.x, enemy.y)

                // Pulse effect for boss or special variants
                const variant = getVariant(enemy.variant)
                if (enemy.tier === 'boss' || variant.pulseEffect) {
                    const pulseScale = 1 + Math.sin(animPhase * 3) * 0.15
                    enemy.massRing.scale.set(pulseScale)
                    enemy.massRing.alpha = 0.5 + Math.sin(animPhase * 2) * 0.2
                }
            }

            // Update glow effect position
            if (enemy.glowEffect) {
                enemy.glowEffect.position.set(enemy.x, enemy.y)

                // Pulsing glow
                const pulseAlpha = 0.6 + Math.sin(animPhase * 2) * 0.3
                enemy.glowEffect.alpha = pulseAlpha
            }

            // Update knockback trail (F=ma visualization)
            if (enemy.knockbackTrail && this.context.onAddTrailPoint) {
                const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy)
                if (currentSpeed > 1) {
                    this.context.onAddTrailPoint(enemy.knockbackTrail, enemy.x, enemy.y)
                } else {
                    enemy.knockbackTrail = undefined
                }
            }

            // Animate wobble phase with look direction
            if (enemy.wobble) {
                enemy.wobble.updateOptions({
                    wobblePhase: animPhase,
                    lookDirection: { x: dx / dist, y: dy / dist },
                })
            }
        }
    }

    /**
     * Apply behavior-specific movement
     */
    private applyBehavior(
        enemy: Enemy,
        dx: number,
        dy: number,
        dist: number,
        delta: number,
        deltaSeconds: number,
        animPhase: number
    ): void {
        const accel = 0.1 * delta
        const variant = getVariant(enemy.variant)

        switch (enemy.behavior) {
            case 'chase':
                // Standard chase behavior
                enemy.vx += (dx / dist) * accel * enemy.speed
                enemy.vy += (dy / dist) * accel * enemy.speed
                break

            case 'charge': {
                // Charge then rest behavior
                const state = enemy.behaviorState!
                if (state.charging) {
                    // Charging - move fast in charge direction
                    const chargeSpeed = variant.behaviorParams?.chargeSpeed ?? 8
                    enemy.vx = state.chargeDirection!.x * chargeSpeed
                    enemy.vy = state.chargeDirection!.y * chargeSpeed

                    // Check if we've traveled far enough or hit something
                    state.chargeCooldown! -= deltaSeconds
                    if (state.chargeCooldown! <= 0) {
                        state.charging = false
                        state.chargeCooldown = variant.behaviorParams?.chargeCooldown ?? 2.5
                    }
                } else {
                    // Cooldown - slow chase
                    enemy.vx += (dx / dist) * accel * enemy.speed * 0.3
                    enemy.vy += (dy / dist) * accel * enemy.speed * 0.3

                    state.chargeCooldown! -= deltaSeconds
                    if (state.chargeCooldown! <= 0 && dist < 300) {
                        // Start charging
                        state.charging = true
                        state.chargeDirection = { x: dx / dist, y: dy / dist }
                        state.chargeCooldown = 0.5 // Charge duration
                    }
                }
                break
            }

            case 'orbit': {
                // Orbit around player
                const state = enemy.behaviorState!
                const orbitRadius = variant.behaviorParams?.orbitRadius ?? 100
                const orbitSpeed = variant.behaviorParams?.orbitSpeed ?? 1.5

                state.orbitAngle! += orbitSpeed * deltaSeconds

                // Target position on orbit
                const targetX = dx + Math.cos(state.orbitAngle!) * orbitRadius
                const targetY = dy + Math.sin(state.orbitAngle!) * orbitRadius

                // Move toward orbit position
                const toDist = Math.sqrt(targetX * targetX + targetY * targetY) || 1
                enemy.vx += (targetX / toDist) * accel * enemy.speed
                enemy.vy += (targetY / toDist) * accel * enemy.speed
                break
            }

            case 'zigzag': {
                // Zigzag toward player
                const state = enemy.behaviorState!
                const amplitude = variant.behaviorParams?.zigzagAmplitude ?? 30
                const frequency = variant.behaviorParams?.zigzagFrequency ?? 3

                state.zigzagPhase! += frequency * deltaSeconds

                // Calculate perpendicular direction
                const perpX = -dy / dist
                const perpY = dx / dist
                const zigOffset = Math.sin(state.zigzagPhase!) * amplitude

                // Move toward player with zigzag offset
                const targetDx = dx + perpX * zigOffset
                const targetDy = dy + perpY * zigOffset
                const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy) || 1

                enemy.vx += (targetDx / targetDist) * accel * enemy.speed
                enemy.vy += (targetDy / targetDist) * accel * enemy.speed
                break
            }

            case 'teleport': {
                // Ghost behavior - phase in/out, teleport
                const state = enemy.behaviorState!

                // Fade effect
                state.fadeAlpha = 0.5 + Math.sin(animPhase * 4) * 0.5
                if (enemy.wobble) {
                    enemy.wobble.alpha = state.fadeAlpha!
                }

                // Slow chase
                enemy.vx += (dx / dist) * accel * enemy.speed * 0.5
                enemy.vy += (dy / dist) * accel * enemy.speed * 0.5

                // Random teleport
                state.teleportCooldown! -= deltaSeconds
                if (state.teleportCooldown! <= 0 && dist > 150) {
                    // Teleport closer to player
                    const teleportDist = 80 + Math.random() * 80
                    const teleportAngle = Math.random() * Math.PI * 2
                    enemy.x = enemy.x + dx * 0.5 + Math.cos(teleportAngle) * teleportDist
                    enemy.y = enemy.y + dy * 0.5 + Math.sin(teleportAngle) * teleportDist
                    enemy.vx = 0
                    enemy.vy = 0
                    state.teleportCooldown = 2 + Math.random() * 2
                }
                break
            }

            case 'flee': {
                // Flee when close, chase when far
                if (dist < 150) {
                    // Run away
                    enemy.vx -= (dx / dist) * accel * enemy.speed * 1.5
                    enemy.vy -= (dy / dist) * accel * enemy.speed * 1.5
                } else if (dist > 300) {
                    // Approach slowly
                    enemy.vx += (dx / dist) * accel * enemy.speed * 0.5
                    enemy.vy += (dy / dist) * accel * enemy.speed * 0.5
                }
                // Otherwise maintain distance
                break
            }

            default:
                // Fallback to chase
                enemy.vx += (dx / dist) * accel * enemy.speed
                enemy.vy += (dy / dist) * accel * enemy.speed
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
            // Clean up glow effect
            if (enemy.glowEffect) {
                this.context.enemyContainer.removeChild(enemy.glowEffect)
                enemy.glowEffect.destroy()
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
                // Clean up glow effect
                if (enemy.glowEffect) {
                    this.context.enemyContainer.removeChild(enemy.glowEffect)
                    enemy.glowEffect.destroy()
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
                // Clean up glow effect
                if (enemy.glowEffect) {
                    this.context.enemyContainer.removeChild(enemy.glowEffect)
                    enemy.glowEffect.destroy()
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
            // Clean up glow effect
            if (enemy.glowEffect) {
                this.context.enemyContainer.removeChild(enemy.glowEffect)
                enemy.glowEffect.destroy()
            }
        }
        this.enemies.length = 0
        this.overlapTracker.clear()
        this.pendingMerges = []
        this.nextEnemyId = 0
        // Reset formation system
        this.formationSpawner.reset()
        this.formationTimer = 0
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
        const progress = gameTime / 600 // 0 to 1 over 10 minutes
        const difficultyMult = 1 + Math.pow(progress, 1.5) * 3
        const newMaxHealth = 3 * difficultyMult * config.healthMultiplier
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
