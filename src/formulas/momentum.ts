import { Formula } from './types'
import { colors } from '../styles/colors'

export const momentum: Formula = {
    id: 'momentum',
    name: '운동량',
    nameEn: 'Momentum',
    expression: 'p = mv',
    description: '물체의 운동 상태를 나타내는 물리량',
    descriptionEn: 'Physical quantity representing the motion state of an object',
    simulationHint: '질량과 속도에 따라 물체의 운동량이 변하는 모습',
    simulationHintEn: 'Shows how momentum changes with mass and velocity',
    applications: [
        '당구나 볼링에서 공의 충돌 예측',
        '교통사고 분석 시 차량 속도 추정',
        '우주선 도킹 시 충격 최소화 설계',
        '권투 글러브가 충격을 줄이는 원리',
    ],
    applicationsEn: [
        'Predicting ball collisions in billiards or bowling',
        'Estimating vehicle speed in traffic accident analysis',
        'Designing minimal impact for spacecraft docking',
        'How boxing gloves reduce impact force',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: '질량',
            nameEn: 'Mass',
            role: 'input',
            unit: 'kg',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 40 + value * 1.5,
                color: colors.mass,
            },
        },
        {
            symbol: 'v',
            name: '속도',
            nameEn: 'Velocity',
            role: 'input',
            unit: 'm/s',
            range: [1, 20],
            default: 5,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'p',
            name: '운동량',
            nameEn: 'Momentum',
            role: 'output',
            unit: 'kg·m/s',
            range: [0, 1000],
            default: 50,
            visual: {
                property: 'shake',
                scale: (value: number) => Math.min(value * 0.02, 8),
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const v = inputs.v ?? 5
        return {
            p: m * v,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const v = inputs.v ?? 5
        const p = m * v
        return `p = ${m.toFixed(0)} × ${v.toFixed(1)} = ${p.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm', to: 'v', operator: '×' },
            { from: 'v', to: 'p', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'p',
        numerator: ['m', 'v'],
    },
    discoveries: [
        {
            id: 'heavy-slow',
            mission: '질량 m을 최대로, 속도 v를 5 이하로 설정해봐!',
            missionEn: 'Set mass m to max and velocity v below 5!',
            result: '무거운 물체는 느리게 움직여도 큰 운동량을 가져! 화물열차가 위험한 이유야.',
            resultEn: 'Heavy objects have large momentum even when slow! This is why freight trains are dangerous.',
            icon: '🚂',
            condition: (vars) => vars['m'] >= 45 && vars['v'] <= 5,
        },
        {
            id: 'light-fast',
            mission: '질량 m을 10 이하로, 속도 v를 18 이상으로 설정해봐!',
            missionEn: 'Set mass m below 10 and velocity v above 18!',
            result: '가벼운 물체도 빠르면 큰 운동량을 가져! 총알이 위험한 이유야.',
            resultEn: 'Light objects can have large momentum when fast! This is why bullets are dangerous.',
            icon: '🎯',
            condition: (vars) => vars['m'] <= 10 && vars['v'] >= 18,
        },
    ],
}
