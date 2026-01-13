import { Formula } from './types'
import { colors } from '../styles/colors'

export const electricPower: Formula = {
    id: 'electric-power',
    name: '전력',
    nameEn: 'Electric Power',
    expression: 'P = VI',
    description: '전기 에너지가 소비되거나 생성되는 속도',
    descriptionEn: 'The rate at which electrical energy is consumed or generated',
    simulationHint: '전압과 전류에 따라 소비되는 전력이 변하는 모습',
    simulationHintEn: 'Shows power consumption changing with voltage and current',
    applications: [
        '전기요금 계산 (kWh)',
        '가전제품의 소비 전력 비교',
        '태양광 패널의 발전량 측정',
        '전기차 배터리 충전 시간 계산',
    ],
    applicationsEn: [
        'Calculating electricity bills (kWh)',
        'Comparing power consumption of appliances',
        'Measuring solar panel output',
        'Calculating EV battery charging time',
    ],
    category: 'electricity',
    variables: [
        {
            symbol: 'V',
            name: '전압',
            nameEn: 'Voltage',
            role: 'input',
            unit: 'V',
            range: [1, 240],
            default: 220,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.voltage,
            },
        },
        {
            symbol: 'I',
            name: '전류',
            nameEn: 'Current',
            role: 'input',
            unit: 'A',
            range: [0.1, 20],
            default: 5,
            visual: {
                property: 'speed',
                scale: (value: number) => value,
                color: colors.current,
            },
        },
        {
            symbol: 'P',
            name: '전력',
            nameEn: 'Power',
            role: 'output',
            unit: 'W',
            range: [0, 5000],
            default: 1100,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 500,
                color: colors.power,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const V = inputs.V ?? 220
        const I = inputs.I ?? 5
        return {
            P: V * I,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const V = inputs.V ?? 220
        const I = inputs.I ?? 5
        const P = V * I
        return `P = ${V.toFixed(0)} × ${I.toFixed(1)} = ${P.toFixed(0)}`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'V', to: 'I', operator: '×' },
            { from: 'I', to: 'P', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'P',
        numerator: ['V', 'I'],
    },
}
