import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Loader2, RefreshCw, Sparkles, Ban, CheckCircle, AlertCircle } from 'lucide-react'
import Balatro from '@/components/Balatro'
import { shopPreset } from '@/config/backgroundPresets'
import { useInAppPurchase } from '@/hooks/useInAppPurchase'
import { usePurchaseStore } from '@/stores/purchaseStore'
import { cn } from '@/lib/utils'
import { t } from '@/utils/localization'

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

interface ShopScreenProps {
    onBack: () => void
}

type RestoreResult = 'success' | 'no_purchases' | null

export function ShopScreen({ onBack }: ShopScreenProps) {
    const { i18n } = useTranslation()
    const lang = i18n.language
    const { isAdFree, isAllFormulasUnlocked } = usePurchaseStore()
    const [restoreResult, setRestoreResult] = useState<RestoreResult>(null)
    const {
        isNative,
        removeAdsProduct,
        unlockAllFormulasProduct,
        isLoading,
        error,
        loadProducts,
        purchaseRemoveAds,
        purchaseUnlockAllFormulas,
        restorePurchases,
    } = useInAppPurchase()

    useEffect(() => {
        if (isNative) {
            loadProducts()
        }
    }, [isNative, loadProducts])

    const handlePurchaseRemoveAds = async () => {
        await purchaseRemoveAds()
    }

    const handlePurchaseUnlockAll = async () => {
        await purchaseUnlockAllFormulas()
    }

    const handleRestore = async () => {
        setRestoreResult(null)
        const hasRestoredPurchases = await restorePurchases()
        setRestoreResult(hasRestoredPurchases ? 'success' : 'no_purchases')
        setTimeout(() => setRestoreResult(null), 3000)
    }

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: theme.felt }}>
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-40">
                <Balatro
                    color1={shopPreset.color1}
                    color2={shopPreset.color2}
                    color3={shopPreset.color3}
                    spinSpeed={shopPreset.spinSpeed}
                    spinRotation={shopPreset.spinRotation}
                    contrast={shopPreset.contrast}
                    lighting={shopPreset.lighting}
                    spinAmount={shopPreset.spinAmount}
                    pixelFilter={shopPreset.pixelFilter}
                    isRotate={shopPreset.isRotate}
                    mouseInteraction={false}
                />
            </div>

            {/* Felt texture overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.3) 100%)',
                }}
            />

            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

            {/* Header */}
            <div
                className="absolute z-20 flex items-center gap-3"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 16px)',
                    left: 'max(env(safe-area-inset-left, 0px), 16px)',
                }}
            >
                <button
                    onClick={onBack}
                    className="h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                        boxShadow: `0 3px 0 ${theme.border}`,
                    }}
                >
                    <ArrowLeft className="w-5 h-5 text-white/80" />
                </button>
                <h1
                    className="text-2xl font-black tracking-wide"
                    style={{
                        color: theme.gold,
                        textShadow: '0 2px 0 #8a6d1a',
                    }}
                >
                    {t({ ko: '상점', en: 'Shop', ja: 'ショップ' }, lang)}
                </h1>
            </div>

            {/* Content */}
            <div
                className="relative z-10 h-full flex flex-col overflow-y-auto"
                style={{
                    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 60px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 100px)',
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
                }}
            >
                <div className="space-y-4 max-w-md mx-auto w-full">
                    {/* Remove Ads Item */}
                    <div
                        className="p-4 rounded-xl relative overflow-hidden"
                        style={{
                            background: isAdFree ? 'rgba(46, 204, 113, 0.15)' : theme.bgPanel,
                            border: `3px solid ${isAdFree ? theme.green : theme.border}`,
                            boxShadow: isAdFree
                                ? `0 4px 0 ${theme.border}, 0 0 20px ${theme.green}30`
                                : `0 4px 0 ${theme.border}`,
                        }}
                    >
                        {isAdFree && (
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.green} 0%, transparent 50%, transparent 100%)`,
                                }}
                            />
                        )}

                        <div className="flex items-start gap-4 relative">
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: isAdFree ? theme.green : theme.gold,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                }}
                            >
                                {isAdFree ? (
                                    <Check className="w-7 h-7 text-white" />
                                ) : (
                                    <Ban className="w-7 h-7 text-black" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3
                                    className="text-lg font-black"
                                    style={{
                                        color: isAdFree ? theme.green : 'white',
                                        textShadow: isAdFree ? 'none' : '0 1px 0 rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {t(
                                        { ko: '광고 제거', en: 'Remove Ads', ja: '広告を削除' },
                                        lang
                                    )}
                                </h3>
                                <p className="text-sm text-white/50 font-medium mt-1">
                                    {isAdFree
                                        ? t(
                                              {
                                                  ko: '광고 없이 즐기고 있어요!',
                                                  en: 'Enjoying ad-free experience!',
                                                  ja: '広告なしで楽しんでいます！',
                                              },
                                              lang
                                          )
                                        : t(
                                              {
                                                  ko: '하단 배너 광고를 영구적으로 제거합니다',
                                                  en: 'Permanently remove bottom banner ads',
                                                  ja: '下部のバナー広告を永久に削除します',
                                              },
                                              lang
                                          )}
                                </p>

                                {!isAdFree && isNative && (
                                    <button
                                        onClick={handlePurchaseRemoveAds}
                                        disabled={isLoading || !removeAdsProduct}
                                        className={cn(
                                            'mt-3 w-full py-3 rounded-lg font-black text-base tracking-wide',
                                            'transition-all duration-200',
                                            'active:scale-[0.97]',
                                            'disabled:opacity-50 disabled:cursor-not-allowed'
                                        )}
                                        style={{
                                            background: theme.gold,
                                            color: '#1a1a1a',
                                            border: `2px solid ${theme.border}`,
                                            boxShadow: `0 3px 0 ${theme.border}`,
                                        }}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                {t(
                                                    {
                                                        ko: '로딩...',
                                                        en: 'Loading...',
                                                        ja: '読み込み中...',
                                                    },
                                                    lang
                                                )}
                                            </span>
                                        ) : removeAdsProduct ? (
                                            removeAdsProduct.priceString
                                        ) : (
                                            t(
                                                {
                                                    ko: '로딩 중...',
                                                    en: 'Loading...',
                                                    ja: '読み込み中...',
                                                },
                                                lang
                                            )
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Unlock All Formulas Item */}
                    <div
                        className="p-4 rounded-xl relative overflow-hidden"
                        style={{
                            background: isAllFormulasUnlocked
                                ? 'rgba(46, 204, 113, 0.15)'
                                : theme.bgPanel,
                            border: `3px solid ${isAllFormulasUnlocked ? theme.green : theme.border}`,
                            boxShadow: isAllFormulasUnlocked
                                ? `0 4px 0 ${theme.border}, 0 0 20px ${theme.green}30`
                                : `0 4px 0 ${theme.border}`,
                        }}
                    >
                        {isAllFormulasUnlocked && (
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.green} 0%, transparent 50%, transparent 100%)`,
                                }}
                            />
                        )}

                        <div className="flex items-start gap-4 relative">
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: isAllFormulasUnlocked ? theme.green : theme.purple,
                                    border: `2px solid ${theme.border}`,
                                    boxShadow: `0 3px 0 ${theme.border}`,
                                }}
                            >
                                {isAllFormulasUnlocked ? (
                                    <Check className="w-7 h-7 text-white" />
                                ) : (
                                    <Sparkles className="w-7 h-7 text-white" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3
                                    className="text-lg font-black"
                                    style={{
                                        color: isAllFormulasUnlocked ? theme.green : 'white',
                                        textShadow: isAllFormulasUnlocked
                                            ? 'none'
                                            : '0 1px 0 rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {t(
                                        {
                                            ko: '모든 공식 해금',
                                            en: 'Unlock All Formulas',
                                            ja: '全公式をアンロック',
                                        },
                                        lang
                                    )}
                                </h3>
                                <p className="text-sm text-white/50 font-medium mt-1">
                                    {isAllFormulasUnlocked
                                        ? t(
                                              {
                                                  ko: '모든 공식을 이용할 수 있어요!',
                                                  en: 'All formulas are available!',
                                                  ja: 'すべての公式が利用可能です！',
                                              },
                                              lang
                                          )
                                        : t(
                                              {
                                                  ko: '모든 공식을 영구적으로 해금합니다. 향후 추가되는 공식도 포함됩니다.',
                                                  en: 'Permanently unlock all formulas, including future additions.',
                                                  ja: 'すべての公式を永久にアンロックします。今後追加される公式も含まれます。',
                                              },
                                              lang
                                          )}
                                </p>

                                {!isAllFormulasUnlocked && isNative && (
                                    <button
                                        onClick={handlePurchaseUnlockAll}
                                        disabled={isLoading || !unlockAllFormulasProduct}
                                        className={cn(
                                            'mt-3 w-full py-3 rounded-lg font-black text-base tracking-wide',
                                            'transition-all duration-200',
                                            'active:scale-[0.97]',
                                            'disabled:opacity-50 disabled:cursor-not-allowed'
                                        )}
                                        style={{
                                            background: theme.purple,
                                            color: 'white',
                                            border: `2px solid ${theme.border}`,
                                            boxShadow: `0 3px 0 ${theme.border}`,
                                        }}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                {t(
                                                    {
                                                        ko: '로딩...',
                                                        en: 'Loading...',
                                                        ja: '読み込み中...',
                                                    },
                                                    lang
                                                )}
                                            </span>
                                        ) : unlockAllFormulasProduct ? (
                                            unlockAllFormulasProduct.priceString
                                        ) : (
                                            t(
                                                {
                                                    ko: '로딩 중...',
                                                    en: 'Loading...',
                                                    ja: '読み込み中...',
                                                },
                                                lang
                                            )
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Web fallback message */}
                    {!isNative && (!isAdFree || !isAllFormulasUnlocked) && (
                        <div
                            className="p-4 rounded-xl"
                            style={{
                                background: theme.bgPanelLight,
                                border: `3px solid ${theme.border}`,
                                boxShadow: `0 3px 0 ${theme.border}`,
                            }}
                        >
                            <p className="text-sm text-white/50 text-center font-medium">
                                {t(
                                    {
                                        ko: '구매는 모바일 앱에서만 가능합니다',
                                        en: 'Purchases available in the mobile app',
                                        ja: '購入はモバイルアプリでのみ可能です',
                                    },
                                    lang
                                )}
                            </p>
                        </div>
                    )}

                    {/* Restore Purchases */}
                    {isNative && (!isAdFree || !isAllFormulasUnlocked) && (
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
                                {t(
                                    { ko: '구매 복원', en: 'Restore Purchases', ja: '購入を復元' },
                                    lang
                                )}
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
                            <p
                                className="text-sm text-center font-medium"
                                style={{ color: theme.red }}
                            >
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Restore Result Message */}
                    {restoreResult && (
                        <div
                            className="p-3 rounded-lg flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                            style={{
                                background:
                                    restoreResult === 'success'
                                        ? 'rgba(46, 204, 113, 0.2)'
                                        : 'rgba(74, 158, 255, 0.2)',
                                border: `2px solid ${restoreResult === 'success' ? theme.green : theme.blue}`,
                            }}
                        >
                            {restoreResult === 'success' ? (
                                <CheckCircle className="w-4 h-4" style={{ color: theme.green }} />
                            ) : (
                                <AlertCircle className="w-4 h-4" style={{ color: theme.blue }} />
                            )}
                            <p
                                className="text-sm text-center font-medium"
                                style={{ color: restoreResult === 'success' ? theme.green : theme.blue }}
                            >
                                {restoreResult === 'success'
                                    ? t(
                                          {
                                              ko: '구매가 복원되었습니다!',
                                              en: 'Purchases restored!',
                                              ja: '購入が復元されました！',
                                          },
                                          lang
                                      )
                                    : t(
                                          {
                                              ko: '복원할 구매 내역이 없습니다',
                                              en: 'No purchases to restore',
                                              ja: '復元する購入履歴がありません',
                                          },
                                          lang
                                      )}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
