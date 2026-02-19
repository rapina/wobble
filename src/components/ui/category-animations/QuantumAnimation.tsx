// 양자역학: 전자 에너지 준위 전이
// 실제 물리: 전자가 에너지를 흡수/방출하며 궤도 사이를 점프

interface Props {
    color: string
    size: number
}

const styles = `
@keyframes electron-jump-up {
    0%, 40% {
        transform: translateY(0);
        opacity: 1;
    }
    45% {
        transform: translateY(0);
        opacity: 0;
    }
    50% {
        transform: translateY(-25px);
        opacity: 0;
    }
    55%, 100% {
        transform: translateY(-25px);
        opacity: 1;
    }
}
@keyframes electron-jump-down {
    0%, 40% {
        transform: translateY(-25px);
        opacity: 1;
    }
    45% {
        transform: translateY(-25px);
        opacity: 0;
    }
    50% {
        transform: translateY(0);
        opacity: 0;
    }
    55%, 100% {
        transform: translateY(0);
        opacity: 1;
    }
}
@keyframes photon-emit {
    0%, 40% {
        transform: translate(0, -12px) scale(0);
        opacity: 0;
    }
    45% {
        transform: translate(0, -12px) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(35px, -12px) scale(0.5);
        opacity: 0;
    }
}
@keyframes photon-absorb {
    0% {
        transform: translate(-35px, -37px) scale(0.5);
        opacity: 0;
    }
    40% {
        transform: translate(0, -37px) scale(1);
        opacity: 1;
    }
    45%, 100% {
        transform: translate(0, -37px) scale(0);
        opacity: 0;
    }
}
@keyframes orbit-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
@keyframes nucleus-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
@keyframes wave-function {
    0%, 100% { opacity: 0.3; transform: scaleX(1); }
    50% { opacity: 0.6; transform: scaleX(1.1); }
}
`

export function QuantumAnimation({ color, size }: Props) {
    return (
        <>
            <style>{styles}</style>
            <svg width={size} height={size} viewBox="0 0 100 100">
                <defs>
                    <radialGradient id="quant-nucleus" cx="40%" cy="40%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                        <stop offset="50%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </radialGradient>
                    <radialGradient id="quant-electron" cx="30%" cy="30%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="50%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity="0.8" />
                    </radialGradient>
                    <radialGradient id="quant-photon" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="30%" stopColor="#ffeb3b" />
                        <stop offset="100%" stopColor="#ff9800" stopOpacity="0" />
                    </radialGradient>
                    <filter id="quant-glow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* 원자핵 */}
                <g style={{ animation: 'nucleus-pulse 2s ease-in-out infinite' }}>
                    <circle cx="50" cy="75" r="8" fill="url(#quant-nucleus)" filter="url(#quant-glow)" />
                    {/* 양성자/중성자 표시 */}
                    <circle cx="48" cy="73" r="3" fill="#ff5722" opacity="0.8" />
                    <circle cx="52" cy="77" r="3" fill="#ff5722" opacity="0.8" />
                    <circle cx="52" cy="73" r="3" fill="#9e9e9e" opacity="0.8" />
                </g>

                {/* 전자 궤도 (에너지 준위) */}
                {/* n=1 궤도 */}
                <ellipse cx="50" cy="75" rx="18" ry="8" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
                <ellipse cx="50" cy="75" rx="18" ry="8" fill={color} opacity="0.05" style={{ animation: 'wave-function 3s ease-in-out infinite' }} />

                {/* n=2 궤도 */}
                <ellipse cx="50" cy="75" rx="30" ry="20" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
                <ellipse cx="50" cy="75" rx="30" ry="20" fill={color} opacity="0.05" style={{ animation: 'wave-function 3s ease-in-out infinite 0.5s' }} />

                {/* n=3 궤도 */}
                <ellipse cx="50" cy="75" rx="42" ry="32" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
                <ellipse cx="50" cy="75" rx="42" ry="32" fill={color} opacity="0.05" style={{ animation: 'wave-function 3s ease-in-out infinite 1s' }} />

                {/* 점프하는 전자 */}
                <g style={{ animation: 'electron-jump-up 3s ease-in-out infinite' }}>
                    <circle cx="50" cy="67" r="5" fill="url(#quant-electron)" filter="url(#quant-glow)" />
                </g>

                {/* 광자 방출 (아래로 전이 시) */}
                <g style={{ animation: 'photon-emit 3s ease-out infinite' }}>
                    <ellipse cx="50" cy="55" rx="8" ry="4" fill="url(#quant-photon)" filter="url(#quant-glow)" />
                    {/* 파동 무늬 */}
                    <path d="M 42 55 Q 46 52, 50 55 T 58 55" fill="none" stroke="#ffeb3b" strokeWidth="1.5" />
                </g>

                {/* 광자 흡수 (위로 전이 시) */}
                <g style={{ animation: 'photon-absorb 3s ease-in infinite 1.5s' }}>
                    <ellipse cx="50" cy="42" rx="8" ry="4" fill="url(#quant-photon)" filter="url(#quant-glow)" />
                    <path d="M 42 42 Q 46 39, 50 42 T 58 42" fill="none" stroke="#ffeb3b" strokeWidth="1.5" />
                </g>

                {/* 다른 궤도의 전자들 (고정) */}
                <g style={{ transformOrigin: '50px 75px', animation: 'orbit-rotate 4s linear infinite' }}>
                    <circle cx="20" cy="75" r="3" fill="url(#quant-electron)" opacity="0.6" />
                </g>
                <g style={{ transformOrigin: '50px 75px', animation: 'orbit-rotate 6s linear infinite reverse' }}>
                    <circle cx="8" cy="75" r="3" fill="url(#quant-electron)" opacity="0.6" />
                </g>

                {/* 에너지 화살표 */}
                <g opacity="0.6">
                    {/* 흡수 (위로) */}
                    <line x1="88" y1="70" x2="88" y2="50" stroke="#4caf50" strokeWidth="2" />
                    <polygon points="88,46 85,52 91,52" fill="#4caf50" />

                    {/* 방출 (아래로) */}
                    <line x1="95" y1="50" x2="95" y2="70" stroke="#ff9800" strokeWidth="2" />
                    <polygon points="95,74 92,68 98,68" fill="#ff9800" />
                </g>
            </svg>
        </>
    )
}
