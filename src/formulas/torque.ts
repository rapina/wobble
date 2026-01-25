import { Formula } from './types'
import { colors } from '../styles/colors'

export const torque: Formula = {
    id: 'torque',
    name: {
        ko: '토크 (돌림힘)',
        en: 'Torque',
        ja: 'トルク（回転力）',
        es: 'Torque (Par)',
        pt: 'Torque',
        'zh-CN': '扭矩',
        'zh-TW': '扭矩',
    },
    expression: 'τ = rF sin θ',
    description: {
        ko: '물체를 회전시키는 힘의 효과',
        en: 'The rotational effect of a force',
        ja: '物体を回転させる力の効果',
        es: 'El efecto rotacional de una fuerza',
        pt: 'O efeito rotacional de uma força',
        'zh-CN': '使物体旋转的力的效果',
        'zh-TW': '使物體旋轉的力的效果',
    },
    simulationHint: {
        ko: '힘의 크기와 회전축까지의 거리에 따라 회전력이 변하는 모습',
        en: 'Shows how rotational force changes with force magnitude and distance from axis',
        ja: '力の大きさと回転軸までの距離に応じて回転力が変わる様子',
        es: 'Muestra cómo cambia la fuerza rotacional con la magnitud de la fuerza y la distancia al eje',
        pt: 'Mostra como a força rotacional muda com a magnitude da força e a distância do eixo',
        'zh-CN': '显示旋转力如何随力的大小和到轴的距离变化',
        'zh-TW': '顯示旋轉力如何隨力的大小和到軸的距離變化',
    },
    applications: {
        ko: [
            '렌치로 볼트를 조이는 원리',
            '시소의 균형 잡기',
            '자전거 페달 밟기의 효율',
            '문 손잡이가 문 가장자리에 있는 이유',
        ],
        en: [
            'Tightening bolts with a wrench',
            'Balancing a seesaw',
            'Efficiency of pedaling a bicycle',
            'Why door handles are at the edge',
        ],
        ja: [
            'レンチでボルトを締める原理',
            'シーソーのバランス',
            '自転車のペダルをこぐ効率',
            'ドアの取っ手が端にある理由',
        ],
        es: [
            'Apretar pernos con una llave',
            'Equilibrar un balancín',
            'Eficiencia de pedalear una bicicleta',
            'Por qué las manijas de puerta están en el borde',
        ],
        pt: [
            'Apertar parafusos com uma chave',
            'Equilibrar uma gangorra',
            'Eficiência de pedalar uma bicicleta',
            'Por que as maçanetas ficam na borda',
        ],
        'zh-CN': [
            '用扳手拧螺栓的原理',
            '跷跷板的平衡',
            '骑自行车踩踏板的效率',
            '门把手在门边缘的原因',
        ],
        'zh-TW': [
            '用扳手擰螺栓的原理',
            '蹺蹺板的平衡',
            '騎自行車踩踏板的效率',
            '門把手在門邊緣的原因',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'r',
            name: {
                ko: '거리 (반지름)',
                en: 'Distance (Radius)',
                ja: '距離（半径）',
                es: 'Distancia (Radio)',
                pt: 'Distância (Raio)',
                'zh-CN': '距离（半径）',
                'zh-TW': '距離（半徑）',
            },
            role: 'input',
            unit: 'm',
            range: [0.1, 2],
            default: 0.5,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 60,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: {
                ko: '힘',
                en: 'Force',
                ja: '力',
                es: 'Fuerza',
                pt: 'Força',
                'zh-CN': '力',
                'zh-TW': '力',
            },
            role: 'input',
            unit: 'N',
            range: [10, 200],
            default: 50,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.force,
            },
        },
        {
            symbol: 'θ',
            name: {
                ko: '각도',
                en: 'Angle',
                ja: '角度',
                es: 'Ángulo',
                pt: 'Ângulo',
                'zh-CN': '角度',
                'zh-TW': '角度',
            },
            role: 'input',
            unit: '°',
            range: [0, 90],
            default: 90,
            visual: {
                property: 'stretch',
                scale: (value: number) => 1 + (90 - value) / 180,
                color: colors.velocity,
            },
        },
        {
            symbol: 'τ',
            name: {
                ko: '토크',
                en: 'Torque',
                ja: 'トルク',
                es: 'Torque',
                pt: 'Torque',
                'zh-CN': '扭矩',
                'zh-TW': '扭矩',
            },
            role: 'output',
            unit: 'N·m',
            range: [0, 400],
            default: 25,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 10,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const r = inputs.r ?? 0.5
        const F = inputs.F ?? 50
        const theta = inputs['θ'] ?? 90
        const thetaRad = (theta * Math.PI) / 180
        return {
            τ: r * F * Math.sin(thetaRad),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const r = inputs.r ?? 0.5
        const F = inputs.F ?? 50
        const theta = inputs['θ'] ?? 90
        const thetaRad = (theta * Math.PI) / 180
        const tau = r * F * Math.sin(thetaRad)
        return `τ = ${r.toFixed(2)} × ${F.toFixed(0)} × sin(${theta.toFixed(0)}°) = ${tau.toFixed(2)}`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'r', to: 'F', operator: '×' },
            { from: 'F', to: 'θ', operator: '×' },
            { from: 'θ', to: 'τ', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'τ',
        expression: [
            { type: 'var', symbol: 'r' },
            { type: 'var', symbol: 'F' },
            { type: 'text', value: 'sin' },
            { type: 'var', symbol: 'θ' },
        ],
    },
    getInsight: (vars) => {
        const tau = vars['τ']
        if (tau < 5)
            return {
                ko: '문고리 살짝 돌리는 정도야',
                en: 'Barely turning a door handle',
                ja: 'ドアノブをそっと回す程度',
                es: 'Apenas girando una manija de puerta',
                pt: 'Mal girando uma maçaneta',
                'zh-CN': '轻轻转动门把手的程度',
                'zh-TW': '輕輕轉動門把手的程度',
            }
        if (tau < 20)
            return {
                ko: '병뚜껑 여는 정도야',
                en: 'Opening a bottle cap',
                ja: 'ボトルキャップを開ける程度',
                es: 'Abriendo una tapa de botella',
                pt: 'Abrindo uma tampa de garrafa',
                'zh-CN': '打开瓶盖的程度',
                'zh-TW': '打開瓶蓋的程度',
            }
        if (tau < 50)
            return {
                ko: '렌치로 볼트 조이는 힘이야',
                en: 'Tightening a bolt with a wrench',
                ja: 'レンチでボルトを締める力',
                es: 'Apretando un perno con una llave',
                pt: 'Apertando um parafuso com uma chave',
                'zh-CN': '用扳手拧紧螺栓的力',
                'zh-TW': '用扳手擰緊螺栓的力',
            }
        if (tau < 100)
            return {
                ko: '자전거 페달 밟는 힘이야',
                en: 'Pedaling a bicycle',
                ja: '自転車のペダルをこぐ力',
                es: 'Pedaleando una bicicleta',
                pt: 'Pedalando uma bicicleta',
                'zh-CN': '骑自行车踩踏板的力',
                'zh-TW': '騎自行車踩踏板的力',
            }
        if (tau < 200)
            return {
                ko: '무거운 문을 여는 힘이야',
                en: 'Opening a heavy door',
                ja: '重いドアを開ける力',
                es: 'Abriendo una puerta pesada',
                pt: 'Abrindo uma porta pesada',
                'zh-CN': '打开沉重的门的力',
                'zh-TW': '打開沉重的門的力',
            }
        return {
            ko: '엔진급 회전력!',
            en: 'Engine-level torque!',
            ja: 'エンジン級の回転力！',
            es: '¡Torque nivel motor!',
            pt: 'Torque nível motor!',
            'zh-CN': '发动机级别的扭矩！',
            'zh-TW': '發動機級別的扭矩！',
        }
    },
    discoveries: [
        {
            id: 'lever-arm',
            mission: {
                ko: '거리 r을 1.5m 이상으로 늘려봐!',
                en: 'Extend distance r above 1.5m!',
                ja: '距離rを1.5m以上に伸ばしてみて！',
                es: '¡Extiende la distancia r por encima de 1.5m!',
                pt: 'Estenda a distância r acima de 1.5m!',
                'zh-CN': '将距离r增加到1.5m以上！',
                'zh-TW': '將距離r增加到1.5m以上！',
            },
            result: {
                ko: '팔 길이가 길면 작은 힘으로도 큰 토크! 긴 렌치가 볼트를 쉽게 푸는 이유야.',
                en: 'Longer lever arm means more torque with less force! Why long wrenches loosen bolts easily.',
                ja: '腕の長さが長いと小さい力でも大きなトルク！長いレンチがボルトを簡単に緩める理由だよ。',
                es: '¡Brazo de palanca más largo significa más torque con menos fuerza! Por eso las llaves largas aflojan pernos fácilmente.',
                pt: 'Braço de alavanca mais longo significa mais torque com menos força! Por isso chaves longas afrouxam parafusos facilmente.',
                'zh-CN': '力臂越长，用更小的力就能产生更大的扭矩！这就是长扳手容易松开螺栓的原因。',
                'zh-TW': '力臂越長，用更小的力就能產生更大的扭矩！這就是長扳手容易鬆開螺栓的原因。',
            },
            icon: '🔧',
            condition: (vars) => vars['r'] >= 1.5,
        },
        {
            id: 'perpendicular-force',
            mission: {
                ko: '각도 θ를 90°로 설정해봐!',
                en: 'Set angle θ to 90 degrees!',
                ja: '角度θを90°に設定してみて！',
                es: '¡Pon el ángulo θ en 90 grados!',
                pt: 'Defina o ângulo θ para 90 graus!',
                'zh-CN': '将角度θ设为90度！',
                'zh-TW': '將角度θ設為90度！',
            },
            result: {
                ko: '수직으로 힘을 가하면 토크가 최대! 문을 수직으로 밀 때 가장 쉽게 열리는 이유야.',
                en: 'Perpendicular force gives maximum torque! This is why doors open easiest when pushed straight.',
                ja: '垂直に力を加えるとトルクが最大！ドアをまっすぐ押すと一番簡単に開く理由だよ。',
                es: '¡Fuerza perpendicular da torque máximo! Por eso las puertas se abren más fácil al empujar recto.',
                pt: 'Força perpendicular dá torque máximo! Por isso portas abrem mais fácil ao empurrar reto.',
                'zh-CN': '垂直施力时扭矩最大！这就是垂直推门时最容易打开的原因。',
                'zh-TW': '垂直施力時扭矩最大！這就是垂直推門時最容易打開的原因。',
            },
            icon: '🚪',
            condition: (vars) => vars['θ'] >= 85 && vars['θ'] <= 90,
        },
    ],
}
