import { Formula } from './types'
import { colors } from '../styles/colors'

export const stefanBoltzmann: Formula = {
    id: 'stefan-boltzmann',
    name: {
        ko: '스테판-볼츠만 법칙',
        en: 'Stefan-Boltzmann Law',
        ja: 'シュテファン・ボルツマンの法則',
        es: 'Ley de Stefan-Boltzmann',
        pt: 'Lei de Stefan-Boltzmann',
        'zh-CN': '斯特藩-玻尔兹曼定律',
        'zh-TW': '斯特藩-波茲曼定律',
    },
    expression: 'P = σAT⁴',
    description: {
        ko: '흑체가 방출하는 복사 에너지',
        en: 'The radiant energy emitted by a black body',
        ja: '黒体が放出する放射エネルギー',
        es: 'La energía radiante emitida por un cuerpo negro',
        pt: 'A energia radiante emitida por um corpo negro',
        'zh-CN': '黑体辐射的能量',
        'zh-TW': '黑體輻射的能量',
    },
    simulationHint: {
        ko: '온도에 따라 물체가 방출하는 복사 에너지가 급격히 변하는 모습',
        en: 'Shows radiant energy increasing dramatically with temperature',
        ja: '温度に応じて物体が放出する放射エネルギーが急激に変わる様子',
        es: 'Muestra la energía radiante aumentando dramáticamente con la temperatura',
        pt: 'Mostra a energia radiante aumentando dramaticamente com a temperatura',
        'zh-CN': '显示辐射能量随温度急剧变化的样子',
        'zh-TW': '顯示輻射能量隨溫度急劇變化的樣子',
    },
    applications: {
        ko: [
            '태양의 표면 온도 측정',
            '적외선 체온계의 작동 원리',
            '별의 밝기와 크기 관계 계산',
            '지구의 열균형과 기후 모델링',
        ],
        en: [
            "Measuring the Sun's surface temperature",
            'How infrared thermometers work',
            'Calculating star brightness and size relationships',
            "Earth's thermal equilibrium and climate modeling",
        ],
        ja: [
            '太陽の表面温度測定',
            '赤外線体温計の仕組み',
            '恒星の明るさとサイズの関係計算',
            '地球の熱平衡と気候モデリング',
        ],
        es: [
            'Medición de la temperatura superficial del Sol',
            'Cómo funcionan los termómetros infrarrojos',
            'Cálculo de relaciones de brillo y tamaño de estrellas',
            'Equilibrio térmico de la Tierra y modelado climático',
        ],
        pt: [
            'Medição da temperatura da superfície do Sol',
            'Como funcionam os termômetros infravermelhos',
            'Cálculo de relações de brilho e tamanho de estrelas',
            'Equilíbrio térmico da Terra e modelagem climática',
        ],
        'zh-CN': [
            '测量太阳表面温度',
            '红外体温计的工作原理',
            '计算恒星亮度与大小的关系',
            '地球热平衡和气候建模',
        ],
        'zh-TW': [
            '測量太陽表面溫度',
            '紅外線體溫計的工作原理',
            '計算恆星亮度與大小的關係',
            '地球熱平衡和氣候建模',
        ],
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'A',
            name: {
                ko: '표면적',
                en: 'Surface Area',
                ja: '表面積',
                es: 'Área de Superficie',
                pt: 'Área de Superfície',
                'zh-CN': '表面积',
                'zh-TW': '表面積',
            },
            role: 'input',
            unit: 'm²',
            range: [1, 10],
            default: 4,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 6,
                color: colors.distance,
            },
        },
        {
            symbol: 'T',
            name: {
                ko: '절대온도',
                en: 'Absolute Temperature',
                ja: '絶対温度',
                es: 'Temperatura Absoluta',
                pt: 'Temperatura Absoluta',
                'zh-CN': '绝对温度',
                'zh-TW': '絕對溫度',
            },
            role: 'input',
            unit: 'K',
            range: [300, 1200],
            default: 600,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 150,
                color: colors.temperature,
            },
        },
        {
            symbol: 'P',
            name: {
                ko: '복사 전력',
                en: 'Radiated Power',
                ja: '放射電力',
                es: 'Potencia Radiada',
                pt: 'Potência Radiada',
                'zh-CN': '辐射功率',
                'zh-TW': '輻射功率',
            },
            role: 'output',
            unit: 'W',
            range: [0, 500000],
            default: 29376,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.min(value / 800, 10),
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const A = inputs.A ?? 1
        const T = inputs.T ?? 500
        const sigma = 5.67e-8 // Stefan-Boltzmann constant
        return {
            P: sigma * A * Math.pow(T, 4),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const A = inputs.A ?? 1
        const T = inputs.T ?? 500
        const sigma = 5.67e-8
        const P = sigma * A * Math.pow(T, 4)
        return `P = σ × ${A.toFixed(1)} × ${T.toFixed(0)}⁴ = ${P.toFixed(0)}`
    },
    layout: {
        type: 'explosion',
        connections: [
            { from: 'A', to: 'T', operator: '×' },
            { from: 'T', to: 'P', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'P',
        expression: [
            { type: 'text', value: 'σ' },
            { type: 'var', symbol: 'A' },
            { type: 'var', symbol: 'T', square: true },
            { type: 'text', value: '²' },
        ],
    },
    getInsight: (vars) => {
        const P = vars['P']
        if (P < 1000)
            return {
                ko: '촛불 정도의 복사 에너지야',
                en: 'Candle level radiant energy',
                ja: 'ろうそく程度の放射エネルギーだよ',
                es: 'Energía radiante nivel vela',
                pt: 'Energia radiante nível vela',
                'zh-CN': '蜡烛级别的辐射能量',
                'zh-TW': '蠟燭級別的輻射能量',
            }
        if (P < 10000)
            return {
                ko: '전구 정도의 복사 에너지야',
                en: 'Light bulb level radiant energy',
                ja: '電球程度の放射エネルギーだよ',
                es: 'Energía radiante nivel bombilla',
                pt: 'Energia radiante nível lâmpada',
                'zh-CN': '灯泡级别的辐射能量',
                'zh-TW': '燈泡級別的輻射能量',
            }
        if (P < 50000)
            return {
                ko: '히터 정도의 복사 에너지야',
                en: 'Heater level radiant energy',
                ja: 'ヒーター程度の放射エネルギーだよ',
                es: 'Energía radiante nivel calentador',
                pt: 'Energia radiante nível aquecedor',
                'zh-CN': '加热器级别的辐射能量',
                'zh-TW': '加熱器級別的輻射能量',
            }
        if (P < 200000)
            return {
                ko: '용광로 정도의 복사 에너지야',
                en: 'Furnace level radiant energy',
                ja: '溶鉱炉程度の放射エネルギーだよ',
                es: 'Energía radiante nivel horno',
                pt: 'Energia radiante nível forno',
                'zh-CN': '熔炉级别的辐射能量',
                'zh-TW': '熔爐級別的輻射能量',
            }
        return {
            ko: '태양급 복사 에너지!',
            en: 'Sun level radiant energy!',
            ja: '太陽級の放射エネルギー！',
            es: '¡Energía radiante nivel Sol!',
            pt: 'Energia radiante nível Sol!',
            'zh-CN': '太阳级别的辐射能量！',
            'zh-TW': '太陽級別的輻射能量！',
        }
    },
    discoveries: [
        {
            id: 'sun-temperature',
            mission: {
                ko: '온도 T를 1000K 이상으로 올려봐!',
                en: 'Raise temperature T above 1000K!',
                ja: '温度Tを1000K以上に上げてみて！',
                es: '¡Sube la temperatura T por encima de 1000K!',
                pt: 'Aumente a temperatura T acima de 1000K!',
                'zh-CN': '把温度T升到1000K以上！',
                'zh-TW': '把溫度T升到1000K以上！',
            },
            result: {
                ko: '온도가 2배면 복사 에너지는 16배! T⁴에 비례하기 때문이야.',
                en: 'Double the temperature means 16x more radiation! Because power scales with T to the 4th.',
                ja: '温度が2倍なら放射エネルギーは16倍！T⁴に比例するからだよ。',
                es: '¡El doble de temperatura significa 16 veces más radiación! Porque la potencia escala con T a la 4ta.',
                pt: 'O dobro da temperatura significa 16x mais radiação! Porque a potência escala com T à 4ª.',
                'zh-CN': '温度翻倍意味着辐射增加16倍！因为功率与T的4次方成正比。',
                'zh-TW': '溫度翻倍意味著輻射增加16倍！因為功率與T的4次方成正比。',
            },
            icon: '☀️',
            condition: (vars) => vars['T'] >= 1000,
        },
        {
            id: 'room-temperature',
            mission: {
                ko: '온도 T를 350K 이하로 낮춰봐! (상온 근처)',
                en: 'Lower temperature T below 350K! (near room temperature)',
                ja: '温度Tを350K以下に下げてみて！（室温付近）',
                es: '¡Baja la temperatura T por debajo de 350K! (cerca de temperatura ambiente)',
                pt: 'Reduza a temperatura T abaixo de 350K! (perto da temperatura ambiente)',
                'zh-CN': '把温度T降到350K以下！（接近室温）',
                'zh-TW': '把溫度T降到350K以下！（接近室溫）',
            },
            result: {
                ko: '상온 물체도 적외선을 방출해! 열화상 카메라가 작동하는 원리야.',
                en: 'Room temperature objects emit infrared! This is how thermal cameras work.',
                ja: '室温の物体も赤外線を放出する！サーモカメラが動作する原理だよ。',
                es: '¡Los objetos a temperatura ambiente emiten infrarrojos! Así funcionan las cámaras térmicas.',
                pt: 'Objetos em temperatura ambiente emitem infravermelho! É assim que as câmeras térmicas funcionam.',
                'zh-CN': '室温物体也会发射红外线！这就是热成像相机的工作原理。',
                'zh-TW': '室溫物體也會發射紅外線！這就是熱成像相機的工作原理。',
            },
            icon: '📷',
            condition: (vars) => vars['T'] <= 350,
        },
    ],
}
