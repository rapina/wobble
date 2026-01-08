import { Filter, GlProgram, GpuProgram } from 'pixi.js';

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
`;

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

vec4 effect(vec2 screenSize, vec2 screen_coords) {
    float pixel_size = length(screenSize.xy) / uPixelFilter;
    vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy);
    float uv_len = length(uv);

    float speed = uTime * uSpinSpeed * 0.1;
    speed += 302.2;

    float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase * 20.0 * (uSpinAmount * uv_len + (1.0 - uSpinAmount));
    vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
    uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);

    uv *= 30.0;
    float baseSpeed = uTime * uSpinSpeed;

    vec2 uv2 = vec2(uv.x + uv.y);

    for(int i = 0; i < 5; i++) {
        uv2 += sin(max(uv.x, uv.y)) + uv;
        uv += 0.5 * vec2(
            cos(5.1123314 + 0.353 * uv2.y + baseSpeed * 0.131121),
            sin(uv2.x - 0.113 * baseSpeed)
        );
        uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
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
`;

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
};

@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> uniforms: BalatroUniforms;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let screenSize = uniforms.uDimensions;
    let screen_coords = uv * screenSize;

    let pixel_size = length(screenSize) / uniforms.uPixelFilter;
    var patternUv = (floor(screen_coords * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize) / length(screenSize);
    let uv_len = length(patternUv);

    var speed = uniforms.uTime * uniforms.uSpinSpeed * 0.1;
    speed += 302.2;

    let new_pixel_angle = atan2(patternUv.y, patternUv.x) + speed - uniforms.uSpinEase * 20.0 * (uniforms.uSpinAmount * uv_len + (1.0 - uniforms.uSpinAmount));
    let mid = (screenSize / length(screenSize)) / 2.0;
    patternUv = vec2<f32>(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid;

    patternUv *= 30.0;
    let baseSpeed = uniforms.uTime * uniforms.uSpinSpeed;

    var uv2 = vec2<f32>(patternUv.x + patternUv.y, patternUv.x + patternUv.y);

    for(var i: i32 = 0; i < 5; i++) {
        uv2 += sin(max(patternUv.x, patternUv.y)) + patternUv;
        patternUv += 0.5 * vec2<f32>(
            cos(5.1123314 + 0.353 * uv2.y + baseSpeed * 0.131121),
            sin(uv2.x - 0.113 * baseSpeed)
        );
        patternUv -= cos(patternUv.x + patternUv.y) - sin(patternUv.x * 0.711 - patternUv.y);
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
`;

export interface BalatroFilterOptions {
    color1?: [number, number, number, number];
    color2?: [number, number, number, number];
    color3?: [number, number, number, number];
    spinSpeed?: number;
    contrast?: number;
    lighting?: number;
    spinAmount?: number;
    pixelFilter?: number;
    spinEase?: number;
}

export class BalatroFilter extends Filter {
    public uniforms: {
        uTime: number;
        uDimensions: Float32Array;
        uColor1: Float32Array;
        uColor2: Float32Array;
        uColor3: Float32Array;
        uSpinSpeed: number;
        uContrast: number;
        uLighting: number;
        uSpinAmount: number;
        uPixelFilter: number;
        uSpinEase: number;
    };

    constructor(options: BalatroFilterOptions = {}) {
        const {
            color1 = [0.87, 0.27, 0.23, 1.0],  // #DE443B - Red
            color2 = [0.0, 0.42, 0.71, 1.0],   // #006BB4 - Blue
            color3 = [0.09, 0.14, 0.15, 1.0],  // #162325 - Dark
            spinSpeed = 7.0,
            contrast = 3.5,
            lighting = 0.4,
            spinAmount = 0.25,
            pixelFilter = 400.0,
            spinEase = 1.0,
        } = options;

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'balatro-filter',
        });

        let gpuProgram: GpuProgram | undefined;
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
            });
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
                },
            },
        });

        this.uniforms = this.resources.balatroUniforms.uniforms;
    }

    get time(): number {
        return this.uniforms.uTime;
    }

    set time(value: number) {
        this.uniforms.uTime = value;
    }

    setDimensions(width: number, height: number): void {
        this.uniforms.uDimensions[0] = width;
        this.uniforms.uDimensions[1] = height;
    }
}
