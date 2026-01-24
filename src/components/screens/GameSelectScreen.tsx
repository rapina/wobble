import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Play, Lock, Gamepad2, Trophy, Target, X } from 'lucide-react'
import Balatro from '@/components/Balatro'
import { gameSelectPreset } from '@/config/backgroundPresets'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { cn } from '@/lib/utils'
import { useMinigameRecordStore, RUN_UNLOCK_DEPTH } from '@/stores/minigameRecordStore'

// Balatro theme (matching HomeScreen)
const theme = {
    bg: '#1a1a2e',
    felt: '#3d6b59',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
    red: '#e85d4c',
    blue: '#4a9eff',
    pink: '#FF6B9D',
    orange: '#FF8C42',
}

// Wobblediver abyss theme
const abyssTheme = {
    bg: '#0a0510',
    bgGradient: 'linear-gradient(180deg, #1a0a25 0%, #0a0510 50%, #051015 100%)',
    accent: '#6b5b95',
    accentLight: '#8b7bb5',
    teal: '#4ecdc4',
    danger: '#cc4444',
    glow: '#6b5b9580',
}

interface Adventure {
    id: string
    titleKey: string
    descKey: string
    available: boolean
    color: string
    tags?: string[]
}

const ADVENTURES: Adventure[] = [
    {
        id: 'wobblediver',
        titleKey: 'game.wobblediver',
        descKey: 'game.wobblediverDesc',
        available: true,
        color: '#6b5b95',
        tags: [
            'game.physicsTags.pendulumMotion',
            'game.physicsTags.gravity',
            'game.physicsTags.momentum',
        ],
    },
    {
        id: 'coming-soon',
        titleKey: 'game.comingSoon',
        descKey: '',
        available: false,
        color: '#666666',
    },
]

export type GameMode = 'endless' | 'run'

interface GameSelectScreenProps {
    onBack: () => void
    onSelectAdventure: (adventureId: string, mode?: GameMode) => void
}

// Abyss-themed locked modal component - Cthulhu style (subtle version)
function AbyssLockedModal({
    isOpen,
    onClose,
    currentDepth,
    requiredDepth,
    t,
}: {
    isOpen: boolean
    onClose: () => void
    currentDepth: number
    requiredDepth: number
    t: (key: string, options?: Record<string, unknown>) => string
}) {
    const [mounted, setMounted] = useState(false)
    const [eyePositions] = useState(() =>
        Array.from({ length: 5 }, (_, i) => ({
            x: 10 + Math.random() * 80,
            y: 10 + Math.random() * 80,
            size: 8 + Math.random() * 12,
            delay: i * 0.3,
            duration: 4 + Math.random() * 2,
        }))
    )

    useEffect(() => {
        if (isOpen) {
            setMounted(false)
            const timer = setTimeout(() => setMounted(true), 50)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500',
                mounted ? 'opacity-100' : 'opacity-0'
            )}
            style={{ background: 'rgba(5, 2, 10, 0.95)' }}
            onClick={onClose}
        >
            {/* Subtle floating eyes in background */}
            {eyePositions.map((eye, i) => (
                <div
                    key={i}
                    className="absolute transition-all"
                    style={{
                        left: `${eye.x}%`,
                        top: `${eye.y}%`,
                        opacity: mounted ? 0.25 : 0,
                        transition: `opacity 1s ease-out ${eye.delay}s`,
                    }}
                >
                    <div
                        className="rounded-full"
                        style={{
                            width: eye.size,
                            height: eye.size * 0.5,
                            background: 'radial-gradient(ellipse, #301520 0%, transparent 70%)',
                            border: '1px solid #40202a',
                        }}
                    >
                        <div
                            className="absolute rounded-full"
                            style={{
                                width: eye.size * 0.3,
                                height: eye.size * 0.3,
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'radial-gradient(circle, #802030 0%, #400015 100%)',
                                animation: `subtlePulse ${eye.duration}s ease-in-out infinite`,
                            }}
                        />
                    </div>
                </div>
            ))}

            {/* Modal card */}
            <div
                className={cn(
                    'relative max-w-sm w-full rounded-2xl overflow-hidden transition-all duration-500',
                    mounted
                        ? 'scale-100 translate-y-0 opacity-100'
                        : 'scale-95 translate-y-4 opacity-0'
                )}
                style={{
                    background: 'linear-gradient(180deg, #18081a 0%, #0a0510 100%)',
                    border: '2px solid #3a1a40',
                    boxShadow: '0 0 40px rgba(80, 30, 60, 0.4), 0 8px 0 #1a1a1a',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all active:scale-95"
                    style={{
                        background: 'rgba(60, 20, 40, 0.6)',
                        border: '1px solid #4a2a3a',
                    }}
                >
                    <X className="w-4 h-4 text-purple-300/70" />
                </button>

                {/* Content */}
                <div className="p-6 pt-8 text-center relative">
                    {/* Central eye - simplified */}
                    <div
                        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5 relative"
                        style={{
                            background: 'radial-gradient(circle, #1a0a18 0%, #0a0508 100%)',
                            border: '3px solid #4a2a4a',
                            boxShadow: '0 0 20px rgba(100, 30, 60, 0.4)',
                        }}
                    >
                        {/* Eye white */}
                        <div
                            className="w-12 h-7 rounded-full flex items-center justify-center relative overflow-hidden"
                            style={{
                                background: 'radial-gradient(ellipse, #d8ccc0 0%, #a89888 100%)',
                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4)',
                            }}
                        >
                            {/* Iris */}
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{
                                    background:
                                        'radial-gradient(circle, #982840 0%, #501020 70%, #200810 100%)',
                                }}
                            >
                                {/* Pupil */}
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        background: '#000',
                                        animation: 'subtlePulse 4s ease-in-out infinite',
                                    }}
                                />
                            </div>
                            {/* Highlight */}
                            <div className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-white/50" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2
                        className="text-xl font-black mb-3 tracking-wide"
                        style={{
                            color: '#c08090',
                            textShadow: '0 0 15px rgba(180, 80, 100, 0.4)',
                        }}
                    >
                        {t('game.abyss.notWorthy')}
                    </h2>

                    {/* Subtitle */}
                    <p
                        className="text-sm mb-6 leading-relaxed whitespace-pre-line"
                        style={{ color: '#7a6080' }}
                    >
                        {t('game.abyss.proveYourself')}
                    </p>

                    {/* Progress indicator */}
                    <div
                        className="rounded-xl p-4 mb-4"
                        style={{
                            background: 'rgba(30, 15, 35, 0.6)',
                            border: '1px solid #3a1a40',
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs" style={{ color: '#6a5070' }}>
                                {t('game.abyss.currentDepth')}
                            </span>
                            <span className="text-xs" style={{ color: '#6a5070' }}>
                                {t('game.abyss.required')}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div
                            className="h-3 rounded-full overflow-hidden mb-2"
                            style={{ background: '#150a18' }}
                        >
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${Math.min(100, (currentDepth / requiredDepth) * 100)}%`,
                                    background:
                                        currentDepth >= requiredDepth
                                            ? 'linear-gradient(90deg, #4a9a90 0%, #5a4a70 100%)'
                                            : 'linear-gradient(90deg, #501030 0%, #803050 100%)',
                                }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span
                                className="text-lg font-bold"
                                style={{ color: currentDepth > 0 ? '#5a9a90' : '#4a4050' }}
                            >
                                {currentDepth}
                            </span>
                            <span className="text-lg font-bold" style={{ color: '#a08050' }}>
                                {requiredDepth}
                            </span>
                        </div>
                    </div>

                    {/* Hint text */}
                    <p className="text-xs" style={{ color: '#504058' }}>
                        {t('game.abyss.hint', { depth: requiredDepth })}
                    </p>
                </div>

                {/* Subtle bottom accent */}
                <div
                    className="h-1"
                    style={{
                        background: 'linear-gradient(90deg, transparent, #502040, transparent)',
                    }}
                />
            </div>

            {/* CSS animations */}
            <style>{`
                @keyframes subtlePulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    50% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.8; }
                }
            `}</style>
        </div>
    )
}

// Wobblediver themed card component
function WobblediverCard({
    adventure,
    onSelectEndless,
    onSelectRun,
    onLockedClick,
    mounted,
    delay,
    t,
    bestDepth,
    highScore,
    isRunUnlocked,
}: {
    adventure: Adventure
    onSelectEndless: () => void
    onSelectRun: () => void
    onLockedClick: () => void
    mounted: boolean
    delay: number
    t: (key: string) => string
    bestDepth: number
    highScore: number
    isRunUnlocked: boolean
}) {
    const hasRecords = bestDepth > 0 || highScore > 0
    return (
        <div
            className={cn(
                'transition-all duration-500',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div
                className="w-full rounded-2xl overflow-hidden"
                style={{
                    background: abyssTheme.bgGradient,
                    border: `3px solid ${abyssTheme.accent}50`,
                    boxShadow: `0 0 20px ${abyssTheme.glow}, 0 8px 0 ${theme.border}`,
                }}
            >
                {/* Main visual area */}
                <div className="relative h-44 overflow-hidden">
                    {/* Animated background gradient */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `radial-gradient(ellipse at 50% 120%, ${abyssTheme.accent}40 0%, transparent 60%)`,
                        }}
                    />

                    {/* Floating particles effect */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 rounded-full bg-teal-400/30 animate-pulse"
                                style={{
                                    left: `${15 + i * 10}%`,
                                    top: `${60 + (i % 3) * 15}%`,
                                    animationDelay: `${i * 0.3}s`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Tentacles from sides */}
                    <div
                        className="absolute left-0 top-1/2 w-8 h-32 -translate-y-1/2"
                        style={{
                            background: `linear-gradient(90deg, ${abyssTheme.accent}60 0%, transparent 100%)`,
                            clipPath: 'polygon(0 20%, 100% 30%, 80% 50%, 100% 70%, 0 80%)',
                        }}
                    />
                    <div
                        className="absolute right-0 top-1/3 w-6 h-24 -translate-y-1/2"
                        style={{
                            background: `linear-gradient(-90deg, ${abyssTheme.accent}40 0%, transparent 100%)`,
                            clipPath: 'polygon(100% 25%, 0 35%, 20% 50%, 0 65%, 100% 75%)',
                        }}
                    />

                    {/* Main character illustration */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Rope */}
                        <div
                            className="w-0.5 h-8"
                            style={{
                                background: 'linear-gradient(180deg, #8B6914 0%, #D4A84B 100%)',
                            }}
                        />

                        {/* Wobble character */}
                        <div className="relative">
                            <WobbleDisplay
                                size={56}
                                shape="circle"
                                color={0xf5b041}
                                expression="worried"
                            />
                            {/* Glow effect behind character */}
                            <div
                                className="absolute inset-0 -z-10 rounded-full blur-xl"
                                style={{ background: '#f5b04140', transform: 'scale(1.5)' }}
                            />
                        </div>

                        {/* Abyss water surface */}
                        <div className="relative mt-2 w-full">
                            {/* Wave effect */}
                            <svg
                                className="w-full h-8"
                                viewBox="0 0 200 32"
                                preserveAspectRatio="none"
                            >
                                <defs>
                                    <linearGradient
                                        id="abyssGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor={abyssTheme.accent}
                                            stopOpacity="0.6"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor={abyssTheme.bg}
                                            stopOpacity="1"
                                        />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M0,8 Q25,4 50,8 T100,8 T150,8 T200,8 L200,32 L0,32 Z"
                                    fill="url(#abyssGradient)"
                                />
                            </svg>

                            {/* Eyes in the abyss */}
                            <div className="absolute top-3 left-1/4 flex gap-1">
                                <div className="w-2 h-1.5 rounded-full bg-red-400/50 animate-pulse" />
                            </div>
                            <div
                                className="absolute top-4 right-1/3 flex gap-1"
                                style={{ animationDelay: '0.5s' }}
                            >
                                <div className="w-1.5 h-1 rounded-full bg-red-400/40 animate-pulse" />
                            </div>
                            <div className="absolute top-5 left-1/2 flex gap-1">
                                <div
                                    className="w-2.5 h-2 rounded-full bg-red-400/60 animate-pulse"
                                    style={{ animationDelay: '1s' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Physics tags - top left */}
                    {adventure.tags && (
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            {adventure.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm"
                                    style={{
                                        background: `${abyssTheme.teal}30`,
                                        color: abyssTheme.teal,
                                        border: `1px solid ${abyssTheme.teal}50`,
                                    }}
                                >
                                    {t(tag)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info area */}
                <div
                    className="p-4 text-left"
                    style={{
                        background: `linear-gradient(180deg, ${abyssTheme.accent}20 0%, ${abyssTheme.bg} 100%)`,
                        borderTop: `2px solid ${abyssTheme.accent}30`,
                    }}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3
                                className="text-xl font-black tracking-tight"
                                style={{
                                    color: '#fff',
                                    textShadow: `0 0 20px ${abyssTheme.accent}`,
                                }}
                            >
                                {t(adventure.titleKey)}
                            </h3>
                            <p
                                className="text-xs mt-1.5 leading-relaxed line-clamp-2"
                                style={{ color: `${abyssTheme.teal}cc` }}
                            >
                                {t(adventure.descKey)}
                            </p>
                        </div>

                        {/* Records display */}
                        {hasRecords && (
                            <div className="flex flex-col gap-1 ml-3 shrink-0">
                                <div
                                    className="flex items-center gap-1.5 px-2 py-1 rounded"
                                    style={{
                                        background: `${abyssTheme.accent}30`,
                                        border: `1px solid ${abyssTheme.accent}50`,
                                    }}
                                >
                                    <Target
                                        className="w-3 h-3"
                                        style={{ color: abyssTheme.teal }}
                                    />
                                    <span
                                        className="text-[10px] font-bold"
                                        style={{ color: abyssTheme.teal }}
                                    >
                                        {bestDepth}
                                    </span>
                                </div>
                                <div
                                    className="flex items-center gap-1.5 px-2 py-1 rounded"
                                    style={{
                                        background: `${theme.gold}20`,
                                        border: `1px solid ${theme.gold}50`,
                                    }}
                                >
                                    <Trophy className="w-3 h-3" style={{ color: theme.gold }} />
                                    <span
                                        className="text-[10px] font-bold"
                                        style={{ color: theme.gold }}
                                    >
                                        {highScore.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mode selection buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={onSelectEndless}
                            className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.98]"
                            style={{
                                background: `linear-gradient(135deg, ${abyssTheme.teal} 0%, ${abyssTheme.accent} 100%)`,
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                                color: '#fff',
                            }}
                        >
                            <Play className="w-4 h-4 inline-block mr-1.5 mb-0.5" fill="white" />
                            Endless
                        </button>
                        {isRunUnlocked ? (
                            <button
                                onClick={onSelectRun}
                                className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.98]"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.gold} 0%, #b8860b 100%)`,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                    color: '#fff',
                                }}
                            >
                                <Target className="w-4 h-4 inline-block mr-1.5 mb-0.5" />
                                Run
                            </button>
                        ) : (
                            <button
                                onClick={onLockedClick}
                                className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.98]"
                                style={{
                                    background: `linear-gradient(135deg, #3a2040 0%, #2a1530 100%)`,
                                    border: `2px solid #4a2050`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                    color: '#8a6a9a',
                                }}
                            >
                                <Lock className="w-4 h-4 inline-block mr-1.5 mb-0.5" />
                                <span className="text-xs">Depth {RUN_UNLOCK_DEPTH}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Generic locked/coming soon card
function LockedCard({
    adventure,
    mounted,
    delay,
    t,
}: {
    adventure: Adventure
    mounted: boolean
    delay: number
    t: (key: string) => string
}) {
    return (
        <div
            className={cn(
                'transition-all duration-500',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div
                className="w-full rounded-2xl overflow-hidden opacity-50"
                style={{
                    background: theme.bgPanel,
                    border: `3px solid ${theme.border}`,
                    boxShadow: `0 4px 0 ${theme.border}`,
                }}
            >
                {/* Thumbnail Area */}
                <div
                    className="relative h-24 flex items-center justify-center"
                    style={{ background: theme.bgPanelLight }}
                >
                    <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{
                            background: theme.bgPanel,
                            border: `3px solid ${theme.border}`,
                        }}
                    >
                        <Lock className="w-7 h-7 text-white/30" />
                    </div>
                </div>

                {/* Info Area */}
                <div
                    className="p-4 text-left"
                    style={{
                        borderTop: `3px solid ${theme.border}`,
                        background: theme.bgPanel,
                    }}
                >
                    <h3 className="text-base font-black text-white/40">{t(adventure.titleKey)}</h3>
                </div>
            </div>
        </div>
    )
}

export function GameSelectScreen({ onBack, onSelectAdventure }: GameSelectScreenProps) {
    const { t } = useTranslation()
    const [mounted, setMounted] = useState(false)
    const [showLockedModal, setShowLockedModal] = useState(false)
    const wobblediverRecord = useMinigameRecordStore((s) => s.getWobblediverRecord())
    const isRunUnlocked = useMinigameRecordStore((s) => s.isRunModeUnlocked())

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    const renderCard = (adventure: Adventure, index: number) => {
        if (!adventure.available) {
            return (
                <LockedCard
                    key={adventure.id}
                    adventure={adventure}
                    mounted={mounted}
                    delay={index * 150}
                    t={t}
                />
            )
        }

        // Game-specific cards
        switch (adventure.id) {
            case 'wobblediver':
                return (
                    <WobblediverCard
                        key={adventure.id}
                        adventure={adventure}
                        onSelectEndless={() => onSelectAdventure(adventure.id, 'endless')}
                        onSelectRun={() => onSelectAdventure(adventure.id, 'run')}
                        onLockedClick={() => setShowLockedModal(true)}
                        mounted={mounted}
                        delay={index * 150}
                        t={t}
                        bestDepth={wobblediverRecord.bestDepth}
                        highScore={wobblediverRecord.highScore}
                        isRunUnlocked={isRunUnlocked}
                    />
                )
            default:
                return (
                    <LockedCard
                        key={adventure.id}
                        adventure={adventure}
                        mounted={mounted}
                        delay={index * 150}
                        t={t}
                    />
                )
        }
    }

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: theme.felt }}>
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-40">
                <Balatro
                    color1={gameSelectPreset.color1}
                    color2={gameSelectPreset.color2}
                    color3={gameSelectPreset.color3}
                    spinSpeed={gameSelectPreset.spinSpeed}
                    spinRotation={gameSelectPreset.spinRotation}
                    contrast={gameSelectPreset.contrast}
                    lighting={gameSelectPreset.lighting}
                    spinAmount={gameSelectPreset.spinAmount}
                    pixelFilter={gameSelectPreset.pixelFilter}
                    isRotate={gameSelectPreset.isRotate}
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

            {/* Header */}
            <div
                className="absolute z-20 flex items-center gap-3"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 16px)',
                    left: 'max(env(safe-area-inset-left, 0px), 16px)',
                    right: 'max(env(safe-area-inset-right, 0px), 16px)',
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

                {/* Title Badge */}
                <div className="flex-1 flex items-center justify-center">
                    <div
                        className="px-4 py-2 rounded-lg flex items-center gap-2"
                        style={{
                            background: theme.red,
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    >
                        <Gamepad2 className="w-4 h-4 text-white" />
                        <span className="text-sm font-black text-white uppercase tracking-wide">
                            {t('home.game')}
                        </span>
                    </div>
                </div>

                {/* Spacer for centering */}
                <div className="w-10" />
            </div>

            {/* Content */}
            <div
                className="relative z-10 h-full overflow-y-auto"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 80px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                {/* Game Cards */}
                <div className="space-y-4 mt-4">
                    {ADVENTURES.map((adventure, index) => renderCard(adventure, index))}
                </div>

                {/* Footer hint */}
                <div className="mt-8 text-center">
                    <p className="text-white/30 text-xs">
                        {t('game.moreComingSoon', { defaultValue: 'More adventures coming soon!' })}
                    </p>
                </div>
            </div>

            {/* Abyss Locked Modal */}
            <AbyssLockedModal
                isOpen={showLockedModal}
                onClose={() => setShowLockedModal(false)}
                currentDepth={wobblediverRecord.bestDepth}
                requiredDepth={RUN_UNLOCK_DEPTH}
                t={t}
            />
        </div>
    )
}
