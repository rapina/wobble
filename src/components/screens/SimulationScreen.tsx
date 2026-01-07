import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PixiCanvas } from '../canvas/PixiCanvas';
import { ParameterControl } from '../controls/ParameterControl';
import { FormulaLayout } from '../controls/FormulaLayout';
import { useSimulation } from '../../hooks/useSimulation';
import { useAdMob } from '../../hooks/useAdMob';
import { useLocalizedFormula, useLocalizedVariables } from '../../hooks/useLocalizedFormula';
import { useTutorial } from '../../hooks/useTutorial';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';
import { ArrowLeft, List, X, Info, ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Formula, FormulaCategory } from '../../formulas/types';
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
    const localizedFormula = useLocalizedFormula(formula);
    const localizedVariables = useLocalizedVariables(formula?.variables ?? []);
    const [mounted, setMounted] = useState(false);
    const [showFormulaList, setShowFormulaList] = useState(false);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [showInfoPopup, setShowInfoPopup] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<FormulaCategory | 'all'>('all');
    const [seenFormulas, setSeenFormulas] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('wobble-seen-formulas');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [sliderRect, setSliderRect] = useState<DOMRect | null>(null);

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

    // Auto-start tutorial for first-time users
    useEffect(() => {
        if (formula && !tutorial.hasCompletedTutorial && !tutorial.isActive) {
            const timer = setTimeout(() => {
                tutorial.startTutorial();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [formula?.id]);

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

    // Show AdMob banner when initialized
    useEffect(() => {
        if (isInitialized && !isBannerVisible) {
            showBanner();
        }
        return () => {
            if (isBannerVisible) {
                hideBanner();
            }
        };
    }, [isInitialized]);

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

    // Auto-show info popup for formulas not seen before
    useEffect(() => {
        if (formula?.applications && formula.applications.length > 0 && !seenFormulas.has(formulaId)) {
            const timer = setTimeout(() => setShowInfoPopup(true), 300);
            return () => clearTimeout(timer);
        }
    }, [formulaId]);

    // Mark formula as seen
    const markAsSeen = (id: string) => {
        const newSeen = new Set(seenFormulas);
        newSeen.add(id);
        setSeenFormulas(newSeen);
        localStorage.setItem('wobble-seen-formulas', JSON.stringify([...newSeen]));
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
                    bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 210px)', // +50px for ad banner
                    border: `3px solid ${theme.border}`,
                    boxShadow: `0 6px 0 ${theme.border}, 0 10px 30px rgba(0,0,0,0.5)`,
                }}
                onClick={() => setSelectedCard(null)}
            >
                <PixiCanvas formulaId={formulaId} variables={variables} />
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
                </div>
            </div>

            {/* Bottom Controls Container */}
            <div
                className="absolute left-0 right-0 z-10 flex flex-col items-center gap-3 px-4"
                style={{
                    bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 58px)', // Above ad banner
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

            {/* AdMob Banner Area - Native shows real ads, Web shows placeholder */}
            {!isNative && (
                <div
                    className="absolute left-0 right-0 z-10 flex items-center justify-center"
                    style={{
                        bottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
                        height: '50px',
                        paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                        paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                    }}
                >
                    <div
                        className="w-full max-w-[320px] h-[50px] rounded-lg flex items-center justify-center"
                        style={{
                            background: 'rgba(0,0,0,0.4)',
                            border: `2px dashed ${theme.border}`,
                        }}
                    >
                        <span className="text-white/30 text-xs font-bold">AD BANNER (WEB)</span>
                    </div>
                </div>
            )}

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
                                        return (
                                            <button
                                                key={f.id}
                                                onClick={() => {
                                                    onFormulaChange(f);
                                                    setShowFormulaList(false);
                                                }}
                                                className="text-left px-4 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                style={{
                                                    background: isSelected ? fColor : theme.bgPanelLight,
                                                    border: `2px solid ${theme.border}`,
                                                    boxShadow: `0 3px 0 ${theme.border}`,
                                                }}
                                            >
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
                        {!seenFormulas.has(formulaId) && (
                            <div
                                className="px-5 py-3"
                                style={{
                                    borderTop: `2px solid ${theme.border}`,
                                    background: 'rgba(0,0,0,0.2)',
                                }}
                            >
                                <button
                                    onClick={() => {
                                        markAsSeen(formulaId);
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
