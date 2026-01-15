import { Formula } from './types'
import { colors } from '../styles/colors'

export const centripetal: Formula = {
    id: 'centripetal',
    name: { ko: '구심력', en: 'Centripetal Force', ja: '向心力' },
    expression: 'F = mv²/r',
    description: { ko: '원운동하는 물체를 중심으로 당기는 힘', en: 'The force pulling a rotating object toward the center', ja: '円運動する物体を中心に引く力' },
    simulationHint: { ko: '물체가 원형 궤도를 따라 회전하며 중심 방향으로 힘을 받는 모습', en: 'Shows an object rotating in a circular path with force toward the center', ja: '物体が円軌道を回りながら中心方向に力を受ける様子' },
    applications: {
        ko: [
            '놀이공원 회전 놀이기구의 안전 설계',
            '자동차가 커브길을 돌 때 필요한 마찰력 계산',
            '세탁기 탈수 기능의 원리',
            '인공위성의 궤도 속도 계산',
        ],
        en: [
            'Safety design for amusement park rides',
            'Calculating friction for cars on curves',
            'How washing machine spin cycles work',
            'Calculating satellite orbital velocity',
        ],
        ja: [
            '遊園地の回転アトラクションの安全設計',
            'カーブでの車の摩擦力計算',
            '洗濯機の脱水機能の原理',
            '人工衛星の軌道速度計算',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: { ko: '질량', en: 'Mass', ja: '質量' },
            role: 'input',
            unit: 'kg',
            range: [1, 20],
            default: 5,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 2,
                color: colors.mass,
            },
        },
        {
            symbol: 'v',
            name: { ko: '속력', en: 'Velocity', ja: '速度' },
            role: 'input',
            unit: 'm/s',
            range: [1, 10],
            default: 4,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'r',
            name: { ko: '반지름', en: 'Radius', ja: '半径' },
            role: 'input',
            unit: 'm',
            range: [1, 10],
            default: 3,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 15,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: { ko: '구심력', en: 'Centripetal Force', ja: '向心力' },
            role: 'output',
            unit: 'N',
            range: [0, 500],
            default: 26.67,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 5
        const v = inputs.v ?? 4
        const r = inputs.r ?? 3
        return {
            F: (m * v * v) / r,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 5
        const v = inputs.v ?? 4
        const r = inputs.r ?? 3
        const F = (m * v * v) / r
        return `F = ${m.toFixed(1)} × ${v.toFixed(1)}² ÷ ${r.toFixed(1)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'm', to: 'v', operator: '×' },
            { from: 'v', to: 'r', operator: '²' },
            { from: 'r', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'F',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'm' },
                    { type: 'var', symbol: 'v', square: true },
                ],
                denominator: [{ type: 'var', symbol: 'r' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'high-speed-turn',
            mission: { ko: '속력 v를 9 이상으로 올리고 반지름 r을 3 이하로 줄여봐!', en: 'Raise velocity v above 9 and reduce radius r below 3!', ja: '速度vを9以上にして半径rを3以下にしてみよう！' },
            result: { ko: '빠른 속도로 좁게 돌면 구심력이 급증해! 급커브에서 차가 미끄러지는 이유야.', en: 'Fast tight turns require huge centripetal force! This is why cars skid on sharp curves.', ja: '速い速度で狭く回ると向心力が急増する！急カーブで車がスリップする理由だ。' },
            icon: '🏎️',
            condition: (vars) => vars['v'] >= 9 && vars['r'] <= 3,
        },
        {
            id: 'gentle-curve',
            mission: { ko: '반지름 r을 최대(10m)로 늘려봐!', en: 'Maximize radius r to 10m!', ja: '半径rを最大(10m)にしてみよう！' },
            result: { ko: '큰 반지름으로 돌면 구심력이 작아져! 고속도로 커브가 완만한 이유야.', en: 'Large radius curves need less force! This is why highway curves are gentle.', ja: '大きな半径で回ると向心力が小さくなる！高速道路のカーブが緩やかな理由だ。' },
            icon: '🛣️',
            condition: (vars) => vars['r'] >= 9,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 10) return { ko: '요요 돌리는 힘 정도야', en: 'Like spinning a yo-yo', ja: 'ヨーヨーを回す力くらい' }
        if (F < 50) return { ko: '줄에 공 돌리는 힘이야', en: 'Like spinning a ball on string', ja: '紐でボールを回す力' }
        if (F < 150) return { ko: '회전목마의 힘이야', en: 'Like a carousel', ja: 'メリーゴーランドの力' }
        if (F < 300) return { ko: '자동차 커브 도는 힘이야', en: 'Car turning a curve', ja: '車がカーブを曲がる力' }
        return { ko: '롤러코스터급 힘이야!', en: 'Roller coaster level force!', ja: 'ジェットコースター級の力！' }
    },
}
