import { Formula } from './types'
import { colors } from '../styles/colors'

export const heat: Formula = {
    id: 'heat',
    name: '열량',
    nameEn: 'Heat Transfer',
    expression: 'Q = mcΔT',
    description: '물체의 온도를 변화시키는 데 필요한 열에너지',
    descriptionEn: "The heat energy required to change an object's temperature",
    simulationHint: '물체에 열이 가해지면서 온도가 올라가는 모습',
    simulationHintEn: 'Shows temperature rising as heat is applied to an object',
    applications: [
        '물을 끓이는 데 필요한 에너지 계산',
        '냉난방 시스템 용량 설계',
        '요리할 때 조리 시간 예측',
        '수영장 온수 가열 비용 계산',
    ],
    applicationsEn: [
        'Calculating energy needed to boil water',
        'Designing HVAC system capacity',
        'Estimating cooking times',
        'Calculating pool heating costs',
    ],
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'm',
            name: '질량',
            nameEn: 'Mass',
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
            name: '비열',
            nameEn: 'Specific Heat',
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
            name: '온도 변화',
            nameEn: 'Temperature Change',
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
            name: '열량',
            nameEn: 'Heat',
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
}
