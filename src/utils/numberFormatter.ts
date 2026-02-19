/**
 * numberFormatter.ts
 *
 * Utility functions for formatting large numbers in idle game style.
 * Supports K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc suffixes.
 */

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

/**
 * Format a large number with suffix (K, M, B, T, etc.)
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "1.5M" or "123K"
 */
export function formatNumber(num: number, decimals: number = 1): string {
    if (num === 0) return '0'
    if (num < 0) return '-' + formatNumber(-num, decimals)

    // For numbers less than 1000, show as-is (with decimals if needed)
    if (num < 1000) {
        if (Number.isInteger(num)) {
            return num.toString()
        }
        return num.toFixed(decimals).replace(/\.?0+$/, '')
    }

    // Find the appropriate suffix
    const tier = Math.floor(Math.log10(num) / 3)
    const suffixIndex = Math.min(tier, SUFFIXES.length - 1)
    const suffix = SUFFIXES[suffixIndex]
    const scale = Math.pow(10, suffixIndex * 3)
    const scaled = num / scale

    // Format with appropriate decimals
    if (scaled >= 100) {
        // For 100+ show no decimals
        return Math.floor(scaled).toString() + suffix
    } else if (scaled >= 10) {
        // For 10-99 show 1 decimal
        return scaled.toFixed(1).replace(/\.0$/, '') + suffix
    } else {
        // For 1-9.99 show specified decimals
        return scaled.toFixed(decimals).replace(/\.?0+$/, '') + suffix
    }
}

/**
 * Format a number with commas for readability
 * @param num - The number to format
 * @returns Formatted string like "1,234,567"
 */
export function formatWithCommas(num: number): string {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/**
 * Format a number as a compact percentage
 * @param value - The decimal value (0.05 = 5%)
 * @param decimals - Number of decimal places
 * @returns Formatted string like "+5%" or "+0.5%"
 */
export function formatPercent(value: number, decimals: number = 0): string {
    const percent = value * 100
    const formatted = percent.toFixed(decimals).replace(/\.?0+$/, '')
    return (value >= 0 ? '+' : '') + formatted + '%'
}

/**
 * Format production rate per second
 * @param rate - Production rate per second
 * @returns Formatted string like "1.5K/s"
 */
export function formatRate(rate: number): string {
    return formatNumber(rate, 1) + '/s'
}
