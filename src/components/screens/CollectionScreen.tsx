import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Balatro from '@/components/Balatro';
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay';
import { useCollectionStore } from '@/stores/collectionStore';
import { WOBBLE_CHARACTERS, WobbleShape, WobbleExpression } from '@/components/canvas/Wobble';
import { cn } from '@/lib/utils';

const ALL_SHAPES: WobbleShape[] = ['circle', 'square', 'triangle', 'star', 'diamond', 'pentagon', 'shadow'];

// Balatro theme
const theme = {
    bg: '#3d6b59',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
};

interface CollectionScreenProps {
    onBack: () => void;
}

export function CollectionScreen({ onBack }: CollectionScreenProps) {
    const { t, i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const { unlockedWobbles, getProgress } = useCollectionStore();
    const progress = getProgress();
    const [mounted, setMounted] = useState(false);
    const [selectedWobble, setSelectedWobble] = useState<WobbleShape | null>(null);
    const [demoExpression, setDemoExpression] = useState<WobbleExpression>('happy');

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Cycle through expressions when a wobble is selected
    useEffect(() => {
        if (!selectedWobble) return;

        // Shadow has different expressions (angry-focused)
        const expressions: WobbleExpression[] = selectedWobble === 'shadow'
            ? ['angry', 'worried', 'effort', 'angry', 'struggle']
            : ['happy', 'excited', 'surprised', 'worried', 'sleepy'];
        let index = 0;
        setDemoExpression(expressions[0]);

        const interval = setInterval(() => {
            index = (index + 1) % expressions.length;
            setDemoExpression(expressions[index]);
        }, 1500);

        return () => clearInterval(interval);
    }, [selectedWobble]);

    const isUnlocked = (shape: WobbleShape) => unlockedWobbles.includes(shape);

    const handleCardClick = (shape: WobbleShape) => {
        if (isUnlocked(shape)) {
            setSelectedWobble(selectedWobble === shape ? null : shape);
            setDemoExpression('happy');
        }
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#0a0a12]">
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-60">
                <Balatro
                    color1="#c9a227"
                    color2="#4a9eff"
                    color3="#1a1a2e"
                    spinSpeed={2}
                    spinRotation={-1}
                    contrast={2.5}
                    lighting={0.3}
                    spinAmount={0.15}
                    pixelFilter={800}
                    isRotate={true}
                    mouseInteraction={false}
                />
            </div>

            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

            {/* Header */}
            <div
                className="absolute z-20 flex items-center justify-between w-full"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 12px)',
                    left: 0,
                    right: 0,
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                }}
            >
                {/* Back button */}
                <button
                    onClick={onBack}
                    className="h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 3px 0 ${theme.border}`,
                    }}
                >
                    <ArrowLeft className="w-5 h-5 text-white/80" />
                </button>

                {/* Title */}
                <h1
                    className="text-xl font-black"
                    style={{ color: theme.gold }}
                >
                    {isKorean ? '워블 도감' : 'Wobble Collection'}
                </h1>

                {/* Progress */}
                <div
                    className="px-3 py-1.5 rounded-lg text-sm font-bold"
                    style={{
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 3px 0 ${theme.border}`,
                        color: theme.gold,
                    }}
                >
                    {progress.unlocked}/{progress.total}
                </div>
            </div>

            {/* Content */}
            <div
                className="relative z-10 h-full overflow-y-auto"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 70px)',
                    paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 60px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                {/* Subtitle */}
                <p
                    className={cn(
                        "text-center text-white/60 text-sm mb-4",
                        "transition-all duration-500",
                        mounted ? "opacity-100" : "opacity-0"
                    )}
                >
                    {isKorean ? '워블 행성의 주민들을 만나보세요' : 'Meet the residents of Planet Wobble'}
                </p>

                {/* Wobble Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {ALL_SHAPES.map((shape, index) => {
                        const character = WOBBLE_CHARACTERS[shape];
                        const unlocked = isUnlocked(shape);
                        const isSelected = selectedWobble === shape;

                        return (
                            <div
                                key={shape}
                                className={cn(
                                    "transition-all duration-300",
                                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                )}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <button
                                    onClick={() => handleCardClick(shape)}
                                    disabled={!unlocked}
                                    className={cn(
                                        "w-full rounded-xl transition-all",
                                        unlocked ? "active:scale-[0.98]" : "cursor-not-allowed",
                                        isSelected && "-translate-y-2"
                                    )}
                                    style={{
                                        background: unlocked ? theme.bgPanel : theme.bgPanelLight,
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: isSelected
                                            ? `0 6px 0 ${theme.border}, 0 8px 20px rgba(0,0,0,0.4)`
                                            : `0 3px 0 ${theme.border}`,
                                        opacity: unlocked ? 1 : 0.6,
                                    }}
                                >
                                    {/* Wobble Display */}
                                    <div className="flex justify-center pt-4 pb-2">
                                        <WobbleDisplay
                                            size={60}
                                            shape={shape}
                                            color={unlocked ? character.color : 0x1a1a1a}
                                            expression={unlocked ? (isSelected ? demoExpression : 'happy') : 'none'}
                                        />
                                    </div>

                                    {/* Character Info */}
                                    <div className="px-3 pb-3 text-center">
                                        <h3
                                            className="text-lg font-black mb-1"
                                            style={{ color: unlocked ? theme.gold : 'rgba(255,255,255,0.3)' }}
                                        >
                                            {unlocked
                                                ? (isKorean ? character.nameKo : character.name)
                                                : '???'}
                                        </h3>
                                        <p
                                            className="text-xs leading-tight"
                                            style={{ color: unlocked ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}
                                        >
                                            {unlocked
                                                ? (isKorean ? character.personalityKo : character.personality)
                                                : (isKorean ? '아직 만나지 못했어요' : 'Not yet discovered')}
                                        </p>
                                    </div>

                                    {/* Selected indicator */}
                                    {isSelected && (
                                        <div
                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                                            style={{ background: theme.gold }}
                                        >
                                            <Sparkles className="w-4 h-4 text-black" />
                                        </div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Hint */}
                {progress.unlocked < progress.total && (
                    <p
                        className={cn(
                            "text-center text-white/40 text-xs mt-6",
                            "transition-all duration-500 delay-700",
                            mounted ? "opacity-100" : "opacity-0"
                        )}
                    >
                        {isKorean
                            ? '물리 법칙을 탐험하며 새로운 주민을 찾아보세요!'
                            : 'Explore the laws of physics to find new residents!'}
                    </p>
                )}
            </div>
        </div>
    );
}
