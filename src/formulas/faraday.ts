import { Formula } from './types'
import { colors } from '../styles/colors'

export const faraday: Formula = {
    id: 'faraday',
    name: '패러데이 법칙',
    nameEn: "Faraday's Law",
    expression: 'EMF = -NΔΦ/Δt',
    description: '자기장의 변화가 전기를 만든다 - 발전기의 원리',
    descriptionEn:
        'A changing magnetic field induces electric current - the principle of generators',
    simulationHint: '자석을 빠르게 움직여 더 큰 전압을 만들어보세요',
    simulationHintEn: 'Move the magnet faster to generate more voltage',
    applications: [
        '발전소 - 터빈으로 자석을 돌려 전기 생산',
        '자전거 발전기 - 바퀴 회전으로 라이트 켜기',
        '무선 충전 - 자기장 변화로 전력 전송',
        '기타 픽업 - 현의 진동을 전기 신호로 변환',
    ],
    applicationsEn: [
        'Power plants - rotating magnets with turbines',
        'Bicycle dynamo - wheel rotation powers lights',
        'Wireless charging - power transfer via changing magnetic field',
        'Guitar pickup - converts string vibration to electric signal',
    ],
    category: 'electricity',
    variables: [
        {
            symbol: 'N',
            name: '코일 감은 수',
            nameEn: 'Number of turns',
            role: 'input',
            unit: '회',
            range: [1, 100],
            default: 50,
            visual: {
                property: 'size',
                scale: (v) => v / 10,
                color: colors.resistance,
            },
        },
        {
            symbol: 'ΔΦ',
            name: '자속 변화량',
            nameEn: 'Change in magnetic flux',
            role: 'input',
            unit: 'Wb',
            range: [0.01, 1],
            default: 0.2,
            visual: {
                property: 'glow',
                scale: (v) => v * 10,
                color: colors.charge,
            },
        },
        {
            symbol: 'Δt',
            name: '시간 변화',
            nameEn: 'Time interval',
            role: 'input',
            unit: 's',
            range: [0.01, 1],
            default: 0.1,
            visual: {
                property: 'speed',
                scale: (v) => 1 / v,
                color: colors.time,
            },
        },
        {
            symbol: 'EMF',
            name: '유도 기전력',
            nameEn: 'Induced EMF',
            role: 'output',
            unit: 'V',
            range: [0, 1000],
            default: 100,
            visual: {
                property: 'glow',
                scale: (v) => v / 50,
                color: colors.voltage,
            },
        },
    ],
    calculate: (inputs) => {
        const N = inputs['N'] || 50
        const dPhi = inputs['ΔΦ'] || 0.2
        const dt = inputs['Δt'] || 0.1
        const EMF = Math.abs(N * dPhi / dt)
        return { EMF: Math.round(EMF * 10) / 10 }
    },
    formatCalculation: (inputs) => {
        const N = inputs['N'] || 50
        const dPhi = inputs['ΔΦ'] || 0.2
        const dt = inputs['Δt'] || 0.1
        const EMF = Math.abs(N * dPhi / dt)
        return `EMF = ${N} × ${dPhi}/${dt} = ${EMF.toFixed(1)} V`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'N', to: 'EMF', operator: '×' },
            { from: 'ΔΦ', to: 'EMF', operator: '×' },
            { from: 'Δt', to: 'EMF', operator: '÷' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'EMF',
        expression: [
            { type: 'var', symbol: 'N' },
            { type: 'op', value: '×' },
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'ΔΦ' }],
                denominator: [{ type: 'var', symbol: 'Δt' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'fast-change',
            mission: 'Δt를 줄여서 빠른 자속 변화를 만들어봐',
            missionEn: 'Decrease Δt to create rapid flux change',
            result: '빠른 변화 = 큰 전압! 발전기는 빠르게 회전해야 해!',
            resultEn: 'Faster change = more voltage! Generators spin fast!',
            icon: '⚡',
            condition: (vars) => {
                const dt = vars['Δt'] || 0.1
                const EMF = vars['EMF'] || 100
                return dt <= 0.02 && EMF >= 200
            },
        },
        {
            id: 'many-turns',
            mission: 'N을 최대로 올려봐',
            missionEn: 'Maximize N (number of turns)',
            result: '감은 수가 많을수록 전압이 높아져!',
            resultEn: 'More turns = higher voltage!',
            icon: '🔄',
            condition: (vars) => {
                const N = vars['N'] || 50
                return N >= 90
            },
        },
        {
            id: 'power-generation',
            mission: 'EMF를 500V 이상으로 만들어봐',
            missionEn: 'Generate EMF above 500V',
            result: '발전소에서는 수천 볼트를 만들어요!',
            resultEn: 'Power plants generate thousands of volts!',
            icon: '🏭',
            condition: (vars) => {
                const EMF = vars['EMF'] || 100
                return EMF >= 500
            },
        },
    ],
    getInsight: (variables) => {
        const N = variables['N'] || 50
        const EMF = variables['EMF'] || 100

        if (EMF > 200) {
            return {
                ko: `${EMF.toFixed(0)}V면 LED ${Math.floor(EMF / 3)}개 정도 켤 수 있어요!`,
                en: `${EMF.toFixed(0)}V could power about ${Math.floor(EMF / 3)} LEDs!`,
            }
        }
        return {
            ko: `패러데이가 1831년에 발견한 이 원리로 현대 문명의 전기가 만들어져요!`,
            en: `Faraday discovered this in 1831 - it powers modern civilization!`,
        }
    },
}
