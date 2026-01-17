import { Formula } from './types'
import { colors } from '../styles/colors'

export const electricDischarge: Formula = {
    id: 'electric-discharge',
    name: { ko: '전기 방전', en: 'Electric Discharge', ja: '電気放電' },
    expression: 'E = V/d',
    description: {
        ko: '전압이 높고 거리가 가까우면 공기를 뚫고 전기가 흐른다',
        en: 'When voltage is high and distance is short, electricity can arc through air',
        ja: '電圧が高く距離が近いと、空気を通じて電気が流れる',
    },
    simulationHint: {
        ko: '전압과 간격에 따라 전기장 강도가 변하는 모습',
        en: 'Shows electric field strength changing with voltage and gap distance',
        ja: '電圧とギャップに応じて電界強度が変わる様子',
    },
    applications: {
        ko: [
            '번개 - 구름과 땅 사이의 방전',
            '테슬라 코일의 스파크',
            '스파크 플러그의 점화',
            '형광등의 작동 원리',
        ],
        en: [
            'Lightning - discharge between clouds and ground',
            'Tesla coil sparks',
            'Spark plug ignition',
            'Fluorescent light operation',
        ],
        ja: [
            '雷 - 雲と地面の間の放電',
            'テスラコイルのスパーク',
            'スパークプラグの点火',
            '蛍光灯の動作原理',
        ],
    },
    category: 'electricity',
    variables: [
        {
            symbol: 'V',
            name: { ko: '전압', en: 'Voltage', ja: '電圧' },
            role: 'input',
            unit: 'kV',
            range: [1, 100],
            default: 30,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 20,
                color: colors.voltage,
            },
        },
        {
            symbol: 'd',
            name: { ko: '간격', en: 'Gap', ja: 'ギャップ' },
            role: 'input',
            unit: 'mm',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => value / 10,
                color: '#888888',
            },
        },
        {
            symbol: 'E',
            name: { ko: '전기장', en: 'Electric Field', ja: '電界' },
            role: 'output',
            unit: 'kV/mm',
            range: [0, 100],
            default: 3,
            visual: {
                property: 'glow',
                scale: (value: number) => value,
                color: '#00FFFF',
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const V = inputs.V ?? 30
        const d = inputs.d ?? 10
        return {
            E: V / d,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const V = inputs.V ?? 30
        const d = inputs.d ?? 10
        const E = V / d
        return `E = ${V.toFixed(0)} ÷ ${d.toFixed(0)} = ${E.toFixed(1)}`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'V', to: 'd', operator: '÷' },
            { from: 'd', to: 'E', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'E',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'V' }],
                denominator: [{ type: 'var', symbol: 'd' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'air-breakdown',
            mission: {
                ko: '전기장 E를 3 kV/mm 이상으로 만들어봐!',
                en: 'Make electric field E exceed 3 kV/mm!',
                ja: '電界Eを3 kV/mm以上にしてみて！',
            },
            result: {
                ko: '3 kV/mm은 공기의 절연 파괴 강도야! 이 이상이면 스파크가 발생해.',
                en: '3 kV/mm is air breakdown strength! Sparks occur above this.',
                ja: '3 kV/mmは空気の絶縁破壊強度！これ以上でスパークが発生するよ。',
            },
            icon: '⚡',
            condition: (vars) => vars['V'] / vars['d'] >= 3,
        },
        {
            id: 'lightning-scale',
            mission: {
                ko: '전압 V를 100kV로 설정해봐!',
                en: 'Set voltage V to 100kV!',
                ja: '電圧Vを100kVに設定してみて！',
            },
            result: {
                ko: '번개는 수억 볼트에 달해! 구름에서 땅까지 수 km를 뚫고 내려와.',
                en: 'Lightning reaches hundreds of millions volts! It breaks through kilometers from cloud to ground.',
                ja: '雷は数億ボルトに達する！雲から地面まで数kmを突き抜ける。',
            },
            icon: '🌩️',
            condition: (vars) => vars['V'] >= 100,
        },
        {
            id: 'spark-plug',
            mission: {
                ko: '간격 d를 1mm, 전압 V를 10kV로 설정해봐!',
                en: 'Set gap d to 1mm and voltage V to 10kV!',
                ja: 'ギャップdを1mm、電圧Vを10kVに設定してみて！',
            },
            result: {
                ko: '자동차 스파크 플러그 조건이야! 연료를 점화시키는 불꽃이 여기서 나와.',
                en: "This is spark plug conditions! The spark that ignites fuel comes from here.",
                ja: '自動車のスパークプラグの条件だよ！燃料を点火する火花がここから出る。',
            },
            icon: '🚗',
            condition: (vars) => vars['d'] <= 2 && vars['V'] >= 8 && vars['V'] <= 15,
        },
    ],
    getInsight: (vars) => {
        const E = vars['V'] / vars['d']
        if (E < 1)
            return {
                ko: '안전한 수준이야',
                en: 'Safe level',
                ja: '安全なレベル',
            }
        if (E < 3)
            return {
                ko: '아직 방전 안 돼',
                en: 'No discharge yet',
                ja: 'まだ放電しない',
            }
        if (E < 5)
            return {
                ko: '스파크 발생!',
                en: 'Spark occurs!',
                ja: 'スパーク発生！',
            }
        if (E < 10)
            return {
                ko: '강한 아크 방전!',
                en: 'Strong arc discharge!',
                ja: '強いアーク放電！',
            }
        return {
            ko: '플라즈마 형성!',
            en: 'Plasma formation!',
            ja: 'プラズマ形成！',
        }
    },
}
