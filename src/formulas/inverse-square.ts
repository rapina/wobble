import { Formula } from './types'
import { colors } from '../styles/colors'

export const inverseSquare: Formula = {
    id: 'inverse-square',
    name: {
        ko: '역제곱 법칙',
        en: 'Inverse Square Law',
        ja: '逆二乗の法則',
        es: 'Ley del Inverso del Cuadrado',
        pt: 'Lei do Inverso do Quadrado',
        'zh-CN': '平方反比定律',
        'zh-TW': '平方反比定律',
    },
    expression: 'I = P/(4πr²)',
    description: {
        ko: '빛, 소리, 중력 등이 거리의 제곱에 반비례해 약해진다',
        en: 'Light, sound, gravity etc. weaken inversely proportional to distance squared',
        ja: '光、音、重力などは距離の二乗に反比例して弱くなる',
        es: 'La luz, el sonido, la gravedad, etc. se debilitan inversamente proporcional al cuadrado de la distancia',
        pt: 'Luz, som, gravidade, etc. enfraquecem inversamente proporcional ao quadrado da distância',
        'zh-CN': '光、声音、重力等随距离平方成反比减弱',
        'zh-TW': '光、聲音、重力等隨距離平方成反比減弱',
    },
    simulationHint: {
        ko: '거리가 2배가 되면 세기가 1/4이 되는 것을 관찰하세요',
        en: 'Watch intensity drop to 1/4 when distance doubles',
        ja: '距離が2倍になると強度が1/4になる様子を観察',
        es: 'Observa cómo la intensidad cae a 1/4 cuando la distancia se duplica',
        pt: 'Observe a intensidade cair para 1/4 quando a distância dobra',
        'zh-CN': '观察距离加倍时强度变为1/4',
        'zh-TW': '觀察距離加倍時強度變為1/4',
    },
    applications: {
        ko: [
            '조명 설계 - 거리에 따른 밝기 계산',
            '음향 설계 - 스피커 배치 최적화',
            '방사선 안전 - 선원과 거리 유지',
            '통신 - 신호 세기 감쇠 계산',
        ],
        en: [
            'Lighting design - calculating brightness by distance',
            'Acoustics - optimizing speaker placement',
            'Radiation safety - maintaining distance from source',
            'Communications - signal attenuation calculation',
        ],
        ja: [
            '照明設計 - 距離による明るさの計算',
            '音響設計 - スピーカー配置の最適化',
            '放射線安全 - 線源との距離維持',
            '通信 - 信号減衰の計算',
        ],
        es: [
            'Diseño de iluminación - calculando brillo por distancia',
            'Acústica - optimizando ubicación de altavoces',
            'Seguridad radiológica - manteniendo distancia de la fuente',
            'Comunicaciones - cálculo de atenuación de señal',
        ],
        pt: [
            'Design de iluminação - calculando brilho por distância',
            'Acústica - otimizando posicionamento de alto-falantes',
            'Segurança radiológica - mantendo distância da fonte',
            'Comunicações - cálculo de atenuação de sinal',
        ],
        'zh-CN': [
            '照明设计 - 按距离计算亮度',
            '音响设计 - 优化扬声器位置',
            '辐射安全 - 与辐射源保持距离',
            '通信 - 信号衰减计算',
        ],
        'zh-TW': [
            '照明設計 - 按距離計算亮度',
            '音響設計 - 優化揚聲器位置',
            '輻射安全 - 與輻射源保持距離',
            '通信 - 信號衰減計算',
        ],
    },
    category: 'wave',
    variables: [
        {
            symbol: 'P',
            name: {
                ko: '출력',
                en: 'Power',
                ja: '出力',
                es: 'Potencia',
                pt: 'Potência',
                'zh-CN': '功率',
                'zh-TW': '功率',
            },
            role: 'input',
            unit: 'W',
            range: [1, 1000],
            default: 100,
            visual: {
                property: 'glow',
                scale: (v) => v / 100,
                color: colors.power,
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
            unit: 'm',
            range: [0.5, 20],
            default: 2,
            visual: {
                property: 'distance',
                scale: (v) => v * 5,
                color: colors.distance,
            },
        },
        {
            symbol: 'I',
            name: {
                ko: '세기',
                en: 'Intensity',
                ja: '強度',
                es: 'Intensidad',
                pt: 'Intensidade',
                'zh-CN': '强度',
                'zh-TW': '強度',
            },
            role: 'output',
            unit: 'W/m²',
            range: [0, 500],
            default: 1.99,
            visual: {
                property: 'glow',
                scale: (v) => v,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs) => {
        const P = inputs['P'] || 100
        const r = inputs['r'] || 2
        const I = P / (4 * Math.PI * r * r)
        return { I: Math.round(I * 100) / 100 }
    },
    formatCalculation: (inputs) => {
        const P = inputs['P'] || 100
        const r = inputs['r'] || 2
        const I = P / (4 * Math.PI * r * r)
        return `I = ${P}/(4π×${r}²) = ${I.toFixed(2)} W/m²`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'P', to: 'I', operator: '÷' },
            { from: 'r', to: 'I', operator: '÷r²' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'I',
        expression: [
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'P' }],
                denominator: [
                    { type: 'text', value: '4π' },
                    { type: 'var', symbol: 'r', square: true },
                ],
            },
        ],
    },
    discoveries: [
        {
            id: 'double-distance',
            mission: {
                ko: 'r을 2배로 늘려서 세기 변화를 봐',
                en: 'Double r to see intensity change',
                ja: 'rを2倍にして強度の変化を見て',
                es: 'Duplica r para ver el cambio de intensidad',
                pt: 'Dobre r para ver a mudança de intensidade',
                'zh-CN': '将r加倍观察强度变化',
                'zh-TW': '將r加倍觀察強度變化',
            },
            result: {
                ko: '거리 2배 = 세기 1/4! 이게 역제곱 법칙!',
                en: 'Double distance = 1/4 intensity! The inverse square law!',
                ja: '距離2倍 = 強度1/4！これが逆二乗の法則！',
                es: '¡Doble distancia = 1/4 de intensidad! ¡La ley del inverso del cuadrado!',
                pt: 'Dobrar distância = 1/4 da intensidade! A lei do inverso do quadrado!',
                'zh-CN': '距离加倍=强度变为1/4！这就是平方反比定律！',
                'zh-TW': '距離加倍=強度變為1/4！這就是平方反比定律！',
            },
            icon: '📏',
            condition: (vars) => {
                const r = vars['r'] || 2
                return r >= 10
            },
        },
        {
            id: 'close-source',
            mission: {
                ko: 'r을 최소로 줄여봐',
                en: 'Minimize distance r',
                ja: '距離rを最小にしてみて',
                es: 'Minimiza la distancia r',
                pt: 'Minimize a distância r',
                'zh-CN': '将距离r最小化',
                'zh-TW': '將距離r最小化',
            },
            result: {
                ko: '가까울수록 엄청 강해! 조심해야 해!',
                en: 'Much stronger up close! Be careful!',
                ja: '近いほどとても強い！気をつけて！',
                es: '¡Mucho más fuerte de cerca! ¡Ten cuidado!',
                pt: 'Muito mais forte de perto! Tenha cuidado!',
                'zh-CN': '越近越强！要小心！',
                'zh-TW': '越近越強！要小心！',
            },
            icon: '☀️',
            condition: (vars) => {
                const r = vars['r'] || 2
                const I = vars['I'] || 2
                return r <= 1 && I >= 10
            },
        },
        {
            id: 'high-power',
            mission: {
                ko: 'P를 최대로 올려봐',
                en: 'Maximize power P',
                ja: '出力Pを最大にしてみて',
                es: 'Maximiza la potencia P',
                pt: 'Maximize a potência P',
                'zh-CN': '将功率P最大化',
                'zh-TW': '將功率P最大化',
            },
            result: {
                ko: '출력이 세면 멀리서도 강하게 도달해!',
                en: 'High power reaches far with strength!',
                ja: '出力が強いと遠くても強く届く！',
                es: '¡La alta potencia llega lejos con fuerza!',
                pt: 'Alta potência alcança longe com força!',
                'zh-CN': '功率大时远处也能强力到达！',
                'zh-TW': '功率大時遠處也能強力到達！',
            },
            icon: '💡',
            condition: (vars) => {
                const P = vars['P'] || 100
                return P >= 900
            },
        },
    ],
    getInsight: (variables) => {
        const I = variables['I'] || 2
        const r = variables['r'] || 2

        if (I > 10) {
            return {
                ko: `${I.toFixed(1)} W/m²は꽤 밝아요! 직사광선은 약 1000 W/m²예요.`,
                en: `${I.toFixed(1)} W/m² is quite bright! Direct sunlight is ~1000 W/m².`,
                ja: `${I.toFixed(1)} W/m²はかなり明るい！直射日光は約1000 W/m²だよ。`,
                es: `¡${I.toFixed(1)} W/m² es bastante brillante! La luz solar directa es ~1000 W/m².`,
                pt: `${I.toFixed(1)} W/m² é bem brilhante! A luz solar direta é ~1000 W/m².`,
                'zh-CN': `${I.toFixed(1)} W/m²相当亮！直射阳光约为1000 W/m²。`,
                'zh-TW': `${I.toFixed(1)} W/m²相當亮！直射陽光約為1000 W/m²。`,
            }
        }
        return {
            ko: `${r}m 거리에서 ${I.toFixed(2)} W/m². 중력, 전기력, 빛 모두 이 법칙을 따라요!`,
            en: `${I.toFixed(2)} W/m² at ${r}m. Gravity, electric force, light all follow this law!`,
            ja: `${r}mの距離で${I.toFixed(2)} W/m²。重力、電気力、光すべてこの法則に従うよ！`,
            es: `${I.toFixed(2)} W/m² a ${r}m. ¡Gravedad, fuerza eléctrica, luz, todos siguen esta ley!`,
            pt: `${I.toFixed(2)} W/m² a ${r}m. Gravidade, força elétrica, luz, todos seguem esta lei!`,
            'zh-CN': `${r}m处${I.toFixed(2)} W/m²。重力、电力、光都遵循这个定律！`,
            'zh-TW': `${r}m處${I.toFixed(2)} W/m²。重力、電力、光都遵循這個定律！`,
        }
    },
}
