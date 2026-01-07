import { Formula } from './types';
import { colors } from '../styles/colors';

export const wien: Formula = {
    id: 'wien',
    name: '빈의 변위 법칙',
    nameEn: "Wien's Displacement Law",
    expression: 'λmax = b/T',
    description: '흑체 복사의 최대 파장은 온도에 반비례한다',
    descriptionEn: 'Peak wavelength of blackbody radiation is inversely proportional to temperature',
    applications: [
        '별의 색깔로 표면 온도 측정',
        '적외선 열화상 카메라 설계',
        '용광로의 온도 측정',
        '태양과 다른 별들의 분류',
    ],
    applicationsEn: [
        'Measuring star surface temperature by color',
        'Designing infrared thermal cameras',
        'Measuring furnace temperature',
        'Classification of the Sun and other stars',
    ],
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'T',
            name: '온도',
            nameEn: 'Temperature',
            role: 'input',
            unit: 'K',
            range: [2000, 12000],
            default: 5800,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 2000,
                color: colors.temperature,
            },
        },
        {
            symbol: 'λmax',
            name: '최대 파장',
            nameEn: 'Peak Wavelength',
            role: 'output',
            unit: 'nm',
            range: [200, 1500],
            default: 500,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 200,
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const T = inputs.T ?? 5800;
        // Wien's constant b = 2.898 × 10⁻³ m·K = 2898000 nm·K
        const b = 2898000;
        return {
            'λmax': b / T,
        };
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const T = inputs.T ?? 5800;
        const b = 2898000;
        const lambdaMax = b / T;
        return `λmax = 2898000 ÷ ${T.toFixed(0)} = ${lambdaMax.toFixed(0)}`;
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'T', to: 'λmax', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'λmax',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: 'b' }],
                denominator: [{ type: 'var', symbol: 'T' }],
            },
        ],
    },
};
