import { Formula } from './types'
import { colors } from '../styles/colors'

export const capacitor: Formula = {
    id: 'capacitor',
    name: '축전기 에너지',
    nameEn: 'Capacitor Energy',
    expression: 'E = ½CV²',
    description: '축전기에 저장된 전기 에너지',
    descriptionEn: 'The electrical energy stored in a capacitor',
    simulationHint: '축전기에 전하가 쌓이며 에너지가 저장되는 모습',
    simulationHintEn: 'Shows charge accumulating in a capacitor and storing energy',
    applications: [
        '카메라 플래시의 순간 발광',
        '전기차의 회생 제동 에너지 저장',
        '제세동기(AED)의 심장 충격',
        '무정전 전원장치(UPS) 설계',
    ],
    applicationsEn: [
        'Camera flash instant discharge',
        'Regenerative braking in electric vehicles',
        'Defibrillator (AED) cardiac shock',
        'Uninterruptible power supply (UPS) design',
    ],
    category: 'electricity',
    variables: [
        {
            symbol: 'C',
            name: '전기용량',
            nameEn: 'Capacitance',
            role: 'input',
            unit: 'mF',
            range: [1, 10],
            default: 4,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 5,
                color: colors.current,
            },
        },
        {
            symbol: 'V',
            name: '전압',
            nameEn: 'Voltage',
            role: 'input',
            unit: 'kV',
            range: [1, 10],
            default: 5,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 2,
                color: colors.voltage,
            },
        },
        {
            symbol: 'E',
            name: '저장 에너지',
            nameEn: 'Stored Energy',
            role: 'output',
            unit: 'kJ',
            range: [0, 500],
            default: 50,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const C = inputs.C ?? 4 // mF
        const V = inputs.V ?? 5 // kV
        // E = 0.5 * C * V^2, with C in mF and V in kV → result in kJ
        // 0.5 * C(mF) * V(kV)² = 0.5 * C * V² kJ
        return {
            E: 0.5 * C * V * V,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const C = inputs.C ?? 4
        const V = inputs.V ?? 5
        const E = 0.5 * C * V * V
        return `E = ½ × ${C.toFixed(0)}mF × ${V.toFixed(0)}kV² = ${E.toFixed(1)} kJ`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'C', to: 'V', operator: '×' },
            { from: 'V', to: 'E', operator: '²' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'E',
        coefficient: '½',
        numerator: ['C', 'V'],
        squares: ['V'],
    },
}
