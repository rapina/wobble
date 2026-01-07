import { Formula } from './types';
import { colors } from '../styles/colors';

export const lens: Formula = {
    id: 'lens',
    name: '렌즈 공식',
    nameEn: 'Thin Lens Equation',
    expression: '1/f = 1/a + 1/b',
    description: '렌즈의 초점거리와 물체·상 거리의 관계',
    descriptionEn: 'The relationship between focal length, object distance, and image distance',
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
        const a = inputs.a ?? 30;
        const b = inputs.b ?? 15;
        // 1/f = 1/a + 1/b => f = ab/(a+b)
        const f = (a * b) / (a + b);
        return { f };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const a = inputs.a ?? 30;
        const b = inputs.b ?? 15;
        const f = (a * b) / (a + b);
        return `1/f = 1/${a.toFixed(0)} + 1/${b.toFixed(0)} → f = ${f.toFixed(1)}`;
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
};
