import { Formula } from './types'
import { colors } from '../styles/colors'

export const newtonSecond: Formula = {
    id: 'newton-second',
    name: { ko: '뉴턴 제2법칙', en: "Newton's Second Law", ja: 'ニュートンの第二法則' },
    expression: 'F = ma',
    description: { ko: '힘은 질량과 가속도의 곱과 같다', en: 'Force equals mass times acceleration', ja: '力は質量と加速度の積に等しい' },
    simulationHint: { ko: '캐릭터에 힘이 가해질 때 질량에 따라 가속도가 달라지는 모습', en: 'Shows how acceleration changes based on mass when force is applied', ja: '力が加わったとき、質量によって加速度がどう変わるかを表示' },
    applications: {
        ko: [
            '자동차 급브레이크 시 필요한 제동력 계산',
            '로켓 발사 시 필요한 추진력 설계',
            '엘리베이터 가속 시 케이블 장력 계산',
            '스포츠에서 공을 차거나 던질 때 힘 분석',
        ],
        en: [
            'Calculating braking force for emergency stops',
            'Designing thrust for rocket launches',
            'Calculating cable tension during elevator acceleration',
            'Analyzing force when kicking or throwing a ball in sports',
        ],
        ja: [
            '急ブレーキ時の制動力計算',
            'ロケット打ち上げの推進力設計',
            'エレベーター加速時のケーブル張力計算',
            'スポーツでボールを蹴る・投げる時の力分析',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: { ko: '질량', en: 'Mass', ja: '質量' },
            role: 'input',
            unit: 'kg',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 40 + value * 1.2,
                color: colors.mass,
            },
        },
        {
            symbol: 'a',
            name: { ko: '가속도', en: 'Acceleration', ja: '加速度' },
            role: 'input',
            unit: 'm/s²',
            range: [0.1, 20],
            default: 5,
            visual: {
                property: 'stretch',
                scale: (value: number) => 1 + value * 0.05, // More visible stretch
                color: colors.velocity,
            },
        },
        {
            symbol: 'F',
            name: { ko: '힘', en: 'Force', ja: '力' },
            role: 'output',
            unit: 'N',
            range: [0, 2000],
            default: 50,
            visual: {
                property: 'shake',
                scale: (value: number) => Math.min(value * 0.02, 10), // More visible shake
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const a = inputs.a ?? 5
        return {
            F: m * a,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const a = inputs.a ?? 5
        const F = m * a
        return `F = ${m.toFixed(0)} × ${a.toFixed(1)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm', to: 'a', operator: '×' },
            { from: 'a', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['m', 'a'],
    },
    discoveries: [
        {
            id: 'heavy-acceleration',
            mission: { ko: '질량 m을 최대로 높이고 가속도 a를 10 이상으로 설정해봐!', en: 'Set mass m to max and acceleration a above 10!', ja: '質量mを最大にして、加速度aを10以上に設定してみよう！' },
            result: { ko: '무거운 물체를 빠르게 가속하려면 엄청난 힘이 필요해!', en: 'Accelerating a heavy object quickly requires enormous force!', ja: '重い物体を速く加速するには、大きな力が必要だ！' },
            icon: '💪',
            condition: (vars) => vars['m'] >= 90 && vars['a'] >= 10,
        },
        {
            id: 'light-high-accel',
            mission: { ko: '질량을 5 이하로 낮추고 가속도를 최대로 올려봐!', en: 'Lower mass below 5 and maximize acceleration!', ja: '質量を5以下にして、加速度を最大にしてみよう！' },
            result: { ko: '가벼운 물체는 작은 힘으로도 빠르게 가속돼!', en: 'Light objects accelerate quickly with little force!', ja: '軽い物体は小さな力でも速く加速する！' },
            icon: '🪶',
            condition: (vars) => vars['m'] <= 5 && vars['a'] >= 18,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 1) return { ko: '깃털처럼 가벼운 힘이야!', en: 'Light as a feather!', ja: '羽のように軽い力だ！' }
        if (F < 10) return { ko: '종이컵을 밀 수 있는 힘이야', en: 'Enough to push a paper cup', ja: '紙コップを押せる力だ' }
        if (F < 50) return { ko: '문을 여는 정도의 힘이야', en: 'About the force to open a door', ja: 'ドアを開けるくらいの力だ' }
        if (F < 100) return { ko: '의자를 밀 수 있는 힘이야', en: 'Enough to push a chair', ja: '椅子を押せる力だ' }
        if (F < 500) return { ko: '자전거를 밀 수 있는 힘이야', en: 'Enough to push a bicycle', ja: '自転車を押せる力だ' }
        if (F < 1000) return { ko: '성인 한 명을 밀 수 있는 힘!', en: 'Enough to push an adult!', ja: '大人一人を押せる力！' }
        return { ko: '엄청난 힘이야! 차도 밀 수 있어', en: 'Massive force! Could push a car', ja: 'すごい力だ！車も押せる' }
    },
}
