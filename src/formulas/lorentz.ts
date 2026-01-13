import { Formula } from './types'
import { colors } from '../styles/colors'

export const lorentz: Formula = {
    id: 'lorentz',
    name: '로렌츠 힘',
    nameEn: 'Lorentz Force',
    expression: 'F = qvB',
    description: '자기장 속에서 운동하는 전하에 작용하는 힘',
    descriptionEn: 'The force acting on a moving charge in a magnetic field',
    simulationHint: '자기장 속에서 움직이는 전하가 휘어지는 모습',
    simulationHintEn: 'Shows a moving charge curving in a magnetic field',
    applications: [
        '전동기(모터)의 회전 원리',
        'MRI 의료 영상 장비',
        '입자가속기에서 입자 경로 제어',
        '오로라 현상의 원리',
    ],
    applicationsEn: [
        'How electric motors rotate',
        'MRI medical imaging equipment',
        'Controlling particle paths in accelerators',
        'The physics behind aurora phenomena',
    ],
    category: 'electricity',
    variables: [
        {
            symbol: 'q',
            name: '전하량',
            nameEn: 'Charge',
            role: 'input',
            unit: 'μC',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 0.2,
                color: colors.charge,
            },
        },
        {
            symbol: 'v',
            name: '속력',
            nameEn: 'Velocity',
            role: 'input',
            unit: 'm/s',
            range: [1, 20],
            default: 5,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'B',
            name: '자기장 세기',
            nameEn: 'Magnetic Field',
            role: 'input',
            unit: 'T',
            range: [0.1, 2],
            default: 0.5,
            visual: {
                property: 'glow',
                scale: (value: number) => value * 3,
                color: colors.current,
            },
        },
        {
            symbol: 'F',
            name: '로렌츠 힘',
            nameEn: 'Lorentz Force',
            role: 'output',
            unit: 'mN',
            range: [0, 4000],
            default: 25,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 500,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const q = inputs.q ?? 10 // μC
        const v = inputs.v ?? 5 // m/s
        const B = inputs.B ?? 0.5 // T
        // F = qvB (q in μC → multiply by 1e-6 for C, result in N → multiply by 1e3 for mN)
        // F(mN) = q(μC) × v(m/s) × B(T) × 1e-6 × 1e3 = q × v × B × 1e-3
        return {
            F: q * v * B,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const q = inputs.q ?? 10
        const v = inputs.v ?? 5
        const B = inputs.B ?? 0.5
        const F = q * v * B
        return `F = ${q.toFixed(0)} × ${v.toFixed(1)} × ${B.toFixed(2)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'q', to: 'v', operator: '×' },
            { from: 'v', to: 'B', operator: '×' },
            { from: 'B', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['q', 'v', 'B'],
    },
    discoveries: [
        {
            id: 'strong-field',
            mission: '자기장 세기 B를 1.5T 이상으로 올려봐!',
            missionEn: 'Raise magnetic field B above 1.5T!',
            result: '강한 자기장은 큰 힘! MRI가 강력한 자석을 사용하는 이유야.',
            resultEn: 'Strong magnetic field means strong force! This is why MRI uses powerful magnets.',
            icon: '🧲',
            condition: (vars) => vars['B'] >= 1.5,
        },
        {
            id: 'fast-particle',
            mission: '속력 v를 15m/s 이상으로 올리고 전하 q를 50 이상으로 설정해봐!',
            missionEn: 'Raise velocity v above 15m/s and charge q above 50!',
            result: '빠른 전하는 강하게 휘어져! 입자가속기가 자기장으로 경로를 제어해.',
            resultEn: 'Fast charges curve strongly! Particle accelerators use magnetic fields to control paths.',
            icon: '🔬',
            condition: (vars) => vars['v'] >= 15 && vars['q'] >= 50,
        },
    ],
}
