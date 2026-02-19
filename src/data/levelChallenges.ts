import { LocalizedText } from '@/utils/localization'

export type LevelChallengeId = 'formula-discovery' | 'challenge-solver'

export interface LevelThreshold {
    level: number
    requirement: number // 해당 레벨 달성에 필요한 누적 값
    title: LocalizedText // 레벨별 칭호
}

export interface LevelChallenge {
    id: LevelChallengeId
    icon: string
    name: LocalizedText
    description: LocalizedText
    color: string
    // 레벨 임계값 배열 (레벨 1부터 시작)
    levels: LevelThreshold[]
}

export const LEVEL_CHALLENGES: LevelChallenge[] = [
    {
        id: 'formula-discovery',
        icon: '🔬',
        name: {
            ko: '공식 발견',
            en: 'Formula Discovery',
            ja: '公式発見',
            'zh-CN': '公式发现',
            'zh-TW': '公式發現',
            es: 'Descubrimiento',
            pt: 'Descoberta',
        },
        description: {
            ko: '새로운 물리 공식을 발견하세요',
            en: 'Discover new physics formulas',
            ja: '新しい物理公式を発見しよう',
            'zh-CN': '发现新的物理公式',
            'zh-TW': '發現新的物理公式',
            es: 'Descubre nuevas fórmulas de física',
            pt: 'Descubra novas fórmulas de física',
        },
        color: '#3498db',
        levels: [
            {
                level: 1,
                requirement: 1,
                title: {
                    ko: '초보 탐험가',
                    en: 'Novice Explorer',
                    ja: '初心者探検家',
                    'zh-CN': '初级探险家',
                    'zh-TW': '初級探險家',
                    es: 'Explorador Novato',
                    pt: 'Explorador Novato',
                },
            },
            {
                level: 2,
                requirement: 5,
                title: {
                    ko: '호기심 많은 학생',
                    en: 'Curious Student',
                    ja: '好奇心旺盛な学生',
                    'zh-CN': '好奇的学生',
                    'zh-TW': '好奇的學生',
                    es: 'Estudiante Curioso',
                    pt: 'Estudante Curioso',
                },
            },
            {
                level: 3,
                requirement: 15,
                title: {
                    ko: '열정적인 학자',
                    en: 'Passionate Scholar',
                    ja: '情熱的な学者',
                    'zh-CN': '热情的学者',
                    'zh-TW': '熱情的學者',
                    es: 'Erudito Apasionado',
                    pt: 'Estudioso Apaixonado',
                },
            },
            {
                level: 4,
                requirement: 30,
                title: {
                    ko: '숙련된 연구원',
                    en: 'Skilled Researcher',
                    ja: '熟練した研究員',
                    'zh-CN': '熟练的研究员',
                    'zh-TW': '熟練的研究員',
                    es: 'Investigador Experto',
                    pt: 'Pesquisador Habilidoso',
                },
            },
            {
                level: 5,
                requirement: 50,
                title: {
                    ko: '물리학 박사',
                    en: 'Physics Doctor',
                    ja: '物理学博士',
                    'zh-CN': '物理学博士',
                    'zh-TW': '物理學博士',
                    es: 'Doctor en Física',
                    pt: 'Doutor em Física',
                },
            },
            {
                level: 6,
                requirement: 75,
                title: {
                    ko: '저명한 교수',
                    en: 'Distinguished Professor',
                    ja: '著名な教授',
                    'zh-CN': '著名教授',
                    'zh-TW': '著名教授',
                    es: 'Profesor Distinguido',
                    pt: 'Professor Ilustre',
                },
            },
            {
                level: 7,
                requirement: 100,
                title: {
                    ko: '전설의 과학자',
                    en: 'Legendary Scientist',
                    ja: '伝説の科学者',
                    'zh-CN': '传奇科学家',
                    'zh-TW': '傳奇科學家',
                    es: 'Científico Legendario',
                    pt: 'Cientista Lendário',
                },
            },
        ],
    },
    {
        id: 'challenge-solver',
        icon: '🧩',
        name: {
            ko: '문제 풀이',
            en: 'Problem Solving',
            ja: '問題解決',
            'zh-CN': '问题解决',
            'zh-TW': '問題解決',
            es: 'Resolución',
            pt: 'Solução',
        },
        description: {
            ko: '디스커버리 모드에서 문제를 해결하세요',
            en: 'Solve problems in Discovery mode',
            ja: 'ディスカバリーモードで問題を解こう',
            'zh-CN': '在探索模式中解决问题',
            'zh-TW': '在探索模式中解決問題',
            es: 'Resuelve problemas en modo Descubrimiento',
            pt: 'Resolva problemas no modo Descoberta',
        },
        color: '#9b59b6',
        levels: [
            {
                level: 1,
                requirement: 1,
                title: {
                    ko: '첫 도전',
                    en: 'First Step',
                    ja: '最初の挑戦',
                    'zh-CN': '第一步',
                    'zh-TW': '第一步',
                    es: 'Primer Paso',
                    pt: 'Primeiro Passo',
                },
            },
            {
                level: 2,
                requirement: 10,
                title: {
                    ko: '문제 해결사',
                    en: 'Problem Solver',
                    ja: '問題解決者',
                    'zh-CN': '问题解决者',
                    'zh-TW': '問題解決者',
                    es: 'Solucionador',
                    pt: 'Solucionador',
                },
            },
            {
                level: 3,
                requirement: 25,
                title: {
                    ko: '논리적 사고가',
                    en: 'Logical Thinker',
                    ja: '論理的思考者',
                    'zh-CN': '逻辑思考者',
                    'zh-TW': '邏輯思考者',
                    es: 'Pensador Lógico',
                    pt: 'Pensador Lógico',
                },
            },
            {
                level: 4,
                requirement: 50,
                title: {
                    ko: '분석 전문가',
                    en: 'Analysis Expert',
                    ja: '分析専門家',
                    'zh-CN': '分析专家',
                    'zh-TW': '分析專家',
                    es: 'Experto en Análisis',
                    pt: 'Especialista em Análise',
                },
            },
            {
                level: 5,
                requirement: 100,
                title: {
                    ko: '마스터 솔버',
                    en: 'Master Solver',
                    ja: 'マスターソルバー',
                    'zh-CN': '大师级解题者',
                    'zh-TW': '大師級解題者',
                    es: 'Maestro Solucionador',
                    pt: 'Mestre Solucionador',
                },
            },
            {
                level: 6,
                requirement: 200,
                title: {
                    ko: '천재 두뇌',
                    en: 'Genius Mind',
                    ja: '天才頭脳',
                    'zh-CN': '天才头脑',
                    'zh-TW': '天才頭腦',
                    es: 'Mente Genial',
                    pt: 'Mente Genial',
                },
            },
            {
                level: 7,
                requirement: 500,
                title: {
                    ko: '불가능은 없다',
                    en: 'Nothing Impossible',
                    ja: '不可能はない',
                    'zh-CN': '没有不可能',
                    'zh-TW': '沒有不可能',
                    es: 'Nada es Imposible',
                    pt: 'Nada é Impossível',
                },
            },
        ],
    },
]

// Helper to get level challenge by ID
export function getLevelChallenge(id: LevelChallengeId): LevelChallenge | undefined {
    return LEVEL_CHALLENGES.find((c) => c.id === id)
}

// Helper to calculate current level from progress
export function calculateLevel(
    challenge: LevelChallenge,
    currentValue: number
): {
    level: number
    currentTitle: LocalizedText
    nextLevel: LevelThreshold | null
    progress: number // 0-100 percentage to next level
} {
    let currentLevel = 0
    let currentTitle = challenge.levels[0].title
    let nextLevel: LevelThreshold | null = challenge.levels[0]

    for (const threshold of challenge.levels) {
        if (currentValue >= threshold.requirement) {
            currentLevel = threshold.level
            currentTitle = threshold.title
            nextLevel = challenge.levels[threshold.level] || null // next level or null if max
        } else {
            break
        }
    }

    // Calculate progress to next level
    let progress = 100
    if (nextLevel && currentLevel < challenge.levels.length) {
        const prevRequirement =
            currentLevel > 0 ? challenge.levels[currentLevel - 1].requirement : 0
        const range = nextLevel.requirement - prevRequirement
        const currentProgress = currentValue - prevRequirement
        progress = Math.min((currentProgress / range) * 100, 100)
    }

    return {
        level: currentLevel,
        currentTitle,
        nextLevel,
        progress,
    }
}
