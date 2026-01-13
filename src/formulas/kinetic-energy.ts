import { Formula } from './types'
import { colors } from '../styles/colors'

export const kineticEnergy: Formula = {
    id: 'kinetic-energy',
    name: '운동 에너지',
    nameEn: 'Kinetic Energy',
    expression: 'E = ½mv²',
    description: '움직이는 물체가 가진 에너지',
    descriptionEn: 'Energy possessed by a moving object',
    simulationHint: '물체의 속도가 빨라질수록 운동 에너지가 커지는 모습',
    simulationHintEn: 'Shows kinetic energy increasing as object speed increases',
    applications: [
        '자동차 충돌 시 발생하는 충격 에너지 계산',
        '롤러코스터 설계 시 속도와 에너지 관계 분석',
        '총알이나 운석의 파괴력 계산',
        '풍력 발전기의 발전량 예측',
    ],
    applicationsEn: [
        'Calculating impact energy in car collisions',
        'Analyzing speed-energy relationship in roller coaster design',
        'Calculating destructive power of bullets or meteorites',
        'Predicting power generation of wind turbines',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: '질량',
            nameEn: 'Mass',
            role: 'input',
            unit: 'kg',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 40 + value * 1.5,
                color: colors.mass,
            },
        },
        {
            symbol: 'v',
            name: '속도',
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
            symbol: 'E',
            name: '에너지',
            nameEn: 'Energy',
            role: 'output',
            unit: 'J',
            range: [0, 10000],
            default: 125,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.min(value * 0.01, 10),
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const v = inputs.v ?? 5
        return {
            E: 0.5 * m * v * v,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const v = inputs.v ?? 5
        const E = 0.5 * m * v * v
        return `E = ½ × ${m.toFixed(0)} × ${v.toFixed(1)}² = ${E.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm', to: 'v', operator: '×' },
            { from: 'v', to: 'E', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'E',
        coefficient: '½',
        numerator: ['m', 'v'],
        squares: ['v'],
    },
    discoveries: [
        {
            id: 'velocity-squared',
            mission: '속도 v를 2배로 늘려봐! (5에서 10으로)',
            missionEn: 'Double the velocity v! (from 5 to 10)',
            result: '속도가 2배가 되면 에너지는 4배! 속도의 제곱에 비례하기 때문이야.',
            resultEn: 'Doubling velocity quadruples energy! Because energy is proportional to velocity squared.',
            icon: '📈',
            condition: (vars) => vars['v'] >= 10,
        },
        {
            id: 'high-speed-impact',
            mission: '속도 v를 18 이상으로 올려봐!',
            missionEn: 'Raise velocity v above 18!',
            result: '고속 충돌은 엄청난 에너지를 전달해! 자동차 안전벨트가 중요한 이유야.',
            resultEn: 'High-speed collisions transfer enormous energy! This is why seatbelts are crucial.',
            icon: '🚗',
            condition: (vars) => vars['v'] >= 18,
        },
    ],
}
