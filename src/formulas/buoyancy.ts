import { Formula } from './types'
import { colors } from '../styles/colors'

export const buoyancy: Formula = {
    id: 'buoyancy',
    name: {
        ko: '부력',
        en: 'Buoyancy',
        ja: '浮力',
        es: 'Flotabilidad',
        pt: 'Flutuabilidade',
        'zh-CN': '浮力',
        'zh-TW': '浮力',
    },
    expression: 'F = ρVg',
    description: {
        ko: '유체 속에서 물체를 위로 밀어올리는 힘',
        en: 'The upward force pushing an object in a fluid',
        ja: '流体中で物体を上に押し上げる力',
        es: 'La fuerza ascendente que empuja un objeto en un fluido',
        pt: 'A força ascendente que empurra um objeto em um fluido',
        'zh-CN': '流体中向上推动物体的力',
        'zh-TW': '流體中向上推動物體的力',
    },
    simulationHint: {
        ko: '물체가 유체 속에서 밀도에 따라 뜨거나 가라앉는 모습',
        en: 'Shows an object floating or sinking in fluid based on density',
        ja: '物体が密度によって浮いたり沈んだりする様子',
        es: 'Muestra un objeto flotando o hundiéndose en un fluido según la densidad',
        pt: 'Mostra um objeto flutuando ou afundando em um fluido com base na densidade',
        'zh-CN': '显示物体在流体中根据密度浮起或下沉的样子',
        'zh-TW': '顯示物體在流體中根據密度浮起或下沉的樣子',
    },
    applications: {
        ko: [
            '배와 잠수함의 부양 설계',
            '열기구와 비행선의 부력 계산',
            '수영할 때 몸이 뜨는 원리',
            '해수와 담수에서의 부력 차이',
        ],
        en: [
            'Designing ship and submarine flotation',
            'Calculating hot air balloon lift',
            'Why our bodies float when swimming',
            'Buoyancy differences in saltwater vs freshwater',
        ],
        ja: [
            '船や潜水艦の浮揚設計',
            '熱気球や飛行船の浮力計算',
            '泳ぐとき体が浮く原理',
            '海水と淡水での浮力の違い',
        ],
        es: [
            'Diseño de flotación de barcos y submarinos',
            'Cálculo de elevación de globos aerostáticos',
            'Por qué nuestros cuerpos flotan al nadar',
            'Diferencias de flotabilidad en agua salada vs agua dulce',
        ],
        pt: [
            'Projeto de flutuação de navios e submarinos',
            'Cálculo de elevação de balões de ar quente',
            'Por que nossos corpos flutuam ao nadar',
            'Diferenças de flutuabilidade em água salgada vs água doce',
        ],
        'zh-CN': [
            '设计船舶和潜艇的浮力',
            '计算热气球的升力',
            '游泳时身体漂浮的原理',
            '海水和淡水中浮力的差异',
        ],
        'zh-TW': [
            '設計船舶和潛艇的浮力',
            '計算熱氣球的升力',
            '游泳時身體漂浮的原理',
            '海水和淡水中浮力的差異',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'ρ',
            name: {
                ko: '유체 밀도',
                en: 'Fluid Density',
                ja: '流体密度',
                es: 'Densidad del Fluido',
                pt: 'Densidade do Fluido',
                'zh-CN': '流体密度',
                'zh-TW': '流體密度',
            },
            role: 'input',
            unit: 'kg/m³',
            range: [100, 1500],
            default: 1000,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 500,
                color: colors.density,
            },
        },
        {
            symbol: 'V',
            name: {
                ko: '잠긴 부피',
                en: 'Submerged Volume',
                ja: '沈んだ体積',
                es: 'Volumen Sumergido',
                pt: 'Volume Submerso',
                'zh-CN': '浸没体积',
                'zh-TW': '浸沒體積',
            },
            role: 'input',
            unit: 'L',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.5,
                color: colors.volume,
            },
        },
        {
            symbol: 'g',
            name: {
                ko: '중력 가속도',
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
                property: 'speed',
                scale: (value: number) => value / 5,
                color: colors.velocity,
            },
        },
        {
            symbol: 'F',
            name: {
                ko: '부력',
                en: 'Buoyant Force',
                ja: '浮力',
                es: 'Fuerza de Flotación',
                pt: 'Força de Flutuação',
                'zh-CN': '浮力',
                'zh-TW': '浮力',
            },
            role: 'output',
            unit: 'N',
            range: [0, 500],
            default: 98,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 50,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const rho = inputs['ρ'] ?? 1000
        const V = inputs.V ?? 10
        const g = inputs.g ?? 9.8
        // V in L = 0.001 m³
        return {
            F: rho * (V / 1000) * g,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const rho = inputs['ρ'] ?? 1000
        const V = inputs.V ?? 10
        const g = inputs.g ?? 9.8
        const F = rho * (V / 1000) * g
        return `F = ${rho.toFixed(0)} × ${(V / 1000).toFixed(3)} × ${g.toFixed(1)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'float',
        connections: [
            { from: 'ρ', to: 'V', operator: '×' },
            { from: 'V', to: 'g', operator: '×' },
            { from: 'g', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['ρ', 'V', 'g'],
    },
    discoveries: [
        {
            id: 'saltwater-float',
            mission: {
                ko: '유체 밀도 ρ를 1200 이상으로 올려봐! (소금물)',
                en: 'Raise fluid density above 1200! (saltwater)',
                ja: '流体密度ρを1200以上に上げてみて！（塩水）',
                es: '¡Sube la densidad del fluido por encima de 1200! (agua salada)',
                pt: 'Aumente a densidade do fluido acima de 1200! (água salgada)',
                'zh-CN': '将流体密度提高到1200以上！（盐水）',
                'zh-TW': '將流體密度提高到1200以上！（鹽水）',
            },
            result: {
                ko: '밀도가 높은 유체에서는 부력이 더 커! 사해에서 몸이 쉽게 뜨는 이유야.',
                en: 'Denser fluids provide more buoyancy! This is why you float easily in the Dead Sea.',
                ja: '密度が高い流体では浮力が大きい！死海で体が簡単に浮く理由だよ。',
                es: '¡Los fluidos más densos proporcionan más flotabilidad! Por eso flotas fácilmente en el Mar Muerto.',
                pt: 'Fluidos mais densos fornecem mais flutuabilidade! Por isso você flutua facilmente no Mar Morto.',
                'zh-CN': '密度更大的流体提供更大的浮力！这就是你在死海中容易漂浮的原因。',
                'zh-TW': '密度更大的流體提供更大的浮力！這就是你在死海中容易漂浮的原因。',
            },
            icon: '🏊',
            condition: (vars) => vars['ρ'] >= 1200,
        },
        {
            id: 'large-volume',
            mission: {
                ko: '잠긴 부피 V를 최대(100L)로 늘려봐!',
                en: 'Maximize submerged volume V to 100L!',
                ja: '沈んだ体積Vを最大（100L）まで増やしてみて！',
                es: '¡Maximiza el volumen sumergido V a 100L!',
                pt: 'Maximize o volume submerso V para 100L!',
                'zh-CN': '将浸没体积V最大化到100L！',
                'zh-TW': '將浸沒體積V最大化到100L！',
            },
            result: {
                ko: '부피가 클수록 부력이 커! 큰 배가 물에 뜰 수 있는 원리야.',
                en: 'Larger volume means more buoyancy! This is how massive ships float on water.',
                ja: '体積が大きいほど浮力が大きい！大きな船が水に浮く原理だよ。',
                es: '¡Mayor volumen significa más flotabilidad! Así es como los barcos masivos flotan en el agua.',
                pt: 'Maior volume significa mais flutuabilidade! É assim que navios enormes flutuam na água.',
                'zh-CN': '体积越大浮力越大！这就是大船能浮在水上的原理。',
                'zh-TW': '體積越大浮力越大！這就是大船能浮在水上的原理。',
            },
            icon: '🚢',
            condition: (vars) => vars['V'] >= 90,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 10)
            return {
                ko: '작은 장난감이 뜨는 힘이야',
                en: 'Force to float a small toy',
                ja: '小さなおもちゃが浮く力だよ',
                es: 'Fuerza para flotar un juguete pequeño',
                pt: 'Força para flutuar um brinquedo pequeno',
                'zh-CN': '让小玩具漂浮的力',
                'zh-TW': '讓小玩具漂浮的力',
            }
        if (F < 50)
            return {
                ko: '수박이 뜨는 힘 정도야',
                en: 'Force to float a watermelon',
                ja: 'スイカが浮く力くらいだよ',
                es: 'Fuerza para flotar una sandía',
                pt: 'Força para flutuar uma melancia',
                'zh-CN': '让西瓜漂浮的力',
                'zh-TW': '讓西瓜漂浮的力',
            }
        if (F < 100)
            return {
                ko: '어린이가 뜨는 부력이야',
                en: 'Buoyancy to float a child',
                ja: '子供が浮く浮力だよ',
                es: 'Flotabilidad para flotar un niño',
                pt: 'Flutuabilidade para flutuar uma criança',
                'zh-CN': '让儿童漂浮的浮力',
                'zh-TW': '讓兒童漂浮的浮力',
            }
        if (F < 300)
            return {
                ko: '성인이 뜨는 부력이야',
                en: 'Buoyancy to float an adult',
                ja: '大人が浮く浮力だよ',
                es: 'Flotabilidad para flotar un adulto',
                pt: 'Flutuabilidade para flutuar um adulto',
                'zh-CN': '让成人漂浮的浮力',
                'zh-TW': '讓成人漂浮的浮力',
            }
        return {
            ko: '보트가 뜨는 부력이야!',
            en: 'Boat-floating buoyancy!',
            ja: 'ボートが浮く浮力だよ！',
            es: '¡Flotabilidad para flotar un bote!',
            pt: 'Flutuabilidade para flutuar um barco!',
            'zh-CN': '让船漂浮的浮力！',
            'zh-TW': '讓船漂浮的浮力！',
        }
    },
}
