import { Formula } from './types'
import { colors } from '../styles/colors'

export const reactionRate: Formula = {
    id: 'reaction-rate',
    name: {
        ko: '반응 속도 법칙',
        en: 'Rate Law',
        ja: '反応速度則',
        es: 'Ley de Velocidad',
        pt: 'Lei da Taxa',
        'zh-CN': '反应速率定律',
        'zh-TW': '反應速率定律',
    },
    expression: 'r = k[A]ⁿ',
    description: {
        ko: '반응 속도는 농도의 거듭제곱에 비례한다',
        en: 'Reaction rate is proportional to concentration raised to a power',
        ja: '反応速度は濃度のべき乗に比例する',
        es: 'La velocidad de reacción es proporcional a la concentración elevada a una potencia',
        pt: 'A taxa de reação é proporcional à concentração elevada a uma potência',
        'zh-CN': '反应速率与浓度的幂次方成正比',
        'zh-TW': '反應速率與濃度的冪次方成正比',
    },
    simulationHint: {
        ko: '반응물 농도와 반응 차수에 따른 반응 속도 변화',
        en: 'How reaction rate changes with concentration and reaction order',
        ja: '反応物濃度と反応次数に応じた反応速度の変化',
        es: 'Cómo cambia la velocidad de reacción con la concentración y el orden de reacción',
        pt: 'Como a taxa de reação muda com a concentração e a ordem da reação',
        'zh-CN': '反应速率如何随浓度和反应级数变化',
        'zh-TW': '反應速率如何隨濃度和反應級數變化',
    },
    applications: {
        ko: [
            '의약품 분해 속도 예측',
            '식품 부패 속도 분석',
            '촉매 효율 평가',
            '산업 화학 공정 최적화',
        ],
        en: [
            'Predicting drug decomposition rates',
            'Analyzing food spoilage rates',
            'Evaluating catalyst efficiency',
            'Optimizing industrial chemical processes',
        ],
        ja: [
            '薬品の分解速度予測',
            '食品の腐敗速度分析',
            '触媒効率の評価',
            '工業化学プロセスの最適化',
        ],
        es: [
            'Predecir tasas de descomposición de medicamentos',
            'Analizar tasas de deterioro de alimentos',
            'Evaluar eficiencia del catalizador',
            'Optimizar procesos químicos industriales',
        ],
        pt: [
            'Prever taxas de decomposição de medicamentos',
            'Analisar taxas de deterioração de alimentos',
            'Avaliar eficiência do catalisador',
            'Otimizar processos químicos industriais',
        ],
        'zh-CN': ['预测药物分解速率', '分析食品腐败速率', '评估催化剂效率', '优化工业化学过程'],
        'zh-TW': ['預測藥物分解速率', '分析食品腐敗速率', '評估催化劑效率', '優化工業化學過程'],
    },
    category: 'chemistry',
    variables: [
        {
            symbol: 'k',
            name: {
                ko: '속도 상수',
                en: 'Rate Constant',
                ja: '速度定数',
                es: 'Constante de Velocidad',
                pt: 'Constante de Taxa',
                'zh-CN': '速率常数',
                'zh-TW': '速率常數',
            },
            role: 'input',
            unit: '',
            range: [0.01, 10],
            default: 1,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 10,
                color: colors.catalyst,
            },
        },
        {
            symbol: '[A]',
            name: {
                ko: '반응물 농도',
                en: 'Reactant Concentration',
                ja: '反応物濃度',
                es: 'Concentración de Reactivo',
                pt: 'Concentração de Reagente',
                'zh-CN': '反应物浓度',
                'zh-TW': '反應物濃度',
            },
            role: 'input',
            unit: 'M',
            range: [0.1, 5],
            default: 1,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 10,
                color: colors.reactant,
            },
        },
        {
            symbol: 'n',
            name: {
                ko: '반응 차수',
                en: 'Reaction Order',
                ja: '反応次数',
                es: 'Orden de Reacción',
                pt: 'Ordem da Reação',
                'zh-CN': '反应级数',
                'zh-TW': '反應級數',
            },
            role: 'input',
            unit: '',
            range: [0, 3],
            default: 1,
            visual: {
                property: 'speed',
                scale: (value: number) => 0.5 + value * 0.5,
                color: colors.force,
            },
        },
        {
            symbol: 'r',
            name: {
                ko: '반응 속도',
                en: 'Reaction Rate',
                ja: '反応速度',
                es: 'Velocidad de Reacción',
                pt: 'Taxa de Reação',
                'zh-CN': '反应速率',
                'zh-TW': '反應速率',
            },
            role: 'output',
            unit: 'M/s',
            range: [0, 100],
            default: 1,
            visual: {
                property: 'speed',
                scale: (value: number) => Math.min(2, value / 10),
                color: colors.product,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const k = inputs['k'] ?? 1
        const A = inputs['[A]'] ?? 1
        const n = inputs['n'] ?? 1
        const r = k * Math.pow(A, n)
        return {
            r: Math.max(0, r),
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const k = inputs['k'] ?? 1
        const A = inputs['[A]'] ?? 1
        const n = inputs['n'] ?? 1
        const r = k * Math.pow(A, n)
        if (n === 0) {
            return `r = ${k.toFixed(2)} × ${A.toFixed(1)}⁰ = ${r.toFixed(3)} M/s`
        }
        if (n === 1) {
            return `r = ${k.toFixed(2)} × ${A.toFixed(1)} = ${r.toFixed(3)} M/s`
        }
        return `r = ${k.toFixed(2)} × ${A.toFixed(1)}^${n.toFixed(0)} = ${r.toFixed(3)} M/s`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'k', to: '[A]', operator: '×' },
            { from: '[A]', to: 'n', operator: '²' },
            { from: 'n', to: 'r', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'r',
        expression: [
            { type: 'var', symbol: 'k' },
            { type: 'var', symbol: '[A]', square: true },
        ],
    },
    discoveries: [
        {
            id: 'zero-order',
            mission: {
                ko: '반응 차수 n을 0으로 설정해봐!',
                en: 'Set reaction order n to 0!',
                ja: '反応次数nを0に設定してみよう！',
                es: '¡Establece el orden de reacción n en 0!',
                pt: 'Defina a ordem da reação n como 0!',
                'zh-CN': '把反应级数n设为0！',
                'zh-TW': '把反應級數n設為0！',
            },
            result: {
                ko: '0차 반응! 농도와 무관하게 일정한 속도로 진행돼. 효소 포화 반응과 비슷해.',
                en: 'Zero-order! Rate is constant regardless of concentration. Like enzyme saturation.',
                ja: '0次反応！濃度に関係なく一定の速度で進行する。酵素飽和反応に似ている。',
                es: '¡Orden cero! La velocidad es constante independientemente de la concentración. Como la saturación enzimática.',
                pt: 'Ordem zero! A taxa é constante independente da concentração. Como saturação enzimática.',
                'zh-CN': '零级反应！速率与浓度无关，保持恒定。类似于酶饱和反应。',
                'zh-TW': '零級反應！速率與濃度無關，保持恆定。類似於酶飽和反應。',
            },
            icon: '➡️',
            condition: (vars) => vars['n'] === 0,
        },
        {
            id: 'first-order',
            mission: {
                ko: '반응 차수 n을 1로 설정해봐!',
                en: 'Set reaction order n to 1!',
                ja: '反応次数nを1に設定してみよう！',
                es: '¡Establece el orden de reacción n en 1!',
                pt: 'Defina a ordem da reação n como 1!',
                'zh-CN': '把反应级数n设为1！',
                'zh-TW': '把反應級數n設為1！',
            },
            result: {
                ko: '1차 반응! 방사성 붕괴나 약물 대사가 이런 패턴을 따라.',
                en: 'First-order! Radioactive decay and drug metabolism follow this pattern.',
                ja: '1次反応！放射性崩壊や薬物代謝がこのパターンに従う。',
                es: '¡Primer orden! La desintegración radiactiva y el metabolismo de fármacos siguen este patrón.',
                pt: 'Primeira ordem! O decaimento radioativo e o metabolismo de drogas seguem este padrão.',
                'zh-CN': '一级反应！放射性衰变和药物代谢遵循这种模式。',
                'zh-TW': '一級反應！放射性衰變和藥物代謝遵循這種模式。',
            },
            icon: '📉',
            condition: (vars) => vars['n'] === 1,
        },
        {
            id: 'second-order',
            mission: {
                ko: '반응 차수 n을 2로 설정해봐!',
                en: 'Set reaction order n to 2!',
                ja: '反応次数nを2に設定してみよう！',
                es: '¡Establece el orden de reacción n en 2!',
                pt: 'Defina a ordem da reação n como 2!',
                'zh-CN': '把反应级数n设为2！',
                'zh-TW': '把反應級數n設為2！',
            },
            result: {
                ko: '2차 반응! 두 분자가 충돌해야 반응이 일어나. 농도가 2배면 속도는 4배!',
                en: 'Second-order! Two molecules must collide. Double concentration = 4x rate!',
                ja: '2次反応！2つの分子が衝突して反応が起こる。濃度が2倍なら速度は4倍！',
                es: '¡Segundo orden! Dos moléculas deben colisionar. ¡Doble concentración = 4x velocidad!',
                pt: 'Segunda ordem! Duas moléculas devem colidir. Concentração dobrada = 4x taxa!',
                'zh-CN': '二级反应！两个分子必须碰撞才能反应。浓度加倍，速率变4倍！',
                'zh-TW': '二級反應！兩個分子必須碰撞才能反應。濃度加倍，速率變4倍！',
            },
            icon: '💥',
            condition: (vars) => vars['n'] === 2,
        },
        {
            id: 'fast-reaction',
            mission: {
                ko: '반응 속도 r을 10 M/s 이상으로 만들어봐!',
                en: 'Make reaction rate r above 10 M/s!',
                ja: '反応速度rを10 M/s以上にしてみよう！',
                es: '¡Haz que la velocidad de reacción r supere 10 M/s!',
                pt: 'Faça a taxa de reação r ultrapassar 10 M/s!',
                'zh-CN': '把反应速率r提高到10 M/s以上！',
                'zh-TW': '把反應速率r提高到10 M/s以上！',
            },
            result: {
                ko: '매우 빠른 반응! 폭발 반응이나 효소 촉매 반응 수준이야.',
                en: 'Very fast reaction! Like explosive or enzyme-catalyzed reactions.',
                ja: 'とても速い反応！爆発反応や酵素触媒反応レベルだ。',
                es: '¡Reacción muy rápida! Como reacciones explosivas o catalizadas por enzimas.',
                pt: 'Reação muito rápida! Como reações explosivas ou catalisadas por enzimas.',
                'zh-CN': '非常快的反应！像爆炸反应或酶催化反应。',
                'zh-TW': '非常快的反應！像爆炸反應或酶催化反應。',
            },
            icon: '⚡',
            condition: (vars) => vars['r'] >= 10,
        },
    ],
    getInsight: (vars) => {
        const r = vars['r']
        const n = vars['n']
        let orderText = ''
        if (n === 0) orderText = '0차'
        else if (n === 1) orderText = '1차'
        else if (n === 2) orderText = '2차'
        else orderText = `${n}차`

        if (r < 0.1)
            return {
                ko: `${orderText} 반응, 매우 느림`,
                en: `${n}-order, very slow`,
                ja: `${n}次反応、非常に遅い`,
                es: `Orden ${n}, muy lento`,
                pt: `Ordem ${n}, muito lento`,
                'zh-CN': `${n}级反应，非常慢`,
                'zh-TW': `${n}級反應，非常慢`,
            }
        if (r < 1)
            return {
                ko: `${orderText} 반응, 느림`,
                en: `${n}-order, slow`,
                ja: `${n}次反応、遅い`,
                es: `Orden ${n}, lento`,
                pt: `Ordem ${n}, lento`,
                'zh-CN': `${n}级反应，慢`,
                'zh-TW': `${n}級反應，慢`,
            }
        if (r < 5)
            return {
                ko: `${orderText} 반응, 보통`,
                en: `${n}-order, moderate`,
                ja: `${n}次反応、普通`,
                es: `Orden ${n}, moderado`,
                pt: `Ordem ${n}, moderado`,
                'zh-CN': `${n}级反应，中等`,
                'zh-TW': `${n}級反應，中等`,
            }
        if (r < 20)
            return {
                ko: `${orderText} 반응, 빠름`,
                en: `${n}-order, fast`,
                ja: `${n}次反応、速い`,
                es: `Orden ${n}, rápido`,
                pt: `Ordem ${n}, rápido`,
                'zh-CN': `${n}级反应，快`,
                'zh-TW': `${n}級反應，快`,
            }
        return {
            ko: `${orderText} 반응, 매우 빠름!`,
            en: `${n}-order, very fast!`,
            ja: `${n}次反応、非常に速い！`,
            es: `Orden ${n}, ¡muy rápido!`,
            pt: `Ordem ${n}, muito rápido!`,
            'zh-CN': `${n}级反应，非常快！`,
            'zh-TW': `${n}級反應，非常快！`,
        }
    },
}
