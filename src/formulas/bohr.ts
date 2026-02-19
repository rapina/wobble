import { Formula } from './types'
import { colors } from '../styles/colors'

export const bohr: Formula = {
    id: 'bohr',
    name: {
        ko: '보어 모형',
        en: 'Bohr Model',
        ja: 'ボーア模型',
        es: 'Modelo de Bohr',
        pt: 'Modelo de Bohr',
        'zh-CN': '玻尔模型',
        'zh-TW': '波耳模型',
    },
    expression: 'Eₙ = -13.6/n² eV',
    description: {
        ko: '수소 원자의 전자는 양자화된 에너지 준위의 궤도에서만 존재한다',
        en: 'The electron in a hydrogen atom can only exist in quantized energy level orbits',
        ja: '水素原子の電子は量子化されたエネルギー準位の軌道にのみ存在できる',
        es: 'El electrón en un átomo de hidrógeno solo puede existir en órbitas de niveles de energía cuantizados',
        pt: 'O elétron em um átomo de hidrogênio só pode existir em órbitas de níveis de energia quantizados',
        'zh-CN': '氢原子中的电子只能存在于量子化的能级轨道上',
        'zh-TW': '氫原子中的電子只能存在於量子化的能階軌道上',
    },
    simulationHint: {
        ko: '수소 원자의 전자가 특정 궤도에서만 돌고, 준위 변화 시 광자를 방출하는 모습',
        en: 'Shows an electron orbiting a hydrogen atom in quantized orbits, emitting photons when changing levels',
        ja: '水素原子の電子が特定軌道のみで周回し、準位変化時に光子を放出する様子',
        es: 'Muestra un electrón orbitando un átomo de hidrógeno en órbitas cuantizadas, emitiendo fotones al cambiar de nivel',
        pt: 'Mostra um elétron orbitando um átomo de hidrogênio em órbitas quantizadas, emitindo fótons ao mudar de nível',
        'zh-CN': '显示电子在量子化轨道上围绕氢原子运动，改变能级时发射光子',
        'zh-TW': '顯示電子在量子化軌道上圍繞氫原子運動，改變能階時發射光子',
    },
    applications: {
        ko: [
            '수소 원자의 스펙트럼 분석',
            '레이저의 에너지 준위 설계',
            '형광등과 네온사인의 색상',
            '별의 원소 성분 분석',
        ],
        en: [
            'Hydrogen atom spectrum analysis',
            'Energy level design for lasers',
            'Colors in fluorescent and neon lights',
            'Analyzing elemental composition of stars',
        ],
        ja: [
            '水素原子のスペクトル分析',
            'レーザーのエネルギー準位設計',
            '蛍光灯やネオンサインの色',
            '恒星の元素組成分析',
        ],
        es: [
            'Análisis del espectro del átomo de hidrógeno',
            'Diseño de niveles de energía para láseres',
            'Colores en luces fluorescentes y de neón',
            'Análisis de composición elemental de estrellas',
        ],
        pt: [
            'Análise do espectro do átomo de hidrogênio',
            'Design de níveis de energia para lasers',
            'Cores em luzes fluorescentes e de néon',
            'Análise da composição elementar de estrelas',
        ],
        'zh-CN': ['氢原子光谱分析', '激光器的能级设计', '荧光灯和霓虹灯的颜色', '恒星元素成分分析'],
        'zh-TW': ['氫原子光譜分析', '雷射的能階設計', '螢光燈和霓虹燈的顏色', '恆星元素成分分析'],
    },
    category: 'quantum',
    variables: [
        {
            symbol: 'n',
            name: {
                ko: '주양자수',
                en: 'Principal Quantum Number',
                ja: '主量子数',
                es: 'Número Cuántico Principal',
                pt: 'Número Quântico Principal',
                'zh-CN': '主量子数',
                'zh-TW': '主量子數',
            },
            role: 'input',
            unit: '',
            range: [1, 6],
            default: 2,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 30,
                color: colors.distance,
            },
        },
        {
            symbol: 'E',
            name: {
                ko: '에너지',
                en: 'Energy',
                ja: 'エネルギー',
                es: 'Energía',
                pt: 'Energia',
                'zh-CN': '能量',
                'zh-TW': '能量',
            },
            role: 'output',
            unit: 'eV',
            range: [-13.6, 0],
            default: -3.4,
            visual: {
                property: 'glow',
                scale: (value: number) => (13.6 + value) / 13.6,
                color: colors.energy,
            },
        },
        {
            symbol: 'r',
            name: {
                ko: '궤도 반지름',
                en: 'Orbital Radius',
                ja: '軌道半径',
                es: 'Radio Orbital',
                pt: 'Raio Orbital',
                'zh-CN': '轨道半径',
                'zh-TW': '軌道半徑',
            },
            role: 'output',
            unit: 'a₀',
            range: [1, 36],
            default: 4,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 2,
                color: colors.distance,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 2)
        // E_n = -13.6 / n² eV
        const E = -13.6 / (n * n)
        // r_n = n² * a₀ (in units of Bohr radius)
        const r = n * n
        return { E, r }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 2)
        const E = -13.6 / (n * n)
        const r = n * n
        return `E = -13.6/${n}² = ${E.toFixed(2)} eV, r = ${r}a₀`
    },
    layout: {
        type: 'orbital',
        connections: [
            { from: 'n', to: 'E', operator: '=' },
            { from: 'n', to: 'r', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'E',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: '-13.6' }],
                denominator: [{ type: 'var', symbol: 'n', square: true }],
            },
            { type: 'text', value: ' eV' },
        ],
    },
    getInsight: (vars) => {
        const n = Math.round(vars['n'] ?? 2)
        const E = vars['E']
        if (n === 1)
            return {
                ko: '바닥상태! 가장 안정한 전자야',
                en: 'Ground state! Most stable electron',
                ja: '基底状態！最も安定した電子',
                es: '¡Estado fundamental! Electrón más estable',
                pt: 'Estado fundamental! Elétron mais estável',
                'zh-CN': '基态！最稳定的电子',
                'zh-TW': '基態！最穩定的電子',
            }
        if (n === 2)
            return {
                ko: '발머 계열 시작! 가시광선을 방출해',
                en: 'Balmer series starts! Emits visible light',
                ja: 'バルマー系列開始！可視光を放出',
                es: '¡Inicia la serie de Balmer! Emite luz visible',
                pt: 'Série de Balmer começa! Emite luz visível',
                'zh-CN': '巴尔默系列开始！发射可见光',
                'zh-TW': '巴耳末系列開始！發射可見光',
            }
        if (n === 3)
            return {
                ko: '파셴 계열! 적외선 영역이야',
                en: 'Paschen series! Infrared region',
                ja: 'パッシェン系列！赤外線領域',
                es: '¡Serie de Paschen! Región infrarroja',
                pt: 'Série de Paschen! Região infravermelha',
                'zh-CN': '帕邢系列！红外区域',
                'zh-TW': '帕邢系列！紅外線區域',
            }
        if (E > -1)
            return {
                ko: '거의 자유 전자! 이온화 직전이야',
                en: 'Nearly free electron! About to ionize',
                ja: 'ほぼ自由電子！イオン化直前',
                es: '¡Electrón casi libre! A punto de ionizarse',
                pt: 'Elétron quase livre! Prestes a ionizar',
                'zh-CN': '几乎自由的电子！即将电离',
                'zh-TW': '幾乎自由的電子！即將游離',
            }
        return {
            ko: '들뜬상태! 에너지를 흡수한 전자야',
            en: 'Excited state! Electron that absorbed energy',
            ja: '励起状態！エネルギーを吸収した電子',
            es: '¡Estado excitado! Electrón que absorbió energía',
            pt: 'Estado excitado! Elétron que absorveu energia',
            'zh-CN': '激发态！吸收了能量的电子',
            'zh-TW': '激發態！吸收了能量的電子',
        }
    },
    discoveries: [
        {
            id: 'ground-state',
            mission: {
                ko: '주양자수 n을 1로 설정해봐! (바닥상태)',
                en: 'Set principal quantum number n to 1! (ground state)',
                ja: '主量子数nを1に設定してみて！（基底状態）',
                es: '¡Establece el número cuántico principal n en 1! (estado fundamental)',
                pt: 'Defina o número quântico principal n como 1! (estado fundamental)',
                'zh-CN': '把主量子数n设为1！（基态）',
                'zh-TW': '把主量子數n設為1！（基態）',
            },
            result: {
                ko: 'n=1은 가장 낮은 에너지! 전자가 가장 안정한 상태야.',
                en: 'n=1 is the lowest energy! The most stable state for the electron.',
                ja: 'n=1は最も低いエネルギー！電子が最も安定した状態だよ。',
                es: '¡n=1 es la energía más baja! El estado más estable para el electrón.',
                pt: 'n=1 é a energia mais baixa! O estado mais estável para o elétron.',
                'zh-CN': 'n=1是最低能量！电子最稳定的状态。',
                'zh-TW': 'n=1是最低能量！電子最穩定的狀態。',
            },
            icon: '⚛️',
            condition: (vars) => Math.round(vars['n']) === 1,
        },
        {
            id: 'ionization',
            mission: {
                ko: '주양자수 n을 5 이상으로 올려봐!',
                en: 'Raise principal quantum number n above 5!',
                ja: '主量子数nを5以上に上げてみて！',
                es: '¡Aumenta el número cuántico principal n por encima de 5!',
                pt: 'Aumente o número quântico principal n acima de 5!',
                'zh-CN': '把主量子数n提高到5以上！',
                'zh-TW': '把主量子數n提高到5以上！',
            },
            result: {
                ko: '높은 n에서는 에너지가 거의 0! 조금만 더 에너지를 받으면 전자가 떠나.',
                en: 'At high n, energy approaches 0! A little more energy and the electron escapes.',
                ja: '高いnではエネルギーがほぼ0！もう少しエネルギーを受けると電子が離れる。',
                es: '¡En n alto, la energía se acerca a 0! Un poco más de energía y el electrón escapa.',
                pt: 'Em n alto, a energia se aproxima de 0! Um pouco mais de energia e o elétron escapa.',
                'zh-CN': '在高n时，能量接近0！再多一点能量电子就会逃逸。',
                'zh-TW': '在高n時，能量接近0！再多一點能量電子就會逃逸。',
            },
            icon: '🚀',
            condition: (vars) => Math.round(vars['n']) >= 5,
        },
    ],
}
