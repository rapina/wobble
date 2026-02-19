import { useTranslation } from 'react-i18next'
import { Formula, Variable } from '@/formulas/types'
import { t, tArray, LocalizedText } from '@/utils/localization'

export interface LocalizedFormula {
    name: string
    description: string
    simulationHint?: string
    applications: string[]
}

export interface LocalizedVariable extends Omit<Variable, 'name'> {
    name: LocalizedText
    localizedName: string
}

export function useLocalizedFormula(formula: Formula | null): LocalizedFormula | null {
    const { i18n } = useTranslation()
    const lang = i18n.language

    if (!formula) return null

    return {
        name: t(formula.name, lang),
        description: t(formula.description, lang),
        simulationHint: formula.simulationHint ? t(formula.simulationHint, lang) : undefined,
        applications: tArray(formula.applications, lang),
    }
}

export function useLocalizedVariables(variables: Variable[]): LocalizedVariable[] {
    const { i18n } = useTranslation()
    const lang = i18n.language

    return variables.map((v) => ({
        ...v,
        localizedName: t(v.name, lang),
    }))
}
