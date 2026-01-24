import { Formula } from './types'
import { colors } from '../styles/colors'

export const idealGas: Formula = {
    id: 'ideal-gas',
    name: {
        ko: '이상 기체',
        en: 'Ideal Gas Law',
        ja: '理想気体の法則',
        es: 'Ley del Gas Ideal',
        pt: 'Lei dos Gases Ideais',
        'zh-CN': '理想气体定律',
        'zh-TW': '理想氣體定律',
    },
    expression: 'PV = nRT',
    description: {
        ko: '기체의 압력, 부피, 온도 사이의 관계',
        en: 'The relationship between gas pressure, volume, and temperature',
        ja: '気体の圧力、体積、温度の関係',
        es: 'La relación entre la presión, el volumen y la temperatura del gas',
        pt: 'A relação entre pressão, volume e temperatura do gás',
        'zh-CN': '气体压强、体积和温度之间的关系',
        'zh-TW': '氣體壓力、體積和溫度之間的關係',
    },
    simulationHint: {
        ko: '용기 안 기체 입자들이 압력, 부피, 온도에 따라 움직이는 모습',
        en: 'Shows gas particles moving based on pressure, volume, and temperature',
        ja: '容器内の気体粒子が圧力、体積、温度に応じて動く様子',
        es: 'Muestra partículas de gas moviéndose según la presión, volumen y temperatura',
        pt: 'Mostra partículas de gás se movendo com base na pressão, volume e temperatura',
        'zh-CN': '显示容器内气体粒子根据压强、体积和温度运动的样子',
        'zh-TW': '顯示容器內氣體粒子根據壓力、體積和溫度運動的樣子',
    },
    applications: {
        ko: [
            '자동차 타이어 공기압 변화 예측',
            '에어컨과 냉장고의 냉매 설계',
            '풍선이 고도에 따라 팽창하는 원리',
            '잠수부의 감압병 예방',
        ],
        en: [
            'Predicting car tire pressure changes',
            'Designing refrigerant for AC and refrigerators',
            'Why balloons expand at higher altitudes',
            'Preventing decompression sickness in divers',
        ],
        ja: [
            '自動車タイヤの空気圧変化予測',
            'エアコンや冷蔵庫の冷媒設計',
            '風船が高度で膨らむ原理',
            'ダイバーの減圧症予防',
        ],
        es: [
            'Predicción de cambios de presión en neumáticos',
            'Diseño de refrigerantes para AC y refrigeradores',
            'Por qué los globos se expanden a mayor altitud',
            'Prevención de enfermedad de descompresión en buzos',
        ],
        pt: [
            'Previsão de mudanças de pressão nos pneus',
            'Projeto de refrigerantes para AC e geladeiras',
            'Por que balões expandem em altitudes maiores',
            'Prevenção de doença de descompressão em mergulhadores',
        ],
        'zh-CN': [
            '预测汽车轮胎气压变化',
            '设计空调和冰箱的制冷剂',
            '气球在高空膨胀的原理',
            '预防潜水员减压病',
        ],
        'zh-TW': [
            '預測汽車輪胎氣壓變化',
            '設計空調和冰箱的製冷劑',
            '氣球在高空膨脹的原理',
            '預防潛水員減壓病',
        ],
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'n',
            name: {
                ko: '몰수',
                en: 'Moles',
                ja: 'モル数',
                es: 'Moles',
                pt: 'Mols',
                'zh-CN': '摩尔数',
                'zh-TW': '莫耳數',
            },
            role: 'input',
            unit: 'mol',
            range: [1, 20],
            default: 2,
            visual: {
                property: 'size',
                scale: (value: number) => value * 8,
                color: colors.mass,
            },
        },
        {
            symbol: 'T',
            name: {
                ko: '온도',
                en: 'Temperature',
                ja: '温度',
                es: 'Temperatura',
                pt: 'Temperatura',
                'zh-CN': '温度',
                'zh-TW': '溫度',
            },
            role: 'input',
            unit: 'K',
            range: [200, 500],
            default: 300,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.temperature,
            },
        },
        {
            symbol: 'V',
            name: {
                ko: '부피',
                en: 'Volume',
                ja: '体積',
                es: 'Volumen',
                pt: 'Volume',
                'zh-CN': '体积',
                'zh-TW': '體積',
            },
            role: 'input',
            unit: 'L',
            range: [10, 100],
            default: 50,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 0.5,
                color: colors.volume,
            },
        },
        {
            symbol: 'P',
            name: {
                ko: '압력',
                en: 'Pressure',
                ja: '圧力',
                es: 'Presión',
                pt: 'Pressão',
                'zh-CN': '压强',
                'zh-TW': '壓力',
            },
            role: 'output',
            unit: 'kPa',
            range: [0, 500],
            default: 99.7,
            visual: {
                property: 'shake',
                scale: (value: number) => value / 100,
                color: colors.pressure,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const n = inputs.n ?? 2
        const T = inputs.T ?? 300
        const V = inputs.V ?? 50
        const R = 8.314 // J/(mol·K)
        // P = nRT/V, convert to kPa (divide by 1000) and L to m³ (divide by 1000)
        // So P(kPa) = nRT / V where V is in L
        return {
            P: (n * R * T) / V,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const n = inputs.n ?? 2
        const T = inputs.T ?? 300
        const V = inputs.V ?? 50
        const R = 8.314
        const P = (n * R * T) / V
        return `P = ${n.toFixed(1)} × R × ${T.toFixed(0)} ÷ ${V.toFixed(0)} = ${P.toFixed(1)}`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'n', to: 'T', operator: '×' },
            { from: 'T', to: 'V', operator: '÷' },
            { from: 'V', to: 'P', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'P',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'n' },
                    { type: 'text', value: 'R' },
                    { type: 'var', symbol: 'T' },
                ],
                denominator: [{ type: 'var', symbol: 'V' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'high-pressure',
            mission: {
                ko: '온도 T를 최대(500K)로 올리고 부피 V를 최소(10L)로 줄여봐!',
                en: 'Maximize temperature T to 500K and minimize volume V to 10L!',
                ja: '温度Tを最大(500K)にして体積Vを最小(10L)にしてみよう！',
                es: '¡Maximiza la temperatura T a 500K y minimiza el volumen V a 10L!',
                pt: 'Maximize a temperatura T para 500K e minimize o volume V para 10L!',
                'zh-CN': '把温度T升到最大（500K），体积V减到最小（10L）！',
                'zh-TW': '把溫度T升到最大（500K），體積V減到最小（10L）！',
            },
            result: {
                ko: '뜨겁고 좁으면 압력이 급증해! 압력밥솥이 빨리 요리하는 이유야.',
                en: 'Hot and compressed means high pressure! This is how pressure cookers work.',
                ja: '熱くて狭いと圧力が急上昇！圧力鍋が早く調理できる理由だ。',
                es: '¡Caliente y comprimido significa alta presión! Así funcionan las ollas a presión.',
                pt: 'Quente e comprimido significa alta pressão! É assim que as panelas de pressão funcionam.',
                'zh-CN': '又热又小意味着高压！这就是高压锅能快速烹饪的原因。',
                'zh-TW': '又熱又小意味著高壓！這就是壓力鍋能快速烹飪的原因。',
            },
            icon: '🍲',
            condition: (vars) => vars['T'] >= 480 && vars['V'] <= 15,
        },
        {
            id: 'low-temperature',
            mission: {
                ko: '온도 T를 220K 이하로 낮춰봐!',
                en: 'Lower temperature T below 220K!',
                ja: '温度Tを220K以下にしてみよう！',
                es: '¡Baja la temperatura T por debajo de 220K!',
                pt: 'Reduza a temperatura T abaixo de 220K!',
                'zh-CN': '把温度T降到220K以下！',
                'zh-TW': '把溫度T降到220K以下！',
            },
            result: {
                ko: '기체가 차가워지면 압력이 낮아져! 추운 날 타이어 공기압이 떨어지는 이유야.',
                en: 'Cold gas has lower pressure! This is why tire pressure drops on cold days.',
                ja: '気体が冷えると圧力が下がる！寒い日にタイヤの空気圧が下がる理由だ。',
                es: '¡El gas frío tiene menor presión! Por eso la presión de los neumáticos baja en días fríos.',
                pt: 'Gás frio tem menor pressão! Por isso a pressão dos pneus cai em dias frios.',
                'zh-CN': '气体变冷压强就降低！这就是寒冷天气轮胎气压下降的原因。',
                'zh-TW': '氣體變冷壓力就降低！這就是寒冷天氣輪胎氣壓下降的原因。',
            },
            icon: '❄️',
            condition: (vars) => vars['T'] <= 220,
        },
    ],
    getInsight: (vars) => {
        const P = vars['P']
        if (P < 50)
            return {
                ko: '진공에 가까운 저압이야',
                en: 'Near-vacuum low pressure',
                ja: '真空に近い低圧',
                es: 'Presión baja cercana al vacío',
                pt: 'Pressão baixa quase vácuo',
                'zh-CN': '接近真空的低压',
                'zh-TW': '接近真空的低壓',
            }
        if (P < 100)
            return {
                ko: '대기압보다 낮아',
                en: 'Below atmospheric pressure',
                ja: '大気圧より低い',
                es: 'Por debajo de la presión atmosférica',
                pt: 'Abaixo da pressão atmosférica',
                'zh-CN': '低于大气压',
                'zh-TW': '低於大氣壓',
            }
        if (P < 150)
            return {
                ko: '대기압 근처야',
                en: 'Near atmospheric pressure',
                ja: '大気圧くらい',
                es: 'Cerca de la presión atmosférica',
                pt: 'Perto da pressão atmosférica',
                'zh-CN': '接近大气压',
                'zh-TW': '接近大氣壓',
            }
        if (P < 250)
            return {
                ko: '자전거 타이어 압력 정도야',
                en: 'Like a bike tire pressure',
                ja: '自転車タイヤの圧力くらい',
                es: 'Como la presión de un neumático de bicicleta',
                pt: 'Como a pressão de um pneu de bicicleta',
                'zh-CN': '自行车轮胎气压',
                'zh-TW': '自行車輪胎氣壓',
            }
        if (P < 400)
            return {
                ko: '자동차 타이어 압력이야',
                en: 'Like a car tire pressure',
                ja: '車のタイヤの圧力くらい',
                es: 'Como la presión de un neumático de auto',
                pt: 'Como a pressão de um pneu de carro',
                'zh-CN': '汽车轮胎气压',
                'zh-TW': '汽車輪胎氣壓',
            }
        return {
            ko: '압력밥솥 수준이야!',
            en: 'Pressure cooker level!',
            ja: '圧力鍋レベル！',
            es: '¡Nivel de olla a presión!',
            pt: 'Nível de panela de pressão!',
            'zh-CN': '高压锅级别！',
            'zh-TW': '壓力鍋級別！',
        }
    },
}
