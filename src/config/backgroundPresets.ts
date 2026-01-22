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
    // New pattern parameters for unique effects
    patternScale?: number
    warpIntensity?: number
    symmetry?: number
    flowSpeed?: number
    vortexStrength?: number
    noiseScale?: number
    rippleStrength?: number
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
    patternScale: 1.0,
    warpIntensity: 0.0,
    symmetry: 1.0,
    flowSpeed: 1.0,
    vortexStrength: 0.0,
    noiseScale: 0.0,
    rippleStrength: 0.0,
}

// Shop Screen - Royal purple kaleidoscope theme
export const shopPreset: BackgroundPreset = {
    color1: '#6b3d8a',
    color2: '#3d1a6b',
    color3: '#1a0d35',
    spinSpeed: 0.8,
    spinRotation: 0.5,
    contrast: 2.8,
    lighting: 0.35,
    spinAmount: 0.1,
    pixelFilter: 500,
    isRotate: true,
    // Luxurious kaleidoscope pattern
    patternScale: 0.8,
    warpIntensity: 0.3,
    symmetry: 6.0, // 6-fold symmetry like a jewel
    flowSpeed: 0.5,
    vortexStrength: 0.0,
    noiseScale: 0.0,
    rippleStrength: 0.0,
}

// Collection Screen - Ocean ripple theme
export const collectionPreset: BackgroundPreset = {
    color1: '#2d5a8a',
    color2: '#1a3d6b',
    color3: '#0d1a35',
    spinSpeed: 0.6,
    spinRotation: -0.3,
    contrast: 2.2,
    lighting: 0.3,
    spinAmount: 0.08,
    pixelFilter: 600,
    isRotate: true,
    // Gentle water ripple effect
    patternScale: 1.2,
    warpIntensity: 0.0,
    symmetry: 1.0,
    flowSpeed: 0.8,
    vortexStrength: 0.0,
    noiseScale: 0.0,
    rippleStrength: 1.5, // Strong ripple effect
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
    patternScale: 1.0,
    warpIntensity: 0.2,
    symmetry: 4.0,
    flowSpeed: 0.6,
    vortexStrength: 0.0,
    noiseScale: 0.0,
    rippleStrength: 0.0,
}

// Sandbox Screen - Scientific organic flow theme
export const sandboxPreset: BackgroundPreset = {
    color1: '#4a8a5a',
    color2: '#2d6b3d',
    color3: '#0d351a',
    spinSpeed: 1.2,
    spinRotation: -0.8,
    contrast: 2.0,
    lighting: 0.25,
    spinAmount: 0.15,
    pixelFilter: 550,
    isRotate: true,
    // Organic, scientific flow pattern with noise
    patternScale: 1.3,
    warpIntensity: 0.8,
    symmetry: 1.0,
    flowSpeed: 1.5,
    vortexStrength: 0.0,
    noiseScale: 0.15, // Organic noise distortion
    rippleStrength: 0.0,
}

// Game Select Screen - Energetic vortex theme
export const gameSelectPreset: BackgroundPreset = {
    color1: '#8a3d4a',
    color2: '#6b1a2d',
    color3: '#350d15',
    spinSpeed: 2.5,
    spinRotation: 2.0,
    contrast: 2.5,
    lighting: 0.3,
    spinAmount: 0.25,
    pixelFilter: 500,
    isRotate: true,
    // Energetic spiral vortex
    patternScale: 0.9,
    warpIntensity: 0.5,
    symmetry: 1.0,
    flowSpeed: 2.0,
    vortexStrength: 0.8, // Strong vortex spiral
    noiseScale: 0.0,
    rippleStrength: 0.0,
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
    patternScale: 1.0,
    warpIntensity: 0.3,
    symmetry: 1.0,
    flowSpeed: 1.5,
    vortexStrength: 0.3,
    noiseScale: 0.0,
    rippleStrength: 0.0,
}

// MiniGame Screen - Deep space vortex theme
export const minigamePreset: BackgroundPreset = {
    color1: '#5d3d8a',
    color2: '#2d2060',
    color3: '#0d0d30',
    spinSpeed: 1.8,
    spinRotation: -1.5,
    contrast: 2.8,
    lighting: 0.25,
    spinAmount: 0.2,
    pixelFilter: 700,
    isRotate: true,
    patternScale: 1.1,
    warpIntensity: 0.4,
    symmetry: 3.0, // 3-fold symmetry
    flowSpeed: 1.2,
    vortexStrength: 0.5,
    noiseScale: 0.0,
    rippleStrength: 0.0,
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
    patternScale: 1.0,
    warpIntensity: 0.2,
    symmetry: 1.0,
    flowSpeed: 1.0,
    vortexStrength: 0.2,
    noiseScale: 0.0,
    rippleStrength: 0.0,
}

// Lab Screen - Industrial orange/brown factory theme
export const labPreset: BackgroundPreset = {
    color1: '#8a5a2d',
    color2: '#6b3d1a',
    color3: '#351a0d',
    spinSpeed: 0.6,
    spinRotation: -0.3,
    contrast: 2.4,
    lighting: 0.28,
    spinAmount: 0.08,
    pixelFilter: 650,
    isRotate: true,
    patternScale: 1.1,
    warpIntensity: 0.15,
    symmetry: 1.0,
    flowSpeed: 0.6,
    vortexStrength: 0.1,
    noiseScale: 0.08,
    rippleStrength: 0.0,
}
