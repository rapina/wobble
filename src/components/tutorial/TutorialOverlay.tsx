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

// Simple SVG-based Wobble avatar for tutorial (no PixiJS dependency)
function TutorialWobbleAvatar({ expression }: { expression: string }) {
    // Eye and mouth variations based on expression
    const getEyes = () => {
        switch (expression) {
            case 'excited':
                return (
                    <>
                        {/* Star eyes */}
                        <text x="18" y="26" fontSize="8" textAnchor="middle" fill="#333">
                            ★
                        </text>
                        <text x="30" y="26" fontSize="8" textAnchor="middle" fill="#333">
                            ★
                        </text>
                    </>
                )
            case 'surprised':
                return (
                    <>
                        {/* Wide eyes */}
                        <circle cx="18" cy="23" r="4" fill="white" />
                        <circle cx="30" cy="23" r="4" fill="white" />
                        <circle cx="18" cy="23" r="2.5" fill="#333" />
                        <circle cx="30" cy="23" r="2.5" fill="#333" />
                    </>
                )
            case 'worried':
                return (
                    <>
                        {/* Worried eyes with eyebrows */}
                        <circle cx="18" cy="23" r="3" fill="white" />
                        <circle cx="30" cy="23" r="3" fill="white" />
                        <circle cx="18" cy="23" r="2" fill="#333" />
                        <circle cx="30" cy="23" r="2" fill="#333" />
                        <line
                            x1="14"
                            y1="17"
                            x2="21"
                            y2="19"
                            stroke="#333"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <line
                            x1="34"
                            y1="17"
                            x2="27"
                            y2="19"
                            stroke="#333"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </>
                )
            default: // happy
                return (
                    <>
                        <circle cx="18" cy="23" r="3" fill="white" />
                        <circle cx="30" cy="23" r="3" fill="white" />
                        <circle cx="18" cy="23" r="2" fill="#333" />
                        <circle cx="30" cy="23" r="2" fill="#333" />
                    </>
                )
        }
    }

    const getMouth = () => {
        switch (expression) {
            case 'excited':
                return <ellipse cx="24" cy="32" rx="5" ry="4" fill="#333" />
            case 'surprised':
                return <circle cx="24" cy="33" r="3" fill="#333" />
            case 'worried':
                return (
                    <path
                        d="M 19 34 Q 24 31 29 34"
                        fill="none"
                        stroke="#333"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                )
            default: // happy
                return (
                    <path
                        d="M 19 31 Q 24 36 29 31"
                        fill="none"
                        stroke="#333"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                )
        }
    }

    return (
        <svg viewBox="0 0 48 48" className="w-full h-full">
            {/* Einstein hair - wild and messy */}
            <ellipse cx="8" cy="14" rx="6" ry="5" fill="#ccc" />
            <ellipse cx="40" cy="14" rx="6" ry="5" fill="#ccc" />
            <ellipse cx="12" cy="8" rx="5" ry="4" fill="#ddd" />
            <ellipse cx="36" cy="8" rx="5" ry="4" fill="#ddd" />
            <ellipse cx="24" cy="5" rx="8" ry="4" fill="#ccc" />

            {/* Main body */}
            <ellipse cx="24" cy="26" rx="16" ry="14" fill="#F5B041" />

            {/* Glasses */}
            <circle cx="18" cy="23" r="6" fill="none" stroke="#333" strokeWidth="1.5" />
            <circle cx="30" cy="23" r="6" fill="none" stroke="#333" strokeWidth="1.5" />
            <line x1="24" y1="23" x2="24" y2="23" stroke="#333" strokeWidth="1.5" />
            <line x1="12" y1="23" x2="8" y2="21" stroke="#333" strokeWidth="1.5" />
            <line x1="36" y1="23" x2="40" y2="21" stroke="#333" strokeWidth="1.5" />

            {/* Eyes */}
            {getEyes()}

            {/* Mouth */}
            {getMouth()}

            {/* Mustache */}
            <path
                d="M 17 29 Q 24 32 31 29"
                fill="none"
                stroke="#888"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
}

export interface TutorialStep {
    targetSymbol: string
    message: string
    title?: string
    targetType?:
        | 'variable'
        | 'info-button'
        | 'formula-list'
        | 'challenge-submit'
        | 'welcome'
        | 'canvas'
        | 'challenge'
    wobbleExpression?: 'happy' | 'excited' | 'surprised' | 'worried'
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
    sliderRect,
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

    // Calculate spotlight mask
    const getSpotlightStyle = useCallback(() => {
        // No spotlight for welcome step
        if (step?.targetType === 'welcome' || !targetRect) return {}

        const padding = 12
        const x = targetRect.left - padding
        const y = targetRect.top - padding
        const w = targetRect.width + padding * 2
        const h = targetRect.height + padding * 2
        const r = 16

        // If slider is visible, extend the spotlight to include it
        let sliderPath = ''
        if (sliderRect) {
            const sx = sliderRect.left - padding
            const sy = sliderRect.top - padding
            const sw = sliderRect.width + padding * 2
            const sh = sliderRect.height + padding * 2
            sliderPath = `M ${sx} ${sy + r}
                Q ${sx} ${sy} ${sx + r} ${sy}
                L ${sx + sw - r} ${sy}
                Q ${sx + sw} ${sy} ${sx + sw} ${sy + r}
                L ${sx + sw} ${sy + sh - r}
                Q ${sx + sw} ${sy + sh} ${sx + sw - r} ${sy + sh}
                L ${sx + r} ${sy + sh}
                Q ${sx} ${sy + sh} ${sx} ${sy + sh - r}
                Z`
        }

        // Create SVG path for rounded rectangle cutout
        const path = `
            M 0 0
            L 100vw 0
            L 100vw 100vh
            L 0 100vh
            Z
            M ${x + r} ${y}
            Q ${x} ${y} ${x} ${y + r}
            L ${x} ${y + h - r}
            Q ${x} ${y + h} ${x + r} ${y + h}
            L ${x + w - r} ${y + h}
            Q ${x + w} ${y + h} ${x + w} ${y + h - r}
            L ${x + w} ${y + r}
            Q ${x + w} ${y} ${x + w - r} ${y}
            Z
            ${sliderPath}
        `

        return {
            clipPath: `path('${path}')`,
        }
    }, [targetRect, sliderRect, step?.targetType])

    if (!step) return null

    const isWelcomeStep = step.targetType === 'welcome'
    const wobbleExpression = step.wobbleExpression || 'happy'

    return (
        <div
            className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
        >
            {/* Dark overlay with spotlight cutout */}
            <div
                className="absolute inset-0 bg-black/85 transition-all duration-300"
                style={getSpotlightStyle()}
            />

            {/* Pulsing ring around target (not for welcome step) */}
            {targetRect && !isWelcomeStep && (
                <div
                    className="absolute pointer-events-none transition-all duration-300"
                    style={{
                        left: targetRect.left - 16,
                        top: targetRect.top - 16,
                        width: targetRect.width + 32,
                        height: targetRect.height + 32,
                        opacity: isAnimating ? 0 : 1,
                    }}
                >
                    {/* Outer glow */}
                    <div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                            border: `2px solid ${theme.gold}40`,
                            boxShadow: `0 0 30px ${theme.gold}30`,
                            animation: 'pulse-glow 2s ease-in-out infinite',
                        }}
                    />
                    {/* Inner ring */}
                    <div
                        className="absolute inset-2 rounded-xl"
                        style={{
                            border: `3px solid ${theme.gold}`,
                            boxShadow: `0 0 15px ${theme.gold}60, inset 0 0 15px ${theme.gold}20`,
                        }}
                    />
                </div>
            )}

            {/* Message card with Wobble character */}
            <div
                className={`absolute left-4 right-4 max-w-sm mx-auto transition-all duration-300 ${
                    isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
                style={{
                    top: isWelcomeStep
                        ? '50%'
                        : targetRect
                          ? targetRect.top > window.innerHeight / 2
                              ? '20%'
                              : '60%'
                          : '50%',
                    transform: isWelcomeStep ? 'translateY(-50%)' : 'translateY(-50%)',
                }}
            >
                <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${theme.bgPanel} 0%, ${theme.bgPanelDark} 100%)`,
                        border: `4px solid ${theme.border}`,
                        boxShadow: `0 6px 0 ${theme.border}, 0 12px 40px rgba(0,0,0,0.6)`,
                    }}
                >
                    {/* Decorative top border */}
                    <div
                        className="h-1.5"
                        style={{
                            background: `linear-gradient(90deg, ${theme.gold}, ${theme.blue}, ${theme.gold})`,
                        }}
                    />

                    {/* Content area */}
                    <div className="p-5">
                        {/* Wobble character and title row */}
                        <div className="flex items-start gap-4 mb-4">
                            {/* Wobble avatar */}
                            <div
                                className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden"
                                style={{
                                    background: theme.bgPanelDark,
                                    border: `3px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                }}
                            >
                                <TutorialWobbleAvatar expression={wobbleExpression} />
                            </div>

                            {/* Title and progress */}
                            <div className="flex-1 min-w-0">
                                {step.title && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                        <h3
                                            className="text-base font-black text-white truncate"
                                            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                                        >
                                            {step.title}
                                        </h3>
                                    </div>
                                )}
                                {/* Progress bar */}
                                <div className="flex items-center gap-2">
                                    <div
                                        className="flex-1 h-2 rounded-full overflow-hidden"
                                        style={{ background: theme.border }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${((currentStep + 1) / steps.length) * 100}%`,
                                                background: `linear-gradient(90deg, ${theme.gold}, ${theme.blue})`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-white/50 font-bold whitespace-nowrap">
                                        {currentStep + 1}/{steps.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Message */}
                        <p className="text-white/90 text-sm leading-relaxed mb-5">{step.message}</p>

                        {/* Buttons */}
                        <div className="flex items-center justify-between gap-3">
                            <button
                                onClick={onSkip}
                                className="px-4 py-2.5 rounded-xl text-white/50 text-sm font-bold transition-all active:scale-95 hover:text-white/70 hover:bg-white/5"
                            >
                                {t('tutorial.skip')}
                            </button>
                            <button
                                onClick={isLastStep ? onComplete : onNext}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 hover:brightness-110"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.gold}, #e0b52f)`,
                                    border: `3px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                    color: theme.border,
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
