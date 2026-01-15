import { LocalizedText } from '@/utils/localization'

export type AchievementCategory = 'learning' | 'combat' | 'collection' | 'mastery'

export interface Achievement {
    id: string
    category: AchievementCategory
    icon: string
    name: LocalizedText
    description: LocalizedText
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
        name: { ko: '첫 발견', en: 'First Discovery', ja: '初めての発見' },
        description: {
            ko: '첫 번째 공식을 학습하세요',
            en: 'Study your first formula',
            ja: '最初の公式を学習しよう',
        },
        condition: { type: 'formulas', value: 1 },
    },
    {
        id: 'curious-mind',
        category: 'learning',
        icon: '🧪',
        name: { ko: '호기심', en: 'Curious Mind', ja: '好奇心' },
        description: {
            ko: '5개의 공식을 학습하세요',
            en: 'Study 5 formulas',
            ja: '5つの公式を学習しよう',
        },
        condition: { type: 'formulas', value: 5 },
    },
    {
        id: 'scholar',
        category: 'learning',
        icon: '📚',
        name: { ko: '학자', en: 'Scholar', ja: '学者' },
        description: {
            ko: '15개의 공식을 학습하세요',
            en: 'Study 15 formulas',
            ja: '15の公式を学習しよう',
        },
        condition: { type: 'formulas', value: 15 },
    },
    {
        id: 'physicist',
        category: 'learning',
        icon: '🎓',
        name: { ko: '물리학자', en: 'Physicist', ja: '物理学者' },
        description: {
            ko: '35개의 모든 공식을 학습하세요',
            en: 'Study all 35 formulas',
            ja: '35の公式を全て学習しよう',
        },
        condition: { type: 'formulas', value: 35 },
    },

    // ============ Combat (전투) ============
    {
        id: 'first-blood',
        category: 'combat',
        icon: '⚔️',
        name: { ko: '첫 처치', en: 'First Blood', ja: '初撃破' },
        description: {
            ko: '첫 번째 적을 처치하세요',
            en: 'Defeat your first enemy',
            ja: '最初の敵を倒そう',
        },
        condition: { type: 'kills', value: 1 },
    },
    {
        id: 'hunter',
        category: 'combat',
        icon: '🏹',
        name: { ko: '사냥꾼', en: 'Hunter', ja: 'ハンター' },
        description: {
            ko: '총 100마리의 적을 처치하세요',
            en: 'Defeat 100 enemies total',
            ja: '合計100体の敵を倒そう',
        },
        condition: { type: 'kills', value: 100 },
    },
    {
        id: 'exterminator',
        category: 'combat',
        icon: '💀',
        name: { ko: '섬멸자', en: 'Exterminator', ja: '殲滅者' },
        description: {
            ko: '총 500마리의 적을 처치하세요',
            en: 'Defeat 500 enemies total',
            ja: '合計500体の敵を倒そう',
        },
        condition: { type: 'kills', value: 500 },
    },
    {
        id: 'survivor',
        category: 'combat',
        icon: '⏱️',
        name: { ko: '생존자', en: 'Survivor', ja: 'サバイバー' },
        description: {
            ko: '3분 동안 생존하세요',
            en: 'Survive for 3 minutes',
            ja: '3分間生き残ろう',
        },
        condition: { type: 'survivalTime', value: 180 }, // 180 seconds
    },

    // ============ Collection (수집) ============
    {
        id: 'first-friend',
        category: 'collection',
        icon: '👋',
        name: { ko: '첫 친구', en: 'First Friend', ja: '最初の仲間' },
        description: {
            ko: '첫 번째 워블을 해금하세요',
            en: 'Unlock your first Wobble',
            ja: '最初のワブルを解放しよう',
        },
        condition: { type: 'wobbles', value: 1 },
    },
    {
        id: 'curator',
        category: 'collection',
        icon: '🏆',
        name: { ko: '수집가', en: 'Curator', ja: 'コレクター' },
        description: {
            ko: '7개의 모든 워블을 해금하세요',
            en: 'Unlock all 7 Wobbles',
            ja: '7体のワブルを全て解放しよう',
        },
        condition: { type: 'wobbles', value: 7 },
    },

    // ============ Mastery (마스터리) ============
    {
        id: 'rank-c',
        category: 'mastery',
        icon: '🥉',
        name: { ko: 'C 랭크', en: 'C Rank', ja: 'Cランク' },
        description: {
            ko: 'C 랭크 이상을 달성하세요',
            en: 'Achieve C rank or higher',
            ja: 'Cランク以上を達成しよう',
        },
        condition: { type: 'rank', value: 'C' },
    },
    {
        id: 'rank-b',
        category: 'mastery',
        icon: '🥈',
        name: { ko: 'B 랭크', en: 'B Rank', ja: 'Bランク' },
        description: {
            ko: 'B 랭크 이상을 달성하세요',
            en: 'Achieve B rank or higher',
            ja: 'Bランク以上を達成しよう',
        },
        condition: { type: 'rank', value: 'B' },
    },
    {
        id: 'rank-a',
        category: 'mastery',
        icon: '🥇',
        name: { ko: 'A 랭크', en: 'A Rank', ja: 'Aランク' },
        description: {
            ko: 'A 랭크 이상을 달성하세요',
            en: 'Achieve A rank or higher',
            ja: 'Aランク以上を達成しよう',
        },
        condition: { type: 'rank', value: 'A' },
    },
    {
        id: 'rank-s',
        category: 'mastery',
        icon: '👑',
        name: { ko: 'S 랭크', en: 'S Rank', ja: 'Sランク' },
        description: {
            ko: '전설의 S 랭크를 달성하세요',
            en: 'Achieve the legendary S rank',
            ja: '伝説のSランクを達成しよう',
        },
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
export const CATEGORY_INFO: Record<AchievementCategory, { name: LocalizedText; color: string }> = {
    learning: { name: { ko: '학습', en: 'Learning', ja: '学習' }, color: '#3498db' },
    combat: { name: { ko: '전투', en: 'Combat', ja: '戦闘' }, color: '#e74c3c' },
    collection: { name: { ko: '수집', en: 'Collection', ja: '収集' }, color: '#9b59b6' },
    mastery: { name: { ko: '마스터리', en: 'Mastery', ja: 'マスタリー' }, color: '#f1c40f' },
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
