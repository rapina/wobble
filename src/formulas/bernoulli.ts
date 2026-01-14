import { Formula } from './types'
import { colors } from '../styles/colors'

export const bernoulli: Formula = {
    id: 'bernoulli',
    name: '베르누이 방정식',
    nameEn: "Bernoulli's Equation",
    expression: 'P + ½ρv² = const',
    description: '유체의 속도가 빨라지면 압력이 낮아진다',
    descriptionEn:
        'As the speed of a fluid increases, its pressure decreases',
    simulationHint: '좁은 곳을 지날 때 유체 속도와 압력 변화를 관찰하세요',
    simulationHintEn: 'Watch how fluid speed and pressure change in narrow sections',
    applications: [
        '비행기 날개 - 윗면 공기가 빨라 압력이 낮아져 양력 발생',
        '분무기 - 빠른 공기 흐름이 액체를 빨아올림',
        '카뷰레터 - 연료를 공기와 혼합',
        '벤투리 효과 - 파이프 좁은 부분에서 속도 증가',
    ],
    applicationsEn: [
        'Airplane wings - faster air above creates lift due to lower pressure',
        'Spray bottles - fast air flow draws liquid up',
        'Carburetor - mixes fuel with air',
        'Venturi effect - speed increases in narrow pipe sections',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'v₁',
            name: '입구 속도',
            nameEn: 'Inlet velocity',
            role: 'input',
            unit: 'm/s',
            range: [1, 10],
            default: 3,
            visual: {
                property: 'speed',
                scale: (v) => v,
                color: colors.velocity,
            },
        },
        {
            symbol: 'A₁',
            name: '입구 면적',
            nameEn: 'Inlet area',
            role: 'input',
            unit: 'm²',
            range: [2, 10],
            default: 6,
            visual: {
                property: 'size',
                scale: (v) => v * 5,
                color: colors.distance,
            },
        },
        {
            symbol: 'A₂',
            name: '출구 면적',
            nameEn: 'Outlet area',
            role: 'input',
            unit: 'm²',
            range: [1, 8],
            default: 2,
            visual: {
                property: 'size',
                scale: (v) => v * 5,
                color: colors.distance,
            },
        },
        {
            symbol: 'v₂',
            name: '출구 속도',
            nameEn: 'Outlet velocity',
            role: 'output',
            unit: 'm/s',
            range: [1, 50],
            default: 9,
            visual: {
                property: 'speed',
                scale: (v) => v,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs) => {
        const v1 = inputs['v₁'] || 3
        const A1 = inputs['A₁'] || 6
        const A2 = inputs['A₂'] || 2
        // Continuity equation: A₁v₁ = A₂v₂
        const v2 = (A1 * v1) / A2
        return { 'v₂': Math.round(v2 * 10) / 10 }
    },
    formatCalculation: (inputs) => {
        const v1 = inputs['v₁'] || 3
        const A1 = inputs['A₁'] || 6
        const A2 = inputs['A₂'] || 2
        const v2 = (A1 * v1) / A2
        return `v₂ = (A₁×v₁)/A₂ = (${A1}×${v1})/${A2} = ${v2.toFixed(1)} m/s`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'v₁', to: 'v₂', operator: '×' },
            { from: 'A₁', to: 'v₂', operator: '×' },
            { from: 'A₂', to: 'v₂', operator: '÷' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'v₂',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'A₁' },
                    { type: 'op', value: '×' },
                    { type: 'var', symbol: 'v₁' },
                ],
                denominator: [{ type: 'var', symbol: 'A₂' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'venturi-effect',
            mission: 'A₂를 A₁보다 훨씬 작게 해봐',
            missionEn: 'Make A₂ much smaller than A₁',
            result: '좁은 곳에서 유체가 빨라지는 벤투리 효과!',
            resultEn: 'Venturi effect - fluid speeds up in narrow sections!',
            icon: '💨',
            condition: (vars) => {
                const A1 = vars['A₁'] || 6
                const A2 = vars['A₂'] || 2
                const v2 = vars['v₂'] || 9
                return A2 <= A1 / 3 && v2 >= 15
            },
        },
        {
            id: 'airplane-lift',
            mission: '높은 속도로 양력 원리를 체험해봐',
            missionEn: 'Experience lift principle with high speed',
            result: '빠른 공기 = 낮은 압력 = 위로 뜨는 힘!',
            resultEn: 'Fast air = low pressure = upward lift!',
            icon: '✈️',
            condition: (vars) => {
                const v2 = vars['v₂'] || 9
                return v2 >= 20
            },
        },
        {
            id: 'equal-flow',
            mission: 'A₁과 A₂를 비슷하게 맞춰봐',
            missionEn: 'Make A₁ and A₂ similar',
            result: '면적이 같으면 속도도 같아!',
            resultEn: 'Equal areas mean equal velocities!',
            icon: '⚖️',
            condition: (vars) => {
                const A1 = vars['A₁'] || 6
                const A2 = vars['A₂'] || 2
                const v1 = vars['v₁'] || 3
                const v2 = vars['v₂'] || 9
                return Math.abs(A1 - A2) <= 1 && Math.abs(v1 - v2) <= 1
            },
        },
    ],
    getInsight: (variables) => {
        const v1 = variables['v₁'] || 3
        const v2 = variables['v₂'] || 9
        const A1 = variables['A₁'] || 6
        const A2 = variables['A₂'] || 2

        const speedRatio = v2 / v1
        const areaRatio = A1 / A2

        if (speedRatio > 3) {
            return {
                ko: `출구 속도가 ${speedRatio.toFixed(1)}배 빨라졌어요! 비행기 날개 위 공기도 이렇게 빨라져요.`,
                en: `Exit speed increased ${speedRatio.toFixed(1)}x! Air above airplane wings speeds up similarly.`,
            }
        }

        if (areaRatio > 2) {
            return {
                ko: `면적이 ${areaRatio.toFixed(1)}배 좁아지면 속도가 그만큼 빨라져요. 호스 끝을 막으면 물이 세게 나오는 원리!`,
                en: `Area reduced ${areaRatio.toFixed(1)}x means speed increases proportionally. Like squeezing a hose!`,
            }
        }

        return {
            ko: `연속 방정식: A₁v₁ = A₂v₂. 유체는 좁은 곳에서 빨라져요!`,
            en: `Continuity equation: A₁v₁ = A₂v₂. Fluids speed up in narrow sections!`,
        }
    },
}
