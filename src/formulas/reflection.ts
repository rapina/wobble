import { Formula } from './types'
import { colors } from '../styles/colors'

export const reflection: Formula = {
    id: 'reflection',
    name: {
        ko: '반사의 법칙',
        en: 'Law of Reflection',
        ja: '反射の法則',
        es: 'Ley de Reflexión',
        pt: 'Lei da Reflexão',
        'zh-CN': '反射定律',
        'zh-TW': '反射定律',
    },
    expression: 'θᵢ = θᵣ',
    description: {
        ko: '빛이 표면에서 반사될 때 입사각과 반사각은 같다',
        en: 'When light reflects off a surface, angle of incidence equals angle of reflection',
        ja: '光が表面で反射するとき、入射角と反射角は等しい',
        es: 'Cuando la luz se refleja en una superficie, el ángulo de incidencia es igual al ángulo de reflexión',
        pt: 'Quando a luz se reflete em uma superfície, o ângulo de incidência é igual ao ângulo de reflexão',
        'zh-CN': '当光在表面反射时，入射角等于反射角',
        'zh-TW': '當光在表面反射時，入射角等於反射角',
    },
    simulationHint: {
        ko: '빛이 거울 면에서 같은 각도로 반사되는 모습',
        en: 'Shows light reflecting off a mirror at equal angles',
        ja: '光が鏡面で同じ角度で反射する様子',
        es: 'Muestra la luz reflejándose en un espejo a ángulos iguales',
        pt: 'Mostra a luz refletindo em um espelho em ângulos iguais',
        'zh-CN': '显示光以相同角度从镜面反射',
        'zh-TW': '顯示光以相同角度從鏡面反射',
    },
    applications: {
        ko: [
            '거울에 비친 내 모습',
            '자동차 백미러와 사이드미러',
            '레이저 반사경과 광학 장비',
            '건물 유리창에 비친 풍경',
        ],
        en: [
            'Seeing your reflection in a mirror',
            'Car rearview and side mirrors',
            'Laser reflectors and optical equipment',
            'Scenery reflected in building windows',
        ],
        ja: [
            '鏡に映る自分の姿',
            '車のバックミラーとサイドミラー',
            'レーザー反射鏡と光学機器',
            'ビルの窓に映る風景',
        ],
        es: [
            'Ver tu reflejo en un espejo',
            'Espejos retrovisores y laterales de autos',
            'Reflectores láser y equipos ópticos',
            'Paisajes reflejados en ventanas de edificios',
        ],
        pt: [
            'Ver seu reflexo em um espelho',
            'Espelhos retrovisores e laterais de carros',
            'Refletores laser e equipamentos ópticos',
            'Paisagens refletidas em janelas de prédios',
        ],
        'zh-CN': [
            '看镜子中自己的倒影',
            '汽车后视镜和侧视镜',
            '激光反射镜和光学设备',
            '建筑玻璃窗中反射的风景',
        ],
        'zh-TW': [
            '看鏡子中自己的倒影',
            '汽車後視鏡和側視鏡',
            '雷射反射鏡和光學設備',
            '建築玻璃窗中反射的風景',
        ],
    },
    category: 'wave',
    variables: [
        {
            symbol: 'θᵢ',
            name: {
                ko: '입사각',
                en: 'Angle of Incidence',
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
                color: colors.velocity,
            },
        },
        {
            symbol: 'θᵣ',
            name: {
                ko: '반사각',
                en: 'Angle of Reflection',
                ja: '反射角',
                es: 'Ángulo de Reflexión',
                pt: 'Ângulo de Reflexão',
                'zh-CN': '反射角',
                'zh-TW': '反射角',
            },
            role: 'output',
            unit: '°',
            range: [0, 85],
            default: 45,
            visual: {
                property: 'distance',
                scale: (value: number) => value,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const thetaI = inputs['θᵢ'] ?? 45
        return {
            θᵣ: thetaI,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const thetaI = inputs['θᵢ'] ?? 45
        return `θᵣ = θᵢ = ${thetaI.toFixed(1)}°`
    },
    layout: {
        type: 'linear',
        connections: [{ from: 'θᵢ', to: 'θᵣ', operator: '=' }],
    },
    displayLayout: {
        type: 'custom',
        output: 'θᵣ',
        expression: [{ type: 'var', symbol: 'θᵢ' }],
    },
    getInsight: (vars) => {
        const theta = vars['θᵣ']
        if (theta < 10)
            return {
                ko: '거의 수직으로 반사되는 빛이야',
                en: 'Light reflecting almost straight back',
                ja: 'ほぼ垂直に反射する光',
                es: 'Luz reflejándose casi directamente hacia atrás',
                pt: 'Luz refletindo quase diretamente de volta',
                'zh-CN': '光几乎垂直反射回去',
                'zh-TW': '光幾乎垂直反射回去',
            }
        if (theta < 30)
            return {
                ko: '거울을 약간 기울인 반사야',
                en: 'Mirror tilted slightly',
                ja: '鏡を少し傾けた反射',
                es: 'Espejo ligeramente inclinado',
                pt: 'Espelho levemente inclinado',
                'zh-CN': '镜子稍微倾斜的反射',
                'zh-TW': '鏡子稍微傾斜的反射',
            }
        if (theta < 50)
            return {
                ko: '일반적인 거울 반사각이야',
                en: 'Typical mirror reflection angle',
                ja: '一般的な鏡の反射角',
                es: 'Ángulo de reflexión típico de espejo',
                pt: 'Ângulo de reflexão típico de espelho',
                'zh-CN': '典型的镜面反射角',
                'zh-TW': '典型的鏡面反射角',
            }
        if (theta < 70)
            return {
                ko: '비스듬히 반사되는 빛이야',
                en: 'Light reflecting at an angle',
                ja: '斜めに反射する光',
                es: 'Luz reflejándose en ángulo',
                pt: 'Luz refletindo em ângulo',
                'zh-CN': '光斜向反射',
                'zh-TW': '光斜向反射',
            }
        return {
            ko: '수면에서 반짝이는 빛처럼 스치듯 반사!',
            en: 'Grazing reflection like light sparkling on water!',
            ja: '水面でキラキラ光るように掠めて反射！',
            es: '¡Reflexión rasante como luz brillando en el agua!',
            pt: 'Reflexão rasante como luz brilhando na água!',
            'zh-CN': '像水面上闪烁的光一样掠射反射！',
            'zh-TW': '像水面上閃爍的光一樣掠射反射！',
        }
    },
    discoveries: [
        {
            id: 'grazing-angle',
            mission: {
                ko: '입사각 θᵢ를 80° 이상으로 올려봐!',
                en: 'Raise angle of incidence above 80 degrees!',
                ja: '入射角θᵢを80°以上に上げてみて！',
                es: '¡Sube el ángulo de incidencia por encima de 80 grados!',
                pt: 'Aumente o ângulo de incidência acima de 80 graus!',
                'zh-CN': '把入射角提高到80度以上！',
                'zh-TW': '把入射角提高到80度以上！',
            },
            result: {
                ko: '스치듯 들어오는 빛도 같은 각도로 반사! 호수 표면이 반짝이는 이유야.',
                en: 'Even grazing light reflects at equal angle! This is why lake surfaces sparkle.',
                ja: '掠めるように入る光も同じ角度で反射！湖面がキラキラ輝く理由だよ。',
                es: '¡Incluso la luz rasante se refleja en el mismo ángulo! Por eso las superficies de los lagos brillan.',
                pt: 'Mesmo a luz rasante reflete no mesmo ângulo! Por isso as superfícies dos lagos brilham.',
                'zh-CN': '即使掠射的光也以相同角度反射！这就是湖面闪闪发光的原因。',
                'zh-TW': '即使掠射的光也以相同角度反射！這就是湖面閃閃發光的原因。',
            },
            icon: '✨',
            condition: (vars) => vars['θᵢ'] >= 80,
        },
        {
            id: 'perpendicular',
            mission: {
                ko: '입사각 θᵢ를 5° 이하로 낮춰봐!',
                en: 'Lower angle of incidence below 5 degrees!',
                ja: '入射角θᵢを5°以下に下げてみて！',
                es: '¡Baja el ángulo de incidencia por debajo de 5 grados!',
                pt: 'Reduza o ângulo de incidência abaixo de 5 graus!',
                'zh-CN': '把入射角降到5度以下！',
                'zh-TW': '把入射角降到5度以下！',
            },
            result: {
                ko: '수직으로 들어오면 수직으로 반사! 거울을 정면으로 볼 때 내 얼굴이 보이는 이유야.',
                en: 'Perpendicular in means perpendicular out! Why you see your face looking straight at a mirror.',
                ja: '垂直に入れば垂直に反射！鏡を正面から見ると自分の顔が見える理由だよ。',
                es: '¡Perpendicular hacia adentro significa perpendicular hacia afuera! Por eso ves tu cara mirando directamente al espejo.',
                pt: 'Perpendicular na entrada significa perpendicular na saída! Por isso você vê seu rosto olhando direto para o espelho.',
                'zh-CN': '垂直入射就垂直反射！这就是正对镜子时能看到自己脸的原因。',
                'zh-TW': '垂直入射就垂直反射！這就是正對鏡子時能看到自己臉的原因。',
            },
            icon: '🪞',
            condition: (vars) => vars['θᵢ'] <= 5,
        },
    ],
}
