import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { Blob, BlobExpression } from './Blob';

interface BlobDisplayProps {
    size?: number;
    color?: string;
    expression?: BlobExpression;
    className?: string;
}

export function BlobDisplay({
    size = 120,
    color = '#F5B041',
    expression = 'happy',
    className,
}: BlobDisplayProps) {
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

            const blob = new Blob({
                size,
                color,
                expression,
                showShadow: true,
                shadowOffsetY: size * 0.15,
            });

            blob.position.set(canvasSize / 2, canvasSize / 2);
            app.stage.addChild(blob);

            // Wobble animation
            let phase = 0;
            app.ticker.add((ticker) => {
                phase += ticker.deltaTime * 0.05;
                blob.updateOptions({
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
    }, [size, color, expression]);

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
