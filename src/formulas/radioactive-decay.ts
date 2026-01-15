import { Formula } from './types'
import { colors } from '../styles/colors'

export const radioactiveDecay: Formula = {
    id: 'radioactive-decay',
    name: { ko: '방사성 붕괴', en: 'Radioactive Decay', ja: '放射性崩壊' },
    expression: 'N = N₀e^(-λt)',
    description: {
        ko: '방사성 물질의 원자 수가 시간에 따라 지수적으로 감소하는 법칙',
        en: 'The law describing how the number of radioactive atoms decreases exponentially over time',
        ja: '放射性物質の原子数が時間とともに指数関数的に減少する法則',
    },
    simulationHint: {
        ko: '시간이 지날수록 입자가 사라지는 모습을 관찰하세요',
        en: 'Watch how particles disappear over time',
        ja: '時間が経つにつれて粒子が消えていく様子を観察',
    },
    applications: {
        ko: [
            '탄소 연대 측정 - 유물의 나이 측정',
            '암 치료 - 방사선 치료 용량 계산',
            '원자력 발전 - 핵연료 수명 예측',
            '지질학 - 암석 연대 측정',
        ],
        en: [
            'Carbon dating - determining age of artifacts',
            'Cancer treatment - calculating radiation therapy doses',
            'Nuclear power - predicting fuel lifespan',
            'Geology - dating rocks and minerals',
        ],
        ja: [
            '炭素年代測定 - 遺物の年代測定',
            'がん治療 - 放射線治療量の計算',
            '原子力発電 - 核燃料寿命の予測',
            '地質学 - 岩石や鉱物の年代測定',
        ],
    },
    category: 'quantum',
    variables: [
        {
            symbol: 'N₀',
            name: { ko: '초기 원자 수', en: 'Initial atoms', ja: '初期原子数' },
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
            name: { ko: '붕괴 상수', en: 'Decay constant', ja: '崩壊定数' },
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
            name: { ko: '시간', en: 'Time', ja: '時間' },
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
            name: { ko: '남은 원자 수', en: 'Remaining atoms', ja: '残りの原子数' },
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
            mission: {
                ko: '반감기를 찾아봐! (N이 N₀의 절반이 되는 t)',
                en: 'Find the half-life! (t when N = N₀/2)',
                ja: '半減期を見つけよう！（NがN₀の半分になるt）',
            },
            result: {
                ko: '반감기 t½ = ln(2)/λ 로 계산할 수 있어!',
                en: 'Half-life can be calculated as t½ = ln(2)/λ!',
                ja: '半減期は t½ = ln(2)/λ で計算できる！',
            },
            icon: '⏳',
            condition: (vars) => {
                const N0 = vars['N₀'] || 500
                const N = vars['N'] || 0
                return N <= N0 * 0.55 && N >= N0 * 0.45
            },
        },
        {
            id: 'rapid-decay',
            mission: {
                ko: 'λ를 높여서 빠른 붕괴를 관찰해봐',
                en: 'Increase λ to observe rapid decay',
                ja: 'λを上げて速い崩壊を観察しよう',
            },
            result: {
                ko: '붕괴 상수가 크면 물질이 빨리 사라져!',
                en: 'Higher decay constant means faster decay!',
                ja: '崩壊定数が大きいと物質が速く消える！',
            },
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
            mission: {
                ko: 'λ를 낮춰서 안정적인 동위원소를 시뮬레이션해봐',
                en: 'Lower λ to simulate a stable isotope',
                ja: 'λを下げて安定同位体をシミュレーションしよう',
            },
            result: {
                ko: '붕괴 상수가 작으면 오래 유지돼!',
                en: 'Lower decay constant means longer stability!',
                ja: '崩壊定数が小さいと長く維持される！',
            },
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
                ja: `元の${percentRemaining.toFixed(0)}%だけ残っています。ほぼ完全に崩壊しました！`,
            }
        }

        return {
            ko: `반감기는 약 ${halfLife.toFixed(1)}초예요. 탄소-14의 반감기는 5,730년이에요!`,
            en: `Half-life is about ${halfLife.toFixed(1)}s. Carbon-14's half-life is 5,730 years!`,
            ja: `半減期は約${halfLife.toFixed(1)}秒です。炭素14の半減期は5,730年です！`,
        }
    },
}
