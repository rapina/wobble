import { Formula } from './types'
import { colors } from '../styles/colors'

export const escapeVelocity: Formula = {
    id: 'escape-velocity',
    name: { ko: '탈출속도', en: 'Escape Velocity', ja: '脱出速度' },
    expression: 'v = √(2GM/r)',
    description: {
        ko: '행성의 중력을 벗어나기 위한 최소 속도',
        en: "The minimum velocity needed to escape a planet's gravity",
        ja: '惑星の重力を脱出するために必要な最小速度',
    },
    simulationHint: {
        ko: '물체가 행성의 중력을 벗어나는 데 필요한 속도를 보여주는 모습',
        en: 'Shows the velocity needed for an object to escape planetary gravity',
        ja: '物体が惑星の重力を脱出するのに必要な速度を示す',
    },
    applications: {
        ko: [
            '로켓 발사 속도 계산',
            '블랙홀의 사건 지평선 이해',
            '행성 대기 유지 조건',
            '우주 탐사선의 궤도 설계',
        ],
        en: [
            'Calculating rocket launch velocity',
            'Understanding black hole event horizons',
            'Conditions for planetary atmosphere retention',
            'Designing spacecraft trajectories',
        ],
        ja: [
            'ロケット打ち上げ速度の計算',
            'ブラックホールの事象の地平線の理解',
            '惑星が大気を保持する条件',
            '宇宙探査機の軌道設計',
        ],
    },
    category: 'gravity',
    variables: [
        {
            symbol: 'M',
            name: { ko: '행성 질량', en: 'Planet Mass', ja: '惑星質量' },
            role: 'input',
            unit: '×10²⁴kg',
            range: [0.1, 200],
            default: 5.97,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 0.3,
                color: colors.mass,
            },
        },
        {
            symbol: 'r',
            name: { ko: '행성 반지름', en: 'Planet Radius', ja: '惑星半径' },
            role: 'input',
            unit: '×10⁶m',
            range: [1, 100],
            default: 6.37,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 2,
                color: colors.distance,
            },
        },
        {
            symbol: 'v',
            name: { ko: '탈출속도', en: 'Escape Velocity', ja: '脱出速度' },
            role: 'output',
            unit: 'km/s',
            range: [0, 100],
            default: 11.2,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.3,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const M = inputs.M ?? 5.97 // ×10²⁴ kg
        const r = inputs.r ?? 6.37 // ×10⁶ m
        const G = 6.674e-11
        // M in 10^24 kg, r in 10^6 m
        const M_kg = M * 1e24
        const r_m = r * 1e6
        const v_ms = Math.sqrt((2 * G * M_kg) / r_m)
        const v_kms = v_ms / 1000
        return { v: v_kms }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const M = inputs.M ?? 5.97
        const r = inputs.r ?? 6.37
        const G = 6.674e-11
        const M_kg = M * 1e24
        const r_m = r * 1e6
        const v_ms = Math.sqrt((2 * G * M_kg) / r_m)
        const v_kms = v_ms / 1000
        return `v = √(2G × ${M.toFixed(2)} ÷ ${r.toFixed(2)}) = ${v_kms.toFixed(1)} km/s`
    },
    layout: {
        type: 'orbital',
        connections: [
            { from: 'M', to: 'r', operator: '÷' },
            { from: 'r', to: 'v', operator: '√' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'v',
        expression: [
            { type: 'text', value: '√' },
            {
                type: 'group',
                items: [
                    {
                        type: 'fraction',
                        numerator: [
                            { type: 'text', value: '2G' },
                            { type: 'var', symbol: 'M' },
                        ],
                        denominator: [{ type: 'var', symbol: 'r' }],
                    },
                ],
            },
        ],
    },
    getInsight: (vars) => {
        const v = vars['v']
        if (v < 3) return { ko: '달 정도의 탈출속도야', en: 'Escape velocity like the Moon', ja: '月程度の脱出速度だよ' }
        if (v < 8) return { ko: '화성 정도의 탈출속도야', en: 'Escape velocity like Mars', ja: '火星程度の脱出速度だよ' }
        if (v < 15) return { ko: '지구 정도의 탈출속도야', en: 'Escape velocity like Earth', ja: '地球程度の脱出速度だよ' }
        if (v < 40) return { ko: '가스 행성 정도의 탈출속도야', en: 'Gas giant level escape velocity', ja: 'ガス惑星程度の脱出速度だよ' }
        if (v < 100) return { ko: '태양 정도의 탈출속도야', en: 'Sun level escape velocity', ja: '太陽程度の脱出速度だよ' }
        return { ko: '중성자별급! 광속에 가까워', en: 'Neutron star level! Close to light speed', ja: '中性子星級！光速に近いよ' }
    },
    discoveries: [
        {
            id: 'earth-escape',
            mission: { ko: '지구 값 (M=5.97, r=6.37)을 설정해봐!', en: 'Set Earth values (M=5.97, r=6.37)!', ja: '地球の値（M=5.97, r=6.37）を設定してみて！' },
            result: { ko: '지구 탈출속도는 약 11.2km/s! 로켓이 이 속도를 내야 우주로 갈 수 있어.', en: 'Earth escape velocity is about 11.2km/s! Rockets must reach this speed to go to space.', ja: '地球の脱出速度は約11.2km/s！ロケットがこの速度を出さないと宇宙に行けないよ。' },
            icon: '🚀',
            condition: (vars) => vars['M'] >= 5.5 && vars['M'] <= 6.5 && vars['r'] >= 6 && vars['r'] <= 7,
        },
        {
            id: 'black-hole',
            mission: { ko: '질량 M을 최대로 올리고 반지름 r을 최소로 줄여봐!', en: 'Maximize mass M and minimize radius r!', ja: '質量Mを最大にして半径rを最小にしてみて！' },
            result: { ko: '질량이 크고 반지름이 작으면 탈출속도가 광속에 가까워져! 블랙홀의 원리야.', en: 'Large mass and small radius means escape velocity approaches light speed! The principle of black holes.', ja: '質量が大きく半径が小さいと脱出速度が光速に近づく！ブラックホールの原理だよ。' },
            icon: '🕳️',
            condition: (vars) => vars['M'] >= 180 && vars['r'] <= 5,
        },
    ],
}
