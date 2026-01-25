import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import ko from './locales/ko.json'
import ja from './locales/ja.json'
import es from './locales/es.json'
import pt from './locales/pt.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'

const resources = {
    en: { translation: en },
    ko: { translation: ko },
    ja: { translation: ja },
    es: { translation: es },
    pt: { translation: pt },
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
}

// Normalize language code (ko-KR -> ko, en-US -> en, ja-JP -> ja, zh-CN -> zh-CN, zh-TW -> zh-TW)
const normalizeLanguage = (lng: string | undefined): string => {
    if (!lng) return 'ko'
    const lower = lng.toLowerCase()
    // Handle Chinese variants first (before splitting by -)
    if (lower === 'zh-cn' || lower === 'zh-hans' || lower === 'zh-sg') return 'zh-CN'
    if (lower === 'zh-tw' || lower === 'zh-hant' || lower === 'zh-hk' || lower === 'zh-mo')
        return 'zh-TW'
    if (lower.startsWith('zh')) return 'zh-CN' // Default Chinese to Simplified
    const base = lower.split('-')[0]
    if (base === 'en') return 'en'
    if (base === 'ja') return 'ja'
    if (base === 'es') return 'es'
    if (base === 'pt') return 'pt'
    return 'ko'
}

// Get initial language from localStorage or navigator
const getInitialLanguage = (): string => {
    const stored = localStorage.getItem('wobble-language')
    if (stored) return normalizeLanguage(stored)
    return normalizeLanguage(navigator.language)
}

i18n.use(initReactI18next).init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'en', 'ja', 'es', 'pt', 'zh-CN', 'zh-TW'],
    debug: import.meta.env.DEV,
    interpolation: {
        escapeValue: false,
    },
})

// Save language to localStorage when changed
i18n.on('languageChanged', (lng) => {
    const normalized = normalizeLanguage(lng)
    if (lng !== normalized) {
        i18n.changeLanguage(normalized)
    } else {
        localStorage.setItem('wobble-language', normalized)
    }
})

export default i18n
