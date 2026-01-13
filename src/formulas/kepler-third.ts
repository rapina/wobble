import { Formula } from './types'
import { colors } from '../styles/colors'

export const keplerThird: Formula = {
    id: 'kepler-third',
    name: '케플러 제3법칙',
    nameEn: "Kepler's Third Law",
    expression: 'T² = (4π²/GM)r³',
    description: '행성의 공전주기와 궤도반경의 관계',
    descriptionEn: 'The relationship between orbital period and orbital radius',
    simulationHint: '행성이 중심 별 주위를 공전하며 궤도에 따라 주기가 변하는 모습',
    simulationHintEn: 'Shows a planet orbiting a star with period changing based on orbital radius',
    applications: [
        '인공위성의 궤도 주기 계산',
        '외계 행성 탐색 (항성의 흔들림 분석)',
        '달의 공전주기로 지구 질량 추정',
        'GPS 위성의 정확한 궤도 설계',
    ],
    applicationsEn: [
        'Calculating satellite orbital periods',
        'Detecting exoplanets via stellar wobble',
        "Estimating Earth's mass from Moon's orbit",
        'Precise GPS satellite orbit design',
    ],
    category: 'gravity',
    variables: [
        {
            symbol: 'M',
            name: '중심 천체 질량',
            nameEn: 'Central Body Mass',
            role: 'input',
            unit: '×10²⁴kg',
            range: [1, 100000],
            default: 5.97,
            visual: {
                property: 'size',
                scale: (value: number) => 40 + Math.log10(value) * 15,
                color: colors.mass,
            },
        },
        {
            symbol: 'r',
            name: '궤도 반지름',
            nameEn: 'Orbital Radius',
            role: 'input',
            unit: '×10⁶m',
            range: [1, 10000],
            default: 384,
            visual: {
                property: 'distance',
                scale: (value: number) => Math.min(value * 0.3, 100),
                color: colors.distance,
            },
        },
        {
            symbol: 'T',
            name: '공전 주기',
            nameEn: 'Orbital Period',
            role: 'output',
            unit: '일',
            range: [0, 1000],
            default: 27.3,
            visual: {
                property: 'oscillate',
                scale: (value: number) => Math.min(value / 10, 5),
                color: colors.time,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const M = inputs.M ?? 5.97 // ×10²⁴ kg
        const r = inputs.r ?? 384 // ×10⁶ m
        const G = 6.674e-11
        const M_kg = M * 1e24
        const r_m = r * 1e6
        // T² = (4π²/GM)r³
        const T_squared = (4 * Math.PI * Math.PI * Math.pow(r_m, 3)) / (G * M_kg)
        const T_seconds = Math.sqrt(T_squared)
        const T_days = T_seconds / (24 * 3600)
        return { T: T_days }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const M = inputs.M ?? 5.97
        const r = inputs.r ?? 384
        const G = 6.674e-11
        const M_kg = M * 1e24
        const r_m = r * 1e6
        const T_squared = (4 * Math.PI * Math.PI * Math.pow(r_m, 3)) / (G * M_kg)
        const T_seconds = Math.sqrt(T_squared)
        const T_days = T_seconds / (24 * 3600)
        return `T = √(4π²r³/GM) = ${T_days.toFixed(1)} 일`
    },
    layout: {
        type: 'orbital',
        connections: [
            { from: 'M', to: 'r', operator: '÷' },
            { from: 'r', to: 'T', operator: '√' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'T',
        expression: [
            { type: 'text', value: '√' },
            {
                type: 'group',
                items: [
                    {
                        type: 'fraction',
                        numerator: [
                            { type: 'text', value: '4π²' },
                            { type: 'var', symbol: 'r', square: true },
                            { type: 'text', value: 'r' },
                        ],
                        denominator: [
                            { type: 'text', value: 'G' },
                            { type: 'var', symbol: 'M' },
                        ],
                    },
                ],
            },
        ],
    },
    discoveries: [
        {
            id: 'moon-orbit',
            mission: '지구-달 값 (M=5.97, r=384)을 설정해봐!',
            missionEn: 'Set Earth-Moon values (M=5.97, r=384)!',
            result: '달의 공전주기는 약 27일! 한 달(month)이라는 단어가 여기서 왔어.',
            resultEn: 'Moon orbital period is about 27 days! The word month comes from Moon.',
            icon: '🌙',
            condition: (vars) => vars['M'] >= 5 && vars['M'] <= 7 && vars['r'] >= 350 && vars['r'] <= 420,
        },
        {
            id: 'far-orbit',
            mission: '궤도 반지름 r을 5000 이상으로 늘려봐!',
            missionEn: 'Extend orbital radius r above 5000!',
            result: '멀리 있을수록 공전주기가 훨씬 길어져! 명왕성은 248년이나 걸려.',
            resultEn: 'Farther away means much longer orbital period! Pluto takes 248 years.',
            icon: '🪐',
            condition: (vars) => vars['r'] >= 5000,
        },
    ],
}
