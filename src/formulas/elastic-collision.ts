import { Formula } from './types'
import { colors } from '../styles/colors'

export const elasticCollision: Formula = {
    id: 'elastic-collision',
    name: {
        ko: '탄성 충돌',
        en: 'Elastic Collision',
        ja: '弾性衝突',
        es: 'Colisión Elástica',
        pt: 'Colisão Elástica',
        'zh-CN': '弹性碰撞',
        'zh-TW': '彈性碰撞',
    },
    expression: "e = -(v₂'-v₁')/(v₂-v₁)",
    description: {
        ko: '충돌 전후 상대속도의 비율로 반발 계수를 나타낸다',
        en: 'The coefficient of restitution as the ratio of relative velocities before and after collision',
        ja: '衝突前後の相対速度の比で反発係数を表す',
        es: 'El coeficiente de restitución como la relación de velocidades relativas antes y después de la colisión',
        pt: 'O coeficiente de restituição como a razão das velocidades relativas antes e depois da colisão',
        'zh-CN': '恢复系数表示为碰撞前后相对速度的比值',
        'zh-TW': '恢復係數表示為碰撞前後相對速度的比值',
    },
    simulationHint: {
        ko: '두 물체가 충돌 후 반발 계수에 따라 튕겨나가는 모습',
        en: 'Shows two objects bouncing off each other based on restitution coefficient',
        ja: '2つの物体が衝突後、反発係数に応じて跳ね返る様子',
        es: 'Muestra dos objetos rebotando según el coeficiente de restitución',
        pt: 'Mostra dois objetos ricocheteando com base no coeficiente de restituição',
        'zh-CN': '显示两个物体根据恢复系数相互弹开',
        'zh-TW': '顯示兩個物體根據恢復係數相互彈開',
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
        es: [
            'Predicción del movimiento de bolas de billar después de colisión',
            'Diseño del rebote de raqueta de tenis',
            'Diseño de absorción de impacto del parachoques',
            'Cálculo de la altura de rebote del balón de baloncesto',
        ],
        pt: [
            'Previsão do movimento das bolas de bilhar após colisão',
            'Projeto de rebote de raquete de tênis',
            'Projeto de absorção de impacto do para-choque',
            'Cálculo da altura de quique da bola de basquete',
        ],
        'zh-CN': [
            '预测台球碰撞后的运动',
            '设计网球拍的反弹力',
            '汽车保险杠的减震设计',
            '计算篮球的弹跳高度',
        ],
        'zh-TW': [
            '預測撞球碰撞後的運動',
            '設計網球拍的反彈力',
            '汽車保險桿的減震設計',
            '計算籃球的彈跳高度',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'm₁',
            name: {
                ko: '질량 1',
                en: 'Mass 1',
                ja: '質量1',
                es: 'Masa 1',
                pt: 'Massa 1',
                'zh-CN': '质量1',
                'zh-TW': '質量1',
            },
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
            name: {
                ko: '질량 2',
                en: 'Mass 2',
                ja: '質量2',
                es: 'Masa 2',
                pt: 'Massa 2',
                'zh-CN': '质量2',
                'zh-TW': '質量2',
            },
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
            name: {
                ko: '속도 1',
                en: 'Velocity 1',
                ja: '速度1',
                es: 'Velocidad 1',
                pt: 'Velocidade 1',
                'zh-CN': '速度1',
                'zh-TW': '速度1',
            },
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
            name: {
                ko: '반발 계수',
                en: 'Restitution Coeff.',
                ja: '反発係数',
                es: 'Coef. Restitución',
                pt: 'Coef. Restituição',
                'zh-CN': '恢复系数',
                'zh-TW': '恢復係數',
            },
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
            name: {
                ko: '충돌 후 속도 1',
                en: 'Velocity 1 After',
                ja: '衝突後速度1',
                es: 'Velocidad 1 Después',
                pt: 'Velocidade 1 Após',
                'zh-CN': '碰撞后速度1',
                'zh-TW': '碰撞後速度1',
            },
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
        if (e >= 0.95)
            return {
                ko: '거의 완전 탄성! 당구공처럼 튕겨',
                en: 'Nearly perfect elastic! Bounces like billiard balls',
                ja: 'ほぼ完全弾性！ビリヤードボールのように弾む',
                es: '¡Casi perfectamente elástico! Rebota como bolas de billar',
                pt: 'Quase perfeitamente elástico! Ricochete como bolas de bilhar',
                'zh-CN': '几乎完全弹性！像台球一样弹跳',
                'zh-TW': '幾乎完全彈性！像撞球一樣彈跳',
            }
        if (e <= 0.1)
            return {
                ko: '거의 완전 비탄성! 찰흙처럼 붙어',
                en: 'Nearly inelastic! Sticks like clay',
                ja: 'ほぼ完全非弾性！粘土のようにくっつく',
                es: '¡Casi inelástico! Se pega como arcilla',
                pt: 'Quase inelástico! Gruda como argila',
                'zh-CN': '几乎完全非弹性！像粘土一样粘住',
                'zh-TW': '幾乎完全非彈性！像黏土一樣黏住',
            }
        if (v1Prime < 0)
            return {
                ko: '반대 방향으로 튕겨나갔어!',
                en: 'Bounced back in opposite direction!',
                ja: '反対方向に跳ね返った！',
                es: '¡Rebotó en dirección opuesta!',
                pt: 'Ricocheteou na direção oposta!',
                'zh-CN': '向相反方向弹回去了！',
                'zh-TW': '向相反方向彈回去了！',
            }
        if (v1Prime < 1)
            return {
                ko: '거의 멈췄어! 에너지 대부분 전달됐어',
                en: 'Nearly stopped! Most energy transferred',
                ja: 'ほぼ停止！エネルギーの大部分が移った',
                es: '¡Casi se detuvo! La mayor parte de la energía se transfirió',
                pt: 'Quase parou! A maior parte da energia foi transferida',
                'zh-CN': '几乎停止了！大部分能量已转移',
                'zh-TW': '幾乎停止了！大部分能量已轉移',
            }
        return {
            ko: '일부 에너지가 전달됐어',
            en: 'Some energy was transferred',
            ja: '一部のエネルギーが移った',
            es: 'Se transfirió algo de energía',
            pt: 'Alguma energia foi transferida',
            'zh-CN': '部分能量已转移',
            'zh-TW': '部分能量已轉移',
        }
    },
    discoveries: [
        {
            id: 'perfect-elastic',
            mission: {
                ko: '반발 계수 e를 1로 설정해봐! (완전 탄성 충돌)',
                en: 'Set restitution coefficient e to 1! (perfectly elastic collision)',
                ja: '反発係数eを1に設定してみて！（完全弾性衝突）',
                es: '¡Pon el coeficiente de restitución e en 1! (colisión perfectamente elástica)',
                pt: 'Defina o coeficiente de restituição e para 1! (colisão perfeitamente elástica)',
                'zh-CN': '将恢复系数e设为1！（完全弹性碰撞）',
                'zh-TW': '將恢復係數e設為1！（完全彈性碰撞）',
            },
            result: {
                ko: '반발 계수 1이면 에너지 손실 없이 완전히 튕겨! 이상적인 당구공 충돌이야.',
                en: 'With e=1, energy is fully conserved! This is an ideal billiard ball collision.',
                ja: '反発係数1ならエネルギー損失なく完全に弾む！理想的なビリヤードボールの衝突だよ。',
                es: '¡Con e=1, la energía se conserva completamente! Es una colisión ideal de bolas de billar.',
                pt: 'Com e=1, a energia é totalmente conservada! Esta é uma colisão ideal de bolas de bilhar.',
                'zh-CN': '当e=1时，能量完全守恒！这是理想的台球碰撞。',
                'zh-TW': '當e=1時，能量完全守恆！這是理想的撞球碰撞。',
            },
            icon: '🎱',
            condition: (vars) => vars['e'] >= 0.98,
        },
        {
            id: 'inelastic',
            mission: {
                ko: '반발 계수 e를 0.2 이하로 낮춰봐! (비탄성 충돌)',
                en: 'Lower restitution coefficient e below 0.2! (inelastic collision)',
                ja: '反発係数eを0.2以下に下げてみて！（非弾性衝突）',
                es: '¡Baja el coeficiente de restitución e por debajo de 0.2! (colisión inelástica)',
                pt: 'Reduza o coeficiente de restituição e abaixo de 0.2! (colisão inelástica)',
                'zh-CN': '将恢复系数e降到0.2以下！（非弹性碰撞）',
                'zh-TW': '將恢復係數e降到0.2以下！（非彈性碰撞）',
            },
            result: {
                ko: '반발 계수가 낮으면 에너지가 흡수돼! 자동차 범퍼가 충격을 줄이는 방법이야.',
                en: 'Low restitution absorbs energy! This is how car bumpers reduce impact.',
                ja: '反発係数が低いとエネルギーが吸収される！車のバンパーが衝撃を減らす方法だよ。',
                es: '¡Baja restitución absorbe energía! Así es como los parachoques reducen el impacto.',
                pt: 'Baixa restituição absorve energia! É assim que os para-choques reduzem o impacto.',
                'zh-CN': '低恢复系数会吸收能量！这就是汽车保险杠减少冲击的方法。',
                'zh-TW': '低恢復係數會吸收能量！這就是汽車保險桿減少衝擊的方法。',
            },
            icon: '🚗',
            condition: (vars) => vars['e'] <= 0.2,
        },
    ],
}
