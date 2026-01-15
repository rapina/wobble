import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Sparkles, BookOpen, Trophy, Users } from 'lucide-react'
import Balatro from '@/components/Balatro'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore, GameStats } from '@/stores/progressStore'
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

type TabType = 'characters' | 'formulas' | 'records'

interface CollectionScreenProps {
    onBack: () => void
}

export function CollectionScreen({ onBack }: CollectionScreenProps) {
    const { t, i18n } = useTranslation()
    const isKorean = i18n.language === 'ko'
    const { unlockedWobbles, getProgress } = useCollectionStore()
    const { getStudiedFormulas, getGameStats } = useProgressStore()
    const progress = getProgress()
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
    const gameStats = getGameStats()
    const totalFormulas = Object.keys(formulas).length

    const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
        {
            id: 'characters',
            icon: <Users className="w-4 h-4" />,
            label: isKorean ? '캐릭터' : 'Characters',
        },
        {
            id: 'formulas',
            icon: <BookOpen className="w-4 h-4" />,
            label: isKorean ? '학습' : 'Study',
        },
        {
            id: 'records',
            icon: <Trophy className="w-4 h-4" />,
            label: isKorean ? '기록' : 'Stats',
        },
    ]

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: theme.felt }}>
            {/* Balatro Background - HomeScreen과 동일한 스타일 */}
            <div className="absolute inset-0 opacity-40">
                <Balatro
                    color1="#2d5a4a"
                    color2="#1a4035"
                    color3="#0d2018"
                    spinSpeed={1.5}
                    spinRotation={-1}
                    contrast={2}
                    lighting={0.2}
                    spinAmount={0.1}
                    pixelFilter={600}
                    isRotate={true}
                    mouseInteraction={false}
                />
            </div>

            {/* Felt texture overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.3) 100%)',
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

            {/* Tab Bar */}
            <div
                className="absolute z-20 w-full flex justify-center gap-2"
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 56px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    const tabColor = tab.id === 'characters' ? theme.blue : tab.id === 'formulas' ? theme.gold : theme.red
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all',
                                'active:scale-95'
                            )}
                            style={{
                                background: isActive ? tabColor : theme.bgPanel,
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                                opacity: isActive ? 1 : 0.7,
                            }}
                        >
                            <span
                                style={{
                                    color: isActive ? (tab.id === 'formulas' ? '#1a1a1a' : 'white') : 'rgba(255,255,255,0.6)',
                                }}
                            >
                                {tab.icon}
                            </span>
                            <span
                                className="text-sm font-bold"
                                style={{
                                    color: isActive ? (tab.id === 'formulas' ? '#1a1a1a' : 'white') : 'rgba(255,255,255,0.7)',
                                }}
                            >
                                {tab.label}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Content */}
            <div
                className="absolute z-10 overflow-y-auto"
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 120px)',
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
                {activeTab === 'records' && (
                    <RecordsTab mounted={mounted} isKorean={isKorean} gameStats={gameStats} />
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
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, transparent 100%)',
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
                                        {unlocked
                                            ? localizeText(character.name, lang)
                                            : '???'}
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
            formulas: ['wave', 'reflection', 'snell', 'lens', 'standing-wave', 'doppler', 'inverse-square', 'beat-frequency'],
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
            formulas: ['ohm', 'coulomb', 'electric-power', 'lorentz', 'capacitor', 'faraday', 'magnetic-field'],
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
                                                    boxShadow: studied ? `0 2px 0 ${theme.border}` : 'none',
                                                }}
                                            >
                                                {formula
                                                    ? localizeText(formula.name, isKorean ? 'ko' : 'en')
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

// Records Tab Component
function RecordsTab({
    mounted,
    isKorean,
    gameStats,
}: {
    mounted: boolean
    isKorean: boolean
    gameStats: GameStats
}) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const rankColors: Record<string, string> = {
        S: '#ffd700',
        A: '#9b59b6',
        B: '#4a9eff',
        C: '#2ecc71',
        D: '#95a5a6',
    }

    const stats = [
        {
            icon: '🎮',
            label: isKorean ? '총 플레이' : 'Total Games',
            value: `${gameStats.totalGames}`,
            color: theme.blue,
        },
        {
            icon: '⏱',
            label: isKorean ? '총 플레이 시간' : 'Play Time',
            value: formatTime(gameStats.totalPlayTime),
            color: theme.green,
        },
        {
            icon: '💀',
            label: isKorean ? '총 처치' : 'Total Kills',
            value: `${gameStats.totalKills}`,
            color: theme.red,
        },
        {
            icon: '🏆',
            label: isKorean ? '최고 생존' : 'Best Survival',
            value: formatTime(gameStats.bestTime),
            color: theme.gold,
        },
        {
            icon: '⭐',
            label: isKorean ? '최고 레벨' : 'Best Level',
            value: `Lv.${gameStats.bestLevel}`,
            color: theme.purple,
        },
    ]

    if (gameStats.totalGames === 0) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center py-16',
                    'transition-all duration-500',
                    mounted ? 'opacity-100' : 'opacity-0'
                )}
            >
                <div
                    className="w-20 h-20 flex items-center justify-center mb-5 rounded-xl"
                    style={{
                        background: theme.bgPanel,
                        border: `3px solid ${theme.border}`,
                        boxShadow: `0 4px 0 ${theme.border}`,
                    }}
                >
                    <Trophy className="w-10 h-10 text-white/25" />
                </div>
                <p
                    className="text-center text-sm font-medium whitespace-pre-line"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                    {isKorean
                        ? '아직 게임 기록이 없습니다.\n서바이버 모드를 플레이해보세요!'
                        : 'No game records yet.\nTry playing Survivor mode!'}
                </p>
            </div>
        )
    }

    return (
        <>
            {/* Best Rank Card */}
            <div
                className={cn(
                    'transition-all duration-500',
                    mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                )}
            >
                <div
                    className="p-6 text-center mb-5 rounded-xl relative overflow-hidden"
                    style={{
                        background: theme.bgPanel,
                        border: `3px solid ${rankColors[gameStats.bestRank] || theme.border}`,
                        boxShadow: `0 4px 0 ${theme.border}, 0 0 20px ${rankColors[gameStats.bestRank]}30`,
                    }}
                >
                    {/* Shine effect */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            background: `linear-gradient(135deg, ${rankColors[gameStats.bestRank]} 0%, transparent 50%, transparent 100%)`,
                        }}
                    />

                    <p
                        className="text-xs font-bold mb-2 tracking-wider"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        {isKorean ? '최고 랭크' : 'BEST RANK'}
                    </p>
                    <div
                        className="text-7xl font-black"
                        style={{
                            color: rankColors[gameStats.bestRank] || 'white',
                            textShadow: `0 4px 0 rgba(0,0,0,0.3), 0 0 20px ${rankColors[gameStats.bestRank]}50`,
                        }}
                    >
                        {gameStats.bestRank}
                    </div>
                    <div
                        className="mt-2 inline-block px-3 py-1 rounded-md"
                        style={{
                            background: rankColors[gameStats.bestRank],
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 2px 0 ${theme.border}`,
                        }}
                    >
                        <span className="text-xs font-black text-white tracking-wide">
                            {gameStats.bestRank === 'S'
                                ? 'PERFECT'
                                : gameStats.bestRank === 'A'
                                  ? 'EXCELLENT'
                                  : gameStats.bestRank === 'B'
                                    ? 'GREAT'
                                    : gameStats.bestRank === 'C'
                                      ? 'GOOD'
                                      : 'NICE TRY'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={cn(
                            'transition-all duration-300',
                            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        )}
                        style={{ transitionDelay: `${(index + 1) * 80}ms` }}
                    >
                        <div
                            className="p-4 rounded-xl"
                            style={{
                                background: theme.bgPanel,
                                border: `3px solid ${theme.border}`,
                                boxShadow: `0 4px 0 ${theme.border}`,
                            }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{stat.icon}</span>
                                <span className="text-white/55 text-xs font-medium">{stat.label}</span>
                            </div>
                            <div
                                className="text-2xl font-black"
                                style={{
                                    color: stat.color,
                                    textShadow: '0 2px 0 rgba(0,0,0,0.2)',
                                }}
                            >
                                {stat.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Last Played */}
            {gameStats.lastPlayedAt && (
                <p
                    className={cn(
                        'text-center text-white/35 text-xs font-medium mt-6',
                        'transition-all duration-500 delay-700',
                        mounted ? 'opacity-100' : 'opacity-0'
                    )}
                >
                    {isKorean ? '마지막 플레이: ' : 'Last played: '}
                    {new Date(gameStats.lastPlayedAt).toLocaleDateString()}
                </p>
            )}
        </>
    )
}
