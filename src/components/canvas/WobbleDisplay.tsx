import { useEffect, useRef } from 'react'
import { Application, Ticker } from 'pixi.js'
import { Wobble, WobbleExpression, WobbleShape } from './Wobble'

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

        const app = new Application()

        app.init({
            width: canvasSize,
            height: canvasSize,
            backgroundAlpha: 0,
            antialias: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2),
            autoDensity: true,
        })
            .then(() => {
                // Check if this init is still valid (not stale)
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
                    phase += ticker.deltaTime * 0.05
                    wobble.updateOptions({
                        wobblePhase: phase,
                        scaleX: 1 + Math.sin(phase * 0.8) * 0.03,
                        scaleY: 1 - Math.sin(phase * 0.8) * 0.03,
                    })
                }
                tickerCallbackRef.current = tickerCallback
                app.ticker.add(tickerCallback)
            })
            .catch(() => {
                // Ignore init errors
            })

        return () => {
            mountedRef.current = false

            const currentApp = appRef.current
            const wobbleToClean = wobbleRef.current
            const tickerCallback = tickerCallbackRef.current

            // Clear refs immediately
            appRef.current = null
            wobbleRef.current = null
            tickerCallbackRef.current = null

            if (currentApp) {
                try {
                    // 1. Remove wobble from stage IMMEDIATELY to prevent rendering
                    if (wobbleToClean && wobbleToClean.parent) {
                        wobbleToClean.parent.removeChild(wobbleToClean)
                    }
                    currentApp.stage.removeChildren()

                    // 2. Stop ticker to prevent new frames
                    currentApp.ticker.stop()
                    if (tickerCallback) {
                        currentApp.ticker.remove(tickerCallback)
                    }
                } catch {
                    // Ignore immediate cleanup errors
                }

                // 3. Defer destruction with longer delay to let any in-progress render fully complete
                setTimeout(() => {
                    try {
                        currentApp.destroy(true, {
                            children: true,
                            texture: false,
                            textureSource: false,
                        })
                    } catch {
                        // Ignore destruction errors
                    }
                }, 200)
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
