import { Formula } from './types'
import { colors } from '../styles/colors'

export const projectile: Formula = {
    id: 'projectile',
    name: {
        ko: '포물선 운동',
        en: 'Projectile Motion',
        ja: '放物運動',
        es: 'Movimiento de Proyectil',
        pt: 'Movimento de Projétil',
        'zh-CN': '抛体运动',
        'zh-TW': '拋體運動',
    },
    expression: 'R = v²sin2θ/g',
    description: {
        ko: '비스듬히 던진 물체의 수평 도달 거리',
        en: 'The horizontal range of an object thrown at an angle',
        ja: '斜めに投げた物体の水平到達距離',
        es: 'El alcance horizontal de un objeto lanzado en ángulo',
        pt: 'O alcance horizontal de um objeto lançado em ângulo',
        'zh-CN': '斜抛物体的水平射程',
        'zh-TW': '斜拋物體的水平射程',
    },
    simulationHint: {
        ko: '물체가 포물선 궤적을 그리며 날아가는 모습',
        en: 'Shows an object flying through the air in a parabolic trajectory',
        ja: '物体が放物線を描いて飛ぶ様子',
        es: 'Muestra un objeto volando en una trayectoria parabólica',
        pt: 'Mostra um objeto voando em uma trajetória parabólica',
        'zh-CN': '展示物体沿抛物线轨迹飞行',
        'zh-TW': '展示物體沿拋物線軌跡飛行',
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
        es: [
            'Predicción de trayectoria del balón en fútbol o baloncesto',
            'Cálculo del alcance de cañones o misiles',
            'Diseño de chorros de fuentes',
            'Encontrar el ángulo óptimo para golpes de golf',
        ],
        pt: [
            'Previsão da trajetória da bola no futebol ou basquete',
            'Cálculo do alcance de canhões ou mísseis',
            'Projeto de jatos de fontes',
            'Encontrar o ângulo ideal para tacadas de golfe',
        ],
        'zh-CN': [
            '预测足球或篮球的球轨迹',
            '计算大炮或导弹的射程',
            '设计喷泉水柱',
            '寻找高尔夫开球的最佳角度',
        ],
        'zh-TW': [
            '預測足球或籃球的球軌跡',
            '計算大炮或飛彈的射程',
            '設計噴泉水柱',
            '尋找高爾夫開球的最佳角度',
        ],
    },
    category: 'gravity',
    variables: [
        {
            symbol: 'v',
            name: {
                ko: '초기 속력',
                en: 'Initial Velocity',
                ja: '初速度',
                es: 'Velocidad Inicial',
                pt: 'Velocidade Inicial',
                'zh-CN': '初速度',
                'zh-TW': '初速度',
            },
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
            name: {
                ko: '발사각',
                en: 'Launch Angle',
                ja: '発射角',
                es: 'Ángulo de Lanzamiento',
                pt: 'Ângulo de Lançamento',
                'zh-CN': '发射角',
                'zh-TW': '發射角',
            },
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
            name: {
                ko: '중력가속도',
                en: 'Gravitational Accel.',
                ja: '重力加速度',
                es: 'Acel. Gravitacional',
                pt: 'Acel. Gravitacional',
                'zh-CN': '重力加速度',
                'zh-TW': '重力加速度',
            },
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
            name: {
                ko: '수평 도달거리',
                en: 'Horizontal Range',
                ja: '水平到達距離',
                es: 'Alcance Horizontal',
                pt: 'Alcance Horizontal',
                'zh-CN': '水平射程',
                'zh-TW': '水平射程',
            },
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
                es: '¡Establece el ángulo θ en 45 grados!',
                pt: 'Defina o ângulo θ em 45 graus!',
                'zh-CN': '将发射角θ设为45度！',
                'zh-TW': '將發射角θ設為45度！',
            },
            result: {
                ko: '45°가 최대 도달 거리! sin(90°)=1이 되어 최대 효율이야.',
                en: '45 degrees gives maximum range! Because sin(90 degrees)=1 gives maximum efficiency.',
                ja: '45°が最大到達距離！sin(90°)=1で最大効率になるよ。',
                es: '¡45 grados da el alcance máximo! Porque sin(90°)=1 da la máxima eficiencia.',
                pt: '45 graus dá o alcance máximo! Porque sin(90°)=1 dá a máxima eficiência.',
                'zh-CN': '45度时射程最大！因为sin(90°)=1时效率最高。',
                'zh-TW': '45度時射程最大！因為sin(90°)=1時效率最高。',
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
                es: '¡Reduce la aceleración g por debajo de 3! (Luna o Marte)',
                pt: 'Reduza a aceleração g abaixo de 3! (Lua ou Marte)',
                'zh-CN': '将重力加速度g降低到3以下！（月球或火星）',
                'zh-TW': '將重力加速度g降低到3以下！（月球或火星）',
            },
            result: {
                ko: '중력이 약하면 물체가 훨씬 멀리 날아가! 달에서는 골프공이 엄청 멀리 갈 거야.',
                en: 'With weak gravity, objects fly much farther! A golf ball on the Moon would go incredibly far.',
                ja: '重力が弱いと物体がもっと遠くに飛ぶ！月ではゴルフボールがすごく遠くに飛ぶよ。',
                es: '¡Con poca gravedad, los objetos vuelan mucho más lejos! Una pelota de golf en la Luna llegaría increíblemente lejos.',
                pt: 'Com pouca gravidade, os objetos voam muito mais longe! Uma bola de golfe na Lua iria incrivelmente longe.',
                'zh-CN': '重力弱时，物体飞得更远！高尔夫球在月球上能飞得非常远。',
                'zh-TW': '重力弱時，物體飛得更遠！高爾夫球在月球上能飛得非常遠。',
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
                es: 'Como lanzar una pelota',
                pt: 'Como jogar uma bola',
                'zh-CN': '像扔球一样',
                'zh-TW': '像丟球一樣',
            }
        if (R < 30)
            return {
                ko: '농구 슛 거리야',
                en: 'Basketball shot distance',
                ja: 'バスケのシュート距離だよ',
                es: 'Distancia de tiro de baloncesto',
                pt: 'Distância de arremesso de basquete',
                'zh-CN': '篮球投篮距离',
                'zh-TW': '籃球投籃距離',
            }
        if (R < 60)
            return {
                ko: '축구장 절반 거리야',
                en: 'Half a soccer field',
                ja: 'サッカー場の半分だよ',
                es: 'Medio campo de fútbol',
                pt: 'Metade de um campo de futebol',
                'zh-CN': '半个足球场',
                'zh-TW': '半個足球場',
            }
        if (R < 100)
            return {
                ko: '축구장 길이야',
                en: 'Soccer field length',
                ja: 'サッカー場の長さだよ',
                es: 'Longitud de un campo de fútbol',
                pt: 'Comprimento de um campo de futebol',
                'zh-CN': '一个足球场长',
                'zh-TW': '一個足球場長',
            }
        if (R < 200)
            return {
                ko: '골프 드라이버 샷이야!',
                en: 'Golf driver shot!',
                ja: 'ゴルフのドライバーショットだよ！',
                es: '¡Golpe de driver de golf!',
                pt: 'Tacada de driver de golfe!',
                'zh-CN': '高尔夫开球距离！',
                'zh-TW': '高爾夫開球距離！',
            }
        return {
            ko: '대포 사거리야!',
            en: 'Cannon range!',
            ja: '大砲の射程だよ！',
            es: '¡Alcance de cañón!',
            pt: 'Alcance de canhão!',
            'zh-CN': '大炮射程！',
            'zh-TW': '大炮射程！',
        }
    },
}
