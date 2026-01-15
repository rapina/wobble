import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import ko from './locales/ko.json'
import ja from './locales/ja.json'

const resources = {
    en: { translation: en },
    ko: { translation: ko },
    ja: { translation: ja },
}

// Normalize language code (ko-KR -> ko, en-US -> en, ja-JP -> ja)
const normalizeLanguage = (lng: string | undefined): string => {
    if (!lng) return 'ko'
    const base = lng.split('-')[0].toLowerCase()
    if (base === 'en') return 'en'
    if (base === 'ja') return 'ja'
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
    supportedLngs: ['ko', 'en', 'ja'],
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
