import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Play, Lock } from 'lucide-react'
import Balatro from '@/components/Balatro'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { cn } from '@/lib/utils'

// Balatro theme
const theme = {
    bg: '#3d6b59',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
    accent: '#FF6B9D',
}

interface Adventure {
    id: string
    titleKey: string
    episodeKey?: string
    descKey: string
    available: boolean
    color: string
}

const ADVENTURES: Adventure[] = [
    {
        id: 'wobble-survivor',
        titleKey: 'game.wobbleAdventure',
        episodeKey: 'game.wobbleAdventureEpisode',
        descKey: 'game.wobbleAdventureDesc',
        available: true,
        color: '#FF6B9D',
    },
    {
        id: 'coming-soon',
        titleKey: 'game.comingSoon',
        descKey: '',
        available: false,
        color: '#666666',
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
        <div className="relative w-full h-full overflow-hidden bg-[#0a0a12]">
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-60">
                <Balatro
                    color1="#FF6B9D"
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

            {/* Header - Back button only */}
            <div
                className="absolute z-20"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 12px)',
                    left: 'max(env(safe-area-inset-left, 0px), 12px)',
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
            </div>

            {/* Content */}
            <div
                className="relative z-10 h-full overflow-y-auto"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 70px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                {/* Adventure Cards - Cartoon Network Style */}
                <div className="space-y-4 mt-4">
                    {ADVENTURES.map((adventure, index) => (
                        <button
                            key={adventure.id}
                            onClick={() => adventure.available && onSelectAdventure(adventure.id)}
                            disabled={!adventure.available}
                            className={cn(
                                'w-full rounded-2xl transition-all duration-300 overflow-hidden',
                                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                                adventure.available
                                    ? 'active:scale-[0.98] hover:scale-[1.01]'
                                    : 'cursor-not-allowed'
                            )}
                            style={{
                                transitionDelay: `${index * 100}ms`,
                                background: theme.bgPanel,
                                border: `3px solid ${adventure.available ? adventure.color : theme.border}`,
                                boxShadow: adventure.available
                                    ? `0 6px 0 ${theme.border}, 0 0 30px ${adventure.color}40`
                                    : `0 3px 0 ${theme.border}`,
                                opacity: adventure.available ? 1 : 0.5,
                            }}
                        >
                            {/* Thumbnail Area */}
                            <div
                                className="relative h-28 flex items-center justify-center"
                                style={{
                                    background: adventure.available
                                        ? `linear-gradient(135deg, ${adventure.color}40 0%, ${adventure.color}10 100%)`
                                        : 'rgba(50,50,50,0.5)',
                                }}
                            >
                                {adventure.available ? (
                                    <>
                                        {/* Wobble characters */}
                                        <div className="flex items-center gap-2">
                                            <WobbleDisplay
                                                size={56}
                                                shape="circle"
                                                color={0xf5b041}
                                                expression="worried"
                                            />
                                            <WobbleDisplay
                                                size={40}
                                                shape="shadow"
                                                color={0x1a1a1a}
                                                expression="angry"
                                            />
                                        </div>
                                        {/* Episode Badge */}
                                        {adventure.episodeKey && (
                                            <div
                                                className="absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-black"
                                                style={{
                                                    background: adventure.color,
                                                    color: '#fff',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                                }}
                                            >
                                                {t(adventure.episodeKey)}
                                            </div>
                                        )}
                                        {/* Play Button */}
                                        <div
                                            className="absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{
                                                background: adventure.color,
                                                boxShadow: '0 3px 8px rgba(0,0,0,0.4)',
                                            }}
                                        >
                                            <Play
                                                className="w-5 h-5 text-white ml-0.5"
                                                fill="white"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <Lock
                                        className="w-12 h-12"
                                        style={{ color: adventure.color }}
                                    />
                                )}
                            </div>

                            {/* Info Area */}
                            <div className="p-3 text-left">
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
                    ))}
                </div>
            </div>
        </div>
    )
}
