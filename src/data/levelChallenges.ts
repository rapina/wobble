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
        name: { ko: '공식 발견', en: 'Formula Discovery', ja: '公式発見' },
        description: {
            ko: '새로운 물리 공식을 발견하세요',
            en: 'Discover new physics formulas',
            ja: '新しい物理公式を発見しよう',
        },
        color: '#3498db',
        levels: [
            {
                level: 1,
                requirement: 1,
                title: { ko: '초보 탐험가', en: 'Novice Explorer', ja: '初心者探検家' },
            },
            {
                level: 2,
                requirement: 5,
                title: { ko: '호기심 많은 학생', en: 'Curious Student', ja: '好奇心旺盛な学生' },
            },
            {
                level: 3,
                requirement: 15,
                title: { ko: '열정적인 학자', en: 'Passionate Scholar', ja: '情熱的な学者' },
            },
            {
                level: 4,
                requirement: 30,
                title: { ko: '숙련된 연구원', en: 'Skilled Researcher', ja: '熟練した研究員' },
            },
            {
                level: 5,
                requirement: 50,
                title: { ko: '물리학 박사', en: 'Physics Doctor', ja: '物理学博士' },
            },
            {
                level: 6,
                requirement: 75,
                title: { ko: '저명한 교수', en: 'Distinguished Professor', ja: '著名な教授' },
            },
            {
                level: 7,
                requirement: 100,
                title: { ko: '전설의 과학자', en: 'Legendary Scientist', ja: '伝説の科学者' },
            },
        ],
    },
    {
        id: 'challenge-solver',
        icon: '🧩',
        name: { ko: '문제 풀이', en: 'Problem Solving', ja: '問題解決' },
        description: {
            ko: '디스커버리 모드에서 문제를 해결하세요',
            en: 'Solve problems in Discovery mode',
            ja: 'ディスカバリーモードで問題を解こう',
        },
        color: '#9b59b6',
        levels: [
            {
                level: 1,
                requirement: 1,
                title: { ko: '첫 도전', en: 'First Step', ja: '最初の挑戦' },
            },
            {
                level: 2,
                requirement: 10,
                title: { ko: '문제 해결사', en: 'Problem Solver', ja: '問題解決者' },
            },
            {
                level: 3,
                requirement: 25,
                title: { ko: '논리적 사고가', en: 'Logical Thinker', ja: '論理的思考者' },
            },
            {
                level: 4,
                requirement: 50,
                title: { ko: '분석 전문가', en: 'Analysis Expert', ja: '分析専門家' },
            },
            {
                level: 5,
                requirement: 100,
                title: { ko: '마스터 솔버', en: 'Master Solver', ja: 'マスターソルバー' },
            },
            {
                level: 6,
                requirement: 200,
                title: { ko: '천재 두뇌', en: 'Genius Mind', ja: '天才頭脳' },
            },
            {
                level: 7,
                requirement: 500,
                title: { ko: '불가능은 없다', en: 'Nothing Impossible', ja: '不可能はない' },
            },
        ],
    },
]

// Helper to get level challenge by ID
export function getLevelChallenge(id: LevelChallengeId): LevelChallenge | undefined {
    return LEVEL_CHALLENGES.find((c) => c.id === id)
}

// Helper to calculate current level from progress
export function calculateLevel(challenge: LevelChallenge, currentValue: number): {
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
        const prevRequirement = currentLevel > 0 ? challenge.levels[currentLevel - 1].requirement : 0
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
