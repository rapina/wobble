import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { usePixiApp } from '../../hooks/usePixiApp';
import { BaseScene } from './scenes/BaseScene';
import { getSceneClass } from './scenes/SceneManager';
import { WobbleShape } from './Wobble';

interface PixiCanvasProps {
    formulaId: string;
    variables: Record<string, number>;
    width?: number | string;
    height?: number | string;
}

export interface PixiCanvasHandle {
    showNewWobbleDiscovery: (shapes: WobbleShape[], isKorean: boolean, onComplete?: () => void) => void;
}

export const PixiCanvas = forwardRef<PixiCanvasHandle, PixiCanvasProps>(function PixiCanvas({
    formulaId,
    variables,
    width = '100%',
    height = '100%',
}, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { app, isReady } = usePixiApp(containerRef);
    const sceneRef = useRef<BaseScene | null>(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        showNewWobbleDiscovery: (shapes: WobbleShape[], isKorean: boolean, onComplete?: () => void) => {
            if (sceneRef.current) {
                sceneRef.current.showNewWobbleDiscovery(shapes, isKorean, onComplete);
            }
        },
    }), []);

    // Create/switch scene based on formulaId
    useEffect(() => {
        if (!isReady || !app) return;

        // Clean up previous scene
        if (sceneRef.current) {
            app.stage.removeChild(sceneRef.current.container);
            sceneRef.current.destroy();
            sceneRef.current = null;
        }

        // Create new scene
        const SceneClass = getSceneClass(formulaId);
        if (SceneClass) {
            const scene = new SceneClass(app);
            app.stage.addChild(scene.container);
            sceneRef.current = scene;
        }

        return () => {
            if (sceneRef.current) {
                // app.stage may be null if app was already destroyed
                if (app.stage) {
                    app.stage.removeChild(sceneRef.current.container);
                }
                sceneRef.current.destroy();
                sceneRef.current = null;
            }
        };
    }, [isReady, app, formulaId]);

    // Update scene with new variables
    useEffect(() => {
        if (sceneRef.current) {
            sceneRef.current.update(variables);
        }
    }, [variables]);

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
        />
    );
});
