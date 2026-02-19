import { Formula } from './types'
import { colors } from '../styles/colors'

export const standingWave: Formula = {
    id: 'standing-wave',
    name: {
        ko: '정상파',
        en: 'Standing Wave',
        ja: '定常波',
        es: 'Onda Estacionaria',
        pt: 'Onda Estacionária',
        'zh-CN': '驻波',
        'zh-TW': '駐波',
    },
    expression: 'L = nλ/2',
    description: {
        ko: '양 끝이 고정된 줄에서 정상파가 형성될 때, 줄의 길이는 반파장의 정수배이다',
        en: 'For a standing wave on a fixed string, length equals integer multiples of half-wavelength',
        ja: '両端が固定された弦で定常波が形成されるとき、弦の長さは半波長の整数倍',
        es: 'Para una onda estacionaria en una cuerda fija, la longitud es igual a múltiplos enteros de media longitud de onda',
        pt: 'Para uma onda estacionária em uma corda fixa, o comprimento é igual a múltiplos inteiros de meio comprimento de onda',
        'zh-CN': '在两端固定的弦上形成驻波时，弦长等于半波长的整数倍',
        'zh-TW': '在兩端固定的弦上形成駐波時，弦長等於半波長的整數倍',
    },
    simulationHint: {
        ko: '양 끝이 고정된 줄에서 정상파가 진동하는 모습',
        en: 'Shows standing wave patterns vibrating on a string fixed at both ends',
        ja: '両端固定の弦で定常波が振動する様子',
        es: 'Muestra patrones de ondas estacionarias vibrando en una cuerda fija en ambos extremos',
        pt: 'Mostra padrões de ondas estacionárias vibrando em uma corda fixa em ambas as extremidades',
        'zh-CN': '显示两端固定的弦上驻波振动的样子',
        'zh-TW': '顯示兩端固定的弦上駐波振動的樣子',
    },
    applications: {
        ko: [
            '기타와 바이올린 현의 음높이',
            '관악기의 공명',
            '전자레인지 내부 파동',
            '다리와 건물의 공진 방지 설계',
        ],
        en: [
            'Pitch of guitar and violin strings',
            'Resonance in wind instruments',
            'Microwave oven internal waves',
            'Preventing resonance in bridges and buildings',
        ],
        ja: [
            'ギターやバイオリンの弦の音程',
            '管楽器の共鳴',
            '電子レンジ内部の電波',
            '橋や建物の共振防止設計',
        ],
        es: [
            'Tono de las cuerdas de guitarra y violín',
            'Resonancia en instrumentos de viento',
            'Ondas internas del microondas',
            'Prevención de resonancia en puentes y edificios',
        ],
        pt: [
            'Tom das cordas de violão e violino',
            'Ressonância em instrumentos de sopro',
            'Ondas internas do micro-ondas',
            'Prevenção de ressonância em pontes e edifícios',
        ],
        'zh-CN': [
            '吉他和小提琴弦的音高',
            '管乐器的共鸣',
            '微波炉内部的波',
            '桥梁和建筑物的防共振设计',
        ],
        'zh-TW': [
            '吉他和小提琴弦的音高',
            '管樂器的共鳴',
            '微波爐內部的波',
            '橋樑和建築物的防共振設計',
        ],
    },
    category: 'wave',
    variables: [
        {
            symbol: 'L',
            name: {
                ko: '줄의 길이',
                en: 'String Length',
                ja: '弦の長さ',
                es: 'Longitud de la Cuerda',
                pt: 'Comprimento da Corda',
                'zh-CN': '弦长',
                'zh-TW': '弦長',
            },
            role: 'input',
            unit: 'm',
            range: [0.5, 2],
            default: 1,
            visual: {
                property: 'size',
                scale: (value: number) => value,
                color: colors.distance,
            },
        },
        {
            symbol: 'n',
            name: {
                ko: '배음 차수',
                en: 'Harmonic Number',
                ja: '倍音次数',
                es: 'Número Armónico',
                pt: 'Número Harmônico',
                'zh-CN': '谐波次数',
                'zh-TW': '諧波次數',
            },
            role: 'input',
            unit: '',
            range: [1, 5],
            default: 1,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.velocity,
            },
        },
        {
            symbol: 'λ',
            name: {
                ko: '파장',
                en: 'Wavelength',
                ja: '波長',
                es: 'Longitud de Onda',
                pt: 'Comprimento de Onda',
                'zh-CN': '波长',
                'zh-TW': '波長',
            },
            role: 'output',
            unit: 'm',
            range: [0.2, 4],
            default: 2,
            visual: {
                property: 'stretch',
                scale: (value: number) => value,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const L = inputs['L'] ?? 1
        const n = Math.round(inputs['n'] ?? 1)
        // L = nλ/2 → λ = 2L/n
        const lambda = (2 * L) / n
        return { λ: lambda }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const L = inputs['L'] ?? 1
        const n = Math.round(inputs['n'] ?? 1)
        const lambda = (2 * L) / n
        return `λ = 2 × ${L.toFixed(2)} ÷ ${n} = ${lambda.toFixed(2)} m`
    },
    layout: {
        type: 'linear',
        connections: [{ from: 'L', to: 'λ', operator: '×' }],
    },
    displayLayout: {
        type: 'custom',
        output: 'λ',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'text', value: '2' },
                    { type: 'var', symbol: 'L' },
                ],
                denominator: [{ type: 'var', symbol: 'n' }],
            },
        ],
    },
    getInsight: (vars) => {
        const lambda = vars['λ']
        const n = Math.round(vars['n'] ?? 1)
        if (n === 1)
            return {
                ko: '기본 진동수! 가장 낮은 음이야',
                en: 'Fundamental frequency! The lowest pitch',
                ja: '基本振動数！最も低い音',
                es: '¡Frecuencia fundamental! El tono más bajo',
                pt: 'Frequência fundamental! O tom mais baixo',
                'zh-CN': '基频！最低的音',
                'zh-TW': '基頻！最低的音',
            }
        if (n === 2)
            return {
                ko: '2배음! 한 옥타브 높은 음이야',
                en: '2nd harmonic! One octave higher',
                ja: '2倍音！1オクターブ高い音',
                es: '¡2do armónico! Una octava más alto',
                pt: '2º harmônico! Uma oitava acima',
                'zh-CN': '二次谐波！高一个八度',
                'zh-TW': '二次諧波！高一個八度',
            }
        if (n === 3)
            return {
                ko: '3배음! 풍부한 음색을 만들어',
                en: '3rd harmonic! Creates rich timbre',
                ja: '3倍音！豊かな音色を作る',
                es: '¡3er armónico! Crea un timbre rico',
                pt: '3º harmônico! Cria timbre rico',
                'zh-CN': '三次谐波！产生丰富的音色',
                'zh-TW': '三次諧波！產生豐富的音色',
            }
        if (lambda < 0.5)
            return {
                ko: '짧은 파장의 높은 음이야',
                en: 'Short wavelength, high pitch',
                ja: '短い波長の高い音',
                es: 'Longitud de onda corta, tono alto',
                pt: 'Comprimento de onda curto, tom alto',
                'zh-CN': '短波长，高音',
                'zh-TW': '短波長，高音',
            }
        if (lambda < 1)
            return {
                ko: '기타 줄 정도의 파장이야',
                en: 'Wavelength like a guitar string',
                ja: 'ギター弦程度の波長',
                es: 'Longitud de onda como cuerda de guitarra',
                pt: 'Comprimento de onda como corda de violão',
                'zh-CN': '像吉他弦的波长',
                'zh-TW': '像吉他弦的波長',
            }
        return {
            ko: '긴 파장의 낮은 음이야',
            en: 'Long wavelength, low pitch',
            ja: '長い波長の低い音',
            es: 'Longitud de onda larga, tono bajo',
            pt: 'Comprimento de onda longo, tom baixo',
            'zh-CN': '长波长，低音',
            'zh-TW': '長波長，低音',
        }
    },
    discoveries: [
        {
            id: 'fundamental',
            mission: {
                ko: '배음 차수 n을 1로 설정해봐! (기본진동)',
                en: 'Set harmonic number n to 1! (fundamental)',
                ja: '倍音次数nを1に設定してみて！（基本振動）',
                es: '¡Configura el número armónico n en 1! (fundamental)',
                pt: 'Configure o número harmônico n para 1! (fundamental)',
                'zh-CN': '将谐波次数n设为1！（基频）',
                'zh-TW': '將諧波次數n設為1！（基頻）',
            },
            result: {
                ko: '기본진동은 가장 낮은 음! 기타 줄의 가장 낮은 소리가 이거야.',
                en: 'The fundamental is the lowest pitch! This is the deepest sound a guitar string makes.',
                ja: '基本振動は最も低い音！ギター弦の一番低い音がこれだよ。',
                es: '¡El fundamental es el tono más bajo! Este es el sonido más grave que hace una cuerda de guitarra.',
                pt: 'O fundamental é o tom mais baixo! Este é o som mais grave que uma corda de violão produz.',
                'zh-CN': '基频是最低的音！这是吉他弦能发出的最低沉的声音。',
                'zh-TW': '基頻是最低的音！這是吉他弦能發出的最低沉的聲音。',
            },
            icon: '🎸',
            condition: (vars) => Math.round(vars['n']) === 1,
        },
        {
            id: 'harmonics',
            mission: {
                ko: '배음 차수 n을 4 이상으로 올려봐!',
                en: 'Raise harmonic number n above 4!',
                ja: '倍音次数nを4以上に上げてみて！',
                es: '¡Sube el número armónico n por encima de 4!',
                pt: 'Aumente o número harmônico n acima de 4!',
                'zh-CN': '把谐波次数n提高到4以上！',
                'zh-TW': '把諧波次數n提高到4以上！',
            },
            result: {
                ko: '높은 배음은 파장이 짧고 음이 높아! 하모닉스로 다양한 음색을 만들어.',
                en: 'Higher harmonics have shorter wavelengths and higher pitch! Harmonics create rich tones.',
                ja: '高い倍音は波長が短く音が高い！ハーモニクスで様々な音色を作る。',
                es: '¡Los armónicos más altos tienen longitudes de onda más cortas y tonos más altos! Los armónicos crean tonos ricos.',
                pt: 'Harmônicos mais altos têm comprimentos de onda mais curtos e tons mais altos! Harmônicos criam tons ricos.',
                'zh-CN': '高次谐波波长短、音调高！泛音可以创造丰富的音色。',
                'zh-TW': '高次諧波波長短、音調高！泛音可以創造豐富的音色。',
            },
            icon: '🎻',
            condition: (vars) => Math.round(vars['n']) >= 4,
        },
    ],
}
