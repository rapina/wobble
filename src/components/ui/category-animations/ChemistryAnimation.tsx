// 화학: 두 용액 혼합 반응
// 실제 물리: 시약을 떨어뜨리면 색이 변하고 거품이 발생

interface Props {
    color: string
    size: number
}

const styles = `
@keyframes dropper-drop {
    0%, 70% { transform: translateY(0); }
    75% { transform: translateY(2px); }
    80%, 100% { transform: translateY(0); }
}
@keyframes drop-fall {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    80% { transform: translateY(35px) scale(0.8); opacity: 1; }
    100% { transform: translateY(40px) scale(0); opacity: 0; }
}
@keyframes liquid-color-change {
    0%, 30% { fill: #81d4fa; }
    50%, 100% { fill: #ce93d8; }
}
@keyframes reaction-bubble {
    0% { transform: translateY(0) scale(1); opacity: 0.7; }
    100% { transform: translateY(-25px) scale(0.3); opacity: 0; }
}
@keyframes flask-glow {
    0%, 30% { filter: none; }
    50%, 80% { filter: drop-shadow(0 0 8px #ce93d8); }
    100% { filter: none; }
}
@keyframes steam-up {
    0% { transform: translateY(0) scale(1); opacity: 0.5; }
    100% { transform: translateY(-20px) scale(1.5); opacity: 0; }
}
@keyframes ripple {
    0% { r: 2; opacity: 0.8; }
    100% { r: 15; opacity: 0; }
}
@keyframes molecule-float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-5px) rotate(10deg); }
}
`

export function ChemistryAnimation({ color, size }: Props) {
    const bubbles = [
        { x: 40, delay: 0.5, size: 3 },
        { x: 48, delay: 0.8, size: 4 },
        { x: 55, delay: 0.3, size: 3 },
        { x: 45, delay: 1.1, size: 2 },
        { x: 52, delay: 0.6, size: 3 },
        { x: 58, delay: 1.0, size: 2 },
    ]

    return (
        <>
            <style>{styles}</style>
            <svg width={size} height={size} viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="chem-flask-glass" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
                    </linearGradient>
                    <linearGradient id="chem-liquid" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="chem-dropper" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#5d4037" />
                        <stop offset="50%" stopColor="#8d6e63" />
                        <stop offset="100%" stopColor="#5d4037" />
                    </linearGradient>
                    <clipPath id="chem-flask-clip">
                        <path d="M 35 35 L 30 85 Q 30 92, 40 92 L 60 92 Q 70 92, 70 85 L 65 35 Z" />
                    </clipPath>
                    <filter id="chem-glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* 스탠드 */}
                <rect x="20" y="92" width="60" height="4" rx="1" fill="#37474f" />
                <rect x="48" y="70" width="4" height="24" fill="#546e7a" />

                {/* 삼각 플라스크 */}
                <g style={{ animation: 'flask-glow 3s ease-in-out infinite' }}>
                    {/* 플라스크 외곽 */}
                    <path
                        d="M 35 35 L 30 85 Q 30 92, 40 92 L 60 92 Q 70 92, 70 85 L 65 35"
                        fill="url(#chem-flask-glass)"
                        stroke={color}
                        strokeWidth="2"
                        opacity="0.6"
                    />

                    {/* 플라스크 목 */}
                    <rect x="42" y="25" width="16" height="12" fill="url(#chem-flask-glass)" stroke={color} strokeWidth="2" opacity="0.6" />

                    {/* 용액 (색상 변화) */}
                    <g clipPath="url(#chem-flask-clip)">
                        <rect
                            x="30" y="55" width="40" height="40"
                            style={{ animation: 'liquid-color-change 3s ease-in-out infinite' }}
                        />

                        {/* 물결 표면 */}
                        <path
                            d="M 30 55 Q 40 52, 50 55 T 70 55"
                            fill={color}
                            opacity="0.6"
                        />

                        {/* 반응 거품 */}
                        {bubbles.map((b, i) => (
                            <circle
                                key={i}
                                cx={b.x}
                                cy="75"
                                r={b.size}
                                fill="#fff"
                                opacity="0.6"
                                style={{ animation: `reaction-bubble 2s ease-out infinite ${b.delay}s` }}
                            />
                        ))}

                        {/* 물결 파문 (시약 떨어지는 지점) */}
                        <circle cx="50" cy="55" r="2" fill="none" stroke="#fff" strokeWidth="1" style={{ animation: 'ripple 3s ease-out infinite 0.8s' }} />
                    </g>

                    {/* 유리 하이라이트 */}
                    <path d="M 33 40 L 31 80 Q 32 88, 38 88" fill="none" stroke="#fff" strokeWidth="2" opacity="0.2" />
                </g>

                {/* 스포이트 */}
                <g style={{ animation: 'dropper-drop 3s ease-in-out infinite' }}>
                    {/* 고무 부분 */}
                    <ellipse cx="50" cy="8" rx="6" ry="5" fill="#e57373" />

                    {/* 유리관 */}
                    <rect x="48" y="12" width="4" height="20" fill="url(#chem-dropper)" />
                    <path d="M 48 32 L 50 38 L 52 32" fill="url(#chem-dropper)" />

                    {/* 시약 (관 안) */}
                    <rect x="48.5" y="20" width="3" height="12" fill="#7e57c2" opacity="0.8" />
                </g>

                {/* 떨어지는 시약 방울 */}
                <ellipse
                    cx="50"
                    cy="42"
                    rx="2"
                    ry="3"
                    fill="#7e57c2"
                    style={{ animation: 'drop-fall 3s ease-in infinite 0.7s' }}
                />

                {/* 증기 */}
                {[42, 50, 58].map((x, i) => (
                    <path
                        key={i}
                        d={`M ${x} 22 Q ${x + 3} 12, ${x - 2} 5`}
                        fill="none"
                        stroke="#ce93d8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0"
                        style={{ animation: `steam-up 2s ease-out infinite ${1.5 + i * 0.3}s` }}
                    />
                ))}

                {/* 분자 구조 힌트 */}
                <g opacity="0.4" style={{ animation: 'molecule-float 4s ease-in-out infinite' }}>
                    <circle cx="82" cy="50" r="4" fill="#ff5722" />
                    <circle cx="88" cy="58" r="3" fill="#2196f3" />
                    <circle cx="76" cy="58" r="3" fill="#2196f3" />
                    <line x1="82" y1="54" x2="88" y2="56" stroke="#666" strokeWidth="1" />
                    <line x1="82" y1="54" x2="76" y2="56" stroke="#666" strokeWidth="1" />
                </g>
            </svg>
        </>
    )
}
