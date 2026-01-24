import { Formula } from './types'
import { colors } from '../styles/colors'

export const pressure: Formula = {
    id: 'pressure',
    name: {
        ko: '압력',
        en: 'Pressure',
        ja: '圧力',
        es: 'Presión',
        pt: 'Pressão',
        'zh-CN': '压强',
        'zh-TW': '壓力',
    },
    expression: 'P = F/A',
    description: {
        ko: '단위 면적당 가해지는 힘',
        en: 'Force applied per unit area',
        ja: '単位面積あたりの力',
        es: 'Fuerza aplicada por unidad de área',
        pt: 'Força aplicada por unidade de área',
        'zh-CN': '单位面积上所受的力',
        'zh-TW': '單位面積上所受的力',
    },
    simulationHint: {
        ko: '같은 힘이라도 면적이 작을수록 압력이 커지는 모습',
        en: 'Shows how pressure increases as area decreases for the same force',
        ja: '同じ力でも面積が小さいほど圧力が大きくなる様子',
        es: 'Muestra cómo aumenta la presión cuando el área disminuye con la misma fuerza',
        pt: 'Mostra como a pressão aumenta quando a área diminui com a mesma força',
        'zh-CN': '显示相同力作用下面积越小压强越大',
        'zh-TW': '顯示相同力作用下面積越小壓力越大',
    },
    applications: {
        ko: [
            '압정이 쉽게 찔리는 이유',
            '스키가 눈에 덜 빠지는 원리',
            '고압 세척기의 작동 원리',
            '칼날이 날카로울수록 잘 드는 이유',
        ],
        en: [
            'Why thumbtacks pierce easily',
            "Why skis don't sink in snow",
            'How pressure washers work',
            'Why sharper knives cut better',
        ],
        ja: [
            '画びょうが刺さりやすい理由',
            'スキーが雪に沈みにくい原理',
            '高圧洗浄機の仕組み',
            '鋭い刃がよく切れる理由',
        ],
        es: [
            'Por qué las tachuelas penetran fácilmente',
            'Por qué los esquís no se hunden en la nieve',
            'Cómo funcionan las lavadoras a presión',
            'Por qué los cuchillos más afilados cortan mejor',
        ],
        pt: [
            'Por que tachinhas penetram facilmente',
            'Por que esquis não afundam na neve',
            'Como funcionam as lavadoras de alta pressão',
            'Por que facas mais afiadas cortam melhor',
        ],
        'zh-CN': [
            '图钉容易刺入的原因',
            '滑雪板不容易陷入雪中的原理',
            '高压清洗机的工作原理',
            '刀越锋利越好切的原因',
        ],
        'zh-TW': [
            '圖釘容易刺入的原因',
            '滑雪板不容易陷入雪中的原理',
            '高壓清洗機的工作原理',
            '刀越鋒利越好切的原因',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'F',
            name: { ko: '힘', en: 'Force', ja: '力', es: 'Fuerza', pt: 'Força', 'zh-CN': '力', 'zh-TW': '力' },
            role: 'input',
            unit: 'N',
            range: [10, 200],
            default: 100,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.force,
            },
        },
        {
            symbol: 'A',
            name: { ko: '면적', en: 'Area', ja: '面積', es: 'Área', pt: 'Área', 'zh-CN': '面积', 'zh-TW': '面積' },
            role: 'input',
            unit: 'cm²',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => value / 50,
                color: colors.distance,
            },
        },
        {
            symbol: 'P',
            name: { ko: '압력', en: 'Pressure', ja: '圧力', es: 'Presión', pt: 'Pressão', 'zh-CN': '压强', 'zh-TW': '壓力' },
            role: 'output',
            unit: 'kPa',
            range: [0, 2000],
            default: 100,
            visual: {
                property: 'shake',
                scale: (value: number) => Math.min(value / 100, 5),
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const F = inputs.F ?? 100
        const A = inputs.A ?? 10
        // P = F/A, convert to kPa (F in N, A in cm² → multiply by 10)
        return {
            P: (F * 10) / A,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const F = inputs.F ?? 100
        const A = inputs.A ?? 10
        const P = (F * 10) / A
        return `P = ${F.toFixed(0)} ÷ ${A.toFixed(1)} = ${P.toFixed(0)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'F', to: 'A', operator: '÷' },
            { from: 'A', to: 'P', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'P',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'F' }],
                denominator: [{ type: 'var', symbol: 'A' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'needle-point',
            mission: {
                ko: '면적 A를 5cm² 이하로 줄여봐!',
                en: 'Reduce area A below 5 square centimeters!',
                ja: '面積Aを5cm²以下に減らしてみて！',
                es: '¡Reduce el área A por debajo de 5 cm²!',
                pt: 'Reduza a área A abaixo de 5 cm²!',
                'zh-CN': '将面积A减少到5cm²以下！',
                'zh-TW': '將面積A減少到5cm²以下！',
            },
            result: {
                ko: '면적이 작으면 압력이 엄청 커져! 압정이 쉽게 찔리는 이유야.',
                en: 'Small area means huge pressure! This is why thumbtacks pierce easily.',
                ja: '面積が小さいと圧力が大きくなる！画びょうが刺さりやすい理由だよ。',
                es: '¡Área pequeña significa presión enorme! Por eso las tachuelas penetran fácilmente.',
                pt: 'Área pequena significa pressão enorme! Por isso tachinhas penetram facilmente.',
                'zh-CN': '面积小意味着压强大！这就是图钉容易刺入的原因。',
                'zh-TW': '面積小意味著壓力大！這就是圖釘容易刺入的原因。',
            },
            icon: '📌',
            condition: (vars) => vars['A'] <= 5,
        },
        {
            id: 'snowshoe',
            mission: {
                ko: '면적 A를 최대(100cm²)로 늘려봐!',
                en: 'Maximize area A to 100 square centimeters!',
                ja: '面積Aを最大（100cm²）まで増やしてみて！',
                es: '¡Maximiza el área A a 100 cm²!',
                pt: 'Maximize a área A para 100 cm²!',
                'zh-CN': '将面积A增加到最大（100cm²）！',
                'zh-TW': '將面積A增加到最大（100cm²）！',
            },
            result: {
                ko: '면적이 크면 압력이 분산돼! 스키가 눈에 덜 빠지는 원리야.',
                en: 'Large area spreads pressure out! This is why skis do not sink in snow.',
                ja: '面積が大きいと圧力が分散される！スキーが雪に沈みにくい原理だよ。',
                es: '¡Área grande distribuye la presión! Por eso los esquís no se hunden en la nieve.',
                pt: 'Área grande distribui a pressão! Por isso esquis não afundam na neve.',
                'zh-CN': '面积大会分散压强！这就是滑雪板不容易陷入雪中的原理。',
                'zh-TW': '面積大會分散壓力！這就是滑雪板不容易陷入雪中的原理。',
            },
            icon: '🎿',
            condition: (vars) => vars['A'] >= 90,
        },
    ],
    getInsight: (vars) => {
        const P = vars['P']
        if (P < 50)
            return {
                ko: '손바닥으로 누르는 정도야',
                en: 'Like pressing with palm',
                ja: '手のひらで押す程度だよ',
                es: 'Como presionar con la palma',
                pt: 'Como pressionar com a palma',
                'zh-CN': '像用手掌按压',
                'zh-TW': '像用手掌按壓',
            }
        if (P < 200)
            return {
                ko: '손가락으로 누르는 힘이야',
                en: 'Like pressing with finger',
                ja: '指で押す力だよ',
                es: 'Como presionar con el dedo',
                pt: 'Como pressionar com o dedo',
                'zh-CN': '像用手指按压',
                'zh-TW': '像用手指按壓',
            }
        if (P < 500)
            return {
                ko: '볼펜 끝 압력이야',
                en: 'Ballpoint pen tip pressure',
                ja: 'ボールペンの先の圧力だよ',
                es: 'Presión de punta de bolígrafo',
                pt: 'Pressão da ponta de caneta esferográfica',
                'zh-CN': '圆珠笔尖的压强',
                'zh-TW': '原子筆尖的壓力',
            }
        if (P < 1000)
            return {
                ko: '압정 끝 압력이야!',
                en: 'Thumbtack tip pressure!',
                ja: '画びょうの先の圧力だよ！',
                es: '¡Presión de punta de tachuela!',
                pt: 'Pressão da ponta da tachinha!',
                'zh-CN': '图钉尖的压强！',
                'zh-TW': '圖釘尖的壓力！',
            }
        return {
            ko: '칼날 수준의 압력!',
            en: 'Knife blade level pressure!',
            ja: '刃物レベルの圧力だよ！',
            es: '¡Presión nivel hoja de cuchillo!',
            pt: 'Pressão nível lâmina de faca!',
            'zh-CN': '刀刃级别的压强！',
            'zh-TW': '刀刃級別的壓力！',
        }
    },
}
