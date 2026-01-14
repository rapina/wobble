import { DisplayLayout, Variable, ExpressionElement } from '../../formulas/types'
import { ParameterCard } from './ParameterCard'
import { OutputCard } from './OutputCard'

const theme = {
    gold: '#c9a227',
    border: '#1a1a1a',
}

interface FormulaLayoutProps {
    displayLayout: DisplayLayout
    variables: Variable[]
    values: Record<string, number>
    selectedCard: string | null
    onSelectCard: (symbol: string | null) => void
    highlightedSymbols?: string[] // Symbols to highlight for challenges
}

export function FormulaLayout({
    displayLayout,
    variables,
    values,
    selectedCard,
    onSelectCard,
    highlightedSymbols = [],
}: FormulaLayoutProps) {
    const isHighlighted = (symbol: string) => highlightedSymbols.includes(symbol)
    const getVariable = (symbol: string) => variables.find((v) => v.symbol === symbol)
    const outputVar = getVariable(displayLayout.output)

    const renderCard = (symbol: string, showSquare?: boolean, compact?: boolean) => {
        const variable = getVariable(symbol)
        if (!variable) return null
        const highlighted = isHighlighted(symbol)

        if (variable.role === 'output') {
            return (
                <div
                    key={symbol}
                    className={highlighted ? 'relative' : ''}
                    style={highlighted ? {
                        animation: 'challenge-pulse 1.5s ease-in-out infinite',
                    } : undefined}
                >
                    {highlighted && (
                        <div
                            className="absolute -inset-1 rounded-xl opacity-60"
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                filter: 'blur(4px)',
                                animation: 'challenge-glow 1.5s ease-in-out infinite',
                            }}
                        />
                    )}
                    <div className="relative">
                        <OutputCard
                            variables={[
                                {
                                    symbol: showSquare ? `${variable.symbol}` : variable.symbol,
                                    name: variable.name,
                                    unit: variable.unit,
                                    color: variable.visual.color,
                                },
                            ]}
                            values={values}
                            compact={compact}
                        />
                    </div>
                </div>
            )
        }

        return (
            <div
                key={symbol}
                className="relative"
                style={highlighted ? {
                    animation: 'challenge-pulse 1.5s ease-in-out infinite',
                } : undefined}
            >
                {highlighted && (
                    <div
                        className="absolute -inset-1 rounded-xl opacity-60"
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                            filter: 'blur(4px)',
                            animation: 'challenge-glow 1.5s ease-in-out infinite',
                        }}
                    />
                )}
                <div className="relative">
                    <ParameterCard
                        symbol={variable.symbol}
                        name={variable.name}
                        value={values[variable.symbol] ?? variable.default}
                        unit={variable.unit}
                        color={variable.visual.color}
                        isSelected={selectedCard === variable.symbol}
                        onSelect={() =>
                            onSelectCard(selectedCard === variable.symbol ? null : variable.symbol)
                        }
                        compact={compact}
                    />
                </div>
                {showSquare && (
                    <span
                        className="absolute -top-1 -right-1 text-xs font-black z-10"
                        style={{ color: theme.gold }}
                    >
                        2
                    </span>
                )}
            </div>
        )
    }

    const renderOperator = (op: string, small?: boolean) => (
        <div
            className={`${small ? 'text-sm' : 'text-xl'} font-black select-none flex items-center justify-center px-0.5`}
            style={{
                color: theme.gold,
                textShadow: `0 2px 0 ${theme.border}`,
            }}
        >
            {op}
        </div>
    )

    const isSquare = (symbol: string) => displayLayout.squares?.includes(symbol)

    // Render expression element recursively (for custom layout)
    const renderExpression = (
        element: ExpressionElement,
        index: number,
        compact?: boolean
    ): React.ReactNode => {
        switch (element.type) {
            case 'var':
                return (
                    <div key={index} className="flex items-center">
                        {renderCard(element.symbol, element.square, compact)}
                    </div>
                )
            case 'op':
                return <div key={index}>{renderOperator(element.value, compact)}</div>
            case 'text':
                return (
                    <div
                        key={index}
                        className={`${compact ? 'text-sm' : 'text-lg'} font-black select-none`}
                        style={{ color: theme.gold }}
                    >
                        {element.value}
                    </div>
                )
            case 'group':
                return (
                    <div key={index} className="flex items-center">
                        <span
                            className={`${compact ? 'text-xl' : 'text-2xl'} font-light select-none`}
                            style={{ color: theme.gold }}
                        >
                            (
                        </span>
                        <div className="flex items-center gap-0.5">
                            {element.items.map((item, i) => renderExpression(item, i, compact))}
                        </div>
                        <span
                            className={`${compact ? 'text-xl' : 'text-2xl'} font-light select-none`}
                            style={{ color: theme.gold }}
                        >
                            )
                        </span>
                    </div>
                )
            case 'fraction':
                return (
                    <div key={index} className="flex flex-col items-center mx-1">
                        <div className="flex items-center gap-0.5">
                            {element.numerator.map((item, i) => renderExpression(item, i, true))}
                        </div>
                        <div
                            className="w-full h-[2px] my-0.5 rounded-full min-w-[40px]"
                            style={{ background: theme.gold }}
                        />
                        <div className="flex items-center gap-0.5">
                            {element.denominator.map((item, i) => renderExpression(item, i, true))}
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    // Custom layout: render expression array
    if (displayLayout.type === 'custom' && displayLayout.expression) {
        return (
            <div className="flex items-center gap-0.5">
                {outputVar && renderCard(displayLayout.output)}
                {renderOperator('=')}
                {displayLayout.expression.map((element, index) => renderExpression(element, index))}
            </div>
        )
    }

    // Linear layout: output = a × b × c
    if (displayLayout.type === 'linear') {
        return (
            <div className="flex items-center gap-1">
                {outputVar && renderCard(displayLayout.output)}
                {renderOperator('=')}
                {displayLayout.coefficient && (
                    <div className="text-lg font-black select-none" style={{ color: theme.gold }}>
                        {displayLayout.coefficient}
                    </div>
                )}
                {displayLayout.numerator?.map((symbol, i) => (
                    <div key={symbol} className="flex items-center gap-1">
                        {renderCard(symbol, isSquare(symbol))}
                        {i < (displayLayout.numerator?.length ?? 0) - 1 && renderOperator('×')}
                    </div>
                ))}
            </div>
        )
    }

    // Fraction layout: output = numerator / denominator
    if (displayLayout.type === 'fraction' || displayLayout.type === 'fraction-square') {
        return (
            <div className="flex items-center gap-1.5">
                {outputVar && renderCard(displayLayout.output)}
                {renderOperator('=')}
                {displayLayout.coefficient && (
                    <div className="text-lg font-black select-none" style={{ color: theme.gold }}>
                        {displayLayout.coefficient}
                    </div>
                )}
                <div className="flex flex-col items-center">
                    {/* Numerator */}
                    <div className="flex items-center gap-1 min-h-[40px]">
                        {(displayLayout.numerator?.length ?? 0) > 0 ? (
                            displayLayout.numerator?.map((symbol, i) => (
                                <div key={symbol} className="flex items-center gap-1">
                                    {renderCard(symbol, isSquare(symbol))}
                                    {i < (displayLayout.numerator?.length ?? 0) - 1 &&
                                        renderOperator('×')}
                                </div>
                            ))
                        ) : (
                            <div
                                className="text-2xl font-black italic px-2"
                                style={{ color: theme.gold }}
                            >
                                h
                            </div>
                        )}
                    </div>
                    {/* Fraction line */}
                    <div
                        className="w-full h-[3px] my-1 rounded-full min-w-[60px]"
                        style={{ background: theme.gold }}
                    />
                    {/* Denominator */}
                    <div className="flex items-center gap-1">
                        {displayLayout.denominator?.map((symbol, i) => (
                            <div key={symbol} className="flex items-center gap-1">
                                {renderCard(symbol, isSquare(symbol))}
                                {i < (displayLayout.denominator?.length ?? 0) - 1 &&
                                    renderOperator('×')}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Fallback: just render all cards linearly
    return (
        <div className="flex items-center gap-1.5">
            {variables.map((v) => renderCard(v.symbol))}
        </div>
    )
}
