import { Formula } from './types'
import { colors } from '../styles/colors'

export const freeFall: Formula = {
    id: 'free-fall',
    name: '자유낙하',
    nameEn: 'Free Fall',
    expression: 'h = ½gt²',
    description: '중력에 의해 자유낙하하는 물체의 이동 거리',
    descriptionEn: 'The distance traveled by an object in free fall under gravity',
    simulationHint: '물체가 중력에 의해 점점 빨라지며 떨어지는 모습',
    simulationHintEn: 'Shows an object accelerating downward under gravity',
    applications: [
        '스카이다이버의 낙하 시간 계산',
        '놀이공원 자이로드롭 설계',
        '갈릴레오의 피사의 사탑 실험',
        '행성 표면 중력 측정',
    ],
    applicationsEn: [
        'Calculating skydiver fall time',
        'Designing amusement park drop towers',
        "Galileo's Leaning Tower of Pisa experiment",
        'Measuring planetary surface gravity',
    ],
    category: 'gravity',
    variables: [
        {
            symbol: 'g',
            name: '중력가속도',
            nameEn: 'Gravitational Accel.',
            role: 'input',
            unit: 'm/s²',
            range: [1, 25],
            default: 9.8,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 5,
                color: colors.force,
            },
        },
        {
            symbol: 't',
            name: '시간',
            nameEn: 'Time',
            role: 'input',
            unit: 's',
            range: [0.5, 10],
            default: 3,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.time,
            },
        },
        {
            symbol: 'h',
            name: '낙하 거리',
            nameEn: 'Fall Distance',
            role: 'output',
            unit: 'm',
            range: [0, 500],
            default: 44.1,
            visual: {
                property: 'distance',
                scale: (value: number) => Math.min(value, 200),
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const g = inputs.g ?? 9.8
        const t = inputs.t ?? 3
        return {
            h: 0.5 * g * t * t,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const g = inputs.g ?? 9.8
        const t = inputs.t ?? 3
        const h = 0.5 * g * t * t
        return `h = ½ × ${g.toFixed(1)} × ${t.toFixed(1)}² = ${h.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'g', to: 't', operator: '×' },
            { from: 't', to: 'h', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'h',
        expression: [
            { type: 'text', value: '½' },
            { type: 'var', symbol: 'g' },
            { type: 'var', symbol: 't', square: true },
        ],
    },
    discoveries: [
        {
            id: 'long-fall',
            mission: '시간 t를 8초 이상으로 늘려봐!',
            missionEn: 'Extend time t above 8 seconds!',
            result: '8초면 약 300m 낙하! 스카이다이버가 낙하산을 펴기 전 거리야.',
            resultEn: 'In 8 seconds you fall about 300m! The distance skydivers fall before opening their chute.',
            icon: '🪂',
            condition: (vars) => vars['t'] >= 8,
        },
        {
            id: 'jupiter-gravity',
            mission: '중력가속도 g를 24 이상으로 올려봐! (목성)',
            missionEn: 'Raise gravitational acceleration g above 24! (Jupiter)',
            result: '목성에서는 같은 시간에 2.5배 더 떨어져! 무거운 행성은 강한 중력을 가져.',
            resultEn: 'On Jupiter you fall 2.5x farther in the same time! Massive planets have strong gravity.',
            icon: '🪐',
            condition: (vars) => vars['g'] >= 24,
        },
    ],
    getInsight: (vars) => {
        const h = vars['h']
        if (h < 5) return { ko: '2층 높이 정도야', en: 'About 2 stories high' }
        if (h < 20) return { ko: '5층 건물 높이야', en: 'Like a 5-story building' }
        if (h < 50) return { ko: '10층 아파트 높이야', en: 'Like a 10-story apartment' }
        if (h < 150) return { ko: '자유의 여신상 높이야!', en: 'Statue of Liberty height!' }
        if (h < 300) return { ko: '에펠탑 높이야!', en: 'Eiffel Tower height!' }
        return { ko: '스카이다이빙 높이야!', en: 'Skydiving height!' }
    },
}
