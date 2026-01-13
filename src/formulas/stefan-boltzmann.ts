import { Formula } from './types'
import { colors } from '../styles/colors'

export const stefanBoltzmann: Formula = {
    id: 'stefan-boltzmann',
    name: '스테판-볼츠만 법칙',
    nameEn: 'Stefan-Boltzmann Law',
    expression: 'P = σAT⁴',
    description: '흑체가 방출하는 복사 에너지',
    descriptionEn: 'The radiant energy emitted by a black body',
    simulationHint: '온도에 따라 물체가 방출하는 복사 에너지가 급격히 변하는 모습',
    simulationHintEn: 'Shows radiant energy increasing dramatically with temperature',
    applications: [
        '태양의 표면 온도 측정',
        '적외선 체온계의 작동 원리',
        '별의 밝기와 크기 관계 계산',
        '지구의 열균형과 기후 모델링',
    ],
    applicationsEn: [
        "Measuring the Sun's surface temperature",
        'How infrared thermometers work',
        'Calculating star brightness and size relationships',
        "Earth's thermal equilibrium and climate modeling",
    ],
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'A',
            name: '표면적',
            nameEn: 'Surface Area',
            role: 'input',
            unit: 'm²',
            range: [1, 10],
            default: 4,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 6,
                color: colors.distance,
            },
        },
        {
            symbol: 'T',
            name: '절대온도',
            nameEn: 'Absolute Temperature',
            role: 'input',
            unit: 'K',
            range: [300, 1200],
            default: 600,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 150,
                color: colors.temperature,
            },
        },
        {
            symbol: 'P',
            name: '복사 전력',
            nameEn: 'Radiated Power',
            role: 'output',
            unit: 'W',
            range: [0, 500000],
            default: 29376,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.min(value / 800, 10),
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const A = inputs.A ?? 1
        const T = inputs.T ?? 500
        const sigma = 5.67e-8 // Stefan-Boltzmann constant
        return {
            P: sigma * A * Math.pow(T, 4),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const A = inputs.A ?? 1
        const T = inputs.T ?? 500
        const sigma = 5.67e-8
        const P = sigma * A * Math.pow(T, 4)
        return `P = σ × ${A.toFixed(1)} × ${T.toFixed(0)}⁴ = ${P.toFixed(0)}`
    },
    layout: {
        type: 'explosion',
        connections: [
            { from: 'A', to: 'T', operator: '×' },
            { from: 'T', to: 'P', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'P',
        expression: [
            { type: 'text', value: 'σ' },
            { type: 'var', symbol: 'A' },
            { type: 'var', symbol: 'T', square: true },
            { type: 'text', value: '²' },
        ],
    },
}
