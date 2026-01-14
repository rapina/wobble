import { Formula } from './types'
import { colors } from '../styles/colors'

export const entropy: Formula = {
    id: 'entropy',
    name: '엔트로피',
    nameEn: 'Entropy',
    expression: 'ΔS = Q/T',
    description: '열역학 제2법칙: 무질서도의 변화량',
    descriptionEn: 'Second law of thermodynamics: change in disorder',
    simulationHint: '열이 전달되면서 입자들의 무질서도가 증가하는 모습',
    simulationHintEn: 'Shows particles becoming more disordered as heat is transferred',
    applications: [
        '열기관의 효율 한계 계산 (카르노 사이클)',
        '화학 반응의 자발성 예측',
        '냉장고가 열을 밖으로 내보내는 원리',
        '우주의 열적 죽음 이론',
    ],
    applicationsEn: [
        'Calculating heat engine efficiency limits (Carnot cycle)',
        'Predicting spontaneity of chemical reactions',
        'How refrigerators expel heat',
        'Heat death of the universe theory',
    ],
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'Q',
            name: '열량',
            nameEn: 'Heat',
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
            name: '절대온도',
            nameEn: 'Absolute Temperature',
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
            name: '엔트로피 변화',
            nameEn: 'Entropy Change',
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
            mission: '온도 T를 200K 이하로 낮추고 열량 Q를 높게 유지해봐!',
            missionEn: 'Lower temperature T below 200K while keeping heat Q high!',
            result: '낮은 온도에서 같은 열을 가하면 엔트로피 변화가 커! 냉장고가 에너지를 많이 쓰는 이유야.',
            resultEn: 'Adding heat at low temperature increases entropy more! This is why refrigerators use lots of energy.',
            icon: '🧊',
            condition: (vars) => vars['T'] <= 200 && vars['Q'] >= 800,
        },
        {
            id: 'high-temp-entropy',
            mission: '온도 T를 500K 이상으로 올려봐!',
            missionEn: 'Raise temperature T above 500K!',
            result: '높은 온도에서는 같은 열을 가해도 엔트로피 변화가 작아! 열기관 효율의 비밀이야.',
            resultEn: 'At high temperature, adding heat causes less entropy change! The secret to heat engine efficiency.',
            icon: '🔥',
            condition: (vars) => vars['T'] >= 500,
        },
    ],
    getInsight: (vars) => {
        const dS = vars['ΔS']
        if (dS < 1) return { ko: '질서가 거의 유지돼', en: 'Order mostly maintained' }
        if (dS < 2) return { ko: '약간의 무질서 증가', en: 'Slight increase in disorder' }
        if (dS < 4) return { ko: '무질서가 증가하고 있어', en: 'Disorder is increasing' }
        if (dS < 6) return { ko: '꽤 무질서해지고 있어!', en: 'Getting quite disordered!' }
        return { ko: '엄청난 엔트로피 증가!', en: 'Massive entropy increase!' }
    },
}
