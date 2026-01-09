import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import { usePixiApp } from '@/hooks/usePixiApp'
import { AdventureScene, PlayResult, NarrationData, createAdventureScene } from './adventure'
import { RefreshCw } from 'lucide-react'

interface AdventureCanvasProps {
    levelId: string
    variables: Record<string, number>
    targets: Record<string, number>
    narrations?: NarrationData[]
    studiedFormulas?: Set<string>
    onPlayComplete?: (result: PlayResult) => void
    onNarrationComplete?: () => void
    width?: number | string
    height?: number | string
}

export interface AdventureCanvasHandle {
    play: () => void
    reset: () => void
    advanceNarration: () => void
}

export const AdventureCanvas = forwardRef<AdventureCanvasHandle, AdventureCanvasProps>(
    function AdventureCanvas(
        {
            levelId,
            variables,
            targets,
            narrations,
            studiedFormulas,
            onPlayComplete,
            onNarrationComplete,
            width = '100%',
            height = '100%',
        },
        ref
    ) {
        const containerRef = useRef<HTMLDivElement>(null)
        const { app, isReady, error: appError, retry: retryApp } = usePixiApp(containerRef)
        const sceneRef = useRef<AdventureScene | null>(null)
        const onPlayCompleteRef = useRef(onPlayComplete)
        const onNarrationCompleteRef = useRef(onNarrationComplete)
        const [sceneError, setSceneError] = useState<Error | null>(null)
        const [sceneRetryCount, setSceneRetryCount] = useState(0)

        // Keep callback refs updated
        useEffect(() => {
            onPlayCompleteRef.current = onPlayComplete
        }, [onPlayComplete])

        useEffect(() => {
            onNarrationCompleteRef.current = onNarrationComplete
        }, [onNarrationComplete])

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
                play: () => {
                    sceneRef.current?.play()
                },
                reset: () => {
                    if (sceneRef.current) {
                        sceneRef.current.reset()
                    }
                },
                advanceNarration: () => {
                    if (sceneRef.current) {
                        sceneRef.current.advanceNarration()
                    }
                },
            }),
            []
        )

        // Create/switch scene based on levelId
        useEffect(() => {
            if (!isReady || !app) return

            // Store previous scene for delayed cleanup
            const previousScene = sceneRef.current
            sceneRef.current = null

            // Immediately hide and remove previous scene from stage
            if (previousScene) {
                try {
                    previousScene.container.visible = false
                    previousScene.container.renderable = false
                    if (app.stage) {
                        app.stage.removeChild(previousScene.container)
                    }
                } catch (e) {
                    console.error('[AdventureCanvas] Hide error:', e)
                }
            }

            try {
                // Create new scene
                const scene = createAdventureScene(levelId, app, {
                    narrations,
                    studiedFormulas,
                    onPlayComplete: (result) => {
                        onPlayCompleteRef.current?.(result)
                    },
                    onNarrationComplete: () => {
                        onNarrationCompleteRef.current?.()
                    },
                })

                if (scene) {
                    app.stage.addChild(scene.container)
                    sceneRef.current = scene
                    setSceneError(null)
                }
            } catch (e) {
                console.error('[AdventureCanvas] Scene creation error:', e)
                setSceneError(e instanceof Error ? e : new Error(String(e)))
            }

            // Destroy previous scene after a frame (outside render cycle)
            if (previousScene) {
                requestAnimationFrame(() => {
                    try {
                        previousScene.destroy()
                    } catch (e) {
                        console.error('[AdventureCanvas] Destroy error:', e)
                    }
                })
            }

            return () => {
                if (sceneRef.current) {
                    const sceneToDestroy = sceneRef.current
                    sceneRef.current = null

                    try {
                        sceneToDestroy.container.visible = false
                        sceneToDestroy.container.renderable = false
                        if (app.stage) {
                            app.stage.removeChild(sceneToDestroy.container)
                        }
                    } catch (e) {
                        console.error('[AdventureCanvas] Cleanup hide error:', e)
                    }

                    requestAnimationFrame(() => {
                        try {
                            sceneToDestroy.destroy()
                        } catch (e) {
                            console.error('[AdventureCanvas] Cleanup destroy error:', e)
                        }
                    })
                }
            }
            // Note: narrations is intentionally not in dependencies - it's only used at scene creation
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isReady, app, levelId, sceneRetryCount])

        // Update scene variables
        useEffect(() => {
            if (sceneRef.current && variables) {
                sceneRef.current.update(variables)
            }
        }, [variables])

        // Update scene targets
        useEffect(() => {
            if (sceneRef.current && targets) {
                sceneRef.current.setTargets(targets)
            }
        }, [targets])

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
                    <p className="text-red-400 text-sm mb-3">Failed to load scene</p>
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
