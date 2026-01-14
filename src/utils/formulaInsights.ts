/**
 * Formula Insights - Contextual feedback for formula results
 * Reads getInsight function from each formula definition
 */

import { formulas as formulaRegistry } from '@/formulas/registry'
import type { Insight } from '@/formulas/types'

/**
 * Get contextual insight for a formula result
 */
export function getFormulaInsight(
    formulaId: string,
    variables: Record<string, number>
): Insight | null {
    const formula = formulaRegistry[formulaId]
    if (!formula?.getInsight) return null

    try {
        return formula.getInsight(variables)
    } catch {
        return null
    }
}

/**
 * Get insight text based on language
 */
export function getInsightText(
    formulaId: string,
    variables: Record<string, number>,
    isKorean: boolean
): string | null {
    const insight = getFormulaInsight(formulaId, variables)
    if (!insight) return null
    return isKorean ? insight.ko : insight.en
}
