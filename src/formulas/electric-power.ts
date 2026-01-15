import { Formula } from './types'
import { colors } from '../styles/colors'

export const electricPower: Formula = {
    id: 'electric-power',
    name: { ko: '전력', en: 'Electric Power', ja: '電力' },
    expression: 'P = VI',
    description: {
        ko: '전기 에너지가 소비되거나 생성되는 속도',
        en: 'The rate at which electrical energy is consumed or generated',
        ja: '電気エネルギーが消費または生成される速度',
    },
    simulationHint: {
        ko: '전압과 전류에 따라 소비되는 전력이 변하는 모습',
        en: 'Shows power consumption changing with voltage and current',
        ja: '電圧と電流に応じて消費電力が変わる様子',
    },
    applications: {
        ko: [
            '전기요금 계산 (kWh)',
            '가전제품의 소비 전력 비교',
            '태양광 패널의 발전량 측정',
            '전기차 배터리 충전 시간 계산',
        ],
        en: [
            'Calculating electricity bills (kWh)',
            'Comparing power consumption of appliances',
            'Measuring solar panel output',
            'Calculating EV battery charging time',
        ],
        ja: [
            '電気料金の計算（kWh）',
            '家電製品の消費電力比較',
            '太陽光パネルの発電量測定',
            '電気自動車バッテリーの充電時間計算',
        ],
    },
    category: 'electricity',
    variables: [
        {
            symbol: 'V',
            name: { ko: '전압', en: 'Voltage', ja: '電圧' },
            role: 'input',
            unit: 'V',
            range: [1, 240],
            default: 220,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.voltage,
            },
        },
        {
            symbol: 'I',
            name: { ko: '전류', en: 'Current', ja: '電流' },
            role: 'input',
            unit: 'A',
            range: [0.1, 20],
            default: 5,
            visual: {
                property: 'speed',
                scale: (value: number) => value,
                color: colors.current,
            },
        },
        {
            symbol: 'P',
            name: { ko: '전력', en: 'Power', ja: '電力' },
            role: 'output',
            unit: 'W',
            range: [0, 5000],
            default: 1100,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 500,
                color: colors.power,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const V = inputs.V ?? 220
        const I = inputs.I ?? 5
        return {
            P: V * I,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const V = inputs.V ?? 220
        const I = inputs.I ?? 5
        const P = V * I
        return `P = ${V.toFixed(0)} × ${I.toFixed(1)} = ${P.toFixed(0)}`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'V', to: 'I', operator: '×' },
            { from: 'I', to: 'P', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'P',
        numerator: ['V', 'I'],
    },
    discoveries: [
        {
            id: 'household-voltage',
            mission: {
                ko: '전압 V를 220V, 전류 I를 10A로 설정해봐!',
                en: 'Set voltage V to 220V and current I to 10A!',
                ja: '電圧Vを220V、電流Iを10Aに設定してみて！',
            },
            result: {
                ko: '2200W = 2.2kW! 에어컨이나 전자레인지의 소비 전력이야.',
                en: '2200W = 2.2kW! This is the power consumption of an AC or microwave.',
                ja: '2200W = 2.2kW！エアコンや電子レンジの消費電力だよ。',
            },
            icon: '🏠',
            condition: (vars) => vars['V'] >= 210 && vars['V'] <= 230 && vars['I'] >= 9 && vars['I'] <= 11,
        },
        {
            id: 'high-power',
            mission: {
                ko: '전력 P를 3000W 이상으로 만들어봐!',
                en: 'Make power P exceed 3000W!',
                ja: '電力Pを3000W以上にしてみて！',
            },
            result: {
                ko: '3kW 이상은 전용 회로가 필요해! 전기차 충전기나 인덕션 레인지 수준이야.',
                en: 'Above 3kW needs a dedicated circuit! Like EV chargers or induction stoves.',
                ja: '3kW以上は専用回路が必要！EV充電器やIHクッキングヒーターレベルだよ。',
            },
            icon: '⚡',
            condition: (vars) => vars['V'] * vars['I'] >= 3000,
        },
    ],
    getInsight: (vars) => {
        const P = vars['P']
        if (P < 10) return { ko: 'LED 전구 하나 정도야', en: 'Like one LED bulb', ja: 'LED電球1個程度' }
        if (P < 100) return { ko: '노트북 충전기 정도야', en: 'Like a laptop charger', ja: 'ノートPC充電器程度' }
        if (P < 500) return { ko: '선풍기 정도야', en: 'Like a fan', ja: '扇風機程度' }
        if (P < 1500) return { ko: '전자레인지 정도야', en: 'Like a microwave', ja: '電子レンジ程度' }
        if (P < 3000) return { ko: '에어컨 정도야', en: 'Like an air conditioner', ja: 'エアコン程度' }
        return { ko: '전기차 충전기급!', en: 'EV charger level!', ja: 'EV充電器レベル！' }
    },
}
