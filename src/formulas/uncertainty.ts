import { Formula } from './types'
import { colors } from '../styles/colors'

export const uncertainty: Formula = {
    id: 'uncertainty',
    name: { ko: '불확정성 원리', en: 'Uncertainty Principle', ja: '不確定性原理' },
    expression: 'ΔxΔp ≥ ℏ/2',
    description: {
        ko: '위치를 정확히 알수록 운동량은 불확실해지고, 운동량을 정확히 알수록 위치가 불확실해진다',
        en: 'The more precisely position is known, the less precisely momentum can be known, and vice versa',
        ja: '位置を正確に知るほど運動量は不確かになり、運動量を正確に知るほど位置が不確かになる',
    },
    simulationHint: {
        ko: '입자의 위치가 좁은 영역에 있을수록 운동량이 더 불확실해지는 모습',
        en: 'Shows how momentum becomes more uncertain as position is confined to a smaller region',
        ja: '粒子の位置が狭い領域にあるほど運動量がより不確かになる様子',
    },
    applications: {
        ko: [
            '전자현미경의 해상도 한계',
            '양자점의 에너지 준위 결정',
            '레이저 빔의 최소 폭 제한',
            '원자 스펙트럼의 자연 선폭',
        ],
        en: [
            'Resolution limits of electron microscopes',
            'Determining energy levels in quantum dots',
            'Minimum laser beam width limitations',
            'Natural linewidth in atomic spectra',
        ],
        ja: [
            '電子顕微鏡の解像度限界',
            '量子ドットのエネルギー準位決定',
            'レーザービームの最小幅制限',
            '原子スペクトルの自然線幅',
        ],
    },
    category: 'quantum',
    variables: [
        {
            symbol: 'Δx',
            name: { ko: '위치 불확정성', en: 'Position Uncertainty', ja: '位置の不確定性' },
            role: 'input',
            unit: 'nm',
            range: [0.1, 10],
            default: 1,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 8,
                color: colors.distance,
            },
        },
        {
            symbol: 'Δp',
            name: { ko: '운동량 불확정성', en: 'Momentum Uncertainty', ja: '運動量の不確定性' },
            role: 'output',
            unit: '×10⁻²⁵ kg·m/s',
            range: [0.05, 5.3],
            default: 0.53,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value * 2,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const Dx = inputs['Δx'] ?? 1 // nm
        // ℏ = 1.055 × 10⁻³⁴ J·s
        // Δp ≥ ℏ/(2Δx) = 1.055×10⁻³⁴ / (2 × Δx × 10⁻⁹)
        // = 0.528 × 10⁻²⁵ / Δx (in units of 10⁻²⁵ kg·m/s)
        const Dp = 0.528 / Dx
        return { Δp: Dp }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const Dx = inputs['Δx'] ?? 1
        const Dp = 0.528 / Dx
        return `Δp ≥ ℏ/(2×${Dx.toFixed(1)}) = ${Dp.toFixed(3)}`
    },
    layout: {
        type: 'wave',
        connections: [{ from: 'Δx', to: 'Δp', operator: '=' }],
    },
    displayLayout: {
        type: 'custom',
        output: 'Δp',
        expression: [
            { type: 'text', value: '≥' },
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: 'ℏ' }],
                denominator: [
                    { type: 'text', value: '2' },
                    { type: 'var', symbol: 'Δx' },
                ],
            },
        ],
    },
    getInsight: (vars) => {
        const Dx = vars['Δx']
        const Dp = vars['Δp']
        if (Dx < 0.5)
            return {
                ko: '원자 크기보다 작은 위치 정밀도!',
                en: 'Smaller than atomic size precision!',
                ja: '原子サイズより小さい位置精度！',
            }
        if (Dx < 2)
            return {
                ko: '원자 수준의 위치 정밀도야',
                en: 'Atomic level position precision',
                ja: '原子レベルの位置精度だよ',
            }
        if (Dx < 5)
            return {
                ko: '분자 수준의 위치 정밀도야',
                en: 'Molecular level position precision',
                ja: '分子レベルの位置精度だよ',
            }
        if (Dp < 0.1)
            return {
                ko: '운동량이 꽤 정확해!',
                en: 'Momentum is fairly precise!',
                ja: '運動量がかなり正確！',
            }
        return {
            ko: '거시적 수준의 불확정성이야',
            en: 'Macroscopic level uncertainty',
            ja: '巨視的レベルの不確定性だよ',
        }
    },
    discoveries: [
        {
            id: 'precise-position',
            mission: {
                ko: '위치 불확정성 Δx를 0.3nm 이하로 줄여봐!',
                en: 'Reduce position uncertainty below 0.3nm!',
                ja: '位置の不確定性Δxを0.3nm以下に減らしてみて！',
            },
            result: {
                ko: '위치를 정확히 알수록 운동량이 더 불확실해져! 양자역학의 핵심 원리야.',
                en: 'More precise position means more uncertain momentum! A core principle of quantum mechanics.',
                ja: '位置を正確に知るほど運動量がより不確かになる！量子力学の核心原理だよ。',
            },
            icon: '🎯',
            condition: (vars) => vars['Δx'] <= 0.3,
        },
        {
            id: 'uncertain-position',
            mission: {
                ko: '위치 불확정성 Δx를 8nm 이상으로 늘려봐!',
                en: 'Increase position uncertainty above 8nm!',
                ja: '位置の不確定性Δxを8nm以上に増やしてみて！',
            },
            result: {
                ko: '위치가 불확실하면 운동량은 꽤 정확히 알 수 있어! 두 가지를 동시에 정확히 알 수 없어.',
                en: 'Uncertain position allows more precise momentum! Cannot know both precisely at once.',
                ja: '位置が不確かなら運動量はかなり正確にわかる！両方を同時に正確に知ることはできないよ。',
            },
            icon: '🌊',
            condition: (vars) => vars['Δx'] >= 8,
        },
    ],
}
