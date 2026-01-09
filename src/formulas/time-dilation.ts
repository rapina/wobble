import { Formula } from './types'
import { colors } from '../styles/colors'

export const timeDilation: Formula = {
    id: 'time-dilation',
    name: '시간 지연',
    nameEn: 'Time Dilation',
    expression: 't = t₀/√(1-v²/c²)',
    description: '빠르게 움직이는 물체의 시간은 정지한 관찰자에게 더 느리게 흐른다',
    descriptionEn: 'Time passes slower for fast-moving objects relative to a stationary observer',
    applications: [
        'GPS 위성의 시간 보정',
        '우주 비행사의 나이가 덜 드는 현상',
        '입자 가속기에서 뮤온의 수명 연장',
        '쌍둥이 역설 사고 실험',
    ],
    applicationsEn: [
        'GPS satellite time correction',
        'Astronauts aging slower in space',
        'Extended muon lifetime in particle accelerators',
        'Twin paradox thought experiment',
    ],
    category: 'special',
    variables: [
        {
            symbol: 't₀',
            name: '고유 시간',
            nameEn: 'Proper Time',
            role: 'input',
            unit: 's',
            range: [1, 10],
            default: 1,
            visual: {
                property: 'size',
                scale: (value: number) => value * 10,
                color: colors.time,
            },
        },
        {
            symbol: 'v',
            name: '속도 (광속의 비율)',
            nameEn: 'Velocity (fraction of c)',
            role: 'input',
            unit: 'c',
            range: [0, 0.99],
            default: 0.5,
            visual: {
                property: 'speed',
                scale: (value: number) => value,
                color: colors.velocity,
            },
        },
        {
            symbol: 't',
            name: '지연된 시간',
            nameEn: 'Dilated Time',
            role: 'output',
            unit: 's',
            range: [1, 100],
            default: 1.15,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 10,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const t0 = inputs['t₀'] ?? 1
        const v = inputs['v'] ?? 0.5
        // t = t₀ / √(1 - v²/c²), where v is already in units of c
        const gamma = 1 / Math.sqrt(1 - v * v)
        const t = t0 * gamma
        return { t }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const t0 = inputs['t₀'] ?? 1
        const v = inputs['v'] ?? 0.5
        const gamma = 1 / Math.sqrt(1 - v * v)
        const t = t0 * gamma
        return `t = ${t0.toFixed(1)} / √(1 - ${v.toFixed(2)}²) = ${t.toFixed(2)} s`
    },
    layout: {
        type: 'linear',
        connections: [{ from: 't₀', to: 't', operator: '×' }],
    },
    displayLayout: {
        type: 'custom',
        output: 't',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 't₀' }],
                denominator: [
                    { type: 'text', value: '√(1-' },
                    { type: 'var', symbol: 'v' },
                    { type: 'text', value: '²/c²)' },
                ],
            },
        ],
    },
}
