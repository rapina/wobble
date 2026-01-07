import { Formula } from './types';
import { colors } from '../styles/colors';

export const doppler: Formula = {
    id: 'doppler',
    name: '도플러 효과',
    nameEn: 'Doppler Effect',
    expression: "f' = f(v/(v-vs))",
    description: '음원이 다가오면 진동수가 높아지고, 멀어지면 낮아진다',
    applications: [
        '구급차 사이렌 소리의 변화',
        '야구에서 스피드건으로 구속 측정',
        '우주의 팽창 속도 측정 (적색편이)',
        '태아 심장박동 초음파 검사',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'f',
            name: '원래 진동수',
            role: 'input',
            unit: 'Hz',
            range: [100, 1000],
            default: 440,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 200,
                color: colors.time,
            },
        },
        {
            symbol: 'v',
            name: '파동 속도',
            role: 'input',
            unit: 'm/s',
            range: [300, 400],
            default: 340,
            visual: {
                property: 'speed',
                scale: (value: number) => value / 100,
                color: colors.velocity,
            },
        },
        {
            symbol: 'vs',
            name: '음원 속도',
            role: 'input',
            unit: 'm/s',
            range: [-100, 100],
            default: 50,
            visual: {
                property: 'speed',
                scale: (value: number) => Math.abs(value) / 20,
                color: colors.mass,
            },
        },
        {
            symbol: "f'",
            name: '관측 진동수',
            role: 'output',
            unit: 'Hz',
            range: [0, 2000],
            default: 515.9,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 200,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const f = inputs.f ?? 440;
        const v = inputs.v ?? 340;
        const vs = inputs.vs ?? 50;

        // f' = f * v / (v - vs)
        // vs > 0: approaching (higher frequency)
        // vs < 0: receding (lower frequency)
        const denominator = v - vs;
        if (Math.abs(denominator) < 1) {
            // Approaching sonic barrier
            return { "f'": 9999 };
        }
        return {
            "f'": (f * v) / denominator,
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const f = inputs.f ?? 440;
        const v = inputs.v ?? 340;
        const vs = inputs.vs ?? 50;
        const denominator = v - vs;

        if (Math.abs(denominator) < 1) {
            return `f' = ${f.toFixed(0)} × ${v.toFixed(0)} ÷ ~0 → ∞ (음속 돌파!)`;
        }

        const fPrime = (f * v) / denominator;
        return `f' = ${f.toFixed(0)} × ${v.toFixed(0)} ÷ (${v.toFixed(0)} - ${vs.toFixed(0)}) = ${fPrime.toFixed(1)}`;
    },
    layout: {
        type: 'wave',
        connections: [
            { from: 'f', to: 'v', operator: '×' },
            { from: 'vs', to: "f'", operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: "f'",
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'f' },
                    { type: 'op', value: '×' },
                    { type: 'var', symbol: 'v' },
                ],
                denominator: [
                    { type: 'var', symbol: 'v' },
                    { type: 'op', value: '-' },
                    { type: 'var', symbol: 'vs' },
                ],
            },
        ],
    },
};
