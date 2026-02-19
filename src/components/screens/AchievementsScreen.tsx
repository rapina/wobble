import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check } from 'lucide-react'
import Balatro from '@/components/Balatro'
import { achievementsPreset } from '@/config/backgroundPresets'
import { useAchievementStore, AchievementProgress } from '@/stores/achievementStore'
import { useProgressStore } from '@/stores/progressStore'
import { useChallengeStore } from '@/stores/challengeStore'
import {
    ACHIEVEMENTS,
    CATEGORY_INFO,
    SUBCATEGORY_INFO,
    AchievementCategory,
    AchievementSubcategory,
    Achievement,
    getAchievementsBySubcategory,
} from '@/data/achievements'
import { LEVEL_CHALLENGES, calculateLevel, LevelChallengeId } from '@/data/levelChallenges'
import { t } from '@/utils/localization'
import { cn } from '@/lib/utils'

// Balatro theme - HomeScreen과 동일
const theme = {
    bg: '#1a1a2e',
    felt: '#3d6b59',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
    red: '#e85d4c',
    blue: '#4a9eff',
    green: '#2ecc71',
    purple: '#9b59b6',
}

interface AchievementsScreenProps {
    onBack: () => void
}

export function AchievementsScreen({ onBack }: AchievementsScreenProps) {
    const { i18n } = useTranslation()
    const lang = i18n.language
    const { isUnlocked, getProgress, getAchievementProgress } = useAchievementStore()
    const { studiedFormulas } = useProgressStore()
    const { totalSolved } = useChallengeStore()
    const progress = getProgress()
    const [mounted, setMounted] = useState(false)
    const [activeCategory, setActiveCategory] = useState<AchievementCategory>('sandbox')

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    // Level challenge values
    const levelChallengeValues: Record<LevelChallengeId, number> = {
        'formula-discovery': studiedFormulas.size,
        'challenge-solver': totalSolved,
    }

    // Get subcategories for each main category
    // Note: 'survivor' is hidden until the mode is released
    const sandboxSubcategories: AchievementSubcategory[] = ['collection']
    const gameSubcategories: AchievementSubcategory[] = ['wobblediver']

    const subcategories = activeCategory === 'sandbox' ? sandboxSubcategories : gameSubcategories

    // Calculate visible achievements progress (excluding survivor)
    const visibleAchievements = ACHIEVEMENTS.filter((a) => a.subcategory !== 'survivor')
    const visibleUnlockedCount = visibleAchievements.filter((a) => isUnlocked(a.id)).length
    const visibleTotalCount = visibleAchievements.length

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: theme.felt }}>
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-40">
                <Balatro
                    color1={achievementsPreset.color1}
                    color2={achievementsPreset.color2}
                    color3={achievementsPreset.color3}
                    spinSpeed={achievementsPreset.spinSpeed}
                    spinRotation={achievementsPreset.spinRotation}
                    contrast={achievementsPreset.contrast}
                    lighting={achievementsPreset.lighting}
                    spinAmount={achievementsPreset.spinAmount}
                    pixelFilter={achievementsPreset.pixelFilter}
                    isRotate={achievementsPreset.isRotate}
                    mouseInteraction={false}
                />
            </div>

            {/* Felt texture overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.3) 100%)',
                }}
            />

            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

            {/* Header - Back button */}
            <div
                className="absolute z-20"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 16px)',
                    left: 'max(env(safe-area-inset-left, 0px), 16px)',
                }}
            >
                <button
                    onClick={onBack}
                    className="h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 3px 0 ${theme.border}`,
                    }}
                >
                    <ArrowLeft className="w-5 h-5 text-white/80" />
                </button>
            </div>

            {/* Title */}
            <div
                className="absolute z-20 left-1/2 -translate-x-1/2"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 16px)',
                }}
            >
                <div
                    className="px-5 py-2 rounded-lg"
                    style={{
                        background: theme.bgPanel,
                        border: `3px solid ${theme.border}`,
                        boxShadow: `0 4px 0 ${theme.border}`,
                    }}
                >
                    <h1
                        className="text-lg font-black tracking-wider"
                        style={{
                            color: theme.gold,
                            textShadow: '0 2px 0 #8a6d1a',
                        }}
                    >
                        {lang === 'ko' ? '업적' : lang === 'ja' ? '実績' : 'ACHIEVEMENTS'}
                    </h1>
                </div>
            </div>

            {/* Content */}
            <div
                className="relative z-10 h-full overflow-y-auto"
                style={{
                    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 70px)',
                    paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 60px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                {/* Overall Progress Card */}
                <div
                    className={cn(
                        'mb-4 p-4 rounded-xl relative overflow-hidden',
                        'transition-all duration-500',
                        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                    )}
                    style={{
                        background: theme.bgPanel,
                        border: `3px solid ${theme.gold}`,
                        boxShadow: `0 4px 0 ${theme.border}, 0 0 20px ${theme.gold}30`,
                    }}
                >
                    {/* Shine effect */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            background: `linear-gradient(135deg, ${theme.gold} 0%, transparent 50%, transparent 100%)`,
                        }}
                    />

                    <div className="relative flex items-center justify-between mb-3">
                        <span className="text-white/60 text-sm font-bold">
                            {lang === 'ko'
                                ? '전체 진행률'
                                : lang === 'ja'
                                  ? '全体の進捗'
                                  : 'Overall Progress'}
                        </span>
                        <div
                            className="px-3 py-1 rounded-lg"
                            style={{
                                background: theme.gold,
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 2px 0 ${theme.border}`,
                            }}
                        >
                            <span className="text-sm font-black text-black">
                                {visibleUnlockedCount} / {visibleTotalCount}
                            </span>
                        </div>
                    </div>
                    <div
                        className="h-4 rounded-lg overflow-hidden"
                        style={{
                            background: theme.bgPanelLight,
                            border: `2px solid ${theme.border}`,
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                        }}
                    >
                        <div
                            className="h-full rounded transition-all duration-700"
                            style={{
                                width: `${(visibleUnlockedCount / visibleTotalCount) * 100}%`,
                                background: `linear-gradient(90deg, ${theme.gold}, #e6b84a)`,
                                boxShadow: '0 1px 0 rgba(255,255,255,0.3)',
                            }}
                        />
                    </div>
                </div>

                {/* Level Challenges Section */}
                <div
                    className={cn(
                        'mb-4',
                        'transition-all duration-500 delay-100',
                        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    )}
                >
                    <div
                        className="rounded-xl p-4 relative overflow-hidden"
                        style={{
                            background: theme.bgPanel,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 4px 0 ${theme.border}`,
                        }}
                    >
                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">📈</span>
                            <h3
                                className="font-black tracking-wide"
                                style={{
                                    color: theme.gold,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                }}
                            >
                                {t({ ko: '도전 과제', en: 'Challenges', ja: 'チャレンジ' }, lang)}
                            </h3>
                        </div>

                        {/* Level Challenge Cards */}
                        <div className="space-y-3">
                            {LEVEL_CHALLENGES.map((challenge) => {
                                const currentValue = levelChallengeValues[challenge.id]
                                const { level, currentTitle, nextLevel, progress } = calculateLevel(
                                    challenge,
                                    currentValue
                                )
                                const isMaxLevel = level >= challenge.levels.length

                                return (
                                    <div
                                        key={challenge.id}
                                        className="p-3 rounded-xl relative overflow-hidden"
                                        style={{
                                            background: `${challenge.color}15`,
                                            border: `2px solid ${challenge.color}`,
                                            boxShadow: `0 2px 0 ${theme.border}`,
                                        }}
                                    >
                                        {/* Shine effect */}
                                        <div
                                            className="absolute inset-0 opacity-10"
                                            style={{
                                                background: `linear-gradient(135deg, ${challenge.color} 0%, transparent 50%, transparent 100%)`,
                                            }}
                                        />

                                        <div className="relative">
                                            {/* Header Row */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">
                                                        {challenge.icon}
                                                    </span>
                                                    <span
                                                        className="font-black"
                                                        style={{ color: challenge.color }}
                                                    >
                                                        {t(challenge.name, lang)}
                                                    </span>
                                                </div>
                                                <div
                                                    className="px-2 py-0.5 rounded-md"
                                                    style={{
                                                        background: challenge.color,
                                                        border: `2px solid ${theme.border}`,
                                                    }}
                                                >
                                                    <span className="text-xs font-black text-white">
                                                        Lv.{level}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <p
                                                className="text-sm font-bold mb-2"
                                                style={{ color: 'rgba(255,255,255,0.8)' }}
                                            >
                                                {t(currentTitle, lang)}
                                            </p>

                                            {/* Progress Bar */}
                                            {!isMaxLevel && nextLevel && (
                                                <>
                                                    <div
                                                        className="h-3 rounded-md overflow-hidden mb-1"
                                                        style={{
                                                            background: theme.bgPanelLight,
                                                            border: `2px solid ${theme.border}`,
                                                        }}
                                                    >
                                                        <div
                                                            className="h-full rounded transition-all duration-500"
                                                            style={{
                                                                width: `${progress}%`,
                                                                background: `linear-gradient(90deg, ${challenge.color}80, ${challenge.color})`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span
                                                            style={{
                                                                color: 'rgba(255,255,255,0.5)',
                                                            }}
                                                        >
                                                            {currentValue} / {nextLevel.requirement}
                                                        </span>
                                                        <span
                                                            style={{
                                                                color: 'rgba(255,255,255,0.4)',
                                                            }}
                                                        >
                                                            {t(
                                                                {
                                                                    ko: '다음: ',
                                                                    en: 'Next: ',
                                                                    ja: '次: ',
                                                                },
                                                                lang
                                                            )}
                                                            {t(nextLevel.title, lang)}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                            {isMaxLevel && (
                                                <p
                                                    className="text-xs font-bold"
                                                    style={{ color: theme.gold }}
                                                >
                                                    {t(
                                                        {
                                                            ko: '🎉 최고 레벨 달성!',
                                                            en: '🎉 Max Level!',
                                                            ja: '🎉 最高レベル達成！',
                                                        },
                                                        lang
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Category Tabs (Sandbox / Game) */}
                <div
                    className={cn(
                        'flex gap-2 mb-4',
                        'transition-all duration-500 delay-200',
                        mounted ? 'opacity-100' : 'opacity-0'
                    )}
                >
                    {(['sandbox', 'game'] as AchievementCategory[]).map((category) => {
                        const isActive = activeCategory === category
                        const categoryInfo = CATEGORY_INFO[category]
                        // Exclude survivor achievements from count (hidden until released)
                        const categoryAchievements = ACHIEVEMENTS.filter(
                            (a) => a.category === category && a.subcategory !== 'survivor'
                        )
                        const unlockedCount = categoryAchievements.filter((a) =>
                            isUnlocked(a.id)
                        ).length

                        return (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className="flex-1 py-2.5 px-3 rounded-lg transition-all active:scale-[0.98]"
                                style={{
                                    background: isActive ? categoryInfo.color : theme.bgPanel,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 2px 0 ${theme.border}`,
                                }}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-lg">
                                        {category === 'sandbox' ? '🧪' : '🎮'}
                                    </span>
                                    <span
                                        className="text-sm font-black"
                                        style={{
                                            color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                                        }}
                                    >
                                        {t(categoryInfo.name, lang)}
                                    </span>
                                    <span
                                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                                        style={{
                                            background: isActive
                                                ? 'rgba(0,0,0,0.2)'
                                                : 'rgba(255,255,255,0.1)',
                                            color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                                        }}
                                    >
                                        {unlockedCount}/{categoryAchievements.length}
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Subcategories */}
                <div className="space-y-4">
                    {subcategories.map((subcategory, subIndex) => {
                        const subcategoryInfo = SUBCATEGORY_INFO[subcategory]
                        const subcategoryAchievements = getAchievementsBySubcategory(subcategory)
                        const unlockedCount = subcategoryAchievements.filter((a) =>
                            isUnlocked(a.id)
                        ).length
                        const allUnlocked = unlockedCount === subcategoryAchievements.length

                        return (
                            <div
                                key={subcategory}
                                className={cn(
                                    'transition-all duration-300',
                                    mounted
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-4'
                                )}
                                style={{ transitionDelay: `${subIndex * 80 + 300}ms` }}
                            >
                                <div
                                    className="rounded-xl p-4 relative overflow-hidden"
                                    style={{
                                        background: theme.bgPanel,
                                        border: `3px solid ${allUnlocked ? subcategoryInfo.color : theme.border}`,
                                        boxShadow: allUnlocked
                                            ? `0 4px 0 ${theme.border}, 0 0 12px ${subcategoryInfo.color}40`
                                            : `0 4px 0 ${theme.border}`,
                                    }}
                                >
                                    {/* Shine effect when all unlocked */}
                                    {allUnlocked && (
                                        <div
                                            className="absolute inset-0 opacity-10"
                                            style={{
                                                background: `linear-gradient(135deg, ${subcategoryInfo.color} 0%, transparent 50%, transparent 100%)`,
                                            }}
                                        />
                                    )}

                                    {/* Subcategory Header */}
                                    <div className="relative flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{subcategoryInfo.icon}</span>
                                            <h3
                                                className="font-black tracking-wide"
                                                style={{
                                                    color: subcategoryInfo.color,
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                                }}
                                            >
                                                {t(subcategoryInfo.name, lang)}
                                            </h3>
                                        </div>
                                        <div
                                            className="px-2.5 py-1 rounded-md"
                                            style={{
                                                background: subcategoryInfo.color,
                                                border: `2px solid ${theme.border}`,
                                                boxShadow: `0 2px 0 ${theme.border}`,
                                            }}
                                        >
                                            <span className="text-xs font-black text-white">
                                                {unlockedCount}/{subcategoryAchievements.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Achievement List */}
                                    <div className="space-y-2">
                                        {subcategoryAchievements.map((achievement) => {
                                            const unlocked = isUnlocked(achievement.id)
                                            const achievementProg = getAchievementProgress(
                                                achievement.id
                                            )

                                            return (
                                                <AchievementItem
                                                    key={achievement.id}
                                                    achievement={achievement}
                                                    unlocked={unlocked}
                                                    progress={achievementProg}
                                                    subcategoryColor={subcategoryInfo.color}
                                                    lang={lang}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Encouragement */}
                {visibleUnlockedCount < visibleTotalCount && (
                    <p
                        className={cn(
                            'text-center text-white/35 text-xs font-medium mt-6',
                            'transition-all duration-500 delay-700',
                            mounted ? 'opacity-100' : 'opacity-0'
                        )}
                    >
                        {lang === 'ko'
                            ? '물리 탐험을 계속하며 업적을 달성해보세요!'
                            : lang === 'ja'
                              ? '物理の探検を続けて実績を達成しよう！'
                              : 'Keep exploring physics to unlock more achievements!'}
                    </p>
                )}
            </div>
        </div>
    )
}

// Individual Achievement Item Component
function AchievementItem({
    achievement,
    unlocked,
    progress,
    subcategoryColor,
    lang,
}: {
    achievement: Achievement
    unlocked: boolean
    progress: AchievementProgress | null
    subcategoryColor: string
    lang: string
}) {
    return (
        <div
            className="p-3 rounded-xl transition-all relative overflow-hidden"
            style={{
                background: unlocked ? `${subcategoryColor}15` : theme.bgPanelLight,
                border: `2px solid ${unlocked ? subcategoryColor : theme.border}`,
                boxShadow: unlocked
                    ? `0 2px 0 ${theme.border}, 0 0 8px ${subcategoryColor}30`
                    : `0 2px 0 ${theme.border}`,
            }}
        >
            {/* Shine effect when unlocked */}
            {unlocked && (
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: `linear-gradient(135deg, ${subcategoryColor} 0%, transparent 50%, transparent 100%)`,
                    }}
                />
            )}

            <div className="relative flex items-center gap-3">
                {/* Icon */}
                <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                        background: unlocked ? subcategoryColor : theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 2px 0 ${theme.border}`,
                    }}
                >
                    {unlocked ? (
                        <span className="text-xl">{achievement.icon}</span>
                    ) : (
                        <span className="text-lg font-bold text-white/30">?</span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p
                        className="font-black text-sm truncate"
                        style={{
                            color: unlocked ? 'white' : 'rgba(255,255,255,0.5)',
                            textShadow: unlocked ? '0 1px 0 rgba(0,0,0,0.2)' : 'none',
                        }}
                    >
                        {t(achievement.name, lang)}
                    </p>
                    <p
                        className="text-xs truncate font-medium"
                        style={{
                            color: unlocked ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)',
                        }}
                    >
                        {t(achievement.description, lang)}
                    </p>
                </div>

                {/* Check mark or Progress */}
                {unlocked ? (
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                            background: subcategoryColor,
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 2px 0 ${theme.border}`,
                        }}
                    >
                        <Check className="w-5 h-5 text-white" />
                    </div>
                ) : (
                    progress && (
                        <div
                            className="px-2 py-1 rounded-md flex-shrink-0"
                            style={{
                                background: theme.bgPanel,
                                border: `2px solid ${theme.border}`,
                            }}
                        >
                            <span className="text-xs font-bold text-white/40">
                                {progress.current}/{progress.target}
                            </span>
                        </div>
                    )
                )}
            </div>

            {/* Progress Bar for locked items */}
            {!unlocked && progress && (
                <div
                    className="relative mt-3 h-3 rounded-md overflow-hidden"
                    style={{
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                    }}
                >
                    <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                            width: `${progress.percentage}%`,
                            background: `linear-gradient(90deg, ${subcategoryColor}80, ${subcategoryColor})`,
                        }}
                    />
                </div>
            )}
        </div>
    )
}
