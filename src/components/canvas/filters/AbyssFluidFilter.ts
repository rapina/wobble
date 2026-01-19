/**
 * AbyssFluidFilter.ts - Organic fluid effect for the abyss water
 * Based on BalatroFilter with modifications for fluid-like appearance
 */

import { Filter, GlProgram, GpuProgram } from 'pixi.js'

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
uniform vec4 uColorDeep;
uniform vec4 uColorMid;
uniform vec4 uColorSurface;
uniform float uFlowSpeed;
uniform float uWaveIntensity;
uniform float uSurfaceY;      // 0-1, where the surface starts
uniform float uBloodLevel;    // 0-1, color shift intensity

// Simplex noise function for organic movement
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                     + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = vTextureCoord;
    vec2 screenCoord = uv * uDimensions;

    // Normalize coordinates
    vec2 normalizedUV = screenCoord / uDimensions;

    // Flow animation
    float time = uTime * uFlowSpeed;

    // Multiple layers of noise for organic fluid movement
    float noise1 = snoise(normalizedUV * 3.0 + vec2(time * 0.3, time * 0.2));
    float noise2 = snoise(normalizedUV * 6.0 + vec2(-time * 0.2, time * 0.4));
    float noise3 = snoise(normalizedUV * 12.0 + vec2(time * 0.5, -time * 0.3));

    // Combine noise layers
    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

    // Surface wave effect - larger amplitude for visible waves
    // Match the Graphics line: waveAmplitude = 8px, scaled to normalized coords
    // For ~150px fluid height, 8px ≈ 0.053 normalized
    float surfaceWave = sin(normalizedUV.x * 15.0 + time * 2.0) * 0.025
                      + sin(normalizedUV.x * 8.0 - time * 1.5) * 0.0175
                      + sin(normalizedUV.x * 25.0 + time * 4.0) * 0.01;

    // Adjust surface position with wave
    float adjustedSurfaceY = uSurfaceY + surfaceWave * uWaveIntensity;

    // Depth factor (0 at surface, 1 at bottom)
    float depth = smoothstep(adjustedSurfaceY - 0.05, adjustedSurfaceY + 0.3, normalizedUV.y);

    // Add noise-based distortion to depth
    depth += combinedNoise * 0.15 * (1.0 - depth);

    // Swirling effect (slower, more fluid-like than Balatro)
    vec2 swirl = vec2(
        sin(normalizedUV.y * 8.0 + time * 0.5 + combinedNoise * 2.0),
        cos(normalizedUV.x * 8.0 + time * 0.4 + combinedNoise * 2.0)
    ) * 0.03 * uWaveIntensity;

    // Apply swirl to UV for color sampling
    vec2 swirlUV = normalizedUV + swirl;
    float swirlNoise = snoise(swirlUV * 4.0 + vec2(time * 0.2));

    // Color mixing based on depth and noise
    float colorMix = depth + swirlNoise * 0.2;
    colorMix = clamp(colorMix, 0.0, 1.0);

    // Three-color gradient: surface -> mid -> deep
    vec4 color;
    if (colorMix < 0.5) {
        color = mix(uColorSurface, uColorMid, colorMix * 2.0);
    } else {
        color = mix(uColorMid, uColorDeep, (colorMix - 0.5) * 2.0);
    }

    // Surface highlight/foam effect
    float surfaceDist = abs(normalizedUV.y - adjustedSurfaceY);
    float surfaceHighlight = smoothstep(0.05, 0.0, surfaceDist);
    surfaceHighlight *= 0.5 + 0.5 * sin(normalizedUV.x * 30.0 + time * 3.0);

    // Add bright foam at surface
    color.rgb += surfaceHighlight * 0.4 * uColorSurface.rgb;

    // Subtle internal glow/caustics
    float caustics = snoise(normalizedUV * 20.0 + vec2(time * 0.8, time * 0.6));
    caustics = pow(max(0.0, caustics), 3.0) * 0.15;
    color.rgb += caustics * uColorMid.rgb;

    // Fade to transparent above surface
    float alpha = smoothstep(adjustedSurfaceY - 0.02, adjustedSurfaceY + 0.02, normalizedUV.y);

    // Edge darkening for depth
    float edgeDark = 1.0 - smoothstep(0.3, 0.5, abs(normalizedUV.x - 0.5) * 2.0) * 0.2;
    color.rgb *= edgeDark;

    finalColor = vec4(color.rgb, alpha * color.a);
}
`

// WebGPU shader (WGSL)
const source = `
struct AbyssUniforms {
    uTime: f32,
    uDimensions: vec2<f32>,
    uColorDeep: vec4<f32>,
    uColorMid: vec4<f32>,
    uColorSurface: vec4<f32>,
    uFlowSpeed: f32,
    uWaveIntensity: f32,
    uSurfaceY: f32,
    uBloodLevel: f32,
};

@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> uniforms: AbyssUniforms;

fn mod289_3(x: vec3<f32>) -> vec3<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289_2(x: vec2<f32>) -> vec2<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn permute(x: vec3<f32>) -> vec3<f32> { return mod289_3(((x*34.0)+1.0)*x); }

fn snoise(v: vec2<f32>) -> f32 {
    let C = vec4<f32>(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    var i = floor(v + dot(v, C.yy));
    let x0 = v - i + dot(i, C.xx);
    var i1: vec2<f32>;
    if (x0.x > x0.y) { i1 = vec2<f32>(1.0, 0.0); } else { i1 = vec2<f32>(0.0, 1.0); }
    var x12 = x0.xyxy + C.xxzz;
    x12 = vec4<f32>(x12.xy - i1, x12.zw);
    i = mod289_2(i);
    let p = permute(permute(i.y + vec3<f32>(0.0, i1.y, 1.0)) + i.x + vec3<f32>(0.0, i1.x, 1.0));
    var m = max(vec3<f32>(0.5) - vec3<f32>(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), vec3<f32>(0.0));
    m = m*m; m = m*m;
    let x = 2.0 * fract(p * C.www) - 1.0;
    let h = abs(x) - 0.5;
    let ox = floor(x + 0.5);
    let a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    var g: vec3<f32>;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.y = a0.y * x12.x + h.y * x12.y;
    g.z = a0.z * x12.z + h.z * x12.w;
    return 130.0 * dot(m, g);
}

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let screenCoord = uv * uniforms.uDimensions;
    let normalizedUV = screenCoord / uniforms.uDimensions;
    let time = uniforms.uTime * uniforms.uFlowSpeed;

    let noise1 = snoise(normalizedUV * 3.0 + vec2<f32>(time * 0.3, time * 0.2));
    let noise2 = snoise(normalizedUV * 6.0 + vec2<f32>(-time * 0.2, time * 0.4));
    let noise3 = snoise(normalizedUV * 12.0 + vec2<f32>(time * 0.5, -time * 0.3));
    let combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

    let surfaceWave = sin(normalizedUV.x * 15.0 + time * 2.0) * 0.025
                    + sin(normalizedUV.x * 8.0 - time * 1.5) * 0.0175
                    + sin(normalizedUV.x * 25.0 + time * 4.0) * 0.01;

    let adjustedSurfaceY = uniforms.uSurfaceY + surfaceWave * uniforms.uWaveIntensity;
    var depth = smoothstep(adjustedSurfaceY - 0.05, adjustedSurfaceY + 0.3, normalizedUV.y);
    depth += combinedNoise * 0.15 * (1.0 - depth);

    let swirl = vec2<f32>(
        sin(normalizedUV.y * 8.0 + time * 0.5 + combinedNoise * 2.0),
        cos(normalizedUV.x * 8.0 + time * 0.4 + combinedNoise * 2.0)
    ) * 0.03 * uniforms.uWaveIntensity;

    let swirlUV = normalizedUV + swirl;
    let swirlNoise = snoise(swirlUV * 4.0 + vec2<f32>(time * 0.2, 0.0));

    var colorMix = depth + swirlNoise * 0.2;
    colorMix = clamp(colorMix, 0.0, 1.0);

    var color: vec4<f32>;
    if (colorMix < 0.5) {
        color = mix(uniforms.uColorSurface, uniforms.uColorMid, colorMix * 2.0);
    } else {
        color = mix(uniforms.uColorMid, uniforms.uColorDeep, (colorMix - 0.5) * 2.0);
    }

    let surfaceDist = abs(normalizedUV.y - adjustedSurfaceY);
    var surfaceHighlight = smoothstep(0.05, 0.0, surfaceDist);
    surfaceHighlight *= 0.5 + 0.5 * sin(normalizedUV.x * 30.0 + time * 3.0);
    color = vec4<f32>(color.rgb + surfaceHighlight * 0.4 * uniforms.uColorSurface.rgb, color.a);

    let caustics = snoise(normalizedUV * 20.0 + vec2<f32>(time * 0.8, time * 0.6));
    let causticsVal = pow(max(0.0, caustics), 3.0) * 0.15;
    color = vec4<f32>(color.rgb + causticsVal * uniforms.uColorMid.rgb, color.a);

    let alpha = smoothstep(adjustedSurfaceY - 0.02, adjustedSurfaceY + 0.02, normalizedUV.y);
    let edgeDark = 1.0 - smoothstep(0.3, 0.5, abs(normalizedUV.x - 0.5) * 2.0) * 0.2;

    return vec4<f32>(color.rgb * edgeDark, alpha * color.a);
}
`

export interface AbyssFluidFilterOptions {
    colorDeep?: [number, number, number, number]
    colorMid?: [number, number, number, number]
    colorSurface?: [number, number, number, number]
    flowSpeed?: number
    waveIntensity?: number
    surfaceY?: number
    bloodLevel?: number
}

export class AbyssFluidFilter extends Filter {
    public uniforms: {
        uTime: number
        uDimensions: Float32Array
        uColorDeep: Float32Array
        uColorMid: Float32Array
        uColorSurface: Float32Array
        uFlowSpeed: number
        uWaveIntensity: number
        uSurfaceY: number
        uBloodLevel: number
    }

    constructor(options: AbyssFluidFilterOptions = {}) {
        const {
            // Default: cosmic purple palette
            colorDeep = [0.24, 0.10, 0.31, 1.0],    // #3d1a50 - Dark saturated purple
            colorMid = [0.36, 0.18, 0.46, 1.0],     // #5c2d75 - Medium purple
            colorSurface = [0.48, 0.25, 0.58, 1.0], // #7a4095 - Bright purple
            flowSpeed = 1.0,
            waveIntensity = 1.0,
            surfaceY = 0.2,    // Surface at 20% from top
            bloodLevel = 0.0,
        } = options

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'abyss-fluid-filter',
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
                abyssUniforms: {
                    uTime: { value: 0, type: 'f32' },
                    uDimensions: { value: new Float32Array([100, 100]), type: 'vec2<f32>' },
                    uColorDeep: { value: new Float32Array(colorDeep), type: 'vec4<f32>' },
                    uColorMid: { value: new Float32Array(colorMid), type: 'vec4<f32>' },
                    uColorSurface: { value: new Float32Array(colorSurface), type: 'vec4<f32>' },
                    uFlowSpeed: { value: flowSpeed, type: 'f32' },
                    uWaveIntensity: { value: waveIntensity, type: 'f32' },
                    uSurfaceY: { value: surfaceY, type: 'f32' },
                    uBloodLevel: { value: bloodLevel, type: 'f32' },
                },
            },
        })

        this.uniforms = this.resources.abyssUniforms.uniforms
    }

    get time(): number {
        return this.uniforms.uTime
    }

    set time(value: number) {
        this.uniforms.uTime = value
    }

    get bloodLevel(): number {
        return this.uniforms.uBloodLevel
    }

    set bloodLevel(value: number) {
        this.uniforms.uBloodLevel = value
        // Lerp colors based on blood level
        const t = value

        // Purple to blood red transition
        this.uniforms.uColorDeep[0] = 0.24 + (0.38 - 0.24) * t  // R
        this.uniforms.uColorDeep[1] = 0.10 + (0.06 - 0.10) * t  // G
        this.uniforms.uColorDeep[2] = 0.31 + (0.06 - 0.31) * t  // B

        this.uniforms.uColorMid[0] = 0.36 + (0.50 - 0.36) * t
        this.uniforms.uColorMid[1] = 0.18 + (0.13 - 0.18) * t
        this.uniforms.uColorMid[2] = 0.46 + (0.13 - 0.46) * t

        this.uniforms.uColorSurface[0] = 0.48 + (0.63 - 0.48) * t
        this.uniforms.uColorSurface[1] = 0.25 + (0.21 - 0.25) * t
        this.uniforms.uColorSurface[2] = 0.58 + (0.21 - 0.58) * t
    }

    get surfaceY(): number {
        return this.uniforms.uSurfaceY
    }

    set surfaceY(value: number) {
        this.uniforms.uSurfaceY = value
    }

    setDimensions(width: number, height: number): void {
        this.uniforms.uDimensions[0] = width
        this.uniforms.uDimensions[1] = height
    }
}
