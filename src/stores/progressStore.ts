import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressState {
    // Formulas the user has studied (viewed in simulation)
    studiedFormulas: Set<string>;

    // Mark a formula as studied
    studyFormula: (formulaId: string) => void;

    // Check if a formula has been studied
    hasStudied: (formulaId: string) => boolean;

    // Get all studied formulas
    getStudiedFormulas: () => string[];

    // Reset progress (for testing)
    resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            studiedFormulas: new Set<string>(),

            studyFormula: (formulaId: string) => {
                set((state) => {
                    const newSet = new Set(state.studiedFormulas);
                    newSet.add(formulaId);
                    return { studiedFormulas: newSet };
                });
            },

            hasStudied: (formulaId: string) => {
                return get().studiedFormulas.has(formulaId);
            },

            getStudiedFormulas: () => {
                return Array.from(get().studiedFormulas);
            },

            resetProgress: () => {
                set({ studiedFormulas: new Set<string>() });
            },
        }),
        {
            name: 'wobble-progress',
            // Custom serialization for Set
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const data = JSON.parse(str);
                    return {
                        ...data,
                        state: {
                            ...data.state,
                            studiedFormulas: new Set(data.state.studiedFormulas || []),
                        },
                    };
                },
                setItem: (name, value) => {
                    const data = {
                        ...value,
                        state: {
                            ...value.state,
                            studiedFormulas: Array.from(value.state.studiedFormulas || []),
                        },
                    };
                    localStorage.setItem(name, JSON.stringify(data));
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
);

// Physics law to formula mapping
export const lawToFormulaMap: Record<string, string[]> = {
    'inertia': [], // Always available
    'fma': ['newton-second'],
    'momentum': ['momentum'],
    'elastic': ['elastic-collision'],
    'reaction': ['newton-second'], // Newton's 3rd law
    'gravity': ['projectile', 'free-fall', 'gravity'],
    'chain': ['elastic-collision'],
};

// Check if a physics law is unlocked based on studied formulas
export function isLawUnlocked(law: string, studiedFormulas: Set<string>): boolean {
    const requiredFormulas = lawToFormulaMap[law];

    // Inertia is always available
    if (!requiredFormulas || requiredFormulas.length === 0) {
        return true;
    }

    // Check if any of the required formulas have been studied
    return requiredFormulas.some(formulaId => studiedFormulas.has(formulaId));
}

// Get all available laws based on studied formulas
export function getAvailableLaws(studiedFormulas: Set<string>): string[] {
    return Object.keys(lawToFormulaMap).filter(law =>
        isLawUnlocked(law, studiedFormulas)
    );
}
