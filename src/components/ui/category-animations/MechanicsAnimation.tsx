// 역학: 단진자 운동
// 실제 물리: 중력에 의한 단순조화운동

interface Props {
    color: string
    size: number
}

const styles = `
@keyframes pendulum-swing {
    0%, 100% { transform: rotate(-25deg); }
    50% { transform: rotate(25deg); }
}
`

export function MechanicsAnimation({ color, size }: Props) {
    return (
        <>
            <style>{styles}</style>
            <svg width={size} height={size} viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="pend-ball" x1="30%" y1="20%" x2="70%" y2="80%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
                        <stop offset="40%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                    </linearGradient>
                    <filter id="pend-shadow">
                        <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.25" />
                    </filter>
                </defs>

                {/* 천장 */}
                <rect x="20" y="8" width="60" height="5" rx="2" fill="#555" />

                {/* 진자 전체 (회전) */}
                <g style={{
                    transformOrigin: '50px 13px',
                    animation: 'pendulum-swing 1.5s ease-in-out infinite'
                }}>
                    {/* 줄 */}
                    <line
                        x1="50" y1="13"
                        x2="50" y2="65"
                        stroke="#888"
                        strokeWidth="2"
                    />

                    {/* 공 */}
                    <circle
                        cx="50" cy="75" r="12"
                        fill="url(#pend-ball)"
                        filter="url(#pend-shadow)"
                    />
                    <ellipse cx="45" cy="70" rx="4" ry="2.5" fill="#fff" opacity="0.4" />
                </g>

                {/* 각도 호 */}
                <path
                    d="M 40 13 A 10 10 0 0 1 60 13"
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.3"
                />

            </svg>
        </>
    )
}
