import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Decay Chain effect type
 */
export interface DecayChainEffect extends SkillEffect {
    readonly type: 'decay-chain'
    decayChance: number
    halfLife: number
    chainRadius: number
}

/**
 * Decay Chain skill behavior
 * Physics: Radioactive Decay - N = N₀e^(-λt)
 * Chain explosions on enemy death
 */
export class DecayChainBehavior extends BaseSkillBehavior<DecayChainEffect> {
    readonly skillId = 'decay-chain'
    readonly category: SkillCategory = 'trigger'

    protected readonly levelEffects: DecayChainEffect[] = [
        { type: 'decay-chain', decayChance: 0.15, halfLife: 1.5, chainRadius: 60 },
        { type: 'decay-chain', decayChance: 0.2, halfLife: 1.3, chainRadius: 75 },
        { type: 'decay-chain', decayChance: 0.25, halfLife: 1.1, chainRadius: 90 },
        { type: 'decay-chain', decayChance: 0.3, halfLife: 0.9, chainRadius: 110 },
        { type: 'decay-chain', decayChance: 0.4, halfLife: 0.7, chainRadius: 130 },
    ]

    readonly definition: SkillDefinition<DecayChainEffect> = {
        id: 'decay-chain',
        name: { ko: '붕괴 연쇄', en: 'Decay Chain' },
        nameShort: { ko: '붕괴', en: 'Decay' },
        description: {
            ko: '적 처치 시 확률적 연쇄 폭발',
            en: 'Chain explosions on enemy death',
        },
        icon: '☢',
        color: 0x2ecc71,
        maxLevel: 5,
        category: 'trigger',
        activationType: 'passive',
        formulaId: 'radioactive-decay',
        physicsVisualType: 'decay',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            decayChance: effect.decayChance,
            chainRadius: effect.chainRadius,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `확률 ${Math.round(effect.decayChance * 100)}%, 반경 ${effect.chainRadius}`
    }
}

// Create and register the singleton instance
export const decayChainBehavior = new DecayChainBehavior()
registerSkill(decayChainBehavior)
