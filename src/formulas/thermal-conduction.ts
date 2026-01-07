import { Formula } from './types';
import { colors } from '../styles/colors';

export const thermalConduction: Formula = {
    id: 'thermal-conduction',
    name: '열전도 (푸리에 법칙)',
    nameEn: "Fourier's Law",
    expression: 'Q = kAΔT/L',
    description: '물질을 통해 전달되는 열량',
    descriptionEn: 'The amount of heat transferred through a material',
    applications: [
        '건물 단열재의 효율 계산',
        '전자기기 방열판 설계',
        '요리할 때 냄비 손잡이가 뜨거워지는 정도',
        '겨울철 이중창의 단열 효과',
    ],
    applicationsEn: [
        'Calculating building insulation efficiency',
        'Designing electronics heat sinks',
        'How hot pot handles get while cooking',
        'Double-pane window insulation in winter',
    ],
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'k',
            name: '열전도율',
            nameEn: 'Thermal Conductivity',
            role: 'input',
            unit: 'W/m·K',
            range: [10, 400],
            default: 100,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 80,
                color: colors.spring,
            },
        },
        {
            symbol: 'A',
            name: '단면적',
            nameEn: 'Cross-sectional Area',
            role: 'input',
            unit: 'cm²',
            range: [10, 80],
            default: 40,
            visual: {
                property: 'size',
                scale: (value: number) => 15 + value * 0.6,
                color: colors.distance,
            },
        },
        {
            symbol: 'ΔT',
            name: '온도차',
            nameEn: 'Temperature Difference',
            role: 'input',
            unit: '°C',
            range: [20, 150],
            default: 80,
            visual: {
                property: 'shake',
                scale: (value: number) => value / 40,
                color: colors.temperature,
            },
        },
        {
            symbol: 'L',
            name: '길이',
            nameEn: 'Length',
            role: 'input',
            unit: 'cm',
            range: [5, 40],
            default: 15,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 3,
                color: colors.distance,
            },
        },
        {
            symbol: 'Q',
            name: '열전달률',
            nameEn: 'Heat Transfer Rate',
            role: 'output',
            unit: 'W',
            range: [0, 8000],
            default: 2133,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.min(value / 400, 6),
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const k = inputs.k ?? 50;
        const A = inputs.A ?? 25;
        const dT = inputs['ΔT'] ?? 50;
        const L = inputs.L ?? 10;
        // A in cm², L in cm, convert to m² and m
        const A_m2 = A * 1e-4;
        const L_m = L * 1e-2;
        return {
            Q: (k * A_m2 * dT) / L_m,
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const k = inputs.k ?? 50;
        const A = inputs.A ?? 25;
        const dT = inputs['ΔT'] ?? 50;
        const L = inputs.L ?? 10;
        const A_m2 = A * 1e-4;
        const L_m = L * 1e-2;
        const Q = (k * A_m2 * dT) / L_m;
        return `Q = ${k.toFixed(0)} × ${A.toFixed(0)} × ${dT.toFixed(0)} ÷ ${L.toFixed(0)} = ${Q.toFixed(1)}`;
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'k', to: 'A', operator: '×' },
            { from: 'A', to: 'ΔT', operator: '×' },
            { from: 'ΔT', to: 'L', operator: '÷' },
            { from: 'L', to: 'Q', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'Q',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'k' },
                    { type: 'var', symbol: 'A' },
                    { type: 'var', symbol: 'ΔT' },
                ],
                denominator: [{ type: 'var', symbol: 'L' }],
            },
        ],
    },
};
