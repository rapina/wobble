import { Formula } from './types'
import { colors } from '../styles/colors'

export const entropy: Formula = {
    id: 'entropy',
    name: {
        ko: '엔트로피',
        en: 'Entropy',
        ja: 'エントロピー',
        es: 'Entropía',
        pt: 'Entropia',
        'zh-CN': '熵',
        'zh-TW': '熵',
    },
    expression: 'ΔS = Q/T',
    description: {
        ko: '열역학 제2법칙: 무질서도의 변화량',
        en: 'Second law of thermodynamics: change in disorder',
        ja: '熱力学第二法則：無秩序度の変化量',
        es: 'Segunda ley de la termodinámica: cambio en el desorden',
        pt: 'Segunda lei da termodinâmica: mudança na desordem',
        'zh-CN': '热力学第二定律：无序度的变化量',
        'zh-TW': '熱力學第二定律：無序度的變化量',
    },
    simulationHint: {
        ko: '열이 전달되면서 입자들의 무질서도가 증가하는 모습',
        en: 'Shows particles becoming more disordered as heat is transferred',
        ja: '熱が伝わると粒子の無秩序度が増加する様子',
        es: 'Muestra las partículas volviéndose más desordenadas al transferirse calor',
        pt: 'Mostra partículas ficando mais desordenadas quando calor é transferido',
        'zh-CN': '显示热量传递时粒子变得更加无序的样子',
        'zh-TW': '顯示熱量傳遞時粒子變得更加無序的樣子',
    },
    applications: {
        ko: [
            '열기관의 효율 한계 계산 (카르노 사이클)',
            '화학 반응의 자발성 예측',
            '냉장고가 열을 밖으로 내보내는 원리',
            '우주의 열적 죽음 이론',
        ],
        en: [
            'Calculating heat engine efficiency limits (Carnot cycle)',
            'Predicting spontaneity of chemical reactions',
            'How refrigerators expel heat',
            'Heat death of the universe theory',
        ],
        ja: [
            '熱機関の効率限界計算（カルノーサイクル）',
            '化学反応の自発性予測',
            '冷蔵庫が熱を外に放出する原理',
            '宇宙の熱的死理論',
        ],
        es: [
            'Cálculo de límites de eficiencia de motores térmicos (ciclo de Carnot)',
            'Predicción de espontaneidad de reacciones químicas',
            'Cómo los refrigeradores expulsan calor',
            'Teoría de la muerte térmica del universo',
        ],
        pt: [
            'Cálculo de limites de eficiência de motores térmicos (ciclo de Carnot)',
            'Previsão de espontaneidade de reações químicas',
            'Como geladeiras expulsam calor',
            'Teoria da morte térmica do universo',
        ],
        'zh-CN': [
            '计算热机效率极限（卡诺循环）',
            '预测化学反应的自发性',
            '冰箱如何向外排热',
            '宇宙热寂理论',
        ],
        'zh-TW': [
            '計算熱機效率極限（卡諾循環）',
            '預測化學反應的自發性',
            '冰箱如何向外排熱',
            '宇宙熱寂理論',
        ],
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'Q',
            name: {
                ko: '열량',
                en: 'Heat',
                ja: '熱量',
                es: 'Calor',
                pt: 'Calor',
                'zh-CN': '热量',
                'zh-TW': '熱量',
            },
            role: 'input',
            unit: 'J',
            range: [200, 1200],
            default: 600,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 150,
                color: colors.temperature,
            },
        },
        {
            symbol: 'T',
            name: {
                ko: '절대온도',
                en: 'Absolute Temperature',
                ja: '絶対温度',
                es: 'Temperatura Absoluta',
                pt: 'Temperatura Absoluta',
                'zh-CN': '绝对温度',
                'zh-TW': '絕對溫度',
            },
            role: 'input',
            unit: 'K',
            range: [150, 600],
            default: 300,
            visual: {
                property: 'shake',
                scale: (value: number) => value / 80,
                color: colors.temperature,
            },
        },
        {
            symbol: 'ΔS',
            name: {
                ko: '엔트로피 변화',
                en: 'Entropy Change',
                ja: 'エントロピー変化',
                es: 'Cambio de Entropía',
                pt: 'Mudança de Entropia',
                'zh-CN': '熵变',
                'zh-TW': '熵變',
            },
            role: 'output',
            unit: 'J/K',
            range: [0, 8],
            default: 2,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value * 0.6,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const Q = inputs.Q ?? 500
        const T = inputs.T ?? 300
        return {
            ΔS: Q / T,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const Q = inputs.Q ?? 500
        const T = inputs.T ?? 300
        const dS = Q / T
        return `ΔS = ${Q.toFixed(0)} ÷ ${T.toFixed(0)} = ${dS.toFixed(2)}`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'Q', to: 'T', operator: '÷' },
            { from: 'T', to: 'ΔS', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'ΔS',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'Q' }],
                denominator: [{ type: 'var', symbol: 'T' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'low-temp-entropy',
            mission: {
                ko: '온도 T를 200K 이하로 낮추고 열량 Q를 높게 유지해봐!',
                en: 'Lower temperature T below 200K while keeping heat Q high!',
                ja: '温度Tを200K以下に下げながら熱量Qを高く維持してみて！',
                es: '¡Baja la temperatura T por debajo de 200K manteniendo el calor Q alto!',
                pt: 'Reduza a temperatura T abaixo de 200K mantendo o calor Q alto!',
                'zh-CN': '把温度T降到200K以下，同时保持热量Q较高！',
                'zh-TW': '把溫度T降到200K以下，同時保持熱量Q較高！',
            },
            result: {
                ko: '낮은 온도에서 같은 열을 가하면 엔트로피 변화가 커! 냉장고가 에너지를 많이 쓰는 이유야.',
                en: 'Adding heat at low temperature increases entropy more! This is why refrigerators use lots of energy.',
                ja: '低温で同じ熱を加えるとエントロピー変化が大きい！冷蔵庫がエネルギーを多く使う理由だよ。',
                es: '¡Agregar calor a baja temperatura aumenta más la entropía! Por eso los refrigeradores usan mucha energía.',
                pt: 'Adicionar calor em baixa temperatura aumenta mais a entropia! Por isso geladeiras usam muita energia.',
                'zh-CN': '在低温下添加同样的热量会使熵变更大！这就是冰箱耗能多的原因。',
                'zh-TW': '在低溫下添加同樣的熱量會使熵變更大！這就是冰箱耗能多的原因。',
            },
            icon: '🧊',
            condition: (vars) => vars['T'] <= 200 && vars['Q'] >= 800,
        },
        {
            id: 'high-temp-entropy',
            mission: {
                ko: '온도 T를 500K 이상으로 올려봐!',
                en: 'Raise temperature T above 500K!',
                ja: '温度Tを500K以上に上げてみて！',
                es: '¡Sube la temperatura T por encima de 500K!',
                pt: 'Aumente a temperatura T acima de 500K!',
                'zh-CN': '把温度T升到500K以上！',
                'zh-TW': '把溫度T升到500K以上！',
            },
            result: {
                ko: '높은 온도에서는 같은 열을 가해도 엔트로피 변화가 작아! 열기관 효율의 비밀이야.',
                en: 'At high temperature, adding heat causes less entropy change! The secret to heat engine efficiency.',
                ja: '高温では同じ熱を加えてもエントロピー変化が小さい！熱機関効率の秘密だよ。',
                es: '¡A alta temperatura, agregar calor causa menos cambio de entropía! El secreto de la eficiencia del motor térmico.',
                pt: 'Em alta temperatura, adicionar calor causa menos mudança de entropia! O segredo da eficiência do motor térmico.',
                'zh-CN': '在高温下添加同样的热量，熵变更小！这是热机效率的秘密。',
                'zh-TW': '在高溫下添加同樣的熱量，熵變更小！這是熱機效率的秘密。',
            },
            icon: '🔥',
            condition: (vars) => vars['T'] >= 500,
        },
    ],
    getInsight: (vars) => {
        const dS = vars['ΔS']
        if (dS < 1)
            return {
                ko: '질서가 거의 유지돼',
                en: 'Order mostly maintained',
                ja: '秩序がほぼ維持されている',
                es: 'Orden mayormente mantenido',
                pt: 'Ordem quase mantida',
                'zh-CN': '秩序基本保持',
                'zh-TW': '秩序基本保持',
            }
        if (dS < 2)
            return {
                ko: '약간의 무질서 증가',
                en: 'Slight increase in disorder',
                ja: '無秩序が少し増加',
                es: 'Ligero aumento del desorden',
                pt: 'Leve aumento da desordem',
                'zh-CN': '无序度略有增加',
                'zh-TW': '無序度略有增加',
            }
        if (dS < 4)
            return {
                ko: '무질서가 증가하고 있어',
                en: 'Disorder is increasing',
                ja: '無秩序が増加している',
                es: 'El desorden está aumentando',
                pt: 'A desordem está aumentando',
                'zh-CN': '无序度正在增加',
                'zh-TW': '無序度正在增加',
            }
        if (dS < 6)
            return {
                ko: '꽤 무질서해지고 있어!',
                en: 'Getting quite disordered!',
                ja: 'かなり無秩序になっている！',
                es: '¡Se está volviendo bastante desordenado!',
                pt: 'Ficando bem desordenado!',
                'zh-CN': '变得相当无序了！',
                'zh-TW': '變得相當無序了！',
            }
        return {
            ko: '엄청난 엔트로피 증가!',
            en: 'Massive entropy increase!',
            ja: '莫大なエントロピー増加！',
            es: '¡Aumento masivo de entropía!',
            pt: 'Aumento massivo de entropia!',
            'zh-CN': '熵大幅增加！',
            'zh-TW': '熵大幅增加！',
        }
    },
}
