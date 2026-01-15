import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Check, RefreshCw, Loader2, Trash2, AlertTriangle, Bug, ChevronDown } from 'lucide-react'
import { useInAppPurchase } from '@/hooks/useInAppPurchase'
import { usePurchaseStore } from '@/stores/purchaseStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useFormulaUnlockStore } from '@/stores/formulaUnlockStore'
import { cn } from '@/lib/utils'

// 개발 빌드 여부
const IS_DEV = import.meta.env.DEV

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
    const isKorean = i18n.language === 'ko'
    const { isAdFree, setAdFree, reset: resetPurchase } = usePurchaseStore()
    const { resetCollection } = useCollectionStore()
    const { unlockAll, unlockedFormulas } = useFormulaUnlockStore()
    const [allUnlocked, setAllUnlocked] = useState(false)
    const [showResetConfirm, setShowResetConfirm] = useState(false)
    const [showDebugSection, setShowDebugSection] = useState(false)
    const [debugEnabled, setDebugEnabled] = useState(() => {
        return localStorage.getItem('wobble-debug-enabled') === 'true'
    })
    const {
        isNative,
        product,
        isLoading,
        error,
        loadProduct,
        purchaseRemoveAds,
        restorePurchases,
    } = useInAppPurchase()

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

    useEffect(() => {
        // 개발 모드에서도 상품 정보 로드 (가격 표시용)
        if (isOpen && isNative && !isAdFree) {
            loadProduct()
        }
    }, [isOpen, isNative, isAdFree, loadProduct])

    if (!isOpen) return null

    const handlePurchase = async () => {
        // 실제 IAP 진행 (프로덕션/개발 모두)
        const success = await purchaseRemoveAds()
        if (success) {
            onClose()
        }
    }

    const handleRestore = async () => {
        await restorePurchases()
    }

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
                    {/* Ad Status */}
                    <div
                        className="p-4 rounded-xl relative overflow-hidden"
                        style={{
                            background: isAdFree ? 'rgba(46, 204, 113, 0.15)' : theme.bgPanelLight,
                            border: `3px solid ${isAdFree ? theme.green : theme.border}`,
                            boxShadow: isAdFree
                                ? `0 3px 0 ${theme.border}, 0 0 12px ${theme.green}30`
                                : `0 3px 0 ${theme.border}`,
                        }}
                    >
                        {/* Shine effect when ad-free */}
                        {isAdFree && (
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.green} 0%, transparent 50%, transparent 100%)`,
                                }}
                            />
                        )}

                        <div className="flex items-center gap-3 relative">
                            {isAdFree ? (
                                <div
                                    className="w-11 h-11 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: theme.green,
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: `0 2px 0 ${theme.border}`,
                                    }}
                                >
                                    <Check className="w-6 h-6 text-white" />
                                </div>
                            ) : (
                                <div
                                    className="w-11 h-11 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: theme.bgPanel,
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: `0 2px 0 ${theme.border}`,
                                    }}
                                >
                                    <span className="text-xl">📺</span>
                                </div>
                            )}
                            <div className="flex-1">
                                <p
                                    className="font-black"
                                    style={{
                                        color: isAdFree ? theme.green : 'white',
                                        textShadow: isAdFree ? 'none' : '0 1px 0 rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {isAdFree
                                        ? t('settings.adFree', 'Ads Removed')
                                        : t('settings.removeAds', 'Remove Ads')}
                                </p>
                                <p className="text-sm text-white/50 font-medium">
                                    {isAdFree
                                        ? t('settings.adFreeDesc', 'Enjoy ad-free experience!')
                                        : t('settings.removeAdsDesc', 'One-time purchase')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Button (only if not ad-free) */}
                    {!isAdFree && isNative && (
                        <button
                            onClick={handlePurchase}
                            disabled={isLoading || !product}
                            className={cn(
                                'w-full py-4 rounded-xl font-black text-lg tracking-wide',
                                'transition-all duration-200',
                                'active:scale-[0.97]',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                            style={{
                                background: theme.gold,
                                color: '#1a1a1a',
                                border: `3px solid ${theme.border}`,
                                boxShadow: `0 4px 0 ${theme.border}`,
                            }}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t('settings.loading', 'Loading...')}
                                </span>
                            ) : product ? (
                                <span>
                                    {t('settings.buyFor', 'Buy for')} {product.priceString}
                                </span>
                            ) : (
                                t('settings.loadingProduct', 'Loading product...')
                            )}
                        </button>
                    )}

                    {/* Web fallback message (프로덕션 웹에서만) */}
                    {!isAdFree && !isNative && (
                        <div
                            className="p-4 rounded-xl"
                            style={{
                                background: theme.bgPanelLight,
                                border: `3px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                            }}
                        >
                            <p className="text-sm text-white/50 text-center font-medium">
                                {t('settings.webOnly', 'Purchases available in the mobile app')}
                            </p>
                        </div>
                    )}

                    {/* Restore Purchases */}
                    {!isAdFree && isNative && (
                        <button
                            onClick={handleRestore}
                            disabled={isLoading}
                            className={cn(
                                'w-full py-3 rounded-xl font-bold',
                                'transition-all duration-200',
                                'active:scale-[0.97]',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                            style={{
                                background: theme.bgPanelLight,
                                color: theme.blue,
                                border: `3px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                            }}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                                {t('settings.restore', 'Restore Purchases')}
                            </span>
                        </button>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div
                            className="p-3 rounded-lg"
                            style={{
                                background: 'rgba(232, 93, 76, 0.2)',
                                border: `2px solid ${theme.red}`,
                            }}
                        >
                            <p className="text-sm text-center font-medium" style={{ color: theme.red }}>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Debug Section - 개발 빌드에서만 표시 */}
                    {IS_DEV && (
                        <div
                            className="rounded-xl overflow-hidden"
                            style={{
                                background: theme.bgPanelLight,
                                border: `3px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                            }}
                        >
                            {/* Debug Section Header */}
                            <button
                                onClick={() => setShowDebugSection(!showDebugSection)}
                                className="w-full p-4 flex items-center gap-3 transition-all active:scale-[0.99]"
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: theme.purple,
                                        border: `2px solid ${theme.border}`,
                                        boxShadow: `0 2px 0 ${theme.border}`,
                                    }}
                                >
                                    <Bug className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-white">
                                        {isKorean ? '개발자 옵션' : 'Developer Options'}
                                    </p>
                                    <p className="text-xs text-white/50 font-medium">
                                        DEV BUILD ONLY
                                    </p>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'w-5 h-5 text-white/50 transition-transform',
                                        showDebugSection && 'rotate-180'
                                    )}
                                />
                            </button>

                            {/* Debug Section Content */}
                            {showDebugSection && (
                                <div
                                    className="p-4 pt-0 space-y-3"
                                    style={{ borderTop: `2px solid ${theme.border}` }}
                                >
                                    {/* Debug Overlay Toggle */}
                                    <div
                                        className="p-3 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                                        style={{
                                            background: debugEnabled ? 'rgba(232, 93, 76, 0.2)' : theme.bgPanel,
                                            border: `2px solid ${debugEnabled ? theme.red : theme.border}`,
                                        }}
                                        onClick={() => {
                                            const newValue = !debugEnabled
                                            setDebugEnabled(newValue)
                                            localStorage.setItem('wobble-debug-enabled', String(newValue))
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-white">
                                                {isKorean ? '디버그 오버레이' : 'Debug Overlay'}
                                            </span>
                                            <div
                                                className="w-12 h-6 rounded-md relative transition-all"
                                                style={{
                                                    background: debugEnabled ? theme.red : theme.bgPanelLight,
                                                    border: `2px solid ${theme.border}`,
                                                }}
                                            >
                                                <div
                                                    className={cn(
                                                        'absolute top-0.5 w-5 h-5 rounded bg-white transition-all',
                                                        debugEnabled ? 'left-5' : 'left-0.5'
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Force Remove Ads */}
                                    {!isAdFree && (
                                        <button
                                            onClick={() => {
                                                setAdFree(true)
                                                onClose()
                                            }}
                                            className="w-full py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97]"
                                            style={{
                                                background: theme.red,
                                                color: '#fff',
                                                border: `2px solid ${theme.border}`,
                                                boxShadow: `0 2px 0 ${theme.border}`,
                                            }}
                                        >
                                            Force Remove Ads
                                        </button>
                                    )}

                                    {/* Unlock All Formulas */}
                                    <button
                                        onClick={() => {
                                            unlockAll()
                                            setAllUnlocked(true)
                                            setTimeout(() => setAllUnlocked(false), 2000)
                                        }}
                                        disabled={allUnlocked}
                                        className="w-full py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-80"
                                        style={{
                                            background: allUnlocked ? theme.green : theme.purple,
                                            color: '#fff',
                                            border: `2px solid ${theme.border}`,
                                            boxShadow: `0 2px 0 ${theme.border}`,
                                        }}
                                    >
                                        {allUnlocked ? '✓ Unlocked!' : `Unlock All Formulas (${unlockedFormulas.size})`}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

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
                                {isKorean ? '모든 데이터 초기화' : 'Reset All Data'}
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
                                        {isKorean
                                            ? '정말 초기화하시겠습니까?'
                                            : 'Are you sure?'}
                                    </p>
                                    <p className="text-xs text-white/50 mt-1 font-medium">
                                        {isKorean
                                            ? '모든 진행 상황과 설정이 삭제됩니다. 광고 제거 구매는 복원할 수 있습니다.'
                                            : 'All progress and settings will be deleted. Ad removal can be restored.'}
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
                                    {isKorean ? '취소' : 'Cancel'}
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
                                    {isKorean ? '초기화' : 'Reset'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
