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
    getInsight: (vars) => {
        const E = vars['E']
        const n = Math.round(vars['n'] ?? 1)
        if (n === 1 && E < 0.5) return { ko: '바닥상태의 낮은 에너지야', en: 'Low energy ground state' }
        if (E < 1) return { ko: '적외선 정도의 에너지야', en: 'Infrared level energy' }
        if (E < 3) return { ko: '가시광선 정도의 에너지야', en: 'Visible light level energy' }
        if (E < 5) return { ko: '자외선 정도의 에너지야', en: 'Ultraviolet level energy' }
        return { ko: 'X선급 높은 에너지!', en: 'X-ray level high energy!' }
    },
    discoveries: [
        {
            id: 'narrow-well',
            mission: '우물 너비 L을 0.7nm 이하로 줄여봐!',
            missionEn: 'Reduce well width L below 0.7nm!',
            result: '좁은 우물은 높은 에너지! 양자점이 작을수록 더 높은 에너지 빛을 내.',
            resultEn: 'Narrow well means higher energy! Smaller quantum dots emit higher energy light.',
            icon: '💡',
            condition: (vars) => vars['L'] <= 0.7,
        },
        {
            id: 'excited-state',
            mission: '양자수 n을 4 이상으로 올려봐!',
            missionEn: 'Raise quantum number n above 4!',
            result: '높은 양자수는 에너지가 n²에 비례해서 급격히 증가! 양자 레이저의 원리야.',
            resultEn: 'Higher quantum number means energy increases as n squared! The principle of quantum lasers.',
            icon: '🔬',
            condition: (vars) => Math.round(vars['n']) >= 4,
        },
    ],
}
