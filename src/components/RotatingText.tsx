import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface RotatingTextProps {
    texts: string[];
    interval?: number;
    className?: string;
    style?: React.CSSProperties;
}

export function RotatingText({
    texts,
    interval = 3000,
    className = '',
    style,
}: RotatingTextProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % texts.length);
        }, interval);

        return () => clearInterval(timer);
    }, [texts.length, interval]);

    return (
        <span className={`inline-block relative ${className}`} style={style}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={texts[index]}
                    initial={{ y: 20, opacity: 0, rotateX: -90 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    exit={{ y: -20, opacity: 0, rotateX: 90 }}
                    transition={{
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                    className="inline-block"
                >
                    {texts[index]}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}
