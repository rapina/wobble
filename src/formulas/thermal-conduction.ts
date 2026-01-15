import { Formula } from './types'
import { colors } from '../styles/colors'

export const thermalConduction: Formula = {
    id: 'thermal-conduction',
    name: { ko: '열전도 (푸리에 법칙)', en: "Fourier's Law", ja: 'フーリエの法則（熱伝導）' },
    expression: 'Q = kAΔT/L',
    description: {
        ko: '물질을 통해 전달되는 열량',
        en: 'The amount of heat transferred through a material',
        ja: '物質を通して伝わる熱量',
    },
    simulationHint: {
        ko: '열이 물질을 통해 고온에서 저온으로 전달되는 모습',
        en: 'Shows heat flowing through material from high to low temperature',
        ja: '熱が物質を通って高温から低温へ伝わる様子',
    },
    applications: {
        ko: [
            '건물 단열재의 효율 계산',
            '전자기기 방열판 설계',
            '요리할 때 냄비 손잡이가 뜨거워지는 정도',
            '겨울철 이중창의 단열 효과',
        ],
        en: [
            'Calculating building insulation efficiency',
            'Designing electronics heat sinks',
            'How hot pot handles get while cooking',
            'Double-pane window insulation in winter',
        ],
        ja: [
            '建物の断熱材の効率計算',
            '電子機器のヒートシンク設計',
            '料理中に鍋の取っ手が熱くなる程度',
            '冬の二重窓の断熱効果',
        ],
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'k',
            name: { ko: '열전도율', en: 'Thermal Conductivity', ja: '熱伝導率' },
            role: 'input',
            unit: 'W/m·K',
            range: [10, 400],
            default: 100,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 80,
                color: colors.spring,
            },
        },
        {
            symbol: 'A',
            name: { ko: '단면적', en: 'Cross-sectional Area', ja: '断面積' },
            role: 'input',
            unit: 'cm²',
            range: [10, 80],
            default: 40,
            visual: {
                property: 'size',
                scale: (value: number) => 15 + value * 0.6,
                color: colors.distance,
            },
        },
        {
            symbol: 'ΔT',
            name: { ko: '온도차', en: 'Temperature Difference', ja: '温度差' },
            role: 'input',
            unit: '°C',
            range: [20, 150],
            default: 80,
            visual: {
                property: 'shake',
                scale: (value: number) => value / 40,
                color: colors.temperature,
            },
        },
        {
            symbol: 'L',
            name: { ko: '길이', en: 'Length', ja: '長さ' },
            role: 'input',
            unit: 'cm',
            range: [5, 40],
            default: 15,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 3,
                color: colors.distance,
            },
        },
        {
            symbol: 'Q',
            name: { ko: '열전달률', en: 'Heat Transfer Rate', ja: '熱伝達率' },
            role: 'output',
            unit: 'W',
            range: [0, 8000],
            default: 2133,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.min(value / 400, 6),
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const k = inputs.k ?? 50
        const A = inputs.A ?? 25
        const dT = inputs['ΔT'] ?? 50
        const L = inputs.L ?? 10
        // A in cm², L in cm, convert to m² and m
        const A_m2 = A * 1e-4
        const L_m = L * 1e-2
        return {
            Q: (k * A_m2 * dT) / L_m,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const k = inputs.k ?? 50
        const A = inputs.A ?? 25
        const dT = inputs['ΔT'] ?? 50
        const L = inputs.L ?? 10
        const A_m2 = A * 1e-4
        const L_m = L * 1e-2
        const Q = (k * A_m2 * dT) / L_m
        return `Q = ${k.toFixed(0)} × ${A.toFixed(0)} × ${dT.toFixed(0)} ÷ ${L.toFixed(0)} = ${Q.toFixed(1)}`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'k', to: 'A', operator: '×' },
            { from: 'A', to: 'ΔT', operator: '×' },
            { from: 'ΔT', to: 'L', operator: '÷' },
            { from: 'L', to: 'Q', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'Q',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'k' },
                    { type: 'var', symbol: 'A' },
                    { type: 'var', symbol: 'ΔT' },
                ],
                denominator: [{ type: 'var', symbol: 'L' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'metal-conductor',
            mission: {
                ko: '열전도율 k를 350 이상으로 올려봐! (구리, 알루미늄)',
                en: 'Raise thermal conductivity k above 350! (copper, aluminum)',
                ja: '熱伝導率kを350以上に上げてみて！（銅、アルミニウム）',
            },
            result: {
                ko: '금속은 열을 빠르게 전달해! 방열판이 금속으로 만들어지는 이유야.',
                en: 'Metals conduct heat quickly! This is why heat sinks are made of metal.',
                ja: '金属は熱を速く伝える！ヒートシンクが金属で作られる理由だよ。',
            },
            icon: '🔥',
            condition: (vars) => vars['k'] >= 350,
        },
        {
            id: 'insulator',
            mission: {
                ko: '열전도율 k를 30 이하로, 길이 L을 30 이상으로 설정해봐!',
                en: 'Set thermal conductivity k below 30 and length L above 30!',
                ja: '熱伝導率kを30以下、長さLを30以上に設定してみて！',
            },
            result: {
                ko: '열전도율이 낮고 두꺼우면 단열이 잘 돼! 건물 단열재의 원리야.',
                en: 'Low conductivity and thickness means good insulation! How building insulation works.',
                ja: '熱伝導率が低く厚いと断熱効果が高い！建物の断熱材の原理だよ。',
            },
            icon: '🏠',
            condition: (vars) => vars['k'] <= 30 && vars['L'] >= 30,
        },
    ],
    getInsight: (vars) => {
        const Q = vars['Q']
        if (Q < 100)
            return {
                ko: '촛불 정도의 열전달이야',
                en: 'Heat transfer like a candle',
                ja: 'ろうそく程度の熱伝達',
            }
        if (Q < 500)
            return { ko: '헤어드라이어 정도야', en: 'Like a hair dryer', ja: 'ヘアドライヤー程度' }
        if (Q < 1500)
            return { ko: '전기히터 정도야', en: 'Like an electric heater', ja: '電気ヒーター程度' }
        if (Q < 4000)
            return { ko: '오븐 정도의 열전달이야', en: 'Like an oven', ja: 'オーブン程度の熱伝達' }
        return {
            ko: '용광로급 열전달!',
            en: 'Furnace-level heat transfer!',
            ja: '溶鉱炉級の熱伝達！',
        }
    },
}
