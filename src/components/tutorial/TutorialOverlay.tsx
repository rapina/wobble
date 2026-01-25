import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronRight, Sparkles } from 'lucide-react'

const theme = {
    bgPanel: '#374244',
    bgPanelDark: '#2a3234',
    border: '#1a1a1a',
    gold: '#c9a227',
    blue: '#4a9eff',
}

export interface TutorialStep {
    targetSymbol: string
    message: string
    title?: string
    targetType?:
        | 'variable'
        | 'info-button'
        | 'formula-list'
        | 'category-carousel'
        | 'challenge-submit'
        | 'welcome'
        | 'canvas'
        | 'challenge'
    wobbleExpression?: string
}

interface TutorialOverlayProps {
    steps: TutorialStep[]
    currentStep: number
    onNext: () => void
    onSkip: () => void
    onComplete: () => void
    targetRect: DOMRect | null
    sliderRect: DOMRect | null
}

export function TutorialOverlay({
    steps,
    currentStep,
    onNext,
    onSkip,
    onComplete,
    targetRect,
    sliderRect: _sliderRect,
}: TutorialOverlayProps) {
    const { t } = useTranslation()
    const [isVisible, setIsVisible] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const isLastStep = currentStep === steps.length - 1
    const step = steps[currentStep]

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100)
        return () => clearTimeout(timer)
    }, [])

    // Animate on step change
    useEffect(() => {
        setIsAnimating(true)
        const timer = setTimeout(() => setIsAnimating(false), 300)
        return () => clearTimeout(timer)
    }, [currentStep])

    // Calculate spotlight dimensions
    const getSpotlightRect = useCallback(() => {
        if (step?.targetType === 'welcome' || !targetRect) return null

        const padding = 12
        return {
            x: targetRect.left - padding,
            y: targetRect.top - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            rx: 16,
        }
    }, [targetRect, step?.targetType])

    const spotlightRect = getSpotlightRect()

    if (!step) return null

    const isWelcomeStep = step.targetType === 'welcome'

    return (
        <div
            className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
        >
            {/* Dark overlay with spotlight cutout using SVG mask */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="spotlight-mask">
                        {/* White = visible (dark overlay shows), Black = hidden (transparent hole) */}
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {spotlightRect && (
                            <rect
                                x={spotlightRect.x}
                                y={spotlightRect.y}
                                width={spotlightRect.width}
                                height={spotlightRect.height}
                                rx={spotlightRect.rx}
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.8)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            {/* Pulsing ring around target (not for welcome step) */}
            {targetRect && !isWelcomeStep && (
                <div
                    className="absolute pointer-events-none transition-all duration-300"
                    style={{
                        left: targetRect.left - 12,
                        top: targetRect.top - 12,
                        width: targetRect.width + 24,
                        height: targetRect.height + 24,
                        opacity: isAnimating ? 0 : 1,
                    }}
                >
                    {/* Animated border */}
                    <div
                        className="absolute inset-0 rounded-xl"
                        style={{
                            border: `2px solid ${theme.gold}`,
                            boxShadow: `0 0 20px ${theme.gold}50`,
                            animation: 'pulse-glow 1.5s ease-in-out infinite',
                        }}
                    />
                </div>
            )}

            {/* Message card - clean minimal design */}
            <div
                className={`absolute left-4 right-4 max-w-sm mx-auto transition-all duration-300 ${
                    isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                }`}
                style={{
                    top: isWelcomeStep
                        ? '50%'
                        : targetRect
                          ? targetRect.top > window.innerHeight / 2
                              ? '15%'
                              : '65%'
                          : '50%',
                    transform: 'translateY(-50%)',
                }}
            >
                <div
                    className="relative rounded-2xl overflow-hidden backdrop-blur-sm"
                    style={{
                        background: 'rgba(30, 32, 40, 0.95)',
                        border: `2px solid rgba(255, 255, 255, 0.1)`,
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    {/* Content area */}
                    <div className="p-5">
                        {/* Title row with progress */}
                        <div className="flex items-center justify-between mb-3">
                            {step.title && (
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    <h3 className="text-base font-bold text-white">{step.title}</h3>
                                </div>
                            )}
                            {/* Step indicator */}
                            <span className="text-xs text-white/40 font-medium">
                                {currentStep + 1}/{steps.length}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div
                            className="h-1 rounded-full overflow-hidden mb-4"
                            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                        >
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                                    background: `linear-gradient(90deg, ${theme.gold}, #f59e0b)`,
                                }}
                            />
                        </div>

                        {/* Message */}
                        <p className="text-white/80 text-sm leading-relaxed mb-5">{step.message}</p>

                        {/* Buttons */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={onSkip}
                                className="px-3 py-2 rounded-lg text-white/40 text-sm font-medium transition-all active:scale-95 hover:text-white/60"
                            >
                                {t('tutorial.skip')}
                            </button>
                            <button
                                onClick={isLastStep ? onComplete : onNext}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                                style={{
                                    background: theme.gold,
                                    color: '#1a1a1a',
                                }}
                            >
                                {isLastStep ? t('tutorial.done') : t('tutorial.next')}
                                {!isLastStep && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skip button in corner */}
            <button
                onClick={onSkip}
                className="absolute h-10 w-10 rounded-xl flex items-center justify-center transition-all active:scale-95 hover:bg-white/10"
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 4px)',
                    right: 'calc(max(env(safe-area-inset-right, 0px), 12px) + 4px)',
                    background: `${theme.bgPanel}ee`,
                    border: `2px solid ${theme.border}`,
                    boxShadow: `0 2px 0 ${theme.border}`,
                }}
            >
                <X className="w-5 h-5 text-white/70" />
            </button>

            {/* Pulse glow animation */}
            <style>{`
                @keyframes pulse-glow {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 0.7;
                    }
                }
            `}</style>
        </div>
    )
}
