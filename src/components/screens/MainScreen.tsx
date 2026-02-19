import { useState, useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { HomeScreen, GameMode } from './HomeScreen'
import { SandboxScreen } from './SandboxScreen.tsx'
import { CollectionScreen } from './CollectionScreen'
import { GameScreen } from './GameScreen.tsx'
import { GameSelectScreen, GameMode as MiniGameMode } from './GameSelectScreen.tsx'
import { MiniGameScreen } from './MiniGameScreen.tsx'
import { ShopScreen } from './ShopScreen'
import { LabScreen } from './LabScreen'
import { IntroScreen, IntroScene } from './IntroScreen'
import { formulaList } from '../../formulas/registry'
import { Formula } from '../../formulas/types'
import { useMusic } from '../../hooks/useMusic'
import { IS_AD_TESTING } from '../../hooks/useAdMob'
import { useInAppPurchase } from '../../hooks/useInAppPurchase'
import { musicManager } from '../../services/MusicManager'
import { cn } from '@/lib/utils'
import type { MiniGameId } from '@/components/canvas/MiniGameCanvas'

type ScreenState =
    | 'intro'
    | 'home'
    | 'sandbox'
    | 'collection'
    | 'adventure-select'
    | 'game'
    | 'minigame'
    | 'learning'
    | 'shop'
    | 'lab'

export function MainScreen() {
    // Check if intro has been seen, show intro first if not
    const [screenState, setScreenState] = useState<ScreenState>(() =>
        IntroScene.hasSeenIntro() ? 'home' : 'intro'
    )
    const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null)
    const [selectedMiniGame, setSelectedMiniGame] = useState<MiniGameId | null>(null)
    const [selectedMiniGameMode, setSelectedMiniGameMode] = useState<MiniGameMode>('endless')
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [showFormulaCarousel, setShowFormulaCarousel] = useState(false)
    const { isMusicEnabled, switchTrack, markUserInteracted } = useMusic()
    const { restorePurchases } = useInAppPurchase()

    // Restore purchases on app start (for reinstall support)
    // Skip in ad testing mode to avoid test purchases overriding lock state
    useEffect(() => {
        if (Capacitor.isNativePlatform() && !IS_AD_TESTING) {
            restorePurchases().catch(() => {
                // Silently fail - user can manually restore from settings
            })
        }
    }, [])

    // Initialize with first formula when entering sandbox
    useEffect(() => {
        if (screenState === 'sandbox' && !selectedFormula && formulaList.length > 0) {
            setSelectedFormula(formulaList[0])
        }
    }, [screenState, selectedFormula])

    // Handle first user interaction for autoplay
    // Use ref to track if already interacted (avoid dependency issues)
    const hasInteractedRef = useRef(false)

    useEffect(() => {
        const handleInteraction = () => {
            if (hasInteractedRef.current) return
            hasInteractedRef.current = true
            markUserInteracted()
        }

        document.addEventListener('click', handleInteraction, true)
        document.addEventListener('touchstart', handleInteraction, true)

        return () => {
            document.removeEventListener('click', handleInteraction, true)
            document.removeEventListener('touchstart', handleInteraction, true)
        }
    }, [markUserInteracted])

    // Handle app state changes (background/foreground)
    useEffect(() => {
        const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                musicManager.resume()
            } else {
                musicManager.pauseAll()
            }
        })

        return () => {
            appStateListener.then((listener) => listener.remove())
        }
    }, [])

    // Switch music track based on screen state
    useEffect(() => {
        const isSurvivorMode = screenState === 'game' || screenState === 'minigame'
        switchTrack(isSurvivorMode ? 'survivor' : 'main')
    }, [screenState, switchTrack])

    const handleSelectSandboxFormula = (formula: Formula) => {
        setIsTransitioning(true)
        setShowFormulaCarousel(false)
        setTimeout(() => {
            setScreenState('sandbox')
            setSelectedFormula(formula)
            setIsTransitioning(false)
        }, 150)
    }

    const handleSelectMode = (mode: GameMode) => {
        if (mode === 'sandbox') {
            // This path is no longer used for sandbox - use handleSelectSandboxFormula instead
            setIsTransitioning(true)
            setTimeout(() => {
                setScreenState('sandbox')
                if (formulaList.length > 0) {
                    setSelectedFormula(formulaList[0])
                }
                setIsTransitioning(false)
            }, 150)
        } else if (mode === 'collection') {
            setIsTransitioning(true)
            setTimeout(() => {
                setScreenState('collection')
                setIsTransitioning(false)
            }, 150)
        } else if (mode === 'game') {
            setIsTransitioning(true)
            setTimeout(() => {
                setScreenState('adventure-select')
                setIsTransitioning(false)
            }, 150)
        } else if (mode === 'shop') {
            setIsTransitioning(true)
            setTimeout(() => {
                setScreenState('shop')
                setIsTransitioning(false)
            }, 150)
        } else if (mode === 'lab') {
            setIsTransitioning(true)
            setTimeout(() => {
                setScreenState('lab')
                setIsTransitioning(false)
            }, 150)
        }
    }

    const handleSelectAdventure = (adventureId: string, mode?: MiniGameMode) => {
        if (adventureId === 'wobble-survivor') {
            setIsTransitioning(true)
            setTimeout(() => {
                setScreenState('game')
                setIsTransitioning(false)
            }, 150)
        } else if (adventureId === 'wobblediver') {
            setIsTransitioning(true)
            setTimeout(() => {
                setSelectedMiniGame('wobblediver')
                setSelectedMiniGameMode(mode || 'endless')
                setScreenState('minigame')
                setIsTransitioning(false)
            }, 150)
        }
    }

    const handleBackToAdventureSelect = () => {
        setIsTransitioning(true)
        setTimeout(() => {
            setScreenState('adventure-select')
            setIsTransitioning(false)
        }, 150)
    }

    const handleFormulaChange = (formula: Formula) => {
        setSelectedFormula(formula)
    }

    const handleBackToHome = () => {
        setIsTransitioning(true)
        setTimeout(() => {
            setScreenState('home')
            setSelectedFormula(null)
            setShowFormulaCarousel(false)
            setIsTransitioning(false)
        }, 150)
    }

    const handleBackToFormulaCarousel = () => {
        setIsTransitioning(true)
        // Set carousel state BEFORE screen transition to avoid flash
        setShowFormulaCarousel(true)
        setTimeout(() => {
            setScreenState('home')
            setSelectedFormula(null)
            // Double rAF to let React render and browser paint before fading in
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsTransitioning(false)
                })
            })
        }, 150)
    }

    return (
        <div className="w-full h-full bg-background overflow-hidden">
            <div
                className={cn(
                    'w-full h-full transition-opacity duration-150',
                    isTransitioning ? 'opacity-0' : 'opacity-100'
                )}
            >
                {screenState === 'intro' ? (
                    <IntroScreen onComplete={() => setScreenState('home')} />
                ) : screenState === 'home' ? (
                    <HomeScreen
                        onSelectMode={handleSelectMode}
                        onSelectSandboxFormula={handleSelectSandboxFormula}
                        initialShowFormulaSelect={showFormulaCarousel}
                    />
                ) : screenState === 'sandbox' && selectedFormula ? (
                    <SandboxScreen
                        formulaId={selectedFormula.id}
                        formulas={formulaList}
                        onFormulaChange={handleFormulaChange}
                        onBack={handleBackToFormulaCarousel}
                    />
                ) : screenState === 'collection' ? (
                    <CollectionScreen onBack={handleBackToHome} />
                ) : screenState === 'adventure-select' ? (
                    <GameSelectScreen
                        onBack={handleBackToHome}
                        onSelectAdventure={handleSelectAdventure}
                    />
                ) : screenState === 'game' ? (
                    <GameScreen onBack={handleBackToAdventureSelect} />
                ) : screenState === 'minigame' && selectedMiniGame ? (
                    <MiniGameScreen
                        gameId={selectedMiniGame}
                        mode={selectedMiniGameMode}
                        onBack={handleBackToAdventureSelect}
                    />
                ) : screenState === 'shop' ? (
                    <ShopScreen onBack={handleBackToHome} />
                ) : screenState === 'lab' ? (
                    <LabScreen onBack={handleBackToHome} />
                ) : null}
            </div>
        </div>
    )
}
