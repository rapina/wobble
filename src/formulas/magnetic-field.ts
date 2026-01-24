import { Formula } from './types'
import { colors } from '../styles/colors'

export const magneticField: Formula = {
    id: 'magnetic-field',
    name: {
        ko: '직선 전류의 자기장',
        en: 'Magnetic Field from Wire',
        ja: '直線電流の磁場',
        es: 'Campo Magnético de un Cable',
        pt: 'Campo Magnético de um Fio',
        'zh-CN': '直线电流的磁场',
        'zh-TW': '直線電流的磁場',
    },
    expression: 'B = μ₀I/(2πr)',
    description: {
        ko: '전류가 흐르는 도선 주위에 원형 자기장이 생긴다',
        en: 'A current-carrying wire creates a circular magnetic field around it',
        ja: '電流が流れる導線の周りに円形の磁場ができる',
        es: 'Un cable con corriente crea un campo magnético circular a su alrededor',
        pt: 'Um fio com corrente cria um campo magnético circular ao seu redor',
        'zh-CN': '载流导线周围产生圆形磁场',
        'zh-TW': '載流導線周圍產生圓形磁場',
    },
    simulationHint: {
        ko: '전류를 높이거나 도선에 가까이 가서 자기장 세기 변화를 보세요',
        en: 'Increase current or get closer to wire to see field strength change',
        ja: '電流を上げるか導線に近づいて磁場の強さの変化を見よう',
        es: 'Aumenta la corriente o acércate al cable para ver el cambio de intensidad del campo',
        pt: 'Aumente a corrente ou aproxime-se do fio para ver a mudança na intensidade do campo',
        'zh-CN': '增加电流或靠近导线来观察磁场强度的变化',
        'zh-TW': '增加電流或靠近導線來觀察磁場強度的變化',
    },
    applications: {
        ko: [
            '전자석 - 전류로 자석 만들기',
            'MRI 기계 - 강한 자기장으로 신체 촬영',
            '스피커 - 전류 변화로 소리 생성',
            '전동기 - 자기장으로 회전력 생성',
        ],
        en: [
            'Electromagnets - creating magnets with current',
            'MRI machines - body imaging with strong magnetic fields',
            'Speakers - generating sound with current changes',
            'Electric motors - creating rotation with magnetic fields',
        ],
        ja: [
            '電磁石 - 電流で磁石を作る',
            'MRI装置 - 強い磁場で体内を撮影',
            'スピーカー - 電流変化で音を発生',
            '電動モーター - 磁場で回転力を生成',
        ],
        es: [
            'Electroimanes - crear imanes con corriente',
            'Máquinas de MRI - imágenes corporales con campos magnéticos fuertes',
            'Altavoces - generar sonido con cambios de corriente',
            'Motores eléctricos - crear rotación con campos magnéticos',
        ],
        pt: [
            'Eletroímãs - criar ímãs com corrente',
            'Máquinas de MRI - imagens corporais com campos magnéticos fortes',
            'Alto-falantes - gerar som com mudanças de corrente',
            'Motores elétricos - criar rotação com campos magnéticos',
        ],
        'zh-CN': [
            '电磁铁 - 用电流制造磁铁',
            'MRI机器 - 用强磁场进行身体成像',
            '扬声器 - 用电流变化产生声音',
            '电动机 - 用磁场产生旋转力',
        ],
        'zh-TW': [
            '電磁鐵 - 用電流製造磁鐵',
            'MRI機器 - 用強磁場進行身體成像',
            '揚聲器 - 用電流變化產生聲音',
            '電動機 - 用磁場產生旋轉力',
        ],
    },
    category: 'electricity',
    variables: [
        {
            symbol: 'I',
            name: {
                ko: '전류',
                en: 'Current',
                ja: '電流',
                es: 'Corriente',
                pt: 'Corrente',
                'zh-CN': '电流',
                'zh-TW': '電流',
            },
            role: 'input',
            unit: 'A',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'glow',
                scale: (v) => v / 20,
                color: colors.current,
            },
        },
        {
            symbol: 'r',
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
            unit: 'cm',
            range: [1, 50],
            default: 10,
            visual: {
                property: 'distance',
                scale: (v) => v,
                color: colors.distance,
            },
        },
        {
            symbol: 'B',
            name: {
                ko: '자기장 세기',
                en: 'Magnetic field',
                ja: '磁場の強さ',
                es: 'Campo Magnético',
                pt: 'Campo Magnético',
                'zh-CN': '磁场强度',
                'zh-TW': '磁場強度',
            },
            role: 'output',
            unit: 'μT',
            range: [0, 1000],
            default: 20,
            visual: {
                property: 'glow',
                scale: (v) => v / 50,
                color: colors.charge,
            },
        },
    ],
    calculate: (inputs) => {
        const I = inputs['I'] || 10
        const r = (inputs['r'] || 10) / 100 // cm to m
        const mu0 = 4 * Math.PI * 1e-7 // permeability of free space
        const B = (mu0 * I) / (2 * Math.PI * r)
        const B_microTesla = B * 1e6
        return { B: Math.round(B_microTesla * 10) / 10 }
    },
    formatCalculation: (inputs) => {
        const I = inputs['I'] || 10
        const r = inputs['r'] || 10
        const rMeters = r / 100
        const mu0 = 4 * Math.PI * 1e-7
        const B = (mu0 * I) / (2 * Math.PI * rMeters)
        const B_microTesla = B * 1e6
        return `B = μ₀×${I}/(2π×${r}cm) = ${B_microTesla.toFixed(1)} μT`
    },
    layout: {
        type: 'circular',
        connections: [
            { from: 'I', to: 'B', operator: '×' },
            { from: 'r', to: 'B', operator: '÷' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'B',
        expression: [
            {
                type: 'fraction',
                numerator: [
                    { type: 'text', value: 'μ₀' },
                    { type: 'var', symbol: 'I' },
                ],
                denominator: [
                    { type: 'text', value: '2π' },
                    { type: 'var', symbol: 'r' },
                ],
            },
        ],
    },
    discoveries: [
        {
            id: 'close-field',
            mission: {
                ko: 'r을 최소로 줄여서 강한 자기장을 만들어봐',
                en: 'Minimize r to create strong magnetic field',
                ja: 'rを最小にして強い磁場を作ってみて',
                es: 'Minimiza r para crear un campo magnético fuerte',
                pt: 'Minimize r para criar um campo magnético forte',
                'zh-CN': '把r减到最小来产生强磁场',
                'zh-TW': '把r減到最小來產生強磁場',
            },
            result: {
                ko: '가까울수록 자기장이 강해! 전자석 코어가 중요한 이유!',
                en: 'Closer = stronger field! This is why electromagnet cores matter!',
                ja: '近いほど磁場が強い！電磁石のコアが重要な理由！',
                es: '¡Más cerca = campo más fuerte! ¡Por eso importan los núcleos de electroimanes!',
                pt: 'Mais perto = campo mais forte! Por isso os núcleos de eletroímãs importam!',
                'zh-CN': '越近磁场越强！这就是电磁铁铁芯重要的原因！',
                'zh-TW': '越近磁場越強！這就是電磁鐵鐵芯重要的原因！',
            },
            icon: '🧲',
            condition: (vars) => {
                const r = vars['r'] || 10
                const B = vars['B'] || 20
                return r <= 2 && B >= 100
            },
        },
        {
            id: 'high-current',
            mission: {
                ko: 'I를 최대로 올려봐',
                en: 'Maximize current I',
                ja: '電流Iを最大にしてみて',
                es: 'Maximiza la corriente I',
                pt: 'Maximize a corrente I',
                'zh-CN': '把电流I调到最大',
                'zh-TW': '把電流I調到最大',
            },
            result: {
                ko: '전류가 클수록 자기장도 강해져!',
                en: 'More current = stronger magnetic field!',
                ja: '電流が大きいほど磁場も強くなる！',
                es: '¡Más corriente = campo magnético más fuerte!',
                pt: 'Mais corrente = campo magnético mais forte!',
                'zh-CN': '电流越大磁场越强！',
                'zh-TW': '電流越大磁場越強！',
            },
            icon: '⚡',
            condition: (vars) => {
                const I = vars['I'] || 10
                return I >= 90
            },
        },
        {
            id: 'earth-field',
            mission: {
                ko: '지구 자기장(~50μT) 정도의 세기를 만들어봐',
                en: "Create Earth's magnetic field strength (~50μT)",
                ja: '地球の磁場（〜50μT）程度の強さを作ってみて',
                es: 'Crea la intensidad del campo magnético terrestre (~50μT)',
                pt: 'Crie a intensidade do campo magnético da Terra (~50μT)',
                'zh-CN': '产生地球磁场强度（~50μT）',
                'zh-TW': '產生地球磁場強度（~50μT）',
            },
            result: {
                ko: '지구 자기장은 나침반을 움직이게 하는 힘!',
                en: "Earth's field is what makes compasses work!",
                ja: '地球の磁場がコンパスを動かす力！',
                es: '¡El campo terrestre es lo que hace funcionar las brújulas!',
                pt: 'O campo da Terra é o que faz as bússolas funcionarem!',
                'zh-CN': '地球磁场是让指南针工作的力量！',
                'zh-TW': '地球磁場是讓指南針工作的力量！',
            },
            icon: '🌍',
            condition: (vars) => {
                const B = vars['B'] || 20
                return B >= 45 && B <= 55
            },
        },
    ],
    getInsight: (variables) => {
        const B = variables['B'] || 20

        if (B > 100) {
            return {
                ko: `${B.toFixed(0)}μT는 지구 자기장(~50μT)의 ${(B / 50).toFixed(1)}배예요!`,
                en: `${B.toFixed(0)}μT is ${(B / 50).toFixed(1)}x Earth's field (~50μT)!`,
                ja: `${B.toFixed(0)}μTは地球の磁場（〜50μT）の${(B / 50).toFixed(1)}倍！`,
                es: `${B.toFixed(0)}μT es ${(B / 50).toFixed(1)}x el campo terrestre (~50μT)!`,
                pt: `${B.toFixed(0)}μT é ${(B / 50).toFixed(1)}x o campo da Terra (~50μT)!`,
                'zh-CN': `${B.toFixed(0)}μT是地球磁场（~50μT）的${(B / 50).toFixed(1)}倍！`,
                'zh-TW': `${B.toFixed(0)}μT是地球磁場（~50μT）的${(B / 50).toFixed(1)}倍！`,
            }
        }
        return {
            ko: `오른손 법칙: 엄지가 전류 방향이면 나머지 손가락이 자기장 방향!`,
            en: `Right-hand rule: thumb = current direction, fingers = field direction!`,
            ja: `右手の法則：親指が電流の方向なら、残りの指が磁場の方向！`,
            es: `Regla de la mano derecha: pulgar = dirección de corriente, dedos = dirección del campo!`,
            pt: `Regra da mão direita: polegar = direção da corrente, dedos = direção do campo!`,
            'zh-CN': `右手定则：拇指是电流方向，其余手指是磁场方向！`,
            'zh-TW': `右手定則：拇指是電流方向，其餘手指是磁場方向！`,
        }
    },
}
