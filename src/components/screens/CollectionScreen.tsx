import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    ArrowLeft,
    Sparkles,
    BookOpen,
    Trophy,
    Users,
    Target,
    Waves,
    Check,
} from 'lucide-react'
import Balatro from '@/components/Balatro'
import { collectionPreset } from '@/config/backgroundPresets'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore } from '@/stores/progressStore'
import { useMinigameRecordStore, WobblediverRecord } from '@/stores/minigameRecordStore'
import { useAchievementStore, AchievementProgress } from '@/stores/achievementStore'
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
import { useChallengeStore } from '@/stores/challengeStore'
import { WOBBLE_CHARACTERS, WobbleShape, WobbleExpression } from '@/components/canvas/Wobble'
import { formulas } from '@/formulas/registry'
import { cn } from '@/lib/utils'
import { t as localizeText } from '@/utils/localization'

const ALL_SHAPES: WobbleShape[] = [
    'circle',
    'square',
    'triangle',
    'star',
    'diamond',
    'pentagon',
    'shadow',
    'einstein',
]

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
    pink: '#FF6B9D',
}

type TabType = 'characters' | 'formulas' | 'records' | 'achievements'

interface CollectionScreenProps {
    onBack: () => void
}

export function CollectionScreen({ onBack }: CollectionScreenProps) {
    const { t, i18n } = useTranslation()
    const isKorean = i18n.language === 'ko'
    const { unlockedWobbles, getProgress } = useCollectionStore()
    const { getStudiedFormulas } = useProgressStore()
    const wobblediverRecord = useMinigameRecordStore((s) => s.getWobblediverRecord())
    const {
        isUnlocked: isAchievementUnlocked,
        getProgress: getAchievementProgress,
        getAchievementProgress: getAchievementItemProgress,
    } = useAchievementStore()
    const progress = getProgress()
    const achievementProgress = getAchievementProgress()
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState<TabType>('characters')
    const [selectedWobble, setSelectedWobble] = useState<WobbleShape | null>(null)
    const [demoExpression, setDemoExpression] = useState<WobbleExpression>('happy')

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    // Cycle through expressions when a wobble is selected
    useEffect(() => {
        if (!selectedWobble) return

        const expressions: WobbleExpression[] =
            selectedWobble === 'shadow'
                ? ['angry', 'worried', 'effort', 'angry', 'struggle']
                : selectedWobble === 'einstein'
                  ? ['happy', 'surprised', 'excited', 'effort', 'happy'] // Scientist expressions
                  : ['happy', 'excited', 'surprised', 'worried', 'sleepy']
        let index = 0
        setDemoExpression(expressions[0])

        const interval = setInterval(() => {
            index = (index + 1) % expressions.length
            setDemoExpression(expressions[index])
        }, 1500)

        return () => clearInterval(interval)
    }, [selectedWobble])

    const isUnlocked = (shape: WobbleShape) => unlockedWobbles.includes(shape)

    const handleCardClick = (shape: WobbleShape) => {
        if (isUnlocked(shape)) {
            setSelectedWobble(selectedWobble === shape ? null : shape)
            setDemoExpression('happy')
        }
    }

    const studiedFormulas = getStudiedFormulas()
    const totalFormulas = Object.keys(formulas).length

    // Tab icons reduced for mobile 9:16 optimization
    const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
        {
            id: 'characters',
            icon: <Users className="w-3.5 h-3.5" />,
            label: isKorean ? '캐릭터' : 'Chars',
        },
        {
            id: 'formulas',
            icon: <BookOpen className="w-3.5 h-3.5" />,
            label: isKorean ? '학습' : 'Study',
        },
        {
            id: 'achievements',
            icon: <Trophy className="w-3.5 h-3.5" />,
            label: isKorean ? '업적' : 'Achieve',
        },
        {
            id: 'records',
            icon: <Target className="w-3.5 h-3.5" />,
            label: isKorean ? '기록' : 'Stats',
        },
    ]

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: theme.felt }}>
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-40">
                <Balatro
                    color1={collectionPreset.color1}
                    color2={collectionPreset.color2}
                    color3={collectionPreset.color3}
                    spinSpeed={collectionPreset.spinSpeed}
                    spinRotation={collectionPreset.spinRotation}
                    contrast={collectionPreset.contrast}
                    lighting={collectionPreset.lighting}
                    spinAmount={collectionPreset.spinAmount}
                    pixelFilter={collectionPreset.pixelFilter}
                    isRotate={collectionPreset.isRotate}
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
                        {isKorean ? '컬렉션' : 'COLLECTION'}
                    </h1>
                </div>
            </div>

            {/* Tab Bar - optimized for mobile 9:16 */}
            <div
                className="absolute z-20 w-full flex justify-center gap-1.5"
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 52px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                }}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    const tabColor =
                        tab.id === 'characters'
                            ? theme.blue
                            : tab.id === 'formulas'
                              ? theme.gold
                              : tab.id === 'achievements'
                                ? theme.purple
                                : theme.red
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all',
                                'active:scale-95'
                            )}
                            style={{
                                background: isActive ? tabColor : theme.bgPanel,
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 2px 0 ${theme.border}`,
                                opacity: isActive ? 1 : 0.7,
                            }}
                        >
                            <span
                                style={{
                                    color: isActive
                                        ? tab.id === 'formulas'
                                            ? '#1a1a1a'
                                            : 'white'
                                        : 'rgba(255,255,255,0.6)',
                                }}
                            >
                                {tab.icon}
                            </span>
                            <span
                                className="text-xs font-bold"
                                style={{
                                    color: isActive
                                        ? tab.id === 'formulas'
                                            ? '#1a1a1a'
                                            : 'white'
                                        : 'rgba(255,255,255,0.7)',
                                }}
                            >
                                {tab.label}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Content - adjusted for compact tab bar */}
            <div
                className="absolute z-10 overflow-y-auto"
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 105px)',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingTop: 8,
                    paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 60px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                {activeTab === 'characters' && (
                    <CharactersTab
                        mounted={mounted}
                        lang={i18n.language}
                        isUnlocked={isUnlocked}
                        selectedWobble={selectedWobble}
                        demoExpression={demoExpression}
                        onCardClick={handleCardClick}
                        progress={progress}
                    />
                )}
                {activeTab === 'formulas' && (
                    <FormulasTab
                        mounted={mounted}
                        isKorean={isKorean}
                        studiedFormulas={studiedFormulas}
                        totalFormulas={totalFormulas}
                    />
                )}
                {activeTab === 'achievements' && (
                    <AchievementsTab
                        mounted={mounted}
                        lang={i18n.language}
                        isAchievementUnlocked={isAchievementUnlocked}
                        getAchievementItemProgress={getAchievementItemProgress}
                        achievementProgress={achievementProgress}
                    />
                )}
                {activeTab === 'records' && (
                    <RecordsTab
                        mounted={mounted}
                        isKorean={isKorean}
                        wobblediverRecord={wobblediverRecord}
                    />
                )}
            </div>
        </div>
    )
}

// Characters Tab Component
function CharactersTab({
    mounted,
    lang,
    isUnlocked,
    selectedWobble,
    demoExpression,
    onCardClick,
    progress,
}: {
    mounted: boolean
    lang: string
    isUnlocked: (shape: WobbleShape) => boolean
    selectedWobble: WobbleShape | null
    demoExpression: WobbleExpression
    onCardClick: (shape: WobbleShape) => void
    progress: { unlocked: number; total: number }
}) {
    return (
        <>
            {/* Progress Badge */}
            <div
                className={cn(
                    'flex justify-center mb-5',
                    'transition-all duration-500',
                    mounted ? 'opacity-100' : 'opacity-0'
                )}
            >
                <div
                    className="px-5 py-2 rounded-lg"
                    style={{
                        background: theme.blue,
                        border: `3px solid ${theme.border}`,
                        boxShadow: `0 4px 0 ${theme.border}`,
                    }}
                >
                    <span className="text-sm font-black text-white tracking-wide">
                        {progress.unlocked} / {progress.total}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {ALL_SHAPES.map((shape, index) => {
                    const character = WOBBLE_CHARACTERS[shape]
                    const unlocked = isUnlocked(shape)
                    const isSelected = selectedWobble === shape

                    return (
                        <div
                            key={shape}
                            className={cn(
                                'transition-all duration-300',
                                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            )}
                            style={{ transitionDelay: `${index * 80}ms` }}
                        >
                            <button
                                onClick={() => onCardClick(shape)}
                                disabled={!unlocked}
                                className={cn(
                                    'w-full transition-all relative rounded-xl overflow-hidden',
                                    unlocked ? 'active:scale-[0.97]' : 'cursor-not-allowed'
                                )}
                                style={{
                                    background: unlocked ? theme.bgPanel : 'rgba(0,0,0,0.3)',
                                    border: `3px solid ${isSelected ? theme.gold : theme.border}`,
                                    boxShadow: isSelected
                                        ? `0 4px 0 ${theme.border}, 0 0 12px ${theme.gold}40`
                                        : `0 4px 0 ${theme.border}`,
                                    opacity: unlocked ? 1 : 0.6,
                                }}
                            >
                                {/* Card shine effect for unlocked */}
                                {unlocked && (
                                    <div
                                        className="absolute inset-0 opacity-20"
                                        style={{
                                            background:
                                                'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, transparent 100%)',
                                        }}
                                    />
                                )}

                                <div className="flex justify-center pt-5 pb-2">
                                    <WobbleDisplay
                                        size={65}
                                        shape={shape}
                                        color={unlocked ? character.color : 0x333333}
                                        expression={
                                            unlocked
                                                ? isSelected
                                                    ? demoExpression
                                                    : 'happy'
                                                : 'none'
                                        }
                                    />
                                </div>

                                <div className="px-3 pb-4 text-center">
                                    <h3
                                        className="text-base font-black mb-1"
                                        style={{
                                            color: unlocked ? theme.gold : 'rgba(255,255,255,0.25)',
                                            textShadow: unlocked ? '0 1px 0 #8a6d1a' : 'none',
                                        }}
                                    >
                                        {unlocked ? localizeText(character.name, lang) : '???'}
                                    </h3>
                                    <p
                                        className="text-xs leading-tight font-medium"
                                        style={{
                                            color: unlocked
                                                ? 'rgba(255,255,255,0.65)'
                                                : 'rgba(255,255,255,0.2)',
                                        }}
                                    >
                                        {unlocked
                                            ? localizeText(character.personality, lang)
                                            : localizeText(
                                                  {
                                                      ko: '아직 만나지 못했어요',
                                                      en: 'Not yet discovered',
                                                      ja: 'まだ発見していません',
                                                  },
                                                  lang
                                              )}
                                    </p>
                                </div>

                                {isSelected && (
                                    <div
                                        className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center rounded-lg"
                                        style={{
                                            background: theme.gold,
                                            border: `2px solid ${theme.border}`,
                                            boxShadow: `0 2px 0 ${theme.border}`,
                                        }}
                                    >
                                        <Sparkles className="w-4 h-4 text-black" />
                                    </div>
                                )}
                            </button>
                        </div>
                    )
                })}
            </div>
        </>
    )
}

// Formulas Tab Component
function FormulasTab({
    mounted,
    isKorean,
    studiedFormulas,
    totalFormulas,
}: {
    mounted: boolean
    isKorean: boolean
    studiedFormulas: string[]
    totalFormulas: number
}) {
    // Group formulas by category
    const categories = [
        {
            id: 'mechanics',
            name: isKorean ? '역학' : 'Mechanics',
            color: theme.red,
            formulas: [
                'newton-second',
                'kinetic-energy',
                'momentum',
                'hooke',
                'centripetal',
                'elastic-collision',
                'pressure',
                'torque',
                'angular-momentum',
                'bernoulli',
                'rotational-energy',
            ],
        },
        {
            id: 'gravity',
            name: isKorean ? '중력' : 'Gravity',
            color: theme.purple,
            formulas: [
                'gravity',
                'pendulum',
                'free-fall',
                'projectile',
                'escape-velocity',
                'kepler-third',
            ],
        },
        {
            id: 'waves',
            name: isKorean ? '파동 & 광학' : 'Waves & Optics',
            color: theme.blue,
            formulas: [
                'wave',
                'reflection',
                'snell',
                'lens',
                'standing-wave',
                'doppler',
                'inverse-square',
                'beat-frequency',
            ],
        },
        {
            id: 'thermo',
            name: isKorean ? '열역학' : 'Thermodynamics',
            color: '#e67e22',
            formulas: [
                'ideal-gas',
                'heat',
                'first-law',
                'entropy',
                'thermal-conduction',
                'stefan-boltzmann',
                'wien',
            ],
        },
        {
            id: 'electricity',
            name: isKorean ? '전자기' : 'Electricity',
            color: '#f1c40f',
            formulas: [
                'ohm',
                'coulomb',
                'electric-power',
                'lorentz',
                'capacitor',
                'faraday',
                'magnetic-field',
            ],
        },
        {
            id: 'modern',
            name: isKorean ? '현대 물리' : 'Modern Physics',
            color: theme.green,
            formulas: ['buoyancy', 'photoelectric', 'debroglie', 'time-dilation'],
        },
        {
            id: 'quantum',
            name: isKorean ? '양자역학' : 'Quantum',
            color: '#9b59b6',
            formulas: ['uncertainty', 'infinite-well', 'tunneling', 'bohr', 'radioactive-decay'],
        },
        {
            id: 'chemistry',
            name: isKorean ? '화학' : 'Chemistry',
            color: '#1abc9c',
            formulas: ['ph', 'dilution', 'reaction-rate'],
        },
    ]

    return (
        <>
            {/* Progress Badge */}
            <div
                className={cn(
                    'flex justify-center mb-5',
                    'transition-all duration-500',
                    mounted ? 'opacity-100' : 'opacity-0'
                )}
            >
                <div
                    className="px-5 py-2 rounded-lg"
                    style={{
                        background: theme.gold,
                        border: `3px solid ${theme.border}`,
                        boxShadow: `0 4px 0 ${theme.border}`,
                    }}
                >
                    <span className="text-sm font-black text-black tracking-wide">
                        {studiedFormulas.length} / {totalFormulas}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                {categories.map((category, catIndex) => {
                    const studiedInCategory = category.formulas.filter((f) =>
                        studiedFormulas.includes(f)
                    ).length
                    const allStudied = studiedInCategory === category.formulas.length

                    return (
                        <div
                            key={category.id}
                            className={cn(
                                'transition-all duration-300',
                                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            )}
                            style={{ transitionDelay: `${catIndex * 80}ms` }}
                        >
                            <div
                                className="p-4 rounded-xl relative overflow-hidden"
                                style={{
                                    background: theme.bgPanel,
                                    border: `3px solid ${allStudied ? category.color : theme.border}`,
                                    boxShadow: allStudied
                                        ? `0 4px 0 ${theme.border}, 0 0 12px ${category.color}40`
                                        : `0 4px 0 ${theme.border}`,
                                }}
                            >
                                {/* Shine effect when all studied */}
                                {allStudied && (
                                    <div
                                        className="absolute inset-0 opacity-10"
                                        style={{
                                            background: `linear-gradient(135deg, ${category.color} 0%, transparent 50%, transparent 100%)`,
                                        }}
                                    />
                                )}

                                {/* Category Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <h3
                                        className="font-black text-sm tracking-wide"
                                        style={{
                                            color: category.color,
                                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                        }}
                                    >
                                        {category.name}
                                    </h3>
                                    <div
                                        className="px-2.5 py-1 rounded-md"
                                        style={{
                                            background: category.color,
                                            border: `2px solid ${theme.border}`,
                                            boxShadow: `0 2px 0 ${theme.border}`,
                                        }}
                                    >
                                        <span className="text-xs font-black text-white">
                                            {studiedInCategory}/{category.formulas.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Formula Pills */}
                                <div className="flex flex-wrap gap-2">
                                    {category.formulas.map((formulaId) => {
                                        const formula = formulas[formulaId]
                                        const studied = studiedFormulas.includes(formulaId)

                                        return (
                                            <div
                                                key={formulaId}
                                                className="px-2.5 py-1 text-xs font-bold rounded-md transition-all"
                                                style={{
                                                    background: studied
                                                        ? category.color
                                                        : 'rgba(0,0,0,0.3)',
                                                    color: studied
                                                        ? 'white'
                                                        : 'rgba(255,255,255,0.35)',
                                                    border: `2px solid ${studied ? theme.border : 'rgba(255,255,255,0.1)'}`,
                                                    boxShadow: studied
                                                        ? `0 2px 0 ${theme.border}`
                                                        : 'none',
                                                }}
                                            >
                                                {formula
                                                    ? localizeText(
                                                          formula.name,
                                                          isKorean ? 'ko' : 'en'
                                                      )
                                                    : formulaId}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}

// Abyss theme for Wobblediver (matching GameSelectScreen)
const abyssTheme = {
    bg: '#0a0510',
    accent: '#6b5b95',
    teal: '#4ecdc4',
}

// Records Tab Component
function RecordsTab({
    mounted,
    isKorean,
    wobblediverRecord,
}: {
    mounted: boolean
    isKorean: boolean
    wobblediverRecord: WobblediverRecord
}) {
    const rankColors: Record<string, string> = {
        S: '#ffd700',
        A: '#9b59b6',
        B: '#4a9eff',
        C: '#2ecc71',
        D: '#95a5a6',
    }

    const hasRecords = wobblediverRecord.totalGames > 0

    return (
        <div className="space-y-4">
            {/* Wobblediver Record Card */}
            <div
                className={cn(
                    'transition-all duration-500',
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                )}
            >
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        background: `linear-gradient(180deg, #1a0a25 0%, ${abyssTheme.bg} 100%)`,
                        border: `3px solid ${abyssTheme.accent}50`,
                        boxShadow: `0 4px 0 ${theme.border}, 0 0 15px ${abyssTheme.accent}30`,
                    }}
                >
                    {/* Header */}
                    <div
                        className="px-4 py-3 flex items-center gap-3"
                        style={{
                            background: `linear-gradient(90deg, ${abyssTheme.accent}30 0%, transparent 100%)`,
                            borderBottom: `2px solid ${abyssTheme.accent}30`,
                        }}
                    >
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                                background: abyssTheme.accent,
                                border: `2px solid ${theme.border}`,
                            }}
                        >
                            <Waves className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-sm">
                                {isKorean ? '워블다이버' : 'Wobblediver'}
                            </h3>
                            <p
                                className="text-[10px] font-medium"
                                style={{ color: abyssTheme.teal }}
                            >
                                {isKorean ? '심연 다이빙 미니게임' : 'Abyss Diving Minigame'}
                            </p>
                        </div>
                        {/* Best Rank Badge */}
                        <div
                            className="ml-auto px-3 py-1.5 rounded-lg"
                            style={{
                                background: hasRecords
                                    ? rankColors[wobblediverRecord.bestRank]
                                    : 'rgba(255,255,255,0.1)',
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 2px 0 ${theme.border}`,
                            }}
                        >
                            <span
                                className="text-lg font-black"
                                style={{ color: hasRecords ? 'white' : 'rgba(255,255,255,0.3)' }}
                            >
                                {hasRecords ? wobblediverRecord.bestRank : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Best Depth */}
                            <div
                                className="p-3 rounded-lg"
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: `2px solid ${abyssTheme.accent}30`,
                                }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Target
                                        className="w-3.5 h-3.5"
                                        style={{ color: abyssTheme.teal }}
                                    />
                                    <span className="text-[10px] font-medium text-white/50">
                                        {isKorean ? '최고 깊이' : 'Best Depth'}
                                    </span>
                                </div>
                                <div
                                    className="text-2xl font-black"
                                    style={{ color: abyssTheme.teal }}
                                >
                                    {wobblediverRecord.bestDepth}
                                </div>
                            </div>

                            {/* High Score */}
                            <div
                                className="p-3 rounded-lg"
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: `2px solid ${theme.gold}30`,
                                }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Trophy className="w-3.5 h-3.5" style={{ color: theme.gold }} />
                                    <span className="text-[10px] font-medium text-white/50">
                                        {isKorean ? '최고 점수' : 'High Score'}
                                    </span>
                                </div>
                                <div className="text-2xl font-black" style={{ color: theme.gold }}>
                                    {wobblediverRecord.highScore.toLocaleString()}
                                </div>
                            </div>

                            {/* Total Games */}
                            <div
                                className="p-3 rounded-lg"
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: `2px solid ${theme.blue}30`,
                                }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs">🎮</span>
                                    <span className="text-[10px] font-medium text-white/50">
                                        {isKorean ? '총 플레이' : 'Total Games'}
                                    </span>
                                </div>
                                <div className="text-2xl font-black" style={{ color: theme.blue }}>
                                    {wobblediverRecord.totalGames}
                                </div>
                            </div>

                            {/* Perfect Escapes */}
                            <div
                                className="p-3 rounded-lg"
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: `2px solid ${rankColors.S}30`,
                                }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs">⭐</span>
                                    <span className="text-[10px] font-medium text-white/50">
                                        {isKorean ? 'S랭크 횟수' : 'S-Ranks'}
                                    </span>
                                </div>
                                <div
                                    className="text-2xl font-black"
                                    style={{ color: rankColors.S }}
                                >
                                    {wobblediverRecord.perfectEscapes}
                                </div>
                            </div>
                        </div>

                        {/* Average Stats or Play Prompt */}
                        <div
                            className="mt-3 pt-3 flex justify-between text-[10px]"
                            style={{ borderTop: `1px solid ${abyssTheme.accent}20` }}
                        >
                            {hasRecords ? (
                                <>
                                    <span className="text-white/40">
                                        {isKorean ? '평균 깊이' : 'Avg Depth'}:{' '}
                                        <span style={{ color: abyssTheme.teal }}>
                                            {(
                                                wobblediverRecord.totalDepth /
                                                wobblediverRecord.totalGames
                                            ).toFixed(1)}
                                        </span>
                                    </span>
                                    <span className="text-white/40">
                                        {isKorean ? '평균 점수' : 'Avg Score'}:{' '}
                                        <span style={{ color: theme.gold }}>
                                            {Math.round(
                                                wobblediverRecord.totalScore /
                                                    wobblediverRecord.totalGames
                                            ).toLocaleString()}
                                        </span>
                                    </span>
                                </>
                            ) : (
                                <span className="text-white/30 w-full text-center">
                                    {isKorean
                                        ? '아직 플레이 기록이 없습니다'
                                        : 'No play records yet'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Last Played */}
                    {wobblediverRecord.lastPlayedAt && (
                        <div
                            className="px-4 py-2 text-center text-[10px] font-medium"
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                color: 'rgba(255,255,255,0.35)',
                                borderTop: `1px solid ${abyssTheme.accent}20`,
                            }}
                        >
                            {isKorean ? '마지막 플레이: ' : 'Last played: '}
                            {new Date(wobblediverRecord.lastPlayedAt).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>

            {/* More Games Coming Soon */}
            <div
                className={cn(
                    'transition-all duration-500 delay-150',
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                )}
            >
                <div
                    className="p-4 rounded-xl text-center"
                    style={{
                        background: theme.bgPanel,
                        border: `3px solid ${theme.border}`,
                        boxShadow: `0 4px 0 ${theme.border}`,
                        opacity: 0.6,
                    }}
                >
                    <p className="text-white/40 text-xs font-medium">
                        {isKorean
                            ? '더 많은 미니게임이 곧 추가됩니다!'
                            : 'More minigames coming soon!'}
                    </p>
                </div>
            </div>
        </div>
    )
}

// Achievements Tab Component
function AchievementsTab({
    mounted,
    lang,
    isAchievementUnlocked,
    getAchievementItemProgress,
    achievementProgress,
}: {
    mounted: boolean
    lang: string
    isAchievementUnlocked: (id: string) => boolean
    getAchievementItemProgress: (id: string) => AchievementProgress | null
    achievementProgress: { unlocked: number; total: number }
}) {
    const isKorean = lang === 'ko'
    const [activeCategory, setActiveCategory] = useState<AchievementCategory>('sandbox')

    // Get data for level challenges
    const { studiedFormulas } = useProgressStore()
    const { totalSolved } = useChallengeStore()

    const levelChallengeValues: Record<LevelChallengeId, number> = {
        'formula-discovery': studiedFormulas.size,
        'challenge-solver': totalSolved,
    }

    // Get subcategories for each main category
    // Note: 'survivor' is hidden until the mode is released
    const sandboxSubcategories: AchievementSubcategory[] = ['collection']
    const gameSubcategories: AchievementSubcategory[] = ['wobblediver']

    const subcategories =
        activeCategory === 'sandbox' ? sandboxSubcategories : gameSubcategories

    // Calculate visible achievements progress (excluding survivor)
    const visibleAchievements = ACHIEVEMENTS.filter((a) => a.subcategory !== 'survivor')
    const visibleUnlockedCount = visibleAchievements.filter((a) =>
        isAchievementUnlocked(a.id)
    ).length
    const visibleTotalCount = visibleAchievements.length

    return (
        <>
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
                        {isKorean ? '전체 진행률' : 'Overall Progress'}
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
                            {isKorean ? '도전 과제' : 'Challenges'}
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
                                                <span className="text-xl">{challenge.icon}</span>
                                                <span
                                                    className="font-black"
                                                    style={{ color: challenge.color }}
                                                >
                                                    {localizeText(challenge.name, lang)}
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
                                            {localizeText(currentTitle, lang)}
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
                                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                                                        {currentValue} / {nextLevel.requirement}
                                                    </span>
                                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                                                        {isKorean
                                                            ? `다음: ${localizeText(nextLevel.title, lang)}`
                                                            : `Next: ${localizeText(nextLevel.title, lang)}`}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        {isMaxLevel && (
                                            <p
                                                className="text-xs font-bold"
                                                style={{ color: theme.gold }}
                                            >
                                                {isKorean ? '🎉 최고 레벨 달성!' : '🎉 Max Level!'}
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
                        isAchievementUnlocked(a.id)
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
                                    {localizeText(categoryInfo.name, lang)}
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
                        isAchievementUnlocked(a.id)
                    ).length
                    const allUnlocked = unlockedCount === subcategoryAchievements.length

                    return (
                        <div
                            key={subcategory}
                            className={cn(
                                'transition-all duration-300',
                                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            )}
                            style={{ transitionDelay: `${subIndex * 80 + 100}ms` }}
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
                                            {localizeText(subcategoryInfo.name, lang)}
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
                                        const unlocked = isAchievementUnlocked(achievement.id)
                                        const progress = getAchievementItemProgress(achievement.id)

                                        return (
                                            <AchievementItem
                                                key={achievement.id}
                                                achievement={achievement}
                                                unlocked={unlocked}
                                                progress={progress}
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
                    {isKorean
                        ? '물리 탐험을 계속하며 업적을 달성해보세요!'
                        : 'Keep exploring physics to unlock more achievements!'}
                </p>
            )}
        </>
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
                        {localizeText(achievement.name, lang)}
                    </p>
                    <p
                        className="text-xs truncate font-medium"
                        style={{
                            color: unlocked ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)',
                        }}
                    >
                        {localizeText(achievement.description, lang)}
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
