import { Formula } from './types'
import { colors } from '../styles/colors'

export const wien: Formula = {
    id: 'wien',
    name: { ko: '빈의 변위 법칙', en: "Wien's Displacement Law", ja: 'ウィーンの変位則' },
    expression: 'λmax = b/T',
    description: {
        ko: '흑체 복사의 최대 파장은 온도에 반비례한다',
        en: 'Peak wavelength of blackbody radiation is inversely proportional to temperature',
        ja: '黒体放射のピーク波長は温度に反比例する',
    },
    simulationHint: {
        ko: '온도가 높아질수록 물체의 색이 빨강에서 파랑으로 변하는 모습',
        en: 'Shows object color shifting from red to blue as temperature increases',
        ja: '温度が高くなるほど物体の色が赤から青に変わる様子',
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
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'T',
            name: { ko: '온도', en: 'Temperature', ja: '温度' },
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
            name: { ko: '최대 파장', en: 'Peak Wavelength', ja: 'ピーク波長' },
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
            }
        if (lambda < 500)
            return {
                ko: '파란색 가시광선! 뜨거운 별이야',
                en: 'Blue visible light! A hot star',
                ja: '青い可視光線！熱い星だよ',
            }
        if (lambda < 600)
            return {
                ko: '노란색! 태양과 비슷한 온도야',
                en: 'Yellow! Similar temperature to the Sun',
                ja: '黄色！太陽と同じくらいの温度だよ',
            }
        if (lambda < 700)
            return {
                ko: '주황~빨간색! 차가운 별이야',
                en: 'Orange-red! A cool star',
                ja: 'オレンジ〜赤！冷たい星だよ',
            }
        if (lambda < 1000)
            return {
                ko: '적외선 영역! 적색왜성이야',
                en: 'Infrared region! A red dwarf',
                ja: '赤外線領域！赤色矮星だよ',
            }
        return {
            ko: '먼 적외선! 매우 차가운 천체야',
            en: 'Far infrared! A very cold object',
            ja: '遠赤外線！とても冷たい天体だよ',
        }
    },
    discoveries: [
        {
            id: 'sun-temperature',
            mission: {
                ko: '온도 T를 5800K로 설정해봐! (태양 표면)',
                en: 'Set temperature T to 5800K! (Sun surface)',
                ja: '温度Tを5800Kに設定してみて！（太陽表面）',
            },
            result: {
                ko: '태양의 최대 파장은 약 500nm, 녹색-노란색! 태양이 노랗게 보이는 이유야.',
                en: 'Sun peaks at 500nm, green-yellow! This is why the Sun appears yellow.',
                ja: '太陽のピーク波長は約500nm、緑〜黄色！太陽が黄色く見える理由だよ。',
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
            },
            result: {
                ko: '뜨거운 별은 파란색! 파장이 짧아서 푸르게 보여. 리겔이나 시리우스 같은 별이야.',
                en: 'Hot stars are blue! Short wavelengths appear blue. Like Rigel or Sirius.',
                ja: '熱い星は青い！波長が短いから青く見える。リゲルやシリウスみたいな星だよ。',
            },
            icon: '💙',
            condition: (vars) => vars['T'] >= 10000,
        },
    ],
}
