import { Formula } from './types'
import { colors } from '../styles/colors'

export const torque: Formula = {
    id: 'torque',
    name: { ko: '토크 (돌림힘)', en: 'Torque', ja: 'トルク（回転力）' },
    expression: 'τ = rF sin θ',
    description: {
        ko: '물체를 회전시키는 힘의 효과',
        en: 'The rotational effect of a force',
        ja: '物体を回転させる力の効果',
    },
    simulationHint: {
        ko: '힘의 크기와 회전축까지의 거리에 따라 회전력이 변하는 모습',
        en: 'Shows how rotational force changes with force magnitude and distance from axis',
        ja: '力の大きさと回転軸までの距離に応じて回転力が変わる様子',
    },
    applications: {
        ko: [
            '렌치로 볼트를 조이는 원리',
            '시소의 균형 잡기',
            '자전거 페달 밟기의 효율',
            '문 손잡이가 문 가장자리에 있는 이유',
        ],
        en: [
            'Tightening bolts with a wrench',
            'Balancing a seesaw',
            'Efficiency of pedaling a bicycle',
            'Why door handles are at the edge',
        ],
        ja: [
            'レンチでボルトを締める原理',
            'シーソーのバランス',
            '自転車のペダルをこぐ効率',
            'ドアの取っ手が端にある理由',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'r',
            name: { ko: '거리 (반지름)', en: 'Distance (Radius)', ja: '距離（半径）' },
            role: 'input',
            unit: 'm',
            range: [0.1, 2],
            default: 0.5,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 60,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: { ko: '힘', en: 'Force', ja: '力' },
            role: 'input',
            unit: 'N',
            range: [10, 200],
            default: 50,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.force,
            },
        },
        {
            symbol: 'θ',
            name: { ko: '각도', en: 'Angle', ja: '角度' },
            role: 'input',
            unit: '°',
            range: [0, 90],
            default: 90,
            visual: {
                property: 'stretch',
                scale: (value: number) => 1 + (90 - value) / 180,
                color: colors.velocity,
            },
        },
        {
            symbol: 'τ',
            name: { ko: '토크', en: 'Torque', ja: 'トルク' },
            role: 'output',
            unit: 'N·m',
            range: [0, 400],
            default: 25,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 10,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const r = inputs.r ?? 0.5
        const F = inputs.F ?? 50
        const theta = inputs['θ'] ?? 90
        const thetaRad = (theta * Math.PI) / 180
        return {
            τ: r * F * Math.sin(thetaRad),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const r = inputs.r ?? 0.5
        const F = inputs.F ?? 50
        const theta = inputs['θ'] ?? 90
        const thetaRad = (theta * Math.PI) / 180
        const tau = r * F * Math.sin(thetaRad)
        return `τ = ${r.toFixed(2)} × ${F.toFixed(0)} × sin(${theta.toFixed(0)}°) = ${tau.toFixed(2)}`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'r', to: 'F', operator: '×' },
            { from: 'F', to: 'θ', operator: '×' },
            { from: 'θ', to: 'τ', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'τ',
        expression: [
            { type: 'var', symbol: 'r' },
            { type: 'var', symbol: 'F' },
            { type: 'text', value: 'sin' },
            { type: 'var', symbol: 'θ' },
        ],
    },
    getInsight: (vars) => {
        const tau = vars['τ']
        if (tau < 5)
            return {
                ko: '문고리 살짝 돌리는 정도야',
                en: 'Barely turning a door handle',
                ja: 'ドアノブをそっと回す程度',
            }
        if (tau < 20)
            return {
                ko: '병뚜껑 여는 정도야',
                en: 'Opening a bottle cap',
                ja: 'ボトルキャップを開ける程度',
            }
        if (tau < 50)
            return {
                ko: '렌치로 볼트 조이는 힘이야',
                en: 'Tightening a bolt with a wrench',
                ja: 'レンチでボルトを締める力',
            }
        if (tau < 100)
            return {
                ko: '자전거 페달 밟는 힘이야',
                en: 'Pedaling a bicycle',
                ja: '自転車のペダルをこぐ力',
            }
        if (tau < 200)
            return {
                ko: '무거운 문을 여는 힘이야',
                en: 'Opening a heavy door',
                ja: '重いドアを開ける力',
            }
        return { ko: '엔진급 회전력!', en: 'Engine-level torque!', ja: 'エンジン級の回転力！' }
    },
    discoveries: [
        {
            id: 'lever-arm',
            mission: {
                ko: '거리 r을 1.5m 이상으로 늘려봐!',
                en: 'Extend distance r above 1.5m!',
                ja: '距離rを1.5m以上に伸ばしてみて！',
            },
            result: {
                ko: '팔 길이가 길면 작은 힘으로도 큰 토크! 긴 렌치가 볼트를 쉽게 푸는 이유야.',
                en: 'Longer lever arm means more torque with less force! Why long wrenches loosen bolts easily.',
                ja: '腕の長さが長いと小さい力でも大きなトルク！長いレンチがボルトを簡単に緩める理由だよ。',
            },
            icon: '🔧',
            condition: (vars) => vars['r'] >= 1.5,
        },
        {
            id: 'perpendicular-force',
            mission: {
                ko: '각도 θ를 90°로 설정해봐!',
                en: 'Set angle θ to 90 degrees!',
                ja: '角度θを90°に設定してみて！',
            },
            result: {
                ko: '수직으로 힘을 가하면 토크가 최대! 문을 수직으로 밀 때 가장 쉽게 열리는 이유야.',
                en: 'Perpendicular force gives maximum torque! This is why doors open easiest when pushed straight.',
                ja: '垂直に力を加えるとトルクが最大！ドアをまっすぐ押すと一番簡単に開く理由だよ。',
            },
            icon: '🚪',
            condition: (vars) => vars['θ'] >= 85 && vars['θ'] <= 90,
        },
    ],
}
