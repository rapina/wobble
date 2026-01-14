import { Formula } from './types'
import { colors } from '../styles/colors'

export const radioactiveDecay: Formula = {
    id: 'radioactive-decay',
    name: '방사성 붕괴',
    nameEn: 'Radioactive Decay',
    expression: 'N = N₀e^(-λt)',
    description: '방사성 물질의 원자 수가 시간에 따라 지수적으로 감소하는 법칙',
    descriptionEn:
        'The law describing how the number of radioactive atoms decreases exponentially over time',
    simulationHint: '시간이 지날수록 입자가 사라지는 모습을 관찰하세요',
    simulationHintEn: 'Watch how particles disappear over time',
    applications: [
        '탄소 연대 측정 - 유물의 나이 측정',
        '암 치료 - 방사선 치료 용량 계산',
        '원자력 발전 - 핵연료 수명 예측',
        '지질학 - 암석 연대 측정',
    ],
    applicationsEn: [
        'Carbon dating - determining age of artifacts',
        'Cancer treatment - calculating radiation therapy doses',
        'Nuclear power - predicting fuel lifespan',
        'Geology - dating rocks and minerals',
    ],
    category: 'quantum',
    variables: [
        {
            symbol: 'N₀',
            name: '초기 원자 수',
            nameEn: 'Initial atoms',
            role: 'input',
            unit: '개',
            range: [100, 1000],
            default: 500,
            visual: {
                property: 'size',
                scale: (v) => v / 20,
                color: colors.charge,
            },
        },
        {
            symbol: 'λ',
            name: '붕괴 상수',
            nameEn: 'Decay constant',
            role: 'input',
            unit: '/s',
            range: [0.01, 0.5],
            default: 0.1,
            visual: {
                property: 'glow',
                scale: (v) => v * 10,
                color: colors.catalyst,
            },
        },
        {
            symbol: 't',
            name: '시간',
            nameEn: 'Time',
            role: 'input',
            unit: 's',
            range: [0, 30],
            default: 5,
            visual: {
                property: 'oscillate',
                scale: (v) => v,
                color: colors.time,
            },
        },
        {
            symbol: 'N',
            name: '남은 원자 수',
            nameEn: 'Remaining atoms',
            role: 'output',
            unit: '개',
            range: [0, 1000],
            default: 303,
            visual: {
                property: 'size',
                scale: (v) => v / 20,
                color: colors.product,
            },
        },
    ],
    calculate: (inputs) => {
        const N0 = inputs['N₀'] || 500
        const lambda = inputs['λ'] || 0.1
        const t = inputs['t'] || 5
        const N = N0 * Math.exp(-lambda * t)
        return { N: Math.round(N) }
    },
    formatCalculation: (inputs) => {
        const N0 = inputs['N₀'] || 500
        const lambda = inputs['λ'] || 0.1
        const t = inputs['t'] || 5
        const N = N0 * Math.exp(-lambda * t)
        return `N = ${N0} × e^(-${lambda} × ${t}) = ${Math.round(N)} atoms`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'N₀', to: 'N', operator: '×' },
            { from: 'λ', to: 'N', operator: '×' },
            { from: 't', to: 'N', operator: '×' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'N',
        expression: [
            { type: 'var', symbol: 'N₀' },
            { type: 'op', value: '·' },
            { type: 'text', value: 'e' },
            { type: 'op', value: '^(-' },
            { type: 'var', symbol: 'λ' },
            { type: 'var', symbol: 't' },
            { type: 'op', value: ')' },
        ],
    },
    discoveries: [
        {
            id: 'half-life',
            mission: '반감기를 찾아봐! (N이 N₀의 절반이 되는 t)',
            missionEn: 'Find the half-life! (t when N = N₀/2)',
            result: '반감기 t½ = ln(2)/λ 로 계산할 수 있어!',
            resultEn: 'Half-life can be calculated as t½ = ln(2)/λ!',
            icon: '⏳',
            condition: (vars) => {
                const N0 = vars['N₀'] || 500
                const N = vars['N'] || 0
                return N <= N0 * 0.55 && N >= N0 * 0.45
            },
        },
        {
            id: 'rapid-decay',
            mission: 'λ를 높여서 빠른 붕괴를 관찰해봐',
            missionEn: 'Increase λ to observe rapid decay',
            result: '붕괴 상수가 크면 물질이 빨리 사라져!',
            resultEn: 'Higher decay constant means faster decay!',
            icon: '💨',
            condition: (vars) => {
                const lambda = vars['λ'] || 0.1
                const N0 = vars['N₀'] || 500
                const N = vars['N'] || 0
                return lambda >= 0.3 && N < N0 * 0.2
            },
        },
        {
            id: 'stable-isotope',
            mission: 'λ를 낮춰서 안정적인 동위원소를 시뮬레이션해봐',
            missionEn: 'Lower λ to simulate a stable isotope',
            result: '붕괴 상수가 작으면 오래 유지돼!',
            resultEn: 'Lower decay constant means longer stability!',
            icon: '🛡️',
            condition: (vars) => {
                const lambda = vars['λ'] || 0.1
                const t = vars['t'] || 5
                const N0 = vars['N₀'] || 500
                const N = vars['N'] || 0
                return lambda <= 0.05 && t >= 20 && N > N0 * 0.3
            },
        },
    ],
    getInsight: (variables) => {
        const N0 = variables['N₀'] || 500
        const lambda = variables['λ'] || 0.1
        const N = variables['N'] || 0
        const halfLife = Math.log(2) / lambda
        const percentRemaining = (N / N0) * 100

        if (percentRemaining < 10) {
            return {
                ko: `원래의 ${percentRemaining.toFixed(0)}%만 남았어요. 거의 다 붕괴했네요!`,
                en: `Only ${percentRemaining.toFixed(0)}% remains. Almost completely decayed!`,
            }
        }

        return {
            ko: `반감기는 약 ${halfLife.toFixed(1)}초예요. 탄소-14의 반감기는 5,730년이에요!`,
            en: `Half-life is about ${halfLife.toFixed(1)}s. Carbon-14's half-life is 5,730 years!`,
        }
    },
}
