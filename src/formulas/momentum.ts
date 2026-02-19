import { Formula } from './types'
import { colors } from '../styles/colors'

export const momentum: Formula = {
    id: 'momentum',
    name: {
        ko: '운동량',
        en: 'Momentum',
        ja: '運動量',
        es: 'Momento',
        pt: 'Momento',
        'zh-CN': '动量',
        'zh-TW': '動量',
    },
    expression: 'p = mv',
    description: {
        ko: '물체의 운동 상태를 나타내는 물리량',
        en: 'Physical quantity representing the motion state of an object',
        ja: '物体の運動状態を表す物理量',
        es: 'Cantidad física que representa el estado de movimiento de un objeto',
        pt: 'Quantidade física que representa o estado de movimento de um objeto',
        'zh-CN': '表示物体运动状态的物理量',
        'zh-TW': '表示物體運動狀態的物理量',
    },
    simulationHint: {
        ko: '질량과 속도에 따라 물체의 운동량이 변하는 모습',
        en: 'Shows how momentum changes with mass and velocity',
        ja: '質量と速度によって運動量が変わる様子',
        es: 'Muestra cómo cambia el momento con la masa y la velocidad',
        pt: 'Mostra como o momento muda com a massa e a velocidade',
        'zh-CN': '显示动量如何随质量和速度变化',
        'zh-TW': '顯示動量如何隨質量和速度變化',
    },
    applications: {
        ko: [
            '당구나 볼링에서 공의 충돌 예측',
            '교통사고 분석 시 차량 속도 추정',
            '우주선 도킹 시 충격 최소화 설계',
            '권투 글러브가 충격을 줄이는 원리',
        ],
        en: [
            'Predicting ball collisions in billiards or bowling',
            'Estimating vehicle speed in traffic accident analysis',
            'Designing minimal impact for spacecraft docking',
            'How boxing gloves reduce impact force',
        ],
        ja: [
            'ビリヤードやボウリングでの衝突予測',
            '交通事故分析での車両速度推定',
            '宇宙船ドッキング時の衝撃最小化設計',
            'ボクシンググローブが衝撃を減らす原理',
        ],
        es: [
            'Predicción de colisiones de bolas en billar o bolos',
            'Estimación de velocidad del vehículo en análisis de accidentes',
            'Diseño de impacto mínimo para acoplamiento de naves espaciales',
            'Cómo los guantes de boxeo reducen la fuerza del impacto',
        ],
        pt: [
            'Previsão de colisões de bolas no bilhar ou boliche',
            'Estimativa de velocidade do veículo em análise de acidentes',
            'Projeto de impacto mínimo para acoplamento de espaçonaves',
            'Como as luvas de boxe reduzem a força do impacto',
        ],
        'zh-CN': [
            '预测台球或保龄球的碰撞',
            '交通事故分析中估算车辆速度',
            '设计航天器对接时的最小冲击',
            '拳击手套减少冲击力的原理',
        ],
        'zh-TW': [
            '預測撞球或保齡球的碰撞',
            '交通事故分析中估算車輛速度',
            '設計太空船對接時的最小衝擊',
            '拳擊手套減少衝擊力的原理',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: {
                ko: '질량',
                en: 'Mass',
                ja: '質量',
                es: 'Masa',
                pt: 'Massa',
                'zh-CN': '质量',
                'zh-TW': '質量',
            },
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
            name: {
                ko: '속도',
                en: 'Velocity',
                ja: '速度',
                es: 'Velocidad',
                pt: 'Velocidade',
                'zh-CN': '速度',
                'zh-TW': '速度',
            },
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
            symbol: 'p',
            name: {
                ko: '운동량',
                en: 'Momentum',
                ja: '運動量',
                es: 'Momento',
                pt: 'Momento',
                'zh-CN': '动量',
                'zh-TW': '動量',
            },
            role: 'output',
            unit: 'kg·m/s',
            range: [0, 1000],
            default: 50,
            visual: {
                property: 'shake',
                scale: (value: number) => Math.min(value * 0.02, 8),
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const v = inputs.v ?? 5
        return {
            p: m * v,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const v = inputs.v ?? 5
        const p = m * v
        return `p = ${m.toFixed(0)} × ${v.toFixed(1)} = ${p.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm', to: 'v', operator: '×' },
            { from: 'v', to: 'p', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'p',
        numerator: ['m', 'v'],
    },
    discoveries: [
        {
            id: 'heavy-slow',
            mission: {
                ko: '질량 m을 최대로, 속도 v를 5 이하로 설정해봐!',
                en: 'Set mass m to max and velocity v below 5!',
                ja: '質量mを最大に、速度vを5以下に設定してみよう！',
                es: '¡Pon la masa m al máximo y la velocidad v por debajo de 5!',
                pt: 'Coloque a massa m no máximo e a velocidade v abaixo de 5!',
                'zh-CN': '将质量m调到最大，速度v调到5以下！',
                'zh-TW': '將質量m調到最大，速度v調到5以下！',
            },
            result: {
                ko: '무거운 물체는 느리게 움직여도 큰 운동량을 가져! 화물열차가 위험한 이유야.',
                en: 'Heavy objects have large momentum even when slow! This is why freight trains are dangerous.',
                ja: '重い物体はゆっくり動いても大きな運動量を持つ！貨物列車が危険な理由だ。',
                es: '¡Los objetos pesados tienen gran momento incluso cuando son lentos! Por eso los trenes de carga son peligrosos.',
                pt: 'Objetos pesados têm grande momento mesmo quando lentos! Por isso trens de carga são perigosos.',
                'zh-CN': '重物即使移动缓慢也有很大的动量！这就是货运列车危险的原因。',
                'zh-TW': '重物即使移動緩慢也有很大的動量！這就是貨運列車危險的原因。',
            },
            icon: '🚂',
            condition: (vars) => vars['m'] >= 45 && vars['v'] <= 5,
        },
        {
            id: 'light-fast',
            mission: {
                ko: '질량 m을 10 이하로, 속도 v를 18 이상으로 설정해봐!',
                en: 'Set mass m below 10 and velocity v above 18!',
                ja: '質量mを10以下に、速度vを18以上に設定してみよう！',
                es: '¡Pon la masa m por debajo de 10 y la velocidad v por encima de 18!',
                pt: 'Coloque a massa m abaixo de 10 e a velocidade v acima de 18!',
                'zh-CN': '将质量m调到10以下，速度v调到18以上！',
                'zh-TW': '將質量m調到10以下，速度v調到18以上！',
            },
            result: {
                ko: '가벼운 물체도 빠르면 큰 운동량을 가져! 총알이 위험한 이유야.',
                en: 'Light objects can have large momentum when fast! This is why bullets are dangerous.',
                ja: '軽い物体も速ければ大きな運動量を持つ！弾丸が危険な理由だ。',
                es: '¡Los objetos ligeros pueden tener gran momento cuando son rápidos! Por eso las balas son peligrosas.',
                pt: 'Objetos leves podem ter grande momento quando rápidos! Por isso balas são perigosas.',
                'zh-CN': '轻物快速移动时也能有很大的动量！这就是子弹危险的原因。',
                'zh-TW': '輕物快速移動時也能有很大的動量！這就是子彈危險的原因。',
            },
            icon: '🎯',
            condition: (vars) => vars['m'] <= 10 && vars['v'] >= 18,
        },
    ],
    getInsight: (vars) => {
        const p = vars['p']
        if (p < 5)
            return {
                ko: '걷는 개미의 운동량이야',
                en: 'Momentum of a walking ant',
                ja: '歩くアリの運動量',
                es: 'Momento de una hormiga caminando',
                pt: 'Momento de uma formiga andando',
                'zh-CN': '行走蚂蚁的动量',
                'zh-TW': '行走螞蟻的動量',
            }
        if (p < 20)
            return {
                ko: '던진 야구공 정도야',
                en: 'Like a thrown baseball',
                ja: '投げた野球ボールくらい',
                es: 'Como una pelota de béisbol lanzada',
                pt: 'Como uma bola de beisebol arremessada',
                'zh-CN': '像投掷的棒球',
                'zh-TW': '像投擲的棒球',
            }
        if (p < 100)
            return {
                ko: '달리는 사람의 운동량이야',
                en: "A running person's momentum",
                ja: '走る人の運動量',
                es: 'Momento de una persona corriendo',
                pt: 'Momento de uma pessoa correndo',
                'zh-CN': '跑步的人的动量',
                'zh-TW': '跑步的人的動量',
            }
        if (p < 300)
            return {
                ko: '자전거 타는 사람 정도야',
                en: 'Like a cyclist',
                ja: '自転車に乗る人くらい',
                es: 'Como un ciclista',
                pt: 'Como um ciclista',
                'zh-CN': '像骑自行车的人',
                'zh-TW': '像騎自行車的人',
            }
        if (p < 600)
            return {
                ko: '달리는 사슴의 운동량이야',
                en: "A running deer's momentum",
                ja: '走る鹿の運動量',
                es: 'Momento de un ciervo corriendo',
                pt: 'Momento de um cervo correndo',
                'zh-CN': '奔跑的鹿的动量',
                'zh-TW': '奔跑的鹿的動量',
            }
        return {
            ko: '오토바이급 운동량이야!',
            en: 'Motorcycle-level momentum!',
            ja: 'バイク級の運動量！',
            es: '¡Momento nivel motocicleta!',
            pt: 'Momento nível motocicleta!',
            'zh-CN': '摩托车级别的动量！',
            'zh-TW': '摩托車級別的動量！',
        }
    },
}
