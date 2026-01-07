import { create } from 'zustand';
import { WobbleShape, WOBBLE_CHARACTERS, FORMULA_WOBBLES } from '../components/canvas/Wobble';

const STORAGE_KEY = 'wobble-collection';
const ALL_SHAPES: WobbleShape[] = ['circle', 'square', 'triangle', 'star', 'diamond', 'pentagon'];

interface CollectionState {
    unlockedWobbles: WobbleShape[];
    unlockWobble: (shape: WobbleShape) => void;
    unlockByFormula: (formulaId: string) => void;
    isUnlocked: (shape: WobbleShape) => boolean;
    getProgress: () => { unlocked: number; total: number };
    resetCollection: () => void;
}

const getInitialCollection = (): WobbleShape[] => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Validate that all items are valid WobbleShapes
            return parsed.filter((s: string) => ALL_SHAPES.includes(s as WobbleShape));
        }
    } catch {
        // localStorage not available or invalid data
    }
    return [];
};

const saveCollection = (wobbles: WobbleShape[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wobbles));
    } catch {
        // localStorage not available
    }
};

export const useCollectionStore = create<CollectionState>((set, get) => ({
    unlockedWobbles: getInitialCollection(),

    unlockWobble: (shape: WobbleShape) => {
        const current = get().unlockedWobbles;
        if (!current.includes(shape)) {
            const updated = [...current, shape];
            saveCollection(updated);
            set({ unlockedWobbles: updated });
        }
    },

    unlockByFormula: (formulaId: string) => {
        const shapes = FORMULA_WOBBLES[formulaId];
        if (shapes) {
            const current = get().unlockedWobbles;
            const newShapes = shapes.filter(s => !current.includes(s));
            if (newShapes.length > 0) {
                const updated = [...current, ...newShapes];
                saveCollection(updated);
                set({ unlockedWobbles: updated });
            }
        }
    },

    isUnlocked: (shape: WobbleShape) => {
        return get().unlockedWobbles.includes(shape);
    },

    getProgress: () => {
        return {
            unlocked: get().unlockedWobbles.length,
            total: ALL_SHAPES.length,
        };
    },

    resetCollection: () => {
        saveCollection([]);
        set({ unlockedWobbles: [] });
    },
}));

// Helper: Get all wobble characters with unlock status
export const getWobbleCollection = () => {
    const { unlockedWobbles } = useCollectionStore.getState();
    return ALL_SHAPES.map(shape => ({
        ...WOBBLE_CHARACTERS[shape],
        isUnlocked: unlockedWobbles.includes(shape),
    }));
};
