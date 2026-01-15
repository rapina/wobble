import { Formula } from './types'
import { colors } from '../styles/colors'

export const kineticEnergy: Formula = {
    id: 'kinetic-energy',
    name: { ko: '운동 에너지', en: 'Kinetic Energy', ja: '運動エネルギー' },
    expression: 'E = ½mv²',
    description: {
        ko: '움직이는 물체가 가진 에너지',
        en: 'Energy possessed by a moving object',
        ja: '動いている物体が持つエネルギー',
    },
    simulationHint: {
        ko: '물체의 속도가 빨라질수록 운동 에너지가 커지는 모습',
        en: 'Shows kinetic energy increasing as object speed increases',
        ja: '物体の速度が上がるほど運動エネルギーが増える様子',
    },
    applications: {
        ko: [
            '자동차 충돌 시 발생하는 충격 에너지 계산',
            '롤러코스터 설계 시 속도와 에너지 관계 분석',
            '총알이나 운석의 파괴력 계산',
            '풍력 발전기의 발전량 예측',
        ],
        en: [
            'Calculating impact energy in car collisions',
            'Analyzing speed-energy relationship in roller coaster design',
            'Calculating destructive power of bullets or meteorites',
            'Predicting power generation of wind turbines',
        ],
        ja: [
            '自動車衝突時の衝撃エネルギー計算',
            'ジェットコースター設計での速度とエネルギーの関係分析',
            '弾丸や隕石の破壊力計算',
            '風力発電機の発電量予測',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: { ko: '질량', en: 'Mass', ja: '質量' },
            role: 'input',
            unit: 'kg',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 40 + value * 1.5,
                color: colors.mass,
            },
        },
        {
            symbol: 'v',
            name: { ko: '속도', en: 'Velocity', ja: '速度' },
            role: 'input',
            unit: 'm/s',
            range: [1, 20],
            default: 5,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'E',
            name: { ko: '에너지', en: 'Energy', ja: 'エネルギー' },
            role: 'output',
            unit: 'J',
            range: [0, 10000],
            default: 125,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.min(value * 0.01, 10),
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const v = inputs.v ?? 5
        return {
            E: 0.5 * m * v * v,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const v = inputs.v ?? 5
        const E = 0.5 * m * v * v
        return `E = ½ × ${m.toFixed(0)} × ${v.toFixed(1)}² = ${E.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm', to: 'v', operator: '×' },
            { from: 'v', to: 'E', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'E',
        coefficient: '½',
        numerator: ['m', 'v'],
        squares: ['v'],
    },
    discoveries: [
        {
            id: 'velocity-squared',
            mission: {
                ko: '속도 v를 2배로 늘려봐! (5에서 10으로)',
                en: 'Double the velocity v! (from 5 to 10)',
                ja: '速度vを2倍にしてみよう！（5から10へ）',
            },
            result: {
                ko: '속도가 2배가 되면 에너지는 4배! 속도의 제곱에 비례하기 때문이야.',
                en: 'Doubling velocity quadruples energy! Because energy is proportional to velocity squared.',
                ja: '速度が2倍になるとエネルギーは4倍！速度の二乗に比例するからだ。',
            },
            icon: '📈',
            condition: (vars) => vars['v'] >= 10,
        },
        {
            id: 'high-speed-impact',
            mission: {
                ko: '속도 v를 18 이상으로 올려봐!',
                en: 'Raise velocity v above 18!',
                ja: '速度vを18以上に上げてみよう！',
            },
            result: {
                ko: '고속 충돌은 엄청난 에너지를 전달해! 자동차 안전벨트가 중요한 이유야.',
                en: 'High-speed collisions transfer enormous energy! This is why seatbelts are crucial.',
                ja: '高速衝突は膨大なエネルギーを伝える！シートベルトが重要な理由だ。',
            },
            icon: '🚗',
            condition: (vars) => vars['v'] >= 18,
        },
    ],
    getInsight: (vars) => {
        const E = vars['E']
        if (E < 1)
            return {
                ko: '날아가는 파리의 에너지야',
                en: 'Energy of a flying fly',
                ja: '飛ぶハエのエネルギー',
            }
        if (E < 10)
            return {
                ko: '던진 공의 에너지 정도야',
                en: 'Like a thrown ball',
                ja: '投げたボールくらい',
            }
        if (E < 100)
            return {
                ko: '달리는 사람의 에너지야',
                en: "A running person's energy",
                ja: '走る人のエネルギー',
            }
        if (E < 1000)
            return {
                ko: '자전거 타는 사람의 에너지야',
                en: "A cyclist's energy",
                ja: '自転車に乗る人のエネルギー',
            }
        if (E < 5000)
            return {
                ko: '달리는 오토바이의 에너지야',
                en: "A motorcycle's energy",
                ja: 'バイクのエネルギー',
            }
        return {
            ko: '달리는 자동차의 에너지야!',
            en: "A moving car's energy!",
            ja: '走る車のエネルギー！',
        }
    },
}
