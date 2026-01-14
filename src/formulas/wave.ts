import { Formula } from './types'
import { colors } from '../styles/colors'

export const wave: Formula = {
    id: 'wave',
    name: '파동 속도',
    nameEn: 'Wave Velocity',
    expression: 'v = fλ',
    description: '파동이 전파되는 속도',
    descriptionEn: 'Speed at which a wave propagates',
    simulationHint: '파동이 진동수와 파장에 따라 전파되는 모습',
    simulationHintEn: 'Shows a wave propagating based on frequency and wavelength',
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
    discoveries: [
        {
            id: 'high-frequency',
            mission: '진동수 f를 4Hz 이상으로 올려봐!',
            missionEn: 'Raise frequency f above 4Hz!',
            result: '진동수가 높으면 빠르게 진동해! 높은 음은 진동수가 높은 소리야.',
            resultEn: 'Higher frequency means faster vibration! High-pitched sounds have high frequency.',
            icon: '🎵',
            condition: (vars) => vars['f'] >= 4,
        },
        {
            id: 'long-wavelength',
            mission: '파장 λ를 8m 이상으로 늘려봐!',
            missionEn: 'Extend wavelength λ above 8m!',
            result: '파장이 길면 장애물을 잘 돌아가! AM 라디오가 건물 뒤에서도 들리는 이유야.',
            resultEn: 'Long wavelengths bend around obstacles! This is why AM radio works behind buildings.',
            icon: '📻',
            condition: (vars) => vars['λ'] >= 8,
        },
    ],
    getInsight: (vars) => {
        const v = vars['v']
        if (v < 5) return { ko: '걷는 속도 정도야', en: 'Walking speed' }
        if (v < 15) return { ko: '자전거 속도 정도야', en: 'Like cycling speed' }
        if (v < 30) return { ko: '달리는 자동차 속도야', en: 'Like a car speed' }
        if (v < 40) return { ko: '고속도로 속도야', en: 'Highway speed' }
        return { ko: '빠른 파동이야!', en: 'Fast wave!' }
    },
}
