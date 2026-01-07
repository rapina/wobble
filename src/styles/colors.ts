export const colors = {
    // LocoRoco-style warm, playful variable colors
    mass: '#F5B041', // LocoRoco Yellow - m (질량)
    velocity: '#5DADE2', // Sky Blue - v, a (속도/가속도)
    force: '#F7DC6F', // Warm Yellow - F, E (힘/에너지)
    distance: '#82E0AA', // Soft Green - r, L (거리/길이)
    time: '#D7BDE2', // Soft Lavender - t, T (시간/주기)

    // Playful variable colors
    spring: '#F39C12', // Warm Orange - k (스프링 상수)
    temperature: '#E74C3C', // Soft Red - T (온도)
    pressure: '#9B59B6', // Soft Purple - P (압력)
    voltage: '#F4D03F', // Golden Yellow - V (전압)
    current: '#48C9B0', // Turquoise - I (전류)
    resistance: '#F1948A', // Soft Pink - R (저항)
    charge: '#F5B041', // Amber - q (전하)
    power: '#58D68D', // Fresh Green - P (전력)
    energy: '#F5B7B1', // Soft Coral - E (에너지)
    density: '#5499C7', // Ocean Blue - ρ (밀도)
    volume: '#85C1E9', // Light Sky Blue - V (부피)
    wavelength: '#BB8FCE', // Soft Purple - λ (파장)

    // GBA SP Device colors (Deep Purple like the image)
    gbaShell: '#4A3463', // Deep purple shell
    gbaShellDark: '#2D1F3D', // Darker purple for shadows
    gbaShellLight: '#6B4D8A', // Lighter purple for highlights
    gbaShellMid: '#3D2952', // Mid purple for buttons
    gbaScreen: '#8BAC0F', // Classic GBA green screen tint
    gbaScreenDark: '#0F380F', // Dark green for screen bg
    gbaScreenFrame: '#1A1A1A', // Screen bezel (darker)

    // Background (screen area) - LocoRoco-inspired warm tones
    background: '#1A1A2E',
    backgroundLight: '#2C3E50',
    backgroundDark: '#17202A',

    // LocoRoco Scene Colors (for canvas backgrounds)
    sceneSky: '#AED6F1', // Soft sky blue
    sceneCloud: '#D7BDE2', // Soft purple clouds
    sceneGrass: '#58D68D', // Fresh grass green
    sceneGround: '#F5B041', // Warm yellow ground
    sceneTree: '#5DADE2', // Blue tree (LocoRoco style)

    // GBA UI elements
    surface: '#4A3D6E', // Purple surface
    surfaceLight: '#5D4F82', // Lighter surface
    border: '#6B5B9A', // Purple border
    borderDark: '#3D3266', // Dark border for depth

    // GBA Buttons (darker like the image)
    buttonA: '#2D1F3D', // Dark purple A button
    buttonB: '#2D1F3D', // Dark purple B button
    buttonDpad: '#1A1225', // Very dark D-pad
    buttonSmall: '#2D1F3D', // SELECT/START buttons
    buttonPressed: '#1A1225', // Pressed state

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#D1C4E9', // Light purple tint
    textMuted: '#9575CD', // Muted purple

    // Accent
    accent: '#A855F7',
    accentLight: '#C084FC',
    primary: '#A855F7',

    // Screen glow
    screenGlow: '#9AE6B4', // Slight green glow like old screens
} as const;

export type ColorKey = keyof typeof colors;
