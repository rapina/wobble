import { Formula } from './types'
import { colors } from '../styles/colors'

export const debroglie: Formula = {
    id: 'debroglie',
    name: '드브로이 파장',
    nameEn: 'De Broglie Wavelength',
    expression: 'λ = h/p',
    description: '모든 물질은 파동성을 가지며, 그 파장은 운동량에 반비례한다',
    descriptionEn:
        'All matter has wave properties, with wavelength inversely proportional to momentum',
    simulationHint: '입자가 파동처럼 퍼져나가며 운동량에 따라 파장이 변하는 모습',
    simulationHintEn: 'Shows a particle spreading like a wave with wavelength changing based on momentum',
    applications: [
        '전자현미경의 초고해상도 원리',
        '반도체 칩의 나노 구조 설계',
        '양자 컴퓨터의 기본 원리',
        '물질의 파동-입자 이중성 증명',
    ],
    applicationsEn: [
        'Ultra-high resolution electron microscopy',
        'Designing nano-scale semiconductor chips',
        'Fundamental principles of quantum computers',
        'Demonstrating wave-particle duality',
    ],
    category: 'special',
    variables: [
        {
            symbol: 'm',
            name: '질량',
            nameEn: 'Mass',
            role: 'input',
            unit: '×10⁻³¹ kg',
            range: [1, 100],
            default: 9.1,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 0.5,
                color: colors.mass,
            },
        },
        {
            symbol: 'v',
            name: '속도',
            nameEn: 'Velocity',
            role: 'input',
            unit: '×10⁶ m/s',
            range: [0.1, 10],
            default: 1,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'λ',
            name: '드브로이 파장',
            nameEn: 'De Broglie Wavelength',
            role: 'output',
            unit: 'nm',
            range: [0, 10],
            default: 0.73,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 9.1 // ×10⁻³¹ kg
        const v = inputs.v ?? 1 // ×10⁶ m/s
        // h = 6.626 × 10⁻³⁴ J·s
        // p = mv = m × 10⁻³¹ × v × 10⁶ = mv × 10⁻²⁵ kg·m/s
        // λ = h/p = 6.626 × 10⁻³⁴ / (mv × 10⁻²⁵) = 6.626 / (mv) × 10⁻⁹ m = 0.6626 / (mv) nm
        const lambda = 0.6626 / (m * v)
        return { λ: lambda }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 9.1
        const v = inputs.v ?? 1
        const p = m * v
        const lambda = 0.6626 / p
        return `λ = h ÷ (${m.toFixed(1)} × ${v.toFixed(1)}) = ${lambda.toFixed(3)}`
    },
    layout: {
        type: 'wave',
        connections: [
            { from: 'm', to: 'v', operator: '×' },
            { from: 'v', to: 'λ', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'λ',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: 'h' }],
                denominator: [
                    { type: 'var', symbol: 'm' },
                    { type: 'op', value: '×' },
                    { type: 'var', symbol: 'v' },
                ],
            },
        ],
    },
    getInsight: (vars) => {
        const lambda = vars['λ']
        if (lambda > 1) return { ko: '긴 파장! 파동성이 뚜렷해', en: 'Long wavelength! Clear wave behavior' }
        if (lambda > 0.1) return { ko: '전자현미경 수준의 파장이야', en: 'Electron microscope level wavelength' }
        if (lambda > 0.01) return { ko: '원자 크기 수준의 파장이야', en: 'Atomic scale wavelength' }
        if (lambda > 0.001) return { ko: '핵 크기 수준! 매우 짧은 파장', en: 'Nuclear scale! Very short wavelength' }
        return { ko: '입자성이 지배적! 파동을 관측하기 어려워', en: 'Particle behavior dominates! Hard to observe waves' }
    },
    discoveries: [
        {
            id: 'electron-wave',
            mission: '전자 질량(9.1)과 낮은 속도(0.5 이하)를 설정해봐!',
            missionEn: 'Set electron mass (9.1) and low velocity (below 0.5)!',
            result: '느린 전자는 파장이 길어 파동성이 뚜렷해! 전자현미경의 원리야.',
            resultEn: 'Slow electrons have long wavelengths showing clear wave behavior! This is how electron microscopes work.',
            icon: '🔬',
            condition: (vars) => vars['m'] <= 15 && vars['v'] <= 0.5,
        },
        {
            id: 'heavy-particle',
            mission: '질량 m을 80 이상으로 올려봐!',
            missionEn: 'Raise mass m above 80!',
            result: '무거운 입자는 파장이 매우 짧아! 그래서 일상의 물체는 파동성을 못 느껴.',
            resultEn: 'Heavy particles have very short wavelengths! This is why everyday objects do not show wave behavior.',
            icon: '⚾',
            condition: (vars) => vars['m'] >= 80,
        },
    ],
}
