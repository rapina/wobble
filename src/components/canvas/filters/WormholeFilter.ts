/**
 * WormholeFilter.ts - Procedural swirling vortex effect for wormhole portals
 * Creates a dimensional distortion effect entirely in the shader (no texture sampling needed)
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

uniform float uTime;
uniform vec2 uCenter;         // Center of vortex (0-1 normalized)
uniform float uIntensity;     // Effect intensity
uniform float uRotation;      // Rotation speed
uniform vec4 uColorInner;     // Inner vortex color
uniform vec4 uColorOuter;     // Outer vortex color

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

    // Circular mask - fade out at edges
    float circleMask = 1.0 - smoothstep(0.3, 0.5, distToCenter);

    // Early discard for fully transparent pixels (optimization)
    if (circleMask < 0.01) {
        finalColor = vec4(0.0);
        return;
    }

    // Vortex strength (stronger closer to center)
    float vortexStrength = 1.0 - smoothstep(0.0, 0.4, distToCenter);
    vortexStrength = pow(vortexStrength, 1.5);

    // Add noise for organic movement
    float noise = snoise(uv * 6.0 + vec2(uTime * 0.3, uTime * 0.2)) * 0.5;
    float noise2 = snoise(uv * 12.0 - vec2(uTime * 0.4, uTime * 0.5)) * 0.3;

    // Spiral pattern
    float spiralAngle = angle + uTime * uRotation + distToCenter * 8.0 * uIntensity;
    float spiral = sin(spiralAngle * 4.0 + noise * 2.0) * 0.5 + 0.5;
    spiral = pow(spiral, 2.0);

    // Animated rings
    float ringPattern = sin(distToCenter * 25.0 - uTime * 3.0 + noise2);
    ringPattern = smoothstep(0.6, 1.0, ringPattern) * 0.5;

    // Color mixing
    vec4 baseColor = mix(uColorOuter, uColorInner, vortexStrength);

    // Add spiral brightness variation
    baseColor.rgb *= 0.7 + spiral * 0.5 * vortexStrength;

    // Add ring highlights
    baseColor.rgb += ringPattern * uColorInner.rgb * vortexStrength * 0.4;

    // Soft glow in center
    float centerGlow = exp(-distToCenter * 6.0) * 0.6;
    baseColor.rgb += uColorInner.rgb * centerGlow;

    // Edge glow effect
    float edgeGlow = smoothstep(0.5, 0.35, distToCenter) * smoothstep(0.15, 0.3, distToCenter);
    baseColor.rgb += uColorOuter.rgb * edgeGlow * 0.3;

    // Pulsing effect
    float pulse = 0.9 + sin(uTime * 2.0) * 0.1;
    baseColor.rgb *= pulse;

    // Calculate final alpha with smooth circular falloff
    float alpha = circleMask;
    alpha *= 0.85 + vortexStrength * 0.15;

    finalColor = vec4(baseColor.rgb, alpha);
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

    // Circular mask - fade out at edges
    let circleMask = 1.0 - smoothstep(0.3, 0.5, distToCenter);

    if (circleMask < 0.01) {
        return vec4<f32>(0.0);
    }

    // Vortex strength
    var vortexStrength = 1.0 - smoothstep(0.0, 0.4, distToCenter);
    vortexStrength = pow(vortexStrength, 1.5);

    // Noise
    let noise = snoise(uv * 6.0 + vec2<f32>(uniforms.uTime * 0.3, uniforms.uTime * 0.2)) * 0.5;
    let noise2 = snoise(uv * 12.0 - vec2<f32>(uniforms.uTime * 0.4, uniforms.uTime * 0.5)) * 0.3;

    // Spiral pattern
    let spiralAngle = angle + uniforms.uTime * uniforms.uRotation + distToCenter * 8.0 * uniforms.uIntensity;
    var spiral = sin(spiralAngle * 4.0 + noise * 2.0) * 0.5 + 0.5;
    spiral = pow(spiral, 2.0);

    // Rings
    let ringPattern = sin(distToCenter * 25.0 - uniforms.uTime * 3.0 + noise2);
    let rings = smoothstep(0.6, 1.0, ringPattern) * 0.5;

    // Color mixing
    var baseColor = mix(uniforms.uColorOuter, uniforms.uColorInner, vortexStrength);
    baseColor = vec4<f32>(baseColor.rgb * (0.7 + spiral * 0.5 * vortexStrength), baseColor.a);
    baseColor = vec4<f32>(baseColor.rgb + rings * uniforms.uColorInner.rgb * vortexStrength * 0.4, baseColor.a);

    // Center glow
    let centerGlow = exp(-distToCenter * 6.0) * 0.6;
    baseColor = vec4<f32>(baseColor.rgb + uniforms.uColorInner.rgb * centerGlow, baseColor.a);

    // Edge glow
    let edgeGlow = smoothstep(0.5, 0.35, distToCenter) * smoothstep(0.15, 0.3, distToCenter);
    baseColor = vec4<f32>(baseColor.rgb + uniforms.uColorOuter.rgb * edgeGlow * 0.3, baseColor.a);

    // Pulse
    let pulse = 0.9 + sin(uniforms.uTime * 2.0) * 0.1;
    baseColor = vec4<f32>(baseColor.rgb * pulse, baseColor.a);

    // Alpha
    var alpha = circleMask;
    alpha = alpha * (0.85 + vortexStrength * 0.15);

    return vec4<f32>(baseColor.rgb, alpha);
}
`

export interface WormholeFilterOptions {
    center?: [number, number]
    intensity?: number
    rotation?: number
    colorInner?: [number, number, number, number]
    colorOuter?: [number, number, number, number]
}

export class WormholeFilter extends Filter {
    public uniforms: {
        uTime: number
        uCenter: Float32Array
        uIntensity: number
        uRotation: number
        uColorInner: Float32Array
        uColorOuter: Float32Array
    }

    constructor(options: WormholeFilterOptions = {}) {
        const {
            center = [0.5, 0.5],
            intensity = 1.0,
            rotation = 1.0,
            // Abyss purple/teal colors
            colorInner = [0.3, 0.8, 0.77, 1.0],  // Teal
            colorOuter = [0.24, 0.10, 0.31, 1.0],  // Deep purple
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
