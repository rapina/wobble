import { Formula } from './types'
import { colors } from '../styles/colors'

export const buoyancy: Formula = {
    id: 'buoyancy',
    name: { ko: '부력', en: 'Buoyancy', ja: '浮力' },
    expression: 'F = ρVg',
    description: {
        ko: '유체 속에서 물체를 위로 밀어올리는 힘',
        en: 'The upward force pushing an object in a fluid',
        ja: '流体中で物体を上に押し上げる力',
    },
    simulationHint: {
        ko: '물체가 유체 속에서 밀도에 따라 뜨거나 가라앉는 모습',
        en: 'Shows an object floating or sinking in fluid based on density',
        ja: '物体が密度によって浮いたり沈んだりする様子',
    },
    applications: {
        ko: [
            '배와 잠수함의 부양 설계',
            '열기구와 비행선의 부력 계산',
            '수영할 때 몸이 뜨는 원리',
            '해수와 담수에서의 부력 차이',
        ],
        en: [
            'Designing ship and submarine flotation',
            'Calculating hot air balloon lift',
            'Why our bodies float when swimming',
            'Buoyancy differences in saltwater vs freshwater',
        ],
        ja: [
            '船や潜水艦の浮揚設計',
            '熱気球や飛行船の浮力計算',
            '泳ぐとき体が浮く原理',
            '海水と淡水での浮力の違い',
        ],
    },
    category: 'special',
    variables: [
        {
            symbol: 'ρ',
            name: { ko: '유체 밀도', en: 'Fluid Density', ja: '流体密度' },
            role: 'input',
            unit: 'kg/m³',
            range: [100, 1500],
            default: 1000,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 500,
                color: colors.density,
            },
        },
        {
            symbol: 'V',
            name: { ko: '잠긴 부피', en: 'Submerged Volume', ja: '沈んだ体積' },
            role: 'input',
            unit: 'L',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.5,
                color: colors.volume,
            },
        },
        {
            symbol: 'g',
            name: { ko: '중력 가속도', en: 'Gravitational Accel.', ja: '重力加速度' },
            role: 'input',
            unit: 'm/s²',
            range: [1, 25],
            default: 9.8,
            visual: {
                property: 'speed',
                scale: (value: number) => value / 5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'F',
            name: { ko: '부력', en: 'Buoyant Force', ja: '浮力' },
            role: 'output',
            unit: 'N',
            range: [0, 500],
            default: 98,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const rho = inputs['ρ'] ?? 1000
        const V = inputs.V ?? 10
        const g = inputs.g ?? 9.8
        // V in L = 0.001 m³
        return {
            F: rho * (V / 1000) * g,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const rho = inputs['ρ'] ?? 1000
        const V = inputs.V ?? 10
        const g = inputs.g ?? 9.8
        const F = rho * (V / 1000) * g
        return `F = ${rho.toFixed(0)} × ${(V / 1000).toFixed(3)} × ${g.toFixed(1)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'float',
        connections: [
            { from: 'ρ', to: 'V', operator: '×' },
            { from: 'V', to: 'g', operator: '×' },
            { from: 'g', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['ρ', 'V', 'g'],
    },
    discoveries: [
        {
            id: 'saltwater-float',
            mission: {
                ko: '유체 밀도 ρ를 1200 이상으로 올려봐! (소금물)',
                en: 'Raise fluid density above 1200! (saltwater)',
                ja: '流体密度ρを1200以上に上げてみて！（塩水）',
            },
            result: {
                ko: '밀도가 높은 유체에서는 부력이 더 커! 사해에서 몸이 쉽게 뜨는 이유야.',
                en: 'Denser fluids provide more buoyancy! This is why you float easily in the Dead Sea.',
                ja: '密度が高い流体では浮力が大きい！死海で体が簡単に浮く理由だよ。',
            },
            icon: '🏊',
            condition: (vars) => vars['ρ'] >= 1200,
        },
        {
            id: 'large-volume',
            mission: {
                ko: '잠긴 부피 V를 최대(100L)로 늘려봐!',
                en: 'Maximize submerged volume V to 100L!',
                ja: '沈んだ体積Vを最大（100L）まで増やしてみて！',
            },
            result: {
                ko: '부피가 클수록 부력이 커! 큰 배가 물에 뜰 수 있는 원리야.',
                en: 'Larger volume means more buoyancy! This is how massive ships float on water.',
                ja: '体積が大きいほど浮力が大きい！大きな船が水に浮く原理だよ。',
            },
            icon: '🚢',
            condition: (vars) => vars['V'] >= 90,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 10)
            return {
                ko: '작은 장난감이 뜨는 힘이야',
                en: 'Force to float a small toy',
                ja: '小さなおもちゃが浮く力だよ',
            }
        if (F < 50)
            return {
                ko: '수박이 뜨는 힘 정도야',
                en: 'Force to float a watermelon',
                ja: 'スイカが浮く力くらいだよ',
            }
        if (F < 100)
            return {
                ko: '어린이가 뜨는 부력이야',
                en: 'Buoyancy to float a child',
                ja: '子供が浮く浮力だよ',
            }
        if (F < 300)
            return {
                ko: '성인이 뜨는 부력이야',
                en: 'Buoyancy to float an adult',
                ja: '大人が浮く浮力だよ',
            }
        return {
            ko: '보트가 뜨는 부력이야!',
            en: 'Boat-floating buoyancy!',
            ja: 'ボートが浮く浮力だよ！',
        }
    },
}
