import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import { usePixiApp } from '@/hooks/usePixiApp'
import { BaseMiniGameScene, MiniGameCallbacks, MiniGamePhase } from './minigame'
import { WobblediverScene } from './minigame/games/Wobblediver'
import { RefreshCw } from 'lucide-react'
import { useMinigameRecordStore } from '@/stores/minigameRecordStore'

export type MiniGameId = 'wobblediver'

interface MiniGameCanvasProps {
    gameId: MiniGameId
    onGameOver?: () => void
    onRetry?: () => void
    onExit?: () => void
    width?: number | string
    height?: number | string
}

export interface MiniGameCanvasHandle {
    start: () => void
    pause: () => void
    resume: () => void
    reset: () => void
    getPhase: () => MiniGamePhase | null
}

function createMiniGameScene(
    gameId: MiniGameId,
    app: import('pixi.js').Application,
    callbacks: MiniGameCallbacks
): BaseMiniGameScene | null {
    switch (gameId) {
        case 'wobblediver':
            return new WobblediverScene(app, callbacks)
        default:
            console.error(`Unknown minigame: ${gameId}`)
            return null
    }
}

export const MiniGameCanvas = forwardRef<MiniGameCanvasHandle, MiniGameCanvasProps>(
    function MiniGameCanvas(
        { gameId, onGameOver, onRetry, onExit, width = '100%', height = '100%' },
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

        useEffect(() => {
            onGameOverRef.current = onGameOver
        }, [onGameOver])

        useEffect(() => {
            onRetryRef.current = onRetry
        }, [onRetry])

        useEffect(() => {
            onExitRef.current = onExit
        }, [onExit])

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
                const recordWobblediverGame = useMinigameRecordStore.getState().recordWobblediverGame

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
                }

                const scene = createMiniGameScene(gameId, app, callbacks)

                if (scene) {
                    app.stage.addChild(scene.container)
                    sceneRef.current = scene
                    setSceneError(null)

                    // Auto-start after a short delay
                    setTimeout(() => {
                        scene.start()
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
        }, [isReady, app, gameId, sceneRetryCount])

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
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    background: '#1a1a2e',
                }}
            >
                {!isReady && <div className="animate-pulse text-white/30 text-sm">Loading...</div>}
            </div>
        )
    }
)
