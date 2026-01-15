import { Formula } from './types'
import { colors } from '../styles/colors'

export const reflection: Formula = {
    id: 'reflection',
    name: { ko: '반사의 법칙', en: 'Law of Reflection', ja: '反射の法則' },
    expression: 'θᵢ = θᵣ',
    description: {
        ko: '빛이 표면에서 반사될 때 입사각과 반사각은 같다',
        en: 'When light reflects off a surface, angle of incidence equals angle of reflection',
        ja: '光が表面で反射するとき、入射角と反射角は等しい',
    },
    simulationHint: {
        ko: '빛이 거울 면에서 같은 각도로 반사되는 모습',
        en: 'Shows light reflecting off a mirror at equal angles',
        ja: '光が鏡面で同じ角度で反射する様子',
    },
    applications: {
        ko: [
            '거울에 비친 내 모습',
            '자동차 백미러와 사이드미러',
            '레이저 반사경과 광학 장비',
            '건물 유리창에 비친 풍경',
        ],
        en: [
            'Seeing your reflection in a mirror',
            'Car rearview and side mirrors',
            'Laser reflectors and optical equipment',
            'Scenery reflected in building windows',
        ],
        ja: [
            '鏡に映る自分の姿',
            '車のバックミラーとサイドミラー',
            'レーザー反射鏡と光学機器',
            'ビルの窓に映る風景',
        ],
    },
    category: 'wave',
    variables: [
        {
            symbol: 'θᵢ',
            name: { ko: '입사각', en: 'Angle of Incidence', ja: '入射角' },
            role: 'input',
            unit: '°',
            range: [0, 85],
            default: 45,
            visual: {
                property: 'distance',
                scale: (value: number) => value,
                color: colors.velocity,
            },
        },
        {
            symbol: 'θᵣ',
            name: { ko: '반사각', en: 'Angle of Reflection', ja: '反射角' },
            role: 'output',
            unit: '°',
            range: [0, 85],
            default: 45,
            visual: {
                property: 'distance',
                scale: (value: number) => value,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const thetaI = inputs['θᵢ'] ?? 45
        return {
            θᵣ: thetaI,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const thetaI = inputs['θᵢ'] ?? 45
        return `θᵣ = θᵢ = ${thetaI.toFixed(1)}°`
    },
    layout: {
        type: 'linear',
        connections: [{ from: 'θᵢ', to: 'θᵣ', operator: '=' }],
    },
    displayLayout: {
        type: 'custom',
        output: 'θᵣ',
        expression: [{ type: 'var', symbol: 'θᵢ' }],
    },
    getInsight: (vars) => {
        const theta = vars['θᵣ']
        if (theta < 10)
            return {
                ko: '거의 수직으로 반사되는 빛이야',
                en: 'Light reflecting almost straight back',
                ja: 'ほぼ垂直に反射する光',
            }
        if (theta < 30)
            return {
                ko: '거울을 약간 기울인 반사야',
                en: 'Mirror tilted slightly',
                ja: '鏡を少し傾けた反射',
            }
        if (theta < 50)
            return {
                ko: '일반적인 거울 반사각이야',
                en: 'Typical mirror reflection angle',
                ja: '一般的な鏡の反射角',
            }
        if (theta < 70)
            return {
                ko: '비스듬히 반사되는 빛이야',
                en: 'Light reflecting at an angle',
                ja: '斜めに反射する光',
            }
        return {
            ko: '수면에서 반짝이는 빛처럼 스치듯 반사!',
            en: 'Grazing reflection like light sparkling on water!',
            ja: '水面でキラキラ光るように掠めて反射！',
        }
    },
    discoveries: [
        {
            id: 'grazing-angle',
            mission: {
                ko: '입사각 θᵢ를 80° 이상으로 올려봐!',
                en: 'Raise angle of incidence above 80 degrees!',
                ja: '入射角θᵢを80°以上に上げてみて！',
            },
            result: {
                ko: '스치듯 들어오는 빛도 같은 각도로 반사! 호수 표면이 반짝이는 이유야.',
                en: 'Even grazing light reflects at equal angle! This is why lake surfaces sparkle.',
                ja: '掠めるように入る光も同じ角度で反射！湖面がキラキラ輝く理由だよ。',
            },
            icon: '✨',
            condition: (vars) => vars['θᵢ'] >= 80,
        },
        {
            id: 'perpendicular',
            mission: {
                ko: '입사각 θᵢ를 5° 이하로 낮춰봐!',
                en: 'Lower angle of incidence below 5 degrees!',
                ja: '入射角θᵢを5°以下に下げてみて！',
            },
            result: {
                ko: '수직으로 들어오면 수직으로 반사! 거울을 정면으로 볼 때 내 얼굴이 보이는 이유야.',
                en: 'Perpendicular in means perpendicular out! Why you see your face looking straight at a mirror.',
                ja: '垂直に入れば垂直に反射！鏡を正面から見ると自分の顔が見える理由だよ。',
            },
            icon: '🪞',
            condition: (vars) => vars['θᵢ'] <= 5,
        },
    ],
}
