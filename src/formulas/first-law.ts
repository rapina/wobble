import { Formula } from './types'
import { colors } from '../styles/colors'

export const firstLaw: Formula = {
    id: 'first-law',
    name: {
        ko: '열역학 제1법칙',
        en: 'First Law of Thermodynamics',
        ja: '熱力学第一法則',
        es: 'Primera Ley de la Termodinámica',
        pt: 'Primeira Lei da Termodinâmica',
        'zh-CN': '热力学第一定律',
        'zh-TW': '熱力學第一定律',
    },
    expression: 'ΔU = Q - W',
    description: {
        ko: '에너지 보존 법칙: 내부에너지 변화 = 열 - 일',
        en: 'Energy conservation: change in internal energy = heat - work',
        ja: 'エネルギー保存則：内部エネルギーの変化 = 熱 - 仕事',
        es: 'Conservación de energía: cambio de energía interna = calor - trabajo',
        pt: 'Conservação de energia: variação de energia interna = calor - trabalho',
        'zh-CN': '能量守恒：内能变化 = 热量 - 功',
        'zh-TW': '能量守恆：內能變化 = 熱量 - 功',
    },
    simulationHint: {
        ko: '열이 들어오고 일이 나가면서 내부 에너지가 변하는 모습',
        en: 'Shows internal energy changing as heat enters and work exits',
        ja: '熱が入り仕事が出ていくことで内部エネルギーが変化する様子',
        es: 'Muestra la energía interna cambiando mientras entra calor y sale trabajo',
        pt: 'Mostra a energia interna mudando enquanto o calor entra e o trabalho sai',
        'zh-CN': '展示热量进入、做功输出时内能的变化',
        'zh-TW': '展示熱量進入、做功輸出時內能的變化',
    },
    applications: {
        ko: [
            '냉장고와 에어컨의 냉각 사이클 설계',
            '자동차 엔진의 효율 계산',
            '발전소의 열에너지 → 전기에너지 변환',
            '단열 팽창을 이용한 구름 생성 원리',
        ],
        en: [
            'Designing refrigerator and AC cooling cycles',
            'Calculating car engine efficiency',
            'Power plant heat-to-electricity conversion',
            'Cloud formation through adiabatic expansion',
        ],
        ja: [
            '冷蔵庫・エアコンの冷却サイクル設計',
            '自動車エンジンの効率計算',
            '発電所での熱エネルギー→電気エネルギー変換',
            '断熱膨張による雲の生成原理',
        ],
        es: [
            'Diseño de ciclos de enfriamiento de refrigeradores y AC',
            'Cálculo de eficiencia del motor de auto',
            'Conversión de calor a electricidad en plantas de energía',
            'Formación de nubes por expansión adiabática',
        ],
        pt: [
            'Projeto de ciclos de resfriamento de geladeiras e AC',
            'Cálculo de eficiência do motor do carro',
            'Conversão de calor em eletricidade em usinas',
            'Formação de nuvens por expansão adiabática',
        ],
        'zh-CN': [
            '设计冰箱和空调的制冷循环',
            '计算汽车发动机效率',
            '发电厂热能转电能',
            '绝热膨胀形成云的原理',
        ],
        'zh-TW': [
            '設計冰箱和空調的製冷循環',
            '計算汽車引擎效率',
            '發電廠熱能轉電能',
            '絕熱膨脹形成雲的原理',
        ],
    },
    category: 'thermodynamics',
    variables: [
        {
            symbol: 'Q',
            name: {
                ko: '열량',
                en: 'Heat',
                ja: '熱量',
                es: 'Calor',
                pt: 'Calor',
                'zh-CN': '热量',
                'zh-TW': '熱量',
            },
            role: 'input',
            unit: 'J',
            range: [100, 800],
            default: 400,
            visual: {
                property: 'glow',
                scale: (value: number) => value / 150,
                color: colors.temperature,
            },
        },
        {
            symbol: 'W',
            name: {
                ko: '일',
                en: 'Work',
                ja: '仕事',
                es: 'Trabajo',
                pt: 'Trabalho',
                'zh-CN': '功',
                'zh-TW': '功',
            },
            role: 'input',
            unit: 'J',
            range: [50, 600],
            default: 200,
            visual: {
                property: 'size',
                scale: (value: number) => 20 + value * 0.15,
                color: colors.force,
            },
        },
        {
            symbol: 'ΔU',
            name: {
                ko: '내부에너지 변화',
                en: 'Internal Energy Change',
                ja: '内部エネルギー変化',
                es: 'Cambio de Energía Interna',
                pt: 'Variação de Energia Interna',
                'zh-CN': '内能变化',
                'zh-TW': '內能變化',
            },
            role: 'output',
            unit: 'J',
            range: [-500, 750],
            default: 200,
            visual: {
                property: 'glow',
                scale: (value: number) => Math.abs(value) / 150,
                color: colors.energy,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const Q = inputs.Q ?? 500
        const W = inputs.W ?? 200
        return {
            ΔU: Q - W,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const Q = inputs.Q ?? 500
        const W = inputs.W ?? 200
        const dU = Q - W
        return `ΔU = ${Q.toFixed(0)} - ${W.toFixed(0)} = ${dU.toFixed(0)}`
    },
    layout: {
        type: 'container',
        connections: [
            { from: 'Q', to: 'W', operator: '-' },
            { from: 'W', to: 'ΔU', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'custom',
        output: 'ΔU',
        expression: [
            { type: 'var', symbol: 'Q' },
            { type: 'op', value: '-' },
            { type: 'var', symbol: 'W' },
        ],
    },
    discoveries: [
        {
            id: 'all-heat-to-work',
            mission: {
                ko: '열량 Q와 일 W를 같게 설정해봐!',
                en: 'Set heat Q equal to work W!',
                ja: '熱量Qと仕事Wを同じに設定してみて！',
                es: '¡Configura el calor Q igual al trabajo W!',
                pt: 'Configure o calor Q igual ao trabalho W!',
                'zh-CN': '将热量Q和功W设为相等！',
                'zh-TW': '將熱量Q和功W設為相等！',
            },
            result: {
                ko: '모든 열이 일로 바뀌면 내부에너지 변화 없음! 이상적인 등온 과정이야.',
                en: 'When all heat becomes work, no internal energy change! This is an ideal isothermal process.',
                ja: 'すべての熱が仕事に変わると内部エネルギー変化なし！理想的な等温過程だよ。',
                es: '¡Cuando todo el calor se convierte en trabajo, no hay cambio de energía interna! Es un proceso isotérmico ideal.',
                pt: 'Quando todo o calor vira trabalho, não há mudança de energia interna! É um processo isotérmico ideal.',
                'zh-CN': '当所有热量都转化为功时，内能不变！这是理想的等温过程。',
                'zh-TW': '當所有熱量都轉化為功時，內能不變！這是理想的等溫過程。',
            },
            icon: '⚖️',
            condition: (vars) => Math.abs(vars['Q'] - vars['W']) <= 20,
        },
        {
            id: 'adiabatic',
            mission: {
                ko: '열량 Q를 최소로, 일 W를 최대로 설정해봐!',
                en: 'Minimize heat Q and maximize work W!',
                ja: '熱量Qを最小に、仕事Wを最大に設定してみて！',
                es: '¡Minimiza el calor Q y maximiza el trabajo W!',
                pt: 'Minimize o calor Q e maximize o trabalho W!',
                'zh-CN': '将热量Q调到最小，功W调到最大！',
                'zh-TW': '將熱量Q調到最小，功W調到最大！',
            },
            result: {
                ko: '열 없이 일만 하면 내부에너지가 감소해! 단열팽창으로 온도가 떨어지는 원리야.',
                en: 'Work without heat decreases internal energy! This is why adiabatic expansion cools things down.',
                ja: '熱なしで仕事だけすると内部エネルギーが減る！断熱膨張で温度が下がる原理だよ。',
                es: '¡Trabajo sin calor disminuye la energía interna! Por eso la expansión adiabática enfría las cosas.',
                pt: 'Trabalho sem calor diminui a energia interna! Por isso a expansão adiabática esfria as coisas.',
                'zh-CN': '只做功不吸热会使内能减少！这就是绝热膨胀使物体降温的原理。',
                'zh-TW': '只做功不吸熱會使內能減少！這就是絕熱膨脹使物體降溫的原理。',
            },
            icon: '🌡️',
            condition: (vars) => vars['Q'] <= 150 && vars['W'] >= 500,
        },
    ],
    getInsight: (vars) => {
        const dU = vars['ΔU']
        if (dU < -200)
            return {
                ko: '급격히 식는 중이야! 단열팽창!',
                en: 'Cooling rapidly! Adiabatic expansion!',
                ja: '急激に冷えている！断熱膨張だよ！',
                es: '¡Enfriándose rápidamente! ¡Expansión adiabática!',
                pt: 'Esfriando rapidamente! Expansão adiabática!',
                'zh-CN': '快速冷却中！绝热膨胀！',
                'zh-TW': '快速冷卻中！絕熱膨脹！',
            }
        if (dU < 0)
            return {
                ko: '온도가 내려가고 있어',
                en: 'Temperature is dropping',
                ja: '温度が下がっているよ',
                es: 'La temperatura está bajando',
                pt: 'A temperatura está caindo',
                'zh-CN': '温度正在下降',
                'zh-TW': '溫度正在下降',
            }
        if (dU < 100)
            return {
                ko: '에너지 변화가 작아',
                en: 'Small energy change',
                ja: 'エネルギー変化が小さいよ',
                es: 'Pequeño cambio de energía',
                pt: 'Pequena mudança de energia',
                'zh-CN': '能量变化很小',
                'zh-TW': '能量變化很小',
            }
        if (dU < 300)
            return {
                ko: '온도가 올라가고 있어',
                en: 'Temperature is rising',
                ja: '温度が上がっているよ',
                es: 'La temperatura está subiendo',
                pt: 'A temperatura está subindo',
                'zh-CN': '温度正在上升',
                'zh-TW': '溫度正在上升',
            }
        return {
            ko: '급격히 뜨거워지고 있어!',
            en: 'Heating up rapidly!',
            ja: '急激に熱くなっている！',
            es: '¡Calentándose rápidamente!',
            pt: 'Aquecendo rapidamente!',
            'zh-CN': '快速升温中！',
            'zh-TW': '快速升溫中！',
        }
    },
}
