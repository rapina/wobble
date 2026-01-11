export type AchievementCategory = 'learning' | 'combat' | 'collection' | 'mastery'

export interface Achievement {
    id: string
    category: AchievementCategory
    icon: string
    nameEn: string
    nameKo: string
    descriptionEn: string
    descriptionKo: string
    // Condition for unlocking
    condition: {
        type: 'formulas' | 'kills' | 'survivalTime' | 'wobbles' | 'rank'
        value: number | string
    }
}

export const ACHIEVEMENTS: Achievement[] = [
    // ============ Learning (학습) ============
    {
        id: 'first-formula',
        category: 'learning',
        icon: '🔬',
        nameEn: 'First Discovery',
        nameKo: '첫 발견',
        descriptionEn: 'Study your first formula',
        descriptionKo: '첫 번째 공식을 학습하세요',
        condition: { type: 'formulas', value: 1 },
    },
    {
        id: 'curious-mind',
        category: 'learning',
        icon: '🧪',
        nameEn: 'Curious Mind',
        nameKo: '호기심',
        descriptionEn: 'Study 5 formulas',
        descriptionKo: '5개의 공식을 학습하세요',
        condition: { type: 'formulas', value: 5 },
    },
    {
        id: 'scholar',
        category: 'learning',
        icon: '📚',
        nameEn: 'Scholar',
        nameKo: '학자',
        descriptionEn: 'Study 15 formulas',
        descriptionKo: '15개의 공식을 학습하세요',
        condition: { type: 'formulas', value: 15 },
    },
    {
        id: 'physicist',
        category: 'learning',
        icon: '🎓',
        nameEn: 'Physicist',
        nameKo: '물리학자',
        descriptionEn: 'Study all 35 formulas',
        descriptionKo: '35개의 모든 공식을 학습하세요',
        condition: { type: 'formulas', value: 35 },
    },

    // ============ Combat (전투) ============
    {
        id: 'first-blood',
        category: 'combat',
        icon: '⚔️',
        nameEn: 'First Blood',
        nameKo: '첫 처치',
        descriptionEn: 'Defeat your first enemy',
        descriptionKo: '첫 번째 적을 처치하세요',
        condition: { type: 'kills', value: 1 },
    },
    {
        id: 'hunter',
        category: 'combat',
        icon: '🏹',
        nameEn: 'Hunter',
        nameKo: '사냥꾼',
        descriptionEn: 'Defeat 100 enemies total',
        descriptionKo: '총 100마리의 적을 처치하세요',
        condition: { type: 'kills', value: 100 },
    },
    {
        id: 'exterminator',
        category: 'combat',
        icon: '💀',
        nameEn: 'Exterminator',
        nameKo: '섬멸자',
        descriptionEn: 'Defeat 500 enemies total',
        descriptionKo: '총 500마리의 적을 처치하세요',
        condition: { type: 'kills', value: 500 },
    },
    {
        id: 'survivor',
        category: 'combat',
        icon: '⏱️',
        nameEn: 'Survivor',
        nameKo: '생존자',
        descriptionEn: 'Survive for 3 minutes',
        descriptionKo: '3분 동안 생존하세요',
        condition: { type: 'survivalTime', value: 180 }, // 180 seconds
    },

    // ============ Collection (수집) ============
    {
        id: 'first-friend',
        category: 'collection',
        icon: '👋',
        nameEn: 'First Friend',
        nameKo: '첫 친구',
        descriptionEn: 'Unlock your first Wobble',
        descriptionKo: '첫 번째 워블을 해금하세요',
        condition: { type: 'wobbles', value: 1 },
    },
    {
        id: 'curator',
        category: 'collection',
        icon: '🏆',
        nameEn: 'Curator',
        nameKo: '수집가',
        descriptionEn: 'Unlock all 7 Wobbles',
        descriptionKo: '7개의 모든 워블을 해금하세요',
        condition: { type: 'wobbles', value: 7 },
    },

    // ============ Mastery (마스터리) ============
    {
        id: 'rank-c',
        category: 'mastery',
        icon: '🥉',
        nameEn: 'C Rank',
        nameKo: 'C 랭크',
        descriptionEn: 'Achieve C rank or higher',
        descriptionKo: 'C 랭크 이상을 달성하세요',
        condition: { type: 'rank', value: 'C' },
    },
    {
        id: 'rank-b',
        category: 'mastery',
        icon: '🥈',
        nameEn: 'B Rank',
        nameKo: 'B 랭크',
        descriptionEn: 'Achieve B rank or higher',
        descriptionKo: 'B 랭크 이상을 달성하세요',
        condition: { type: 'rank', value: 'B' },
    },
    {
        id: 'rank-a',
        category: 'mastery',
        icon: '🥇',
        nameEn: 'A Rank',
        nameKo: 'A 랭크',
        descriptionEn: 'Achieve A rank or higher',
        descriptionKo: 'A 랭크 이상을 달성하세요',
        condition: { type: 'rank', value: 'A' },
    },
    {
        id: 'rank-s',
        category: 'mastery',
        icon: '👑',
        nameEn: 'S Rank',
        nameKo: 'S 랭크',
        descriptionEn: 'Achieve the legendary S rank',
        descriptionKo: '전설의 S 랭크를 달성하세요',
        condition: { type: 'rank', value: 'S' },
    },
]

// Helper to get achievement by ID
export function getAchievement(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find((a) => a.id === id)
}

// Helper to get achievements by category
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return ACHIEVEMENTS.filter((a) => a.category === category)
}

// Category display info
export const CATEGORY_INFO: Record<
    AchievementCategory,
    { nameEn: string; nameKo: string; color: string }
> = {
    learning: { nameEn: 'Learning', nameKo: '학습', color: '#3498db' },
    combat: { nameEn: 'Combat', nameKo: '전투', color: '#e74c3c' },
    collection: { nameEn: 'Collection', nameKo: '수집', color: '#9b59b6' },
    mastery: { nameEn: 'Mastery', nameKo: '마스터리', color: '#f1c40f' },
}

// Rank priority for comparison
export const RANK_PRIORITY: Record<string, number> = {
    S: 5,
    A: 4,
    B: 3,
    C: 2,
    D: 1,
}

// Check if a rank meets the required rank
export function meetsRankRequirement(currentRank: string, requiredRank: string): boolean {
    return (RANK_PRIORITY[currentRank] || 0) >= (RANK_PRIORITY[requiredRank] || 0)
}
