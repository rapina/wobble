import { Formula } from './types';
import { colors } from '../styles/colors';

export const torque: Formula = {
    id: 'torque',
    name: '토크 (돌림힘)',
    nameEn: 'Torque',
    expression: 'τ = rF sin θ',
    description: '물체를 회전시키는 힘의 효과',
    descriptionEn: 'The rotational effect of a force',
    applications: [
        '렌치로 볼트를 조이는 원리',
        '시소의 균형 잡기',
        '자전거 페달 밟기의 효율',
        '문 손잡이가 문 가장자리에 있는 이유',
    ],
    applicationsEn: [
        'Tightening bolts with a wrench',
        'Balancing a seesaw',
        'Efficiency of pedaling a bicycle',
        'Why door handles are at the edge',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'r',
            name: '거리 (반지름)',
            nameEn: 'Distance (Radius)',
            role: 'input',
            unit: 'm',
            range: [0.1, 2],
            default: 0.5,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 60,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: '힘',
            nameEn: 'Force',
            role: 'input',
            unit: 'N',
            range: [10, 200],
            default: 50,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.force,
            },
        },
        {
            symbol: 'θ',
            name: '각도',
            nameEn: 'Angle',
            role: 'input',
            unit: '°',
            range: [0, 90],
            default: 90,
            visual: {
                property: 'stretch',
                scale: (value: number) => 1 + (90 - value) / 180,
                color: colors.velocity,
            },
        },
        {
            symbol: 'τ',
            name: '토크',
            nameEn: 'Torque',
            role: 'output',
            unit: 'N·m',
            range: [0, 400],
            default: 25,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 10,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const r = inputs.r ?? 0.5;
        const F = inputs.F ?? 50;
        const theta = inputs['θ'] ?? 90;
        const thetaRad = (theta * Math.PI) / 180;
        return {
            'τ': r * F * Math.sin(thetaRad),
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const r = inputs.r ?? 0.5;
        const F = inputs.F ?? 50;
        const theta = inputs['θ'] ?? 90;
        const thetaRad = (theta * Math.PI) / 180;
        const tau = r * F * Math.sin(thetaRad);
        return `τ = ${r.toFixed(2)} × ${F.toFixed(0)} × sin(${theta.toFixed(0)}°) = ${tau.toFixed(2)}`;
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'r', to: 'F', operator: '×' },
            { from: 'F', to: 'θ', operator: '×' },
            { from: 'θ', to: 'τ', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'τ',
        expression: [
            { type: 'var', symbol: 'r' },
            { type: 'var', symbol: 'F' },
            { type: 'text', value: 'sin' },
            { type: 'var', symbol: 'θ' },
        ],
    },
};
