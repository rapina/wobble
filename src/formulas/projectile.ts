import { Formula } from './types';
import { colors } from '../styles/colors';

export const projectile: Formula = {
    id: 'projectile',
    name: '포물선 운동',
    nameEn: 'Projectile Motion',
    expression: 'R = v²sin2θ/g',
    description: '비스듬히 던진 물체의 수평 도달 거리',
    applications: [
        '축구나 농구에서 공의 궤적 예측',
        '대포나 미사일의 사거리 계산',
        '분수대 물줄기 설계',
        '골프 드라이버 샷의 최적 각도',
    ],
    category: 'gravity',
    variables: [
        {
            symbol: 'v',
            name: '초기 속력',
            role: 'input',
            unit: 'm/s',
            range: [5, 50],
            default: 20,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.2,
                color: colors.velocity,
            },
        },
        {
            symbol: 'θ',
            name: '발사각',
            role: 'input',
            unit: '°',
            range: [10, 80],
            default: 45,
            visual: {
                property: 'stretch',
                scale: (value: number) => value / 30,
                color: colors.force,
            },
        },
        {
            symbol: 'g',
            name: '중력가속도',
            role: 'input',
            unit: 'm/s²',
            range: [1, 25],
            default: 9.8,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 5,
                color: colors.mass,
            },
        },
        {
            symbol: 'R',
            name: '수평 도달거리',
            role: 'output',
            unit: 'm',
            range: [0, 300],
            default: 40.8,
            visual: {
                property: 'distance',
                scale: (value: number) => Math.min(value, 150),
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const v = inputs.v ?? 20;
        const theta = inputs['θ'] ?? 45;
        const g = inputs.g ?? 9.8;
        const thetaRad = (theta * Math.PI) / 180;
        const R = (v * v * Math.sin(2 * thetaRad)) / g;
        return { R };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const v = inputs.v ?? 20;
        const theta = inputs['θ'] ?? 45;
        const g = inputs.g ?? 9.8;
        const thetaRad = (theta * Math.PI) / 180;
        const R = (v * v * Math.sin(2 * thetaRad)) / g;
        return `R = ${v.toFixed(0)}² × sin(${(2 * theta).toFixed(0)}°) ÷ ${g.toFixed(1)} = ${R.toFixed(1)}`;
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'v', to: 'θ', operator: '×' },
            { from: 'θ', to: 'g', operator: '÷' },
            { from: 'g', to: 'R', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'R',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'v', square: true },
                    { type: 'text', value: 'sin2' },
                    { type: 'var', symbol: 'θ' },
                ],
                denominator: [{ type: 'var', symbol: 'g' }],
            },
        ],
    },
};
