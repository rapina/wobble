import { Formula } from './types'
import { colors } from '../styles/colors'

export const hooke: Formula = {
    id: 'hooke',
    name: {
        ko: '훅의 법칙',
        en: "Hooke's Law",
        ja: 'フックの法則',
        es: 'Ley de Hooke',
        pt: 'Lei de Hooke',
        'zh-CN': '胡克定律',
        'zh-TW': '虎克定律',
    },
    expression: 'F = -kx',
    description: {
        ko: '스프링이 늘어나거나 줄어든 길이에 비례하여 복원력이 작용한다',
        en: 'Restoring force is proportional to the spring displacement',
        ja: 'バネの伸縮に比例して復元力が働く',
        es: 'La fuerza de restauración es proporcional al desplazamiento del resorte',
        pt: 'A força restauradora é proporcional ao deslocamento da mola',
        'zh-CN': '弹簧的恢复力与其伸长或压缩的长度成正比',
        'zh-TW': '彈簧的恢復力與其伸長或壓縮的長度成正比',
    },
    simulationHint: {
        ko: '스프링이 늘어나고 줄어들며 복원력이 작용하는 모습',
        en: 'Shows a spring stretching and compressing with restoring force',
        ja: 'バネが伸び縮みしながら復元力が働く様子',
        es: 'Muestra un resorte estirándose y comprimiéndose con fuerza de restauración',
        pt: 'Mostra uma mola esticando e comprimindo com força restauradora',
        'zh-CN': '显示弹簧伸缩时恢复力的作用',
        'zh-TW': '顯示彈簧伸縮時恢復力的作用',
    },
    applications: {
        ko: [
            '자동차 서스펜션 설계',
            '침대 매트리스의 탄성 조절',
            '체중계의 스프링 눈금 설계',
            '트램폴린과 방방이의 탄성 설계',
        ],
        en: [
            'Designing car suspension systems',
            'Adjusting mattress elasticity',
            'Designing spring scales for weight measurement',
            'Designing elasticity for trampolines and bouncy houses',
        ],
        ja: [
            '自動車のサスペンション設計',
            'マットレスの弾力性調整',
            '体重計のバネ目盛り設計',
            'トランポリンや遊具の弾性設計',
        ],
        es: [
            'Diseño de sistemas de suspensión de automóviles',
            'Ajuste de elasticidad de colchones',
            'Diseño de básculas de resorte para medición de peso',
            'Diseño de elasticidad para trampolines y castillos inflables',
        ],
        pt: [
            'Projeto de sistemas de suspensão de carros',
            'Ajuste de elasticidade de colchões',
            'Projeto de balanças de mola para medição de peso',
            'Projeto de elasticidade para trampolins e pula-pulas',
        ],
        'zh-CN': ['汽车悬挂系统设计', '调节床垫弹性', '设计弹簧秤刻度', '蹦床和充气城堡的弹性设计'],
        'zh-TW': [
            '汽車懸吊系統設計',
            '調節床墊彈性',
            '設計彈簧秤刻度',
            '彈跳床和充氣城堡的彈性設計',
        ],
    },
    category: 'mechanics',
    variables: [
        {
            symbol: 'k',
            name: {
                ko: '스프링 상수',
                en: 'Spring Constant',
                ja: 'バネ定数',
                es: 'Constante del resorte',
                pt: 'Constante da mola',
                'zh-CN': '弹簧常数',
                'zh-TW': '彈簧常數',
            },
            role: 'input',
            unit: 'N/m',
            range: [10, 100],
            default: 50,
            visual: {
                property: 'oscillate',
                scale: (value: number) => value / 10,
                color: colors.spring,
            },
        },
        {
            symbol: 'x',
            name: {
                ko: '변위',
                en: 'Displacement',
                ja: '変位',
                es: 'Desplazamiento',
                pt: 'Deslocamento',
                'zh-CN': '位移',
                'zh-TW': '位移',
            },
            role: 'input',
            unit: 'm',
            range: [0.1, 2],
            default: 0.5,
            visual: {
                property: 'stretch',
                scale: (value: number) => value * 50,
                color: colors.distance,
            },
        },
        {
            symbol: 'F',
            name: {
                ko: '복원력',
                en: 'Restoring Force',
                ja: '復元力',
                es: 'Fuerza restauradora',
                pt: 'Força restauradora',
                'zh-CN': '恢复力',
                'zh-TW': '恢復力',
            },
            role: 'output',
            unit: 'N',
            range: [0, 200],
            default: 25,
            visual: {
                property: 'size',
                scale: (value: number) => 30 + value * 0.3,
                color: colors.force,
            },
        },
    ],
    calculate: (inputs: Record<string, number>) => {
        const k = inputs.k ?? 50
        const x = inputs.x ?? 0.5
        return {
            F: k * x,
        }
    },
    formatCalculation: (inputs: Record<string, number>) => {
        const k = inputs.k ?? 50
        const x = inputs.x ?? 0.5
        const F = k * x
        return `F = ${k.toFixed(0)} × ${x.toFixed(2)} = ${F.toFixed(1)}`
    },
    layout: {
        type: 'spring',
        connections: [
            { from: 'k', to: 'x', operator: '×' },
            { from: 'x', to: 'F', operator: '=' },
        ],
    },
    displayLayout: {
        type: 'linear',
        output: 'F',
        numerator: ['k', 'x'],
    },
    discoveries: [
        {
            id: 'stiff-spring',
            mission: {
                ko: '스프링 상수 k를 80 이상으로 올려봐!',
                en: 'Raise spring constant k above 80!',
                ja: 'バネ定数kを80以上にしてみよう！',
                es: '¡Sube la constante del resorte k por encima de 80!',
                pt: 'Aumente a constante da mola k acima de 80!',
                'zh-CN': '把弹簧常数k提高到80以上！',
                'zh-TW': '把彈簧常數k提高到80以上！',
            },
            result: {
                ko: '딱딱한 스프링은 조금만 늘어나도 큰 힘으로 복원해!',
                en: 'A stiff spring restores with great force even with small stretch!',
                ja: '硬いバネは少し伸びただけでも大きな力で戻る！',
                es: '¡Un resorte rígido restaura con gran fuerza incluso con poco estiramiento!',
                pt: 'Uma mola rígida restaura com grande força mesmo com pouco estiramento!',
                'zh-CN': '硬弹簧即使只伸长一点也会产生很大的恢复力！',
                'zh-TW': '硬彈簧即使只伸長一點也會產生很大的恢復力！',
            },
            icon: '🔩',
            condition: (vars) => vars['k'] >= 80,
        },
        {
            id: 'max-stretch',
            mission: {
                ko: '변위 x를 최대(2m)로 늘려봐!',
                en: 'Stretch displacement x to maximum (2m)!',
                ja: '変位xを最大(2m)まで伸ばしてみよう！',
                es: '¡Estira el desplazamiento x al máximo (2m)!',
                pt: 'Estique o deslocamento x ao máximo (2m)!',
                'zh-CN': '把位移x拉伸到最大（2m）！',
                'zh-TW': '把位移x拉伸到最大（2m）！',
            },
            result: {
                ko: '스프링을 많이 늘리면 복원력이 엄청나게 커져! 너무 늘리면 스프링이 망가질 수 있어.',
                en: 'Stretching too far creates huge restoring force! Too much can damage the spring.',
                ja: 'バネを伸ばしすぎると復元力が大きくなる！伸ばしすぎるとバネが壊れることも。',
                es: '¡Estirar demasiado crea una fuerza restauradora enorme! Demasiado puede dañar el resorte.',
                pt: 'Esticar demais cria uma força restauradora enorme! Demais pode danificar a mola.',
                'zh-CN': '拉伸太多会产生巨大的恢复力！拉伸过度可能会损坏弹簧。',
                'zh-TW': '拉伸太多會產生巨大的恢復力！拉伸過度可能會損壞彈簧。',
            },
            icon: '⚠️',
            condition: (vars) => vars['x'] >= 1.8,
        },
    ],
    getInsight: (vars) => {
        const F = vars['F']
        if (F < 5)
            return {
                ko: '고무줄 살짝 당기는 힘이야',
                en: 'Lightly pulling a rubber band',
                ja: 'ゴムを軽く引く力',
                es: 'Tirando ligeramente de una banda elástica',
                pt: 'Puxando levemente um elástico',
                'zh-CN': '轻轻拉橡皮筋的力',
                'zh-TW': '輕輕拉橡皮筋的力',
            }
        if (F < 20)
            return {
                ko: '문구용 스프링 정도야',
                en: 'Like an office spring',
                ja: '文房具のバネくらい',
                es: 'Como un resorte de oficina',
                pt: 'Como uma mola de escritório',
                'zh-CN': '像办公用弹簧',
                'zh-TW': '像辦公用彈簧',
            }
        if (F < 50)
            return {
                ko: '볼펜 스프링 정도야',
                en: 'Like a pen spring',
                ja: 'ボールペンのバネくらい',
                es: 'Como un resorte de bolígrafo',
                pt: 'Como uma mola de caneta',
                'zh-CN': '像圆珠笔弹簧',
                'zh-TW': '像原子筆彈簧',
            }
        if (F < 100)
            return {
                ko: '침대 스프링 정도야',
                en: 'Like a bed spring',
                ja: 'ベッドのバネくらい',
                es: 'Como un resorte de cama',
                pt: 'Como uma mola de cama',
                'zh-CN': '像床垫弹簧',
                'zh-TW': '像床墊彈簧',
            }
        return {
            ko: '트램폴린 스프링급 힘!',
            en: 'Trampoline spring level force!',
            ja: 'トランポリンのバネ級の力！',
            es: '¡Fuerza nivel resorte de trampolín!',
            pt: 'Força nível mola de trampolim!',
            'zh-CN': '蹦床弹簧级别的力！',
            'zh-TW': '彈跳床彈簧級別的力！',
        }
    },
}
