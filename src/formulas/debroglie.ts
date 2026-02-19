import { Formula } from './types'
import { colors } from '../styles/colors'

export const debroglie: Formula = {
    id: 'debroglie',
    name: {
        ko: '드브로이 파장',
        en: 'De Broglie Wavelength',
        ja: 'ド・ブロイ波長',
        es: 'Longitud de Onda de De Broglie',
        pt: 'Comprimento de Onda de De Broglie',
        'zh-CN': '德布罗意波长',
        'zh-TW': '德布羅意波長',
    },
    expression: 'λ = h/p',
    description: {
        ko: '모든 물질은 파동성을 가지며, 그 파장은 운동량에 반비례한다',
        en: 'All matter has wave properties, with wavelength inversely proportional to momentum',
        ja: 'すべての物質は波動性を持ち、その波長は運動量に反比例する',
        es: 'Toda la materia tiene propiedades ondulatorias, con longitud de onda inversamente proporcional al momento',
        pt: 'Toda matéria tem propriedades ondulatórias, com comprimento de onda inversamente proporcional ao momento',
        'zh-CN': '所有物质都具有波动性，其波长与动量成反比',
        'zh-TW': '所有物質都具有波動性，其波長與動量成反比',
    },
    simulationHint: {
        ko: '입자가 파동처럼 퍼져나가며 운동량에 따라 파장이 변하는 모습',
        en: 'Shows a particle spreading like a wave with wavelength changing based on momentum',
        ja: '粒子が波のように広がり運動量に応じて波長が変わる様子',
        es: 'Muestra una partícula extendiéndose como una onda con longitud de onda cambiando según el momento',
        pt: 'Mostra uma partícula se espalhando como uma onda com comprimento de onda mudando com base no momento',
        'zh-CN': '显示粒子像波一样扩散，波长随动量变化',
        'zh-TW': '顯示粒子像波一樣擴散，波長隨動量變化',
    },
    applications: {
        ko: [
            '전자현미경의 초고해상도 원리',
            '반도체 칩의 나노 구조 설계',
            '양자 컴퓨터의 기본 원리',
            '물질의 파동-입자 이중성 증명',
        ],
        en: [
            'Ultra-high resolution electron microscopy',
            'Designing nano-scale semiconductor chips',
            'Fundamental principles of quantum computers',
            'Demonstrating wave-particle duality',
        ],
        ja: [
            '電子顕微鏡の超高解像度原理',
            '半導体チップのナノ構造設計',
            '量子コンピュータの基本原理',
            '物質の波動・粒子二重性の実証',
        ],
        es: [
            'Microscopía electrónica de ultra alta resolución',
            'Diseño de chips semiconductores a nanoescala',
            'Principios fundamentales de computadoras cuánticas',
            'Demostración de la dualidad onda-partícula',
        ],
        pt: [
            'Microscopia eletrônica de ultra alta resolução',
            'Projeto de chips semicondutores em nanoescala',
            'Princípios fundamentais de computadores quânticos',
            'Demonstração da dualidade onda-partícula',
        ],
        'zh-CN': [
            '超高分辨率电子显微镜原理',
            '纳米级半导体芯片设计',
            '量子计算机的基本原理',
            '波粒二象性的证明',
        ],
        'zh-TW': [
            '超高解析度電子顯微鏡原理',
            '奈米級半導體晶片設計',
            '量子電腦的基本原理',
            '波粒二象性的證明',
        ],
    },
    category: 'quantum',
    variables: [
        {
            symbol: 'm',
            name: {
                ko: '질량',
                en: 'Mass',
                ja: '質量',
                es: 'Masa',
                pt: 'Massa',
                'zh-CN': '质量',
                'zh-TW': '質量',
            },
            role: 'input',
            unit: '×10⁻³¹ kg',
            range: [1, 100],
            default: 9.1,
            visual: {
                property: 'size',
                scale: (value: number) => 25 + value * 0.5,
                color: colors.mass,
            },
        },
        {
            symbol: 'v',
            name: {
                ko: '속도',
                en: 'Velocity',
                ja: '速度',
                es: 'Velocidad',
                pt: 'Velocidade',
                'zh-CN': '速度',
                'zh-TW': '速度',
            },
            role: 'input',
            unit: '×10⁶ m/s',
            range: [0.1, 10],
            default: 1,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'λ',
            name: {
                ko: '드브로이 파장',
                en: 'De Broglie Wavelength',
                ja: 'ド・ブロイ波長',
                es: 'Longitud de Onda de De Broglie',
                pt: 'Comprimento de Onda de De Broglie',
                'zh-CN': '德布罗意波长',
                'zh-TW': '德布羅意波長',
            },
            role: 'output',
            unit: 'nm',
            range: [0, 10],
            default: 0.73,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 9.1 // ×10⁻³¹ kg
        const v = inputs.v ?? 1 // ×10⁶ m/s
        // h = 6.626 × 10⁻³⁴ J·s
        // p = mv = m × 10⁻³¹ × v × 10⁶ = mv × 10⁻²⁵ kg·m/s
        // λ = h/p = 6.626 × 10⁻³⁴ / (mv × 10⁻²⁵) = 6.626 / (mv) × 10⁻⁹ m = 0.6626 / (mv) nm
        const lambda = 0.6626 / (m * v)
        return { λ: lambda }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 9.1
        const v = inputs.v ?? 1
        const p = m * v
        const lambda = 0.6626 / p
        return `λ = h ÷ (${m.toFixed(1)} × ${v.toFixed(1)}) = ${lambda.toFixed(3)}`
    },
    layout: {
        type: 'wave',
        connections: [
            { from: 'm', to: 'v', operator: '×' },
            { from: 'v', to: 'λ', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'λ',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: 'h' }],
                denominator: [
                    { type: 'var', symbol: 'm' },
                    { type: 'op', value: '×' },
                    { type: 'var', symbol: 'v' },
                ],
            },
        ],
    },
    getInsight: (vars) => {
        const lambda = vars['λ']
        if (lambda > 1)
            return {
                ko: '긴 파장! 파동성이 뚜렷해',
                en: 'Long wavelength! Clear wave behavior',
                ja: '長い波長！波動性が明確',
                es: '¡Longitud de onda larga! Comportamiento ondulatorio claro',
                pt: 'Comprimento de onda longo! Comportamento ondulatório claro',
                'zh-CN': '长波长！明显的波动性',
                'zh-TW': '長波長！明顯的波動性',
            }
        if (lambda > 0.1)
            return {
                ko: '전자현미경 수준의 파장이야',
                en: 'Electron microscope level wavelength',
                ja: '電子顕微鏡レベルの波長',
                es: 'Longitud de onda nivel microscopio electrónico',
                pt: 'Comprimento de onda nível microscópio eletrônico',
                'zh-CN': '电子显微镜级别的波长',
                'zh-TW': '電子顯微鏡級別的波長',
            }
        if (lambda > 0.01)
            return {
                ko: '원자 크기 수준의 파장이야',
                en: 'Atomic scale wavelength',
                ja: '原子サイズレベルの波長',
                es: 'Longitud de onda escala atómica',
                pt: 'Comprimento de onda escala atômica',
                'zh-CN': '原子尺度的波长',
                'zh-TW': '原子尺度的波長',
            }
        if (lambda > 0.001)
            return {
                ko: '핵 크기 수준! 매우 짧은 파장',
                en: 'Nuclear scale! Very short wavelength',
                ja: '原子核サイズ！非常に短い波長',
                es: '¡Escala nuclear! Longitud de onda muy corta',
                pt: 'Escala nuclear! Comprimento de onda muito curto',
                'zh-CN': '原子核尺度！非常短的波长',
                'zh-TW': '原子核尺度！非常短的波長',
            }
        return {
            ko: '입자성이 지배적! 파동을 관측하기 어려워',
            en: 'Particle behavior dominates! Hard to observe waves',
            ja: '粒子性が支配的！波動を観測しにくい',
            es: '¡El comportamiento de partícula domina! Difícil observar ondas',
            pt: 'Comportamento de partícula domina! Difícil observar ondas',
            'zh-CN': '粒子性占主导！难以观察到波动',
            'zh-TW': '粒子性佔主導！難以觀察到波動',
        }
    },
    discoveries: [
        {
            id: 'electron-wave',
            mission: {
                ko: '전자 질량(9.1)과 낮은 속도(0.5 이하)를 설정해봐!',
                en: 'Set electron mass (9.1) and low velocity (below 0.5)!',
                ja: '電子質量（9.1）と低速度（0.5以下）を設定してみて！',
                es: '¡Configura la masa del electrón (9.1) y baja velocidad (menos de 0.5)!',
                pt: 'Configure a massa do elétron (9.1) e baixa velocidade (abaixo de 0.5)!',
                'zh-CN': '设置电子质量（9.1）和低速度（低于0.5）！',
                'zh-TW': '設置電子質量（9.1）和低速度（低於0.5）！',
            },
            result: {
                ko: '느린 전자는 파장이 길어 파동성이 뚜렷해! 전자현미경의 원리야.',
                en: 'Slow electrons have long wavelengths showing clear wave behavior! This is how electron microscopes work.',
                ja: '遅い電子は波長が長く波動性が明確！電子顕微鏡の原理だよ。',
                es: '¡Los electrones lentos tienen longitudes de onda largas mostrando comportamiento ondulatorio claro! Así funcionan los microscopios electrónicos.',
                pt: 'Elétrons lentos têm comprimentos de onda longos mostrando comportamento ondulatório claro! É assim que os microscópios eletrônicos funcionam.',
                'zh-CN': '慢电子波长长，波动性明显！这就是电子显微镜的原理。',
                'zh-TW': '慢電子波長長，波動性明顯！這就是電子顯微鏡的原理。',
            },
            icon: '🔬',
            condition: (vars) => vars['m'] <= 15 && vars['v'] <= 0.5,
        },
        {
            id: 'heavy-particle',
            mission: {
                ko: '질량 m을 80 이상으로 올려봐!',
                en: 'Raise mass m above 80!',
                ja: '質量mを80以上に上げてみて！',
                es: '¡Sube la masa m por encima de 80!',
                pt: 'Aumente a massa m acima de 80!',
                'zh-CN': '把质量m升到80以上！',
                'zh-TW': '把質量m升到80以上！',
            },
            result: {
                ko: '무거운 입자는 파장이 매우 짧아! 그래서 일상의 물체는 파동성을 못 느껴.',
                en: 'Heavy particles have very short wavelengths! This is why everyday objects do not show wave behavior.',
                ja: '重い粒子は波長がとても短い！だから日常の物体は波動性を感じない。',
                es: '¡Las partículas pesadas tienen longitudes de onda muy cortas! Por eso los objetos cotidianos no muestran comportamiento ondulatorio.',
                pt: 'Partículas pesadas têm comprimentos de onda muito curtos! Por isso objetos do dia a dia não mostram comportamento ondulatório.',
                'zh-CN': '重粒子波长非常短！这就是为什么日常物体看不到波动性。',
                'zh-TW': '重粒子波長非常短！這就是為什麼日常物體看不到波動性。',
            },
            icon: '⚾',
            condition: (vars) => vars['m'] >= 80,
        },
    ],
}
