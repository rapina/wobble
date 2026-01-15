import { Formula } from './types'
import { colors } from '../styles/colors'

export const pressure: Formula = {
    id: 'pressure',
    name: { ko: '압력', en: 'Pressure', ja: '圧力' },
    expression: 'P = F/A',
    description: {
        ko: '단위 면적당 가해지는 힘',
        en: 'Force applied per unit area',
        ja: '単位面積あたりの力',
    },
    simulationHint: {
        ko: '같은 힘이라도 면적이 작을수록 압력이 커지는 모습',
        en: 'Shows how pressure increases as area decreases for the same force',
        ja: '同じ力でも面積が小さいほど圧力が大きくなる様子',
    },
    applications: {
        ko: [
            '압정이 쉽게 찔리는 이유',
            '스키가 눈에 덜 빠지는 원리',
            '고압 세척기의 작동 원리',
            '칼날이 날카로울수록 잘 드는 이유',
        ],
        en: [
            'Why thumbtacks pierce easily',
            "Why skis don't sink in snow",
            'How pressure washers work',
            'Why sharper knives cut better',
        ],
        ja: [
            '画びょうが刺さりやすい理由',
            'スキーが雪に沈みにくい原理',
            '高圧洗浄機の仕組み',
            '鋭い刃がよく切れる理由',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'F',
            name: { ko: '힘', en: 'Force', ja: '力' },
            role: 'input',
            unit: 'N',
            range: [10, 200],
            default: 100,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.force,
            },
        },
        {
            symbol: 'A',
            name: { ko: '면적', en: 'Area', ja: '面積' },
            role: 'input',
            unit: 'cm²',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => value / 50,
                color: colors.distance,
            },
        },
        {
            symbol: 'P',
            name: { ko: '압력', en: 'Pressure', ja: '圧力' },
            role: 'output',
            unit: 'kPa',
            range: [0, 2000],
            default: 100,
            visual: {
                property: 'shake',
                scale: (value: number) => Math.min(value / 100, 5),
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const F = inputs.F ?? 100
        const A = inputs.A ?? 10
        // P = F/A, convert to kPa (F in N, A in cm² → multiply by 10)
        return {
            P: (F * 10) / A,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const F = inputs.F ?? 100
        const A = inputs.A ?? 10
        const P = (F * 10) / A
        return `P = ${F.toFixed(0)} ÷ ${A.toFixed(1)} = ${P.toFixed(0)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'F', to: 'A', operator: '÷' },
            { from: 'A', to: 'P', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'P',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'F' }],
                denominator: [{ type: 'var', symbol: 'A' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'needle-point',
            mission: {
                ko: '면적 A를 5cm² 이하로 줄여봐!',
                en: 'Reduce area A below 5 square centimeters!',
                ja: '面積Aを5cm²以下に減らしてみて！',
            },
            result: {
                ko: '면적이 작으면 압력이 엄청 커져! 압정이 쉽게 찔리는 이유야.',
                en: 'Small area means huge pressure! This is why thumbtacks pierce easily.',
                ja: '面積が小さいと圧力が大きくなる！画びょうが刺さりやすい理由だよ。',
            },
            icon: '📌',
            condition: (vars) => vars['A'] <= 5,
        },
        {
            id: 'snowshoe',
            mission: {
                ko: '면적 A를 최대(100cm²)로 늘려봐!',
                en: 'Maximize area A to 100 square centimeters!',
                ja: '面積Aを最大（100cm²）まで増やしてみて！',
            },
            result: {
                ko: '면적이 크면 압력이 분산돼! 스키가 눈에 덜 빠지는 원리야.',
                en: 'Large area spreads pressure out! This is why skis do not sink in snow.',
                ja: '面積が大きいと圧力が分散される！スキーが雪に沈みにくい原理だよ。',
            },
            icon: '🎿',
            condition: (vars) => vars['A'] >= 90,
        },
    ],
    getInsight: (vars) => {
        const P = vars['P']
        if (P < 50) return { ko: '손바닥으로 누르는 정도야', en: 'Like pressing with palm', ja: '手のひらで押す程度だよ' }
        if (P < 200) return { ko: '손가락으로 누르는 힘이야', en: 'Like pressing with finger', ja: '指で押す力だよ' }
        if (P < 500) return { ko: '볼펜 끝 압력이야', en: 'Ballpoint pen tip pressure', ja: 'ボールペンの先の圧力だよ' }
        if (P < 1000) return { ko: '압정 끝 압력이야!', en: 'Thumbtack tip pressure!', ja: '画びょうの先の圧力だよ！' }
        return { ko: '칼날 수준의 압력!', en: 'Knife blade level pressure!', ja: '刃物レベルの圧力だよ！' }
    },
}
