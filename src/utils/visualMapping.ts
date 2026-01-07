import { VisualProperty } from '../formulas/types';

export interface BlobVisuals {
    size: number;
    stretchX: number;
    stretchY: number;
    glowIntensity: number;
    shakeAmplitude: number;
    oscillateSpeed: number;
    speed: number;
}

export const defaultVisuals: BlobVisuals = {
    size: 60,
    stretchX: 1,
    stretchY: 1,
    glowIntensity: 0,
    shakeAmplitude: 0,
    oscillateSpeed: 1,
    speed: 0,
};

export function applyVisualProperty(
    visuals: BlobVisuals,
    property: VisualProperty,
    scaledValue: number
): BlobVisuals {
    const updated = { ...visuals };

    switch (property) {
        case 'size':
            updated.size = scaledValue;
            break;
        case 'stretch':
            updated.stretchX = scaledValue;
            updated.stretchY = 2 - scaledValue; // Inverse for squash effect
            break;
        case 'glow':
            updated.glowIntensity = scaledValue;
            break;
        case 'shake':
            updated.shakeAmplitude = scaledValue;
            break;
        case 'oscillate':
            updated.oscillateSpeed = scaledValue;
            break;
        case 'speed':
            updated.speed = scaledValue;
            break;
        case 'distance':
            // Distance is handled separately in layout
            break;
    }

    return updated;
}

export function calculateBlobVisuals(
    variables: Record<string, number>,
    formulaVariables: {
        symbol: string;
        visual: { property: VisualProperty; scale: (v: number) => number };
    }[]
): Record<string, BlobVisuals> {
    const blobVisuals: Record<string, BlobVisuals> = {};

    for (const varDef of formulaVariables) {
        const value = variables[varDef.symbol] ?? 0;
        const scaledValue = varDef.visual.scale(value);

        let visuals = { ...defaultVisuals };
        visuals = applyVisualProperty(visuals, varDef.visual.property, scaledValue);

        blobVisuals[varDef.symbol] = visuals;
    }

    return blobVisuals;
}
