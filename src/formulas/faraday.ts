import { Formula } from './types'
import { colors } from '../styles/colors'

export const faraday: Formula = {
    id: 'faraday',
    name: {
        ko: '패러데이 법칙',
        en: "Faraday's Law",
        ja: 'ファラデーの法則',
        es: 'Ley de Faraday',
        pt: 'Lei de Faraday',
        'zh-CN': '法拉第定律',
        'zh-TW': '法拉第定律',
    },
    expression: 'EMF = -NΔΦ/Δt',
    description: {
        ko: '자기장의 변화가 전기를 만든다 - 발전기의 원리',
        en: 'A changing magnetic field induces electric current - the principle of generators',
        ja: '磁場の変化が電気を生み出す - 発電機の原理',
        es: 'Un campo magnético cambiante induce corriente eléctrica - el principio de los generadores',
        pt: 'Um campo magnético variável induz corrente elétrica - o princípio dos geradores',
        'zh-CN': '变化的磁场产生电流 - 发电机的原理',
        'zh-TW': '變化的磁場產生電流 - 發電機的原理',
    },
    simulationHint: {
        ko: '자석을 빠르게 움직여 더 큰 전압을 만들어보세요',
        en: 'Move the magnet faster to generate more voltage',
        ja: '磁石を速く動かしてより大きな電圧を発生させよう',
        es: 'Mueve el imán más rápido para generar más voltaje',
        pt: 'Mova o ímã mais rápido para gerar mais tensão',
        'zh-CN': '更快地移动磁铁来产生更大的电压',
        'zh-TW': '更快地移動磁鐵來產生更大的電壓',
    },
    applications: {
        ko: [
            '발전소 - 터빈으로 자석을 돌려 전기 생산',
            '자전거 발전기 - 바퀴 회전으로 라이트 켜기',
            '무선 충전 - 자기장 변화로 전력 전송',
            '기타 픽업 - 현의 진동을 전기 신호로 변환',
        ],
        en: [
            'Power plants - rotating magnets with turbines',
            'Bicycle dynamo - wheel rotation powers lights',
            'Wireless charging - power transfer via changing magnetic field',
            'Guitar pickup - converts string vibration to electric signal',
        ],
        ja: [
            '発電所 - タービンで磁石を回して発電',
            '自転車の発電機 - 車輪の回転でライトを点灯',
            'ワイヤレス充電 - 磁場変化で電力を伝送',
            'ギターピックアップ - 弦の振動を電気信号に変換',
        ],
        es: [
            'Plantas de energía - rotando imanes con turbinas',
            'Dinamo de bicicleta - la rotación de la rueda enciende las luces',
            'Carga inalámbrica - transferencia de energía mediante campo magnético cambiante',
            'Pastilla de guitarra - convierte la vibración de cuerdas en señal eléctrica',
        ],
        pt: [
            'Usinas de energia - rotacionando ímãs com turbinas',
            'Dínamo de bicicleta - a rotação da roda alimenta as luzes',
            'Carregamento sem fio - transferência de energia via campo magnético variável',
            'Captador de guitarra - converte vibração das cordas em sinal elétrico',
        ],
        'zh-CN': [
            '发电厂 - 用涡轮机转动磁铁发电',
            '自行车发电机 - 车轮旋转为车灯供电',
            '无线充电 - 通过变化的磁场传输电力',
            '吉他拾音器 - 将琴弦振动转换为电信号',
        ],
        'zh-TW': [
            '發電廠 - 用渦輪機轉動磁鐵發電',
            '腳踏車發電機 - 車輪旋轉為車燈供電',
            '無線充電 - 通過變化的磁場傳輸電力',
            '吉他拾音器 - 將琴弦振動轉換為電信號',
        ],
    },
    category: 'electricity',
    variables: [
        {
            symbol: 'N',
            name: {
                ko: '코일 감은 수',
                en: 'Number of turns',
                ja: 'コイル巻数',
                es: 'Número de vueltas',
                pt: 'Número de espiras',
                'zh-CN': '线圈匝数',
                'zh-TW': '線圈匝數',
            },
            role: 'input',
            unit: '회',
            range: [1, 100],
            default: 50,
            visual: {
                property: 'size',
                scale: (v) => v / 10,
                color: colors.resistance,
            },
        },
        {
            symbol: 'ΔΦ',
            name: {
                ko: '자속 변화량',
                en: 'Change in magnetic flux',
                ja: '磁束変化量',
                es: 'Cambio en flujo magnético',
                pt: 'Variação de fluxo magnético',
                'zh-CN': '磁通量变化',
                'zh-TW': '磁通量變化',
            },
            role: 'input',
            unit: 'Wb',
            range: [0.01, 1],
            default: 0.2,
            visual: {
                property: 'glow',
                scale: (v) => v * 10,
                color: colors.charge,
            },
        },
        {
            symbol: 'Δt',
            name: {
                ko: '시간 변화',
                en: 'Time interval',
                ja: '時間変化',
                es: 'Intervalo de tiempo',
                pt: 'Intervalo de tempo',
                'zh-CN': '时间变化',
                'zh-TW': '時間變化',
            },
            role: 'input',
            unit: 's',
            range: [0.01, 1],
            default: 0.1,
            visual: {
                property: 'speed',
                scale: (v) => 1 / v,
                color: colors.time,
            },
        },
        {
            symbol: 'EMF',
            name: {
                ko: '유도 기전력',
                en: 'Induced EMF',
                ja: '誘導起電力',
                es: 'FEM Inducida',
                pt: 'FEM Induzida',
                'zh-CN': '感应电动势',
                'zh-TW': '感應電動勢',
            },
            role: 'output',
            unit: 'V',
            range: [0, 1000],
            default: 100,
            visual: {
                property: 'glow',
                scale: (v) => v / 50,
                color: colors.voltage,
            },
        },
    ],
    calculate: (inputs) => {
        const N = inputs['N'] || 50
        const dPhi = inputs['ΔΦ'] || 0.2
        const dt = inputs['Δt'] || 0.1
        const EMF = Math.abs((N * dPhi) / dt)
        return { EMF: Math.round(EMF * 10) / 10 }
    },
    formatCalculation: (inputs) => {
        const N = inputs['N'] || 50
        const dPhi = inputs['ΔΦ'] || 0.2
        const dt = inputs['Δt'] || 0.1
        const EMF = Math.abs((N * dPhi) / dt)
        return `EMF = ${N} × ${dPhi}/${dt} = ${EMF.toFixed(1)} V`
    },
    layout: {
        type: 'flow',
        connections: [
            { from: 'N', to: 'EMF', operator: '×' },
            { from: 'ΔΦ', to: 'EMF', operator: '×' },
            { from: 'Δt', to: 'EMF', operator: '÷' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'EMF',
        expression: [
            { type: 'var', symbol: 'N' },
            { type: 'op', value: '×' },
            {
                type: 'fraction',
                numerator: [{ type: 'var', symbol: 'ΔΦ' }],
                denominator: [{ type: 'var', symbol: 'Δt' }],
            },
        ],
    },
    discoveries: [
        {
            id: 'fast-change',
            mission: {
                ko: 'Δt를 줄여서 빠른 자속 변화를 만들어봐',
                en: 'Decrease Δt to create rapid flux change',
                ja: 'Δtを減らして速い磁束変化を作ってみよう',
                es: 'Disminuye Δt para crear un cambio de flujo rápido',
                pt: 'Diminua Δt para criar uma mudança de fluxo rápida',
                'zh-CN': '减小Δt来产生快速的磁通量变化',
                'zh-TW': '減小Δt來產生快速的磁通量變化',
            },
            result: {
                ko: '빠른 변화 = 큰 전압! 발전기는 빠르게 회전해야 해!',
                en: 'Faster change = more voltage! Generators spin fast!',
                ja: '速い変化 = 大きな電圧！発電機は速く回転する必要がある！',
                es: '¡Cambio más rápido = más voltaje! ¡Los generadores giran rápido!',
                pt: 'Mudança mais rápida = mais tensão! Geradores giram rápido!',
                'zh-CN': '变化越快 = 电压越大！发电机需要快速旋转！',
                'zh-TW': '變化越快 = 電壓越大！發電機需要快速旋轉！',
            },
            icon: '⚡',
            condition: (vars) => {
                const dt = vars['Δt'] || 0.1
                const EMF = vars['EMF'] || 100
                return dt <= 0.02 && EMF >= 200
            },
        },
        {
            id: 'many-turns',
            mission: {
                ko: 'N을 최대로 올려봐',
                en: 'Maximize N (number of turns)',
                ja: 'Nを最大にしてみよう（巻数）',
                es: 'Maximiza N (número de vueltas)',
                pt: 'Maximize N (número de espiras)',
                'zh-CN': '把N（匝数）调到最大',
                'zh-TW': '把N（匝數）調到最大',
            },
            result: {
                ko: '감은 수가 많을수록 전압이 높아져!',
                en: 'More turns = higher voltage!',
                ja: '巻数が多いほど電圧が高くなる！',
                es: '¡Más vueltas = mayor voltaje!',
                pt: 'Mais espiras = maior tensão!',
                'zh-CN': '匝数越多电压越高！',
                'zh-TW': '匝數越多電壓越高！',
            },
            icon: '🔄',
            condition: (vars) => {
                const N = vars['N'] || 50
                return N >= 90
            },
        },
        {
            id: 'power-generation',
            mission: {
                ko: 'EMF를 500V 이상으로 만들어봐',
                en: 'Generate EMF above 500V',
                ja: 'EMFを500V以上にしてみよう',
                es: 'Genera FEM por encima de 500V',
                pt: 'Gere FEM acima de 500V',
                'zh-CN': '产生500V以上的电动势',
                'zh-TW': '產生500V以上的電動勢',
            },
            result: {
                ko: '발전소에서는 수천 볼트를 만들어요!',
                en: 'Power plants generate thousands of volts!',
                ja: '発電所では数千ボルトを作ります！',
                es: '¡Las plantas de energía generan miles de voltios!',
                pt: 'Usinas de energia geram milhares de volts!',
                'zh-CN': '发电厂产生数千伏特的电压！',
                'zh-TW': '發電廠產生數千伏特的電壓！',
            },
            icon: '🏭',
            condition: (vars) => {
                const EMF = vars['EMF'] || 100
                return EMF >= 500
            },
        },
    ],
    getInsight: (variables) => {
        const N = variables['N'] || 50
        const EMF = variables['EMF'] || 100

        if (EMF > 200) {
            return {
                ko: `${EMF.toFixed(0)}V면 LED ${Math.floor(EMF / 3)}개 정도 켤 수 있어요!`,
                en: `${EMF.toFixed(0)}V could power about ${Math.floor(EMF / 3)} LEDs!`,
                ja: `${EMF.toFixed(0)}VならLED約${Math.floor(EMF / 3)}個点灯できます！`,
                es: `${EMF.toFixed(0)}V podría alimentar unos ${Math.floor(EMF / 3)} LEDs!`,
                pt: `${EMF.toFixed(0)}V poderia alimentar cerca de ${Math.floor(EMF / 3)} LEDs!`,
                'zh-CN': `${EMF.toFixed(0)}V可以点亮大约${Math.floor(EMF / 3)}个LED！`,
                'zh-TW': `${EMF.toFixed(0)}V可以點亮大約${Math.floor(EMF / 3)}個LED！`,
            }
        }
        return {
            ko: `패러데이가 1831년에 발견한 이 원리로 현대 문명의 전기가 만들어져요!`,
            en: `Faraday discovered this in 1831 - it powers modern civilization!`,
            ja: `ファラデーが1831年に発見したこの原理で現代文明の電気が作られています！`,
            es: `Faraday descubrió esto en 1831 - ¡alimenta la civilización moderna!`,
            pt: `Faraday descobriu isso em 1831 - alimenta a civilização moderna!`,
            'zh-CN': `法拉第在1831年发现的这一原理为现代文明提供了电力！`,
            'zh-TW': `法拉第在1831年發現的這一原理為現代文明提供了電力！`,
        }
    },
}
