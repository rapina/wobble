import { Container, Graphics } from 'pixi.js'
import { Projectile, PlayerStats, Enemy, HitEffect } from './types'

interface ProjectileSystemContext {
    projectileContainer: Container
    effectContainer: Container
    width: number
    height: number
}

export class ProjectileSystem {
    private context: ProjectileSystemContext
    private baseSpeed = 8
    private baseSize = 8

    readonly projectiles: Projectile[] = []

    constructor(context: ProjectileSystemContext) {
        this.context = context
    }

    updateContext(context: Partial<ProjectileSystemContext>): void {
        this.context = { ...this.context, ...context }
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

        // Calculate direction
        const dx = targetX - playerX
        const dy = targetY - playerY
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const dirX = dx / dist
        const dirY = dy / dist

        // Apply stats
        const size = this.baseSize * stats.projectileSizeMultiplier
        const speed = this.baseSpeed * stats.projectileSpeedMultiplier
        const damage = 10 * stats.damageMultiplier
        const maxBounces = stats.bounceCount

        // Create projectile graphics
        const graphics = new Graphics()
        graphics.circle(0, 0, size)
        graphics.fill(0xf5b041)
        graphics.circle(0, 0, size * 0.6)
        graphics.stroke({ color: 0xffffff, width: 2 })

        graphics.position.set(playerX, playerY)
        this.context.projectileContainer.addChild(graphics)

        const proj: Projectile = {
            graphics,
            x: playerX,
            y: playerY,
            vx: dirX * speed,
            vy: dirY * speed,
            mass: 1,
            damage,
            bounces: 0,
            maxBounces,
        }

        this.projectiles.push(proj)
    }

    // Update projectile positions
    update(delta: number): void {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i]

            // Move
            proj.x += proj.vx * delta
            proj.y += proj.vy * delta

            // Bounce off walls if has bounces available
            if (proj.bounces < proj.maxBounces) {
                if (proj.x < 0 || proj.x > this.context.width) {
                    proj.vx *= -0.8
                    proj.x = Math.max(0, Math.min(this.context.width, proj.x))
                    proj.bounces++
                }
                if (proj.y < 0 || proj.y > this.context.height) {
                    proj.vy *= -0.8
                    proj.y = Math.max(0, Math.min(this.context.height, proj.y))
                    proj.bounces++
                }
            }

            proj.graphics.position.set(proj.x, proj.y)

            // Remove if out of bounds
            const margin = 50
            if (
                proj.x < -margin ||
                proj.x > this.context.width + margin ||
                proj.y < -margin ||
                proj.y > this.context.height + margin
            ) {
                this.remove(i)
            }
        }
    }

    // Check collisions with enemies
    checkCollisions(
        enemies: Enemy[],
        stats: PlayerStats,
        hitEffects: HitEffect[],
        onEnemyKilled: () => void,
        onCreateExplosion: (x: number, y: number) => void
    ): void {
        for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
            const proj = this.projectiles[pi]

            for (let ei = enemies.length - 1; ei >= 0; ei--) {
                const enemy = enemies[ei]

                const dx = proj.x - enemy.x
                const dy = proj.y - enemy.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const minDist = this.baseSize * stats.projectileSizeMultiplier + enemy.size / 2

                if (dist < minDist) {
                    // Hit!
                    enemy.health -= proj.damage

                    // Knockback
                    const knockback =
                        (proj.mass * Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy)) / enemy.mass
                    const nx = dx / (dist || 1)
                    const ny = dy / (dist || 1)
                    enemy.vx += nx * knockback * 0.5 * stats.knockbackMultiplier
                    enemy.vy += ny * knockback * 0.5 * stats.knockbackMultiplier

                    // Hit effect
                    this.createHitEffect(proj.x, proj.y, hitEffects)

                    // Explosion effect
                    if (stats.explosionRadius > 0) {
                        onCreateExplosion(proj.x, proj.y)
                    }

                    // Remove projectile or bounce
                    if (proj.bounces >= proj.maxBounces) {
                        this.remove(pi)
                    } else {
                        proj.vx = nx * Math.abs(proj.vx) + nx * 2
                        proj.vy = ny * Math.abs(proj.vy) + ny * 2
                        proj.bounces++
                    }

                    // Check if enemy died
                    if (enemy.health <= 0) {
                        onEnemyKilled()
                    }

                    break
                }
            }
        }
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

    // Remove projectile by index
    private remove(index: number): void {
        const proj = this.projectiles[index]
        this.context.projectileContainer.removeChild(proj.graphics)
        proj.graphics.destroy()
        this.projectiles.splice(index, 1)
    }

    // Reset all projectiles
    reset(): void {
        for (const proj of this.projectiles) {
            this.context.projectileContainer.removeChild(proj.graphics)
            proj.graphics.destroy()
        }
        this.projectiles.length = 0
    }
}
