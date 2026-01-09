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

    useEffect(() => {
        mountedRef.current = true

        if (!containerRef.current) return

        const container = containerRef.current
        const canvasSize = size * 2

        const app = new Application()

        app.init({
            width: canvasSize,
            height: canvasSize,
            backgroundAlpha: 0,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        }).then(() => {
            if (!mountedRef.current) {
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

        return () => {
            mountedRef.current = false

            const app = appRef.current
            if (app) {
                try {
                    // Stop ticker first
                    app.ticker.stop()
                    if (tickerCallbackRef.current) {
                        app.ticker.remove(tickerCallbackRef.current)
                    }

                    // Remove wobble from stage
                    if (wobbleRef.current && wobbleRef.current.parent) {
                        wobbleRef.current.parent.removeChild(wobbleRef.current)
                    }

                    // Clear stage
                    app.stage.removeChildren()

                    // Destroy app
                    app.destroy(true, { children: true, texture: false, textureSource: false })
                } catch {
                    // Ignore cleanup errors
                }
                appRef.current = null
                wobbleRef.current = null
                tickerCallbackRef.current = null
            }
        }
    }, [size, color, shape, expression])

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
