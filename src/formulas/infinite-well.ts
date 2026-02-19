import { Formula } from './types'
import { colors } from '../styles/colors'

export const infiniteWell: Formula = {
    id: 'infinite-well',
    name: {
        ko: '무한 퍼텐셜 우물',
        en: 'Infinite Square Well',
        ja: '無限井戸型ポテンシャル',
        es: 'Pozo de Potencial Infinito',
        pt: 'Poço de Potencial Infinito',
        'zh-CN': '无限深势阱',
        'zh-TW': '無限深位能井',
    },
    expression: 'Eₙ = n²ℏ²π²/2mL²',
    description: {
        ko: '상자 안에 갇힌 입자는 양자화된 에너지 준위만 가질 수 있다',
        en: 'A particle confined in a box can only have quantized energy levels',
        ja: '箱の中に閉じ込められた粒子は量子化されたエネルギー準位のみを持てる',
        es: 'Una partícula confinada en una caja solo puede tener niveles de energía cuantizados',
        pt: 'Uma partícula confinada em uma caixa só pode ter níveis de energia quantizados',
        'zh-CN': '被限制在盒子里的粒子只能具有量子化的能级',
        'zh-TW': '被限制在盒子裡的粒子只能具有量子化的能階',
    },
    simulationHint: {
        ko: '상자 안에 갇힌 입자의 파동함수가 정상파를 이루는 모습',
        en: 'Shows a particle confined in a box forming standing wave patterns',
        ja: '箱の中の粒子の波動関数が定常波を形成する様子',
        es: 'Muestra una partícula confinada en una caja formando patrones de ondas estacionarias',
        pt: 'Mostra uma partícula confinada em uma caixa formando padrões de ondas estacionárias',
        'zh-CN': '显示被限制在盒子里的粒子形成驻波图案',
        'zh-TW': '顯示被限制在盒子裡的粒子形成駐波圖案',
    },
    applications: {
        ko: [
            '양자 우물 레이저의 파장 제어',
            '나노선 전자소자의 에너지 준위',
            '형광 양자점의 색상 결정',
            '탄소 나노튜브의 전자 구조',
        ],
        en: [
            'Wavelength control in quantum well lasers',
            'Energy levels in nanowire devices',
            'Color determination in fluorescent quantum dots',
            'Electronic structure of carbon nanotubes',
        ],
        ja: [
            '量子井戸レーザーの波長制御',
            'ナノワイヤデバイスのエネルギー準位',
            '蛍光量子ドットの色の決定',
            'カーボンナノチューブの電子構造',
        ],
        es: [
            'Control de longitud de onda en láseres de pozo cuántico',
            'Niveles de energía en dispositivos de nanohilo',
            'Determinación de color en puntos cuánticos fluorescentes',
            'Estructura electrónica de nanotubos de carbono',
        ],
        pt: [
            'Controle de comprimento de onda em lasers de poço quântico',
            'Níveis de energia em dispositivos de nanofio',
            'Determinação de cor em pontos quânticos fluorescentes',
            'Estrutura eletrônica de nanotubos de carbono',
        ],
        'zh-CN': [
            '量子阱激光器的波长控制',
            '纳米线器件的能级',
            '荧光量子点的颜色确定',
            '碳纳米管的电子结构',
        ],
        'zh-TW': [
            '量子井雷射的波長控制',
            '奈米線元件的能階',
            '螢光量子點的顏色確定',
            '碳奈米管的電子結構',
        ],
    },
    category: 'quantum',
    variables: [
        {
            symbol: 'n',
            name: {
                ko: '양자수',
                en: 'Quantum Number',
                ja: '量子数',
                es: 'Número Cuántico',
                pt: 'Número Quântico',
                'zh-CN': '量子数',
                'zh-TW': '量子數',
            },
            role: 'input',
            unit: '',
            range: [1, 5],
            default: 1,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.wavelength,
            },
        },
        {
            symbol: 'L',
            name: {
                ko: '우물 너비',
                en: 'Well Width',
                ja: '井戸の幅',
                es: 'Ancho del Pozo',
                pt: 'Largura do Poço',
                'zh-CN': '势阱宽度',
                'zh-TW': '位能井寬度',
            },
            role: 'input',
            unit: 'nm',
            range: [0.5, 5],
            default: 1,
            visual: {
                property: 'stretch',
                scale: (value: number) => value * 40,
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
            range: [0.04, 10],
            default: 0.38,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 5,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 1)
        const L = inputs.L ?? 1 // nm
        // E_n = n²ℏ²π²/(2mL²)
        // For electron: E_n = 0.376 * n² / L² eV (L in nm)
        const E = (0.376 * n * n) / (L * L)
        return { E }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const n = Math.round(inputs.n ?? 1)
        const L = inputs.L ?? 1
        const E = (0.376 * n * n) / (L * L)
        return `E = 0.376×${n}²/${L.toFixed(1)}² = ${E.toFixed(3)} eV`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'n', to: 'E', operator: '=' },
            { from: 'L', to: 'E', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'E',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'n', square: true },
                    { type: 'text', value: 'ℏ²π²' },
                ],
                denominator: [
                    { type: 'text', value: '2m' },
                    { type: 'var', symbol: 'L', square: true },
                ],
            },
        ],
    },
    getInsight: (vars) => {
        const E = vars['E']
        const n = Math.round(vars['n'] ?? 1)
        if (n === 1 && E < 0.5)
            return {
                ko: '바닥상태의 낮은 에너지야',
                en: 'Low energy ground state',
                ja: '基底状態の低エネルギーだよ',
                es: 'Estado fundamental de baja energía',
                pt: 'Estado fundamental de baixa energia',
                'zh-CN': '低能量基态',
                'zh-TW': '低能量基態',
            }
        if (E < 1)
            return {
                ko: '적외선 정도의 에너지야',
                en: 'Infrared level energy',
                ja: '赤外線程度のエネルギーだよ',
                es: 'Energía nivel infrarrojo',
                pt: 'Energia nível infravermelho',
                'zh-CN': '红外级能量',
                'zh-TW': '紅外線級能量',
            }
        if (E < 3)
            return {
                ko: '가시광선 정도의 에너지야',
                en: 'Visible light level energy',
                ja: '可視光線程度のエネルギーだよ',
                es: 'Energía nivel luz visible',
                pt: 'Energia nível luz visível',
                'zh-CN': '可见光级能量',
                'zh-TW': '可見光級能量',
            }
        if (E < 5)
            return {
                ko: '자외선 정도의 에너지야',
                en: 'Ultraviolet level energy',
                ja: '紫外線程度のエネルギーだよ',
                es: 'Energía nivel ultravioleta',
                pt: 'Energia nível ultravioleta',
                'zh-CN': '紫外线级能量',
                'zh-TW': '紫外線級能量',
            }
        return {
            ko: 'X선급 높은 에너지!',
            en: 'X-ray level high energy!',
            ja: 'X線級の高エネルギー！',
            es: '¡Energía alta nivel rayos X!',
            pt: 'Energia alta nível raio X!',
            'zh-CN': 'X射线级高能量！',
            'zh-TW': 'X射線級高能量！',
        }
    },
    discoveries: [
        {
            id: 'narrow-well',
            mission: {
                ko: '우물 너비 L을 0.7nm 이하로 줄여봐!',
                en: 'Reduce well width L below 0.7nm!',
                ja: '井戸の幅Lを0.7nm以下に減らしてみて！',
                es: '¡Reduce el ancho del pozo L por debajo de 0.7nm!',
                pt: 'Reduza a largura do poço L abaixo de 0.7nm!',
                'zh-CN': '将势阱宽度L减少到0.7nm以下！',
                'zh-TW': '將位能井寬度L減少到0.7nm以下！',
            },
            result: {
                ko: '좁은 우물은 높은 에너지! 양자점이 작을수록 더 높은 에너지 빛을 내.',
                en: 'Narrow well means higher energy! Smaller quantum dots emit higher energy light.',
                ja: '狭い井戸は高エネルギー！量子ドットが小さいほど高エネルギーの光を出すよ。',
                es: '¡Pozo estrecho significa mayor energía! Los puntos cuánticos más pequeños emiten luz de mayor energía.',
                pt: 'Poço estreito significa maior energia! Pontos quânticos menores emitem luz de maior energia.',
                'zh-CN': '窄势阱意味着更高能量！更小的量子点发出更高能量的光。',
                'zh-TW': '窄位能井意味著更高能量！更小的量子點發出更高能量的光。',
            },
            icon: '💡',
            condition: (vars) => vars['L'] <= 0.7,
        },
        {
            id: 'excited-state',
            mission: {
                ko: '양자수 n을 4 이상으로 올려봐!',
                en: 'Raise quantum number n above 4!',
                ja: '量子数nを4以上に上げてみて！',
                es: '¡Aumenta el número cuántico n por encima de 4!',
                pt: 'Aumente o número quântico n acima de 4!',
                'zh-CN': '将量子数n提高到4以上！',
                'zh-TW': '將量子數n提高到4以上！',
            },
            result: {
                ko: '높은 양자수는 에너지가 n²에 비례해서 급격히 증가! 양자 레이저의 원리야.',
                en: 'Higher quantum number means energy increases as n squared! The principle of quantum lasers.',
                ja: '高い量子数はエネルギーがn²に比例して急激に増加！量子レーザーの原理だよ。',
                es: '¡Mayor número cuántico significa que la energía aumenta como n al cuadrado! El principio de los láseres cuánticos.',
                pt: 'Maior número quântico significa que a energia aumenta como n ao quadrado! O princípio dos lasers quânticos.',
                'zh-CN': '更高的量子数意味着能量按n²增加！这是量子激光器的原理。',
                'zh-TW': '更高的量子數意味著能量按n²增加！這是量子雷射的原理。',
            },
            icon: '🔬',
            condition: (vars) => Math.round(vars['n']) >= 4,
        },
    ],
}
