import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Flow Stream effect type
 */
export interface FlowStreamEffect extends SkillEffect {
    readonly type: 'flow-stream'
    flowSpeed: number
    suctionForce: number
    streamWidth: number
}

/**
 * Flow Stream skill behavior
 * Physics: Bernoulli's Principle - P + ½ρv² + ρgh = const
 * Fast flow pulls enemies in
 */
export class FlowStreamBehavior extends BaseSkillBehavior<FlowStreamEffect> {
    readonly skillId = 'flow-stream'
    readonly category: SkillCategory = 'aura'

    protected readonly levelEffects: FlowStreamEffect[] = [
        { type: 'flow-stream', flowSpeed: 100, suctionForce: 30, streamWidth: 40 },
        { type: 'flow-stream', flowSpeed: 130, suctionForce: 50, streamWidth: 50 },
        { type: 'flow-stream', flowSpeed: 160, suctionForce: 75, streamWidth: 60 },
        { type: 'flow-stream', flowSpeed: 200, suctionForce: 100, streamWidth: 75 },
        { type: 'flow-stream', flowSpeed: 250, suctionForce: 150, streamWidth: 90 },
    ]

    readonly definition: SkillDefinition<FlowStreamEffect> = {
        id: 'flow-stream',
        name: { ko: '유체 흐름', en: 'Flow Stream' },
        nameShort: { ko: '흐름', en: 'Flow' },
        description: {
            ko: '빠른 흐름이 적을 끌어당김',
            en: 'Fast flow pulls enemies in',
        },
        icon: '≋',
        color: 0x1abc9c,
        maxLevel: 5,
        category: 'aura',
        activationType: 'aura',
        formulaId: 'bernoulli',
        physicsVisualType: 'bernoulli',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            flowSpeed: effect.flowSpeed,
            suctionForce: effect.suctionForce,
            streamWidth: effect.streamWidth,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `속도 ${effect.flowSpeed}, 흡입력 ${effect.suctionForce}`
    }
}

// Create and register the singleton instance
export const flowStreamBehavior = new FlowStreamBehavior()
registerSkill(flowStreamBehavior)
