import { Formula } from './types'
import { colors } from '../styles/colors'

export const entropy: Formula = {
    id: 'entropy',
    name: { ko: '엔트로피', en: 'Entropy', ja: 'エントロピー' },
    expression: 'ΔS = Q/T',
    description: {
        ko: '열역학 제2법칙: 무질서도의 변화량',
        en: 'Second law of thermodynamics: change in disorder',
        ja: '熱力学第二法則：無秩序度の変化量',
    },
    simulationHint: {
        ko: '열이 전달되면서 입자들의 무질서도가 증가하는 모습',
        en: 'Shows particles becoming more disordered as heat is transferred',
        ja: '熱が伝わると粒子の無秩序度が増加する様子',
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
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'Q',
            name: { ko: '열량', en: 'Heat', ja: '熱量' },
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
            name: { ko: '절대온도', en: 'Absolute Temperature', ja: '絶対温度' },
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
            name: { ko: '엔트로피 변화', en: 'Entropy Change', ja: 'エントロピー変化' },
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
            },
            result: {
                ko: '낮은 온도에서 같은 열을 가하면 엔트로피 변화가 커! 냉장고가 에너지를 많이 쓰는 이유야.',
                en: 'Adding heat at low temperature increases entropy more! This is why refrigerators use lots of energy.',
                ja: '低温で同じ熱を加えるとエントロピー変化が大きい！冷蔵庫がエネルギーを多く使う理由だよ。',
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
            },
            result: {
                ko: '높은 온도에서는 같은 열을 가해도 엔트로피 변화가 작아! 열기관 효율의 비밀이야.',
                en: 'At high temperature, adding heat causes less entropy change! The secret to heat engine efficiency.',
                ja: '高温では同じ熱を加えてもエントロピー変化が小さい！熱機関効率の秘密だよ。',
            },
            icon: '🔥',
            condition: (vars) => vars['T'] >= 500,
        },
    ],
    getInsight: (vars) => {
        const dS = vars['ΔS']
        if (dS < 1) return { ko: '질서가 거의 유지돼', en: 'Order mostly maintained', ja: '秩序がほぼ維持されている' }
        if (dS < 2) return { ko: '약간의 무질서 증가', en: 'Slight increase in disorder', ja: '無秩序が少し増加' }
        if (dS < 4) return { ko: '무질서가 증가하고 있어', en: 'Disorder is increasing', ja: '無秩序が増加している' }
        if (dS < 6) return { ko: '꽤 무질서해지고 있어!', en: 'Getting quite disordered!', ja: 'かなり無秩序になっている！' }
        return { ko: '엄청난 엔트로피 증가!', en: 'Massive entropy increase!', ja: '莫大なエントロピー増加！' }
    },
}
