import { Formula } from './types'
import { colors } from '../styles/colors'

export const doppler: Formula = {
    id: 'doppler',
    name: {
        ko: '도플러 효과',
        en: 'Doppler Effect',
        ja: 'ドップラー効果',
        es: 'Efecto Doppler',
        pt: 'Efeito Doppler',
        'zh-CN': '多普勒效应',
        'zh-TW': '都卜勒效應',
    },
    expression: "f' = f(v/(v-vₛ))",
    description: {
        ko: '음원이 다가오면 높은 음, 멀어지면 낮은 음으로 들린다',
        en: 'Sound pitch increases when source approaches, decreases when it recedes',
        ja: '音源が近づくと高い音、遠ざかると低い音に聞こえる',
        es: 'El tono del sonido aumenta cuando la fuente se acerca, disminuye cuando se aleja',
        pt: 'O tom do som aumenta quando a fonte se aproxima, diminui quando se afasta',
        'zh-CN': '声源靠近时音调升高，远离时音调降低',
        'zh-TW': '聲源靠近時音調升高，遠離時音調降低',
    },
    simulationHint: {
        ko: '음원 속도에 따라 파장이 압축되거나 늘어나는 것을 관찰하세요',
        en: 'Watch how wavelength compresses or stretches with source velocity',
        ja: '音源速度に応じて波長が圧縮または伸張する様子を観察',
        es: 'Observa cómo la longitud de onda se comprime o estira con la velocidad de la fuente',
        pt: 'Observe como o comprimento de onda comprime ou estica com a velocidade da fonte',
        'zh-CN': '观察波长如何随声源速度压缩或拉伸',
        'zh-TW': '觀察波長如何隨聲源速度壓縮或拉伸',
    },
    applications: {
        ko: [
            '구급차 사이렌 - 다가올 때 높은 음, 멀어질 때 낮은 음',
            '레이더 속도 측정 - 경찰 과속 단속',
            '천문학 적색편이 - 우주 팽창 증거',
            '의료 초음파 - 혈류 속도 측정',
        ],
        en: [
            'Ambulance siren - higher pitch approaching, lower receding',
            'Radar speed guns - police speed enforcement',
            'Astronomical redshift - evidence of universe expansion',
            'Medical ultrasound - measuring blood flow velocity',
        ],
        ja: [
            '救急車のサイレン - 近づくと高い音、遠ざかると低い音',
            'レーダー速度計 - 警察のスピード取り締まり',
            '天文学の赤方偏移 - 宇宙膨張の証拠',
            '医療用超音波 - 血流速度測定',
        ],
        es: [
            'Sirena de ambulancia - tono más alto al acercarse, más bajo al alejarse',
            'Pistolas de radar - control de velocidad policial',
            'Corrimiento al rojo astronómico - evidencia de expansión del universo',
            'Ultrasonido médico - medición de velocidad del flujo sanguíneo',
        ],
        pt: [
            'Sirene de ambulância - tom mais alto ao se aproximar, mais baixo ao se afastar',
            'Radares de velocidade - fiscalização policial',
            'Desvio para o vermelho astronômico - evidência da expansão do universo',
            'Ultrassom médico - medição da velocidade do fluxo sanguíneo',
        ],
        'zh-CN': [
            '救护车警报 - 靠近时音调高，远离时音调低',
            '雷达测速枪 - 警察测速执法',
            '天文红移 - 宇宙膨胀的证据',
            '医用超声波 - 测量血流速度',
        ],
        'zh-TW': [
            '救護車警報 - 靠近時音調高，遠離時音調低',
            '雷達測速槍 - 警察測速執法',
            '天文紅移 - 宇宙膨脹的證據',
            '醫用超聲波 - 測量血流速度',
        ],
    },
    category: 'wave',
    variables: [
        {
            symbol: 'f',
            name: {
                ko: '원래 진동수',
                en: 'Original frequency',
                ja: '元の振動数',
                es: 'Frecuencia original',
                pt: 'Frequência original',
                'zh-CN': '原始频率',
                'zh-TW': '原始頻率',
            },
            role: 'input',
            unit: 'Hz',
            range: [100, 500],
            default: 300,
            visual: {
                property: 'oscillate',
                scale: (v) => v / 100,
                color: colors.wavelength,
            },
        },
        {
            symbol: 'v',
            name: {
                ko: '파동 속도',
                en: 'Wave speed',
                ja: '波動速度',
                es: 'Velocidad de onda',
                pt: 'Velocidade da onda',
                'zh-CN': '波速',
                'zh-TW': '波速',
            },
            role: 'input',
            unit: 'm/s',
            range: [300, 400],
            default: 340,
            visual: {
                property: 'speed',
                scale: (v) => v / 100,
                color: colors.velocity,
            },
        },
        {
            symbol: 'vₛ',
            name: {
                ko: '음원 속도',
                en: 'Source velocity',
                ja: '音源速度',
                es: 'Velocidad de la fuente',
                pt: 'Velocidade da fonte',
                'zh-CN': '声源速度',
                'zh-TW': '聲源速度',
            },
            role: 'input',
            unit: 'm/s',
            range: [-100, 100],
            default: 30,
            visual: {
                property: 'speed',
                scale: (v) => Math.abs(v) / 20,
                color: colors.force,
            },
        },
        {
            symbol: "f'",
            name: {
                ko: '관측 진동수',
                en: 'Observed frequency',
                ja: '観測振動数',
                es: 'Frecuencia observada',
                pt: 'Frequência observada',
                'zh-CN': '观测频率',
                'zh-TW': '觀測頻率',
            },
            role: 'output',
            unit: 'Hz',
            range: [50, 1000],
            default: 329,
            visual: {
                property: 'oscillate',
                scale: (v) => v / 100,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs) => {
        const f = inputs['f'] || 300
        const v = inputs['v'] || 340
        const vs = inputs['vₛ'] || 30
        // f' = f * v / (v - vs) for approaching source
        const fPrime = f * (v / (v - vs))
        return { "f'": Math.round(fPrime) }
    },
    formatCalculation: (inputs) => {
        const f = inputs['f'] || 300
        const v = inputs['v'] || 340
        const vs = inputs['vₛ'] || 30
        const fPrime = f * (v / (v - vs))
        return `f' = ${f} × (${v}/(${v}-${vs})) = ${Math.round(fPrime)} Hz`
    },
    layout: {
        type: 'wave',
        connections: [
            { from: 'f', to: "f'", operator: '×' },
            { from: 'v', to: "f'", operator: '÷' },
            { from: 'vₛ', to: "f'", operator: '-' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: "f'",
        expression: [
            { type: 'var', symbol: 'f' },
            { type: 'op', value: '×' },
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'v' }],
                denominator: [
                    { type: 'var', symbol: 'v' },
                    { type: 'op', value: '-' },
                    { type: 'var', symbol: 'vₛ' },
                ],
            },
        ],
    },
    discoveries: [
        {
            id: 'approaching',
            mission: {
                ko: 'vₛ를 양수로 해서 다가오는 음원 효과를 봐',
                en: 'Set positive vₛ to see approaching source effect',
                ja: 'vₛを正にして近づく音源効果を見よう',
                es: 'Pon vₛ positivo para ver el efecto de fuente que se acerca',
                pt: 'Defina vₛ positivo para ver o efeito de fonte se aproximando',
                'zh-CN': '将vₛ设为正值，观察靠近的声源效果',
                'zh-TW': '將vₛ設為正值，觀察靠近的聲源效果',
            },
            result: {
                ko: '다가오면 파장이 압축되어 높은 음이 들려!',
                en: 'Approaching compresses wavelength - higher pitch!',
                ja: '近づくと波長が圧縮されて高い音が聞こえる！',
                es: '¡Al acercarse se comprime la longitud de onda - tono más alto!',
                pt: 'Ao se aproximar, o comprimento de onda comprime - tom mais alto!',
                'zh-CN': '靠近时波长被压缩 - 音调变高！',
                'zh-TW': '靠近時波長被壓縮 - 音調變高！',
            },
            icon: '🚑',
            condition: (vars) => {
                const vs = vars['vₛ'] || 0
                const f = vars['f'] || 300
                const fPrime = vars["f'"] || 300
                return vs > 50 && fPrime > f * 1.2
            },
        },
        {
            id: 'receding',
            mission: {
                ko: 'vₛ를 음수로 해서 멀어지는 음원 효과를 봐',
                en: 'Set negative vₛ to see receding source effect',
                ja: 'vₛを負にして遠ざかる音源効果を見よう',
                es: 'Pon vₛ negativo para ver el efecto de fuente que se aleja',
                pt: 'Defina vₛ negativo para ver o efeito de fonte se afastando',
                'zh-CN': '将vₛ设为负值，观察远离的声源效果',
                'zh-TW': '將vₛ設為負值，觀察遠離的聲源效果',
            },
            result: {
                ko: '멀어지면 파장이 늘어나 낮은 음이 들려!',
                en: 'Receding stretches wavelength - lower pitch!',
                ja: '遠ざかると波長が伸びて低い音が聞こえる！',
                es: '¡Al alejarse se estira la longitud de onda - tono más bajo!',
                pt: 'Ao se afastar, o comprimento de onda estica - tom mais baixo!',
                'zh-CN': '远离时波长被拉伸 - 音调变低！',
                'zh-TW': '遠離時波長被拉伸 - 音調變低！',
            },
            icon: '📉',
            condition: (vars) => {
                const vs = vars['vₛ'] || 0
                const f = vars['f'] || 300
                const fPrime = vars["f'"] || 300
                return vs < -50 && fPrime < f * 0.8
            },
        },
        {
            id: 'sonic-boom',
            mission: {
                ko: 'vₛ를 음속(v)에 가깝게 올려봐',
                en: 'Raise vₛ close to wave speed (v)',
                ja: 'vₛを音速(v)に近づけてみよう',
                es: 'Aumenta vₛ cerca de la velocidad de onda (v)',
                pt: 'Aumente vₛ perto da velocidade da onda (v)',
                'zh-CN': '将vₛ提高到接近波速(v)',
                'zh-TW': '將vₛ提高到接近波速(v)',
            },
            result: {
                ko: '음속에 가까워지면 진동수가 급격히 증가! 소닉붐의 원리!',
                en: 'Near sonic speed, frequency spikes! This causes sonic booms!',
                ja: '音速に近づくと振動数が急上昇！ソニックブームの原理！',
                es: '¡Cerca de la velocidad del sonido, la frecuencia se dispara! ¡Esto causa estampidos sónicos!',
                pt: 'Perto da velocidade do som, a frequência dispara! Isso causa estrondos sônicos!',
                'zh-CN': '接近音速时频率急剧上升！这就是音爆的原理！',
                'zh-TW': '接近音速時頻率急劇上升！這就是音爆的原理！',
            },
            icon: '💥',
            condition: (vars) => {
                const v = vars['v'] || 340
                const vs = vars['vₛ'] || 0
                return vs > v * 0.8 && vs < v
            },
        },
    ],
    getInsight: (variables) => {
        const f = variables['f'] || 300
        const fPrime = variables["f'"] || 300
        const vs = variables['vₛ'] || 0

        const ratio = fPrime / f
        if (ratio > 1.5) {
            return {
                ko: `진동수가 ${((ratio - 1) * 100).toFixed(0)}% 높아졌어요! 구급차가 빠르게 다가오는 느낌!`,
                en: `Frequency increased by ${((ratio - 1) * 100).toFixed(0)}%! Like a fast approaching ambulance!`,
                ja: `振動数が${((ratio - 1) * 100).toFixed(0)}%高くなりました！救急車が速く近づく感じ！`,
                es: `¡La frecuencia aumentó ${((ratio - 1) * 100).toFixed(0)}%! ¡Como una ambulancia acercándose rápido!`,
                pt: `Frequência aumentou ${((ratio - 1) * 100).toFixed(0)}%! Como uma ambulância se aproximando rápido!`,
                'zh-CN': `频率增加了${((ratio - 1) * 100).toFixed(0)}%！就像救护车快速靠近的感觉！`,
                'zh-TW': `頻率增加了${((ratio - 1) * 100).toFixed(0)}%！就像救護車快速靠近的感覺！`,
            }
        }
        if (ratio < 0.7) {
            return {
                ko: `진동수가 ${((1 - ratio) * 100).toFixed(0)}% 낮아졌어요! 멀어지는 기차 소리처럼!`,
                en: `Frequency decreased by ${((1 - ratio) * 100).toFixed(0)}%! Like a receding train!`,
                ja: `振動数が${((1 - ratio) * 100).toFixed(0)}%低くなりました！遠ざかる電車の音のよう！`,
                es: `¡La frecuencia disminuyó ${((1 - ratio) * 100).toFixed(0)}%! ¡Como un tren alejándose!`,
                pt: `Frequência diminuiu ${((1 - ratio) * 100).toFixed(0)}%! Como um trem se afastando!`,
                'zh-CN': `频率降低了${((1 - ratio) * 100).toFixed(0)}%！就像火车远去的声音！`,
                'zh-TW': `頻率降低了${((1 - ratio) * 100).toFixed(0)}%！就像火車遠去的聲音！`,
            }
        }
        return {
            ko: `도플러 효과로 빛의 적색편이를 관측해 우주가 팽창한다는 걸 알았어요!`,
            en: `Doppler redshift of light proved the universe is expanding!`,
            ja: `ドップラー効果で光の赤方偏移を観測し、宇宙が膨張していることがわかりました！`,
            es: `¡El corrimiento al rojo Doppler de la luz demostró que el universo se está expandiendo!`,
            pt: `O desvio para o vermelho Doppler da luz provou que o universo está se expandindo!`,
            'zh-CN': `光的多普勒红移证明了宇宙正在膨胀！`,
            'zh-TW': `光的都卜勒紅移證明了宇宙正在膨脹！`,
        }
    },
}
