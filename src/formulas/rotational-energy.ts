import { Formula } from './types'
import { colors } from '../styles/colors'

export const rotationalEnergy: Formula = {
    id: 'rotational-energy',
    name: {
        ko: '회전 운동 에너지',
        en: 'Rotational Kinetic Energy',
        ja: '回転運動エネルギー',
        es: 'Energía Cinética Rotacional',
        pt: 'Energia Cinética Rotacional',
        'zh-CN': '转动动能',
        'zh-TW': '轉動動能',
    },
    expression: 'E = ½Iω²',
    description: {
        ko: '회전하는 물체가 가진 에너지',
        en: 'The energy possessed by a rotating object',
        ja: '回転する物体が持つエネルギー',
        es: 'La energía que posee un objeto en rotación',
        pt: 'A energia possuída por um objeto em rotação',
        'zh-CN': '旋转物体所具有的能量',
        'zh-TW': '旋轉物體所具有的能量',
    },
    simulationHint: {
        ko: '각속도를 높이면 에너지가 급격히 증가하는 것을 보세요',
        en: 'Watch how energy increases rapidly with angular velocity',
        ja: '角速度を上げるとエネルギーが急激に増加する様子を見よう',
        es: 'Observa cómo la energía aumenta rápidamente con la velocidad angular',
        pt: 'Observe como a energia aumenta rapidamente com a velocidade angular',
        'zh-CN': '观察能量如何随角速度快速增加',
        'zh-TW': '觀察能量如何隨角速度快速增加',
    },
    applications: {
        ko: [
            '플라이휠 - 에너지 저장 장치',
            '자이로스코프 - 균형 유지 시스템',
            '자동차 바퀴 - 관성으로 굴러감',
            'F1 KERS - 제동 에너지를 회전으로 저장',
        ],
        en: [
            'Flywheel - energy storage device',
            'Gyroscope - balance maintaining system',
            'Car wheels - rolling with inertia',
            'F1 KERS - storing braking energy as rotation',
        ],
        ja: [
            'フライホイール - エネルギー貯蔵装置',
            'ジャイロスコープ - バランス維持システム',
            '自動車の車輪 - 慣性で転がる',
            'F1のKERS - ブレーキエネルギーを回転として貯蔵',
        ],
        es: [
            'Volante de inercia - dispositivo de almacenamiento de energía',
            'Giroscopio - sistema de mantenimiento de equilibrio',
            'Ruedas de coche - rodando con inercia',
            'F1 KERS - almacenando energía de frenado como rotación',
        ],
        pt: [
            'Volante de inércia - dispositivo de armazenamento de energia',
            'Giroscópio - sistema de manutenção de equilíbrio',
            'Rodas de carro - rolando com inércia',
            'F1 KERS - armazenando energia de frenagem como rotação',
        ],
        'zh-CN': [
            '飞轮 - 能量存储装置',
            '陀螺仪 - 平衡维持系统',
            '汽车车轮 - 靠惯性滚动',
            'F1 KERS - 将制动能量以旋转形式存储',
        ],
        'zh-TW': [
            '飛輪 - 能量存儲裝置',
            '陀螺儀 - 平衡維持系統',
            '汽車車輪 - 靠慣性滾動',
            'F1 KERS - 將制動能量以旋轉形式存儲',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'I',
            name: {
                ko: '관성 모멘트',
                en: 'Moment of inertia',
                ja: '慣性モーメント',
                es: 'Momento de inercia',
                pt: 'Momento de inércia',
                'zh-CN': '转动惯量',
                'zh-TW': '轉動慣量',
            },
            role: 'input',
            unit: 'kg·m²',
            range: [0.1, 10],
            default: 2,
            visual: {
                property: 'size',
                scale: (v) => v * 10,
                color: colors.mass,
            },
        },
        {
            symbol: 'ω',
            name: {
                ko: '각속도',
                en: 'Angular velocity',
                ja: '角速度',
                es: 'Velocidad angular',
                pt: 'Velocidade angular',
                'zh-CN': '角速度',
                'zh-TW': '角速度',
            },
            role: 'input',
            unit: 'rad/s',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'speed',
                scale: (v) => v,
                color: colors.velocity,
            },
        },
        {
            symbol: 'E',
            name: {
                ko: '회전 에너지',
                en: 'Rotational energy',
                ja: '回転エネルギー',
                es: 'Energía rotacional',
                pt: 'Energia rotacional',
                'zh-CN': '转动能量',
                'zh-TW': '轉動能量',
            },
            role: 'output',
            unit: 'J',
            range: [0, 5000],
            default: 100,
            visual: {
                property: 'glow',
                scale: (v) => v / 100,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs) => {
        const I = inputs['I'] || 2
        const omega = inputs['ω'] || 10
        const E = 0.5 * I * omega * omega
        return { E: Math.round(E * 10) / 10 }
    },
    formatCalculation: (inputs) => {
        const I = inputs['I'] || 2
        const omega = inputs['ω'] || 10
        const E = 0.5 * I * omega * omega
        return `E = ½ × ${I} × ${omega}² = ${E.toFixed(1)} J`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'I', to: 'E', operator: '×' },
            { from: 'ω', to: 'E', operator: '²' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'E',
        coefficient: '½',
        numerator: ['I', 'ω'],
        squares: ['ω'],
    },
    discoveries: [
        {
            id: 'fast-spin',
            mission: {
                ko: 'ω를 최대로 올려서 엄청난 에너지를 만들어봐',
                en: 'Maximize ω to create huge energy',
                ja: 'ωを最大にして巨大なエネルギーを作ってみて',
                es: 'Maximiza ω para crear energía enorme',
                pt: 'Maximize ω para criar energia enorme',
                'zh-CN': '将ω最大化来创造巨大能量',
                'zh-TW': '將ω最大化來創造巨大能量',
            },
            result: {
                ko: '속도의 제곱! 2배 빨라지면 4배 에너지!',
                en: 'Squared speed! 2x faster = 4x energy!',
                ja: '速度の二乗！2倍速いと4倍のエネルギー！',
                es: '¡Velocidad al cuadrado! ¡2x más rápido = 4x energía!',
                pt: 'Velocidade ao quadrado! 2x mais rápido = 4x energia!',
                'zh-CN': '速度的平方！快2倍=能量4倍！',
                'zh-TW': '速度的平方！快2倍=能量4倍！',
            },
            icon: '🌀',
            condition: (vars) => {
                const omega = vars['ω'] || 10
                const E = vars['E'] || 100
                return omega >= 45 && E >= 1000
            },
        },
        {
            id: 'heavy-flywheel',
            mission: {
                ko: 'I를 최대로 올려봐',
                en: 'Maximize moment of inertia I',
                ja: '慣性モーメントIを最大にしてみて',
                es: 'Maximiza el momento de inercia I',
                pt: 'Maximize o momento de inércia I',
                'zh-CN': '将转动惯量I最大化',
                'zh-TW': '將轉動慣量I最大化',
            },
            result: {
                ko: '무거운 플라이휠이 더 많은 에너지를 저장해!',
                en: 'Heavier flywheel stores more energy!',
                ja: '重いフライホイールはより多くのエネルギーを蓄える！',
                es: '¡Un volante más pesado almacena más energía!',
                pt: 'Um volante mais pesado armazena mais energia!',
                'zh-CN': '更重的飞轮储存更多能量！',
                'zh-TW': '更重的飛輪儲存更多能量！',
            },
            icon: '⚙️',
            condition: (vars) => {
                const I = vars['I'] || 2
                return I >= 9
            },
        },
        {
            id: 'energy-storage',
            mission: {
                ko: 'E를 2000J 이상으로 만들어봐',
                en: 'Create E above 2000J',
                ja: 'Eを2000J以上にしてみて',
                es: 'Crea E por encima de 2000J',
                pt: 'Crie E acima de 2000J',
                'zh-CN': '让E超过2000J',
                'zh-TW': '讓E超過2000J',
            },
            result: {
                ko: '플라이휠 배터리는 이 원리로 에너지를 저장해!',
                en: 'Flywheel batteries use this to store energy!',
                ja: 'フライホイールバッテリーはこの原理でエネルギーを蓄える！',
                es: '¡Las baterías de volante usan esto para almacenar energía!',
                pt: 'Baterias de volante usam isso para armazenar energia!',
                'zh-CN': '飞轮电池用这个原理储存能量！',
                'zh-TW': '飛輪電池用這個原理儲存能量！',
            },
            icon: '🔋',
            condition: (vars) => {
                const E = vars['E'] || 100
                return E >= 2000
            },
        },
    ],
    getInsight: (variables) => {
        const E = variables['E'] || 100
        const omega = variables['ω'] || 10

        const rpm = (omega * 60) / (2 * Math.PI)
        if (E > 500) {
            return {
                ko: `${E.toFixed(0)}J은 ${(E / 4.184).toFixed(0)}cal, 약 ${(E / 4184).toFixed(2)}kcal의 열량이에요!`,
                en: `${E.toFixed(0)}J equals ${(E / 4.184).toFixed(0)}cal, about ${(E / 4184).toFixed(2)}kcal!`,
                ja: `${E.toFixed(0)}Jは${(E / 4.184).toFixed(0)}cal、約${(E / 4184).toFixed(2)}kcalの熱量だよ！`,
                es: `¡${E.toFixed(0)}J equivale a ${(E / 4.184).toFixed(0)}cal, aproximadamente ${(E / 4184).toFixed(2)}kcal!`,
                pt: `${E.toFixed(0)}J equivale a ${(E / 4.184).toFixed(0)}cal, aproximadamente ${(E / 4184).toFixed(2)}kcal!`,
                'zh-CN': `${E.toFixed(0)}J等于${(E / 4.184).toFixed(0)}卡，约${(E / 4184).toFixed(2)}千卡！`,
                'zh-TW': `${E.toFixed(0)}J等於${(E / 4.184).toFixed(0)}卡，約${(E / 4184).toFixed(2)}千卡！`,
            }
        }
        return {
            ko: `${rpm.toFixed(0)} RPM으로 회전 중! 자동차 엔진은 보통 1000-7000 RPM이에요.`,
            en: `Spinning at ${rpm.toFixed(0)} RPM! Car engines typically run at 1000-7000 RPM.`,
            ja: `${rpm.toFixed(0)} RPMで回転中！車のエンジンは通常1000-7000 RPMだよ。`,
            es: `¡Girando a ${rpm.toFixed(0)} RPM! Los motores de autos típicamente funcionan a 1000-7000 RPM.`,
            pt: `Girando a ${rpm.toFixed(0)} RPM! Motores de carros tipicamente funcionam a 1000-7000 RPM.`,
            'zh-CN': `以${rpm.toFixed(0)} RPM旋转中！汽车发动机通常在1000-7000 RPM运转。`,
            'zh-TW': `以${rpm.toFixed(0)} RPM旋轉中！汽車發動機通常在1000-7000 RPM運轉。`,
        }
    },
}
