import { Formula } from './types'
import { colors } from '../styles/colors'

export const ohm: Formula = {
    id: 'ohm',
    name: '옴의 법칙',
    nameEn: "Ohm's Law",
    expression: 'V = IR',
    description: '전압, 전류, 저항 사이의 관계',
    descriptionEn: 'Relationship between voltage, current, and resistance',
    simulationHint: '저항이 클수록 전류가 줄어드는 회로의 모습',
    simulationHintEn: 'Shows current decreasing as resistance increases in a circuit',
    applications: [
        '가정용 전기 배선 설계',
        '스마트폰 충전기의 전류 제한',
        '전기 히터의 발열량 조절',
        'LED 조명의 저항값 계산',
    ],
    applicationsEn: [
        'Designing household electrical wiring',
        'Limiting current in smartphone chargers',
        'Adjusting heat output of electric heaters',
        'Calculating resistance values for LED lighting',
    ],
    category: 'electricity',
    variables: [
        {
            symbol: 'I',
            name: '전류',
            nameEn: 'Current',
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
            name: '저항',
            nameEn: 'Resistance',
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
            name: '전압',
            nameEn: 'Voltage',
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
            mission: '저항 R을 80 이상으로 올려봐!',
            missionEn: 'Raise resistance R above 80 ohms!',
            result: '저항이 크면 같은 전류에도 높은 전압이 필요해! 전기히터가 열을 내는 원리야.',
            resultEn: 'High resistance needs high voltage for same current! How electric heaters generate heat.',
            icon: '🔥',
            condition: (vars) => vars['R'] >= 80,
        },
        {
            id: 'high-current',
            mission: '전류 I를 8A 이상으로 올려봐!',
            missionEn: 'Raise current I above 8 amps!',
            result: '높은 전류는 두꺼운 전선이 필요해! 가는 전선은 과열되어 위험해질 수 있어.',
            resultEn: 'High current needs thick wires! Thin wires can overheat and become dangerous.',
            icon: '⚡',
            condition: (vars) => vars['I'] >= 8,
        },
    ],
}
