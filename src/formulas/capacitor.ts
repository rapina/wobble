import { Formula } from './types'
import { colors } from '../styles/colors'

export const capacitor: Formula = {
    id: 'capacitor',
    name: { ko: '축전기 에너지', en: 'Capacitor Energy', ja: 'コンデンサのエネルギー' },
    expression: 'E = ½CV²',
    description: {
        ko: '축전기에 저장된 전기 에너지',
        en: 'The electrical energy stored in a capacitor',
        ja: 'コンデンサに蓄えられた電気エネルギー',
    },
    simulationHint: {
        ko: '축전기에 전하가 쌓이며 에너지가 저장되는 모습',
        en: 'Shows charge accumulating in a capacitor and storing energy',
        ja: 'コンデンサに電荷が蓄積しエネルギーが貯まる様子',
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
    },
    category: 'electricity',
    variables: [
        {
            symbol: 'C',
            name: { ko: '전기용량', en: 'Capacitance', ja: '静電容量' },
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
            name: { ko: '전압', en: 'Voltage', ja: '電圧' },
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
            name: { ko: '저장 에너지', en: 'Stored Energy', ja: '蓄積エネルギー' },
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
            },
            result: {
                ko: '전압이 2배면 에너지는 4배! 제세동기가 높은 전압을 쓰는 이유야.',
                en: 'Double voltage means 4x energy! This is why defibrillators use high voltage.',
                ja: '電圧が2倍ならエネルギーは4倍！除細動器が高電圧を使う理由だよ。',
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
            },
            result: {
                ko: '큰 용량은 많은 에너지 저장! 전기차 회생제동에 사용되는 원리야.',
                en: 'Large capacitance stores more energy! Used in electric vehicle regenerative braking.',
                ja: '大容量は多くのエネルギーを蓄積！電気自動車の回生ブレーキに使われる原理だよ。',
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
            }
        if (E < 20)
            return {
                ko: '카메라 플래시 정도야',
                en: 'Like a camera flash',
                ja: 'カメラフラッシュ程度',
            }
        if (E < 100)
            return {
                ko: '제세동기 충격 정도야',
                en: 'Like a defibrillator shock',
                ja: '除細動器のショック程度',
            }
        if (E < 300)
            return {
                ko: '전기차 회생제동 에너지야',
                en: 'EV regenerative braking energy',
                ja: '電気自動車の回生ブレーキエネルギー',
            }
        return {
            ko: '산업용 축전기급 에너지!',
            en: 'Industrial capacitor energy!',
            ja: '産業用コンデンサ級エネルギー！',
        }
    },
}
