import { Formula } from './types';
import { colors } from '../styles/colors';

export const entropy: Formula = {
    id: 'entropy',
    name: '엔트로피',
    nameEn: 'Entropy',
    expression: 'ΔS = Q/T',
    description: '열역학 제2법칙: 무질서도의 변화량',
    descriptionEn: 'Second law of thermodynamics: change in disorder',
    applications: [
        '열기관의 효율 한계 계산 (카르노 사이클)',
        '화학 반응의 자발성 예측',
        '냉장고가 열을 밖으로 내보내는 원리',
        '우주의 열적 죽음 이론',
    ],
    applicationsEn: [
        'Calculating heat engine efficiency limits (Carnot cycle)',
        'Predicting spontaneity of chemical reactions',
        'How refrigerators expel heat',
        'Heat death of the universe theory',
    ],
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'Q',
            name: '열량',
            nameEn: 'Heat',
            role: 'input',
            unit: 'J',
            range: [200, 1200],
            default: 600,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 150,
                color: colors.temperature,
            },
        },
        {
            symbol: 'T',
            name: '절대온도',
            nameEn: 'Absolute Temperature',
            role: 'input',
            unit: 'K',
            range: [150, 600],
            default: 300,
            visual: {
                property: 'shake',
                scale: (value: number) => value / 80,
                color: colors.temperature,
            },
        },
        {
            symbol: 'ΔS',
            name: '엔트로피 변화',
            nameEn: 'Entropy Change',
            role: 'output',
            unit: 'J/K',
            range: [0, 8],
            default: 2,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value * 0.6,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const Q = inputs.Q ?? 500;
        const T = inputs.T ?? 300;
        return {
            'ΔS': Q / T,
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const Q = inputs.Q ?? 500;
        const T = inputs.T ?? 300;
        const dS = Q / T;
        return `ΔS = ${Q.toFixed(0)} ÷ ${T.toFixed(0)} = ${dS.toFixed(2)}`;
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'Q', to: 'T', operator: '÷' },
            { from: 'T', to: 'ΔS', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'ΔS',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'Q' }],
                denominator: [{ type: 'var', symbol: 'T' }],
            },
        ],
    },
};
