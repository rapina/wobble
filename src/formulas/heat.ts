import { Formula } from './types'
import { colors } from '../styles/colors'

export const heat: Formula = {
    id: 'heat',
    name: {
        ko: '열량',
        en: 'Heat Transfer',
        ja: '熱量',
        es: 'Transferencia de Calor',
        pt: 'Transferência de Calor',
        'zh-CN': '热量',
        'zh-TW': '熱量',
    },
    expression: 'Q = mcΔT',
    description: {
        ko: '물체의 온도를 변화시키는 데 필요한 열에너지',
        en: "The heat energy required to change an object's temperature",
        ja: '物体の温度を変化させるのに必要な熱エネルギー',
        es: 'La energía térmica necesaria para cambiar la temperatura de un objeto',
        pt: 'A energia térmica necessária para mudar a temperatura de um objeto',
        'zh-CN': '改变物体温度所需的热能',
        'zh-TW': '改變物體溫度所需的熱能',
    },
    simulationHint: {
        ko: '물체에 열이 가해지면서 온도가 올라가는 모습',
        en: 'Shows temperature rising as heat is applied to an object',
        ja: '物体に熱が加わり温度が上がる様子',
        es: 'Muestra la temperatura subiendo al aplicar calor a un objeto',
        pt: 'Mostra a temperatura subindo quando calor é aplicado a um objeto',
        'zh-CN': '显示物体被加热时温度上升的样子',
        'zh-TW': '顯示物體被加熱時溫度上升的樣子',
    },
    applications: {
        ko: [
            '물을 끓이는 데 필요한 에너지 계산',
            '냉난방 시스템 용량 설계',
            '요리할 때 조리 시간 예측',
            '수영장 온수 가열 비용 계산',
        ],
        en: [
            'Calculating energy needed to boil water',
            'Designing HVAC system capacity',
            'Estimating cooking times',
            'Calculating pool heating costs',
        ],
        ja: [
            'お湯を沸かすのに必要なエネルギー計算',
            '空調システムの容量設計',
            '調理時間の予測',
            'プール温水の加熱費計算',
        ],
        es: [
            'Calcular energía necesaria para hervir agua',
            'Diseño de capacidad de sistemas HVAC',
            'Estimar tiempos de cocción',
            'Calcular costos de calentamiento de piscinas',
        ],
        pt: [
            'Calcular energia necessária para ferver água',
            'Projeto de capacidade de sistemas HVAC',
            'Estimar tempos de cozimento',
            'Calcular custos de aquecimento de piscinas',
        ],
        'zh-CN': [
            '计算烧开水所需的能量',
            '设计暖通空调系统容量',
            '估算烹饪时间',
            '计算游泳池加热费用',
        ],
        'zh-TW': [
            '計算燒開水所需的能量',
            '設計暖通空調系統容量',
            '估算烹飪時間',
            '計算游泳池加熱費用',
        ],
    },
    category: 'thermodynamics',
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
            unit: 'kg',
            range: [0.5, 10],
            default: 2,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 5,
                color: colors.mass,
            },
        },
        {
            symbol: 'c',
            name: {
                ko: '비열',
                en: 'Specific Heat',
                ja: '比熱',
                es: 'Calor Específico',
                pt: 'Calor Específico',
                'zh-CN': '比热容',
                'zh-TW': '比熱容',
            },
            role: 'input',
            unit: 'J/kg·K',
            range: [500, 4200],
            default: 4186,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 1000,
                color: colors.spring,
            },
        },
        {
            symbol: 'ΔT',
            name: {
                ko: '온도 변화',
                en: 'Temperature Change',
                ja: '温度変化',
                es: 'Cambio de Temperatura',
                pt: 'Mudança de Temperatura',
                'zh-CN': '温度变化',
                'zh-TW': '溫度變化',
            },
            role: 'input',
            unit: 'K',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 10,
                color: colors.temperature,
            },
        },
        {
            symbol: 'Q',
            name: {
                ko: '열량',
                en: 'Heat',
                ja: '熱量',
                es: 'Calor',
                pt: 'Calor',
                'zh-CN': '热量',
                'zh-TW': '熱量',
            },
            role: 'output',
            unit: 'kJ',
            range: [0, 2000],
            default: 83.72,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 200,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 2
        const c = inputs.c ?? 4186
        const deltaT = inputs['ΔT'] ?? 10
        return {
            Q: (m * c * deltaT) / 1000, // Convert to kJ
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 2
        const c = inputs.c ?? 4186
        const deltaT = inputs['ΔT'] ?? 10
        const Q = (m * c * deltaT) / 1000
        return `Q = ${m.toFixed(1)} × ${c.toFixed(0)} × ${deltaT.toFixed(0)} ÷ 1000 = ${Q.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm', to: 'c', operator: '×' },
            { from: 'c', to: 'ΔT', operator: '×' },
            { from: 'ΔT', to: 'Q', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'Q',
        numerator: ['m', 'c', 'ΔT'],
    },
    discoveries: [
        {
            id: 'water-high-capacity',
            mission: {
                ko: '비열 c를 최대(4200)로 설정해봐! (물의 비열)',
                en: 'Set specific heat c to maximum (4200)! (water)',
                ja: '比熱cを最大（4200）に設定してみて！（水の比熱）',
                es: '¡Configura el calor específico c al máximo (4200)! (agua)',
                pt: 'Configure o calor específico c para o máximo (4200)! (água)',
                'zh-CN': '把比热容c设为最大（4200）！（水的比热容）',
                'zh-TW': '把比熱容c設為最大（4200）！（水的比熱容）',
            },
            result: {
                ko: '물은 비열이 높아서 많은 열을 흡수해! 바다가 기후를 조절하는 이유야.',
                en: 'Water has high specific heat and absorbs lots of heat! This is why oceans regulate climate.',
                ja: '水は比熱が高くて多くの熱を吸収する！海が気候を調節する理由だよ。',
                es: '¡El agua tiene alto calor específico y absorbe mucho calor! Por eso los océanos regulan el clima.',
                pt: 'A água tem alto calor específico e absorve muito calor! Por isso os oceanos regulam o clima.',
                'zh-CN': '水的比热容高，能吸收大量热量！这就是海洋调节气候的原因。',
                'zh-TW': '水的比熱容高，能吸收大量熱量！這就是海洋調節氣候的原因。',
            },
            icon: '🌊',
            condition: (vars) => vars['c'] >= 4000,
        },
        {
            id: 'metal-low-capacity',
            mission: {
                ko: '비열 c를 600 이하로 낮춰봐! (금속)',
                en: 'Lower specific heat c below 600! (metal)',
                ja: '比熱cを600以下に下げてみて！（金属）',
                es: '¡Baja el calor específico c por debajo de 600! (metal)',
                pt: 'Reduza o calor específico c abaixo de 600! (metal)',
                'zh-CN': '把比热容c降到600以下！（金属）',
                'zh-TW': '把比熱容c降到600以下！（金屬）',
            },
            result: {
                ko: '금속은 비열이 낮아 빨리 뜨거워지고 빨리 식어! 프라이팬이 빨리 달궈지는 이유야.',
                en: 'Metals have low specific heat - they heat up and cool down quickly! Why frying pans heat fast.',
                ja: '金属は比熱が低いから早く熱くなって早く冷める！フライパンが早く熱くなる理由だよ。',
                es: '¡Los metales tienen bajo calor específico - se calientan y enfrían rápido! Por eso las sartenes calientan rápido.',
                pt: 'Metais têm baixo calor específico - aquecem e esfriam rápido! Por isso frigideiras aquecem rápido.',
                'zh-CN': '金属比热容低，升温快降温也快！这就是平底锅加热快的原因。',
                'zh-TW': '金屬比熱容低，升溫快降溫也快！這就是平底鍋加熱快的原因。',
            },
            icon: '🍳',
            condition: (vars) => vars['c'] <= 600,
        },
    ],
    getInsight: (vars) => {
        const Q = vars['Q']
        if (Q < 10)
            return {
                ko: '커피 한 잔 식히는 열량이야',
                en: 'Heat to cool a cup of coffee',
                ja: 'コーヒー1杯を冷ます熱量だよ',
                es: 'Calor para enfriar una taza de café',
                pt: 'Calor para esfriar uma xícara de café',
                'zh-CN': '冷却一杯咖啡的热量',
                'zh-TW': '冷卻一杯咖啡的熱量',
            }
        if (Q < 50)
            return {
                ko: '샤워할 물 데우는 열량이야',
                en: 'Heat for shower water',
                ja: 'シャワーのお湯を温める熱量だよ',
                es: 'Calor para agua de ducha',
                pt: 'Calor para água do chuveiro',
                'zh-CN': '加热淋浴水的热量',
                'zh-TW': '加熱淋浴水的熱量',
            }
        if (Q < 200)
            return {
                ko: '냄비 물 끓이는 열량이야',
                en: 'Heat to boil a pot',
                ja: '鍋のお湯を沸かす熱量だよ',
                es: 'Calor para hervir una olla',
                pt: 'Calor para ferver uma panela',
                'zh-CN': '烧开一锅水的热量',
                'zh-TW': '燒開一鍋水的熱量',
            }
        if (Q < 500)
            return {
                ko: '욕조 물 데우는 열량이야',
                en: 'Heat for a bathtub',
                ja: '浴槽のお湯を温める熱量だよ',
                es: 'Calor para una bañera',
                pt: 'Calor para uma banheira',
                'zh-CN': '加热浴缸水的热量',
                'zh-TW': '加熱浴缸水的熱量',
            }
        return {
            ko: '수영장 데우는 열량이야!',
            en: 'Pool heating level!',
            ja: 'プールを温める熱量だよ！',
            es: '¡Nivel de calentamiento de piscina!',
            pt: 'Nível de aquecimento de piscina!',
            'zh-CN': '加热游泳池的热量！',
            'zh-TW': '加熱游泳池的熱量！',
        }
    },
}
