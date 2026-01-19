import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MiniGameCanvas, MiniGameCanvasHandle, MiniGameId } from '@/components/canvas/MiniGameCanvas'
import { Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import Balatro from '@/components/Balatro'

const theme = {
    border: '#1a1a1a',
}

interface MiniGameScreenProps {
    gameId: MiniGameId
    onBack: () => void
}

export function MiniGameScreen({ gameId, onBack }: MiniGameScreenProps) {
    const { t } = useTranslation()
    const [mounted, setMounted] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    const canvasRef = useRef<MiniGameCanvasHandle>(null)

    // Mount animation
    useEffect(() => {
        setMounted(false)
        const timer = setTimeout(() => {
            setMounted(true)
        }, 50)
        return () => clearTimeout(timer)
    }, [])

    const handlePause = () => {
        canvasRef.current?.pause()
        setIsPaused(true)
    }

    const handleResume = () => {
        canvasRef.current?.resume()
        setIsPaused(false)
    }

    const handleRetry = () => {
        canvasRef.current?.reset()
        setTimeout(() => {
            canvasRef.current?.start()
        }, 100)
    }

    const handleExit = () => {
        onBack()
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
                    top: 'max(env(safe-area-inset-top, 0px), 12px)',
                    left: 'max(env(safe-area-inset-left, 0px), 12px)',
                    right: 'max(env(safe-area-inset-right, 0px), 12px)',
                    bottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
                    border: `3px solid ${theme.border}`,
                    boxShadow: `0 6px 0 ${theme.border}, 0 10px 30px rgba(0,0,0,0.5)`,
                }}
            >
                <MiniGameCanvas
                    ref={canvasRef}
                    gameId={gameId}
                    onRetry={handleRetry}
                    onExit={handleExit}
                />
            </div>

            {/* Pause Button */}
            <button
                onClick={handlePause}
                className="absolute z-20 h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 8px)',
                    right: 'calc(max(env(safe-area-inset-right, 0px), 12px) + 8px)',
                    background: 'rgba(0,0,0,0.5)',
                    border: `2px solid rgba(255,255,255,0.2)`,
                }}
            >
                <Pause className="h-5 w-5 text-white" />
            </button>

            {/* Pause Overlay */}
            {isPaused && (
                <div
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.8)' }}
                >
                    <h2 className="text-white text-2xl font-bold mb-8">PAUSED</h2>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleResume}
                            className="px-8 py-3 rounded-lg bg-blue-500 text-white font-bold transition-all active:scale-95"
                        >
                            RESUME
                        </button>
                        <button
                            onClick={handleRetry}
                            className="px-8 py-3 rounded-lg bg-yellow-500 text-black font-bold transition-all active:scale-95"
                        >
                            RETRY
                        </button>
                        <button
                            onClick={handleExit}
                            className="px-8 py-3 rounded-lg bg-red-500 text-white font-bold transition-all active:scale-95"
                        >
                            EXIT
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
