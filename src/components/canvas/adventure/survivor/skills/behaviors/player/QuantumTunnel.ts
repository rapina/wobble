import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Quantum Tunnel effect type
 */
export interface QuantumTunnelEffect extends SkillEffect {
    readonly type: 'quantum-tunnel'
    ghostCooldown: number
    ghostDuration: number
    ghostDamage: number
    ghostTrailCount: number
}

/**
 * Quantum Tunnel skill behavior
 * Physics: Quantum Tunneling
 * Phase through enemies in ghost mode
 */
export class QuantumTunnelBehavior extends BaseSkillBehavior<QuantumTunnelEffect> {
    readonly skillId = 'quantum-tunnel'
    readonly category: SkillCategory = 'player'

    protected readonly levelEffects: QuantumTunnelEffect[] = [
        { type: 'quantum-tunnel', ghostCooldown: 8, ghostDuration: 0.5, ghostDamage: 10, ghostTrailCount: 2 },
        { type: 'quantum-tunnel', ghostCooldown: 7, ghostDuration: 0.7, ghostDamage: 15, ghostTrailCount: 3 },
        { type: 'quantum-tunnel', ghostCooldown: 6, ghostDuration: 1.0, ghostDamage: 20, ghostTrailCount: 4 },
        { type: 'quantum-tunnel', ghostCooldown: 5, ghostDuration: 1.2, ghostDamage: 30, ghostTrailCount: 5 },
        { type: 'quantum-tunnel', ghostCooldown: 4, ghostDuration: 1.5, ghostDamage: 40, ghostTrailCount: 6 },
    ]

    readonly definition: SkillDefinition<QuantumTunnelEffect> = {
        id: 'quantum-tunnel',
        name: { ko: '양자 터널링', en: 'Quantum Tunnel' },
        nameShort: { ko: '터널', en: 'Tunnel' },
        description: {
            ko: '고스트 모드로 적을 통과하며 데미지',
            en: 'Phase through enemies in ghost mode',
        },
        icon: '👻',
        color: 0x8e44ad,
        maxLevel: 5,
        category: 'player',
        activationType: 'active',
        baseCooldown: 8,
        formulaId: 'tunneling',
        physicsVisualType: 'quantum',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            ghostCooldown: effect.ghostCooldown,
            ghostDuration: effect.ghostDuration,
            ghostDamage: effect.ghostDamage,
            ghostTrailCount: effect.ghostTrailCount,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `쿨다운 ${effect.ghostCooldown}초, 지속 ${effect.ghostDuration}초, 데미지 ${effect.ghostDamage}`
    }
}

// Create and register the singleton instance
export const quantumTunnelBehavior = new QuantumTunnelBehavior()
registerSkill(quantumTunnelBehavior)
