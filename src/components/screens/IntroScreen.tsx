import { useEffect, useRef, useState } from 'react'
import { Application, Container } from 'pixi.js'
import { IntroScene } from '../canvas/intro/IntroScene'
import { cn } from '@/lib/utils'

interface IntroScreenProps {
    onComplete: () => void
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)
    const sceneRef = useRef<IntroScene | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        if (!containerRef.current) return

        let cancelled = false
        const container = containerRef.current

        const initApp = async () => {
            const app = new Application()

            await app.init({
                width: container.clientWidth,
                height: container.clientHeight,
                backgroundColor: 0x1a1a2e,
                antialias: true,
                resolution: Math.min(window.devicePixelRatio || 1, 2),
                autoDensity: true,
            })

            if (cancelled) {
                app.destroy(true, { children: true })
                return
            }

            const canvas = app.canvas as HTMLCanvasElement
            canvas.style.position = 'absolute'
            canvas.style.top = '0'
            canvas.style.left = '0'
            canvas.style.width = '100%'
            canvas.style.height = '100%'
            container.appendChild(canvas)
            appRef.current = app

            // Create intro scene
            const sceneContainer = new Container()
            app.stage.addChild(sceneContainer)

            const introScene = new IntroScene({
                container: sceneContainer,
                width: container.clientWidth,
                height: container.clientHeight,
            })

            introScene.onComplete = () => {
                onComplete()
            }

            sceneRef.current = introScene
            introScene.show()

            // Animation loop
            app.ticker.add((ticker) => {
                introScene.update(ticker.deltaTime / 60)
            })

            setMounted(true)
        }

        initApp()

        return () => {
            cancelled = true
            if (appRef.current) {
                appRef.current.ticker.stop()
                appRef.current.destroy(true, { children: true })
                appRef.current = null
            }
        }
    }, [onComplete])

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative w-full h-full overflow-hidden',
                'transition-opacity duration-300',
                mounted ? 'opacity-100' : 'opacity-0'
            )}
            style={{ background: '#1a1a2e' }}
        />
    )
}

// Re-export helper functions
export { IntroScene } from '../canvas/intro/IntroScene'
