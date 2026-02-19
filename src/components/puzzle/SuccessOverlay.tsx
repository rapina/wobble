import { useTranslation } from 'react-i18next'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { Star, ArrowRight, Home } from 'lucide-react'
import { WobbleShape } from '@/components/canvas/Wobble'
import { cn } from '@/lib/utils'
import { t } from '@/utils/localization'

interface SuccessOverlayProps {
    levelName: string
    levelNameEn: string
    rewardWobble?: WobbleShape
    hasNextLevel: boolean
    onNextLevel: () => void
    onBack: () => void
}

export function SuccessOverlay({
    levelName,
    levelNameEn,
    rewardWobble,
    hasNextLevel,
    onNextLevel,
    onBack,
}: SuccessOverlayProps) {
    const { i18n } = useTranslation()
    const lang = i18n.language

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
            {/* Dark overlay with celebration gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%)',
                }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Stars animation */}
                <div className="flex gap-2 mb-4 animate-bounce">
                    <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                    <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                    <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </div>

                {/* Wobble celebration */}
                <div className="mb-4">
                    <WobbleDisplay size={80} shape="circle" expression="excited" />
                </div>

                {/* Success text */}
                <h2
                    className="text-3xl font-black text-yellow-400 mb-2"
                    style={{
                        textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                    }}
                >
                    {t({ ko: '성공!', en: 'Success!', ja: '成功！' }, lang)}
                </h2>

                <p className="text-white/70 mb-8">
                    {lang === 'ko' ? levelName : levelNameEn}{' '}
                    {t({ ko: '클리어!', en: 'cleared!', ja: 'クリア！' }, lang)}
                </p>

                {/* Reward wobble */}
                {rewardWobble && (
                    <div className="mb-8 p-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
                        <p className="text-center text-purple-300 text-sm mb-3">
                            {t(
                                {
                                    ko: '새로운 워블 해금!',
                                    en: 'New Wobble unlocked!',
                                    ja: '新しいワブルをアンロック！',
                                },
                                lang
                            )}
                        </p>
                        <div className="flex justify-center">
                            <WobbleDisplay size={50} shape={rewardWobble} expression="happy" />
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onBack}
                        className={cn(
                            'flex items-center gap-2 px-5 py-3 rounded-xl',
                            'bg-white/10 border border-white/20',
                            'text-white font-semibold',
                            'transition-all duration-200',
                            'hover:bg-white/20 active:scale-95'
                        )}
                    >
                        <Home className="w-5 h-5" />
                        <span>{t({ ko: '메뉴로', en: 'Menu', ja: 'メニュー' }, lang)}</span>
                    </button>

                    {hasNextLevel && (
                        <button
                            onClick={onNextLevel}
                            className={cn(
                                'flex items-center gap-2 px-6 py-3 rounded-xl',
                                'bg-yellow-500 border-2 border-yellow-600',
                                'text-black font-bold',
                                'transition-all duration-200',
                                'hover:bg-yellow-400 active:scale-95',
                                'shadow-lg shadow-yellow-500/30'
                            )}
                        >
                            <span>
                                {t({ ko: '다시 하기', en: 'Play Again', ja: 'もう一度' }, lang)}
                            </span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
