import { Formula } from './types'
import { colors } from '../styles/colors'

export const beatFrequency: Formula = {
    id: 'beat-frequency',
    name: '맥놀이',
    nameEn: 'Beat Frequency',
    expression: 'fbeat = |f₁ - f₂|',
    description: '비슷한 두 진동수가 만나면 맥놀이 현상이 일어난다',
    descriptionEn:
        'When two similar frequencies meet, they create a beat pattern',
    simulationHint: '두 진동수를 비슷하게 맞추면 느린 맥놀이가 보여요',
    simulationHintEn: 'Match frequencies closely to see slow beats',
    applications: [
        '악기 조율 - 두 음의 맥놀이로 튜닝',
        '피아노 조율사 - 소리굽쇠와 비교',
        '라디오 튜닝 - 주파수 맞추기',
        '진동 분석 - 공진 주파수 찾기',
    ],
    applicationsEn: [
        'Instrument tuning - using beats between two notes',
        'Piano tuners - comparing with tuning fork',
        'Radio tuning - matching frequencies',
        'Vibration analysis - finding resonance',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'f₁',
            name: '진동수 1',
            nameEn: 'Frequency 1',
            role: 'input',
            unit: 'Hz',
            range: [200, 500],
            default: 440,
            visual: {
                property: 'oscillate',
                scale: (v) => v / 100,
                color: colors.wavelength,
            },
        },
        {
            symbol: 'f₂',
            name: '진동수 2',
            nameEn: 'Frequency 2',
            role: 'input',
            unit: 'Hz',
            range: [200, 500],
            default: 445,
            visual: {
                property: 'oscillate',
                scale: (v) => v / 100,
                color: colors.energy,
            },
        },
        {
            symbol: 'fbeat',
            name: '맥놀이 진동수',
            nameEn: 'Beat frequency',
            role: 'output',
            unit: 'Hz',
            range: [0, 100],
            default: 5,
            visual: {
                property: 'oscillate',
                scale: (v) => v,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs) => {
        const f1 = inputs['f₁'] || 440
        const f2 = inputs['f₂'] || 445
        const fbeat = Math.abs(f1 - f2)
        return { fbeat: Math.round(fbeat * 10) / 10 }
    },
    formatCalculation: (inputs) => {
        const f1 = inputs['f₁'] || 440
        const f2 = inputs['f₂'] || 445
        const fbeat = Math.abs(f1 - f2)
        return `fbeat = |${f1} - ${f2}| = ${fbeat} Hz`
    },
    layout: {
        type: 'wave',
        connections: [
            { from: 'f₁', to: 'fbeat', operator: '-' },
            { from: 'f₂', to: 'fbeat', operator: '-' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'fbeat',
        expression: [
            { type: 'op', value: '|' },
            { type: 'var', symbol: 'f₁' },
            { type: 'op', value: '-' },
            { type: 'var', symbol: 'f₂' },
            { type: 'op', value: '|' },
        ],
    },
    discoveries: [
        {
            id: 'perfect-tune',
            mission: 'f₁과 f₂를 같게 맞춰봐',
            missionEn: 'Match f₁ and f₂ exactly',
            result: '맥놀이가 0이면 완벽한 튜닝! 악기 조율의 원리!',
            resultEn: 'Zero beats = perfect tuning! This is how instruments are tuned!',
            icon: '🎵',
            condition: (vars) => {
                const fbeat = vars['fbeat'] || 5
                return fbeat === 0
            },
        },
        {
            id: 'slow-beat',
            mission: '맥놀이를 1-3Hz로 맞춰봐',
            missionEn: 'Set beat frequency to 1-3Hz',
            result: '느린 맥놀이는 귀로 쉽게 들을 수 있어!',
            resultEn: 'Slow beats are easy to hear!',
            icon: '👂',
            condition: (vars) => {
                const fbeat = vars['fbeat'] || 5
                return fbeat >= 1 && fbeat <= 3
            },
        },
        {
            id: 'large-difference',
            mission: '진동수 차이를 50Hz 이상으로 만들어봐',
            missionEn: 'Create frequency difference over 50Hz',
            result: '차이가 크면 맥놀이 대신 두 개의 다른 음으로 들려!',
            resultEn: 'Large difference sounds like two separate notes!',
            icon: '🎼',
            condition: (vars) => {
                const fbeat = vars['fbeat'] || 5
                return fbeat >= 50
            },
        },
    ],
    getInsight: (variables) => {
        const f1 = variables['f₁'] || 440
        const fbeat = variables['fbeat'] || 5

        if (fbeat <= 5 && fbeat > 0) {
            return {
                ko: `초당 ${fbeat}번의 맥놀이! 피아노 조율사는 이걸 듣고 조율해요.`,
                en: `${fbeat} beats per second! Piano tuners listen for this to tune.`,
            }
        }
        if (f1 === 440) {
            return {
                ko: `440Hz는 음악의 표준 '라' 음이에요. 오케스트라가 이 음으로 맞춰요!`,
                en: `440Hz is the standard 'A' note. Orchestras tune to this!`,
            }
        }
        return {
            ko: `두 파동이 만나 간섭하면 보강과 상쇄가 반복되는 맥놀이가 생겨요!`,
            en: `Two waves interfering create alternating reinforcement and cancellation!`,
        }
    },
}
