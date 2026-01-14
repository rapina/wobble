import { Formula } from './types'
import { colors } from '../styles/colors'

export const doppler: Formula = {
    id: 'doppler',
    name: '도플러 효과',
    nameEn: 'Doppler Effect',
    expression: "f' = f(v/(v-vₛ))",
    description: '음원이 다가오면 높은 음, 멀어지면 낮은 음으로 들린다',
    descriptionEn:
        'Sound pitch increases when source approaches, decreases when it recedes',
    simulationHint: '음원 속도에 따라 파장이 압축되거나 늘어나는 것을 관찰하세요',
    simulationHintEn: 'Watch how wavelength compresses or stretches with source velocity',
    applications: [
        '구급차 사이렌 - 다가올 때 높은 음, 멀어질 때 낮은 음',
        '레이더 속도 측정 - 경찰 과속 단속',
        '천문학 적색편이 - 우주 팽창 증거',
        '의료 초음파 - 혈류 속도 측정',
    ],
    applicationsEn: [
        'Ambulance siren - higher pitch approaching, lower receding',
        'Radar speed guns - police speed enforcement',
        'Astronomical redshift - evidence of universe expansion',
        'Medical ultrasound - measuring blood flow velocity',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'f',
            name: '원래 진동수',
            nameEn: 'Original frequency',
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
            name: '파동 속도',
            nameEn: 'Wave speed',
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
            name: '음원 속도',
            nameEn: 'Source velocity',
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
            name: '관측 진동수',
            nameEn: 'Observed frequency',
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
            mission: 'vₛ를 양수로 해서 다가오는 음원 효과를 봐',
            missionEn: 'Set positive vₛ to see approaching source effect',
            result: '다가오면 파장이 압축되어 높은 음이 들려!',
            resultEn: 'Approaching compresses wavelength - higher pitch!',
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
            mission: 'vₛ를 음수로 해서 멀어지는 음원 효과를 봐',
            missionEn: 'Set negative vₛ to see receding source effect',
            result: '멀어지면 파장이 늘어나 낮은 음이 들려!',
            resultEn: 'Receding stretches wavelength - lower pitch!',
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
            mission: 'vₛ를 음속(v)에 가깝게 올려봐',
            missionEn: 'Raise vₛ close to wave speed (v)',
            result: '음속에 가까워지면 진동수가 급격히 증가! 소닉붐의 원리!',
            resultEn: 'Near sonic speed, frequency spikes! This causes sonic booms!',
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
            }
        }
        if (ratio < 0.7) {
            return {
                ko: `진동수가 ${((1 - ratio) * 100).toFixed(0)}% 낮아졌어요! 멀어지는 기차 소리처럼!`,
                en: `Frequency decreased by ${((1 - ratio) * 100).toFixed(0)}%! Like a receding train!`,
            }
        }
        return {
            ko: `도플러 효과로 빛의 적색편이를 관측해 우주가 팽창한다는 걸 알았어요!`,
            en: `Doppler redshift of light proved the universe is expanding!`,
        }
    },
}
