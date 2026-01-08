import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PixiCanvas, PixiCanvasHandle } from '../canvas/PixiCanvas';
import { ParameterControl } from '../controls/ParameterControl';
import { FormulaLayout } from '../controls/FormulaLayout';
import { useSimulation } from '../../hooks/useSimulation';
import { useAdMob } from '../../hooks/useAdMob';
import { useLocalizedFormula, useLocalizedVariables } from '../../hooks/useLocalizedFormula';
import { useTutorial } from '../../hooks/useTutorial';
import { usePurchaseStore } from '@/stores/purchaseStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { useProgressStore } from '@/stores/progressStore';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';
import { SettingsModal } from '../ui/SettingsModal';
import { ArrowLeft, List, X, Info, ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Formula, FormulaCategory } from '../../formulas/types';
import { WobbleShape } from '../canvas/Wobble';
import Balatro from '@/components/Balatro';

// Balatro-inspired color palette
const categoryColors: Record<FormulaCategory, string> = {
    mechanics: '#f8b862',
    wave: '#6ecff6',
    gravity: '#c792ea',
    thermodynamics: '#ff6b6b',
    electricity: '#69f0ae',
    special: '#ffd700',
};

// Balatro theme
const theme = {
    bg: '#3d6b59',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
    red: '#e85d4c',
    blue: '#4a9eff',
};

interface SimulationScreenProps {
    formulaId: string;
    formulas: Formula[];
    onFormulaChange: (formula: Formula) => void;
    onBack: () => void;
}

export function SimulationScreen({
    formulaId,
    formulas,
    onFormulaChange,
    onBack,
}: SimulationScreenProps) {
    const { t, i18n } = useTranslation();
    const { formula, variables, inputVariables, setVariable } = useSimulation(formulaId);
    const { isInitialized, isBannerVisible, showBanner, hideBanner, isNative } = useAdMob();
    const { isAdFree } = usePurchaseStore();
    const { unlockByFormula, getNewUnlocksForFormula } = useCollectionStore();
    const { studyFormula } = useProgressStore();
    const localizedFormula = useLocalizedFormula(formula);
    const localizedVariables = useLocalizedVariables(formula?.variables ?? []);
    const [mounted, setMounted] = useState(false);
    const [showFormulaList, setShowFormulaList] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [showInfoPopup, setShowInfoPopup] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<FormulaCategory | 'all'>('all');
    const [seenFormulas, setSeenFormulas] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('wobble-seen-formulas');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [dontShowInfoFormulas, setDontShowInfoFormulas] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('wobble-dont-show-info-formulas');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [sliderRect, setSliderRect] = useState<DOMRect | null>(null);
    const [pendingNewWobbles, setPendingNewWobbles] = useState<WobbleShape[]>([]);
    const [tutorialShownThisSession, setTutorialShownThisSession] = useState(false);
    const [discoveryShownThisSession, setDiscoveryShownThisSession] = useState(false);
    const canvasRef = useRef<PixiCanvasHandle>(null);

    // Tutorial hook
    const tutorial = useTutorial({
        formulaId,
        variables: formula?.variables ?? [],
        onSelectCard: setSelectedCard,
    });

    // Update target rect when tutorial step changes
    useEffect(() => {
        if (!tutorial.isActive || !tutorial.currentTargetSymbol) {
            setTargetRect(null);
            setSliderRect(null);
            return;
        }

        // Small delay to let DOM update
        const timer = setTimeout(() => {
            const cardEl = document.querySelector(
                `[data-tutorial-symbol="${tutorial.currentTargetSymbol}"]`
            );
            const sliderEl = document.querySelector(
                `[data-tutorial-slider="${tutorial.currentTargetSymbol}"]`
            );

            if (cardEl) {
                setTargetRect(cardEl.getBoundingClientRect());
            }
            if (sliderEl) {
                setSliderRect(sliderEl.getBoundingClientRect());
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [tutorial.isActive, tutorial.currentTargetSymbol, selectedCard]);

    // Track if info popup was shown for this formula
    const [infoPopupShownOnce, setInfoPopupShownOnce] = useState(false);

    // Reset info popup tracking when formula changes
    useEffect(() => {
        setInfoPopupShownOnce(false);
    }, [formulaId]);

    // Track when info popup is shown
    useEffect(() => {
        if (showInfoPopup) {
            setInfoPopupShownOnce(true);
        }
    }, [showInfoPopup]);

    // Track when tutorial becomes active (to prevent auto-restart)
    useEffect(() => {
        if (tutorial.isActive) {
            setTutorialShownThisSession(true);
        }
    }, [tutorial.isActive]);

    // Auto-start tutorial for first-time users (after info popup is closed)
    useEffect(() => {
        // Check if info popup needs to be shown for this formula
        const needsInfoPopup = formula?.applications && formula.applications.length > 0 && !dontShowInfoFormulas.has(formulaId);

        // Don't start if tutorial already completed globally, active, or shown this session
        if (!formula || tutorial.hasCompletedTutorial || tutorial.isActive || tutorialShownThisSession) return;

        // Don't start if info popup is currently showing
        if (showInfoPopup) return;

        // If info popup was needed but hasn't been shown yet, wait
        if (needsInfoPopup && !infoPopupShownOnce) return;

        const timer = setTimeout(() => {
            tutorial.startTutorial();
        }, 500);
        return () => clearTimeout(timer);
    }, [formula, formulaId, showInfoPopup, infoPopupShownOnce, dontShowInfoFormulas, tutorial.hasCompletedTutorial, tutorial.isActive, tutorialShownThisSession]);

    // Get unique categories from formulas
    const categories = useMemo(() => {
        const cats = [...new Set(formulas.map(f => f.category))];
        return cats.sort();
    }, [formulas]);

    // Filter formulas by category
    const filteredFormulas = useMemo(() => {
        if (selectedCategory === 'all') return formulas;
        return formulas.filter(f => f.category === selectedCategory);
    }, [formulas, selectedCategory]);

    // Show AdMob banner when initialized (unless ad-free)
    useEffect(() => {
        if (isInitialized && !isBannerVisible && !isAdFree) {
            showBanner();
        }
        return () => {
            if (isBannerVisible) {
                hideBanner();
            }
        };
    }, [isInitialized, isAdFree]);

    // Memoize Balatro background to prevent re-render on variable changes
    const balatroBackground = useMemo(() => (
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
    ), []);

    useEffect(() => {
        setMounted(false);
        const timer = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(timer);
    }, [formulaId]);

    // Check for new wobbles and unlock when formula is used
    useEffect(() => {
        if (formulaId) {
            const newWobbles = getNewUnlocksForFormula(formulaId);
            if (newWobbles.length > 0) {
                setPendingNewWobbles(newWobbles);
                unlockByFormula(formulaId);
            }
        }
    }, [formulaId, unlockByFormula, getNewUnlocksForFormula]);

    // Show new wobble discovery in scene after tutorial completes
    useEffect(() => {
        // Don't show if no pending wobbles or already shown
        if (pendingNewWobbles.length === 0 || discoveryShownThisSession) return;

        // Don't show if info popup is currently showing
        if (showInfoPopup) return;

        // Don't show if tutorial is active
        if (tutorial.isActive) return;

        // Check if info popup needs to be shown
        const needsInfoPopup = formula?.applications && formula.applications.length > 0 && !dontShowInfoFormulas.has(formulaId);
        if (needsInfoPopup && !infoPopupShownOnce) return;

        // Check if tutorial has been handled (either completed globally or shown this session)
        const tutorialHandled = tutorial.hasCompletedTutorial || tutorialShownThisSession;
        // If tutorial still needs to run and not currently active, wait
        if (!tutorialHandled && !tutorial.isActive) return;

        // All conditions met - show discovery in scene
        const timer = setTimeout(() => {
            if (canvasRef.current) {
                setDiscoveryShownThisSession(true);
                canvasRef.current.showNewWobbleDiscovery(
                    pendingNewWobbles,
                    i18n.language === 'ko',
                    () => setPendingNewWobbles([])
                );
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [pendingNewWobbles, discoveryShownThisSession, showInfoPopup, tutorial.isActive, tutorial.hasCompletedTutorial, tutorialShownThisSession, infoPopupShownOnce, dontShowInfoFormulas, formulaId, formula?.applications, i18n.language]);

    // Auto-show info popup for formulas where user hasn't clicked "don't show again"
    useEffect(() => {
        if (formula?.applications && formula.applications.length > 0 && !dontShowInfoFormulas.has(formulaId)) {
            const timer = setTimeout(() => setShowInfoPopup(true), 300);
            return () => clearTimeout(timer);
        }
    }, [formula, formulaId, dontShowInfoFormulas]);

    // Mark formula as seen and studied when viewed
    useEffect(() => {
        if (formulaId && !seenFormulas.has(formulaId)) {
            // Small delay to ensure it's intentionally viewed
            const timer = setTimeout(() => {
                markAsSeen(formulaId);
                studyFormula(formulaId); // Record as studied for minigame unlocks
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [formulaId, studyFormula]);

    // Mark formula as seen (for NEW badge)
    const markAsSeen = (id: string) => {
        const newSeen = new Set(seenFormulas);
        newSeen.add(id);
        setSeenFormulas(newSeen);
        localStorage.setItem('wobble-seen-formulas', JSON.stringify([...newSeen]));
    };

    // Mark formula as "don't show info popup again"
    const markAsDontShowInfo = (id: string) => {
        const newSet = new Set(dontShowInfoFormulas);
        newSet.add(id);
        setDontShowInfoFormulas(newSet);
        localStorage.setItem('wobble-dont-show-info-formulas', JSON.stringify([...newSet]));
    };

    if (!formula) {
        return (
            <div className="flex justify-center items-center h-full" style={{ background: theme.bg }}>
                <div className="animate-pulse text-white/50">{t('simulation.loading')}</div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative w-full h-full overflow-hidden",
                "transition-opacity duration-300",
                mounted ? "opacity-100" : "opacity-0"
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
                    top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 56px)',
                    left: 'max(env(safe-area-inset-left, 0px), 12px)',
                    right: 'max(env(safe-area-inset-right, 0px), 12px)',
                    bottom: `calc(max(env(safe-area-inset-bottom, 0px), 8px) + ${isAdFree ? 164 : 262}px)`, // +24px for remove ads button spacing
                    border: `3px solid ${theme.border}`,
                    boxShadow: `0 6px 0 ${theme.border}, 0 10px 30px rgba(0,0,0,0.5)`,
                }}
                onClick={() => setSelectedCard(null)}
            >
                <PixiCanvas ref={canvasRef} formulaId={formulaId} variables={variables} />
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

                        {/* Info Button */}
                        {formula.applications && formula.applications.length > 0 && (
                            <button
                                onClick={() => setShowInfoPopup(true)}
                                className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95"
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
                            const totalUnseen = formulas.filter(f => !seenFormulas.has(f.id)).length;
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
                            ) : null;
                        })()}
                    </div>
                </div>
            </div>

            {/* Bottom Controls Container */}
            <div
                className="absolute left-0 right-0 z-10 flex flex-col items-center gap-3 px-4"
                style={{
                    bottom: `calc(max(env(safe-area-inset-bottom, 0px), 8px) + ${isAdFree ? 12 : 110}px)`, // Above ad banner + remove ads button
                }}
            >
                {/* Shared Parameter Control - appears when card selected */}
                {selectedCard && (() => {
                    const selectedVar = formula.variables.find(v => v.symbol === selectedCard);
                    const localizedVar = localizedVariables.find(v => v.symbol === selectedCard);
                    if (!selectedVar || selectedVar.role === 'output') return null;
                    return (
                        <ParameterControl
                            symbol={selectedVar.symbol}
                            name={localizedVar?.localizedName ?? selectedVar.name}
                            value={variables[selectedVar.symbol] ?? selectedVar.default}
                            min={selectedVar.range[0]}
                            max={selectedVar.range[1]}
                            unit={selectedVar.unit}
                            color={selectedVar.visual.color}
                            onChange={(value) => setVariable(selectedVar.symbol, value)}
                        />
                    );
                })()}

                {/* Formula Layout */}
                {formula.displayLayout ? (
                    <FormulaLayout
                        displayLayout={formula.displayLayout}
                        variables={formula.variables}
                        values={variables}
                        selectedCard={selectedCard}
                        onSelectCard={setSelectedCard}
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
            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />

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
                                        const unseenCount = filteredFormulas.filter(f => !seenFormulas.has(f.id)).length;
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
                                        ) : null;
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
                                        background: selectedCategory === 'all' ? theme.gold : theme.bgPanelLight,
                                        color: selectedCategory === 'all' ? '#000' : '#fff',
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: `0 2px 0 ${theme.border}`,
                                    }}
                                >
                                    {t('simulation.categories.all')}
                                </button>
                                {categories.map((cat) => {
                                    const color = categoryColors[cat];
                                    const isActive = selectedCategory === cat;
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
                                    );
                                })}
                            </div>

                            {/* Formula Grid */}
                            <div
                                className="p-4 overflow-y-auto"
                                style={{ maxHeight: 'calc(100vh - 280px)' }}
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    {filteredFormulas.map((f) => {
                                        const fColor = categoryColors[f.category];
                                        const isSelected = f.id === formulaId;
                                        const fName = i18n.language === 'en' && f.nameEn ? f.nameEn : f.name;
                                        const isNew = !seenFormulas.has(f.id);
                                        return (
                                            <button
                                                key={f.id}
                                                onClick={() => {
                                                    onFormulaChange(f);
                                                    setShowFormulaList(false);
                                                }}
                                                className="relative text-left px-4 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                style={{
                                                    background: isSelected ? fColor : theme.bgPanelLight,
                                                    border: `2px solid ${theme.border}`,
                                                    boxShadow: `0 3px 0 ${theme.border}`,
                                                }}
                                            >
                                                {/* NEW badge for unseen formulas */}
                                                {isNew && !isSelected && (
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
                                                    <span
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ background: fColor }}
                                                    />
                                                    <span
                                                        className="block text-sm font-bold truncate"
                                                        style={{
                                                            color: isSelected ? '#000' : 'white',
                                                        }}
                                                    >
                                                        {fName}
                                                    </span>
                                                </div>
                                            </button>
                                        );
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
                    onClick={() => setShowInfoPopup(false)}
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
                                onClick={() => setShowInfoPopup(false)}
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
                        <div className="px-5 py-4" style={{ borderBottom: `2px solid ${theme.border}` }}>
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
                            <p className="text-white/70 text-sm">
                                {localizedFormula?.description}
                            </p>
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

                        {/* Don't show again option */}
                        {!dontShowInfoFormulas.has(formulaId) && (
                            <div
                                className="px-5 py-3"
                                style={{
                                    borderTop: `2px solid ${theme.border}`,
                                    background: 'rgba(0,0,0,0.2)',
                                }}
                            >
                                <button
                                    onClick={() => {
                                        markAsDontShowInfo(formulaId);
                                        setShowInfoPopup(false);
                                    }}
                                    className="w-full py-2 rounded-lg text-white/50 text-xs transition-all active:scale-95 hover:text-white/70"
                                    style={{
                                        background: theme.bgPanelLight,
                                        border: `2px solid ${theme.border}`,
                                    }}
                                >
                                    {t('simulation.info.dontShowAgain')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tutorial Overlay */}
            {tutorial.isActive && (
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
    );
}
