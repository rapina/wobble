import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Beat Pulse effect type
 */
export interface BeatPulseEffect extends SkillEffect {
    readonly type: 'beat-pulse'
    freq1: number
    freq2: number
    beatAmplitude: number
}

/**
 * Beat Pulse skill behavior
 * Physics: Beat Frequency - f_beat = |f₁ - f₂|
 * Interference pattern creates periodic power spikes
 */
export class BeatPulseBehavior extends BaseSkillBehavior<BeatPulseEffect> {
    readonly skillId = 'beat-pulse'
    readonly category: SkillCategory = 'player'

    protected readonly levelEffects: BeatPulseEffect[] = [
        { type: 'beat-pulse', freq1: 5, freq2: 6, beatAmplitude: 0.2 },
        { type: 'beat-pulse', freq1: 5, freq2: 6.5, beatAmplitude: 0.3 },
        { type: 'beat-pulse', freq1: 5, freq2: 7, beatAmplitude: 0.4 },
        { type: 'beat-pulse', freq1: 5, freq2: 7.5, beatAmplitude: 0.55 },
        { type: 'beat-pulse', freq1: 5, freq2: 8, beatAmplitude: 0.7 },
    ]

    readonly definition: SkillDefinition<BeatPulseEffect> = {
        id: 'beat-pulse',
        name: { ko: '맥놀이 펄스', en: 'Beat Pulse' },
        description: {
            ko: '두 주파수 간섭으로 주기적 강화',
            en: 'Interference pattern creates periodic power spikes',
        },
        icon: '∿',
        color: 0x2ecc71,
        maxLevel: 5,
        category: 'player',
        formulaId: 'beat-frequency',
        physicsVisualType: 'beat',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            beatFreq1: effect.freq1,
            beatFreq2: effect.freq2,
            beatAmplitude: effect.beatAmplitude,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        const beatFreq = Math.abs(effect.freq2 - effect.freq1)
        return `맥놀이 ${beatFreq}Hz, 증폭 +${Math.round(effect.beatAmplitude * 100)}%`
    }
}

// Create and register the singleton instance
export const beatPulseBehavior = new BeatPulseBehavior()
registerSkill(beatPulseBehavior)
