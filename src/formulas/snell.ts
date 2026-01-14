import { Formula } from './types'
import { colors } from '../styles/colors'

export const snell: Formula = {
    id: 'snell',
    name: '스넬의 법칙',
    nameEn: "Snell's Law",
    expression: 'n₁sinθ₁ = n₂sinθ₂',
    description: '빛이 다른 매질로 들어갈 때 굴절되는 각도의 관계',
    descriptionEn: 'Relationship of refraction angles when light enters a different medium',
    simulationHint: '빛이 물이나 유리에 들어갈 때 꺾이는 모습',
    simulationHintEn: 'Shows light bending as it enters water or glass',
    applications: [
        '안경 렌즈와 콘택트렌즈 설계',
        '광섬유 통신의 전반사 원리',
        '무지개가 생기는 원리',
        '수영장 물 속이 얕아 보이는 이유',
    ],
    applicationsEn: [
        'Designing eyeglasses and contact lenses',
        'Total internal reflection in fiber optic communications',
        'How rainbows form',
        'Why pools appear shallower than they are',
    ],
    category: 'wave',
    variables: [
        {
            symbol: 'n₁',
            name: '매질 1 굴절률',
            nameEn: 'Medium 1 Refractive Index',
            role: 'input',
            unit: '',
            range: [1, 2.5],
            default: 1,
            visual: {
                property: 'glow',
                scale: (value: number) => value,
                color: colors.velocity,
            },
        },
        {
            symbol: 'θ₁',
            name: '입사각',
            nameEn: 'Incident Angle',
            role: 'input',
            unit: '°',
            range: [0, 85],
            default: 45,
            visual: {
                property: 'distance',
                scale: (value: number) => value,
                color: colors.distance,
            },
        },
        {
            symbol: 'n₂',
            name: '매질 2 굴절률',
            nameEn: 'Medium 2 Refractive Index',
            role: 'input',
            unit: '',
            range: [1, 2.5],
            default: 1.5,
            visual: {
                property: 'glow',
                scale: (value: number) => value,
                color: colors.spring,
            },
        },
        {
            symbol: 'θ₂',
            name: '굴절각',
            nameEn: 'Refracted Angle',
            role: 'output',
            unit: '°',
            range: [0, 90],
            default: 28.1,
            visual: {
                property: 'distance',
                scale: (value: number) => value,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const n1 = inputs['n₁'] ?? 1
        const theta1 = inputs['θ₁'] ?? 45
        const n2 = inputs['n₂'] ?? 1.5
        const theta1Rad = (theta1 * Math.PI) / 180

        // n1 * sin(theta1) = n2 * sin(theta2)
        // sin(theta2) = n1 * sin(theta1) / n2
        const sinTheta2 = (n1 * Math.sin(theta1Rad)) / n2

        // Check for total internal reflection
        if (Math.abs(sinTheta2) > 1) {
            return { 'θ₂': 90 } // Total internal reflection
        }

        const theta2Rad = Math.asin(sinTheta2)
        const theta2 = (theta2Rad * 180) / Math.PI
        return {
            'θ₂': theta2,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const n1 = inputs['n₁'] ?? 1
        const theta1 = inputs['θ₁'] ?? 45
        const n2 = inputs['n₂'] ?? 1.5
        const theta1Rad = (theta1 * Math.PI) / 180
        const sinTheta2 = (n1 * Math.sin(theta1Rad)) / n2

        if (Math.abs(sinTheta2) > 1) {
            return `전반사! sin(θ₂) = ${n1.toFixed(2)} × sin(${theta1.toFixed(0)}°) ÷ ${n2.toFixed(2)} > 1`
        }

        const theta2 = (Math.asin(sinTheta2) * 180) / Math.PI
        return `θ₂ = arcsin(${n1.toFixed(2)} × sin(${theta1.toFixed(0)}°) ÷ ${n2.toFixed(2)}) = ${theta2.toFixed(1)}°`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'n₁', to: 'θ₁', operator: '×' },
            { from: 'n₂', to: 'θ₂', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'θ₂',
        expression: [
            { type: 'text', value: 'arcsin' },
            {
                type: 'group',
                items: [
                    {
                        type: 'fraction',
                        numerator: [
                            { type: 'var', symbol: 'n₁' },
                            { type: 'text', value: 'sin' },
                            { type: 'var', symbol: 'θ₁' },
                        ],
                        denominator: [{ type: 'var', symbol: 'n₂' }],
                    },
                ],
            },
        ],
    },
    discoveries: [
        {
            id: 'total-internal-reflection',
            mission: 'n₁ > n₂로 설정하고 입사각을 높여봐!',
            missionEn: 'Set n₁ > n₂ and increase the incident angle!',
            result: '전반사 발견! 빛이 완전히 반사돼!',
            resultEn: 'Total internal reflection! Light is completely reflected!',
            icon: '✨',
            condition: (vars) => {
                const n1 = vars['n₁'] ?? 1
                const n2 = vars['n₂'] ?? 1.5
                const theta1 = vars['θ₁'] ?? 45
                const theta1Rad = (theta1 * Math.PI) / 180
                const sinTheta2 = (n1 * Math.sin(theta1Rad)) / n2
                return Math.abs(sinTheta2) > 1
            },
        },
        {
            id: 'strong-refraction',
            mission: 'n₂를 2 이상으로 높여봐!',
            missionEn: 'Increase n₂ to 2 or more!',
            result: '다이아몬드 같은 고굴절률 매질에선 빛이 크게 꺾여!',
            resultEn: 'In high-refractive materials like diamond, light bends sharply!',
            icon: '💎',
            condition: (vars) => vars['n₂'] >= 2,
        },
    ],
    getInsight: (vars) => {
        const theta2 = vars['θ₂']
        if (theta2 >= 90) return { ko: '전반사! 빛이 완전히 반사돼', en: 'Total reflection! Light bounces back' }
        if (theta2 < 10) return { ko: '빛이 거의 직진해', en: 'Light goes almost straight' }
        if (theta2 < 30) return { ko: '빛이 살짝 꺾여', en: 'Light bends slightly' }
        if (theta2 < 50) return { ko: '빛이 많이 꺾여', en: 'Light bends noticeably' }
        return { ko: '빛이 크게 굴절해!', en: 'Light refracts significantly!' }
    },
}
