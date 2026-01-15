import { Formula } from './types'
import { colors } from '../styles/colors'

export const bohr: Formula = {
    id: 'bohr',
    name: { ko: '보어 모형', en: 'Bohr Model', ja: 'ボーア模型' },
    expression: 'Eₙ = -13.6/n² eV',
    description: {
        ko: '수소 원자의 전자는 양자화된 에너지 준위의 궤도에서만 존재한다',
        en: 'The electron in a hydrogen atom can only exist in quantized energy level orbits',
        ja: '水素原子の電子は量子化されたエネルギー準位の軌道にのみ存在できる',
    },
    simulationHint: {
        ko: '수소 원자의 전자가 특정 궤도에서만 돌고, 준위 변화 시 광자를 방출하는 모습',
        en: 'Shows an electron orbiting a hydrogen atom in quantized orbits, emitting photons when changing levels',
        ja: '水素原子の電子が特定軌道のみで周回し、準位変化時に光子を放出する様子',
    },
    applications: {
        ko: [
            '수소 원자의 스펙트럼 분석',
            '레이저의 에너지 준위 설계',
            '형광등과 네온사인의 색상',
            '별의 원소 성분 분석',
        ],
        en: [
            'Hydrogen atom spectrum analysis',
            'Energy level design for lasers',
            'Colors in fluorescent and neon lights',
            'Analyzing elemental composition of stars',
        ],
        ja: [
            '水素原子のスペクトル分析',
            'レーザーのエネルギー準位設計',
            '蛍光灯やネオンサインの色',
            '恒星の元素組成分析',
        ],
    },
    category: 'quantum',
    variables: [
        {
            symbol: 'n',
            name: { ko: '주양자수', en: 'Principal Quantum Number', ja: '主量子数' },
            role: 'input',
            unit: '',
            range: [1, 6],
            default: 2,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 30,
                color: colors.distance,
            },
        },
        {
            symbol: 'E',
            name: { ko: '에너지', en: 'Energy', ja: 'エネルギー' },
            role: 'output',
            unit: 'eV',
            range: [-13.6, 0],
            default: -3.4,
            visual: {
                property: 'glow',
                scale: (value: number) => (13.6 + value) / 13.6,
                color: colors.energy,
            },
        },
        {
            symbol: 'r',
            name: { ko: '궤도 반지름', en: 'Orbital Radius', ja: '軌道半径' },
            role: 'output',
            unit: 'a₀',
            range: [1, 36],
            default: 4,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 2,
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 2)
        // E_n = -13.6 / n² eV
        const E = -13.6 / (n * n)
        // r_n = n² * a₀ (in units of Bohr radius)
        const r = n * n
        return { E, r }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 2)
        const E = -13.6 / (n * n)
        const r = n * n
        return `E = -13.6/${n}² = ${E.toFixed(2)} eV, r = ${r}a₀`
    },
    layout: {
        type: 'orbital',
        connections: [
            { from: 'n', to: 'E', operator: '=' },
            { from: 'n', to: 'r', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'E',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: '-13.6' }],
                denominator: [{ type: 'var', symbol: 'n', square: true }],
            },
            { type: 'text', value: ' eV' },
        ],
    },
    getInsight: (vars) => {
        const n = Math.round(vars['n'] ?? 2)
        const E = vars['E']
        if (n === 1) return { ko: '바닥상태! 가장 안정한 전자야', en: 'Ground state! Most stable electron', ja: '基底状態！最も安定した電子' }
        if (n === 2) return { ko: '발머 계열 시작! 가시광선을 방출해', en: 'Balmer series starts! Emits visible light', ja: 'バルマー系列開始！可視光を放出' }
        if (n === 3) return { ko: '파셴 계열! 적외선 영역이야', en: 'Paschen series! Infrared region', ja: 'パッシェン系列！赤外線領域' }
        if (E > -1) return { ko: '거의 자유 전자! 이온화 직전이야', en: 'Nearly free electron! About to ionize', ja: 'ほぼ自由電子！イオン化直前' }
        return { ko: '들뜬상태! 에너지를 흡수한 전자야', en: 'Excited state! Electron that absorbed energy', ja: '励起状態！エネルギーを吸収した電子' }
    },
    discoveries: [
        {
            id: 'ground-state',
            mission: {
                ko: '주양자수 n을 1로 설정해봐! (바닥상태)',
                en: 'Set principal quantum number n to 1! (ground state)',
                ja: '主量子数nを1に設定してみて！（基底状態）',
            },
            result: {
                ko: 'n=1은 가장 낮은 에너지! 전자가 가장 안정한 상태야.',
                en: 'n=1 is the lowest energy! The most stable state for the electron.',
                ja: 'n=1は最も低いエネルギー！電子が最も安定した状態だよ。',
            },
            icon: '⚛️',
            condition: (vars) => Math.round(vars['n']) === 1,
        },
        {
            id: 'ionization',
            mission: {
                ko: '주양자수 n을 5 이상으로 올려봐!',
                en: 'Raise principal quantum number n above 5!',
                ja: '主量子数nを5以上に上げてみて！',
            },
            result: {
                ko: '높은 n에서는 에너지가 거의 0! 조금만 더 에너지를 받으면 전자가 떠나.',
                en: 'At high n, energy approaches 0! A little more energy and the electron escapes.',
                ja: '高いnではエネルギーがほぼ0！もう少しエネルギーを受けると電子が離れる。',
            },
            icon: '🚀',
            condition: (vars) => Math.round(vars['n']) >= 5,
        },
    ],
}
