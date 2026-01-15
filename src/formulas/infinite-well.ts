import { Formula } from './types'
import { colors } from '../styles/colors'

export const infiniteWell: Formula = {
    id: 'infinite-well',
    name: { ko: '무한 퍼텐셜 우물', en: 'Infinite Square Well', ja: '無限井戸型ポテンシャル' },
    expression: 'Eₙ = n²ℏ²π²/2mL²',
    description: {
        ko: '상자 안에 갇힌 입자는 양자화된 에너지 준위만 가질 수 있다',
        en: 'A particle confined in a box can only have quantized energy levels',
        ja: '箱の中に閉じ込められた粒子は量子化されたエネルギー準位のみを持てる',
    },
    simulationHint: {
        ko: '상자 안에 갇힌 입자의 파동함수가 정상파를 이루는 모습',
        en: 'Shows a particle confined in a box forming standing wave patterns',
        ja: '箱の中の粒子の波動関数が定常波を形成する様子',
    },
    applications: {
        ko: [
            '양자 우물 레이저의 파장 제어',
            '나노선 전자소자의 에너지 준위',
            '형광 양자점의 색상 결정',
            '탄소 나노튜브의 전자 구조',
        ],
        en: [
            'Wavelength control in quantum well lasers',
            'Energy levels in nanowire devices',
            'Color determination in fluorescent quantum dots',
            'Electronic structure of carbon nanotubes',
        ],
        ja: [
            '量子井戸レーザーの波長制御',
            'ナノワイヤデバイスのエネルギー準位',
            '蛍光量子ドットの色の決定',
            'カーボンナノチューブの電子構造',
        ],
    },
    category: 'quantum',
    variables: [
        {
            symbol: 'n',
            name: { ko: '양자수', en: 'Quantum Number', ja: '量子数' },
            role: 'input',
            unit: '',
            range: [1, 5],
            default: 1,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.wavelength,
            },
        },
        {
            symbol: 'L',
            name: { ko: '우물 너비', en: 'Well Width', ja: '井戸の幅' },
            role: 'input',
            unit: 'nm',
            range: [0.5, 5],
            default: 1,
            visual: {
                property: 'stretch',
                scale: (value: number) => value * 40,
                color: colors.distance,
            },
        },
        {
            symbol: 'E',
            name: { ko: '에너지', en: 'Energy', ja: 'エネルギー' },
            role: 'output',
            unit: 'eV',
            range: [0.04, 10],
            default: 0.38,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 5,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 1)
        const L = inputs.L ?? 1 // nm
        // E_n = n²ℏ²π²/(2mL²)
        // For electron: E_n = 0.376 * n² / L² eV (L in nm)
        const E = (0.376 * n * n) / (L * L)
        return { E }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 1)
        const L = inputs.L ?? 1
        const E = (0.376 * n * n) / (L * L)
        return `E = 0.376×${n}²/${L.toFixed(1)}² = ${E.toFixed(3)} eV`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'n', to: 'E', operator: '=' },
            { from: 'L', to: 'E', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'E',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'n', square: true },
                    { type: 'text', value: 'ℏ²π²' },
                ],
                denominator: [
                    { type: 'text', value: '2m' },
                    { type: 'var', symbol: 'L', square: true },
                ],
            },
        ],
    },
    getInsight: (vars) => {
        const E = vars['E']
        const n = Math.round(vars['n'] ?? 1)
        if (n === 1 && E < 0.5)
            return {
                ko: '바닥상태의 낮은 에너지야',
                en: 'Low energy ground state',
                ja: '基底状態の低エネルギーだよ',
            }
        if (E < 1)
            return {
                ko: '적외선 정도의 에너지야',
                en: 'Infrared level energy',
                ja: '赤外線程度のエネルギーだよ',
            }
        if (E < 3)
            return {
                ko: '가시광선 정도의 에너지야',
                en: 'Visible light level energy',
                ja: '可視光線程度のエネルギーだよ',
            }
        if (E < 5)
            return {
                ko: '자외선 정도의 에너지야',
                en: 'Ultraviolet level energy',
                ja: '紫外線程度のエネルギーだよ',
            }
        return {
            ko: 'X선급 높은 에너지!',
            en: 'X-ray level high energy!',
            ja: 'X線級の高エネルギー！',
        }
    },
    discoveries: [
        {
            id: 'narrow-well',
            mission: {
                ko: '우물 너비 L을 0.7nm 이하로 줄여봐!',
                en: 'Reduce well width L below 0.7nm!',
                ja: '井戸の幅Lを0.7nm以下に減らしてみて！',
            },
            result: {
                ko: '좁은 우물은 높은 에너지! 양자점이 작을수록 더 높은 에너지 빛을 내.',
                en: 'Narrow well means higher energy! Smaller quantum dots emit higher energy light.',
                ja: '狭い井戸は高エネルギー！量子ドットが小さいほど高エネルギーの光を出すよ。',
            },
            icon: '💡',
            condition: (vars) => vars['L'] <= 0.7,
        },
        {
            id: 'excited-state',
            mission: {
                ko: '양자수 n을 4 이상으로 올려봐!',
                en: 'Raise quantum number n above 4!',
                ja: '量子数nを4以上に上げてみて！',
            },
            result: {
                ko: '높은 양자수는 에너지가 n²에 비례해서 급격히 증가! 양자 레이저의 원리야.',
                en: 'Higher quantum number means energy increases as n squared! The principle of quantum lasers.',
                ja: '高い量子数はエネルギーがn²に比例して急激に増加！量子レーザーの原理だよ。',
            },
            icon: '🔬',
            condition: (vars) => Math.round(vars['n']) >= 4,
        },
    ],
}
