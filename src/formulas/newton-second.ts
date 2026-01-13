import { Formula } from './types'
import { colors } from '../styles/colors'

export const newtonSecond: Formula = {
    id: 'newton-second',
    name: '뉴턴 제2법칙',
    nameEn: "Newton's Second Law",
    expression: 'F = ma',
    description: '힘은 질량과 가속도의 곱과 같다',
    descriptionEn: 'Force equals mass times acceleration',
    simulationHint: '캐릭터에 힘이 가해질 때 질량에 따라 가속도가 달라지는 모습',
    simulationHintEn: 'Shows how acceleration changes based on mass when force is applied',
    applications: [
        '자동차 급브레이크 시 필요한 제동력 계산',
        '로켓 발사 시 필요한 추진력 설계',
        '엘리베이터 가속 시 케이블 장력 계산',
        '스포츠에서 공을 차거나 던질 때 힘 분석',
    ],
    applicationsEn: [
        'Calculating braking force for emergency stops',
        'Designing thrust for rocket launches',
        'Calculating cable tension during elevator acceleration',
        'Analyzing force when kicking or throwing a ball in sports',
    ],
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: '질량',
            nameEn: 'Mass',
            role: 'input',
            unit: 'kg',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 40 + value * 1.2,
                color: colors.mass,
            },
        },
        {
            symbol: 'a',
            name: '가속도',
            nameEn: 'Acceleration',
            role: 'input',
            unit: 'm/s²',
            range: [0.1, 20],
            default: 5,
            visual: {
                property: 'stretch',
                scale: (value: number) => 1 + value * 0.05, // More visible stretch
                color: colors.velocity,
            },
        },
        {
            symbol: 'F',
            name: '힘',
            nameEn: 'Force',
            role: 'output',
            unit: 'N',
            range: [0, 2000],
            default: 50,
            visual: {
                property: 'shake',
                scale: (value: number) => Math.min(value * 0.02, 10), // More visible shake
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const a = inputs.a ?? 5
        return {
            F: m * a,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const a = inputs.a ?? 5
        const F = m * a
        return `F = ${m.toFixed(0)} × ${a.toFixed(1)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm', to: 'a', operator: '×' },
            { from: 'a', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['m', 'a'],
    },
    discoveries: [
        {
            id: 'heavy-acceleration',
            mission: '질량 m을 최대로 높이고 가속도 a를 10 이상으로 설정해봐!',
            missionEn: 'Set mass m to max and acceleration a above 10!',
            result: '무거운 물체를 빠르게 가속하려면 엄청난 힘이 필요해!',
            resultEn: 'Accelerating a heavy object quickly requires enormous force!',
            icon: '💪',
            condition: (vars) => vars['m'] >= 90 && vars['a'] >= 10,
        },
        {
            id: 'light-high-accel',
            mission: '질량을 5 이하로 낮추고 가속도를 최대로 올려봐!',
            missionEn: 'Lower mass below 5 and maximize acceleration!',
            result: '가벼운 물체는 작은 힘으로도 빠르게 가속돼!',
            resultEn: 'Light objects accelerate quickly with little force!',
            icon: '🪶',
            condition: (vars) => vars['m'] <= 5 && vars['a'] >= 18,
        },
    ],
}
