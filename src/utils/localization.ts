/**
 * Localization utilities for multi-language support
 *
 * Usage:
 *   import { t, tArray, LocalizedText } from '@/utils/localization'
 *
 *   // In data files:
 *   name: { ko: '한글', en: 'English', ja: '日本語' }
 *
 *   // In components:
 *   const { i18n } = useTranslation()
 *   t(item.name, i18n.language)
 */

// Type for localized text - language code to string mapping
export type LocalizedText = Record<string, string>

// Type for localized arrays - language code to string array mapping
export type LocalizedArray = Record<string, string[]>

// Supported languages (single source of truth)
export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ko'
export const FALLBACK_LANGUAGE: SupportedLanguage = 'en'

/**
 * Get localized text with fallback chain
 * @param text LocalizedText object or undefined
 * @param lang Current language code
 * @returns Localized string, falls back to English, then first available
 */
export function t(text: LocalizedText | undefined, lang: string): string {
    if (!text) return ''
    return text[lang] || text[FALLBACK_LANGUAGE] || Object.values(text)[0] || ''
}

/**
 * Get localized array with fallback chain
 * @param text LocalizedArray object or undefined
 * @param lang Current language code
 * @returns Localized string array, falls back to English, then first available
 */
export function tArray(text: LocalizedArray | undefined, lang: string): string[] {
    if (!text) return []
    return text[lang] || text[FALLBACK_LANGUAGE] || Object.values(text)[0] || []
}
