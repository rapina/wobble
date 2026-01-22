import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Variable, Formula } from '../formulas/types'
import { TutorialStep } from '../components/tutorial/TutorialOverlay'
import { useLocalizedVariables } from './useLocalizedFormula'

const TUTORIAL_COMPLETED_KEY = 'wobble-tutorial-completed'

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
    startTutorial: () => void
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
    const { t } = useTranslation()
    const [isActive, setIsActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [tutorialPhase, setTutorialPhase] = useState<TutorialPhase>('formula-select')
    const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
        return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true'
    })

    // Get localized variable names
    const localizedVariables = useLocalizedVariables(variables)

    // Get input variables only (not output)
    const inputVariables = variables.filter((v) => v.role === 'input')

    // Check if formula has info to show
    const hasInfo =
        formula?.applications && Object.keys(formula.applications).length > 0

    // Generate tutorial steps based on current phase
    const steps: TutorialStep[] = useMemo(() => {
        if (tutorialPhase === 'formula-select') {
            return [
                {
                    targetSymbol: '__formula_first__',
                    targetType: 'formula-list' as const,
                    message: t('tutorial.formulaSelectMessage', {
                        defaultValue:
                            '먼저 공식을 선택해보세요! 첫 번째 공식을 탭해서 시작합니다.',
                    }),
                },
            ]
        }

        // Simulation phase steps
        const variableSteps: TutorialStep[] = inputVariables.map((variable, index) => {
            const localizedVar = localizedVariables.find((v) => v.symbol === variable.symbol)
            return {
                targetSymbol: variable.symbol,
                targetType: 'variable' as const,
                message: t('tutorial.stepMessage', {
                    symbol: variable.symbol,
                    name: localizedVar?.localizedName ?? variable.name,
                    index: index + 1,
                    total: inputVariables.length,
                }),
            }
        })

        // Add info button step if formula has applications
        if (hasInfo) {
            variableSteps.push({
                targetSymbol: '__info__',
                targetType: 'info-button',
                message: t('tutorial.infoButtonMessage', {
                    defaultValue:
                        '정보 버튼을 눌러 이 공식의 실생활 활용 사례를 확인해보세요!',
                }),
            })
        }

        // Add challenge submit button step
        variableSteps.push({
            targetSymbol: '__challenge_submit__',
            targetType: 'challenge-submit',
            message: t('tutorial.challengeSubmitMessage', {
                defaultValue:
                    '변수를 조절해서 정답을 맞춰보세요! 제출 버튼을 눌러 도전해보세요!',
            }),
        })

        return variableSteps
    }, [tutorialPhase, inputVariables, localizedVariables, hasInfo, t])

    // Current target symbol based on step
    const currentTargetSymbol =
        isActive && steps[currentStep] ? steps[currentStep].targetSymbol : null

    // Auto-select card when tutorial step changes
    useEffect(() => {
        if (isActive && currentTargetSymbol) {
            onSelectCard(currentTargetSymbol)
        }
    }, [isActive, currentTargetSymbol, onSelectCard])

    const startTutorial = useCallback(() => {
        setCurrentStep(0)
        setTutorialPhase('formula-select')
        setIsActive(true)
    }, [])

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
        localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true')
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
