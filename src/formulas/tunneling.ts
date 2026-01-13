import { Formula } from './types'
import { colors } from '../styles/colors'

export const tunneling: Formula = {
    id: 'tunneling',
    name: '양자 터널링',
    nameEn: 'Quantum Tunneling',
    expression: 'T ≈ e⁻²ᵏᴸ',
    description: '입자가 고전역학적으로 불가능한 에너지 장벽을 확률적으로 통과하는 현상',
    descriptionEn:
        'A phenomenon where particles probabilistically pass through classically forbidden energy barriers',
    simulationHint: '입자들이 에너지 장벽에 부딪혀 일부는 통과하고 일부는 반사되는 모습',
    simulationHintEn: 'Shows particles hitting an energy barrier, some tunneling through and some reflecting',
    applications: [
        '플래시 메모리의 데이터 저장',
        '주사 터널링 현미경 (STM)',
        '핵융합 반응의 양자 효과',
        '효소의 화학 반응 촉매',
    ],
    applicationsEn: [
        'Flash memory data storage',
        'Scanning tunneling microscope (STM)',
        'Quantum effects in nuclear fusion',
        'Enzyme catalysis in chemical reactions',
    ],
    category: 'quantum',
    variables: [
        {
            symbol: 'E',
            name: '입자 에너지',
            nameEn: 'Particle Energy',
            role: 'input',
            unit: 'eV',
            range: [3, 10],
            default: 8,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.energy,
            },
        },
        {
            symbol: 'V',
            name: '장벽 높이',
            nameEn: 'Barrier Height',
            role: 'input',
            unit: 'eV',
            range: [5, 12],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 5,
                color: colors.resistance,
            },
        },
        {
            symbol: 'L',
            name: '장벽 폭',
            nameEn: 'Barrier Width',
            role: 'input',
            unit: 'nm',
            range: [0.05, 0.4],
            default: 0.1,
            visual: {
                property: 'stretch',
                scale: (value: number) => value * 150,
                color: colors.distance,
            },
        },
        {
            symbol: 'T',
            name: '투과 확률',
            nameEn: 'Transmission Probability',
            role: 'output',
            unit: '%',
            range: [0, 100],
            default: 23.5,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.wavelength,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const E = inputs.E ?? 8 // eV
        const V = inputs.V ?? 10 // eV
        const L = inputs.L ?? 0.1 // nm

        // If E >= V, classical transmission (100%)
        if (E >= V) {
            return { T: 100 }
        }

        // κ = sqrt(2m(V-E)) / ℏ
        // For electron: κ ≈ 5.12 * sqrt(V-E) nm⁻¹
        const kappa = 5.12 * Math.sqrt(V - E)
        // T = exp(-2κL)
        const T = Math.exp(-2 * kappa * L) * 100

        return { T: Math.min(100, Math.max(0, T)) }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const E = inputs.E ?? 8
        const V = inputs.V ?? 10
        const L = inputs.L ?? 0.1

        if (E >= V) {
            return `E ≥ V → T = 100%`
        }

        const kappa = 5.12 * Math.sqrt(V - E)
        const T = Math.exp(-2 * kappa * L) * 100
        return `T = e^(-2×${kappa.toFixed(2)}×${L.toFixed(1)}) = ${T.toFixed(1)}%`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'E', to: 'T', operator: '=' },
            { from: 'V', to: 'T', operator: '=' },
            { from: 'L', to: 'T', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'T',
        expression: [
            { type: 'text', value: 'e' },
            {
                type: 'group',
                items: [
                    { type: 'text', value: '-2κ' },
                    { type: 'var', symbol: 'L' },
                ],
            },
        ],
    },
}
