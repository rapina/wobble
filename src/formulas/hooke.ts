import { Formula } from './types'
import { colors } from '../styles/colors'

export const hooke: Formula = {
    id: 'hooke',
    name: { ko: '훅의 법칙', en: "Hooke's Law", ja: 'フックの法則' },
    expression: 'F = -kx',
    description: { ko: '스프링이 늘어나거나 줄어든 길이에 비례하여 복원력이 작용한다', en: 'Restoring force is proportional to the spring displacement', ja: 'バネの伸縮に比例して復元力が働く' },
    simulationHint: { ko: '스프링이 늘어나고 줄어들며 복원력이 작용하는 모습', en: 'Shows a spring stretching and compressing with restoring force', ja: 'バネが伸び縮みしながら復元力が働く様子' },
    applications: {
        ko: [
            '자동차 서스펜션 설계',
            '침대 매트리스의 탄성 조절',
            '체중계의 스프링 눈금 설계',
            '트램폴린과 방방이의 탄성 설계',
        ],
        en: [
            'Designing car suspension systems',
            'Adjusting mattress elasticity',
            'Designing spring scales for weight measurement',
            'Designing elasticity for trampolines and bouncy houses',
        ],
        ja: [
            '自動車のサスペンション設計',
            'マットレスの弾力性調整',
            '体重計のバネ目盛り設計',
            'トランポリンや遊具の弾性設計',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'k',
            name: { ko: '스프링 상수', en: 'Spring Constant', ja: 'バネ定数' },
            role: 'input',
            unit: 'N/m',
            range: [10, 100],
            default: 50,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 10,
                color: colors.spring,
            },
        },
        {
            symbol: 'x',
            name: { ko: '변위', en: 'Displacement', ja: '変位' },
            role: 'input',
            unit: 'm',
            range: [0.1, 2],
            default: 0.5,
            visual: {
                property: 'stretch',
                scale: (value: number) => value * 50,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: { ko: '복원력', en: 'Restoring Force', ja: '復元力' },
            role: 'output',
            unit: 'N',
            range: [0, 200],
            default: 25,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 0.3,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const k = inputs.k ?? 50
        const x = inputs.x ?? 0.5
        return {
            F: k * x,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const k = inputs.k ?? 50
        const x = inputs.x ?? 0.5
        const F = k * x
        return `F = ${k.toFixed(0)} × ${x.toFixed(2)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'spring',
        connections: [
            { from: 'k', to: 'x', operator: '×' },
            { from: 'x', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['k', 'x'],
    },
    discoveries: [
        {
            id: 'stiff-spring',
            mission: { ko: '스프링 상수 k를 80 이상으로 올려봐!', en: 'Raise spring constant k above 80!', ja: 'バネ定数kを80以上にしてみよう！' },
            result: { ko: '딱딱한 스프링은 조금만 늘어나도 큰 힘으로 복원해!', en: 'A stiff spring restores with great force even with small stretch!', ja: '硬いバネは少し伸びただけでも大きな力で戻る！' },
            icon: '🔩',
            condition: (vars) => vars['k'] >= 80,
        },
        {
            id: 'max-stretch',
            mission: { ko: '변위 x를 최대(2m)로 늘려봐!', en: 'Stretch displacement x to maximum (2m)!', ja: '変位xを最大(2m)まで伸ばしてみよう！' },
            result: { ko: '스프링을 많이 늘리면 복원력이 엄청나게 커져! 너무 늘리면 스프링이 망가질 수 있어.', en: 'Stretching too far creates huge restoring force! Too much can damage the spring.', ja: 'バネを伸ばしすぎると復元力が大きくなる！伸ばしすぎるとバネが壊れることも。' },
            icon: '⚠️',
            condition: (vars) => vars['x'] >= 1.8,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 5) return { ko: '고무줄 살짝 당기는 힘이야', en: 'Lightly pulling a rubber band', ja: 'ゴムを軽く引く力' }
        if (F < 20) return { ko: '문구용 스프링 정도야', en: 'Like an office spring', ja: '文房具のバネくらい' }
        if (F < 50) return { ko: '볼펜 스프링 정도야', en: 'Like a pen spring', ja: 'ボールペンのバネくらい' }
        if (F < 100) return { ko: '침대 스프링 정도야', en: 'Like a bed spring', ja: 'ベッドのバネくらい' }
        return { ko: '트램폴린 스프링급 힘!', en: 'Trampoline spring level force!', ja: 'トランポリンのバネ級の力！' }
    },
}
