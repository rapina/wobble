import { Formula } from './types';
import { colors } from '../styles/colors';

export const doubleSlit: Formula = {
    id: 'double-slit',
    name: '영의 이중슬릿',
    nameEn: "Young's Double Slit",
    expression: 'Δx = λL/d',
    description: '이중슬릿에 의한 빛의 간섭무늬 간격',
    applications: [
        '빛의 파동성 증명 실험',
        '파장 측정 장치',
        '양자역학의 파동-입자 이중성 실험',
        '간섭계를 이용한 정밀 측정',
    ],
    category: 'wave',
    variables: [
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
            symbol: 'L',
            name: '스크린 거리',
            role: 'input',
            unit: 'm',
            range: [0.5, 5],
            default: 2,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 30,
                color: colors.distance,
            },
        },
        {
            symbol: 'd',
            name: '슬릿 간격',
            role: 'input',
            unit: 'mm',
            range: [0.1, 2],
            default: 0.5,
            visual: {
                property: 'size',
                scale: (value: number) => 10 + value * 20,
                color: colors.velocity,
            },
        },
        {
            symbol: 'Δx',
            name: '무늬 간격',
            role: 'output',
            unit: 'mm',
            range: [0, 20],
            default: 2.2,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 2,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const lambda = inputs['λ'] ?? 550; // nm
        const L = inputs.L ?? 2; // m
        const d = inputs.d ?? 0.5; // mm
        // λ in nm = 1e-9 m, d in mm = 1e-3 m
        // Δx = λL/d in m, convert to mm
        const lambda_m = lambda * 1e-9;
        const d_m = d * 1e-3;
        const dx_m = (lambda_m * L) / d_m;
        const dx_mm = dx_m * 1000;
        return { 'Δx': dx_mm };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const lambda = inputs['λ'] ?? 550;
        const L = inputs.L ?? 2;
        const d = inputs.d ?? 0.5;
        const lambda_m = lambda * 1e-9;
        const d_m = d * 1e-3;
        const dx_m = (lambda_m * L) / d_m;
        const dx_mm = dx_m * 1000;
        return `Δx = ${lambda.toFixed(0)}nm × ${L.toFixed(1)}m ÷ ${d.toFixed(1)}mm = ${dx_mm.toFixed(2)}mm`;
    },
    layout: {
        type: 'wave',
        connections: [
            { from: 'λ', to: 'L', operator: '×' },
            { from: 'L', to: 'd', operator: '÷' },
            { from: 'd', to: 'Δx', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'Δx',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'λ' },
                    { type: 'var', symbol: 'L' },
                ],
                denominator: [{ type: 'var', symbol: 'd' }],
            },
        ],
    },
};
