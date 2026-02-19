import { Formula } from './types'
import { colors } from '../styles/colors'

export const snell: Formula = {
    id: 'snell',
    name: {
        ko: '스넬의 법칙',
        en: "Snell's Law",
        ja: 'スネルの法則',
        es: 'Ley de Snell',
        pt: 'Lei de Snell',
        'zh-CN': '斯涅尔定律',
        'zh-TW': '斯涅爾定律',
    },
    expression: 'n₁sinθ₁ = n₂sinθ₂',
    description: {
        ko: '빛이 다른 매질로 들어갈 때 굴절되는 각도의 관계',
        en: 'Relationship of refraction angles when light enters a different medium',
        ja: '光が別の媒質に入るときの屈折角の関係',
        es: 'Relación de ángulos de refracción cuando la luz entra en un medio diferente',
        pt: 'Relação dos ângulos de refração quando a luz entra em um meio diferente',
        'zh-CN': '光进入不同介质时折射角的关系',
        'zh-TW': '光進入不同介質時折射角的關係',
    },
    simulationHint: {
        ko: '빛이 물이나 유리에 들어갈 때 꺾이는 모습',
        en: 'Shows light bending as it enters water or glass',
        ja: '光が水やガラスに入るときに曲がる様子',
        es: 'Muestra la luz doblándose al entrar en agua o vidrio',
        pt: 'Mostra a luz se curvando ao entrar em água ou vidro',
        'zh-CN': '显示光进入水或玻璃时弯曲的样子',
        'zh-TW': '顯示光進入水或玻璃時彎曲的樣子',
    },
    applications: {
        ko: [
            '안경 렌즈와 콘택트렌즈 설계',
            '광섬유 통신의 전반사 원리',
            '무지개가 생기는 원리',
            '수영장 물 속이 얕아 보이는 이유',
        ],
        en: [
            'Designing eyeglasses and contact lenses',
            'Total internal reflection in fiber optic communications',
            'How rainbows form',
            'Why pools appear shallower than they are',
        ],
        ja: [
            '眼鏡やコンタクトレンズの設計',
            '光ファイバー通信の全反射原理',
            '虹ができる原理',
            'プールの水が浅く見える理由',
        ],
        es: [
            'Diseño de gafas y lentes de contacto',
            'Reflexión total interna en comunicaciones de fibra óptica',
            'Cómo se forman los arcoíris',
            'Por qué las piscinas parecen más superficiales',
        ],
        pt: [
            'Projeto de óculos e lentes de contato',
            'Reflexão interna total em comunicações de fibra óptica',
            'Como os arco-íris se formam',
            'Por que piscinas parecem mais rasas',
        ],
        'zh-CN': [
            '设计眼镜和隐形眼镜',
            '光纤通信中的全反射原理',
            '彩虹形成的原理',
            '为什么游泳池看起来比实际浅',
        ],
        'zh-TW': [
            '設計眼鏡和隱形眼鏡',
            '光纖通訊中的全反射原理',
            '彩虹形成的原理',
            '為什麼游泳池看起來比實際淺',
        ],
    },
    category: 'wave',
    variables: [
        {
            symbol: 'n₁',
            name: {
                ko: '매질 1 굴절률',
                en: 'Medium 1 Refractive Index',
                ja: '媒質1の屈折率',
                es: 'Índice de Refracción del Medio 1',
                pt: 'Índice de Refração do Meio 1',
                'zh-CN': '介质1折射率',
                'zh-TW': '介質1折射率',
            },
            role: 'input',
            unit: '',
            range: [1, 2.5],
            default: 1,
            visual: {
                property: 'glow',
                scale: (value: number) => value,
                color: colors.velocity,
            },
        },
        {
            symbol: 'θ₁',
            name: {
                ko: '입사각',
                en: 'Incident Angle',
                ja: '入射角',
                es: 'Ángulo de Incidencia',
                pt: 'Ângulo de Incidência',
                'zh-CN': '入射角',
                'zh-TW': '入射角',
            },
            role: 'input',
            unit: '°',
            range: [0, 85],
            default: 45,
            visual: {
                property: 'distance',
                scale: (value: number) => value,
                color: colors.distance,
            },
        },
        {
            symbol: 'n₂',
            name: {
                ko: '매질 2 굴절률',
                en: 'Medium 2 Refractive Index',
                ja: '媒質2の屈折率',
                es: 'Índice de Refracción del Medio 2',
                pt: 'Índice de Refração do Meio 2',
                'zh-CN': '介质2折射率',
                'zh-TW': '介質2折射率',
            },
            role: 'input',
            unit: '',
            range: [1, 2.5],
            default: 1.5,
            visual: {
                property: 'glow',
                scale: (value: number) => value,
                color: colors.spring,
            },
        },
        {
            symbol: 'θ₂',
            name: {
                ko: '굴절각',
                en: 'Refracted Angle',
                ja: '屈折角',
                es: 'Ángulo de Refracción',
                pt: 'Ângulo de Refração',
                'zh-CN': '折射角',
                'zh-TW': '折射角',
            },
            role: 'output',
            unit: '°',
            range: [0, 90],
            default: 28.1,
            visual: {
                property: 'distance',
                scale: (value: number) => value,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const n1 = inputs['n₁'] ?? 1
        const theta1 = inputs['θ₁'] ?? 45
        const n2 = inputs['n₂'] ?? 1.5
        const theta1Rad = (theta1 * Math.PI) / 180

        // n1 * sin(theta1) = n2 * sin(theta2)
        // sin(theta2) = n1 * sin(theta1) / n2
        const sinTheta2 = (n1 * Math.sin(theta1Rad)) / n2

        // Check for total internal reflection
        if (Math.abs(sinTheta2) > 1) {
            return { 'θ₂': 90 } // Total internal reflection
        }

        const theta2Rad = Math.asin(sinTheta2)
        const theta2 = (theta2Rad * 180) / Math.PI
        return {
            'θ₂': theta2,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const n1 = inputs['n₁'] ?? 1
        const theta1 = inputs['θ₁'] ?? 45
        const n2 = inputs['n₂'] ?? 1.5
        const theta1Rad = (theta1 * Math.PI) / 180
        const sinTheta2 = (n1 * Math.sin(theta1Rad)) / n2

        if (Math.abs(sinTheta2) > 1) {
            return `전반사! sin(θ₂) = ${n1.toFixed(2)} × sin(${theta1.toFixed(0)}°) ÷ ${n2.toFixed(2)} > 1`
        }

        const theta2 = (Math.asin(sinTheta2) * 180) / Math.PI
        return `θ₂ = arcsin(${n1.toFixed(2)} × sin(${theta1.toFixed(0)}°) ÷ ${n2.toFixed(2)}) = ${theta2.toFixed(1)}°`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'n₁', to: 'θ₁', operator: '×' },
            { from: 'n₂', to: 'θ₂', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'θ₂',
        expression: [
            { type: 'text', value: 'arcsin' },
            {
                type: 'group',
                items: [
                    {
                        type: 'fraction',
                        numerator: [
                            { type: 'var', symbol: 'n₁' },
                            { type: 'text', value: 'sin' },
                            { type: 'var', symbol: 'θ₁' },
                        ],
                        denominator: [{ type: 'var', symbol: 'n₂' }],
                    },
                ],
            },
        ],
    },
    discoveries: [
        {
            id: 'total-internal-reflection',
            mission: {
                ko: 'n₁ > n₂로 설정하고 입사각을 높여봐!',
                en: 'Set n₁ > n₂ and increase the incident angle!',
                ja: 'n₁ > n₂に設定して入射角を上げてみよう！',
                es: '¡Configura n₁ > n₂ y aumenta el ángulo de incidencia!',
                pt: 'Configure n₁ > n₂ e aumente o ângulo de incidência!',
                'zh-CN': '设置n₁ > n₂并增大入射角！',
                'zh-TW': '設置n₁ > n₂並增大入射角！',
            },
            result: {
                ko: '전반사 발견! 빛이 완전히 반사돼!',
                en: 'Total internal reflection! Light is completely reflected!',
                ja: '全反射発見！光が完全に反射される！',
                es: '¡Reflexión total interna! ¡La luz se refleja completamente!',
                pt: 'Reflexão interna total! A luz é completamente refletida!',
                'zh-CN': '发现全反射！光被完全反射了！',
                'zh-TW': '發現全反射！光被完全反射了！',
            },
            icon: '✨',
            condition: (vars) => {
                const n1 = vars['n₁'] ?? 1
                const n2 = vars['n₂'] ?? 1.5
                const theta1 = vars['θ₁'] ?? 45
                const theta1Rad = (theta1 * Math.PI) / 180
                const sinTheta2 = (n1 * Math.sin(theta1Rad)) / n2
                return Math.abs(sinTheta2) > 1
            },
        },
        {
            id: 'strong-refraction',
            mission: {
                ko: 'n₂를 2 이상으로 높여봐!',
                en: 'Increase n₂ to 2 or more!',
                ja: 'n₂を2以上にしてみよう！',
                es: '¡Aumenta n₂ a 2 o más!',
                pt: 'Aumente n₂ para 2 ou mais!',
                'zh-CN': '把n₂提高到2以上！',
                'zh-TW': '把n₂提高到2以上！',
            },
            result: {
                ko: '다이아몬드 같은 고굴절률 매질에선 빛이 크게 꺾여!',
                en: 'In high-refractive materials like diamond, light bends sharply!',
                ja: 'ダイヤモンドのような高屈折率媒質では光が大きく曲がる！',
                es: '¡En materiales de alta refracción como el diamante, la luz se dobla bruscamente!',
                pt: 'Em materiais de alta refração como diamante, a luz se curva acentuadamente!',
                'zh-CN': '在钻石这样的高折射率介质中，光线会大幅弯曲！',
                'zh-TW': '在鑽石這樣的高折射率介質中，光線會大幅彎曲！',
            },
            icon: '💎',
            condition: (vars) => vars['n₂'] >= 2,
        },
    ],
    getInsight: (vars) => {
        const theta2 = vars['θ₂']
        if (theta2 >= 90)
            return {
                ko: '전반사! 빛이 완전히 반사돼',
                en: 'Total reflection! Light bounces back',
                ja: '全反射！光が完全に反射される',
                es: '¡Reflexión total! La luz rebota',
                pt: 'Reflexão total! A luz reflete completamente',
                'zh-CN': '全反射！光完全反射回去',
                'zh-TW': '全反射！光完全反射回去',
            }
        if (theta2 < 10)
            return {
                ko: '빛이 거의 직진해',
                en: 'Light goes almost straight',
                ja: '光がほぼ直進する',
                es: 'La luz va casi recta',
                pt: 'A luz vai quase reta',
                'zh-CN': '光几乎直线传播',
                'zh-TW': '光幾乎直線傳播',
            }
        if (theta2 < 30)
            return {
                ko: '빛이 살짝 꺾여',
                en: 'Light bends slightly',
                ja: '光が少し曲がる',
                es: 'La luz se dobla ligeramente',
                pt: 'A luz se curva levemente',
                'zh-CN': '光轻微弯曲',
                'zh-TW': '光輕微彎曲',
            }
        if (theta2 < 50)
            return {
                ko: '빛이 많이 꺾여',
                en: 'Light bends noticeably',
                ja: '光がかなり曲がる',
                es: 'La luz se dobla notablemente',
                pt: 'A luz se curva notavelmente',
                'zh-CN': '光明显弯曲',
                'zh-TW': '光明顯彎曲',
            }
        return {
            ko: '빛이 크게 굴절해!',
            en: 'Light refracts significantly!',
            ja: '光が大きく屈折する！',
            es: '¡La luz se refracta significativamente!',
            pt: 'A luz refrata significativamente!',
            'zh-CN': '光发生大幅折射！',
            'zh-TW': '光發生大幅折射！',
        }
    },
}
