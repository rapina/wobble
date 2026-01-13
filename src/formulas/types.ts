export type VisualProperty =
    | 'size'
    | 'speed'
    | 'glow'
    | 'stretch'
    | 'distance'
    | 'oscillate'
    | 'shake'

export interface VisualMapping {
    property: VisualProperty
    scale: (value: number) => number
    color: string
}

export interface Variable {
    symbol: string
    name: string
    nameEn?: string
    role: 'input' | 'output'
    unit: string
    range: [number, number]
    default: number
    visual: VisualMapping
}

export interface Connection {
    from: string
    to: string
    operator: '×' | '÷' | '=' | '+' | '-' | '²' | '÷r²' | '√'
}

export type LayoutType =
    | 'linear'
    | 'orbital'
    | 'pendulum'
    | 'wave'
    | 'spring'
    | 'circular'
    | 'container'
    | 'flow'
    | 'explosion'
    | 'float'

export interface LayoutConfig {
    type: LayoutType
    connections: Connection[]
}

export type FormulaCategory =
    | 'mechanics'
    | 'wave'
    | 'gravity'
    | 'thermodynamics'
    | 'electricity'
    | 'special'
    | 'quantum'

// Display layout for formula visualization
export type DisplayLayoutType = 'linear' | 'fraction' | 'fraction-square' | 'custom'

// Expression element types for custom layout
export type ExpressionElement =
    | { type: 'var'; symbol: string; square?: boolean }
    | { type: 'op'; value: string }
    | { type: 'text'; value: string }
    | { type: 'group'; items: ExpressionElement[] }
    | { type: 'fraction'; numerator: ExpressionElement[]; denominator: ExpressionElement[] }

export interface DisplayLayout {
    type: DisplayLayoutType
    output: string // output variable symbol
    // For linear: items in order
    // For fraction: numerator / denominator
    numerator?: string[] // symbols in numerator (or left side for linear)
    denominator?: string[] // symbols in denominator
    coefficient?: string // e.g., "½" for kinetic energy
    squares?: string[] // symbols that should show ² superscript
    // For custom: expression array
    expression?: ExpressionElement[]
}

export interface Formula {
    id: string
    name: string
    nameEn?: string
    expression: string
    description: string
    descriptionEn?: string
    /** 시뮬레이션이 무엇을 보여주는지 설명 (배너에 표시) */
    simulationHint?: string
    simulationHintEn?: string
    /** 실생활에서 이 공식이 사용되는 예시들 */
    applications?: string[]
    applicationsEn?: string[]
    category: FormulaCategory
    variables: Variable[]
    calculate: (inputs: Record<string, number>) => Record<string, number>
    formatCalculation: (inputs: Record<string, number>) => string
    layout: LayoutConfig
    displayLayout?: DisplayLayout
}
