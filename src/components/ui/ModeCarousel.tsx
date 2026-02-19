import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Pagination } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { WobbleShape, WobbleExpression } from '@/components/canvas/Wobble'
import { GameMode } from '@/components/screens/HomeScreen'
import { ShoppingBag, BookOpen, Gamepad2, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

// @ts-ignore - Swiper CSS modules
import 'swiper/css'
// @ts-ignore - Swiper CSS modules
import 'swiper/css/effect-coverflow'
// @ts-ignore - Swiper CSS modules
import 'swiper/css/pagination'

// Theme colors (matching HomeScreen)
const theme = {
    bg: '#1a1a2e',
    felt: '#3d6b59',
    bgPanel: '#374244',
    bgPanelLight: '#4a5658',
    border: '#1a1a1a',
    gold: '#c9a227',
    red: '#e85d4c',
    blue: '#4a9eff',
    pink: '#FF6B9D',
    purple: '#9b59b6',
}

export interface ModeCard {
    id: GameMode
    titleKey: string
    descriptionKey: string
    color: string
    icon: React.ReactNode
    wobbleShape: WobbleShape
    wobbleExpression: WobbleExpression
}

export const modeCards: ModeCard[] = [
    {
        id: 'sandbox',
        titleKey: 'home.sandbox',
        descriptionKey: 'home.sandboxDesc',
        color: theme.gold,
        icon: <FlaskConical className="w-5 h-5" />,
        wobbleShape: 'einstein',
        wobbleExpression: 'happy',
    },
    {
        id: 'game',
        titleKey: 'home.game',
        descriptionKey: 'home.gameDesc',
        color: theme.red,
        icon: <Gamepad2 className="w-5 h-5" />,
        wobbleShape: 'star',
        wobbleExpression: 'excited',
    },
    {
        id: 'collection',
        titleKey: 'home.collection',
        descriptionKey: 'home.collectionDesc',
        color: theme.blue,
        icon: <BookOpen className="w-5 h-5" />,
        wobbleShape: 'pentagon',
        wobbleExpression: 'surprised',
    },
    {
        id: 'shop',
        titleKey: 'home.shop',
        descriptionKey: 'home.shopDesc',
        color: theme.purple,
        icon: <ShoppingBag className="w-5 h-5" />,
        wobbleShape: 'diamond',
        wobbleExpression: 'happy',
    },
]

interface ModeCarouselProps {
    onSelectMode: (mode: GameMode) => void
    onSlideChange?: (mode: GameMode, index: number) => void
    collectionProgress?: { unlocked: number; total: number }
    achievementProgress?: { unlocked: number; total: number }
    unseenFormulaCount?: number
}

export function ModeCarousel({
    onSelectMode,
    onSlideChange,
    collectionProgress,
    achievementProgress,
    unseenFormulaCount,
}: ModeCarouselProps) {
    const { t } = useTranslation()
    const swiperRef = useRef<SwiperType | null>(null)

    // Notify initial slide on mount
    useEffect(() => {
        if (onSlideChange) {
            onSlideChange(modeCards[0].id, 0)
        }
    }, [])

    const handleSlideClick = (mode: GameMode, index: number) => {
        if (swiperRef.current && swiperRef.current.activeIndex !== index) {
            // If not active slide, just slide to it
            swiperRef.current.slideTo(index)
        } else {
            // If active slide, select the mode
            onSelectMode(mode)
        }
    }

    const handleSlideChange = (swiper: SwiperType) => {
        const index = swiper.activeIndex
        if (onSlideChange && modeCards[index]) {
            onSlideChange(modeCards[index].id, index)
        }
    }

    return (
        <div className="w-full">
            <Swiper
                onSwiper={(swiper) => {
                    swiperRef.current = swiper
                }}
                onSlideChange={handleSlideChange}
                effect="coverflow"
                grabCursor={true}
                centeredSlides={true}
                slidesPerView="auto"
                coverflowEffect={{
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 2.5,
                    slideShadows: false,
                }}
                pagination={{
                    clickable: true,
                }}
                modules={[EffectCoverflow, Pagination]}
                className="mode-carousel"
                style={
                    {
                        '--swiper-pagination-color': theme.gold,
                        '--swiper-pagination-bullet-inactive-color': 'rgba(255,255,255,0.3)',
                        '--swiper-pagination-bullet-inactive-opacity': '1',
                        paddingBottom: '40px',
                    } as React.CSSProperties
                }
            >
                {modeCards.map((card, index) => (
                    <SwiperSlide
                        key={card.id}
                        className="!w-[150px]"
                        onClick={() => handleSlideClick(card.id, index)}
                    >
                        {({ isActive }) => (
                            <div
                                className={cn(
                                    'relative transition-all duration-300',
                                    isActive ? 'scale-100' : 'scale-85 opacity-60'
                                )}
                                style={{
                                    transform: isActive
                                        ? 'skewX(-3deg) rotate(0deg)'
                                        : `skewX(-3deg) rotate(${index % 2 === 0 ? -3 : 3}deg)`,
                                    animation: isActive
                                        ? 'persona-card-active 2s ease-in-out infinite'
                                        : 'none',
                                }}
                            >
                                {/* Shadow layer */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: theme.border,
                                        transform: 'translateX(5px) translateY(5px)',
                                        clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
                                    }}
                                />
                                {/* Main card - border wrapper */}
                                <div
                                    className="relative"
                                    style={{
                                        background: isActive ? card.color : theme.border,
                                        clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
                                        padding: '3px',
                                    }}
                                >
                                    {/* Inner card content */}
                                    <div
                                        className="relative overflow-hidden"
                                        style={{
                                            background: `linear-gradient(135deg, ${theme.bgPanel} 0%, #2a3234 100%)`,
                                            clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
                                        }}
                                    >
                                        {/* Diagonal accent stripe */}
                                        <div
                                            className="absolute top-0 right-0 w-full h-full pointer-events-none"
                                            style={{
                                                background: `linear-gradient(135deg, transparent 70%, ${card.color}20 70%)`,
                                            }}
                                        />
                                        {/* Color accent bar */}
                                        <div
                                            className="h-2"
                                            style={{
                                                background: card.color,
                                                clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)',
                                            }}
                                        />

                                        {/* Card Content */}
                                        <div className="p-4 flex flex-col items-center relative">
                                            {/* Mode Icon with glow */}
                                            <div
                                                className="mb-2 p-2 rounded-lg relative"
                                                style={{
                                                    background: isActive
                                                        ? `${card.color}30`
                                                        : 'transparent',
                                                    transform: 'skewX(3deg)',
                                                }}
                                            >
                                                {isActive && (
                                                    <div
                                                        className="absolute inset-0 rounded-lg blur-md"
                                                        style={{
                                                            background: card.color,
                                                            opacity: 0.3,
                                                        }}
                                                    />
                                                )}
                                                <span
                                                    className="relative"
                                                    style={{
                                                        color: card.color,
                                                        filter: isActive
                                                            ? `drop-shadow(0 0 4px ${card.color})`
                                                            : 'none',
                                                    }}
                                                >
                                                    {card.icon}
                                                </span>
                                            </div>

                                            {/* Mode Title */}
                                            <h3
                                                className="text-sm font-black tracking-wider uppercase text-center"
                                                style={{
                                                    color: isActive ? card.color : 'white',
                                                    transform: 'skewX(3deg)',
                                                    textShadow: isActive
                                                        ? `0 0 10px ${card.color}80`
                                                        : 'none',
                                                }}
                                            >
                                                {t(card.titleKey)}
                                            </h3>

                                            {/* Badge for specific modes */}
                                            {card.id === 'sandbox' &&
                                                unseenFormulaCount &&
                                                unseenFormulaCount > 0 && (
                                                    <span
                                                        className="mt-2 px-2 py-0.5 text-[9px] font-black"
                                                        style={{
                                                            background: theme.red,
                                                            color: 'white',
                                                            transform: 'skewX(-5deg)',
                                                            boxShadow: `2px 2px 0 ${theme.border}`,
                                                        }}
                                                    >
                                                        NEW
                                                    </span>
                                                )}
                                            {card.id === 'collection' &&
                                                collectionProgress &&
                                                achievementProgress && (
                                                    <span
                                                        className="mt-2 px-2 py-0.5 text-[10px] font-bold"
                                                        style={{
                                                            background: 'rgba(0,0,0,0.5)',
                                                            color: 'white',
                                                            transform: 'skewX(-5deg)',
                                                        }}
                                                    >
                                                        {collectionProgress.unlocked +
                                                            achievementProgress.unlocked}
                                                        /
                                                        {collectionProgress.total +
                                                            achievementProgress.total}
                                                    </span>
                                                )}
                                        </div>

                                        {/* Bottom accent */}
                                        {isActive && (
                                            <div
                                                className="absolute bottom-0 left-0 right-0 h-1"
                                                style={{
                                                    background: card.color,
                                                    animation:
                                                        'persona-bottom-glow 1.5s ease-in-out infinite',
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Persona-style CSS animations */}
            <style>{`
                .mode-carousel .swiper-slide {
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
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
            `}</style>
        </div>
    )
}
