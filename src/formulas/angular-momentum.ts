import { Formula } from './types'
import { colors } from '../styles/colors'

export const angularMomentum: Formula = {
    id: 'angular-momentum',
    name: { ko: '각운동량 보존', en: 'Angular Momentum', ja: '角運動量保存' },
    expression: 'L = Iω',
    description: {
        ko: '회전하는 물체의 각운동량은 외부 토크가 없으면 보존된다',
        en: 'Angular momentum of a rotating object is conserved when no external torque acts on it',
        ja: '回転する物体の角運動量は外部トルクがなければ保存される',
    },
    simulationHint: {
        ko: '관성 모멘트를 줄이면 회전 속도가 빨라지는 것을 관찰하세요',
        en: 'Watch how reducing moment of inertia increases rotation speed',
        ja: '慣性モーメントを減らすと回転速度が速くなる様子を観察',
    },
    applications: {
        ko: [
            '피겨 스케이팅 - 팔을 오므리면 회전이 빨라짐',
            '다이빙 - 몸을 웅크리면 회전 속도 증가',
            '자전거 바퀴 - 자이로스코프 효과로 균형 유지',
            '행성 형성 - 가스 구름이 수축하며 회전 가속',
        ],
        en: [
            'Figure skating - pulling arms in speeds up the spin',
            'Diving - tucking body increases rotation speed',
            'Bicycle wheel - gyroscopic effect maintains balance',
            'Planet formation - gas clouds spin faster as they contract',
        ],
        ja: [
            'フィギュアスケート - 腕を縮めると回転が速くなる',
            '飛び込み - 体を丸めると回転速度が増加',
            '自転車の車輪 - ジャイロ効果でバランス維持',
            '惑星形成 - ガス雲が収縮すると回転が加速',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'L',
            name: { ko: '각운동량', en: 'Angular momentum', ja: '角運動量' },
            role: 'input',
            unit: 'kg·m²/s',
            range: [10, 100],
            default: 50,
            visual: {
                property: 'glow',
                scale: (v) => v / 20,
                color: colors.force,
            },
        },
        {
            symbol: 'I',
            name: { ko: '관성 모멘트', en: 'Moment of inertia', ja: '慣性モーメント' },
            role: 'input',
            unit: 'kg·m²',
            range: [1, 20],
            default: 10,
            visual: {
                property: 'size',
                scale: (v) => v * 3,
                color: colors.mass,
            },
        },
        {
            symbol: 'ω',
            name: { ko: '각속도', en: 'Angular velocity', ja: '角速度' },
            role: 'output',
            unit: 'rad/s',
            range: [0.5, 100],
            default: 5,
            visual: {
                property: 'speed',
                scale: (v) => v,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs) => {
        const L = inputs['L'] || 50
        const I = inputs['I'] || 10
        const omega = L / I
        return { 'ω': Math.round(omega * 100) / 100 }
    },
    formatCalculation: (inputs) => {
        const L = inputs['L'] || 50
        const I = inputs['I'] || 10
        const omega = L / I
        return `ω = L/I = ${L}/${I} = ${omega.toFixed(2)} rad/s`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'L', to: 'ω', operator: '÷' },
            { from: 'I', to: 'ω', operator: '÷' },
        ],
    },
    displayLayout: {
        type: 'fraction',
        output: 'ω',
        numerator: ['L'],
        denominator: ['I'],
    },
    discoveries: [
        {
            id: 'skater-spin',
            mission: {
                ko: 'I를 줄여서 피겨 스케이터처럼 빠르게 회전해봐',
                en: 'Decrease I to spin fast like a figure skater',
                ja: 'Iを減らしてフィギュアスケーターのように速く回転しよう',
            },
            result: {
                ko: '팔을 모으면 관성 모멘트가 줄어 회전이 빨라져!',
                en: 'Pulling arms in reduces moment of inertia, speeding up rotation!',
                ja: '腕を縮めると慣性モーメントが減り回転が速くなる！',
            },
            icon: '⛸️',
            condition: (vars) => {
                const I = vars['I'] || 10
                const omega = vars['ω'] || 5
                return I <= 3 && omega >= 15
            },
        },
        {
            id: 'slow-rotation',
            mission: {
                ko: 'I를 늘려서 천천히 회전해봐',
                en: 'Increase I to rotate slowly',
                ja: 'Iを増やしてゆっくり回転しよう',
            },
            result: {
                ko: '팔을 벌리면 관성 모멘트가 커져 회전이 느려져!',
                en: 'Spreading arms increases moment of inertia, slowing rotation!',
                ja: '腕を広げると慣性モーメントが大きくなり回転が遅くなる！',
            },
            icon: '🦅',
            condition: (vars) => {
                const I = vars['I'] || 10
                const omega = vars['ω'] || 5
                return I >= 15 && omega <= 4
            },
        },
        {
            id: 'high-momentum',
            mission: {
                ko: 'L을 최대로 높여봐',
                en: 'Maximize L',
                ja: 'Lを最大にしてみよう',
            },
            result: {
                ko: '각운동량이 클수록 더 강력한 회전력을 가져!',
                en: 'Higher angular momentum means stronger rotational power!',
                ja: '角運動量が大きいほどより強力な回転力を持つ！',
            },
            icon: '💫',
            condition: (vars) => {
                const L = vars['L'] || 50
                return L >= 90
            },
        },
    ],
    getInsight: (variables) => {
        const L = variables['L'] || 50
        const I = variables['I'] || 10
        const omega = variables['ω'] || 5

        if (omega > 20) {
            return {
                ko: `초당 ${(omega / (2 * Math.PI)).toFixed(1)}바퀴! 피겨 선수들은 초당 5-6회전까지 해요.`,
                en: `${(omega / (2 * Math.PI)).toFixed(1)} rotations per second! Figure skaters can do 5-6 spins/sec.`,
                ja: `毎秒${(omega / (2 * Math.PI)).toFixed(1)}回転！フィギュアスケーターは毎秒5-6回転できます。`,
            }
        }

        if (I <= 3) {
            return {
                ko: `관성 모멘트가 작아 빠르게 회전해요. 피겨 스케이터가 팔을 모으는 원리!`,
                en: `Low moment of inertia means fast rotation. This is how figure skaters spin!`,
                ja: `慣性モーメントが小さいので速く回転します。フィギュアスケーターが腕を縮める原理！`,
            }
        }

        return {
            ko: `각운동량 ${L}이 보존되면서 회전 속도가 결정돼요.`,
            en: `With angular momentum ${L} conserved, the rotation speed is determined.`,
            ja: `角運動量${L}が保存されながら回転速度が決まります。`,
        }
    },
}
