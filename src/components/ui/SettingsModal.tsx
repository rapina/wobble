import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Check, RefreshCw, Loader2, Trash2, AlertTriangle, Bug } from 'lucide-react'
import { useInAppPurchase } from '@/hooks/useInAppPurchase'
import { usePurchaseStore } from '@/stores/purchaseStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useFormulaUnlockStore } from '@/stores/formulaUnlockStore'
import { IS_AD_TESTING } from '@/hooks/useAdMob'
import { cn } from '@/lib/utils'

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className={cn(
                    'relative w-full max-w-sm',
                    'rounded-2xl border-4 border-[#F5B041]',
                    'overflow-hidden'
                )}
                style={{
                    background: 'linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%)',
                    boxShadow: '0 0 40px rgba(245, 176, 65, 0.3), 0 8px 32px rgba(0,0,0,0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <h2 className="text-xl font-bold" style={{ color: '#F5B041' }}>
                        {t('settings.title', 'Settings')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors hover:bg-white/10 active:scale-95"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Ad Status */}
                    <div
                        className="p-4 rounded-xl"
                        style={{
                            background: isAdFree
                                ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.2) 0%, rgba(39, 174, 96, 0.1) 100%)'
                                : 'rgba(255,255,255,0.05)',
                            border: isAdFree
                                ? '2px solid rgba(46, 204, 113, 0.5)'
                                : '2px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            {isAdFree ? (
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-green-400" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <span className="text-lg">{t('settings.adIcon', '📺')}</span>
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="font-semibold text-white">
                                    {isAdFree
                                        ? t('settings.adFree', 'Ads Removed')
                                        : t('settings.removeAds', 'Remove Ads')}
                                </p>
                                <p className="text-sm text-white/50">
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
                                'w-full py-4 rounded-xl font-bold text-lg',
                                'transition-all duration-200',
                                'hover:scale-[1.02] active:scale-[0.98]',
                                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                            )}
                            style={{
                                background: 'linear-gradient(135deg, #F5B041 0%, #E67E22 100%)',
                                color: '#1a1a2e',
                                boxShadow: '0 4px 0 #b8860b, 0 6px 20px rgba(245, 176, 65, 0.3)',
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

                    {/* DEBUG: Force Remove Ads Button (테스트 모드에서만) */}
                    {!isAdFree && IS_AD_TESTING && (
                        <button
                            onClick={() => {
                                setAdFree(true)
                                onClose()
                            }}
                            className={cn(
                                'w-full py-3 rounded-xl font-bold text-sm',
                                'transition-all duration-200',
                                'hover:scale-[1.02] active:scale-[0.98]'
                            )}
                            style={{
                                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                                color: '#fff',
                                boxShadow: '0 4px 0 #922b21, 0 6px 20px rgba(231, 76, 60, 0.3)',
                            }}
                        >
                            DEBUG: Force Remove Ads
                        </button>
                    )}

                    {/* DEBUG: Unlock All Formulas Button (테스트 모드에서만) */}
                    {IS_AD_TESTING && (
                        <button
                            onClick={() => {
                                unlockAll()
                                setAllUnlocked(true)
                                setTimeout(() => setAllUnlocked(false), 2000)
                            }}
                            disabled={allUnlocked}
                            className={cn(
                                'w-full py-3 rounded-xl font-bold text-sm',
                                'transition-all duration-200',
                                'hover:scale-[1.02] active:scale-[0.98]',
                                'disabled:opacity-70'
                            )}
                            style={{
                                background: allUnlocked
                                    ? 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)'
                                    : 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                                color: '#fff',
                                boxShadow: allUnlocked
                                    ? '0 4px 0 #145a32, 0 6px 20px rgba(39, 174, 96, 0.3)'
                                    : '0 4px 0 #5b2c6f, 0 6px 20px rgba(155, 89, 182, 0.3)',
                            }}
                        >
                            {allUnlocked ? '✓ All Formulas Unlocked!' : `DEBUG: Unlock All Formulas (${unlockedFormulas.size})`}
                        </button>
                    )}

                    {/* Web fallback message (프로덕션 웹에서만) */}
                    {!isAdFree && !isNative && !IS_AD_TESTING && (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-sm text-white/60 text-center">
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
                                'w-full py-3 rounded-xl font-medium',
                                'transition-all duration-200',
                                'hover:bg-white/10 active:scale-[0.98]',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: '#5DADE2',
                                border: '2px solid rgba(93, 173, 226, 0.3)',
                            }}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                                {t('settings.restore', 'Restore Purchases')}
                            </span>
                        </button>
                    )}

                    {/* Error Message */}
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    {/* Debug Mode Toggle */}
                    <div
                        className="p-4 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                        style={{
                            background: debugEnabled
                                ? 'rgba(255, 100, 100, 0.15)'
                                : 'rgba(255,255,255,0.05)',
                            border: debugEnabled
                                ? '2px solid rgba(255, 100, 100, 0.5)'
                                : '2px solid rgba(255,255,255,0.1)',
                        }}
                        onClick={() => {
                            const newValue = !debugEnabled
                            setDebugEnabled(newValue)
                            localStorage.setItem('wobble-debug-enabled', String(newValue))
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                    background: debugEnabled ? 'rgba(255,100,100,0.3)' : 'rgba(255,255,255,0.1)',
                                }}
                            >
                                <Bug className={`w-5 h-5 ${debugEnabled ? 'text-red-400' : 'text-white/50'}`} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-white">
                                    {isKorean ? '디버그 모드' : 'Debug Mode'}
                                </p>
                                <p className="text-sm text-white/50">
                                    {debugEnabled
                                        ? isKorean ? '디버그 오버레이 활성화됨' : 'Debug overlay enabled'
                                        : isKorean ? '탭하여 활성화' : 'Tap to enable'}
                                </p>
                            </div>
                            <div
                                className={cn(
                                    'w-12 h-7 rounded-full transition-all relative',
                                    debugEnabled ? 'bg-red-500' : 'bg-white/20'
                                )}
                            >
                                <div
                                    className={cn(
                                        'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                                        debugEnabled ? 'left-6' : 'left-1'
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                        {/* Reset All Data Button */}
                        {!showResetConfirm ? (
                            <button
                                onClick={() => setShowResetConfirm(true)}
                                className={cn(
                                    'w-full py-3 rounded-xl font-medium',
                                    'transition-all duration-200',
                                    'hover:bg-red-500/20 active:scale-[0.98]'
                                )}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,100,100,0.8)',
                                    border: '2px solid rgba(255,100,100,0.3)',
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
                                    background: 'rgba(255,100,100,0.1)',
                                    border: '2px solid rgba(255,100,100,0.4)',
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-red-400">
                                            {isKorean
                                                ? '정말 초기화하시겠습니까?'
                                                : 'Are you sure?'}
                                        </p>
                                        <p className="text-xs text-white/50 mt-1">
                                            {isKorean
                                                ? '모든 진행 상황과 설정이 삭제됩니다. 광고 제거 구매는 복원할 수 있습니다.'
                                                : 'All progress and settings will be deleted. Ad removal purchase can be restored.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowResetConfirm(false)}
                                        className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/70 transition-all active:scale-[0.98]"
                                    >
                                        {isKorean ? '취소' : 'Cancel'}
                                    </button>
                                    <button
                                        onClick={handleResetAllData}
                                        className="flex-1 py-2 rounded-lg text-sm font-bold bg-red-500 text-white transition-all active:scale-[0.98]"
                                    >
                                        {isKorean ? '초기화' : 'Reset'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
