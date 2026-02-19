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
uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;
uniform float uSpinSpeed;
uniform float uContrast;
uniform float uLighting;
uniform float uSpinAmount;
uniform float uPixelFilter;
uniform float uSpinEase;

// New pattern parameters
uniform float uPatternScale;
uniform float uWarpIntensity;
uniform float uSymmetry;
uniform float uFlowSpeed;
uniform float uVortexStrength;
uniform float uNoiseScale;
uniform float uRippleStrength;

// Simplex noise function
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
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
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

vec4 effect(vec2 screenSize, vec2 screen_coords) {
    float pixel_size = length(screenSize.xy) / uPixelFilter;
    vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy);
    float uv_len = length(uv);

    // Apply symmetry (kaleidoscope effect)
    if (uSymmetry > 1.0) {
        float angle = atan(uv.y, uv.x);
        float segment = PI * 2.0 / uSymmetry;
        angle = mod(angle, segment);
        if (angle > segment * 0.5) angle = segment - angle;
        uv = vec2(cos(angle), sin(angle)) * uv_len;
    }

    // Apply vortex effect
    float vortexAngle = uVortexStrength * uv_len * 5.0;
    mat2 vortexMat = mat2(cos(vortexAngle), -sin(vortexAngle), sin(vortexAngle), cos(vortexAngle));
    uv = vortexMat * uv;

    // Add ripple effect
    if (uRippleStrength > 0.0) {
        float ripple = sin(uv_len * 20.0 - uTime * uFlowSpeed * 2.0) * uRippleStrength * 0.02;
        uv += normalize(uv + 0.001) * ripple;
    }

    float speed = uTime * uSpinSpeed * 0.1;
    speed += 302.2;

    float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase * 20.0 * (uSpinAmount * uv_len + (1.0 - uSpinAmount));
    vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
    uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);

    uv *= 30.0 * uPatternScale;
    float baseSpeed = uTime * uSpinSpeed;
    float flowTime = uTime * uFlowSpeed;

    vec2 uv2 = vec2(uv.x + uv.y);

    // Add noise-based warping
    if (uNoiseScale > 0.0) {
        float noise1 = snoise(uv * uNoiseScale + flowTime * 0.5);
        float noise2 = snoise(uv * uNoiseScale * 1.5 - flowTime * 0.3);
        uv += vec2(noise1, noise2) * uWarpIntensity * 0.5;
    }

    for(int i = 0; i < 5; i++) {
        uv2 += sin(max(uv.x, uv.y)) + uv;
        uv += 0.5 * vec2(
            cos(5.1123314 + 0.353 * uv2.y + baseSpeed * 0.131121),
            sin(uv2.x - 0.113 * baseSpeed)
        );
        uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);

        // Additional warping based on intensity
        uv += uWarpIntensity * 0.1 * vec2(
            sin(uv.y * 2.0 + flowTime),
            cos(uv.x * 2.0 - flowTime)
        );
    }

    float contrast_mod = (0.25 * uContrast + 0.5 * uSpinAmount + 1.2);
    float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
    float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
    float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
    float c3p = 1.0 - min(1.0, c1p + c2p);
    float light = (uLighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + uLighting * max(c2p * 5.0 - 4.0, 0.0);

    return (0.3 / uContrast) * uColor1 + (1.0 - 0.3 / uContrast) * (uColor1 * c1p + uColor2 * c2p + vec4(c3p * uColor3.rgb, c3p * uColor1.a)) + light;
}

void main() {
    vec2 screen_coords = vTextureCoord * uDimensions;
    finalColor = effect(uDimensions, screen_coords);
}
`

// WebGPU shader (WGSL)
const source = `
struct BalatroUniforms {
    uTime: f32,
    uDimensions: vec2<f32>,
    uColor1: vec4<f32>,
    uColor2: vec4<f32>,
    uColor3: vec4<f32>,
    uSpinSpeed: f32,
    uContrast: f32,
    uLighting: f32,
    uSpinAmount: f32,
    uPixelFilter: f32,
    uSpinEase: f32,
    uPatternScale: f32,
    uWarpIntensity: f32,
    uSymmetry: f32,
    uFlowSpeed: f32,
    uVortexStrength: f32,
    uNoiseScale: f32,
    uRippleStrength: f32,
};

@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> uniforms: BalatroUniforms;

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
    let screenSize = uniforms.uDimensions;
    let screen_coords = uv * screenSize;

    let pixel_size = length(screenSize) / uniforms.uPixelFilter;
    var patternUv = (floor(screen_coords * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize) / length(screenSize);
    var uv_len = length(patternUv);

    // Apply symmetry
    if (uniforms.uSymmetry > 1.0) {
        var angle = atan2(patternUv.y, patternUv.x);
        let segment = 3.14159265359 * 2.0 / uniforms.uSymmetry;
        angle = angle % segment;
        if (angle > segment * 0.5) { angle = segment - angle; }
        patternUv = vec2<f32>(cos(angle), sin(angle)) * uv_len;
    }

    // Apply vortex
    let vortexAngle = uniforms.uVortexStrength * uv_len * 5.0;
    let cosV = cos(vortexAngle);
    let sinV = sin(vortexAngle);
    patternUv = vec2<f32>(patternUv.x * cosV - patternUv.y * sinV, patternUv.x * sinV + patternUv.y * cosV);

    // Ripple
    if (uniforms.uRippleStrength > 0.0) {
        let ripple = sin(uv_len * 20.0 - uniforms.uTime * uniforms.uFlowSpeed * 2.0) * uniforms.uRippleStrength * 0.02;
        patternUv += normalize(patternUv + 0.001) * ripple;
    }

    var speed = uniforms.uTime * uniforms.uSpinSpeed * 0.1;
    speed += 302.2;

    let new_pixel_angle = atan2(patternUv.y, patternUv.x) + speed - uniforms.uSpinEase * 20.0 * (uniforms.uSpinAmount * uv_len + (1.0 - uniforms.uSpinAmount));
    let mid = (screenSize / length(screenSize)) / 2.0;
    patternUv = vec2<f32>(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid;

    patternUv *= 30.0 * uniforms.uPatternScale;
    let baseSpeed = uniforms.uTime * uniforms.uSpinSpeed;
    let flowTime = uniforms.uTime * uniforms.uFlowSpeed;

    var uv2 = vec2<f32>(patternUv.x + patternUv.y, patternUv.x + patternUv.y);

    // Noise warping
    if (uniforms.uNoiseScale > 0.0) {
        let noise1 = snoise(patternUv * uniforms.uNoiseScale + flowTime * 0.5);
        let noise2 = snoise(patternUv * uniforms.uNoiseScale * 1.5 - flowTime * 0.3);
        patternUv += vec2<f32>(noise1, noise2) * uniforms.uWarpIntensity * 0.5;
    }

    for(var i: i32 = 0; i < 5; i++) {
        uv2 += sin(max(patternUv.x, patternUv.y)) + patternUv;
        patternUv += 0.5 * vec2<f32>(
            cos(5.1123314 + 0.353 * uv2.y + baseSpeed * 0.131121),
            sin(uv2.x - 0.113 * baseSpeed)
        );
        patternUv -= cos(patternUv.x + patternUv.y) - sin(patternUv.x * 0.711 - patternUv.y);
        patternUv += uniforms.uWarpIntensity * 0.1 * vec2<f32>(
            sin(patternUv.y * 2.0 + flowTime),
            cos(patternUv.x * 2.0 - flowTime)
        );
    }

    let contrast_mod = (0.25 * uniforms.uContrast + 0.5 * uniforms.uSpinAmount + 1.2);
    let paint_res = min(2.0, max(0.0, length(patternUv) * 0.035 * contrast_mod));
    let c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
    let c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
    let c3p = 1.0 - min(1.0, c1p + c2p);
    let light = (uniforms.uLighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + uniforms.uLighting * max(c2p * 5.0 - 4.0, 0.0);

    let color = (0.3 / uniforms.uContrast) * uniforms.uColor1 +
                (1.0 - 0.3 / uniforms.uContrast) * (uniforms.uColor1 * c1p + uniforms.uColor2 * c2p + vec4<f32>(c3p * uniforms.uColor3.rgb, c3p * uniforms.uColor1.a)) +
                vec4<f32>(light, light, light, 0.0);

    return color;
}
`

export interface BalatroFilterOptions {
    color1?: [number, number, number, number]
    color2?: [number, number, number, number]
    color3?: [number, number, number, number]
    spinSpeed?: number
    contrast?: number
    lighting?: number
    spinAmount?: number
    pixelFilter?: number
    spinEase?: number
    // New pattern options
    patternScale?: number
    warpIntensity?: number
    symmetry?: number
    flowSpeed?: number
    vortexStrength?: number
    noiseScale?: number
    rippleStrength?: number
}

export class BalatroFilter extends Filter {
    public uniforms: {
        uTime: number
        uDimensions: Float32Array
        uColor1: Float32Array
        uColor2: Float32Array
        uColor3: Float32Array
        uSpinSpeed: number
        uContrast: number
        uLighting: number
        uSpinAmount: number
        uPixelFilter: number
        uSpinEase: number
        uPatternScale: number
        uWarpIntensity: number
        uSymmetry: number
        uFlowSpeed: number
        uVortexStrength: number
        uNoiseScale: number
        uRippleStrength: number
    }

    constructor(options: BalatroFilterOptions = {}) {
        const {
            color1 = [0.87, 0.27, 0.23, 1.0], // #DE443B - Red
            color2 = [0.0, 0.42, 0.71, 1.0], // #006BB4 - Blue
            color3 = [0.09, 0.14, 0.15, 1.0], // #162325 - Dark
            spinSpeed = 7.0,
            contrast = 3.5,
            lighting = 0.4,
            spinAmount = 0.25,
            pixelFilter = 400.0,
            spinEase = 1.0,
            patternScale = 1.0,
            warpIntensity = 0.0,
            symmetry = 1.0,
            flowSpeed = 1.0,
            vortexStrength = 0.0,
            noiseScale = 0.0,
            rippleStrength = 0.0,
        } = options

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'balatro-filter',
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
                balatroUniforms: {
                    uTime: { value: 0, type: 'f32' },
                    uDimensions: { value: new Float32Array([100, 100]), type: 'vec2<f32>' },
                    uColor1: { value: new Float32Array(color1), type: 'vec4<f32>' },
                    uColor2: { value: new Float32Array(color2), type: 'vec4<f32>' },
                    uColor3: { value: new Float32Array(color3), type: 'vec4<f32>' },
                    uSpinSpeed: { value: spinSpeed, type: 'f32' },
                    uContrast: { value: contrast, type: 'f32' },
                    uLighting: { value: lighting, type: 'f32' },
                    uSpinAmount: { value: spinAmount, type: 'f32' },
                    uPixelFilter: { value: pixelFilter, type: 'f32' },
                    uSpinEase: { value: spinEase, type: 'f32' },
                    uPatternScale: { value: patternScale, type: 'f32' },
                    uWarpIntensity: { value: warpIntensity, type: 'f32' },
                    uSymmetry: { value: symmetry, type: 'f32' },
                    uFlowSpeed: { value: flowSpeed, type: 'f32' },
                    uVortexStrength: { value: vortexStrength, type: 'f32' },
                    uNoiseScale: { value: noiseScale, type: 'f32' },
                    uRippleStrength: { value: rippleStrength, type: 'f32' },
                },
            },
        })

        this.uniforms = this.resources.balatroUniforms.uniforms
    }

    get time(): number {
        return this.uniforms.uTime
    }

    set time(value: number) {
        this.uniforms.uTime = value
    }

    setDimensions(width: number, height: number): void {
        this.uniforms.uDimensions[0] = width
        this.uniforms.uDimensions[1] = height
    }
}
