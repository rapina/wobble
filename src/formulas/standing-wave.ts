import { Formula } from './types';
import { colors } from '../styles/colors';

export const standingWave: Formula = {
    id: 'standing-wave',
    name: '정상파',
    nameEn: 'Standing Wave',
    expression: 'L = nλ/2',
    description: '양 끝이 고정된 줄에서 정상파가 형성될 때, 줄의 길이는 반파장의 정수배이다',
    descriptionEn: 'For a standing wave on a fixed string, length equals integer multiples of half-wavelength',
    applications: [
        '기타와 바이올린 현의 음높이',
        '관악기의 공명',
        '전자레인지 내부 파동',
        '다리와 건물의 공진 방지 설계',
    ],
    applicationsEn: [
        'Pitch of guitar and violin strings',
        'Resonance in wind instruments',
        'Microwave oven internal waves',
        'Preventing resonance in bridges and buildings',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'L',
            name: '줄의 길이',
            nameEn: 'String Length',
            role: 'input',
            unit: 'm',
            range: [0.5, 2],
            default: 1,
            visual: {
                property: 'size',
                scale: (value: number) => value,
                color: colors.distance,
            },
        },
        {
            symbol: 'n',
            name: '배음 차수',
            nameEn: 'Harmonic Number',
            role: 'input',
            unit: '',
            range: [1, 5],
            default: 1,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.velocity,
            },
        },
        {
            symbol: 'λ',
            name: '파장',
            nameEn: 'Wavelength',
            role: 'output',
            unit: 'm',
            range: [0.2, 4],
            default: 2,
            visual: {
                property: 'stretch',
                scale: (value: number) => value,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const L = inputs['L'] ?? 1;
        const n = Math.round(inputs['n'] ?? 1);
        // L = nλ/2 → λ = 2L/n
        const lambda = (2 * L) / n;
        return { 'λ': lambda };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const L = inputs['L'] ?? 1;
        const n = Math.round(inputs['n'] ?? 1);
        const lambda = (2 * L) / n;
        return `λ = 2 × ${L.toFixed(2)} ÷ ${n} = ${lambda.toFixed(2)} m`;
    },
    layout: {
        type: 'linear',
        connections: [{ from: 'L', to: 'λ', operator: '×' }],
    },
    displayLayout: {
        type: 'custom',
        output: 'λ',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'text', value: '2' },
                    { type: 'var', symbol: 'L' },
                ],
                denominator: [{ type: 'var', symbol: 'n' }],
            },
        ],
    },
};
