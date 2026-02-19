import { Filter, GlProgram, GpuProgram } from 'pixi.js'
import type { PhysicsCategory } from '@/components/canvas/adventure/survivor/skills/types'

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`

const fragment = `
precision highp float;

#define PI 3.14159265359

in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uDimensions;
uniform float uHueCenter;      // Center hue for the theme (0-1)
uniform float uHueRange;       // How much hue can vary from center (0-1)
uniform float uSaturation;     // Color saturation
uniform float uRainbowIntensity;
uniform float uSparkleIntensity;
uniform float uSparkleSpeed;
uniform float uShimmerSpeed;
uniform float uFoilStrength;
uniform float uIsPrimary;      // 1.0 for primary, 0.0 for modifier

// Hash function for pseudo-random sparkles
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Smooth noise for shimmer
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = vTextureCoord;
    vec4 texColor = texture(uTexture, uv);

    // Skip transparent pixels
    if (texColor.a < 0.01) {
        finalColor = texColor;
        return;
    }

    // Normalized coordinates for effects
    vec2 normUv = uv * uDimensions / max(uDimensions.x, uDimensions.y);

    // === Themed Holographic Effect ===
    float angle = atan(normUv.y - 0.5, normUv.x - 0.5);
    float dist = length(normUv - 0.5);

    // Primary skills: more dynamic, wider hue range
    // Modifier skills: subtler, focused on theme color
    float dynamicRange = uHueRange * (uIsPrimary > 0.5 ? 1.0 : 0.5);
    float speedMod = uIsPrimary > 0.5 ? 1.0 : 0.6;

    // Calculate hue variation within the theme's range
    float hueOffset1 = sin(angle + uTime * uShimmerSpeed * speedMod * 0.3 + dist * 2.0) * dynamicRange;
    float hueOffset2 = cos(-angle * 0.7 + uTime * uShimmerSpeed * speedMod * 0.2 + normUv.x * 3.0) * dynamicRange * 0.5;

    // Blend offsets for complex iridescence
    float hueBlend = 0.5 + 0.5 * sin(uTime * 0.5 + dist * 3.0);
    float finalHueOffset = mix(hueOffset1, hueOffset2, hueBlend);

    // Apply hue centered on theme color
    float finalHue = fract(uHueCenter + finalHueOffset);

    // Create themed rainbow color
    vec3 themeColor = hsv2rgb(vec3(finalHue, uSaturation, 1.0));

    // === Shimmer/Foil Effect - Subtle and smooth ===
    float shimmerIntensity = uIsPrimary > 0.5 ? uFoilStrength * 0.5 : uFoilStrength * 0.3;
    float shimmer = noise(vec2(
        normUv.x * 4.0 + uTime * uShimmerSpeed * speedMod * 0.5,
        normUv.y * 4.0 - uTime * uShimmerSpeed * speedMod * 0.3
    ));
    shimmer = pow(shimmer, 3.0) * shimmerIntensity;

    // Diagonal light band - single smooth sweep like real foil
    float bandStrength = uIsPrimary > 0.5 ? 0.12 : 0.06;
    // Slower, wider band that sweeps across
    float bandPos = (normUv.x + normUv.y) * 0.5 - uTime * uShimmerSpeed * speedMod * 0.15;
    float bands = smoothstep(0.0, 0.3, fract(bandPos)) * smoothstep(1.0, 0.7, fract(bandPos));
    bands = bands * bandStrength;

    // === Sparkle Effect ===
    float sparkle = 0.0;
    int sparkleLayerCount = uIsPrimary > 0.5 ? 4 : 2;

    for (int i = 0; i < 4; i++) {
        if (i >= sparkleLayerCount) break;

        float scale = 18.0 + float(i) * 12.0;
        vec2 sparkleUv = floor(normUv * scale);

        float randomPhase = hash(sparkleUv + float(i) * 100.0);
        float sparkleTime = uTime * uSparkleSpeed + randomPhase * 6.28;
        float sparkleIntensity = pow(max(0.0, sin(sparkleTime)), 8.0);

        // Primary has more sparkles
        float threshold = uIsPrimary > 0.5 ? 0.82 : 0.9;
        if (hash(sparkleUv * 0.5 + float(i)) > threshold) {
            vec2 cellUv = fract(normUv * scale);
            float cellDist = length(cellUv - 0.5);
            float cellSparkle = smoothstep(0.3, 0.0, cellDist) * sparkleIntensity;
            sparkle += cellSparkle;
        }
    }
    sparkle = min(sparkle, 1.0) * uSparkleIntensity;

    // === Edge glow for primary skills ===
    float edgeGlow = 0.0;
    if (uIsPrimary > 0.5) {
        // Create glow near edges
        float edgeDist = min(min(normUv.x, 1.0 - normUv.x), min(normUv.y, 1.0 - normUv.y));
        edgeGlow = smoothstep(0.15, 0.0, edgeDist) * 0.3;
        edgeGlow *= 0.5 + 0.5 * sin(uTime * 2.0 + angle * 2.0);
    }

    // === Combine Effects - Clean Balatro Style ===
    // Keep original color, add very subtle holographic touches
    vec3 holoColor = texColor.rgb;

    // Very subtle color shift (barely noticeable)
    float tintAmount = uRainbowIntensity * (uIsPrimary > 0.5 ? 0.12 : 0.06);
    holoColor = mix(holoColor, holoColor * (0.85 + themeColor * 0.25), tintAmount);

    // Gentle shimmer highlight
    float shimmerHighlight = shimmer * (uIsPrimary > 0.5 ? 0.2 : 0.1);
    holoColor += vec3(shimmerHighlight);

    // Subtle diagonal sweep (like light catching foil)
    holoColor += vec3(bands);

    // Sparse sparkles
    vec3 sparkleColor = vec3(1.0);
    holoColor += sparkleColor * sparkle * 0.5;

    // Gentle edge highlight for primary
    if (uIsPrimary > 0.5) {
        holoColor += vec3(0.9, 0.75, 0.4) * edgeGlow * 0.25;
    }

    // Ensure color stays in valid range
    holoColor = clamp(holoColor, 0.0, 1.0);

    finalColor = vec4(holoColor, texColor.a);
}
`

// WebGPU shader (WGSL)
const source = `
struct HolographicUniforms {
    uTime: f32,
    uDimensions: vec2<f32>,
    uHueCenter: f32,
    uHueRange: f32,
    uSaturation: f32,
    uRainbowIntensity: f32,
    uSparkleIntensity: f32,
    uSparkleSpeed: f32,
    uShimmerSpeed: f32,
    uFoilStrength: f32,
    uIsPrimary: f32,
};

@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> uniforms: HolographicUniforms;

const PI: f32 = 3.14159265359;

fn hash(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453);
}

fn noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    var f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    let a = hash(i);
    let b = hash(i + vec2<f32>(1.0, 0.0));
    let c = hash(i + vec2<f32>(0.0, 1.0));
    let d = hash(i + vec2<f32>(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

fn hsv2rgb(c: vec3<f32>) -> vec3<f32> {
    let K = vec4<f32>(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    let p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, vec3<f32>(0.0), vec3<f32>(1.0)), c.y);
}

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let texColor = textureSample(uTexture, uSampler, uv);

    if (texColor.a < 0.01) {
        return texColor;
    }

    let normUv = uv * uniforms.uDimensions / max(uniforms.uDimensions.x, uniforms.uDimensions.y);

    let angle = atan2(normUv.y - 0.5, normUv.x - 0.5);
    let dist = length(normUv - 0.5);

    let isPrimary = uniforms.uIsPrimary > 0.5;
    let dynamicRange = uniforms.uHueRange * select(0.5, 1.0, isPrimary);
    let speedMod = select(0.6, 1.0, isPrimary);

    let hueOffset1 = sin(angle + uniforms.uTime * uniforms.uShimmerSpeed * speedMod * 0.3 + dist * 2.0) * dynamicRange;
    let hueOffset2 = cos(-angle * 0.7 + uniforms.uTime * uniforms.uShimmerSpeed * speedMod * 0.2 + normUv.x * 3.0) * dynamicRange * 0.5;

    let hueBlend = 0.5 + 0.5 * sin(uniforms.uTime * 0.5 + dist * 3.0);
    let finalHueOffset = mix(hueOffset1, hueOffset2, hueBlend);
    let finalHue = fract(uniforms.uHueCenter + finalHueOffset);

    let themeColor = hsv2rgb(vec3<f32>(finalHue, uniforms.uSaturation, 1.0));

    // Shimmer - Subtle and smooth
    let shimmerIntensity = uniforms.uFoilStrength * select(0.3, 0.5, isPrimary);
    let shimmer = pow(noise(vec2<f32>(
        normUv.x * 4.0 + uniforms.uTime * uniforms.uShimmerSpeed * speedMod * 0.5,
        normUv.y * 4.0 - uniforms.uTime * uniforms.uShimmerSpeed * speedMod * 0.3
    )), 3.0) * shimmerIntensity;

    let bandStrength = select(0.06, 0.12, isPrimary);
    let bandPos = (normUv.x + normUv.y) * 0.5 - uniforms.uTime * uniforms.uShimmerSpeed * speedMod * 0.15;
    let bands = smoothstep(0.0, 0.3, fract(bandPos)) * smoothstep(1.0, 0.7, fract(bandPos)) * bandStrength;

    // Sparkles
    var sparkle: f32 = 0.0;
    let sparkleLayerCount = select(2, 4, isPrimary);

    for (var i: i32 = 0; i < 4; i++) {
        if (i >= sparkleLayerCount) { break; }

        let scale = 18.0 + f32(i) * 12.0;
        let sparkleUv = floor(normUv * scale);
        let randomPhase = hash(sparkleUv + f32(i) * 100.0);
        let sparkleTime = uniforms.uTime * uniforms.uSparkleSpeed + randomPhase * 6.28;
        let sparkleIntensityVal = pow(max(0.0, sin(sparkleTime)), 8.0);

        let threshold = select(0.9, 0.82, isPrimary);
        if (hash(sparkleUv * 0.5 + f32(i)) > threshold) {
            let cellUv = fract(normUv * scale);
            let cellDist = length(cellUv - 0.5);
            let cellSparkle = smoothstep(0.3, 0.0, cellDist) * sparkleIntensityVal;
            sparkle += cellSparkle;
        }
    }
    sparkle = min(sparkle, 1.0) * uniforms.uSparkleIntensity;

    // Edge glow for primary
    var edgeGlow: f32 = 0.0;
    if (isPrimary) {
        let edgeDist = min(min(normUv.x, 1.0 - normUv.x), min(normUv.y, 1.0 - normUv.y));
        edgeGlow = smoothstep(0.15, 0.0, edgeDist) * 0.3;
        edgeGlow *= 0.5 + 0.5 * sin(uniforms.uTime * 2.0 + angle * 2.0);
    }

    // Combine - Clean Balatro Style
    var holoColor = texColor.rgb;

    // Very subtle color shift
    let tintAmount = uniforms.uRainbowIntensity * select(0.06, 0.12, isPrimary);
    holoColor = mix(holoColor, holoColor * (0.85 + themeColor * 0.25), tintAmount);

    // Gentle shimmer
    let shimmerHighlight = shimmer * select(0.1, 0.2, isPrimary);
    holoColor += vec3<f32>(shimmerHighlight);

    // Subtle diagonal sweep
    holoColor += vec3<f32>(bands);

    // Sparse sparkles
    let sparkleColor = vec3<f32>(1.0);
    holoColor += sparkleColor * sparkle * 0.5;

    // Gentle edge highlight for primary
    if (isPrimary) {
        holoColor += vec3<f32>(0.9, 0.75, 0.4) * edgeGlow * 0.25;
    }

    holoColor = clamp(holoColor, vec3<f32>(0.0), vec3<f32>(1.0));

    return vec4<f32>(holoColor, texColor.a);
}
`

/**
 * Theme presets for each physics category
 * Balatro-style color palette with rich, saturated colors
 * Each theme has: hueCenter (0-1), hueRange, saturation
 */
export interface HolographicTheme {
    hueCenter: number // Center hue (0-1, maps to 0-360 degrees)
    hueRange: number // How much hue varies (0-0.5)
    saturation: number // Color saturation (0-1)
    name: string // Theme name for debugging
}

export const HOLOGRAPHIC_THEMES: Record<PhysicsCategory, HolographicTheme> = {
    // Mechanics (역학) - Balatro Blue (#4a9eff)
    mechanics: {
        hueCenter: 0.58, // Blue (210°)
        hueRange: 0.08, // Tight range - blue to cyan
        saturation: 0.9, // Saturated Balatro style
        name: 'Mechanics',
    },
    // Electromagnetism (전자기학) - Balatro Cyan (#00aacc)
    electromagnetism: {
        hueCenter: 0.52, // Cyan (187°)
        hueRange: 0.06, // Tight electric cyan
        saturation: 0.95, // Very saturated for electric feel
        name: 'Electromagnetism',
    },
    // Wave Physics (파동학) - Purple/Violet
    wave: {
        hueCenter: 0.75, // Purple (270°)
        hueRange: 0.1, // Purple to magenta
        saturation: 0.85,
        name: 'Wave',
    },
    // Thermodynamics (열역학) - Balatro Red (#e85d4c)
    thermodynamics: {
        hueCenter: 0.02, // Red-Orange (7°)
        hueRange: 0.06, // Red to orange
        saturation: 0.9,
        name: 'Thermodynamics',
    },
    // Quantum Mechanics (양자역학) - Balatro Green (#2e7d32)
    quantum: {
        hueCenter: 0.35, // Green (126°)
        hueRange: 0.08, // Green to teal
        saturation: 0.85,
        name: 'Quantum',
    },
    // Fluid Dynamics (유체역학) - Aqua/Teal
    fluid: {
        hueCenter: 0.48, // Teal (173°)
        hueRange: 0.06, // Tight aqua range
        saturation: 0.8,
        name: 'Fluid',
    },
}

export interface HolographicFilterOptions {
    theme?: PhysicsCategory
    isPrimary?: boolean
    rainbowIntensity?: number
    sparkleIntensity?: number
    sparkleSpeed?: number
    shimmerSpeed?: number
    foilStrength?: number
}

export class HolographicFilter extends Filter {
    public uniforms: {
        uTime: number
        uDimensions: Float32Array
        uHueCenter: number
        uHueRange: number
        uSaturation: number
        uRainbowIntensity: number
        uSparkleIntensity: number
        uSparkleSpeed: number
        uShimmerSpeed: number
        uFoilStrength: number
        uIsPrimary: number
    }

    private _theme: PhysicsCategory = 'mechanics'

    constructor(options: HolographicFilterOptions = {}) {
        const {
            theme = 'mechanics',
            isPrimary = true,
            rainbowIntensity = 1.0,
            sparkleIntensity = 0.8,
            sparkleSpeed = 3.0,
            shimmerSpeed = 1.0,
            foilStrength = 0.5,
        } = options

        const themeData = HOLOGRAPHIC_THEMES[theme]

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'holographic-filter',
        })

        let gpuProgram: GpuProgram | undefined
        try {
            gpuProgram = GpuProgram.from({
                vertex: {
                    source,
                    entryPoint: 'main',
                },
                fragment: {
                    source,
                    entryPoint: 'main',
                },
            })
        } catch {
            // WebGPU not available
        }

        super({
            glProgram,
            gpuProgram,
            resources: {
                holographicUniforms: {
                    uTime: { value: 0, type: 'f32' },
                    uDimensions: { value: new Float32Array([100, 100]), type: 'vec2<f32>' },
                    uHueCenter: { value: themeData.hueCenter, type: 'f32' },
                    uHueRange: { value: themeData.hueRange, type: 'f32' },
                    uSaturation: { value: themeData.saturation, type: 'f32' },
                    uRainbowIntensity: { value: rainbowIntensity, type: 'f32' },
                    uSparkleIntensity: { value: sparkleIntensity, type: 'f32' },
                    uSparkleSpeed: { value: sparkleSpeed, type: 'f32' },
                    uShimmerSpeed: { value: shimmerSpeed, type: 'f32' },
                    uFoilStrength: { value: foilStrength, type: 'f32' },
                    uIsPrimary: { value: isPrimary ? 1.0 : 0.0, type: 'f32' },
                },
            },
        })

        this.uniforms = this.resources.holographicUniforms.uniforms
        this._theme = theme
    }

    get time(): number {
        return this.uniforms.uTime
    }

    set time(value: number) {
        this.uniforms.uTime = value
    }

    get theme(): PhysicsCategory {
        return this._theme
    }

    set theme(value: PhysicsCategory) {
        this._theme = value
        const themeData = HOLOGRAPHIC_THEMES[value]
        this.uniforms.uHueCenter = themeData.hueCenter
        this.uniforms.uHueRange = themeData.hueRange
        this.uniforms.uSaturation = themeData.saturation
    }

    get isPrimary(): boolean {
        return this.uniforms.uIsPrimary > 0.5
    }

    set isPrimary(value: boolean) {
        this.uniforms.uIsPrimary = value ? 1.0 : 0.0
    }

    get rainbowIntensity(): number {
        return this.uniforms.uRainbowIntensity
    }

    set rainbowIntensity(value: number) {
        this.uniforms.uRainbowIntensity = value
    }

    get sparkleIntensity(): number {
        return this.uniforms.uSparkleIntensity
    }

    set sparkleIntensity(value: number) {
        this.uniforms.uSparkleIntensity = value
    }

    setDimensions(width: number, height: number): void {
        this.uniforms.uDimensions[0] = width
        this.uniforms.uDimensions[1] = height
    }
}
