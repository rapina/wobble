import { CSSProperties, useState } from 'react';

interface SliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    color?: string;
    onChange: (value: number) => void;
    label?: string;
    unit?: string;
}

export function Slider({
    value,
    min,
    max,
    step,
    color = '#10b981',
    onChange,
    label,
    unit,
}: SliderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const calculatedStep = step ?? (max - min) / 100;
    const fillPercent = ((value - min) / (max - min)) * 100;

    return (
        <div style={styles.container}>
            {label && (
                <div style={styles.labelRow}>
                    <span style={styles.label}>{label}</span>
                    <span style={{
                        ...styles.value,
                        color,
                        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.1s ease',
                    }}>
                        {value.toFixed(2)} {unit}
                    </span>
                </div>
            )}
            <div style={styles.sliderContainer}>
                {/* Fill track */}
                <div
                    style={{
                        ...styles.fillTrack,
                        width: `${fillPercent}%`,
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                        boxShadow: isDragging ? `0 0 10px ${color}66` : 'none',
                    }}
                />
                {/* Thumb glow when dragging */}
                <div
                    style={{
                        ...styles.thumbGlow,
                        left: `calc(${fillPercent}% - 12px)`,
                        background: color,
                        opacity: isDragging ? 0.4 : 0,
                        transform: isDragging ? 'scale(1.5)' : 'scale(1)',
                    }}
                />
                <input
                    type="range"
                    className="gba-slider"
                    min={min}
                    max={max}
                    step={calculatedStep}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    style={{ '--accent-color': color } as CSSProperties}
                />
            </div>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    container: {
        width: '100%',
        marginBottom: 14,
    },
    labelRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: '#8b949e',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: '500',
    },
    value: {
        fontSize: 12,
        fontFamily: '"SF Mono", "Fira Code", monospace',
        fontWeight: '600',
    },
    sliderContainer: {
        position: 'relative',
        height: 18,
    },
    fillTrack: {
        position: 'absolute',
        top: 6,
        left: 0,
        height: 6,
        borderRadius: 3,
        pointerEvents: 'none',
        transition: 'box-shadow 0.2s ease',
    },
    thumbGlow: {
        position: 'absolute',
        top: 3,
        width: 20,
        height: 20,
        borderRadius: '50%',
        pointerEvents: 'none',
        filter: 'blur(10px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
    },
};
