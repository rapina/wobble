import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Play, Lock, Trophy, Target, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Balatro from '@/components/Balatro'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { cn } from '@/lib/utils'
import { useMinigameRecordStore } from '@/stores/minigameRecordStore'

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

// Wobblediver Full Screen Layout
function WobblediverScreen({
    game,
    onSelectEndless,
    bestDepth,
    highScore,
    isLoading,
    t,
}: {
    game: GameConfig
    onSelectEndless: () => void
    bestDepth: number
    highScore: number
    isLoading: boolean
    t: (key: string) => string
}) {
    const hasRecords = bestDepth > 0 || highScore > 0

    // Reduced eye count for performance (12 -> 6)
    const eyes = useMemo(
        () =>
            Array.from({ length: 6 }, (_, i) => ({
                x: 5 + (i % 2 === 0 ? Math.random() * 30 : 65 + Math.random() * 30),
                y: 25 + Math.random() * 55,
                size: 12 + Math.random() * 20,
                delay: i * 0.6,
            })),
        []
    )

    // Reduced bubble count for performance (15 -> 8)
    const bubbles = useMemo(
        () =>
            Array.from({ length: 8 }, (_, i) => ({
                x: Math.random() * 100,
                delay: Math.random() * 8,
                duration: 6 + Math.random() * 5,
                size: 3 + Math.random() * 5,
            })),
        []
    )

    // Reduced particle count for performance (30 -> 12)
    const particles = useMemo(
        () =>
            Array.from({ length: 12 }, () => ({
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: 1.5 + Math.random() * 3.5,
                duration: 4 + Math.random() * 4,
                delay: Math.random() * 6,
            })),
        []
    )

    return (
        <div className="absolute inset-0 flex flex-col overflow-hidden">
            {/* === GIANT WATCHING EYE - MATCHING GAME STYLE === */}
            <div className="absolute top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1]">
                <div className="relative animate-giant-eye-pulse" style={{ willChange: 'transform, opacity' }}>
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
                        willChange: 'transform, opacity',
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
                        animationDuration: `${5 + i * 0.8}s`,
                        willChange: 'opacity, transform',
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
                        willChange: 'transform, opacity',
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
                <div className="relative animate-diver-swing" style={{ willChange: 'transform' }}>
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
                        disabled={isLoading}
                        className="flex-1 py-4 rounded-xl font-black text-base uppercase tracking-wide transition-all active:scale-[0.98] disabled:opacity-50"
                        style={{
                            background: `linear-gradient(135deg, ${abyssTheme.teal} 0%, ${abyssTheme.accent} 100%)`,
                            boxShadow: `0 5px 0 ${abyssTheme.accent}, 0 8px 25px ${abyssTheme.teal}50, inset 0 2px 0 rgba(255,255,255,0.2)`,
                            color: '#fff',
                        }}
                    >
                        <Play className="w-5 h-5 inline-block mr-2 mb-0.5" fill="white" />
                        Endless
                    </button>

                    {/* Run mode is temporarily locked */}
                    <button
                        disabled={true}
                        className="flex-1 py-4 rounded-xl font-bold text-sm transition-all opacity-50"
                        style={{
                            background: `linear-gradient(135deg, ${abyssTheme.deep} 0%, ${abyssTheme.void} 100%)`,
                            border: `2px solid ${abyssTheme.accent}40`,
                            boxShadow: `0 5px 0 ${abyssTheme.void}, inset 0 0 20px ${abyssTheme.accent}10`,
                            color: `${abyssTheme.accent}80`,
                        }}
                    >
                        <Lock className="w-4 h-4 inline-block mr-2 mb-0.5" />
                        {t('game.comingSoon')}
                    </button>
                </div>
            </div>

            {/* === LOADING OVERLAY === */}
            {isLoading && (
                <div
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300"
                    style={{
                        background: `linear-gradient(180deg, ${abyssTheme.void}f0 0%, ${abyssTheme.deep}f8 100%)`,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    {/* Giant pulsing eye */}
                    <div className="relative animate-loading-pulse">
                        <div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            style={{
                                width: 200,
                                height: 100,
                                background: `radial-gradient(ellipse, ${abyssTheme.accent}40 0%, transparent 70%)`,
                                filter: 'blur(20px)',
                            }}
                        />
                        <div
                            className="relative"
                            style={{
                                width: 120,
                                height: 54,
                                borderRadius: '50%',
                                background: `radial-gradient(ellipse, #dc2626 0%, #991b1b 60%, #7f1d1d 100%)`,
                                boxShadow: `0 0 40px #dc262680, 0 0 80px #dc262640`,
                            }}
                        >
                            <div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-loading-iris"
                                style={{
                                    width: 18,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: '#000',
                                }}
                            />
                        </div>
                    </div>

                    {/* Depth meter / Progress bar */}
                    <div className="mt-8 w-48">
                        <div className="flex justify-between mb-2">
                            <span
                                className="text-xs uppercase tracking-wider"
                                style={{ color: `${abyssTheme.teal}99` }}
                            >
                                Depth
                            </span>
                            <span
                                className="text-xs font-mono"
                                style={{ color: abyssTheme.teal }}
                            >
                                ???m
                            </span>
                        </div>
                        <div
                            className="h-2 rounded-full overflow-hidden"
                            style={{
                                background: abyssTheme.void,
                                border: `1px solid ${abyssTheme.accent}40`,
                            }}
                        >
                            <div
                                className="h-full rounded-full animate-depth-fill"
                                style={{
                                    background: `linear-gradient(90deg, ${abyssTheme.teal} 0%, ${abyssTheme.accent} 100%)`,
                                    boxShadow: `0 0 10px ${abyssTheme.teal}60`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Loading text */}
                    <div className="mt-6 flex items-center gap-3">
                        <Loader2
                            className="w-5 h-5 animate-spin"
                            style={{ color: abyssTheme.teal }}
                        />
                        <span
                            className="text-lg font-bold uppercase tracking-wider"
                            style={{
                                color: abyssTheme.teal,
                                textShadow: `0 0 20px ${abyssTheme.teal}60`,
                            }}
                        >
                            Descending...
                        </span>
                    </div>

                    {/* Subtle particles in loading */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full animate-loading-particle"
                                style={{
                                    left: `${20 + i * 12}%`,
                                    top: `${30 + (i % 3) * 20}%`,
                                    width: 3 + (i % 3),
                                    height: 3 + (i % 3),
                                    background: i % 2 === 0 ? abyssTheme.teal : abyssTheme.accent,
                                    animationDelay: `${i * 0.3}s`,
                                    opacity: 0.5,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
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
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const wobblediverRecord = useMinigameRecordStore((s) => s.getWobblediverRecord())

    const currentGame = GAMES[currentIndex]
    const canGoLeft = currentIndex > 0
    const canGoRight = currentIndex < GAMES.length - 1

    // Initial loading phase - show loading screen while heavy components mount
    useEffect(() => {
        const loadingTimer = setTimeout(() => {
            setIsInitialLoading(false)
        }, 400)
        const mountTimer = setTimeout(() => setMounted(true), 500)
        return () => {
            clearTimeout(loadingTimer)
            clearTimeout(mountTimer)
        }
    }, [])

    // Handle game launch with loading state
    const handleSelectGame = useCallback((gameId: string, mode: GameMode) => {
        setIsLoading(true)
        // Show loading for at least 800ms for clear visual feedback
        setTimeout(() => {
            onSelectAdventure(gameId, mode)
        }, 800)
    }, [onSelectAdventure])

    // Show initial loading screen while heavy components mount
    if (isInitialLoading) {
        return (
            <div
                className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center"
                style={{
                    background: `linear-gradient(180deg, ${abyssTheme.void} 0%, ${abyssTheme.deep} 50%, ${abyssTheme.void} 100%)`,
                }}
            >
                {/* Floating abyss particles */}
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-loading-float-particle"
                        style={{
                            left: `${8 + (i % 5) * 20 + Math.random() * 8}%`,
                            top: `${10 + Math.floor(i / 5) * 40 + Math.random() * 15}%`,
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: `${2.5 + (i % 3) * 0.5}s`,
                        }}
                    >
                        <div
                            className="rounded-full"
                            style={{
                                width: 3 + (i % 3) * 2,
                                height: 3 + (i % 3) * 2,
                                background: i % 3 === 0 ? abyssTheme.teal : i % 3 === 1 ? abyssTheme.accent : abyssTheme.gold,
                                boxShadow: `0 0 ${6 + i * 2}px ${i % 3 === 0 ? abyssTheme.teal : i % 3 === 1 ? abyssTheme.accent : abyssTheme.gold}`,
                            }}
                        />
                    </div>
                ))}

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />

                {/* Watching eye above */}
                <div className="relative mb-6 animate-loading-eye-pulse">
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{
                            width: 120,
                            height: 60,
                            background: `radial-gradient(ellipse, #ef444440 0%, transparent 70%)`,
                            filter: 'blur(15px)',
                        }}
                    />
                    <div
                        className="relative"
                        style={{
                            width: 80,
                            height: 36,
                            borderRadius: '50%',
                            background: `radial-gradient(ellipse, #dc2626 0%, #991b1b 60%, #7f1d1d 100%)`,
                            boxShadow: `0 0 30px #dc262660, 0 0 60px #dc262630`,
                        }}
                    >
                        <div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-loading-iris-shift"
                            style={{
                                width: 12,
                                height: 24,
                                background: '#000',
                                boxShadow: `0 0 6px ${abyssTheme.void}`,
                            }}
                        />
                    </div>
                </div>

                {/* Rope */}
                <div
                    className="w-1 h-10 relative"
                    style={{
                        background: `linear-gradient(180deg, ${abyssTheme.gold}40 0%, ${abyssTheme.gold} 100%)`,
                        boxShadow: `0 0 10px ${abyssTheme.gold}40`,
                    }}
                >
                    <div
                        className="absolute inset-0 opacity-50"
                        style={{
                            background: `repeating-linear-gradient(180deg, transparent 0px, transparent 4px, ${abyssTheme.gold}80 4px, ${abyssTheme.gold}80 6px)`,
                        }}
                    />
                </div>

                {/* Wobble character swinging */}
                <div className="relative animate-loading-diver-swing mb-8">
                    <div
                        className="absolute inset-0 rounded-full blur-2xl -z-10"
                        style={{ background: abyssTheme.gold, transform: 'scale(2.5)', opacity: 0.2 }}
                    />
                    <WobbleDisplay size={75} shape="circle" color={0xf5b041} expression="worried" />
                </div>

                {/* Depth meter */}
                <div className="w-44">
                    <div className="flex justify-between mb-2">
                        <span
                            className="text-[10px] uppercase tracking-wider font-bold"
                            style={{ color: `${abyssTheme.teal}80` }}
                        >
                            Depth
                        </span>
                        <span
                            className="text-[10px] font-mono font-bold"
                            style={{ color: abyssTheme.teal }}
                        >
                            ???m
                        </span>
                    </div>
                    <div
                        className="h-2.5 rounded-full overflow-hidden"
                        style={{
                            background: abyssTheme.void,
                            border: `1px solid ${abyssTheme.accent}40`,
                            boxShadow: `inset 0 1px 3px rgba(0,0,0,0.4)`,
                        }}
                    >
                        <div
                            className="h-full rounded-full animate-loading-depth-fill"
                            style={{
                                background: `linear-gradient(90deg, ${abyssTheme.teal} 0%, ${abyssTheme.accent} 100%)`,
                                boxShadow: `0 0 8px ${abyssTheme.teal}60`,
                            }}
                        />
                    </div>
                </div>

                {/* Loading text */}
                <div className="mt-5 flex items-center gap-3">
                    <Loader2
                        className="w-4 h-4 animate-spin"
                        style={{ color: abyssTheme.teal }}
                    />
                    <span
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{
                            color: abyssTheme.teal,
                            textShadow: `0 0 15px ${abyssTheme.teal}50`,
                        }}
                    >
                        Descending...
                    </span>
                </div>

                {/* CSS Animations for loading */}
                <style>{`
                    @keyframes loading-float-particle {
                        0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
                        50% { transform: translateY(-12px) scale(1.3); opacity: 0.9; }
                    }
                    .animate-loading-float-particle { animation: loading-float-particle 2.5s ease-in-out infinite; }

                    @keyframes loading-eye-pulse {
                        0%, 100% { transform: scale(1); opacity: 0.7; }
                        50% { transform: scale(1.08); opacity: 1; }
                    }
                    .animate-loading-eye-pulse { animation: loading-eye-pulse 2s ease-in-out infinite; }

                    @keyframes loading-iris-shift {
                        0%, 100% { transform: translate(-50%, -50%) translateX(0); }
                        30% { transform: translate(-50%, -50%) translateX(-2px); }
                        70% { transform: translate(-50%, -50%) translateX(2px); }
                    }
                    .animate-loading-iris-shift { animation: loading-iris-shift 4s ease-in-out infinite; }

                    @keyframes loading-diver-swing {
                        0%, 100% { transform: rotate(-3deg); }
                        50% { transform: rotate(3deg); }
                    }
                    .animate-loading-diver-swing { animation: loading-diver-swing 2s ease-in-out infinite; }

                    @keyframes loading-depth-fill {
                        0% { width: 0%; }
                        50% { width: 65%; }
                        100% { width: 100%; }
                    }
                    .animate-loading-depth-fill { animation: loading-depth-fill 0.4s ease-out forwards; }
                `}</style>
            </div>
        )
    }

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
                            onSelectEndless={() => handleSelectGame('wobblediver', 'endless')}
                            bestDepth={wobblediverRecord.bestDepth}
                            highScore={wobblediverRecord.highScore}
                            isLoading={isLoading}
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

                @keyframes loading-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                .animate-loading-pulse { animation: loading-pulse 1.5s ease-in-out infinite; }

                @keyframes loading-iris {
                    0%, 100% { transform: translate(-50%, -50%) scaleY(1); }
                    50% { transform: translate(-50%, -50%) scaleY(0.6); }
                }
                .animate-loading-iris { animation: loading-iris 1s ease-in-out infinite; }

                @keyframes loading-particle {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
                    50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
                }
                .animate-loading-particle { animation: loading-particle 2s ease-in-out infinite; }

                @keyframes depth-fill {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                .animate-depth-fill { animation: depth-fill 0.8s ease-out forwards; }
            `}</style>
        </div>
    )
}
