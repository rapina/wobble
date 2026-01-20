import { useState, useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { HomeScreen, GameMode } from './HomeScreen'
import { SandboxScreen } from './SandboxScreen.tsx'
import { CollectionScreen } from './CollectionScreen'
import { GameScreen } from './GameScreen.tsx'
import { GameSelectScreen } from './GameSelectScreen.tsx'
import { MiniGameScreen } from './MiniGameScreen.tsx'
import { ShopScreen } from './ShopScreen'
import { IntroScreen, IntroScene } from './IntroScreen'
import { formulaList } from '../../formulas/registry'
import { Formula } from '../../formulas/types'
import { useMusic } from '../../hooks/useMusic'
import { useInAppPurchase } from '../../hooks/useInAppPurchase'
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

export function MainScreen() {
    // Check if intro has been seen, show intro first if not
    const [screenState, setScreenState] = useState<ScreenState>(() =>
        IntroScene.hasSeenIntro() ? 'home' : 'intro'
    )
    const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null)
    const [selectedMiniGame, setSelectedMiniGame] = useState<MiniGameId | null>(null)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const { isMusicEnabled, volume } = useMusic()
    const { restorePurchases } = useInAppPurchase()

    // Restore purchases on app start (for reinstall support)
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
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

    // Background music - initialize audio element
    useEffect(() => {
        const audio = new Audio('/assets/bg.mp3')
        audio.loop = true
        audio.volume = volume * 0.1 // Scale down for background music
        audioRef.current = audio

        const handleInteraction = () => {
            if (isMusicEnabled) {
                audio.play().catch(() => {})
            }
            document.removeEventListener('click', handleInteraction)
        }
        document.addEventListener('click', handleInteraction)

        const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive && isMusicEnabled) {
                audio.play().catch(() => {})
            } else {
                audio.pause()
            }
        })

        return () => {
            audio.pause()
            document.removeEventListener('click', handleInteraction)
            appStateListener.then((listener) => listener.remove())
        }
    }, [])

    // Control music based on isMusicEnabled setting
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        if (isMusicEnabled) {
            audio.play().catch(() => {})
        } else {
            audio.pause()
        }
    }, [isMusicEnabled])

    // Update volume when changed
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        audio.volume = volume * 0.1 // Scale down for background music
    }, [volume])

    const handleSelectMode = (mode: GameMode) => {
        if (mode === 'sandbox') {
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
        }
    }

    const handleSelectAdventure = (adventureId: string) => {
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
            setIsTransitioning(false)
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
                    <HomeScreen onSelectMode={handleSelectMode} />
                ) : screenState === 'sandbox' && selectedFormula ? (
                    <SandboxScreen
                        formulaId={selectedFormula.id}
                        formulas={formulaList}
                        onFormulaChange={handleFormulaChange}
                        onBack={handleBackToHome}
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
                        onBack={handleBackToAdventureSelect}
                    />
                ) : screenState === 'shop' ? (
                    <ShopScreen onBack={handleBackToHome} />
                ) : null}
            </div>
        </div>
    )
}
