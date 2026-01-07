import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Variable } from '../formulas/types';
import { TutorialStep } from '../components/tutorial/TutorialOverlay';
import { useLocalizedVariables } from './useLocalizedFormula';

const TUTORIAL_COMPLETED_KEY = 'wobble-tutorial-completed';

interface UseTutorialOptions {
    formulaId: string;
    variables: Variable[];
    onSelectCard: (symbol: string | null) => void;
}

interface UseTutorialReturn {
    isActive: boolean;
    currentStep: number;
    steps: TutorialStep[];
    currentTargetSymbol: string | null;
    startTutorial: () => void;
    nextStep: () => void;
    skipTutorial: () => void;
    completeTutorial: () => void;
    hasCompletedTutorial: boolean;
}

export function useTutorial({
    formulaId,
    variables,
    onSelectCard,
}: UseTutorialOptions): UseTutorialReturn {
    const { t } = useTranslation();
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
        return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
    });

    // Get localized variable names
    const localizedVariables = useLocalizedVariables(variables);

    // Get input variables only (not output)
    const inputVariables = variables.filter(v => v.role === 'input');

    // Generate tutorial steps for each input variable
    const steps: TutorialStep[] = useMemo(() => {
        return inputVariables.map((variable, index) => {
            const localizedVar = localizedVariables.find(v => v.symbol === variable.symbol);
            return {
                targetSymbol: variable.symbol,
                message: t('tutorial.stepMessage', {
                    symbol: variable.symbol,
                    name: localizedVar?.localizedName ?? variable.name,
                    index: index + 1,
                    total: inputVariables.length,
                }),
            };
        });
    }, [inputVariables, localizedVariables, t]);

    // Current target symbol based on step
    const currentTargetSymbol = isActive && steps[currentStep]
        ? steps[currentStep].targetSymbol
        : null;

    // Auto-select card when tutorial step changes
    useEffect(() => {
        if (isActive && currentTargetSymbol) {
            onSelectCard(currentTargetSymbol);
        }
    }, [isActive, currentTargetSymbol, onSelectCard]);

    const startTutorial = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, steps.length]);

    const markComplete = useCallback(() => {
        localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
        setHasCompletedTutorial(true);
    }, []);

    const skipTutorial = useCallback(() => {
        setIsActive(false);
        setCurrentStep(0);
        onSelectCard(null);
        markComplete();
    }, [onSelectCard, markComplete]);

    const completeTutorial = useCallback(() => {
        setIsActive(false);
        setCurrentStep(0);
        onSelectCard(null);
        // Don't mark as complete - tutorial will show again next time
    }, [onSelectCard]);

    return {
        isActive,
        currentStep,
        steps,
        currentTargetSymbol,
        startTutorial,
        nextStep,
        skipTutorial,
        completeTutorial,
        hasCompletedTutorial,
    };
}
