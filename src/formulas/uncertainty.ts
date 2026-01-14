import { Formula } from './types'
import { colors } from '../styles/colors'

export const uncertainty: Formula = {
    id: 'uncertainty',
    name: '불확정성 원리',
    nameEn: 'Uncertainty Principle',
    expression: 'ΔxΔp ≥ ℏ/2',
    description: '위치를 정확히 알수록 운동량은 불확실해지고, 운동량을 정확히 알수록 위치가 불확실해진다',
    descriptionEn:
        'The more precisely position is known, the less precisely momentum can be known, and vice versa',
    simulationHint: '입자의 위치가 좁은 영역에 있을수록 운동량이 더 불확실해지는 모습',
    simulationHintEn: 'Shows how momentum becomes more uncertain as position is confined to a smaller region',
    applications: [
        '전자현미경의 해상도 한계',
        '양자점의 에너지 준위 결정',
        '레이저 빔의 최소 폭 제한',
        '원자 스펙트럼의 자연 선폭',
    ],
    applicationsEn: [
        'Resolution limits of electron microscopes',
        'Determining energy levels in quantum dots',
        'Minimum laser beam width limitations',
        'Natural linewidth in atomic spectra',
    ],
    category: 'quantum',
    variables: [
        {
            symbol: 'Δx',
            name: '위치 불확정성',
            nameEn: 'Position Uncertainty',
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
            name: '운동량 불확정성',
            nameEn: 'Momentum Uncertainty',
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
        return { 'Δp': Dp }
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
        if (Dx < 0.5) return { ko: '원자 크기보다 작은 위치 정밀도!', en: 'Smaller than atomic size precision!' }
        if (Dx < 2) return { ko: '원자 수준의 위치 정밀도야', en: 'Atomic level position precision' }
        if (Dx < 5) return { ko: '분자 수준의 위치 정밀도야', en: 'Molecular level position precision' }
        if (Dp < 0.1) return { ko: '운동량이 꽤 정확해!', en: 'Momentum is fairly precise!' }
        return { ko: '거시적 수준의 불확정성이야', en: 'Macroscopic level uncertainty' }
    },
    discoveries: [
        {
            id: 'precise-position',
            mission: '위치 불확정성 Δx를 0.3nm 이하로 줄여봐!',
            missionEn: 'Reduce position uncertainty below 0.3nm!',
            result: '위치를 정확히 알수록 운동량이 더 불확실해져! 양자역학의 핵심 원리야.',
            resultEn: 'More precise position means more uncertain momentum! A core principle of quantum mechanics.',
            icon: '🎯',
            condition: (vars) => vars['Δx'] <= 0.3,
        },
        {
            id: 'uncertain-position',
            mission: '위치 불확정성 Δx를 8nm 이상으로 늘려봐!',
            missionEn: 'Increase position uncertainty above 8nm!',
            result: '위치가 불확실하면 운동량은 꽤 정확히 알 수 있어! 두 가지를 동시에 정확히 알 수 없어.',
            resultEn: 'Uncertain position allows more precise momentum! Cannot know both precisely at once.',
            icon: '🌊',
            condition: (vars) => vars['Δx'] >= 8,
        },
    ],
}
