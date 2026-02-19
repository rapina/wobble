import { Application } from 'pixi.js'
import { useEffect, useRef, useState, useCallback, RefObject } from 'react'
import { pixiColors } from '../utils/pixiHelpers'
import {
    activeDestroyCount,
    incrementDestroyCount,
    decrementDestroyCount,
    waitForDestroys,
} from '../utils/pixiLifecycle'

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
                await waitForDestroys()

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
                    app.destroy(false, { children: true, texture: true })
                    return
                }

                // Wrap render method to catch intermittent PixiJS v8 Batcher errors.
                // These occur when the global Batch pool has stale entries after
                // a previous app's destroy. The next frame renders correctly.
                const originalRender = app.render.bind(app)
                app.render = () => {
                    try {
                        originalRender()
                    } catch (e) {
                        if (
                            e instanceof TypeError &&
                            (e.message?.includes("reading 'clear'") ||
                                e.message?.includes("reading 'push'"))
                        ) {
                            return // Skip this frame, next frame will be fine
                        }
                        throw e
                    }
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
                    incrementDestroyCount()

                    // Defer the actual destroy with a longer delay
                    setTimeout(() => {
                        try {
                            // Pass false for renderer options to avoid calling
                            // GlobalResourceRegistry.release() which destroys the
                            // global Batch pool shared across all PixiJS apps.
                            // Individual renderer systems (WebGL context, etc.) are
                            // still properly cleaned up via the destroy runners.
                            appToDestroy.destroy(false, { children: true, texture: true })
                        } catch (e) {
                            console.warn('[PixiApp] Deferred destroy error (safe to ignore):', e)
                        } finally {
                            decrementDestroyCount()
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
