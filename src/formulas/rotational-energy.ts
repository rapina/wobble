import { Formula } from './types'
import { colors } from '../styles/colors'

export const rotationalEnergy: Formula = {
    id: 'rotational-energy',
    name: { ko: '회전 운동 에너지', en: 'Rotational Kinetic Energy', ja: '回転運動エネルギー' },
    expression: 'E = ½Iω²',
    description: {
        ko: '회전하는 물체가 가진 에너지',
        en: 'The energy possessed by a rotating object',
        ja: '回転する物体が持つエネルギー',
    },
    simulationHint: {
        ko: '각속도를 높이면 에너지가 급격히 증가하는 것을 보세요',
        en: 'Watch how energy increases rapidly with angular velocity',
        ja: '角速度を上げるとエネルギーが急激に増加する様子を見よう',
    },
    applications: {
        ko: [
            '플라이휠 - 에너지 저장 장치',
            '자이로스코프 - 균형 유지 시스템',
            '자동차 바퀴 - 관성으로 굴러감',
            'F1 KERS - 제동 에너지를 회전으로 저장',
        ],
        en: [
            'Flywheel - energy storage device',
            'Gyroscope - balance maintaining system',
            'Car wheels - rolling with inertia',
            'F1 KERS - storing braking energy as rotation',
        ],
        ja: [
            'フライホイール - エネルギー貯蔵装置',
            'ジャイロスコープ - バランス維持システム',
            '自動車の車輪 - 慣性で転がる',
            'F1のKERS - ブレーキエネルギーを回転として貯蔵',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'I',
            name: { ko: '관성 모멘트', en: 'Moment of inertia', ja: '慣性モーメント' },
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
            name: { ko: '각속도', en: 'Angular velocity', ja: '角速度' },
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
            name: { ko: '회전 에너지', en: 'Rotational energy', ja: '回転エネルギー' },
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
            mission: {
                ko: 'ω를 최대로 올려서 엄청난 에너지를 만들어봐',
                en: 'Maximize ω to create huge energy',
                ja: 'ωを最大にして巨大なエネルギーを作ってみて',
            },
            result: {
                ko: '속도의 제곱! 2배 빨라지면 4배 에너지!',
                en: 'Squared speed! 2x faster = 4x energy!',
                ja: '速度の二乗！2倍速いと4倍のエネルギー！',
            },
            icon: '🌀',
            condition: (vars) => {
                const omega = vars['ω'] || 10
                const E = vars['E'] || 100
                return omega >= 45 && E >= 1000
            },
        },
        {
            id: 'heavy-flywheel',
            mission: {
                ko: 'I를 최대로 올려봐',
                en: 'Maximize moment of inertia I',
                ja: '慣性モーメントIを最大にしてみて',
            },
            result: {
                ko: '무거운 플라이휠이 더 많은 에너지를 저장해!',
                en: 'Heavier flywheel stores more energy!',
                ja: '重いフライホイールはより多くのエネルギーを蓄える！',
            },
            icon: '⚙️',
            condition: (vars) => {
                const I = vars['I'] || 2
                return I >= 9
            },
        },
        {
            id: 'energy-storage',
            mission: {
                ko: 'E를 2000J 이상으로 만들어봐',
                en: 'Create E above 2000J',
                ja: 'Eを2000J以上にしてみて',
            },
            result: {
                ko: '플라이휠 배터리는 이 원리로 에너지를 저장해!',
                en: 'Flywheel batteries use this to store energy!',
                ja: 'フライホイールバッテリーはこの原理でエネルギーを蓄える！',
            },
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
                ja: `${E.toFixed(0)}Jは${(E / 4.184).toFixed(0)}cal、約${(E / 4184).toFixed(2)}kcalの熱量だよ！`,
            }
        }
        return {
            ko: `${rpm.toFixed(0)} RPM으로 회전 중! 자동차 엔진은 보통 1000-7000 RPM이에요.`,
            en: `Spinning at ${rpm.toFixed(0)} RPM! Car engines typically run at 1000-7000 RPM.`,
            ja: `${rpm.toFixed(0)} RPMで回転中！車のエンジンは通常1000-7000 RPMだよ。`,
        }
    },
}
