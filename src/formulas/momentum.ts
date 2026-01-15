import { Formula } from './types'
import { colors } from '../styles/colors'

export const momentum: Formula = {
    id: 'momentum',
    name: { ko: '운동량', en: 'Momentum', ja: '運動量' },
    expression: 'p = mv',
    description: { ko: '물체의 운동 상태를 나타내는 물리량', en: 'Physical quantity representing the motion state of an object', ja: '物体の運動状態を表す物理量' },
    simulationHint: { ko: '질량과 속도에 따라 물체의 운동량이 변하는 모습', en: 'Shows how momentum changes with mass and velocity', ja: '質量と速度によって運動量が変わる様子' },
    applications: {
        ko: [
            '당구나 볼링에서 공의 충돌 예측',
            '교통사고 분석 시 차량 속도 추정',
            '우주선 도킹 시 충격 최소화 설계',
            '권투 글러브가 충격을 줄이는 원리',
        ],
        en: [
            'Predicting ball collisions in billiards or bowling',
            'Estimating vehicle speed in traffic accident analysis',
            'Designing minimal impact for spacecraft docking',
            'How boxing gloves reduce impact force',
        ],
        ja: [
            'ビリヤードやボウリングでの衝突予測',
            '交通事故分析での車両速度推定',
            '宇宙船ドッキング時の衝撃最小化設計',
            'ボクシンググローブが衝撃を減らす原理',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: { ko: '질량', en: 'Mass', ja: '質量' },
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
            name: { ko: '속도', en: 'Velocity', ja: '速度' },
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
            name: { ko: '운동량', en: 'Momentum', ja: '運動量' },
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
            mission: { ko: '질량 m을 최대로, 속도 v를 5 이하로 설정해봐!', en: 'Set mass m to max and velocity v below 5!', ja: '質量mを最大に、速度vを5以下に設定してみよう！' },
            result: { ko: '무거운 물체는 느리게 움직여도 큰 운동량을 가져! 화물열차가 위험한 이유야.', en: 'Heavy objects have large momentum even when slow! This is why freight trains are dangerous.', ja: '重い物体はゆっくり動いても大きな運動量を持つ！貨物列車が危険な理由だ。' },
            icon: '🚂',
            condition: (vars) => vars['m'] >= 45 && vars['v'] <= 5,
        },
        {
            id: 'light-fast',
            mission: { ko: '질량 m을 10 이하로, 속도 v를 18 이상으로 설정해봐!', en: 'Set mass m below 10 and velocity v above 18!', ja: '質量mを10以下に、速度vを18以上に設定してみよう！' },
            result: { ko: '가벼운 물체도 빠르면 큰 운동량을 가져! 총알이 위험한 이유야.', en: 'Light objects can have large momentum when fast! This is why bullets are dangerous.', ja: '軽い物体も速ければ大きな運動量を持つ！弾丸が危険な理由だ。' },
            icon: '🎯',
            condition: (vars) => vars['m'] <= 10 && vars['v'] >= 18,
        },
    ],
    getInsight: (vars) => {
        const p = vars['p']
        if (p < 5) return { ko: '걷는 개미의 운동량이야', en: 'Momentum of a walking ant', ja: '歩くアリの運動量' }
        if (p < 20) return { ko: '던진 야구공 정도야', en: 'Like a thrown baseball', ja: '投げた野球ボールくらい' }
        if (p < 100) return { ko: '달리는 사람의 운동량이야', en: "A running person's momentum", ja: '走る人の運動量' }
        if (p < 300) return { ko: '자전거 타는 사람 정도야', en: 'Like a cyclist', ja: '自転車に乗る人くらい' }
        if (p < 600) return { ko: '달리는 사슴의 운동량이야', en: "A running deer's momentum", ja: '走る鹿の運動量' }
        return { ko: '오토바이급 운동량이야!', en: 'Motorcycle-level momentum!', ja: 'バイク級の運動量！' }
    },
}
