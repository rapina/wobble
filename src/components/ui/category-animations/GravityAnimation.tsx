// 중력: 사과 낙하
// 실제 물리: 자유낙하 가속도 g=9.8m/s², 사과가 나무에서 떨어짐

interface Props {
    color: string
    size: number
}

const styles = `
@keyframes grav-apple-fall {
    0%, 10% {
        transform: translateY(0) rotate(0deg);
    }
    60% {
        transform: translateY(38px) rotate(20deg);
        animation-timing-function: ease-in;
    }
    65% {
        transform: translateY(38px) rotate(15deg) scaleY(0.85) scaleX(1.15);
    }
    70% {
        transform: translateY(35px) rotate(10deg);
    }
    75% {
        transform: translateY(38px) rotate(5deg);
    }
    80%, 100% {
        transform: translateY(38px) rotate(0deg);
    }
}
@keyframes grav-leaf-sway {
    0%, 100% { transform: rotate(-3deg); }
    50% { transform: rotate(3deg); }
}
@keyframes grav-dust {
    0%, 60% { transform: scale(0); opacity: 0; }
    65% { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(2); opacity: 0; }
}
`

export function GravityAnimation({ color, size }: Props) {
    return (
        <>
            <style>{styles}</style>
            <svg width={size} height={size} viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="grav-apple-grad" x1="30%" y1="0%" x2="70%" y2="100%">
                        <stop offset="0%" stopColor="#ff6b6b" />
                        <stop offset="50%" stopColor="#e53935" />
                        <stop offset="100%" stopColor="#c62828" />
                    </linearGradient>
                    <linearGradient id="grav-trunk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#5d4037" />
                        <stop offset="50%" stopColor="#795548" />
                        <stop offset="100%" stopColor="#5d4037" />
                    </linearGradient>
                    <linearGradient id="grav-leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#81c784" />
                        <stop offset="100%" stopColor="#4caf50" />
                    </linearGradient>
                    <filter id="grav-shadow">
                        <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.3" />
                    </filter>
                </defs>

                {/* 하늘 */}
                <rect x="0" y="0" width="100" height="75" fill={color} opacity="0.03" />

                {/* 나뭇잎 (트리 상단) */}
                <ellipse cx="70" cy="18" rx="25" ry="15" fill="url(#grav-leaf-grad)" />
                <ellipse cx="78" cy="22" rx="18" ry="10" fill="#66bb6a" />
                <ellipse cx="60" cy="25" rx="12" ry="8" fill="#81c784" style={{ transformOrigin: '60px 25px', animation: 'grav-leaf-sway 3s ease-in-out infinite' }} />

                {/* 나무 가지 */}
                <path
                    d="M 55 75 L 55 35 Q 55 28, 48 25 M 55 40 Q 62 35, 70 32"
                    fill="none"
                    stroke="url(#grav-trunk-grad)"
                    strokeWidth="5"
                    strokeLinecap="round"
                />

                {/* 나무 기둥 */}
                <rect x="52" y="40" width="6" height="35" fill="url(#grav-trunk-grad)" />

                {/* 지면 (고정) */}
                <rect x="0" y="75" width="100" height="25" fill="#5d4037" opacity="0.15" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#5d4037" strokeWidth="2" opacity="0.4" />

                {/* 풀 */}
                {[10, 18, 25, 35, 42, 80, 88].map((x, i) => (
                    <path
                        key={i}
                        d={`M ${x} 75 Q ${x + 2} 70, ${x} 68 M ${x} 75 Q ${x - 2} 71, ${x - 1} 69`}
                        fill="none"
                        stroke="#66bb6a"
                        strokeWidth="1.5"
                        opacity="0.6"
                    />
                ))}

                {/* 먼지 이펙트 (착지 시) */}
                <circle cx="25" cy="73" r="3" fill="#8d6e63" style={{ animation: 'grav-dust 2.5s ease-out infinite' }} />
                <circle cx="20" cy="74" r="2" fill="#8d6e63" style={{ animation: 'grav-dust 2.5s ease-out infinite 0.1s' }} />
                <circle cx="30" cy="74" r="2" fill="#8d6e63" style={{ animation: 'grav-dust 2.5s ease-out infinite 0.05s' }} />

                {/* 사과 낙하 경로 (점선) */}
                <line
                    x1="25" y1="30" x2="25" y2="70"
                    stroke={color}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.2"
                />

                {/* 떨어지는 사과 */}
                <g style={{ animation: 'grav-apple-fall 2.5s ease-in infinite' }}>
                    <g transform="translate(25, 28)">
                        {/* 사과 몸체 */}
                        <ellipse cx="0" cy="0" rx="7" ry="8" fill="url(#grav-apple-grad)" filter="url(#grav-shadow)" />
                        {/* 꼭지 */}
                        <path d="M 0 -8 Q 2 -11, 0 -13" fill="none" stroke="#5d4037" strokeWidth="2" strokeLinecap="round" />
                        {/* 잎 */}
                        <ellipse cx="3" cy="-10" rx="3" ry="1.5" fill="#4caf50" transform="rotate(25 3 -10)" />
                        {/* 하이라이트 */}
                        <ellipse cx="-2" cy="-3" rx="2.5" ry="1.5" fill="#fff" opacity="0.4" />
                    </g>
                </g>

                {/* 중력 화살표 */}
                <g opacity="0.5">
                    <line x1="10" y1="40" x2="10" y2="60" stroke={color} strokeWidth="2" />
                    <polygon points="10,64 7,58 13,58" fill={color} />
                </g>
            </svg>
        </>
    )
}
