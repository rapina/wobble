import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import { usePixiApp } from '../../hooks/usePixiApp'
import { BaseScene } from './scenes/BaseScene'
import { getSceneClass } from './scenes/SceneManager'
import { WobbleShape } from './Wobble'
import { RefreshCw } from 'lucide-react'

interface PixiCanvasProps {
    formulaId: string
    variables: Record<string, number>
    width?: number | string
    height?: number | string
    paused?: boolean
}

export interface PixiCanvasHandle {
    showNewWobbleDiscovery: (
        shapes: WobbleShape[],
        lang: string,
        onComplete?: () => void
    ) => void
}

export const PixiCanvas = forwardRef<PixiCanvasHandle, PixiCanvasProps>(function PixiCanvas(
    { formulaId, variables, width = '100%', height = '100%', paused = false },
    ref
) {
    const containerRef = useRef<HTMLDivElement>(null)
    const { app, isReady, error: appError, retry: retryApp } = usePixiApp(containerRef)
    const sceneRef = useRef<BaseScene | null>(null)
    const [sceneError, setSceneError] = useState<Error | null>(null)
    const [sceneRetryCount, setSceneRetryCount] = useState(0)

    // Combined error state
    const error = appError || sceneError

    // Retry function
    const handleRetry = () => {
        setSceneError(null)
        if (appError) {
            retryApp()
        } else {
            // Force scene recreation
            setSceneRetryCount((c) => c + 1)
        }
    }

    // Expose methods to parent
    useImperativeHandle(
        ref,
        () => ({
            showNewWobbleDiscovery: (
                shapes: WobbleShape[],
                lang: string,
                onComplete?: () => void
            ) => {
                if (sceneRef.current) {
                    try {
                        sceneRef.current.showNewWobbleDiscovery(shapes, lang, onComplete)
                    } catch (e) {
                        console.error('[PixiCanvas] showNewWobbleDiscovery error:', e)
                    }
                }
            },
        }),
        []
    )

    // Create/switch scene based on formulaId
    useEffect(() => {
        if (!isReady || !app) return

        try {
            // Clean up previous scene
            if (sceneRef.current) {
                try {
                    if (app.stage) {
                        app.stage.removeChild(sceneRef.current.container)
                    }
                    sceneRef.current.destroy()
                } catch (e) {
                    console.error('[PixiCanvas] Cleanup error:', e)
                }
                sceneRef.current = null
            }

            // Create new scene
            const SceneClass = getSceneClass(formulaId)
            if (SceneClass) {
                const scene = new SceneClass(app)
                app.stage.addChild(scene.container)
                sceneRef.current = scene
                setSceneError(null)
            }
        } catch (e) {
            console.error('[PixiCanvas] Scene creation error:', e)
            setSceneError(e instanceof Error ? e : new Error(String(e)))
        }

        return () => {
            if (sceneRef.current) {
                try {
                    // app.stage may be null if app was already destroyed
                    if (app.stage) {
                        app.stage.removeChild(sceneRef.current.container)
                    }
                    sceneRef.current.destroy()
                } catch (e) {
                    console.error('[PixiCanvas] Cleanup error:', e)
                }
                sceneRef.current = null
            }
        }
    }, [isReady, app, formulaId, sceneRetryCount])

    // Update scene with new variables
    useEffect(() => {
        if (sceneRef.current) {
            try {
                sceneRef.current.update(variables)
            } catch (e) {
                console.error('[PixiCanvas] Update error:', e)
                setSceneError(e instanceof Error ? e : new Error(String(e)))
            }
        }
    }, [variables])

    // Pause/resume ticker based on paused prop
    useEffect(() => {
        if (!app) return

        if (paused) {
            app.ticker.stop()
        } else {
            app.ticker.start()
        }
    }, [app, paused])

    return (
        <div
            ref={containerRef}
            style={{
                width,
                height,
                overflow: 'hidden',
                minHeight: 200,
                background: '#0f0f1a',
                position: 'relative',
            }}
        >
            {/* Error overlay with retry button */}
            {error && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(15, 15, 26, 0.95)',
                        zIndex: 10,
                        gap: 16,
                    }}
                >
                    <div
                        style={{
                            color: '#ff6b6b',
                            fontSize: 14,
                            textAlign: 'center',
                            padding: '0 20px',
                        }}
                    >
                        Something went wrong
                    </div>
                    <button
                        onClick={handleRetry}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 20px',
                            background: '#4a9eff',
                            border: '2px solid #1a1a1a',
                            borderRadius: 8,
                            color: 'white',
                            fontSize: 14,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 3px 0 #1a1a1a',
                        }}
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            )}
        </div>
    )
})
