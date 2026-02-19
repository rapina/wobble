import { Formula } from './types'
import { colors } from '../styles/colors'

export const tunneling: Formula = {
    id: 'tunneling',
    name: {
        ko: '양자 터널링',
        en: 'Quantum Tunneling',
        ja: '量子トンネル効果',
        es: 'Tunelamiento Cuántico',
        pt: 'Tunelamento Quântico',
        'zh-CN': '量子隧穿',
        'zh-TW': '量子穿隧',
    },
    expression: 'T ≈ e⁻²ᵏᴸ',
    description: {
        ko: '입자가 고전역학적으로 불가능한 에너지 장벽을 확률적으로 통과하는 현상',
        en: 'A phenomenon where particles probabilistically pass through classically forbidden energy barriers',
        ja: '粒子が古典力学的には不可能なエネルギー障壁を確率的に通過する現象',
        es: 'Un fenómeno donde las partículas pasan probabilísticamente a través de barreras de energía clásicamente prohibidas',
        pt: 'Um fenômeno onde partículas passam probabilisticamente através de barreiras de energia classicamente proibidas',
        'zh-CN': '粒子概率性地穿过经典力学中不可能穿过的能量势垒的现象',
        'zh-TW': '粒子概率性地穿過經典力學中不可能穿過的能量勢壘的現象',
    },
    simulationHint: {
        ko: '입자들이 에너지 장벽에 부딪혀 일부는 통과하고 일부는 반사되는 모습',
        en: 'Shows particles hitting an energy barrier, some tunneling through and some reflecting',
        ja: '粒子がエネルギー障壁にぶつかり、一部は透過し一部は反射する様子',
        es: 'Muestra partículas golpeando una barrera de energía, algunas tunelando y otras reflejándose',
        pt: 'Mostra partículas atingindo uma barreira de energia, algumas tunelando e outras refletindo',
        'zh-CN': '显示粒子撞击能量势垒，部分穿透部分反射的样子',
        'zh-TW': '顯示粒子撞擊能量勢壘，部分穿透部分反射的樣子',
    },
    applications: {
        ko: [
            '플래시 메모리의 데이터 저장',
            '주사 터널링 현미경 (STM)',
            '핵융합 반응의 양자 효과',
            '효소의 화학 반응 촉매',
        ],
        en: [
            'Flash memory data storage',
            'Scanning tunneling microscope (STM)',
            'Quantum effects in nuclear fusion',
            'Enzyme catalysis in chemical reactions',
        ],
        ja: [
            'フラッシュメモリのデータ保存',
            '走査型トンネル顕微鏡（STM）',
            '核融合反応における量子効果',
            '化学反応における酵素触媒',
        ],
        es: [
            'Almacenamiento de datos en memoria flash',
            'Microscopio de efecto túnel (STM)',
            'Efectos cuánticos en fusión nuclear',
            'Catálisis enzimática en reacciones químicas',
        ],
        pt: [
            'Armazenamento de dados em memória flash',
            'Microscópio de tunelamento de varredura (STM)',
            'Efeitos quânticos na fusão nuclear',
            'Catálise enzimática em reações químicas',
        ],
        'zh-CN': [
            '闪存数据存储',
            '扫描隧道显微镜（STM）',
            '核聚变中的量子效应',
            '化学反应中的酶催化',
        ],
        'zh-TW': [
            '快閃記憶體資料儲存',
            '掃描穿隧顯微鏡（STM）',
            '核融合中的量子效應',
            '化學反應中的酶催化',
        ],
    },
    category: 'quantum',
    variables: [
        {
            symbol: 'E',
            name: {
                ko: '입자 에너지',
                en: 'Particle Energy',
                ja: '粒子エネルギー',
                es: 'Energía de Partícula',
                pt: 'Energia da Partícula',
                'zh-CN': '粒子能量',
                'zh-TW': '粒子能量',
            },
            role: 'input',
            unit: 'eV',
            range: [3, 10],
            default: 8,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.energy,
            },
        },
        {
            symbol: 'V',
            name: {
                ko: '장벽 높이',
                en: 'Barrier Height',
                ja: '障壁の高さ',
                es: 'Altura de Barrera',
                pt: 'Altura da Barreira',
                'zh-CN': '势垒高度',
                'zh-TW': '勢壘高度',
            },
            role: 'input',
            unit: 'eV',
            range: [5, 12],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 5,
                color: colors.resistance,
            },
        },
        {
            symbol: 'L',
            name: {
                ko: '장벽 폭',
                en: 'Barrier Width',
                ja: '障壁の幅',
                es: 'Ancho de Barrera',
                pt: 'Largura da Barreira',
                'zh-CN': '势垒宽度',
                'zh-TW': '勢壘寬度',
            },
            role: 'input',
            unit: 'nm',
            range: [0.05, 0.4],
            default: 0.1,
            visual: {
                property: 'stretch',
                scale: (value: number) => value * 150,
                color: colors.distance,
            },
        },
        {
            symbol: 'T',
            name: {
                ko: '투과 확률',
                en: 'Transmission Probability',
                ja: '透過確率',
                es: 'Probabilidad de Transmisión',
                pt: 'Probabilidade de Transmissão',
                'zh-CN': '透射概率',
                'zh-TW': '透射概率',
            },
            role: 'output',
            unit: '%',
            range: [0, 100],
            default: 23.5,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 100,
                color: colors.wavelength,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const E = inputs.E ?? 8 // eV
        const V = inputs.V ?? 10 // eV
        const L = inputs.L ?? 0.1 // nm

        // If E >= V, classical transmission (100%)
        if (E >= V) {
            return { T: 100 }
        }

        // κ = sqrt(2m(V-E)) / ℏ
        // For electron: κ ≈ 5.12 * sqrt(V-E) nm⁻¹
        const kappa = 5.12 * Math.sqrt(V - E)
        // T = exp(-2κL)
        const T = Math.exp(-2 * kappa * L) * 100

        return { T: Math.min(100, Math.max(0, T)) }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const E = inputs.E ?? 8
        const V = inputs.V ?? 10
        const L = inputs.L ?? 0.1

        if (E >= V) {
            return `E ≥ V → T = 100%`
        }

        const kappa = 5.12 * Math.sqrt(V - E)
        const T = Math.exp(-2 * kappa * L) * 100
        return `T = e^(-2×${kappa.toFixed(2)}×${L.toFixed(1)}) = ${T.toFixed(1)}%`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'E', to: 'T', operator: '=' },
            { from: 'V', to: 'T', operator: '=' },
            { from: 'L', to: 'T', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'T',
        expression: [
            { type: 'text', value: 'e' },
            {
                type: 'group',
                items: [
                    { type: 'text', value: '-' },
                    { type: 'var', symbol: 'L' },
                    { type: 'text', value: '√(' },
                    { type: 'var', symbol: 'V' },
                    { type: 'text', value: '-' },
                    { type: 'var', symbol: 'E' },
                    { type: 'text', value: ')' },
                ],
            },
        ],
    },
    getInsight: (vars) => {
        const T = vars['T']
        const E = vars['E'] ?? 8
        const V = vars['V'] ?? 10
        if (E >= V)
            return {
                ko: '고전적 통과! 장벽을 넘었어',
                en: 'Classical transmission! Over the barrier',
                ja: '古典的透過！障壁を越えたよ',
                es: '¡Transmisión clásica! Sobre la barrera',
                pt: 'Transmissão clássica! Sobre a barreira',
                'zh-CN': '经典透射！越过了势垒',
                'zh-TW': '經典透射！越過了勢壘',
            }
        if (T >= 50)
            return {
                ko: '절반 이상 통과! 양자 효과가 강해',
                en: 'Over half tunnel through! Strong quantum effect',
                ja: '半分以上が透過！量子効果が強いよ',
                es: '¡Más de la mitad tunelan! Efecto cuántico fuerte',
                pt: 'Mais da metade tunela! Forte efeito quântico',
                'zh-CN': '超过一半穿透！量子效应很强',
                'zh-TW': '超過一半穿透！量子效應很強',
            }
        if (T >= 10)
            return {
                ko: '상당한 터널링! 플래시 메모리 수준',
                en: 'Significant tunneling! Flash memory level',
                ja: 'かなりのトンネリング！フラッシュメモリレベル',
                es: '¡Tunelamiento significativo! Nivel de memoria flash',
                pt: 'Tunelamento significativo! Nível de memória flash',
                'zh-CN': '显著的隧穿！闪存级别',
                'zh-TW': '顯著的穿隧！快閃記憶體級別',
            }
        if (T >= 1)
            return {
                ko: '약한 터널링! STM 현미경 수준',
                en: 'Weak tunneling! STM microscope level',
                ja: '弱いトンネリング！STM顕微鏡レベル',
                es: '¡Tunelamiento débil! Nivel de microscopio STM',
                pt: 'Tunelamento fraco! Nível de microscópio STM',
                'zh-CN': '弱隧穿！STM显微镜级别',
                'zh-TW': '弱穿隧！STM顯微鏡級別',
            }
        return {
            ko: '거의 반사! 터널링 확률 매우 낮아',
            en: 'Almost reflected! Very low tunneling probability',
            ja: 'ほぼ反射！トンネリング確率がとても低い',
            es: '¡Casi reflejado! Probabilidad de tunelamiento muy baja',
            pt: 'Quase refletido! Probabilidade de tunelamento muito baixa',
            'zh-CN': '几乎全反射！隧穿概率非常低',
            'zh-TW': '幾乎全反射！穿隧概率非常低',
        }
    },
    discoveries: [
        {
            id: 'high-probability',
            mission: {
                ko: '투과 확률을 50% 이상으로 만들어봐!',
                en: 'Get transmission probability above 50%!',
                ja: '透過確率を50%以上にしてみて！',
                es: '¡Consigue una probabilidad de transmisión superior al 50%!',
                pt: 'Obtenha probabilidade de transmissão acima de 50%!',
                'zh-CN': '把透射概率提高到50%以上！',
                'zh-TW': '把透射概率提高到50%以上！',
            },
            result: {
                ko: '절반 이상의 입자가 장벽을 통과해!',
                en: 'More than half the particles tunnel through!',
                ja: '半分以上の粒子が障壁を通過する！',
                es: '¡Más de la mitad de las partículas tunelan!',
                pt: 'Mais da metade das partículas tunelam!',
                'zh-CN': '超过一半的粒子穿透了势垒！',
                'zh-TW': '超過一半的粒子穿透了勢壘！',
            },
            icon: '🎯',
            condition: (vars) => vars.T >= 50,
        },
        {
            id: 'classical-transmission',
            mission: {
                ko: '에너지를 장벽 높이 이상으로 올려봐!',
                en: 'Raise energy above the barrier height!',
                ja: 'エネルギーを障壁の高さ以上に上げてみて！',
                es: '¡Eleva la energía por encima de la altura de la barrera!',
                pt: 'Eleve a energia acima da altura da barreira!',
                'zh-CN': '把能量提高到势垒高度以上！',
                'zh-TW': '把能量提高到勢壘高度以上！',
            },
            result: {
                ko: '에너지가 충분하면 100% 통과!',
                en: 'With enough energy, 100% transmission!',
                ja: 'エネルギーが十分なら100%透過！',
                es: '¡Con suficiente energía, 100% de transmisión!',
                pt: 'Com energia suficiente, 100% de transmissão!',
                'zh-CN': '能量足够时，100%透射！',
                'zh-TW': '能量足夠時，100%透射！',
            },
            icon: '💥',
            condition: (vars) => vars.E >= vars.V,
        },
    ],
}
