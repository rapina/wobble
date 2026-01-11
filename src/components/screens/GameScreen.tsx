import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AdventureCanvas, AdventureCanvasHandle } from '@/components/canvas/AdventureCanvas'
import { PlayResult } from '@/components/canvas/adventure'
import { useProgressStore } from '@/stores/progressStore'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import Balatro from '@/components/Balatro'

const theme = {
    bgPanel: '#374244',
    border: '#1a1a1a',
}

interface MinigameScreenProps {
    onBack: () => void
}

export function GameScreen({ onBack }: MinigameScreenProps) {
    const { i18n } = useTranslation()
    const isKorean = i18n.language === 'ko'
    const [mounted, setMounted] = useState(false)
    const [playResult, setPlayResult] = useState<PlayResult | null>(null)

    const canvasRef = useRef<AdventureCanvasHandle>(null)
    const { studiedFormulas } = useProgressStore()

    // Mount animation and auto-start game
    useEffect(() => {
        setMounted(false)
        setPlayResult(null)
        const timer = setTimeout(() => {
            setMounted(true)
            // Auto-start the game
            canvasRef.current?.play()
        }, 50)
        return () => clearTimeout(timer)
    }, [])

    // Handle play complete
    const handlePlayComplete = useCallback((result: PlayResult) => {
        setPlayResult(result)
    }, [])

    // Handle reset
    const handleReset = () => {
        setPlayResult(null)
        canvasRef.current?.reset()
    }

    // Memoized Balatro background
    const balatroBackground = useMemo(
        () => (
            <div className="absolute inset-0 opacity-70">
                <Balatro
                    color1="#F5B041"
                    color2="#5DADE2"
                    color3="#1a1a2e"
                    spinSpeed={3}
                    contrast={2.5}
                    lighting={0.3}
                    spinAmount={0.2}
                    pixelFilter={800}
                    mouseInteraction={false}
                />
            </div>
        ),
        []
    )

    return (
        <div
            className={cn(
                'relative w-full h-full overflow-hidden',
                'transition-opacity duration-300',
                mounted ? 'opacity-100' : 'opacity-0'
            )}
            style={{ background: '#0a0a12' }}
        >
            {balatroBackground}

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />

            {/* Canvas Area */}
            <div
                className="absolute z-10 rounded-xl overflow-hidden"
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 56px)',
                    left: 'max(env(safe-area-inset-left, 0px), 12px)',
                    right: 'max(env(safe-area-inset-right, 0px), 12px)',
                    bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 60px)',
                    border: `3px solid ${theme.border}`,
                    boxShadow: `0 6px 0 ${theme.border}, 0 10px 30px rgba(0,0,0,0.5)`,
                }}
            >
                <AdventureCanvas
                    ref={canvasRef}
                    levelId="physics-survivor"
                    variables={{}}
                    targets={{}}
                    studiedFormulas={studiedFormulas}
                    onPlayComplete={handlePlayComplete}
                />
            </div>

            {/* Top Header */}
            <div
                className="absolute top-0 left-0 right-0 z-20"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                }}
            >
                <div className="flex items-center gap-3">
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95"
                        style={{
                            background: theme.bgPanel,
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    >
                        <ArrowLeft className="h-5 w-5 text-white" />
                    </button>

                    {/* Title */}
                    <div
                        className="flex-1 px-4 py-2 rounded-lg"
                        style={{
                            background: theme.bgPanel,
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    >
                        <h2 className="text-white font-bold truncate">
                            {isKorean ? '워블 어드벤처' : 'Wobble Adventures'}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Reset button on failure */}
            {playResult === 'failure' && (
                <div
                    className="absolute z-20 flex items-center justify-center px-4"
                    style={{
                        bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 120px)',
                        left: 0,
                        right: 0,
                    }}
                >
                    <button
                        onClick={handleReset}
                        className={cn(
                            'flex items-center gap-2 px-6 py-3 rounded-lg',
                            'bg-white/20 border border-white/30',
                            'text-white font-bold',
                            'transition-all active:scale-95'
                        )}
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>{isKorean ? '다시 시도' : 'Try Again'}</span>
                    </button>
                </div>
            )}

            {/* Failure feedback */}
            {playResult === 'failure' && (
                <div
                    className="absolute z-30 left-0 right-0 text-center px-4"
                    style={{
                        bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 180px)',
                    }}
                >
                    <p className="text-red-400 text-sm animate-pulse">
                        {isKorean ? '목표에 도달하지 못했어요!' : "Didn't reach the target!"}
                    </p>
                </div>
            )}
        </div>
    )
}
