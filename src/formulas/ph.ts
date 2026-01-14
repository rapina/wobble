import { Formula } from './types'
import { colors } from '../styles/colors'

export const ph: Formula = {
    id: 'ph',
    name: 'pH (산성도)',
    nameEn: 'pH Scale',
    expression: 'pH = -log[H⁺]',
    description: '수소 이온 농도의 음의 로그값',
    descriptionEn: 'Negative logarithm of hydrogen ion concentration',
    simulationHint: '수소 이온 농도에 따라 용액 색이 변하는 모습',
    simulationHintEn: 'Solution color changes based on hydrogen ion concentration',
    applications: [
        '수영장 물의 적정 pH 유지 (7.2~7.8)',
        '피부 화장품의 약산성 pH 조절',
        '위산(pH 1~2)과 제산제의 중화 작용',
        '토양 pH에 따른 식물 재배 관리',
    ],
    applicationsEn: [
        'Maintaining proper pool water pH (7.2-7.8)',
        'Adjusting skincare products to slightly acidic pH',
        'Neutralizing stomach acid (pH 1-2) with antacids',
        'Managing plant growth based on soil pH',
    ],
    category: 'chemistry',
    variables: [
        {
            symbol: '[H⁺]',
            name: '수소 이온 농도',
            nameEn: 'H+ Concentration',
            role: 'input',
            unit: 'mol/L',
            range: [0.0000001, 1],
            default: 0.0001,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.min(1, -Math.log10(value) / 14),
                color: colors.acidic,
            },
        },
        {
            symbol: 'pH',
            name: 'pH 값',
            nameEn: 'pH Value',
            role: 'output',
            unit: '',
            range: [0, 14],
            default: 4,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 14,
                color: colors.neutral,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const hConc = inputs['[H⁺]'] ?? 0.0001
        const pH = -Math.log10(hConc)
        return {
            pH: Math.max(0, Math.min(14, pH)),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const hConc = inputs['[H⁺]'] ?? 0.0001
        const pH = -Math.log10(hConc)
        return `pH = -log(${hConc.toExponential(1)}) = ${pH.toFixed(1)}`
    },
    layout: {
        type: 'container',
        connections: [{ from: '[H⁺]', to: 'pH', operator: '=' }],
    },
    displayLayout: {
        type: 'custom',
        output: 'pH',
        expression: [
            { type: 'op', value: '-log' },
            { type: 'var', symbol: '[H⁺]' },
        ],
    },
    discoveries: [
        {
            id: 'strong-acid',
            mission: '[H⁺]를 0.1 mol/L 이상으로 올려봐!',
            missionEn: 'Raise [H+] above 0.1 mol/L!',
            result: 'pH 1 이하! 위산이나 염산 수준의 강산이야.',
            resultEn: 'pH below 1! Strong acid like stomach acid or hydrochloric acid.',
            icon: '🧪',
            condition: (vars) => vars['[H⁺]'] >= 0.1,
        },
        {
            id: 'neutral',
            mission: 'pH를 7에 가깝게 맞춰봐!',
            missionEn: 'Adjust pH close to 7!',
            result: '중성! 순수한 물의 pH야. 대부분의 생명체에 안전한 환경이지.',
            resultEn: 'Neutral! pH of pure water. Safe environment for most living things.',
            icon: '💧',
            condition: (vars) => Math.abs(vars['pH'] - 7) < 0.5,
        },
        {
            id: 'alkaline',
            mission: '[H⁺]를 0.0000001 mol/L 이하로 낮춰봐!',
            missionEn: 'Lower [H+] below 0.0000001 mol/L!',
            result: 'pH 7 이상의 염기성! 비누나 표백제 수준이야.',
            resultEn: 'Alkaline pH above 7! Like soap or bleach.',
            icon: '🫧',
            condition: (vars) => vars['[H⁺]'] <= 0.0000001,
        },
    ],
    getInsight: (vars) => {
        const pH = vars['pH']
        if (pH < 2) return { ko: '강산! 위산, 염산 수준', en: 'Strong acid! Like stomach acid' }
        if (pH < 4) return { ko: '산성! 식초, 레몬즙 수준', en: 'Acidic! Like vinegar or lemon' }
        if (pH < 6) return { ko: '약산성! 커피, 산성비 수준', en: 'Slightly acidic! Like coffee' }
        if (pH < 8) return { ko: '중성~약염기! 물, 혈액 수준', en: 'Neutral! Like water or blood' }
        if (pH < 10) return { ko: '약염기! 베이킹소다 수준', en: 'Mild base! Like baking soda' }
        if (pH < 12) return { ko: '염기성! 비누, 암모니아 수준', en: 'Basic! Like soap or ammonia' }
        return { ko: '강염기! 표백제, 하수구 세정제 수준', en: 'Strong base! Like bleach' }
    },
}
