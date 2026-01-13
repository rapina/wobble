import { Formula } from './types'
import { colors } from '../styles/colors'

export const infiniteWell: Formula = {
    id: 'infinite-well',
    name: '무한 퍼텐셜 우물',
    nameEn: 'Infinite Square Well',
    expression: 'Eₙ = n²ℏ²π²/2mL²',
    description: '상자 안에 갇힌 입자는 양자화된 에너지 준위만 가질 수 있다',
    descriptionEn:
        'A particle confined in a box can only have quantized energy levels',
    simulationHint: '상자 안에 갇힌 입자의 파동함수가 정상파를 이루는 모습',
    simulationHintEn: 'Shows a particle confined in a box forming standing wave patterns',
    applications: [
        '양자 우물 레이저의 파장 제어',
        '나노선 전자소자의 에너지 준위',
        '형광 양자점의 색상 결정',
        '탄소 나노튜브의 전자 구조',
    ],
    applicationsEn: [
        'Wavelength control in quantum well lasers',
        'Energy levels in nanowire devices',
        'Color determination in fluorescent quantum dots',
        'Electronic structure of carbon nanotubes',
    ],
    category: 'quantum',
    variables: [
        {
            symbol: 'n',
            name: '양자수',
            nameEn: 'Quantum Number',
            role: 'input',
            unit: '',
            range: [1, 5],
            default: 1,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.wavelength,
            },
        },
        {
            symbol: 'L',
            name: '우물 너비',
            nameEn: 'Well Width',
            role: 'input',
            unit: 'nm',
            range: [0.5, 5],
            default: 1,
            visual: {
                property: 'stretch',
                scale: (value: number) => value * 40,
                color: colors.distance,
            },
        },
        {
            symbol: 'E',
            name: '에너지',
            nameEn: 'Energy',
            role: 'output',
            unit: 'eV',
            range: [0.04, 10],
            default: 0.38,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 5,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 1)
        const L = inputs.L ?? 1 // nm
        // E_n = n²ℏ²π²/(2mL²)
        // For electron: E_n = 0.376 * n² / L² eV (L in nm)
        const E = 0.376 * n * n / (L * L)
        return { E }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 1)
        const L = inputs.L ?? 1
        const E = 0.376 * n * n / (L * L)
        return `E = 0.376×${n}²/${L.toFixed(1)}² = ${E.toFixed(3)} eV`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'n', to: 'E', operator: '=' },
            { from: 'L', to: 'E', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'E',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'n', square: true },
                    { type: 'text', value: 'ℏ²π²' },
                ],
                denominator: [
                    { type: 'text', value: '2m' },
                    { type: 'var', symbol: 'L', square: true },
                ],
            },
        ],
    },
}
