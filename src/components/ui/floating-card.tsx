import { ReactNode, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Balatro theme
const theme = {
    bgPanel: '#374244',
    border: '#1a1a1a',
};

interface FloatingCardProps {
    children: ReactNode;
    initialX?: number;
    initialY?: number;
    color?: string;
    className?: string;
    onPositionChange?: (x: number, y: number) => void;
}

export function FloatingCard({
    children,
    initialX = 20,
    initialY = 100,
    color,
    className,
    onPositionChange,
}: FloatingCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleDragStart = (clientX: number, clientY: number) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setDragOffset({
            x: clientX - rect.left,
            y: clientY - rect.top,
        });
        setIsDragging(true);
    };

    const handleDragMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;

        const newX = clientX - dragOffset.x;
        const newY = clientY - dragOffset.y;

        // 화면 경계 내로 제한
        const maxX = window.innerWidth - (cardRef.current?.offsetWidth || 0) - 10;
        const maxY = window.innerHeight - (cardRef.current?.offsetHeight || 0) - 10;

        const clampedX = Math.max(10, Math.min(maxX, newX));
        const clampedY = Math.max(10, Math.min(maxY, newY));

        setPosition({ x: clampedX, y: clampedY });
        onPositionChange?.(clampedX, clampedY);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleDragEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, dragOffset]);

    return (
        <div
            ref={cardRef}
            className={cn(
                "absolute rounded-2xl select-none",
                isDragging && "z-50",
                className
            )}
            style={{
                left: position.x,
                top: position.y,
                background: theme.bgPanel,
                border: `4px solid ${theme.border}`,
                boxShadow: isDragging
                    ? `0 10px 0 ${theme.border}, 0 15px 40px rgba(0,0,0,0.5)`
                    : `0 6px 0 ${theme.border}, 0 10px 25px rgba(0,0,0,0.4)`,
                transform: isDragging ? 'scale(1.03) rotate(1deg)' : 'scale(1)',
                transition: isDragging ? 'none' : 'transform 0.2s, box-shadow 0.2s',
            }}
        >
            {/* Drag Handle */}
            <div
                className="flex items-center justify-center px-4 py-2.5 cursor-grab active:cursor-grabbing touch-none"
                style={{
                    background: color || theme.bgPanel,
                    borderBottom: `3px solid ${theme.border}`,
                    borderRadius: '12px 12px 0 0',
                }}
                onMouseDown={(e) => {
                    e.preventDefault();
                    handleDragStart(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
                }}
            >
                <div className="w-10 h-1 rounded-full bg-black/30" />
            </div>

            {/* Content */}
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}
