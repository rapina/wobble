import { Formula } from './types'
import { colors } from '../styles/colors'

export const dilution: Formula = {
    id: 'dilution',
    name: { ko: '희석 공식', en: 'Dilution Formula', ja: '希釈の公式' },
    expression: 'M₁V₁ = M₂V₂',
    description: {
        ko: '희석 전후 용질의 몰수는 보존된다',
        en: 'The amount of solute remains constant before and after dilution',
        ja: '希釈前後で溶質のモル数は保存される',
    },
    simulationHint: {
        ko: '진한 용액에 물을 넣어 희석하는 모습',
        en: 'Adding water to concentrated solution to dilute it',
        ja: '濃い溶液に水を加えて希釈する様子',
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
    },
    category: 'chemistry',
    variables: [
        {
            symbol: 'M₁',
            name: { ko: '초기 농도', en: 'Initial Concentration', ja: '初期濃度' },
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
            name: { ko: '초기 부피', en: 'Initial Volume', ja: '初期体積' },
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
            name: { ko: '최종 부피', en: 'Final Volume', ja: '最終体積' },
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
            name: { ko: '최종 농도', en: 'Final Concentration', ja: '最終濃度' },
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
            },
            result: {
                ko: '고희석! 동종요법에서 쓰는 극도의 희석과 비슷해.',
                en: 'High dilution! Similar to extreme dilutions used in homeopathy.',
                ja: '高希釈！ホメオパシーで使われる極度の希釈に似ている。',
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
            },
            result: {
                ko: '농축! 물을 증발시키면 농도가 높아져.',
                en: 'Concentration! Evaporating water increases concentration.',
                ja: '濃縮！水を蒸発させると濃度が高くなる。',
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
            },
            result: {
                ko: '용질의 몰수는 항상 보존돼! 물만 추가되거나 제거되는 거야.',
                en: 'Moles of solute are always conserved! Only water is added or removed.',
                ja: '溶質のモル数は常に保存される！水だけが追加または除去される。',
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
            return { ko: '약간 희석됨', en: 'Slightly diluted', ja: 'やや希釈' }
        if (dilutionFactor < 5)
            return { ko: '적당히 희석됨', en: 'Moderately diluted', ja: '適度に希釈' }
        if (dilutionFactor < 10)
            return { ko: '많이 희석됨', en: 'Highly diluted', ja: '高度に希釈' }
        if (dilutionFactor < 100)
            return { ko: '매우 희석됨', en: 'Very highly diluted', ja: '非常に高度に希釈' }
        return { ko: '극도로 희석됨', en: 'Extremely diluted', ja: '極度に希釈' }
    },
}
