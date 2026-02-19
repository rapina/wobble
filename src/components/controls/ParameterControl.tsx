import * as SliderPrimitive from '@radix-ui/react-slider'

const theme = {
    bgPanel: '#374244',
    bgTrack: '#2a3032',
    border: '#1a1a1a',
}

interface ParameterControlProps {
    symbol: string
    name: string
    description?: string
    value: number
    min: number
    max: number
    unit: string
    color: string
    onChange: (value: number) => void
}

export function ParameterControl({
    symbol,
    name,
    description,
    value,
    min,
    max,
    unit,
    color,
    onChange,
}: ParameterControlProps) {
    const step = (max - min) / 100

    return (
        <div
            data-tutorial-slider={symbol}
            className="w-full max-w-sm rounded-xl select-none animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
                background: theme.bgPanel,
                border: `3px solid ${theme.border}`,
                boxShadow: `0 4px 0 ${theme.border}, 0 8px 24px rgba(0,0,0,0.4)`,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div
                className="px-4 py-2 rounded-t-lg flex items-center justify-between"
                style={{
                    background: color,
                    borderBottom: `2px solid ${theme.border}`,
                }}
            >
                <div>
                    <span className="text-lg font-black text-black">{symbol}</span>
                    <span className="text-sm text-black/70 ml-2">{name}</span>
                </div>
                <div className="text-right">
                    <span className="text-lg font-black font-mono text-black">
                        {value.toFixed(1)}
                    </span>
                    <span className="text-xs text-black/60 ml-1">{unit}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Description */}
                {description && (
                    <p className="text-xs text-white/60 mb-3 leading-relaxed">{description}</p>
                )}

                {/* Slider */}
                <SliderPrimitive.Root
                    value={[value]}
                    min={min}
                    max={max}
                    step={step}
                    onValueChange={([v]) => onChange(v)}
                    className="relative flex w-full touch-none items-center select-none h-8"
                >
                    <SliderPrimitive.Track
                        className="relative h-3 w-full grow overflow-hidden rounded"
                        style={{
                            background: theme.bgTrack,
                            border: `2px solid ${theme.border}`,
                        }}
                    >
                        <SliderPrimitive.Range
                            className="absolute h-full"
                            style={{ background: color }}
                        />
                    </SliderPrimitive.Track>
                    <SliderPrimitive.Thumb
                        className="block w-5 h-7 rounded focus-visible:outline-none"
                        style={{
                            background: color,
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    />
                </SliderPrimitive.Root>

                {/* Range labels */}
                <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/40">{min}</span>
                    <span className="text-[10px] text-white/40">{max}</span>
                </div>
            </div>
        </div>
    )
}
