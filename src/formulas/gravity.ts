import { Formula } from './types'
import { colors } from '../styles/colors'

export const gravity: Formula = {
    id: 'gravity',
    name: { ko: '만유인력', en: 'Universal Gravitation', ja: '万有引力' },
    expression: 'F = Gm₁m₂/r²',
    description: { ko: '두 물체 사이에 작용하는 중력', en: 'The gravitational force between two objects', ja: '二つの物体間に働く重力' },
    simulationHint: { ko: '두 물체가 질량과 거리에 따라 서로 끌어당기는 모습', en: 'Shows two objects attracting each other based on mass and distance', ja: '質量と距離に応じて二つの物体が引き合う様子' },
    applications: {
        ko: [
            '행성과 위성의 공전 궤도 계산',
            'GPS 위성의 정확한 위치 보정',
            '로켓이 지구 중력을 탈출하는 데 필요한 속도 계산',
            '조석(밀물/썰물) 현상 예측',
        ],
        en: [
            'Calculating planetary and satellite orbits',
            'GPS satellite position correction',
            'Calculating rocket escape velocity',
            'Predicting tides (high/low tide)',
        ],
        ja: [
            '惑星や衛星の軌道計算',
            'GPS衛星の位置補正',
            'ロケットの脱出速度計算',
            '潮汐（満潮/干潮）の予測',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'm1',
            name: { ko: '질량 1', en: 'Mass 1', ja: '質量1' },
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
            name: { ko: '질량 2', en: 'Mass 2', ja: '質量2' },
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
            name: { ko: '거리', en: 'Distance', ja: '距離' },
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
            name: { ko: '중력', en: 'Gravitational Force', ja: '重力' },
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
    discoveries: [
        {
            id: 'close-encounter',
            mission: { ko: '거리 r을 2 이하로 줄여봐!', en: 'Reduce distance r below 2!', ja: '距離rを2以下に減らしてみよう！' },
            result: { ko: '거리가 반으로 줄면 중력은 4배가 돼!', en: 'Halving the distance quadruples the gravity!', ja: '距離が半分になると重力は4倍になる！' },
            icon: '🌍',
            condition: (vars) => vars.r <= 2,
        },
        {
            id: 'massive-gravity',
            mission: { ko: '질량을 둘 다 최대로 올려봐!', en: 'Max out both masses!', ja: '両方の質量を最大にしてみよう！' },
            result: { ko: '거대한 질량이 만드는 엄청난 중력!', en: 'Massive objects create enormous gravity!', ja: '巨大な質量が生み出す強大な重力！' },
            icon: '⭐',
            condition: (vars) => vars.m1 >= 90 && vars.m2 >= 45,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 10) return { ko: '미세한 중력이야', en: 'Tiny gravitational pull', ja: '微小な重力' }
        if (F < 50) return { ko: '작은 위성의 중력 정도야', en: "Like a small moon's gravity", ja: '小さな衛星の重力くらい' }
        if (F < 200) return { ko: '지구-달 중력 수준이야', en: 'Earth-Moon level gravity', ja: '地球-月レベルの重力' }
        if (F < 500) return { ko: '행성급 중력이야!', en: 'Planetary-level gravity!', ja: '惑星級の重力！' }
        return { ko: '항성급 강력한 중력!', en: 'Stellar-level strong gravity!', ja: '恒星級の強力な重力！' }
    },
}
