import { Formula } from './types'
import { colors } from '../styles/colors'

export const wien: Formula = {
    id: 'wien',
    name: {
        ko: '빈의 변위 법칙',
        en: "Wien's Displacement Law",
        ja: 'ウィーンの変位則',
        es: 'Ley de Desplazamiento de Wien',
        pt: 'Lei do Deslocamento de Wien',
        'zh-CN': '维恩位移定律',
        'zh-TW': '維恩位移定律',
    },
    expression: 'λmax = b/T',
    description: {
        ko: '흑체 복사의 최대 파장은 온도에 반비례한다',
        en: 'Peak wavelength of blackbody radiation is inversely proportional to temperature',
        ja: '黒体放射のピーク波長は温度に反比例する',
        es: 'La longitud de onda pico de la radiación del cuerpo negro es inversamente proporcional a la temperatura',
        pt: 'O comprimento de onda de pico da radiação de corpo negro é inversamente proporcional à temperatura',
        'zh-CN': '黑体辐射的峰值波长与温度成反比',
        'zh-TW': '黑體輻射的峰值波長與溫度成反比',
    },
    simulationHint: {
        ko: '온도가 높아질수록 물체의 색이 빨강에서 파랑으로 변하는 모습',
        en: 'Shows object color shifting from red to blue as temperature increases',
        ja: '温度が高くなるほど物体の色が赤から青に変わる様子',
        es: 'Muestra el color del objeto cambiando de rojo a azul a medida que aumenta la temperatura',
        pt: 'Mostra a cor do objeto mudando de vermelho para azul conforme a temperatura aumenta',
        'zh-CN': '显示物体颜色随温度升高从红色变为蓝色的样子',
        'zh-TW': '顯示物體顏色隨溫度升高從紅色變為藍色的樣子',
    },
    applications: {
        ko: [
            '별의 색깔로 표면 온도 측정',
            '적외선 열화상 카메라 설계',
            '용광로의 온도 측정',
            '태양과 다른 별들의 분류',
        ],
        en: [
            'Measuring star surface temperature by color',
            'Designing infrared thermal cameras',
            'Measuring furnace temperature',
            'Classification of the Sun and other stars',
        ],
        ja: [
            '恒星の色から表面温度を測定',
            '赤外線サーモカメラの設計',
            '溶鉱炉の温度測定',
            '太陽やその他の恒星の分類',
        ],
        es: [
            'Medición de la temperatura superficial de estrellas por color',
            'Diseño de cámaras térmicas infrarrojas',
            'Medición de temperatura de hornos',
            'Clasificación del Sol y otras estrellas',
        ],
        pt: [
            'Medição da temperatura da superfície de estrelas pela cor',
            'Projeto de câmeras térmicas infravermelhas',
            'Medição de temperatura de fornos',
            'Classificação do Sol e outras estrelas',
        ],
        'zh-CN': [
            '通过颜色测量恒星表面温度',
            '设计红外热成像相机',
            '测量熔炉温度',
            '太阳和其他恒星的分类',
        ],
        'zh-TW': [
            '通過顏色測量恆星表面溫度',
            '設計紅外線熱成像相機',
            '測量熔爐溫度',
            '太陽和其他恆星的分類',
        ],
    },
    category: 'thermodynamics',
    variables: [
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
            range: [2000, 12000],
            default: 5800,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 2000,
                color: colors.temperature,
            },
        },
        {
            symbol: 'λmax',
            name: {
                ko: '최대 파장',
                en: 'Peak Wavelength',
                ja: 'ピーク波長',
                es: 'Longitud de Onda Pico',
                pt: 'Comprimento de Onda de Pico',
                'zh-CN': '峰值波长',
                'zh-TW': '峰值波長',
            },
            role: 'output',
            unit: 'nm',
            range: [200, 1500],
            default: 500,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 200,
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const T = inputs.T ?? 5800
        // Wien's constant b = 2.898 × 10⁻³ m·K = 2898000 nm·K
        const b = 2898000
        return {
            λmax: b / T,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const T = inputs.T ?? 5800
        const b = 2898000
        const lambdaMax = b / T
        return `λmax = 2898000 ÷ ${T.toFixed(0)} = ${lambdaMax.toFixed(0)}`
    },
    layout: {
        type: 'linear',
        connections: [{ from: 'T', to: 'λmax', operator: '=' }],
    },
    displayLayout: {
        type: 'custom',
        output: 'λmax',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: 'b' }],
                denominator: [{ type: 'var', symbol: 'T' }],
            },
        ],
    },
    getInsight: (vars) => {
        const lambda = vars['λmax']
        if (lambda < 400)
            return {
                ko: '자외선 영역! 파란 별이야',
                en: 'Ultraviolet region! A blue star',
                ja: '紫外線領域！青い星だよ',
                es: '¡Región ultravioleta! Una estrella azul',
                pt: 'Região ultravioleta! Uma estrela azul',
                'zh-CN': '紫外线区域！蓝色恒星',
                'zh-TW': '紫外線區域！藍色恆星',
            }
        if (lambda < 500)
            return {
                ko: '파란색 가시광선! 뜨거운 별이야',
                en: 'Blue visible light! A hot star',
                ja: '青い可視光線！熱い星だよ',
                es: '¡Luz visible azul! Una estrella caliente',
                pt: 'Luz visível azul! Uma estrela quente',
                'zh-CN': '蓝色可见光！炽热的恒星',
                'zh-TW': '藍色可見光！熾熱的恆星',
            }
        if (lambda < 600)
            return {
                ko: '노란색! 태양과 비슷한 온도야',
                en: 'Yellow! Similar temperature to the Sun',
                ja: '黄色！太陽と同じくらいの温度だよ',
                es: '¡Amarillo! Temperatura similar al Sol',
                pt: 'Amarelo! Temperatura similar ao Sol',
                'zh-CN': '黄色！与太阳温度相似',
                'zh-TW': '黃色！與太陽溫度相似',
            }
        if (lambda < 700)
            return {
                ko: '주황~빨간색! 차가운 별이야',
                en: 'Orange-red! A cool star',
                ja: 'オレンジ〜赤！冷たい星だよ',
                es: '¡Naranja-rojo! Una estrella fría',
                pt: 'Laranja-vermelho! Uma estrela fria',
                'zh-CN': '橙红色！较冷的恒星',
                'zh-TW': '橙紅色！較冷的恆星',
            }
        if (lambda < 1000)
            return {
                ko: '적외선 영역! 적색왜성이야',
                en: 'Infrared region! A red dwarf',
                ja: '赤外線領域！赤色矮星だよ',
                es: '¡Región infrarroja! Una enana roja',
                pt: 'Região infravermelha! Uma anã vermelha',
                'zh-CN': '红外线区域！红矮星',
                'zh-TW': '紅外線區域！紅矮星',
            }
        return {
            ko: '먼 적외선! 매우 차가운 천체야',
            en: 'Far infrared! A very cold object',
            ja: '遠赤外線！とても冷たい天体だよ',
            es: '¡Infrarrojo lejano! Un objeto muy frío',
            pt: 'Infravermelho distante! Um objeto muito frio',
            'zh-CN': '远红外线！非常冷的天体',
            'zh-TW': '遠紅外線！非常冷的天體',
        }
    },
    discoveries: [
        {
            id: 'sun-temperature',
            mission: {
                ko: '온도 T를 5800K로 설정해봐! (태양 표면)',
                en: 'Set temperature T to 5800K! (Sun surface)',
                ja: '温度Tを5800Kに設定してみて！（太陽表面）',
                es: '¡Configura la temperatura T a 5800K! (superficie del Sol)',
                pt: 'Configure a temperatura T para 5800K! (superfície do Sol)',
                'zh-CN': '把温度T设为5800K！（太阳表面）',
                'zh-TW': '把溫度T設為5800K！（太陽表面）',
            },
            result: {
                ko: '태양의 최대 파장은 약 500nm, 녹색-노란색! 태양이 노랗게 보이는 이유야.',
                en: 'Sun peaks at 500nm, green-yellow! This is why the Sun appears yellow.',
                ja: '太陽のピーク波長は約500nm、緑〜黄色！太陽が黄色く見える理由だよ。',
                es: '¡El Sol tiene su pico en 500nm, verde-amarillo! Por eso el Sol parece amarillo.',
                pt: 'O pico do Sol é em 500nm, verde-amarelo! Por isso o Sol parece amarelo.',
                'zh-CN': '太阳的峰值波长约500nm，绿黄色！这就是太阳看起来是黄色的原因。',
                'zh-TW': '太陽的峰值波長約500nm，綠黃色！這就是太陽看起來是黃色的原因。',
            },
            icon: '☀️',
            condition: (vars) => vars['T'] >= 5600 && vars['T'] <= 6000,
        },
        {
            id: 'hot-star',
            mission: {
                ko: '온도 T를 10000K 이상으로 올려봐!',
                en: 'Raise temperature T above 10000K!',
                ja: '温度Tを10000K以上に上げてみて！',
                es: '¡Sube la temperatura T por encima de 10000K!',
                pt: 'Aumente a temperatura T acima de 10000K!',
                'zh-CN': '把温度T升到10000K以上！',
                'zh-TW': '把溫度T升到10000K以上！',
            },
            result: {
                ko: '뜨거운 별은 파란색! 파장이 짧아서 푸르게 보여. 리겔이나 시리우스 같은 별이야.',
                en: 'Hot stars are blue! Short wavelengths appear blue. Like Rigel or Sirius.',
                ja: '熱い星は青い！波長が短いから青く見える。リゲルやシリウスみたいな星だよ。',
                es: '¡Las estrellas calientes son azules! Las longitudes de onda cortas aparecen azules. Como Rigel o Sirio.',
                pt: 'Estrelas quentes são azuis! Comprimentos de onda curtos parecem azuis. Como Rigel ou Sirius.',
                'zh-CN': '炽热的恒星是蓝色的！短波长呈现蓝色。像参宿七或天狼星这样的恒星。',
                'zh-TW': '熾熱的恆星是藍色的！短波長呈現藍色。像參宿七或天狼星這樣的恆星。',
            },
            icon: '💙',
            condition: (vars) => vars['T'] >= 10000,
        },
    ],
}
