import { useEffect, useMemo, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { Lock } from 'lucide-react'
import { FormulaCategoryCard } from './FormulaCategoryCard'
import { categoryConfigs } from '@/config/categoryConfig'
import { formulaList } from '@/formulas/registry'
import { Formula, FormulaCategory } from '@/formulas/types'
import { useFormulaUnlockStore } from '@/stores/formulaUnlockStore'
import { usePurchaseStore } from '@/stores/purchaseStore'
import { t as localizeText } from '@/utils/localization'

// @ts-ignore - Swiper CSS modules
import 'swiper/css'
// @ts-ignore - Swiper CSS modules
import 'swiper/css/effect-coverflow'

// Theme colors (matching HomeScreen)
const theme = {
    gold: '#c9a227',
    bgPanel: '#374244',
    border: '#1a1a1a',
}

interface FormulaCarouselProps {
    onSelectFormula: (formula: Formula) => void
    onSlideChange?: (category: FormulaCategory, index: number) => void
}

export function FormulaCarousel({ onSelectFormula, onSlideChange }: FormulaCarouselProps) {
    const { t, i18n } = useTranslation()
    const swiperRef = useRef<SwiperType | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const { isAdFree, isAllFormulasUnlocked } = usePurchaseStore()
    const { isUnlocked } = useFormulaUnlockStore()

    // Get formulas grouped by category
    const formulasByCategory = useMemo(() => {
        const grouped: Record<FormulaCategory, Formula[]> = {} as Record<FormulaCategory, Formula[]>
        for (const config of categoryConfigs) {
            grouped[config.id] = formulaList.filter((f) => f.category === config.id)
        }
        return grouped
    }, [])

    // Get formula counts per category
    const formulaCounts = useMemo(() => {
        const counts: Record<FormulaCategory, number> = {} as Record<FormulaCategory, number>
        for (const config of categoryConfigs) {
            counts[config.id] = formulasByCategory[config.id]?.length || 0
        }
        return counts
    }, [formulasByCategory])

    // Current active category and its formulas
    const activeCategory = categoryConfigs[activeIndex]
    const activeFormulas = activeCategory ? formulasByCategory[activeCategory.id] || [] : []
    const activeCategoryColor = activeCategory?.color || theme.gold

    // Notify initial slide on mount
    useEffect(() => {
        if (onSlideChange && categoryConfigs[0]) {
            onSlideChange(categoryConfigs[0].id, 0)
        }
    }, [])

    const handleSlideChangeInternal = (swiper: SwiperType) => {
        const index = swiper.activeIndex
        setActiveIndex(index)
        if (onSlideChange && categoryConfigs[index]) {
            onSlideChange(categoryConfigs[index].id, index)
        }
    }

    return (
        <div className="w-full flex flex-col">
            {/* Category Carousel */}
            <div data-tutorial-category-carousel="true">
                <Swiper
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper
                    }}
                    onSlideChangeTransitionEnd={handleSlideChangeInternal}
                    effect="coverflow"
                    centeredSlides={true}
                    slidesPerView="auto"
                    coverflowEffect={{
                        rotate: 0,
                        stretch: 0,
                        depth: 100,
                        modifier: 2.5,
                        slideShadows: false,
                    }}
                    modules={[EffectCoverflow]}
                    slideToClickedSlide={true}
                    speed={400}
                    className="formula-carousel w-full"
                    style={{ paddingBottom: '16px' }}
                >
                    {categoryConfigs.map((config, index) => (
                        <SwiperSlide
                            key={config.id}
                            className="!w-[200px]"
                        >
                            {({ isActive }) => (
                                <FormulaCategoryCard
                                    config={config}
                                    formulaCount={formulaCounts[config.id]}
                                    isActive={isActive}
                                />
                            )}
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Formula List Below Carousel */}
            <div
                className="mx-auto mt-2 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: `2px solid ${theme.border}`,
                    maxHeight: '200px',
                    width: '240px', // Slightly wider than card (200px)
                    maxWidth: 'calc(100% - 32px)',
                }}
                key={activeCategory?.id}
                data-tutorial-formula-list="true"
            >
                {/* Header */}
                <div
                    className="px-4 py-2 flex items-center justify-between"
                    style={{
                        background: `${activeCategoryColor}15`,
                        borderBottom: `1px solid ${theme.border}`,
                    }}
                >
                    <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: activeCategoryColor }}
                    >
                        {t(`simulation.categories.${activeCategory?.id}`)}
                    </span>
                    <span className="text-[10px] text-white/50">
                        {activeFormulas.length} {t('carousel.formulas')}
                    </span>
                </div>

                {/* Scrollable Formula List */}
                <div className="overflow-y-auto p-2 space-y-1" style={{ maxHeight: '150px' }}>
                    {activeFormulas.map((formula) => {
                        const isLocked = !isAdFree && !isAllFormulasUnlocked && !isUnlocked(formula.id)
                        const formulaName = localizeText(formula.name, i18n.language)

                        return (
                            <button
                                key={formula.id}
                                onClick={() => onSelectFormula(formula)}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: `${activeCategoryColor}10`,
                                    border: `1px solid ${activeCategoryColor}30`,
                                }}
                            >
                                {isLocked ? (
                                    <Lock
                                        className="w-4 h-4 flex-shrink-0"
                                        style={{ color: activeCategoryColor }}
                                    />
                                ) : (
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ background: activeCategoryColor }}
                                    />
                                )}
                                <span className="flex-1 text-left text-sm font-medium truncate text-white">
                                    {formulaName}
                                </span>
                                <span
                                    className="text-xs font-mono flex-shrink-0"
                                    style={{ color: activeCategoryColor }}
                                >
                                    {formula.expression}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Persona-style CSS animations */}
            <style>{`
                .formula-carousel .swiper-slide {
                    /* Note: Do not add transition on transform - it conflicts with Swiper's internal drag handling */
                    transition: opacity 0.3s ease;
                    cursor: pointer;
                }
                @keyframes persona-card-active {
                    0%, 100% {
                        transform: skewX(-3deg) rotate(0deg) scale(1);
                    }
                    50% {
                        transform: skewX(-3deg) rotate(0deg) scale(1.02);
                    }
                }
                @keyframes persona-bottom-glow {
                    0%, 100% {
                        opacity: 1;
                        box-shadow: 0 0 10px currentColor;
                    }
                    50% {
                        opacity: 0.7;
                        box-shadow: 0 0 20px currentColor;
                    }
                }
                @keyframes persona-character-bounce {
                    0%, 100% {
                        transform: translateY(0) rotate(0deg);
                    }
                    25% {
                        transform: translateY(-6px) rotate(-2deg);
                    }
                    75% {
                        transform: translateY(-3px) rotate(2deg);
                    }
                }
            `}</style>
        </div>
    )
}
