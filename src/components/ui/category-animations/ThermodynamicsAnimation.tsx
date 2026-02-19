// 열역학: 온도계 + 분자 운동
// 실제 물리: 온도가 올라가면 분자 운동이 활발해짐

interface Props {
    color: string
    size: number
}

const styles = `
@keyframes thermo-rise {
    0%, 100% { height: 25px; }
    50% { height: 40px; }
}
@keyframes thermo-glow {
    0%, 100% { filter: drop-shadow(0 0 2px currentColor); }
    50% { filter: drop-shadow(0 0 6px currentColor); }
}
@keyframes particle-move-1 {
    0% { transform: translate(0, 0); }
    25% { transform: translate(8px, -6px); }
    50% { transform: translate(-4px, 4px); }
    75% { transform: translate(6px, 8px); }
    100% { transform: translate(0, 0); }
}
@keyframes particle-move-2 {
    0% { transform: translate(0, 0); }
    25% { transform: translate(-7px, 5px); }
    50% { transform: translate(5px, -8px); }
    75% { transform: translate(-3px, -4px); }
    100% { transform: translate(0, 0); }
}
@keyframes particle-move-3 {
    0% { transform: translate(0, 0); }
    25% { transform: translate(5px, 7px); }
    50% { transform: translate(-8px, -3px); }
    75% { transform: translate(4px, -6px); }
    100% { transform: translate(0, 0); }
}
@keyframes heat-wave {
    0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.3; }
    50% { transform: translateY(-3px) scaleX(1.1); opacity: 0.5; }
}
`

export function ThermodynamicsAnimation({ color, size }: Props) {
    // 분자들 - 무작위 위치
    const particles = [
        { x: 60, y: 35, size: 5, anim: 'particle-move-1', speed: '0.8s' },
        { x: 72, y: 45, size: 4, anim: 'particle-move-2', speed: '0.7s' },
        { x: 65, y: 55, size: 5, anim: 'particle-move-3', speed: '0.9s' },
        { x: 78, y: 38, size: 3, anim: 'particle-move-1', speed: '0.6s' },
        { x: 70, y: 62, size: 4, anim: 'particle-move-2', speed: '0.85s' },
        { x: 82, y: 52, size: 3, anim: 'particle-move-3', speed: '0.75s' },
        { x: 58, y: 48, size: 4, anim: 'particle-move-1', speed: '0.65s' },
        { x: 75, y: 68, size: 3, anim: 'particle-move-2', speed: '0.7s' },
    ]

    return (
        <>
            <style>{styles}</style>
            <svg width={size} height={size} viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="thermo-glass" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#fff" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="thermo-mercury" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </linearGradient>
                    <linearGradient id="thermo-bulb" x1="30%" y1="30%" x2="70%" y2="70%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                    <filter id="thermo-glow-filter">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <clipPath id="thermo-tube-clip">
                        <rect x="22" y="15" width="10" height="55" rx="5" />
                    </clipPath>
                </defs>

                {/* 온도계 */}
                <g>
                    {/* 유리관 외곽 */}
                    <rect x="20" y="12" width="14" height="58" rx="7" fill="none" stroke="#aaa" strokeWidth="2" />

                    {/* 유리관 내부 배경 */}
                    <rect x="22" y="15" width="10" height="55" rx="5" fill="#1a1a2e" />

                    {/* 수은주 (애니메이션) */}
                    <g clipPath="url(#thermo-tube-clip)">
                        <rect
                            x="22"
                            y="45"
                            width="10"
                            height="25"
                            rx="5"
                            fill="url(#thermo-mercury)"
                            style={{
                                transformOrigin: '27px 70px',
                                animation: 'thermo-rise 2s ease-in-out infinite'
                            }}
                        />
                    </g>

                    {/* 유리 하이라이트 */}
                    <rect x="22" y="15" width="4" height="55" rx="2" fill="url(#thermo-glass)" />

                    {/* 구근 */}
                    <circle cx="27" cy="78" r="10" fill="url(#thermo-bulb)" filter="url(#thermo-glow-filter)" style={{ animation: 'thermo-glow 2s ease-in-out infinite', color: color }} />
                    <circle cx="24" cy="75" r="3" fill="#fff" opacity="0.3" />

                    {/* 눈금 */}
                    {[20, 30, 40, 50, 60].map((y, i) => (
                        <g key={i}>
                            <line x1="35" y1={y} x2="40" y2={y} stroke="#666" strokeWidth="1" />
                            <text x="42" y={y + 3} fontSize="6" fill="#888">{100 - i * 20}°</text>
                        </g>
                    ))}
                </g>

                {/* 열 영역 배경 */}
                <rect x="52" y="25" width="40" height="55" rx="8" fill={color} opacity="0.1" />

                {/* 열파 효과 */}
                <ellipse cx="72" cy="50" rx="18" ry="25" fill="none" stroke={color} strokeWidth="1" opacity="0.2" style={{ animation: 'heat-wave 1.5s ease-in-out infinite' }} />
                <ellipse cx="72" cy="50" rx="14" ry="20" fill="none" stroke={color} strokeWidth="1" opacity="0.3" style={{ animation: 'heat-wave 1.5s ease-in-out infinite 0.3s' }} />

                {/* 분자들 (활발하게 움직임) */}
                {particles.map((p, i) => (
                    <g key={i} style={{ animation: `${p.anim} ${p.speed} ease-in-out infinite` }}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={p.size}
                            fill={color}
                            opacity="0.8"
                        />
                        {/* 분자 하이라이트 */}
                        <circle
                            cx={p.x - p.size * 0.3}
                            cy={p.y - p.size * 0.3}
                            r={p.size * 0.3}
                            fill="#fff"
                            opacity="0.5"
                        />
                    </g>
                ))}

                {/* 화살표 (열 전달) */}
                <g opacity="0.4">
                    <line x1="42" y1="78" x2="52" y2="78" stroke={color} strokeWidth="2" />
                    <polygon points="54,78 50,75 50,81" fill={color} />
                </g>
            </svg>
        </>
    )
}
