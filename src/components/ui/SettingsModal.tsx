import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Trash2, AlertTriangle, Volume2, VolumeX, Play, Smartphone } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { useMobileFrameStore } from '@/components/ui/DevOptionsModal'
import { IntroScene } from '@/components/canvas/intro/IntroScene'
import { usePurchaseStore } from '@/stores/purchaseStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useFormulaUnlockStore } from '@/stores/formulaUnlockStore'
import { useProgressStore } from '@/stores/progressStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useDiscoveryStore } from '@/stores/discoveryStore'
import { useLevelChallengeStore } from '@/stores/levelChallengeStore'
import { useMinigameRecordStore } from '@/stores/minigameRecordStore'
import { useLabStore } from '@/stores/labStore'
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

function MobileSimulationToggle({ lang }: { lang: string }) {
    const { isFrameHidden, setFrameHidden } = useMobileFrameStore()
    const isSimulating = !isFrameHidden

    return (
        <div
            className="p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
            style={{
                background: theme.bgPanelLight,
                border: `3px solid ${isSimulating ? theme.blue : theme.border}`,
                boxShadow: `0 3px 0 ${theme.border}`,
            }}
            onClick={() => setFrameHidden(!isFrameHidden)}
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center"
                    style={{
                        background: isSimulating ? theme.blue : theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 2px 0 ${theme.border}`,
                    }}
                >
                    <Smartphone className={cn('w-6 h-6', isSimulating ? 'text-white' : 'text-white/50')} />
                </div>
                <div className="flex-1">
                    <p
                        className="font-black"
                        style={{
                            color: isSimulating ? 'white' : 'rgba(255,255,255,0.5)',
                            textShadow: '0 1px 0 rgba(0,0,0,0.3)',
                        }}
                    >
                        {localizeText(
                            {
                                ko: '모바일 화면 시뮬레이션',
                                en: 'Mobile Screen Simulation',
                                ja: 'モバイル画面シミュレーション',
                            },
                            lang
                        )}
                    </p>
                    <p className="text-sm text-white/50 font-medium">
                        {isSimulating
                            ? localizeText(
                                  { ko: '세로 디바이스 프레임 표시', en: 'Showing device frame', ja: 'デバイスフレーム表示中' },
                                  lang
                              )
                            : localizeText(
                                  { ko: '전체 화면 모드', en: 'Fullscreen mode', ja: 'フルスクリーンモード' },
                                  lang
                              )}
                    </p>
                </div>
                <div
                    className="w-12 h-6 rounded-md relative transition-all"
                    style={{
                        background: isSimulating ? theme.blue : theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                    }}
                >
                    <div
                        className={cn(
                            'absolute top-0.5 w-5 h-5 rounded bg-white transition-all',
                            isSimulating ? 'left-5' : 'left-0.5'
                        )}
                    />
                </div>
            </div>
        </div>
    )
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
    const { reset: resetFormulaUnlock } = useFormulaUnlockStore()
    const { resetProgress } = useProgressStore()
    const { reset: resetAchievements } = useAchievementStore()
    const { reset: resetDiscovery } = useDiscoveryStore()
    const { reset: resetLevelChallenge } = useLevelChallengeStore()
    const { resetAllRecords } = useMinigameRecordStore()
    const { resetLab } = useLabStore()
    const { isMusicEnabled, volume, toggleMusic, setVolume } = useMusic()
    const [showResetConfirm, setShowResetConfirm] = useState(false)
    const [confirmVisible, setConfirmVisible] = useState(false)

    // Animate confirm modal in
    useEffect(() => {
        if (showResetConfirm) {
            const timer = setTimeout(() => setConfirmVisible(true), 30)
            return () => clearTimeout(timer)
        } else {
            setConfirmVisible(false)
        }
    }, [showResetConfirm])

    const handleResetAllData = () => {
        // Clear all localStorage
        localStorage.clear()

        // Reset all zustand stores
        resetPurchase()
        resetCollection()
        resetFormulaUnlock()
        resetProgress()
        resetAchievements()
        resetDiscovery()
        resetLevelChallenge()
        resetAllRecords()
        resetLab()

        // Close modal and refresh
        setShowResetConfirm(false)
        onClose()

        // Reload to ensure clean state
        window.location.reload()
    }

    const handleCloseConfirm = () => {
        setConfirmVisible(false)
        setTimeout(() => setShowResetConfirm(false), 200)
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

                    {/* Mobile Simulation Toggle - Web only */}
                    {!Capacitor.isNativePlatform() && (
                        <MobileSimulationToggle lang={lang} />
                    )}

                    {/* About Section */}
                    <div
                        className="p-4 rounded-xl"
                        style={{
                            background: theme.bgPanelLight,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    >
                        {/* Header */}
                        <p className="font-black mb-3" style={{ color: theme.gold }}>
                            {localizeText({
                                ko: '소개',
                                en: 'About',
                                ja: 'このアプリについて',
                                es: 'Acerca de',
                                pt: 'Sobre',
                                'zh-CN': '关于',
                                'zh-TW': '關於',
                            }, lang)}
                        </p>

                        {/* Philosophy */}
                        <p className="text-sm text-white/80 mb-3 leading-relaxed">
                            {localizeText({
                                ko: 'Wobble은 물리를 직관적으로 느끼게 해주는 앱입니다. 정확한 계산보다 감각적인 이해를 추구합니다.',
                                en: 'Wobble is designed to help you feel physics intuitively. We prioritize sensory understanding over precise calculation.',
                                ja: 'Wobbleは物理を直感的に感じられるアプリです。正確な計算より感覚的な理解を大切にしています。',
                                es: 'Wobble está diseñado para ayudarte a sentir la física de forma intuitiva. Priorizamos la comprensión sensorial sobre el cálculo preciso.',
                                pt: 'Wobble foi projetado para ajudar você a sentir a física intuitivamente. Priorizamos a compreensão sensorial sobre o cálculo preciso.',
                                'zh-CN': 'Wobble旨在帮助你直观地感受物理。我们重视感性理解，而非精确计算。',
                                'zh-TW': 'Wobble旨在幫助你直觀地感受物理。我們重視感性理解，而非精確計算。',
                            }, lang)}
                        </p>

                        {/* Accuracy Note (moved disclaimer) */}
                        <p className="text-xs text-white/50 mb-4">
                            {localizeText({
                                ko: '정확한 계산이 필요하다면 적절한 과학 도구를 사용해 주세요.',
                                en: 'For exact calculations, please use appropriate scientific tools.',
                                ja: '正確な計算が必要な場合は、適切な科学ツールをご利用ください。',
                                es: 'Para cálculos exactos, utiliza herramientas científicas apropiadas.',
                                pt: 'Para cálculos exatos, utilize ferramentas científicas apropriadas.',
                                'zh-CN': '如需精确计算，请使用适当的科学工具。',
                                'zh-TW': '如需精確計算，請使用適當的科學工具。',
                            }, lang)}
                        </p>

                        {/* Version & Credits */}
                        <div className="flex items-center justify-between text-xs text-white/40">
                            <span className="font-mono">v{__APP_VERSION__}</span>
                            <span>Sputnik Workshop</span>
                        </div>
                    </div>

                    {/* Replay Intro Button */}
                    <button
                        onClick={() => {
                            IntroScene.resetIntro()
                            onClose()
                            window.location.reload()
                        }}
                        className={cn(
                            'w-full py-3 rounded-xl font-bold',
                            'transition-all duration-200',
                            'active:scale-[0.97]'
                        )}
                        style={{
                            background: theme.bgPanelLight,
                            color: theme.gold,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 3px 0 ${theme.border}`,
                        }}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Play className="w-4 h-4" />
                            {localizeText(
                                {
                                    ko: '인트로 다시 보기',
                                    en: 'Replay Intro',
                                    ja: 'イントロを再生',
                                    es: 'Ver intro de nuevo',
                                    pt: 'Rever introdução',
                                    'zh-CN': '重看介绍',
                                    'zh-TW': '重看介紹',
                                },
                                lang
                            )}
                        </span>
                    </button>

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
                </div>
            </div>

            {/* Reset Confirm Modal (separate overlay) */}
            {showResetConfirm && (
                <div
                    className={cn(
                        'fixed inset-0 z-[60] flex items-center justify-center p-4',
                        'transition-all duration-200',
                        confirmVisible ? 'bg-black/60' : 'bg-black/0'
                    )}
                    onClick={handleCloseConfirm}
                >
                    <div
                        className={cn(
                            'relative w-[300px] rounded-2xl p-5 space-y-4',
                            'transition-all duration-200',
                            confirmVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                        )}
                        style={{
                            background: theme.bgPanel,
                            border: `4px solid ${theme.red}`,
                            boxShadow: `0 6px 0 ${theme.border}, 0 0 60px rgba(232,93,76,0.3)`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Warning Icon */}
                        <div className="flex justify-center">
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center"
                                style={{
                                    background: theme.red,
                                    border: `3px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                }}
                            >
                                <AlertTriangle className="w-7 h-7 text-white" />
                            </div>
                        </div>

                        {/* Title */}
                        <p
                            className="text-center font-black text-lg"
                            style={{ color: theme.red }}
                        >
                            {localizeText(
                                {
                                    ko: '정말 초기화하시겠습니까?',
                                    en: 'Are you sure?',
                                    ja: '本当にリセットしますか？',
                                },
                                lang
                            )}
                        </p>

                        {/* Description */}
                        <p className="text-center text-sm text-white/60 leading-relaxed">
                            {localizeText(
                                {
                                    ko: '모든 진행 상황과 설정이 삭제됩니다.\n구매 항목은 복원할 수 있습니다.',
                                    en: 'All progress and settings will be deleted.\nPurchases can be restored.',
                                    ja: 'すべての進行状況と設定が削除されます。\n購入は復元可能です。',
                                },
                                lang
                            )}
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={handleCloseConfirm}
                                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
                                style={{
                                    background: theme.bgPanelLight,
                                    border: `3px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                }}
                            >
                                {localizeText(
                                    { ko: '취소', en: 'Cancel', ja: 'キャンセル' },
                                    lang
                                )}
                            </button>
                            <button
                                onClick={handleResetAllData}
                                className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-[0.97]"
                                style={{
                                    background: theme.red,
                                    border: `3px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                }}
                            >
                                {localizeText(
                                    { ko: '초기화', en: 'Reset', ja: 'リセット' },
                                    lang
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
