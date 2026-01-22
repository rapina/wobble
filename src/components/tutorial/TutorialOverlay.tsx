import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronRight, Hand } from 'lucide-react'

const theme = {
    bgPanel: '#374244',
    border: '#1a1a1a',
    gold: '#c9a227',
    blue: '#4a9eff',
}

export interface TutorialStep {
    targetSymbol: string
    message: string
    targetType?: 'variable' | 'info-button' | 'formula-list' | 'challenge-submit'
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
    const isLastStep = currentStep === steps.length - 1
    const step = steps[currentStep]

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100)
        return () => clearTimeout(timer)
    }, [])

    // Calculate spotlight mask
    const getSpotlightStyle = useCallback(() => {
        if (!targetRect) return {}

        const padding = 8
        const x = targetRect.left - padding
        const y = targetRect.top - padding
        const w = targetRect.width + padding * 2
        const h = targetRect.height + padding * 2
        const r = 12

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
    }, [targetRect, sliderRect])

    if (!step) return null

    return (
        <div
            className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
        >
            {/* Dark overlay with spotlight cutout */}
            <div
                className="absolute inset-0 bg-black/80 transition-all duration-300"
                style={getSpotlightStyle()}
            />

            {/* Pulsing ring around target */}
            {targetRect && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        left: targetRect.left - 12,
                        top: targetRect.top - 12,
                        width: targetRect.width + 24,
                        height: targetRect.height + 24,
                    }}
                >
                    <div
                        className="absolute inset-0 rounded-xl animate-pulse"
                        style={{
                            border: `3px solid ${theme.gold}`,
                            boxShadow: `0 0 20px ${theme.gold}40, inset 0 0 20px ${theme.gold}20`,
                        }}
                    />
                </div>
            )}

            {/* Tap indicator with hand icon */}
            {targetRect && (
                <div
                    className="absolute pointer-events-none animate-bounce"
                    style={{
                        left: targetRect.left + targetRect.width / 2 - 16,
                        top: targetRect.top - 48,
                    }}
                >
                    <Hand className="w-8 h-8 rotate-[-20deg]" style={{ color: theme.gold }} />
                </div>
            )}

            {/* Message tooltip - centered on screen */}
            {targetRect && (
                <div
                    className="absolute left-4 right-4 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
                    style={{
                        top: '50%',
                        transform: 'translateY(-50%)',
                    }}
                >
                    <div
                        className="rounded-xl p-4"
                        style={{
                            background: theme.bgPanel,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 4px 0 ${theme.border}, 0 8px 30px rgba(0,0,0,0.5)`,
                        }}
                    >
                        {/* Step indicator */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex gap-1.5">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-2 h-2 rounded-full transition-all"
                                        style={{
                                            background:
                                                i === currentStep ? theme.gold : theme.border,
                                            transform:
                                                i === currentStep ? 'scale(1.3)' : 'scale(1)',
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-white/40 font-bold">
                                {currentStep + 1} / {steps.length}
                            </span>
                        </div>

                        {/* Message */}
                        <p className="text-white text-sm leading-relaxed mb-4">{step.message}</p>

                        {/* Buttons */}
                        <div className="flex items-center justify-between gap-3">
                            <button
                                onClick={onSkip}
                                className="px-3 py-2 rounded-lg text-white/50 text-xs font-bold transition-all active:scale-95 hover:text-white/70"
                            >
                                {t('tutorial.skip')}
                            </button>
                            <button
                                onClick={isLastStep ? onComplete : onNext}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95"
                                style={{
                                    background: theme.gold,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 2px 0 ${theme.border}`,
                                    color: theme.border,
                                }}
                            >
                                {isLastStep ? t('tutorial.done') : t('tutorial.next')}
                                {!isLastStep && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skip button in corner */}
            <button
                onClick={onSkip}
                className="absolute top-4 right-4 h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 4px)',
                    right: 'calc(max(env(safe-area-inset-right, 0px), 12px) + 4px)',
                    background: theme.bgPanel,
                    border: `2px solid ${theme.border}`,
                    boxShadow: `0 2px 0 ${theme.border}`,
                }}
            >
                <X className="w-5 h-5 text-white/70" />
            </button>
        </div>
    )
}
