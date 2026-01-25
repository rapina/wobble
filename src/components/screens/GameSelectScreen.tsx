import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Play, Lock, Trophy, Target, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Balatro from '@/components/Balatro'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { cn } from '@/lib/utils'
import { useMinigameRecordStore, RUN_UNLOCK_DEPTH } from '@/stores/minigameRecordStore'

// Base theme
const baseTheme = {
    bg: '#0a0a12',
    panel: '#1a1a2e',
    border: '#1a1a1a',
}

// Wobblediver Abyss theme
const abyssTheme = {
    void: '#030508',
    deep: '#0a0f18',
    mid: '#0f1a28',
    accent: '#6b5b95',
    teal: '#4ecdc4',
    red: '#cc4444',
    gold: '#c9a227',
    balatro: {
        color1: '#1a0a25',
        color2: '#0a0f18',
        color3: '#2a1a35',
        spinSpeed: 2,
        spinRotation: 2,
        contrast: 1.2,
        lighting: 0.3,
        spinAmount: 0.15,
        pixelFilter: 800,
        isRotate: false,
    },
}

interface GameConfig {
    id: string
    titleKey: string
    descKey: string
    available: boolean
    tags?: string[]
    theme: {
        primary: string
        secondary: string
        accent: string
        glow: string
    }
    balatro?: typeof abyssTheme.balatro
}

const GAMES: GameConfig[] = [
    {
        id: 'wobblediver',
        titleKey: 'game.wobblediver',
        descKey: 'game.wobblediverDesc',
        available: true,
        tags: [
            'game.physicsTags.pendulumMotion',
            'game.physicsTags.gravity',
            'game.physicsTags.momentum',
        ],
        theme: {
            primary: abyssTheme.accent,
            secondary: abyssTheme.teal,
            accent: abyssTheme.red,
            glow: abyssTheme.accent,
        },
        balatro: abyssTheme.balatro,
    },
    {
        id: 'coming-soon',
        titleKey: 'game.comingSoon',
        descKey: '',
        available: false,
        theme: { primary: '#4a4a5a', secondary: '#3a3a4a', accent: '#5a5a6a', glow: '#4a4a5a' },
    },
]

export type GameMode = 'endless' | 'run'

interface GameSelectScreenProps {
    onBack: () => void
    onSelectAdventure: (adventureId: string, mode?: GameMode) => void
}

// Locked Modal
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
    const eyePositions = useMemo(
        () =>
            Array.from({ length: 5 }, (_, i) => ({
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80,
                size: 8 + Math.random() * 12,
                delay: i * 0.3,
            })),
        []
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
            style={{ background: 'rgba(3, 5, 8, 0.95)' }}
            onClick={onClose}
        >
            {eyePositions.map((eye, i) => (
                <div
                    key={i}
                    className="absolute"
                    style={{
                        left: `${eye.x}%`,
                        top: `${eye.y}%`,
                        opacity: mounted ? 0.3 : 0,
                        transition: `opacity 1s ease-out ${eye.delay}s`,
                    }}
                >
                    <div
                        className="rounded-full animate-pulse"
                        style={{
                            width: eye.size,
                            height: eye.size * 0.5,
                            background: `radial-gradient(ellipse, ${abyssTheme.red}50 0%, transparent 70%)`,
                        }}
                    />
                </div>
            ))}

            <div
                className={cn(
                    'relative max-w-sm w-full rounded-2xl overflow-hidden transition-all duration-500',
                    mounted ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                )}
                style={{
                    background: `linear-gradient(180deg, ${abyssTheme.mid} 0%, ${abyssTheme.void} 100%)`,
                    border: `2px solid ${abyssTheme.accent}50`,
                    boxShadow: `0 0 40px ${abyssTheme.accent}30`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
                    style={{
                        background: `${abyssTheme.deep}cc`,
                        border: `1px solid ${abyssTheme.teal}30`,
                    }}
                >
                    <X className="w-4 h-4" style={{ color: abyssTheme.teal }} />
                </button>

                <div className="p-6 pt-8 text-center">
                    <div
                        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5"
                        style={{
                            background: `radial-gradient(circle, ${abyssTheme.deep} 0%, ${abyssTheme.void} 100%)`,
                            border: `3px solid ${abyssTheme.accent}50`,
                            boxShadow: `0 0 30px ${abyssTheme.accent}30`,
                        }}
                    >
                        <div
                            className="w-12 h-7 rounded-full flex items-center justify-center overflow-hidden"
                            style={{
                                background: 'radial-gradient(ellipse, #d8ccc0 0%, #a89888 100%)',
                            }}
                        >
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{
                                    background: `radial-gradient(circle, ${abyssTheme.red} 0%, #501020 70%)`,
                                }}
                            >
                                <div className="w-3 h-3 rounded-full bg-black animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <h2
                        className="text-xl font-black mb-3"
                        style={{
                            color: abyssTheme.accent,
                            textShadow: `0 0 20px ${abyssTheme.accent}60`,
                        }}
                    >
                        {t('game.abyss.notWorthy')}
                    </h2>
                    <p className="text-sm mb-6" style={{ color: abyssTheme.teal }}>
                        {t('game.abyss.proveYourself')}
                    </p>

                    <div
                        className="rounded-xl p-4 mb-4"
                        style={{
                            background: `${abyssTheme.void}cc`,
                            border: `1px solid ${abyssTheme.teal}20`,
                        }}
                    >
                        <div className="flex justify-between mb-2">
                            <span className="text-xs" style={{ color: `${abyssTheme.teal}99` }}>
                                {t('game.abyss.currentDepth')}
                            </span>
                            <span className="text-xs" style={{ color: `${abyssTheme.gold}99` }}>
                                {t('game.abyss.required')}
                            </span>
                        </div>
                        <div
                            className="h-3 rounded-full overflow-hidden mb-2"
                            style={{ background: abyssTheme.void }}
                        >
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${Math.min(100, (currentDepth / requiredDepth) * 100)}%`,
                                    background: `linear-gradient(90deg, ${abyssTheme.teal} 0%, ${abyssTheme.accent} 100%)`,
                                }}
                            />
                        </div>
                        <div className="flex justify-between">
                            <span className="text-lg font-bold" style={{ color: abyssTheme.teal }}>
                                {currentDepth}
                            </span>
                            <span className="text-lg font-bold" style={{ color: abyssTheme.gold }}>
                                {requiredDepth}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs" style={{ color: `${abyssTheme.accent}80` }}>
                        {t('game.abyss.hint', { depth: requiredDepth })}
                    </p>
                </div>
                <div
                    className="h-1"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${abyssTheme.accent}60, transparent)`,
                    }}
                />
            </div>
        </div>
    )
}

// Wobblediver Full Screen Layout
function WobblediverScreen({
    game,
    onSelectEndless,
    onSelectRun,
    onLockedClick,
    isRunUnlocked,
    bestDepth,
    highScore,
    t,
}: {
    game: GameConfig
    onSelectEndless: () => void
    onSelectRun: () => void
    onLockedClick: () => void
    isRunUnlocked: boolean
    bestDepth: number
    highScore: number
    t: (key: string) => string
}) {
    const hasRecords = bestDepth > 0 || highScore > 0

    // More watching eyes scattered around (increased for atmosphere)
    const eyes = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => ({
                x: 5 + (i % 2 === 0 ? Math.random() * 30 : 65 + Math.random() * 30),
                y: 25 + Math.random() * 55,
                size: 10 + Math.random() * 22,
                delay: i * 0.4,
            })),
        []
    )

    const bubbles = useMemo(
        () =>
            Array.from({ length: 15 }, (_, i) => ({
                x: Math.random() * 100,
                delay: Math.random() * 8,
                duration: 6 + Math.random() * 5,
                size: 2 + Math.random() * 6,
            })),
        []
    )

    // Floating particles (eldritch motes) - more for atmosphere
    const particles = useMemo(
        () =>
            Array.from({ length: 30 }, () => ({
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: 1 + Math.random() * 4,
                duration: 3 + Math.random() * 5,
                delay: Math.random() * 6,
            })),
        []
    )

    return (
        <div className="absolute inset-0 flex flex-col overflow-hidden">
            {/* === GIANT WATCHING EYE - MATCHING GAME STYLE === */}
            <div className="absolute top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1]">
                <div className="relative animate-giant-eye-pulse">
                    {/* Outer red glow (like drawAbyssEyeOverlay) */}
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{
                            width: 300,
                            height: 150,
                            background: `radial-gradient(ellipse, #ef444480 0%, transparent 70%)`,
                            filter: 'blur(30px)',
                        }}
                    />
                    {/* Main eye - red ellipse like in game */}
                    <div
                        className="relative animate-eye-blink-slow"
                        style={{
                            width: 200,
                            height: 90,
                            borderRadius: '50%',
                            background: `radial-gradient(ellipse, #dc2626 0%, #991b1b 60%, #7f1d1d 100%)`,
                            boxShadow: `0 0 60px #dc2626aa, 0 0 100px #dc262660, inset 0 -10px 30px rgba(0,0,0,0.4)`,
                        }}
                    >
                        {/* Vertical slit pupil - matching game exactly */}
                        <div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-iris-shift"
                            style={{
                                width: 30,
                                height: 60,
                                borderRadius: '50%',
                                background: '#000000',
                                boxShadow: `0 0 10px ${abyssTheme.void}`,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* === ABYSS MOUTH AT BOTTOM - Like drawAbyssMouth === */}
            <div className="absolute bottom-20 left-0 right-0 h-40 pointer-events-none z-[2]">
                <svg
                    viewBox="0 0 400 160"
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMax slice"
                >
                    <defs>
                        <radialGradient id="mouthGrad" cx="50%" cy="100%" r="80%">
                            <stop offset="0%" stopColor="#2a0818" />
                            <stop offset="40%" stopColor="#150510" />
                            <stop offset="100%" stopColor="#050208" />
                        </radialGradient>
                        <filter id="mouthGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {/* Outer glow */}
                    <ellipse
                        cx="200"
                        cy="160"
                        rx="150"
                        ry="80"
                        fill="#dc262620"
                        filter="url(#mouthGlow)"
                    />
                    {/* Mouth opening */}
                    <ellipse
                        cx="200"
                        cy="160"
                        rx="130"
                        ry="70"
                        fill="url(#mouthGrad)"
                        className="animate-mouth-pulse"
                    />
                    {/* Inner darkness */}
                    <ellipse cx="200" cy="165" rx="90" ry="50" fill="#000" opacity="0.95" />
                    {/* Upper teeth - sharp fangs */}
                    {[-90, -55, -20, 20, 55, 90].map((offset, i) => (
                        <polygon
                            key={i}
                            points={`${200 + offset - 10},100 ${200 + offset},125 ${200 + offset + 10},100`}
                            fill="#f5f5dc"
                            className="animate-teeth"
                            style={{
                                animationDelay: `${i * 0.1}s`,
                                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))',
                            }}
                        />
                    ))}
                    {/* Smaller inner teeth */}
                    {[-70, -35, 0, 35, 70].map((offset, i) => (
                        <polygon
                            key={`inner-${i}`}
                            points={`${200 + offset - 6},105 ${200 + offset},118 ${200 + offset + 6},105`}
                            fill="#e8e8d8"
                            opacity="0.85"
                            className="animate-teeth"
                            style={{ animationDelay: `${i * 0.15 + 0.05}s` }}
                        />
                    ))}
                    {/* Gum/lip line - darker and more menacing */}
                    <path
                        d="M70,105 Q135,85 200,80 Q265,85 330,105"
                        stroke="#4a1525"
                        strokeWidth="10"
                        fill="none"
                        opacity="0.9"
                    />
                    {/* Inner gum highlight */}
                    <path
                        d="M90,108 Q145,92 200,88 Q255,92 310,108"
                        stroke="#6a2535"
                        strokeWidth="4"
                        fill="none"
                        opacity="0.6"
                    />
                </svg>
            </div>

            {/* === FLOATING ELDRITCH PARTICLES === */}
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute rounded-full animate-float-particle"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        background: i % 3 === 0 ? abyssTheme.accent : abyssTheme.teal,
                        boxShadow: `0 0 ${p.size * 2}px ${i % 3 === 0 ? abyssTheme.accent : abyssTheme.teal}`,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                        opacity: 0.6,
                    }}
                />
            ))}

            {/* === SMALL WATCHING EYES - Game style with vertical slit pupils === */}
            {eyes.map((eye, i) => (
                <div
                    key={i}
                    className="absolute animate-eye-blink z-5"
                    style={{
                        left: `${eye.x}%`,
                        top: `${eye.y}%`,
                        animationDelay: `${eye.delay}s`,
                        animationDuration: `${4 + i * 0.5}s`,
                    }}
                >
                    {/* Outer red glow - like drawAbyssEyeOverlay */}
                    <div
                        className="absolute -inset-2 rounded-full"
                        style={{
                            background: `radial-gradient(ellipse, #ef444440 0%, transparent 70%)`,
                            filter: 'blur(4px)',
                        }}
                    />
                    {/* Main eye - red ellipse */}
                    <div
                        className="relative"
                        style={{
                            width: eye.size,
                            height: eye.size * 0.45,
                            borderRadius: '50%',
                            background: `radial-gradient(ellipse, #dc2626 0%, #991b1b 70%)`,
                            boxShadow: `0 0 ${eye.size}px #dc262660`,
                        }}
                    >
                        {/* Vertical slit pupil */}
                        <div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{
                                width: eye.size * 0.15,
                                height: eye.size * 0.35,
                                background: '#000',
                            }}
                        />
                    </div>
                </div>
            ))}

            {/* === RISING BUBBLES === */}
            {bubbles.map((b, i) => (
                <div
                    key={i}
                    className="absolute animate-bubble-rise z-0"
                    style={{
                        left: `${b.x}%`,
                        bottom: 0,
                        animationDelay: `${b.delay}s`,
                        animationDuration: `${b.duration}s`,
                    }}
                >
                    <div
                        className="rounded-full"
                        style={{
                            width: b.size,
                            height: b.size,
                            background: `radial-gradient(circle at 30% 30%, ${abyssTheme.teal}50, transparent)`,
                            border: `1px solid ${abyssTheme.teal}25`,
                        }}
                    />
                </div>
            ))}

            {/* === HERO TITLE SECTION === */}
            <div className="relative z-20 pt-4 pb-2 text-center">
                {/* Skewed title container like HomeScreen */}
                <div className="relative inline-block">
                    {/* Shadow */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: abyssTheme.void,
                            transform: 'skewX(-5deg) translateX(6px) translateY(6px)',
                            clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
                        }}
                    />
                    {/* Border */}
                    <div
                        className="relative px-8 py-3"
                        style={{
                            background: `linear-gradient(135deg, ${abyssTheme.mid} 0%, ${abyssTheme.deep} 100%)`,
                            transform: 'skewX(-5deg)',
                            clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
                            border: `3px solid ${abyssTheme.accent}`,
                            boxShadow: `0 0 30px ${abyssTheme.accent}50, inset 0 0 20px ${abyssTheme.accent}20`,
                        }}
                    >
                        <h1
                            className="text-3xl font-black uppercase tracking-wider"
                            style={{
                                color: abyssTheme.teal,
                                transform: 'skewX(5deg)',
                                textShadow: `0 0 20px ${abyssTheme.teal}, 0 0 40px ${abyssTheme.teal}60, 0 2px 0 ${abyssTheme.void}`,
                            }}
                        >
                            {t(game.titleKey)}
                        </h1>
                    </div>
                    {/* Bottom accent line */}
                    <div
                        className="absolute -bottom-1 left-0 right-0 h-1"
                        style={{
                            background: abyssTheme.teal,
                            transform: 'skewX(-5deg)',
                            boxShadow: `0 0 15px ${abyssTheme.teal}`,
                        }}
                    />
                </div>

                {/* Physics tags */}
                <div className="flex flex-wrap justify-center gap-2 mt-4 px-4">
                    {game.tags?.map((tag) => (
                        <span
                            key={tag}
                            className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                            style={{
                                background: `${abyssTheme.teal}20`,
                                color: abyssTheme.teal,
                                border: `1px solid ${abyssTheme.teal}50`,
                                boxShadow: `0 0 10px ${abyssTheme.teal}30`,
                                transform: 'skewX(-3deg)',
                            }}
                        >
                            {t(tag)}
                        </span>
                    ))}
                </div>
            </div>

            {/* === CHARACTER SECTION === */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-20">
                {/* Light beam from above */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-full opacity-15 pointer-events-none"
                    style={{
                        background: `linear-gradient(180deg, ${abyssTheme.teal}50 0%, transparent 60%)`,
                        clipPath: 'polygon(35% 0%, 65% 0%, 85% 100%, 15% 100%)',
                    }}
                />

                {/* Rope */}
                <div
                    className="w-1.5 h-20 relative"
                    style={{
                        background: `linear-gradient(180deg, ${abyssTheme.gold}40 0%, ${abyssTheme.gold} 100%)`,
                        boxShadow: `0 0 20px ${abyssTheme.gold}60, 0 0 40px ${abyssTheme.gold}30`,
                    }}
                >
                    <div
                        className="absolute inset-0 opacity-60"
                        style={{
                            background: `repeating-linear-gradient(180deg, transparent 0px, transparent 6px, ${abyssTheme.gold}90 6px, ${abyssTheme.gold}90 8px)`,
                        }}
                    />
                </div>

                {/* Wobble with glow */}
                <div className="relative animate-diver-swing">
                    <div
                        className="absolute inset-0 rounded-full blur-3xl -z-10"
                        style={{
                            background: abyssTheme.gold,
                            transform: 'scale(3)',
                            opacity: 0.25,
                        }}
                    />
                    <div
                        className="absolute inset-0 rounded-full blur-xl -z-10"
                        style={{ background: abyssTheme.gold, transform: 'scale(2)', opacity: 0.4 }}
                    />
                    <WobbleDisplay size={90} shape="circle" color={0xf5b041} expression="worried" />
                </div>

                {/* Water surface */}
                <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden pointer-events-none">
                    <svg
                        className="absolute bottom-0 w-full h-20"
                        viewBox="0 0 400 80"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="waterG" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={abyssTheme.accent} stopOpacity="0.5" />
                                <stop offset="50%" stopColor={abyssTheme.deep} stopOpacity="0.85" />
                                <stop offset="100%" stopColor={abyssTheme.void} stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        <path
                            className="animate-water-wave"
                            d="M0,25 Q50,15 100,25 T200,25 T300,25 T400,25 L400,80 L0,80 Z"
                            fill="url(#waterG)"
                        />
                        <path
                            className="animate-water-wave-slow"
                            d="M0,30 Q50,22 100,30 T200,30 T300,30 T400,30 L400,80 L0,80 Z"
                            fill={`${abyssTheme.accent}30`}
                        />
                    </svg>
                </div>
            </div>

            {/* === BOTTOM INFO PANEL === */}
            <div
                className="relative z-30 mx-4 mb-20 p-5 rounded-2xl"
                style={{
                    background: `linear-gradient(180deg, ${abyssTheme.mid}ee 0%, ${abyssTheme.void}ee 100%)`,
                    border: `2px solid ${abyssTheme.accent}50`,
                    boxShadow: `0 -10px 40px ${abyssTheme.void}, 0 0 30px ${abyssTheme.accent}20, inset 0 1px 0 ${abyssTheme.teal}15`,
                    backdropFilter: 'blur(10px)',
                }}
            >
                {/* Game info */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-4">
                        <p
                            className="text-sm leading-relaxed"
                            style={{ color: `${abyssTheme.teal}dd` }}
                        >
                            {t(game.descKey)}
                        </p>
                    </div>

                    {hasRecords && (
                        <div className="flex flex-col gap-2 shrink-0">
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                                style={{
                                    background: `${abyssTheme.teal}20`,
                                    border: `1px solid ${abyssTheme.teal}50`,
                                    boxShadow: `0 0 15px ${abyssTheme.teal}20`,
                                }}
                            >
                                <Target className="w-4 h-4" style={{ color: abyssTheme.teal }} />
                                <span
                                    className="text-sm font-bold"
                                    style={{ color: abyssTheme.teal }}
                                >
                                    {bestDepth}
                                </span>
                            </div>
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                                style={{
                                    background: `${abyssTheme.gold}20`,
                                    border: `1px solid ${abyssTheme.gold}50`,
                                    boxShadow: `0 0 15px ${abyssTheme.gold}20`,
                                }}
                            >
                                <Trophy className="w-4 h-4" style={{ color: abyssTheme.gold }} />
                                <span
                                    className="text-sm font-bold"
                                    style={{ color: abyssTheme.gold }}
                                >
                                    {highScore.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mode buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onSelectEndless}
                        className="flex-1 py-4 rounded-xl font-black text-base uppercase tracking-wide transition-all active:scale-[0.98]"
                        style={{
                            background: `linear-gradient(135deg, ${abyssTheme.teal} 0%, ${abyssTheme.accent} 100%)`,
                            boxShadow: `0 5px 0 ${abyssTheme.accent}, 0 8px 25px ${abyssTheme.teal}50, inset 0 2px 0 rgba(255,255,255,0.2)`,
                            color: '#fff',
                        }}
                    >
                        <Play className="w-5 h-5 inline-block mr-2 mb-0.5" fill="white" />
                        Endless
                    </button>

                    {isRunUnlocked ? (
                        <button
                            onClick={onSelectRun}
                            className="flex-1 py-4 rounded-xl font-black text-base uppercase tracking-wide transition-all active:scale-[0.98]"
                            style={{
                                background: `linear-gradient(135deg, ${abyssTheme.gold} 0%, #a67c00 100%)`,
                                boxShadow: `0 5px 0 #8b6914, 0 8px 25px ${abyssTheme.gold}50, inset 0 2px 0 rgba(255,255,255,0.2)`,
                                color: '#fff',
                            }}
                        >
                            <Target className="w-5 h-5 inline-block mr-2 mb-0.5" />
                            Run
                        </button>
                    ) : (
                        <button
                            onClick={onLockedClick}
                            className="flex-1 py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                            style={{
                                background: `linear-gradient(135deg, ${abyssTheme.deep} 0%, ${abyssTheme.void} 100%)`,
                                border: `2px solid ${abyssTheme.accent}60`,
                                boxShadow: `0 5px 0 ${abyssTheme.void}, inset 0 0 20px ${abyssTheme.accent}15`,
                                color: abyssTheme.accent,
                            }}
                        >
                            <Lock className="w-4 h-4 inline-block mr-2 mb-0.5" />
                            Depth {RUN_UNLOCK_DEPTH}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Coming Soon Screen
function ComingSoonScreen({
    t,
}: {
    t: (key: string, options?: Record<string, unknown>) => string
}) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pb-24">
            <div className="text-8xl mb-6 opacity-20">?</div>
            <h2 className="text-2xl font-black text-white/40 mb-2">{t('game.comingSoon')}</h2>
            <p className="text-sm text-white/30 text-center">
                {t('game.moreComingSoon', { defaultValue: 'More adventures coming soon!' })}
            </p>
        </div>
    )
}

export function GameSelectScreen({ onBack, onSelectAdventure }: GameSelectScreenProps) {
    const { t } = useTranslation()
    const [mounted, setMounted] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showLockedModal, setShowLockedModal] = useState(false)
    const wobblediverRecord = useMinigameRecordStore((s) => s.getWobblediverRecord())
    const isRunUnlocked = useMinigameRecordStore((s) => s.isRunModeUnlocked())

    const currentGame = GAMES[currentIndex]
    const canGoLeft = currentIndex > 0
    const canGoRight = currentIndex < GAMES.length - 1

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div
            className="relative w-full h-full overflow-hidden"
            style={{ background: abyssTheme.void }}
        >
            {/* Dynamic Balatro Background */}
            {currentGame.balatro && (
                <div className="absolute inset-0 opacity-50">
                    <Balatro
                        color1={currentGame.balatro.color1}
                        color2={currentGame.balatro.color2}
                        color3={currentGame.balatro.color3}
                        spinSpeed={currentGame.balatro.spinSpeed}
                        spinRotation={currentGame.balatro.spinRotation}
                        contrast={currentGame.balatro.contrast}
                        lighting={currentGame.balatro.lighting}
                        spinAmount={currentGame.balatro.spinAmount}
                        pixelFilter={currentGame.balatro.pixelFilter}
                        isRotate={currentGame.balatro.isRotate}
                        mouseInteraction={false}
                    />
                </div>
            )}

            {/* Depth gradient overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `linear-gradient(180deg, transparent 0%, ${abyssTheme.void}40 50%, ${abyssTheme.void}90 100%)`,
                }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

            {/* Header */}
            <div
                className="absolute z-50 flex items-center justify-between"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 16px)',
                    left: 'max(env(safe-area-inset-left, 0px), 16px)',
                    right: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                <button
                    onClick={onBack}
                    className={cn(
                        'h-11 w-11 rounded-xl flex items-center justify-center transition-all active:scale-95',
                        mounted ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{
                        background: `${abyssTheme.mid}dd`,
                        border: `2px solid ${abyssTheme.accent}50`,
                        boxShadow: `0 4px 0 ${abyssTheme.void}, 0 0 20px ${abyssTheme.accent}20`,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <ArrowLeft className="w-5 h-5" style={{ color: abyssTheme.teal }} />
                </button>

                {/* Page dots */}
                <div className="flex items-center gap-3">
                    {GAMES.map((_, i) => (
                        <div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full transition-all"
                            style={{
                                background:
                                    i === currentIndex
                                        ? currentGame.theme.secondary
                                        : `${currentGame.theme.secondary}40`,
                                boxShadow:
                                    i === currentIndex
                                        ? `0 0 12px ${currentGame.theme.secondary}`
                                        : 'none',
                                transform: i === currentIndex ? 'scale(1.2)' : 'scale(1)',
                            }}
                        />
                    ))}
                </div>

                <div className="w-11" />
            </div>

            {/* Main Content Area */}
            <div
                className="relative z-10 h-full"
                style={{
                    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 60px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
                }}
            >
                <div
                    className={cn(
                        'h-full transition-all duration-500',
                        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    )}
                >
                    {currentGame.id === 'wobblediver' ? (
                        <WobblediverScreen
                            game={currentGame}
                            onSelectEndless={() => onSelectAdventure('wobblediver', 'endless')}
                            onSelectRun={() => onSelectAdventure('wobblediver', 'run')}
                            onLockedClick={() => setShowLockedModal(true)}
                            isRunUnlocked={isRunUnlocked}
                            bestDepth={wobblediverRecord.bestDepth}
                            highScore={wobblediverRecord.highScore}
                            t={t}
                        />
                    ) : (
                        <ComingSoonScreen t={t} />
                    )}
                </div>
            </div>

            {/* Navigation arrows */}
            <button
                onClick={() => canGoLeft && setCurrentIndex((i) => i - 1)}
                disabled={!canGoLeft}
                className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full flex items-center justify-center transition-all',
                    canGoLeft ? 'opacity-100 active:scale-95' : 'opacity-20'
                )}
                style={{
                    background: `${abyssTheme.mid}cc`,
                    border: `2px solid ${abyssTheme.accent}40`,
                    boxShadow: `0 4px 0 ${abyssTheme.void}`,
                }}
            >
                <ChevronLeft className="w-6 h-6" style={{ color: abyssTheme.teal }} />
            </button>
            <button
                onClick={() => canGoRight && setCurrentIndex((i) => i + 1)}
                disabled={!canGoRight}
                className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full flex items-center justify-center transition-all',
                    canGoRight ? 'opacity-100 active:scale-95' : 'opacity-20'
                )}
                style={{
                    background: `${abyssTheme.mid}cc`,
                    border: `2px solid ${abyssTheme.accent}40`,
                    boxShadow: `0 4px 0 ${abyssTheme.void}`,
                }}
            >
                <ChevronRight className="w-6 h-6" style={{ color: abyssTheme.teal }} />
            </button>

            {/* Locked Modal */}
            <AbyssLockedModal
                isOpen={showLockedModal}
                onClose={() => setShowLockedModal(false)}
                currentDepth={wobblediverRecord.bestDepth}
                requiredDepth={RUN_UNLOCK_DEPTH}
                t={t}
            />

            {/* CSS Animations */}
            <style>{`
                @keyframes diver-swing {
                    0%, 100% { transform: translateY(0) rotate(-4deg); }
                    50% { transform: translateY(-10px) rotate(4deg); }
                }
                .animate-diver-swing { animation: diver-swing 3s ease-in-out infinite; }

                @keyframes giant-eye-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.35; }
                    50% { transform: scale(1.02); opacity: 0.45; }
                }
                .animate-giant-eye-pulse { animation: giant-eye-pulse 5s ease-in-out infinite; }

                @keyframes iris-shift {
                    0%, 100% { transform: translate(-50%, -50%) translateX(0); }
                    30% { transform: translate(-50%, -50%) translateX(-3px); }
                    70% { transform: translate(-50%, -50%) translateX(3px); }
                }
                .animate-iris-shift { animation: iris-shift 8s ease-in-out infinite; }

                @keyframes pupil-dilate {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.15); }
                }
                .animate-pupil-dilate { animation: pupil-dilate 4s ease-in-out infinite; }

                @keyframes eye-blink {
                    0%, 42%, 58%, 100% { opacity: 1; transform: scaleY(1); }
                    50% { opacity: 0.3; transform: scaleY(0.15); }
                }
                .animate-eye-blink { animation: eye-blink 5s ease-in-out infinite; }

                @keyframes eye-blink-slow {
                    0%, 45%, 55%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(0.1); }
                }
                .animate-eye-blink-slow { animation: eye-blink-slow 6s ease-in-out infinite; }

                @keyframes mouth-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.03, 1.06); }
                }
                .animate-mouth-pulse { animation: mouth-pulse 4s ease-in-out infinite; }

                @keyframes teeth {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(2px); }
                }
                .animate-teeth { animation: teeth 2s ease-in-out infinite; }

                @keyframes float-particle {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                    25% { transform: translateY(-10px) translateX(5px); opacity: 0.7; }
                    50% { transform: translateY(-5px) translateX(-3px); opacity: 0.5; }
                    75% { transform: translateY(-15px) translateX(8px); opacity: 0.8; }
                }
                .animate-float-particle { animation: float-particle 5s ease-in-out infinite; }

                @keyframes bubble-rise {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    10% { opacity: 0.6; }
                    90% { opacity: 0.2; }
                    100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
                }
                .animate-bubble-rise { animation: bubble-rise 8s ease-in-out infinite; }

                @keyframes water-wave {
                    0%, 100% { d: path("M0,25 Q50,15 100,25 T200,25 T300,25 T400,25 L400,80 L0,80 Z"); }
                    50% { d: path("M0,25 Q50,35 100,25 T200,25 T300,25 T400,25 L400,80 L0,80 Z"); }
                }
                .animate-water-wave { animation: water-wave 4s ease-in-out infinite; }
                .animate-water-wave-slow { animation: water-wave 6s ease-in-out infinite; animation-delay: 1s; }
            `}</style>
        </div>
    )
}
