import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Sparkles } from 'lucide-react'
import { WOBBLE_CHARACTERS, WobbleShape } from '@/components/canvas/Wobble'
import { cn } from '@/lib/utils'
import { t as localizeText } from '@/utils/localization'

const theme = {
    bg: '#0a0a12',
    bgPanel: '#374244',
    border: '#1a1a1a',
    gold: '#c9a227',
}

// Simple CSS-based wobble display (to avoid PixiJS conflicts)
export function SimpleWobble({
    shape,
    color,
    size = 80,
}: {
    shape: WobbleShape
    color: number
    size?: number
}) {
    const colorHex = `#${color.toString(16).padStart(6, '0')}`
    const eyeSize = size * 0.12
    const eyeY = -size * 0.08
    const eyeSpacing = size * 0.18

    const getShapePath = () => {
        const r = size * 0.4
        switch (shape) {
            case 'circle':
                return null // Use border-radius
            case 'square':
                return null // Use border-radius with less rounding
            case 'triangle':
                return `polygon(50% 10%, 90% 85%, 10% 85%)`
            case 'star':
                return `polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)`
            case 'diamond':
                return `polygon(50% 5%, 90% 50%, 50% 95%, 10% 50%)`
            case 'pentagon':
                return `polygon(50% 5%, 95% 38%, 79% 91%, 21% 91%, 5% 38%)`
            default:
                return null
        }
    }

    const clipPath = getShapePath()
    const isRounded = shape === 'circle' || shape === 'square'
    const borderRadius = shape === 'circle' ? '50%' : shape === 'square' ? '20%' : '0'

    return (
        <div
            className="relative animate-bounce"
            style={{
                width: size,
                height: size,
                animation: 'wobble 2s ease-in-out infinite',
            }}
        >
            {/* Shadow */}
            <div
                className="absolute"
                style={{
                    width: size * 0.6,
                    height: size * 0.15,
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                    bottom: -size * 0.1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    filter: 'blur(4px)',
                }}
            />
            {/* Body */}
            <div
                style={{
                    width: size,
                    height: size,
                    background: colorHex,
                    borderRadius: isRounded ? borderRadius : 0,
                    clipPath: clipPath || undefined,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: `inset -${size * 0.1}px -${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.2), inset ${size * 0.05}px ${size * 0.05}px ${size * 0.1}px rgba(255,255,255,0.2)`,
                }}
            >
                {/* Face */}
                <div className="relative" style={{ marginTop: eyeY }}>
                    {/* Eyes */}
                    <div className="flex gap-1" style={{ gap: eyeSpacing }}>
                        <div
                            style={{
                                width: eyeSize,
                                height: eyeSize * 1.2,
                                background: '#1a1a1a',
                                borderRadius: '50%',
                            }}
                        />
                        <div
                            style={{
                                width: eyeSize,
                                height: eyeSize * 1.2,
                                background: '#1a1a1a',
                                borderRadius: '50%',
                            }}
                        />
                    </div>
                    {/* Smile */}
                    <div
                        style={{
                            width: eyeSpacing * 1.2,
                            height: eyeSize * 0.8,
                            borderBottom: `${eyeSize * 0.3}px solid #1a1a1a`,
                            borderRadius: '0 0 50% 50%',
                            margin: '0 auto',
                            marginTop: eyeSize * 0.5,
                        }}
                    />
                </div>
            </div>
            <style>{`
                @keyframes wobble {
                    0%, 100% { transform: scale(1, 1) translateY(0); }
                    25% { transform: scale(1.05, 0.95) translateY(2px); }
                    50% { transform: scale(0.95, 1.05) translateY(-4px); }
                    75% { transform: scale(1.02, 0.98) translateY(1px); }
                }
            `}</style>
        </div>
    )
}

interface NewWobbleAlertProps {
    shapes: WobbleShape[]
    onClose: () => void
}

export function NewWobbleAlert({ shapes, onClose }: NewWobbleAlertProps) {
    const { i18n } = useTranslation()
    const lang = i18n.language
    const [visible, setVisible] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    const currentShape = shapes[currentIndex]
    const character = currentShape ? WOBBLE_CHARACTERS[currentShape] : null

    useEffect(() => {
        // Animate in
        const timer = setTimeout(() => setVisible(true), 50)
        return () => clearTimeout(timer)
    }, [])

    const handleNext = () => {
        if (currentIndex < shapes.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else {
            handleClose()
        }
    }

    const handleClose = () => {
        setVisible(false)
        setTimeout(onClose, 200)
    }

    if (!character) return null

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center',
                'transition-all duration-200',
                visible ? 'bg-black/70' : 'bg-black/0'
            )}
            onClick={handleClose}
        >
            <div
                className={cn(
                    'relative w-[280px] rounded-2xl p-6',
                    'transition-all duration-300',
                    visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                )}
                style={{
                    background: theme.bgPanel,
                    border: `3px solid ${theme.border}`,
                    boxShadow: `0 8px 0 ${theme.border}, 0 12px 40px rgba(0,0,0,0.5)`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                    <X className="w-4 h-4 text-white/60" />
                </button>

                {/* Sparkle decorations */}
                <div className="absolute -top-3 -left-3">
                    <Sparkles className="w-6 h-6" style={{ color: theme.gold }} />
                </div>
                <div className="absolute -top-2 -right-8">
                    <Sparkles className="w-5 h-5" style={{ color: theme.gold }} />
                </div>

                {/* Title */}
                <div className="text-center mb-4">
                    <p className="text-white/60 text-sm mb-1">
                        {localizeText(
                            {
                                ko: '새로운 주민 발견!',
                                en: 'New Resident Found!',
                                ja: '新しい住民を発見！',
                            },
                            lang
                        )}
                    </p>
                    <h2 className="text-2xl font-black" style={{ color: theme.gold }}>
                        {localizeText(character.name, lang)}
                    </h2>
                </div>

                {/* Wobble Display */}
                <div className="flex justify-center mb-4">
                    <div
                        className="relative rounded-xl p-6 flex items-center justify-center"
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: `2px solid ${theme.border}`,
                        }}
                    >
                        <SimpleWobble size={80} shape={currentShape} color={character.color} />
                    </div>
                </div>

                {/* Personality */}
                <p className="text-center text-white/70 text-sm mb-5 leading-relaxed">
                    {localizeText(character.personality, lang)}
                </p>

                {/* Action button */}
                <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl font-bold text-black transition-all active:scale-[0.98]"
                    style={{
                        background: theme.gold,
                        boxShadow: `0 4px 0 #8a6f1a`,
                    }}
                >
                    {shapes.length > 1 && currentIndex < shapes.length - 1
                        ? localizeText(
                              {
                                  ko: `다음 (${currentIndex + 1}/${shapes.length})`,
                                  en: `Next (${currentIndex + 1}/${shapes.length})`,
                                  ja: `次へ (${currentIndex + 1}/${shapes.length})`,
                              },
                              lang
                          )
                        : localizeText(
                              {
                                  ko: '반가워!',
                                  en: 'Nice to meet you!',
                                  ja: 'よろしくね！',
                              },
                              lang
                          )}
                </button>
            </div>
        </div>
    )
}
