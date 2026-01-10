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

const ALL_SHAPES: WobbleShape[] = [
    'circle',
    'square',
    'triangle',
    'star',
    'diamond',
    'pentagon',
    'shadow',
]

// Balatro theme
const theme = {
    bg: '#3d6b59',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
    green: '#2ecc71',
    blue: '#3498db',
    red: '#e74c3c',
    purple: '#9b59b6',
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

    const tabs: { id: TabType; icon: React.ReactNode; label: string; count: string }[] = [
        {
            id: 'characters',
            icon: <Users className="w-4 h-4" />,
            label: isKorean ? '캐릭터' : 'Characters',
            count: `${progress.unlocked}/${progress.total}`,
        },
        {
            id: 'formulas',
            icon: <BookOpen className="w-4 h-4" />,
            label: isKorean ? '학습' : 'Study',
            count: `${studiedFormulas.length}/${totalFormulas}`,
        },
        {
            id: 'records',
            icon: <Trophy className="w-4 h-4" />,
            label: isKorean ? '기록' : 'Records',
            count: gameStats.totalGames > 0 ? gameStats.bestRank : '-',
        },
    ]

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
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

            {/* Header */}
            <div
                className="absolute z-20 flex items-center justify-between w-full"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 12px)',
                    left: 0,
                    right: 0,
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                }}
            >
                {/* Back button */}
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

                {/* Title */}
                <h1 className="text-xl font-black" style={{ color: theme.gold }}>
                    {isKorean ? '내 기록' : 'My Progress'}
                </h1>

                {/* Spacer */}
                <div className="w-10" />
            </div>

            {/* Tab Bar */}
            <div
                className="absolute z-20 w-full flex justify-center gap-2"
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 52px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all',
                            activeTab === tab.id ? 'scale-105' : 'opacity-70'
                        )}
                        style={{
                            background: activeTab === tab.id ? theme.bgPanel : 'transparent',
                            border: `2px solid ${activeTab === tab.id ? theme.gold : theme.border}`,
                            boxShadow: activeTab === tab.id ? `0 3px 0 ${theme.border}` : 'none',
                        }}
                    >
                        <span style={{ color: activeTab === tab.id ? theme.gold : 'white' }}>
                            {tab.icon}
                        </span>
                        <span
                            className="text-sm font-bold"
                            style={{ color: activeTab === tab.id ? theme.gold : 'white' }}
                        >
                            {tab.label}
                        </span>
                        <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                                background: activeTab === tab.id ? theme.gold : theme.bgPanelLight,
                                color: activeTab === tab.id ? 'black' : 'white',
                            }}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div
                className="relative z-10 h-full overflow-y-auto"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 120px)',
                    paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 60px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                {activeTab === 'characters' && (
                    <CharactersTab
                        mounted={mounted}
                        isKorean={isKorean}
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
    isKorean,
    isUnlocked,
    selectedWobble,
    demoExpression,
    onCardClick,
    progress,
}: {
    mounted: boolean
    isKorean: boolean
    isUnlocked: (shape: WobbleShape) => boolean
    selectedWobble: WobbleShape | null
    demoExpression: WobbleExpression
    onCardClick: (shape: WobbleShape) => void
    progress: { unlocked: number; total: number }
}) {
    return (
        <>
            <p
                className={cn(
                    'text-center text-white/60 text-sm mb-4',
                    'transition-all duration-500',
                    mounted ? 'opacity-100' : 'opacity-0'
                )}
            >
                {isKorean
                    ? '워블 행성의 주민들을 만나보세요'
                    : 'Meet the residents of Planet Wobble'}
            </p>

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
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <button
                                onClick={() => onCardClick(shape)}
                                disabled={!unlocked}
                                className={cn(
                                    'w-full rounded-xl transition-all relative',
                                    unlocked ? 'active:scale-[0.98]' : 'cursor-not-allowed',
                                    isSelected && '-translate-y-2'
                                )}
                                style={{
                                    background: unlocked ? theme.bgPanel : theme.bgPanelLight,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: isSelected
                                        ? `0 6px 0 ${theme.border}, 0 8px 20px rgba(0,0,0,0.4)`
                                        : `0 3px 0 ${theme.border}`,
                                    opacity: unlocked ? 1 : 0.6,
                                }}
                            >
                                <div className="flex justify-center pt-4 pb-2">
                                    <WobbleDisplay
                                        size={60}
                                        shape={shape}
                                        color={unlocked ? character.color : 0x1a1a1a}
                                        expression={
                                            unlocked
                                                ? isSelected
                                                    ? demoExpression
                                                    : 'happy'
                                                : 'none'
                                        }
                                    />
                                </div>

                                <div className="px-3 pb-3 text-center">
                                    <h3
                                        className="text-lg font-black mb-1"
                                        style={{
                                            color: unlocked ? theme.gold : 'rgba(255,255,255,0.3)',
                                        }}
                                    >
                                        {unlocked
                                            ? isKorean
                                                ? character.nameKo
                                                : character.name
                                            : '???'}
                                    </h3>
                                    <p
                                        className="text-xs leading-tight"
                                        style={{
                                            color: unlocked
                                                ? 'rgba(255,255,255,0.6)'
                                                : 'rgba(255,255,255,0.2)',
                                        }}
                                    >
                                        {unlocked
                                            ? isKorean
                                                ? character.personalityKo
                                                : character.personality
                                            : isKorean
                                              ? '아직 만나지 못했어요'
                                              : 'Not yet discovered'}
                                    </p>
                                </div>

                                {isSelected && (
                                    <div
                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{ background: theme.gold }}
                                    >
                                        <Sparkles className="w-4 h-4 text-black" />
                                    </div>
                                )}
                            </button>
                        </div>
                    )
                })}
            </div>

            {progress.unlocked < progress.total && (
                <p
                    className={cn(
                        'text-center text-white/40 text-xs mt-6',
                        'transition-all duration-500 delay-700',
                        mounted ? 'opacity-100' : 'opacity-0'
                    )}
                >
                    {isKorean
                        ? '물리 법칙을 탐험하며 새로운 주민을 찾아보세요!'
                        : 'Explore the laws of physics to find new residents!'}
                </p>
            )}
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
    const formulaEntries = Object.entries(formulas)

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
            formulas: ['wave', 'reflection', 'snell', 'lens', 'standing-wave'],
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
            formulas: ['ohm', 'coulomb', 'electric-power', 'lorentz', 'capacitor'],
        },
        {
            id: 'modern',
            name: isKorean ? '현대 물리' : 'Modern Physics',
            color: theme.green,
            formulas: ['buoyancy', 'photoelectric', 'debroglie', 'time-dilation'],
        },
    ]

    return (
        <>
            <p
                className={cn(
                    'text-center text-white/60 text-sm mb-4',
                    'transition-all duration-500',
                    mounted ? 'opacity-100' : 'opacity-0'
                )}
            >
                {isKorean
                    ? `${studiedFormulas.length}개의 물리 공식을 학습했습니다`
                    : `You've studied ${studiedFormulas.length} physics formulas`}
            </p>

            <div className="space-y-4">
                {categories.map((category, catIndex) => {
                    const studiedInCategory = category.formulas.filter((f) =>
                        studiedFormulas.includes(f)
                    ).length

                    return (
                        <div
                            key={category.id}
                            className={cn(
                                'transition-all duration-300',
                                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            )}
                            style={{ transitionDelay: `${catIndex * 100}ms` }}
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
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold" style={{ color: category.color }}>
                                        {category.name}
                                    </h3>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{ background: category.color, color: 'white' }}
                                    >
                                        {studiedInCategory}/{category.formulas.length}
                                    </span>
                                </div>

                                {/* Formula Pills */}
                                <div className="flex flex-wrap gap-1.5">
                                    {category.formulas.map((formulaId) => {
                                        const formula = formulas[formulaId]
                                        const studied = studiedFormulas.includes(formulaId)

                                        return (
                                            <div
                                                key={formulaId}
                                                className="px-2 py-1 rounded text-xs"
                                                style={{
                                                    background: studied
                                                        ? category.color
                                                        : theme.bgPanelLight,
                                                    color: studied
                                                        ? 'white'
                                                        : 'rgba(255,255,255,0.4)',
                                                    opacity: studied ? 1 : 0.6,
                                                }}
                                            >
                                                {formula
                                                    ? isKorean
                                                        ? formula.name
                                                        : formula.nameEn || formula.name
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

            {studiedFormulas.length < totalFormulas && (
                <p
                    className={cn(
                        'text-center text-white/40 text-xs mt-6',
                        'transition-all duration-500 delay-700',
                        mounted ? 'opacity-100' : 'opacity-0'
                    )}
                >
                    {isKorean
                        ? '시뮬레이션에서 공식을 학습해보세요!'
                        : 'Study formulas in the simulation!'}
                </p>
            )}
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
        B: '#3498db',
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
            label: isKorean ? '총 플레이 시간' : 'Total Play Time',
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
            label: isKorean ? '최고 생존 시간' : 'Best Survival',
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
                <Trophy className="w-16 h-16 text-white/20 mb-4" />
                <p className="text-white/40 text-center">
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
                    className="rounded-xl p-6 text-center mb-4"
                    style={{
                        background: theme.bgPanel,
                        border: `3px solid ${rankColors[gameStats.bestRank] || theme.border}`,
                        boxShadow: `0 4px 0 ${theme.border}`,
                    }}
                >
                    <p className="text-white/60 text-sm mb-2">
                        {isKorean ? '최고 랭크' : 'Best Rank'}
                    </p>
                    <div
                        className="text-6xl font-black"
                        style={{ color: rankColors[gameStats.bestRank] || 'white' }}
                    >
                        {gameStats.bestRank}
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
                        style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                    >
                        <div
                            className="rounded-xl p-3"
                            style={{
                                background: theme.bgPanel,
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                            }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{stat.icon}</span>
                                <span className="text-white/60 text-xs">{stat.label}</span>
                            </div>
                            <div className="text-xl font-bold" style={{ color: stat.color }}>
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
                        'text-center text-white/40 text-xs mt-6',
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
