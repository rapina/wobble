const theme = {
    bgPanel: '#374244',
    border: '#1a1a1a',
}

interface OutputVariable {
    symbol: string
    name: string
    unit: string
    color: string
}

interface OutputCardProps {
    variables: OutputVariable[]
    values: Record<string, number>
    compact?: boolean
}

export function OutputCard({ variables, values, compact = false }: OutputCardProps) {
    if (variables.length === 0) return null

    const v = variables[0]

    if (compact) {
        return (
            <div
                className="w-[36px] rounded select-none shrink-0"
                style={{
                    background: theme.bgPanel,
                    border: `2px solid ${theme.border}`,
                    boxShadow: `0 2px 0 ${theme.border}`,
                }}
            >
                <div
                    className="px-1 py-0.5 rounded-t text-center"
                    style={{
                        background: v.color,
                        borderBottom: `1px solid ${theme.border}`,
                    }}
                >
                    <div className="text-[10px] font-black text-black leading-none">{v.symbol}</div>
                </div>
                <div className="p-0.5">
                    <div
                        className="text-center text-[9px] font-black font-mono py-0.5 rounded"
                        style={{
                            background: '#1a1a1a',
                            color: v.color,
                        }}
                    >
                        {(values[v.symbol] ?? 0).toFixed(1)}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className="w-[52px] rounded-lg select-none shrink-0"
            style={{
                background: theme.bgPanel,
                border: `2px solid ${theme.border}`,
                boxShadow: `0 3px 0 ${theme.border}`,
            }}
        >
            {/* Color Header */}
            <div
                className="px-1.5 py-1 rounded-t-md text-center"
                style={{
                    background: v.color,
                    borderBottom: `2px solid ${theme.border}`,
                }}
            >
                <div className="text-sm font-black text-black leading-none">{v.symbol}</div>
            </div>

            {/* Content */}
            <div className="p-1.5">
                <div
                    className="text-center text-xs font-black font-mono py-1 rounded"
                    style={{
                        background: '#1a1a1a',
                        color: v.color,
                        border: `1px solid ${theme.border}`,
                    }}
                >
                    {(values[v.symbol] ?? 0).toFixed(1)}
                    <span className="text-[8px] text-white/50 ml-0.5">{v.unit}</span>
                </div>
            </div>
        </div>
    )
}
