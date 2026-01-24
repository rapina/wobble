import { Formula } from './types'
import { colors } from '../styles/colors'

export const timeDilation: Formula = {
    id: 'time-dilation',
    name: {
        ko: '시간 지연',
        en: 'Time Dilation',
        ja: '時間の遅れ',
        es: 'Dilatación del Tiempo',
        pt: 'Dilatação do Tempo',
        'zh-CN': '时间膨胀',
        'zh-TW': '時間膨脹',
    },
    expression: 't = t₀/√(1-v²/c²)',
    description: {
        ko: '빠르게 움직이는 물체의 시간은 정지한 관찰자에게 더 느리게 흐른다',
        en: 'Time passes slower for fast-moving objects relative to a stationary observer',
        ja: '高速で動く物体の時間は、静止した観測者にとって遅く流れる',
        es: 'El tiempo pasa más lento para objetos en movimiento rápido relativo a un observador estacionario',
        pt: 'O tempo passa mais devagar para objetos em movimento rápido em relação a um observador estacionário',
        'zh-CN': '相对于静止观察者，快速运动物体的时间流逝得更慢',
        'zh-TW': '相對於靜止觀察者，快速運動物體的時間流逝得更慢',
    },
    simulationHint: {
        ko: '빠르게 움직이는 물체의 시간이 느려지는 모습',
        en: 'Shows time slowing down for fast-moving objects',
        ja: '高速で動く物体の時間が遅くなる様子',
        es: 'Muestra el tiempo desacelerándose para objetos en movimiento rápido',
        pt: 'Mostra o tempo desacelerando para objetos em movimento rápido',
        'zh-CN': '显示快速运动物体的时间变慢的样子',
        'zh-TW': '顯示快速運動物體的時間變慢的樣子',
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
        es: [
            'Corrección de tiempo de satélites GPS',
            'Astronautas envejeciendo más lento en el espacio',
            'Vida extendida de muones en aceleradores de partículas',
            'Experimento mental de la paradoja de los gemelos',
        ],
        pt: [
            'Correção de tempo de satélites GPS',
            'Astronautas envelhecendo mais devagar no espaço',
            'Vida estendida de múons em aceleradores de partículas',
            'Experimento mental do paradoxo dos gêmeos',
        ],
        'zh-CN': [
            'GPS卫星时间校正',
            '宇航员在太空中衰老变慢',
            '粒子加速器中μ子寿命延长',
            '双生子佯谬思想实验',
        ],
        'zh-TW': [
            'GPS衛星時間校正',
            '太空人在太空中衰老變慢',
            '粒子加速器中μ子壽命延長',
            '雙生子佯謬思想實驗',
        ],
    },
    category: 'special',
    variables: [
        {
            symbol: 't₀',
            name: {
                ko: '고유 시간',
                en: 'Proper Time',
                ja: '固有時間',
                es: 'Tiempo Propio',
                pt: 'Tempo Próprio',
                'zh-CN': '原时',
                'zh-TW': '原時',
            },
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
            name: {
                ko: '속도 (광속의 비율)',
                en: 'Velocity (fraction of c)',
                ja: '速度（光速の比率）',
                es: 'Velocidad (fracción de c)',
                pt: 'Velocidade (fração de c)',
                'zh-CN': '速度（光速的比例）',
                'zh-TW': '速度（光速的比例）',
            },
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
            name: {
                ko: '지연된 시간',
                en: 'Dilated Time',
                ja: '遅れた時間',
                es: 'Tiempo Dilatado',
                pt: 'Tempo Dilatado',
                'zh-CN': '膨胀时间',
                'zh-TW': '膨脹時間',
            },
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
                es: '¡Sube v por encima de 0.9c!',
                pt: 'Aumente v acima de 0.9c!',
                'zh-CN': '把v升到0.9c以上！',
                'zh-TW': '把v升到0.9c以上！',
            },
            result: {
                ko: '광속의 90%에서 시간이 2배 이상 느려져!',
                en: 'At 90% light speed, time slows down by more than 2x!',
                ja: '光速の90%で時間が2倍以上遅くなる！',
                es: '¡Al 90% de la velocidad de la luz, el tiempo se ralentiza más de 2 veces!',
                pt: 'A 90% da velocidade da luz, o tempo desacelera mais de 2x!',
                'zh-CN': '在光速的90%时，时间减慢超过2倍！',
                'zh-TW': '在光速的90%時，時間減慢超過2倍！',
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
                es: '¡Lleva v a 0.99c!',
                pt: 'Leve v a 0.99c!',
                'zh-CN': '把v推到0.99c！',
                'zh-TW': '把v推到0.99c！',
            },
            result: {
                ko: '광속에 가까워지면 시간이 7배 이상 느려져!',
                en: 'Near light speed, time slows down by over 7x!',
                ja: '光速に近づくと時間が7倍以上遅くなる！',
                es: '¡Cerca de la velocidad de la luz, el tiempo se ralentiza más de 7 veces!',
                pt: 'Perto da velocidade da luz, o tempo desacelera mais de 7x!',
                'zh-CN': '接近光速时，时间减慢超过7倍！',
                'zh-TW': '接近光速時，時間減慢超過7倍！',
            },
            icon: '🚀',
            condition: (vars) => vars['v'] >= 0.99,
        },
    ],
    getInsight: (vars) => {
        const t = vars['t']
        const t0 = vars['t₀'] ?? 1
        const ratio = t / t0
        if (ratio < 1.01)
            return {
                ko: '시간이 거의 똑같아',
                en: 'Time is almost the same',
                ja: '時間はほぼ同じだよ',
                es: 'El tiempo es casi el mismo',
                pt: 'O tempo é quase o mesmo',
                'zh-CN': '时间几乎相同',
                'zh-TW': '時間幾乎相同',
            }
        if (ratio < 1.2)
            return {
                ko: '시간이 살짝 느려져',
                en: 'Time slows slightly',
                ja: '時間が少し遅くなるよ',
                es: 'El tiempo se ralentiza ligeramente',
                pt: 'O tempo desacelera ligeiramente',
                'zh-CN': '时间稍微变慢',
                'zh-TW': '時間稍微變慢',
            }
        if (ratio < 2)
            return {
                ko: '시간이 눈에 띄게 느려져',
                en: 'Time noticeably slower',
                ja: '時間が目に見えて遅くなるよ',
                es: 'El tiempo notablemente más lento',
                pt: 'O tempo visivelmente mais lento',
                'zh-CN': '时间明显变慢',
                'zh-TW': '時間明顯變慢',
            }
        if (ratio < 5)
            return {
                ko: '시간이 많이 느려져!',
                en: 'Time slows significantly!',
                ja: '時間がかなり遅くなる！',
                es: '¡El tiempo se ralentiza significativamente!',
                pt: 'O tempo desacelera significativamente!',
                'zh-CN': '时间大幅减慢！',
                'zh-TW': '時間大幅減慢！',
            }
        return {
            ko: '시간이 완전 느려져! 우주여행 수준!',
            en: 'Extreme time dilation! Space travel level!',
            ja: '時間が大幅に遅くなる！宇宙旅行レベル！',
            es: '¡Dilatación temporal extrema! ¡Nivel de viaje espacial!',
            pt: 'Dilatação temporal extrema! Nível de viagem espacial!',
            'zh-CN': '极端时间膨胀！太空旅行级别！',
            'zh-TW': '極端時間膨脹！太空旅行級別！',
        }
    },
}
