import { Formula } from './types';
import { colors } from '../styles/colors';

export const soundSpeed: Formula = {
    id: 'sound-speed',
    name: '음속',
    nameEn: 'Speed of Sound',
    expression: 'v = 331 + 0.6T',
    description: '공기 중 온도에 따른 음속 변화',
    applications: [
        '천둥과 번개 사이 거리 계산',
        '초음파 검사 장비의 정확도 보정',
        '콘서트홀의 음향 설계',
        '비행기의 마하 속도 계산',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'T',
            name: '온도',
            role: 'input',
            unit: '°C',
            range: [-40, 50],
            default: 20,
            visual: {
                property: 'shake',
                scale: (value: number) => (value + 40) / 30,
                color: colors.temperature,
            },
        },
        {
            symbol: 'v',
            name: '음속',
            role: 'output',
            unit: 'm/s',
            range: [300, 365],
            default: 343,
            visual: {
                property: 'speed',
                scale: (value: number) => value / 100,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const T = inputs.T ?? 20;
        return {
            v: 331 + 0.6 * T,
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const T = inputs.T ?? 20;
        const v = 331 + 0.6 * T;
        return `v = 331 + 0.6 × ${T.toFixed(0)} = ${v.toFixed(1)}`;
    },
    layout: {
        type: 'wave',
        connections: [
            { from: 'T', to: 'v', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'v',
        expression: [
            { type: 'text', value: '331' },
            { type: 'op', value: '+' },
            { type: 'text', value: '0.6' },
            { type: 'var', symbol: 'T' },
        ],
    },
};
