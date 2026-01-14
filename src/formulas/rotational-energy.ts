import { Formula } from './types'
import { colors } from '../styles/colors'

export const rotationalEnergy: Formula = {
    id: 'rotational-energy',
    name: '회전 운동 에너지',
    nameEn: 'Rotational Kinetic Energy',
    expression: 'E = ½Iω²',
    description: '회전하는 물체가 가진 에너지',
    descriptionEn: 'The energy possessed by a rotating object',
    simulationHint: '각속도를 높이면 에너지가 급격히 증가하는 것을 보세요',
    simulationHintEn: 'Watch how energy increases rapidly with angular velocity',
    applications: [
        '플라이휠 - 에너지 저장 장치',
        '자이로스코프 - 균형 유지 시스템',
        '자동차 바퀴 - 관성으로 굴러감',
        'F1 KERS - 제동 에너지를 회전으로 저장',
    ],
    applicationsEn: [
        'Flywheel - energy storage device',
        'Gyroscope - balance maintaining system',
        'Car wheels - rolling with inertia',
        'F1 KERS - storing braking energy as rotation',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'I',
            name: '관성 모멘트',
            nameEn: 'Moment of inertia',
            role: 'input',
            unit: 'kg·m²',
            range: [0.1, 10],
            default: 2,
            visual: {
                property: 'size',
                scale: (v) => v * 10,
                color: colors.mass,
            },
        },
        {
            symbol: 'ω',
            name: '각속도',
            nameEn: 'Angular velocity',
            role: 'input',
            unit: 'rad/s',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'speed',
                scale: (v) => v,
                color: colors.velocity,
            },
        },
        {
            symbol: 'E',
            name: '회전 에너지',
            nameEn: 'Rotational energy',
            role: 'output',
            unit: 'J',
            range: [0, 5000],
            default: 100,
            visual: {
                property: 'glow',
                scale: (v) => v / 100,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs) => {
        const I = inputs['I'] || 2
        const omega = inputs['ω'] || 10
        const E = 0.5 * I * omega * omega
        return { E: Math.round(E * 10) / 10 }
    },
    formatCalculation: (inputs) => {
        const I = inputs['I'] || 2
        const omega = inputs['ω'] || 10
        const E = 0.5 * I * omega * omega
        return `E = ½ × ${I} × ${omega}² = ${E.toFixed(1)} J`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'I', to: 'E', operator: '×' },
            { from: 'ω', to: 'E', operator: '²' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'E',
        coefficient: '½',
        numerator: ['I', 'ω'],
        squares: ['ω'],
    },
    discoveries: [
        {
            id: 'fast-spin',
            mission: 'ω를 최대로 올려서 엄청난 에너지를 만들어봐',
            missionEn: 'Maximize ω to create huge energy',
            result: '속도의 제곱! 2배 빨라지면 4배 에너지!',
            resultEn: 'Squared speed! 2x faster = 4x energy!',
            icon: '🌀',
            condition: (vars) => {
                const omega = vars['ω'] || 10
                const E = vars['E'] || 100
                return omega >= 45 && E >= 1000
            },
        },
        {
            id: 'heavy-flywheel',
            mission: 'I를 최대로 올려봐',
            missionEn: 'Maximize moment of inertia I',
            result: '무거운 플라이휠이 더 많은 에너지를 저장해!',
            resultEn: 'Heavier flywheel stores more energy!',
            icon: '⚙️',
            condition: (vars) => {
                const I = vars['I'] || 2
                return I >= 9
            },
        },
        {
            id: 'energy-storage',
            mission: 'E를 2000J 이상으로 만들어봐',
            missionEn: 'Create E above 2000J',
            result: '플라이휠 배터리는 이 원리로 에너지를 저장해!',
            resultEn: 'Flywheel batteries use this to store energy!',
            icon: '🔋',
            condition: (vars) => {
                const E = vars['E'] || 100
                return E >= 2000
            },
        },
    ],
    getInsight: (variables) => {
        const E = variables['E'] || 100
        const omega = variables['ω'] || 10

        const rpm = (omega * 60) / (2 * Math.PI)
        if (E > 500) {
            return {
                ko: `${E.toFixed(0)}J은 ${(E / 4.184).toFixed(0)}cal, 약 ${(E / 4184).toFixed(2)}kcal의 열량이에요!`,
                en: `${E.toFixed(0)}J equals ${(E / 4.184).toFixed(0)}cal, about ${(E / 4184).toFixed(2)}kcal!`,
            }
        }
        return {
            ko: `${rpm.toFixed(0)} RPM으로 회전 중! 자동차 엔진은 보통 1000-7000 RPM이에요.`,
            en: `Spinning at ${rpm.toFixed(0)} RPM! Car engines typically run at 1000-7000 RPM.`,
        }
    },
}
