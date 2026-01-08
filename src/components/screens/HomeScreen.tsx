import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import Balatro from '@/components/Balatro';
import ShuffleText from '@/components/ShuffleText';
import { RotatingText } from '@/components/RotatingText';
import { BlobDisplay } from '@/components/canvas/BlobDisplay';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MusicToggle } from '@/components/MusicToggle';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { useCollectionStore } from '@/stores/collectionStore';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GameMode = 'sandbox' | 'collection' | 'game' | 'learning';

interface HomeScreenProps {
    onSelectMode: (mode: GameMode) => void;
}

export function HomeScreen({ onSelectMode }: HomeScreenProps) {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { getProgress } = useCollectionStore();
    const collectionProgress = getProgress();

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

            {/* Settings - Top Right */}
            <div
                className="absolute z-20 flex gap-2"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 16px)',
                    right: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="relative h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: '#374244',
                        border: '2px solid #1a1a1a',
                        boxShadow: '0 3px 0 #1a1a1a',
                    }}
                >
                    <Settings className="w-5 h-5 text-white/80" />
                </button>
                <MusicToggle />
                <LanguageToggle />
            </div>

            {/* Content */}
            <div
                className="relative z-10 h-full flex flex-col"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 80px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 200px)',
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
                            {t('home.title')}
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
                            texts={t('home.modes', { returnObjects: true }) as string[]}
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
                        "space-y-3",
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
                            "rounded-xl border-3 border-[#F5B041]",
                            "transition-all duration-200",
                            "hover:scale-[1.02] hover:border-[#FFD700]",
                            "active:scale-[0.98]"
                        )}
                        style={{
                            background: 'linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%)',
                            boxShadow: hoveredButton === 'sandbox'
                                ? '0 0 30px rgba(245, 176, 65, 0.4), inset 0 0 20px rgba(245, 176, 65, 0.1)'
                                : '0 4px 16px rgba(0,0,0,0.4)',
                            borderWidth: '3px',
                        }}
                    >
                        <div className="px-5 py-3 text-center">
                            <span
                                className="block text-xl font-black"
                                style={{
                                    color: '#F5B041',
                                    textShadow: '0 0 10px rgba(245, 176, 65, 0.5)',
                                }}
                            >
                                {t('home.sandbox')}
                            </span>
                            <span className="block text-sm text-white/60 mt-1">
                                {t('home.sandboxDesc')}
                            </span>
                        </div>
                    </button>

                    {/* Minigame Mode Card */}
                    <button
                        onClick={() => onSelectMode('game')}
                        onMouseEnter={() => setHoveredButton('game')}
                        onMouseLeave={() => setHoveredButton(null)}
                        className={cn(
                            "w-full relative overflow-hidden",
                            "rounded-xl border-2 border-[#FF6B9D]/60",
                            "transition-all duration-200",
                            "hover:scale-[1.02] hover:border-[#FF6B9D]",
                            "active:scale-[0.98]"
                        )}
                        style={{
                            background: 'linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%)',
                            boxShadow: hoveredButton === 'game'
                                ? '0 0 20px rgba(255, 107, 157, 0.3)'
                                : '0 3px 12px rgba(0,0,0,0.3)',
                        }}
                    >
                        <div className="px-5 py-3 text-center">
                            <span
                                className="block text-lg font-bold"
                                style={{ color: '#FF6B9D' }}
                            >
                                {t('home.game')}
                            </span>
                            <span className="block text-xs text-white/60 mt-1">
                                {t('home.gameDesc')}
                            </span>
                        </div>
                    </button>

                    {/* Collection - Bottom Card */}
                    <button
                        onClick={() => onSelectMode('collection')}
                        onMouseEnter={() => setHoveredButton('collection')}
                        onMouseLeave={() => setHoveredButton(null)}
                        className={cn(
                            "w-full relative overflow-hidden",
                            "rounded-xl border-2 border-[#BB8FCE]/60",
                            "transition-all duration-200",
                            "hover:scale-[1.02] hover:border-[#BB8FCE]",
                            "active:scale-[0.98]"
                        )}
                        style={{
                            background: 'linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%)',
                            boxShadow: hoveredButton === 'collection'
                                ? '0 0 20px rgba(187, 143, 206, 0.3)'
                                : '0 3px 12px rgba(0,0,0,0.3)',
                        }}
                    >
                        <div className="px-5 py-2.5 text-center relative">
                            <div className="flex items-center justify-center gap-2">
                                <BookOpen className="w-4 h-4" style={{ color: '#BB8FCE' }} />
                                <span
                                    className="text-lg font-bold"
                                    style={{ color: '#BB8FCE' }}
                                >
                                    {t('home.collection')}
                                </span>
                            </div>
                            <span
                                className="absolute right-5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-full text-xs font-bold"
                                style={{
                                    background: 'rgba(187, 143, 206, 0.2)',
                                    color: '#BB8FCE',
                                }}
                            >
                                {collectionProgress.unlocked}/{collectionProgress.total}
                            </span>
                        </div>
                    </button>
                </div>

            </div>

            {/* Disclaimer */}
            <div
                className="absolute left-0 right-0 text-center text-white/40 text-xs px-6 leading-relaxed whitespace-pre-line"
                style={{ bottom: 120 }}
            >
                {t('home.disclaimer')}
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

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
}
