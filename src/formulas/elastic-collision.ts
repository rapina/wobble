import { Formula } from './types'
import { colors } from '../styles/colors'

export const elasticCollision: Formula = {
    id: 'elastic-collision',
    name: { ko: '탄성 충돌', en: 'Elastic Collision', ja: '弾性衝突' },
    expression: "e = -(v₂'-v₁')/(v₂-v₁)",
    description: {
        ko: '충돌 전후 상대속도의 비율로 반발 계수를 나타낸다',
        en: 'The coefficient of restitution as the ratio of relative velocities before and after collision',
        ja: '衝突前後の相対速度の比で反発係数を表す',
    },
    simulationHint: {
        ko: '두 물체가 충돌 후 반발 계수에 따라 튕겨나가는 모습',
        en: 'Shows two objects bouncing off each other based on restitution coefficient',
        ja: '2つの物体が衝突後、反発係数に応じて跳ね返る様子',
    },
    applications: {
        ko: [
            '당구공 충돌 후 움직임 예측',
            '테니스 라켓과 공의 반발력 설계',
            '자동차 범퍼의 충격 흡수 설계',
            '농구공의 바운스 높이 계산',
        ],
        en: [
            'Predicting billiard ball motion after collision',
            'Designing tennis racket rebound',
            'Car bumper shock absorption design',
            'Calculating basketball bounce height',
        ],
        ja: [
            'ビリヤードボールの衝突後の動き予測',
            'テニスラケットの反発力設計',
            '自動車バンパーの衝撃吸収設計',
            'バスケットボールのバウンス高さ計算',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'm₁',
            name: { ko: '질량 1', en: 'Mass 1', ja: '質量1' },
            role: 'input',
            unit: 'kg',
            range: [1, 20],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 2,
                color: colors.mass,
            },
        },
        {
            symbol: 'm₂',
            name: { ko: '질량 2', en: 'Mass 2', ja: '質量2' },
            role: 'input',
            unit: 'kg',
            range: [1, 20],
            default: 5,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 2,
                color: colors.velocity,
            },
        },
        {
            symbol: 'v₁',
            name: { ko: '속도 1', en: 'Velocity 1', ja: '速度1' },
            role: 'input',
            unit: 'm/s',
            range: [1, 10],
            default: 5,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'e',
            name: { ko: '반발 계수', en: 'Restitution Coeff.', ja: '反発係数' },
            role: 'input',
            unit: '',
            range: [0, 1],
            default: 0.8,
            visual: {
                property: 'glow',
                scale: (value: number) => value * 5,
                color: colors.force,
            },
        },
        {
            symbol: "v₁'",
            name: { ko: '충돌 후 속도 1', en: 'Velocity 1 After', ja: '衝突後速度1' },
            role: 'output',
            unit: 'm/s',
            range: [-10, 10],
            default: 1.67,
            visual: {
                property: 'speed',
                scale: (value: number) => Math.abs(value) * 0.5,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m1 = inputs['m₁'] ?? 10
        const m2 = inputs['m₂'] ?? 5
        const v1 = inputs['v₁'] ?? 5
        const e = inputs.e ?? 0.8
        // v2 = 0 (정지 상태)
        // v1' = (m1 - e*m2) * v1 / (m1 + m2)
        const v1Prime = ((m1 - e * m2) * v1) / (m1 + m2)
        return {
            "v₁'": v1Prime,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m1 = inputs['m₁'] ?? 10
        const m2 = inputs['m₂'] ?? 5
        const v1 = inputs['v₁'] ?? 5
        const e = inputs.e ?? 0.8
        const v1Prime = ((m1 - e * m2) * v1) / (m1 + m2)
        return `v₁' = (${m1.toFixed(0)} - ${e.toFixed(1)}×${m2.toFixed(0)}) × ${v1.toFixed(1)} ÷ ${(m1 + m2).toFixed(0)} = ${v1Prime.toFixed(2)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm₁', to: 'v₁', operator: '×' },
            { from: 'e', to: "v₁'", operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: "v₁'",
        expression: [
            {
                type: 'fraction',
                numerator: [
                    {
                        type: 'group',
                        items: [
                            { type: 'var', symbol: 'm₁' },
                            { type: 'op', value: '-' },
                            { type: 'var', symbol: 'e' },
                            { type: 'var', symbol: 'm₂' },
                        ],
                    },
                    { type: 'var', symbol: 'v₁' },
                ],
                denominator: [
                    { type: 'var', symbol: 'm₁' },
                    { type: 'op', value: '+' },
                    { type: 'var', symbol: 'm₂' },
                ],
            },
        ],
    },
    getInsight: (vars) => {
        const v1Prime = vars["v₁'"]
        const e = vars['e']
        if (e >= 0.95) return { ko: '거의 완전 탄성! 당구공처럼 튕겨', en: 'Nearly perfect elastic! Bounces like billiard balls', ja: 'ほぼ完全弾性！ビリヤードボールのように弾む' }
        if (e <= 0.1) return { ko: '거의 완전 비탄성! 찰흙처럼 붙어', en: 'Nearly inelastic! Sticks like clay', ja: 'ほぼ完全非弾性！粘土のようにくっつく' }
        if (v1Prime < 0) return { ko: '반대 방향으로 튕겨나갔어!', en: 'Bounced back in opposite direction!', ja: '反対方向に跳ね返った！' }
        if (v1Prime < 1) return { ko: '거의 멈췄어! 에너지 대부분 전달됐어', en: 'Nearly stopped! Most energy transferred', ja: 'ほぼ停止！エネルギーの大部分が移った' }
        return { ko: '일부 에너지가 전달됐어', en: 'Some energy was transferred', ja: '一部のエネルギーが移った' }
    },
    discoveries: [
        {
            id: 'perfect-elastic',
            mission: { ko: '반발 계수 e를 1로 설정해봐! (완전 탄성 충돌)', en: 'Set restitution coefficient e to 1! (perfectly elastic collision)', ja: '反発係数eを1に設定してみて！（完全弾性衝突）' },
            result: { ko: '반발 계수 1이면 에너지 손실 없이 완전히 튕겨! 이상적인 당구공 충돌이야.', en: 'With e=1, energy is fully conserved! This is an ideal billiard ball collision.', ja: '反発係数1ならエネルギー損失なく完全に弾む！理想的なビリヤードボールの衝突だよ。' },
            icon: '🎱',
            condition: (vars) => vars['e'] >= 0.98,
        },
        {
            id: 'inelastic',
            mission: { ko: '반발 계수 e를 0.2 이하로 낮춰봐! (비탄성 충돌)', en: 'Lower restitution coefficient e below 0.2! (inelastic collision)', ja: '反発係数eを0.2以下に下げてみて！（非弾性衝突）' },
            result: { ko: '반발 계수가 낮으면 에너지가 흡수돼! 자동차 범퍼가 충격을 줄이는 방법이야.', en: 'Low restitution absorbs energy! This is how car bumpers reduce impact.', ja: '反発係数が低いとエネルギーが吸収される！車のバンパーが衝撃を減らす方法だよ。' },
            icon: '🚗',
            condition: (vars) => vars['e'] <= 0.2,
        },
    ],
}
