import { Formula } from './types'
import { colors } from '../styles/colors'

export const escapeVelocity: Formula = {
    id: 'escape-velocity',
    name: '탈출속도',
    nameEn: 'Escape Velocity',
    expression: 'v = √(2GM/r)',
    description: '행성의 중력을 벗어나기 위한 최소 속도',
    descriptionEn: "The minimum velocity needed to escape a planet's gravity",
    simulationHint: '물체가 행성의 중력을 벗어나는 데 필요한 속도를 보여주는 모습',
    simulationHintEn: 'Shows the velocity needed for an object to escape planetary gravity',
    applications: [
        '로켓 발사 속도 계산',
        '블랙홀의 사건 지평선 이해',
        '행성 대기 유지 조건',
        '우주 탐사선의 궤도 설계',
    ],
    applicationsEn: [
        'Calculating rocket launch velocity',
        'Understanding black hole event horizons',
        'Conditions for planetary atmosphere retention',
        'Designing spacecraft trajectories',
    ],
    category: 'gravity',
    variables: [
        {
            symbol: 'M',
            name: '행성 질량',
            nameEn: 'Planet Mass',
            role: 'input',
            unit: '×10²⁴kg',
            range: [0.1, 200],
            default: 5.97,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 0.3,
                color: colors.mass,
            },
        },
        {
            symbol: 'r',
            name: '행성 반지름',
            nameEn: 'Planet Radius',
            role: 'input',
            unit: '×10⁶m',
            range: [1, 100],
            default: 6.37,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 2,
                color: colors.distance,
            },
        },
        {
            symbol: 'v',
            name: '탈출속도',
            nameEn: 'Escape Velocity',
            role: 'output',
            unit: 'km/s',
            range: [0, 100],
            default: 11.2,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.3,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const M = inputs.M ?? 5.97 // ×10²⁴ kg
        const r = inputs.r ?? 6.37 // ×10⁶ m
        const G = 6.674e-11
        // M in 10^24 kg, r in 10^6 m
        const M_kg = M * 1e24
        const r_m = r * 1e6
        const v_ms = Math.sqrt((2 * G * M_kg) / r_m)
        const v_kms = v_ms / 1000
        return { v: v_kms }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const M = inputs.M ?? 5.97
        const r = inputs.r ?? 6.37
        const G = 6.674e-11
        const M_kg = M * 1e24
        const r_m = r * 1e6
        const v_ms = Math.sqrt((2 * G * M_kg) / r_m)
        const v_kms = v_ms / 1000
        return `v = √(2G × ${M.toFixed(2)} ÷ ${r.toFixed(2)}) = ${v_kms.toFixed(1)} km/s`
    },
    layout: {
        type: 'orbital',
        connections: [
            { from: 'M', to: 'r', operator: '÷' },
            { from: 'r', to: 'v', operator: '√' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'v',
        expression: [
            { type: 'text', value: '√' },
            {
                type: 'group',
                items: [
                    {
                        type: 'fraction',
                        numerator: [
                            { type: 'text', value: '2G' },
                            { type: 'var', symbol: 'M' },
                        ],
                        denominator: [{ type: 'var', symbol: 'r' }],
                    },
                ],
            },
        ],
    },
}
