import { Formula } from './types'
import { colors } from '../styles/colors'

export const hooke: Formula = {
    id: 'hooke',
    name: '훅의 법칙',
    nameEn: "Hooke's Law",
    expression: 'F = -kx',
    description: '스프링이 늘어나거나 줄어든 길이에 비례하여 복원력이 작용한다',
    descriptionEn: 'Restoring force is proportional to the spring displacement',
    simulationHint: '스프링이 늘어나고 줄어들며 복원력이 작용하는 모습',
    simulationHintEn: 'Shows a spring stretching and compressing with restoring force',
    applications: [
        '자동차 서스펜션 설계',
        '침대 매트리스의 탄성 조절',
        '체중계의 스프링 눈금 설계',
        '트램폴린과 방방이의 탄성 설계',
    ],
    applicationsEn: [
        'Designing car suspension systems',
        'Adjusting mattress elasticity',
        'Designing spring scales for weight measurement',
        'Designing elasticity for trampolines and bouncy houses',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'k',
            name: '스프링 상수',
            nameEn: 'Spring Constant',
            role: 'input',
            unit: 'N/m',
            range: [10, 100],
            default: 50,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 10,
                color: colors.spring,
            },
        },
        {
            symbol: 'x',
            name: '변위',
            nameEn: 'Displacement',
            role: 'input',
            unit: 'm',
            range: [0.1, 2],
            default: 0.5,
            visual: {
                property: 'stretch',
                scale: (value: number) => value * 50,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: '복원력',
            nameEn: 'Restoring Force',
            role: 'output',
            unit: 'N',
            range: [0, 200],
            default: 25,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 0.3,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const k = inputs.k ?? 50
        const x = inputs.x ?? 0.5
        return {
            F: k * x,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const k = inputs.k ?? 50
        const x = inputs.x ?? 0.5
        const F = k * x
        return `F = ${k.toFixed(0)} × ${x.toFixed(2)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'spring',
        connections: [
            { from: 'k', to: 'x', operator: '×' },
            { from: 'x', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['k', 'x'],
    },
    discoveries: [
        {
            id: 'stiff-spring',
            mission: '스프링 상수 k를 80 이상으로 올려봐!',
            missionEn: 'Raise spring constant k above 80!',
            result: '딱딱한 스프링은 조금만 늘어나도 큰 힘으로 복원해!',
            resultEn: 'A stiff spring restores with great force even with small stretch!',
            icon: '🔩',
            condition: (vars) => vars['k'] >= 80,
        },
        {
            id: 'max-stretch',
            mission: '변위 x를 최대(2m)로 늘려봐!',
            missionEn: 'Stretch displacement x to maximum (2m)!',
            result: '스프링을 많이 늘리면 복원력이 엄청나게 커져! 너무 늘리면 스프링이 망가질 수 있어.',
            resultEn: 'Stretching too far creates huge restoring force! Too much can damage the spring.',
            icon: '⚠️',
            condition: (vars) => vars['x'] >= 1.8,
        },
    ],
}
