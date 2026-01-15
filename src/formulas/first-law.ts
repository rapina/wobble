import { Formula } from './types'
import { colors } from '../styles/colors'

export const firstLaw: Formula = {
    id: 'first-law',
    name: { ko: '열역학 제1법칙', en: 'First Law of Thermodynamics', ja: '熱力学第一法則' },
    expression: 'ΔU = Q - W',
    description: {
        ko: '에너지 보존 법칙: 내부에너지 변화 = 열 - 일',
        en: 'Energy conservation: change in internal energy = heat - work',
        ja: 'エネルギー保存則：内部エネルギーの変化 = 熱 - 仕事',
    },
    simulationHint: {
        ko: '열이 들어오고 일이 나가면서 내부 에너지가 변하는 모습',
        en: 'Shows internal energy changing as heat enters and work exits',
        ja: '熱が入り仕事が出ていくことで内部エネルギーが変化する様子',
    },
    applications: {
        ko: [
            '냉장고와 에어컨의 냉각 사이클 설계',
            '자동차 엔진의 효율 계산',
            '발전소의 열에너지 → 전기에너지 변환',
            '단열 팽창을 이용한 구름 생성 원리',
        ],
        en: [
            'Designing refrigerator and AC cooling cycles',
            'Calculating car engine efficiency',
            'Power plant heat-to-electricity conversion',
            'Cloud formation through adiabatic expansion',
        ],
        ja: [
            '冷蔵庫・エアコンの冷却サイクル設計',
            '自動車エンジンの効率計算',
            '発電所での熱エネルギー→電気エネルギー変換',
            '断熱膨張による雲の生成原理',
        ],
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'Q',
            name: { ko: '열량', en: 'Heat', ja: '熱量' },
            role: 'input',
            unit: 'J',
            range: [100, 800],
            default: 400,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 150,
                color: colors.temperature,
            },
        },
        {
            symbol: 'W',
            name: { ko: '일', en: 'Work', ja: '仕事' },
            role: 'input',
            unit: 'J',
            range: [50, 600],
            default: 200,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.15,
                color: colors.force,
            },
        },
        {
            symbol: 'ΔU',
            name: { ko: '내부에너지 변화', en: 'Internal Energy Change', ja: '内部エネルギー変化' },
            role: 'output',
            unit: 'J',
            range: [-500, 750],
            default: 200,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.abs(value) / 150,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const Q = inputs.Q ?? 500
        const W = inputs.W ?? 200
        return {
            ΔU: Q - W,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const Q = inputs.Q ?? 500
        const W = inputs.W ?? 200
        const dU = Q - W
        return `ΔU = ${Q.toFixed(0)} - ${W.toFixed(0)} = ${dU.toFixed(0)}`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'Q', to: 'W', operator: '-' },
            { from: 'W', to: 'ΔU', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'ΔU',
        expression: [
            { type: 'var', symbol: 'Q' },
            { type: 'op', value: '-' },
            { type: 'var', symbol: 'W' },
        ],
    },
    discoveries: [
        {
            id: 'all-heat-to-work',
            mission: {
                ko: '열량 Q와 일 W를 같게 설정해봐!',
                en: 'Set heat Q equal to work W!',
                ja: '熱量Qと仕事Wを同じに設定してみて！',
            },
            result: {
                ko: '모든 열이 일로 바뀌면 내부에너지 변화 없음! 이상적인 등온 과정이야.',
                en: 'When all heat becomes work, no internal energy change! This is an ideal isothermal process.',
                ja: 'すべての熱が仕事に変わると内部エネルギー変化なし！理想的な等温過程だよ。',
            },
            icon: '⚖️',
            condition: (vars) => Math.abs(vars['Q'] - vars['W']) <= 20,
        },
        {
            id: 'adiabatic',
            mission: {
                ko: '열량 Q를 최소로, 일 W를 최대로 설정해봐!',
                en: 'Minimize heat Q and maximize work W!',
                ja: '熱量Qを最小に、仕事Wを最大に設定してみて！',
            },
            result: {
                ko: '열 없이 일만 하면 내부에너지가 감소해! 단열팽창으로 온도가 떨어지는 원리야.',
                en: 'Work without heat decreases internal energy! This is why adiabatic expansion cools things down.',
                ja: '熱なしで仕事だけすると内部エネルギーが減る！断熱膨張で温度が下がる原理だよ。',
            },
            icon: '🌡️',
            condition: (vars) => vars['Q'] <= 150 && vars['W'] >= 500,
        },
    ],
    getInsight: (vars) => {
        const dU = vars['ΔU']
        if (dU < -200) return { ko: '급격히 식는 중이야! 단열팽창!', en: 'Cooling rapidly! Adiabatic expansion!', ja: '急激に冷えている！断熱膨張だよ！' }
        if (dU < 0) return { ko: '온도가 내려가고 있어', en: 'Temperature is dropping', ja: '温度が下がっているよ' }
        if (dU < 100) return { ko: '에너지 변화가 작아', en: 'Small energy change', ja: 'エネルギー変化が小さいよ' }
        if (dU < 300) return { ko: '온도가 올라가고 있어', en: 'Temperature is rising', ja: '温度が上がっているよ' }
        return { ko: '급격히 뜨거워지고 있어!', en: 'Heating up rapidly!', ja: '急激に熱くなっている！' }
    },
}
