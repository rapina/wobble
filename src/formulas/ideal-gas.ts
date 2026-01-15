import { Formula } from './types'
import { colors } from '../styles/colors'

export const idealGas: Formula = {
    id: 'ideal-gas',
    name: { ko: '이상 기체', en: 'Ideal Gas Law', ja: '理想気体の法則' },
    expression: 'PV = nRT',
    description: { ko: '기체의 압력, 부피, 온도 사이의 관계', en: 'The relationship between gas pressure, volume, and temperature', ja: '気体の圧力、体積、温度の関係' },
    simulationHint: { ko: '용기 안 기체 입자들이 압력, 부피, 온도에 따라 움직이는 모습', en: 'Shows gas particles moving based on pressure, volume, and temperature', ja: '容器内の気体粒子が圧力、体積、温度に応じて動く様子' },
    applications: {
        ko: [
            '자동차 타이어 공기압 변화 예측',
            '에어컨과 냉장고의 냉매 설계',
            '풍선이 고도에 따라 팽창하는 원리',
            '잠수부의 감압병 예방',
        ],
        en: [
            'Predicting car tire pressure changes',
            'Designing refrigerant for AC and refrigerators',
            'Why balloons expand at higher altitudes',
            'Preventing decompression sickness in divers',
        ],
        ja: [
            '自動車タイヤの空気圧変化予測',
            'エアコンや冷蔵庫の冷媒設計',
            '風船が高度で膨らむ原理',
            'ダイバーの減圧症予防',
        ],
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'n',
            name: { ko: '몰수', en: 'Moles', ja: 'モル数' },
            role: 'input',
            unit: 'mol',
            range: [1, 20],
            default: 2,
            visual: {
                property: 'size',
                scale: (value: number) => value * 8,
                color: colors.mass,
            },
        },
        {
            symbol: 'T',
            name: { ko: '온도', en: 'Temperature', ja: '温度' },
            role: 'input',
            unit: 'K',
            range: [200, 500],
            default: 300,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.temperature,
            },
        },
        {
            symbol: 'V',
            name: { ko: '부피', en: 'Volume', ja: '体積' },
            role: 'input',
            unit: 'L',
            range: [10, 100],
            default: 50,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 0.5,
                color: colors.volume,
            },
        },
        {
            symbol: 'P',
            name: { ko: '압력', en: 'Pressure', ja: '圧力' },
            role: 'output',
            unit: 'kPa',
            range: [0, 500],
            default: 99.7,
            visual: {
                property: 'shake',
                scale: (value: number) => value / 100,
                color: colors.pressure,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const n = inputs.n ?? 2
        const T = inputs.T ?? 300
        const V = inputs.V ?? 50
        const R = 8.314 // J/(mol·K)
        // P = nRT/V, convert to kPa (divide by 1000) and L to m³ (divide by 1000)
        // So P(kPa) = nRT / V where V is in L
        return {
            P: (n * R * T) / V,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const n = inputs.n ?? 2
        const T = inputs.T ?? 300
        const V = inputs.V ?? 50
        const R = 8.314
        const P = (n * R * T) / V
        return `P = ${n.toFixed(1)} × R × ${T.toFixed(0)} ÷ ${V.toFixed(0)} = ${P.toFixed(1)}`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'n', to: 'T', operator: '×' },
            { from: 'T', to: 'V', operator: '÷' },
            { from: 'V', to: 'P', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'P',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'n' },
                    { type: 'text', value: 'R' },
                    { type: 'var', symbol: 'T' },
                ],
                denominator: [{ type: 'var', symbol: 'V' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'high-pressure',
            mission: { ko: '온도 T를 최대(500K)로 올리고 부피 V를 최소(10L)로 줄여봐!', en: 'Maximize temperature T to 500K and minimize volume V to 10L!', ja: '温度Tを最大(500K)にして体積Vを最小(10L)にしてみよう！' },
            result: { ko: '뜨겁고 좁으면 압력이 급증해! 압력밥솥이 빨리 요리하는 이유야.', en: 'Hot and compressed means high pressure! This is how pressure cookers work.', ja: '熱くて狭いと圧力が急上昇！圧力鍋が早く調理できる理由だ。' },
            icon: '🍲',
            condition: (vars) => vars['T'] >= 480 && vars['V'] <= 15,
        },
        {
            id: 'low-temperature',
            mission: { ko: '온도 T를 220K 이하로 낮춰봐!', en: 'Lower temperature T below 220K!', ja: '温度Tを220K以下にしてみよう！' },
            result: { ko: '기체가 차가워지면 압력이 낮아져! 추운 날 타이어 공기압이 떨어지는 이유야.', en: 'Cold gas has lower pressure! This is why tire pressure drops on cold days.', ja: '気体が冷えると圧力が下がる！寒い日にタイヤの空気圧が下がる理由だ。' },
            icon: '❄️',
            condition: (vars) => vars['T'] <= 220,
        },
    ],
    getInsight: (vars) => {
        const P = vars['P']
        if (P < 50) return { ko: '진공에 가까운 저압이야', en: 'Near-vacuum low pressure', ja: '真空に近い低圧' }
        if (P < 100) return { ko: '대기압보다 낮아', en: 'Below atmospheric pressure', ja: '大気圧より低い' }
        if (P < 150) return { ko: '대기압 근처야', en: 'Near atmospheric pressure', ja: '大気圧くらい' }
        if (P < 250) return { ko: '자전거 타이어 압력 정도야', en: 'Like a bike tire pressure', ja: '自転車タイヤの圧力くらい' }
        if (P < 400) return { ko: '자동차 타이어 압력이야', en: 'Like a car tire pressure', ja: '車のタイヤの圧力くらい' }
        return { ko: '압력밥솥 수준이야!', en: 'Pressure cooker level!', ja: '圧力鍋レベル！' }
    },
}
