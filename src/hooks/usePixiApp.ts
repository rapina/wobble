import { Application } from 'pixi.js'
import { useEffect, useRef, useState, useCallback, RefObject } from 'react'
import { pixiColors } from '../utils/pixiHelpers'

// Global queue to serialize PixiJS app lifecycle in React StrictMode
let globalInitPromise: Promise<void> = Promise.resolve()
let activeDestroyCount = 0

interface UsePixiAppOptions {
    backgroundColor?: number
    antialias?: boolean
    resolution?: number
}

interface UsePixiAppReturn {
    app: Application | null
    isReady: boolean
    error: Error | null
    retry: () => void
}

export function usePixiApp(
    containerRef: RefObject<HTMLDivElement | null>,
    options: UsePixiAppOptions = {}
): UsePixiAppReturn {
    const appRef = useRef<Application | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [retryCount, setRetryCount] = useState(0)

    const {
        backgroundColor = pixiColors.backgroundDark,
        antialias = true,
        resolution = window.devicePixelRatio || 1,
    } = options

    const retry = useCallback(() => {
        setError(null)
        setIsReady(false)
        setRetryCount((c) => c + 1)
    }, [])

    useEffect(() => {
        if (!containerRef.current) return

        let cancelled = false
        let resizeObserver: ResizeObserver | null = null

        const container = containerRef.current

        const initApp = async () => {
            try {
                // Wait for any pending destroys to complete before creating new app
                // This prevents PixiJS v8 shared Batcher corruption in React StrictMode
                if (activeDestroyCount > 0) {
                    await new Promise<void>((resolve) => {
                        const checkDestroy = () => {
                            if (activeDestroyCount === 0) {
                                resolve()
                            } else {
                                setTimeout(checkDestroy, 50)
                            }
                        }
                        checkDestroy()
                    })
                }

                const app = new Application()

                await app.init({
                    width: container.clientWidth,
                    height: container.clientHeight,
                    backgroundColor,
                    antialias,
                    resolution,
                    autoDensity: true,
                })

                if (cancelled) {
                    app.destroy(true, { children: true, texture: true })
                    return
                }

                // Append canvas to container
                const canvas = app.canvas as HTMLCanvasElement
                canvas.style.position = 'absolute'
                canvas.style.top = '0'
                canvas.style.left = '0'
                canvas.style.width = '100%'
                canvas.style.height = '100%'
                container.appendChild(canvas)
                appRef.current = app
                setError(null)
                setIsReady(true)

                // Handle resize
                const handleResize = () => {
                    try {
                        if (app && app.renderer && container) {
                            app.renderer.resize(container.clientWidth, container.clientHeight)
                        }
                    } catch (e) {
                        console.error('[PixiApp] Resize error:', e)
                    }
                }

                resizeObserver = new ResizeObserver(handleResize)
                resizeObserver.observe(container)
            } catch (e) {
                console.error('[PixiApp] Init error:', e)
                if (!cancelled) {
                    setError(e instanceof Error ? e : new Error(String(e)))
                    setIsReady(false)
                }
            }
        }

        initApp()

        return () => {
            cancelled = true
            if (resizeObserver) {
                resizeObserver.disconnect()
            }
            if (appRef.current) {
                try {
                    // In PixiJS v8, destroy() corrupts the shared Batcher.
                    // Use a deferred destroy to avoid React StrictMode double-render issues.
                    const appToDestroy = appRef.current
                    appRef.current = null

                    // Stop the ticker first to prevent render cycles during destroy
                    appToDestroy.ticker.stop()

                    // Remove canvas from DOM immediately
                    if (appToDestroy.canvas && appToDestroy.canvas.parentNode) {
                        appToDestroy.canvas.parentNode.removeChild(appToDestroy.canvas)
                    }

                    // Mark destroy as pending so new apps wait
                    activeDestroyCount++

                    // Defer the actual destroy with a longer delay
                    setTimeout(() => {
                        try {
                            appToDestroy.destroy(true, { children: true, texture: true })
                        } catch (e) {
                            console.warn('[PixiApp] Deferred destroy error (safe to ignore):', e)
                        } finally {
                            activeDestroyCount--
                        }
                    }, 100) // 100ms delay to ensure render cycle completes
                } catch (e) {
                    console.error('[PixiApp] Cleanup error:', e)
                }
            }
            setIsReady(false)
        }
    }, [backgroundColor, antialias, resolution, retryCount])

    return { app: appRef.current, isReady, error, retry }
}
