import { useState, useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { HomeScreen, GameMode } from './HomeScreen';
import { SimulationScreen } from './SimulationScreen';
import { formulaList } from '../../formulas/registry';
import { Formula } from '../../formulas/types';
import { cn } from '@/lib/utils';

type ScreenState = 'home' | 'sandbox' | 'puzzle' | 'learning';

export function GameScreen() {
    const [screenState, setScreenState] = useState<ScreenState>('home');
    const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize with first formula when entering sandbox
    useEffect(() => {
        if (screenState === 'sandbox' && !selectedFormula && formulaList.length > 0) {
            setSelectedFormula(formulaList[0]);
        }
    }, [screenState, selectedFormula]);

    // Background music
    useEffect(() => {
        const audio = new Audio('/assets/bg.mp3');
        audio.loop = true;
        audio.volume = 0.02;
        audioRef.current = audio;

        const playMusic = () => {
            audio.play().catch(() => {});
        };

        playMusic();

        const handleInteraction = () => {
            playMusic();
            document.removeEventListener('click', handleInteraction);
        };
        document.addEventListener('click', handleInteraction);

        const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                audio.play().catch(() => {});
            } else {
                audio.pause();
            }
        });

        return () => {
            audio.pause();
            document.removeEventListener('click', handleInteraction);
            appStateListener.then(listener => listener.remove());
        };
    }, []);

    const handleSelectMode = (mode: GameMode) => {
        if (mode === 'sandbox') {
            setIsTransitioning(true);
            setTimeout(() => {
                setScreenState('sandbox');
                if (formulaList.length > 0) {
                    setSelectedFormula(formulaList[0]);
                }
                setIsTransitioning(false);
            }, 150);
        }
    };

    const handleFormulaChange = (formula: Formula) => {
        setSelectedFormula(formula);
    };

    const handleBackToHome = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setScreenState('home');
            setSelectedFormula(null);
            setIsTransitioning(false);
        }, 150);
    };

    return (
        <div className="w-full h-full bg-background overflow-hidden">
            <div
                className={cn(
                    "w-full h-full transition-opacity duration-150",
                    isTransitioning ? "opacity-0" : "opacity-100"
                )}
            >
                {screenState === 'home' ? (
                    <HomeScreen
                        onSelectMode={handleSelectMode}
                    />
                ) : screenState === 'sandbox' && selectedFormula ? (
                    <SimulationScreen
                        formulaId={selectedFormula.id}
                        formulas={formulaList}
                        onFormulaChange={handleFormulaChange}
                        onBack={handleBackToHome}
                    />
                ) : null}
            </div>
        </div>
    );
}
