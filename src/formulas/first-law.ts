import { Formula } from './types';
import { colors } from '../styles/colors';

export const firstLaw: Formula = {
    id: 'first-law',
    name: '열역학 제1법칙',
    nameEn: 'First Law of Thermodynamics',
    expression: 'ΔU = Q - W',
    description: '에너지 보존 법칙: 내부에너지 변화 = 열 - 일',
    descriptionEn: 'Energy conservation: change in internal energy = heat - work',
    applications: [
        '냉장고와 에어컨의 냉각 사이클 설계',
        '자동차 엔진의 효율 계산',
        '발전소의 열에너지 → 전기에너지 변환',
        '단열 팽창을 이용한 구름 생성 원리',
    ],
    applicationsEn: [
        'Designing refrigerator and AC cooling cycles',
        'Calculating car engine efficiency',
        'Power plant heat-to-electricity conversion',
        'Cloud formation through adiabatic expansion',
    ],
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'Q',
            name: '열량',
            nameEn: 'Heat',
            role: 'input',
            unit: 'J',
            range: [100, 800],
            default: 400,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 150,
                color: colors.temperature,
            },
        },
        {
            symbol: 'W',
            name: '일',
            nameEn: 'Work',
            role: 'input',
            unit: 'J',
            range: [50, 600],
            default: 200,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.15,
                color: colors.force,
            },
        },
        {
            symbol: 'ΔU',
            name: '내부에너지 변화',
            nameEn: 'Internal Energy Change',
            role: 'output',
            unit: 'J',
            range: [-500, 750],
            default: 200,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.abs(value) / 150,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const Q = inputs.Q ?? 500;
        const W = inputs.W ?? 200;
        return {
            'ΔU': Q - W,
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const Q = inputs.Q ?? 500;
        const W = inputs.W ?? 200;
        const dU = Q - W;
        return `ΔU = ${Q.toFixed(0)} - ${W.toFixed(0)} = ${dU.toFixed(0)}`;
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'Q', to: 'W', operator: '-' },
            { from: 'W', to: 'ΔU', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'ΔU',
        expression: [
            { type: 'var', symbol: 'Q' },
            { type: 'op', value: '-' },
            { type: 'var', symbol: 'W' },
        ],
    },
};
