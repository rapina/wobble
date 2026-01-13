import { Formula } from './types'
import { colors } from '../styles/colors'

export const pendulum: Formula = {
    id: 'pendulum',
    name: '단진자 주기',
    nameEn: 'Simple Pendulum',
    expression: 'T = 2π√(L/g)',
    description: '진자가 한 번 왕복하는 시간',
    descriptionEn: 'The time for a pendulum to complete one full swing',
    simulationHint: '진자가 좌우로 흔들리며 길이에 따라 주기가 변하는 모습',
    simulationHintEn: 'Shows a pendulum swinging with period changing based on length',
    applications: [
        '괘종시계의 정확한 시간 측정',
        '지진계의 진동 감지',
        '중력 가속도 정밀 측정',
        '메트로놈의 박자 조절',
    ],
    applicationsEn: [
        'Precise timekeeping in grandfather clocks',
        'Seismograph vibration detection',
        'Precision measurement of gravitational acceleration',
        'Metronome tempo adjustment',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'L',
            name: '줄 길이',
            nameEn: 'String Length',
            role: 'input',
            unit: 'm',
            range: [0.5, 5],
            default: 2,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 40,
                color: colors.distance,
            },
        },
        {
            symbol: 'g',
            name: '중력가속도',
            nameEn: 'Gravitational Accel.',
            role: 'input',
            unit: 'm/s²',
            range: [1, 20],
            default: 9.8,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.3,
                color: colors.velocity,
            },
        },
        {
            symbol: 'T',
            name: '주기',
            nameEn: 'Period',
            role: 'output',
            unit: 's',
            range: [0, 10],
            default: 2.84,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.time,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const L = inputs.L ?? 2
        const g = inputs.g ?? 9.8
        return {
            T: 2 * Math.PI * Math.sqrt(L / g),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const L = inputs.L ?? 2
        const g = inputs.g ?? 9.8
        const T = 2 * Math.PI * Math.sqrt(L / g)
        return `T = 2π × √(${L.toFixed(1)} ÷ ${g.toFixed(1)}) = ${T.toFixed(2)}`
    },
    layout: {
        type: 'pendulum',
        connections: [
            { from: 'L', to: 'g', operator: '÷' },
            { from: 'g', to: 'T', operator: '√' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'T',
        expression: [
            { type: 'text', value: '2π' },
            { type: 'text', value: '√' },
            {
                type: 'group',
                items: [
                    {
                        type: 'fraction',
                        numerator: [{ type: 'var', symbol: 'L' }],
                        denominator: [{ type: 'var', symbol: 'g' }],
                    },
                ],
            },
        ],
    },
}
