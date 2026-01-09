import { useEffect, useState, useRef, memo } from 'react'

interface ShuffleTextProps {
    children: string
    className?: string
    style?: React.CSSProperties
    duration?: number
    charset?: string
    trigger?: 'mount' | 'hover'
    loop?: boolean
    loopDelay?: number
}

function ShuffleText({
    children,
    className = '',
    style,
    duration = 1000,
    charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%',
    trigger = 'mount',
    loop = false,
    loopDelay = 3000,
}: ShuffleTextProps) {
    const [displayText, setDisplayText] = useState(children)
    const [isAnimating, setIsAnimating] = useState(false)
    const intervalRef = useRef<number | null>(null)
    const timeoutRef = useRef<number | null>(null)

    const shuffle = () => {
        if (isAnimating) return
        setIsAnimating(true)

        const originalText = children
        const length = originalText.length
        const frameTime = duration / (length * 3)
        let iteration = 0

        intervalRef.current = window.setInterval(() => {
            setDisplayText(
                originalText
                    .split('')
                    .map((char, index) => {
                        if (char === ' ') return ' '
                        if (index < iteration / 3) {
                            return originalText[index]
                        }
                        return charset[Math.floor(Math.random() * charset.length)]
                    })
                    .join('')
            )

            iteration += 1

            if (iteration >= length * 3) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                }
                setDisplayText(originalText)
                setIsAnimating(false)

                if (loop) {
                    timeoutRef.current = window.setTimeout(() => {
                        shuffle()
                    }, loopDelay)
                }
            }
        }, frameTime)
    }

    useEffect(() => {
        if (trigger === 'mount') {
            const startTimeout = setTimeout(() => {
                shuffle()
            }, 200)
            return () => clearTimeout(startTimeout)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    const handleHover = () => {
        if (trigger === 'hover') {
            shuffle()
        }
    }

    return (
        <span
            className={className}
            style={style}
            onMouseEnter={handleHover}
            onTouchStart={handleHover}
        >
            {displayText}
        </span>
    )
}

export default memo(ShuffleText)
