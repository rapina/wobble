import { Formula } from './types';
import { colors } from '../styles/colors';

export const kineticEnergy: Formula = {
    id: 'kinetic-energy',
    name: '운동 에너지',
    nameEn: 'Kinetic Energy',
    expression: 'E = ½mv²',
    description: '움직이는 물체가 가진 에너지',
    applications: [
        '자동차 충돌 시 발생하는 충격 에너지 계산',
        '롤러코스터 설계 시 속도와 에너지 관계 분석',
        '총알이나 운석의 파괴력 계산',
        '풍력 발전기의 발전량 예측',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: '질량',
            role: 'input',
            unit: 'kg',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 40 + value * 1.5,
                color: colors.mass,
            },
        },
        {
            symbol: 'v',
            name: '속도',
            role: 'input',
            unit: 'm/s',
            range: [1, 20],
            default: 5,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'E',
            name: '에너지',
            role: 'output',
            unit: 'J',
            range: [0, 10000],
            default: 125,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.min(value * 0.01, 10),
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10;
        const v = inputs.v ?? 5;
        return {
            E: 0.5 * m * v * v,
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10;
        const v = inputs.v ?? 5;
        const E = 0.5 * m * v * v;
        return `E = ½ × ${m.toFixed(0)} × ${v.toFixed(1)}² = ${E.toFixed(1)}`;
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm', to: 'v', operator: '×' },
            { from: 'v', to: 'E', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'E',
        coefficient: '½',
        numerator: ['m', 'v'],
        squares: ['v'],
    },
};
