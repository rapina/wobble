import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy } from 'lucide-react'
import { onAchievementUnlock } from '@/stores/achievementStore'
import { getAchievement, Achievement } from '@/data/achievements'
import { cn } from '@/lib/utils'

interface ToastItem {
    id: string
    achievement: Achievement
    timestamp: number
}

export function AchievementToast() {
    const { i18n } = useTranslation()
    const isKorean = i18n.language === 'ko' || i18n.language.startsWith('ko')
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const addToast = useCallback((achievementId: string) => {
        const achievement = getAchievement(achievementId)
        if (!achievement) return

        const newToast: ToastItem = {
            id: `${achievementId}-${Date.now()}`,
            achievement,
            timestamp: Date.now(),
        }

        setToasts((prev) => [...prev, newToast])

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
        }, 3000)
    }, [])

    useEffect(() => {
        const unsubscribe = onAchievementUnlock(addToast)
        return unsubscribe
    }, [addToast])

    if (toasts.length === 0) return null

    return (
        <div
            className="fixed z-[100] flex flex-col gap-2 pointer-events-none"
            style={{
                top: 'max(env(safe-area-inset-top, 0px), 16px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '360px',
            }}
        >
            {toasts.map((toast, index) => (
                <div
                    key={toast.id}
                    className={cn(
                        'pointer-events-auto',
                        'animate-in slide-in-from-top-4 fade-in duration-300',
                        'flex items-center gap-3 px-4 py-3 rounded-xl',
                        'border-2'
                    )}
                    style={{
                        background: 'linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%)',
                        borderColor: '#F5B041',
                        boxShadow: '0 0 20px rgba(245, 176, 65, 0.4), 0 4px 12px rgba(0,0,0,0.4)',
                        animationDelay: `${index * 100}ms`,
                    }}
                >
                    {/* Icon */}
                    <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{
                            background: 'rgba(245, 176, 65, 0.2)',
                            border: '2px solid rgba(245, 176, 65, 0.4)',
                        }}
                    >
                        {toast.achievement.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Trophy className="w-3.5 h-3.5 text-[#F5B041]" />
                            <span className="text-xs font-medium text-[#F5B041]">
                                {isKorean ? '업적 달성!' : 'Achievement Unlocked!'}
                            </span>
                        </div>
                        <p className="text-white font-bold truncate">
                            {isKorean ? toast.achievement.nameKo : toast.achievement.nameEn}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
