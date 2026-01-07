import { Application } from 'pixi.js';
import { useEffect, useRef, useState, RefObject } from 'react';
import { pixiColors } from '../utils/pixiHelpers';

interface UsePixiAppOptions {
    backgroundColor?: number;
    antialias?: boolean;
    resolution?: number;
}

interface UsePixiAppReturn {
    app: Application | null;
    isReady: boolean;
}

export function usePixiApp(
    containerRef: RefObject<HTMLDivElement | null>,
    options: UsePixiAppOptions = {}
): UsePixiAppReturn {
    const appRef = useRef<Application | null>(null);
    const [isReady, setIsReady] = useState(false);

    const {
        backgroundColor = pixiColors.backgroundDark,
        antialias = true,
        resolution = window.devicePixelRatio || 1,
    } = options;

    useEffect(() => {
        if (!containerRef.current) return;

        let cancelled = false;
        let resizeObserver: ResizeObserver | null = null;

        const container = containerRef.current;
        const app = new Application();

        app.init({
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor,
            antialias,
            resolution,
            autoDensity: true,
        }).then(() => {
            if (cancelled) {
                app.destroy(true, { children: true, texture: true });
                return;
            }

            // Append canvas to container
            const canvas = app.canvas as HTMLCanvasElement;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            container.appendChild(canvas);
            appRef.current = app;
            setIsReady(true);

            // Handle resize
            const handleResize = () => {
                if (app && container) {
                    app.renderer.resize(container.clientWidth, container.clientHeight);
                }
            };

            resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(container);
        });

        return () => {
            cancelled = true;
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (appRef.current) {
                appRef.current.destroy(true, { children: true, texture: true });
                appRef.current = null;
            }
            setIsReady(false);
        };
    }, [backgroundColor, antialias, resolution]);

    return { app: appRef.current, isReady };
}
