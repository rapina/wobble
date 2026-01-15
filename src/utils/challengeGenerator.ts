import { Formula, Variable } from '../formulas/types'
import { Challenge, ChallengeType } from '../stores/challengeStore'
import { t } from './localization'

// Condition templates for 'condition' type challenges
interface ConditionTemplate {
    ko: string
    en: string
    check: (value: number, range: [number, number]) => boolean
}

const CONDITION_TEMPLATES: ConditionTemplate[] = [
    {
        ko: '최대로',
        en: 'maximum',
        check: (v, range) => v >= range[1] * 0.9,
    },
    {
        ko: '최소로',
        en: 'minimum',
        check: (v, range) => v <= range[0] + (range[1] - range[0]) * 0.1,
    },
    {
        ko: '중간으로',
        en: 'middle',
        check: (v, range) => {
            const mid = (range[0] + range[1]) / 2
            return Math.abs(v - mid) <= (range[1] - range[0]) * 0.15
        },
    },
]

// Generate unique ID
function generateId(): string {
    return `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Round to nice number for display
function roundToNiceNumber(value: number, range: [number, number]): number {
    const rangeSize = range[1] - range[0]

    // For small ranges (< 10), round to 1 decimal
    if (rangeSize < 10) {
        return Math.round(value * 10) / 10
    }

    // For medium ranges, round to nearest 5
    if (rangeSize < 100) {
        return Math.round(value / 5) * 5 || Math.round(value)
    }

    // For large ranges, round to nearest 10
    return Math.round(value / 10) * 10 || Math.round(value)
}

// Format number for display
function formatNumber(value: number): string {
    if (Number.isInteger(value)) {
        return value.toString()
    }
    // Show up to 1 decimal place
    return value.toFixed(1).replace(/\.0$/, '')
}

// Generate target value challenge
function generateTargetChallenge(formula: Formula, variables: Variable[]): Challenge {
    if (variables.length === 0) {
        throw new Error('No variables available for target challenge')
    }

    const targetVar = variables[Math.floor(Math.random() * variables.length)]
    const [min, max] = targetVar.range

    // Random target value within range (avoiding extremes)
    const rangeBuffer = (max - min) * 0.1
    const safeMin = min + rangeBuffer
    const safeMax = max - rangeBuffer
    const rawTarget = safeMin + Math.random() * (safeMax - safeMin)
    const targetValue = roundToNiceNumber(rawTarget, targetVar.range)

    // Tolerance (5% of range)
    const tolerance = (max - min) * 0.05

    const displayValue = formatNumber(targetValue)
    const varNameKo = t(targetVar.name, 'ko')
    const varNameEn = t(targetVar.name, 'en')

    return {
        id: generateId(),
        type: 'target',
        formulaId: formula.id,
        mission: `${varNameKo}을(를) ${displayValue}${targetVar.unit}로 맞춰봐!`,
        missionEn: `Set ${varNameEn} to ${displayValue}${targetVar.unit}!`,
        condition: (vars) => Math.abs(vars[targetVar.symbol] - targetValue) <= tolerance,
        targetVariables: [targetVar.symbol],
        difficulty: 1,
    }
}

// Generate range challenge
function generateRangeChallenge(formula: Formula, outputVars: Variable[]): Challenge {
    if (outputVars.length === 0) {
        throw new Error('No output variables available for range challenge')
    }

    const targetVar = outputVars[Math.floor(Math.random() * outputVars.length)]
    const [min, max] = targetVar.range

    // Random range (20-30% of total range)
    const rangeSize = (max - min) * (0.2 + Math.random() * 0.1)
    const rangeStart = min + Math.random() * (max - min - rangeSize)
    const rangeEnd = rangeStart + rangeSize

    const displayStart = formatNumber(roundToNiceNumber(rangeStart, targetVar.range))
    const displayEnd = formatNumber(roundToNiceNumber(rangeEnd, targetVar.range))
    const varNameKo = t(targetVar.name, 'ko')
    const varNameEn = t(targetVar.name, 'en')

    // Store actual values for condition check
    const actualStart = roundToNiceNumber(rangeStart, targetVar.range)
    const actualEnd = roundToNiceNumber(rangeEnd, targetVar.range)

    return {
        id: generateId(),
        type: 'range',
        formulaId: formula.id,
        mission: `${varNameKo}을(를) ${displayStart}~${displayEnd} 사이로!`,
        missionEn: `Get ${varNameEn} between ${displayStart}-${displayEnd}!`,
        condition: (vars) => {
            const value = vars[targetVar.symbol]
            return value >= actualStart && value <= actualEnd
        },
        targetVariables: [targetVar.symbol],
        difficulty: 2,
    }
}

// Generate condition challenge
function generateConditionChallenge(formula: Formula, inputVars: Variable[]): Challenge {
    if (inputVars.length < 1) {
        throw new Error('Not enough input variables for condition challenge')
    }

    const var1 = inputVars[Math.floor(Math.random() * inputVars.length)]
    const remainingVars = inputVars.filter((v) => v !== var1)
    const var2 =
        remainingVars.length > 0
            ? remainingVars[Math.floor(Math.random() * remainingVars.length)]
            : null

    const cond1 = CONDITION_TEMPLATES[Math.floor(Math.random() * CONDITION_TEMPLATES.length)]
    const cond2 = var2
        ? CONDITION_TEMPLATES[Math.floor(Math.random() * CONDITION_TEMPLATES.length)]
        : null

    const var1NameKo = t(var1.name, 'ko')
    const var1NameEn = t(var1.name, 'en')

    let mission: string
    let missionEn: string

    if (var2 && cond2) {
        const var2NameKo = t(var2.name, 'ko')
        const var2NameEn = t(var2.name, 'en')
        mission = `${var1NameKo}은 ${cond1.ko}, ${var2NameKo}은 ${cond2.ko}!`
        missionEn = `${var1NameEn} to ${cond1.en}, ${var2NameEn} to ${cond2.en}!`
    } else {
        mission = `${var1NameKo}을(를) ${cond1.ko}!`
        missionEn = `Set ${var1NameEn} to ${cond1.en}!`
    }

    // Store variable info for condition closure
    const var1Symbol = var1.symbol
    const var1Range = var1.range
    const var2Symbol = var2?.symbol
    const var2Range = var2?.range

    return {
        id: generateId(),
        type: 'condition',
        formulaId: formula.id,
        mission,
        missionEn,
        condition: (vars) => {
            const check1 = cond1.check(vars[var1Symbol], var1Range)
            const check2 =
                var2Symbol && var2Range && cond2 ? cond2.check(vars[var2Symbol], var2Range) : true
            return check1 && check2
        },
        targetVariables: [var1Symbol, var2Symbol].filter((s): s is string => Boolean(s)),
        difficulty: var2 ? 3 : 2,
    }
}

// Main function to generate a random challenge
export function generateChallenge(formula: Formula): Challenge {
    const inputVars = formula.variables.filter((v) => v.role === 'input')
    const outputVars = formula.variables.filter((v) => v.role === 'output')
    const allVars = [...inputVars, ...outputVars]

    // Determine available challenge types based on formula structure
    const availableTypes: ChallengeType[] = []

    // Target challenge - needs at least one variable
    if (allVars.length > 0) {
        availableTypes.push('target')
    }

    // Range challenge - needs output variables
    if (outputVars.length > 0) {
        availableTypes.push('range')
    }

    // Condition challenge - needs at least one input variable
    if (inputVars.length >= 1) {
        availableTypes.push('condition')
    }

    // Fallback to target if nothing available
    if (availableTypes.length === 0) {
        availableTypes.push('target')
    }

    // Random type selection
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)]

    try {
        switch (type) {
            case 'target':
                return generateTargetChallenge(formula, allVars.length > 0 ? allVars : inputVars)
            case 'range':
                return generateRangeChallenge(formula, outputVars)
            case 'condition':
                return generateConditionChallenge(formula, inputVars)
            default:
                return generateTargetChallenge(formula, allVars)
        }
    } catch {
        // Fallback to target challenge if generation fails
        return generateTargetChallenge(formula, allVars.length > 0 ? allVars : inputVars)
    }
}
