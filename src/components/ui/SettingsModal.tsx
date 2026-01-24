import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Trash2, AlertTriangle, Volume2, VolumeX } from 'lucide-react'
import { usePurchaseStore } from '@/stores/purchaseStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useMusic } from '@/hooks/useMusic'
import { cn } from '@/lib/utils'
import { t as localizeText } from '@/utils/localization'

// Balatro theme - HomeScreen과 동일
const theme = {
    bg: '#1a1a2e',
    felt: '#3d6b59',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
    red: '#e85d4c',
    blue: '#4a9eff',
    green: '#2ecc71',
    purple: '#9b59b6',
}

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const { reset: resetPurchase } = usePurchaseStore()
    const { resetCollection } = useCollectionStore()
    const { isMusicEnabled, volume, toggleMusic, setVolume } = useMusic()
    const [showResetConfirm, setShowResetConfirm] = useState(false)

    const handleResetAllData = () => {
        // Clear all localStorage
        localStorage.clear()

        // Reset zustand stores
        resetCollection()
        resetPurchase()

        // Close modal and refresh
        setShowResetConfirm(false)
        onClose()

        // Reload to ensure clean state
        window.location.reload()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-sm rounded-xl overflow-hidden"
                style={{
                    background: theme.bgPanel,
                    border: `4px solid ${theme.border}`,
                    boxShadow: `0 6px 0 ${theme.border}, 0 0 40px rgba(0,0,0,0.5)`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{
                        background: theme.bgPanelLight,
                        borderBottom: `3px solid ${theme.border}`,
                    }}
                >
                    <h2
                        className="text-xl font-black tracking-wide"
                        style={{
                            color: theme.gold,
                            textShadow: '0 2px 0 #8a6d1a',
                        }}
                    >
                        {t('settings.title', 'Settings')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95"
                        style={{
                            background: theme.bgPanel,
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 2px 0 ${theme.border}`,
                        }}
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                    {/* Music Settings */}
                    <div
                        className="p-4 rounded-xl"
                        style={{
                            background: theme.bgPanelLight,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-11 h-11 rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95"
                                style={{
                                    background: isMusicEnabled ? theme.gold : theme.bgPanel,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 2px 0 ${theme.border}`,
                                }}
                                onClick={toggleMusic}
                            >
                                {isMusicEnabled ? (
                                    <Volume2 className="w-6 h-6 text-black" />
                                ) : (
                                    <VolumeX className="w-6 h-6 text-white/50" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p
                                    className="font-black"
                                    style={{
                                        color: isMusicEnabled ? 'white' : 'white/50',
                                        textShadow: '0 1px 0 rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {localizeText(
                                        { ko: '배경 음악', en: 'Background Music', ja: 'BGM' },
                                        lang
                                    )}
                                </p>
                                <p className="text-sm text-white/50 font-medium">
                                    {isMusicEnabled
                                        ? localizeText(
                                              {
                                                  ko: '음악이 재생 중입니다',
                                                  en: 'Music is playing',
                                                  ja: '音楽再生中',
                                              },
                                              lang
                                          )
                                        : localizeText(
                                              {
                                                  ko: '음악이 꺼져 있습니다',
                                                  en: 'Music is off',
                                                  ja: '音楽オフ',
                                              },
                                              lang
                                          )}
                                </p>
                            </div>
                        </div>

                        {/* Volume Slider */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white/70">
                                    {localizeText({ ko: '볼륨', en: 'Volume', ja: '音量' }, lang)}
                                </span>
                                <span className="text-sm font-bold text-white/50">
                                    {Math.round(volume * 100)}%
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volume * 100}
                                    onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                                    disabled={!isMusicEnabled}
                                    className={cn(
                                        'w-full h-2 rounded-full appearance-none cursor-pointer',
                                        !isMusicEnabled && 'opacity-50 cursor-not-allowed'
                                    )}
                                    style={{
                                        background: `linear-gradient(to right, ${theme.gold} 0%, ${theme.gold} ${volume * 100}%, ${theme.bgPanel} ${volume * 100}%, ${theme.bgPanel} 100%)`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div
                        className="my-2"
                        style={{
                            height: 3,
                            background: theme.border,
                            borderRadius: 2,
                        }}
                    />

                    {/* Reset All Data Button */}
                    {!showResetConfirm ? (
                        <button
                            onClick={() => setShowResetConfirm(true)}
                            className={cn(
                                'w-full py-3 rounded-xl font-bold',
                                'transition-all duration-200',
                                'active:scale-[0.97]'
                            )}
                            style={{
                                background: theme.bgPanelLight,
                                color: theme.red,
                                border: `3px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                            }}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                {localizeText(
                                    {
                                        ko: '모든 데이터 초기화',
                                        en: 'Reset All Data',
                                        ja: 'すべてのデータをリセット',
                                    },
                                    lang
                                )}
                            </span>
                        </button>
                    ) : (
                        <div
                            className="p-4 rounded-xl space-y-3"
                            style={{
                                background: 'rgba(232, 93, 76, 0.15)',
                                border: `3px solid ${theme.red}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background: theme.red,
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: `0 2px 0 ${theme.border}`,
                                    }}
                                >
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-black" style={{ color: theme.red }}>
                                        {localizeText(
                                            {
                                                ko: '정말 초기화하시겠습니까?',
                                                en: 'Are you sure?',
                                                ja: '本当にリセットしますか？',
                                            },
                                            lang
                                        )}
                                    </p>
                                    <p className="text-xs text-white/50 mt-1 font-medium">
                                        {localizeText(
                                            {
                                                ko: '모든 진행 상황과 설정이 삭제됩니다. 구매 항목은 복원할 수 있습니다.',
                                                en: 'All progress and settings will be deleted. Purchases can be restored.',
                                                ja: 'すべての進行状況と設定が削除されます。購入は復元可能です。',
                                            },
                                            lang
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-all active:scale-[0.97]"
                                    style={{
                                        background: theme.bgPanel,
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: `0 2px 0 ${theme.border}`,
                                    }}
                                >
                                    {localizeText(
                                        { ko: '취소', en: 'Cancel', ja: 'キャンセル' },
                                        lang
                                    )}
                                </button>
                                <button
                                    onClick={handleResetAllData}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-black text-white transition-all active:scale-[0.97]"
                                    style={{
                                        background: theme.red,
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: `0 2px 0 ${theme.border}`,
                                    }}
                                >
                                    {localizeText(
                                        { ko: '초기화', en: 'Reset', ja: 'リセット' },
                                        lang
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
