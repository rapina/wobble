/**
 * JellyfishDisplay - A React SVG component for displaying the jellyfish character
 * Based on AnchorWobble from the Wobblediver minigame
 */

import { useEffect, useState } from 'react'

interface JellyfishDisplayProps {
    size?: number
    color?: string
    animated?: boolean
}

export function JellyfishDisplay({
    size = 80,
    color = '#e85d4c',
    animated = true,
}: JellyfishDisplayProps) {
    const [time, setTime] = useState(0)

    // Animation loop
    useEffect(() => {
        if (!animated) return
        let animationId: number
        const startTime = Date.now()

        const animate = () => {
            setTime((Date.now() - startTime) / 1000)
            animationId = requestAnimationFrame(animate)
        }
        animationId = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(animationId)
    }, [animated])

    // Animation values
    const breathe = animated ? Math.sin(time * 1.5) * 0.05 : 0
    const bellScale = 1 + breathe
    const tentacleSway = animated ? Math.sin(time * 2) * 3 : 0

    // Calculate viewBox center
    const viewBoxSize = 100
    const cx = viewBoxSize / 2
    const cy = viewBoxSize / 2 - 5

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            style={{ overflow: 'visible' }}
        >
            <defs>
                {/* Glow filter */}
                <filter id="jellyfish-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                {/* Tentacle gradient */}
                <linearGradient id="tentacle-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.3" />
                </linearGradient>
            </defs>

            {/* Outer glow */}
            <ellipse
                cx={cx}
                cy={cy}
                rx={28 * bellScale}
                ry={22 * bellScale}
                fill={color}
                opacity={0.15 + (animated ? Math.sin(time * 2) * 0.05 : 0)}
                filter="url(#jellyfish-glow)"
            />

            {/* Tentacles */}
            <g opacity="0.7">
                {[-18, -9, 0, 9, 18].map((offset, i) => {
                    const startX = cx + offset
                    const startY = cy + 18
                    const sway = tentacleSway * (1 + i * 0.2)
                    const cp1x = startX + sway
                    const cp1y = startY + 15
                    const cp2x = startX - sway * 0.5
                    const cp2y = startY + 30
                    const endX = startX + sway * 0.3
                    const endY = startY + 40 + Math.sin(time * 3 + i) * 3

                    return (
                        <path
                            key={i}
                            d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                            stroke="url(#tentacle-grad)"
                            strokeWidth={3 - i * 0.3}
                            fill="none"
                            strokeLinecap="round"
                        />
                    )
                })}
            </g>

            {/* Bell/dome */}
            <ellipse
                cx={cx}
                cy={cy}
                rx={24 * bellScale}
                ry={18 * bellScale}
                fill={color}
                opacity="0.7"
            />

            {/* Inner bell highlight */}
            <ellipse
                cx={cx}
                cy={cy - 2}
                rx={16 * bellScale}
                ry={12 * bellScale}
                fill="white"
                opacity="0.15"
            />

            {/* Bell rim */}
            <ellipse
                cx={cx}
                cy={cy + 15}
                rx={26 * bellScale}
                ry={6 * bellScale}
                fill={color}
                opacity="0.9"
            />

            {/* Bioluminescent spots */}
            {[0, 1, 2, 3, 4].map((i) => {
                const angle = (i / 5) * Math.PI - Math.PI / 2
                const spotX = cx + Math.cos(angle) * 12 * bellScale
                const spotY = cy + Math.sin(angle) * 10 * bellScale
                const spotAlpha = 0.4 + (animated ? Math.sin(time * 3 + i) * 0.2 : 0)

                return (
                    <circle
                        key={i}
                        cx={spotX}
                        cy={spotY}
                        r={2.5}
                        fill="white"
                        opacity={spotAlpha}
                    />
                )
            })}

            {/* Eyes */}
            <g>
                {/* Left eye */}
                <ellipse cx={cx - 8} cy={cy - 2} rx={4} ry={5} fill="white" opacity="0.9" />
                <circle cx={cx - 8} cy={cy - 1} r={2.5} fill="#222233" />
                <circle cx={cx - 9} cy={cy - 2} r={1} fill="white" opacity="0.8" />

                {/* Right eye */}
                <ellipse cx={cx + 8} cy={cy - 2} rx={4} ry={5} fill="white" opacity="0.9" />
                <circle cx={cx + 8} cy={cy - 1} r={2.5} fill="#222233" />
                <circle cx={cx + 7} cy={cy - 2} r={1} fill="white" opacity="0.8" />

                {/* Blush marks */}
                <ellipse cx={cx - 14} cy={cy + 3} rx={3} ry={1.5} fill="#ff9999" opacity="0.4" />
                <ellipse cx={cx + 14} cy={cy + 3} rx={3} ry={1.5} fill="#ff9999" opacity="0.4" />
            </g>

            {/* Highlight on top */}
            <ellipse cx={cx - 6} cy={cy - 10} rx={4} ry={3} fill="white" opacity="0.3" />
        </svg>
    )
}
