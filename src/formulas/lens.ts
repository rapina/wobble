import { Formula } from './types'
import { colors } from '../styles/colors'

export const lens: Formula = {
    id: 'lens',
    name: '렌즈 공식',
    nameEn: 'Thin Lens Equation',
    expression: '1/f = 1/a + 1/b',
    description: '렌즈의 초점거리와 물체·상 거리의 관계',
    descriptionEn: 'The relationship between focal length, object distance, and image distance',
    simulationHint: '렌즈를 통해 상이 형성되는 위치와 크기가 변하는 모습',
    simulationHintEn: 'Shows how image position and size change through a lens',
    applications: [
        '안경 렌즈의 도수 계산',
        '카메라 초점 조절 원리',
        '현미경과 망원경의 배율 설계',
        '눈의 수정체 조절 기능 이해',
    ],
    applicationsEn: [
        'Calculating eyeglass lens prescription',
        'How camera focusing works',
        'Designing microscope and telescope magnification',
        'Understanding eye lens accommodation',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'a',
            name: '물체 거리',
            nameEn: 'Object Distance',
            role: 'input',
            unit: 'cm',
            range: [5, 100],
            default: 30,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 2,
                color: colors.distance,
            },
        },
        {
            symbol: 'b',
            name: '상 거리',
            nameEn: 'Image Distance',
            role: 'input',
            unit: 'cm',
            range: [5, 100],
            default: 15,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 2,
                color: colors.velocity,
            },
        },
        {
            symbol: 'f',
            name: '초점 거리',
            nameEn: 'Focal Length',
            role: 'output',
            unit: 'cm',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 10,
                color: colors.wavelength,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const a = inputs.a ?? 30
        const b = inputs.b ?? 15
        // 1/f = 1/a + 1/b => f = ab/(a+b)
        const f = (a * b) / (a + b)
        return { f }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const a = inputs.a ?? 30
        const b = inputs.b ?? 15
        const f = (a * b) / (a + b)
        return `1/f = 1/${a.toFixed(0)} + 1/${b.toFixed(0)} → f = ${f.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'a', to: 'b', operator: '+' },
            { from: 'b', to: 'f', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'f',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: '1' }],
                denominator: [{ type: 'var', symbol: 'a' }],
            },
            { type: 'op', value: '+' },
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: '1' }],
                denominator: [{ type: 'var', symbol: 'b' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'equal-distance',
            mission: '물체 거리 a와 상 거리 b를 같게 설정해봐!',
            missionEn: 'Set object distance a equal to image distance b!',
            result: 'a=b일 때 같은 크기의 상! 복사기가 원본 크기를 유지하는 원리야.',
            resultEn: 'When a=b, image equals object size! How copiers maintain original size.',
            icon: '📄',
            condition: (vars) => Math.abs(vars['a'] - vars['b']) <= 5,
        },
        {
            id: 'far-object',
            mission: '물체 거리 a를 80cm 이상으로 멀리 해봐!',
            missionEn: 'Set object distance a above 80cm!',
            result: '멀리 있는 물체의 상은 초점 근처에 맺혀! 망원경의 원리야.',
            resultEn: 'Distant object images form near the focal point! This is how telescopes work.',
            icon: '🔭',
            condition: (vars) => vars['a'] >= 80,
        },
    ],
}
