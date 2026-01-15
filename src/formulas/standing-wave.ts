import { Formula } from './types'
import { colors } from '../styles/colors'

export const standingWave: Formula = {
    id: 'standing-wave',
    name: { ko: '정상파', en: 'Standing Wave', ja: '定常波' },
    expression: 'L = nλ/2',
    description: {
        ko: '양 끝이 고정된 줄에서 정상파가 형성될 때, 줄의 길이는 반파장의 정수배이다',
        en: 'For a standing wave on a fixed string, length equals integer multiples of half-wavelength',
        ja: '両端が固定された弦で定常波が形成されるとき、弦の長さは半波長の整数倍',
    },
    simulationHint: {
        ko: '양 끝이 고정된 줄에서 정상파가 진동하는 모습',
        en: 'Shows standing wave patterns vibrating on a string fixed at both ends',
        ja: '両端固定の弦で定常波が振動する様子',
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
    },
    category: 'wave',
    variables: [
        {
            symbol: 'L',
            name: { ko: '줄의 길이', en: 'String Length', ja: '弦の長さ' },
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
            name: { ko: '배음 차수', en: 'Harmonic Number', ja: '倍音次数' },
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
            name: { ko: '파장', en: 'Wavelength', ja: '波長' },
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
        if (n === 1) return { ko: '기본 진동수! 가장 낮은 음이야', en: 'Fundamental frequency! The lowest pitch', ja: '基本振動数！最も低い音' }
        if (n === 2) return { ko: '2배음! 한 옥타브 높은 음이야', en: '2nd harmonic! One octave higher', ja: '2倍音！1オクターブ高い音' }
        if (n === 3) return { ko: '3배음! 풍부한 음색을 만들어', en: '3rd harmonic! Creates rich timbre', ja: '3倍音！豊かな音色を作る' }
        if (lambda < 0.5) return { ko: '짧은 파장의 높은 음이야', en: 'Short wavelength, high pitch', ja: '短い波長の高い音' }
        if (lambda < 1) return { ko: '기타 줄 정도의 파장이야', en: 'Wavelength like a guitar string', ja: 'ギター弦程度の波長' }
        return { ko: '긴 파장의 낮은 음이야', en: 'Long wavelength, low pitch', ja: '長い波長の低い音' }
    },
    discoveries: [
        {
            id: 'fundamental',
            mission: {
                ko: '배음 차수 n을 1로 설정해봐! (기본진동)',
                en: 'Set harmonic number n to 1! (fundamental)',
                ja: '倍音次数nを1に設定してみて！（基本振動）',
            },
            result: {
                ko: '기본진동은 가장 낮은 음! 기타 줄의 가장 낮은 소리가 이거야.',
                en: 'The fundamental is the lowest pitch! This is the deepest sound a guitar string makes.',
                ja: '基本振動は最も低い音！ギター弦の一番低い音がこれだよ。',
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
            },
            result: {
                ko: '높은 배음은 파장이 짧고 음이 높아! 하모닉스로 다양한 음색을 만들어.',
                en: 'Higher harmonics have shorter wavelengths and higher pitch! Harmonics create rich tones.',
                ja: '高い倍音は波長が短く音が高い！ハーモニクスで様々な音色を作る。',
            },
            icon: '🎻',
            condition: (vars) => Math.round(vars['n']) >= 4,
        },
    ],
}
