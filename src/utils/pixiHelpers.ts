/**
 * Convert CSS color string to PixiJS hex number
 */
export function cssToHex(css: string): number {
    if (css.startsWith('#')) {
        return parseInt(css.slice(1), 16);
    }
    // Handle rgb/rgba
    if (css.startsWith('rgb')) {
        const match = css.match(/\d+/g);
        if (match && match.length >= 3) {
            const r = parseInt(match[0]);
            const g = parseInt(match[1]);
            const b = parseInt(match[2]);
            return (r << 16) + (g << 8) + b;
        }
    }
    return 0x000000;
}

/**
 * Pre-converted colors for PixiJS (hex numbers)
 * LocoRoco-style warm, playful palette
 */
export const pixiColors = {
    // Variable colors - LocoRoco style
    mass: 0xf5b041, // LocoRoco Yellow
    velocity: 0x5dade2, // Sky Blue
    force: 0xf7dc6f, // Warm Yellow
    distance: 0x82e0aa, // Soft Green
    time: 0xd7bde2, // Soft Lavender
    spring: 0xf39c12, // Warm Orange
    temperature: 0xe74c3c, // Soft Red
    pressure: 0x9b59b6, // Soft Purple
    volume: 0x85c1e9, // Light Sky Blue
    energy: 0xf5b7b1, // Soft Coral
    charge: 0xf5b041, // Amber
    current: 0x48c9b0, // Turquoise
    voltage: 0xf4d03f, // Golden Yellow
    resistance: 0xf1948a, // Soft Pink
    frequency: 0x5dade2, // Sky Blue
    wavelength: 0xbb8fce, // Soft Purple
    amplitude: 0xf39c12, // Warm Orange
    angle: 0x48c9b0, // Turquoise
    density: 0x5499c7, // Ocean Blue
    power: 0x58d68d, // Fresh Green

    // LocoRoco Scene colors
    sceneSky: 0xaed6f1, // Soft sky blue
    sceneCloud: 0xd7bde2, // Soft purple clouds
    sceneGrass: 0x58d68d, // Fresh grass green
    sceneGround: 0xf5b041, // Warm yellow ground
    sceneTree: 0x5dade2, // Blue tree

    // UI colors
    backgroundDark: 0x17202a,
    gbaShell: 0x4a3463,
    gbaShellDark: 0x2d1f3d,
    accent: 0xf5b041,
    outline: 0x2c2c2c, // LocoRoco outline color

    // Common colors
    white: 0xffffff,
    black: 0x000000,
} as const;

/**
 * Lerp between two values
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
