// 전자기학: 전구 회로
// 실제 물리: 전류가 회로를 따라 흐르며 전구를 밝힘

interface Props {
    color: string
    size: number
}

const styles = `
@keyframes electron-flow {
    0% { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -40; }
}
@keyframes bulb-glow {
    0%, 100% { opacity: 0.9; filter: drop-shadow(0 0 8px #ffeb3b); }
    50% { opacity: 1; filter: drop-shadow(0 0 15px #ffeb3b) drop-shadow(0 0 25px #ff9800); }
}
@keyframes filament-glow {
    0%, 100% { stroke: #ffcc00; }
    50% { stroke: #fff; }
}
@keyframes switch-spark {
    0%, 90%, 100% { opacity: 0; }
    95% { opacity: 1; }
}
@keyframes light-ray {
    0%, 100% { opacity: 0.3; transform: scaleY(1); }
    50% { opacity: 0.6; transform: scaleY(1.1); }
}
`

export function ElectricityAnimation({ color, size }: Props) {
    return (
        <>
            <style>{styles}</style>
            <svg width={size} height={size} viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="elec-battery-body" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#37474f" />
                        <stop offset="50%" stopColor="#546e7a" />
                        <stop offset="100%" stopColor="#37474f" />
                    </linearGradient>
                    <linearGradient id="elec-wire" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d32f2f" />
                        <stop offset="100%" stopColor="#b71c1c" />
                    </linearGradient>
                    <radialGradient id="elec-bulb-glass" cx="50%" cy="30%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
                    </radialGradient>
                    <radialGradient id="elec-bulb-glow" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#ffeb3b" />
                        <stop offset="50%" stopColor="#ff9800" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#ff9800" stopOpacity="0" />
                    </radialGradient>
                    <filter id="elec-glow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* 배터리 */}
                <g>
                    {/* 배터리 몸체 */}
                    <rect x="8" y="55" width="18" height="30" rx="2" fill="url(#elec-battery-body)" />
                    {/* 배터리 + 단자 */}
                    <rect x="12" y="50" width="10" height="6" fill="#78909c" />
                    <text x="14" y="68" fontSize="10" fill="#fff" fontWeight="bold">+</text>
                    <text x="14" y="82" fontSize="10" fill="#fff" fontWeight="bold">−</text>
                    {/* 배터리 레이블 */}
                    <rect x="11" y="70" width="12" height="8" fill="#ffeb3b" rx="1" />
                </g>

                {/* 회로 (전선) */}
                <g fill="none" strokeWidth="3" strokeLinecap="round">
                    {/* 배경 전선 */}
                    <path
                        d="M 17 50 L 17 25 L 50 25 L 50 35"
                        stroke="#b71c1c"
                    />
                    <path
                        d="M 17 85 L 17 90 L 80 90 L 80 60"
                        stroke="#1565c0"
                    />
                    <path
                        d="M 50 70 L 50 75 L 65 75 L 65 60"
                        stroke="#1565c0"
                    />

                    {/* 전류 흐름 애니메이션 (+ → 전구 → −) */}
                    <path
                        d="M 17 50 L 17 25 L 50 25 L 50 35"
                        stroke={color}
                        strokeDasharray="5 5"
                        style={{ animation: 'electron-flow 0.5s linear infinite' }}
                    />
                    <path
                        d="M 50 70 L 50 75 L 65 75 L 65 60"
                        stroke={color}
                        strokeDasharray="5 5"
                        style={{ animation: 'electron-flow 0.5s linear infinite' }}
                    />
                    <path
                        d="M 80 60 L 80 90 L 17 90 L 17 85"
                        stroke={color}
                        strokeDasharray="5 5"
                        style={{ animation: 'electron-flow 0.5s linear infinite' }}
                    />
                </g>

                {/* 스위치 */}
                <g>
                    <circle cx="80" cy="60" r="4" fill="#78909c" />
                    <line x1="80" y1="56" x2="72" y2="50" stroke="#546e7a" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="72" cy="50" r="2" fill={color} />
                    {/* 스파크 */}
                    <circle cx="76" cy="53" r="2" fill="#fff" style={{ animation: 'switch-spark 2s ease-in-out infinite' }} />
                </g>

                {/* 전구 */}
                <g>
                    {/* 전구 빛 발산 */}
                    <circle cx="57" cy="50" r="25" fill="url(#elec-bulb-glow)" style={{ animation: 'bulb-glow 1s ease-in-out infinite' }} />

                    {/* 빛줄기 */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                        <line
                            key={i}
                            x1="57"
                            y1="50"
                            x2={57 + Math.cos(angle * Math.PI / 180) * 25}
                            y2={50 + Math.sin(angle * Math.PI / 180) * 25}
                            stroke="#ffeb3b"
                            strokeWidth="1"
                            opacity="0.3"
                            style={{ transformOrigin: '57px 50px', animation: `light-ray 1s ease-in-out infinite ${i * 0.1}s` }}
                        />
                    ))}

                    {/* 전구 유리 */}
                    <ellipse cx="57" cy="48" rx="12" ry="15" fill="url(#elec-bulb-glass)" stroke="#ccc" strokeWidth="1" />

                    {/* 필라멘트 */}
                    <path
                        d="M 52 55 Q 54 45, 57 50 Q 60 55, 62 45"
                        fill="none"
                        stroke="#ffcc00"
                        strokeWidth="2"
                        strokeLinecap="round"
                        filter="url(#elec-glow)"
                        style={{ animation: 'filament-glow 0.5s ease-in-out infinite' }}
                    />

                    {/* 전구 소켓 */}
                    <rect x="50" y="62" width="14" height="10" fill="#78909c" rx="1" />
                    <rect x="52" y="64" width="10" height="2" fill="#546e7a" />
                    <rect x="52" y="68" width="10" height="2" fill="#546e7a" />
                </g>

                {/* 전류 방향 화살표 */}
                <g opacity="0.5">
                    <polygon points="35,22 35,28 40,25" fill={color} />
                </g>

            </svg>
        </>
    )
}
