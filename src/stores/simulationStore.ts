import { create } from 'zustand';
import { getFormula } from '../formulas/registry';
import { Formula, Variable } from '../formulas/types';

interface SimulationState {
    currentFormulaId: string | null;
    currentFormula: Formula | null;
    variables: Record<string, number>;

    setFormula: (id: string) => void;
    setVariable: (symbol: string, value: number) => void;
    reset: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
    currentFormulaId: null,
    currentFormula: null,
    variables: {},

    setFormula: (id: string) => {
        const formula = getFormula(id);
        if (!formula) return;

        const initialVariables: Record<string, number> = {};
        formula.variables.forEach((v: Variable) => {
            initialVariables[v.symbol] = v.default;
        });

        // Calculate initial outputs
        const outputs = formula.calculate(initialVariables);

        set({
            currentFormulaId: id,
            currentFormula: formula,
            variables: { ...initialVariables, ...outputs },
        });
    },

    setVariable: (symbol: string, value: number) => {
        const { currentFormula, variables } = get();
        if (!currentFormula) return;

        const newVariables = { ...variables, [symbol]: value };

        // Calculate outputs based on new inputs
        const outputs = currentFormula.calculate(newVariables);

        set({
            variables: { ...newVariables, ...outputs },
        });
    },

    reset: () => {
        const { currentFormula } = get();
        if (!currentFormula) return;

        const initialVariables: Record<string, number> = {};
        currentFormula.variables.forEach((v: Variable) => {
            initialVariables[v.symbol] = v.default;
        });

        // Calculate initial outputs
        const outputs = currentFormula.calculate(initialVariables);

        set({
            variables: { ...initialVariables, ...outputs },
        });
    },
}));
