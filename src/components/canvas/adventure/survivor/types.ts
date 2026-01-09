import { Container, Graphics, Text } from 'pixi.js';
import { Wobble } from '../../Wobble';

// Game state type
export type GameState = 'playing' | 'perk-selection' | 'game-over';

// Enemy tier system for merging
export type EnemyTier = 'small' | 'medium' | 'large' | 'boss';

export interface TierConfig {
    size: number;
    healthMultiplier: number;
    speedMultiplier: number;
    color: number;
    canMerge: boolean;
}

export const TIER_CONFIGS: Record<EnemyTier, TierConfig> = {
    small: {
        size: 25,
        healthMultiplier: 1,
        speedMultiplier: 1,
        color: 0x1a1a1a,
        canMerge: true,
    },
    medium: {
        size: 40,
        healthMultiplier: 2.5,
        speedMultiplier: 0.85,
        color: 0x2d1a3d,
        canMerge: true,
    },
    large: {
        size: 60,
        healthMultiplier: 5,
        speedMultiplier: 0.7,
        color: 0x4a1a5d,
        canMerge: true,
    },
    boss: {
        size: 100,
        healthMultiplier: 12,
        speedMultiplier: 0.5,
        color: 0x6a1a7d,
        canMerge: false,
    },
};

export interface Projectile {
    graphics: Graphics;
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    damage: number;
    bounces: number;
    maxBounces: number;
}

export interface Enemy {
    graphics: Container;
    wobble?: Wobble;
    x: number;
    y: number;
    vx: number;
    vy: number;
    health: number;
    maxHealth: number;
    speed: number;
    mass: number;
    size: number;
    // Merge system fields
    tier: EnemyTier;
    id: number;
    merging: boolean;
    mergeTarget?: Enemy;
}

export interface TextEffect {
    timer: number;
    text: Text;
}

export interface HitEffect {
    x: number;
    y: number;
    timer: number;
    graphics: Graphics;
}

export interface PlayerStats {
    damageMultiplier: number;
    fireRateMultiplier: number;
    projectileSpeedMultiplier: number;
    projectileSizeMultiplier: number;
    knockbackMultiplier: number;
    bounceCount: number;
    piercingCount: number;
    explosionRadius: number;
    moveSpeedMultiplier: number;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    projectileSpeedMultiplier: 1,
    projectileSizeMultiplier: 1,
    knockbackMultiplier: 1,
    bounceCount: 0,
    piercingCount: 0,
    explosionRadius: 0,
    moveSpeedMultiplier: 1,
};
