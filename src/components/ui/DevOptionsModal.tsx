import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Bug } from 'lucide-react'
import { usePurchaseStore } from '@/stores/purchaseStore'
import { useFormulaUnlockStore } from '@/stores/formulaUnlockStore'
import { cn } from '@/lib/utils'

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

interface DevOptionsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function DevOptionsModal({ isOpen, onClose }: DevOptionsModalProps) {
    const { i18n } = useTranslation()
    const isKorean = i18n.language === 'ko'
    const { isAdFree, isAllFormulasUnlocked, setAdFree, setAllFormulasUnlocked } =
        usePurchaseStore()
    const { unlockAll, unlockedFormulas } = useFormulaUnlockStore()
    const [allUnlocked, setAllUnlocked] = useState(false)
    const [debugEnabled, setDebugEnabled] = useState(() => {
        return localStorage.getItem('wobble-debug-enabled') === 'true'
    })

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
                    border: `4px solid ${theme.purple}`,
                    boxShadow: `0 6px 0 ${theme.border}, 0 0 40px rgba(155, 89, 182, 0.3)`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{
                        background: theme.purple,
                        borderBottom: `3px solid ${theme.border}`,
                    }}
                >
                    <div className="flex items-center gap-3">
                        <Bug className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-black tracking-wide text-white">
                            {isKorean ? '개발자 옵션' : 'Developer Options'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95"
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 2px 0 ${theme.border}`,
                        }}
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                    {/* DEV BUILD Badge */}
                    <div
                        className="py-2 px-3 rounded-lg text-center"
                        style={{
                            background: 'rgba(232, 93, 76, 0.2)',
                            border: `2px solid ${theme.red}`,
                        }}
                    >
                        <span className="text-xs font-bold" style={{ color: theme.red }}>
                            DEV BUILD ONLY
                        </span>
                    </div>

                    {/* Debug Overlay Toggle */}
                    <div
                        className="p-3 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                        style={{
                            background: debugEnabled
                                ? 'rgba(232, 93, 76, 0.2)'
                                : theme.bgPanelLight,
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
                                    background: debugEnabled ? theme.red : theme.bgPanel,
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

                    {/* Divider */}
                    <div
                        className="my-2"
                        style={{
                            height: 2,
                            background: theme.border,
                            borderRadius: 1,
                        }}
                    />

                    {/* Force Remove Ads */}
                    {!isAdFree ? (
                        <button
                            onClick={() => setAdFree(true)}
                            className="w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-[0.97]"
                            style={{
                                background: theme.gold,
                                color: '#1a1a1a',
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 2px 0 ${theme.border}`,
                            }}
                        >
                            {isKorean ? '광고 제거 강제 활성화' : 'Force Remove Ads'}
                        </button>
                    ) : (
                        <div
                            className="py-3 rounded-lg text-sm font-bold text-center"
                            style={{
                                background: 'rgba(46, 204, 113, 0.2)',
                                color: theme.green,
                                border: `2px solid ${theme.green}`,
                            }}
                        >
                            {isKorean ? '광고 제거 활성화됨' : 'Ads Removed'}
                        </div>
                    )}

                    {/* Force Unlock All Formulas (Purchase) */}
                    {!isAllFormulasUnlocked ? (
                        <button
                            onClick={() => {
                                setAllFormulasUnlocked(true)
                                unlockAll()
                            }}
                            className="w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-[0.97]"
                            style={{
                                background: theme.purple,
                                color: '#fff',
                                border: `2px solid ${theme.border}`,
                                boxShadow: `0 2px 0 ${theme.border}`,
                            }}
                        >
                            {isKorean
                                ? '모든 공식 영구 해금'
                                : 'Force Unlock All Formulas (Purchase)'}
                        </button>
                    ) : (
                        <div
                            className="py-3 rounded-lg text-sm font-bold text-center"
                            style={{
                                background: 'rgba(46, 204, 113, 0.2)',
                                color: theme.green,
                                border: `2px solid ${theme.green}`,
                            }}
                        >
                            {isKorean
                                ? '모든 공식 영구 해금됨'
                                : 'All Formulas Unlocked (Purchase)'}
                        </div>
                    )}

                    {/* Unlock All Formulas (Session) */}
                    <button
                        onClick={() => {
                            unlockAll()
                            setAllUnlocked(true)
                            setTimeout(() => setAllUnlocked(false), 2000)
                        }}
                        disabled={allUnlocked}
                        className="w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-80"
                        style={{
                            background: allUnlocked ? theme.green : theme.bgPanelLight,
                            color: '#fff',
                            border: `2px solid ${theme.border}`,
                            boxShadow: `0 2px 0 ${theme.border}`,
                        }}
                    >
                        {allUnlocked
                            ? isKorean
                                ? '해금 완료!'
                                : 'Unlocked!'
                            : isKorean
                              ? `공식 세션 해금 (${unlockedFormulas.size})`
                              : `Unlock Formulas Session (${unlockedFormulas.size})`}
                    </button>
                </div>
            </div>
        </div>
    )
}
