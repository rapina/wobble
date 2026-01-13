import { Formula } from './types'
import { colors } from '../styles/colors'

export const centripetal: Formula = {
    id: 'centripetal',
    name: '구심력',
    nameEn: 'Centripetal Force',
    expression: 'F = mv²/r',
    description: '원운동하는 물체를 중심으로 당기는 힘',
    descriptionEn: 'The force pulling a rotating object toward the center',
    simulationHint: '물체가 원형 궤도를 따라 회전하며 중심 방향으로 힘을 받는 모습',
    simulationHintEn: 'Shows an object rotating in a circular path with force toward the center',
    applications: [
        '놀이공원 회전 놀이기구의 안전 설계',
        '자동차가 커브길을 돌 때 필요한 마찰력 계산',
        '세탁기 탈수 기능의 원리',
        '인공위성의 궤도 속도 계산',
    ],
    applicationsEn: [
        'Safety design for amusement park rides',
        'Calculating friction for cars on curves',
        'How washing machine spin cycles work',
        'Calculating satellite orbital velocity',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: '질량',
            nameEn: 'Mass',
            role: 'input',
            unit: 'kg',
            range: [1, 20],
            default: 5,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 2,
                color: colors.mass,
            },
        },
        {
            symbol: 'v',
            name: '속력',
            nameEn: 'Velocity',
            role: 'input',
            unit: 'm/s',
            range: [1, 10],
            default: 4,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'r',
            name: '반지름',
            nameEn: 'Radius',
            role: 'input',
            unit: 'm',
            range: [1, 10],
            default: 3,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 15,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: '구심력',
            nameEn: 'Centripetal Force',
            role: 'output',
            unit: 'N',
            range: [0, 500],
            default: 26.67,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 5
        const v = inputs.v ?? 4
        const r = inputs.r ?? 3
        return {
            F: (m * v * v) / r,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 5
        const v = inputs.v ?? 4
        const r = inputs.r ?? 3
        const F = (m * v * v) / r
        return `F = ${m.toFixed(1)} × ${v.toFixed(1)}² ÷ ${r.toFixed(1)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'm', to: 'v', operator: '×' },
            { from: 'v', to: 'r', operator: '²' },
            { from: 'r', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'F',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'm' },
                    { type: 'var', symbol: 'v', square: true },
                ],
                denominator: [{ type: 'var', symbol: 'r' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'high-speed-turn',
            mission: '속력 v를 9 이상으로 올리고 반지름 r을 3 이하로 줄여봐!',
            missionEn: 'Raise velocity v above 9 and reduce radius r below 3!',
            result: '빠른 속도로 좁게 돌면 구심력이 급증해! 급커브에서 차가 미끄러지는 이유야.',
            resultEn: 'Fast tight turns require huge centripetal force! This is why cars skid on sharp curves.',
            icon: '🏎️',
            condition: (vars) => vars['v'] >= 9 && vars['r'] <= 3,
        },
        {
            id: 'gentle-curve',
            mission: '반지름 r을 최대(10m)로 늘려봐!',
            missionEn: 'Maximize radius r to 10m!',
            result: '큰 반지름으로 돌면 구심력이 작아져! 고속도로 커브가 완만한 이유야.',
            resultEn: 'Large radius curves need less force! This is why highway curves are gentle.',
            icon: '🛣️',
            condition: (vars) => vars['r'] >= 9,
        },
    ],
}
