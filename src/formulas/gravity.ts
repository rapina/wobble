import { Formula } from './types'
import { colors } from '../styles/colors'

export const gravity: Formula = {
    id: 'gravity',
    name: '만유인력',
    nameEn: 'Universal Gravitation',
    expression: 'F = Gm₁m₂/r²',
    description: '두 물체 사이에 작용하는 중력',
    descriptionEn: 'The gravitational force between two objects',
    applications: [
        '행성과 위성의 공전 궤도 계산',
        'GPS 위성의 정확한 위치 보정',
        '로켓이 지구 중력을 탈출하는 데 필요한 속도 계산',
        '조석(밀물/썰물) 현상 예측',
    ],
    applicationsEn: [
        'Calculating planetary and satellite orbits',
        'GPS satellite position correction',
        'Calculating rocket escape velocity',
        'Predicting tides (high/low tide)',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'm1',
            name: '질량 1',
            nameEn: 'Mass 1',
            role: 'input',
            unit: '×10²⁴kg',
            range: [1, 100],
            default: 60,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 0.8,
                color: colors.mass,
            },
        },
        {
            symbol: 'm2',
            name: '질량 2',
            nameEn: 'Mass 2',
            role: 'input',
            unit: '×10²²kg',
            range: [1, 50],
            default: 7,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.6,
                color: colors.velocity,
            },
        },
        {
            symbol: 'r',
            name: '거리',
            nameEn: 'Distance',
            role: 'input',
            unit: '×10⁸m',
            range: [1, 10],
            default: 4,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 30,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: '중력',
            nameEn: 'Gravitational Force',
            role: 'output',
            unit: '×10²⁰N',
            range: [0, 1000],
            default: 100,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.min(value * 0.05, 10),
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m1 = inputs.m1 ?? 60
        const m2 = inputs.m2 ?? 7
        const r = inputs.r ?? 4
        // Simplified: G = 6.67 × 10^-11, scaled for display
        const G = 6.67
        return {
            F: (G * m1 * m2) / (r * r),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m1 = inputs.m1 ?? 60
        const m2 = inputs.m2 ?? 7
        const r = inputs.r ?? 4
        const G = 6.67
        const F = (G * m1 * m2) / (r * r)
        return `F = G × ${m1.toFixed(0)} × ${m2.toFixed(0)} ÷ ${r.toFixed(1)}² = ${F.toFixed(1)}`
    },
    layout: {
        type: 'orbital',
        connections: [
            { from: 'm1', to: 'm2', operator: '×' },
            { from: 'm2', to: 'F', operator: '÷r²' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'F',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'text', value: 'G' },
                    { type: 'var', symbol: 'm1' },
                    { type: 'var', symbol: 'm2' },
                ],
                denominator: [{ type: 'var', symbol: 'r', square: true }],
            },
        ],
    },
}
