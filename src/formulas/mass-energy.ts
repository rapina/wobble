import { Formula } from './types';
import { colors } from '../styles/colors';

export const massEnergy: Formula = {
    id: 'mass-energy',
    name: '질량-에너지 등가',
    nameEn: 'Mass-Energy Equivalence',
    expression: 'E = mc²',
    description: '아인슈타인의 특수 상대성 이론: 작은 질량도 거대한 에너지로 변환된다',
    applications: [
        '원자력 발전소의 에너지 생산',
        '태양이 빛과 열을 내는 원리 (핵융합)',
        'PET 스캔 의료 영상 기술',
        '핵무기의 파괴력 계산',
    ],
    category: 'special',
    variables: [
        {
            symbol: 'm',
            name: '질량',
            role: 'input',
            unit: 'kg',
            range: [0.001, 0.01],
            default: 0.001,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 3000,
                color: colors.mass,
            },
        },
        {
            symbol: 'c',
            name: '광속 배율',
            role: 'input',
            unit: '×10⁸ m/s',
            range: [1, 5],
            default: 3,
            visual: {
                property: 'speed',
                scale: (value: number) => value / 3,
                color: colors.velocity,
            },
        },
        {
            symbol: 'E',
            name: '에너지',
            role: 'output',
            unit: 'PJ',
            range: [0, 250],
            default: 89.9,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 20,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 0.001;
        const cMultiplier = inputs.c ?? 3;
        const c = cMultiplier * 1e8; // m/s
        // E in Joules, convert to PJ (10^15)
        return {
            E: (m * c * c) / 1e15,
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 0.001;
        const cMultiplier = inputs.c ?? 3;
        const c = cMultiplier * 1e8;
        const E = (m * c * c) / 1e15;
        return `E = ${m.toFixed(3)} × (${cMultiplier.toFixed(1)}×10⁸)² = ${E.toFixed(1)} PJ`;
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'm', to: 'c', operator: '×' },
            { from: 'c', to: 'E', operator: '²' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'E',
        numerator: ['m', 'c'],
        squares: ['c'],
    },
};
