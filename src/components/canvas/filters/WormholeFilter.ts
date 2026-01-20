/**
 * WormholeFilter.ts - Swirling vortex effect for wormhole portals
 * Creates a dimensional distortion effect with chromatic aberration
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
uniform vec2 uCenter;         // Center of vortex (0-1 normalized)
uniform float uIntensity;     // Distortion intensity
uniform float uRotation;      // Rotation speed
uniform vec4 uColorInner;     // Inner vortex color
uniform vec4 uColorOuter;     // Outer vortex color
uniform float uChromaticAberration;  // RGB separation amount

// Simplex noise for organic distortion
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

    // Vector from center
    vec2 toCenter = uCenter - uv;
    float distToCenter = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x);

    // Vortex distortion (stronger closer to center)
    float vortexStrength = 1.0 - smoothstep(0.0, 0.5, distToCenter);
    vortexStrength = pow(vortexStrength, 2.0);

    // Add noise for organic movement
    float noise = snoise(uv * 8.0 + vec2(uTime * 0.5, uTime * 0.3));

    // Spiral distortion
    float spiralRotation = uTime * uRotation + vortexStrength * 3.0 + noise * 0.5;
    angle += spiralRotation * vortexStrength * uIntensity;

    // Pull towards center (sucking effect)
    float pull = vortexStrength * uIntensity * 0.15;
    distToCenter -= pull;
    distToCenter = max(0.0, distToCenter);

    // Reconstruct UV with distortion
    vec2 distortedUV = uCenter - vec2(cos(angle), sin(angle)) * distToCenter;

    // Chromatic aberration (RGB split)
    float aberration = uChromaticAberration * vortexStrength;
    vec2 rOffset = distortedUV + toCenter * aberration * 0.02;
    vec2 gOffset = distortedUV;
    vec2 bOffset = distortedUV - toCenter * aberration * 0.02;

    float r = texture(uTexture, rOffset).r;
    float g = texture(uTexture, gOffset).g;
    float b = texture(uTexture, bOffset).b;
    vec4 color = vec4(r, g, b, 1.0);

    // Add vortex glow color
    float glowStrength = vortexStrength * (0.5 + 0.5 * sin(uTime * 2.0 + distToCenter * 10.0));
    vec4 glowColor = mix(uColorOuter, uColorInner, vortexStrength);
    color = mix(color, glowColor, glowStrength * 0.4);

    // Darken edges
    float edgeDarken = smoothstep(0.5, 0.0, distToCenter);
    color.rgb *= 1.0 - edgeDarken * 0.5;

    // Animated rings (dimensional rifts)
    float ringPattern = sin(distToCenter * 30.0 - uTime * 4.0);
    ringPattern = smoothstep(0.7, 1.0, ringPattern);
    color.rgb += ringPattern * glowColor.rgb * 0.3 * vortexStrength;

    finalColor = color;
}
`

// WebGPU shader (WGSL)
const source = `
struct WormholeUniforms {
    uTime: f32,
    uCenter: vec2<f32>,
    uIntensity: f32,
    uRotation: f32,
    uColorInner: vec4<f32>,
    uColorOuter: vec4<f32>,
    uChromaticAberration: f32,
};

@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> uniforms: WormholeUniforms;

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
    let toCenter = uniforms.uCenter - uv;
    let distToCenter = length(toCenter);
    var angle = atan2(toCenter.y, toCenter.x);

    var vortexStrength = 1.0 - smoothstep(0.0, 0.5, distToCenter);
    vortexStrength = pow(vortexStrength, 2.0);

    let noise = snoise(uv * 8.0 + vec2<f32>(uniforms.uTime * 0.5, uniforms.uTime * 0.3));

    let spiralRotation = uniforms.uTime * uniforms.uRotation + vortexStrength * 3.0 + noise * 0.5;
    angle += spiralRotation * vortexStrength * uniforms.uIntensity;

    let pull = vortexStrength * uniforms.uIntensity * 0.15;
    var distToCenterAdjusted = distToCenter - pull;
    distToCenterAdjusted = max(0.0, distToCenterAdjusted);

    let distortedUV = uniforms.uCenter - vec2<f32>(cos(angle), sin(angle)) * distToCenterAdjusted;

    let aberration = uniforms.uChromaticAberration * vortexStrength;
    let rOffset = distortedUV + toCenter * aberration * 0.02;
    let gOffset = distortedUV;
    let bOffset = distortedUV - toCenter * aberration * 0.02;

    let r = textureSample(uTexture, uSampler, rOffset).r;
    let g = textureSample(uTexture, uSampler, gOffset).g;
    let b = textureSample(uTexture, uSampler, bOffset).b;
    var color = vec4<f32>(r, g, b, 1.0);

    let glowStrength = vortexStrength * (0.5 + 0.5 * sin(uniforms.uTime * 2.0 + distToCenter * 10.0));
    let glowColor = mix(uniforms.uColorOuter, uniforms.uColorInner, vortexStrength);
    color = mix(color, glowColor, glowStrength * 0.4);

    let edgeDarken = smoothstep(0.5, 0.0, distToCenter);
    color = vec4<f32>(color.rgb * (1.0 - edgeDarken * 0.5), color.a);

    let ringPattern = sin(distToCenter * 30.0 - uniforms.uTime * 4.0);
    let ringPatternSmooth = smoothstep(0.7, 1.0, ringPattern);
    color = vec4<f32>(color.rgb + ringPatternSmooth * glowColor.rgb * 0.3 * vortexStrength, color.a);

    return color;
}
`

export interface WormholeFilterOptions {
    center?: [number, number]
    intensity?: number
    rotation?: number
    colorInner?: [number, number, number, number]
    colorOuter?: [number, number, number, number]
    chromaticAberration?: number
}

export class WormholeFilter extends Filter {
    public uniforms: {
        uTime: number
        uCenter: Float32Array
        uIntensity: number
        uRotation: number
        uColorInner: Float32Array
        uColorOuter: Float32Array
        uChromaticAberration: number
    }

    constructor(options: WormholeFilterOptions = {}) {
        const {
            center = [0.5, 0.5],
            intensity = 1.0,
            rotation = 1.0,
            // Lovecraftian purple/teal colors
            colorInner = [0.4, 0.1, 0.6, 1.0],  // Deep purple
            colorOuter = [0.2, 0.5, 0.6, 1.0],  // Teal
            chromaticAberration = 1.0,
        } = options

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'wormhole-filter',
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
                wormholeUniforms: {
                    uTime: { value: 0, type: 'f32' },
                    uCenter: { value: new Float32Array(center), type: 'vec2<f32>' },
                    uIntensity: { value: intensity, type: 'f32' },
                    uRotation: { value: rotation, type: 'f32' },
                    uColorInner: { value: new Float32Array(colorInner), type: 'vec4<f32>' },
                    uColorOuter: { value: new Float32Array(colorOuter), type: 'vec4<f32>' },
                    uChromaticAberration: { value: chromaticAberration, type: 'f32' },
                },
            },
        })

        this.uniforms = this.resources.wormholeUniforms.uniforms
    }

    get time(): number {
        return this.uniforms.uTime
    }

    set time(value: number) {
        this.uniforms.uTime = value
    }

    setCenter(x: number, y: number): void {
        this.uniforms.uCenter[0] = x
        this.uniforms.uCenter[1] = y
    }

    setColors(inner: [number, number, number, number], outer: [number, number, number, number]): void {
        this.uniforms.uColorInner.set(inner)
        this.uniforms.uColorOuter.set(outer)
    }
}
