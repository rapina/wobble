import { Formula } from './types'
import { colors } from '../styles/colors'

export const photoelectric: Formula = {
    id: 'photoelectric',
    name: {
        ko: '광전효과',
        en: 'Photoelectric Effect',
        ja: '光電効果',
        es: 'Efecto Fotoeléctrico',
        pt: 'Efeito Fotoelétrico',
        'zh-CN': '光电效应',
        'zh-TW': '光電效應',
    },
    expression: 'Ek = hf - W',
    description: {
        ko: '빛이 금속 표면에서 전자를 방출시킬 때, 전자의 운동에너지',
        en: 'The kinetic energy of electrons emitted when light strikes a metal surface',
        ja: '光が金属表面から電子を放出させるとき、その電子の運動エネルギー',
        es: 'La energía cinética de los electrones emitidos cuando la luz golpea una superficie metálica',
        pt: 'A energia cinética dos elétrons emitidos quando a luz atinge uma superfície metálica',
        'zh-CN': '当光照射金属表面时发射的电子的动能',
        'zh-TW': '當光照射金屬表面時發射的電子的動能',
    },
    simulationHint: {
        ko: '빛이 금속에 닿으면 전자가 튀어나오는 모습',
        en: 'Shows electrons being ejected when light hits a metal surface',
        ja: '光が金属に当たると電子が飛び出す様子',
        es: 'Muestra electrones siendo expulsados cuando la luz golpea una superficie metálica',
        pt: 'Mostra elétrons sendo ejetados quando a luz atinge uma superfície metálica',
        'zh-CN': '显示光照射金属时电子被弹出的样子',
        'zh-TW': '顯示光照射金屬時電子被彈出的樣子',
    },
    applications: {
        ko: [
            '태양전지의 전기 생산 원리',
            '디지털 카메라 이미지 센서',
            '자동문의 적외선 센서',
            '야간 투시경과 광전자 증배관',
        ],
        en: [
            'How solar cells generate electricity',
            'Digital camera image sensors',
            'Automatic door infrared sensors',
            'Night vision and photomultiplier tubes',
        ],
        ja: [
            '太陽電池の発電原理',
            'デジタルカメラのイメージセンサー',
            '自動ドアの赤外線センサー',
            '暗視装置と光電子増倍管',
        ],
        es: [
            'Cómo las celdas solares generan electricidad',
            'Sensores de imagen de cámaras digitales',
            'Sensores infrarrojos de puertas automáticas',
            'Visión nocturna y tubos fotomultiplicadores',
        ],
        pt: [
            'Como as células solares geram eletricidade',
            'Sensores de imagem de câmeras digitais',
            'Sensores infravermelhos de portas automáticas',
            'Visão noturna e tubos fotomultiplicadores',
        ],
        'zh-CN': [
            '太阳能电池发电原理',
            '数码相机图像传感器',
            '自动门红外传感器',
            '夜视仪和光电倍增管',
        ],
        'zh-TW': [
            '太陽能電池發電原理',
            '數位相機影像感測器',
            '自動門紅外線感測器',
            '夜視儀和光電倍增管',
        ],
    },
    category: 'quantum',
    variables: [
        {
            symbol: 'f',
            name: {
                ko: '빛의 진동수',
                en: 'Light Frequency',
                ja: '光の振動数',
                es: 'Frecuencia de Luz',
                pt: 'Frequência da Luz',
                'zh-CN': '光频率',
                'zh-TW': '光頻率',
            },
            role: 'input',
            unit: '×10¹⁴ Hz',
            range: [4, 12],
            default: 7,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 3,
                color: colors.time,
            },
        },
        {
            symbol: 'W',
            name: {
                ko: '일함수',
                en: 'Work Function',
                ja: '仕事関数',
                es: 'Función de Trabajo',
                pt: 'Função Trabalho',
                'zh-CN': '功函数',
                'zh-TW': '功函數',
            },
            role: 'input',
            unit: 'eV',
            range: [1, 5],
            default: 2.3,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 8,
                color: colors.resistance,
            },
        },
        {
            symbol: 'Ek',
            name: {
                ko: '운동에너지',
                en: 'Kinetic Energy',
                ja: '運動エネルギー',
                es: 'Energía Cinética',
                pt: 'Energia Cinética',
                'zh-CN': '动能',
                'zh-TW': '動能',
            },
            role: 'output',
            unit: 'eV',
            range: [0, 5],
            default: 0.6,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 2,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const f = inputs.f ?? 7 // ×10¹⁴ Hz
        const W = inputs.W ?? 2.3 // eV
        // h = 4.136 × 10⁻¹⁵ eV·s
        // E = hf = 4.136 × 10⁻¹⁵ × f × 10¹⁴ = 0.4136 × f eV
        const h = 0.4136 // eV per 10¹⁴ Hz
        const Ek = Math.max(0, h * f - W)
        return { Ek }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const f = inputs.f ?? 7
        const W = inputs.W ?? 2.3
        const h = 0.4136
        const hf = h * f
        const Ek = Math.max(0, hf - W)
        if (hf < W) {
            return `Ek = ${hf.toFixed(2)} - ${W.toFixed(1)} < 0 → 방출 불가`
        }
        return `Ek = ${hf.toFixed(2)} - ${W.toFixed(1)} = ${Ek.toFixed(2)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'f', to: 'W', operator: '-' },
            { from: 'W', to: 'Ek', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'Ek',
        expression: [
            { type: 'text', value: 'h' },
            { type: 'var', symbol: 'f' },
            { type: 'op', value: '-' },
            { type: 'var', symbol: 'W' },
        ],
    },
    getInsight: (vars) => {
        const Ek = vars['Ek']
        const f = vars['f'] ?? 7
        const W = vars['W'] ?? 2.3
        const h = 0.4136
        if (h * f < W)
            return {
                ko: '문턱 이하! 전자가 방출되지 않아',
                en: 'Below threshold! No electron emission',
                ja: 'しきい値以下！電子が放出されない',
                es: '¡Por debajo del umbral! Sin emisión de electrones',
                pt: 'Abaixo do limiar! Sem emissão de elétrons',
                'zh-CN': '低于阈值！不发射电子',
                'zh-TW': '低於閾值！不發射電子',
            }
        if (Ek < 0.5)
            return {
                ko: '느린 전자가 방출됐어',
                en: 'Slow electrons emitted',
                ja: '遅い電子が放出されたよ',
                es: 'Electrones lentos emitidos',
                pt: 'Elétrons lentos emitidos',
                'zh-CN': '发射了慢电子',
                'zh-TW': '發射了慢電子',
            }
        if (Ek < 1.5)
            return {
                ko: '태양전지 수준의 전자 에너지야',
                en: 'Solar cell level electron energy',
                ja: '太陽電池レベルの電子エネルギーだよ',
                es: 'Energía de electrones nivel celda solar',
                pt: 'Energia de elétrons nível célula solar',
                'zh-CN': '太阳能电池级电子能量',
                'zh-TW': '太陽能電池級電子能量',
            }
        if (Ek < 3)
            return {
                ko: '가시광선급 광전자야',
                en: 'Visible light level photoelectron',
                ja: '可視光線級の光電子だよ',
                es: 'Fotoelectrón nivel luz visible',
                pt: 'Fotoelétron nível luz visível',
                'zh-CN': '可见光级光电子',
                'zh-TW': '可見光級光電子',
            }
        return {
            ko: '고에너지 광전자! 자외선급이야',
            en: 'High energy photoelectron! UV level',
            ja: '高エネルギー光電子！紫外線級だよ',
            es: '¡Fotoelectrón de alta energía! Nivel UV',
            pt: 'Fotoelétron de alta energia! Nível UV',
            'zh-CN': '高能光电子！紫外线级',
            'zh-TW': '高能光電子！紫外線級',
        }
    },
    discoveries: [
        {
            id: 'threshold-frequency',
            mission: {
                ko: '진동수를 낮춰서 방출이 안 되게 해봐!',
                en: 'Lower the frequency until emission stops!',
                ja: '振動数を下げて放出が止まるようにしてみて！',
                es: '¡Baja la frecuencia hasta que la emisión se detenga!',
                pt: 'Reduza a frequência até a emissão parar!',
                'zh-CN': '降低频率直到停止发射！',
                'zh-TW': '降低頻率直到停止發射！',
            },
            result: {
                ko: '문턱 진동수 발견! 아무리 밝아도 전자가 안 나와!',
                en: 'Threshold frequency found! No emission regardless of intensity!',
                ja: 'しきい振動数を発見！どんなに明るくても電子が出ない！',
                es: '¡Frecuencia umbral encontrada! ¡Sin emisión sin importar la intensidad!',
                pt: 'Frequência limiar encontrada! Sem emissão independente da intensidade!',
                'zh-CN': '发现阈值频率！无论多亮都不发射电子！',
                'zh-TW': '發現閾值頻率！無論多亮都不發射電子！',
            },
            icon: '🚫',
            condition: (vars) => {
                const f = vars.f ?? 7
                const W = vars.W ?? 2.3
                const h = 0.4136
                return h * f < W
            },
        },
        {
            id: 'high-energy-electron',
            mission: {
                ko: '진동수를 최대로 올려봐!',
                en: 'Maximize the frequency!',
                ja: '振動数を最大にしてみて！',
                es: '¡Maximiza la frecuencia!',
                pt: 'Maximize a frequência!',
                'zh-CN': '把频率调到最大！',
                'zh-TW': '把頻率調到最大！',
            },
            result: {
                ko: '고에너지 빛은 빠른 전자를 만들어!',
                en: 'High-energy light creates fast electrons!',
                ja: '高エネルギーの光は速い電子を作る！',
                es: '¡La luz de alta energía crea electrones rápidos!',
                pt: 'Luz de alta energia cria elétrons rápidos!',
                'zh-CN': '高能光产生快速电子！',
                'zh-TW': '高能光產生快速電子！',
            },
            icon: '⚡',
            condition: (vars) => vars.f >= 11,
        },
    ],
}
