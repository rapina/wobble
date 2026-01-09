import { Container, Graphics } from 'pixi.js';
import { Wobble } from '../../Wobble';
import { Enemy, EnemyTier, TIER_CONFIGS, HitEffect } from './types';

interface EnemySystemContext {
    enemyContainer: Container;
    effectContainer: Container;
    width: number;
    height: number;
    baseEnemySpeed: number;
}

interface PendingMerge {
    enemy1: Enemy;
    enemy2: Enemy;
    startTime: number;
}

export class EnemySystem {
    private context: EnemySystemContext;
    private nextEnemyId = 0;
    private overlapTracker: Map<string, number> = new Map();
    private pendingMerges: PendingMerge[] = [];

    readonly mergeThreshold = 0.75; // seconds of overlap before merge
    readonly enemies: Enemy[] = [];

    constructor(context: EnemySystemContext) {
        this.context = context;
    }

    updateContext(context: Partial<EnemySystemContext>): void {
        this.context = { ...this.context, ...context };
    }

    // Spawn enemy at random edge
    spawnAtEdge(gameTime: number): void {
        const side = Math.floor(Math.random() * 4);
        const size = TIER_CONFIGS.small.size;
        let x: number, y: number;

        switch (side) {
            case 0: // top
                x = Math.random() * this.context.width;
                y = -size;
                break;
            case 1: // right
                x = this.context.width + size;
                y = Math.random() * this.context.height;
                break;
            case 2: // bottom
                x = Math.random() * this.context.width;
                y = this.context.height + size;
                break;
            default: // left
                x = -size;
                y = Math.random() * this.context.height;
                break;
        }

        this.spawnAtTier(x, y, 'small', gameTime);
    }

    // Spawn enemy at specific tier
    spawnAtTier(
        x: number,
        y: number,
        tier: EnemyTier,
        gameTime: number,
        overrides?: { vx?: number; vy?: number; health?: number; maxHealth?: number }
    ): void {
        const config = TIER_CONFIGS[tier];
        const difficultyMult = 1 + gameTime / 60;

        const maxHealth = overrides?.maxHealth ?? (20 * difficultyMult * config.healthMultiplier);
        const health = overrides?.health ?? maxHealth;
        const speed = this.context.baseEnemySpeed * (0.8 + Math.random() * 0.4) * config.speedMultiplier;

        const wobble = new Wobble({
            size: config.size,
            color: config.color,
            shape: 'shadow',
            expression: 'angry',
            showShadow: false,
        });
        wobble.position.set(x, y);
        this.context.enemyContainer.addChild(wobble);

        const enemy: Enemy = {
            graphics: wobble,
            wobble,
            x, y,
            vx: overrides?.vx ?? 0,
            vy: overrides?.vy ?? 0,
            health,
            maxHealth,
            speed,
            mass: 2 * config.healthMultiplier,
            size: config.size,
            tier,
            id: this.nextEnemyId++,
            merging: false,
        };

        this.enemies.push(enemy);
    }

    // Update enemy positions (move towards player)
    update(delta: number, playerX: number, playerY: number, animPhase: number): void {
        for (const enemy of this.enemies) {
            const dx = playerX - enemy.x;
            const dy = playerY - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            // Add velocity towards player
            const accel = 0.1 * delta;
            enemy.vx += (dx / dist) * accel * enemy.speed;
            enemy.vy += (dy / dist) * accel * enemy.speed;

            // Limit speed
            const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
            if (speed > enemy.speed) {
                enemy.vx = (enemy.vx / speed) * enemy.speed;
                enemy.vy = (enemy.vy / speed) * enemy.speed;
            }

            // Apply velocity
            enemy.x += enemy.vx * delta;
            enemy.y += enemy.vy * delta;

            // Friction on velocity from knockback
            enemy.vx *= 0.98;
            enemy.vy *= 0.98;

            enemy.graphics.position.set(enemy.x, enemy.y);

            // Animate wobble phase
            if (enemy.wobble) {
                enemy.wobble.updateOptions({
                    wobblePhase: animPhase,
                    lookDirection: { x: dx / dist, y: dy / dist },
                });
            }
        }
    }

    // Check for enemy collisions and potential merges
    checkCollisions(deltaSeconds: number, hitEffects: HitEffect[]): void {
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const e1 = this.enemies[i];
                const e2 = this.enemies[j];

                // Skip if either is already merging
                if (e1.merging || e2.merging) continue;

                const dx = e2.x - e1.x;
                const dy = e2.y - e1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = e1.size / 2 + e2.size / 2;

                if (dist < minDist && dist > 0) {
                    const key = this.getOverlapKey(e1, e2);
                    const tier1 = TIER_CONFIGS[e1.tier];
                    const tier2 = TIER_CONFIGS[e2.tier];

                    // Check merge eligibility: same tier and both can merge
                    if (tier1.canMerge && tier2.canMerge && e1.tier === e2.tier) {
                        const currentOverlap = this.overlapTracker.get(key) || 0;
                        const newOverlap = currentOverlap + deltaSeconds;
                        this.overlapTracker.set(key, newOverlap);

                        if (newOverlap >= this.mergeThreshold) {
                            this.startMerge(e1, e2);
                            this.overlapTracker.delete(key);
                            continue;
                        }
                    } else {
                        this.overlapTracker.delete(key);
                    }

                    // Separate overlapping enemies
                    const nx = dx / dist;
                    const ny = dy / dist;

                    const dvx = e1.vx - e2.vx;
                    const dvy = e1.vy - e2.vy;
                    const dvn = dvx * nx + dvy * ny;

                    if (dvn > 0) {
                        e1.vx -= dvn * nx;
                        e1.vy -= dvn * ny;
                        e2.vx += dvn * nx;
                        e2.vy += dvn * ny;
                    }

                    const overlap = minDist - dist;
                    e1.x -= overlap * nx * 0.5;
                    e1.y -= overlap * ny * 0.5;
                    e2.x += overlap * nx * 0.5;
                    e2.y += overlap * ny * 0.5;
                } else {
                    const key = this.getOverlapKey(e1, e2);
                    this.overlapTracker.delete(key);
                }
            }
        }
    }

    // Update merge animations
    updateMerges(gameTime: number, hitEffects: HitEffect[]): void {
        const mergeDuration = 0.4;

        for (let i = this.pendingMerges.length - 1; i >= 0; i--) {
            const merge = this.pendingMerges[i];
            const elapsed = gameTime - merge.startTime;
            const progress = Math.min(1, elapsed / mergeDuration);

            const e1 = merge.enemy1;
            const e2 = merge.enemy2;

            // Check if either enemy was destroyed
            if (!this.enemies.includes(e1) || !this.enemies.includes(e2)) {
                this.pendingMerges.splice(i, 1);
                continue;
            }

            const totalMass = e1.mass + e2.mass;
            const centerX = (e1.x * e1.mass + e2.x * e2.mass) / totalMass;
            const centerY = (e1.y * e1.mass + e2.y * e2.mass) / totalMass;

            const easeProgress = progress * progress;

            e1.x = e1.x + (centerX - e1.x) * easeProgress * 0.3;
            e1.y = e1.y + (centerY - e1.y) * easeProgress * 0.3;
            e2.x = e2.x + (centerX - e2.x) * easeProgress * 0.3;
            e2.y = e2.y + (centerY - e2.y) * easeProgress * 0.3;

            e1.graphics.position.set(e1.x, e1.y);
            e2.graphics.position.set(e2.x, e2.y);

            const scale = 1 - progress * 0.4;
            e1.wobble?.updateOptions({ scaleX: scale, scaleY: scale });
            e2.wobble?.updateOptions({ scaleX: scale, scaleY: scale });

            if (progress >= 1) {
                this.completeMerge(e1, e2, centerX, centerY, gameTime, hitEffects);
                this.pendingMerges.splice(i, 1);
            }
        }
    }

    // Remove specific enemy
    remove(enemy: Enemy): void {
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            this.context.enemyContainer.removeChild(enemy.graphics);
            enemy.graphics.destroy();
            this.enemies.splice(index, 1);
        }
    }

    // Get dead enemies (call before cleanupDead to know what was killed)
    getDeadEnemies(): Enemy[] {
        return this.enemies.filter(e => e.health <= 0);
    }

    // Remove dead enemies
    cleanupDead(): number {
        let score = 0;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].health <= 0) {
                const enemy = this.enemies[i];
                this.context.enemyContainer.removeChild(enemy.graphics);
                enemy.graphics.destroy();
                this.enemies.splice(i, 1);
                score += 10;
            }
        }
        return score;
    }

    // Cleanup stale overlap tracking
    cleanupOverlapTracker(): void {
        const validIds = new Set(this.enemies.map(e => e.id));

        for (const key of this.overlapTracker.keys()) {
            const [id1, id2] = key.split('-').map(Number);
            if (!validIds.has(id1) || !validIds.has(id2)) {
                this.overlapTracker.delete(key);
            }
        }
    }

    // Reset all enemies
    reset(): void {
        for (const enemy of this.enemies) {
            this.context.enemyContainer.removeChild(enemy.graphics);
            enemy.graphics.destroy();
        }
        this.enemies.length = 0;
        this.overlapTracker.clear();
        this.pendingMerges = [];
        this.nextEnemyId = 0;
    }

    // Private helpers
    private getOverlapKey(e1: Enemy, e2: Enemy): string {
        const minId = Math.min(e1.id, e2.id);
        const maxId = Math.max(e1.id, e2.id);
        return `${minId}-${maxId}`;
    }

    private getNextTier(currentTier: EnemyTier): EnemyTier {
        switch (currentTier) {
            case 'small': return 'medium';
            case 'medium': return 'large';
            case 'large': return 'boss';
            case 'boss': return 'boss';
        }
    }

    private startMerge(e1: Enemy, e2: Enemy): void {
        e1.merging = true;
        e2.merging = true;
        e1.mergeTarget = e2;
        e2.mergeTarget = e1;

        this.pendingMerges.push({
            enemy1: e1,
            enemy2: e2,
            startTime: 0, // Will be set in updateMerges based on gameTime
        });

        // Store start time on the merge itself
        this.pendingMerges[this.pendingMerges.length - 1].startTime = -1; // Marker for "needs gameTime"
    }

    private completeMerge(
        e1: Enemy,
        e2: Enemy,
        centerX: number,
        centerY: number,
        gameTime: number,
        hitEffects: HitEffect[]
    ): void {
        const nextTier = this.getNextTier(e1.tier);
        const config = TIER_CONFIGS[nextTier];

        // Physics: Conservation of momentum
        const totalMass = e1.mass + e2.mass;
        const newVx = (e1.mass * e1.vx + e2.mass * e2.vx) / totalMass;
        const newVy = (e1.mass * e1.vy + e2.mass * e2.vy) / totalMass;

        // Health calculation
        const healthRatio1 = e1.health / e1.maxHealth;
        const healthRatio2 = e2.health / e2.maxHealth;
        const avgHealthRatio = (healthRatio1 + healthRatio2) / 2;
        const difficultyMult = 1 + gameTime / 60;
        const newMaxHealth = 20 * difficultyMult * config.healthMultiplier;
        const newHealth = newMaxHealth * avgHealthRatio;

        // Remove old enemies
        this.remove(e1);
        this.remove(e2);

        // Create merged enemy
        this.spawnAtTier(centerX, centerY, nextTier, gameTime, {
            vx: newVx,
            vy: newVy,
            health: newHealth,
            maxHealth: newMaxHealth,
        });

        // Create merge effect
        this.createMergeEffect(centerX, centerY, config.size, hitEffects);
    }

    private createMergeEffect(x: number, y: number, size: number, hitEffects: HitEffect[]): void {
        const flash = new Graphics();
        flash.circle(0, 0, size * 0.8);
        flash.fill({ color: 0x9b59b6, alpha: 0.8 });
        flash.position.set(x, y);
        this.context.effectContainer.addChild(flash);

        hitEffects.push({ x, y, timer: 0.35, graphics: flash });

        const ring = new Graphics();
        ring.circle(0, 0, size * 0.5);
        ring.stroke({ color: 0xbb79d6, width: 3 });
        ring.position.set(x, y);
        this.context.effectContainer.addChild(ring);

        hitEffects.push({ x, y, timer: 0.4, graphics: ring });
    }
}
