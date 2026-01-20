import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Trophy, ShoppingBag, Bug } from 'lucide-react'
import { useAdMob } from '@/hooks/useAdMob'
import { usePurchaseStore } from '@/stores/purchaseStore'
import Balatro from '@/components/Balatro'
import { homePreset } from '@/config/backgroundPresets'
import ShuffleText from '@/components/ShuffleText'
import { RotatingText } from '@/components/RotatingText'
import { BlobDisplay } from '@/components/canvas/BlobDisplay'
import { LanguageToggle } from '@/components/LanguageToggle'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { DevOptionsModal } from '@/components/ui/DevOptionsModal'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore } from '@/stores/progressStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { formulaList } from '@/formulas/registry'
import { cn } from '@/lib/utils'

// 개발 빌드 여부
const IS_DEV = import.meta.env.DEV

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

export type GameMode = 'sandbox' | 'collection' | 'game' | 'learning' | 'achievements' | 'shop'

interface HomeScreenProps {
    onSelectMode: (mode: GameMode) => void
}

export function HomeScreen({ onSelectMode }: HomeScreenProps) {
    const { t } = useTranslation()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isDevOpen, setIsDevOpen] = useState(false)
    const { getProgress } = useCollectionStore()
    const { studiedFormulas } = useProgressStore()
    const { getProgress: getAchievementProgress } = useAchievementStore()
    const { isAdFree } = usePurchaseStore()
    const { isInitialized, isBannerVisible, showBanner, isNative } = useAdMob()
    const collectionProgress = getProgress()
    const achievementProgress = getAchievementProgress()
    const unseenFormulaCount = formulaList.length - studiedFormulas.size
    const remainingAchievements = achievementProgress.total - achievementProgress.unlocked

    // Show AdMob banner when initialized (unless ad-free)
    useEffect(() => {
        if (isInitialized && !isBannerVisible && !isAdFree) {
            showBanner()
        }
    }, [isInitialized, isAdFree, isBannerVisible, showBanner])

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: theme.felt }}>
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-40">
                <Balatro
                    color1={homePreset.color1}
                    color2={homePreset.color2}
                    color3={homePreset.color3}
                    spinSpeed={homePreset.spinSpeed}
                    spinRotation={homePreset.spinRotation}
                    contrast={homePreset.contrast}
                    lighting={homePreset.lighting}
                    spinAmount={homePreset.spinAmount}
                    pixelFilter={homePreset.pixelFilter}
                    isRotate={homePreset.isRotate}
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

            {/* DEV Button - Top Left (dev build only) */}
            {IS_DEV && (
                <div
                    className="absolute z-20"
                    style={{
                        top: 'max(env(safe-area-inset-top, 0px), 16px)',
                        left: 'max(env(safe-area-inset-left, 0px), 16px)',
                    }}
                >
                    <button
                        onClick={() => setIsDevOpen(true)}
                        className="h-10 px-3 rounded-lg flex items-center gap-2 transition-all active:scale-95"
                        style={{
                            background: theme.purple,
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    >
                        <Bug className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white">DEV</span>
                    </button>
                </div>
            )}

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
                    className="h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 3px 0 ${theme.border}`,
                    }}
                >
                    <Settings className="w-5 h-5 text-white/80" />
                </button>
                <LanguageToggle />
            </div>

            {/* Content */}
            <div
                className="relative z-10 h-full flex flex-col"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 64px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 160px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 40px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 40px)',
                }}
            >
                {/* Logo */}
                <div className="text-center">
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
                <div className="flex-1 flex items-center justify-center min-h-[80px]">
                    <BlobDisplay size={80} color="#F5B041" expression="happy" />
                </div>

                {/* Menu Cards */}
                <div
                    className="space-y-2.5 mx-auto w-full"
                    style={{ maxWidth: 320 }}
                >
                    {/* Sandbox - Main Card */}
                    <button
                        onClick={() => onSelectMode('sandbox')}
                        className="w-full relative overflow-hidden rounded-xl transition-all active:scale-[0.97]"
                        style={{
                            background: theme.gold,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 4px 0 ${theme.border}`,
                        }}
                    >
                        <div className="px-5 py-3 flex items-center justify-center">
                            <span className="text-base font-black text-black tracking-wide uppercase">
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
                            boxShadow: `0 4px 0 ${theme.border}`,
                        }}
                    >
                        <div className="px-5 py-3 flex items-center justify-center">
                            <span className="text-base font-black text-white tracking-wide uppercase">
                                {t('home.game')}
                            </span>
                        </div>
                    </button>

                    {/* Collection Card */}
                    <button
                        onClick={() => onSelectMode('collection')}
                        className="w-full relative overflow-hidden rounded-xl transition-all active:scale-[0.97]"
                        style={{
                            background: theme.blue,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 4px 0 ${theme.border}`,
                        }}
                    >
                        <div className="px-5 py-3 flex items-center justify-center">
                            <span className="text-base font-black text-white tracking-wide uppercase">
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

                    {/* Achievements Card */}
                    <button
                        onClick={() => onSelectMode('achievements')}
                        className="w-full relative overflow-hidden rounded-xl transition-all active:scale-[0.97]"
                        style={{
                            background: remainingAchievements > 0 ? theme.gold : theme.bgPanel,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 4px 0 ${theme.border}`,
                        }}
                    >
                        <div className="px-5 py-3 flex items-center justify-center">
                            <Trophy
                                className={cn(
                                    'w-4 h-4 mr-2',
                                    remainingAchievements > 0 ? 'text-black' : 'text-white/60'
                                )}
                            />
                            <span
                                className={cn(
                                    'text-base font-black tracking-wide uppercase',
                                    remainingAchievements > 0 ? 'text-black' : 'text-white/60'
                                )}
                            >
                                {t('home.achievements', 'Achievements')}
                            </span>
                            <span
                                className="ml-3 px-2 py-0.5 text-xs font-bold rounded-md"
                                style={{
                                    background: remainingAchievements > 0 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                                    color: remainingAchievements > 0 ? 'black' : 'white',
                                }}
                            >
                                {achievementProgress.unlocked}/{achievementProgress.total}
                            </span>
                        </div>
                    </button>

                    {/* Shop Card */}
                    <button
                        onClick={() => onSelectMode('shop')}
                        className="w-full relative overflow-hidden rounded-xl transition-all active:scale-[0.97]"
                        style={{
                            background: theme.purple,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 4px 0 ${theme.border}`,
                        }}
                    >
                        <div className="px-5 py-3 flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 mr-2 text-white" />
                            <span className="text-base font-black text-white tracking-wide uppercase">
                                {t('home.shop', 'Shop')}
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Disclaimer */}
            <div
                className="absolute left-0 right-0 text-center text-white/40 text-xs px-6 leading-relaxed whitespace-pre-line"
                style={{ bottom: 105 }}
            >
                {t('home.disclaimer')}
            </div>

            {/* Footer - 광고 배너 위에 위치 */}
            <div
                className="absolute left-0 right-0 text-center text-white/30 text-xs"
                style={{ bottom: 85 }}
            >
                <span className="font-medium">2026 Sputnik Workshop</span>
                <span className="mx-2">·</span>
                <span className="font-mono">v{__APP_VERSION__}</span>
            </div>

            {/* Ad Banner Area (Web placeholder) */}
            {!isNative && !isAdFree && (
                <div
                    className="absolute left-0 right-0 z-10 flex justify-center"
                    style={{
                        bottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
                        paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
                        paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
                    }}
                >
                    <div
                        className="w-full max-w-[320px] h-[50px] rounded-lg flex items-center justify-center"
                        style={{
                            background: 'rgba(0,0,0,0.4)',
                            border: `2px dashed ${theme.border}`,
                        }}
                    >
                        <span className="text-white/30 text-xs font-bold">AD BANNER</span>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Dev Options Modal */}
            {IS_DEV && (
                <DevOptionsModal isOpen={isDevOpen} onClose={() => setIsDevOpen(false)} />
            )}
        </div>
    )
}
