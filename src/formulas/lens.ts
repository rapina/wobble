import { Formula } from './types'
import { colors } from '../styles/colors'

export const lens: Formula = {
    id: 'lens',
    name: { ko: '렌즈 공식', en: 'Thin Lens Equation', ja: 'レンズの公式' },
    expression: '1/f = 1/a + 1/b',
    description: {
        ko: '렌즈의 초점거리와 물체·상 거리의 관계',
        en: 'The relationship between focal length, object distance, and image distance',
        ja: 'レンズの焦点距離と物体・像の距離の関係',
    },
    simulationHint: {
        ko: '렌즈를 통해 상이 형성되는 위치와 크기가 변하는 모습',
        en: 'Shows how image position and size change through a lens',
        ja: 'レンズを通して像の位置と大きさが変わる様子',
    },
    applications: {
        ko: [
            '안경 렌즈의 도수 계산',
            '카메라 초점 조절 원리',
            '현미경과 망원경의 배율 설계',
            '눈의 수정체 조절 기능 이해',
        ],
        en: [
            'Calculating eyeglass lens prescription',
            'How camera focusing works',
            'Designing microscope and telescope magnification',
            'Understanding eye lens accommodation',
        ],
        ja: [
            '眼鏡レンズの度数計算',
            'カメラのピント調整原理',
            '顕微鏡や望遠鏡の倍率設計',
            '目の水晶体調節機能の理解',
        ],
    },
    category: 'wave',
    variables: [
        {
            symbol: 'a',
            name: { ko: '물체 거리', en: 'Object Distance', ja: '物体距離' },
            role: 'input',
            unit: 'cm',
            range: [5, 100],
            default: 30,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 2,
                color: colors.distance,
            },
        },
        {
            symbol: 'b',
            name: { ko: '상 거리', en: 'Image Distance', ja: '像距離' },
            role: 'input',
            unit: 'cm',
            range: [5, 100],
            default: 15,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 2,
                color: colors.velocity,
            },
        },
        {
            symbol: 'f',
            name: { ko: '초점 거리', en: 'Focal Length', ja: '焦点距離' },
            role: 'output',
            unit: 'cm',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 10,
                color: colors.wavelength,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const a = inputs.a ?? 30
        const b = inputs.b ?? 15
        // 1/f = 1/a + 1/b => f = ab/(a+b)
        const f = (a * b) / (a + b)
        return { f }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const a = inputs.a ?? 30
        const b = inputs.b ?? 15
        const f = (a * b) / (a + b)
        return `1/f = 1/${a.toFixed(0)} + 1/${b.toFixed(0)} → f = ${f.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'a', to: 'b', operator: '+' },
            { from: 'b', to: 'f', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'f',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: '1' }],
                denominator: [{ type: 'var', symbol: 'a' }],
            },
            { type: 'op', value: '+' },
            {
                type: 'fraction',
                numerator: [{ type: 'text', value: '1' }],
                denominator: [{ type: 'var', symbol: 'b' }],
            },
        ],
    },
    getInsight: (vars) => {
        const f = vars['f']
        if (f < 5)
            return {
                ko: '돋보기 정도의 짧은 초점이야',
                en: 'Short focal length like a magnifying glass',
                ja: '虫眼鏡くらいの短い焦点距離だよ',
            }
        if (f < 10)
            return {
                ko: '스마트폰 카메라 렌즈 정도야',
                en: 'Like a smartphone camera lens',
                ja: 'スマホカメラのレンズくらいだよ',
            }
        if (f < 20)
            return {
                ko: '안경 렌즈 정도야',
                en: 'Like eyeglass lenses',
                ja: '眼鏡レンズくらいだよ',
            }
        if (f < 35)
            return {
                ko: '표준 카메라 렌즈 정도야',
                en: 'Like a standard camera lens',
                ja: '標準カメラレンズくらいだよ',
            }
        return {
            ko: '망원 렌즈 정도의 긴 초점이야',
            en: 'Long focal length like telephoto lens',
            ja: '望遠レンズくらいの長い焦点距離だよ',
        }
    },
    discoveries: [
        {
            id: 'equal-distance',
            mission: {
                ko: '물체 거리 a와 상 거리 b를 같게 설정해봐!',
                en: 'Set object distance a equal to image distance b!',
                ja: '物体距離aと像距離bを同じに設定してみて！',
            },
            result: {
                ko: 'a=b일 때 같은 크기의 상! 복사기가 원본 크기를 유지하는 원리야.',
                en: 'When a=b, image equals object size! How copiers maintain original size.',
                ja: 'a=bのとき同じ大きさの像！コピー機が原本サイズを維持する原理だよ。',
            },
            icon: '📄',
            condition: (vars) => Math.abs(vars['a'] - vars['b']) <= 5,
        },
        {
            id: 'far-object',
            mission: {
                ko: '물체 거리 a를 80cm 이상으로 멀리 해봐!',
                en: 'Set object distance a above 80cm!',
                ja: '物体距離aを80cm以上に遠くしてみて！',
            },
            result: {
                ko: '멀리 있는 물체의 상은 초점 근처에 맺혀! 망원경의 원리야.',
                en: 'Distant object images form near the focal point! This is how telescopes work.',
                ja: '遠くの物体の像は焦点近くにできる！望遠鏡の原理だよ。',
            },
            icon: '🔭',
            condition: (vars) => vars['a'] >= 80,
        },
    ],
}
