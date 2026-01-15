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

in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uDimensions;
uniform float uScanlineIntensity;
uniform float uChromaticAberration;
uniform float uCurvatureStrength;
uniform float uVignetteStrength;
uniform float uFlickerIntensity;

// Apply barrel distortion (CRT screen curvature)
vec2 curveUV(vec2 uv, float strength) {
    vec2 centered = uv * 2.0 - 1.0;
    float dist = dot(centered, centered);
    centered *= 1.0 + dist * strength;
    return centered * 0.5 + 0.5;
}

void main() {
    // Apply subtle screen curvature
    vec2 uv = curveUV(vTextureCoord, uCurvatureStrength);

    // Check if UV is out of bounds after curvature
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        finalColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Chromatic aberration (RGB channel separation)
    float aberration = uChromaticAberration / uDimensions.x;
    float r = texture(uTexture, uv + vec2(aberration, 0.0)).r;
    float g = texture(uTexture, uv).g;
    float b = texture(uTexture, uv - vec2(aberration, 0.0)).b;
    vec3 color = vec3(r, g, b);

    // Scanlines
    float scanline = sin(uv.y * uDimensions.y * 3.14159265) * 0.5 + 0.5;
    scanline = pow(scanline, 1.5); // Sharpen scanlines slightly
    color *= 1.0 - uScanlineIntensity * (1.0 - scanline);

    // Subtle brightness flicker (simulates CRT refresh)
    float flicker = 1.0 + sin(uTime * 60.0) * uFlickerIntensity;
    color *= flicker;

    // Vignette (darken edges)
    vec2 vignetteUV = uv * (1.0 - uv);
    float vignette = vignetteUV.x * vignetteUV.y * 15.0;
    vignette = pow(vignette, uVignetteStrength);
    color *= vignette;

    // Slight color bleeding / glow on bright areas
    vec3 bloom = color * color * 0.1;
    color += bloom;

    finalColor = vec4(color, 1.0);
}
`

// WebGPU shader (WGSL)
const source = `
struct CRTUniforms {
    uTime: f32,
    uDimensions: vec2<f32>,
    uScanlineIntensity: f32,
    uChromaticAberration: f32,
    uCurvatureStrength: f32,
    uVignetteStrength: f32,
    uFlickerIntensity: f32,
};

@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> uniforms: CRTUniforms;

fn curveUV(uv: vec2<f32>, strength: f32) -> vec2<f32> {
    var centered = uv * 2.0 - 1.0;
    let dist = dot(centered, centered);
    centered *= 1.0 + dist * strength;
    return centered * 0.5 + 0.5;
}

@fragment
fn main(@location(0) vTextureCoord: vec2<f32>) -> @location(0) vec4<f32> {
    // Apply subtle screen curvature
    let uv = curveUV(vTextureCoord, uniforms.uCurvatureStrength);

    // Check if UV is out of bounds after curvature
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }

    // Chromatic aberration (RGB channel separation)
    let aberration = uniforms.uChromaticAberration / uniforms.uDimensions.x;
    let r = textureSample(uTexture, uSampler, uv + vec2<f32>(aberration, 0.0)).r;
    let g = textureSample(uTexture, uSampler, uv).g;
    let b = textureSample(uTexture, uSampler, uv - vec2<f32>(aberration, 0.0)).b;
    var color = vec3<f32>(r, g, b);

    // Scanlines
    var scanline = sin(uv.y * uniforms.uDimensions.y * 3.14159265) * 0.5 + 0.5;
    scanline = pow(scanline, 1.5);
    color *= 1.0 - uniforms.uScanlineIntensity * (1.0 - scanline);

    // Subtle brightness flicker
    let flicker = 1.0 + sin(uniforms.uTime * 60.0) * uniforms.uFlickerIntensity;
    color *= flicker;

    // Vignette
    let vignetteUV = uv * (1.0 - uv);
    var vignette = vignetteUV.x * vignetteUV.y * 15.0;
    vignette = pow(vignette, uniforms.uVignetteStrength);
    color *= vignette;

    // Bloom
    let bloom = color * color * 0.1;
    color += bloom;

    return vec4<f32>(color, 1.0);
}
`

export interface CRTFilterOptions {
    scanlineIntensity?: number
    chromaticAberration?: number
    curvatureStrength?: number
    vignetteStrength?: number
    flickerIntensity?: number
}

export class CRTFilter extends Filter {
    public uniforms: {
        uTime: number
        uDimensions: Float32Array
        uScanlineIntensity: number
        uChromaticAberration: number
        uCurvatureStrength: number
        uVignetteStrength: number
        uFlickerIntensity: number
    }

    constructor(options: CRTFilterOptions = {}) {
        const {
            scanlineIntensity = 0.03, // Reduced from 0.08
            chromaticAberration = 0.15,
            curvatureStrength = 0.01,
            vignetteStrength = 0.2,
            flickerIntensity = 0.003,
        } = options

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'crt-filter',
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
                crtUniforms: {
                    uTime: { value: 0, type: 'f32' },
                    uDimensions: { value: new Float32Array([100, 100]), type: 'vec2<f32>' },
                    uScanlineIntensity: { value: scanlineIntensity, type: 'f32' },
                    uChromaticAberration: { value: chromaticAberration, type: 'f32' },
                    uCurvatureStrength: { value: curvatureStrength, type: 'f32' },
                    uVignetteStrength: { value: vignetteStrength, type: 'f32' },
                    uFlickerIntensity: { value: flickerIntensity, type: 'f32' },
                },
            },
        })

        this.uniforms = this.resources.crtUniforms.uniforms
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

    get scanlineIntensity(): number {
        return this.uniforms.uScanlineIntensity
    }

    set scanlineIntensity(value: number) {
        this.uniforms.uScanlineIntensity = value
    }

    get chromaticAberration(): number {
        return this.uniforms.uChromaticAberration
    }

    set chromaticAberration(value: number) {
        this.uniforms.uChromaticAberration = value
    }

    get curvatureStrength(): number {
        return this.uniforms.uCurvatureStrength
    }

    set curvatureStrength(value: number) {
        this.uniforms.uCurvatureStrength = value
    }

    get vignetteStrength(): number {
        return this.uniforms.uVignetteStrength
    }

    set vignetteStrength(value: number) {
        this.uniforms.uVignetteStrength = value
    }

    get flickerIntensity(): number {
        return this.uniforms.uFlickerIntensity
    }

    set flickerIntensity(value: number) {
        this.uniforms.uFlickerIntensity = value
    }

    // Preset for minimal effect (barely noticeable)
    static subtle(): CRTFilter {
        return new CRTFilter({
            scanlineIntensity: 0.015, // Reduced from 0.04
            chromaticAberration: 0.08,
            curvatureStrength: 0.005,
            vignetteStrength: 0.12,
            flickerIntensity: 0.002,
        })
    }

    // Preset for light effect (noticeable but not distracting)
    static light(): CRTFilter {
        return new CRTFilter({
            scanlineIntensity: 0.03, // Reduced from 0.08
            chromaticAberration: 0.15,
            curvatureStrength: 0.01,
            vignetteStrength: 0.2,
            flickerIntensity: 0.003,
        })
    }

    // Preset for medium effect
    static medium(): CRTFilter {
        return new CRTFilter({
            scanlineIntensity: 0.06, // Reduced from 0.15
            chromaticAberration: 0.3,
            curvatureStrength: 0.02,
            vignetteStrength: 0.3,
            flickerIntensity: 0.008,
        })
    }

    // Preset for heavy retro effect
    static heavy(): CRTFilter {
        return new CRTFilter({
            scanlineIntensity: 0.12, // Reduced from 0.3
            chromaticAberration: 0.6,
            curvatureStrength: 0.04,
            vignetteStrength: 0.45,
            flickerIntensity: 0.02,
        })
    }
}
