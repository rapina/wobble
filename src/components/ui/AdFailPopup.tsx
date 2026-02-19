import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { cn } from '@/lib/utils'
import { t as localizeText } from '@/utils/localization'

const theme = {
    bgPanel: '#374244',
    border: '#1a1a1a',
    gold: '#c9a227',
}

interface AdFailPopupProps {
    onConfirm: () => void
}

export function AdFailPopup({ onConfirm }: AdFailPopupProps) {
    const { i18n } = useTranslation()
    const lang = i18n.language
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 50)
        return () => clearTimeout(timer)
    }, [])

    const handleConfirm = () => {
        setVisible(false)
        setTimeout(onConfirm, 200)
    }

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center',
                'transition-all duration-200',
                visible ? 'bg-black/70' : 'bg-black/0'
            )}
            onClick={handleConfirm}
        >
            <div
                className={cn(
                    'relative w-[280px] rounded-2xl p-6',
                    'transition-all duration-300',
                    visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                )}
                style={{
                    background: theme.bgPanel,
                    border: `3px solid ${theme.border}`,
                    boxShadow: `0 8px 0 ${theme.border}, 0 12px 40px rgba(0,0,0,0.5)`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Wobble Character */}
                <div className="flex justify-center mb-4">
                    <WobbleDisplay
                        size={60}
                        shape="circle"
                        color={0xf5b041}
                        expression="happy"
                    />
                </div>

                {/* Message */}
                <p className="text-center text-white/90 text-sm mb-5 leading-relaxed font-bold">
                    {localizeText(
                        {
                            ko: '이번 한 번은 무료로 볼 수 있어!',
                            en: 'This one is free, just for you!',
                            ja: '今回は無料で見られるよ！',
                            'zh-CN': '这次免费给你看！',
                            'zh-TW': '這次免費給你看！',
                            es: '¡Esta vez es gratis, solo para ti!',
                            pt: 'Desta vez é grátis, só para você!',
                        },
                        lang
                    )}
                </p>

                {/* Confirm button */}
                <button
                    onClick={handleConfirm}
                    className="w-full py-3 rounded-xl font-bold text-black transition-all active:scale-[0.98]"
                    style={{
                        background: theme.gold,
                        boxShadow: '0 4px 0 #8a6f1a',
                    }}
                >
                    {localizeText(
                        {
                            ko: '고마워!',
                            en: 'Thanks!',
                            ja: 'ありがとう！',
                            'zh-CN': '谢谢！',
                            'zh-TW': '謝謝！',
                            es: '¡Gracias!',
                            pt: 'Obrigado!',
                        },
                        lang
                    )}
                </button>
            </div>
        </div>
    )
}
