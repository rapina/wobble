import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Play, Lock, Gamepad2, Scissors } from 'lucide-react'
import Balatro from '@/components/Balatro'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { cn } from '@/lib/utils'

// Balatro theme (matching HomeScreen)
const theme = {
    bg: '#1a1a2e',
    felt: '#3d6b59',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
    red: '#e85d4c',
    blue: '#4a9eff',
    pink: '#FF6B9D',
    orange: '#FF8C42',
}

interface Adventure {
    id: string
    titleKey: string
    episodeKey?: string
    descKey: string
    available: boolean
    color: string
    type: 'adventure' | 'minigame'
    icon?: 'wobble' | 'pendulum'
    badge?: string
}

const ADVENTURES: Adventure[] = [
    {
        id: 'wobble-survivor',
        titleKey: 'game.wobbleAdventure',
        episodeKey: 'game.wobbleAdventureEpisode',
        descKey: 'game.wobbleAdventureDesc',
        available: true,
        color: '#FF6B9D',
        type: 'adventure',
        icon: 'wobble',
        badge: 'BETA',
    },
    {
        id: 'wobblediver',
        titleKey: 'game.wobblediver',
        episodeKey: 'game.minigame',
        descKey: 'game.wobblediverDesc',
        available: true,
        color: '#5DADE2',
        type: 'minigame',
        icon: 'dive',
    },
    {
        id: 'coming-soon',
        titleKey: 'game.comingSoon',
        descKey: '',
        available: false,
        color: '#666666',
        type: 'adventure',
    },
]

interface AdventureSelectScreenProps {
    onBack: () => void
    onSelectAdventure: (adventureId: string) => void
}

export function GameSelectScreen({ onBack, onSelectAdventure }: AdventureSelectScreenProps) {
    const { t } = useTranslation()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: theme.felt }}>
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-40">
                <Balatro
                    color1="#2d5a4a"
                    color2="#1a4035"
                    color3="#0d2018"
                    spinSpeed={1.5}
                    spinRotation={-1}
                    contrast={2}
                    lighting={0.2}
                    spinAmount={0.1}
                    pixelFilter={600}
                    isRotate={true}
                    mouseInteraction={false}
                />
            </div>

            {/* Felt texture overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.3) 100%)',
                }}
            />

            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

            {/* Header */}
            <div
                className="absolute z-20 flex items-center gap-3"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 16px)',
                    left: 'max(env(safe-area-inset-left, 0px), 16px)',
                    right: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
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

                {/* Title Badge */}
                <div className="flex-1 flex items-center justify-center">
                    <div
                        className="px-4 py-2 rounded-lg flex items-center gap-2"
                        style={{
                            background: theme.red,
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    >
                        <Gamepad2 className="w-4 h-4 text-white" />
                        <span className="text-sm font-black text-white uppercase tracking-wide">
                            {t('home.game')}
                        </span>
                    </div>
                </div>

                {/* Spacer for centering */}
                <div className="w-10" />
            </div>

            {/* Content */}
            <div
                className="relative z-10 h-full overflow-y-auto"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 80px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                {/* Adventure Cards */}
                <div className="space-y-4 mt-4">
                    {ADVENTURES.map((adventure, index) => (
                        <div
                            key={adventure.id}
                            className={cn(
                                'transition-all duration-500',
                                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            )}
                            style={{ transitionDelay: `${index * 150}ms` }}
                        >
                            <button
                                onClick={() =>
                                    adventure.available && onSelectAdventure(adventure.id)
                                }
                                disabled={!adventure.available}
                                className={cn(
                                    'w-full rounded-2xl overflow-hidden transition-all',
                                    adventure.available
                                        ? 'active:scale-[0.98] hover:scale-[1.01]'
                                        : 'cursor-not-allowed'
                                )}
                                style={{
                                    background: theme.bgPanel,
                                    border: `4px solid ${theme.border}`,
                                    boxShadow: adventure.available
                                        ? `0 6px 0 ${theme.border}`
                                        : `0 4px 0 ${theme.border}`,
                                    opacity: adventure.available ? 1 : 0.6,
                                }}
                            >
                                {/* Thumbnail Area */}
                                <div
                                    className="relative h-32 flex items-center justify-center"
                                    style={{
                                        background: adventure.available
                                            ? `linear-gradient(135deg, ${adventure.color}50 0%, ${theme.bgPanel} 100%)`
                                            : theme.bgPanelLight,
                                    }}
                                >
                                    {adventure.available ? (
                                        <>
                                            {/* Icon based on type */}
                                            {adventure.icon === 'wobble' ? (
                                                <div className="flex items-center gap-3">
                                                    <WobbleDisplay
                                                        size={60}
                                                        shape="circle"
                                                        color={0xf5b041}
                                                        expression="worried"
                                                    />
                                                    <WobbleDisplay
                                                        size={44}
                                                        shape="shadow"
                                                        color={0x1a1a1a}
                                                        expression="angry"
                                                    />
                                                </div>
                                            ) : adventure.icon === 'pendulum' ? (
                                                <div className="flex items-center gap-2">
                                                    {/* Rope */}
                                                    <div className="relative">
                                                        <div
                                                            className="absolute w-0.5 h-12 left-1/2 -translate-x-1/2 -top-2"
                                                            style={{ background: '#8B4513' }}
                                                        />
                                                        <WobbleDisplay
                                                            size={48}
                                                            shape="circle"
                                                            color={0xf5b041}
                                                            expression="excited"
                                                        />
                                                    </div>
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                        style={{
                                                            background: adventure.color,
                                                            border: `2px solid ${theme.border}`,
                                                        }}
                                                    >
                                                        <Scissors className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* BETA Badge */}
                                            {adventure.badge && (
                                                <div
                                                    className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-black"
                                                    style={{
                                                        background: '#e74c3c',
                                                        color: '#fff',
                                                        border: `2px solid ${theme.border}`,
                                                    }}
                                                >
                                                    {adventure.badge}
                                                </div>
                                            )}

                                            {/* Episode Badge */}
                                            {adventure.episodeKey && (
                                                <div
                                                    className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-black"
                                                    style={{
                                                        background: adventure.color,
                                                        color: '#fff',
                                                        border: `2px solid ${theme.border}`,
                                                        boxShadow: `0 2px 0 ${theme.border}`,
                                                    }}
                                                >
                                                    {t(adventure.episodeKey)}
                                                </div>
                                            )}

                                            {/* Play Button */}
                                            <div
                                                className="absolute right-3 bottom-3 w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{
                                                    background: theme.gold,
                                                    border: `3px solid ${theme.border}`,
                                                    boxShadow: `0 3px 0 ${theme.border}`,
                                                }}
                                            >
                                                <Play
                                                    className="w-6 h-6 text-black ml-0.5"
                                                    fill="black"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div
                                            className="w-16 h-16 rounded-xl flex items-center justify-center"
                                            style={{
                                                background: theme.bgPanel,
                                                border: `3px solid ${theme.border}`,
                                            }}
                                        >
                                            <Lock className="w-8 h-8 text-white/30" />
                                        </div>
                                    )}
                                </div>

                                {/* Info Area */}
                                <div
                                    className="p-4 text-left"
                                    style={{
                                        borderTop: `3px solid ${theme.border}`,
                                        background: adventure.available
                                            ? theme.bgPanelLight
                                            : theme.bgPanel,
                                    }}
                                >
                                    <h3
                                        className="text-lg font-black"
                                        style={{ color: adventure.available ? '#fff' : '#666' }}
                                    >
                                        {t(adventure.titleKey)}
                                    </h3>
                                    {adventure.descKey && (
                                        <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">
                                            {t(adventure.descKey)}
                                        </p>
                                    )}
                                </div>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer hint */}
                <div className="mt-8 text-center">
                    <p className="text-white/30 text-xs">
                        {t('game.moreComingSoon', { defaultValue: 'More adventures coming soon!' })}
                    </p>
                </div>
            </div>
        </div>
    )
}
