import { Formula } from './types'
import { colors } from '../styles/colors'

export const heat: Formula = {
    id: 'heat',
    name: { ko: '열량', en: 'Heat Transfer', ja: '熱量' },
    expression: 'Q = mcΔT',
    description: {
        ko: '물체의 온도를 변화시키는 데 필요한 열에너지',
        en: "The heat energy required to change an object's temperature",
        ja: '物体の温度を変化させるのに必要な熱エネルギー',
    },
    simulationHint: {
        ko: '물체에 열이 가해지면서 온도가 올라가는 모습',
        en: 'Shows temperature rising as heat is applied to an object',
        ja: '物体に熱が加わり温度が上がる様子',
    },
    applications: {
        ko: [
            '물을 끓이는 데 필요한 에너지 계산',
            '냉난방 시스템 용량 설계',
            '요리할 때 조리 시간 예측',
            '수영장 온수 가열 비용 계산',
        ],
        en: [
            'Calculating energy needed to boil water',
            'Designing HVAC system capacity',
            'Estimating cooking times',
            'Calculating pool heating costs',
        ],
        ja: [
            'お湯を沸かすのに必要なエネルギー計算',
            '空調システムの容量設計',
            '調理時間の予測',
            'プール温水の加熱費計算',
        ],
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'm',
            name: { ko: '질량', en: 'Mass', ja: '質量' },
            role: 'input',
            unit: 'kg',
            range: [0.5, 10],
            default: 2,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 5,
                color: colors.mass,
            },
        },
        {
            symbol: 'c',
            name: { ko: '비열', en: 'Specific Heat', ja: '比熱' },
            role: 'input',
            unit: 'J/kg·K',
            range: [500, 4200],
            default: 4186,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 1000,
                color: colors.spring,
            },
        },
        {
            symbol: 'ΔT',
            name: { ko: '온도 변화', en: 'Temperature Change', ja: '温度変化' },
            role: 'input',
            unit: 'K',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 10,
                color: colors.temperature,
            },
        },
        {
            symbol: 'Q',
            name: { ko: '열량', en: 'Heat', ja: '熱量' },
            role: 'output',
            unit: 'kJ',
            range: [0, 2000],
            default: 83.72,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 200,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 2
        const c = inputs.c ?? 4186
        const deltaT = inputs['ΔT'] ?? 10
        return {
            Q: (m * c * deltaT) / 1000, // Convert to kJ
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 2
        const c = inputs.c ?? 4186
        const deltaT = inputs['ΔT'] ?? 10
        const Q = (m * c * deltaT) / 1000
        return `Q = ${m.toFixed(1)} × ${c.toFixed(0)} × ${deltaT.toFixed(0)} ÷ 1000 = ${Q.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm', to: 'c', operator: '×' },
            { from: 'c', to: 'ΔT', operator: '×' },
            { from: 'ΔT', to: 'Q', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'Q',
        numerator: ['m', 'c', 'ΔT'],
    },
    discoveries: [
        {
            id: 'water-high-capacity',
            mission: {
                ko: '비열 c를 최대(4200)로 설정해봐! (물의 비열)',
                en: 'Set specific heat c to maximum (4200)! (water)',
                ja: '比熱cを最大（4200）に設定してみて！（水の比熱）',
            },
            result: {
                ko: '물은 비열이 높아서 많은 열을 흡수해! 바다가 기후를 조절하는 이유야.',
                en: 'Water has high specific heat and absorbs lots of heat! This is why oceans regulate climate.',
                ja: '水は比熱が高くて多くの熱を吸収する！海が気候を調節する理由だよ。',
            },
            icon: '🌊',
            condition: (vars) => vars['c'] >= 4000,
        },
        {
            id: 'metal-low-capacity',
            mission: {
                ko: '비열 c를 600 이하로 낮춰봐! (금속)',
                en: 'Lower specific heat c below 600! (metal)',
                ja: '比熱cを600以下に下げてみて！（金属）',
            },
            result: {
                ko: '금속은 비열이 낮아 빨리 뜨거워지고 빨리 식어! 프라이팬이 빨리 달궈지는 이유야.',
                en: 'Metals have low specific heat - they heat up and cool down quickly! Why frying pans heat fast.',
                ja: '金属は比熱が低いから早く熱くなって早く冷める！フライパンが早く熱くなる理由だよ。',
            },
            icon: '🍳',
            condition: (vars) => vars['c'] <= 600,
        },
    ],
    getInsight: (vars) => {
        const Q = vars['Q']
        if (Q < 10)
            return {
                ko: '커피 한 잔 식히는 열량이야',
                en: 'Heat to cool a cup of coffee',
                ja: 'コーヒー1杯を冷ます熱量だよ',
            }
        if (Q < 50)
            return {
                ko: '샤워할 물 데우는 열량이야',
                en: 'Heat for shower water',
                ja: 'シャワーのお湯を温める熱量だよ',
            }
        if (Q < 200)
            return {
                ko: '냄비 물 끓이는 열량이야',
                en: 'Heat to boil a pot',
                ja: '鍋のお湯を沸かす熱量だよ',
            }
        if (Q < 500)
            return {
                ko: '욕조 물 데우는 열량이야',
                en: 'Heat for a bathtub',
                ja: '浴槽のお湯を温める熱量だよ',
            }
        return {
            ko: '수영장 데우는 열량이야!',
            en: 'Pool heating level!',
            ja: 'プールを温める熱量だよ！',
        }
    },
}
