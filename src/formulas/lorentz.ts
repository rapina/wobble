import { Formula } from './types'
import { colors } from '../styles/colors'

export const lorentz: Formula = {
    id: 'lorentz',
    name: { ko: '로렌츠 힘', en: 'Lorentz Force', ja: 'ローレンツ力' },
    expression: 'F = qvB',
    description: {
        ko: '자기장 속에서 운동하는 전하에 작용하는 힘',
        en: 'The force acting on a moving charge in a magnetic field',
        ja: '磁場中を運動する電荷に働く力',
    },
    simulationHint: {
        ko: '자기장 속에서 움직이는 전하가 휘어지는 모습',
        en: 'Shows a moving charge curving in a magnetic field',
        ja: '磁場中で動く電荷が曲がる様子',
    },
    applications: {
        ko: [
            '전동기(모터)의 회전 원리',
            'MRI 의료 영상 장비',
            '입자가속기에서 입자 경로 제어',
            '오로라 현상의 원리',
        ],
        en: [
            'How electric motors rotate',
            'MRI medical imaging equipment',
            'Controlling particle paths in accelerators',
            'The physics behind aurora phenomena',
        ],
        ja: [
            '電動モーターの回転原理',
            'MRI医療画像装置',
            '粒子加速器での粒子経路制御',
            'オーロラ現象の原理',
        ],
    },
    category: 'electricity',
    variables: [
        {
            symbol: 'q',
            name: { ko: '전하량', en: 'Charge', ja: '電荷量' },
            role: 'input',
            unit: 'μC',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 0.2,
                color: colors.charge,
            },
        },
        {
            symbol: 'v',
            name: { ko: '속력', en: 'Velocity', ja: '速度' },
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
            symbol: 'B',
            name: { ko: '자기장 세기', en: 'Magnetic Field', ja: '磁場の強さ' },
            role: 'input',
            unit: 'T',
            range: [0.1, 2],
            default: 0.5,
            visual: {
                property: 'glow',
                scale: (value: number) => value * 3,
                color: colors.current,
            },
        },
        {
            symbol: 'F',
            name: { ko: '로렌츠 힘', en: 'Lorentz Force', ja: 'ローレンツ力' },
            role: 'output',
            unit: 'mN',
            range: [0, 4000],
            default: 25,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 500,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const q = inputs.q ?? 10 // μC
        const v = inputs.v ?? 5 // m/s
        const B = inputs.B ?? 0.5 // T
        // F = qvB (q in μC → multiply by 1e-6 for C, result in N → multiply by 1e3 for mN)
        // F(mN) = q(μC) × v(m/s) × B(T) × 1e-6 × 1e3 = q × v × B × 1e-3
        return {
            F: q * v * B,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const q = inputs.q ?? 10
        const v = inputs.v ?? 5
        const B = inputs.B ?? 0.5
        const F = q * v * B
        return `F = ${q.toFixed(0)} × ${v.toFixed(1)} × ${B.toFixed(2)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'q', to: 'v', operator: '×' },
            { from: 'v', to: 'B', operator: '×' },
            { from: 'B', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['q', 'v', 'B'],
    },
    discoveries: [
        {
            id: 'strong-field',
            mission: {
                ko: '자기장 세기 B를 1.5T 이상으로 올려봐!',
                en: 'Raise magnetic field B above 1.5T!',
                ja: '磁場の強さBを1.5T以上に上げてみて！',
            },
            result: {
                ko: '강한 자기장은 큰 힘! MRI가 강력한 자석을 사용하는 이유야.',
                en: 'Strong magnetic field means strong force! This is why MRI uses powerful magnets.',
                ja: '強い磁場は大きな力！MRIが強力な磁石を使う理由だよ。',
            },
            icon: '🧲',
            condition: (vars) => vars['B'] >= 1.5,
        },
        {
            id: 'fast-particle',
            mission: {
                ko: '속력 v를 15m/s 이상으로 올리고 전하 q를 50 이상으로 설정해봐!',
                en: 'Raise velocity v above 15m/s and charge q above 50!',
                ja: '速度vを15m/s以上、電荷qを50以上に設定してみて！',
            },
            result: {
                ko: '빠른 전하는 강하게 휘어져! 입자가속기가 자기장으로 경로를 제어해.',
                en: 'Fast charges curve strongly! Particle accelerators use magnetic fields to control paths.',
                ja: '速い電荷は強く曲がる！粒子加速器が磁場で経路を制御するんだよ。',
            },
            icon: '🔬',
            condition: (vars) => vars['v'] >= 15 && vars['q'] >= 50,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 10) return { ko: '아주 약한 로렌츠 힘이야', en: 'Very weak Lorentz force', ja: 'とても弱いローレンツ力' }
        if (F < 100) return { ko: '나침반 바늘 움직이는 힘이야', en: 'Force to move compass needle', ja: '方位磁針を動かす力' }
        if (F < 500) return { ko: '작은 모터의 힘이야', en: 'Small motor force', ja: '小さいモーターの力' }
        if (F < 1500) return { ko: '선풍기 모터 정도야', en: 'Like a fan motor', ja: '扇風機モーター程度' }
        return { ko: '산업용 모터급 힘!', en: 'Industrial motor level force!', ja: '産業用モーター級の力！' }
    },
}
