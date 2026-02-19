import { Formula } from './types'
import { colors } from '../styles/colors'

export const kineticEnergy: Formula = {
    id: 'kinetic-energy',
    name: {
        ko: '운동 에너지',
        en: 'Kinetic Energy',
        ja: '運動エネルギー',
        es: 'Energía Cinética',
        pt: 'Energia Cinética',
        'zh-CN': '动能',
        'zh-TW': '動能',
    },
    expression: 'E = ½mv²',
    description: {
        ko: '움직이는 물체가 가진 에너지',
        en: 'Energy possessed by a moving object',
        ja: '動いている物体が持つエネルギー',
        es: 'Energía que posee un objeto en movimiento',
        pt: 'Energia que um objeto em movimento possui',
        'zh-CN': '运动物体所具有的能量',
        'zh-TW': '運動物體所具有的能量',
    },
    simulationHint: {
        ko: '물체의 속도가 빨라질수록 운동 에너지가 커지는 모습',
        en: 'Shows kinetic energy increasing as object speed increases',
        ja: '物体の速度が上がるほど運動エネルギーが増える様子',
        es: 'Muestra cómo aumenta la energía cinética al aumentar la velocidad',
        pt: 'Mostra a energia cinética aumentando conforme a velocidade aumenta',
        'zh-CN': '显示物体速度越快动能越大',
        'zh-TW': '顯示物體速度越快動能越大',
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
        es: [
            'Cálculo de energía de impacto en colisiones de automóviles',
            'Análisis de relación velocidad-energía en diseño de montañas rusas',
            'Cálculo del poder destructivo de balas o meteoritos',
            'Predicción de generación de energía en turbinas eólicas',
        ],
        pt: [
            'Cálculo de energia de impacto em colisões de carros',
            'Análise da relação velocidade-energia no projeto de montanhas-russas',
            'Cálculo do poder destrutivo de balas ou meteoritos',
            'Previsão de geração de energia em turbinas eólicas',
        ],
        'zh-CN': [
            '计算汽车碰撞时的冲击能量',
            '分析过山车设计中的速度与能量关系',
            '计算子弹或陨石的破坏力',
            '预测风力发电机的发电量',
        ],
        'zh-TW': [
            '計算汽車碰撞時的衝擊能量',
            '分析雲霄飛車設計中的速度與能量關係',
            '計算子彈或隕石的破壞力',
            '預測風力發電機的發電量',
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
            symbol: 'E',
            name: {
                ko: '에너지',
                en: 'Energy',
                ja: 'エネルギー',
                es: 'Energía',
                pt: 'Energia',
                'zh-CN': '能量',
                'zh-TW': '能量',
            },
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
                es: '¡Duplica la velocidad v! (de 5 a 10)',
                pt: 'Duplique a velocidade v! (de 5 para 10)',
                'zh-CN': '把速度v翻倍！（从5到10）',
                'zh-TW': '把速度v翻倍！（從5到10）',
            },
            result: {
                ko: '속도가 2배가 되면 에너지는 4배! 속도의 제곱에 비례하기 때문이야.',
                en: 'Doubling velocity quadruples energy! Because energy is proportional to velocity squared.',
                ja: '速度が2倍になるとエネルギーは4倍！速度の二乗に比例するからだ。',
                es: '¡Duplicar la velocidad cuadruplica la energía! Porque la energía es proporcional al cuadrado de la velocidad.',
                pt: 'Dobrar a velocidade quadruplica a energia! Porque a energia é proporcional ao quadrado da velocidade.',
                'zh-CN': '速度翻倍，能量变成4倍！因为能量与速度的平方成正比。',
                'zh-TW': '速度翻倍，能量變成4倍！因為能量與速度的平方成正比。',
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
                es: '¡Sube la velocidad v por encima de 18!',
                pt: 'Aumente a velocidade v acima de 18!',
                'zh-CN': '把速度v提高到18以上！',
                'zh-TW': '把速度v提高到18以上！',
            },
            result: {
                ko: '고속 충돌은 엄청난 에너지를 전달해! 자동차 안전벨트가 중요한 이유야.',
                en: 'High-speed collisions transfer enormous energy! This is why seatbelts are crucial.',
                ja: '高速衝突は膨大なエネルギーを伝える！シートベルトが重要な理由だ。',
                es: '¡Las colisiones a alta velocidad transfieren una energía enorme! Por eso los cinturones de seguridad son cruciales.',
                pt: 'Colisões em alta velocidade transferem energia enorme! Por isso os cintos de segurança são cruciais.',
                'zh-CN': '高速碰撞传递巨大能量！这就是安全带重要的原因。',
                'zh-TW': '高速碰撞傳遞巨大能量！這就是安全帶重要的原因。',
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
                es: 'Energía de una mosca volando',
                pt: 'Energia de uma mosca voando',
                'zh-CN': '一只飞行的苍蝇的能量',
                'zh-TW': '一隻飛行的蒼蠅的能量',
            }
        if (E < 10)
            return {
                ko: '던진 공의 에너지 정도야',
                en: 'Like a thrown ball',
                ja: '投げたボールくらい',
                es: 'Como una pelota lanzada',
                pt: 'Como uma bola arremessada',
                'zh-CN': '像抛出的球的能量',
                'zh-TW': '像拋出的球的能量',
            }
        if (E < 100)
            return {
                ko: '달리는 사람의 에너지야',
                en: "A running person's energy",
                ja: '走る人のエネルギー',
                es: 'Energía de una persona corriendo',
                pt: 'Energia de uma pessoa correndo',
                'zh-CN': '跑步的人的能量',
                'zh-TW': '跑步的人的能量',
            }
        if (E < 1000)
            return {
                ko: '자전거 타는 사람의 에너지야',
                en: "A cyclist's energy",
                ja: '自転車に乗る人のエネルギー',
                es: 'Energía de un ciclista',
                pt: 'Energia de um ciclista',
                'zh-CN': '骑自行车的人的能量',
                'zh-TW': '騎自行車的人的能量',
            }
        if (E < 5000)
            return {
                ko: '달리는 오토바이의 에너지야',
                en: "A motorcycle's energy",
                ja: 'バイクのエネルギー',
                es: 'Energía de una motocicleta',
                pt: 'Energia de uma motocicleta',
                'zh-CN': '摩托车的能量',
                'zh-TW': '摩托車的能量',
            }
        return {
            ko: '달리는 자동차의 에너지야!',
            en: "A moving car's energy!",
            ja: '走る車のエネルギー！',
            es: '¡Energía de un coche en movimiento!',
            pt: 'Energia de um carro em movimento!',
            'zh-CN': '行驶中的汽车的能量！',
            'zh-TW': '行駛中的汽車的能量！',
        }
    },
}
