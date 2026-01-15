import { Formula } from './types'
import { colors } from '../styles/colors'

export const stefanBoltzmann: Formula = {
    id: 'stefan-boltzmann',
    name: {
        ko: '스테판-볼츠만 법칙',
        en: 'Stefan-Boltzmann Law',
        ja: 'シュテファン・ボルツマンの法則',
    },
    expression: 'P = σAT⁴',
    description: {
        ko: '흑체가 방출하는 복사 에너지',
        en: 'The radiant energy emitted by a black body',
        ja: '黒体が放出する放射エネルギー',
    },
    simulationHint: {
        ko: '온도에 따라 물체가 방출하는 복사 에너지가 급격히 변하는 모습',
        en: 'Shows radiant energy increasing dramatically with temperature',
        ja: '温度に応じて物体が放出する放射エネルギーが急激に変わる様子',
    },
    applications: {
        ko: [
            '태양의 표면 온도 측정',
            '적외선 체온계의 작동 원리',
            '별의 밝기와 크기 관계 계산',
            '지구의 열균형과 기후 모델링',
        ],
        en: [
            "Measuring the Sun's surface temperature",
            'How infrared thermometers work',
            'Calculating star brightness and size relationships',
            "Earth's thermal equilibrium and climate modeling",
        ],
        ja: [
            '太陽の表面温度測定',
            '赤外線体温計の仕組み',
            '恒星の明るさとサイズの関係計算',
            '地球の熱平衡と気候モデリング',
        ],
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'A',
            name: { ko: '표면적', en: 'Surface Area', ja: '表面積' },
            role: 'input',
            unit: 'm²',
            range: [1, 10],
            default: 4,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 6,
                color: colors.distance,
            },
        },
        {
            symbol: 'T',
            name: { ko: '절대온도', en: 'Absolute Temperature', ja: '絶対温度' },
            role: 'input',
            unit: 'K',
            range: [300, 1200],
            default: 600,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 150,
                color: colors.temperature,
            },
        },
        {
            symbol: 'P',
            name: { ko: '복사 전력', en: 'Radiated Power', ja: '放射電力' },
            role: 'output',
            unit: 'W',
            range: [0, 500000],
            default: 29376,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.min(value / 800, 10),
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const A = inputs.A ?? 1
        const T = inputs.T ?? 500
        const sigma = 5.67e-8 // Stefan-Boltzmann constant
        return {
            P: sigma * A * Math.pow(T, 4),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const A = inputs.A ?? 1
        const T = inputs.T ?? 500
        const sigma = 5.67e-8
        const P = sigma * A * Math.pow(T, 4)
        return `P = σ × ${A.toFixed(1)} × ${T.toFixed(0)}⁴ = ${P.toFixed(0)}`
    },
    layout: {
        type: 'explosion',
        connections: [
            { from: 'A', to: 'T', operator: '×' },
            { from: 'T', to: 'P', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'P',
        expression: [
            { type: 'text', value: 'σ' },
            { type: 'var', symbol: 'A' },
            { type: 'var', symbol: 'T', square: true },
            { type: 'text', value: '²' },
        ],
    },
    getInsight: (vars) => {
        const P = vars['P']
        if (P < 1000)
            return {
                ko: '촛불 정도의 복사 에너지야',
                en: 'Candle level radiant energy',
                ja: 'ろうそく程度の放射エネルギーだよ',
            }
        if (P < 10000)
            return {
                ko: '전구 정도의 복사 에너지야',
                en: 'Light bulb level radiant energy',
                ja: '電球程度の放射エネルギーだよ',
            }
        if (P < 50000)
            return {
                ko: '히터 정도의 복사 에너지야',
                en: 'Heater level radiant energy',
                ja: 'ヒーター程度の放射エネルギーだよ',
            }
        if (P < 200000)
            return {
                ko: '용광로 정도의 복사 에너지야',
                en: 'Furnace level radiant energy',
                ja: '溶鉱炉程度の放射エネルギーだよ',
            }
        return {
            ko: '태양급 복사 에너지!',
            en: 'Sun level radiant energy!',
            ja: '太陽級の放射エネルギー！',
        }
    },
    discoveries: [
        {
            id: 'sun-temperature',
            mission: {
                ko: '온도 T를 1000K 이상으로 올려봐!',
                en: 'Raise temperature T above 1000K!',
                ja: '温度Tを1000K以上に上げてみて！',
            },
            result: {
                ko: '온도가 2배면 복사 에너지는 16배! T⁴에 비례하기 때문이야.',
                en: 'Double the temperature means 16x more radiation! Because power scales with T to the 4th.',
                ja: '温度が2倍なら放射エネルギーは16倍！T⁴に比例するからだよ。',
            },
            icon: '☀️',
            condition: (vars) => vars['T'] >= 1000,
        },
        {
            id: 'room-temperature',
            mission: {
                ko: '온도 T를 350K 이하로 낮춰봐! (상온 근처)',
                en: 'Lower temperature T below 350K! (near room temperature)',
                ja: '温度Tを350K以下に下げてみて！（室温付近）',
            },
            result: {
                ko: '상온 물체도 적외선을 방출해! 열화상 카메라가 작동하는 원리야.',
                en: 'Room temperature objects emit infrared! This is how thermal cameras work.',
                ja: '室温の物体も赤外線を放出する！サーモカメラが動作する原理だよ。',
            },
            icon: '📷',
            condition: (vars) => vars['T'] <= 350,
        },
    ],
}
