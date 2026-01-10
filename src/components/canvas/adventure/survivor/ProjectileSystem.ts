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
            pierces: 0,
            maxPierces: stats.piercingCount,
            hitEnemyIds: new Set(),
            scale: 1,
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

            // 벽 반사 - 탄성 퍼크가 있을 때만 가능
            if (proj.maxBounces > 0) {
                if (proj.x < 0 || proj.x > this.context.width) {
                    proj.vx *= -0.95
                    proj.x = Math.max(0, Math.min(this.context.width, proj.x))
                }
                if (proj.y < 0 || proj.y > this.context.height) {
                    proj.vy *= -0.95
                    proj.y = Math.max(0, Math.min(this.context.height, proj.y))
                }
            }

            proj.graphics.position.set(proj.x, proj.y)

            // 화면 밖으로 나가면 제거
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
        onCreateExplosion: (x: number, y: number) => void,
        onDamageDealt?: (x: number, y: number, damage: number, isCritical: boolean) => void
    ): void {
        for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
            const proj = this.projectiles[pi]
            let shouldRemove = false

            for (const enemy of enemies) {
                // 이미 맞춘 적은 스킵
                if (proj.hitEnemyIds.has(enemy.id)) continue

                const dx = proj.x - enemy.x
                const dy = proj.y - enemy.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                // 탄환 크기에 scale 반영
                const minDist =
                    this.baseSize * stats.projectileSizeMultiplier * proj.scale + enemy.size / 2

                if (dist < minDist) {
                    // Hit!
                    enemy.health -= proj.damage
                    proj.hitEnemyIds.add(enemy.id)

                    // Knockback - 탄환 진행 방향으로 밀기
                    const projSpeed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy)
                    const knockDirX = proj.vx / (projSpeed || 1) // 탄환 진행 방향
                    const knockDirY = proj.vy / (projSpeed || 1)
                    // 탄환 속도 기반 넉백 (적의 크기에 따라 감소하지만 최소값 보장)
                    const baseKnockback = projSpeed * 0.8
                    const massRatio = Math.max(0.3, 1 / Math.sqrt(enemy.mass))
                    const knockback = baseKnockback * massRatio * stats.knockbackMultiplier
                    enemy.vx += knockDirX * knockback
                    enemy.vy += knockDirY * knockback

                    // Hit effect
                    this.createHitEffect(proj.x, proj.y, hitEffects)

                    // Damage callback
                    if (onDamageDealt) {
                        // Critical hit chance (10% base)
                        const isCritical = Math.random() < 0.1
                        const finalDamage = isCritical ? proj.damage * 1.5 : proj.damage
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
                        // 관통 시 데미지 감소 (10% 씩)
                        proj.damage *= 0.9
                        continue // 다음 적도 체크
                    }

                    // 튕김(bounce) 처리: bounce 횟수가 남아있으면 방향 변경
                    if (proj.bounces < proj.maxBounces) {
                        proj.bounces++
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
