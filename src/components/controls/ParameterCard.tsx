const theme = {
    bgPanel: '#374244',
    border: '#1a1a1a',
}

interface ParameterCardProps {
    symbol: string
    name: string
    value: number
    unit: string
    color: string
    isSelected?: boolean
    onSelect?: () => void
    compact?: boolean
}

export function ParameterCard({
    symbol,
    value,
    unit,
    color,
    isSelected = false,
    onSelect,
    compact = false,
}: ParameterCardProps) {
    if (compact) {
        return (
            <div
                data-tutorial-symbol={symbol}
                className="w-[36px] rounded select-none shrink-0 transition-all duration-200 cursor-pointer"
                style={{
                    background: theme.bgPanel,
                    border: `2px solid ${isSelected ? color : theme.border}`,
                    boxShadow: `0 2px 0 ${theme.border}`,
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect?.()
                }}
            >
                <div
                    className="px-1 py-0.5 rounded-t text-center"
                    style={{
                        background: color,
                        borderBottom: `1px solid ${theme.border}`,
                    }}
                >
                    <div className="text-[10px] font-black text-black leading-none">{symbol}</div>
                </div>
                <div className="p-0.5">
                    <div
                        className="text-center text-[9px] font-black font-mono py-0.5 rounded"
                        style={{
                            background: '#1a1a1a',
                            color: color,
                        }}
                    >
                        {value.toFixed(1)}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            data-tutorial-symbol={symbol}
            className={`w-[52px] rounded-lg select-none shrink-0 transition-all duration-200 cursor-pointer ${
                isSelected ? '-translate-y-2' : ''
            }`}
            style={{
                background: theme.bgPanel,
                border: `2px solid ${isSelected ? color : theme.border}`,
                boxShadow: isSelected
                    ? `0 6px 0 ${theme.border}, 0 8px 20px rgba(0,0,0,0.4)`
                    : `0 3px 0 ${theme.border}`,
            }}
            onClick={(e) => {
                e.stopPropagation()
                onSelect?.()
            }}
        >
            {/* Color Header */}
            <div
                className="px-1.5 py-1 rounded-t-md text-center"
                style={{
                    background: color,
                    borderBottom: `2px solid ${theme.border}`,
                }}
            >
                <div className="text-sm font-black text-black leading-none">{symbol}</div>
            </div>

            {/* Value */}
            <div className="p-1.5">
                <div
                    className="text-center text-xs font-black font-mono py-1 rounded"
                    style={{
                        background: '#1a1a1a',
                        color: color,
                        border: `1px solid ${theme.border}`,
                    }}
                >
                    {value.toFixed(1)}
                    <span className="text-[8px] text-white/50 ml-0.5">{unit}</span>
                </div>
            </div>
        </div>
    )
}
