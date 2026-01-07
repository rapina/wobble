import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { Wobble, WobbleExpression, WobbleShape } from './Wobble';

interface WobbleDisplayProps {
    size?: number;
    color?: string | number;
    shape?: WobbleShape;
    expression?: WobbleExpression;
    className?: string;
}

export function WobbleDisplay({
    size = 120,
    color = '#F5B041',
    shape = 'circle',
    expression = 'happy',
    className,
}: WobbleDisplayProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        if (!containerRef.current) return;

        const container = containerRef.current;
        const canvasSize = size * 2;

        const app = new Application();

        app.init({
            width: canvasSize,
            height: canvasSize,
            backgroundAlpha: 0,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        }).then(() => {
            if (!mountedRef.current) {
                app.destroy(true, { children: true });
                return;
            }

            // Clear existing canvas if any
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            appRef.current = app;
            container.appendChild(app.canvas);

            const wobble = new Wobble({
                size,
                color,
                shape,
                expression,
                showShadow: true,
                shadowOffsetY: size * 0.15,
            });

            wobble.position.set(canvasSize / 2, canvasSize / 2);
            app.stage.addChild(wobble);

            // Wobble animation
            let phase = 0;
            app.ticker.add((ticker) => {
                phase += ticker.deltaTime * 0.05;
                wobble.updateOptions({
                    wobblePhase: phase,
                    scaleX: 1 + Math.sin(phase * 0.8) * 0.03,
                    scaleY: 1 - Math.sin(phase * 0.8) * 0.03,
                });
            });
        });

        return () => {
            mountedRef.current = false;
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }
        };
    }, [size, color, shape, expression]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: size * 2,
                height: size * 2,
            }}
        />
    );
}

// Backwards compatibility
export { WobbleDisplay as BlobDisplay };
