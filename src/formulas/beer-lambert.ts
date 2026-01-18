import { Formula } from './types'
import { colors } from '../styles/colors'

export const beerLambert: Formula = {
    id: 'beer-lambert',
    name: { ko: '빛의 감쇠', en: 'Light Attenuation', ja: '光の減衰' },
    expression: 'I = I₀e^(-αL)',
    description: {
        ko: '매질을 통과하는 빛의 세기 감쇠',
        en: 'Light intensity attenuation through a medium',
        ja: '媒質を通過する光の強度減衰',
    },
    simulationHint: {
        ko: '레이저가 매질을 통과하며 점점 약해지는 모습',
        en: 'Watch a laser beam fade as it travels through a medium',
        ja: 'レーザーが媒質を通過して弱くなる様子',
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
    },
    category: 'wave',
    variables: [
        {
            symbol: 'I₀',
            name: { ko: '초기 세기', en: 'Initial Intensity', ja: '初期強度' },
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
            name: { ko: '흡수 계수', en: 'Absorption Coeff.', ja: '吸収係数' },
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
            name: { ko: '거리', en: 'Distance', ja: '距離' },
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
            name: { ko: '출력 세기', en: 'Output Intensity', ja: '出力強度' },
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
            },
            result: {
                ko: '투명한 매질! 광섬유가 이 원리로 먼 거리를 전송해.',
                en: 'Transparent medium! Fiber optics use this to transmit over long distances.',
                ja: '透明な媒質！光ファイバーがこの原理で長距離伝送するんだよ。',
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
            },
            result: {
                ko: '장거리 레이저! 레이저 거리 측정기가 이렇게 작동해.',
                en: 'Long-range laser! This is how laser rangefinders work.',
                ja: '長距離レーザー！レーザー距離計がこうやって動作するんだよ。',
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
            },
            result: {
                ko: '강한 흡수! 레이저 수술에서 정밀한 조직 제거에 사용돼.',
                en: 'Strong absorption! Used in laser surgery for precise tissue removal.',
                ja: '強い吸収！レーザー手術で精密な組織除去に使われるんだよ。',
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
            }
        if (ratio > 0.5)
            return {
                ko: '절반 정도 남았어',
                en: 'About half intensity remains',
                ja: '約半分の強度が残っている',
            }
        if (ratio > 0.2)
            return {
                ko: '상당히 약해졌어',
                en: 'Significantly weakened',
                ja: 'かなり弱くなった',
            }
        if (ratio > 0.05)
            return {
                ko: '대부분 흡수됐어',
                en: 'Mostly absorbed',
                ja: 'ほとんど吸収された',
            }
        return {
            ko: '거의 다 사라졌어!',
            en: 'Almost completely absorbed!',
            ja: 'ほぼ完全に吸収された！',
        }
    },
}
