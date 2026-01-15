import { Formula } from './types'
import { colors } from '../styles/colors'

export const pendulum: Formula = {
    id: 'pendulum',
    name: { ko: '단진자 주기', en: 'Simple Pendulum', ja: '単振り子の周期' },
    expression: 'T = 2π√(L/g)',
    description: {
        ko: '진자가 한 번 왕복하는 시간',
        en: 'The time for a pendulum to complete one full swing',
        ja: '振り子が一往復する時間',
    },
    simulationHint: {
        ko: '진자가 좌우로 흔들리며 길이에 따라 주기가 변하는 모습',
        en: 'Shows a pendulum swinging with period changing based on length',
        ja: '振り子が左右に揺れ、長さによって周期が変わる様子',
    },
    applications: {
        ko: [
            '괘종시계의 정확한 시간 측정',
            '지진계의 진동 감지',
            '중력 가속도 정밀 측정',
            '메트로놈의 박자 조절',
        ],
        en: [
            'Precise timekeeping in grandfather clocks',
            'Seismograph vibration detection',
            'Precision measurement of gravitational acceleration',
            'Metronome tempo adjustment',
        ],
        ja: [
            '振り子時計の正確な時間測定',
            '地震計の振動検知',
            '重力加速度の精密測定',
            'メトロノームのテンポ調整',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'L',
            name: { ko: '줄 길이', en: 'String Length', ja: '紐の長さ' },
            role: 'input',
            unit: 'm',
            range: [0.5, 5],
            default: 2,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 40,
                color: colors.distance,
            },
        },
        {
            symbol: 'g',
            name: { ko: '중력가속도', en: 'Gravitational Accel.', ja: '重力加速度' },
            role: 'input',
            unit: 'm/s²',
            range: [1, 20],
            default: 9.8,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.3,
                color: colors.velocity,
            },
        },
        {
            symbol: 'T',
            name: { ko: '주기', en: 'Period', ja: '周期' },
            role: 'output',
            unit: 's',
            range: [0, 10],
            default: 2.84,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.time,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const L = inputs.L ?? 2
        const g = inputs.g ?? 9.8
        return {
            T: 2 * Math.PI * Math.sqrt(L / g),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const L = inputs.L ?? 2
        const g = inputs.g ?? 9.8
        const T = 2 * Math.PI * Math.sqrt(L / g)
        return `T = 2π × √(${L.toFixed(1)} ÷ ${g.toFixed(1)}) = ${T.toFixed(2)}`
    },
    layout: {
        type: 'pendulum',
        connections: [
            { from: 'L', to: 'g', operator: '÷' },
            { from: 'g', to: 'T', operator: '√' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'T',
        expression: [
            { type: 'text', value: '2π' },
            { type: 'text', value: '√' },
            {
                type: 'group',
                items: [
                    {
                        type: 'fraction',
                        numerator: [{ type: 'var', symbol: 'L' }],
                        denominator: [{ type: 'var', symbol: 'g' }],
                    },
                ],
            },
        ],
    },
    discoveries: [
        {
            id: 'long-pendulum',
            mission: {
                ko: '줄 길이 L을 4m 이상으로 늘려봐!',
                en: 'Extend string length L above 4m!',
                ja: '紐の長さLを4m以上にしてみよう！',
            },
            result: {
                ko: '긴 진자는 천천히 흔들려! 괘종시계가 긴 진자를 쓰는 이유야.',
                en: 'Long pendulums swing slowly! That is why grandfather clocks use long pendulums.',
                ja: '長い振り子はゆっくり揺れる！振り子時計が長い振り子を使う理由だ。',
            },
            icon: '🕰️',
            condition: (vars) => vars['L'] >= 4,
        },
        {
            id: 'moon-gravity',
            mission: {
                ko: '중력가속도 g를 2 이하로 낮춰봐! (달에서의 진자)',
                en: 'Lower gravitational acceleration g below 2! (pendulum on Moon)',
                ja: '重力加速度gを2以下にしてみよう！（月での振り子）',
            },
            result: {
                ko: '중력이 약하면 진자가 아주 느리게 흔들려! 달에서 시계는 느리게 갈 거야.',
                en: 'With weak gravity, pendulums swing very slowly! A clock on the Moon would run slow.',
                ja: '重力が弱いと振り子はとてもゆっくり揺れる！月では時計がゆっくり進むだろう。',
            },
            icon: '🌙',
            condition: (vars) => vars['g'] <= 2,
        },
    ],
    getInsight: (vars) => {
        const T = vars['T']
        if (T < 1)
            return { ko: '째깍째깍 빠른 시계야', en: 'Fast ticking clock', ja: 'チクタク速い時計' }
        if (T < 2) return { ko: '심장 박동 정도야', en: 'Like a heartbeat', ja: '心臓の鼓動くらい' }
        if (T < 3)
            return { ko: '괘종시계 정도야', en: 'Like a grandfather clock', ja: '振り子時計くらい' }
        if (T < 5)
            return {
                ko: '그네 타는 느낌이야',
                en: 'Like swinging on a swing',
                ja: 'ブランコに乗る感じ',
            }
        return { ko: '아주 느린 진동이야', en: 'Very slow oscillation', ja: 'とても遅い振動' }
    },
}
