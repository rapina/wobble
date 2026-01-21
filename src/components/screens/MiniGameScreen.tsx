import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
    MiniGameCanvas,
    MiniGameCanvasHandle,
    MiniGameId,
} from '@/components/canvas/MiniGameCanvas'
import { Pause, Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Balatro from '@/components/Balatro'
import { minigamePreset } from '@/config/backgroundPresets'
import { useAdMob } from '@/hooks/useAdMob'

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
    const [isIntroShowing, setIsIntroShowing] = useState(true)

    const canvasRef = useRef<MiniGameCanvasHandle>(null)
    const { showRewardAd, webSimulationActive, completeWebSimulation, cancelWebSimulation } =
        useAdMob()

    // Mount animation
    useEffect(() => {
        setMounted(false)
        const timer = setTimeout(() => {
            setMounted(true)
        }, 50)
        return () => clearTimeout(timer)
    }, [])

    // Poll intro state to control pause button visibility
    useEffect(() => {
        const checkIntroState = () => {
            if (canvasRef.current) {
                setIsIntroShowing(canvasRef.current.isIntroShowing())
            }
        }
        const interval = setInterval(checkIntroState, 100)
        return () => clearInterval(interval)
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

    const handleContinueWithAd = (onSuccess: () => void, onFail?: () => void) => {
        showRewardAd(onSuccess, onFail)
    }

    // Memoized Balatro background
    const balatroBackground = useMemo(
        () => (
            <div className="absolute inset-0 opacity-70">
                <Balatro
                    color1={minigamePreset.color1}
                    color2={minigamePreset.color2}
                    color3={minigamePreset.color3}
                    spinSpeed={minigamePreset.spinSpeed}
                    spinRotation={minigamePreset.spinRotation}
                    contrast={minigamePreset.contrast}
                    lighting={minigamePreset.lighting}
                    spinAmount={minigamePreset.spinAmount}
                    pixelFilter={minigamePreset.pixelFilter}
                    isRotate={minigamePreset.isRotate}
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
                    onContinueWithAd={handleContinueWithAd}
                />
            </div>

            {/* Pause Button - Hidden during intro */}
            {!isIntroShowing && (
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
            )}

            {/* Pause Overlay */}
            {isPaused && (
                <div
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.85)' }}
                >
                    {/* Balatro-style pause card */}
                    <div
                        className="relative rounded-xl p-8"
                        style={{
                            background: '#1a1a2e',
                            border: '3px solid #2d2d44',
                            boxShadow: '0 8px 0 #0d1117, 0 12px 40px rgba(0,0,0,0.7)',
                        }}
                    >
                        {/* Glowing accent line */}
                        <div
                            className="absolute top-0 left-8 right-8 h-1 rounded-full"
                            style={{
                                background:
                                    'linear-gradient(90deg, transparent, #c9a227, transparent)',
                                boxShadow: '0 0 20px rgba(201, 162, 39, 0.5)',
                            }}
                        />

                        <h2
                            className="text-2xl font-bold mb-8 text-center"
                            style={{
                                color: '#c9a227',
                                textShadow: '0 0 20px rgba(201, 162, 39, 0.3)',
                            }}
                        >
                            PAUSED
                        </h2>

                        <div className="flex flex-col gap-3 min-w-[200px]">
                            <button
                                onClick={handleResume}
                                className="px-8 py-3 rounded-lg font-bold transition-all active:scale-95"
                                style={{
                                    background: '#4ecdc4',
                                    color: '#0d1117',
                                    border: '2px solid #6ee7de',
                                    boxShadow:
                                        '0 4px 0 #2d9990, 0 6px 15px rgba(78, 205, 196, 0.3)',
                                }}
                            >
                                <Play className="inline-block w-4 h-4 mr-2 mb-0.5" />
                                RESUME
                            </button>
                            <button
                                onClick={handleExit}
                                className="px-8 py-3 rounded-lg font-bold transition-all active:scale-95"
                                style={{
                                    background: '#e85d4c',
                                    color: '#ffffff',
                                    border: '2px solid #f07366',
                                    boxShadow: '0 4px 0 #b8463a, 0 6px 15px rgba(232, 93, 76, 0.3)',
                                }}
                            >
                                <X className="inline-block w-4 h-4 mr-2 mb-0.5" />
                                EXIT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Web Ad Simulation Overlay */}
            {webSimulationActive && (
                <div
                    className="absolute inset-0 z-40 flex flex-col items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.9)' }}
                >
                    <div className="bg-gray-800 rounded-xl p-6 max-w-xs text-center">
                        <Play className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
                        <h3 className="text-white text-lg font-bold mb-2">Rewarded Ad</h3>
                        <p className="text-gray-400 text-sm mb-6">(Web Simulation)</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={completeWebSimulation}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-white font-bold transition-all active:scale-95"
                            >
                                <Play className="w-4 h-4" />
                                Watch Ad
                            </button>
                            <button
                                onClick={cancelWebSimulation}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white font-bold transition-all active:scale-95"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
