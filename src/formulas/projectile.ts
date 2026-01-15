import { Formula } from './types'
import { colors } from '../styles/colors'

export const projectile: Formula = {
    id: 'projectile',
    name: { ko: '포물선 운동', en: 'Projectile Motion', ja: '放物運動' },
    expression: 'R = v²sin2θ/g',
    description: {
        ko: '비스듬히 던진 물체의 수평 도달 거리',
        en: 'The horizontal range of an object thrown at an angle',
        ja: '斜めに投げた物体の水平到達距離',
    },
    simulationHint: {
        ko: '물체가 포물선 궤적을 그리며 날아가는 모습',
        en: 'Shows an object flying through the air in a parabolic trajectory',
        ja: '物体が放物線を描いて飛ぶ様子',
    },
    applications: {
        ko: [
            '축구나 농구에서 공의 궤적 예측',
            '대포나 미사일의 사거리 계산',
            '분수대 물줄기 설계',
            '골프 드라이버 샷의 최적 각도',
        ],
        en: [
            'Predicting ball trajectory in soccer or basketball',
            'Calculating cannon or missile range',
            'Designing fountain water jets',
            'Finding optimal angle for golf drives',
        ],
        ja: [
            'サッカーやバスケでのボールの軌道予測',
            '大砲やミサイルの射程計算',
            '噴水の水流設計',
            'ゴルフドライバーショットの最適角度',
        ],
    },
    category: 'gravity',
    variables: [
        {
            symbol: 'v',
            name: { ko: '초기 속력', en: 'Initial Velocity', ja: '初速度' },
            role: 'input',
            unit: 'm/s',
            range: [5, 50],
            default: 20,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.2,
                color: colors.velocity,
            },
        },
        {
            symbol: 'θ',
            name: { ko: '발사각', en: 'Launch Angle', ja: '発射角' },
            role: 'input',
            unit: '°',
            range: [10, 80],
            default: 45,
            visual: {
                property: 'stretch',
                scale: (value: number) => value / 30,
                color: colors.force,
            },
        },
        {
            symbol: 'g',
            name: { ko: '중력가속도', en: 'Gravitational Accel.', ja: '重力加速度' },
            role: 'input',
            unit: 'm/s²',
            range: [1, 25],
            default: 9.8,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 5,
                color: colors.mass,
            },
        },
        {
            symbol: 'R',
            name: { ko: '수평 도달거리', en: 'Horizontal Range', ja: '水平到達距離' },
            role: 'output',
            unit: 'm',
            range: [0, 300],
            default: 40.8,
            visual: {
                property: 'distance',
                scale: (value: number) => Math.min(value, 150),
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const v = inputs.v ?? 20
        const theta = inputs['θ'] ?? 45
        const g = inputs.g ?? 9.8
        const thetaRad = (theta * Math.PI) / 180
        const R = (v * v * Math.sin(2 * thetaRad)) / g
        return { R }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const v = inputs.v ?? 20
        const theta = inputs['θ'] ?? 45
        const g = inputs.g ?? 9.8
        const thetaRad = (theta * Math.PI) / 180
        const R = (v * v * Math.sin(2 * thetaRad)) / g
        return `R = ${v.toFixed(0)}² × sin(${(2 * theta).toFixed(0)}°) ÷ ${g.toFixed(1)} = ${R.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'v', to: 'θ', operator: '×' },
            { from: 'θ', to: 'g', operator: '÷' },
            { from: 'g', to: 'R', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'R',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'v', square: true },
                    { type: 'text', value: 'sin2' },
                    { type: 'var', symbol: 'θ' },
                ],
                denominator: [{ type: 'var', symbol: 'g' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'optimal-angle',
            mission: {
                ko: '발사각 θ를 45°로 설정해봐!',
                en: 'Set launch angle θ to 45 degrees!',
                ja: '発射角θを45°に設定してみて！',
            },
            result: {
                ko: '45°가 최대 도달 거리! sin(90°)=1이 되어 최대 효율이야.',
                en: '45 degrees gives maximum range! Because sin(90 degrees)=1 gives maximum efficiency.',
                ja: '45°が最大到達距離！sin(90°)=1で最大効率になるよ。',
            },
            icon: '🎯',
            condition: (vars) => vars['θ'] >= 44 && vars['θ'] <= 46,
        },
        {
            id: 'low-gravity-launch',
            mission: {
                ko: '중력가속도 g를 3 이하로 낮춰봐! (달이나 화성)',
                en: 'Lower gravitational acceleration g below 3! (Moon or Mars)',
                ja: '重力加速度gを3以下に下げてみて！（月や火星）',
            },
            result: {
                ko: '중력이 약하면 물체가 훨씬 멀리 날아가! 달에서는 골프공이 엄청 멀리 갈 거야.',
                en: 'With weak gravity, objects fly much farther! A golf ball on the Moon would go incredibly far.',
                ja: '重力が弱いと物体がもっと遠くに飛ぶ！月ではゴルフボールがすごく遠くに飛ぶよ。',
            },
            icon: '🌙',
            condition: (vars) => vars['g'] <= 3,
        },
    ],
    getInsight: (vars) => {
        const R = vars['R']
        if (R < 10)
            return {
                ko: '공 던지기 정도야',
                en: 'Like throwing a ball',
                ja: 'ボールを投げるくらいだよ',
            }
        if (R < 30)
            return {
                ko: '농구 슛 거리야',
                en: 'Basketball shot distance',
                ja: 'バスケのシュート距離だよ',
            }
        if (R < 60)
            return {
                ko: '축구장 절반 거리야',
                en: 'Half a soccer field',
                ja: 'サッカー場の半分だよ',
            }
        if (R < 100)
            return { ko: '축구장 길이야', en: 'Soccer field length', ja: 'サッカー場の長さだよ' }
        if (R < 200)
            return {
                ko: '골프 드라이버 샷이야!',
                en: 'Golf driver shot!',
                ja: 'ゴルフのドライバーショットだよ！',
            }
        return { ko: '대포 사거리야!', en: 'Cannon range!', ja: '大砲の射程だよ！' }
    },
}
