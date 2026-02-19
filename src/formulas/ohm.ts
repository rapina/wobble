import { Formula } from './types'
import { colors } from '../styles/colors'

export const ohm: Formula = {
    id: 'ohm',
    name: {
        ko: '옴의 법칙',
        en: "Ohm's Law",
        ja: 'オームの法則',
        es: 'Ley de Ohm',
        pt: 'Lei de Ohm',
        'zh-CN': '欧姆定律',
        'zh-TW': '歐姆定律',
    },
    expression: 'V = IR',
    description: {
        ko: '전압, 전류, 저항 사이의 관계',
        en: 'Relationship between voltage, current, and resistance',
        ja: '電圧、電流、抵抗の関係',
        es: 'Relación entre voltaje, corriente y resistencia',
        pt: 'Relação entre tensão, corrente e resistência',
        'zh-CN': '电压、电流和电阻之间的关系',
        'zh-TW': '電壓、電流和電阻之間的關係',
    },
    simulationHint: {
        ko: '저항이 클수록 전류가 줄어드는 회로의 모습',
        en: 'Shows current decreasing as resistance increases in a circuit',
        ja: '抵抗が大きいほど電流が減る回路の様子',
        es: 'Muestra la corriente disminuyendo a medida que aumenta la resistencia',
        pt: 'Mostra a corrente diminuindo conforme a resistência aumenta',
        'zh-CN': '显示电路中电阻增加时电流减少的样子',
        'zh-TW': '顯示電路中電阻增加時電流減少的樣子',
    },
    applications: {
        ko: [
            '가정용 전기 배선 설계',
            '스마트폰 충전기의 전류 제한',
            '전기 히터의 발열량 조절',
            'LED 조명의 저항값 계산',
        ],
        en: [
            'Designing household electrical wiring',
            'Limiting current in smartphone chargers',
            'Adjusting heat output of electric heaters',
            'Calculating resistance values for LED lighting',
        ],
        ja: [
            '家庭用電気配線の設計',
            'スマートフォン充電器の電流制限',
            '電気ヒーターの発熱量調整',
            'LED照明の抵抗値計算',
        ],
        es: [
            'Diseño de cableado eléctrico doméstico',
            'Limitación de corriente en cargadores de smartphone',
            'Ajuste de la salida de calor de calentadores eléctricos',
            'Cálculo de valores de resistencia para iluminación LED',
        ],
        pt: [
            'Projeto de fiação elétrica residencial',
            'Limitação de corrente em carregadores de smartphone',
            'Ajuste da saída de calor de aquecedores elétricos',
            'Cálculo de valores de resistência para iluminação LED',
        ],
        'zh-CN': [
            '设计家用电气布线',
            '智能手机充电器的电流限制',
            '调节电热器的发热量',
            '计算LED照明的电阻值',
        ],
        'zh-TW': [
            '設計家用電氣布線',
            '智慧手機充電器的電流限制',
            '調節電熱器的發熱量',
            '計算LED照明的電阻值',
        ],
    },
    category: 'electricity',
    variables: [
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
            range: [0.1, 10],
            default: 2,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 2,
                color: colors.current,
            },
        },
        {
            symbol: 'R',
            name: {
                ko: '저항',
                en: 'Resistance',
                ja: '抵抗',
                es: 'Resistencia',
                pt: 'Resistência',
                'zh-CN': '电阻',
                'zh-TW': '電阻',
            },
            role: 'input',
            unit: 'Ω',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.5,
                color: colors.resistance,
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
            role: 'output',
            unit: 'V',
            range: [0, 1000],
            default: 20,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.voltage,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const I = inputs.I ?? 2
        const R = inputs.R ?? 10
        return {
            V: I * R,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const I = inputs.I ?? 2
        const R = inputs.R ?? 10
        const V = I * R
        return `V = ${I.toFixed(1)} × ${R.toFixed(0)} = ${V.toFixed(0)}`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'I', to: 'R', operator: '×' },
            { from: 'R', to: 'V', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'V',
        numerator: ['I', 'R'],
    },
    discoveries: [
        {
            id: 'high-resistance',
            mission: {
                ko: '저항 R을 80 이상으로 올려봐!',
                en: 'Raise resistance R above 80 ohms!',
                ja: '抵抗Rを80以上に上げてみて！',
                es: '¡Sube la resistencia R por encima de 80 ohmios!',
                pt: 'Aumente a resistência R acima de 80 ohms!',
                'zh-CN': '把电阻R升到80以上！',
                'zh-TW': '把電阻R升到80以上！',
            },
            result: {
                ko: '저항이 크면 같은 전류에도 높은 전압이 필요해! 전기히터가 열을 내는 원리야.',
                en: 'High resistance needs high voltage for same current! How electric heaters generate heat.',
                ja: '抵抗が大きいと同じ電流でも高い電圧が必要！電気ヒーターが熱を出す原理だよ。',
                es: '¡Alta resistencia necesita alto voltaje para la misma corriente! Cómo los calentadores eléctricos generan calor.',
                pt: 'Alta resistência precisa de alta tensão para a mesma corrente! Como aquecedores elétricos geram calor.',
                'zh-CN': '高电阻需要高电压才能产生相同的电流！这就是电热器产生热量的原理。',
                'zh-TW': '高電阻需要高電壓才能產生相同的電流！這就是電熱器產生熱量的原理。',
            },
            icon: '🔥',
            condition: (vars) => vars['R'] >= 80,
        },
        {
            id: 'high-current',
            mission: {
                ko: '전류 I를 8A 이상으로 올려봐!',
                en: 'Raise current I above 8 amps!',
                ja: '電流Iを8A以上に上げてみて！',
                es: '¡Sube la corriente I por encima de 8 amperios!',
                pt: 'Aumente a corrente I acima de 8 amperes!',
                'zh-CN': '把电流I升到8A以上！',
                'zh-TW': '把電流I升到8A以上！',
            },
            result: {
                ko: '높은 전류는 두꺼운 전선이 필요해! 가는 전선은 과열되어 위험해질 수 있어.',
                en: 'High current needs thick wires! Thin wires can overheat and become dangerous.',
                ja: '高い電流には太い電線が必要！細い電線は過熱して危険になることがあるよ。',
                es: '¡Alta corriente necesita cables gruesos! Los cables finos pueden sobrecalentarse y ser peligrosos.',
                pt: 'Alta corrente precisa de fios grossos! Fios finos podem superaquecer e se tornar perigosos.',
                'zh-CN': '高电流需要粗电线！细电线可能过热变得危险。',
                'zh-TW': '高電流需要粗電線！細電線可能過熱變得危險。',
            },
            icon: '⚡',
            condition: (vars) => vars['I'] >= 8,
        },
    ],
    getInsight: (vars) => {
        const V = vars['V']
        if (V < 5)
            return {
                ko: 'USB 충전기 정도야',
                en: 'Like a USB charger',
                ja: 'USB充電器くらいだよ',
                es: 'Como un cargador USB',
                pt: 'Como um carregador USB',
                'zh-CN': '像USB充电器一样',
                'zh-TW': '像USB充電器一樣',
            }
        if (V < 15)
            return {
                ko: '자동차 배터리 정도야',
                en: 'Like a car battery',
                ja: '車のバッテリーくらいだよ',
                es: 'Como una batería de auto',
                pt: 'Como uma bateria de carro',
                'zh-CN': '像汽车电池一样',
                'zh-TW': '像汽車電池一樣',
            }
        if (V < 50)
            return {
                ko: '저전압 전원이야',
                en: 'Low voltage power',
                ja: '低電圧電源だよ',
                es: 'Energía de bajo voltaje',
                pt: 'Energia de baixa tensão',
                'zh-CN': '低压电源',
                'zh-TW': '低壓電源',
            }
        if (V < 120)
            return {
                ko: '미국 가정용 전압이야',
                en: 'US household voltage',
                ja: 'アメリカの家庭用電圧だよ',
                es: 'Voltaje doméstico de EE.UU.',
                pt: 'Tensão doméstica dos EUA',
                'zh-CN': '美国家用电压',
                'zh-TW': '美國家用電壓',
            }
        if (V < 250)
            return {
                ko: '한국 가정용 전압이야',
                en: 'Korean household voltage',
                ja: '韓国の家庭用電圧だよ',
                es: 'Voltaje doméstico coreano',
                pt: 'Tensão doméstica coreana',
                'zh-CN': '韩国家用电压',
                'zh-TW': '韓國家用電壓',
            }
        return {
            ko: '산업용 고전압이야!',
            en: 'Industrial high voltage!',
            ja: '産業用高電圧だよ！',
            es: '¡Alto voltaje industrial!',
            pt: 'Alta tensão industrial!',
            'zh-CN': '工业高压！',
            'zh-TW': '工業高壓！',
        }
    },
}
