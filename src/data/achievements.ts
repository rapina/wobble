import { LocalizedText } from '@/utils/localization'

export type AchievementCategory = 'sandbox' | 'game'

export type AchievementSubcategory =
    | 'collection' // 샌드박스 - 캐릭터 수집
    | 'survivor' // 게임 - 서바이버 모드
    | 'wobblediver' // 게임 - 워블다이버
    | 'wobblediver-run' // 게임 - 워블다이버 런 모드

export interface Achievement {
    id: string
    category: AchievementCategory
    subcategory: AchievementSubcategory
    icon: string
    name: LocalizedText
    description: LocalizedText
    // Condition for unlocking
    condition: {
        type:
            | 'wobbles'
            | 'kills'
            | 'survivalTime'
            | 'rank'
            | 'wobblediverDepth'
            | 'wobblediverScore'
            | 'wobblediverGames'
            | 'wobblediverRank'
            | 'wobblediverRunsCompleted'
            | 'wobblediverRunLength'
            | 'wobblediverPerfectRuns'
            | 'wobblediverElites'
            | 'wobblediverEvents'
        value: number | string
    }
}

export const ACHIEVEMENTS: Achievement[] = [
    // ============ Sandbox - Collection (수집) ============
    {
        id: 'first-friend',
        category: 'sandbox',
        subcategory: 'collection',
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
        category: 'sandbox',
        subcategory: 'collection',
        icon: '🏆',
        name: { ko: '수집가', en: 'Curator', ja: 'コレクター' },
        description: {
            ko: '모든 워블을 해금하세요',
            en: 'Unlock all Wobbles',
            ja: '全てのワブルを解放しよう',
        },
        condition: { type: 'wobbles', value: 7 },
    },

    // ============ Game - Survivor (서바이버) ============
    {
        id: 'first-blood',
        category: 'game',
        subcategory: 'survivor',
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
        category: 'game',
        subcategory: 'survivor',
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
        category: 'game',
        subcategory: 'survivor',
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
        category: 'game',
        subcategory: 'survivor',
        icon: '⏱️',
        name: { ko: '생존자', en: 'Survivor', ja: 'サバイバー' },
        description: {
            ko: '3분 동안 생존하세요',
            en: 'Survive for 3 minutes',
            ja: '3分間生き残ろう',
        },
        condition: { type: 'survivalTime', value: 180 }, // 180 seconds
    },
    {
        id: 'rank-c',
        category: 'game',
        subcategory: 'survivor',
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
        category: 'game',
        subcategory: 'survivor',
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
        category: 'game',
        subcategory: 'survivor',
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
        category: 'game',
        subcategory: 'survivor',
        icon: '👑',
        name: { ko: 'S 랭크', en: 'S Rank', ja: 'Sランク' },
        description: {
            ko: '전설의 S 랭크를 달성하세요',
            en: 'Achieve the legendary S rank',
            ja: '伝説のSランクを達成しよう',
        },
        condition: { type: 'rank', value: 'S' },
    },

    // ============ Game - Wobblediver (워블다이버) ============
    {
        id: 'first-dive',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🏊',
        name: { ko: '첫 다이빙', en: 'First Dive', ja: '初ダイブ' },
        description: {
            ko: '워블다이버 첫 플레이',
            en: 'Play Wobblediver for the first time',
            ja: 'ワブルダイバー初プレイ',
        },
        condition: { type: 'wobblediverGames', value: 1 },
    },
    {
        id: 'deep-diver',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🌊',
        name: { ko: '심해 탐험가', en: 'Deep Diver', ja: '深海探検家' },
        description: {
            ko: '깊이 10 도달',
            en: 'Reach depth 10',
            ja: '深度10到達',
        },
        condition: { type: 'wobblediverDepth', value: 10 },
    },
    {
        id: 'abyss-explorer',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🦑',
        name: { ko: '심연 탐험가', en: 'Abyss Explorer', ja: '深淵探検家' },
        description: {
            ko: '깊이 20 도달',
            en: 'Reach depth 20',
            ja: '深度20到達',
        },
        condition: { type: 'wobblediverDepth', value: 20 },
    },
    {
        id: 'perfect-escape',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '⭐',
        name: { ko: '완벽한 탈출', en: 'Perfect Escape', ja: '完璧な脱出' },
        description: {
            ko: '워블다이버 S랭크 달성',
            en: 'Achieve S rank in Wobblediver',
            ja: 'ワブルダイバーでSランク達成',
        },
        condition: { type: 'wobblediverRank', value: 'S' },
    },
    {
        id: 'veteran-diver',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🎮',
        name: { ko: '베테랑 다이버', en: 'Veteran Diver', ja: 'ベテランダイバー' },
        description: {
            ko: '워블다이버 10게임 플레이',
            en: 'Play 10 games of Wobblediver',
            ja: 'ワブルダイバー10ゲームプレイ',
        },
        condition: { type: 'wobblediverGames', value: 10 },
    },
    {
        id: 'score-hunter',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '💎',
        name: { ko: '점수 사냥꾼', en: 'Score Hunter', ja: 'スコアハンター' },
        description: {
            ko: '5,000점 달성',
            en: 'Score 5,000 points',
            ja: '5,000点達成',
        },
        condition: { type: 'wobblediverScore', value: 5000 },
    },
    {
        id: 'high-scorer',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🔥',
        name: { ko: '하이스코어러', en: 'High Scorer', ja: 'ハイスコアラー' },
        description: {
            ko: '10,000점 달성',
            en: 'Score 10,000 points',
            ja: '10,000点達成',
        },
        condition: { type: 'wobblediverScore', value: 10000 },
    },
    {
        id: 'diver-rank-a',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🏅',
        name: { ko: '다이버 A랭크', en: 'Diver A Rank', ja: 'ダイバーAランク' },
        description: {
            ko: '워블다이버 A랭크 달성',
            en: 'Achieve A rank in Wobblediver',
            ja: 'ワブルダイバーでAランク達成',
        },
        condition: { type: 'wobblediverRank', value: 'A' },
    },

    // ============ Game - Wobblediver Run Mode (워블다이버 런 모드) ============
    {
        id: 'first-descent',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '🌀',
        name: { ko: '첫 번째 하강', en: 'First Descent', ja: '最初の下降' },
        description: {
            ko: '첫 번째 런을 완료하세요',
            en: 'Complete your first run',
            ja: '最初のランを完了しよう',
        },
        condition: { type: 'wobblediverRunsCompleted', value: 1 },
    },
    {
        id: 'deep-explorer',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '🔱',
        name: { ko: '심해 탐험가', en: 'Deep Explorer', ja: '深海探検家' },
        description: {
            ko: '20단계 런을 완료하세요',
            en: 'Complete a 20-stage run',
            ja: '20ステージのランを完了しよう',
        },
        condition: { type: 'wobblediverRunLength', value: 20 },
    },
    {
        id: 'abyssal-conqueror',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '🦑',
        name: { ko: '심연 정복자', en: 'Abyssal Conqueror', ja: '深淵の征服者' },
        description: {
            ko: '30단계 런을 완료하세요',
            en: 'Complete a 30-stage run',
            ja: '30ステージのランを完了しよう',
        },
        condition: { type: 'wobblediverRunLength', value: 30 },
    },
    {
        id: 'void-walker',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '👁️',
        name: { ko: '공허의 방랑자', en: 'Void Walker', ja: '虚空の歩行者' },
        description: {
            ko: '40단계 런을 완료하세요',
            en: 'Complete a 40-stage run',
            ja: '40ステージのランを完了しよう',
        },
        condition: { type: 'wobblediverRunLength', value: 40 },
    },
    {
        id: 'master-of-abyss',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '👑',
        name: { ko: '심연의 지배자', en: 'Master of the Abyss', ja: '深淵の支配者' },
        description: {
            ko: '50단계 런을 완료하세요',
            en: 'Complete a 50-stage run',
            ja: '50ステージのランを完了しよう',
        },
        condition: { type: 'wobblediverRunLength', value: 50 },
    },
    {
        id: 'flawless-dive',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '💎',
        name: { ko: '완벽한 다이빙', en: 'Flawless Dive', ja: '完璧なダイブ' },
        description: {
            ko: '체력을 잃지 않고 런을 완료하세요',
            en: 'Complete a run at full HP',
            ja: '体力を失わずにランを完了しよう',
        },
        condition: { type: 'wobblediverPerfectRuns', value: 1 },
    },
    {
        id: 'elite-hunter',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '💀',
        name: { ko: '엘리트 사냥꾼', en: 'Elite Hunter', ja: 'エリートハンター' },
        description: {
            ko: '총 10개의 엘리트 스테이지를 클리어하세요',
            en: 'Defeat 10 elite stages total',
            ja: '合計10のエリートステージをクリアしよう',
        },
        condition: { type: 'wobblediverElites', value: 10 },
    },
    {
        id: 'event-seeker',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '❓',
        name: { ko: '이벤트 탐험가', en: 'Event Seeker', ja: 'イベント探求者' },
        description: {
            ko: '총 20개의 이벤트를 경험하세요',
            en: 'Trigger 20 events total',
            ja: '合計20のイベントを経験しよう',
        },
        condition: { type: 'wobblediverEvents', value: 20 },
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

// Helper to get achievements by subcategory
export function getAchievementsBySubcategory(subcategory: AchievementSubcategory): Achievement[] {
    return ACHIEVEMENTS.filter((a) => a.subcategory === subcategory)
}

// Category display info
export const CATEGORY_INFO: Record<AchievementCategory, { name: LocalizedText; color: string }> = {
    sandbox: { name: { ko: '샌드박스', en: 'Sandbox', ja: 'サンドボックス' }, color: '#4a9eff' },
    game: { name: { ko: '게임', en: 'Game', ja: 'ゲーム' }, color: '#e85d4c' },
}

// Subcategory display info
export const SUBCATEGORY_INFO: Record<
    AchievementSubcategory,
    { name: LocalizedText; color: string; icon: string }
> = {
    collection: {
        name: { ko: '수집', en: 'Collection', ja: 'コレクション' },
        color: '#e67e22',
        icon: '👋',
    },
    survivor: {
        name: { ko: '서바이버', en: 'Survivor', ja: 'サバイバー' },
        color: '#e74c3c',
        icon: '⚔️',
    },
    wobblediver: {
        name: { ko: '워블다이버', en: 'Wobblediver', ja: 'ワブルダイバー' },
        color: '#6b5b95',
        icon: '🌊',
    },
    'wobblediver-run': {
        name: { ko: '워블다이버 런', en: 'Wobblediver Run', ja: 'ワブルダイバーラン' },
        color: '#4a2040',
        icon: '🌀',
    },
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
