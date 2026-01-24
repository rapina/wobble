import { Formula } from './types'
import { colors } from '../styles/colors'

export const centripetal: Formula = {
    id: 'centripetal',
    name: {
        ko: '구심력',
        en: 'Centripetal Force',
        ja: '向心力',
        es: 'Fuerza Centrípeta',
        pt: 'Força Centrípeta',
        'zh-CN': '向心力',
        'zh-TW': '向心力',
    },
    expression: 'F = mv²/r',
    description: {
        ko: '원운동하는 물체를 중심으로 당기는 힘',
        en: 'The force pulling a rotating object toward the center',
        ja: '円運動する物体を中心に引く力',
        es: 'La fuerza que tira de un objeto en rotación hacia el centro',
        pt: 'A força que puxa um objeto em rotação em direção ao centro',
        'zh-CN': '将圆周运动物体拉向圆心的力',
        'zh-TW': '將圓周運動物體拉向圓心的力',
    },
    simulationHint: {
        ko: '물체가 원형 궤도를 따라 회전하며 중심 방향으로 힘을 받는 모습',
        en: 'Shows an object rotating in a circular path with force toward the center',
        ja: '物体が円軌道を回りながら中心方向に力を受ける様子',
        es: 'Muestra un objeto rotando en una trayectoria circular con fuerza hacia el centro',
        pt: 'Mostra um objeto girando em um caminho circular com força em direção ao centro',
        'zh-CN': '显示物体沿圆形轨道旋转并受到指向圆心的力',
        'zh-TW': '顯示物體沿圓形軌道旋轉並受到指向圓心的力',
    },
    applications: {
        ko: [
            '놀이공원 회전 놀이기구의 안전 설계',
            '자동차가 커브길을 돌 때 필요한 마찰력 계산',
            '세탁기 탈수 기능의 원리',
            '인공위성의 궤도 속도 계산',
        ],
        en: [
            'Safety design for amusement park rides',
            'Calculating friction for cars on curves',
            'How washing machine spin cycles work',
            'Calculating satellite orbital velocity',
        ],
        ja: [
            '遊園地の回転アトラクションの安全設計',
            'カーブでの車の摩擦力計算',
            '洗濯機の脱水機能の原理',
            '人工衛星の軌道速度計算',
        ],
        es: [
            'Diseño de seguridad para atracciones de parques de diversiones',
            'Cálculo de fricción para autos en curvas',
            'Cómo funcionan los ciclos de centrifugado de lavadoras',
            'Cálculo de velocidad orbital de satélites',
        ],
        pt: [
            'Projeto de segurança para brinquedos de parques de diversões',
            'Cálculo de atrito para carros em curvas',
            'Como funcionam os ciclos de centrifugação de lavadoras',
            'Cálculo de velocidade orbital de satélites',
        ],
        'zh-CN': [
            '游乐园旋转游乐设施的安全设计',
            '计算汽车转弯时所需的摩擦力',
            '洗衣机脱水功能的原理',
            '计算人造卫星的轨道速度',
        ],
        'zh-TW': [
            '遊樂園旋轉遊樂設施的安全設計',
            '計算汽車轉彎時所需的摩擦力',
            '洗衣機脫水功能的原理',
            '計算人造衛星的軌道速度',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: { ko: '질량', en: 'Mass', ja: '質量', es: 'Masa', pt: 'Massa', 'zh-CN': '质量', 'zh-TW': '質量' },
            role: 'input',
            unit: 'kg',
            range: [1, 20],
            default: 5,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 2,
                color: colors.mass,
            },
        },
        {
            symbol: 'v',
            name: { ko: '속력', en: 'Velocity', ja: '速度', es: 'Velocidad', pt: 'Velocidade', 'zh-CN': '速率', 'zh-TW': '速率' },
            role: 'input',
            unit: 'm/s',
            range: [1, 10],
            default: 4,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'r',
            name: { ko: '반지름', en: 'Radius', ja: '半径', es: 'Radio', pt: 'Raio', 'zh-CN': '半径', 'zh-TW': '半徑' },
            role: 'input',
            unit: 'm',
            range: [1, 10],
            default: 3,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 15,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: { ko: '구심력', en: 'Centripetal Force', ja: '向心力', es: 'Fuerza Centrípeta', pt: 'Força Centrípeta', 'zh-CN': '向心力', 'zh-TW': '向心力' },
            role: 'output',
            unit: 'N',
            range: [0, 500],
            default: 26.67,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 5
        const v = inputs.v ?? 4
        const r = inputs.r ?? 3
        return {
            F: (m * v * v) / r,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 5
        const v = inputs.v ?? 4
        const r = inputs.r ?? 3
        const F = (m * v * v) / r
        return `F = ${m.toFixed(1)} × ${v.toFixed(1)}² ÷ ${r.toFixed(1)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'm', to: 'v', operator: '×' },
            { from: 'v', to: 'r', operator: '²' },
            { from: 'r', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'F',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'm' },
                    { type: 'var', symbol: 'v', square: true },
                ],
                denominator: [{ type: 'var', symbol: 'r' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'high-speed-turn',
            mission: {
                ko: '속력 v를 9 이상으로 올리고 반지름 r을 3 이하로 줄여봐!',
                en: 'Raise velocity v above 9 and reduce radius r below 3!',
                ja: '速度vを9以上にして半径rを3以下にしてみよう！',
                es: '¡Sube la velocidad v por encima de 9 y reduce el radio r por debajo de 3!',
                pt: 'Aumente a velocidade v acima de 9 e reduza o raio r abaixo de 3!',
                'zh-CN': '把速率v提高到9以上，半径r减少到3以下！',
                'zh-TW': '把速率v提高到9以上，半徑r減少到3以下！',
            },
            result: {
                ko: '빠른 속도로 좁게 돌면 구심력이 급증해! 급커브에서 차가 미끄러지는 이유야.',
                en: 'Fast tight turns require huge centripetal force! This is why cars skid on sharp curves.',
                ja: '速い速度で狭く回ると向心力が急増する！急カーブで車がスリップする理由だ。',
                es: '¡Los giros cerrados rápidos requieren una fuerza centrípeta enorme! Por eso los autos derrапан en curvas cerradas.',
                pt: 'Curvas fechadas rápidas exigem força centrípeta enorme! Por isso carros derrapam em curvas fechadas.',
                'zh-CN': '高速急转弯需要巨大的向心力！这就是汽车在急弯处打滑的原因。',
                'zh-TW': '高速急轉彎需要巨大的向心力！這就是汽車在急彎處打滑的原因。',
            },
            icon: '🏎️',
            condition: (vars) => vars['v'] >= 9 && vars['r'] <= 3,
        },
        {
            id: 'gentle-curve',
            mission: {
                ko: '반지름 r을 최대(10m)로 늘려봐!',
                en: 'Maximize radius r to 10m!',
                ja: '半径rを最大(10m)にしてみよう！',
                es: '¡Maximiza el radio r a 10m!',
                pt: 'Maximize o raio r para 10m!',
                'zh-CN': '把半径r增加到最大（10m）！',
                'zh-TW': '把半徑r增加到最大（10m）！',
            },
            result: {
                ko: '큰 반지름으로 돌면 구심력이 작아져! 고속도로 커브가 완만한 이유야.',
                en: 'Large radius curves need less force! This is why highway curves are gentle.',
                ja: '大きな半径で回ると向心力が小さくなる！高速道路のカーブが緩やかな理由だ。',
                es: '¡Las curvas de radio grande necesitan menos fuerza! Por eso las curvas de autopista son suaves.',
                pt: 'Curvas de raio grande precisam de menos força! Por isso as curvas de rodovia são suaves.',
                'zh-CN': '大半径转弯需要的力更小！这就是高速公路弯道平缓的原因。',
                'zh-TW': '大半徑轉彎需要的力更小！這就是高速公路彎道平緩的原因。',
            },
            icon: '🛣️',
            condition: (vars) => vars['r'] >= 9,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 10)
            return {
                ko: '요요 돌리는 힘 정도야',
                en: 'Like spinning a yo-yo',
                ja: 'ヨーヨーを回す力くらい',
                es: 'Como girar un yo-yo',
                pt: 'Como girar um ioiô',
                'zh-CN': '像转悠悠球的力',
                'zh-TW': '像轉溜溜球的力',
            }
        if (F < 50)
            return {
                ko: '줄에 공 돌리는 힘이야',
                en: 'Like spinning a ball on string',
                ja: '紐でボールを回す力',
                es: 'Como girar una pelota en una cuerda',
                pt: 'Como girar uma bola em uma corda',
                'zh-CN': '像用绳子转球的力',
                'zh-TW': '像用繩子轉球的力',
            }
        if (F < 150)
            return {
                ko: '회전목마의 힘이야',
                en: 'Like a carousel',
                ja: 'メリーゴーランドの力',
                es: 'Como un carrusel',
                pt: 'Como um carrossel',
                'zh-CN': '像旋转木马的力',
                'zh-TW': '像旋轉木馬的力',
            }
        if (F < 300)
            return {
                ko: '자동차 커브 도는 힘이야',
                en: 'Car turning a curve',
                ja: '車がカーブを曲がる力',
                es: 'Auto tomando una curva',
                pt: 'Carro fazendo uma curva',
                'zh-CN': '汽车转弯的力',
                'zh-TW': '汽車轉彎的力',
            }
        return {
            ko: '롤러코스터급 힘이야!',
            en: 'Roller coaster level force!',
            ja: 'ジェットコースター級の力！',
            es: '¡Fuerza nivel montaña rusa!',
            pt: 'Força nível montanha-russa!',
            'zh-CN': '过山车级别的力！',
            'zh-TW': '雲霄飛車級別的力！',
        }
    },
}
