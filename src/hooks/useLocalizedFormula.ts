import { useTranslation } from 'react-i18next'
import { Formula, Variable } from '@/formulas/types'

export interface LocalizedFormula {
    name: string
    description: string
    applications: string[]
}

export interface LocalizedVariable extends Variable {
    localizedName: string
}

export function useLocalizedFormula(formula: Formula | null): LocalizedFormula | null {
    const { i18n } = useTranslation()
    const isEnglish = i18n.language === 'en'

    if (!formula) return null

    return {
        name: isEnglish && formula.nameEn ? formula.nameEn : formula.name,
        description:
            isEnglish && formula.descriptionEn ? formula.descriptionEn : formula.description,
        applications:
            isEnglish && formula.applicationsEn
                ? formula.applicationsEn
                : (formula.applications ?? []),
    }
}

export function useLocalizedVariables(variables: Variable[]): LocalizedVariable[] {
    const { i18n } = useTranslation()
    const isEnglish = i18n.language === 'en'

    return variables.map((v) => ({
        ...v,
        localizedName: isEnglish && v.nameEn ? v.nameEn : v.name,
    }))
}
