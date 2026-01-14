import { Formula } from './types'
import { colors } from '../styles/colors'

export const magneticField: Formula = {
    id: 'magnetic-field',
    name: '직선 전류의 자기장',
    nameEn: 'Magnetic Field from Wire',
    expression: 'B = μ₀I/(2πr)',
    description: '전류가 흐르는 도선 주위에 원형 자기장이 생긴다',
    descriptionEn:
        'A current-carrying wire creates a circular magnetic field around it',
    simulationHint: '전류를 높이거나 도선에 가까이 가서 자기장 세기 변화를 보세요',
    simulationHintEn: 'Increase current or get closer to wire to see field strength change',
    applications: [
        '전자석 - 전류로 자석 만들기',
        'MRI 기계 - 강한 자기장으로 신체 촬영',
        '스피커 - 전류 변화로 소리 생성',
        '전동기 - 자기장으로 회전력 생성',
    ],
    applicationsEn: [
        'Electromagnets - creating magnets with current',
        'MRI machines - body imaging with strong magnetic fields',
        'Speakers - generating sound with current changes',
        'Electric motors - creating rotation with magnetic fields',
    ],
    category: 'electricity',
    variables: [
        {
            symbol: 'I',
            name: '전류',
            nameEn: 'Current',
            role: 'input',
            unit: 'A',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'glow',
                scale: (v) => v / 20,
                color: colors.current,
            },
        },
        {
            symbol: 'r',
            name: '거리',
            nameEn: 'Distance',
            role: 'input',
            unit: 'cm',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'distance',
                scale: (v) => v,
                color: colors.distance,
            },
        },
        {
            symbol: 'B',
            name: '자기장 세기',
            nameEn: 'Magnetic field',
            role: 'output',
            unit: 'μT',
            range: [0, 1000],
            default: 20,
            visual: {
                property: 'glow',
                scale: (v) => v / 50,
                color: colors.charge,
            },
        },
    ],
    calculate: (inputs) => {
        const I = inputs['I'] || 10
        const r = (inputs['r'] || 10) / 100 // cm to m
        const mu0 = 4 * Math.PI * 1e-7 // permeability of free space
        const B = (mu0 * I) / (2 * Math.PI * r)
        const B_microTesla = B * 1e6
        return { B: Math.round(B_microTesla * 10) / 10 }
    },
    formatCalculation: (inputs) => {
        const I = inputs['I'] || 10
        const r = inputs['r'] || 10
        const rMeters = r / 100
        const mu0 = 4 * Math.PI * 1e-7
        const B = (mu0 * I) / (2 * Math.PI * rMeters)
        const B_microTesla = B * 1e6
        return `B = μ₀×${I}/(2π×${r}cm) = ${B_microTesla.toFixed(1)} μT`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'I', to: 'B', operator: '×' },
            { from: 'r', to: 'B', operator: '÷' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'B',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'text', value: 'μ₀' },
                    { type: 'var', symbol: 'I' },
                ],
                denominator: [
                    { type: 'text', value: '2π' },
                    { type: 'var', symbol: 'r' },
                ],
            },
        ],
    },
    discoveries: [
        {
            id: 'close-field',
            mission: 'r을 최소로 줄여서 강한 자기장을 만들어봐',
            missionEn: 'Minimize r to create strong magnetic field',
            result: '가까울수록 자기장이 강해! 전자석 코어가 중요한 이유!',
            resultEn: 'Closer = stronger field! This is why electromagnet cores matter!',
            icon: '🧲',
            condition: (vars) => {
                const r = vars['r'] || 10
                const B = vars['B'] || 20
                return r <= 2 && B >= 100
            },
        },
        {
            id: 'high-current',
            mission: 'I를 최대로 올려봐',
            missionEn: 'Maximize current I',
            result: '전류가 클수록 자기장도 강해져!',
            resultEn: 'More current = stronger magnetic field!',
            icon: '⚡',
            condition: (vars) => {
                const I = vars['I'] || 10
                return I >= 90
            },
        },
        {
            id: 'earth-field',
            mission: '지구 자기장(~50μT) 정도의 세기를 만들어봐',
            missionEn: "Create Earth's magnetic field strength (~50μT)",
            result: '지구 자기장은 나침반을 움직이게 하는 힘!',
            resultEn: "Earth's field is what makes compasses work!",
            icon: '🌍',
            condition: (vars) => {
                const B = vars['B'] || 20
                return B >= 45 && B <= 55
            },
        },
    ],
    getInsight: (variables) => {
        const B = variables['B'] || 20

        if (B > 100) {
            return {
                ko: `${B.toFixed(0)}μT는 지구 자기장(~50μT)의 ${(B / 50).toFixed(1)}배예요!`,
                en: `${B.toFixed(0)}μT is ${(B / 50).toFixed(1)}x Earth's field (~50μT)!`,
            }
        }
        return {
            ko: `오른손 법칙: 엄지가 전류 방향이면 나머지 손가락이 자기장 방향!`,
            en: `Right-hand rule: thumb = current direction, fingers = field direction!`,
        }
    },
}
