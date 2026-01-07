import { Formula } from './types';
import { colors } from '../styles/colors';

export const reflection: Formula = {
    id: 'reflection',
    name: '반사의 법칙',
    nameEn: 'Law of Reflection',
    expression: 'θᵢ = θᵣ',
    description: '빛이 표면에서 반사될 때 입사각과 반사각은 같다',
    applications: [
        '거울에 비친 내 모습',
        '자동차 백미러와 사이드미러',
        '레이저 반사경과 광학 장비',
        '건물 유리창에 비친 풍경',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'θᵢ',
            name: '입사각',
            role: 'input',
            unit: '°',
            range: [0, 85],
            default: 45,
            visual: {
                property: 'distance',
                scale: (value: number) => value,
                color: colors.velocity,
            },
        },
        {
            symbol: 'θᵣ',
            name: '반사각',
            role: 'output',
            unit: '°',
            range: [0, 85],
            default: 45,
            visual: {
                property: 'distance',
                scale: (value: number) => value,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const thetaI = inputs['θᵢ'] ?? 45;
        return {
            'θᵣ': thetaI,
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const thetaI = inputs['θᵢ'] ?? 45;
        return `θᵣ = θᵢ = ${thetaI.toFixed(1)}°`;
    },
    layout: {
        type: 'linear',
        connections: [{ from: 'θᵢ', to: 'θᵣ', operator: '=' }],
    },
    displayLayout: {
        type: 'custom',
        output: 'θᵣ',
        expression: [{ type: 'var', symbol: 'θᵢ' }],
    },
};
