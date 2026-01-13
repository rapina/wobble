import { Formula } from './types'
import { colors } from '../styles/colors'

export const elasticCollision: Formula = {
    id: 'elastic-collision',
    name: '탄성 충돌',
    nameEn: 'Elastic Collision',
    expression: "e = -(v₂'-v₁')/(v₂-v₁)",
    description: '충돌 전후 상대속도의 비율로 반발 계수를 나타낸다',
    descriptionEn:
        'The coefficient of restitution as the ratio of relative velocities before and after collision',
    simulationHint: '두 물체가 충돌 후 반발 계수에 따라 튕겨나가는 모습',
    simulationHintEn: 'Shows two objects bouncing off each other based on restitution coefficient',
    applications: [
        '당구공 충돌 후 움직임 예측',
        '테니스 라켓과 공의 반발력 설계',
        '자동차 범퍼의 충격 흡수 설계',
        '농구공의 바운스 높이 계산',
    ],
    applicationsEn: [
        'Predicting billiard ball motion after collision',
        'Designing tennis racket rebound',
        'Car bumper shock absorption design',
        'Calculating basketball bounce height',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'm₁',
            name: '질량 1',
            nameEn: 'Mass 1',
            role: 'input',
            unit: 'kg',
            range: [1, 20],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 2,
                color: colors.mass,
            },
        },
        {
            symbol: 'm₂',
            name: '질량 2',
            nameEn: 'Mass 2',
            role: 'input',
            unit: 'kg',
            range: [1, 20],
            default: 5,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 2,
                color: colors.velocity,
            },
        },
        {
            symbol: 'v₁',
            name: '속도 1',
            nameEn: 'Velocity 1',
            role: 'input',
            unit: 'm/s',
            range: [1, 10],
            default: 5,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'e',
            name: '반발 계수',
            nameEn: 'Restitution Coeff.',
            role: 'input',
            unit: '',
            range: [0, 1],
            default: 0.8,
            visual: {
                property: 'glow',
                scale: (value: number) => value * 5,
                color: colors.force,
            },
        },
        {
            symbol: "v₁'",
            name: '충돌 후 속도 1',
            nameEn: 'Velocity 1 After',
            role: 'output',
            unit: 'm/s',
            range: [-10, 10],
            default: 1.67,
            visual: {
                property: 'speed',
                scale: (value: number) => Math.abs(value) * 0.5,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m1 = inputs['m₁'] ?? 10
        const m2 = inputs['m₂'] ?? 5
        const v1 = inputs['v₁'] ?? 5
        const e = inputs.e ?? 0.8
        // v2 = 0 (정지 상태)
        // v1' = (m1 - e*m2) * v1 / (m1 + m2)
        const v1Prime = ((m1 - e * m2) * v1) / (m1 + m2)
        return {
            "v₁'": v1Prime,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m1 = inputs['m₁'] ?? 10
        const m2 = inputs['m₂'] ?? 5
        const v1 = inputs['v₁'] ?? 5
        const e = inputs.e ?? 0.8
        const v1Prime = ((m1 - e * m2) * v1) / (m1 + m2)
        return `v₁' = (${m1.toFixed(0)} - ${e.toFixed(1)}×${m2.toFixed(0)}) × ${v1.toFixed(1)} ÷ ${(m1 + m2).toFixed(0)} = ${v1Prime.toFixed(2)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm₁', to: 'v₁', operator: '×' },
            { from: 'e', to: "v₁'", operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: "v₁'",
        expression: [
            {
                type: 'fraction',
                numerator: [
                    {
                        type: 'group',
                        items: [
                            { type: 'var', symbol: 'm₁' },
                            { type: 'op', value: '-' },
                            { type: 'var', symbol: 'e' },
                            { type: 'var', symbol: 'm₂' },
                        ],
                    },
                    { type: 'var', symbol: 'v₁' },
                ],
                denominator: [
                    { type: 'var', symbol: 'm₁' },
                    { type: 'op', value: '+' },
                    { type: 'var', symbol: 'm₂' },
                ],
            },
        ],
    },
}
