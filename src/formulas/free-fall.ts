import { Formula } from './types'
import { colors } from '../styles/colors'

export const freeFall: Formula = {
    id: 'free-fall',
    name: { ko: '자유낙하', en: 'Free Fall', ja: '自由落下' },
    expression: 'h = ½gt²',
    description: {
        ko: '중력에 의해 자유낙하하는 물체의 이동 거리',
        en: 'The distance traveled by an object in free fall under gravity',
        ja: '重力で自由落下する物体の移動距離',
    },
    simulationHint: {
        ko: '물체가 중력에 의해 점점 빨라지며 떨어지는 모습',
        en: 'Shows an object accelerating downward under gravity',
        ja: '物体が重力で加速しながら落ちる様子',
    },
    applications: {
        ko: [
            '스카이다이버의 낙하 시간 계산',
            '놀이공원 자이로드롭 설계',
            '갈릴레오의 피사의 사탑 실험',
            '행성 표면 중력 측정',
        ],
        en: [
            'Calculating skydiver fall time',
            'Designing amusement park drop towers',
            "Galileo's Leaning Tower of Pisa experiment",
            'Measuring planetary surface gravity',
        ],
        ja: [
            'スカイダイバーの落下時間計算',
            '遊園地のフリーフォール設計',
            'ガリレオのピサの斜塔実験',
            '惑星表面の重力測定',
        ],
    },
    category: 'gravity',
    variables: [
        {
            symbol: 'g',
            name: { ko: '중력가속도', en: 'Gravitational Accel.', ja: '重力加速度' },
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
            name: { ko: '시간', en: 'Time', ja: '時間' },
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
            name: { ko: '낙하 거리', en: 'Fall Distance', ja: '落下距離' },
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
            mission: {
                ko: '시간 t를 8초 이상으로 늘려봐!',
                en: 'Extend time t above 8 seconds!',
                ja: '時間tを8秒以上に伸ばしてみて！',
            },
            result: {
                ko: '8초면 약 300m 낙하! 스카이다이버가 낙하산을 펴기 전 거리야.',
                en: 'In 8 seconds you fall about 300m! The distance skydivers fall before opening their chute.',
                ja: '8秒で約300m落下！スカイダイバーがパラシュートを開く前の距離だよ。',
            },
            icon: '🪂',
            condition: (vars) => vars['t'] >= 8,
        },
        {
            id: 'jupiter-gravity',
            mission: {
                ko: '중력가속도 g를 24 이상으로 올려봐! (목성)',
                en: 'Raise gravitational acceleration g above 24! (Jupiter)',
                ja: '重力加速度gを24以上に上げてみて！（木星）',
            },
            result: {
                ko: '목성에서는 같은 시간에 2.5배 더 떨어져! 무거운 행성은 강한 중력을 가져.',
                en: 'On Jupiter you fall 2.5x farther in the same time! Massive planets have strong gravity.',
                ja: '木星では同じ時間で2.5倍落ちる！重い惑星は強い重力を持つよ。',
            },
            icon: '🪐',
            condition: (vars) => vars['g'] >= 24,
        },
    ],
    getInsight: (vars) => {
        const h = vars['h']
        if (h < 5) return { ko: '2층 높이 정도야', en: 'About 2 stories high', ja: '2階くらいの高さだよ' }
        if (h < 20) return { ko: '5층 건물 높이야', en: 'Like a 5-story building', ja: '5階建てビルの高さだよ' }
        if (h < 50) return { ko: '10층 아파트 높이야', en: 'Like a 10-story apartment', ja: '10階建てマンションの高さだよ' }
        if (h < 150) return { ko: '자유의 여신상 높이야!', en: 'Statue of Liberty height!', ja: '自由の女神の高さだよ！' }
        if (h < 300) return { ko: '에펠탑 높이야!', en: 'Eiffel Tower height!', ja: 'エッフェル塔の高さだよ！' }
        return { ko: '스카이다이빙 높이야!', en: 'Skydiving height!', ja: 'スカイダイビングの高さだよ！' }
    },
}
