import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Trophy } from 'lucide-react'
import Balatro from '@/components/Balatro'
import ShuffleText from '@/components/ShuffleText'
import { RotatingText } from '@/components/RotatingText'
import { BlobDisplay } from '@/components/canvas/BlobDisplay'
import { LanguageToggle } from '@/components/LanguageToggle'
import { MusicToggle } from '@/components/MusicToggle'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore } from '@/stores/progressStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { formulaList } from '@/formulas/registry'
import { cn } from '@/lib/utils'

// Balatro theme
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
    purple: '#9b59b6',
}

export type GameMode = 'sandbox' | 'collection' | 'game' | 'learning' | 'achievements'

interface HomeScreenProps {
    onSelectMode: (mode: GameMode) => void
}

export function HomeScreen({ onSelectMode }: HomeScreenProps) {
    const { t } = useTranslation()
    const [mounted, setMounted] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const { getProgress } = useCollectionStore()
    const { studiedFormulas } = useProgressStore()
    const { getProgress: getAchievementProgress } = useAchievementStore()
    const collectionProgress = getProgress()
    const achievementProgress = getAchievementProgress()
    const unseenFormulaCount = formulaList.length - studiedFormulas.size
    const remainingAchievements = achievementProgress.total - achievementProgress.unlocked

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

            {/* Settings - Top Right */}
            <div
                className="absolute z-20 flex gap-2"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 16px)',
                    right: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                {/* Achievements Button */}
                <button
                    onClick={() => onSelectMode('achievements')}
                    className="relative h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: remainingAchievements > 0 ? theme.gold : theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 3px 0 ${theme.border}`,
                    }}
                >
                    <Trophy
                        className={cn(
                            'w-5 h-5',
                            remainingAchievements > 0 ? 'text-white' : 'text-white/60'
                        )}
                    />
                    {remainingAchievements > 0 && (
                        <span
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center"
                            style={{
                                background: theme.red,
                                color: 'white',
                                border: `2px solid ${theme.border}`,
                            }}
                        >
                            {remainingAchievements}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 3px 0 ${theme.border}`,
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
                        'text-center',
                        'transition-all duration-1000 ease-out',
                        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12'
                    )}
                >
                    <div
                        className="inline-block px-8 py-3 rounded-xl"
                        style={{
                            background: theme.bgPanel,
                            border: `4px solid ${theme.border}`,
                            boxShadow: `0 6px 0 ${theme.border}`,
                        }}
                    >
                        <h1
                            className="text-5xl font-black tracking-wider"
                            style={{
                                color: theme.gold,
                                textShadow: '0 2px 0 #8a6d1a',
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
                    </div>
                    <p
                        className="text-sm tracking-[0.15em] mt-4 font-bold"
                        style={{
                            color: 'rgba(255,255,255,0.7)',
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
                        'flex-1 flex items-center justify-center min-h-[120px]',
                        'transition-all duration-1000 delay-200 ease-out',
                        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    )}
                >
                    <BlobDisplay size={80} color="#F5B041" expression="happy" />
                </div>

                {/* Menu Cards */}
                <div
                    className={cn(
                        'space-y-4 mx-auto w-full',
                        'transition-all duration-1000 delay-300 ease-out',
                        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    )}
                    style={{ maxWidth: 320 }}
                >
                    {/* Sandbox - Main Card */}
                    <button
                        onClick={() => onSelectMode('sandbox')}
                        className="w-full relative overflow-hidden rounded-xl transition-all active:scale-[0.97]"
                        style={{
                            background: theme.gold,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 5px 0 ${theme.border}`,
                        }}
                    >
                        <div className="px-6 py-4 flex items-center justify-center">
                            <span className="text-lg font-black text-black tracking-wide uppercase">
                                {t('home.sandbox')}
                            </span>
                            {unseenFormulaCount > 0 && (
                                <span
                                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-black rounded-md"
                                    style={{
                                        background: theme.red,
                                        color: 'white',
                                        border: `2px solid ${theme.border}`,
                                    }}
                                >
                                    NEW
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Minigame Mode Card */}
                    <button
                        onClick={() => onSelectMode('game')}
                        className="w-full relative overflow-hidden rounded-xl transition-all active:scale-[0.97]"
                        style={{
                            background: theme.red,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 5px 0 ${theme.border}`,
                        }}
                    >
                        <div className="px-6 py-4 flex items-center justify-center">
                            <span className="text-lg font-black text-white tracking-wide uppercase">
                                {t('home.game')}
                            </span>
                        </div>
                    </button>

                    {/* Collection - Bottom Card */}
                    <button
                        onClick={() => onSelectMode('collection')}
                        className="w-full relative overflow-hidden rounded-xl transition-all active:scale-[0.97]"
                        style={{
                            background: theme.blue,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 5px 0 ${theme.border}`,
                        }}
                    >
                        <div className="px-6 py-4 flex items-center justify-center">
                            <span className="text-lg font-black text-white tracking-wide uppercase">
                                {t('home.collection')}
                            </span>
                            <span
                                className="ml-3 px-2 py-0.5 text-xs font-bold rounded-md"
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
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
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    )
}
