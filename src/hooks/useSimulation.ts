import { useEffect, useMemo } from 'react'
import { useSimulationStore } from '../stores/simulationStore'
import { calculateBlobVisuals, BlobVisuals } from '../utils/visualMapping'

export function useSimulation(formulaId: string) {
    const { currentFormula, variables, setFormula, setVariable, reset } = useSimulationStore()

    useEffect(() => {
        setFormula(formulaId)
    }, [formulaId, setFormula])

    const blobVisuals = useMemo((): Record<string, BlobVisuals> => {
        if (!currentFormula) return {}
        return calculateBlobVisuals(variables, currentFormula.variables)
    }, [currentFormula, variables])

    const inputVariables = useMemo(() => {
        if (!currentFormula) return []
        return currentFormula.variables.filter((v) => v.role === 'input')
    }, [currentFormula])

    const outputVariables = useMemo(() => {
        if (!currentFormula) return []
        return currentFormula.variables.filter((v) => v.role === 'output')
    }, [currentFormula])

    return {
        formula: currentFormula,
        variables,
        blobVisuals,
        inputVariables,
        outputVariables,
        setVariable,
        reset,
    }
}
