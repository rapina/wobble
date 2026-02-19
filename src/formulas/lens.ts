import { Formula } from './types'
import { colors } from '../styles/colors'

export const lens: Formula = {
    id: 'lens',
    name: {
        ko: '렌즈 공식',
        en: 'Thin Lens Equation',
        ja: 'レンズの公式',
        es: 'Ecuación de la Lente Delgada',
        pt: 'Equação da Lente Delgada',
        'zh-CN': '薄透镜公式',
        'zh-TW': '薄透鏡公式',
    },
    expression: '1/f = 1/a + 1/b',
    description: {
        ko: '렌즈의 초점거리와 물체·상 거리의 관계',
        en: 'The relationship between focal length, object distance, and image distance',
        ja: 'レンズの焦点距離と物体・像の距離の関係',
        es: 'La relación entre la distancia focal, la distancia del objeto y la distancia de la imagen',
        pt: 'A relação entre a distância focal, a distância do objeto e a distância da imagem',
        'zh-CN': '透镜焦距与物距、像距的关系',
        'zh-TW': '透鏡焦距與物距、像距的關係',
    },
    simulationHint: {
        ko: '렌즈를 통해 상이 형성되는 위치와 크기가 변하는 모습',
        en: 'Shows how image position and size change through a lens',
        ja: 'レンズを通して像の位置と大きさが変わる様子',
        es: 'Muestra cómo cambian la posición y el tamaño de la imagen a través de una lente',
        pt: 'Mostra como a posição e o tamanho da imagem mudam através de uma lente',
        'zh-CN': '显示通过透镜形成的像的位置和大小如何变化',
        'zh-TW': '顯示通過透鏡形成的像的位置和大小如何變化',
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
        es: [
            'Calcular la graduación de lentes de gafas',
            'Cómo funciona el enfoque de la cámara',
            'Diseño de aumento de microscopios y telescopios',
            'Comprensión de la acomodación del cristalino',
        ],
        pt: [
            'Cálculo da graduação de lentes de óculos',
            'Como funciona o foco da câmera',
            'Projeto de ampliação de microscópios e telescópios',
            'Compreensão da acomodação do cristalino',
        ],
        'zh-CN': [
            '计算眼镜镜片度数',
            '相机对焦原理',
            '显微镜和望远镜放大倍率设计',
            '理解眼睛晶状体的调节功能',
        ],
        'zh-TW': [
            '計算眼鏡鏡片度數',
            '相機對焦原理',
            '顯微鏡和望遠鏡放大倍率設計',
            '理解眼睛晶狀體的調節功能',
        ],
    },
    category: 'wave',
    variables: [
        {
            symbol: 'a',
            name: {
                ko: '물체 거리',
                en: 'Object Distance',
                ja: '物体距離',
                es: 'Distancia del Objeto',
                pt: 'Distância do Objeto',
                'zh-CN': '物距',
                'zh-TW': '物距',
            },
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
            name: {
                ko: '상 거리',
                en: 'Image Distance',
                ja: '像距離',
                es: 'Distancia de la Imagen',
                pt: 'Distância da Imagem',
                'zh-CN': '像距',
                'zh-TW': '像距',
            },
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
            name: {
                ko: '초점 거리',
                en: 'Focal Length',
                ja: '焦点距離',
                es: 'Distancia Focal',
                pt: 'Distância Focal',
                'zh-CN': '焦距',
                'zh-TW': '焦距',
            },
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
                es: 'Distancia focal corta como una lupa',
                pt: 'Distância focal curta como uma lupa',
                'zh-CN': '像放大镜一样的短焦距',
                'zh-TW': '像放大鏡一樣的短焦距',
            }
        if (f < 10)
            return {
                ko: '스마트폰 카메라 렌즈 정도야',
                en: 'Like a smartphone camera lens',
                ja: 'スマホカメラのレンズくらいだよ',
                es: 'Como la lente de una cámara de smartphone',
                pt: 'Como a lente de uma câmera de smartphone',
                'zh-CN': '像智能手机相机镜头',
                'zh-TW': '像智慧手機相機鏡頭',
            }
        if (f < 20)
            return {
                ko: '안경 렌즈 정도야',
                en: 'Like eyeglass lenses',
                ja: '眼鏡レンズくらいだよ',
                es: 'Como lentes de gafas',
                pt: 'Como lentes de óculos',
                'zh-CN': '像眼镜镜片',
                'zh-TW': '像眼鏡鏡片',
            }
        if (f < 35)
            return {
                ko: '표준 카메라 렌즈 정도야',
                en: 'Like a standard camera lens',
                ja: '標準カメラレンズくらいだよ',
                es: 'Como una lente de cámara estándar',
                pt: 'Como uma lente de câmera padrão',
                'zh-CN': '像标准相机镜头',
                'zh-TW': '像標準相機鏡頭',
            }
        return {
            ko: '망원 렌즈 정도의 긴 초점이야',
            en: 'Long focal length like telephoto lens',
            ja: '望遠レンズくらいの長い焦点距離だよ',
            es: 'Distancia focal larga como un teleobjetivo',
            pt: 'Distância focal longa como uma teleobjetiva',
            'zh-CN': '像长焦镜头一样的长焦距',
            'zh-TW': '像長焦鏡頭一樣的長焦距',
        }
    },
    discoveries: [
        {
            id: 'equal-distance',
            mission: {
                ko: '물체 거리 a와 상 거리 b를 같게 설정해봐!',
                en: 'Set object distance a equal to image distance b!',
                ja: '物体距離aと像距離bを同じに設定してみて！',
                es: '¡Configura la distancia del objeto a igual a la distancia de la imagen b!',
                pt: 'Configure a distância do objeto a igual à distância da imagem b!',
                'zh-CN': '将物距a和像距b设为相等！',
                'zh-TW': '將物距a和像距b設為相等！',
            },
            result: {
                ko: 'a=b일 때 같은 크기의 상! 복사기가 원본 크기를 유지하는 원리야.',
                en: 'When a=b, image equals object size! How copiers maintain original size.',
                ja: 'a=bのとき同じ大きさの像！コピー機が原本サイズを維持する原理だよ。',
                es: '¡Cuando a=b, la imagen es igual al tamaño del objeto! Cómo las copiadoras mantienen el tamaño original.',
                pt: 'Quando a=b, a imagem é igual ao tamanho do objeto! Como as copiadoras mantêm o tamanho original.',
                'zh-CN': '当a=b时像与物等大！这就是复印机保持原尺寸的原理。',
                'zh-TW': '當a=b時像與物等大！這就是影印機保持原尺寸的原理。',
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
                es: '¡Configura la distancia del objeto a por encima de 80cm!',
                pt: 'Configure a distância do objeto a acima de 80cm!',
                'zh-CN': '将物距a设为80cm以上！',
                'zh-TW': '將物距a設為80cm以上！',
            },
            result: {
                ko: '멀리 있는 물체의 상은 초점 근처에 맺혀! 망원경의 원리야.',
                en: 'Distant object images form near the focal point! This is how telescopes work.',
                ja: '遠くの物体の像は焦点近くにできる！望遠鏡の原理だよ。',
                es: '¡Las imágenes de objetos distantes se forman cerca del punto focal! Así funcionan los telescopios.',
                pt: 'Imagens de objetos distantes se formam perto do ponto focal! É assim que telescópios funcionam.',
                'zh-CN': '远处物体的像成在焦点附近！这就是望远镜的原理。',
                'zh-TW': '遠處物體的像成在焦點附近！這就是望遠鏡的原理。',
            },
            icon: '🔭',
            condition: (vars) => vars['a'] >= 80,
        },
    ],
}
