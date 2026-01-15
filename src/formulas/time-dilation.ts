import { Formula } from './types'
import { colors } from '../styles/colors'

export const timeDilation: Formula = {
    id: 'time-dilation',
    name: { ko: '시간 지연', en: 'Time Dilation', ja: '時間の遅れ' },
    expression: 't = t₀/√(1-v²/c²)',
    description: {
        ko: '빠르게 움직이는 물체의 시간은 정지한 관찰자에게 더 느리게 흐른다',
        en: 'Time passes slower for fast-moving objects relative to a stationary observer',
        ja: '高速で動く物体の時間は、静止した観測者にとって遅く流れる',
    },
    simulationHint: {
        ko: '빠르게 움직이는 물체의 시간이 느려지는 모습',
        en: 'Shows time slowing down for fast-moving objects',
        ja: '高速で動く物体の時間が遅くなる様子',
    },
    applications: {
        ko: [
            'GPS 위성의 시간 보정',
            '우주 비행사의 나이가 덜 드는 현상',
            '입자 가속기에서 뮤온의 수명 연장',
            '쌍둥이 역설 사고 실험',
        ],
        en: [
            'GPS satellite time correction',
            'Astronauts aging slower in space',
            'Extended muon lifetime in particle accelerators',
            'Twin paradox thought experiment',
        ],
        ja: [
            'GPS衛星の時間補正',
            '宇宙飛行士が老化しにくい現象',
            '粒子加速器でのミューオンの寿命延長',
            '双子のパラドックス思考実験',
        ],
    },
    category: 'special',
    variables: [
        {
            symbol: 't₀',
            name: { ko: '고유 시간', en: 'Proper Time', ja: '固有時間' },
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
            name: { ko: '속도 (광속의 비율)', en: 'Velocity (fraction of c)', ja: '速度（光速の比率）' },
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
            name: { ko: '지연된 시간', en: 'Dilated Time', ja: '遅れた時間' },
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
    discoveries: [
        {
            id: 'relativistic-speed',
            mission: {
                ko: 'v를 0.9c 이상으로 올려봐!',
                en: 'Raise v above 0.9c!',
                ja: 'vを0.9c以上に上げてみて！',
            },
            result: {
                ko: '광속의 90%에서 시간이 2배 이상 느려져!',
                en: 'At 90% light speed, time slows down by more than 2x!',
                ja: '光速の90%で時間が2倍以上遅くなる！',
            },
            icon: '⏰',
            condition: (vars) => vars['v'] >= 0.9,
        },
        {
            id: 'extreme-dilation',
            mission: {
                ko: 'v를 0.99c까지 올려봐!',
                en: 'Push v to 0.99c!',
                ja: 'vを0.99cまで上げてみて！',
            },
            result: {
                ko: '광속에 가까워지면 시간이 7배 이상 느려져!',
                en: 'Near light speed, time slows down by over 7x!',
                ja: '光速に近づくと時間が7倍以上遅くなる！',
            },
            icon: '🚀',
            condition: (vars) => vars['v'] >= 0.99,
        },
    ],
    getInsight: (vars) => {
        const t = vars['t']
        const t0 = vars['t₀'] ?? 1
        const ratio = t / t0
        if (ratio < 1.01) return { ko: '시간이 거의 똑같아', en: 'Time is almost the same', ja: '時間はほぼ同じだよ' }
        if (ratio < 1.2) return { ko: '시간이 살짝 느려져', en: 'Time slows slightly', ja: '時間が少し遅くなるよ' }
        if (ratio < 2) return { ko: '시간이 눈에 띄게 느려져', en: 'Time noticeably slower', ja: '時間が目に見えて遅くなるよ' }
        if (ratio < 5) return { ko: '시간이 많이 느려져!', en: 'Time slows significantly!', ja: '時間がかなり遅くなる！' }
        return { ko: '시간이 완전 느려져! 우주여행 수준!', en: 'Extreme time dilation! Space travel level!', ja: '時間が大幅に遅くなる！宇宙旅行レベル！' }
    },
}
