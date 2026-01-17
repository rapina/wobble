import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Wave Pulse effect type
 */
export interface WavePulseEffect extends SkillEffect {
    readonly type: 'wave-pulse'
    wavelength: number
    amplitude: number
    waveSpeed: number
}

/**
 * Wave Pulse skill behavior
 * Physics: Wave Equation - v = fλ
 * Damage spreads in sine wave patterns
 */
export class WavePulseBehavior extends BaseSkillBehavior<WavePulseEffect> {
    readonly skillId = 'wave-pulse'
    readonly category: SkillCategory = 'player'

    protected readonly levelEffects: WavePulseEffect[] = [
        { type: 'wave-pulse', wavelength: 50, amplitude: 20, waveSpeed: 100 },
        { type: 'wave-pulse', wavelength: 60, amplitude: 30, waveSpeed: 120 },
        { type: 'wave-pulse', wavelength: 70, amplitude: 40, waveSpeed: 140 },
        { type: 'wave-pulse', wavelength: 80, amplitude: 50, waveSpeed: 160 },
        { type: 'wave-pulse', wavelength: 100, amplitude: 60, waveSpeed: 200 },
    ]

    readonly definition: SkillDefinition<WavePulseEffect> = {
        id: 'wave-pulse',
        name: { ko: '파동 펄스', en: 'Wave Pulse' },
        description: {
            ko: '사인파처럼 퍼지는 데미지 파동',
            en: 'Damage spreads in sine wave patterns',
        },
        icon: '∿',
        color: 0x3498db,
        maxLevel: 5,
        category: 'player',
        formulaId: 'wave',
        physicsVisualType: 'wave',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            wavelength: effect.wavelength,
            waveAmplitude: effect.amplitude,
            waveSpeed: effect.waveSpeed,
            wavePulseInterval: effect.wavelength > 0 ? 2 : 0, // 2 second interval
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `파장 ${effect.wavelength}, 진폭 ${effect.amplitude}, 속도 ${effect.waveSpeed}`
    }
}

// Create and register the singleton instance
export const wavePulseBehavior = new WavePulseBehavior()
registerSkill(wavePulseBehavior)
