import { Formula } from './types'
import { colors } from '../styles/colors'

export const coulomb: Formula = {
    id: 'coulomb',
    name: { ko: '쿨롱의 법칙', en: "Coulomb's Law", ja: 'クーロンの法則' },
    expression: 'F = kq₁q₂/r²',
    description: {
        ko: '두 전하 사이에 작용하는 전기력',
        en: 'The electric force between two charges',
        ja: '二つの電荷間に働く電気力',
    },
    simulationHint: {
        ko: '두 전하가 같은 부호면 밀어내고, 다른 부호면 끌어당기는 모습',
        en: 'Shows charges repelling when same sign, attracting when opposite',
        ja: '同じ符号の電荷は反発し、異なる符号は引き合う様子',
    },
    applications: {
        ko: [
            '정전기 방지 제품 설계',
            '복사기와 레이저 프린터의 토너 부착 원리',
            '번개와 정전기 방전 현상 이해',
            '원자 내 전자와 핵 사이의 결합력 계산',
        ],
        en: [
            'Designing anti-static products',
            'Toner adhesion in copiers and laser printers',
            'Understanding lightning and static discharge',
            'Calculating electron-nucleus binding force in atoms',
        ],
        ja: [
            '静電気防止製品の設計',
            'コピー機やレーザープリンターのトナー付着原理',
            '雷と静電気放電の理解',
            '原子内の電子と核の結合力計算',
        ],
    },
    category: 'electricity',
    variables: [
        {
            symbol: 'q₁',
            name: { ko: '전하 1', en: 'Charge 1', ja: '電荷1' },
            role: 'input',
            unit: 'μC',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 0.3,
                color: colors.charge,
            },
        },
        {
            symbol: 'q₂',
            name: { ko: '전하 2', en: 'Charge 2', ja: '電荷2' },
            role: 'input',
            unit: 'μC',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 0.3,
                color: colors.current,
            },
        },
        {
            symbol: 'r',
            name: { ko: '거리', en: 'Distance', ja: '距離' },
            role: 'input',
            unit: 'cm',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 3,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: { ko: '전기력', en: 'Electric Force', ja: '電気力' },
            role: 'output',
            unit: 'N',
            range: [0, 1000],
            default: 89.9,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const q1 = inputs['q₁'] ?? 10
        const q2 = inputs['q₂'] ?? 10
        const r = inputs.r ?? 10
        const k = 8.99e9 // Coulomb's constant
        // Convert μC to C (1e-6) and cm to m (1e-2)
        const q1_C = q1 * 1e-6
        const q2_C = q2 * 1e-6
        const r_m = r * 1e-2
        return {
            F: (k * q1_C * q2_C) / (r_m * r_m),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const q1 = inputs['q₁'] ?? 10
        const q2 = inputs['q₂'] ?? 10
        const r = inputs.r ?? 10
        const k = 8.99e9
        const q1_C = q1 * 1e-6
        const q2_C = q2 * 1e-6
        const r_m = r * 1e-2
        const F = (k * q1_C * q2_C) / (r_m * r_m)
        return `F = k × ${q1.toFixed(0)} × ${q2.toFixed(0)} ÷ ${r.toFixed(0)}² = ${F.toFixed(1)}`
    },
    layout: {
        type: 'orbital',
        connections: [
            { from: 'q₁', to: 'q₂', operator: '×' },
            { from: 'q₂', to: 'r', operator: '÷r²' },
            { from: 'r', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'F',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'text', value: 'k' },
                    { type: 'var', symbol: 'q₁' },
                    { type: 'var', symbol: 'q₂' },
                ],
                denominator: [{ type: 'var', symbol: 'r', square: true }],
            },
        ],
    },
    discoveries: [
        {
            id: 'close-charges',
            mission: {
                ko: '거리 r을 3cm 이하로 줄여봐!',
                en: 'Reduce distance r below 3cm!',
                ja: '距離rを3cm以下に減らしてみて！',
            },
            result: {
                ko: '전하가 가까우면 힘이 급격히 커져! 역제곱 법칙 때문이야.',
                en: 'Close charges experience huge force! Due to the inverse square law.',
                ja: '電荷が近いと力が急激に大きくなる！逆二乗法則のためだよ。',
            },
            icon: '⚡',
            condition: (vars) => vars['r'] <= 3,
        },
        {
            id: 'large-charges',
            mission: {
                ko: '두 전하 q₁과 q₂를 모두 80μC 이상으로 올려봐!',
                en: 'Raise both charges q1 and q2 above 80 microcoulombs!',
                ja: '両方の電荷q₁とq₂を80μC以上に上げてみて！',
            },
            result: {
                ko: '큰 전하는 강한 전기력! 번개가 무서운 에너지를 갖는 이유야.',
                en: 'Large charges mean strong electric force! This is why lightning has tremendous energy.',
                ja: '大きな電荷は強い電気力！雷がすごいエネルギーを持つ理由だよ。',
            },
            icon: '🌩️',
            condition: (vars) => vars['q₁'] >= 80 && vars['q₂'] >= 80,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 1)
            return {
                ko: '정전기 정도의 약한 힘이야',
                en: 'Weak like static electricity',
                ja: '静電気程度の弱い力だよ',
            }
        if (F < 10)
            return {
                ko: '머리카락 끌어당기는 힘이야',
                en: 'Hair-attracting force',
                ja: '髪の毛を引き寄せる力だよ',
            }
        if (F < 100)
            return {
                ko: '풍선 정전기 정도야',
                en: 'Like balloon static',
                ja: '風船の静電気くらいだよ',
            }
        if (F < 500)
            return {
                ko: '상당한 전기력이야',
                en: 'Significant electric force',
                ja: 'かなりの電気力だよ',
            }
        return {
            ko: '번개급 강력한 전기력!',
            en: 'Lightning-level electric force!',
            ja: '雷レベルの強力な電気力だよ！',
        }
    },
}
