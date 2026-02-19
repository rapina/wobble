import { Formula } from './types'
import { colors } from '../styles/colors'

export const wave: Formula = {
    id: 'wave',
    name: {
        ko: '파동 속도',
        en: 'Wave Velocity',
        ja: '波動速度',
        es: 'Velocidad de Onda',
        pt: 'Velocidade de Onda',
        'zh-CN': '波速',
        'zh-TW': '波速',
    },
    expression: 'v = fλ',
    description: {
        ko: '파동이 전파되는 속도',
        en: 'Speed at which a wave propagates',
        ja: '波が伝わる速度',
        es: 'Velocidad a la que se propaga una onda',
        pt: 'Velocidade com que uma onda se propaga',
        'zh-CN': '波传播的速度',
        'zh-TW': '波傳播的速度',
    },
    simulationHint: {
        ko: '파동이 진동수와 파장에 따라 전파되는 모습',
        en: 'Shows a wave propagating based on frequency and wavelength',
        ja: '周波数と波長に応じて波が伝わる様子',
        es: 'Muestra una onda propagándose según la frecuencia y longitud de onda',
        pt: 'Mostra uma onda se propagando com base na frequência e comprimento de onda',
        'zh-CN': '显示波根据频率和波长传播的样子',
        'zh-TW': '顯示波根據頻率和波長傳播的樣子',
    },
    applications: {
        ko: [
            '라디오와 TV 방송 주파수 설계',
            '초음파 검사 장비의 해상도 계산',
            '악기의 음높이와 줄 길이 관계',
            '와이파이와 블루투스 통신 설계',
        ],
        en: [
            'Designing radio and TV broadcast frequencies',
            'Calculating ultrasound equipment resolution',
            'Relationship between musical pitch and string length',
            'Designing WiFi and Bluetooth communication',
        ],
        ja: [
            'ラジオやTV放送の周波数設計',
            '超音波検査機器の解像度計算',
            '楽器の音程と弦の長さの関係',
            'WiFiやBluetoothの通信設計',
        ],
        es: [
            'Diseño de frecuencias de radio y TV',
            'Cálculo de resolución de equipos de ultrasonido',
            'Relación entre tono musical y longitud de cuerda',
            'Diseño de comunicación WiFi y Bluetooth',
        ],
        pt: [
            'Projeto de frequências de rádio e TV',
            'Cálculo de resolução de equipamentos de ultrassom',
            'Relação entre tom musical e comprimento da corda',
            'Projeto de comunicação WiFi e Bluetooth',
        ],
        'zh-CN': [
            '设计无线电和电视广播频率',
            '计算超声波设备分辨率',
            '乐器音高与弦长的关系',
            '设计WiFi和蓝牙通信',
        ],
        'zh-TW': [
            '設計無線電和電視廣播頻率',
            '計算超音波設備解析度',
            '樂器音高與弦長的關係',
            '設計WiFi和藍牙通訊',
        ],
    },
    category: 'wave',
    variables: [
        {
            symbol: 'f',
            name: {
                ko: '진동수',
                en: 'Frequency',
                ja: '周波数',
                es: 'Frecuencia',
                pt: 'Frequência',
                'zh-CN': '频率',
                'zh-TW': '頻率',
            },
            role: 'input',
            unit: 'Hz',
            range: [0.5, 5],
            default: 2,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value,
                color: colors.time,
            },
        },
        {
            symbol: 'λ',
            name: {
                ko: '파장',
                en: 'Wavelength',
                ja: '波長',
                es: 'Longitud de Onda',
                pt: 'Comprimento de Onda',
                'zh-CN': '波长',
                'zh-TW': '波長',
            },
            role: 'input',
            unit: 'm',
            range: [1, 10],
            default: 3,
            visual: {
                property: 'distance',
                scale: (value: number) => value * 20,
                color: colors.distance,
            },
        },
        {
            symbol: 'v',
            name: {
                ko: '파동 속도',
                en: 'Wave Speed',
                ja: '波動速度',
                es: 'Velocidad de Onda',
                pt: 'Velocidade de Onda',
                'zh-CN': '波速',
                'zh-TW': '波速',
            },
            role: 'output',
            unit: 'm/s',
            range: [0, 50],
            default: 6,
            visual: {
                property: 'speed',
                scale: (value: number) => value * 0.5,
                color: colors.velocity,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const f = inputs.f ?? 2
        const lambda = inputs['λ'] ?? 3
        return {
            v: f * lambda,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const f = inputs.f ?? 2
        const lambda = inputs['λ'] ?? 3
        const v = f * lambda
        return `v = ${f.toFixed(1)} × ${lambda.toFixed(1)} = ${v.toFixed(1)}`
    },
    layout: {
        type: 'wave',
        connections: [
            { from: 'f', to: 'λ', operator: '×' },
            { from: 'λ', to: 'v', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'v',
        numerator: ['f', 'λ'],
    },
    discoveries: [
        {
            id: 'high-frequency',
            mission: {
                ko: '진동수 f를 4Hz 이상으로 올려봐!',
                en: 'Raise frequency f above 4Hz!',
                ja: '周波数fを4Hz以上にしてみよう！',
                es: '¡Sube la frecuencia f por encima de 4Hz!',
                pt: 'Aumente a frequência f acima de 4Hz!',
                'zh-CN': '把频率f提高到4Hz以上！',
                'zh-TW': '把頻率f提高到4Hz以上！',
            },
            result: {
                ko: '진동수가 높으면 빠르게 진동해! 높은 음은 진동수가 높은 소리야.',
                en: 'Higher frequency means faster vibration! High-pitched sounds have high frequency.',
                ja: '周波数が高いと速く振動する！高い音は周波数が高い音だ。',
                es: '¡Mayor frecuencia significa vibración más rápida! Los sonidos agudos tienen alta frecuencia.',
                pt: 'Maior frequência significa vibração mais rápida! Sons agudos têm frequência alta.',
                'zh-CN': '频率越高振动越快！高音就是频率高的声音。',
                'zh-TW': '頻率越高振動越快！高音就是頻率高的聲音。',
            },
            icon: '🎵',
            condition: (vars) => vars['f'] >= 4,
        },
        {
            id: 'long-wavelength',
            mission: {
                ko: '파장 λ를 8m 이상으로 늘려봐!',
                en: 'Extend wavelength λ above 8m!',
                ja: '波長λを8m以上にしてみよう！',
                es: '¡Extiende la longitud de onda λ por encima de 8m!',
                pt: 'Estenda o comprimento de onda λ acima de 8m!',
                'zh-CN': '把波长λ增加到8m以上！',
                'zh-TW': '把波長λ增加到8m以上！',
            },
            result: {
                ko: '파장이 길면 장애물을 잘 돌아가! AM 라디오가 건물 뒤에서도 들리는 이유야.',
                en: 'Long wavelengths bend around obstacles! This is why AM radio works behind buildings.',
                ja: '波長が長いと障害物を回り込む！AMラジオが建物の後ろでも聞こえる理由だ。',
                es: '¡Las ondas largas rodean obstáculos! Por eso la radio AM funciona detrás de edificios.',
                pt: 'Ondas longas contornam obstáculos! Por isso o rádio AM funciona atrás de prédios.',
                'zh-CN': '波长越长越容易绕过障碍物！这就是AM收音机在建筑物后面也能收到的原因。',
                'zh-TW': '波長越長越容易繞過障礙物！這就是AM收音機在建築物後面也能收到的原因。',
            },
            icon: '📻',
            condition: (vars) => vars['λ'] >= 8,
        },
    ],
    getInsight: (vars) => {
        const v = vars['v']
        if (v < 5)
            return {
                ko: '걷는 속도 정도야',
                en: 'Walking speed',
                ja: '歩く速度くらい',
                es: 'Velocidad de caminar',
                pt: 'Velocidade de caminhada',
                'zh-CN': '步行速度',
                'zh-TW': '步行速度',
            }
        if (v < 15)
            return {
                ko: '자전거 속도 정도야',
                en: 'Like cycling speed',
                ja: '自転車くらいの速度',
                es: 'Como velocidad de bicicleta',
                pt: 'Como velocidade de bicicleta',
                'zh-CN': '自行车速度',
                'zh-TW': '自行車速度',
            }
        if (v < 30)
            return {
                ko: '달리는 자동차 속도야',
                en: 'Like a car speed',
                ja: '車くらいの速度',
                es: 'Como velocidad de auto',
                pt: 'Como velocidade de carro',
                'zh-CN': '汽车速度',
                'zh-TW': '汽車速度',
            }
        if (v < 40)
            return {
                ko: '고속도로 속도야',
                en: 'Highway speed',
                ja: '高速道路くらいの速度',
                es: 'Velocidad de autopista',
                pt: 'Velocidade de rodovia',
                'zh-CN': '高速公路速度',
                'zh-TW': '高速公路速度',
            }
        return {
            ko: '빠른 파동이야!',
            en: 'Fast wave!',
            ja: '速い波だ！',
            es: '¡Onda rápida!',
            pt: 'Onda rápida!',
            'zh-CN': '快速波！',
            'zh-TW': '快速波！',
        }
    },
}
