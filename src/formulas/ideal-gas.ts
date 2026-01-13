import { Formula } from './types'
import { colors } from '../styles/colors'

export const idealGas: Formula = {
    id: 'ideal-gas',
    name: '이상 기체',
    nameEn: 'Ideal Gas Law',
    expression: 'PV = nRT',
    description: '기체의 압력, 부피, 온도 사이의 관계',
    descriptionEn: 'The relationship between gas pressure, volume, and temperature',
    simulationHint: '용기 안 기체 입자들이 압력, 부피, 온도에 따라 움직이는 모습',
    simulationHintEn: 'Shows gas particles moving based on pressure, volume, and temperature',
    applications: [
        '자동차 타이어 공기압 변화 예측',
        '에어컨과 냉장고의 냉매 설계',
        '풍선이 고도에 따라 팽창하는 원리',
        '잠수부의 감압병 예방',
    ],
    applicationsEn: [
        'Predicting car tire pressure changes',
        'Designing refrigerant for AC and refrigerators',
        'Why balloons expand at higher altitudes',
        'Preventing decompression sickness in divers',
    ],
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'n',
            name: '몰수',
            nameEn: 'Moles',
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
            name: '온도',
            nameEn: 'Temperature',
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
            name: '부피',
            nameEn: 'Volume',
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
            name: '압력',
            nameEn: 'Pressure',
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
            mission: '온도 T를 최대(500K)로 올리고 부피 V를 최소(10L)로 줄여봐!',
            missionEn: 'Maximize temperature T to 500K and minimize volume V to 10L!',
            result: '뜨겁고 좁으면 압력이 급증해! 압력밥솥이 빨리 요리하는 이유야.',
            resultEn: 'Hot and compressed means high pressure! This is how pressure cookers work.',
            icon: '🍲',
            condition: (vars) => vars['T'] >= 480 && vars['V'] <= 15,
        },
        {
            id: 'low-temperature',
            mission: '온도 T를 220K 이하로 낮춰봐!',
            missionEn: 'Lower temperature T below 220K!',
            result: '기체가 차가워지면 압력이 낮아져! 추운 날 타이어 공기압이 떨어지는 이유야.',
            resultEn: 'Cold gas has lower pressure! This is why tire pressure drops on cold days.',
            icon: '❄️',
            condition: (vars) => vars['T'] <= 220,
        },
    ],
}
