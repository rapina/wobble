import { Formula } from './types'
import { colors } from '../styles/colors'

export const newtonSecond: Formula = {
    id: 'newton-second',
    name: {
        ko: '뉴턴 제2법칙',
        en: "Newton's Second Law",
        ja: 'ニュートンの第二法則',
        es: 'Segunda Ley de Newton',
        pt: 'Segunda Lei de Newton',
        'zh-CN': '牛顿第二定律',
        'zh-TW': '牛頓第二定律',
    },
    expression: 'F = ma',
    description: {
        ko: '힘은 질량과 가속도의 곱과 같다',
        en: 'Force equals mass times acceleration',
        ja: '力は質量と加速度の積に等しい',
        es: 'La fuerza es igual a la masa por la aceleración',
        pt: 'A força é igual à massa vezes a aceleração',
        'zh-CN': '力等于质量乘以加速度',
        'zh-TW': '力等於質量乘以加速度',
    },
    simulationHint: {
        ko: '캐릭터에 힘이 가해질 때 질량에 따라 가속도가 달라지는 모습',
        en: 'Shows how acceleration changes based on mass when force is applied',
        ja: '力が加わったとき、質量によって加速度がどう変わるかを表示',
        es: 'Muestra cómo cambia la aceleración según la masa cuando se aplica fuerza',
        pt: 'Mostra como a aceleração muda com base na massa quando uma força é aplicada',
        'zh-CN': '显示施加力时加速度如何随质量变化',
        'zh-TW': '顯示施加力時加速度如何隨質量變化',
    },
    applications: {
        ko: [
            '자동차 급브레이크 시 필요한 제동력 계산',
            '로켓 발사 시 필요한 추진력 설계',
            '엘리베이터 가속 시 케이블 장력 계산',
            '스포츠에서 공을 차거나 던질 때 힘 분석',
        ],
        en: [
            'Calculating braking force for emergency stops',
            'Designing thrust for rocket launches',
            'Calculating cable tension during elevator acceleration',
            'Analyzing force when kicking or throwing a ball in sports',
        ],
        ja: [
            '急ブレーキ時の制動力計算',
            'ロケット打ち上げの推進力設計',
            'エレベーター加速時のケーブル張力計算',
            'スポーツでボールを蹴る・投げる時の力分析',
        ],
        es: [
            'Cálculo de fuerza de frenado en paradas de emergencia',
            'Diseño de empuje para lanzamiento de cohetes',
            'Cálculo de tensión del cable durante aceleración del ascensor',
            'Análisis de fuerza al patear o lanzar una pelota en deportes',
        ],
        pt: [
            'Cálculo da força de frenagem em paradas de emergência',
            'Projeto de empuxo para lançamento de foguetes',
            'Cálculo da tensão do cabo durante aceleração do elevador',
            'Análise de força ao chutar ou arremessar uma bola em esportes',
        ],
        'zh-CN': [
            '计算紧急制动所需的制动力',
            '设计火箭发射所需的推力',
            '计算电梯加速时的钢缆张力',
            '分析运动中踢球或投掷时的力',
        ],
        'zh-TW': [
            '計算緊急制動所需的制動力',
            '設計火箭發射所需的推力',
            '計算電梯加速時的鋼纜張力',
            '分析運動中踢球或投擲時的力',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'm',
            name: { ko: '질량', en: 'Mass', ja: '質量', es: 'Masa', pt: 'Massa', 'zh-CN': '质量', 'zh-TW': '質量' },
            role: 'input',
            unit: 'kg',
            range: [1, 100],
            default: 10,
            visual: {
                property: 'size',
                scale: (value: number) => 40 + value * 1.2,
                color: colors.mass,
            },
        },
        {
            symbol: 'a',
            name: { ko: '가속도', en: 'Acceleration', ja: '加速度', es: 'Aceleración', pt: 'Aceleração', 'zh-CN': '加速度', 'zh-TW': '加速度' },
            role: 'input',
            unit: 'm/s²',
            range: [0.1, 20],
            default: 5,
            visual: {
                property: 'stretch',
                scale: (value: number) => 1 + value * 0.05, // More visible stretch
                color: colors.velocity,
            },
        },
        {
            symbol: 'F',
            name: { ko: '힘', en: 'Force', ja: '力', es: 'Fuerza', pt: 'Força', 'zh-CN': '力', 'zh-TW': '力' },
            role: 'output',
            unit: 'N',
            range: [0, 2000],
            default: 50,
            visual: {
                property: 'shake',
                scale: (value: number) => Math.min(value * 0.02, 10), // More visible shake
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const a = inputs.a ?? 5
        return {
            F: m * a,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const m = inputs.m ?? 10
        const a = inputs.a ?? 5
        const F = m * a
        return `F = ${m.toFixed(0)} × ${a.toFixed(1)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'linear',
        connections: [
            { from: 'm', to: 'a', operator: '×' },
            { from: 'a', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['m', 'a'],
    },
    discoveries: [
        {
            id: 'heavy-acceleration',
            mission: {
                ko: '질량 m을 최대로 높이고 가속도 a를 10 이상으로 설정해봐!',
                en: 'Set mass m to max and acceleration a above 10!',
                ja: '質量mを最大にして、加速度aを10以上に設定してみよう！',
                es: '¡Pon la masa m al máximo y la aceleración a por encima de 10!',
                pt: 'Coloque a massa m no máximo e a aceleração a acima de 10!',
                'zh-CN': '将质量m调到最大，加速度a设置到10以上！',
                'zh-TW': '將質量m調到最大，加速度a設置到10以上！',
            },
            result: {
                ko: '무거운 물체를 빠르게 가속하려면 엄청난 힘이 필요해!',
                en: 'Accelerating a heavy object quickly requires enormous force!',
                ja: '重い物体を速く加速するには、大きな力が必要だ！',
                es: '¡Acelerar un objeto pesado rápidamente requiere una fuerza enorme!',
                pt: 'Acelerar um objeto pesado rapidamente requer uma força enorme!',
                'zh-CN': '快速加速重物需要巨大的力量！',
                'zh-TW': '快速加速重物需要巨大的力量！',
            },
            icon: '💪',
            condition: (vars) => vars['m'] >= 90 && vars['a'] >= 10,
        },
        {
            id: 'light-high-accel',
            mission: {
                ko: '질량을 5 이하로 낮추고 가속도를 최대로 올려봐!',
                en: 'Lower mass below 5 and maximize acceleration!',
                ja: '質量を5以下にして、加速度を最大にしてみよう！',
                es: '¡Reduce la masa por debajo de 5 y maximiza la aceleración!',
                pt: 'Reduza a massa abaixo de 5 e maximize a aceleração!',
                'zh-CN': '将质量降到5以下，加速度调到最大！',
                'zh-TW': '將質量降到5以下，加速度調到最大！',
            },
            result: {
                ko: '가벼운 물체는 작은 힘으로도 빠르게 가속돼!',
                en: 'Light objects accelerate quickly with little force!',
                ja: '軽い物体は小さな力でも速く加速する！',
                es: '¡Los objetos ligeros aceleran rápidamente con poca fuerza!',
                pt: 'Objetos leves aceleram rapidamente com pouca força!',
                'zh-CN': '轻的物体用很小的力就能快速加速！',
                'zh-TW': '輕的物體用很小的力就能快速加速！',
            },
            icon: '🪶',
            condition: (vars) => vars['m'] <= 5 && vars['a'] >= 18,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 1)
            return {
                ko: '깃털처럼 가벼운 힘이야!',
                en: 'Light as a feather!',
                ja: '羽のように軽い力だ！',
                es: '¡Ligero como una pluma!',
                pt: 'Leve como uma pena!',
                'zh-CN': '像羽毛一样轻的力！',
                'zh-TW': '像羽毛一樣輕的力！',
            }
        if (F < 10)
            return {
                ko: '종이컵을 밀 수 있는 힘이야',
                en: 'Enough to push a paper cup',
                ja: '紙コップを押せる力だ',
                es: 'Suficiente para empujar un vaso de papel',
                pt: 'Suficiente para empurrar um copo de papel',
                'zh-CN': '能推动纸杯的力',
                'zh-TW': '能推動紙杯的力',
            }
        if (F < 50)
            return {
                ko: '문을 여는 정도의 힘이야',
                en: 'About the force to open a door',
                ja: 'ドアを開けるくらいの力だ',
                es: 'Aproximadamente la fuerza para abrir una puerta',
                pt: 'Aproximadamente a força para abrir uma porta',
                'zh-CN': '大约能开门的力',
                'zh-TW': '大約能開門的力',
            }
        if (F < 100)
            return {
                ko: '의자를 밀 수 있는 힘이야',
                en: 'Enough to push a chair',
                ja: '椅子を押せる力だ',
                es: 'Suficiente para empujar una silla',
                pt: 'Suficiente para empurrar uma cadeira',
                'zh-CN': '能推动椅子的力',
                'zh-TW': '能推動椅子的力',
            }
        if (F < 500)
            return {
                ko: '자전거를 밀 수 있는 힘이야',
                en: 'Enough to push a bicycle',
                ja: '自転車を押せる力だ',
                es: 'Suficiente para empujar una bicicleta',
                pt: 'Suficiente para empurrar uma bicicleta',
                'zh-CN': '能推动自行车的力',
                'zh-TW': '能推動自行車的力',
            }
        if (F < 1000)
            return {
                ko: '성인 한 명을 밀 수 있는 힘!',
                en: 'Enough to push an adult!',
                ja: '大人一人を押せる力！',
                es: '¡Suficiente para empujar a un adulto!',
                pt: 'Suficiente para empurrar um adulto!',
                'zh-CN': '能推动一个成年人的力！',
                'zh-TW': '能推動一個成年人的力！',
            }
        return {
            ko: '엄청난 힘이야! 차도 밀 수 있어',
            en: 'Massive force! Could push a car',
            ja: 'すごい力だ！車も押せる',
            es: '¡Fuerza enorme! Podría empujar un coche',
            pt: 'Força enorme! Poderia empurrar um carro',
            'zh-CN': '巨大的力量！能推动汽车',
            'zh-TW': '巨大的力量！能推動汽車',
        }
    },
}
