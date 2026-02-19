import { Formula } from './types'
import { colors } from '../styles/colors'

export const keplerThird: Formula = {
    id: 'kepler-third',
    name: {
        ko: '케플러 제3법칙',
        en: "Kepler's Third Law",
        ja: 'ケプラーの第三法則',
        es: 'Tercera Ley de Kepler',
        pt: 'Terceira Lei de Kepler',
        'zh-CN': '开普勒第三定律',
        'zh-TW': '克卜勒第三定律',
    },
    expression: 'T² = (4π²/GM)r³',
    description: {
        ko: '행성의 공전주기와 궤도반경의 관계',
        en: 'The relationship between orbital period and orbital radius',
        ja: '惑星の公転周期と軌道半径の関係',
        es: 'La relación entre el período orbital y el radio orbital',
        pt: 'A relação entre o período orbital e o raio orbital',
        'zh-CN': '行星公转周期与轨道半径的关系',
        'zh-TW': '行星公轉週期與軌道半徑的關係',
    },
    simulationHint: {
        ko: '행성이 중심 별 주위를 공전하며 궤도에 따라 주기가 변하는 모습',
        en: 'Shows a planet orbiting a star with period changing based on orbital radius',
        ja: '惑星が中心星の周りを公転し、軌道に応じて周期が変わる様子',
        es: 'Muestra un planeta orbitando una estrella con período variable según el radio orbital',
        pt: 'Mostra um planeta orbitando uma estrela com período variável conforme o raio orbital',
        'zh-CN': '展示行星绕恒星公转，周期随轨道半径变化',
        'zh-TW': '展示行星繞恆星公轉，週期隨軌道半徑變化',
    },
    applications: {
        ko: [
            '인공위성의 궤도 주기 계산',
            '외계 행성 탐색 (항성의 흔들림 분석)',
            '달의 공전주기로 지구 질량 추정',
            'GPS 위성의 정확한 궤도 설계',
        ],
        en: [
            'Calculating satellite orbital periods',
            'Detecting exoplanets via stellar wobble',
            "Estimating Earth's mass from Moon's orbit",
            'Precise GPS satellite orbit design',
        ],
        ja: [
            '人工衛星の軌道周期計算',
            '恒星のふらつきで系外惑星を探索',
            '月の軌道から地球の質量を推定',
            'GPS衛星の精密軌道設計',
        ],
        es: [
            'Cálculo de períodos orbitales de satélites',
            'Detección de exoplanetas mediante oscilación estelar',
            'Estimación de la masa de la Tierra desde la órbita lunar',
            'Diseño preciso de órbitas de satélites GPS',
        ],
        pt: [
            'Cálculo de períodos orbitais de satélites',
            'Detecção de exoplanetas via oscilação estelar',
            'Estimativa da massa da Terra pela órbita da Lua',
            'Projeto preciso de órbitas de satélites GPS',
        ],
        'zh-CN': [
            '计算卫星轨道周期',
            '通过恒星摆动探测系外行星',
            '从月球轨道估算地球质量',
            'GPS卫星精确轨道设计',
        ],
        'zh-TW': [
            '計算衛星軌道週期',
            '通過恆星擺動探測系外行星',
            '從月球軌道估算地球質量',
            'GPS衛星精確軌道設計',
        ],
    },
    category: 'gravity',
    variables: [
        {
            symbol: 'M',
            name: {
                ko: '중심 천체 질량',
                en: 'Central Body Mass',
                ja: '中心天体の質量',
                es: 'Masa del Cuerpo Central',
                pt: 'Massa do Corpo Central',
                'zh-CN': '中心天体质量',
                'zh-TW': '中心天體質量',
            },
            role: 'input',
            unit: '×10²⁴kg',
            range: [1, 100000],
            default: 5.97,
            visual: {
                property: 'size',
                scale: (value: number) => 40 + Math.log10(value) * 15,
                color: colors.mass,
            },
        },
        {
            symbol: 'r',
            name: {
                ko: '궤도 반지름',
                en: 'Orbital Radius',
                ja: '軌道半径',
                es: 'Radio Orbital',
                pt: 'Raio Orbital',
                'zh-CN': '轨道半径',
                'zh-TW': '軌道半徑',
            },
            role: 'input',
            unit: '×10⁶m',
            range: [1, 10000],
            default: 384,
            visual: {
                property: 'distance',
                scale: (value: number) => Math.min(value * 0.3, 100),
                color: colors.distance,
            },
        },
        {
            symbol: 'T',
            name: {
                ko: '공전 주기',
                en: 'Orbital Period',
                ja: '公転周期',
                es: 'Período Orbital',
                pt: 'Período Orbital',
                'zh-CN': '公转周期',
                'zh-TW': '公轉週期',
            },
            role: 'output',
            unit: '일',
            range: [0, 1000],
            default: 27.3,
            visual: {
                property: 'oscillate',
                scale: (value: number) => Math.min(value / 10, 5),
                color: colors.time,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const M = inputs.M ?? 5.97 // ×10²⁴ kg
        const r = inputs.r ?? 384 // ×10⁶ m
        const G = 6.674e-11
        const M_kg = M * 1e24
        const r_m = r * 1e6
        // T² = (4π²/GM)r³
        const T_squared = (4 * Math.PI * Math.PI * Math.pow(r_m, 3)) / (G * M_kg)
        const T_seconds = Math.sqrt(T_squared)
        const T_days = T_seconds / (24 * 3600)
        return { T: T_days }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const M = inputs.M ?? 5.97
        const r = inputs.r ?? 384
        const G = 6.674e-11
        const M_kg = M * 1e24
        const r_m = r * 1e6
        const T_squared = (4 * Math.PI * Math.PI * Math.pow(r_m, 3)) / (G * M_kg)
        const T_seconds = Math.sqrt(T_squared)
        const T_days = T_seconds / (24 * 3600)
        return `T = √(4π²r³/GM) = ${T_days.toFixed(1)} 일`
    },
    layout: {
        type: 'orbital',
        connections: [
            { from: 'M', to: 'r', operator: '÷' },
            { from: 'r', to: 'T', operator: '√' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'T',
        expression: [
            { type: 'text', value: '√' },
            {
                type: 'group',
                items: [
                    {
                        type: 'fraction',
                        numerator: [
                            { type: 'text', value: '4π²' },
                            { type: 'var', symbol: 'r', square: true },
                            { type: 'text', value: 'r' },
                        ],
                        denominator: [
                            { type: 'text', value: 'G' },
                            { type: 'var', symbol: 'M' },
                        ],
                    },
                ],
            },
        ],
    },
    getInsight: (vars) => {
        const T = vars['T']
        if (T < 0.1)
            return {
                ko: '저궤도 위성 정도야 (90분)',
                en: 'Low orbit satellite (90 min)',
                ja: '低軌道衛星程度（90分）',
                es: 'Satélite de órbita baja (90 min)',
                pt: 'Satélite de órbita baixa (90 min)',
                'zh-CN': '低轨道卫星（90分钟）',
                'zh-TW': '低軌道衛星（90分鐘）',
            }
        if (T < 1)
            return {
                ko: '정지궤도 위성 정도야 (24시간)',
                en: 'Geostationary satellite (24 hours)',
                ja: '静止軌道衛星程度（24時間）',
                es: 'Satélite geoestacionario (24 horas)',
                pt: 'Satélite geoestacionário (24 horas)',
                'zh-CN': '地球同步卫星（24小时）',
                'zh-TW': '地球同步衛星（24小時）',
            }
        if (T < 30)
            return {
                ko: '달의 공전주기 정도야',
                en: 'Like the Moon orbital period',
                ja: '月の公転周期程度だよ',
                es: 'Como el período orbital de la Luna',
                pt: 'Como o período orbital da Lua',
                'zh-CN': '相当于月球公转周期',
                'zh-TW': '相當於月球公轉週期',
            }
        if (T < 400)
            return {
                ko: '지구의 공전주기 정도야',
                en: 'Like Earth orbital period',
                ja: '地球の公転周期程度だよ',
                es: 'Como el período orbital de la Tierra',
                pt: 'Como o período orbital da Terra',
                'zh-CN': '相当于地球公转周期',
                'zh-TW': '相當於地球公轉週期',
            }
        if (T < 5000)
            return {
                ko: '목성의 공전주기 정도야',
                en: 'Like Jupiter orbital period',
                ja: '木星の公転周期程度だよ',
                es: 'Como el período orbital de Júpiter',
                pt: 'Como o período orbital de Júpiter',
                'zh-CN': '相当于木星公转周期',
                'zh-TW': '相當於木星公轉週期',
            }
        return {
            ko: '외행성급 긴 공전주기!',
            en: 'Outer planet level long period!',
            ja: '外惑星級の長い公転周期！',
            es: '¡Período largo nivel planeta exterior!',
            pt: 'Período longo nível planeta exterior!',
            'zh-CN': '外行星级别的长公转周期！',
            'zh-TW': '外行星級別的長公轉週期！',
        }
    },
    discoveries: [
        {
            id: 'moon-orbit',
            mission: {
                ko: '지구-달 값 (M=5.97, r=384)을 설정해봐!',
                en: 'Set Earth-Moon values (M=5.97, r=384)!',
                ja: '地球-月の値（M=5.97, r=384）を設定してみて！',
                es: '¡Establece los valores Tierra-Luna (M=5.97, r=384)!',
                pt: 'Defina os valores Terra-Lua (M=5.97, r=384)!',
                'zh-CN': '设置地月值（M=5.97, r=384）！',
                'zh-TW': '設置地月值（M=5.97, r=384）！',
            },
            result: {
                ko: '달의 공전주기는 약 27일! 한 달(month)이라는 단어가 여기서 왔어.',
                en: 'Moon orbital period is about 27 days! The word month comes from Moon.',
                ja: '月の公転周期は約27日！「month（月）」という言葉はここから来たんだよ。',
                es: '¡El período orbital de la Luna es unos 27 días! La palabra mes viene de Luna.',
                pt: 'O período orbital da Lua é cerca de 27 dias! A palavra mês vem de Lua.',
                'zh-CN': '月球公转周期约27天！"月"这个词就是这样来的。',
                'zh-TW': '月球公轉週期約27天！「月」這個詞就是這樣來的。',
            },
            icon: '🌙',
            condition: (vars) =>
                vars['M'] >= 5 && vars['M'] <= 7 && vars['r'] >= 350 && vars['r'] <= 420,
        },
        {
            id: 'far-orbit',
            mission: {
                ko: '궤도 반지름 r을 5000 이상으로 늘려봐!',
                en: 'Extend orbital radius r above 5000!',
                ja: '軌道半径rを5000以上に伸ばしてみて！',
                es: '¡Aumenta el radio orbital r por encima de 5000!',
                pt: 'Aumente o raio orbital r acima de 5000!',
                'zh-CN': '将轨道半径r增加到5000以上！',
                'zh-TW': '將軌道半徑r增加到5000以上！',
            },
            result: {
                ko: '멀리 있을수록 공전주기가 훨씬 길어져! 명왕성은 248년이나 걸려.',
                en: 'Farther away means much longer orbital period! Pluto takes 248 years.',
                ja: '遠いほど公転周期がずっと長くなる！冥王星は248年もかかるよ。',
                es: '¡Más lejos significa período orbital mucho más largo! Plutón tarda 248 años.',
                pt: 'Mais longe significa período orbital muito mais longo! Plutão leva 248 anos.',
                'zh-CN': '距离越远，公转周期越长！冥王星需要248年。',
                'zh-TW': '距離越遠，公轉週期越長！冥王星需要248年。',
            },
            icon: '🪐',
            condition: (vars) => vars['r'] >= 5000,
        },
    ],
}
