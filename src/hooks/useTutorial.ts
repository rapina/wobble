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
    const hasInfo =
        formula?.applications && Object.keys(formula.applications).length > 0

    // Language helper
    const isKo = i18n.language === 'ko' || i18n.language.startsWith('ko')
    const isJa = i18n.language === 'ja' || i18n.language.startsWith('ja')

    // Generate tutorial steps based on current phase
    const steps: TutorialStep[] = useMemo(() => {
        if (tutorialPhase === 'formula-select') {
            return [
                // Step 1: Welcome & explain sandbox
                {
                    targetSymbol: '__welcome__',
                    targetType: 'welcome' as const,
                    title: isKo ? '물리 샌드박스에 오신 것을 환영해요!' : isJa ? '物理サンドボックスへようこそ！' : 'Welcome to Physics Sandbox!',
                    message: isKo
                        ? '여기서 물리 공식을 직접 만져보며 배울 수 있어요. 변수를 조절하면 결과가 어떻게 바뀌는지 눈으로 확인해보세요!'
                        : isJa
                        ? 'ここで物理公式を直接触りながら学べます。変数を調整すると結果がどう変わるか、目で確認してみてください！'
                        : 'Here you can learn physics formulas by interacting with them. Adjust variables and see how the results change in real-time!',
                    wobbleExpression: 'happy',
                },
                // Step 2: Point to formula grid
                {
                    targetSymbol: '__formula_first__',
                    targetType: 'formula-list' as const,
                    title: isKo ? '공식을 선택해보세요' : isJa ? '公式を選んでみてください' : 'Select a Formula',
                    message: isKo
                        ? '다양한 물리 공식이 준비되어 있어요. 원하는 공식을 탭해서 시뮬레이션을 시작해보세요!'
                        : isJa
                        ? '様々な物理公式が用意されています。好きな公式をタップしてシミュレーションを始めてみてください！'
                        : 'Various physics formulas are ready for you. Tap any formula to start the simulation!',
                    wobbleExpression: 'excited',
                },
            ]
        }

        // Simulation phase steps
        const simulationSteps: TutorialStep[] = []

        // Step 1: Explain canvas area
        simulationSteps.push({
            targetSymbol: '__canvas__',
            targetType: 'canvas' as const,
            title: isKo ? '시뮬레이션 화면' : isJa ? 'シミュレーション画面' : 'Simulation View',
            message: isKo
                ? '이 화면에서 물리 현상이 시각화돼요. 변수를 조절하면 워블 캐릭터의 움직임이 바뀌는 걸 볼 수 있어요!'
                : isJa
                ? 'この画面で物理現象が可視化されます。変数を調整するとウォブルキャラクターの動きが変わるのが見えます！'
                : 'Physics phenomena are visualized here. Adjust variables and watch how the Wobble character\'s movement changes!',
            wobbleExpression: 'happy',
        })

        // Step 2-N: Variable cards
        inputVariables.forEach((variable, index) => {
            const localizedVar = localizedVariables.find((v) => v.symbol === variable.symbol)
            const varName = localizedVar?.localizedName ?? localizeText(variable.name, i18n.language)

            simulationSteps.push({
                targetSymbol: variable.symbol,
                targetType: 'variable' as const,
                title: isKo ? `변수: ${variable.symbol}` : isJa ? `変数: ${variable.symbol}` : `Variable: ${variable.symbol}`,
                message: isKo
                    ? `이 카드는 "${varName}"를 조절해요. 탭해서 선택한 뒤 슬라이더로 값을 바꿔보세요!`
                    : isJa
                    ? `このカードは「${varName}」を調整します。タップして選択し、スライダーで値を変えてみてください！`
                    : `This card controls "${varName}". Tap to select it, then use the slider to change its value!`,
                wobbleExpression: index === 0 ? 'excited' : 'happy',
            })
        })

        // Challenge step
        simulationSteps.push({
            targetSymbol: '__challenge__',
            targetType: 'challenge' as const,
            title: isKo ? '챌린지 미션' : isJa ? 'チャレンジミッション' : 'Challenge Mission',
            message: isKo
                ? '화면 상단에 미션이 표시돼요. 변수를 조절해서 목표 조건을 맞춰보세요!'
                : isJa
                ? '画面上部にミッションが表示されます。変数を調整して目標条件を合わせてみてください！'
                : 'Missions appear at the top. Adjust variables to meet the target conditions!',
            wobbleExpression: 'surprised',
        })

        // Submit button step
        simulationSteps.push({
            targetSymbol: '__challenge_submit__',
            targetType: 'challenge-submit' as const,
            title: isKo ? '제출 버튼' : isJa ? '提出ボタン' : 'Submit Button',
            message: isKo
                ? '정답이라고 생각되면 제출 버튼을 눌러주세요! 맞추면 점수를 얻고, 연속으로 맞추면 콤보 보너스도 받아요!'
                : isJa
                ? '正解だと思ったら提出ボタンを押してください！当たるとポイントがもらえ、連続で当てるとコンボボーナスもあります！'
                : 'Press submit when you think you have the answer! Earn points for correct answers, and combo bonuses for streaks!',
            wobbleExpression: 'excited',
        })

        // Info button step if formula has applications
        if (hasInfo) {
            simulationSteps.push({
                targetSymbol: '__info__',
                targetType: 'info-button' as const,
                title: isKo ? '정보 버튼' : isJa ? '情報ボタン' : 'Info Button',
                message: isKo
                    ? '이 버튼을 누르면 공식이 실생활에서 어떻게 쓰이는지 알 수 있어요. 궁금하면 눌러보세요!'
                    : isJa
                    ? 'このボタンを押すと公式が実生活でどう使われるか分かります。気になったら押してみてください！'
                    : 'Tap this button to see how the formula is used in real life. Check it out if you\'re curious!',
                wobbleExpression: 'happy',
            })
        }

        return simulationSteps
    }, [tutorialPhase, inputVariables, localizedVariables, hasInfo, isKo, isJa, i18n.language])

    // Current target symbol based on step
    const currentTargetSymbol =
        isActive && steps[currentStep] ? steps[currentStep].targetSymbol : null

    // Auto-select card when tutorial step changes
    useEffect(() => {
        if (isActive && currentTargetSymbol) {
            onSelectCard(currentTargetSymbol)
        }
    }, [isActive, currentTargetSymbol, onSelectCard])

    const startTutorial = useCallback((forceRestart = false, phase: TutorialPhase = 'simulation') => {
        if (forceRestart) {
            localStorage.removeItem(SIMULATION_TUTORIAL_KEY)
            setHasCompletedTutorial(false)
        }
        setCurrentStep(0)
        setTutorialPhase(phase)
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
