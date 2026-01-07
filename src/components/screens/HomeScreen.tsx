import { useState, useEffect } from 'react';
import Balatro from '@/components/Balatro';
import ShuffleText from '@/components/ShuffleText';
import { RotatingText } from '@/components/RotatingText';
import { BlobDisplay } from '@/components/canvas/BlobDisplay';
import { cn } from '@/lib/utils';

export type GameMode = 'sandbox' | 'puzzle' | 'learning';

interface HomeScreenProps {
    onSelectMode: (mode: GameMode) => void;
}

export function HomeScreen({ onSelectMode }: HomeScreenProps) {
    const [mounted, setMounted] = useState(false);
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#0a0a12]">
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-70">
                <Balatro
                    color1="#F5B041"
                    color2="#5DADE2"
                    color3="#1a1a2e"
                    spinSpeed={3}
                    spinRotation={-1}
                    contrast={2.5}
                    lighting={0.3}
                    spinAmount={0.2}
                    pixelFilter={800}
                    isRotate={true}
                    mouseInteraction={false}
                />
            </div>

            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

            {/* Content */}
            <div
                className="relative z-10 h-full flex flex-col"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 80px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 140px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 40px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 40px)',
                }}
            >
                {/* Logo */}
                <div
                    className={cn(
                        "text-center",
                        "transition-all duration-1000 ease-out",
                        mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-12"
                    )}
                >
                    <h1
                        className="text-6xl font-black tracking-wider"
                        style={{
                            color: '#F5B041',
                            textShadow: '0 0 40px rgba(245, 176, 65, 0.8), 0 0 80px rgba(245, 176, 65, 0.4), 0 4px 0 #b8860b',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                        }}
                    >
                        <ShuffleText
                            duration={1200}
                            trigger="mount"
                            loop={true}
                            loopDelay={5000}
                        >
                            WOBBLE
                        </ShuffleText>
                    </h1>
                    <p
                        className="text-base tracking-[0.2em] mt-4 font-bold"
                        style={{
                            color: '#5DADE2',
                            textShadow: '0 0 20px rgba(93, 173, 226, 0.6)',
                        }}
                    >
                        PHYSICS{' '}
                        <RotatingText
                            texts={['ARCADE', 'SANDBOX', 'PUZZLE']}
                            interval={2500}
                        />
                    </p>
                </div>

                {/* Center Blob */}
                <div
                    className={cn(
                        "flex-1 flex items-center justify-center min-h-[120px]",
                        "transition-all duration-1000 delay-200 ease-out",
                        mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
                    )}
                >
                    <BlobDisplay size={80} color="#F5B041" expression="happy" />
                </div>

                {/* Menu Cards */}
                <div
                    className={cn(
                        "space-y-6",
                        "transition-all duration-1000 delay-300 ease-out",
                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                    )}
                >
                    {/* Sandbox - Main Card */}
                    <button
                        onClick={() => onSelectMode('sandbox')}
                        onMouseEnter={() => setHoveredButton('sandbox')}
                        onMouseLeave={() => setHoveredButton(null)}
                        className={cn(
                            "w-full relative overflow-hidden",
                            "rounded-2xl border-4 border-[#F5B041]",
                            "transition-all duration-200",
                            "hover:scale-[1.02] hover:border-[#FFD700]",
                            "active:scale-[0.98]"
                        )}
                        style={{
                            background: 'linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%)',
                            boxShadow: hoveredButton === 'sandbox'
                                ? '0 0 40px rgba(245, 176, 65, 0.5), inset 0 0 30px rgba(245, 176, 65, 0.1)'
                                : '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                        }}
                    >
                        <div className="px-7 py-5 text-center">
                            <span
                                className="block text-2xl font-black"
                                style={{
                                    color: '#F5B041',
                                    textShadow: '0 0 10px rgba(245, 176, 65, 0.5)',
                                }}
                            >
                                실험실
                            </span>
                            <span className="block text-base text-white/60 mt-3">
                                자유롭게 물리 탐험
                            </span>
                        </div>
                    </button>

                    {/* Puzzle - Secondary Card */}
                    <button
                        disabled
                        className={cn(
                            "w-full relative overflow-hidden",
                            "rounded-2xl border-3 border-white/20",
                            "opacity-50 cursor-not-allowed"
                        )}
                        style={{
                            background: 'linear-gradient(180deg, #1f1f35 0%, #15152a 100%)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                            borderWidth: '3px',
                        }}
                    >
                        <div className="px-7 py-4 text-center relative">
                            <span className="block text-xl font-bold text-white/50">
                                퍼즐
                            </span>
                            <span className="block text-sm text-white/30 mt-3">
                                스테이지 클리어
                            </span>
                            <span
                                className="absolute right-7 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full text-xs font-bold"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.4)',
                                }}
                            >
                                SOON
                            </span>
                        </div>
                    </button>
                </div>

            </div>

            {/* Footer - 광고 배너 위에 위치 */}
            <div
                className="absolute left-0 right-0 text-center text-white/30 text-xs"
                style={{ bottom: 100 }}
            >
                <span className="font-medium">2026 Sputnik Workshop</span>
                <span className="mx-2">·</span>
                <span className="font-mono">v{__APP_VERSION__}</span>
            </div>
        </div>
    );
}
