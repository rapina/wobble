import { useEffect, useRef } from 'react'
import { Application, Ticker } from 'pixi.js'
import { Wobble, WobbleExpression, WobbleShape } from './Wobble'
import {
    incrementDestroyCount,
    decrementDestroyCount,
    waitForDestroys,
} from '@/utils/pixiLifecycle'

interface WobbleDisplayProps {
    size?: number
    color?: string | number
    shape?: WobbleShape
    expression?: WobbleExpression
    className?: string
}

export function WobbleDisplay({
    size = 120,
    color = '#F5B041',
    shape = 'circle',
    expression = 'happy',
    className,
}: WobbleDisplayProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)
    const wobbleRef = useRef<Wobble | null>(null)
    const tickerCallbackRef = useRef<((ticker: Ticker) => void) | null>(null)
    const mountedRef = useRef(true)
    const initIdRef = useRef(0)

    // Update wobble properties without recreating the app
    useEffect(() => {
        if (wobbleRef.current) {
            wobbleRef.current.updateOptions({
                color,
                shape,
                expression,
            })
        }
    }, [color, shape, expression])

    // Create app on mount, cleanup on unmount
    useEffect(() => {
        mountedRef.current = true
        const currentInitId = ++initIdRef.current

        if (!containerRef.current) return

        const container = containerRef.current
        const canvasSize = size * 2

        const initApp = async () => {
            // Wait for any pending PixiJS app destroys to complete
            await waitForDestroys()

            // Check if still valid after waiting
            if (!mountedRef.current || currentInitId !== initIdRef.current) return

            try {
                const app = new Application()

                await app.init({
                    width: canvasSize,
                    height: canvasSize,
                    backgroundAlpha: 0,
                    antialias: true,
                    resolution: Math.min(window.devicePixelRatio || 1, 2),
                    autoDensity: true,
                })

                // Check if still valid after init
                if (!mountedRef.current || currentInitId !== initIdRef.current) {
                    try {
                        app.destroy(true, { children: true })
                    } catch {
                        // Ignore cleanup errors
                    }
                    return
                }

                // Clear existing canvas if any
                while (container.firstChild) {
                    container.removeChild(container.firstChild)
                }

                appRef.current = app
                container.appendChild(app.canvas)

                const wobble = new Wobble({
                    size,
                    color,
                    shape,
                    expression,
                    showShadow: true,
                    shadowOffsetY: size * 0.15,
                })
                wobbleRef.current = wobble

                wobble.position.set(canvasSize / 2, canvasSize / 2)
                app.stage.addChild(wobble)

                // Wobble animation
                let phase = 0
                const tickerCallback = (ticker: Ticker) => {
                    // Guard against race conditions during cleanup
                    if (!mountedRef.current || !wobbleRef.current || !appRef.current) {
                        return
                    }
                    try {
                        phase += ticker.deltaTime * 0.05
                        wobble.updateOptions({
                            wobblePhase: phase,
                            scaleX: 1 + Math.sin(phase * 0.8) * 0.03,
                            scaleY: 1 - Math.sin(phase * 0.8) * 0.03,
                        })
                    } catch {
                        // Ignore errors during animation - likely cleanup race condition
                    }
                }
                tickerCallbackRef.current = tickerCallback
                app.ticker.add(tickerCallback)
            } catch {
                // Ignore init errors
            }
        }

        initApp()

        return () => {
            mountedRef.current = false

            const currentApp = appRef.current
            const currentWobble = wobbleRef.current
            const currentTickerCallback = tickerCallbackRef.current

            // Clear refs immediately to prevent further use
            appRef.current = null
            wobbleRef.current = null
            tickerCallbackRef.current = null

            if (currentApp) {
                // Mark destroy as pending so new apps wait
                incrementDestroyCount()

                // Stop ticker immediately
                try {
                    currentApp.ticker.stop()
                    if (currentTickerCallback) {
                        currentApp.ticker.remove(currentTickerCallback)
                    }
                } catch {
                    // Ignore ticker errors
                }

                // Remove canvas from DOM immediately
                if (currentApp.canvas && currentApp.canvas.parentNode) {
                    currentApp.canvas.parentNode.removeChild(currentApp.canvas)
                }

                // Delay destruction to avoid TexturePool race condition
                setTimeout(() => {
                    try {
                        if (currentWobble) {
                            currentWobble.destroy({ children: true })
                        }
                        currentApp.stage.removeChildren()
                        currentApp.destroy(true, {
                            children: true,
                            texture: false,
                            textureSource: false,
                        })
                    } catch {
                        // Ignore cleanup errors - TexturePool may already be cleared
                    } finally {
                        decrementDestroyCount()
                    }
                }, 50)
            }
        }
    }, [size]) // Only recreate on size change

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: size * 2,
                height: size * 2,
            }}
        />
    )
}

// Backwards compatibility
export { WobbleDisplay as BlobDisplay }
