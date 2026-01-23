import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Bug, ChevronDown, ArrowLeft, Lock, HelpCircle } from 'lucide-react'
import { TutorialOverlay, TutorialStep } from '@/components/tutorial/TutorialOverlay'
import { useAdMob } from '@/hooks/useAdMob'
import { usePurchaseStore } from '@/stores/purchaseStore'
import Balatro from '@/components/Balatro'
import {
    homePreset,
    sandboxPreset,
    gameSelectPreset,
    collectionPreset,
    shopPreset,
    labPreset,
    BackgroundPreset,
} from '@/config/backgroundPresets'
import ShuffleText from '@/components/ShuffleText'
import { RotatingText } from '@/components/RotatingText'
import { LanguageToggle } from '@/components/LanguageToggle'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { DevOptionsModal } from '@/components/ui/DevOptionsModal'
import { ModeCarousel, modeCards } from '@/components/ui/ModeCarousel'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { JellyfishDisplay } from '@/components/ui/JellyfishDisplay'
import { WOBBLE_CHARACTERS } from '@/components/canvas/Wobble'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore } from '@/stores/progressStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useFormulaUnlockStore } from '@/stores/formulaUnlockStore'
import { formulaList } from '@/formulas/registry'
import { Formula, FormulaCategory } from '@/formulas/types'
import { t as localizeText } from '@/utils/localization'
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

export type GameMode = 'sandbox' | 'collection' | 'game' | 'learning' | 'shop' | 'lab'

// Category colors for formula cards (matching SandboxScreen)
const categoryColors: Record<FormulaCategory, string> = {
    mechanics: '#f8b862',
    wave: '#6ecff6',
    gravity: '#c792ea',
    thermodynamics: '#ff6b6b',
    electricity: '#69f0ae',
    special: '#ffd700',
    quantum: '#e040fb',
    chemistry: '#4fc3f7',
}

// Mode-specific background presets
const modeBackgrounds: Record<GameMode, BackgroundPreset> = {
    sandbox: sandboxPreset,
    game: gameSelectPreset,
    collection: collectionPreset,
    shop: shopPreset,
    learning: sandboxPreset,
    lab: labPreset,
}

interface HomeScreenProps {
    onSelectMode: (mode: GameMode) => void
    onSelectSandboxFormula?: (formula: Formula) => void
}

export function HomeScreen({ onSelectMode, onSelectSandboxFormula }: HomeScreenProps) {
    const { t, i18n } = useTranslation()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isDevOpen, setIsDevOpen] = useState(false)
    const [showFormulaSelect, setShowFormulaSelect] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<FormulaCategory | 'all'>('all')
    const [activeSlideIndex, setActiveSlideIndex] = useState(0)
    const [isSlideAnimating, setIsSlideAnimating] = useState(false)
    const [seenFormulas] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('wobble-seen-formulas')
        return saved ? new Set(JSON.parse(saved)) : new Set()
    })
    const { getProgress } = useCollectionStore()
    const { studiedFormulas } = useProgressStore()
    const { getProgress: getAchievementProgress } = useAchievementStore()
    const { isAdFree } = usePurchaseStore()
    const { isUnlocked } = useFormulaUnlockStore()
    const { isInitialized, isBannerVisible, showBanner, isNative } = useAdMob()
    const collectionProgress = getProgress()
    const achievementProgress = getAchievementProgress()
    const unseenFormulaCount = formulaList.length - studiedFormulas.size

    // Tutorial state for formula selection (separate from simulation tutorial)
    const FORMULA_SELECT_TUTORIAL_KEY = 'wobble-tutorial-formula-select-completed'
    const [tutorialActive, setTutorialActive] = useState(false)
    const [tutorialStep, setTutorialStep] = useState(0)
    const [tutorialTargetRect, setTutorialTargetRect] = useState<DOMRect | null>(null)
    const [hasCompletedFormulaSelectTutorial, setHasCompletedFormulaSelectTutorial] = useState(() => {
        return localStorage.getItem(FORMULA_SELECT_TUTORIAL_KEY) === 'true'
    })

    // Language helper for tutorial messages
    const isKo = i18n.language === 'ko' || i18n.language.startsWith('ko')
    const isJa = i18n.language === 'ja' || i18n.language.startsWith('ja')

    // Tutorial steps for formula selection phase
    const tutorialSteps: TutorialStep[] = useMemo(() => [
        {
            targetSymbol: '__welcome__',
            targetType: 'welcome' as const,
            title: isKo ? '물리 샌드박스에 오신 것을 환영해요!' : isJa ? '物理サンドボックスへようこそ！' : 'Welcome to Physics Sandbox!',
            message: isKo
                ? '여기서 물리 공식을 직접 만져보며 배울 수 있어요. 변수를 조절하면 결과가 어떻게 바뀌는지 눈으로 확인해보세요!'
                : isJa
                ? 'ここで物理公式を直接触りながら学べます。変数を調整すると結果がどう変わるか、目で確認してみてください！'
                : 'Here you can learn physics formulas by interacting with them. Adjust variables and see how the results change in real-time!',
            wobbleExpression: 'happy',
        },
        {
            targetSymbol: '__formula_first__',
            targetType: 'formula-list' as const,
            title: isKo ? '공식을 선택해보세요' : isJa ? '公式を選んでみてください' : 'Select a Formula',
            message: isKo
                ? '다양한 물리 공식이 준비되어 있어요. 원하는 공식을 탭해서 시뮬레이션을 시작해보세요!'
                : isJa
                ? '様々な物理公式が用意されています。好きな公式をタップしてシミュレーションを始めてみてください！'
                : 'Various physics formulas are ready for you. Tap any formula to start the simulation!',
            wobbleExpression: 'excited',
        },
    ], [isKo, isJa])

    // Tutorial functions
    const startTutorial = useCallback((forceRestart = false) => {
        if (forceRestart) {
            localStorage.removeItem(FORMULA_SELECT_TUTORIAL_KEY)
            setHasCompletedFormulaSelectTutorial(false)
        }
        setTutorialStep(0)
        setTutorialActive(true)
    }, [])

    const nextTutorialStep = useCallback(() => {
        if (tutorialStep < tutorialSteps.length - 1) {
            setTutorialStep(prev => prev + 1)
        }
    }, [tutorialStep, tutorialSteps.length])

    const completeTutorial = useCallback(() => {
        localStorage.setItem(FORMULA_SELECT_TUTORIAL_KEY, 'true')
        setHasCompletedFormulaSelectTutorial(true)
        setTutorialActive(false)
        setTutorialStep(0)
    }, [])

    const skipTutorial = useCallback(() => {
        completeTutorial()
    }, [completeTutorial])

    // Auto-start tutorial when formula select is shown for first-time users
    useEffect(() => {
        if (showFormulaSelect && !hasCompletedFormulaSelectTutorial && !tutorialActive) {
            console.log('[Tutorial Debug] Auto-starting formula select tutorial')
            const timer = setTimeout(() => {
                startTutorial()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [showFormulaSelect, hasCompletedFormulaSelectTutorial, tutorialActive, startTutorial])

    // Update target rect when tutorial step changes
    useEffect(() => {
        if (!tutorialActive) {
            setTutorialTargetRect(null)
            return
        }

        const currentStep = tutorialSteps[tutorialStep]
        if (!currentStep) return

        const timer = setTimeout(() => {
            if (currentStep.targetSymbol === '__welcome__') {
                setTutorialTargetRect(null)
            } else if (currentStep.targetSymbol === '__formula_first__') {
                const el = document.querySelector('[data-tutorial-formula-first]')
                if (el) {
                    setTutorialTargetRect(el.getBoundingClientRect())
                }
            }
        }, 100)

        return () => clearTimeout(timer)
    }, [tutorialActive, tutorialStep, tutorialSteps])

    // Get current active mode card and background preset
    const activeCard = modeCards[activeSlideIndex] || modeCards[0]
    const activeBackground = modeBackgrounds[activeCard.id] || homePreset

    // Get unique categories from formulas
    const categories = Array.from(new Set(formulaList.map((f) => f.category))) as FormulaCategory[]

    // Filter formulas by selected category
    const filteredFormulas =
        selectedCategory === 'all'
            ? formulaList
            : formulaList.filter((f) => f.category === selectedCategory)

    // Handle slide change - animate description area
    const handleSlideChange = (_mode: GameMode, index: number) => {
        setIsSlideAnimating(true)
        setTimeout(() => {
            setActiveSlideIndex(index)
            setTimeout(() => setIsSlideAnimating(false), 50)
        }, 150)
    }

    // Handle mode selection - go directly to mode
    const handleModeSelect = (mode: GameMode) => {
        if (mode === 'sandbox') {
            // Show formula select screen for sandbox
            setShowFormulaSelect(true)
        } else if (mode === 'lab') {
            // Go directly to lab mode
            onSelectMode(mode)
        } else {
            // Go directly to mode without intro
            onSelectMode(mode)
        }
    }

    // Handle formula selection in sandbox mode
    const handleFormulaSelect = (formula: Formula) => {
        const isLocked = !isAdFree && !isUnlocked(formula.id)
        if (isLocked) return

        setShowFormulaSelect(false)
        if (onSelectSandboxFormula) {
            onSelectSandboxFormula(formula)
        }
    }

    // Handle back from formula select
    const handleBackFromFormulaSelect = () => {
        setShowFormulaSelect(false)
    }

    // Show AdMob banner when initialized (unless ad-free)
    useEffect(() => {
        if (isInitialized && !isBannerVisible && !isAdFree) {
            showBanner()
        }
    }, [isInitialized, isAdFree, isBannerVisible, showBanner])

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: theme.felt }}>
            {/* Dynamic Balatro Background - changes with mode */}
            <div className="absolute inset-0 opacity-40">
                <Balatro
                    color1={activeBackground.color1}
                    color2={activeBackground.color2}
                    color3={activeBackground.color3}
                    spinSpeed={activeBackground.spinSpeed}
                    spinRotation={activeBackground.spinRotation}
                    contrast={activeBackground.contrast}
                    lighting={activeBackground.lighting}
                    spinAmount={activeBackground.spinAmount}
                    pixelFilter={activeBackground.pixelFilter}
                    isRotate={activeBackground.isRotate}
                    mouseInteraction={false}
                    patternScale={activeBackground.patternScale}
                    warpIntensity={activeBackground.warpIntensity}
                    symmetry={activeBackground.symmetry}
                    flowSpeed={activeBackground.flowSpeed}
                    vortexStrength={activeBackground.vortexStrength}
                    noiseScale={activeBackground.noiseScale}
                    rippleStrength={activeBackground.rippleStrength}
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

            {/* Subtle diagonal accent lines - static, not animated */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Static diagonal stripes */}
                {[...Array(5)].map((_, i) => (
                    <div
                        key={`stripe-${activeCard.id}-${i}`}
                        className="absolute transition-all duration-700"
                        style={{
                            background: `linear-gradient(90deg, transparent 0%, ${activeCard.color}15 50%, transparent 100%)`,
                            height: '1px',
                            width: '150%',
                            left: '-25%',
                            top: `${15 + i * 18}%`,
                            transform: 'rotate(-12deg)',
                        }}
                    />
                ))}
                {/* Corner accent glow */}
                <div
                    className="absolute -top-20 -right-20 w-80 h-80 rounded-full transition-all duration-700"
                    style={{
                        background: `radial-gradient(circle, ${activeCard.color}10 0%, transparent 70%)`,
                    }}
                />
                <div
                    className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full transition-all duration-700"
                    style={{
                        background: `radial-gradient(circle, ${activeCard.color}08 0%, transparent 60%)`,
                    }}
                />
            </div>

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
                    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 64px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 160px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 40px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 40px)',
                }}
            >
                {/* Persona-style Logo */}
                <div className="text-center relative flex flex-col items-center">
                    {/* Angled background shape - fixed width container */}
                    <div className="relative" style={{ width: '280px', minWidth: '280px' }}>
                        {/* Shadow layer */}
                        <div
                            className="absolute inset-0 translate-x-2 translate-y-2"
                            style={{
                                background: theme.border,
                                transform: 'skewX(-5deg) translateX(8px) translateY(8px)',
                            }}
                        />
                        {/* Main container */}
                        <div
                            className="relative px-10 py-4 overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${theme.bgPanel} 0%, #2a3234 100%)`,
                                border: `4px solid ${theme.border}`,
                                transform: 'skewX(-5deg)',
                                clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                            }}
                        >
                            <h1
                                className="text-5xl font-black tracking-wider whitespace-nowrap"
                                style={{
                                    color: theme.gold,
                                    textShadow: `3px 3px 0 ${theme.border}, -1px -1px 0 ${theme.border}`,
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    transform: 'skewX(5deg)',
                                    animation: 'persona-title-pulse 3s ease-in-out infinite',
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
                        {/* Accent line */}
                        <div
                            className="absolute -bottom-1 left-0 right-0 h-1"
                            style={{
                                background: theme.gold,
                                transform: 'skewX(-5deg)',
                                animation: 'persona-line-glow 2s ease-in-out infinite',
                            }}
                        />
                    </div>
                    {/* Subtitle with persona style */}
                    <div
                        className="mt-5 inline-block px-6 py-1"
                        style={{
                            background: 'rgba(0,0,0,0.5)',
                            transform: 'skewX(-8deg)',
                            borderLeft: `3px solid ${theme.gold}`,
                        }}
                    >
                        <p
                            className="text-sm tracking-[0.2em] font-black uppercase"
                            style={{
                                color: 'rgba(255,255,255,0.9)',
                                transform: 'skewX(8deg)',
                            }}
                        >
                            PHYSICS{' '}
                            <span style={{ color: theme.gold }}>
                                <RotatingText
                                    texts={t('home.modes', { returnObjects: true }) as string[]}
                                    interval={2500}
                                />
                            </span>
                        </p>
                    </div>
                </div>

                {/* Persona-style Mode Description Area */}
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    {/* Wobble Character with dynamic entrance */}
                    <div
                        className={cn(
                            'mb-2 transition-all duration-500',
                            isSlideAnimating
                                ? 'opacity-0 scale-50 rotate-12'
                                : 'opacity-100 scale-100 rotate-0'
                        )}
                        style={{
                            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                    >
                        <div
                            className="relative"
                            style={{
                                animation: 'persona-character-bounce 2s ease-in-out infinite',
                            }}
                        >
                            {/* Character glow effect */}
                            <div
                                className="absolute inset-0 rounded-full blur-xl opacity-30"
                                style={{
                                    background: activeCard.color,
                                    transform: 'scale(1.5)',
                                }}
                            />
                            {activeCard.id === 'game' ? (
                                <JellyfishDisplay
                                    size={80}
                                    color={activeCard.color}
                                    animated={true}
                                />
                            ) : (
                                <WobbleDisplay
                                    size={80}
                                    shape={activeCard.wobbleShape}
                                    color={WOBBLE_CHARACTERS[activeCard.wobbleShape].color}
                                    expression={activeCard.wobbleExpression}
                                />
                            )}
                        </div>
                    </div>

                    {/* Persona-style Speech Bubble */}
                    <div
                        className={cn(
                            'relative transition-all duration-500',
                            isSlideAnimating
                                ? 'opacity-0 scale-90 translate-x-10'
                                : 'opacity-100 scale-100 translate-x-0'
                        )}
                        style={{
                            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                            transitionDelay: '100ms',
                        }}
                    >
                        {/* Speech bubble tail */}
                        <div
                            className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0"
                            style={{
                                borderLeft: '12px solid transparent',
                                borderRight: '12px solid transparent',
                                borderBottom: `12px solid ${activeCard.color}`,
                            }}
                        />
                        {/* Main bubble */}
                        <div
                            className="relative px-6 py-4 max-w-[300px]"
                            style={{
                                background: activeCard.color,
                                transform: 'skewX(-3deg)',
                                clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)',
                                boxShadow: `4px 4px 0 ${theme.border}`,
                            }}
                        >
                            <p
                                className="text-base font-bold leading-relaxed text-center"
                                style={{
                                    color: theme.border,
                                    transform: 'skewX(3deg)',
                                }}
                            >
                                {t(activeCard.descriptionKey, '')}
                            </p>
                        </div>
                        {/* Decorative corner accent */}
                        <div
                            className="absolute -bottom-1 -right-1 w-3 h-3"
                            style={{
                                background: theme.border,
                                transform: 'rotate(45deg)',
                            }}
                        />
                    </div>

                    {/* Animated Tap hint */}
                    <div
                        className={cn(
                            'mt-6 flex flex-col items-center gap-1 transition-all duration-300',
                            isSlideAnimating ? 'opacity-0' : 'opacity-100'
                        )}
                    >
                        <div
                            className="flex items-center gap-2 px-4 py-2"
                            style={{
                                background: 'rgba(0,0,0,0.4)',
                                transform: 'skewX(-5deg)',
                                animation: 'persona-tap-pulse 1.5s ease-in-out infinite',
                            }}
                        >
                            <ChevronDown
                                className="w-4 h-4"
                                style={{
                                    color: theme.gold,
                                    transform: 'skewX(5deg)',
                                    animation: 'bounce-home-arrow 0.8s ease-in-out infinite',
                                }}
                            />
                            <p
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{
                                    color: theme.gold,
                                    transform: 'skewX(5deg)',
                                }}
                            >
                                {t('home.tapToStart', 'Tap to start')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mode Carousel */}
                <div className="shrink-0 pb-2">
                    <ModeCarousel
                        onSelectMode={handleModeSelect}
                        onSlideChange={handleSlideChange}
                        collectionProgress={collectionProgress}
                        achievementProgress={achievementProgress}
                        unseenFormulaCount={unseenFormulaCount}
                    />
                </div>

                {/* Persona-style CSS Animations */}
                <style>{`
                    @keyframes speed-line-move {
                        0% { transform: rotate(-15deg) translateX(-100%); }
                        100% { transform: rotate(-15deg) translateX(100%); }
                    }
                    @keyframes speed-line-move-reverse {
                        0% { transform: rotate(15deg) translateX(100%); }
                        100% { transform: rotate(15deg) translateX(-100%); }
                    }
                    @keyframes persona-title-pulse {
                        0%, 100% {
                            filter: brightness(1);
                            transform: skewX(5deg) scale(1);
                        }
                        50% {
                            filter: brightness(1.1);
                            transform: skewX(5deg) scale(1.02);
                        }
                    }
                    @keyframes persona-line-glow {
                        0%, 100% {
                            opacity: 1;
                            box-shadow: 0 0 10px ${theme.gold}40;
                        }
                        50% {
                            opacity: 0.8;
                            box-shadow: 0 0 20px ${theme.gold}80;
                        }
                    }
                    @keyframes persona-character-bounce {
                        0%, 100% {
                            transform: translateY(0) rotate(0deg);
                        }
                        25% {
                            transform: translateY(-8px) rotate(-3deg);
                        }
                        75% {
                            transform: translateY(-4px) rotate(3deg);
                        }
                    }
                    @keyframes persona-tap-pulse {
                        0%, 100% {
                            transform: skewX(-5deg) scale(1);
                            opacity: 0.8;
                        }
                        50% {
                            transform: skewX(-5deg) scale(1.05);
                            opacity: 1;
                        }
                    }
                    @keyframes bounce-home-arrow {
                        0%, 100% { transform: skewX(5deg) translateY(0); }
                        50% { transform: skewX(5deg) translateY(4px); }
                    }
                    @keyframes persona-card-float {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(-3px) rotate(1deg); }
                    }
                `}</style>
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
            {IS_DEV && <DevOptionsModal isOpen={isDevOpen} onClose={() => setIsDevOpen(false)} />}

            {/* Formula Select Screen for Sandbox */}
            {showFormulaSelect && (
                <div
                    className="fixed inset-0 z-50 animate-in fade-in duration-300"
                    style={{ background: '#0a0a12' }}
                >
                    {/* Balatro Background */}
                    <div className="absolute inset-0 opacity-40">
                        <Balatro
                            color1={sandboxPreset.color1}
                            color2={sandboxPreset.color2}
                            color3={sandboxPreset.color3}
                            spinSpeed={sandboxPreset.spinSpeed}
                            spinRotation={sandboxPreset.spinRotation}
                            contrast={sandboxPreset.contrast}
                            lighting={sandboxPreset.lighting}
                            spinAmount={sandboxPreset.spinAmount}
                            pixelFilter={sandboxPreset.pixelFilter}
                            isRotate={sandboxPreset.isRotate}
                            mouseInteraction={false}
                            patternScale={sandboxPreset.patternScale}
                            warpIntensity={sandboxPreset.warpIntensity}
                            symmetry={sandboxPreset.symmetry}
                            flowSpeed={sandboxPreset.flowSpeed}
                            vortexStrength={sandboxPreset.vortexStrength}
                            noiseScale={sandboxPreset.noiseScale}
                            rippleStrength={sandboxPreset.rippleStrength}
                        />
                    </div>

                    {/* Vignette overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />

                    {/* Content */}
                    <div
                        className="relative z-10 h-full flex flex-col"
                        style={{
                            paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
                            paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                            paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
                        }}
                    >
                        {/* Header Row with Back Button and Tutorial Button */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handleBackFromFormulaSelect}
                                className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95"
                                style={{
                                    background: theme.bgPanel,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                }}
                            >
                                <ArrowLeft className="h-5 w-5 text-white" />
                            </button>

                            {/* Tutorial Help Button */}
                            <button
                                onClick={() => {
                                    console.log('[Tutorial Debug] Manual start clicked in HomeScreen')
                                    startTutorial(true)
                                }}
                                className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95"
                                style={{
                                    background: theme.purple,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                }}
                            >
                                <HelpCircle className="h-5 w-5 text-white" />
                            </button>
                        </div>

                        {/* Section Title */}
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <div
                                className="h-[2px] flex-1"
                                style={{
                                    background: `linear-gradient(90deg, transparent, ${theme.gold}40)`,
                                }}
                            />
                            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                                {t('simulation.welcome.selectFormula')}
                            </span>
                            <div
                                className="h-[2px] flex-1"
                                style={{
                                    background: `linear-gradient(90deg, ${theme.gold}40, transparent)`,
                                }}
                            />
                        </div>

                        {/* Category Tabs */}
                        <div className="flex gap-2 px-2 py-2 overflow-x-auto scrollbar-hide mb-3">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95"
                                style={{
                                    background:
                                        selectedCategory === 'all' ? theme.gold : theme.bgPanelLight,
                                    color: selectedCategory === 'all' ? '#000' : '#fff',
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 2px 0 ${theme.border}`,
                                }}
                            >
                                {t('simulation.categories.all')}
                            </button>
                            {categories.map((cat) => {
                                const color = categoryColors[cat]
                                const isActive = selectedCategory === cat
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95"
                                        style={{
                                            background: isActive ? color : theme.bgPanelLight,
                                            color: isActive ? '#000' : '#fff',
                                            border: `2px solid ${theme.border}`,
                                            boxShadow: `0 2px 0 ${theme.border}`,
                                        }}
                                    >
                                        {t(`simulation.categories.${cat}`)}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Formula Grid */}
                        <div className="flex-1 overflow-y-auto px-2 pb-2">
                            <div className="grid grid-cols-2 gap-3">
                                {filteredFormulas.map((f, index) => {
                                    const fColor = categoryColors[f.category]
                                    const fName = localizeText(f.name, i18n.language)
                                    const isNew = !seenFormulas.has(f.id)
                                    const isLocked = !isAdFree && !isUnlocked(f.id)
                                    const isFirstFormula = index === 0
                                    return (
                                        <div key={f.id} className="relative">
                                            <button
                                                onClick={() => handleFormulaSelect(f)}
                                                data-tutorial-formula-first={isFirstFormula ? 'true' : undefined}
                                                className="relative w-full text-left px-4 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                style={{
                                                    background: isLocked ? '#2a2a2a' : theme.bgPanelLight,
                                                    border: `2px solid ${theme.border}`,
                                                    boxShadow: `0 3px 0 ${theme.border}`,
                                                    opacity: isLocked ? 0.7 : 1,
                                                }}
                                            >
                                                {/* NEW badge for unseen formulas */}
                                                {isNew && !isLocked && (
                                                    <span
                                                        className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[10px] font-black rounded-md"
                                                        style={{
                                                            background: '#ff6b6b',
                                                            color: 'white',
                                                            border: `1.5px solid ${theme.border}`,
                                                            boxShadow: `0 1px 0 ${theme.border}`,
                                                        }}
                                                    >
                                                        NEW
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    {isLocked ? (
                                                        <Lock className="w-3 h-3 text-white/50 flex-shrink-0" />
                                                    ) : (
                                                        <span
                                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                                            style={{ background: fColor }}
                                                        />
                                                    )}
                                                    <span
                                                        className="block text-sm font-bold truncate"
                                                        style={{
                                                            color: isLocked ? '#888' : 'white',
                                                        }}
                                                    >
                                                        {fName}
                                                    </span>
                                                </div>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Empty state */}
                            {filteredFormulas.length === 0 && (
                                <div className="text-center py-8 text-white/50 text-sm">
                                    {t('simulation.emptyCategory')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tutorial Overlay for formula selection */}
                    {tutorialActive && (
                        <TutorialOverlay
                            steps={tutorialSteps}
                            currentStep={tutorialStep}
                            onNext={nextTutorialStep}
                            onSkip={skipTutorial}
                            onComplete={completeTutorial}
                            targetRect={tutorialTargetRect}
                            sliderRect={null}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
