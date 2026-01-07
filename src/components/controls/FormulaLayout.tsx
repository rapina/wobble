import { DisplayLayout, Variable } from '../../formulas/types';
import { ParameterCard } from './ParameterCard';
import { OutputCard } from './OutputCard';

const theme = {
    gold: '#c9a227',
    border: '#1a1a1a',
};

interface FormulaLayoutProps {
    displayLayout: DisplayLayout;
    variables: Variable[];
    values: Record<string, number>;
    selectedCard: string | null;
    onSelectCard: (symbol: string | null) => void;
}

export function FormulaLayout({
    displayLayout,
    variables,
    values,
    selectedCard,
    onSelectCard,
}: FormulaLayoutProps) {
    const getVariable = (symbol: string) => variables.find(v => v.symbol === symbol);
    const outputVar = getVariable(displayLayout.output);

    const renderCard = (symbol: string, showSquare?: boolean) => {
        const variable = getVariable(symbol);
        if (!variable) return null;

        if (variable.role === 'output') {
            return (
                <OutputCard
                    key={symbol}
                    variables={[{
                        symbol: showSquare ? `${variable.symbol}` : variable.symbol,
                        name: variable.name,
                        unit: variable.unit,
                        color: variable.visual.color,
                    }]}
                    values={values}
                />
            );
        }

        return (
            <div key={symbol} className="relative">
                <ParameterCard
                    symbol={variable.symbol}
                    name={variable.name}
                    value={values[variable.symbol] ?? variable.default}
                    unit={variable.unit}
                    color={variable.visual.color}
                    isSelected={selectedCard === variable.symbol}
                    onSelect={() => onSelectCard(
                        selectedCard === variable.symbol ? null : variable.symbol
                    )}
                />
                {showSquare && (
                    <span
                        className="absolute -top-1 -right-1 text-xs font-black"
                        style={{ color: theme.gold }}
                    >
                        2
                    </span>
                )}
            </div>
        );
    };

    const renderOperator = (op: string) => (
        <div
            className="text-xl font-black select-none flex items-center justify-center px-1"
            style={{
                color: theme.gold,
                textShadow: `0 2px 0 ${theme.border}`,
            }}
        >
            {op}
        </div>
    );

    const isSquare = (symbol: string) => displayLayout.squares?.includes(symbol);

    // Linear layout: output = a × b × c
    if (displayLayout.type === 'linear') {
        return (
            <div className="flex items-center gap-1">
                {outputVar && renderCard(displayLayout.output)}
                {renderOperator('=')}
                {displayLayout.coefficient && (
                    <div
                        className="text-lg font-black select-none"
                        style={{ color: theme.gold }}
                    >
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
        );
    }

    // Fraction layout: output = numerator / denominator
    if (displayLayout.type === 'fraction' || displayLayout.type === 'fraction-square') {
        return (
            <div className="flex items-center gap-1.5">
                {outputVar && renderCard(displayLayout.output)}
                {renderOperator('=')}
                {displayLayout.coefficient && (
                    <div
                        className="text-lg font-black select-none"
                        style={{ color: theme.gold }}
                    >
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
                                    {i < (displayLayout.numerator?.length ?? 0) - 1 && renderOperator('×')}
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
                                {i < (displayLayout.denominator?.length ?? 0) - 1 && renderOperator('×')}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Fallback: just render all cards linearly
    return (
        <div className="flex items-center gap-1.5">
            {variables.map(v => renderCard(v.symbol))}
        </div>
    );
}
