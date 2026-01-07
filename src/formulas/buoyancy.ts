import { Formula } from './types';
import { colors } from '../styles/colors';

export const buoyancy: Formula = {
    id: 'buoyancy',
    name: '부력',
    nameEn: 'Buoyancy',
    expression: 'F = ρVg',
    description: '유체 속에서 물체를 위로 밀어올리는 힘',
    applications: [
        '배와 잠수함의 부양 설계',
        '열기구와 비행선의 부력 계산',
        '수영할 때 몸이 뜨는 원리',
        '해수와 담수에서의 부력 차이',
    ],
    category: 'special',
    variables: [
        {
            symbol: 'ρ',
            name: '유체 밀도',
            role: 'input',
            unit: 'kg/m³',
            range: [100, 1500],
            default: 1000,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 500,
                color: colors.density,
            },
        },
        {
            symbol: 'V',
            name: '잠긴 부피',
            role: 'input',
            unit: 'L',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.5,
                color: colors.volume,
            },
        },
        {
            symbol: 'g',
            name: '중력 가속도',
            role: 'input',
            unit: 'm/s²',
            range: [1, 25],
            default: 9.8,
            visual: {
                property: 'speed',
                scale: (value: number) => value / 5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'F',
            name: '부력',
            role: 'output',
            unit: 'N',
            range: [0, 500],
            default: 98,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const rho = inputs['ρ'] ?? 1000;
        const V = inputs.V ?? 10;
        const g = inputs.g ?? 9.8;
        // V in L = 0.001 m³
        return {
            F: rho * (V / 1000) * g,
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const rho = inputs['ρ'] ?? 1000;
        const V = inputs.V ?? 10;
        const g = inputs.g ?? 9.8;
        const F = rho * (V / 1000) * g;
        return `F = ${rho.toFixed(0)} × ${(V / 1000).toFixed(3)} × ${g.toFixed(1)} = ${F.toFixed(1)}`;
    },
    layout: {
        type: 'float',
        connections: [
            { from: 'ρ', to: 'V', operator: '×' },
            { from: 'V', to: 'g', operator: '×' },
            { from: 'g', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['ρ', 'V', 'g'],
    },
};
