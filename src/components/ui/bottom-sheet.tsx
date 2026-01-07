import { ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Balatro theme
const theme = {
    bg: '#3d6b59',
    bgPanel: '#374244',
    border: '#1a1a1a',
    gold: '#c9a227',
};

export type SheetSnapPoint = 'collapsed' | 'half' | 'expanded';

interface BottomSheetProps {
    children: ReactNode;
    snapPoints?: {
        collapsed: number;
        half: number;
        expanded: number;
    };
    defaultSnap?: SheetSnapPoint;
    onSnapChange?: (snap: SheetSnapPoint) => void;
    header?: ReactNode;
    className?: string;
    accentColor?: string;
}

export function BottomSheet({
    children,
    snapPoints = { collapsed: 130, half: 340, expanded: 540 },
    defaultSnap = 'collapsed',
    onSnapChange,
    header,
    className,
    accentColor = '#F5B041',
}: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const [currentHeight, setCurrentHeight] = useState(snapPoints[defaultSnap]);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startHeight, setStartHeight] = useState(0);

    const getSnapPoint = useCallback((height: number): SheetSnapPoint => {
        const { collapsed, half, expanded } = snapPoints;
        const midLow = (collapsed + half) / 2;
        const midHigh = (half + expanded) / 2;

        if (height < midLow) return 'collapsed';
        if (height < midHigh) return 'half';
        return 'expanded';
    }, [snapPoints]);

    const snapTo = useCallback((snap: SheetSnapPoint) => {
        setCurrentHeight(snapPoints[snap]);
        onSnapChange?.(snap);
    }, [snapPoints, onSnapChange]);

    const handleDragStart = (clientY: number) => {
        setIsDragging(true);
        setStartY(clientY);
        setStartHeight(currentHeight);
    };

    const handleDragMove = useCallback((clientY: number) => {
        if (!isDragging) return;
        const delta = startY - clientY;
        const newHeight = Math.max(
            snapPoints.collapsed,
            Math.min(snapPoints.expanded, startHeight + delta)
        );
        setCurrentHeight(newHeight);
    }, [isDragging, startY, startHeight, snapPoints]);

    const handleDragEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        const snap = getSnapPoint(currentHeight);
        snapTo(snap);
    }, [isDragging, currentHeight, getSnapPoint, snapTo]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientY);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientY);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleDragMove(e.touches[0].clientY);
            }
        };
        const handleEnd = () => handleDragEnd();

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleTouchMove, { passive: true });
            window.addEventListener('touchend', handleEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    const lastTapRef = useRef(0);
    const handleDoubleTap = () => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            const currentSnap = getSnapPoint(currentHeight);
            snapTo(currentSnap === 'collapsed' ? 'half' : 'collapsed');
        }
        lastTapRef.current = now;
    };

    return (
        <div
            ref={sheetRef}
            className={cn(
                "absolute left-4 right-4 bottom-0 z-30",
                "rounded-t-2xl",
                !isDragging && "transition-[height] duration-300 ease-out",
                className
            )}
            style={{
                height: currentHeight,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                background: theme.bgPanel,
                border: `4px solid ${theme.border}`,
                borderBottom: 'none',
            }}
        >
            {/* Drag Handle */}
            <div
                className="flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onClick={handleDoubleTap}
            >
                <div
                    className="w-20 h-2 rounded-full"
                    style={{
                        background: accentColor,
                        border: `2px solid ${theme.border}`,
                    }}
                />
            </div>

            {/* Header */}
            {header && (
                <div
                    style={{
                        paddingLeft: 'max(env(safe-area-inset-left, 0px), 24px)',
                        paddingRight: 'max(env(safe-area-inset-right, 0px), 24px)',
                        paddingBottom: '16px',
                        borderBottom: `3px solid ${theme.border}`,
                    }}
                >
                    {header}
                </div>
            )}

            {/* Content */}
            <div
                className="overflow-y-auto"
                style={{
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 24px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 24px)',
                    paddingTop: '20px',
                    paddingBottom: '24px',
                    maxHeight: `calc(${currentHeight}px - 100px - env(safe-area-inset-bottom, 0px))`,
                }}
            >
                {children}
            </div>
        </div>
    );
}
