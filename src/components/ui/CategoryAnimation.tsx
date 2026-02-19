import { FormulaCategory } from '@/formulas/types'
import {
    MechanicsAnimation,
    WaveAnimation,
    GravityAnimation,
    ThermodynamicsAnimation,
    ElectricityAnimation,
    QuantumAnimation,
    ChemistryAnimation,
} from './category-animations'

interface CategoryAnimationProps {
    category: FormulaCategory
    color: string
    isActive: boolean
    size?: number
}

export function CategoryAnimation({ category, color, isActive, size = 80 }: CategoryAnimationProps) {
    if (!isActive) {
        return (
            <div
                className="rounded-full opacity-30"
                style={{
                    width: size * 0.4,
                    height: size * 0.4,
                    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                }}
            />
        )
    }

    const animations: Record<FormulaCategory, React.ReactNode> = {
        mechanics: <MechanicsAnimation color={color} size={size} />,
        wave: <WaveAnimation color={color} size={size} />,
        gravity: <GravityAnimation color={color} size={size} />,
        thermodynamics: <ThermodynamicsAnimation color={color} size={size} />,
        electricity: <ElectricityAnimation color={color} size={size} />,
        quantum: <QuantumAnimation color={color} size={size} />,
        chemistry: <ChemistryAnimation color={color} size={size} />,
    }

    return <>{animations[category]}</>
}
