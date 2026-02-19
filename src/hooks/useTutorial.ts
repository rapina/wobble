import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Variable, Formula } from '../formulas/types'
import { TutorialStep } from '../components/tutorial/TutorialOverlay'
import { useLocalizedVariables } from './useLocalizedFormula'
import { t as localizeText } from '@/utils/localization'

const SIMULATION_TUTORIAL_KEY = 'wobble-tutorial-simulation-completed'

export type TutorialPhase = 'formula-select' | 'simulation'

interface UseTutorialOptions {
    formulaId: string
    variables: Variable[]
    formula: Formula | null
    onSelectCard: (symbol: string | null) => void
}

interface UseTutorialReturn {
    isActive: boolean
    currentStep: number
    steps: TutorialStep[]
    currentTargetSymbol: string | null
    tutorialPhase: TutorialPhase
    startTutorial: (forceRestart?: boolean, phase?: TutorialPhase) => void
    nextStep: () => void
    skipTutorial: () => void
    completeTutorial: () => void
    advanceToSimulation: () => void
    hasCompletedTutorial: boolean
}

export function useTutorial({
    formulaId,
    variables,
    formula,
    onSelectCard,
}: UseTutorialOptions): UseTutorialReturn {
    const { t, i18n } = useTranslation()
    const [isActive, setIsActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [tutorialPhase, setTutorialPhase] = useState<TutorialPhase>('formula-select')
    const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
        return localStorage.getItem(SIMULATION_TUTORIAL_KEY) === 'true'
    })

    // Get localized variable names
    const localizedVariables = useLocalizedVariables(variables)

    // Get input variables only (not output)
    const inputVariables = variables.filter((v) => v.role === 'input')

    // Check if formula has info to show
    const hasInfo = formula?.applications && Object.keys(formula.applications).length > 0

    // Generate tutorial steps based on current phase
    const steps: TutorialStep[] = useMemo(() => {
        if (tutorialPhase === 'formula-select') {
            return [
                // Step 1: Welcome & explain sandbox
                {
                    targetSymbol: '__welcome__',
                    targetType: 'welcome' as const,
                    title: t('tutorial.sandbox.welcomeTitle'),
                    message: t('tutorial.sandbox.welcomeMessage'),
                },
                // Step 2: Point to formula grid
                {
                    targetSymbol: '__formula_first__',
                    targetType: 'formula-list' as const,
                    title: t('tutorial.sandbox.selectFormulaTitle'),
                    message: t('tutorial.sandbox.selectFormulaMessage'),
                },
            ]
        }

        // Simulation phase steps
        const simulationSteps: TutorialStep[] = []

        // Step 1: Explain canvas area
        simulationSteps.push({
            targetSymbol: '__canvas__',
            targetType: 'canvas' as const,
            title: t('tutorial.sandbox.canvasTitle'),
            message: t('tutorial.sandbox.canvasMessage'),
        })

        // Step 2-N: Variable cards
        inputVariables.forEach((variable) => {
            const localizedVar = localizedVariables.find((v) => v.symbol === variable.symbol)
            const varName =
                localizedVar?.localizedName ?? localizeText(variable.name, i18n.language)

            simulationSteps.push({
                targetSymbol: variable.symbol,
                targetType: 'variable' as const,
                title: t('tutorial.sandbox.variableTitle', { symbol: variable.symbol }),
                message: t('tutorial.sandbox.variableMessage', { name: varName }),
            })
        })

        // Challenge step
        simulationSteps.push({
            targetSymbol: '__challenge__',
            targetType: 'challenge' as const,
            title: t('tutorial.sandbox.challengeTitle'),
            message: t('tutorial.sandbox.challengeMessage'),
        })

        // Submit button step
        simulationSteps.push({
            targetSymbol: '__challenge_submit__',
            targetType: 'challenge-submit' as const,
            title: t('tutorial.sandbox.submitTitle'),
            message: t('tutorial.sandbox.submitMessage'),
        })

        // Info button step if formula has applications
        if (hasInfo) {
            simulationSteps.push({
                targetSymbol: '__info__',
                targetType: 'info-button' as const,
                title: t('tutorial.sandbox.infoTitle'),
                message: t('tutorial.sandbox.infoMessage'),
            })
        }

        return simulationSteps
    }, [tutorialPhase, inputVariables, localizedVariables, hasInfo, t, i18n.language])

    // Current target symbol based on step
    const currentTargetSymbol =
        isActive && steps[currentStep] ? steps[currentStep].targetSymbol : null

    // Auto-select card when tutorial step changes
    useEffect(() => {
        if (isActive && currentTargetSymbol) {
            onSelectCard(currentTargetSymbol)
        }
    }, [isActive, currentTargetSymbol, onSelectCard])

    const startTutorial = useCallback(
        (forceRestart = false, phase: TutorialPhase = 'simulation') => {
            if (forceRestart) {
                localStorage.removeItem(SIMULATION_TUTORIAL_KEY)
                setHasCompletedTutorial(false)
            }
            setCurrentStep(0)
            setTutorialPhase(phase)
            setIsActive(true)
        },
        []
    )

    const advanceToSimulation = useCallback(() => {
        setTutorialPhase('simulation')
        setCurrentStep(0)
    }, [])

    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1)
        }
    }, [currentStep, steps.length])

    const markComplete = useCallback(() => {
        localStorage.setItem(SIMULATION_TUTORIAL_KEY, 'true')
        setHasCompletedTutorial(true)
    }, [])

    const skipTutorial = useCallback(() => {
        setIsActive(false)
        setCurrentStep(0)
        onSelectCard(null)
        markComplete()
    }, [onSelectCard, markComplete])

    const completeTutorial = useCallback(() => {
        setIsActive(false)
        setCurrentStep(0)
        onSelectCard(null)
        markComplete()
    }, [onSelectCard, markComplete])

    return {
        isActive,
        currentStep,
        steps,
        currentTargetSymbol,
        tutorialPhase,
        startTutorial,
        nextStep,
        skipTutorial,
        completeTutorial,
        advanceToSimulation,
        hasCompletedTutorial,
    }
}
