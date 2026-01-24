import { Formula } from './types'
import { colors } from '../styles/colors'

export const electricDischarge: Formula = {
    id: 'electric-discharge',
    name: {
        ko: '전기 방전',
        en: 'Electric Discharge',
        ja: '電気放電',
        es: 'Descarga Eléctrica',
        pt: 'Descarga Elétrica',
        'zh-CN': '电击穿',
        'zh-TW': '電擊穿',
    },
    expression: 'E = V/d',
    description: {
        ko: '전압이 높고 거리가 가까우면 공기를 뚫고 전기가 흐른다',
        en: 'When voltage is high and distance is short, electricity can arc through air',
        ja: '電圧が高く距離が近いと、空気を通じて電気が流れる',
        es: 'Cuando el voltaje es alto y la distancia es corta, la electricidad puede arcar a través del aire',
        pt: 'Quando a tensão é alta e a distância é curta, a eletricidade pode arcar através do ar',
        'zh-CN': '当电压高且距离近时，电流可以击穿空气',
        'zh-TW': '當電壓高且距離近時，電流可以擊穿空氣',
    },
    simulationHint: {
        ko: '전압과 간격에 따라 전기장 강도가 변하는 모습',
        en: 'Shows electric field strength changing with voltage and gap distance',
        ja: '電圧とギャップに応じて電界強度が変わる様子',
        es: 'Muestra la intensidad del campo eléctrico cambiando con el voltaje y la distancia del espacio',
        pt: 'Mostra a intensidade do campo elétrico mudando com a tensão e a distância do espaço',
        'zh-CN': '显示电场强度随电压和间隙距离变化的样子',
        'zh-TW': '顯示電場強度隨電壓和間隙距離變化的樣子',
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
        es: [
            'Rayos - descarga entre nubes y tierra',
            'Chispas de bobina de Tesla',
            'Encendido de bujías',
            'Funcionamiento de luces fluorescentes',
        ],
        pt: [
            'Raios - descarga entre nuvens e solo',
            'Faíscas de bobina de Tesla',
            'Ignição de velas de ignição',
            'Funcionamento de luzes fluorescentes',
        ],
        'zh-CN': [
            '闪电 - 云与地面之间的放电',
            '特斯拉线圈的火花',
            '火花塞点火',
            '荧光灯的工作原理',
        ],
        'zh-TW': [
            '閃電 - 雲與地面之間的放電',
            '特斯拉線圈的火花',
            '火星塞點火',
            '螢光燈的工作原理',
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
            name: {
                ko: '간격',
                en: 'Gap',
                ja: 'ギャップ',
                es: 'Espacio',
                pt: 'Espaço',
                'zh-CN': '间隙',
                'zh-TW': '間隙',
            },
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
            name: {
                ko: '전기장',
                en: 'Electric Field',
                ja: '電界',
                es: 'Campo Eléctrico',
                pt: 'Campo Elétrico',
                'zh-CN': '电场',
                'zh-TW': '電場',
            },
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
                es: '¡Haz que el campo eléctrico E supere 3 kV/mm!',
                pt: 'Faça o campo elétrico E exceder 3 kV/mm!',
                'zh-CN': '让电场E超过3 kV/mm！',
                'zh-TW': '讓電場E超過3 kV/mm！',
            },
            result: {
                ko: '3 kV/mm은 공기의 절연 파괴 강도야! 이 이상이면 스파크가 발생해.',
                en: '3 kV/mm is air breakdown strength! Sparks occur above this.',
                ja: '3 kV/mmは空気の絶縁破壊強度！これ以上でスパークが発生するよ。',
                es: '¡3 kV/mm es la resistencia de ruptura del aire! Las chispas ocurren por encima de esto.',
                pt: '3 kV/mm é a resistência de ruptura do ar! Faíscas ocorrem acima disso.',
                'zh-CN': '3 kV/mm是空气的击穿强度！超过这个值就会产生火花。',
                'zh-TW': '3 kV/mm是空氣的擊穿強度！超過這個值就會產生火花。',
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
                es: '¡Configura el voltaje V a 100kV!',
                pt: 'Configure a tensão V para 100kV!',
                'zh-CN': '将电压V设为100kV！',
                'zh-TW': '將電壓V設為100kV！',
            },
            result: {
                ko: '번개는 수억 볼트에 달해! 구름에서 땅까지 수 km를 뚫고 내려와.',
                en: 'Lightning reaches hundreds of millions volts! It breaks through kilometers from cloud to ground.',
                ja: '雷は数億ボルトに達する！雲から地面まで数kmを突き抜ける。',
                es: '¡Los rayos alcanzan cientos de millones de voltios! Atraviesa kilómetros desde la nube hasta el suelo.',
                pt: 'Os raios alcançam centenas de milhões de volts! Atravessa quilômetros da nuvem até o solo.',
                'zh-CN': '闪电可达数亿伏特！从云到地面穿透数公里。',
                'zh-TW': '閃電可達數億伏特！從雲到地面穿透數公里。',
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
                es: '¡Configura el espacio d a 1mm y el voltaje V a 10kV!',
                pt: 'Configure o espaço d para 1mm e a tensão V para 10kV!',
                'zh-CN': '将间隙d设为1mm，电压V设为10kV！',
                'zh-TW': '將間隙d設為1mm，電壓V設為10kV！',
            },
            result: {
                ko: '자동차 스파크 플러그 조건이야! 연료를 점화시키는 불꽃이 여기서 나와.',
                en: 'This is spark plug conditions! The spark that ignites fuel comes from here.',
                ja: '自動車のスパークプラグの条件だよ！燃料を点火する火花がここから出る。',
                es: '¡Estas son las condiciones de la bujía! La chispa que enciende el combustible viene de aquí.',
                pt: 'Estas são as condições da vela de ignição! A faísca que acende o combustível vem daqui.',
                'zh-CN': '这是火花塞的条件！点燃燃料的火花就是从这里产生的。',
                'zh-TW': '這是火星塞的條件！點燃燃料的火花就是從這裡產生的。',
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
                es: 'Nivel seguro',
                pt: 'Nível seguro',
                'zh-CN': '安全水平',
                'zh-TW': '安全水平',
            }
        if (E < 3)
            return {
                ko: '아직 방전 안 돼',
                en: 'No discharge yet',
                ja: 'まだ放電しない',
                es: 'Aún no hay descarga',
                pt: 'Ainda sem descarga',
                'zh-CN': '尚未放电',
                'zh-TW': '尚未放電',
            }
        if (E < 5)
            return {
                ko: '스파크 발생!',
                en: 'Spark occurs!',
                ja: 'スパーク発生！',
                es: '¡Se produce chispa!',
                pt: 'Faísca ocorre!',
                'zh-CN': '产生火花！',
                'zh-TW': '產生火花！',
            }
        if (E < 10)
            return {
                ko: '강한 아크 방전!',
                en: 'Strong arc discharge!',
                ja: '強いアーク放電！',
                es: '¡Fuerte descarga de arco!',
                pt: 'Forte descarga de arco!',
                'zh-CN': '强电弧放电！',
                'zh-TW': '強電弧放電！',
            }
        return {
            ko: '플라즈마 형성!',
            en: 'Plasma formation!',
            ja: 'プラズマ形成！',
            es: '¡Formación de plasma!',
            pt: 'Formação de plasma!',
            'zh-CN': '等离子体形成！',
            'zh-TW': '等離子體形成！',
        }
    },
}
