import { Formula } from './types';
import { colors } from '../styles/colors';

export const diffraction: Formula = {
    id: 'diffraction',
    name: '회절격자',
    nameEn: 'Diffraction Grating',
    expression: 'd·sinθ = nλ',
    description: '격자에 의한 빛의 회절과 간섭',
    applications: [
        'CD/DVD 표면의 무지개빛 원리',
        '분광기로 별빛의 성분 분석',
        '홀로그램 제작 기술',
        '레이저 빔 분할 장치',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'd',
            name: '격자 간격',
            role: 'input',
            unit: 'μm',
            range: [0.5, 10],
            default: 2,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 20,
                color: colors.distance,
            },
        },
        {
            symbol: 'n',
            name: '차수',
            role: 'input',
            unit: '',
            range: [1, 5],
            default: 1,
            visual: {
                property: 'glow',
                scale: (value: number) => value,
                color: colors.force,
            },
        },
        {
            symbol: 'λ',
            name: '파장',
            role: 'input',
            unit: 'nm',
            range: [380, 780],
            default: 550,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 100,
                color: colors.wavelength,
            },
        },
        {
            symbol: 'θ',
            name: '회절각',
            role: 'output',
            unit: '°',
            range: [0, 90],
            default: 15.96,
            visual: {
                property: 'stretch',
                scale: (value: number) => value / 30,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const d = inputs.d ?? 2; // μm
        const n = inputs.n ?? 1;
        const lambda = inputs['λ'] ?? 550; // nm
        // d in μm = 1000 nm, λ in nm
        const d_nm = d * 1000;
        const sinTheta = (n * lambda) / d_nm;
        const theta = sinTheta <= 1 ? Math.asin(sinTheta) * (180 / Math.PI) : 90;
        return { 'θ': theta };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const d = inputs.d ?? 2;
        const n = inputs.n ?? 1;
        const lambda = inputs['λ'] ?? 550;
        const d_nm = d * 1000;
        const sinTheta = (n * lambda) / d_nm;
        const theta = sinTheta <= 1 ? Math.asin(sinTheta) * (180 / Math.PI) : 90;
        return `sinθ = ${n} × ${lambda.toFixed(0)} ÷ ${d_nm.toFixed(0)} → θ = ${theta.toFixed(1)}°`;
    },
    layout: {
        type: 'wave',
        connections: [
            { from: 'd', to: 'n', operator: '×' },
            { from: 'n', to: 'λ', operator: '×' },
            { from: 'λ', to: 'θ', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'θ',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'n' },
                    { type: 'var', symbol: 'λ' },
                ],
                denominator: [{ type: 'var', symbol: 'd' }],
            },
        ],
    },
};
