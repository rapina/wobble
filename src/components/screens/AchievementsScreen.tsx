import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Star, Zap, Target, Crown } from 'lucide-react'
import Balatro from '@/components/Balatro'
import { achievementsPreset } from '@/config/backgroundPresets'
import { useAchievementStore, AchievementProgress } from '@/stores/achievementStore'
import { ACHIEVEMENTS, CATEGORY_INFO, AchievementCategory, Achievement } from '@/data/achievements'
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

// Category icons
const CATEGORY_ICONS: Record<AchievementCategory, React.ReactNode> = {
    learning: <Star className="w-5 h-5" />,
    combat: <Zap className="w-5 h-5" />,
    collection: <Target className="w-5 h-5" />,
    mastery: <Crown className="w-5 h-5" />,
}

interface AchievementsScreenProps {
    onBack: () => void
}

export function AchievementsScreen({ onBack }: AchievementsScreenProps) {
    const { i18n } = useTranslation()
    const lang = i18n.language
    const { isUnlocked, getProgress, getAchievementProgress } = useAchievementStore()
    const progress = getProgress()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    const categories: AchievementCategory[] = ['learning', 'combat', 'collection', 'mastery']

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
                        'mb-5 p-4 rounded-xl relative overflow-hidden',
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
                                {progress.unlocked} / {progress.total}
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
                                width: `${(progress.unlocked / progress.total) * 100}%`,
                                background: `linear-gradient(90deg, ${theme.gold}, #e6b84a)`,
                                boxShadow: '0 1px 0 rgba(255,255,255,0.3)',
                            }}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    {categories.map((category, catIndex) => {
                        const categoryInfo = CATEGORY_INFO[category]
                        const categoryAchievements = ACHIEVEMENTS.filter(
                            (a) => a.category === category
                        )
                        const unlockedCount = categoryAchievements.filter((a) =>
                            isUnlocked(a.id)
                        ).length
                        const allUnlocked = unlockedCount === categoryAchievements.length

                        return (
                            <div
                                key={category}
                                className={cn(
                                    'transition-all duration-300',
                                    mounted
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-4'
                                )}
                                style={{ transitionDelay: `${catIndex * 80 + 100}ms` }}
                            >
                                <div
                                    className="rounded-xl p-4 relative overflow-hidden"
                                    style={{
                                        background: theme.bgPanel,
                                        border: `3px solid ${allUnlocked ? categoryInfo.color : theme.border}`,
                                        boxShadow: allUnlocked
                                            ? `0 4px 0 ${theme.border}, 0 0 12px ${categoryInfo.color}40`
                                            : `0 4px 0 ${theme.border}`,
                                    }}
                                >
                                    {/* Shine effect when all unlocked */}
                                    {allUnlocked && (
                                        <div
                                            className="absolute inset-0 opacity-10"
                                            style={{
                                                background: `linear-gradient(135deg, ${categoryInfo.color} 0%, transparent 50%, transparent 100%)`,
                                            }}
                                        />
                                    )}

                                    {/* Category Header */}
                                    <div className="relative flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{
                                                    background: categoryInfo.color,
                                                    border: `2px solid ${theme.border}`,
                                                    boxShadow: `0 2px 0 ${theme.border}`,
                                                    color: 'white',
                                                }}
                                            >
                                                {CATEGORY_ICONS[category]}
                                            </div>
                                            <h3
                                                className="font-black tracking-wide"
                                                style={{
                                                    color: categoryInfo.color,
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                                }}
                                            >
                                                {t(categoryInfo.name, lang)}
                                            </h3>
                                        </div>
                                        <div
                                            className="px-2.5 py-1 rounded-md"
                                            style={{
                                                background: categoryInfo.color,
                                                border: `2px solid ${theme.border}`,
                                                boxShadow: `0 2px 0 ${theme.border}`,
                                            }}
                                        >
                                            <span className="text-xs font-black text-white">
                                                {unlockedCount}/{categoryAchievements.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Achievement List */}
                                    <div className="space-y-2">
                                        {categoryAchievements.map((achievement) => {
                                            const unlocked = isUnlocked(achievement.id)
                                            const achievementProg = getAchievementProgress(
                                                achievement.id
                                            )

                                            return (
                                                <AchievementItem
                                                    key={achievement.id}
                                                    category={category}
                                                    achievement={achievement}
                                                    unlocked={unlocked}
                                                    progress={achievementProg}
                                                    categoryColor={categoryInfo.color}
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
                {progress.unlocked < progress.total && (
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
    category,
    achievement,
    unlocked,
    progress,
    categoryColor,
    lang,
}: {
    category: AchievementCategory
    achievement: Achievement
    unlocked: boolean
    progress: AchievementProgress | null
    categoryColor: string
    lang: string
}) {
    return (
        <div
            className="p-3 rounded-xl transition-all relative overflow-hidden"
            style={{
                background: unlocked ? `${categoryColor}15` : theme.bgPanelLight,
                border: `2px solid ${unlocked ? categoryColor : theme.border}`,
                boxShadow: unlocked
                    ? `0 2px 0 ${theme.border}, 0 0 8px ${categoryColor}30`
                    : `0 2px 0 ${theme.border}`,
            }}
        >
            {/* Shine effect when unlocked */}
            {unlocked && (
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: `linear-gradient(135deg, ${categoryColor} 0%, transparent 50%, transparent 100%)`,
                    }}
                />
            )}

            <div className="relative flex items-center gap-3">
                {/* Icon */}
                <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                        background: unlocked ? categoryColor : theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 2px 0 ${theme.border}`,
                        color: unlocked ? 'white' : 'rgba(255,255,255,0.3)',
                    }}
                >
                    {unlocked ? (
                        CATEGORY_ICONS[category]
                    ) : (
                        <span className="text-lg font-bold">?</span>
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
                            background: categoryColor,
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
                            background: `linear-gradient(90deg, ${categoryColor}80, ${categoryColor})`,
                        }}
                    />
                </div>
            )}
        </div>
    )
}
