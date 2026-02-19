import { Formula } from './types'
import { colors } from '../styles/colors'

export const electricPower: Formula = {
    id: 'electric-power',
    name: {
        ko: '전력',
        en: 'Electric Power',
        ja: '電力',
        es: 'Potencia Eléctrica',
        pt: 'Potência Elétrica',
        'zh-CN': '电功率',
        'zh-TW': '電功率',
    },
    expression: 'P = VI',
    description: {
        ko: '전기 에너지가 소비되거나 생성되는 속도',
        en: 'The rate at which electrical energy is consumed or generated',
        ja: '電気エネルギーが消費または生成される速度',
        es: 'La tasa a la que se consume o genera energía eléctrica',
        pt: 'A taxa na qual a energia elétrica é consumida ou gerada',
        'zh-CN': '电能消耗或产生的速率',
        'zh-TW': '電能消耗或產生的速率',
    },
    simulationHint: {
        ko: '전압과 전류에 따라 소비되는 전력이 변하는 모습',
        en: 'Shows power consumption changing with voltage and current',
        ja: '電圧と電流に応じて消費電力が変わる様子',
        es: 'Muestra el consumo de energía cambiando con el voltaje y la corriente',
        pt: 'Mostra o consumo de energia mudando com a tensão e a corrente',
        'zh-CN': '显示功率消耗随电压和电流变化的样子',
        'zh-TW': '顯示功率消耗隨電壓和電流變化的樣子',
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
        es: [
            'Cálculo de facturas de electricidad (kWh)',
            'Comparación del consumo de energía de electrodomésticos',
            'Medición de la producción de paneles solares',
            'Cálculo del tiempo de carga de baterías de VE',
        ],
        pt: [
            'Cálculo de contas de eletricidade (kWh)',
            'Comparação do consumo de energia de eletrodomésticos',
            'Medição da produção de painéis solares',
            'Cálculo do tempo de carregamento de baterias de VE',
        ],
        'zh-CN': [
            '计算电费（千瓦时）',
            '比较家电的功率消耗',
            '测量太阳能板的发电量',
            '计算电动汽车电池充电时间',
        ],
        'zh-TW': [
            '計算電費（千瓦時）',
            '比較家電的功率消耗',
            '測量太陽能板的發電量',
            '計算電動汽車電池充電時間',
        ],
    },
    category: 'electricity',
    variables: [
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
            name: {
                ko: '전류',
                en: 'Current',
                ja: '電流',
                es: 'Corriente',
                pt: 'Corrente',
                'zh-CN': '电流',
                'zh-TW': '電流',
            },
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
            name: {
                ko: '전력',
                en: 'Power',
                ja: '電力',
                es: 'Potencia',
                pt: 'Potência',
                'zh-CN': '功率',
                'zh-TW': '功率',
            },
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
                es: '¡Configura el voltaje V a 220V y la corriente I a 10A!',
                pt: 'Configure a tensão V para 220V e a corrente I para 10A!',
                'zh-CN': '将电压V设为220V，电流I设为10A！',
                'zh-TW': '將電壓V設為220V，電流I設為10A！',
            },
            result: {
                ko: '2200W = 2.2kW! 에어컨이나 전자레인지의 소비 전력이야.',
                en: '2200W = 2.2kW! This is the power consumption of an AC or microwave.',
                ja: '2200W = 2.2kW！エアコンや電子レンジの消費電力だよ。',
                es: '¡2200W = 2.2kW! Este es el consumo de un AC o microondas.',
                pt: '2200W = 2.2kW! Este é o consumo de um AC ou micro-ondas.',
                'zh-CN': '2200W = 2.2kW！这是空调或微波炉的功率消耗。',
                'zh-TW': '2200W = 2.2kW！這是冷氣或微波爐的功率消耗。',
            },
            icon: '🏠',
            condition: (vars) =>
                vars['V'] >= 210 && vars['V'] <= 230 && vars['I'] >= 9 && vars['I'] <= 11,
        },
        {
            id: 'high-power',
            mission: {
                ko: '전력 P를 3000W 이상으로 만들어봐!',
                en: 'Make power P exceed 3000W!',
                ja: '電力Pを3000W以上にしてみて！',
                es: '¡Haz que la potencia P supere los 3000W!',
                pt: 'Faça a potência P exceder 3000W!',
                'zh-CN': '让功率P超过3000W！',
                'zh-TW': '讓功率P超過3000W！',
            },
            result: {
                ko: '3kW 이상은 전용 회로가 필요해! 전기차 충전기나 인덕션 레인지 수준이야.',
                en: 'Above 3kW needs a dedicated circuit! Like EV chargers or induction stoves.',
                ja: '3kW以上は専用回路が必要！EV充電器やIHクッキングヒーターレベルだよ。',
                es: '¡Más de 3kW necesita un circuito dedicado! Como cargadores de VE o cocinas de inducción.',
                pt: 'Acima de 3kW precisa de um circuito dedicado! Como carregadores de VE ou fogões de indução.',
                'zh-CN': '3kW以上需要专用电路！像电动汽车充电器或电磁炉一样。',
                'zh-TW': '3kW以上需要專用電路！像電動汽車充電器或電磁爐一樣。',
            },
            icon: '⚡',
            condition: (vars) => vars['V'] * vars['I'] >= 3000,
        },
    ],
    getInsight: (vars) => {
        const P = vars['P']
        if (P < 10)
            return {
                ko: 'LED 전구 하나 정도야',
                en: 'Like one LED bulb',
                ja: 'LED電球1個程度',
                es: 'Como una bombilla LED',
                pt: 'Como uma lâmpada LED',
                'zh-CN': '像一个LED灯泡',
                'zh-TW': '像一個LED燈泡',
            }
        if (P < 100)
            return {
                ko: '노트북 충전기 정도야',
                en: 'Like a laptop charger',
                ja: 'ノートPC充電器程度',
                es: 'Como un cargador de laptop',
                pt: 'Como um carregador de laptop',
                'zh-CN': '像笔记本电脑充电器',
                'zh-TW': '像筆記型電腦充電器',
            }
        if (P < 500)
            return {
                ko: '선풍기 정도야',
                en: 'Like a fan',
                ja: '扇風機程度',
                es: 'Como un ventilador',
                pt: 'Como um ventilador',
                'zh-CN': '像电风扇',
                'zh-TW': '像電風扇',
            }
        if (P < 1500)
            return {
                ko: '전자레인지 정도야',
                en: 'Like a microwave',
                ja: '電子レンジ程度',
                es: 'Como un microondas',
                pt: 'Como um micro-ondas',
                'zh-CN': '像微波炉',
                'zh-TW': '像微波爐',
            }
        if (P < 3000)
            return {
                ko: '에어컨 정도야',
                en: 'Like an air conditioner',
                ja: 'エアコン程度',
                es: 'Como un aire acondicionado',
                pt: 'Como um ar condicionado',
                'zh-CN': '像空调',
                'zh-TW': '像冷氣',
            }
        return {
            ko: '전기차 충전기급!',
            en: 'EV charger level!',
            ja: 'EV充電器レベル！',
            es: '¡Nivel cargador de VE!',
            pt: 'Nível carregador de VE!',
            'zh-CN': '电动汽车充电器级别！',
            'zh-TW': '電動汽車充電器級別！',
        }
    },
}
