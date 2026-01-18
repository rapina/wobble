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
    waveDamage: number
    waveCount: number // Number of wave rings per pulse
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
        { type: 'wave-pulse', wavelength: 60, amplitude: 25, waveSpeed: 150, waveDamage: 12, waveCount: 2 },
        { type: 'wave-pulse', wavelength: 70, amplitude: 30, waveSpeed: 170, waveDamage: 16, waveCount: 2 },
        { type: 'wave-pulse', wavelength: 80, amplitude: 35, waveSpeed: 190, waveDamage: 20, waveCount: 3 },
        { type: 'wave-pulse', wavelength: 90, amplitude: 40, waveSpeed: 210, waveDamage: 25, waveCount: 3 },
        { type: 'wave-pulse', wavelength: 100, amplitude: 50, waveSpeed: 250, waveDamage: 32, waveCount: 4 },
    ]

    readonly definition: SkillDefinition<WavePulseEffect> = {
        id: 'wave-pulse',
        name: { ko: '파동 펄스', en: 'Wave Pulse' },
        nameShort: { ko: '파동', en: 'Wave' },
        description: {
            ko: '사인파처럼 퍼지는 데미지 파동',
            en: 'Damage spreads in sine wave patterns',
        },
        icon: '∿',
        color: 0x3498db,
        maxLevel: 5,
        category: 'player',
        activationType: 'active',
        baseCooldown: 2,
        formulaId: 'wave',
        physicsVisualType: 'wave',
        tags: ['wave'], // Base skill - provides wave capability
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            wavelength: effect.wavelength,
            waveAmplitude: effect.amplitude,
            waveSpeed: effect.waveSpeed,
            waveDamage: effect.waveDamage,
            waveCount: effect.waveCount,
            wavePulseInterval: 2, // 2 second cooldown (faster than Centripetal's 5s)
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `데미지 ${effect.waveDamage}, 파동 ${effect.waveCount}개, 속도 ${effect.waveSpeed}`
    }
}

// Create and register the singleton instance
export const wavePulseBehavior = new WavePulseBehavior()
registerSkill(wavePulseBehavior)
