import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const LANGUAGES = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
    { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
] as const

const theme = {
    bgPanel: '#374244',
    border: '#1a1a1a',
    gold: '#c9a227',
}

export function LanguageToggle() {
    const { i18n } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)

    const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

    const handleSelect = (code: string) => {
        i18n.changeLanguage(code)
        setIsOpen(false)
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="relative h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95"
                style={{
                    background: theme.bgPanel,
                    border: `2px solid ${theme.border}`,
                    boxShadow: `0 3px 0 ${theme.border}`,
                }}
                aria-label="Select language"
            >
                <span className="text-lg">{currentLang.flag}</span>
            </button>

            {/* Language Selection Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.8)' }}
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="relative w-full max-w-xs rounded-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
                        style={{
                            background: `linear-gradient(180deg, ${theme.bgPanel} 0%, #2a3234 100%)`,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 8px 0 ${theme.border}, 0 12px 40px rgba(0,0,0,0.5)`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-4 py-3"
                            style={{
                                borderBottom: `2px solid ${theme.border}`,
                                background: 'rgba(0,0,0,0.2)',
                            }}
                        >
                            <span
                                className="text-base font-black tracking-wide"
                                style={{ color: theme.gold }}
                            >
                                🌐 Language
                            </span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                }}
                            >
                                <X className="w-5 h-5 text-white/70" />
                            </button>
                        </div>

                        {/* Language List */}
                        <div className="p-3 grid grid-cols-1 gap-2">
                            {LANGUAGES.map((lang) => {
                                const isSelected = lang.code === i18n.language
                                return (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleSelect(lang.code)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.98]"
                                        style={{
                                            background: isSelected
                                                ? `${theme.gold}20`
                                                : 'rgba(255,255,255,0.05)',
                                            border: isSelected
                                                ? `2px solid ${theme.gold}`
                                                : '2px solid transparent',
                                            boxShadow: isSelected
                                                ? `0 0 15px ${theme.gold}30`
                                                : 'none',
                                        }}
                                    >
                                        <span className="text-2xl">{lang.flag}</span>
                                        <span
                                            className="text-base font-bold"
                                            style={{
                                                color: isSelected ? theme.gold : 'white',
                                            }}
                                        >
                                            {lang.label}
                                        </span>
                                        {isSelected && (
                                            <span
                                                className="ml-auto text-xs font-bold px-2 py-1 rounded"
                                                style={{
                                                    background: theme.gold,
                                                    color: theme.border,
                                                }}
                                            >
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
