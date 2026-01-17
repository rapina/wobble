import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Heat Chain effect type
 */
export interface HeatChainEffect extends SkillEffect {
    readonly type: 'heat-chain'
    conductRange: number
    conductRatio: number
    maxChain: number
}

/**
 * Heat Chain skill behavior
 * Physics: Thermal Conduction - Q/t = kA(ΔT/Δx)
 * Damage conducts to nearby enemies
 */
export class HeatChainBehavior extends BaseSkillBehavior<HeatChainEffect> {
    readonly skillId = 'heat-chain'
    readonly category: SkillCategory = 'trigger'

    protected readonly levelEffects: HeatChainEffect[] = [
        { type: 'heat-chain', conductRange: 50, conductRatio: 0.3, maxChain: 2 },
        { type: 'heat-chain', conductRange: 60, conductRatio: 0.4, maxChain: 3 },
        { type: 'heat-chain', conductRange: 70, conductRatio: 0.5, maxChain: 4 },
        { type: 'heat-chain', conductRange: 80, conductRatio: 0.6, maxChain: 5 },
        { type: 'heat-chain', conductRange: 100, conductRatio: 0.7, maxChain: 7 },
    ]

    readonly definition: SkillDefinition<HeatChainEffect> = {
        id: 'heat-chain',
        name: { ko: '열 전도 체인', en: 'Heat Chain' },
        nameShort: { ko: '열전도', en: 'Heat' },
        description: {
            ko: '데미지가 인접한 적에게 전도됨',
            en: 'Damage conducts to nearby enemies',
        },
        icon: '⫘',
        color: 0xe67e22,
        maxLevel: 5,
        category: 'trigger',
        activationType: 'passive',
        formulaId: 'thermal-conduction',
        physicsVisualType: 'conduction',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            conductRange: effect.conductRange,
            conductRatio: effect.conductRatio,
            maxChain: effect.maxChain,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `범위 ${effect.conductRange}, 전달 ${Math.round(effect.conductRatio * 100)}%, 연쇄 ${effect.maxChain}회`
    }
}

// Create and register the singleton instance
export const heatChainBehavior = new HeatChainBehavior()
registerSkill(heatChainBehavior)
