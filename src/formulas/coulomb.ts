import { Formula } from './types';
import { colors } from '../styles/colors';

export const coulomb: Formula = {
    id: 'coulomb',
    name: '쿨롱의 법칙',
    nameEn: "Coulomb's Law",
    expression: 'F = kq₁q₂/r²',
    description: '두 전하 사이에 작용하는 전기력',
    applications: [
        '정전기 방지 제품 설계',
        '복사기와 레이저 프린터의 토너 부착 원리',
        '번개와 정전기 방전 현상 이해',
        '원자 내 전자와 핵 사이의 결합력 계산',
    ],
    category: 'electricity',
    variables: [
        {
            symbol: 'q₁',
            name: '전하 1',
            role: 'input',
            unit: 'μC',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 0.3,
                color: colors.charge,
            },
        },
        {
            symbol: 'q₂',
            name: '전하 2',
            role: 'input',
            unit: 'μC',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 0.3,
                color: colors.current,
            },
        },
        {
            symbol: 'r',
            name: '거리',
            role: 'input',
            unit: 'cm',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 3,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: '전기력',
            role: 'output',
            unit: 'N',
            range: [0, 1000],
            default: 89.9,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const q1 = inputs['q₁'] ?? 10;
        const q2 = inputs['q₂'] ?? 10;
        const r = inputs.r ?? 10;
        const k = 8.99e9; // Coulomb's constant
        // Convert μC to C (1e-6) and cm to m (1e-2)
        const q1_C = q1 * 1e-6;
        const q2_C = q2 * 1e-6;
        const r_m = r * 1e-2;
        return {
            F: (k * q1_C * q2_C) / (r_m * r_m),
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const q1 = inputs['q₁'] ?? 10;
        const q2 = inputs['q₂'] ?? 10;
        const r = inputs.r ?? 10;
        const k = 8.99e9;
        const q1_C = q1 * 1e-6;
        const q2_C = q2 * 1e-6;
        const r_m = r * 1e-2;
        const F = (k * q1_C * q2_C) / (r_m * r_m);
        return `F = k × ${q1.toFixed(0)} × ${q2.toFixed(0)} ÷ ${r.toFixed(0)}² = ${F.toFixed(1)}`;
    },
    layout: {
        type: 'orbital',
        connections: [
            { from: 'q₁', to: 'q₂', operator: '×' },
            { from: 'q₂', to: 'r', operator: '÷r²' },
            { from: 'r', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'F',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'text', value: 'k' },
                    { type: 'var', symbol: 'q₁' },
                    { type: 'var', symbol: 'q₂' },
                ],
                denominator: [{ type: 'var', symbol: 'r', square: true }],
            },
        ],
    },
};
