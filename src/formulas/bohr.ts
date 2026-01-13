import { Formula } from './types'
import { colors } from '../styles/colors'

export const bohr: Formula = {
    id: 'bohr',
    name: '보어 모형',
    nameEn: 'Bohr Model',
    expression: 'Eₙ = -13.6/n² eV',
    description: '수소 원자의 전자는 양자화된 에너지 준위의 궤도에서만 존재한다',
    descriptionEn:
        'The electron in a hydrogen atom can only exist in quantized energy level orbits',
    simulationHint: '수소 원자의 전자가 특정 궤도에서만 돌고, 준위 변화 시 광자를 방출하는 모습',
    simulationHintEn: 'Shows an electron orbiting a hydrogen atom in quantized orbits, emitting photons when changing levels',
    applications: [
        '수소 원자의 스펙트럼 분석',
        '레이저의 에너지 준위 설계',
        '형광등과 네온사인의 색상',
        '별의 원소 성분 분석',
    ],
    applicationsEn: [
        'Hydrogen atom spectrum analysis',
        'Energy level design for lasers',
        'Colors in fluorescent and neon lights',
        'Analyzing elemental composition of stars',
    ],
    category: 'quantum',
    variables: [
        {
            symbol: 'n',
            name: '주양자수',
            nameEn: 'Principal Quantum Number',
            role: 'input',
            unit: '',
            range: [1, 6],
            default: 2,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 30,
                color: colors.distance,
            },
        },
        {
            symbol: 'E',
            name: '에너지',
            nameEn: 'Energy',
            role: 'output',
            unit: 'eV',
            range: [-13.6, 0],
            default: -3.4,
            visual: {
                property: 'glow',
                scale: (value: number) => (13.6 + value) / 13.6,
                color: colors.energy,
            },
        },
        {
            symbol: 'r',
            name: '궤도 반지름',
            nameEn: 'Orbital Radius',
            role: 'output',
            unit: 'a₀',
            range: [1, 36],
            default: 4,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 2,
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 2)
        // E_n = -13.6 / n² eV
        const E = -13.6 / (n * n)
        // r_n = n² * a₀ (in units of Bohr radius)
        const r = n * n
        return { E, r }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 2)
        const E = -13.6 / (n * n)
        const r = n * n
        return `E = -13.6/${n}² = ${E.toFixed(2)} eV, r = ${r}a₀`
    },
    layout: {
        type: 'orbital',
        connections: [
            { from: 'n', to: 'E', operator: '=' },
            { from: 'n', to: 'r', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'E',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: '-13.6' }],
                denominator: [{ type: 'var', symbol: 'n', square: true }],
            },
            { type: 'text', value: ' eV' },
        ],
    },
}
