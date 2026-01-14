import { Formula } from './types'
import { colors } from '../styles/colors'

export const inverseSquare: Formula = {
    id: 'inverse-square',
    name: '역제곱 법칙',
    nameEn: 'Inverse Square Law',
    expression: 'I = P/(4πr²)',
    description: '빛, 소리, 중력 등이 거리의 제곱에 반비례해 약해진다',
    descriptionEn:
        'Light, sound, gravity etc. weaken inversely proportional to distance squared',
    simulationHint: '거리가 2배가 되면 세기가 1/4이 되는 것을 관찰하세요',
    simulationHintEn: 'Watch intensity drop to 1/4 when distance doubles',
    applications: [
        '조명 설계 - 거리에 따른 밝기 계산',
        '음향 설계 - 스피커 배치 최적화',
        '방사선 안전 - 선원과 거리 유지',
        '통신 - 신호 세기 감쇠 계산',
    ],
    applicationsEn: [
        'Lighting design - calculating brightness by distance',
        'Acoustics - optimizing speaker placement',
        'Radiation safety - maintaining distance from source',
        'Communications - signal attenuation calculation',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'P',
            name: '출력',
            nameEn: 'Power',
            role: 'input',
            unit: 'W',
            range: [1, 1000],
            default: 100,
            visual: {
                property: 'glow',
                scale: (v) => v / 100,
                color: colors.power,
            },
        },
        {
            symbol: 'r',
            name: '거리',
            nameEn: 'Distance',
            role: 'input',
            unit: 'm',
            range: [0.5, 20],
            default: 2,
            visual: {
                property: 'distance',
                scale: (v) => v * 5,
                color: colors.distance,
            },
        },
        {
            symbol: 'I',
            name: '세기',
            nameEn: 'Intensity',
            role: 'output',
            unit: 'W/m²',
            range: [0, 500],
            default: 1.99,
            visual: {
                property: 'glow',
                scale: (v) => v,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs) => {
        const P = inputs['P'] || 100
        const r = inputs['r'] || 2
        const I = P / (4 * Math.PI * r * r)
        return { I: Math.round(I * 100) / 100 }
    },
    formatCalculation: (inputs) => {
        const P = inputs['P'] || 100
        const r = inputs['r'] || 2
        const I = P / (4 * Math.PI * r * r)
        return `I = ${P}/(4π×${r}²) = ${I.toFixed(2)} W/m²`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'P', to: 'I', operator: '÷' },
            { from: 'r', to: 'I', operator: '÷r²' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'I',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'P' }],
                denominator: [
                    { type: 'text', value: '4π' },
                    { type: 'var', symbol: 'r', square: true },
                ],
            },
        ],
    },
    discoveries: [
        {
            id: 'double-distance',
            mission: 'r을 2배로 늘려서 세기 변화를 봐',
            missionEn: 'Double r to see intensity change',
            result: '거리 2배 = 세기 1/4! 이게 역제곱 법칙!',
            resultEn: 'Double distance = 1/4 intensity! The inverse square law!',
            icon: '📏',
            condition: (vars) => {
                const r = vars['r'] || 2
                return r >= 10
            },
        },
        {
            id: 'close-source',
            mission: 'r을 최소로 줄여봐',
            missionEn: 'Minimize distance r',
            result: '가까울수록 엄청 강해! 조심해야 해!',
            resultEn: 'Much stronger up close! Be careful!',
            icon: '☀️',
            condition: (vars) => {
                const r = vars['r'] || 2
                const I = vars['I'] || 2
                return r <= 1 && I >= 10
            },
        },
        {
            id: 'high-power',
            mission: 'P를 최대로 올려봐',
            missionEn: 'Maximize power P',
            result: '출력이 세면 멀리서도 강하게 도달해!',
            resultEn: 'High power reaches far with strength!',
            icon: '💡',
            condition: (vars) => {
                const P = vars['P'] || 100
                return P >= 900
            },
        },
    ],
    getInsight: (variables) => {
        const I = variables['I'] || 2
        const r = variables['r'] || 2

        if (I > 10) {
            return {
                ko: `${I.toFixed(1)} W/m²는 꽤 밝아요! 직사광선은 약 1000 W/m²예요.`,
                en: `${I.toFixed(1)} W/m² is quite bright! Direct sunlight is ~1000 W/m².`,
            }
        }
        return {
            ko: `${r}m 거리에서 ${I.toFixed(2)} W/m². 중력, 전기력, 빛 모두 이 법칙을 따라요!`,
            en: `${I.toFixed(2)} W/m² at ${r}m. Gravity, electric force, light all follow this law!`,
        }
    },
}
