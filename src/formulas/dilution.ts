import { Formula } from './types'
import { colors } from '../styles/colors'

export const dilution: Formula = {
    id: 'dilution',
    name: {
        ko: '희석 공식',
        en: 'Dilution Formula',
        ja: '希釈の公式',
        es: 'Fórmula de Dilución',
        pt: 'Fórmula de Diluição',
        'zh-CN': '稀释公式',
        'zh-TW': '稀釋公式',
    },
    expression: 'M₁V₁ = M₂V₂',
    description: {
        ko: '희석 전후 용질의 몰수는 보존된다',
        en: 'The amount of solute remains constant before and after dilution',
        ja: '希釈前後で溶質のモル数は保存される',
        es: 'La cantidad de soluto permanece constante antes y después de la dilución',
        pt: 'A quantidade de soluto permanece constante antes e depois da diluição',
        'zh-CN': '稀释前后溶质的摩尔数保持不变',
        'zh-TW': '稀釋前後溶質的莫耳數保持不變',
    },
    simulationHint: {
        ko: '진한 용액에 물을 넣어 희석하는 모습',
        en: 'Adding water to concentrated solution to dilute it',
        ja: '濃い溶液に水を加えて希釈する様子',
        es: 'Añadiendo agua a una solución concentrada para diluirla',
        pt: 'Adicionando água à solução concentrada para diluí-la',
        'zh-CN': '向浓溶液中加水稀释的样子',
        'zh-TW': '向濃溶液中加水稀釋的樣子',
    },
    applications: {
        ko: [
            '실험실에서 시약 농도 조절',
            '음료수 원액을 물로 희석',
            '세제나 약품의 적정 농도 조절',
            '의료용 주사액 농도 조절',
        ],
        en: [
            'Adjusting reagent concentration in laboratories',
            'Diluting beverage concentrates with water',
            'Adjusting detergent or chemical concentrations',
            'Preparing medical injection solutions',
        ],
        ja: [
            '実験室での試薬濃度調整',
            '飲料原液を水で希釈',
            '洗剤や薬品の適正濃度調整',
            '医療用注射液の濃度調整',
        ],
        es: [
            'Ajustar concentración de reactivos en laboratorios',
            'Diluir concentrados de bebidas con agua',
            'Ajustar concentraciones de detergentes o químicos',
            'Preparar soluciones de inyección médica',
        ],
        pt: [
            'Ajustar concentração de reagentes em laboratórios',
            'Diluir concentrados de bebidas com água',
            'Ajustar concentrações de detergentes ou químicos',
            'Preparar soluções de injeção médica',
        ],
        'zh-CN': [
            '实验室调节试剂浓度',
            '用水稀释饮料浓缩液',
            '调节洗涤剂或化学品浓度',
            '配制医用注射液',
        ],
        'zh-TW': [
            '實驗室調節試劑濃度',
            '用水稀釋飲料濃縮液',
            '調節洗滌劑或化學品濃度',
            '配製醫用注射液',
        ],
    },
    category: 'chemistry',
    variables: [
        {
            symbol: 'M₁',
            name: {
                ko: '초기 농도',
                en: 'Initial Concentration',
                ja: '初期濃度',
                es: 'Concentración Inicial',
                pt: 'Concentração Inicial',
                'zh-CN': '初始浓度',
                'zh-TW': '初始濃度',
            },
            role: 'input',
            unit: 'M',
            range: [0.1, 10],
            default: 2,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 10,
                color: colors.concentration,
            },
        },
        {
            symbol: 'V₁',
            name: {
                ko: '초기 부피',
                en: 'Initial Volume',
                ja: '初期体積',
                es: 'Volumen Inicial',
                pt: 'Volume Inicial',
                'zh-CN': '初始体积',
                'zh-TW': '初始體積',
            },
            role: 'input',
            unit: 'mL',
            range: [10, 500],
            default: 100,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.1,
                color: colors.volume,
            },
        },
        {
            symbol: 'V₂',
            name: {
                ko: '최종 부피',
                en: 'Final Volume',
                ja: '最終体積',
                es: 'Volumen Final',
                pt: 'Volume Final',
                'zh-CN': '最终体积',
                'zh-TW': '最終體積',
            },
            role: 'input',
            unit: 'mL',
            range: [50, 1000],
            default: 400,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.08,
                color: colors.volume,
            },
        },
        {
            symbol: 'M₂',
            name: {
                ko: '최종 농도',
                en: 'Final Concentration',
                ja: '最終濃度',
                es: 'Concentración Final',
                pt: 'Concentração Final',
                'zh-CN': '最终浓度',
                'zh-TW': '最終濃度',
            },
            role: 'output',
            unit: 'M',
            range: [0, 10],
            default: 0.5,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 10,
                color: colors.product,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const M1 = inputs['M₁'] ?? 2
        const V1 = inputs['V₁'] ?? 100
        const V2 = inputs['V₂'] ?? 400
        const M2 = (M1 * V1) / V2
        return {
            'M₂': Math.max(0, M2),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const M1 = inputs['M₁'] ?? 2
        const V1 = inputs['V₁'] ?? 100
        const V2 = inputs['V₂'] ?? 400
        const M2 = (M1 * V1) / V2
        return `M₂ = (${M1.toFixed(1)} × ${V1.toFixed(0)}) ÷ ${V2.toFixed(0)} = ${M2.toFixed(2)} M`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'M₁', to: 'V₁', operator: '×' },
            { from: 'V₁', to: 'V₂', operator: '÷' },
            { from: 'V₂', to: 'M₂', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'M₂',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'M₁' },
                    { type: 'var', symbol: 'V₁' },
                ],
                denominator: [{ type: 'var', symbol: 'V₂' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'high-dilution',
            mission: {
                ko: '농도를 10배 이상 희석해봐! (V₂를 V₁의 10배 이상으로)',
                en: 'Dilute concentration by 10x or more!',
                ja: '濃度を10倍以上に希釈してみよう！（V₂をV₁の10倍以上に）',
                es: '¡Diluye la concentración 10 veces o más!',
                pt: 'Dilua a concentração 10 vezes ou mais!',
                'zh-CN': '将浓度稀释10倍或更多！',
                'zh-TW': '將濃度稀釋10倍或更多！',
            },
            result: {
                ko: '고희석! 동종요법에서 쓰는 극도의 희석과 비슷해.',
                en: 'High dilution! Similar to extreme dilutions used in homeopathy.',
                ja: '高希釈！ホメオパシーで使われる極度の希釈に似ている。',
                es: '¡Alta dilución! Similar a las diluciones extremas usadas en homeopatía.',
                pt: 'Alta diluição! Similar às diluições extremas usadas na homeopatia.',
                'zh-CN': '高度稀释！类似于顺势疗法中使用的极度稀释。',
                'zh-TW': '高度稀釋！類似於順勢療法中使用的極度稀釋。',
            },
            icon: '💧',
            condition: (vars) => vars['V₂'] >= vars['V₁'] * 10,
        },
        {
            id: 'concentrate',
            mission: {
                ko: 'V₂를 V₁보다 작게 설정해봐! (농축)',
                en: 'Set V2 smaller than V1! (concentration)',
                ja: 'V₂をV₁より小さく設定してみよう！（濃縮）',
                es: '¡Configura V2 menor que V1! (concentración)',
                pt: 'Configure V2 menor que V1! (concentração)',
                'zh-CN': '将V2设置得比V1小！（浓缩）',
                'zh-TW': '將V2設置得比V1小！（濃縮）',
            },
            result: {
                ko: '농축! 물을 증발시키면 농도가 높아져.',
                en: 'Concentration! Evaporating water increases concentration.',
                ja: '濃縮！水を蒸発させると濃度が高くなる。',
                es: '¡Concentración! Evaporar agua aumenta la concentración.',
                pt: 'Concentração! Evaporar água aumenta a concentração.',
                'zh-CN': '浓缩！蒸发水会增加浓度。',
                'zh-TW': '濃縮！蒸發水會增加濃度。',
            },
            icon: '🔥',
            condition: (vars) => vars['V₂'] < vars['V₁'],
        },
        {
            id: 'preserve-moles',
            mission: {
                ko: 'M₁×V₁과 M₂×V₂가 같은지 확인해봐!',
                en: 'Check that M1×V1 equals M2×V2!',
                ja: 'M₁×V₁とM₂×V₂が等しいか確認してみよう！',
                es: '¡Verifica que M1×V1 sea igual a M2×V2!',
                pt: 'Verifique se M1×V1 é igual a M2×V2!',
                'zh-CN': '检查M1×V1是否等于M2×V2！',
                'zh-TW': '檢查M1×V1是否等於M2×V2！',
            },
            result: {
                ko: '용질의 몰수는 항상 보존돼! 물만 추가되거나 제거되는 거야.',
                en: 'Moles of solute are always conserved! Only water is added or removed.',
                ja: '溶質のモル数は常に保存される！水だけが追加または除去される。',
                es: '¡Los moles de soluto siempre se conservan! Solo se añade o quita agua.',
                pt: 'Os moles de soluto são sempre conservados! Só água é adicionada ou removida.',
                'zh-CN': '溶质的摩尔数始终守恒！只是添加或去除水。',
                'zh-TW': '溶質的莫耳數始終守恆！只是添加或去除水。',
            },
            icon: '⚖️',
            condition: (vars) => {
                const moles1 = vars['M₁'] * vars['V₁']
                const moles2 = vars['M₂'] * vars['V₂']
                return Math.abs(moles1 - moles2) < 0.1
            },
        },
    ],
    getInsight: (vars) => {
        const M2 = vars['M₂']
        const dilutionFactor = vars['M₁'] / M2
        if (dilutionFactor < 2)
            return {
                ko: '약간 희석됨',
                en: 'Slightly diluted',
                ja: 'やや希釈',
                es: 'Ligeramente diluido',
                pt: 'Levemente diluído',
                'zh-CN': '略微稀释',
                'zh-TW': '略微稀釋',
            }
        if (dilutionFactor < 5)
            return {
                ko: '적당히 희석됨',
                en: 'Moderately diluted',
                ja: '適度に希釈',
                es: 'Moderadamente diluido',
                pt: 'Moderadamente diluído',
                'zh-CN': '适度稀释',
                'zh-TW': '適度稀釋',
            }
        if (dilutionFactor < 10)
            return {
                ko: '많이 희석됨',
                en: 'Highly diluted',
                ja: '高度に希釈',
                es: 'Altamente diluido',
                pt: 'Altamente diluído',
                'zh-CN': '高度稀释',
                'zh-TW': '高度稀釋',
            }
        if (dilutionFactor < 100)
            return {
                ko: '매우 희석됨',
                en: 'Very highly diluted',
                ja: '非常に高度に希釈',
                es: 'Muy altamente diluido',
                pt: 'Muito altamente diluído',
                'zh-CN': '非常高度稀释',
                'zh-TW': '非常高度稀釋',
            }
        return {
            ko: '극도로 희석됨',
            en: 'Extremely diluted',
            ja: '極度に希釈',
            es: 'Extremadamente diluido',
            pt: 'Extremamente diluído',
            'zh-CN': '极度稀释',
            'zh-TW': '極度稀釋',
        }
    },
}
