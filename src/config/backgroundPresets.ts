// Background presets for each screen using Balatro component
// Each preset creates a unique visual identity for its screen

export interface BackgroundPreset {
    color1: string
    color2: string
    color3: string
    spinSpeed: number
    spinRotation: number
    contrast: number
    lighting: number
    spinAmount: number
    pixelFilter: number
    spinEase?: number
    isRotate: boolean
}

// Home Screen - Green felt table theme (default)
export const homePreset: BackgroundPreset = {
    color1: '#2d5a4a',
    color2: '#1a4035',
    color3: '#0d2018',
    spinSpeed: 1.5,
    spinRotation: -1,
    contrast: 2,
    lighting: 0.2,
    spinAmount: 0.1,
    pixelFilter: 600,
    isRotate: true,
}

// Shop Screen - Royal purple theme
export const shopPreset: BackgroundPreset = {
    color1: '#4a2d6b',
    color2: '#2d1a4a',
    color3: '#1a0d2d',
    spinSpeed: 1.2,
    spinRotation: 1,
    contrast: 2.2,
    lighting: 0.25,
    spinAmount: 0.15,
    pixelFilter: 550,
    isRotate: true,
}

// Collection Screen - Ocean blue theme
export const collectionPreset: BackgroundPreset = {
    color1: '#2d4a6b',
    color2: '#1a3550',
    color3: '#0d1a2d',
    spinSpeed: 1.0,
    spinRotation: -0.5,
    contrast: 2.5,
    lighting: 0.3,
    spinAmount: 0.12,
    pixelFilter: 650,
    isRotate: true,
}

// Achievements Screen - Golden trophy theme
export const achievementsPreset: BackgroundPreset = {
    color1: '#6b5a2d',
    color2: '#4a3d1a',
    color3: '#2d240d',
    spinSpeed: 0.8,
    spinRotation: 0.5,
    contrast: 2.8,
    lighting: 0.35,
    spinAmount: 0.08,
    pixelFilter: 700,
    isRotate: true,
}

// Sandbox Screen - Scientific teal theme
export const sandboxPreset: BackgroundPreset = {
    color1: '#2d6b5a',
    color2: '#1a4a3d',
    color3: '#0d2d24',
    spinSpeed: 2.0,
    spinRotation: -1.5,
    contrast: 2.0,
    lighting: 0.2,
    spinAmount: 0.2,
    pixelFilter: 500,
    isRotate: true,
}

// Game Select Screen - Fiery red theme
export const gameSelectPreset: BackgroundPreset = {
    color1: '#6b2d3a',
    color2: '#4a1a28',
    color3: '#2d0d15',
    spinSpeed: 1.8,
    spinRotation: 1.2,
    contrast: 2.3,
    lighting: 0.28,
    spinAmount: 0.18,
    pixelFilter: 580,
    isRotate: true,
}

// Game Screen (Survivor) - Intense orange/gold theme
export const gamePreset: BackgroundPreset = {
    color1: '#F5B041',
    color2: '#5DADE2',
    color3: '#1a1a2e',
    spinSpeed: 3,
    spinRotation: -2,
    contrast: 2.5,
    lighting: 0.3,
    spinAmount: 0.2,
    pixelFilter: 800,
    isRotate: true,
}

// MiniGame Screen - Deep space theme
export const minigamePreset: BackgroundPreset = {
    color1: '#3d2d6b',
    color2: '#1a2050',
    color3: '#0d0d2d',
    spinSpeed: 2.5,
    spinRotation: -1.8,
    contrast: 2.6,
    lighting: 0.22,
    spinAmount: 0.25,
    pixelFilter: 750,
    isRotate: true,
}

// Intro Screen - Cosmic theme
export const introPreset: BackgroundPreset = {
    color1: '#4a3d6b',
    color2: '#2d2850',
    color3: '#1a1530',
    spinSpeed: 1.5,
    spinRotation: 0.8,
    contrast: 3.0,
    lighting: 0.4,
    spinAmount: 0.15,
    pixelFilter: 600,
    isRotate: true,
}
