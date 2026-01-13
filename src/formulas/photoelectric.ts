import { Formula } from './types'
import { colors } from '../styles/colors'

export const photoelectric: Formula = {
    id: 'photoelectric',
    name: '광전효과',
    nameEn: 'Photoelectric Effect',
    expression: 'Ek = hf - W',
    description: '빛이 금속 표면에서 전자를 방출시킬 때, 전자의 운동에너지',
    descriptionEn: 'The kinetic energy of electrons emitted when light strikes a metal surface',
    simulationHint: '빛이 금속에 닿으면 전자가 튀어나오는 모습',
    simulationHintEn: 'Shows electrons being ejected when light hits a metal surface',
    applications: [
        '태양전지의 전기 생산 원리',
        '디지털 카메라 이미지 센서',
        '자동문의 적외선 센서',
        '야간 투시경과 광전자 증배관',
    ],
    applicationsEn: [
        'How solar cells generate electricity',
        'Digital camera image sensors',
        'Automatic door infrared sensors',
        'Night vision and photomultiplier tubes',
    ],
    category: 'special',
    variables: [
        {
            symbol: 'f',
            name: '빛의 진동수',
            nameEn: 'Light Frequency',
            role: 'input',
            unit: '×10¹⁴ Hz',
            range: [4, 12],
            default: 7,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 3,
                color: colors.time,
            },
        },
        {
            symbol: 'W',
            name: '일함수',
            nameEn: 'Work Function',
            role: 'input',
            unit: 'eV',
            range: [1, 5],
            default: 2.3,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 8,
                color: colors.resistance,
            },
        },
        {
            symbol: 'Ek',
            name: '운동에너지',
            nameEn: 'Kinetic Energy',
            role: 'output',
            unit: 'eV',
            range: [0, 5],
            default: 0.6,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 2,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const f = inputs.f ?? 7 // ×10¹⁴ Hz
        const W = inputs.W ?? 2.3 // eV
        // h = 4.136 × 10⁻¹⁵ eV·s
        // E = hf = 4.136 × 10⁻¹⁵ × f × 10¹⁴ = 0.4136 × f eV
        const h = 0.4136 // eV per 10¹⁴ Hz
        const Ek = Math.max(0, h * f - W)
        return { Ek }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const f = inputs.f ?? 7
        const W = inputs.W ?? 2.3
        const h = 0.4136
        const hf = h * f
        const Ek = Math.max(0, hf - W)
        if (hf < W) {
            return `Ek = ${hf.toFixed(2)} - ${W.toFixed(1)} < 0 → 방출 불가`
        }
        return `Ek = ${hf.toFixed(2)} - ${W.toFixed(1)} = ${Ek.toFixed(2)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'f', to: 'W', operator: '-' },
            { from: 'W', to: 'Ek', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'Ek',
        expression: [
            { type: 'text', value: 'h' },
            { type: 'var', symbol: 'f' },
            { type: 'op', value: '-' },
            { type: 'var', symbol: 'W' },
        ],
    },
    discoveries: [
        {
            id: 'threshold-frequency',
            mission: '진동수를 낮춰서 방출이 안 되게 해봐!',
            missionEn: 'Lower the frequency until emission stops!',
            result: '문턱 진동수 발견! 아무리 밝아도 전자가 안 나와!',
            resultEn: 'Threshold frequency found! No emission regardless of intensity!',
            icon: '🚫',
            condition: (vars) => {
                const f = vars.f ?? 7
                const W = vars.W ?? 2.3
                const h = 0.4136
                return h * f < W
            },
        },
        {
            id: 'high-energy-electron',
            mission: '진동수를 최대로 올려봐!',
            missionEn: 'Maximize the frequency!',
            result: '고에너지 빛은 빠른 전자를 만들어!',
            resultEn: 'High-energy light creates fast electrons!',
            icon: '⚡',
            condition: (vars) => vars.f >= 11,
        },
    ],
}
