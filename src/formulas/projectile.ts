import { Formula } from './types'
import { colors } from '../styles/colors'

export const projectile: Formula = {
    id: 'projectile',
    name: '포물선 운동',
    nameEn: 'Projectile Motion',
    expression: 'R = v²sin2θ/g',
    description: '비스듬히 던진 물체의 수평 도달 거리',
    descriptionEn: 'The horizontal range of an object thrown at an angle',
    simulationHint: '물체가 포물선 궤적을 그리며 날아가는 모습',
    simulationHintEn: 'Shows an object flying through the air in a parabolic trajectory',
    applications: [
        '축구나 농구에서 공의 궤적 예측',
        '대포나 미사일의 사거리 계산',
        '분수대 물줄기 설계',
        '골프 드라이버 샷의 최적 각도',
    ],
    applicationsEn: [
        'Predicting ball trajectory in soccer or basketball',
        'Calculating cannon or missile range',
        'Designing fountain water jets',
        'Finding optimal angle for golf drives',
    ],
    category: 'gravity',
    variables: [
        {
            symbol: 'v',
            name: '초기 속력',
            nameEn: 'Initial Velocity',
            role: 'input',
            unit: 'm/s',
            range: [5, 50],
            default: 20,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.2,
                color: colors.velocity,
            },
        },
        {
            symbol: 'θ',
            name: '발사각',
            nameEn: 'Launch Angle',
            role: 'input',
            unit: '°',
            range: [10, 80],
            default: 45,
            visual: {
                property: 'stretch',
                scale: (value: number) => value / 30,
                color: colors.force,
            },
        },
        {
            symbol: 'g',
            name: '중력가속도',
            nameEn: 'Gravitational Accel.',
            role: 'input',
            unit: 'm/s²',
            range: [1, 25],
            default: 9.8,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 5,
                color: colors.mass,
            },
        },
        {
            symbol: 'R',
            name: '수평 도달거리',
            nameEn: 'Horizontal Range',
            role: 'output',
            unit: 'm',
            range: [0, 300],
            default: 40.8,
            visual: {
                property: 'distance',
                scale: (value: number) => Math.min(value, 150),
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const v = inputs.v ?? 20
        const theta = inputs['θ'] ?? 45
        const g = inputs.g ?? 9.8
        const thetaRad = (theta * Math.PI) / 180
        const R = (v * v * Math.sin(2 * thetaRad)) / g
        return { R }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const v = inputs.v ?? 20
        const theta = inputs['θ'] ?? 45
        const g = inputs.g ?? 9.8
        const thetaRad = (theta * Math.PI) / 180
        const R = (v * v * Math.sin(2 * thetaRad)) / g
        return `R = ${v.toFixed(0)}² × sin(${(2 * theta).toFixed(0)}°) ÷ ${g.toFixed(1)} = ${R.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'v', to: 'θ', operator: '×' },
            { from: 'θ', to: 'g', operator: '÷' },
            { from: 'g', to: 'R', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'R',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'v', square: true },
                    { type: 'text', value: 'sin2' },
                    { type: 'var', symbol: 'θ' },
                ],
                denominator: [{ type: 'var', symbol: 'g' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'optimal-angle',
            mission: '발사각 θ를 45°로 설정해봐!',
            missionEn: 'Set launch angle θ to 45 degrees!',
            result: '45°가 최대 도달 거리! sin(90°)=1이 되어 최대 효율이야.',
            resultEn: '45 degrees gives maximum range! Because sin(90 degrees)=1 gives maximum efficiency.',
            icon: '🎯',
            condition: (vars) => vars['θ'] >= 44 && vars['θ'] <= 46,
        },
        {
            id: 'low-gravity-launch',
            mission: '중력가속도 g를 3 이하로 낮춰봐! (달이나 화성)',
            missionEn: 'Lower gravitational acceleration g below 3! (Moon or Mars)',
            result: '중력이 약하면 물체가 훨씬 멀리 날아가! 달에서는 골프공이 엄청 멀리 갈 거야.',
            resultEn: 'With weak gravity, objects fly much farther! A golf ball on the Moon would go incredibly far.',
            icon: '🌙',
            condition: (vars) => vars['g'] <= 3,
        },
    ],
}
