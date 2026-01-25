import { Formula } from './types'
import { colors } from '../styles/colors'

export const escapeVelocity: Formula = {
    id: 'escape-velocity',
    name: {
        ko: '탈출속도',
        en: 'Escape Velocity',
        ja: '脱出速度',
        es: 'Velocidad de Escape',
        pt: 'Velocidade de Escape',
        'zh-CN': '逃逸速度',
        'zh-TW': '逃逸速度',
    },
    expression: 'v = √(2GM/r)',
    description: {
        ko: '행성의 중력을 벗어나기 위한 최소 속도',
        en: "The minimum velocity needed to escape a planet's gravity",
        ja: '惑星の重力を脱出するために必要な最小速度',
        es: 'La velocidad mínima necesaria para escapar de la gravedad de un planeta',
        pt: 'A velocidade mínima necessária para escapar da gravidade de um planeta',
        'zh-CN': '逃离行星引力所需的最小速度',
        'zh-TW': '逃離行星引力所需的最小速度',
    },
    simulationHint: {
        ko: '물체가 행성의 중력을 벗어나는 데 필요한 속도를 보여주는 모습',
        en: 'Shows the velocity needed for an object to escape planetary gravity',
        ja: '物体が惑星の重力を脱出するのに必要な速度を示す',
        es: 'Muestra la velocidad necesaria para que un objeto escape de la gravedad planetaria',
        pt: 'Mostra a velocidade necessária para um objeto escapar da gravidade planetária',
        'zh-CN': '展示物体逃离行星引力所需的速度',
        'zh-TW': '展示物體逃離行星引力所需的速度',
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
        es: [
            'Cálculo de velocidad de lanzamiento de cohetes',
            'Comprensión de horizontes de eventos de agujeros negros',
            'Condiciones para retención de atmósfera planetaria',
            'Diseño de trayectorias de naves espaciales',
        ],
        pt: [
            'Cálculo da velocidade de lançamento de foguetes',
            'Compreensão dos horizontes de eventos de buracos negros',
            'Condições para retenção de atmosfera planetária',
            'Projeto de trajetórias de espaçonaves',
        ],
        'zh-CN': ['计算火箭发射速度', '理解黑洞事件视界', '行星大气保持条件', '设计航天器轨道'],
        'zh-TW': ['計算火箭發射速度', '理解黑洞事件視界', '行星大氣保持條件', '設計太空船軌道'],
    },
    category: 'gravity',
    variables: [
        {
            symbol: 'M',
            name: {
                ko: '행성 질량',
                en: 'Planet Mass',
                ja: '惑星質量',
                es: 'Masa del Planeta',
                pt: 'Massa do Planeta',
                'zh-CN': '行星质量',
                'zh-TW': '行星質量',
            },
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
            name: {
                ko: '행성 반지름',
                en: 'Planet Radius',
                ja: '惑星半径',
                es: 'Radio del Planeta',
                pt: 'Raio do Planeta',
                'zh-CN': '行星半径',
                'zh-TW': '行星半徑',
            },
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
            name: {
                ko: '탈출속도',
                en: 'Escape Velocity',
                ja: '脱出速度',
                es: 'Velocidad de Escape',
                pt: 'Velocidade de Escape',
                'zh-CN': '逃逸速度',
                'zh-TW': '逃逸速度',
            },
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
        if (v < 3)
            return {
                ko: '달 정도의 탈출속도야',
                en: 'Escape velocity like the Moon',
                ja: '月程度の脱出速度だよ',
                es: 'Velocidad de escape como la Luna',
                pt: 'Velocidade de escape como a Lua',
                'zh-CN': '相当于月球的逃逸速度',
                'zh-TW': '相當於月球的逃逸速度',
            }
        if (v < 8)
            return {
                ko: '화성 정도의 탈출속도야',
                en: 'Escape velocity like Mars',
                ja: '火星程度の脱出速度だよ',
                es: 'Velocidad de escape como Marte',
                pt: 'Velocidade de escape como Marte',
                'zh-CN': '相当于火星的逃逸速度',
                'zh-TW': '相當於火星的逃逸速度',
            }
        if (v < 15)
            return {
                ko: '지구 정도의 탈출속도야',
                en: 'Escape velocity like Earth',
                ja: '地球程度の脱出速度だよ',
                es: 'Velocidad de escape como la Tierra',
                pt: 'Velocidade de escape como a Terra',
                'zh-CN': '相当于地球的逃逸速度',
                'zh-TW': '相當於地球的逃逸速度',
            }
        if (v < 40)
            return {
                ko: '가스 행성 정도의 탈출속도야',
                en: 'Gas giant level escape velocity',
                ja: 'ガス惑星程度の脱出速度だよ',
                es: 'Velocidad de escape de gigante gaseoso',
                pt: 'Velocidade de escape de gigante gasoso',
                'zh-CN': '气态巨行星级别的逃逸速度',
                'zh-TW': '氣態巨行星級別的逃逸速度',
            }
        if (v < 100)
            return {
                ko: '태양 정도의 탈출속도야',
                en: 'Sun level escape velocity',
                ja: '太陽程度の脱出速度だよ',
                es: 'Velocidad de escape nivel Sol',
                pt: 'Velocidade de escape nível Sol',
                'zh-CN': '太阳级别的逃逸速度',
                'zh-TW': '太陽級別的逃逸速度',
            }
        return {
            ko: '중성자별급! 광속에 가까워',
            en: 'Neutron star level! Close to light speed',
            ja: '中性子星級！光速に近いよ',
            es: '¡Nivel estrella de neutrones! Cerca de la velocidad de la luz',
            pt: 'Nível estrela de nêutrons! Perto da velocidade da luz',
            'zh-CN': '中子星级别！接近光速',
            'zh-TW': '中子星級別！接近光速',
        }
    },
    discoveries: [
        {
            id: 'earth-escape',
            mission: {
                ko: '지구 값 (M=5.97, r=6.37)을 설정해봐!',
                en: 'Set Earth values (M=5.97, r=6.37)!',
                ja: '地球の値（M=5.97, r=6.37）を設定してみて！',
                es: '¡Establece los valores de la Tierra (M=5.97, r=6.37)!',
                pt: 'Defina os valores da Terra (M=5.97, r=6.37)!',
                'zh-CN': '设置地球的值（M=5.97, r=6.37）！',
                'zh-TW': '設置地球的值（M=5.97, r=6.37）！',
            },
            result: {
                ko: '지구 탈출속도는 약 11.2km/s! 로켓이 이 속도를 내야 우주로 갈 수 있어.',
                en: 'Earth escape velocity is about 11.2km/s! Rockets must reach this speed to go to space.',
                ja: '地球の脱出速度は約11.2km/s！ロケットがこの速度を出さないと宇宙に行けないよ。',
                es: '¡La velocidad de escape de la Tierra es unos 11.2km/s! Los cohetes deben alcanzar esta velocidad para ir al espacio.',
                pt: 'A velocidade de escape da Terra é cerca de 11.2km/s! Os foguetes devem atingir essa velocidade para ir ao espaço.',
                'zh-CN': '地球的逃逸速度约为11.2km/s！火箭必须达到这个速度才能进入太空。',
                'zh-TW': '地球的逃逸速度約為11.2km/s！火箭必須達到這個速度才能進入太空。',
            },
            icon: '🚀',
            condition: (vars) =>
                vars['M'] >= 5.5 && vars['M'] <= 6.5 && vars['r'] >= 6 && vars['r'] <= 7,
        },
        {
            id: 'black-hole',
            mission: {
                ko: '질량 M을 최대로 올리고 반지름 r을 최소로 줄여봐!',
                en: 'Maximize mass M and minimize radius r!',
                ja: '質量Mを最大にして半径rを最小にしてみて！',
                es: '¡Maximiza la masa M y minimiza el radio r!',
                pt: 'Maximize a massa M e minimize o raio r!',
                'zh-CN': '将质量M调到最大，半径r调到最小！',
                'zh-TW': '將質量M調到最大，半徑r調到最小！',
            },
            result: {
                ko: '질량이 크고 반지름이 작으면 탈출속도가 광속에 가까워져! 블랙홀의 원리야.',
                en: 'Large mass and small radius means escape velocity approaches light speed! The principle of black holes.',
                ja: '質量が大きく半径が小さいと脱出速度が光速に近づく！ブラックホールの原理だよ。',
                es: '¡Gran masa y pequeño radio significa que la velocidad de escape se acerca a la luz! El principio de los agujeros negros.',
                pt: 'Grande massa e pequeno raio significa que a velocidade de escape se aproxima da luz! O princípio dos buracos negros.',
                'zh-CN': '质量大、半径小意味着逃逸速度接近光速！这就是黑洞的原理。',
                'zh-TW': '質量大、半徑小意味著逃逸速度接近光速！這就是黑洞的原理。',
            },
            icon: '🕳️',
            condition: (vars) => vars['M'] >= 180 && vars['r'] <= 5,
        },
    ],
}
