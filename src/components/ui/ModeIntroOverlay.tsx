import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, X } from 'lucide-react'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { WobbleShape, WobbleExpression } from '@/components/canvas/Wobble'
import { GameMode } from '@/components/screens/HomeScreen'
import Balatro from '@/components/Balatro'
import { BackgroundPreset } from '@/config/backgroundPresets'
import { sandboxPreset, gameSelectPreset, collectionPreset, shopPreset, labPreset } from '@/config/backgroundPresets'
import { cn } from '@/lib/utils'

// Theme colors (matching HomeScreen)
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
    purple: '#9b59b6',
}

interface ModeConfig {
    titleKey: string
    descriptionKey: string
    color: string
    wobbleShape: WobbleShape
    wobbleExpression: WobbleExpression
    backgroundPreset: BackgroundPreset
}

const modeConfigs: Record<GameMode, ModeConfig> = {
    sandbox: {
        titleKey: 'home.sandbox',
        descriptionKey: 'simulation.welcome.openingDesc',
        color: theme.gold,
        wobbleShape: 'circle',
        wobbleExpression: 'happy',
        backgroundPreset: sandboxPreset,
    },
    game: {
        titleKey: 'home.game',
        descriptionKey: 'intro.game.description',
        color: theme.red,
        wobbleShape: 'star',
        wobbleExpression: 'excited',
        backgroundPreset: gameSelectPreset,
    },
    collection: {
        titleKey: 'home.collection',
        descriptionKey: 'intro.collection.description',
        color: theme.blue,
        wobbleShape: 'pentagon',
        wobbleExpression: 'surprised',
        backgroundPreset: collectionPreset,
    },
    shop: {
        titleKey: 'home.shop',
        descriptionKey: 'intro.shop.description',
        color: theme.purple,
        wobbleShape: 'diamond',
        wobbleExpression: 'happy',
        backgroundPreset: shopPreset,
    },
    learning: {
        titleKey: 'home.learning',
        descriptionKey: 'intro.learning.description',
        color: theme.gold,
        wobbleShape: 'circle',
        wobbleExpression: 'happy',
        backgroundPreset: sandboxPreset,
    },
    lab: {
        titleKey: 'home.lab',
        descriptionKey: 'home.labDesc',
        color: '#ff8c42',
        wobbleShape: 'square',
        wobbleExpression: 'effort',
        backgroundPreset: labPreset,
    },
}

interface ModeIntroOverlayProps {
    mode: GameMode
    isVisible: boolean
    onComplete: () => void
    onCancel: () => void
}

export function ModeIntroOverlay({ mode, isVisible, onComplete, onCancel }: ModeIntroOverlayProps) {
    const { t } = useTranslation()
    const [isMounted, setIsMounted] = useState(false)

    const config = modeConfigs[mode]

    // Floating formula symbols for background effect
    const floatingSymbols = ['F=ma', 'E=mc²', 'λ', 'Σ', 'π', 'θ', 'ω', 'Δ', '∫', '∞']

    // Mount animation
    useEffect(() => {
        if (isVisible) {
            setIsMounted(false)
            const timer = setTimeout(() => setIsMounted(true), 100)
            return () => clearTimeout(timer)
        } else {
            setIsMounted(false)
        }
    }, [isVisible])

    if (!isVisible) return null

    const handleClick = () => {
        onComplete()
    }

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation()
        onCancel()
    }

    return (
        <div
            className="fixed inset-0 z-50 cursor-pointer animate-in fade-in duration-300"
            style={{ background: '#0a0a12' }}
            onClick={handleClick}
        >
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-40">
                <Balatro
                    color1={config.backgroundPreset.color1}
                    color2={config.backgroundPreset.color2}
                    color3={config.backgroundPreset.color3}
                    spinSpeed={config.backgroundPreset.spinSpeed}
                    spinRotation={config.backgroundPreset.spinRotation}
                    contrast={config.backgroundPreset.contrast}
                    lighting={config.backgroundPreset.lighting}
                    spinAmount={config.backgroundPreset.spinAmount}
                    pixelFilter={config.backgroundPreset.pixelFilter}
                    isRotate={config.backgroundPreset.isRotate}
                    mouseInteraction={false}
                />
            </div>

            {/* Floating Formula Symbols */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {floatingSymbols.map((symbol, i) => (
                    <div
                        key={i}
                        className={cn(
                            'absolute text-2xl font-bold transition-all duration-1000',
                            isMounted ? 'opacity-20' : 'opacity-0'
                        )}
                        style={{
                            color: config.color,
                            left: `${10 + (i % 5) * 20}%`,
                            top: `${15 + Math.floor(i / 5) * 60}%`,
                            transform: `rotate(${-15 + i * 7}deg)`,
                            transitionDelay: `${300 + i * 100}ms`,
                            animation: isMounted
                                ? `float-${i % 3} ${3 + (i % 2)}s ease-in-out infinite`
                                : 'none',
                        }}
                    >
                        {symbol}
                    </div>
                ))}
            </div>

            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

            {/* Content */}
            <div
                className="relative z-10 h-full flex flex-col items-center justify-center"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
                }}
            >
                {/* Close Button */}
                <button
                    onClick={handleCancel}
                    className="absolute top-0 left-0 h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        top: 'max(env(safe-area-inset-top, 0px), 12px)',
                        left: 'max(env(safe-area-inset-left, 0px), 12px)',
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 3px 0 ${theme.border}`,
                    }}
                >
                    <X className="h-5 w-5 text-white" />
                </button>

                {/* Wobble Character with enhanced entrance */}
                <div
                    className={cn(
                        'mb-8 transition-all duration-700',
                        isMounted
                            ? 'opacity-100 scale-100 translate-y-0'
                            : 'opacity-0 scale-0 translate-y-10'
                    )}
                    style={{
                        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    <div
                        className="relative"
                        style={{
                            animation: isMounted
                                ? 'wobble-float 2s ease-in-out infinite'
                                : 'none',
                        }}
                    >
                        <WobbleDisplay
                            size={70}
                            color={config.color}
                            shape={config.wobbleShape}
                            expression={config.wobbleExpression}
                        />
                    </div>
                </div>

                {/* Mode Title */}
                <h2
                    className={cn(
                        'text-2xl font-black tracking-wider uppercase mb-4 transition-all duration-600',
                        isMounted
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-6'
                    )}
                    style={{
                        color: config.color,
                        textShadow: `0 2px 0 ${theme.border}`,
                        transitionDelay: '300ms',
                    }}
                >
                    {t(config.titleKey)}
                </h2>

                {/* Description with staged animation */}
                <div className="text-center mb-10 px-8 space-y-3">
                    {t(config.descriptionKey, '')
                        .split('\n')
                        .filter(line => line.trim())
                        .map((line, i) => (
                            <p
                                key={i}
                                className={cn(
                                    'text-lg leading-relaxed transition-all duration-600',
                                    isMounted
                                        ? 'opacity-100 translate-y-0 scale-100'
                                        : 'opacity-0 translate-y-6 scale-95'
                                )}
                                style={{
                                    color: 'rgba(255,255,255,0.85)',
                                    transitionDelay: `${600 + i * 400}ms`,
                                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                            >
                                {line}
                            </p>
                        ))}
                </div>

                {/* Tap to Start */}
                <div
                    className={cn(
                        'flex flex-col items-center gap-2 transition-all duration-500',
                        isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    )}
                    style={{ transitionDelay: '1800ms' }}
                >
                    <div
                        className="text-white/30"
                        style={{
                            animation: 'bounce-arrow 1s ease-in-out infinite',
                        }}
                    >
                        <ChevronDown className="h-6 w-6" />
                    </div>
                    <p className="text-white/50 text-sm font-medium">
                        {t('simulation.welcome.tapToStart', 'Tap to continue')}
                    </p>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes wobble-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-arrow {
                    0%, 100% { transform: translateY(0); opacity: 0.3; }
                    50% { transform: translateY(4px); opacity: 0.6; }
                }
                @keyframes float-0 {
                    0%, 100% { transform: translateY(0) rotate(-15deg); }
                    50% { transform: translateY(-10px) rotate(-10deg); }
                }
                @keyframes float-1 {
                    0%, 100% { transform: translateY(0) rotate(5deg); }
                    50% { transform: translateY(-15px) rotate(10deg); }
                }
                @keyframes float-2 {
                    0%, 100% { transform: translateY(0) rotate(-5deg); }
                    50% { transform: translateY(-8px) rotate(0deg); }
                }
            `}</style>
        </div>
    )
}
