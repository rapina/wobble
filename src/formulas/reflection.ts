import { Formula } from './types'
import { colors } from '../styles/colors'

export const reflection: Formula = {
    id: 'reflection',
    name: '반사의 법칙',
    nameEn: 'Law of Reflection',
    expression: 'θᵢ = θᵣ',
    description: '빛이 표면에서 반사될 때 입사각과 반사각은 같다',
    descriptionEn:
        'When light reflects off a surface, angle of incidence equals angle of reflection',
    simulationHint: '빛이 거울 면에서 같은 각도로 반사되는 모습',
    simulationHintEn: 'Shows light reflecting off a mirror at equal angles',
    applications: [
        '거울에 비친 내 모습',
        '자동차 백미러와 사이드미러',
        '레이저 반사경과 광학 장비',
        '건물 유리창에 비친 풍경',
    ],
    applicationsEn: [
        'Seeing your reflection in a mirror',
        'Car rearview and side mirrors',
        'Laser reflectors and optical equipment',
        'Scenery reflected in building windows',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'θᵢ',
            name: '입사각',
            nameEn: 'Angle of Incidence',
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
            name: '반사각',
            nameEn: 'Angle of Reflection',
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
        if (theta < 10) return { ko: '거의 수직으로 반사되는 빛이야', en: 'Light reflecting almost straight back' }
        if (theta < 30) return { ko: '거울을 약간 기울인 반사야', en: 'Mirror tilted slightly' }
        if (theta < 50) return { ko: '일반적인 거울 반사각이야', en: 'Typical mirror reflection angle' }
        if (theta < 70) return { ko: '비스듬히 반사되는 빛이야', en: 'Light reflecting at an angle' }
        return { ko: '수면에서 반짝이는 빛처럼 스치듯 반사!', en: 'Grazing reflection like light sparkling on water!' }
    },
    discoveries: [
        {
            id: 'grazing-angle',
            mission: '입사각 θᵢ를 80° 이상으로 올려봐!',
            missionEn: 'Raise angle of incidence above 80 degrees!',
            result: '스치듯 들어오는 빛도 같은 각도로 반사! 호수 표면이 반짝이는 이유야.',
            resultEn: 'Even grazing light reflects at equal angle! This is why lake surfaces sparkle.',
            icon: '✨',
            condition: (vars) => vars['θᵢ'] >= 80,
        },
        {
            id: 'perpendicular',
            mission: '입사각 θᵢ를 5° 이하로 낮춰봐!',
            missionEn: 'Lower angle of incidence below 5 degrees!',
            result: '수직으로 들어오면 수직으로 반사! 거울을 정면으로 볼 때 내 얼굴이 보이는 이유야.',
            resultEn: 'Perpendicular in means perpendicular out! Why you see your face looking straight at a mirror.',
            icon: '🪞',
            condition: (vars) => vars['θᵢ'] <= 5,
        },
    ],
}
