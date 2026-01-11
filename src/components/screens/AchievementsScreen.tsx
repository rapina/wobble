import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Star, Zap, Target, Crown } from 'lucide-react'
import Balatro from '@/components/Balatro'
import { useAchievementStore, AchievementProgress } from '@/stores/achievementStore'
import { ACHIEVEMENTS, CATEGORY_INFO, AchievementCategory } from '@/data/achievements'
import { cn } from '@/lib/utils'

// Theme matching SimulationScreen
const theme = {
    bg: '#0a0a12',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
    red: '#e85d4c',
    blue: '#4a9eff',
}

// Category icons (no emojis)
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
    const isKorean = i18n.language === 'ko'
    const { isUnlocked, getProgress, getAchievementProgress } = useAchievementStore()
    const progress = getProgress()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    const categories: AchievementCategory[] = ['learning', 'combat', 'collection', 'mastery']

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#0a0a12]">
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-60">
                <Balatro
                    color1="#c9a227"
                    color2="#4a9eff"
                    color3="#1a1a2e"
                    spinSpeed={2}
                    spinRotation={-1}
                    contrast={2.5}
                    lighting={0.3}
                    spinAmount={0.15}
                    pixelFilter={800}
                    isRotate={true}
                    mouseInteraction={false}
                />
            </div>

            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />

            {/* Header - Back button only */}
            <div
                className="absolute z-20"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 12px)',
                    left: 'max(env(safe-area-inset-left, 0px), 12px)',
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

            {/* Content */}
            <div
                className="relative z-10 h-full overflow-y-auto"
                style={{
                    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 60px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 100px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                }}
            >
                {/* Overall Progress */}
                <div
                    className={cn(
                        'mb-4 p-3 rounded-xl',
                        'transition-all duration-500',
                        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                    )}
                    style={{
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 3px 0 ${theme.border}`,
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-sm">
                            {isKorean ? '전체 진행률' : 'Overall Progress'}
                        </span>
                        <span className="text-white font-bold">
                            {progress.unlocked}/{progress.total}
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(progress.unlocked / progress.total) * 100}%`,
                                background: `linear-gradient(90deg, ${theme.gold}, #e6b84a)`,
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

                        return (
                            <div
                                key={category}
                                className={cn(
                                    'transition-all duration-300',
                                    mounted
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-4'
                                )}
                                style={{ transitionDelay: `${catIndex * 100 + 100}ms` }}
                            >
                                <div
                                    className="rounded-xl p-3"
                                    style={{
                                        background: theme.bgPanel,
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: `0 3px 0 ${theme.border}`,
                                    }}
                                >
                                    {/* Category Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <h3
                                            className="font-bold"
                                            style={{ color: categoryInfo.color }}
                                        >
                                            {isKorean ? categoryInfo.nameKo : categoryInfo.nameEn}
                                        </h3>
                                        <span
                                            className="text-xs px-2 py-0.5 rounded font-bold"
                                            style={{
                                                background: categoryInfo.color,
                                                color: 'white',
                                                border: `2px solid ${theme.border}`,
                                                boxShadow: `0 2px 0 ${theme.border}`,
                                            }}
                                        >
                                            {unlockedCount}/{categoryAchievements.length}
                                        </span>
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
                                                    nameKo={achievement.nameKo}
                                                    nameEn={achievement.nameEn}
                                                    descriptionKo={achievement.descriptionKo}
                                                    descriptionEn={achievement.descriptionEn}
                                                    unlocked={unlocked}
                                                    progress={achievementProg}
                                                    categoryColor={categoryInfo.color}
                                                    isKorean={isKorean}
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
                            'text-center text-white/40 text-xs mt-6',
                            'transition-all duration-500 delay-700',
                            mounted ? 'opacity-100' : 'opacity-0'
                        )}
                    >
                        {isKorean
                            ? '물리 탐험을 계속하며 업적을 달성해보세요!'
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
    nameKo,
    nameEn,
    descriptionKo,
    descriptionEn,
    unlocked,
    progress,
    categoryColor,
    isKorean,
}: {
    category: AchievementCategory
    nameKo: string
    nameEn: string
    descriptionKo: string
    descriptionEn: string
    unlocked: boolean
    progress: AchievementProgress | null
    categoryColor: string
    isKorean: boolean
}) {
    return (
        <div
            className="p-2 rounded-lg transition-all"
            style={{
                background: unlocked ? `${categoryColor}20` : theme.bgPanelLight,
                border: `2px solid ${unlocked ? categoryColor : theme.border}`,
                boxShadow: unlocked ? `0 3px 0 ${categoryColor}80` : `0 3px 0 ${theme.border}`,
                opacity: unlocked ? 1 : 0.85,
            }}
        >
            <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                        background: unlocked ? `${categoryColor}30` : 'rgba(255,255,255,0.1)',
                        border: `2px solid ${unlocked ? categoryColor : theme.border}`,
                        boxShadow: `0 2px 0 ${unlocked ? categoryColor : theme.border}`,
                        color: unlocked ? categoryColor : 'rgba(255,255,255,0.3)',
                    }}
                >
                    {unlocked ? CATEGORY_ICONS[category] : '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p
                        className="font-bold text-sm truncate"
                        style={{
                            color: unlocked ? 'white' : 'rgba(255,255,255,0.5)',
                        }}
                    >
                        {isKorean ? nameKo : nameEn}
                    </p>
                    <p
                        className="text-xs truncate"
                        style={{
                            color: unlocked ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                        }}
                    >
                        {isKorean ? descriptionKo : descriptionEn}
                    </p>
                </div>

                {/* Check mark or Progress */}
                {unlocked ? (
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                            background: categoryColor,
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 2px 0 ${theme.border}`,
                        }}
                    >
                        <Check className="w-4 h-4 text-white" />
                    </div>
                ) : (
                    progress && (
                        <span
                            className="text-xs font-mono flex-shrink-0"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                            {progress.current}/{progress.target}
                        </span>
                    )
                )}
            </div>

            {/* Progress Bar for unlocked items */}
            {!unlocked && progress && (
                <div
                    className="mt-2 h-2 rounded-full overflow-hidden"
                    style={{
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `inset 0 2px 4px rgba(0,0,0,0.3)`,
                    }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width: `${progress.percentage}%`,
                            background: `linear-gradient(90deg, ${categoryColor}80, ${categoryColor})`,
                            boxShadow: `0 1px 0 rgba(255,255,255,0.2)`,
                        }}
                    />
                </div>
            )}
        </div>
    )
}
