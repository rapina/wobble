import { useState, useEffect, useMemo } from 'react';
import { PixiCanvas } from '../canvas/PixiCanvas';
import { ParameterControl } from '../controls/ParameterControl';
import { FormulaLayout } from '../controls/FormulaLayout';
import { useSimulation } from '../../hooks/useSimulation';
import { useAdMob } from '../../hooks/useAdMob';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ArrowLeft, List, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Formula, FormulaCategory } from '../../formulas/types';
import Balatro from '@/components/Balatro';

// Balatro-inspired color palette
const categoryConfig: Record<FormulaCategory, { color: string }> = {
    mechanics: { color: '#f8b862' },
    wave: { color: '#6ecff6' },
    gravity: { color: '#c792ea' },
    thermodynamics: { color: '#ff6b6b' },
    electricity: { color: '#69f0ae' },
    special: { color: '#ffd700' },
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
    const { formula, variables, inputVariables, setVariable } = useSimulation(formulaId);
    const { isInitialized, isBannerVisible, showBanner, hideBanner, isNative } = useAdMob();
    const [mounted, setMounted] = useState(false);
    const [showFormulaList, setShowFormulaList] = useState(false);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [showInfoPopup, setShowInfoPopup] = useState(false);

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

    if (!formula) {
        return (
            <div className="flex justify-center items-center h-full" style={{ background: theme.bg }}>
                <div className="animate-pulse text-white/50">Loading...</div>
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
                                {formula.name}
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
                    if (!selectedVar || selectedVar.role === 'output') return null;
                    return (
                        <ParameterControl
                            symbol={selectedVar.symbol}
                            name={selectedVar.name}
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

            {/* Formula List Bottom Sheet */}
            {showFormulaList && (
                <BottomSheet
                    snapPoints={{ collapsed: 400, half: 400, expanded: 600 }}
                    defaultSnap="collapsed"
                    onSnapChange={(snap) => {
                        if (snap === 'collapsed') setShowFormulaList(false);
                    }}
                    accentColor={theme.gold}
                    header={
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-black text-white">
                                공식 목록
                            </span>
                            <button
                                onClick={() => setShowFormulaList(false)}
                                className="h-10 w-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: theme.red,
                                    border: `3px solid ${theme.border}`,
                                    boxShadow: `0 4px 0 ${theme.border}`,
                                }}
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    }
                >
                    <div className="grid grid-cols-2 gap-4">
                        {formulas.map((f) => {
                            const fConfig = categoryConfig[f.category];
                            const isSelected = f.id === formulaId;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => {
                                        onFormulaChange(f);
                                        setShowFormulaList(false);
                                    }}
                                    className="text-left px-5 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                        background: isSelected ? fConfig.color : theme.bgPanelLight,
                                        border: `3px solid ${theme.border}`,
                                        boxShadow: `0 4px 0 ${theme.border}`,
                                    }}
                                >
                                    <span
                                        className="block text-sm font-black truncate"
                                        style={{
                                            color: isSelected ? '#000' : 'white',
                                        }}
                                    >
                                        {f.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </BottomSheet>
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
                                    어디에 쓰일까?
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
                                    {formula.name}
                                </span>
                            </div>
                            <p className="text-white/70 text-sm">
                                {formula.description}
                            </p>
                        </div>

                        {/* Applications List */}
                        <div className="px-5 py-4 space-y-3">
                            <span className="text-xs font-bold text-white/50 uppercase tracking-wide">
                                실생활 활용 예시
                            </span>
                            <ul className="space-y-2">
                                {formula.applications.map((app, index) => (
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
        </div>
    );
}
