import { Formula } from './types'
import { colors } from '../styles/colors'

export const angularMomentum: Formula = {
    id: 'angular-momentum',
    name: '각운동량 보존',
    nameEn: 'Angular Momentum',
    expression: 'L = Iω',
    description: '회전하는 물체의 각운동량은 외부 토크가 없으면 보존된다',
    descriptionEn:
        'Angular momentum of a rotating object is conserved when no external torque acts on it',
    simulationHint: '관성 모멘트를 줄이면 회전 속도가 빨라지는 것을 관찰하세요',
    simulationHintEn: 'Watch how reducing moment of inertia increases rotation speed',
    applications: [
        '피겨 스케이팅 - 팔을 오므리면 회전이 빨라짐',
        '다이빙 - 몸을 웅크리면 회전 속도 증가',
        '자전거 바퀴 - 자이로스코프 효과로 균형 유지',
        '행성 형성 - 가스 구름이 수축하며 회전 가속',
    ],
    applicationsEn: [
        'Figure skating - pulling arms in speeds up the spin',
        'Diving - tucking body increases rotation speed',
        'Bicycle wheel - gyroscopic effect maintains balance',
        'Planet formation - gas clouds spin faster as they contract',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'L',
            name: '각운동량',
            nameEn: 'Angular momentum',
            role: 'input',
            unit: 'kg·m²/s',
            range: [10, 100],
            default: 50,
            visual: {
                property: 'glow',
                scale: (v) => v / 20,
                color: colors.force,
            },
        },
        {
            symbol: 'I',
            name: '관성 모멘트',
            nameEn: 'Moment of inertia',
            role: 'input',
            unit: 'kg·m²',
            range: [1, 20],
            default: 10,
            visual: {
                property: 'size',
                scale: (v) => v * 3,
                color: colors.mass,
            },
        },
        {
            symbol: 'ω',
            name: '각속도',
            nameEn: 'Angular velocity',
            role: 'output',
            unit: 'rad/s',
            range: [0.5, 100],
            default: 5,
            visual: {
                property: 'speed',
                scale: (v) => v,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs) => {
        const L = inputs['L'] || 50
        const I = inputs['I'] || 10
        const omega = L / I
        return { 'ω': Math.round(omega * 100) / 100 }
    },
    formatCalculation: (inputs) => {
        const L = inputs['L'] || 50
        const I = inputs['I'] || 10
        const omega = L / I
        return `ω = L/I = ${L}/${I} = ${omega.toFixed(2)} rad/s`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'L', to: 'ω', operator: '÷' },
            { from: 'I', to: 'ω', operator: '÷' },
        ],
    },
    displayLayout: {
        type: 'fraction',
        output: 'ω',
        numerator: ['L'],
        denominator: ['I'],
    },
    discoveries: [
        {
            id: 'skater-spin',
            mission: 'I를 줄여서 피겨 스케이터처럼 빠르게 회전해봐',
            missionEn: 'Decrease I to spin fast like a figure skater',
            result: '팔을 모으면 관성 모멘트가 줄어 회전이 빨라져!',
            resultEn: 'Pulling arms in reduces moment of inertia, speeding up rotation!',
            icon: '⛸️',
            condition: (vars) => {
                const I = vars['I'] || 10
                const omega = vars['ω'] || 5
                return I <= 3 && omega >= 15
            },
        },
        {
            id: 'slow-rotation',
            mission: 'I를 늘려서 천천히 회전해봐',
            missionEn: 'Increase I to rotate slowly',
            result: '팔을 벌리면 관성 모멘트가 커져 회전이 느려져!',
            resultEn: 'Spreading arms increases moment of inertia, slowing rotation!',
            icon: '🦅',
            condition: (vars) => {
                const I = vars['I'] || 10
                const omega = vars['ω'] || 5
                return I >= 15 && omega <= 4
            },
        },
        {
            id: 'high-momentum',
            mission: 'L을 최대로 높여봐',
            missionEn: 'Maximize L',
            result: '각운동량이 클수록 더 강력한 회전력을 가져!',
            resultEn: 'Higher angular momentum means stronger rotational power!',
            icon: '💫',
            condition: (vars) => {
                const L = vars['L'] || 50
                return L >= 90
            },
        },
    ],
    getInsight: (variables) => {
        const L = variables['L'] || 50
        const I = variables['I'] || 10
        const omega = variables['ω'] || 5

        if (omega > 20) {
            return {
                ko: `초당 ${(omega / (2 * Math.PI)).toFixed(1)}바퀴! 피겨 선수들은 초당 5-6회전까지 해요.`,
                en: `${(omega / (2 * Math.PI)).toFixed(1)} rotations per second! Figure skaters can do 5-6 spins/sec.`,
            }
        }

        if (I <= 3) {
            return {
                ko: `관성 모멘트가 작아 빠르게 회전해요. 피겨 스케이터가 팔을 모으는 원리!`,
                en: `Low moment of inertia means fast rotation. This is how figure skaters spin!`,
            }
        }

        return {
            ko: `각운동량 ${L}이 보존되면서 회전 속도가 결정돼요.`,
            en: `With angular momentum ${L} conserved, the rotation speed is determined.`,
        }
    },
}
