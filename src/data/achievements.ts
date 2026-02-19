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
        name: { ko: '첫 친구', en: 'First Friend', ja: '最初の仲間', 'zh-CN': '第一个朋友', 'zh-TW': '第一個朋友', es: 'Primer Amigo', pt: 'Primeiro Amigo' },
        description: {
            ko: '첫 번째 워블을 해금하세요',
            en: 'Unlock your first Wobble',
            ja: '最初のワブルを解放しよう',
            'zh-CN': '解锁你的第一个Wobble',
            'zh-TW': '解鎖你的第一個Wobble',
            es: 'Desbloquea tu primer Wobble',
            pt: 'Desbloqueie seu primeiro Wobble',
        },
        condition: { type: 'wobbles', value: 1 },
    },
    {
        id: 'curator',
        category: 'sandbox',
        subcategory: 'collection',
        icon: '🏆',
        name: { ko: '수집가', en: 'Curator', ja: 'コレクター', 'zh-CN': '收藏家', 'zh-TW': '收藏家', es: 'Curador', pt: 'Curador' },
        description: {
            ko: '모든 워블을 해금하세요',
            en: 'Unlock all Wobbles',
            ja: '全てのワブルを解放しよう',
            'zh-CN': '解锁所有Wobble',
            'zh-TW': '解鎖所有Wobble',
            es: 'Desbloquea todos los Wobbles',
            pt: 'Desbloqueie todos os Wobbles',
        },
        condition: { type: 'wobbles', value: 7 },
    },

    // ============ Game - Survivor (서바이버) ============
    {
        id: 'first-blood',
        category: 'game',
        subcategory: 'survivor',
        icon: '⚔️',
        name: { ko: '첫 처치', en: 'First Blood', ja: '初撃破', 'zh-CN': '第一滴血', 'zh-TW': '第一滴血', es: 'Primera Sangre', pt: 'Primeiro Sangue' },
        description: {
            ko: '첫 번째 적을 처치하세요',
            en: 'Defeat your first enemy',
            ja: '最初の敵を倒そう',
            'zh-CN': '击败你的第一个敌人',
            'zh-TW': '擊敗你的第一個敵人',
            es: 'Derrota a tu primer enemigo',
            pt: 'Derrote seu primeiro inimigo',
        },
        condition: { type: 'kills', value: 1 },
    },
    {
        id: 'hunter',
        category: 'game',
        subcategory: 'survivor',
        icon: '🏹',
        name: { ko: '사냥꾼', en: 'Hunter', ja: 'ハンター', 'zh-CN': '猎人', 'zh-TW': '獵人', es: 'Cazador', pt: 'Caçador' },
        description: {
            ko: '총 100마리의 적을 처치하세요',
            en: 'Defeat 100 enemies total',
            ja: '合計100体の敵を倒そう',
            'zh-CN': '累计击败100个敌人',
            'zh-TW': '累計擊敗100個敵人',
            es: 'Derrota 100 enemigos en total',
            pt: 'Derrote 100 inimigos no total',
        },
        condition: { type: 'kills', value: 100 },
    },
    {
        id: 'exterminator',
        category: 'game',
        subcategory: 'survivor',
        icon: '💀',
        name: { ko: '섬멸자', en: 'Exterminator', ja: '殲滅者', 'zh-CN': '歼灭者', 'zh-TW': '殲滅者', es: 'Exterminador', pt: 'Exterminador' },
        description: {
            ko: '총 500마리의 적을 처치하세요',
            en: 'Defeat 500 enemies total',
            ja: '合計500体の敵を倒そう',
            'zh-CN': '累计击败500个敌人',
            'zh-TW': '累計擊敗500個敵人',
            es: 'Derrota 500 enemigos en total',
            pt: 'Derrote 500 inimigos no total',
        },
        condition: { type: 'kills', value: 500 },
    },
    {
        id: 'survivor',
        category: 'game',
        subcategory: 'survivor',
        icon: '⏱️',
        name: { ko: '생존자', en: 'Survivor', ja: 'サバイバー', 'zh-CN': '幸存者', 'zh-TW': '倖存者', es: 'Superviviente', pt: 'Sobrevivente' },
        description: {
            ko: '3분 동안 생존하세요',
            en: 'Survive for 3 minutes',
            ja: '3分間生き残ろう',
            'zh-CN': '生存3分钟',
            'zh-TW': '生存3分鐘',
            es: 'Sobrevive 3 minutos',
            pt: 'Sobreviva por 3 minutos',
        },
        condition: { type: 'survivalTime', value: 180 }, // 180 seconds
    },
    {
        id: 'rank-c',
        category: 'game',
        subcategory: 'survivor',
        icon: '🥉',
        name: { ko: 'C 랭크', en: 'C Rank', ja: 'Cランク', 'zh-CN': 'C级', 'zh-TW': 'C級', es: 'Rango C', pt: 'Rank C' },
        description: {
            ko: 'C 랭크 이상을 달성하세요',
            en: 'Achieve C rank or higher',
            ja: 'Cランク以上を達成しよう',
            'zh-CN': '达到C级或更高',
            'zh-TW': '達到C級或更高',
            es: 'Alcanza rango C o superior',
            pt: 'Alcance rank C ou superior',
        },
        condition: { type: 'rank', value: 'C' },
    },
    {
        id: 'rank-b',
        category: 'game',
        subcategory: 'survivor',
        icon: '🥈',
        name: { ko: 'B 랭크', en: 'B Rank', ja: 'Bランク', 'zh-CN': 'B级', 'zh-TW': 'B級', es: 'Rango B', pt: 'Rank B' },
        description: {
            ko: 'B 랭크 이상을 달성하세요',
            en: 'Achieve B rank or higher',
            ja: 'Bランク以上を達成しよう',
            'zh-CN': '达到B级或更高',
            'zh-TW': '達到B級或更高',
            es: 'Alcanza rango B o superior',
            pt: 'Alcance rank B ou superior',
        },
        condition: { type: 'rank', value: 'B' },
    },
    {
        id: 'rank-a',
        category: 'game',
        subcategory: 'survivor',
        icon: '🥇',
        name: { ko: 'A 랭크', en: 'A Rank', ja: 'Aランク', 'zh-CN': 'A级', 'zh-TW': 'A級', es: 'Rango A', pt: 'Rank A' },
        description: {
            ko: 'A 랭크 이상을 달성하세요',
            en: 'Achieve A rank or higher',
            ja: 'Aランク以上を達成しよう',
            'zh-CN': '达到A级或更高',
            'zh-TW': '達到A級或更高',
            es: 'Alcanza rango A o superior',
            pt: 'Alcance rank A ou superior',
        },
        condition: { type: 'rank', value: 'A' },
    },
    {
        id: 'rank-s',
        category: 'game',
        subcategory: 'survivor',
        icon: '👑',
        name: { ko: 'S 랭크', en: 'S Rank', ja: 'Sランク', 'zh-CN': 'S级', 'zh-TW': 'S級', es: 'Rango S', pt: 'Rank S' },
        description: {
            ko: '전설의 S 랭크를 달성하세요',
            en: 'Achieve the legendary S rank',
            ja: '伝説のSランクを達成しよう',
            'zh-CN': '达到传说中的S级',
            'zh-TW': '達到傳說中的S級',
            es: 'Alcanza el legendario rango S',
            pt: 'Alcance o lendário rank S',
        },
        condition: { type: 'rank', value: 'S' },
    },

    // ============ Game - Wobblediver (워블다이버) ============
    {
        id: 'first-dive',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🏊',
        name: { ko: '첫 다이빙', en: 'First Dive', ja: '初ダイブ', 'zh-CN': '第一次潜水', 'zh-TW': '第一次潛水', es: 'Primer Buceo', pt: 'Primeiro Mergulho' },
        description: {
            ko: '워블다이버 첫 플레이',
            en: 'Play Wobblediver for the first time',
            ja: 'ワブルダイバー初プレイ',
            'zh-CN': '首次游玩深渊潜水员',
            'zh-TW': '首次遊玩深淵潛水員',
            es: 'Juega Wobblediver por primera vez',
            pt: 'Jogue Wobblediver pela primeira vez',
        },
        condition: { type: 'wobblediverGames', value: 1 },
    },
    {
        id: 'deep-diver',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🌊',
        name: { ko: '심해 탐험가', en: 'Deep Diver', ja: '深海探検家', 'zh-CN': '深海潜水员', 'zh-TW': '深海潛水員', es: 'Buceador Profundo', pt: 'Mergulhador Profundo' },
        description: {
            ko: '깊이 10 도달',
            en: 'Reach depth 10',
            ja: '深度10到達',
            'zh-CN': '到达深度10',
            'zh-TW': '到達深度10',
            es: 'Alcanza profundidad 10',
            pt: 'Alcance profundidade 10',
        },
        condition: { type: 'wobblediverDepth', value: 10 },
    },
    {
        id: 'abyss-explorer',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🦑',
        name: { ko: '심연 탐험가', en: 'Abyss Explorer', ja: '深淵探検家', 'zh-CN': '深渊探险家', 'zh-TW': '深淵探險家', es: 'Explorador del Abismo', pt: 'Explorador do Abismo' },
        description: {
            ko: '깊이 20 도달',
            en: 'Reach depth 20',
            ja: '深度20到達',
            'zh-CN': '到达深度20',
            'zh-TW': '到達深度20',
            es: 'Alcanza profundidad 20',
            pt: 'Alcance profundidade 20',
        },
        condition: { type: 'wobblediverDepth', value: 20 },
    },
    {
        id: 'perfect-escape',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '⭐',
        name: { ko: '완벽한 탈출', en: 'Perfect Escape', ja: '完璧な脱出', 'zh-CN': '完美逃脱', 'zh-TW': '完美逃脫', es: 'Escape Perfecto', pt: 'Fuga Perfeita' },
        description: {
            ko: '워블다이버 S랭크 달성',
            en: 'Achieve S rank in Wobblediver',
            ja: 'ワブルダイバーでSランク達成',
            'zh-CN': '在深渊潜水员中达到S级',
            'zh-TW': '在深淵潛水員中達到S級',
            es: 'Alcanza rango S en Wobblediver',
            pt: 'Alcance rank S no Wobblediver',
        },
        condition: { type: 'wobblediverRank', value: 'S' },
    },
    {
        id: 'veteran-diver',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🎮',
        name: { ko: '베테랑 다이버', en: 'Veteran Diver', ja: 'ベテランダイバー', 'zh-CN': '资深潜水员', 'zh-TW': '資深潛水員', es: 'Buceador Veterano', pt: 'Mergulhador Veterano' },
        description: {
            ko: '워블다이버 10게임 플레이',
            en: 'Play 10 games of Wobblediver',
            ja: 'ワブルダイバー10ゲームプレイ',
            'zh-CN': '游玩10局深渊潜水员',
            'zh-TW': '遊玩10局深淵潛水員',
            es: 'Juega 10 partidas de Wobblediver',
            pt: 'Jogue 10 partidas de Wobblediver',
        },
        condition: { type: 'wobblediverGames', value: 10 },
    },
    {
        id: 'score-hunter',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '💎',
        name: { ko: '점수 사냥꾼', en: 'Score Hunter', ja: 'スコアハンター', 'zh-CN': '分数猎人', 'zh-TW': '分數獵人', es: 'Cazador de Puntos', pt: 'Caçador de Pontos' },
        description: {
            ko: '5,000점 달성',
            en: 'Score 5,000 points',
            ja: '5,000点達成',
            'zh-CN': '获得5,000分',
            'zh-TW': '獲得5,000分',
            es: 'Consigue 5,000 puntos',
            pt: 'Consiga 5.000 pontos',
        },
        condition: { type: 'wobblediverScore', value: 5000 },
    },
    {
        id: 'high-scorer',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🔥',
        name: { ko: '하이스코어러', en: 'High Scorer', ja: 'ハイスコアラー', 'zh-CN': '高分玩家', 'zh-TW': '高分玩家', es: 'Alto Puntuador', pt: 'Pontuador Alto' },
        description: {
            ko: '10,000점 달성',
            en: 'Score 10,000 points',
            ja: '10,000点達成',
            'zh-CN': '获得10,000分',
            'zh-TW': '獲得10,000分',
            es: 'Consigue 10,000 puntos',
            pt: 'Consiga 10.000 pontos',
        },
        condition: { type: 'wobblediverScore', value: 10000 },
    },
    {
        id: 'diver-rank-a',
        category: 'game',
        subcategory: 'wobblediver',
        icon: '🏅',
        name: { ko: '다이버 A랭크', en: 'Diver A Rank', ja: 'ダイバーAランク', 'zh-CN': '潜水员A级', 'zh-TW': '潛水員A級', es: 'Buceador Rango A', pt: 'Mergulhador Rank A' },
        description: {
            ko: '워블다이버 A랭크 달성',
            en: 'Achieve A rank in Wobblediver',
            ja: 'ワブルダイバーでAランク達成',
            'zh-CN': '在深渊潜水员中达到A级',
            'zh-TW': '在深淵潛水員中達到A級',
            es: 'Alcanza rango A en Wobblediver',
            pt: 'Alcance rank A no Wobblediver',
        },
        condition: { type: 'wobblediverRank', value: 'A' },
    },

    // ============ Game - Wobblediver Run Mode (워블다이버 런 모드) ============
    {
        id: 'first-descent',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '🌀',
        name: { ko: '첫 번째 하강', en: 'First Descent', ja: '最初の下降', 'zh-CN': '第一次下降', 'zh-TW': '第一次下降', es: 'Primer Descenso', pt: 'Primeira Descida' },
        description: {
            ko: '첫 번째 런을 완료하세요',
            en: 'Complete your first run',
            ja: '最初のランを完了しよう',
            'zh-CN': '完成你的第一次挑战',
            'zh-TW': '完成你的第一次挑戰',
            es: 'Completa tu primera carrera',
            pt: 'Complete sua primeira corrida',
        },
        condition: { type: 'wobblediverRunsCompleted', value: 1 },
    },
    {
        id: 'deep-explorer',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '🔱',
        name: { ko: '심해 탐험가', en: 'Deep Explorer', ja: '深海探検家', 'zh-CN': '深海探索者', 'zh-TW': '深海探索者', es: 'Explorador Profundo', pt: 'Explorador Profundo' },
        description: {
            ko: '20단계 런을 완료하세요',
            en: 'Complete a 20-stage run',
            ja: '20ステージのランを完了しよう',
            'zh-CN': '完成20层挑战',
            'zh-TW': '完成20層挑戰',
            es: 'Completa una carrera de 20 etapas',
            pt: 'Complete uma corrida de 20 estágios',
        },
        condition: { type: 'wobblediverRunLength', value: 20 },
    },
    {
        id: 'abyssal-conqueror',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '🦑',
        name: { ko: '심연 정복자', en: 'Abyssal Conqueror', ja: '深淵の征服者', 'zh-CN': '深渊征服者', 'zh-TW': '深淵征服者', es: 'Conquistador Abisal', pt: 'Conquistador Abissal' },
        description: {
            ko: '30단계 런을 완료하세요',
            en: 'Complete a 30-stage run',
            ja: '30ステージのランを完了しよう',
            'zh-CN': '完成30层挑战',
            'zh-TW': '完成30層挑戰',
            es: 'Completa una carrera de 30 etapas',
            pt: 'Complete uma corrida de 30 estágios',
        },
        condition: { type: 'wobblediverRunLength', value: 30 },
    },
    {
        id: 'void-walker',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '👁️',
        name: { ko: '공허의 방랑자', en: 'Void Walker', ja: '虚空の歩行者', 'zh-CN': '虚空行者', 'zh-TW': '虛空行者', es: 'Caminante del Vacío', pt: 'Caminhante do Vazio' },
        description: {
            ko: '40단계 런을 완료하세요',
            en: 'Complete a 40-stage run',
            ja: '40ステージのランを完了しよう',
            'zh-CN': '完成40层挑战',
            'zh-TW': '完成40層挑戰',
            es: 'Completa una carrera de 40 etapas',
            pt: 'Complete uma corrida de 40 estágios',
        },
        condition: { type: 'wobblediverRunLength', value: 40 },
    },
    {
        id: 'master-of-abyss',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '👑',
        name: { ko: '심연의 지배자', en: 'Master of the Abyss', ja: '深淵の支配者', 'zh-CN': '深渊主宰', 'zh-TW': '深淵主宰', es: 'Maestro del Abismo', pt: 'Mestre do Abismo' },
        description: {
            ko: '50단계 런을 완료하세요',
            en: 'Complete a 50-stage run',
            ja: '50ステージのランを完了しよう',
            'zh-CN': '完成50层挑战',
            'zh-TW': '完成50層挑戰',
            es: 'Completa una carrera de 50 etapas',
            pt: 'Complete uma corrida de 50 estágios',
        },
        condition: { type: 'wobblediverRunLength', value: 50 },
    },
    {
        id: 'flawless-dive',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '💎',
        name: { ko: '완벽한 다이빙', en: 'Flawless Dive', ja: '完璧なダイブ', 'zh-CN': '完美潜水', 'zh-TW': '完美潛水', es: 'Buceo Perfecto', pt: 'Mergulho Perfeito' },
        description: {
            ko: '체력을 잃지 않고 런을 완료하세요',
            en: 'Complete a run at full HP',
            ja: '体力を失わずにランを完了しよう',
            'zh-CN': '以满血完成挑战',
            'zh-TW': '以滿血完成挑戰',
            es: 'Completa una carrera con HP lleno',
            pt: 'Complete uma corrida com HP cheio',
        },
        condition: { type: 'wobblediverPerfectRuns', value: 1 },
    },
    {
        id: 'elite-hunter',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '💀',
        name: { ko: '엘리트 사냥꾼', en: 'Elite Hunter', ja: 'エリートハンター', 'zh-CN': '精英猎人', 'zh-TW': '精英獵人', es: 'Cazador de Élite', pt: 'Caçador de Elite' },
        description: {
            ko: '총 10개의 엘리트 스테이지를 클리어하세요',
            en: 'Defeat 10 elite stages total',
            ja: '合計10のエリートステージをクリアしよう',
            'zh-CN': '累计通过10个精英关卡',
            'zh-TW': '累計通過10個精英關卡',
            es: 'Supera 10 etapas de élite en total',
            pt: 'Derrote 10 estágios de elite no total',
        },
        condition: { type: 'wobblediverElites', value: 10 },
    },
    {
        id: 'event-seeker',
        category: 'game',
        subcategory: 'wobblediver-run',
        icon: '❓',
        name: { ko: '이벤트 탐험가', en: 'Event Seeker', ja: 'イベント探求者', 'zh-CN': '事件探索者', 'zh-TW': '事件探索者', es: 'Buscador de Eventos', pt: 'Caçador de Eventos' },
        description: {
            ko: '총 20개의 이벤트를 경험하세요',
            en: 'Trigger 20 events total',
            ja: '合計20のイベントを経験しよう',
            'zh-CN': '累计触发20个事件',
            'zh-TW': '累計觸發20個事件',
            es: 'Activa 20 eventos en total',
            pt: 'Ative 20 eventos no total',
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
    sandbox: { name: { ko: '샌드박스', en: 'Sandbox', ja: 'サンドボックス', 'zh-CN': '沙盒', 'zh-TW': '沙盒', es: 'Sandbox', pt: 'Sandbox' }, color: '#4a9eff' },
    game: { name: { ko: '게임', en: 'Game', ja: 'ゲーム', 'zh-CN': '游戏', 'zh-TW': '遊戲', es: 'Juego', pt: 'Jogo' }, color: '#e85d4c' },
}

// Subcategory display info
export const SUBCATEGORY_INFO: Record<
    AchievementSubcategory,
    { name: LocalizedText; color: string; icon: string }
> = {
    collection: {
        name: { ko: '수집', en: 'Collection', ja: 'コレクション', 'zh-CN': '收藏', 'zh-TW': '收藏', es: 'Colección', pt: 'Coleção' },
        color: '#e67e22',
        icon: '👋',
    },
    survivor: {
        name: { ko: '서바이버', en: 'Survivor', ja: 'サバイバー', 'zh-CN': '生存', 'zh-TW': '生存', es: 'Superviviente', pt: 'Sobrevivente' },
        color: '#e74c3c',
        icon: '⚔️',
    },
    wobblediver: {
        name: { ko: '워블다이버', en: 'Wobblediver', ja: 'ワブルダイバー', 'zh-CN': '深渊潜水员', 'zh-TW': '深淵潛水員', es: 'Wobblediver', pt: 'Wobblediver' },
        color: '#6b5b95',
        icon: '🌊',
    },
    'wobblediver-run': {
        name: { ko: '워블다이버 런', en: 'Wobblediver Run', ja: 'ワブルダイバーラン', 'zh-CN': '深渊挑战', 'zh-TW': '深淵挑戰', es: 'Carrera Wobblediver', pt: 'Corrida Wobblediver' },
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
