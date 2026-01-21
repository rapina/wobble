import { ReactNode, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

interface MobileFrameProps {
    children: ReactNode
}

/**
 * Wraps the app in a 9:16 aspect ratio container when running on web.
 * On native platforms, renders children directly without any wrapper.
 */
export function MobileFrame({ children }: MobileFrameProps) {
    const [showFrame, setShowFrame] = useState(false)

    useEffect(() => {
        // Only show frame on web platform
        setShowFrame(!Capacitor.isNativePlatform())
    }, [])

    // On native, render children directly
    if (!showFrame) {
        return <>{children}</>
    }

    return (
        <div className="mobile-frame-container">
            <div className="mobile-frame">
                <div className="mobile-frame-notch" />
                <div className="mobile-frame-content">{children}</div>
                <div className="mobile-frame-home-indicator" />
            </div>
            <style>{`
                .mobile-frame-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100vw;
                    height: 100vh;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    padding: 20px;
                    box-sizing: border-box;
                }

                .mobile-frame {
                    position: relative;
                    /* Height-based sizing: use viewport height minus padding */
                    height: calc(100vh - 40px);
                    /* Width calculated from height to maintain 9:16 ratio */
                    width: calc((100vh - 40px) * 9 / 16);
                    /* Limit max width so it doesn't overflow on ultra-wide screens */
                    max-width: calc(100vw - 40px);
                    /* If width-constrained, recalculate height */
                    max-height: calc((100vw - 40px) * 16 / 9);
                    background: #000;
                    border-radius: 44px;
                    box-shadow:
                        0 0 0 3px #2d2d2d,
                        0 0 0 6px #1a1a1a,
                        0 25px 50px -12px rgba(0, 0, 0, 0.5),
                        inset 0 0 0 2px #3d3d3d;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .mobile-frame-notch {
                    position: absolute;
                    top: 8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100px;
                    height: 28px;
                    background: #000;
                    border-radius: 0 0 16px 16px;
                    z-index: 100;
                }

                .mobile-frame-notch::before {
                    content: '';
                    position: absolute;
                    top: 8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 8px;
                    height: 8px;
                    background: #1a1a1a;
                    border-radius: 50%;
                    box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.1);
                }

                .mobile-frame-content {
                    flex: 1;
                    width: 100%;
                    overflow: hidden;
                    border-radius: 40px;
                }

                .mobile-frame-home-indicator {
                    position: absolute;
                    bottom: 8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 120px;
                    height: 5px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                    z-index: 100;
                }

                /* Responsive adjustments for smaller screens */
                @media (max-width: 480px) {
                    .mobile-frame-container {
                        padding: 0;
                        background: transparent;
                    }

                    .mobile-frame {
                        width: 100vw;
                        height: 100vh;
                        max-width: none;
                        max-height: none;
                        border-radius: 0;
                        box-shadow: none;
                    }

                    .mobile-frame-notch,
                    .mobile-frame-home-indicator {
                        display: none;
                    }

                    .mobile-frame-content {
                        border-radius: 0;
                    }
                }
            `}</style>
        </div>
    )
}
