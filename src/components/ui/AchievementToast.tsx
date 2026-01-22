import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy } from 'lucide-react'
import { onAchievementUnlock } from '@/stores/achievementStore'
import { getAchievement, Achievement } from '@/data/achievements'
import { t } from '@/utils/localization'
import { cn } from '@/lib/utils'

interface ToastItem {
    id: string
    achievement: Achievement
    timestamp: number
    isExiting?: boolean
}

const TOAST_DURATION = 3000
const EXIT_ANIMATION_DURATION = 300

export function AchievementToast() {
    const { i18n } = useTranslation()
    const lang = i18n.language
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    const removeToast = useCallback((id: string) => {
        // Start exit animation
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
        )

        // Remove after exit animation completes
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, EXIT_ANIMATION_DURATION)
    }, [])

    const addToast = useCallback((achievementId: string) => {
        const achievement = getAchievement(achievementId)
        if (!achievement) return

        const newToast: ToastItem = {
            id: `${achievementId}-${Date.now()}`,
            achievement,
            timestamp: Date.now(),
            isExiting: false,
        }

        setToasts((prev) => [...prev, newToast])

        // Schedule removal after duration
        const timer = setTimeout(() => {
            removeToast(newToast.id)
            timersRef.current.delete(newToast.id)
        }, TOAST_DURATION)

        timersRef.current.set(newToast.id, timer)
    }, [removeToast])

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            timersRef.current.forEach((timer) => clearTimeout(timer))
            timersRef.current.clear()
        }
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
                        'flex items-center gap-3 px-4 py-3 rounded-xl',
                        'border-2',
                        'transition-all duration-300 ease-out',
                        toast.isExiting
                            ? 'opacity-0 -translate-y-2 scale-95'
                            : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-top-4 fade-in'
                    )}
                    style={{
                        background: 'linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%)',
                        borderColor: '#F5B041',
                        boxShadow: '0 0 20px rgba(245, 176, 65, 0.4), 0 4px 12px rgba(0,0,0,0.4)',
                        animationDelay: toast.isExiting ? '0ms' : `${index * 100}ms`,
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
                                {lang === 'ko'
                                    ? '업적 달성!'
                                    : lang === 'ja'
                                      ? '実績達成！'
                                      : 'Achievement Unlocked!'}
                            </span>
                        </div>
                        <p className="text-white font-bold truncate">
                            {t(toast.achievement.name, lang)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
