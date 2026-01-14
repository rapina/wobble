import { Formula } from './types'
import { colors } from '../styles/colors'

export const wien: Formula = {
    id: 'wien',
    name: '빈의 변위 법칙',
    nameEn: "Wien's Displacement Law",
    expression: 'λmax = b/T',
    description: '흑체 복사의 최대 파장은 온도에 반비례한다',
    descriptionEn:
        'Peak wavelength of blackbody radiation is inversely proportional to temperature',
    simulationHint: '온도가 높아질수록 물체의 색이 빨강에서 파랑으로 변하는 모습',
    simulationHintEn: 'Shows object color shifting from red to blue as temperature increases',
    applications: [
        '별의 색깔로 표면 온도 측정',
        '적외선 열화상 카메라 설계',
        '용광로의 온도 측정',
        '태양과 다른 별들의 분류',
    ],
    applicationsEn: [
        'Measuring star surface temperature by color',
        'Designing infrared thermal cameras',
        'Measuring furnace temperature',
        'Classification of the Sun and other stars',
    ],
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'T',
            name: '온도',
            nameEn: 'Temperature',
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
            name: '최대 파장',
            nameEn: 'Peak Wavelength',
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
        if (lambda < 400) return { ko: '자외선 영역! 파란 별이야', en: 'Ultraviolet region! A blue star' }
        if (lambda < 500) return { ko: '파란색 가시광선! 뜨거운 별이야', en: 'Blue visible light! A hot star' }
        if (lambda < 600) return { ko: '노란색! 태양과 비슷한 온도야', en: 'Yellow! Similar temperature to the Sun' }
        if (lambda < 700) return { ko: '주황~빨간색! 차가운 별이야', en: 'Orange-red! A cool star' }
        if (lambda < 1000) return { ko: '적외선 영역! 적색왜성이야', en: 'Infrared region! A red dwarf' }
        return { ko: '먼 적외선! 매우 차가운 천체야', en: 'Far infrared! A very cold object' }
    },
    discoveries: [
        {
            id: 'sun-temperature',
            mission: '온도 T를 5800K로 설정해봐! (태양 표면)',
            missionEn: 'Set temperature T to 5800K! (Sun surface)',
            result: '태양의 최대 파장은 약 500nm, 녹색-노란색! 태양이 노랗게 보이는 이유야.',
            resultEn: 'Sun peaks at 500nm, green-yellow! This is why the Sun appears yellow.',
            icon: '☀️',
            condition: (vars) => vars['T'] >= 5600 && vars['T'] <= 6000,
        },
        {
            id: 'hot-star',
            mission: '온도 T를 10000K 이상으로 올려봐!',
            missionEn: 'Raise temperature T above 10000K!',
            result: '뜨거운 별은 파란색! 파장이 짧아서 푸르게 보여. 리겔이나 시리우스 같은 별이야.',
            resultEn: 'Hot stars are blue! Short wavelengths appear blue. Like Rigel or Sirius.',
            icon: '💙',
            condition: (vars) => vars['T'] >= 10000,
        },
    ],
}
