import { Formula } from './types'
import { colors } from '../styles/colors'

export const ohm: Formula = {
    id: 'ohm',
    name: { ko: '옴의 법칙', en: "Ohm's Law", ja: 'オームの法則' },
    expression: 'V = IR',
    description: {
        ko: '전압, 전류, 저항 사이의 관계',
        en: 'Relationship between voltage, current, and resistance',
        ja: '電圧、電流、抵抗の関係',
    },
    simulationHint: {
        ko: '저항이 클수록 전류가 줄어드는 회로의 모습',
        en: 'Shows current decreasing as resistance increases in a circuit',
        ja: '抵抗が大きいほど電流が減る回路の様子',
    },
    applications: {
        ko: [
            '가정용 전기 배선 설계',
            '스마트폰 충전기의 전류 제한',
            '전기 히터의 발열량 조절',
            'LED 조명의 저항값 계산',
        ],
        en: [
            'Designing household electrical wiring',
            'Limiting current in smartphone chargers',
            'Adjusting heat output of electric heaters',
            'Calculating resistance values for LED lighting',
        ],
        ja: [
            '家庭用電気配線の設計',
            'スマートフォン充電器の電流制限',
            '電気ヒーターの発熱量調整',
            'LED照明の抵抗値計算',
        ],
    },
    category: 'electricity',
    variables: [
        {
            symbol: 'I',
            name: { ko: '전류', en: 'Current', ja: '電流' },
            role: 'input',
            unit: 'A',
            range: [0.1, 10],
            default: 2,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 2,
                color: colors.current,
            },
        },
        {
            symbol: 'R',
            name: { ko: '저항', en: 'Resistance', ja: '抵抗' },
            role: 'input',
            unit: 'Ω',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.5,
                color: colors.resistance,
            },
        },
        {
            symbol: 'V',
            name: { ko: '전압', en: 'Voltage', ja: '電圧' },
            role: 'output',
            unit: 'V',
            range: [0, 1000],
            default: 20,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.voltage,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const I = inputs.I ?? 2
        const R = inputs.R ?? 10
        return {
            V: I * R,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const I = inputs.I ?? 2
        const R = inputs.R ?? 10
        const V = I * R
        return `V = ${I.toFixed(1)} × ${R.toFixed(0)} = ${V.toFixed(0)}`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'I', to: 'R', operator: '×' },
            { from: 'R', to: 'V', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'V',
        numerator: ['I', 'R'],
    },
    discoveries: [
        {
            id: 'high-resistance',
            mission: {
                ko: '저항 R을 80 이상으로 올려봐!',
                en: 'Raise resistance R above 80 ohms!',
                ja: '抵抗Rを80以上に上げてみて！',
            },
            result: {
                ko: '저항이 크면 같은 전류에도 높은 전압이 필요해! 전기히터가 열을 내는 원리야.',
                en: 'High resistance needs high voltage for same current! How electric heaters generate heat.',
                ja: '抵抗が大きいと同じ電流でも高い電圧が必要！電気ヒーターが熱を出す原理だよ。',
            },
            icon: '🔥',
            condition: (vars) => vars['R'] >= 80,
        },
        {
            id: 'high-current',
            mission: {
                ko: '전류 I를 8A 이상으로 올려봐!',
                en: 'Raise current I above 8 amps!',
                ja: '電流Iを8A以上に上げてみて！',
            },
            result: {
                ko: '높은 전류는 두꺼운 전선이 필요해! 가는 전선은 과열되어 위험해질 수 있어.',
                en: 'High current needs thick wires! Thin wires can overheat and become dangerous.',
                ja: '高い電流には太い電線が必要！細い電線は過熱して危険になることがあるよ。',
            },
            icon: '⚡',
            condition: (vars) => vars['I'] >= 8,
        },
    ],
    getInsight: (vars) => {
        const V = vars['V']
        if (V < 5)
            return { ko: 'USB 충전기 정도야', en: 'Like a USB charger', ja: 'USB充電器くらいだよ' }
        if (V < 15)
            return {
                ko: '자동차 배터리 정도야',
                en: 'Like a car battery',
                ja: '車のバッテリーくらいだよ',
            }
        if (V < 50) return { ko: '저전압 전원이야', en: 'Low voltage power', ja: '低電圧電源だよ' }
        if (V < 120)
            return {
                ko: '미국 가정용 전압이야',
                en: 'US household voltage',
                ja: 'アメリカの家庭用電圧だよ',
            }
        if (V < 250)
            return {
                ko: '한국 가정용 전압이야',
                en: 'Korean household voltage',
                ja: '韓国の家庭用電圧だよ',
            }
        return {
            ko: '산업용 고전압이야!',
            en: 'Industrial high voltage!',
            ja: '産業用高電圧だよ！',
        }
    },
}
