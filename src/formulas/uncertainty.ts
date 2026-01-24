import { Formula } from './types'
import { colors } from '../styles/colors'

export const uncertainty: Formula = {
    id: 'uncertainty',
    name: {
        ko: '불확정성 원리',
        en: 'Uncertainty Principle',
        ja: '不確定性原理',
        es: 'Principio de Incertidumbre',
        pt: 'Princípio da Incerteza',
        'zh-CN': '不确定性原理',
        'zh-TW': '不確定性原理',
    },
    expression: 'ΔxΔp ≥ ℏ/2',
    description: {
        ko: '위치를 정확히 알수록 운동량은 불확실해지고, 운동량을 정확히 알수록 위치가 불확실해진다',
        en: 'The more precisely position is known, the less precisely momentum can be known, and vice versa',
        ja: '位置を正確に知るほど運動量は不確かになり、運動量を正確に知るほど位置が不確かになる',
        es: 'Cuanto más precisamente se conoce la posición, menos precisamente se puede conocer el momento, y viceversa',
        pt: 'Quanto mais precisamente a posição é conhecida, menos precisamente o momento pode ser conhecido, e vice-versa',
        'zh-CN': '位置知道得越精确，动量就越不确定，反之亦然',
        'zh-TW': '位置知道得越精確，動量就越不確定，反之亦然',
    },
    simulationHint: {
        ko: '입자의 위치가 좁은 영역에 있을수록 운동량이 더 불확실해지는 모습',
        en: 'Shows how momentum becomes more uncertain as position is confined to a smaller region',
        ja: '粒子の位置が狭い領域にあるほど運動量がより不確かになる様子',
        es: 'Muestra cómo el momento se vuelve más incierto a medida que la posición se confina a una región más pequeña',
        pt: 'Mostra como o momento se torna mais incerto à medida que a posição é confinada a uma região menor',
        'zh-CN': '显示当位置被限制在更小的区域时动量如何变得更加不确定',
        'zh-TW': '顯示當位置被限制在更小的區域時動量如何變得更加不確定',
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
        es: [
            'Límites de resolución de microscopios electrónicos',
            'Determinación de niveles de energía en puntos cuánticos',
            'Limitaciones del ancho mínimo del haz láser',
            'Ancho de línea natural en espectros atómicos',
        ],
        pt: [
            'Limites de resolução de microscópios eletrônicos',
            'Determinação de níveis de energia em pontos quânticos',
            'Limitações da largura mínima do feixe de laser',
            'Largura de linha natural em espectros atômicos',
        ],
        'zh-CN': [
            '电子显微镜的分辨率极限',
            '量子点能级的确定',
            '激光束最小宽度限制',
            '原子光谱的自然线宽',
        ],
        'zh-TW': [
            '電子顯微鏡的解析度極限',
            '量子點能階的確定',
            '雷射束最小寬度限制',
            '原子光譜的自然線寬',
        ],
    },
    category: 'quantum',
    variables: [
        {
            symbol: 'Δx',
            name: {
                ko: '위치 불확정성',
                en: 'Position Uncertainty',
                ja: '位置の不確定性',
                es: 'Incertidumbre de Posición',
                pt: 'Incerteza de Posição',
                'zh-CN': '位置不确定性',
                'zh-TW': '位置不確定性',
            },
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
            name: {
                ko: '운동량 불확정성',
                en: 'Momentum Uncertainty',
                ja: '運動量の不確定性',
                es: 'Incertidumbre de Momento',
                pt: 'Incerteza de Momento',
                'zh-CN': '动量不确定性',
                'zh-TW': '動量不確定性',
            },
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
                es: '¡Precisión menor que el tamaño atómico!',
                pt: 'Precisão menor que o tamanho atômico!',
                'zh-CN': '比原子尺寸还小的位置精度！',
                'zh-TW': '比原子尺寸還小的位置精度！',
            }
        if (Dx < 2)
            return {
                ko: '원자 수준의 위치 정밀도야',
                en: 'Atomic level position precision',
                ja: '原子レベルの位置精度だよ',
                es: 'Precisión de posición a nivel atómico',
                pt: 'Precisão de posição em nível atômico',
                'zh-CN': '原子级别的位置精度',
                'zh-TW': '原子級別的位置精度',
            }
        if (Dx < 5)
            return {
                ko: '분자 수준의 위치 정밀도야',
                en: 'Molecular level position precision',
                ja: '分子レベルの位置精度だよ',
                es: 'Precisión de posición a nivel molecular',
                pt: 'Precisão de posição em nível molecular',
                'zh-CN': '分子级别的位置精度',
                'zh-TW': '分子級別的位置精度',
            }
        if (Dp < 0.1)
            return {
                ko: '운동량이 꽤 정확해!',
                en: 'Momentum is fairly precise!',
                ja: '運動量がかなり正確！',
                es: '¡El momento es bastante preciso!',
                pt: 'O momento é bastante preciso!',
                'zh-CN': '动量相当精确！',
                'zh-TW': '動量相當精確！',
            }
        return {
            ko: '거시적 수준의 불확정성이야',
            en: 'Macroscopic level uncertainty',
            ja: '巨視的レベルの不確定性だよ',
            es: 'Incertidumbre a nivel macroscópico',
            pt: 'Incerteza em nível macroscópico',
            'zh-CN': '宏观级别的不确定性',
            'zh-TW': '宏觀級別的不確定性',
        }
    },
    discoveries: [
        {
            id: 'precise-position',
            mission: {
                ko: '위치 불확정성 Δx를 0.3nm 이하로 줄여봐!',
                en: 'Reduce position uncertainty below 0.3nm!',
                ja: '位置の不確定性Δxを0.3nm以下に減らしてみて！',
                es: '¡Reduce la incertidumbre de posición Δx por debajo de 0.3nm!',
                pt: 'Reduza a incerteza de posição Δx abaixo de 0.3nm!',
                'zh-CN': '把位置不确定性Δx减小到0.3nm以下！',
                'zh-TW': '把位置不確定性Δx減小到0.3nm以下！',
            },
            result: {
                ko: '위치를 정확히 알수록 운동량이 더 불확실해져! 양자역학의 핵심 원리야.',
                en: 'More precise position means more uncertain momentum! A core principle of quantum mechanics.',
                ja: '位置を正確に知るほど運動量がより不確かになる！量子力学の核心原理だよ。',
                es: '¡Posición más precisa significa momento más incierto! Un principio fundamental de la mecánica cuántica.',
                pt: 'Posição mais precisa significa momento mais incerto! Um princípio fundamental da mecânica quântica.',
                'zh-CN': '位置越精确，动量就越不确定！这是量子力学的核心原理。',
                'zh-TW': '位置越精確，動量就越不確定！這是量子力學的核心原理。',
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
                es: '¡Aumenta la incertidumbre de posición Δx por encima de 8nm!',
                pt: 'Aumente a incerteza de posição Δx acima de 8nm!',
                'zh-CN': '把位置不确定性Δx增加到8nm以上！',
                'zh-TW': '把位置不確定性Δx增加到8nm以上！',
            },
            result: {
                ko: '위치가 불확실하면 운동량은 꽤 정확히 알 수 있어! 두 가지를 동시에 정확히 알 수 없어.',
                en: 'Uncertain position allows more precise momentum! Cannot know both precisely at once.',
                ja: '位置が不確かなら運動量はかなり正確にわかる！両方を同時に正確に知ることはできないよ。',
                es: '¡Posición incierta permite momento más preciso! No se pueden conocer ambos con precisión a la vez.',
                pt: 'Posição incerta permite momento mais preciso! Não é possível conhecer ambos com precisão ao mesmo tempo.',
                'zh-CN': '位置不确定时，动量可以相当精确地知道！两者不能同时精确知道。',
                'zh-TW': '位置不確定時，動量可以相當精確地知道！兩者不能同時精確知道。',
            },
            icon: '🌊',
            condition: (vars) => vars['Δx'] >= 8,
        },
    ],
}
