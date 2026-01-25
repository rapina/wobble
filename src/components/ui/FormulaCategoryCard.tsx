import { useTranslation } from 'react-i18next'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { WOBBLE_CHARACTERS } from '@/components/canvas/Wobble'
import { CategoryConfig } from '@/config/categoryConfig'
import { cn } from '@/lib/utils'

// Theme colors (matching HomeScreen)
const theme = {
    bgPanel: '#374244',
    border: '#1a1a1a',
}

interface FormulaCategoryCardProps {
    config: CategoryConfig
    formulaCount: number
    isActive: boolean
    onTapCard: () => void
}

export function FormulaCategoryCard({
    config,
    formulaCount,
    isActive,
    onTapCard,
}: FormulaCategoryCardProps) {
    const { t } = useTranslation()
    const IconComponent = config.iconComponent

    // Get category description
    const categoryDescription = t(`simulation.categoryDescriptions.${config.id}`)

    return (
        <div
            className={cn(
                'relative transition-all duration-300',
                isActive ? 'scale-100' : 'scale-90 opacity-50'
            )}
            style={{
                transform: isActive ? 'skewX(-3deg) rotate(0deg)' : 'skewX(-3deg) rotate(2deg)',
                animation: isActive ? 'persona-card-active 2s ease-in-out infinite' : 'none',
            }}
            onClick={onTapCard}
        >
            {/* Shadow layer */}
            <div
                className="absolute inset-0"
                style={{
                    background: theme.border,
                    transform: 'translateX(5px) translateY(5px)',
                    clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)',
                }}
            />
            {/* Main card - border wrapper */}
            <div
                className="relative"
                style={{
                    background: isActive ? config.color : theme.border,
                    clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)',
                    padding: '3px',
                }}
            >
                {/* Inner card content */}
                <div
                    className="relative overflow-hidden cursor-pointer"
                    style={{
                        background: `linear-gradient(135deg, ${theme.bgPanel} 0%, #2a3234 100%)`,
                        clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)',
                    }}
                >
                    {/* Diagonal accent stripe */}
                    <div
                        className="absolute top-0 right-0 w-full h-full pointer-events-none"
                        style={{
                            background: `linear-gradient(135deg, transparent 60%, ${config.color}15 60%)`,
                        }}
                    />
                    {/* Color accent bar */}
                    <div
                        className="h-2"
                        style={{
                            background: config.color,
                            clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)',
                        }}
                    />

                    {/* Card Content */}
                    <div
                        className="px-5 py-4 flex flex-col items-center relative"
                        style={{ transform: 'skewX(3deg)' }}
                    >
                        {/* Category Icon */}
                        <div
                            className="mb-2 p-2 rounded-xl"
                            style={{
                                background: isActive ? `${config.color}25` : 'transparent',
                            }}
                        >
                            {isActive && (
                                <div
                                    className="absolute inset-0 rounded-xl blur-lg"
                                    style={{
                                        background: config.color,
                                        opacity: 0.2,
                                    }}
                                />
                            )}
                            <IconComponent
                                className="w-8 h-8 relative"
                                style={{
                                    color: config.color,
                                    filter: isActive
                                        ? `drop-shadow(0 0 6px ${config.color})`
                                        : 'none',
                                }}
                            />
                        </div>

                        {/* Category Name */}
                        <h3
                            className="text-base font-black tracking-wider uppercase mb-2"
                            style={{
                                color: isActive ? config.color : 'white',
                                textShadow: isActive ? `0 0 10px ${config.color}80` : 'none',
                            }}
                        >
                            {t(`simulation.categories.${config.id}`)}
                        </h3>

                        {/* Wobble Character - Only render for active card to save WebGL contexts */}
                        <div
                            className="relative mb-3 flex items-center justify-center"
                            style={{
                                width: 100,
                                height: 100,
                                animation: isActive
                                    ? 'persona-character-bounce 2s ease-in-out infinite'
                                    : 'none',
                            }}
                        >
                            {isActive && (
                                <>
                                    <div
                                        className="absolute inset-0 rounded-full blur-xl opacity-30"
                                        style={{
                                            background: config.color,
                                            transform: 'scale(1.5)',
                                        }}
                                    />
                                    <WobbleDisplay
                                        size={50}
                                        shape={config.wobbleShape}
                                        color={WOBBLE_CHARACTERS[config.wobbleShape].color}
                                        expression={config.wobbleExpression}
                                    />
                                </>
                            )}
                            {!isActive && (
                                <div
                                    className="w-12 h-12 rounded-full opacity-40"
                                    style={{
                                        background: WOBBLE_CHARACTERS[config.wobbleShape].color,
                                    }}
                                />
                            )}
                        </div>

                        {/* Category Description */}
                        <p
                            className="text-[11px] text-white/70 text-center leading-relaxed mb-2"
                            style={{ maxWidth: '160px' }}
                        >
                            {categoryDescription}
                        </p>

                        {/* Formula count badge */}
                        <div
                            className="px-3 py-1 rounded-full text-[10px] font-bold"
                            style={{
                                background: `${config.color}20`,
                                color: config.color,
                                border: `1px solid ${config.color}30`,
                            }}
                        >
                            {formulaCount} {t('carousel.formulas')}
                        </div>
                    </div>

                    {/* Bottom accent */}
                    {isActive && (
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1"
                            style={{
                                background: config.color,
                                animation: 'persona-bottom-glow 1.5s ease-in-out infinite',
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
