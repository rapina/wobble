import { Formula } from './types'
import { colors } from '../styles/colors'

export const bernoulli: Formula = {
    id: 'bernoulli',
    name: {
        ko: '베르누이 방정식',
        en: "Bernoulli's Equation",
        ja: 'ベルヌーイの定理',
        es: 'Ecuación de Bernoulli',
        pt: 'Equação de Bernoulli',
        'zh-CN': '伯努利方程',
        'zh-TW': '白努利方程',
    },
    expression: 'P + ½ρv² = const',
    description: {
        ko: '유체의 속도가 빨라지면 압력이 낮아진다',
        en: 'As the speed of a fluid increases, its pressure decreases',
        ja: '流体の速度が速くなると圧力が低くなる',
        es: 'A medida que la velocidad de un fluido aumenta, su presión disminuye',
        pt: 'À medida que a velocidade de um fluido aumenta, sua pressão diminui',
        'zh-CN': '当流体速度增加时，其压力降低',
        'zh-TW': '當流體速度增加時，其壓力降低',
    },
    simulationHint: {
        ko: '좁은 곳을 지날 때 유체 속도와 압력 변화를 관찰하세요',
        en: 'Watch how fluid speed and pressure change in narrow sections',
        ja: '狭い部分を通る時の流体速度と圧力変化を観察',
        es: 'Observa cómo cambian la velocidad y presión del fluido en secciones estrechas',
        pt: 'Observe como a velocidade e pressão do fluido mudam em seções estreitas',
        'zh-CN': '观察流体在狭窄处的速度和压力变化',
        'zh-TW': '觀察流體在狹窄處的速度和壓力變化',
    },
    applications: {
        ko: [
            '비행기 날개 - 윗면 공기가 빨라 압력이 낮아져 양력 발생',
            '분무기 - 빠른 공기 흐름이 액체를 빨아올림',
            '카뷰레터 - 연료를 공기와 혼합',
            '벤투리 효과 - 파이프 좁은 부분에서 속도 증가',
        ],
        en: [
            'Airplane wings - faster air above creates lift due to lower pressure',
            'Spray bottles - fast air flow draws liquid up',
            'Carburetor - mixes fuel with air',
            'Venturi effect - speed increases in narrow pipe sections',
        ],
        ja: [
            '飛行機の翼 - 上面の空気が速く圧力が低くなり揚力が発生',
            '霧吹き - 速い空気の流れが液体を吸い上げる',
            'キャブレター - 燃料と空気を混合',
            'ベンチュリ効果 - パイプの狭い部分で速度増加',
        ],
        es: [
            'Alas de avión - el aire más rápido arriba crea sustentación por menor presión',
            'Atomizadores - el flujo de aire rápido succiona el líquido',
            'Carburador - mezcla combustible con aire',
            'Efecto Venturi - velocidad aumenta en secciones estrechas',
        ],
        pt: [
            'Asas de avião - ar mais rápido acima cria sustentação por menor pressão',
            'Borrifadores - fluxo de ar rápido suga o líquido',
            'Carburador - mistura combustível com ar',
            'Efeito Venturi - velocidade aumenta em seções estreitas',
        ],
        'zh-CN': [
            '飞机机翼 - 上方空气流速快压力低产生升力',
            '喷雾器 - 快速气流将液体吸上来',
            '化油器 - 将燃料与空气混合',
            '文丘里效应 - 管道狭窄处速度增加',
        ],
        'zh-TW': [
            '飛機機翼 - 上方空氣流速快壓力低產生升力',
            '噴霧器 - 快速氣流將液體吸上來',
            '化油器 - 將燃料與空氣混合',
            '文丘里效應 - 管道狹窄處速度增加',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'v₁',
            name: {
                ko: '입구 속도',
                en: 'Inlet velocity',
                ja: '入口速度',
                es: 'Velocidad de entrada',
                pt: 'Velocidade de entrada',
                'zh-CN': '入口速度',
                'zh-TW': '入口速度',
            },
            role: 'input',
            unit: 'm/s',
            range: [1, 10],
            default: 3,
            visual: {
                property: 'speed',
                scale: (v) => v,
                color: colors.velocity,
            },
        },
        {
            symbol: 'A₁',
            name: {
                ko: '입구 면적',
                en: 'Inlet area',
                ja: '入口面積',
                es: 'Área de entrada',
                pt: 'Área de entrada',
                'zh-CN': '入口面积',
                'zh-TW': '入口面積',
            },
            role: 'input',
            unit: 'm²',
            range: [2, 10],
            default: 6,
            visual: {
                property: 'size',
                scale: (v) => v * 5,
                color: colors.distance,
            },
        },
        {
            symbol: 'A₂',
            name: {
                ko: '출구 면적',
                en: 'Outlet area',
                ja: '出口面積',
                es: 'Área de salida',
                pt: 'Área de saída',
                'zh-CN': '出口面积',
                'zh-TW': '出口面積',
            },
            role: 'input',
            unit: 'm²',
            range: [1, 8],
            default: 2,
            visual: {
                property: 'size',
                scale: (v) => v * 5,
                color: colors.distance,
            },
        },
        {
            symbol: 'v₂',
            name: {
                ko: '출구 속도',
                en: 'Outlet velocity',
                ja: '出口速度',
                es: 'Velocidad de salida',
                pt: 'Velocidade de saída',
                'zh-CN': '出口速度',
                'zh-TW': '出口速度',
            },
            role: 'output',
            unit: 'm/s',
            range: [1, 50],
            default: 9,
            visual: {
                property: 'speed',
                scale: (v) => v,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs) => {
        const v1 = inputs['v₁'] || 3
        const A1 = inputs['A₁'] || 6
        const A2 = inputs['A₂'] || 2
        // Continuity equation: A₁v₁ = A₂v₂
        const v2 = (A1 * v1) / A2
        return { 'v₂': Math.round(v2 * 10) / 10 }
    },
    formatCalculation: (inputs) => {
        const v1 = inputs['v₁'] || 3
        const A1 = inputs['A₁'] || 6
        const A2 = inputs['A₂'] || 2
        const v2 = (A1 * v1) / A2
        return `v₂ = (A₁×v₁)/A₂ = (${A1}×${v1})/${A2} = ${v2.toFixed(1)} m/s`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'v₁', to: 'v₂', operator: '×' },
            { from: 'A₁', to: 'v₂', operator: '×' },
            { from: 'A₂', to: 'v₂', operator: '÷' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'v₂',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'var', symbol: 'A₁' },
                    { type: 'op', value: '×' },
                    { type: 'var', symbol: 'v₁' },
                ],
                denominator: [{ type: 'var', symbol: 'A₂' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'venturi-effect',
            mission: {
                ko: 'A₂를 A₁보다 훨씬 작게 해봐',
                en: 'Make A₂ much smaller than A₁',
                ja: 'A₂をA₁よりずっと小さくしてみよう',
                es: 'Haz A₂ mucho más pequeño que A₁',
                pt: 'Faça A₂ muito menor que A₁',
                'zh-CN': '让A₂比A₁小很多',
                'zh-TW': '讓A₂比A₁小很多',
            },
            result: {
                ko: '좁은 곳에서 유체가 빨라지는 벤투리 효과!',
                en: 'Venturi effect - fluid speeds up in narrow sections!',
                ja: '狭い場所で流体が速くなるベンチュリ効果！',
                es: '¡Efecto Venturi - el fluido acelera en secciones estrechas!',
                pt: 'Efeito Venturi - o fluido acelera em seções estreitas!',
                'zh-CN': '文丘里效应 - 流体在狭窄处加速！',
                'zh-TW': '文丘里效應 - 流體在狹窄處加速！',
            },
            icon: '💨',
            condition: (vars) => {
                const A1 = vars['A₁'] || 6
                const A2 = vars['A₂'] || 2
                const v2 = vars['v₂'] || 9
                return A2 <= A1 / 3 && v2 >= 15
            },
        },
        {
            id: 'airplane-lift',
            mission: {
                ko: '높은 속도로 양력 원리를 체험해봐',
                en: 'Experience lift principle with high speed',
                ja: '高速で揚力の原理を体験しよう',
                es: 'Experimenta el principio de sustentación a alta velocidad',
                pt: 'Experimente o princípio de sustentação em alta velocidade',
                'zh-CN': '用高速体验升力原理',
                'zh-TW': '用高速體驗升力原理',
            },
            result: {
                ko: '빠른 공기 = 낮은 압력 = 위로 뜨는 힘!',
                en: 'Fast air = low pressure = upward lift!',
                ja: '速い空気 = 低い圧力 = 上向きの揚力！',
                es: '¡Aire rápido = baja presión = fuerza hacia arriba!',
                pt: 'Ar rápido = baixa pressão = sustentação para cima!',
                'zh-CN': '快速空气 = 低压 = 向上的升力！',
                'zh-TW': '快速空氣 = 低壓 = 向上的升力！',
            },
            icon: '✈️',
            condition: (vars) => {
                const v2 = vars['v₂'] || 9
                return v2 >= 20
            },
        },
        {
            id: 'equal-flow',
            mission: {
                ko: 'A₁과 A₂를 비슷하게 맞춰봐',
                en: 'Make A₁ and A₂ similar',
                ja: 'A₁とA₂を同じくらいにしてみよう',
                es: 'Haz A₁ y A₂ similares',
                pt: 'Faça A₁ e A₂ similares',
                'zh-CN': '让A₁和A₂相近',
                'zh-TW': '讓A₁和A₂相近',
            },
            result: {
                ko: '면적이 같으면 속도도 같아!',
                en: 'Equal areas mean equal velocities!',
                ja: '面積が同じなら速度も同じ！',
                es: '¡Áreas iguales significan velocidades iguales!',
                pt: 'Áreas iguais significam velocidades iguais!',
                'zh-CN': '面积相等意味着速度相等！',
                'zh-TW': '面積相等意味著速度相等！',
            },
            icon: '⚖️',
            condition: (vars) => {
                const A1 = vars['A₁'] || 6
                const A2 = vars['A₂'] || 2
                const v1 = vars['v₁'] || 3
                const v2 = vars['v₂'] || 9
                return Math.abs(A1 - A2) <= 1 && Math.abs(v1 - v2) <= 1
            },
        },
    ],
    getInsight: (variables) => {
        const v1 = variables['v₁'] || 3
        const v2 = variables['v₂'] || 9
        const A1 = variables['A₁'] || 6
        const A2 = variables['A₂'] || 2

        const speedRatio = v2 / v1
        const areaRatio = A1 / A2

        if (speedRatio > 3) {
            return {
                ko: `출구 속도가 ${speedRatio.toFixed(1)}배 빨라졌어요! 비행기 날개 위 공기도 이렇게 빨라져요.`,
                en: `Exit speed increased ${speedRatio.toFixed(1)}x! Air above airplane wings speeds up similarly.`,
                ja: `出口速度が${speedRatio.toFixed(1)}倍速くなりました！飛行機の翼上の空気も同様に速くなります。`,
                es: `¡La velocidad de salida aumentó ${speedRatio.toFixed(1)}x! El aire sobre las alas acelera de manera similar.`,
                pt: `Velocidade de saída aumentou ${speedRatio.toFixed(1)}x! O ar sobre as asas acelera de forma semelhante.`,
                'zh-CN': `出口速度增加了${speedRatio.toFixed(1)}倍！飞机机翼上方的空气也是这样加速的。`,
                'zh-TW': `出口速度增加了${speedRatio.toFixed(1)}倍！飛機機翼上方的空氣也是這樣加速的。`,
            }
        }

        if (areaRatio > 2) {
            return {
                ko: `면적이 ${areaRatio.toFixed(1)}배 좁아지면 속도가 그만큼 빨라져요. 호스 끝을 막으면 물이 세게 나오는 원리!`,
                en: `Area reduced ${areaRatio.toFixed(1)}x means speed increases proportionally. Like squeezing a hose!`,
                ja: `面積が${areaRatio.toFixed(1)}倍狭くなると速度もその分速くなります。ホースの先を絞ると水が勢いよく出る原理！`,
                es: `Un área reducida ${areaRatio.toFixed(1)}x significa que la velocidad aumenta proporcionalmente. ¡Como apretar una manguera!`,
                pt: `Área reduzida ${areaRatio.toFixed(1)}x significa que a velocidade aumenta proporcionalmente. Como apertar uma mangueira!`,
                'zh-CN': `面积缩小${areaRatio.toFixed(1)}倍意味着速度成比例增加。就像捏紧水管一样！`,
                'zh-TW': `面積縮小${areaRatio.toFixed(1)}倍意味著速度成比例增加。就像捏緊水管一樣！`,
            }
        }

        return {
            ko: `연속 방정식: A₁v₁ = A₂v₂. 유체는 좁은 곳에서 빨라져요!`,
            en: `Continuity equation: A₁v₁ = A₂v₂. Fluids speed up in narrow sections!`,
            ja: `連続の方程式：A₁v₁ = A₂v₂。流体は狭い場所で速くなります！`,
            es: `Ecuación de continuidad: A₁v₁ = A₂v₂. ¡Los fluidos aceleran en secciones estrechas!`,
            pt: `Equação da continuidade: A₁v₁ = A₂v₂. Os fluidos aceleram em seções estreitas!`,
            'zh-CN': `连续性方程：A₁v₁ = A₂v₂。流体在狭窄处加速！`,
            'zh-TW': `連續性方程：A₁v₁ = A₂v₂。流體在狹窄處加速！`,
        }
    },
}
