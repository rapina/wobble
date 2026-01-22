import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PixiCanvas, PixiCanvasHandle } from '../canvas/PixiCanvas'
import { ParameterControl } from '../controls/ParameterControl'
import { FormulaLayout } from '../controls/FormulaLayout'
import { useSimulation } from '../../hooks/useSimulation'
import { useAdMob } from '../../hooks/useAdMob'
import { useLocalizedFormula, useLocalizedVariables } from '../../hooks/useLocalizedFormula'
import { useTutorial } from '../../hooks/useTutorial'
import { usePurchaseStore } from '@/stores/purchaseStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore } from '@/stores/progressStore'
import { useChallengeStore } from '@/stores/challengeStore'
import {
    useFormulaUnlockStore,
    getPrerequisiteFormulaName,
    UNLOCK_CONDITIONS,
} from '@/stores/formulaUnlockStore'
import { formulas as formulaRegistry } from '@/formulas/registry'
import { generateChallenge } from '@/utils/challengeGenerator'
import { getInsightText } from '@/utils/formulaInsights'
import { TutorialOverlay } from '../tutorial/TutorialOverlay'
import { SettingsModal } from '../ui/SettingsModal'
import {
    ArrowLeft,
    List,
    X,
    Info,
    ChevronDown,
    HelpCircle,
    Lightbulb,
    Target,
    Lock,
    Unlock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Formula, FormulaCategory } from '../../formulas/types'
import { WobbleShape } from '../canvas/Wobble'
import { WobbleDisplay } from '../canvas/WobbleDisplay'
import Balatro from '@/components/Balatro'
import { sandboxPreset } from '@/config/backgroundPresets'
import { t as localizeText } from '@/utils/localization'

// Balatro-inspired color palette
const categoryColors: Record<FormulaCategory, string> = {
    mechanics: '#f8b862',
    wave: '#6ecff6',
    gravity: '#c792ea',
    thermodynamics: '#ff6b6b',
    electricity: '#69f0ae',
    special: '#ffd700',
    quantum: '#e040fb', // Purple/Magenta for quantum mechanics
    chemistry: '#4fc3f7', // Light blue for chemistry
}

// Balatro theme
const theme = {
    bg: '#3d6b59',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
    red: '#e85d4c',
    blue: '#4a9eff',
}

interface SimulationScreenProps {
    formulaId: string
    formulas: Formula[]
    onFormulaChange: (formula: Formula) => void
    onBack: () => void
}

export function SandboxScreen({
    formulaId,
    formulas,
    onFormulaChange,
    onBack,
}: SimulationScreenProps) {
    const { t, i18n } = useTranslation()
    const { formula, variables, inputVariables, setVariable } = useSimulation(formulaId)
    const {
        isBannerVisible,
        hideBanner,
        showRewardAd,
        isRewardAdLoading,
        isNative,
        webSimulationActive,
        completeWebSimulation,
        cancelWebSimulation,
    } = useAdMob()
    const { isAdFree } = usePurchaseStore()
    const { isUnlocked, unlockFormula, getUnlockCondition, completeDiscovery } =
        useFormulaUnlockStore()
    const { unlockByFormula, getNewUnlocksForFormula } = useCollectionStore()
    const { studyFormula } = useProgressStore()
    const { currentChallenge, score, combo, setChallenge, solveChallenge, skipChallenge } =
        useChallengeStore()
    const localizedFormula = useLocalizedFormula(formula)
    const localizedVariables = useLocalizedVariables(formula?.variables ?? [])
    const [mounted, setMounted] = useState(false)
    const [showFormulaList, setShowFormulaList] = useState(false)
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [selectedCard, setSelectedCard] = useState<string | null>(null)
    const [showInfoPopup, setShowInfoPopup] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<FormulaCategory | 'all'>('all')
    const [seenFormulas, setSeenFormulas] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('wobble-seen-formulas')
        return saved ? new Set(JSON.parse(saved)) : new Set()
    })
    const [readInfoFormulas, setReadInfoFormulas] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('wobble-read-info-formulas')
        return saved ? new Set(JSON.parse(saved)) : new Set()
    })
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
    const [sliderRect, setSliderRect] = useState<DOMRect | null>(null)
    const [pendingNewWobbles, setPendingNewWobbles] = useState<WobbleShape[]>([])
    const [tutorialShownThisSession, setTutorialShownThisSession] = useState(false)
    const [discoveryShownThisSession, setDiscoveryShownThisSession] = useState(false)
    const [welcomePhase, setWelcomePhase] = useState<'select' | 'simulation'>('simulation')
    const [challengeToast, setChallengeToast] = useState<
        | { type: 'success'; score: number; combo: number; insight?: string }
        | { type: 'wrong'; hint: string }
        | null
    >(null)
    const [challengeToastVisible, setChallengeToastVisible] = useState(false)
    const [challengeTransition, setChallengeTransition] = useState<'idle' | 'exit' | 'enter'>(
        'idle'
    )
    const [webAdCountdown, setWebAdCountdown] = useState(5)
    const canvasRef = useRef<PixiCanvasHandle>(null)

    // 현재 선택된 공식이 잠겨있는지 확인 (광고 제거 구매 시 모두 해금)
    const isCurrentFormulaLocked = !isAdFree && !isUnlocked(formulaId)

    // Tutorial hook
    const tutorial = useTutorial({
        formulaId,
        variables: formula?.variables ?? [],
        formula,
        onSelectCard: setSelectedCard,
    })

    // Update target rect when tutorial step changes
    useEffect(() => {
        if (!tutorial.isActive || !tutorial.currentTargetSymbol) {
            setTargetRect(null)
            setSliderRect(null)
            return
        }

        // Small delay to let DOM update
        const timer = setTimeout(() => {
            // Handle formula selection tutorial step
            if (tutorial.currentTargetSymbol === '__formula_first__') {
                const formulaEl = document.querySelector('[data-tutorial-formula-first]')
                if (formulaEl) {
                    setTargetRect(formulaEl.getBoundingClientRect())
                }
                setSliderRect(null)
                return
            }

            // Handle info button tutorial step
            if (tutorial.currentTargetSymbol === '__info__') {
                const infoButtonEl = document.querySelector('[data-tutorial-info-button]')
                if (infoButtonEl) {
                    setTargetRect(infoButtonEl.getBoundingClientRect())
                }
                setSliderRect(null)
                return
            }

            // Handle challenge submit button tutorial step
            if (tutorial.currentTargetSymbol === '__challenge_submit__') {
                const challengeSubmitEl = document.querySelector('[data-tutorial-challenge-submit]')
                if (challengeSubmitEl) {
                    setTargetRect(challengeSubmitEl.getBoundingClientRect())
                }
                setSliderRect(null)
                return
            }

            // Handle variable card tutorial step
            const cardEl = document.querySelector(
                `[data-tutorial-symbol="${tutorial.currentTargetSymbol}"]`
            )
            const sliderEl = document.querySelector(
                `[data-tutorial-slider="${tutorial.currentTargetSymbol}"]`
            )

            if (cardEl) {
                setTargetRect(cardEl.getBoundingClientRect())
            }
            if (sliderEl) {
                setSliderRect(sliderEl.getBoundingClientRect())
            }
        }, 100)

        return () => clearTimeout(timer)
    }, [tutorial.isActive, tutorial.currentTargetSymbol, selectedCard, welcomePhase])

    // Web ad simulation countdown
    useEffect(() => {
        if (!webSimulationActive) {
            setWebAdCountdown(5)
            return
        }

        const timer = setInterval(() => {
            setWebAdCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [webSimulationActive])

    // Track when tutorial becomes active (to prevent auto-restart)
    useEffect(() => {
        if (tutorial.isActive) {
            setTutorialShownThisSession(true)
        }
    }, [tutorial.isActive])

    // Complete tutorial when info popup is opened during info button tutorial step
    useEffect(() => {
        if (
            tutorial.isActive &&
            tutorial.currentTargetSymbol === '__info__' &&
            showInfoPopup
        ) {
            // Wait a bit then complete tutorial
            const timer = setTimeout(() => {
                tutorial.completeTutorial()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [tutorial.isActive, tutorial.currentTargetSymbol, showInfoPopup, tutorial])

    // Auto-start tutorial for first-time users
    useEffect(() => {
        // Don't start if tutorial already completed globally, active, or shown this session
        if (
            !formula ||
            tutorial.hasCompletedTutorial ||
            tutorial.isActive ||
            tutorialShownThisSession
        )
            return

        const timer = setTimeout(() => {
            // Start tutorial from formula selection phase
            setWelcomePhase('select')
            tutorial.startTutorial()
        }, 500)
        return () => clearTimeout(timer)
    }, [
        formula,
        tutorial.hasCompletedTutorial,
        tutorial.isActive,
        tutorialShownThisSession,
    ])

    // Get unique categories from formulas
    const categories = useMemo(() => {
        const cats = [...new Set(formulas.map((f) => f.category))]
        return cats.sort()
    }, [formulas])

    // Filter formulas by category
    const filteredFormulas = useMemo(() => {
        if (selectedCategory === 'all') return formulas
        return formulas.filter((f) => f.category === selectedCategory)
    }, [formulas, selectedCategory])

    // Generate hint text based on current challenge and values
    const getChallengeHint = useCallback((): string | null => {
        if (!currentChallenge || !variables || !formula) return null

        const isKo = i18n.language === 'ko' || i18n.language.startsWith('ko')
        const targetSymbol = currentChallenge.targetVariables[0]
        if (!targetSymbol) return null

        const targetVar = formula.variables.find((v) => v.symbol === targetSymbol)
        if (!targetVar) return null

        const currentValue = variables[targetSymbol]
        const [min, max] = targetVar.range
        const rangeSize = max - min

        // Extract target from mission text (rough parsing)
        const missionText = isKo ? currentChallenge.mission : currentChallenge.missionEn

        if (currentChallenge.type === 'target') {
            // Parse target value from mission
            const match = missionText.match(/(\d+\.?\d*)/)
            if (match) {
                const target = parseFloat(match[1])
                const diff = target - currentValue
                const tolerance = rangeSize * 0.05

                if (Math.abs(diff) <= tolerance) {
                    return isKo ? '거의 다 왔어!' : 'Almost there!'
                } else if (diff > rangeSize * 0.3) {
                    return isKo ? '↑ 많이 올려!' : '↑ Go higher!'
                } else if (diff > 0) {
                    return isKo ? '↑ 조금만 더!' : '↑ A bit more!'
                } else if (diff < -rangeSize * 0.3) {
                    return isKo ? '↓ 많이 내려!' : '↓ Go lower!'
                } else {
                    return isKo ? '↓ 조금만 줄여!' : '↓ A bit less!'
                }
            }
        } else if (currentChallenge.type === 'range') {
            // Parse range from mission
            const match = missionText.match(/(\d+\.?\d*)[~\-](\d+\.?\d*)/)
            if (match) {
                const rangeStart = parseFloat(match[1])
                const rangeEnd = parseFloat(match[2])

                if (currentValue < rangeStart) {
                    return isKo ? '↑ 범위 안으로!' : '↑ Into the range!'
                } else if (currentValue > rangeEnd) {
                    return isKo ? '↓ 범위 안으로!' : '↓ Into the range!'
                } else {
                    return isKo ? '범위 안에 있어!' : 'In range!'
                }
            }
        } else if (currentChallenge.type === 'condition') {
            // Check condition keywords
            if (missionText.includes('최대') || missionText.includes('maximum')) {
                if (currentValue < max * 0.9) {
                    return isKo ? '↑ 최대로!' : '↑ Maximize!'
                }
            } else if (missionText.includes('최소') || missionText.includes('minimum')) {
                if (currentValue > min + rangeSize * 0.1) {
                    return isKo ? '↓ 최소로!' : '↓ Minimize!'
                }
            } else if (missionText.includes('중간') || missionText.includes('middle')) {
                const mid = (min + max) / 2
                if (currentValue < mid - rangeSize * 0.1) {
                    return isKo ? '↑ 중간으로!' : '↑ To middle!'
                } else if (currentValue > mid + rangeSize * 0.1) {
                    return isKo ? '↓ 중간으로!' : '↓ To middle!'
                }
            }
        }

        return null
    }, [currentChallenge, variables, formula, i18n.language])

    // Generate a challenge that isn't already solved with current values
    const generateNewChallengeRef = useRef((f: Formula, currentVars: Record<string, number>) => {
        let attempts = 0
        let newChallenge = generateChallenge(f)

        // Try up to 10 times to find a challenge that isn't already solved
        while (newChallenge.condition(currentVars) && attempts < 10) {
            newChallenge = generateChallenge(f)
            attempts++
        }

        return newChallenge
    })

    // Generate new challenge when formula changes (infinite random missions)
    useEffect(() => {
        if (!formula || !variables) return
        // Generate a challenge that isn't already solved with current values
        const newChallenge = generateNewChallengeRef.current(formula, variables)
        setChallenge(newChallenge)
    }, [formula, setChallenge]) // Only on formula change

    // Submit challenge answer
    const handleSubmitChallenge = useCallback(() => {
        if (!currentChallenge || !formula || !variables || challengeTransition !== 'idle') return

        const isKo = i18n.language === 'ko' || i18n.language.startsWith('ko')

        // Check if the challenge condition is met
        if (currentChallenge.condition(variables)) {
            const earnedScore = solveChallenge()

            // Complete discovery and check for new unlocks
            completeDiscovery(formula.id)

            // Get contextual insight for the result
            const insight = getInsightText(formula.id, variables, isKo)

            // Card exit animation
            setChallengeTransition('exit')

            // Show success toast after brief delay
            setTimeout(() => {
                setChallengeToast({
                    type: 'success',
                    score: earnedScore,
                    combo: combo + 1,
                    insight: insight || undefined,
                })
                setChallengeToastVisible(true)
            }, 150)
            // Longer display time if there's an insight to read
            const displayTime = insight ? 3000 : 2200
            setTimeout(() => setChallengeToastVisible(false), displayTime)
            setTimeout(() => setChallengeToast(null), displayTime + 300)

            // Generate next challenge with enter animation
            setTimeout(() => {
                const newChallenge = generateNewChallengeRef.current(formula, variables)
                setChallenge(newChallenge)
                setChallengeTransition('enter')
            }, 250)

            // Reset to idle
            setTimeout(() => setChallengeTransition('idle'), 550)
        } else {
            // Wrong answer - show hint with shake effect
            const hint =
                getChallengeHint() || (i18n.language === 'ko' ? '다시 시도해봐!' : 'Try again!')
            setChallengeToast({ type: 'wrong', hint })
            setTimeout(() => setChallengeToastVisible(true), 50)
            setTimeout(() => setChallengeToastVisible(false), 1600)
            setTimeout(() => setChallengeToast(null), 1900)
        }
    }, [
        variables,
        currentChallenge,
        formula,
        solveChallenge,
        setChallenge,
        combo,
        getChallengeHint,
        i18n.language,
        challengeTransition,
        completeDiscovery,
    ])

    // Banner is now initialized in HomeScreen
    // This screen only handles hiding when unmounting
    useEffect(() => {
        return () => {
            if (isBannerVisible) {
                hideBanner()
            }
        }
    }, [isBannerVisible, hideBanner])

    // Memoize Balatro background to prevent re-render on variable changes
    const balatroBackground = useMemo(
        () => (
            <div className="absolute inset-0 opacity-60">
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
                />
            </div>
        ),
        []
    )

    useEffect(() => {
        setMounted(false)
        const timer = setTimeout(() => setMounted(true), 50)
        return () => clearTimeout(timer)
    }, [formulaId])

    // Check for new wobbles and unlock when formula is used
    useEffect(() => {
        if (formulaId) {
            const newWobbles = getNewUnlocksForFormula(formulaId)
            if (newWobbles.length > 0) {
                setPendingNewWobbles(newWobbles)
                unlockByFormula(formulaId)
            }
        }
    }, [formulaId, unlockByFormula, getNewUnlocksForFormula])

    // Show new wobble discovery in scene after tutorial completes
    useEffect(() => {
        // Don't show if no pending wobbles or already shown
        if (pendingNewWobbles.length === 0 || discoveryShownThisSession) return

        // Don't show if tutorial is active
        if (tutorial.isActive) return

        // Check if tutorial has been handled (either completed globally or shown this session)
        const tutorialHandled = tutorial.hasCompletedTutorial || tutorialShownThisSession
        // If tutorial still needs to run and not currently active, wait
        if (!tutorialHandled && !tutorial.isActive) return

        // All conditions met - show discovery in scene
        const timer = setTimeout(() => {
            if (canvasRef.current) {
                setDiscoveryShownThisSession(true)
                canvasRef.current.showNewWobbleDiscovery(pendingNewWobbles, i18n.language, () =>
                    setPendingNewWobbles([])
                )
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [
        pendingNewWobbles,
        discoveryShownThisSession,
        tutorial.isActive,
        tutorial.hasCompletedTutorial,
        tutorialShownThisSession,
        i18n.language,
    ])

    // Mark formula as seen and studied when viewed
    useEffect(() => {
        if (formulaId && !seenFormulas.has(formulaId)) {
            // Small delay to ensure it's intentionally viewed
            const timer = setTimeout(() => {
                markAsSeen(formulaId)
                studyFormula(formulaId) // Record as studied for minigame unlocks
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [formulaId, studyFormula])

    // Mark formula as seen (for NEW badge)
    const markAsSeen = (id: string) => {
        const newSeen = new Set(seenFormulas)
        newSeen.add(id)
        setSeenFormulas(newSeen)
        localStorage.setItem('wobble-seen-formulas', JSON.stringify([...newSeen]))
    }

    // Mark formula info as read
    const markAsReadInfo = (id: string) => {
        const newSet = new Set(readInfoFormulas)
        newSet.add(id)
        setReadInfoFormulas(newSet)
        localStorage.setItem('wobble-read-info-formulas', JSON.stringify([...newSet]))
    }

    // Handle formula selection from select screen
    const handleSelectFromWelcome = (selectedFormula: Formula) => {
        onFormulaChange(selectedFormula)
        setWelcomePhase('simulation')

        // If tutorial is active in formula-select phase, advance to simulation phase
        if (tutorial.isActive && tutorial.tutorialPhase === 'formula-select') {
            // Small delay to let the simulation screen render
            setTimeout(() => {
                tutorial.advanceToSimulation()
            }, 300)
        }
    }

    // 보상형 광고를 통한 공식 잠금 해제
    const handleUnlockFormula = useCallback(
        (formulaIdToUnlock: string) => {
            showRewardAd(
                () => {
                    // 광고 시청 완료 - 공식 해금
                    unlockFormula(formulaIdToUnlock)
                },
                () => {
                    // 광고 로드 실패 - 아무 동작 없음
                    console.log('Reward ad failed')
                }
            )
        },
        [showRewardAd, unlockFormula]
    )

    if (!formula) {
        return (
            <div
                className="flex justify-center items-center h-full"
                style={{ background: theme.bg }}
            >
                <div className="animate-pulse text-white/50">{t('simulation.loading')}</div>
            </div>
        )
    }

    // Formula select screen
    if (welcomePhase === 'select') {
        return (
            <div
                className="relative w-full h-full overflow-hidden animate-in fade-in duration-300"
                style={{ background: '#0a0a12' }}
            >
                {/* Balatro Background */}
                {balatroBackground}

                {/* Vignette overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />

                {/* Welcome Content */}
                <div
                    className="relative z-10 h-full flex flex-col"
                    style={{
                        paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
                        paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                        paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
                    }}
                >
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95 mb-4"
                        style={{
                            background: theme.bgPanel,
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    >
                        <ArrowLeft className="h-5 w-5 text-white" />
                    </button>

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
                                const isSelected = f.id === formulaId
                                const fName = localizeText(f.name, i18n.language)
                                const isNew = !seenFormulas.has(f.id)
                                const isLocked = !isAdFree && !isUnlocked(f.id)
                                const isFirstFormula = index === 0
                                return (
                                    <div key={f.id} className="relative">
                                        <button
                                            onClick={() => handleSelectFromWelcome(f)}
                                            data-tutorial-formula-first={
                                                isFirstFormula ? 'true' : undefined
                                            }
                                            className="relative w-full text-left px-4 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            style={{
                                                background: isSelected
                                                    ? fColor
                                                    : isLocked
                                                      ? '#2a2a2a'
                                                      : theme.bgPanelLight,
                                                border: `2px solid ${theme.border}`,
                                                boxShadow: `0 3px 0 ${theme.border}`,
                                                opacity: isLocked ? 0.7 : 1,
                                            }}
                                        >
                                            {/* NEW badge for unseen formulas */}
                                            {isNew && !isSelected && !isLocked && (
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
                                                        color: isSelected
                                                            ? '#000'
                                                            : isLocked
                                                              ? '#888'
                                                              : 'white',
                                                    }}
                                                >
                                                    {fName}
                                                </span>
                                            </div>
                                        </button>
                                        {/* Unlock condition badge for locked formulas */}
                                        {isLocked &&
                                            (() => {
                                                const cond = getUnlockCondition(f.id)
                                                if (cond.type === 'prerequisite') {
                                                    const prereq = formulaRegistry[cond.formulaId]
                                                    return (
                                                        <div
                                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                                            style={{
                                                                background: theme.bgPanel,
                                                                color: '#aaa',
                                                                border: `1.5px solid ${theme.border}`,
                                                            }}
                                                        >
                                                            <Lock className="w-2.5 h-2.5" />
                                                            {prereq &&
                                                                localizeText(
                                                                    prereq.name,
                                                                    i18n.language
                                                                )}
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleUnlockFormula(f.id)
                                                        }}
                                                        disabled={isRewardAdLoading}
                                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all active:scale-95"
                                                        style={{
                                                            background: '#f59e0b',
                                                            color: '#000',
                                                            border: `1.5px solid ${theme.border}`,
                                                            boxShadow: `0 1px 0 ${theme.border}`,
                                                        }}
                                                    >
                                                        <Lock className="w-2.5 h-2.5" />
                                                        {i18n.language === 'ko' ? '잠김' : 'Locked'}
                                                    </button>
                                                )
                                            })()}
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

                {/* Tutorial Overlay for formula selection phase */}
                {tutorial.isActive && tutorial.tutorialPhase === 'formula-select' && (
                    <TutorialOverlay
                        steps={tutorial.steps}
                        currentStep={tutorial.currentStep}
                        onNext={tutorial.nextStep}
                        onSkip={tutorial.skipTutorial}
                        onComplete={tutorial.completeTutorial}
                        targetRect={targetRect}
                        sliderRect={sliderRect}
                    />
                )}
            </div>
        )
    }

    return (
        <div
            className={cn(
                'relative w-full h-full overflow-hidden',
                'transition-opacity duration-300',
                mounted ? 'opacity-100' : 'opacity-0'
            )}
            style={{ background: '#0a0a12' }}
        >
            {/* Balatro Background */}
            {balatroBackground}

            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />

            {/* Centered Canvas Area */}
            <div
                className="absolute z-10 rounded-xl overflow-hidden"
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 128px)', // Fixed: always account for challenge banner
                    left: 'max(env(safe-area-inset-left, 0px), 12px)',
                    right: 'max(env(safe-area-inset-right, 0px), 12px)',
                    bottom: `calc(max(env(safe-area-inset-bottom, 0px), 8px) + ${isAdFree ? 164 : 262}px)`, // +24px for remove ads button spacing
                    border: `3px solid ${theme.border}`,
                    boxShadow: `0 6px 0 ${theme.border}, 0 10px 30px rgba(0,0,0,0.5)`,
                }}
                onClick={() => setSelectedCard(null)}
            >
                <PixiCanvas ref={canvasRef} formulaId={formulaId} variables={variables} />

                {/* Locked Overlay - Silhouette style */}
                {isCurrentFormulaLocked &&
                    (() => {
                        const condition = getUnlockCondition(formulaId)
                        const prerequisiteId =
                            condition.type === 'prerequisite' ? condition.formulaId : null
                        const prerequisiteFormula = prerequisiteId
                            ? formulaRegistry[prerequisiteId]
                            : null

                        return (
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-end pb-6"
                                style={{
                                    background:
                                        'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.88) 50%, rgba(0,0,0,0.95) 100%)',
                                }}
                            >
                                {condition.type === 'prerequisite' && prerequisiteFormula ? (
                                    <div className="text-center px-4">
                                        <div
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-2"
                                            style={{
                                                background: theme.bgPanel,
                                                border: `2px solid ${theme.border}`,
                                            }}
                                        >
                                            <Lock className="w-4 h-4 text-white/60" />
                                            <span className="text-white/80 text-sm font-bold">
                                                {i18n.language === 'ko'
                                                    ? '선행 조건'
                                                    : 'Prerequisite'}
                                            </span>
                                        </div>
                                        <p className="text-white/60 text-xs leading-relaxed">
                                            {i18n.language === 'ko'
                                                ? `"${localizeText(prerequisiteFormula.name, 'ko')}"에서 챌린지를 완료하세요`
                                                : i18n.language === 'ja'
                                                  ? `"${localizeText(prerequisiteFormula.name, 'ja')}"でチャレンジを完了してください`
                                                  : `Complete a challenge in "${localizeText(prerequisiteFormula.name, 'en')}"`}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleUnlockFormula(formulaId)}
                                        disabled={isRewardAdLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                                        style={{
                                            background: 'rgba(245, 158, 11, 0.9)',
                                            color: '#000',
                                            border: `2px solid ${theme.border}`,
                                            boxShadow: `0 3px 0 ${theme.border}`,
                                        }}
                                    >
                                        <Lock className="w-4 h-4" />
                                        {isRewardAdLoading
                                            ? i18n.language === 'ko'
                                                ? '로딩...'
                                                : 'Loading...'
                                            : i18n.language === 'ko'
                                              ? '잠금 해제'
                                              : 'Unlock'}
                                    </button>
                                )}
                            </div>
                        )
                    })()}
            </div>

            {/* Top Header */}
            <div
                className="absolute top-0 left-0 right-0 z-20"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Back Button */}
                        <button
                            onClick={onBack}
                            className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95"
                            style={{
                                background: theme.bgPanel,
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                            }}
                        >
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </button>

                        {/* Formula Title */}
                        <div
                            className="px-3 py-2 rounded-lg"
                            style={{
                                background: theme.gold,
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                            }}
                        >
                            <span className="text-sm font-black text-black">
                                {localizedFormula?.name}
                            </span>
                        </div>

                        {/* Info Button - Hidden when locked */}
                        {formula.applications &&
                            Object.keys(formula.applications).length > 0 &&
                            !isCurrentFormulaLocked && (
                                <button
                                    data-tutorial-info-button
                                    onClick={() => setShowInfoPopup(true)}
                                    className={cn(
                                        'h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95',
                                        !readInfoFormulas.has(formulaId) && 'hologram-button'
                                    )}
                                    style={{
                                        background: theme.blue,
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: `0 3px 0 ${theme.border}`,
                                    }}
                                >
                                    <Info className="h-5 w-5 text-white" />
                                </button>
                            )}

                        {/* Tutorial Button */}
                        {tutorial.hasCompletedTutorial && (
                            <button
                                onClick={() => tutorial.startTutorial()}
                                className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95"
                                style={{
                                    background: '#9b59b6',
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                }}
                            >
                                <HelpCircle className="h-5 w-5 text-white" />
                            </button>
                        )}
                    </div>

                    {/* Formula List Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFormulaList(true)}
                            className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95"
                            style={{
                                background: theme.red,
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                            }}
                        >
                            <List className="h-5 w-5 text-white" />
                        </button>
                        {/* Unseen formulas indicator */}
                        {(() => {
                            const totalUnseen = formulas.filter(
                                (f) => !seenFormulas.has(f.id)
                            ).length
                            return totalUnseen > 0 ? (
                                <span
                                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black rounded-full"
                                    style={{
                                        background: '#ffd700',
                                        color: '#000',
                                        border: `1.5px solid ${theme.border}`,
                                    }}
                                >
                                    {totalUnseen}
                                </span>
                            ) : null
                        })()}
                    </div>
                </div>
            </div>

            {/* Simulation Hint Banner with Marquee - Hidden when locked */}
            {!isCurrentFormulaLocked &&
                (localizedFormula?.simulationHint || localizedFormula?.description) && (
                    <div
                        className="absolute left-0 right-0 z-20"
                        style={{
                            top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 48px)',
                            paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                            paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                        }}
                    >
                        <div
                            className="flex items-center gap-2 px-3 py-2 rounded-lg overflow-hidden"
                            style={{
                                background: 'rgba(26, 26, 46, 0.9)',
                                border: `1px solid ${theme.border}`,
                            }}
                        >
                            <Lightbulb className="h-4 w-4 text-yellow-400 shrink-0" />
                            <div className="flex-1 overflow-hidden">
                                <span
                                    className="inline-block text-xs text-gray-300 whitespace-nowrap"
                                    style={{
                                        animation: 'marquee-scroll 8s linear infinite',
                                    }}
                                >
                                    {localizedFormula.simulationHint ||
                                        localizedFormula.description}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

            {/* Challenge Banner (infinite random missions) - Hidden when locked */}
            {currentChallenge && !isCurrentFormulaLocked && (
                <div
                    className="absolute left-0 right-0 z-20"
                    style={{
                        top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 88px)',
                        paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                        paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                    }}
                >
                    <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(30, 27, 75, 0.9) 100%)',
                            border: '1px solid rgba(251, 191, 36, 0.5)',
                            boxShadow: '0 0 12px rgba(251, 191, 36, 0.2)',
                            opacity: challengeTransition === 'idle' ? 1 : 0,
                            transform:
                                challengeTransition === 'exit'
                                    ? 'translateX(-10px)'
                                    : challengeTransition === 'enter'
                                      ? 'translateX(10px)'
                                      : 'translateX(0)',
                            transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
                        }}
                    >
                        <Target className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="text-xs text-amber-200 font-medium flex-1">
                            {i18n.language === 'ko' || i18n.language.startsWith('ko')
                                ? currentChallenge.mission
                                : currentChallenge.missionEn}
                        </span>
                        {/* Score & Combo */}
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="text-amber-300">{score}pt</span>
                            {combo > 0 && <span className="text-orange-400">x{combo}</span>}
                        </div>
                        {/* Submit button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleSubmitChallenge()
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95"
                            style={{
                                background: '#f59e0b',
                                color: '#000',
                                border: '2px solid #1a1a1a',
                                boxShadow: '0 2px 0 #1a1a1a',
                            }}
                        >
                            {i18n.language === 'ko' || i18n.language.startsWith('ko')
                                ? '제출'
                                : 'Submit'}
                        </button>
                        {/* Skip button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                skipChallenge()
                                if (formula) {
                                    const newChallenge = generateNewChallengeRef.current(
                                        formula,
                                        variables
                                    )
                                    setChallenge(newChallenge)
                                }
                            }}
                            className="px-2 py-1 rounded text-[10px] font-bold transition-all active:scale-95"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.5)',
                            }}
                        >
                            {i18n.language === 'ko' || i18n.language.startsWith('ko')
                                ? '패스'
                                : 'Pass'}
                        </button>
                    </div>
                </div>
            )}

            {/* Challenge Toast - Top center */}
            {challengeToast && (
                <div
                    className="fixed z-[100] pointer-events-none"
                    style={{
                        top: 'max(env(safe-area-inset-top, 0px), 16px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        animation: challengeToastVisible
                            ? 'toast-bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                            : 'toast-bounce-out 0.25s ease-out forwards',
                    }}
                >
                    <div
                        className="flex items-center gap-3 px-5 py-3 rounded-xl"
                        style={{
                            background:
                                challengeToast.type === 'success'
                                    ? 'linear-gradient(135deg, #422006 0%, #1a1a2e 100%)'
                                    : 'linear-gradient(135deg, #1e1b4b 0%, #1a1a2e 100%)',
                            border:
                                challengeToast.type === 'success'
                                    ? '2px solid #f59e0b'
                                    : '2px solid #6366f1',
                            boxShadow:
                                challengeToast.type === 'success'
                                    ? '0 0 30px rgba(245, 158, 11, 0.5), 0 8px 20px rgba(0,0,0,0.4)'
                                    : '0 0 30px rgba(99, 102, 241, 0.5), 0 8px 20px rgba(0,0,0,0.4)',
                        }}
                    >
                        {challengeToast.type === 'success' ? (
                            <>
                                <span className="text-2xl">🎯</span>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-amber-400">
                                            +{challengeToast.score}
                                        </span>
                                        {challengeToast.combo > 1 && (
                                            <span className="text-sm font-bold text-orange-400">
                                                x{challengeToast.combo}{' '}
                                                {i18n.language === 'ko' ||
                                                i18n.language.startsWith('ko')
                                                    ? '콤보!'
                                                    : 'Combo!'}
                                            </span>
                                        )}
                                    </div>
                                    {challengeToast.insight && (
                                        <span className="text-xs text-amber-200/80 mt-1">
                                            {challengeToast.insight}
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-2xl">💡</span>
                                <span className="text-sm font-bold text-indigo-300">
                                    {challengeToast.hint}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom Controls Container */}
            <div
                className="absolute left-0 right-0 z-10 flex flex-col items-center gap-2 px-4"
                style={{
                    bottom: `calc(max(env(safe-area-inset-bottom, 0px), 8px) + ${isAdFree ? 12 : 110}px)`, // Above ad banner + remove ads button
                }}
            >
                {/* Shared Parameter Control - appears when card selected (disabled when locked) */}
                {selectedCard &&
                    !isCurrentFormulaLocked &&
                    (() => {
                        const selectedVar = formula.variables.find((v) => v.symbol === selectedCard)
                        const localizedVar = localizedVariables.find(
                            (v) => v.symbol === selectedCard
                        )
                        if (!selectedVar || selectedVar.role === 'output') return null
                        return (
                            <ParameterControl
                                symbol={selectedVar.symbol}
                                name={
                                    localizedVar?.localizedName ??
                                    localizeText(selectedVar.name, i18n.language)
                                }
                                value={variables[selectedVar.symbol] ?? selectedVar.default}
                                min={selectedVar.range[0]}
                                max={selectedVar.range[1]}
                                unit={selectedVar.unit}
                                color={selectedVar.visual.color}
                                onChange={(value) => setVariable(selectedVar.symbol, value)}
                            />
                        )
                    })()}

                {/* Formula Layout (disabled interaction when locked) */}
                <div
                    style={{
                        opacity: isCurrentFormulaLocked ? 0.5 : 1,
                        pointerEvents: isCurrentFormulaLocked ? 'none' : 'auto',
                    }}
                >
                    {formula.displayLayout ? (
                        <FormulaLayout
                            displayLayout={formula.displayLayout}
                            variables={formula.variables}
                            values={variables}
                            selectedCard={selectedCard}
                            onSelectCard={setSelectedCard}
                            highlightedSymbols={currentChallenge?.targetVariables}
                        />
                    ) : (
                        <div className="flex items-end gap-1.5">
                            {formula.variables.map((variable) => (
                                <div key={variable.symbol} className="text-white/50 text-sm">
                                    {variable.symbol}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AdMob Banner Area with Remove Ads button */}
            {!isAdFree && (
                <div
                    className="absolute left-0 right-0 z-10 flex flex-col items-center"
                    style={{
                        // 네이티브: 배너(~60px) 위에 버튼 배치 / 웹: 하단에 배치
                        bottom: `calc(max(env(safe-area-inset-bottom, 0px), 8px) + ${isNative ? 60 : 0}px)`,
                        paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                        paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                    }}
                >
                    {/* Remove Ads Button */}
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="mb-2 px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95"
                        style={{
                            background: 'rgba(0,0,0,0.5)',
                            color: 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                    >
                        {t('settings.removeAds', 'Remove Ads')}
                    </button>

                    {/* Web placeholder */}
                    {!isNative && (
                        <div
                            className="w-full max-w-[320px] h-[50px] rounded-lg flex items-center justify-center"
                            style={{
                                background: 'rgba(0,0,0,0.4)',
                                border: `2px dashed ${theme.border}`,
                            }}
                        >
                            <span className="text-white/30 text-xs font-bold">AD BANNER (WEB)</span>
                        </div>
                    )}
                </div>
            )}

            {/* Settings Modal */}
            <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

            {/* Formula List Dropdown (Top-down) */}
            {showFormulaList && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowFormulaList(false)}
                    />

                    {/* Dropdown Panel */}
                    <div
                        className="fixed left-0 right-0 z-40 animate-in slide-in-from-top duration-300"
                        style={{
                            top: 0,
                            paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
                            paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                            paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                        }}
                    >
                        <div
                            className="rounded-b-2xl overflow-hidden"
                            style={{
                                background: theme.bgPanel,
                                border: `3px solid ${theme.border}`,
                                borderTop: 'none',
                                boxShadow: `0 8px 0 ${theme.border}, 0 16px 40px rgba(0,0,0,0.5)`,
                                maxHeight: 'calc(100vh - 120px)',
                            }}
                        >
                            {/* Header with close button */}
                            <div
                                className="flex items-center justify-between px-4 py-3"
                                style={{ borderBottom: `2px solid ${theme.border}` }}
                            >
                                <div className="flex items-center gap-2">
                                    <ChevronDown className="h-5 w-5 text-white/50" />
                                    {/* Unseen count badge */}
                                    {(() => {
                                        const unseenCount = filteredFormulas.filter(
                                            (f) => !seenFormulas.has(f.id)
                                        ).length
                                        return unseenCount > 0 ? (
                                            <span
                                                className="px-2 py-0.5 text-xs font-bold rounded-full"
                                                style={{
                                                    background: '#ff6b6b',
                                                    color: 'white',
                                                    border: `1.5px solid ${theme.border}`,
                                                }}
                                            >
                                                {unseenCount} NEW
                                            </span>
                                        ) : null
                                    })()}
                                </div>
                                <button
                                    onClick={() => setShowFormulaList(false)}
                                    className="h-9 w-9 rounded-lg flex items-center justify-center transition-all active:scale-95"
                                    style={{
                                        background: theme.red,
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: `0 2px 0 ${theme.border}`,
                                    }}
                                >
                                    <X className="h-4 w-4 text-white" />
                                </button>
                            </div>

                            {/* Category Tabs */}
                            <div
                                className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
                                style={{ borderBottom: `2px solid ${theme.border}` }}
                            >
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95"
                                    style={{
                                        background:
                                            selectedCategory === 'all'
                                                ? theme.gold
                                                : theme.bgPanelLight,
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
                            <div
                                className="p-4 overflow-y-auto"
                                style={{ maxHeight: 'calc(100vh - 280px)' }}
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    {filteredFormulas.map((f) => {
                                        const fColor = categoryColors[f.category]
                                        const isSelected = f.id === formulaId
                                        const fName = localizeText(f.name, i18n.language)
                                        const isNew = !seenFormulas.has(f.id)
                                        const isLocked = !isAdFree && !isUnlocked(f.id)
                                        return (
                                            <div key={f.id} className="relative">
                                                <button
                                                    onClick={() => {
                                                        onFormulaChange(f)
                                                        setShowFormulaList(false)
                                                    }}
                                                    className="relative w-full text-left px-4 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{
                                                        background: isSelected
                                                            ? fColor
                                                            : isLocked
                                                              ? '#2a2a2a'
                                                              : theme.bgPanelLight,
                                                        border: `2px solid ${theme.border}`,
                                                        boxShadow: `0 3px 0 ${theme.border}`,
                                                        opacity: isLocked ? 0.7 : 1,
                                                    }}
                                                >
                                                    {/* NEW badge for unseen formulas */}
                                                    {isNew && !isSelected && !isLocked && (
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
                                                                color: isSelected
                                                                    ? '#000'
                                                                    : isLocked
                                                                      ? '#888'
                                                                      : 'white',
                                                            }}
                                                        >
                                                            {fName}
                                                        </span>
                                                    </div>
                                                </button>
                                                {/* Unlock condition badge for locked formulas */}
                                                {isLocked &&
                                                    (() => {
                                                        const cond = getUnlockCondition(f.id)
                                                        if (cond.type === 'prerequisite') {
                                                            const prereq =
                                                                formulaRegistry[cond.formulaId]
                                                            return (
                                                                <div
                                                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                                                    style={{
                                                                        background: theme.bgPanel,
                                                                        color: '#aaa',
                                                                        border: `1.5px solid ${theme.border}`,
                                                                    }}
                                                                >
                                                                    <Lock className="w-2.5 h-2.5" />
                                                                    {prereq &&
                                                                        localizeText(
                                                                            prereq.name,
                                                                            i18n.language
                                                                        )}
                                                                </div>
                                                            )
                                                        }
                                                        return (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleUnlockFormula(f.id)
                                                                }}
                                                                disabled={isRewardAdLoading}
                                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all active:scale-95"
                                                                style={{
                                                                    background: '#f59e0b',
                                                                    color: '#000',
                                                                    border: `1.5px solid ${theme.border}`,
                                                                    boxShadow: `0 1px 0 ${theme.border}`,
                                                                }}
                                                            >
                                                                <Lock className="w-2.5 h-2.5" />
                                                                {i18n.language === 'ko'
                                                                    ? '잠김'
                                                                    : 'Locked'}
                                                            </button>
                                                        )
                                                    })()}
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
                    </div>
                </>
            )}

            {/* Info Popup */}
            {showInfoPopup && formula.applications && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => {
                        setShowInfoPopup(false)
                        markAsReadInfo(formulaId)
                    }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Popup Content */}
                    <div
                        className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            background: theme.bgPanel,
                            border: `4px solid ${theme.border}`,
                            boxShadow: `0 6px 0 ${theme.border}, 0 12px 40px rgba(0,0,0,0.5)`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="px-5 py-4 flex items-center justify-between"
                            style={{
                                background: theme.blue,
                                borderBottom: `3px solid ${theme.border}`,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-white" />
                                <span className="text-lg font-black text-white">
                                    {t('simulation.info.title')}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    setShowInfoPopup(false)
                                    markAsReadInfo(formulaId)
                                }}
                                className="h-8 w-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
                                style={{
                                    background: theme.red,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 2px 0 ${theme.border}`,
                                }}
                            >
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>

                        {/* Formula Info */}
                        <div
                            className="px-5 py-4"
                            style={{ borderBottom: `2px solid ${theme.border}` }}
                        >
                            <div
                                className="inline-block px-3 py-1.5 rounded-lg mb-2"
                                style={{
                                    background: theme.gold,
                                    border: `2px solid ${theme.border}`,
                                }}
                            >
                                <span className="text-sm font-black text-black">
                                    {localizedFormula?.name}
                                </span>
                            </div>
                            <p className="text-white/70 text-sm">{localizedFormula?.description}</p>
                        </div>

                        {/* Applications List */}
                        <div className="px-5 py-4 space-y-3">
                            <span className="text-xs font-bold text-white/50 uppercase tracking-wide">
                                {t('simulation.info.applicationsLabel')}
                            </span>
                            <ul className="space-y-2">
                                {localizedFormula?.applications.map((app, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-3 p-3 rounded-lg"
                                        style={{
                                            background: theme.bgPanelLight,
                                            border: `2px solid ${theme.border}`,
                                        }}
                                    >
                                        <span
                                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                                            style={{
                                                background: theme.gold,
                                                color: theme.border,
                                            }}
                                        >
                                            {index + 1}
                                        </span>
                                        <span className="text-white text-sm leading-relaxed">
                                            {app}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Tutorial Overlay for simulation phase */}
            {tutorial.isActive && tutorial.tutorialPhase === 'simulation' && (
                <TutorialOverlay
                    steps={tutorial.steps}
                    currentStep={tutorial.currentStep}
                    onNext={tutorial.nextStep}
                    onSkip={tutorial.skipTutorial}
                    onComplete={tutorial.completeTutorial}
                    targetRect={targetRect}
                    sliderRect={sliderRect}
                />
            )}

            {/* Web Ad Simulation Overlay */}
            {webSimulationActive && (
                <div
                    className="fixed inset-0 flex items-center justify-center"
                    style={{
                        background: 'rgba(0,0,0,0.95)',
                        zIndex: 9999,
                    }}
                >
                    <div
                        className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
                        style={{
                            background: theme.bgPanel,
                            border: `4px solid ${theme.border}`,
                            boxShadow: `0 6px 0 ${theme.border}, 0 12px 40px rgba(0,0,0,0.5)`,
                        }}
                    >
                        {/* Ad Header */}
                        <div
                            className="px-4 py-3 flex items-center justify-between"
                            style={{
                                background: theme.gold,
                                borderBottom: `3px solid ${theme.border}`,
                            }}
                        >
                            <span className="text-sm font-black text-black uppercase tracking-wide">
                                {i18n.language === 'ko' ? '광고 시청' : 'Watch Ad'}
                            </span>
                            <button
                                onClick={cancelWebSimulation}
                                className="h-7 w-7 rounded-lg flex items-center justify-center transition-all active:scale-95"
                                style={{
                                    background: theme.red,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 2px 0 ${theme.border}`,
                                }}
                            >
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>

                        {/* Ad Content Area */}
                        <div
                            className="p-6 flex flex-col items-center gap-4"
                            style={{ background: '#1a1a2e' }}
                        >
                            {/* Fake Ad Visual */}
                            <div
                                className="w-full aspect-video rounded-xl flex items-center justify-center relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, #2d5a4a 0%, #1a4035 100%)',
                                    border: `3px solid ${theme.border}`,
                                }}
                            >
                                {/* Animated Background Pattern */}
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        backgroundImage:
                                            'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)',
                                        animation: 'slide 20s linear infinite',
                                    }}
                                />
                                <div className="relative text-center">
                                    <div className="text-4xl font-black text-white/20 mb-2">AD</div>
                                    <div className="text-xs text-white/40">
                                        {i18n.language === 'ko'
                                            ? '테스트 광고'
                                            : 'Test Advertisement'}
                                    </div>
                                </div>
                            </div>

                            {/* Countdown / Complete Button */}
                            {webAdCountdown > 0 ? (
                                <div className="text-center">
                                    <div
                                        className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2"
                                        style={{
                                            background: theme.bgPanelLight,
                                            border: `3px solid ${theme.border}`,
                                        }}
                                    >
                                        <span className="text-2xl font-black text-white">
                                            {webAdCountdown}
                                        </span>
                                    </div>
                                    <p className="text-white/50 text-sm">
                                        {i18n.language === 'ko'
                                            ? '잠시 후 보상을 받을 수 있어요'
                                            : 'Reward available soon'}
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={completeWebSimulation}
                                    className="w-full py-4 rounded-xl font-black text-lg transition-all active:scale-95"
                                    style={{
                                        background: theme.gold,
                                        color: 'black',
                                        border: `3px solid ${theme.border}`,
                                        boxShadow: `0 4px 0 ${theme.border}`,
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Unlock className="w-5 h-5" />
                                        {i18n.language === 'ko' ? '보상 받기' : 'Claim Reward'}
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Marquee Animation Styles */}
            <style>{`
                @keyframes marquee-scroll {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                @keyframes slide {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(40px); }
                }
            `}</style>
        </div>
    )
}
