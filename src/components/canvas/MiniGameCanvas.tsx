import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import { usePixiApp } from '@/hooks/usePixiApp'
import { BaseMiniGameScene, MiniGameCallbacks, MiniGamePhase } from './minigame'
import { WobblediverScene } from './minigame/games/Wobblediver'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useMinigameRecordStore } from '@/stores/minigameRecordStore'

// Abyss theme colors for loading state
const abyssTheme = {
    void: '#030508',
    deep: '#0a0f18',
    accent: '#6b5b95',
    teal: '#4ecdc4',
}

export type MiniGameId = 'wobblediver'

export type MiniGameMode = 'endless' | 'run'

interface MiniGameCanvasProps {
    gameId: MiniGameId
    mode?: MiniGameMode
    onGameOver?: () => void
    onRetry?: () => void
    onExit?: () => void
    onContinueWithAd?: (onSuccess: () => void, onFail?: () => void) => void
    width?: number | string
    height?: number | string
}

export interface MiniGameCanvasHandle {
    start: () => void
    pause: () => void
    resume: () => void
    reset: () => void
    getPhase: () => MiniGamePhase | null
    isIntroShowing: () => boolean
}

function createMiniGameScene(
    gameId: MiniGameId,
    app: import('pixi.js').Application,
    callbacks: MiniGameCallbacks,
    mode: MiniGameMode = 'endless'
): BaseMiniGameScene | null {
    switch (gameId) {
        case 'wobblediver': {
            const scene = new WobblediverScene(app, callbacks)
            // Enable run mode if specified
            if (mode === 'run') {
                scene.setRunMode(true)
            }
            return scene
        }
        default:
            console.error(`Unknown minigame: ${gameId}`)
            return null
    }
}

export const MiniGameCanvas = forwardRef<MiniGameCanvasHandle, MiniGameCanvasProps>(
    function MiniGameCanvas(
        {
            gameId,
            mode = 'endless',
            onGameOver,
            onRetry,
            onExit,
            onContinueWithAd,
            width = '100%',
            height = '100%',
        },
        ref
    ) {
        const containerRef = useRef<HTMLDivElement>(null)
        const { app, isReady, error: appError, retry: retryApp } = usePixiApp(containerRef)
        const sceneRef = useRef<BaseMiniGameScene | null>(null)
        const [sceneError, setSceneError] = useState<Error | null>(null)
        const [sceneRetryCount, setSceneRetryCount] = useState(0)

        // Keep callback refs updated
        const onGameOverRef = useRef(onGameOver)
        const onRetryRef = useRef(onRetry)
        const onExitRef = useRef(onExit)
        const onContinueWithAdRef = useRef(onContinueWithAd)

        useEffect(() => {
            onGameOverRef.current = onGameOver
        }, [onGameOver])

        useEffect(() => {
            onRetryRef.current = onRetry
        }, [onRetry])

        useEffect(() => {
            onExitRef.current = onExit
        }, [onExit])

        useEffect(() => {
            onContinueWithAdRef.current = onContinueWithAd
        }, [onContinueWithAd])

        const error = appError || sceneError

        const handleRetry = () => {
            setSceneError(null)
            if (appError) {
                retryApp()
            } else {
                setSceneRetryCount((c) => c + 1)
            }
        }

        // Expose methods to parent
        useImperativeHandle(
            ref,
            () => ({
                start: () => {
                    sceneRef.current?.start()
                },
                pause: () => {
                    sceneRef.current?.pause()
                },
                resume: () => {
                    sceneRef.current?.resume()
                },
                reset: () => {
                    sceneRef.current?.reset()
                },
                getPhase: () => {
                    if (sceneRef.current) {
                        return (sceneRef.current as any).gamePhase
                    }
                    return null
                },
                isIntroShowing: () => {
                    if (sceneRef.current && 'isIntroShowing' in sceneRef.current) {
                        return (sceneRef.current as any).isIntroShowing()
                    }
                    return false
                },
            }),
            []
        )

        // Create/switch scene based on gameId
        useEffect(() => {
            if (!isReady || !app) return

            // Destroy previous scene
            const previousScene = sceneRef.current
            sceneRef.current = null

            if (previousScene) {
                try {
                    previousScene.destroy()
                } catch (e) {
                    console.error('[MiniGameCanvas] Destroy error:', e)
                }
            }

            try {
                const recordWobblediverGame =
                    useMinigameRecordStore.getState().recordWobblediverGame

                const callbacks: MiniGameCallbacks = {
                    onGameOver: () => {
                        // Record game result based on game type
                        if (gameId === 'wobblediver' && sceneRef.current) {
                            const gameData = sceneRef.current.getGameData()
                            recordWobblediverGame({
                                depth: (gameData.depth as number) || 0,
                                score: (gameData.score as number) || 0,
                                rank: (gameData.rank as string) || 'D',
                                isPerfect: (gameData.isPerfect as boolean) || false,
                            })
                        }
                        onGameOverRef.current?.()
                    },
                    onRetry: () => {
                        onRetryRef.current?.()
                    },
                    onExit: () => {
                        onExitRef.current?.()
                    },
                    onContinueWithAd: onContinueWithAdRef.current
                        ? (onSuccess, onFail) => {
                              onContinueWithAdRef.current?.(onSuccess, onFail)
                          }
                        : undefined,
                }

                const scene = createMiniGameScene(gameId, app, callbacks, mode)

                if (scene) {
                    app.stage.addChild(scene.container)
                    sceneRef.current = scene
                    setSceneError(null)

                    // Auto-start after a short delay
                    setTimeout(() => {
                        // For run mode, initialize the run first then show map
                        if (mode === 'run' && gameId === 'wobblediver') {
                            ;(scene as WobblediverScene).initializeRunMode()
                        } else {
                            scene.start()
                        }
                    }, 100)
                }
            } catch (e) {
                console.error('[MiniGameCanvas] Scene creation error:', e)
                setSceneError(e instanceof Error ? e : new Error(String(e)))
            }

            return () => {
                if (sceneRef.current) {
                    const sceneToDestroy = sceneRef.current
                    sceneRef.current = null

                    try {
                        sceneToDestroy.destroy()
                    } catch (e) {
                        console.error('[MiniGameCanvas] Cleanup destroy error:', e)
                    }
                }
            }
        }, [isReady, app, gameId, mode, sceneRetryCount])

        // Handle resize
        useEffect(() => {
            const handleResize = () => {
                if (sceneRef.current) {
                    sceneRef.current.resize()
                }
            }

            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }, [])

        if (error) {
            return (
                <div
                    ref={containerRef}
                    style={{ width, height }}
                    className="flex flex-col items-center justify-center bg-gray-900 rounded-xl"
                >
                    <p className="text-red-400 text-sm mb-3">Failed to load minigame</p>
                    <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            )
        }

        return (
            <div
                ref={containerRef}
                style={{
                    width,
                    height,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    background: `linear-gradient(180deg, ${abyssTheme.void} 0%, ${abyssTheme.deep} 100%)`,
                }}
            >
                {!isReady && (
                    <div className="flex flex-col items-center gap-6">
                        {/* Pulsing eye */}
                        <div className="relative animate-pulse">
                            <div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    width: 120,
                                    height: 60,
                                    background: `radial-gradient(ellipse, ${abyssTheme.accent}30 0%, transparent 70%)`,
                                    filter: 'blur(15px)',
                                }}
                            />
                            <div
                                style={{
                                    width: 80,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(ellipse, #dc2626 0%, #991b1b 60%, #7f1d1d 100%)',
                                    boxShadow: '0 0 30px #dc262660, 0 0 60px #dc262630',
                                }}
                            >
                                <div
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                        width: 12,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: '#000',
                                    }}
                                />
                            </div>
                        </div>
                        {/* Loading text with spinner */}
                        <div className="flex items-center gap-3">
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
                                Preparing the Abyss...
                            </span>
                        </div>
                    </div>
                )}
            </div>
        )
    }
)
