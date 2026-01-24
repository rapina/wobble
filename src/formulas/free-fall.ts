import { Formula } from './types'
import { colors } from '../styles/colors'

export const freeFall: Formula = {
    id: 'free-fall',
    name: {
        ko: '자유낙하',
        en: 'Free Fall',
        ja: '自由落下',
        es: 'Caída Libre',
        pt: 'Queda Livre',
        'zh-CN': '自由落体',
        'zh-TW': '自由落體',
    },
    expression: 'h = ½gt²',
    description: {
        ko: '중력에 의해 자유낙하하는 물체의 이동 거리',
        en: 'The distance traveled by an object in free fall under gravity',
        ja: '重力で自由落下する物体の移動距離',
        es: 'La distancia recorrida por un objeto en caída libre bajo la gravedad',
        pt: 'A distância percorrida por um objeto em queda livre sob a gravidade',
        'zh-CN': '物体在重力作用下自由下落的距离',
        'zh-TW': '物體在重力作用下自由下落的距離',
    },
    simulationHint: {
        ko: '물체가 중력에 의해 점점 빨라지며 떨어지는 모습',
        en: 'Shows an object accelerating downward under gravity',
        ja: '物体が重力で加速しながら落ちる様子',
        es: 'Muestra un objeto acelerando hacia abajo por la gravedad',
        pt: 'Mostra um objeto acelerando para baixo pela gravidade',
        'zh-CN': '展示物体在重力作用下加速下落',
        'zh-TW': '展示物體在重力作用下加速下落',
    },
    applications: {
        ko: [
            '스카이다이버의 낙하 시간 계산',
            '놀이공원 자이로드롭 설계',
            '갈릴레오의 피사의 사탑 실험',
            '행성 표면 중력 측정',
        ],
        en: [
            'Calculating skydiver fall time',
            'Designing amusement park drop towers',
            "Galileo's Leaning Tower of Pisa experiment",
            'Measuring planetary surface gravity',
        ],
        ja: [
            'スカイダイバーの落下時間計算',
            '遊園地のフリーフォール設計',
            'ガリレオのピサの斜塔実験',
            '惑星表面の重力測定',
        ],
        es: [
            'Cálculo del tiempo de caída de paracaidistas',
            'Diseño de torres de caída en parques de diversiones',
            'Experimento de Galileo en la Torre de Pisa',
            'Medición de la gravedad en superficies planetarias',
        ],
        pt: [
            'Cálculo do tempo de queda de paraquedistas',
            'Projeto de torres de queda em parques de diversões',
            'Experimento de Galileu na Torre de Pisa',
            'Medição da gravidade em superfícies planetárias',
        ],
        'zh-CN': [
            '计算跳伞者的下落时间',
            '设计游乐园跳楼机',
            '伽利略比萨斜塔实验',
            '测量行星表面重力',
        ],
        'zh-TW': [
            '計算跳傘者的下落時間',
            '設計遊樂園跳樓機',
            '伽利略比薩斜塔實驗',
            '測量行星表面重力',
        ],
    },
    category: 'gravity',
    variables: [
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
                color: colors.force,
            },
        },
        {
            symbol: 't',
            name: {
                ko: '시간',
                en: 'Time',
                ja: '時間',
                es: 'Tiempo',
                pt: 'Tempo',
                'zh-CN': '时间',
                'zh-TW': '時間',
            },
            role: 'input',
            unit: 's',
            range: [0.5, 10],
            default: 3,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.time,
            },
        },
        {
            symbol: 'h',
            name: {
                ko: '낙하 거리',
                en: 'Fall Distance',
                ja: '落下距離',
                es: 'Distancia de caída',
                pt: 'Distância de queda',
                'zh-CN': '下落距离',
                'zh-TW': '下落距離',
            },
            role: 'output',
            unit: 'm',
            range: [0, 500],
            default: 44.1,
            visual: {
                property: 'distance',
                scale: (value: number) => Math.min(value, 200),
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const g = inputs.g ?? 9.8
        const t = inputs.t ?? 3
        return {
            h: 0.5 * g * t * t,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const g = inputs.g ?? 9.8
        const t = inputs.t ?? 3
        const h = 0.5 * g * t * t
        return `h = ½ × ${g.toFixed(1)} × ${t.toFixed(1)}² = ${h.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'g', to: 't', operator: '×' },
            { from: 't', to: 'h', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'h',
        expression: [
            { type: 'text', value: '½' },
            { type: 'var', symbol: 'g' },
            { type: 'var', symbol: 't', square: true },
        ],
    },
    discoveries: [
        {
            id: 'long-fall',
            mission: {
                ko: '시간 t를 8초 이상으로 늘려봐!',
                en: 'Extend time t above 8 seconds!',
                ja: '時間tを8秒以上に伸ばしてみて！',
                es: '¡Aumenta el tiempo t por encima de 8 segundos!',
                pt: 'Aumente o tempo t acima de 8 segundos!',
                'zh-CN': '将时间t增加到8秒以上！',
                'zh-TW': '將時間t增加到8秒以上！',
            },
            result: {
                ko: '8초면 약 300m 낙하! 스카이다이버가 낙하산을 펴기 전 거리야.',
                en: 'In 8 seconds you fall about 300m! The distance skydivers fall before opening their chute.',
                ja: '8秒で約300m落下！スカイダイバーがパラシュートを開く前の距離だよ。',
                es: '¡En 8 segundos caes unos 300m! La distancia que caen los paracaidistas antes de abrir su paracaídas.',
                pt: 'Em 8 segundos você cai cerca de 300m! A distância que os paraquedistas caem antes de abrir o paraquedas.',
                'zh-CN': '8秒下落约300米！这是跳伞者打开降落伞前的下落距离。',
                'zh-TW': '8秒下落約300公尺！這是跳傘者打開降落傘前的下落距離。',
            },
            icon: '🪂',
            condition: (vars) => vars['t'] >= 8,
        },
        {
            id: 'jupiter-gravity',
            mission: {
                ko: '중력가속도 g를 24 이상으로 올려봐! (목성)',
                en: 'Raise gravitational acceleration g above 24! (Jupiter)',
                ja: '重力加速度gを24以上に上げてみて！（木星）',
                es: '¡Aumenta la aceleración g por encima de 24! (Júpiter)',
                pt: 'Aumente a aceleração g acima de 24! (Júpiter)',
                'zh-CN': '将重力加速度g提高到24以上！（木星）',
                'zh-TW': '將重力加速度g提高到24以上！（木星）',
            },
            result: {
                ko: '목성에서는 같은 시간에 2.5배 더 떨어져! 무거운 행성은 강한 중력을 가져.',
                en: 'On Jupiter you fall 2.5x farther in the same time! Massive planets have strong gravity.',
                ja: '木星では同じ時間で2.5倍落ちる！重い惑星は強い重力を持つよ。',
                es: '¡En Júpiter caes 2.5 veces más lejos en el mismo tiempo! Los planetas masivos tienen gravedad fuerte.',
                pt: 'Em Júpiter você cai 2.5x mais longe no mesmo tempo! Planetas massivos têm gravidade forte.',
                'zh-CN': '在木星上，相同时间内下落距离是地球的2.5倍！大质量行星有强引力。',
                'zh-TW': '在木星上，相同時間內下落距離是地球的2.5倍！大質量行星有強引力。',
            },
            icon: '🪐',
            condition: (vars) => vars['g'] >= 24,
        },
    ],
    getInsight: (vars) => {
        const h = vars['h']
        if (h < 5)
            return {
                ko: '2층 높이 정도야',
                en: 'About 2 stories high',
                ja: '2階くらいの高さだよ',
                es: 'Unos 2 pisos de altura',
                pt: 'Cerca de 2 andares de altura',
                'zh-CN': '大约2层楼高',
                'zh-TW': '大約2層樓高',
            }
        if (h < 20)
            return {
                ko: '5층 건물 높이야',
                en: 'Like a 5-story building',
                ja: '5階建てビルの高さだよ',
                es: 'Como un edificio de 5 pisos',
                pt: 'Como um prédio de 5 andares',
                'zh-CN': '像5层楼高',
                'zh-TW': '像5層樓高',
            }
        if (h < 50)
            return {
                ko: '10층 아파트 높이야',
                en: 'Like a 10-story apartment',
                ja: '10階建てマンションの高さだよ',
                es: 'Como un apartamento de 10 pisos',
                pt: 'Como um apartamento de 10 andares',
                'zh-CN': '像10层公寓高',
                'zh-TW': '像10層公寓高',
            }
        if (h < 150)
            return {
                ko: '자유의 여신상 높이야!',
                en: 'Statue of Liberty height!',
                ja: '自由の女神の高さだよ！',
                es: '¡Altura de la Estatua de la Libertad!',
                pt: 'Altura da Estátua da Liberdade!',
                'zh-CN': '自由女神像的高度！',
                'zh-TW': '自由女神像的高度！',
            }
        if (h < 300)
            return {
                ko: '에펠탑 높이야!',
                en: 'Eiffel Tower height!',
                ja: 'エッフェル塔の高さだよ！',
                es: '¡Altura de la Torre Eiffel!',
                pt: 'Altura da Torre Eiffel!',
                'zh-CN': '埃菲尔铁塔的高度！',
                'zh-TW': '艾菲爾鐵塔的高度！',
            }
        return {
            ko: '스카이다이빙 높이야!',
            en: 'Skydiving height!',
            ja: 'スカイダイビングの高さだよ！',
            es: '¡Altura de paracaidismo!',
            pt: 'Altura de paraquedismo!',
            'zh-CN': '跳伞高度！',
            'zh-TW': '跳傘高度！',
        }
    },
}
