import { Formula } from './types'
import { colors } from '../styles/colors'

export const wave: Formula = {
    id: 'wave',
    name: '파동 속도',
    nameEn: 'Wave Velocity',
    expression: 'v = fλ',
    description: '파동이 전파되는 속도',
    descriptionEn: 'Speed at which a wave propagates',
    applications: [
        '라디오와 TV 방송 주파수 설계',
        '초음파 검사 장비의 해상도 계산',
        '악기의 음높이와 줄 길이 관계',
        '와이파이와 블루투스 통신 설계',
    ],
    applicationsEn: [
        'Designing radio and TV broadcast frequencies',
        'Calculating ultrasound equipment resolution',
        'Relationship between musical pitch and string length',
        'Designing WiFi and Bluetooth communication',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'f',
            name: '진동수',
            nameEn: 'Frequency',
            role: 'input',
            unit: 'Hz',
            range: [0.5, 5],
            default: 2,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.time,
            },
        },
        {
            symbol: 'λ',
            name: '파장',
            nameEn: 'Wavelength',
            role: 'input',
            unit: 'm',
            range: [1, 10],
            default: 3,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 20,
                color: colors.distance,
            },
        },
        {
            symbol: 'v',
            name: '파동 속도',
            nameEn: 'Wave Speed',
            role: 'output',
            unit: 'm/s',
            range: [0, 50],
            default: 6,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const f = inputs.f ?? 2
        const lambda = inputs['λ'] ?? 3
        return {
            v: f * lambda,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const f = inputs.f ?? 2
        const lambda = inputs['λ'] ?? 3
        const v = f * lambda
        return `v = ${f.toFixed(1)} × ${lambda.toFixed(1)} = ${v.toFixed(1)}`
    },
    layout: {
        type: 'wave',
        connections: [
            { from: 'f', to: 'λ', operator: '×' },
            { from: 'λ', to: 'v', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'v',
        numerator: ['f', 'λ'],
    },
}
