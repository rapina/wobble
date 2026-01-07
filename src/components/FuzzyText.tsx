import { useRef, useEffect, useState, memo } from 'react';

interface FuzzyTextProps {
    children: string;
    fontSize?: number | string;
    fontWeight?: number | string;
    fontFamily?: string;
    color?: string;
    enableHover?: boolean;
    baseIntensity?: number;
    hoverIntensity?: number;
}

function FuzzyText({
    children,
    fontSize = 48,
    fontWeight = 900,
    fontFamily = 'system-ui, -apple-system, sans-serif',
    color = '#ffffff',
    enableHover = true,
    baseIntensity = 0.15,
    hoverIntensity = 0.5,
}: FuzzyTextProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;

        // Parse fontSize
        let fontSizePx: number;
        if (typeof fontSize === 'string') {
            // For clamp or rem values, use a rough estimate
            const tempEl = document.createElement('span');
            tempEl.style.fontSize = fontSize;
            tempEl.style.position = 'absolute';
            tempEl.style.visibility = 'hidden';
            document.body.appendChild(tempEl);
            fontSizePx = parseFloat(getComputedStyle(tempEl).fontSize);
            document.body.removeChild(tempEl);
        } else {
            fontSizePx = fontSize;
        }

        // Set canvas size based on text
        ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
        const textMetrics = ctx.measureText(children);
        const textWidth = textMetrics.width;
        const textHeight = fontSizePx * 1.4;

        const canvasWidth = textWidth + fontSizePx;
        const canvasHeight = textHeight + fontSizePx * 0.5;

        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
        ctx.scale(dpr, dpr);

        let animationId: number;
        let lastTime = 0;
        const fps = 30;
        const frameInterval = 1000 / fps;

        const render = (time: number) => {
            animationId = requestAnimationFrame(render);

            const delta = time - lastTime;
            if (delta < frameInterval) return;
            lastTime = time - (delta % frameInterval);

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // Draw base text
            ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
            ctx.fillStyle = color;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            const intensity = isHovered ? hoverIntensity : baseIntensity;
            const sliceHeight = 2;
            const numSlices = Math.ceil(textHeight / sliceHeight);

            // Create fuzzy effect by slicing and offsetting
            for (let i = 0; i < numSlices; i++) {
                const y = i * sliceHeight;
                const offset = (Math.random() - 0.5) * fontSizePx * intensity;

                ctx.save();
                ctx.beginPath();
                ctx.rect(0, y, canvasWidth, sliceHeight);
                ctx.clip();

                ctx.fillText(
                    children,
                    canvasWidth / 2 + offset,
                    canvasHeight / 2
                );
                ctx.restore();
            }
        };

        animationId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [children, fontSize, fontWeight, fontFamily, color, baseIntensity, hoverIntensity, isHovered]);

    return (
        <canvas
            ref={canvasRef}
            onMouseEnter={() => enableHover && setIsHovered(true)}
            onMouseLeave={() => enableHover && setIsHovered(false)}
            onTouchStart={() => enableHover && setIsHovered(true)}
            onTouchEnd={() => enableHover && setIsHovered(false)}
            style={{ display: 'block' }}
        />
    );
}

export default memo(FuzzyText);
