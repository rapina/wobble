import { useTranslation } from 'react-i18next'
import { BookOpen, Home, RotateCcw } from 'lucide-react'
import { getFormula } from '@/formulas/registry'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { cn } from '@/lib/utils'

interface FormulaExplanationProps {
    formulaIds: string[]
    onBack: () => void
    onPlayAgain: () => void
}

export function FormulaExplanation({ formulaIds, onBack, onPlayAgain }: FormulaExplanationProps) {
    const { i18n } = useTranslation()
    const isKorean = i18n.language === 'ko'

    const formulas = formulaIds.map((id) => getFormula(id)).filter((f) => f !== undefined)

    if (formulas.length === 0) {
        // No formulas to show, go back
        onBack()
        return null
    }

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto">
            {/* Solid dark background */}
            <div
                className="absolute inset-0"
                style={{
                    background: '#0a0a12',
                }}
            />

            {/* Content */}
            <div
                className="relative z-10 flex flex-col items-center w-full max-w-md px-6 py-8"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 24px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
                }}
            >
                {/* Header with Wobi */}
                <div className="flex items-center gap-3 mb-6">
                    <WobbleDisplay size={50} shape="circle" expression="happy" />
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {isKorean ? '오늘 배운 공식' : 'Physics You Used'}
                        </h2>
                        <p className="text-white/60 text-sm">
                            {isKorean
                                ? '방금 미니게임에서 사용된 공식이에요!'
                                : 'These formulas powered your game!'}
                        </p>
                    </div>
                </div>

                {/* Formula cards */}
                <div className="w-full space-y-4 mb-8">
                    {formulas.map((formula) => (
                        <div
                            key={formula.id}
                            className="p-4 rounded-xl bg-white/10 border border-white/20"
                        >
                            {/* Formula name */}
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                                <h3 className="text-white font-semibold">
                                    {isKorean ? formula.name : formula.nameEn}
                                </h3>
                            </div>

                            {/* Expression */}
                            <div
                                className="mb-3 px-4 py-2 rounded-lg bg-black/30 text-center"
                                style={{
                                    fontFamily: 'ui-monospace, monospace',
                                }}
                            >
                                <span className="text-2xl font-bold text-yellow-400">
                                    {formula.expression}
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-white/70 text-sm">
                                {isKorean ? formula.description : formula.descriptionEn}
                            </p>

                            {/* Application hint */}
                            {formula.applications && formula.applications.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <p className="text-white/50 text-xs mb-1">
                                        {isKorean ? '실생활 적용' : 'Real-world use'}
                                    </p>
                                    <p className="text-white/60 text-sm">
                                        {isKorean
                                            ? formula.applications[0]
                                            : formula.applicationsEn?.[0] ||
                                              formula.applications[0]}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onBack}
                        className={cn(
                            'flex items-center gap-2 px-5 py-3 rounded-xl',
                            'bg-white/10 border border-white/20',
                            'text-white font-semibold',
                            'transition-all duration-200',
                            'hover:bg-white/20 active:scale-95'
                        )}
                    >
                        <Home className="w-5 h-5" />
                        <span>{isKorean ? '메뉴로' : 'Menu'}</span>
                    </button>

                    <button
                        onClick={onPlayAgain}
                        className={cn(
                            'flex items-center gap-2 px-6 py-3 rounded-xl',
                            'bg-blue-500 border-2 border-blue-600',
                            'text-white font-bold',
                            'transition-all duration-200',
                            'hover:bg-blue-400 active:scale-95',
                            'shadow-lg shadow-blue-500/30'
                        )}
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>{isKorean ? '다시 하기' : 'Play Again'}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
