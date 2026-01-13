import { Formula } from './types'
import { colors } from '../styles/colors'

export const pressure: Formula = {
    id: 'pressure',
    name: '압력',
    nameEn: 'Pressure',
    expression: 'P = F/A',
    description: '단위 면적당 가해지는 힘',
    descriptionEn: 'Force applied per unit area',
    simulationHint: '같은 힘이라도 면적이 작을수록 압력이 커지는 모습',
    simulationHintEn: 'Shows how pressure increases as area decreases for the same force',
    applications: [
        '압정이 쉽게 찔리는 이유',
        '스키가 눈에 덜 빠지는 원리',
        '고압 세척기의 작동 원리',
        '칼날이 날카로울수록 잘 드는 이유',
    ],
    applicationsEn: [
        'Why thumbtacks pierce easily',
        "Why skis don't sink in snow",
        'How pressure washers work',
        'Why sharper knives cut better',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'F',
            name: '힘',
            nameEn: 'Force',
            role: 'input',
            unit: 'N',
            range: [10, 200],
            default: 100,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.force,
            },
        },
        {
            symbol: 'A',
            name: '면적',
            nameEn: 'Area',
            role: 'input',
            unit: 'cm²',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => value / 50,
                color: colors.distance,
            },
        },
        {
            symbol: 'P',
            name: '압력',
            nameEn: 'Pressure',
            role: 'output',
            unit: 'kPa',
            range: [0, 2000],
            default: 100,
            visual: {
                property: 'shake',
                scale: (value: number) => Math.min(value / 100, 5),
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const F = inputs.F ?? 100
        const A = inputs.A ?? 10
        // P = F/A, convert to kPa (F in N, A in cm² → multiply by 10)
        return {
            P: (F * 10) / A,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const F = inputs.F ?? 100
        const A = inputs.A ?? 10
        const P = (F * 10) / A
        return `P = ${F.toFixed(0)} ÷ ${A.toFixed(1)} = ${P.toFixed(0)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'F', to: 'A', operator: '÷' },
            { from: 'A', to: 'P', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'P',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'F' }],
                denominator: [{ type: 'var', symbol: 'A' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'needle-point',
            mission: '면적 A를 5cm² 이하로 줄여봐!',
            missionEn: 'Reduce area A below 5 square centimeters!',
            result: '면적이 작으면 압력이 엄청 커져! 압정이 쉽게 찔리는 이유야.',
            resultEn: 'Small area means huge pressure! This is why thumbtacks pierce easily.',
            icon: '📌',
            condition: (vars) => vars['A'] <= 5,
        },
        {
            id: 'snowshoe',
            mission: '면적 A를 최대(100cm²)로 늘려봐!',
            missionEn: 'Maximize area A to 100 square centimeters!',
            result: '면적이 크면 압력이 분산돼! 스키가 눈에 덜 빠지는 원리야.',
            resultEn: 'Large area spreads pressure out! This is why skis do not sink in snow.',
            icon: '🎿',
            condition: (vars) => vars['A'] >= 90,
        },
    ],
}
