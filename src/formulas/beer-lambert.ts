import { Formula } from './types'
import { colors } from '../styles/colors'

export const beerLambert: Formula = {
    id: 'beer-lambert',
    name: {
        ko: '빛의 감쇠',
        en: 'Light Attenuation',
        ja: '光の減衰',
        es: 'Atenuación de la Luz',
        pt: 'Atenuação da Luz',
        'zh-CN': '光衰减',
        'zh-TW': '光衰減',
    },
    expression: 'I = I₀e^(-αL)',
    description: {
        ko: '매질을 통과하는 빛의 세기 감쇠',
        en: 'Light intensity attenuation through a medium',
        ja: '媒質を通過する光の強度減衰',
        es: 'Atenuación de la intensidad de la luz a través de un medio',
        pt: 'Atenuação da intensidade da luz através de um meio',
        'zh-CN': '光强度通过介质时的衰减',
        'zh-TW': '光強度通過介質時的衰減',
    },
    simulationHint: {
        ko: '레이저가 매질을 통과하며 점점 약해지는 모습',
        en: 'Watch a laser beam fade as it travels through a medium',
        ja: 'レーザーが媒質を通過して弱くなる様子',
        es: 'Observa cómo un rayo láser se desvanece al viajar a través de un medio',
        pt: 'Observe um feixe de laser desvanecer ao viajar através de um meio',
        'zh-CN': '观察激光束穿过介质时逐渐变弱的样子',
        'zh-TW': '觀察雷射光束穿過介質時逐漸變弱的樣子',
    },
    applications: {
        ko: [
            '레이저 거리 측정기',
            '광섬유 통신의 신호 손실',
            '분광학에서 농도 측정',
            '의료용 레이저 치료',
        ],
        en: [
            'Laser rangefinders',
            'Signal loss in fiber optic cables',
            'Concentration measurement in spectroscopy',
            'Medical laser treatments',
        ],
        ja: [
            'レーザー距離計',
            '光ファイバー通信の信号損失',
            '分光法での濃度測定',
            '医療用レーザー治療',
        ],
        es: [
            'Telémetros láser',
            'Pérdida de señal en cables de fibra óptica',
            'Medición de concentración en espectroscopía',
            'Tratamientos láser médicos',
        ],
        pt: [
            'Telêmetros a laser',
            'Perda de sinal em cabos de fibra óptica',
            'Medição de concentração em espectroscopia',
            'Tratamentos médicos a laser',
        ],
        'zh-CN': [
            '激光测距仪',
            '光纤通信中的信号损失',
            '光谱学中的浓度测量',
            '医用激光治疗',
        ],
        'zh-TW': [
            '雷射測距儀',
            '光纖通信中的信號損失',
            '光譜學中的濃度測量',
            '醫用雷射治療',
        ],
    },
    category: 'wave',
    variables: [
        {
            symbol: 'I₀',
            name: {
                ko: '초기 세기',
                en: 'Initial Intensity',
                ja: '初期強度',
                es: 'Intensidad Inicial',
                pt: 'Intensidade Inicial',
                'zh-CN': '初始强度',
                'zh-TW': '初始強度',
            },
            role: 'input',
            unit: 'W/m²',
            range: [10, 100],
            default: 50,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 20,
                color: colors.power,
            },
        },
        {
            symbol: 'α',
            name: {
                ko: '흡수 계수',
                en: 'Absorption Coeff.',
                ja: '吸収係数',
                es: 'Coef. de Absorción',
                pt: 'Coef. de Absorção',
                'zh-CN': '吸收系数',
                'zh-TW': '吸收係數',
            },
            role: 'input',
            unit: '/m',
            range: [0.1, 2],
            default: 0.5,
            visual: {
                property: 'glow',
                scale: (value: number) => 1 - value * 0.3,
                color: colors.density,
            },
        },
        {
            symbol: 'L',
            name: {
                ko: '거리',
                en: 'Distance',
                ja: '距離',
                es: 'Distancia',
                pt: 'Distância',
                'zh-CN': '距离',
                'zh-TW': '距離',
            },
            role: 'input',
            unit: 'm',
            range: [1, 10],
            default: 3,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 30,
                color: colors.distance,
            },
        },
        {
            symbol: 'I',
            name: {
                ko: '출력 세기',
                en: 'Output Intensity',
                ja: '出力強度',
                es: 'Intensidad de Salida',
                pt: 'Intensidade de Saída',
                'zh-CN': '输出强度',
                'zh-TW': '輸出強度',
            },
            role: 'output',
            unit: 'W/m²',
            range: [0, 100],
            default: 11.16,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 20,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const I0 = inputs['I₀'] ?? 50
        const alpha = inputs['α'] ?? 0.5
        const L = inputs['L'] ?? 3
        // I = I₀ × e^(-αL)
        const I = I0 * Math.exp(-alpha * L)
        return { I }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const I0 = inputs['I₀'] ?? 50
        const alpha = inputs['α'] ?? 0.5
        const L = inputs['L'] ?? 3
        const I = I0 * Math.exp(-alpha * L)
        return `I = ${I0.toFixed(0)} × e^(-${alpha.toFixed(2)} × ${L.toFixed(1)}) = ${I.toFixed(2)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'I₀', to: 'α', operator: '×' },
            { from: 'α', to: 'L', operator: '×' },
            { from: 'L', to: 'I', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'I',
        expression: [
            { type: 'var', symbol: 'I₀' },
            { type: 'text', value: 'e' },
            {
                type: 'group',
                items: [
                    { type: 'op', value: '-' },
                    { type: 'var', symbol: 'α' },
                    { type: 'var', symbol: 'L' },
                ],
            },
        ],
    },
    discoveries: [
        {
            id: 'weak-medium',
            mission: {
                ko: '흡수 계수 α를 0.2 이하로 낮춰봐!',
                en: 'Lower absorption coefficient α below 0.2!',
                ja: '吸収係数αを0.2以下に下げてみて！',
                es: '¡Baja el coeficiente de absorción α por debajo de 0.2!',
                pt: 'Baixe o coeficiente de absorção α abaixo de 0.2!',
                'zh-CN': '将吸收系数α降到0.2以下！',
                'zh-TW': '將吸收係數α降到0.2以下！',
            },
            result: {
                ko: '투명한 매질! 광섬유가 이 원리로 먼 거리를 전송해.',
                en: 'Transparent medium! Fiber optics use this to transmit over long distances.',
                ja: '透明な媒質！光ファイバーがこの原理で長距離伝送するんだよ。',
                es: '¡Medio transparente! La fibra óptica usa esto para transmitir largas distancias.',
                pt: 'Meio transparente! A fibra óptica usa isso para transmitir longas distâncias.',
                'zh-CN': '透明介质！光纤就是用这个原理进行长距离传输的。',
                'zh-TW': '透明介質！光纖就是用這個原理進行長距離傳輸的。',
            },
            icon: '💎',
            condition: (vars) => vars['α'] <= 0.2,
        },
        {
            id: 'long-range',
            mission: {
                ko: '거리 L을 8m 이상으로 늘리면서 α는 0.3 이하로 유지해봐!',
                en: 'Increase distance L above 8m while keeping α below 0.3!',
                ja: '距離Lを8m以上に伸ばしながらαは0.3以下に維持してみて！',
                es: '¡Aumenta la distancia L por encima de 8m mientras mantienes α por debajo de 0.3!',
                pt: 'Aumente a distância L acima de 8m enquanto mantém α abaixo de 0.3!',
                'zh-CN': '将距离L增加到8m以上，同时保持α在0.3以下！',
                'zh-TW': '將距離L增加到8m以上，同時保持α在0.3以下！',
            },
            result: {
                ko: '장거리 레이저! 레이저 거리 측정기가 이렇게 작동해.',
                en: 'Long-range laser! This is how laser rangefinders work.',
                ja: '長距離レーザー！レーザー距離計がこうやって動作するんだよ。',
                es: '¡Láser de largo alcance! Así funcionan los telémetros láser.',
                pt: 'Laser de longo alcance! É assim que os telêmetros a laser funcionam.',
                'zh-CN': '远距离激光！激光测距仪就是这样工作的。',
                'zh-TW': '遠距離雷射！雷射測距儀就是這樣工作的。',
            },
            icon: '📏',
            condition: (vars) => vars['L'] >= 8 && vars['α'] <= 0.3,
        },
        {
            id: 'high-absorption',
            mission: {
                ko: 'α를 1.5 이상, I₀를 80 이상으로 설정해봐!',
                en: 'Set α above 1.5 and I₀ above 80!',
                ja: 'αを1.5以上、I₀を80以上に設定してみて！',
                es: '¡Configura α por encima de 1.5 e I₀ por encima de 80!',
                pt: 'Configure α acima de 1.5 e I₀ acima de 80!',
                'zh-CN': '将α设为1.5以上，I₀设为80以上！',
                'zh-TW': '將α設為1.5以上，I₀設為80以上！',
            },
            result: {
                ko: '강한 흡수! 레이저 수술에서 정밀한 조직 제거에 사용돼.',
                en: 'Strong absorption! Used in laser surgery for precise tissue removal.',
                ja: '強い吸収！レーザー手術で精密な組織除去に使われるんだよ。',
                es: '¡Absorción fuerte! Se usa en cirugía láser para eliminación precisa de tejido.',
                pt: 'Absorção forte! Usado em cirurgia a laser para remoção precisa de tecido.',
                'zh-CN': '强吸收！用于激光手术中精确去除组织。',
                'zh-TW': '強吸收！用於雷射手術中精確去除組織。',
            },
            icon: '⚕️',
            condition: (vars) => vars['α'] >= 1.5 && vars['I₀'] >= 80,
        },
    ],
    getInsight: (vars) => {
        const I = vars['I']
        const I0 = vars['I₀']
        const ratio = I / I0

        if (ratio > 0.8)
            return {
                ko: '거의 손실 없이 통과!',
                en: 'Passes through with minimal loss!',
                ja: 'ほぼ損失なく通過！',
                es: '¡Pasa con pérdida mínima!',
                pt: 'Passa com perda mínima!',
                'zh-CN': '几乎无损通过！',
                'zh-TW': '幾乎無損通過！',
            }
        if (ratio > 0.5)
            return {
                ko: '절반 정도 남았어',
                en: 'About half intensity remains',
                ja: '約半分の強度が残っている',
                es: 'Queda aproximadamente la mitad de la intensidad',
                pt: 'Cerca de metade da intensidade permanece',
                'zh-CN': '剩余约一半的强度',
                'zh-TW': '剩餘約一半的強度',
            }
        if (ratio > 0.2)
            return {
                ko: '상당히 약해졌어',
                en: 'Significantly weakened',
                ja: 'かなり弱くなった',
                es: 'Significativamente debilitado',
                pt: 'Significativamente enfraquecido',
                'zh-CN': '明显减弱',
                'zh-TW': '明顯減弱',
            }
        if (ratio > 0.05)
            return {
                ko: '대부분 흡수됐어',
                en: 'Mostly absorbed',
                ja: 'ほとんど吸収された',
                es: 'Mayormente absorbido',
                pt: 'Principalmente absorvido',
                'zh-CN': '大部分被吸收',
                'zh-TW': '大部分被吸收',
            }
        return {
            ko: '거의 다 사라졌어!',
            en: 'Almost completely absorbed!',
            ja: 'ほぼ完全に吸収された！',
            es: '¡Casi completamente absorbido!',
            pt: 'Quase completamente absorvido!',
            'zh-CN': '几乎完全被吸收！',
            'zh-TW': '幾乎完全被吸收！',
        }
    },
}
