import { Formula } from './types'
import { colors } from '../styles/colors'

export const capacitor: Formula = {
    id: 'capacitor',
    name: {
        ko: '축전기 에너지',
        en: 'Capacitor Energy',
        ja: 'コンデンサのエネルギー',
        es: 'Energía del Capacitor',
        pt: 'Energia do Capacitor',
        'zh-CN': '电容器能量',
        'zh-TW': '電容器能量',
    },
    expression: 'E = ½CV²',
    description: {
        ko: '축전기에 저장된 전기 에너지',
        en: 'The electrical energy stored in a capacitor',
        ja: 'コンデンサに蓄えられた電気エネルギー',
        es: 'La energía eléctrica almacenada en un capacitor',
        pt: 'A energia elétrica armazenada em um capacitor',
        'zh-CN': '电容器中储存的电能',
        'zh-TW': '電容器中儲存的電能',
    },
    simulationHint: {
        ko: '축전기에 전하가 쌓이며 에너지가 저장되는 모습',
        en: 'Shows charge accumulating in a capacitor and storing energy',
        ja: 'コンデンサに電荷が蓄積しエネルギーが貯まる様子',
        es: 'Muestra la carga acumulándose en un capacitor y almacenando energía',
        pt: 'Mostra a carga se acumulando em um capacitor e armazenando energia',
        'zh-CN': '显示电荷在电容器中积累并储存能量的样子',
        'zh-TW': '顯示電荷在電容器中積累並儲存能量的樣子',
    },
    applications: {
        ko: [
            '카메라 플래시의 순간 발광',
            '전기차의 회생 제동 에너지 저장',
            '제세동기(AED)의 심장 충격',
            '무정전 전원장치(UPS) 설계',
        ],
        en: [
            'Camera flash instant discharge',
            'Regenerative braking in electric vehicles',
            'Defibrillator (AED) cardiac shock',
            'Uninterruptible power supply (UPS) design',
        ],
        ja: [
            'カメラフラッシュの瞬間発光',
            '電気自動車の回生ブレーキエネルギー貯蔵',
            'AED（自動体外式除細動器）の心臓への電気ショック',
            '無停電電源装置（UPS）の設計',
        ],
        es: [
            'Descarga instantánea del flash de cámara',
            'Frenado regenerativo en vehículos eléctricos',
            'Descarga cardíaca del desfibrilador (DEA)',
            'Diseño de fuente de alimentación ininterrumpida (UPS)',
        ],
        pt: [
            'Descarga instantânea do flash da câmera',
            'Frenagem regenerativa em veículos elétricos',
            'Choque cardíaco do desfibrilador (DEA)',
            'Projeto de fonte de alimentação ininterrupta (UPS)',
        ],
        'zh-CN': [
            '相机闪光灯的瞬间放电',
            '电动汽车的再生制动能量存储',
            '除颤器(AED)的心脏电击',
            '不间断电源(UPS)设计',
        ],
        'zh-TW': [
            '相機閃光燈的瞬間放電',
            '電動汽車的再生制動能量儲存',
            '除顫器(AED)的心臟電擊',
            '不斷電電源(UPS)設計',
        ],
    },
    category: 'electricity',
    variables: [
        {
            symbol: 'C',
            name: {
                ko: '전기용량',
                en: 'Capacitance',
                ja: '静電容量',
                es: 'Capacitancia',
                pt: 'Capacitância',
                'zh-CN': '电容',
                'zh-TW': '電容',
            },
            role: 'input',
            unit: 'mF',
            range: [1, 10],
            default: 4,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 5,
                color: colors.current,
            },
        },
        {
            symbol: 'V',
            name: {
                ko: '전압',
                en: 'Voltage',
                ja: '電圧',
                es: 'Voltaje',
                pt: 'Tensão',
                'zh-CN': '电压',
                'zh-TW': '電壓',
            },
            role: 'input',
            unit: 'kV',
            range: [1, 10],
            default: 5,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 2,
                color: colors.voltage,
            },
        },
        {
            symbol: 'E',
            name: {
                ko: '저장 에너지',
                en: 'Stored Energy',
                ja: '蓄積エネルギー',
                es: 'Energía Almacenada',
                pt: 'Energia Armazenada',
                'zh-CN': '储存能量',
                'zh-TW': '儲存能量',
            },
            role: 'output',
            unit: 'kJ',
            range: [0, 500],
            default: 50,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const C = inputs.C ?? 4 // mF
        const V = inputs.V ?? 5 // kV
        // E = 0.5 * C * V^2, with C in mF and V in kV → result in kJ
        // 0.5 * C(mF) * V(kV)² = 0.5 * C * V² kJ
        return {
            E: 0.5 * C * V * V,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const C = inputs.C ?? 4
        const V = inputs.V ?? 5
        const E = 0.5 * C * V * V
        return `E = ½ × ${C.toFixed(0)}mF × ${V.toFixed(0)}kV² = ${E.toFixed(1)} kJ`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'C', to: 'V', operator: '×' },
            { from: 'V', to: 'E', operator: '²' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'E',
        coefficient: '½',
        numerator: ['C', 'V'],
        squares: ['V'],
    },
    discoveries: [
        {
            id: 'high-voltage',
            mission: {
                ko: '전압 V를 8kV 이상으로 올려봐!',
                en: 'Raise voltage V above 8kV!',
                ja: '電圧Vを8kV以上に上げてみて！',
                es: '¡Sube el voltaje V por encima de 8kV!',
                pt: 'Aumente a tensão V acima de 8kV!',
                'zh-CN': '把电压V升到8kV以上！',
                'zh-TW': '把電壓V升到8kV以上！',
            },
            result: {
                ko: '전압이 2배면 에너지는 4배! 제세동기가 높은 전압을 쓰는 이유야.',
                en: 'Double voltage means 4x energy! This is why defibrillators use high voltage.',
                ja: '電圧が2倍ならエネルギーは4倍！除細動器が高電圧を使う理由だよ。',
                es: '¡El doble de voltaje significa 4 veces más energía! Por eso los desfibriladores usan alto voltaje.',
                pt: 'O dobro da tensão significa 4x mais energia! Por isso desfibriladores usam alta tensão.',
                'zh-CN': '电压翻倍意味着能量增加4倍！这就是除颤器使用高电压的原因。',
                'zh-TW': '電壓翻倍意味著能量增加4倍！這就是除顫器使用高電壓的原因。',
            },
            icon: '💓',
            condition: (vars) => vars['V'] >= 8,
        },
        {
            id: 'large-capacitor',
            mission: {
                ko: '전기용량 C를 8mF 이상으로 올려봐!',
                en: 'Raise capacitance C above 8mF!',
                ja: '静電容量Cを8mF以上に上げてみて！',
                es: '¡Sube la capacitancia C por encima de 8mF!',
                pt: 'Aumente a capacitância C acima de 8mF!',
                'zh-CN': '把电容C升到8mF以上！',
                'zh-TW': '把電容C升到8mF以上！',
            },
            result: {
                ko: '큰 용량은 많은 에너지 저장! 전기차 회생제동에 사용되는 원리야.',
                en: 'Large capacitance stores more energy! Used in electric vehicle regenerative braking.',
                ja: '大容量は多くのエネルギーを蓄積！電気自動車の回生ブレーキに使われる原理だよ。',
                es: '¡Gran capacitancia almacena más energía! Se usa en el frenado regenerativo de vehículos eléctricos.',
                pt: 'Grande capacitância armazena mais energia! Usado no frenagem regenerativa de veículos elétricos.',
                'zh-CN': '大电容储存更多能量！用于电动汽车的再生制动。',
                'zh-TW': '大電容儲存更多能量！用於電動汽車的再生制動。',
            },
            icon: '🚗',
            condition: (vars) => vars['C'] >= 8,
        },
    ],
    getInsight: (vars) => {
        const E = vars['E']
        if (E < 5)
            return {
                ko: 'LED 전구 잠깐 켜는 에너지야',
                en: 'Energy to flash an LED briefly',
                ja: 'LED電球を一瞬点けるエネルギー',
                es: 'Energía para encender un LED brevemente',
                pt: 'Energia para acender um LED brevemente',
                'zh-CN': '让LED短暂闪烁的能量',
                'zh-TW': '讓LED短暫閃爍的能量',
            }
        if (E < 20)
            return {
                ko: '카메라 플래시 정도야',
                en: 'Like a camera flash',
                ja: 'カメラフラッシュ程度',
                es: 'Como un flash de cámara',
                pt: 'Como um flash de câmera',
                'zh-CN': '像相机闪光灯一样',
                'zh-TW': '像相機閃光燈一樣',
            }
        if (E < 100)
            return {
                ko: '제세동기 충격 정도야',
                en: 'Like a defibrillator shock',
                ja: '除細動器のショック程度',
                es: 'Como una descarga de desfibrilador',
                pt: 'Como um choque de desfibrilador',
                'zh-CN': '像除颤器电击一样',
                'zh-TW': '像除顫器電擊一樣',
            }
        if (E < 300)
            return {
                ko: '전기차 회생제동 에너지야',
                en: 'EV regenerative braking energy',
                ja: '電気自動車の回生ブレーキエネルギー',
                es: 'Energía de frenado regenerativo de VE',
                pt: 'Energia de frenagem regenerativa de VE',
                'zh-CN': '电动汽车再生制动能量',
                'zh-TW': '電動汽車再生制動能量',
            }
        return {
            ko: '산업용 축전기급 에너지!',
            en: 'Industrial capacitor energy!',
            ja: '産業用コンデンサ級エネルギー！',
            es: '¡Energía de capacitor industrial!',
            pt: 'Energia de capacitor industrial!',
            'zh-CN': '工业电容器级能量！',
            'zh-TW': '工業電容器級能量！',
        }
    },
}
