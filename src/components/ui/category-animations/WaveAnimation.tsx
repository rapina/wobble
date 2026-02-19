// 파동: 물결파 + 부이
// 실제 물리: 수면파가 퍼지고, 부이가 파도를 타고 위아래로 움직임

interface Props {
    color: string
    size: number
}

const styles = `
@keyframes wave-move {
    0% { transform: translateX(0); }
    100% { transform: translateX(-40px); }
}
@keyframes buoy-bob-1 {
    0%, 100% { transform: translateY(0) rotate(-5deg); }
    50% { transform: translateY(-8px) rotate(5deg); }
}
@keyframes buoy-bob-2 {
    0%, 100% { transform: translateY(-4px) rotate(3deg); }
    50% { transform: translateY(4px) rotate(-3deg); }
}
@keyframes ripple-expand {
    0% { r: 5; opacity: 0.6; }
    100% { r: 25; opacity: 0; }
}
@keyframes splash-up {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0; }
    10% { opacity: 0.8; }
    50% { transform: translateY(-15px) scale(0.5); opacity: 0.4; }
    100% { transform: translateY(-20px) scale(0); opacity: 0; }
}
`

export function WaveAnimation({ color, size }: Props) {
    return (
        <>
            <style>{styles}</style>
            <svg width={size} height={size} viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="wave-water" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="wave-buoy" x1="30%" y1="0%" x2="70%" y2="100%">
                        <stop offset="0%" stopColor="#ff6b6b" />
                        <stop offset="50%" stopColor="#ee5a5a" />
                        <stop offset="100%" stopColor="#cc4444" />
                    </linearGradient>
                    <clipPath id="wave-clip">
                        <rect x="0" y="40" width="100" height="60" />
                    </clipPath>
                    <filter id="wave-blur">
                        <feGaussianBlur stdDeviation="1" />
                    </filter>
                </defs>

                {/* 하늘 배경 */}
                <rect x="0" y="0" width="100" height="45" fill={color} opacity="0.05" />

                {/* 물결 레이어들 */}
                <g clipPath="url(#wave-clip)">
                    {/* 뒤쪽 물결 (느림) */}
                    <g style={{ animation: 'wave-move 3s linear infinite' }} opacity="0.3">
                        <path
                            d="M -40 55 Q -30 45, -20 55 T 0 55 T 20 55 T 40 55 T 60 55 T 80 55 T 100 55 T 120 55 T 140 55 L 140 100 L -40 100 Z"
                            fill={color}
                        />
                    </g>

                    {/* 중간 물결 */}
                    <g style={{ animation: 'wave-move 2s linear infinite' }} opacity="0.5">
                        <path
                            d="M -40 60 Q -30 50, -20 60 T 0 60 T 20 60 T 40 60 T 60 60 T 80 60 T 100 60 T 120 60 T 140 60 L 140 100 L -40 100 Z"
                            fill="url(#wave-water)"
                        />
                    </g>

                    {/* 앞쪽 물결 (빠름) */}
                    <g style={{ animation: 'wave-move 1.5s linear infinite' }}>
                        <path
                            d="M -40 65 Q -30 58, -20 65 T 0 65 T 20 65 T 40 65 T 60 65 T 80 65 T 100 65 T 120 65 T 140 65 L 140 100 L -40 100 Z"
                            fill="url(#wave-water)"
                        />
                    </g>
                </g>

                {/* 물결 파문 (중심) */}
                <circle cx="50" cy="58" r="5" fill="none" stroke={color} strokeWidth="1" style={{ animation: 'ripple-expand 2s ease-out infinite' }} />
                <circle cx="50" cy="58" r="5" fill="none" stroke={color} strokeWidth="1" style={{ animation: 'ripple-expand 2s ease-out infinite 0.7s' }} />
                <circle cx="50" cy="58" r="5" fill="none" stroke={color} strokeWidth="1" style={{ animation: 'ripple-expand 2s ease-out infinite 1.4s' }} />

                {/* 부이 1 (왼쪽) */}
                <g style={{ animation: 'buoy-bob-1 2s ease-in-out infinite' }}>
                    <ellipse cx="25" cy="58" rx="6" ry="4" fill="url(#wave-buoy)" />
                    <rect x="23" y="48" width="4" height="10" fill="#666" />
                    <polygon points="27,38 27,50 35,50" fill={color} opacity="0.8" />
                    {/* 부이 반사 */}
                    <ellipse cx="23" cy="56" rx="2" ry="1" fill="#fff" opacity="0.4" />
                </g>

                {/* 부이 2 (오른쪽) */}
                <g style={{ animation: 'buoy-bob-2 2.3s ease-in-out infinite' }}>
                    <ellipse cx="75" cy="60" rx="5" ry="3" fill="url(#wave-buoy)" />
                    <rect x="73" y="52" width="4" height="8" fill="#666" />
                    <circle cx="75" cy="49" r="3" fill="#fff" opacity="0.8" />
                    <ellipse cx="73" cy="58" rx="1.5" ry="1" fill="#fff" opacity="0.4" />
                </g>

                {/* 물보라 */}
                <circle cx="40" cy="60" r="2" fill="#fff" style={{ animation: 'splash-up 1.8s ease-out infinite' }} />
                <circle cx="60" cy="62" r="1.5" fill="#fff" style={{ animation: 'splash-up 1.8s ease-out infinite 0.5s' }} />
                <circle cx="50" cy="58" r="1" fill="#fff" style={{ animation: 'splash-up 1.8s ease-out infinite 1s' }} />
            </svg>
        </>
    )
}
