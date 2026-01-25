import { FormulaCategory } from '@/formulas/types'
import { WobbleShape, WobbleExpression } from '@/components/canvas/Wobble'
import { Cog, Waves, Globe, Thermometer, Zap, Sparkles, Atom, FlaskConical } from 'lucide-react'

export interface CategoryConfig {
    id: FormulaCategory
    iconComponent: typeof Cog
    color: string
    wobbleShape: WobbleShape
    wobbleExpression: WobbleExpression
}

// Category configurations
export const categoryConfigs: CategoryConfig[] = [
    {
        id: 'mechanics',
        iconComponent: Cog,
        color: '#f8b862',
        wobbleShape: 'circle',
        wobbleExpression: 'excited',
    },
    {
        id: 'wave',
        iconComponent: Waves,
        color: '#6ecff6',
        wobbleShape: 'pentagon',
        wobbleExpression: 'happy',
    },
    {
        id: 'gravity',
        iconComponent: Globe,
        color: '#c792ea',
        wobbleShape: 'star',
        wobbleExpression: 'surprised',
    },
    {
        id: 'thermodynamics',
        iconComponent: Thermometer,
        color: '#ff6b6b',
        wobbleShape: 'diamond',
        wobbleExpression: 'happy',
    },
    {
        id: 'electricity',
        iconComponent: Zap,
        color: '#69f0ae',
        wobbleShape: 'einstein',
        wobbleExpression: 'excited',
    },
    {
        id: 'special',
        iconComponent: Sparkles,
        color: '#ffd700',
        wobbleShape: 'star',
        wobbleExpression: 'happy',
    },
    {
        id: 'quantum',
        iconComponent: Atom,
        color: '#e040fb',
        wobbleShape: 'triangle',
        wobbleExpression: 'surprised',
    },
    {
        id: 'chemistry',
        iconComponent: FlaskConical,
        color: '#4fc3f7',
        wobbleShape: 'square',
        wobbleExpression: 'happy',
    },
]

// Helper to get category config by id
export function getCategoryConfig(categoryId: FormulaCategory): CategoryConfig | undefined {
    return categoryConfigs.find((c) => c.id === categoryId)
}

// Category colors map for backwards compatibility
export const categoryColors: Record<FormulaCategory, string> = {
    mechanics: '#f8b862',
    wave: '#6ecff6',
    gravity: '#c792ea',
    thermodynamics: '#ff6b6b',
    electricity: '#69f0ae',
    special: '#ffd700',
    quantum: '#e040fb',
    chemistry: '#4fc3f7',
}
