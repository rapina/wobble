import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

// Balatro theme
const theme = {
    bg: '#374244',
    bgTrack: '#2a3032',
    border: '#1a1a1a',
}

interface PhysicsSliderProps {
    value: number
    min: number
    max: number
    step?: number
    color?: string
    onChange: (value: number) => void
    label?: string
    unit?: string
}

export function PhysicsSlider({
    value,
    min,
    max,
    step,
    color = '#f8b862',
    onChange,
    label,
    unit,
}: PhysicsSliderProps) {
    const calculatedStep = step ?? (max - min) / 100
    const [isDragging, setIsDragging] = React.useState(false)

    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-white/70 font-bold">{label}</span>
                    <span
                        className={cn(
                            'text-sm font-mono font-black px-3 py-1.5 rounded-lg transition-all duration-150',
                            isDragging && 'scale-105'
                        )}
                        style={{
                            color: '#fff',
                            background: color,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    >
                        {value.toFixed(1)} {unit}
                    </span>
                </div>
            )}
            <SliderPrimitive.Root
                value={[value]}
                min={min}
                max={max}
                step={calculatedStep}
                onValueChange={([v]) => onChange(v)}
                onPointerDown={() => setIsDragging(true)}
                onPointerUp={() => setIsDragging(false)}
                className="relative flex w-full touch-none items-center select-none h-10"
            >
                <SliderPrimitive.Track
                    className="relative h-4 w-full grow overflow-hidden rounded-lg"
                    style={{
                        background: theme.bgTrack,
                        border: `3px solid ${theme.border}`,
                    }}
                >
                    <SliderPrimitive.Range
                        className="absolute h-full transition-shadow duration-200"
                        style={{
                            background: color,
                        }}
                    />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb
                    className={cn(
                        'block w-7 h-9 rounded-lg transition-all duration-150',
                        'focus-visible:outline-none',
                        isDragging && 'scale-110'
                    )}
                    style={{
                        background: color,
                        border: `3px solid ${theme.border}`,
                        boxShadow: `0 4px 0 ${theme.border}`,
                    }}
                />
            </SliderPrimitive.Root>
        </div>
    )
}
