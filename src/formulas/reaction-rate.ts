import { Formula } from './types'
import { colors } from '../styles/colors'

export const reactionRate: Formula = {
    id: 'reaction-rate',
    name: { ko: '반응 속도 법칙', en: 'Rate Law', ja: '反応速度則' },
    expression: 'r = k[A]ⁿ',
    description: {
        ko: '반응 속도는 농도의 거듭제곱에 비례한다',
        en: 'Reaction rate is proportional to concentration raised to a power',
        ja: '反応速度は濃度のべき乗に比例する',
    },
    simulationHint: {
        ko: '반응물 농도와 반응 차수에 따른 반응 속도 변화',
        en: 'How reaction rate changes with concentration and reaction order',
        ja: '反応物濃度と反応次数に応じた反応速度の変化',
    },
    applications: {
        ko: [
            '의약품 분해 속도 예측',
            '식품 부패 속도 분석',
            '촉매 효율 평가',
            '산업 화학 공정 최적화',
        ],
        en: [
            'Predicting drug decomposition rates',
            'Analyzing food spoilage rates',
            'Evaluating catalyst efficiency',
            'Optimizing industrial chemical processes',
        ],
        ja: [
            '薬品の分解速度予測',
            '食品の腐敗速度分析',
            '触媒効率の評価',
            '工業化学プロセスの最適化',
        ],
    },
    category: 'chemistry',
    variables: [
        {
            symbol: 'k',
            name: { ko: '속도 상수', en: 'Rate Constant', ja: '速度定数' },
            role: 'input',
            unit: '',
            range: [0.01, 10],
            default: 1,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 10,
                color: colors.catalyst,
            },
        },
        {
            symbol: '[A]',
            name: { ko: '반응물 농도', en: 'Reactant Concentration', ja: '反応物濃度' },
            role: 'input',
            unit: 'M',
            range: [0.1, 5],
            default: 1,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 10,
                color: colors.reactant,
            },
        },
        {
            symbol: 'n',
            name: { ko: '반응 차수', en: 'Reaction Order', ja: '反応次数' },
            role: 'input',
            unit: '',
            range: [0, 3],
            default: 1,
            visual: {
                property: 'speed',
                scale: (value: number) => 0.5 + value * 0.5,
                color: colors.force,
            },
        },
        {
            symbol: 'r',
            name: { ko: '반응 속도', en: 'Reaction Rate', ja: '反応速度' },
            role: 'output',
            unit: 'M/s',
            range: [0, 100],
            default: 1,
            visual: {
                property: 'speed',
                scale: (value: number) => Math.min(2, value / 10),
                color: colors.product,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const k = inputs['k'] ?? 1
        const A = inputs['[A]'] ?? 1
        const n = inputs['n'] ?? 1
        const r = k * Math.pow(A, n)
        return {
            r: Math.max(0, r),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const k = inputs['k'] ?? 1
        const A = inputs['[A]'] ?? 1
        const n = inputs['n'] ?? 1
        const r = k * Math.pow(A, n)
        if (n === 0) {
            return `r = ${k.toFixed(2)} × ${A.toFixed(1)}⁰ = ${r.toFixed(3)} M/s`
        }
        if (n === 1) {
            return `r = ${k.toFixed(2)} × ${A.toFixed(1)} = ${r.toFixed(3)} M/s`
        }
        return `r = ${k.toFixed(2)} × ${A.toFixed(1)}^${n.toFixed(0)} = ${r.toFixed(3)} M/s`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'k', to: '[A]', operator: '×' },
            { from: '[A]', to: 'n', operator: '²' },
            { from: 'n', to: 'r', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'r',
        expression: [
            { type: 'var', symbol: 'k' },
            { type: 'var', symbol: '[A]', square: true },
        ],
    },
    discoveries: [
        {
            id: 'zero-order',
            mission: {
                ko: '반응 차수 n을 0으로 설정해봐!',
                en: 'Set reaction order n to 0!',
                ja: '反応次数nを0に設定してみよう！',
            },
            result: {
                ko: '0차 반응! 농도와 무관하게 일정한 속도로 진행돼. 효소 포화 반응과 비슷해.',
                en: 'Zero-order! Rate is constant regardless of concentration. Like enzyme saturation.',
                ja: '0次反応！濃度に関係なく一定の速度で進行する。酵素飽和反応に似ている。',
            },
            icon: '➡️',
            condition: (vars) => vars['n'] === 0,
        },
        {
            id: 'first-order',
            mission: {
                ko: '반응 차수 n을 1로 설정해봐!',
                en: 'Set reaction order n to 1!',
                ja: '反応次数nを1に設定してみよう！',
            },
            result: {
                ko: '1차 반응! 방사성 붕괴나 약물 대사가 이런 패턴을 따라.',
                en: 'First-order! Radioactive decay and drug metabolism follow this pattern.',
                ja: '1次反応！放射性崩壊や薬物代謝がこのパターンに従う。',
            },
            icon: '📉',
            condition: (vars) => vars['n'] === 1,
        },
        {
            id: 'second-order',
            mission: {
                ko: '반응 차수 n을 2로 설정해봐!',
                en: 'Set reaction order n to 2!',
                ja: '反応次数nを2に設定してみよう！',
            },
            result: {
                ko: '2차 반응! 두 분자가 충돌해야 반응이 일어나. 농도가 2배면 속도는 4배!',
                en: 'Second-order! Two molecules must collide. Double concentration = 4x rate!',
                ja: '2次反応！2つの分子が衝突して反応が起こる。濃度が2倍なら速度は4倍！',
            },
            icon: '💥',
            condition: (vars) => vars['n'] === 2,
        },
        {
            id: 'fast-reaction',
            mission: {
                ko: '반응 속도 r을 10 M/s 이상으로 만들어봐!',
                en: 'Make reaction rate r above 10 M/s!',
                ja: '反応速度rを10 M/s以上にしてみよう！',
            },
            result: {
                ko: '매우 빠른 반응! 폭발 반응이나 효소 촉매 반응 수준이야.',
                en: 'Very fast reaction! Like explosive or enzyme-catalyzed reactions.',
                ja: 'とても速い反応！爆発反応や酵素触媒反応レベルだ。',
            },
            icon: '⚡',
            condition: (vars) => vars['r'] >= 10,
        },
    ],
    getInsight: (vars) => {
        const r = vars['r']
        const n = vars['n']
        let orderText = ''
        if (n === 0) orderText = '0차'
        else if (n === 1) orderText = '1차'
        else if (n === 2) orderText = '2차'
        else orderText = `${n}차`

        if (r < 0.1)
            return {
                ko: `${orderText} 반응, 매우 느림`,
                en: `${n}-order, very slow`,
                ja: `${n}次反応、非常に遅い`,
            }
        if (r < 1)
            return {
                ko: `${orderText} 반응, 느림`,
                en: `${n}-order, slow`,
                ja: `${n}次反応、遅い`,
            }
        if (r < 5)
            return {
                ko: `${orderText} 반응, 보통`,
                en: `${n}-order, moderate`,
                ja: `${n}次反応、普通`,
            }
        if (r < 20)
            return {
                ko: `${orderText} 반응, 빠름`,
                en: `${n}-order, fast`,
                ja: `${n}次反応、速い`,
            }
        return {
            ko: `${orderText} 반응, 매우 빠름!`,
            en: `${n}-order, very fast!`,
            ja: `${n}次反応、非常に速い！`,
        }
    },
}
