import { Container, Graphics } from 'pixi.js'
import { Projectile, PlayerStats, Enemy, HitEffect } from './types'
import { PhysicsModifiers, DEFAULT_PHYSICS, applyVortex } from './PhysicsModifiers'

interface ProjectileSystemContext {
    projectileContainer: Container
    effectContainer: Container
    width: number
    height: number
}

export class ProjectileSystem {
    private context: ProjectileSystemContext
    private baseSpeed = 8
    private baseSize = 6 // Reduced from 8 for zoom-out view

    // Physics modifiers (stage-based)
    private physicsModifiers: PhysicsModifiers = DEFAULT_PHYSICS

    readonly projectiles: Projectile[] = []

    // Elastic bounce counter for physics stats
    private bounceCount = 0
    // Pierce counter for skill stats
    private pierceCount = 0

    // Object pools for performance
    private graphicsPool: Graphics[] = []
    private auraPool: Graphics[] = []
    private readonly MAX_POOL_SIZE = 50

    constructor(context: ProjectileSystemContext) {
        this.context = context
    }

    /**
     * Acquire a graphics object from pool or create new
     */
    private acquireGraphics(size: number): Graphics {
        const graphics = this.graphicsPool.pop() ?? new Graphics()
        graphics.clear()
        graphics.circle(0, 0, size)
        graphics.fill(0xf5b041)
        graphics.circle(0, 0, size * 0.6)
        graphics.stroke({ color: 0xffffff, width: 2 })
        graphics.visible = true
        graphics.alpha = 1
        graphics.scale.set(1)
        return graphics
    }

    /**
     * Release graphics back to pool
     */
    private releaseGraphics(graphics: Graphics): void {
        graphics.visible = false
        this.context.projectileContainer.removeChild(graphics)
        if (this.graphicsPool.length < this.MAX_POOL_SIZE) {
            this.graphicsPool.push(graphics)
        } else {
            graphics.destroy()
        }
    }

    /**
     * Acquire aura from pool or create new
     */
    private acquireAura(size: number): Graphics {
        const aura = this.auraPool.pop() ?? new Graphics()
        aura.clear()
        aura.circle(0, 0, size * 2)
        aura.fill({ color: 0x88ccff, alpha: 0.15 })
        aura.visible = true
        aura.alpha = 1
        aura.scale.set(1)
        return aura
    }

    /**
     * Release aura back to pool
     */
    private releaseAura(aura: Graphics): void {
        aura.visible = false
        this.context.projectileContainer.removeChild(aura)
        if (this.auraPool.length < this.MAX_POOL_SIZE) {
            this.auraPool.push(aura)
        } else {
            aura.destroy()
        }
    }

    updateContext(context: Partial<ProjectileSystemContext>): void {
        this.context = { ...this.context, ...context }
    }

    /**
     * Set physics modifiers for current stage
     */
    setPhysicsModifiers(modifiers: PhysicsModifiers): void {
        this.physicsModifiers = modifiers
    }

    /**
     * Get and reset the elastic bounce count (for physics stats tracking)
     */
    getAndResetBounceCount(): number {
        const count = this.bounceCount
        this.bounceCount = 0
        return count
    }

    /**
     * Get and reset the pierce count (for skill stats tracking)
     */
    getAndResetPierceCount(): number {
        const count = this.pierceCount
        this.pierceCount = 0
        return count
    }

    // Fire projectile towards nearest enemy
    fire(playerX: number, playerY: number, enemies: Enemy[], stats: PlayerStats): void {
        // Find nearest enemy for auto-aim
        let targetX = playerX + 1
        let targetY = playerY
        let nearestDist = Infinity

        for (const enemy of enemies) {
            const dx = enemy.x - playerX
            const dy = enemy.y - playerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < nearestDist) {
                nearestDist = dist
                targetX = enemy.x
                targetY = enemy.y
            }
        }

        // Calculate base direction
        const dx = targetX - playerX
        const dy = targetY - playerY
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const baseDirX = dx / dist
        const baseDirY = dy / dist
        const baseAngle = Math.atan2(baseDirY, baseDirX)

        // Apply stats
        const size = this.baseSize * stats.projectileSizeMultiplier
        const speed = this.baseSpeed * stats.projectileSpeedMultiplier
        // Increased base damage for power fantasy (was 10, now 25)
        const baseDamage = 25 * stats.damageMultiplier
        const maxBounces = stats.bounceCount

        // Spread shot (굴절 분산): fire multiple projectiles
        const spreadCount = stats.spreadCount || 1
        const spreadAngle = (stats.spreadAngle || 0) * (Math.PI / 180) // Convert to radians

        for (let i = 0; i < spreadCount; i++) {
            // Calculate angle offset for this projectile
            let angle = baseAngle
            if (spreadCount > 1) {
                // Distribute projectiles evenly across the spread angle
                const offset = (i / (spreadCount - 1) - 0.5) * spreadAngle
                angle = baseAngle + offset
            }

            const dirX = Math.cos(angle)
            const dirY = Math.sin(angle)

            // Reduce damage per projectile when spread (but not too much for power fantasy)
            const damage = spreadCount > 1 ? baseDamage / Math.sqrt(spreadCount) : baseDamage

            // Acquire projectile graphics from pool
            const graphics = this.acquireGraphics(size)
            graphics.position.set(playerX, playerY)
            this.context.projectileContainer.addChild(graphics)

            // Acquire energy aura from pool
            const energyAura = this.acquireAura(size)
            energyAura.position.set(playerX, playerY)
            // Add aura behind projectile
            this.context.projectileContainer.addChildAt(energyAura, 0)

            const proj: Projectile = {
                graphics,
                energyAura,
                x: playerX,
                y: playerY,
                vx: dirX * speed,
                vy: dirY * speed,
                mass: 1,
                damage,
                bounces: 0,
                maxBounces,
                pierces: 0,
                maxPierces: stats.piercingCount,
                hitEnemyIds: new Set(),
                scale: 1,
                homingTurnRate: stats.homingTurnRate || 0,
                // Elastic return tracking
                originX: stats.returnDistance > 0 ? playerX : undefined,
                originY: stats.returnDistance > 0 ? playerY : undefined,
                returning: false,
                returnDamageMultiplier: stats.returnDamageMultiplier || 1,
            }

            this.projectiles.push(proj)
        }
    }

    // Update projectile positions
    update(
        delta: number,
        enemies: Enemy[] = [],
        stats?: PlayerStats,
        cameraX: number = 0,
        cameraY: number = 0
    ): void {
        const { width, height } = this.context
        const bounce = this.physicsModifiers.bounce
        const returnDistance = stats?.returnDistance || 0

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i]

            // Elastic Return: check if should reverse direction
            if (
                returnDistance > 0 &&
                proj.originX !== undefined &&
                proj.originY !== undefined &&
                !proj.returning
            ) {
                const dxOrigin = proj.x - proj.originX
                const dyOrigin = proj.y - proj.originY
                const distFromOrigin = Math.sqrt(dxOrigin * dxOrigin + dyOrigin * dyOrigin)

                if (distFromOrigin >= returnDistance) {
                    // Reverse direction toward origin
                    proj.returning = true
                    const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy)
                    const dirX = -dxOrigin / distFromOrigin
                    const dirY = -dyOrigin / distFromOrigin
                    proj.vx = dirX * speed
                    proj.vy = dirY * speed
                    // Apply return damage multiplier
                    proj.damage *= proj.returnDamageMultiplier || 1
                    // Clear hit enemies so it can hit on return
                    proj.hitEnemyIds.clear()
                }
            }

            // Skill-based homing (중력 유도): curve toward nearest enemy
            if (proj.homingTurnRate && proj.homingTurnRate > 0 && enemies.length > 0) {
                this.applySkillHoming(proj, enemies, delta)
            }

            // Stage physics: Low-gravity mode homing effect
            if (this.physicsModifiers.gravity > 0 && enemies.length > 0) {
                this.applyTargetGravity(proj, enemies, delta)
            }

            // Apply vortex pull if configured
            if (this.physicsModifiers.vortexCenter && this.physicsModifiers.vortexStrength) {
                const vortexResult = applyVortex(
                    proj.x,
                    proj.y,
                    proj.vx,
                    proj.vy,
                    width,
                    height,
                    {
                        center: this.physicsModifiers.vortexCenter,
                        strength: this.physicsModifiers.vortexStrength * 0.5,
                    },
                    delta,
                    30
                )
                proj.vx = vortexResult.vx
                proj.vy = vortexResult.vy
            }

            // Move
            proj.x += proj.vx * delta
            proj.y += proj.vy * delta

            // Check if returning projectile reached origin
            if (proj.returning && proj.originX !== undefined && proj.originY !== undefined) {
                const dxOrigin = proj.x - proj.originX
                const dyOrigin = proj.y - proj.originY
                const distFromOrigin = Math.sqrt(dxOrigin * dxOrigin + dyOrigin * dyOrigin)
                if (distFromOrigin < 30) {
                    // Reached origin, remove projectile
                    this.remove(i)
                    continue
                }
            }

            // Infinite map - no wall boundaries
            // Wall bounce disabled for infinite map

            proj.graphics.position.set(proj.x, proj.y)

            // Update energy aura based on kinetic energy (KE = ½mv²)
            this.updateEnergyAura(proj)

            // Remove if too far from camera (but not returning projectiles heading to origin)
            const margin = 500 // Larger margin for infinite map
            const dx = Math.abs(proj.x - cameraX)
            const dy = Math.abs(proj.y - cameraY)
            if (!proj.returning && (dx > margin || dy > margin)) {
                this.remove(i)
            }
        }
    }

    /**
     * Apply gravity slingshot effects from gravity wells
     * Returns info about slingshots triggered for visual effects
     */
    applySlingshot(
        slingshotFn: (
            x: number,
            y: number,
            vx: number,
            vy: number,
            deltaSeconds: number
        ) => { vx: number; vy: number; slingshotted: boolean; wellX: number; wellY: number },
        deltaSeconds: number
    ): Array<{ x: number; y: number; wellX: number; wellY: number }> {
        const slingshotEvents: Array<{ x: number; y: number; wellX: number; wellY: number }> = []

        for (const proj of this.projectiles) {
            const result = slingshotFn(proj.x, proj.y, proj.vx, proj.vy, deltaSeconds)

            if (result.slingshotted) {
                proj.vx = result.vx
                proj.vy = result.vy

                slingshotEvents.push({
                    x: proj.x,
                    y: proj.y,
                    wellX: result.wellX,
                    wellY: result.wellY,
                })
            }
        }

        return slingshotEvents
    }

    /**
     * Apply gravitational attraction toward the nearest enemy (target homing)
     * Creates a subtle homing effect that helps hit enemies
     */
    private applyTargetGravity(proj: Projectile, enemies: Enemy[], delta: number): void {
        // Find nearest enemy that hasn't been hit
        const target = this.findNearestEnemy(proj.x, proj.y, enemies, proj.hitEnemyIds)
        if (!target) return

        const dx = target.x - proj.x
        const dy = target.y - proj.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Only apply when reasonably close (not too far, not too close)
        if (dist < 20 || dist > 200) return

        // Gravitational homing: gentle curve toward target
        // Strength based on stage gravity setting
        const homingStrength = this.physicsModifiers.gravity * 2.0

        // Normalize direction to target
        const dirX = dx / dist
        const dirY = dy / dist

        // Apply gentle force toward target
        proj.vx += dirX * homingStrength * delta
        proj.vy += dirY * homingStrength * delta

        // Maintain projectile speed (don't slow down or speed up too much)
        const currentSpeed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy)
        const targetSpeed = this.baseSpeed * 1.0 // Keep original speed
        if (currentSpeed > 0) {
            const speedAdjust = targetSpeed / currentSpeed
            proj.vx *= 0.98 + 0.02 * speedAdjust // Gradual speed normalization
            proj.vy *= 0.98 + 0.02 * speedAdjust
        }
    }

    /**
     * Apply skill-based homing (중력 유도 skill)
     * Uses homingTurnRate to curve projectile toward nearest enemy
     */
    private applySkillHoming(proj: Projectile, enemies: Enemy[], delta: number): void {
        if (!proj.homingTurnRate || proj.homingTurnRate <= 0) return

        // Find nearest enemy that hasn't been hit
        const target = this.findNearestEnemy(proj.x, proj.y, enemies, proj.hitEnemyIds)
        if (!target) return

        const dx = target.x - proj.x
        const dy = target.y - proj.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Only apply when reasonably close
        if (dist < 15 || dist > 300) return

        // Calculate current projectile direction
        const currentSpeed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy)
        if (currentSpeed <= 0) return

        const currentAngle = Math.atan2(proj.vy, proj.vx)
        const targetAngle = Math.atan2(dy, dx)

        // Calculate angle difference (shortest path)
        let angleDiff = targetAngle - currentAngle
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

        // Apply turn rate (radians per second)
        const maxTurn = (proj.homingTurnRate * delta) / 60
        const turn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff))

        // Update velocity direction
        const newAngle = currentAngle + turn
        proj.vx = Math.cos(newAngle) * currentSpeed
        proj.vy = Math.sin(newAngle) * currentSpeed
    }

    // Check collisions with enemies
    checkCollisions(
        enemies: Enemy[],
        stats: PlayerStats,
        hitEffects: HitEffect[],
        onEnemyKilled: () => void,
        onCreateExplosion: (x: number, y: number) => void,
        onDamageDealt?: (x: number, y: number, damage: number, isCritical: boolean) => void,
        onKnockback?: (enemy: Enemy, knockbackX: number, knockbackY: number) => void,
        onPhysicsImpact?: (
            x: number,
            y: number,
            damage: number,
            projectileSpeed: number,
            enemyMass: number,
            knockbackDir: { x: number; y: number }
        ) => void
    ): void {
        for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
            const proj = this.projectiles[pi]
            let shouldRemove = false

            // Cache projectile speed squared for knockback (calculated once per projectile)
            const projSpeedSq = proj.vx * proj.vx + proj.vy * proj.vy

            for (const enemy of enemies) {
                // 이미 맞춘 적은 스킵
                if (proj.hitEnemyIds.has(enemy.id)) continue

                const dx = proj.x - enemy.x
                const dy = proj.y - enemy.y

                // Early culling with Manhattan distance (faster than sqrt)
                const maxRange = 80 // Max possible collision range
                if (Math.abs(dx) > maxRange || Math.abs(dy) > maxRange) continue

                const distSq = dx * dx + dy * dy
                // 탄환 크기에 scale 반영
                const minDist =
                    this.baseSize * stats.projectileSizeMultiplier * proj.scale + enemy.size / 2
                const minDistSq = minDist * minDist

                if (distSq < minDistSq) {
                    // Calculate damage
                    const damage = proj.damage

                    // Hit!
                    enemy.health -= damage
                    proj.hitEnemyIds.add(enemy.id)

                    // Knockback - push in projectile direction (sqrt only on hit)
                    const projSpeed = Math.sqrt(projSpeedSq)
                    const knockDirX = proj.vx / (projSpeed || 1)
                    const knockDirY = proj.vy / (projSpeed || 1)
                    // Base knockback (reduced by enemy mass)
                    const baseKnockback = projSpeed * 0.8
                    const massRatio = Math.max(0.3, 1 / Math.sqrt(enemy.mass))
                    // Apply stage physics knockback modifier
                    const knockback =
                        baseKnockback *
                        massRatio *
                        stats.knockbackMultiplier *
                        this.physicsModifiers.knockbackMult
                    const knockbackVx = knockDirX * knockback
                    const knockbackVy = knockDirY * knockback
                    enemy.vx += knockbackVx
                    enemy.vy += knockbackVy

                    // Trigger knockback trail visualization (F=ma effect)
                    if (onKnockback && knockback > 2) {
                        onKnockback(enemy, knockbackVx, knockbackVy)
                    }

                    // Trigger physics-based impact particles (KE = ½mv²)
                    if (onPhysicsImpact) {
                        onPhysicsImpact(enemy.x, enemy.y, damage, projSpeed, enemy.mass, {
                            x: knockDirX,
                            y: knockDirY,
                        })
                    }

                    // Hit effect
                    this.createHitEffect(proj.x, proj.y, hitEffects)

                    // Damage callback
                    if (onDamageDealt) {
                        // Critical hit chance (10% base)
                        const isCritical = Math.random() < 0.1
                        const finalDamage = isCritical ? damage * 1.5 : damage
                        onDamageDealt(enemy.x, enemy.y - enemy.size / 2, finalDamage, isCritical)
                    }

                    // Explosion effect
                    if (stats.explosionRadius > 0) {
                        onCreateExplosion(proj.x, proj.y)
                    }

                    // Check if enemy died
                    if (enemy.health <= 0) {
                        onEnemyKilled()
                    }

                    // 관통(pierce) 처리: 관통 횟수가 남아있으면 계속 진행
                    if (proj.pierces < proj.maxPierces) {
                        proj.pierces++
                        this.pierceCount++ // Track for skill stats
                        // 관통 시 데미지 감소 (10% 씩)
                        proj.damage *= 0.9
                        continue // 다음 적도 체크
                    }

                    // 튕김(bounce) 처리: bounce 횟수가 남아있으면 방향 변경
                    if (proj.bounces < proj.maxBounces) {
                        proj.bounces++
                        this.bounceCount++ // Track for physics stats
                        // 튕길 때마다 크기 50%로 감소
                        proj.scale *= 0.5
                        proj.graphics.scale.set(proj.scale)
                        // 데미지도 비례해서 감소
                        proj.damage *= 0.5

                        // 크기가 너무 작아지면 제거 (30% 미만)
                        if (proj.scale < 0.3) {
                            shouldRemove = true
                            break
                        }

                        // 튕길 때 새로운 가장 가까운 적 방향으로
                        const nearestEnemy = this.findNearestEnemy(
                            proj.x,
                            proj.y,
                            enemies,
                            proj.hitEnemyIds
                        )
                        if (nearestEnemy) {
                            const tdx = nearestEnemy.x - proj.x
                            const tdy = nearestEnemy.y - proj.y
                            const tdist = Math.sqrt(tdx * tdx + tdy * tdy) || 1
                            const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy) * 0.9
                            proj.vx = (tdx / tdist) * speed
                            proj.vy = (tdy / tdist) * speed
                        } else {
                            // 가까운 적이 없으면 반대 방향으로 튕김
                            proj.vx *= -0.8
                            proj.vy *= -0.8
                        }
                        break // 방향 바꾸고 다음 프레임에서 처리
                    }

                    // 관통도 튕김도 불가능하면 제거
                    shouldRemove = true
                    break
                }
            }

            if (shouldRemove) {
                this.remove(pi)
            }
        }
    }

    // 가장 가까운 적 찾기 (이미 맞춘 적 제외)
    private findNearestEnemy(
        x: number,
        y: number,
        enemies: Enemy[],
        excludeIds: Set<number>
    ): Enemy | null {
        let nearest: Enemy | null = null
        let nearestDist = Infinity

        for (const enemy of enemies) {
            if (excludeIds.has(enemy.id)) continue

            const dx = enemy.x - x
            const dy = enemy.y - y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < nearestDist) {
                nearestDist = dist
                nearest = enemy
            }
        }

        return nearest
    }

    // Create hit effect
    private createHitEffect(x: number, y: number, hitEffects: HitEffect[]): void {
        const effect = new Graphics()
        effect.circle(0, 0, 15)
        effect.fill({ color: 0xffffff, alpha: 0.8 })
        effect.position.set(x, y)
        this.context.effectContainer.addChild(effect)

        hitEffects.push({ x, y, timer: 0.2, graphics: effect })
    }

    /**
     * Create energy aura graphic for kinetic energy visualization
     * KE = ½mv² - visualizes projectile energy through glow
     */
    private createEnergyAura(size: number): Graphics {
        const aura = new Graphics()

        // Outer glow ring
        aura.circle(0, 0, size * 2)
        aura.fill({ color: 0x88ccff, alpha: 0.15 })

        // Inner glow ring
        aura.circle(0, 0, size * 1.4)
        aura.fill({ color: 0xaaddff, alpha: 0.2 })

        return aura
    }

    /**
     * Update energy aura based on current velocity
     * Higher speed = more intense glow (relativistic blue-shift effect)
     */
    private updateEnergyAura(proj: Projectile): void {
        if (!proj.energyAura) return

        // Calculate kinetic energy (KE = ½mv²)
        const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy)
        const kineticEnergy = 0.5 * proj.mass * speed * speed

        // Normalize energy for visual effect (base speed ~8, so KE ~32)
        const normalizedEnergy = Math.min(kineticEnergy / 50, 1)

        // Update position
        proj.energyAura.position.set(proj.x, proj.y)

        // Scale aura based on energy
        const baseScale = proj.scale
        const energyScale = 1 + normalizedEnergy * 0.5
        proj.energyAura.scale.set(baseScale * energyScale)

        // Alpha intensity based on energy
        proj.energyAura.alpha = 0.3 + normalizedEnergy * 0.5

        // Rotation based on movement direction (trail effect)
        const angle = Math.atan2(proj.vy, proj.vx)
        proj.energyAura.rotation = angle

        // Color shift toward blue for high speed (relativistic effect)
        // More intense blue as speed increases
        if (normalizedEnergy > 0.5) {
            // Tint toward bright blue/white for very fast projectiles
            const blueShift = (normalizedEnergy - 0.5) * 2 // 0-1 range above 50%
            proj.graphics.tint = this.lerpColor(0xf5b041, 0x88ddff, blueShift)
        } else {
            proj.graphics.tint = 0xffffff // Normal color
        }
    }

    /**
     * Linear interpolation between two colors
     */
    private lerpColor(color1: number, color2: number, t: number): number {
        const r1 = (color1 >> 16) & 0xff
        const g1 = (color1 >> 8) & 0xff
        const b1 = color1 & 0xff

        const r2 = (color2 >> 16) & 0xff
        const g2 = (color2 >> 8) & 0xff
        const b2 = color2 & 0xff

        const r = Math.round(r1 + (r2 - r1) * t)
        const g = Math.round(g1 + (g2 - g1) * t)
        const b = Math.round(b1 + (b2 - b1) * t)

        return (r << 16) | (g << 8) | b
    }

    // Remove projectile by index
    private remove(index: number): void {
        const proj = this.projectiles[index]
        // Release graphics back to pool
        this.releaseGraphics(proj.graphics)
        // Release energy aura back to pool
        if (proj.energyAura) {
            this.releaseAura(proj.energyAura)
        }
        // Clear hitEnemyIds set
        proj.hitEnemyIds.clear()
        this.projectiles.splice(index, 1)
    }

    /**
     * Check and apply barrier collisions to all projectiles
     * Used for Elastic stage repulsion barriers
     */
    checkBarrierCollisions(
        checkCollision: (
            x: number,
            y: number,
            vx: number,
            vy: number,
            radius: number
        ) => { vx: number; vy: number; bounced: boolean; barrierIndex: number } | null
    ): void {
        const projectileRadius = this.baseSize

        for (const proj of this.projectiles) {
            const result = checkCollision(
                proj.x,
                proj.y,
                proj.vx,
                proj.vy,
                projectileRadius * proj.scale
            )
            if (result && result.bounced) {
                proj.vx = result.vx
                proj.vy = result.vy
            }
        }
    }

    // Reset all projectiles
    reset(): void {
        for (const proj of this.projectiles) {
            this.context.projectileContainer.removeChild(proj.graphics)
            proj.graphics.destroy()
            // Clean up energy aura
            if (proj.energyAura) {
                this.context.projectileContainer.removeChild(proj.energyAura)
                proj.energyAura.destroy()
            }
        }
        this.projectiles.length = 0
    }
}
