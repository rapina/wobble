import { Renderer, Program, Mesh, Triangle } from 'ogl'
import { useEffect, useRef, useMemo, memo } from 'react'

interface BalatroProps {
    spinRotation?: number
    spinSpeed?: number
    offsetX?: number
    offsetY?: number
    color1?: string
    color2?: string
    color3?: string
    contrast?: number
    lighting?: number
    spinAmount?: number
    pixelFilter?: number
    spinEase?: number
    isRotate?: boolean
    mouseInteraction?: boolean
    // New pattern parameters
    patternScale?: number
    warpIntensity?: number
    symmetry?: number
    flowSpeed?: number
    vortexStrength?: number
    noiseScale?: number
    rippleStrength?: number
}

function hexToVec4(hex: string): [number, number, number, number] {
    let hexStr = hex.replace('#', '')
    let r = 0,
        g = 0,
        b = 0,
        a = 1
    if (hexStr.length === 6) {
        r = parseInt(hexStr.slice(0, 2), 16) / 255
        g = parseInt(hexStr.slice(2, 4), 16) / 255
        b = parseInt(hexStr.slice(4, 6), 16) / 255
    } else if (hexStr.length === 8) {
        r = parseInt(hexStr.slice(0, 2), 16) / 255
        g = parseInt(hexStr.slice(2, 4), 16) / 255
        b = parseInt(hexStr.slice(4, 6), 16) / 255
        a = parseInt(hexStr.slice(6, 8), 16) / 255
    }
    return [r, g, b, a]
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`

const fragmentShader = `
precision highp float;

#define PI 3.14159265359

uniform float iTime;
uniform vec3 iResolution;
uniform float uSpinRotation;
uniform float uSpinSpeed;
uniform vec2 uOffset;
uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;
uniform float uContrast;
uniform float uLighting;
uniform float uSpinAmount;
uniform float uPixelFilter;
uniform float uSpinEase;
uniform bool uIsRotate;
uniform vec2 uMouse;

// New pattern uniforms
uniform float uPatternScale;
uniform float uWarpIntensity;
uniform float uSymmetry;
uniform float uFlowSpeed;
uniform float uVortexStrength;
uniform float uNoiseScale;
uniform float uRippleStrength;

varying vec2 vUv;

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
    vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy) - uOffset;
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
    float flowTime = iTime * uFlowSpeed;
    if (uRippleStrength > 0.0) {
        float ripple = sin(uv_len * 20.0 - flowTime * 2.0) * uRippleStrength * 0.02;
        uv += normalize(uv + 0.001) * ripple;
    }

    float speed = (uSpinRotation * uSpinEase * 0.2);
    if(uIsRotate){
       speed = iTime * speed;
    }
    speed += 302.2;

    float mouseInfluence = (uMouse.x * 2.0 - 1.0);
    speed += mouseInfluence * 0.1;

    float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase * 20.0 * (uSpinAmount * uv_len + (1.0 - uSpinAmount));
    vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
    uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);

    uv *= 30.0 * uPatternScale;
    float baseSpeed = iTime * uSpinSpeed;
    speed = baseSpeed + mouseInfluence * 2.0;

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
            cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121),
            sin(uv2.x - 0.113 * speed)
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
    vec2 uv = vUv * iResolution.xy;
    gl_FragColor = effect(iResolution.xy, uv);
}
`

function Balatro({
    spinRotation = -2.0,
    spinSpeed = 7.0,
    offsetX = 0.0,
    offsetY = 0.0,
    color1 = '#DE443B',
    color2 = '#006BB4',
    color3 = '#162325',
    contrast = 3.5,
    lighting = 0.4,
    spinAmount = 0.25,
    pixelFilter = 745.0,
    spinEase = 1.0,
    isRotate = false,
    mouseInteraction = true,
    patternScale = 1.0,
    warpIntensity = 0.0,
    symmetry = 1.0,
    flowSpeed = 1.0,
    vortexStrength = 0.0,
    noiseScale = 0.0,
    rippleStrength = 0.0,
}: BalatroProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const programRef = useRef<Program | null>(null)

    // Memoize color conversions
    const color1Vec = useMemo(() => hexToVec4(color1), [color1])
    const color2Vec = useMemo(() => hexToVec4(color2), [color2])
    const color3Vec = useMemo(() => hexToVec4(color3), [color3])

    // Initialize WebGL only once
    useEffect(() => {
        if (!containerRef.current) return
        const container = containerRef.current
        const renderer = new Renderer()
        const gl = renderer.gl
        gl.clearColor(0, 0, 0, 1)

        function resize() {
            renderer.setSize(container.offsetWidth, container.offsetHeight)
            if (programRef.current) {
                programRef.current.uniforms.iResolution.value = [
                    gl.canvas.width,
                    gl.canvas.height,
                    gl.canvas.width / gl.canvas.height,
                ]
            }
        }
        window.addEventListener('resize', resize)
        resize()

        const geometry = new Triangle(gl)
        const program = new Program(gl, {
            vertex: vertexShader,
            fragment: fragmentShader,
            uniforms: {
                iTime: { value: 0 },
                iResolution: {
                    value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height],
                },
                uSpinRotation: { value: spinRotation },
                uSpinSpeed: { value: spinSpeed },
                uOffset: { value: [offsetX, offsetY] },
                uColor1: { value: color1Vec },
                uColor2: { value: color2Vec },
                uColor3: { value: color3Vec },
                uContrast: { value: contrast },
                uLighting: { value: lighting },
                uSpinAmount: { value: spinAmount },
                uPixelFilter: { value: pixelFilter },
                uSpinEase: { value: spinEase },
                uIsRotate: { value: isRotate },
                uMouse: { value: [0.5, 0.5] },
                // New pattern uniforms
                uPatternScale: { value: patternScale },
                uWarpIntensity: { value: warpIntensity },
                uSymmetry: { value: symmetry },
                uFlowSpeed: { value: flowSpeed },
                uVortexStrength: { value: vortexStrength },
                uNoiseScale: { value: noiseScale },
                uRippleStrength: { value: rippleStrength },
            },
        })
        programRef.current = program

        const mesh = new Mesh(gl, { geometry, program })
        let animationFrameId: number

        function update(time: number) {
            animationFrameId = requestAnimationFrame(update)
            // 시간 값을 주기적으로 리셋하여 부동소수점 정밀도 유지 (약 628초 주기)
            program.uniforms.iTime.value = (time * 0.001) % (Math.PI * 200)
            renderer.render({ scene: mesh })
        }
        animationFrameId = requestAnimationFrame(update)
        container.appendChild(gl.canvas)

        function handleMouseMove(e: MouseEvent) {
            if (!mouseInteraction) return
            const rect = container.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width
            const y = 1.0 - (e.clientY - rect.top) / rect.height
            program.uniforms.uMouse.value = [x, y]
        }
        if (mouseInteraction) {
            container.addEventListener('mousemove', handleMouseMove)
        }

        return () => {
            programRef.current = null
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener('resize', resize)
            if (mouseInteraction) {
                container.removeEventListener('mousemove', handleMouseMove)
            }
            container.removeChild(gl.canvas)
            gl.getExtension('WEBGL_lose_context')?.loseContext()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mouseInteraction]) // mouseInteraction 변경 시 재초기화

    // Update uniforms when props change (without recreating WebGL context)
    useEffect(() => {
        if (!programRef.current) return
        const program = programRef.current
        program.uniforms.uSpinRotation.value = spinRotation
        program.uniforms.uSpinSpeed.value = spinSpeed
        program.uniforms.uOffset.value = [offsetX, offsetY]
        program.uniforms.uColor1.value = color1Vec
        program.uniforms.uColor2.value = color2Vec
        program.uniforms.uColor3.value = color3Vec
        program.uniforms.uContrast.value = contrast
        program.uniforms.uLighting.value = lighting
        program.uniforms.uSpinAmount.value = spinAmount
        program.uniforms.uPixelFilter.value = pixelFilter
        program.uniforms.uSpinEase.value = spinEase
        program.uniforms.uIsRotate.value = isRotate
        // New pattern uniforms
        program.uniforms.uPatternScale.value = patternScale
        program.uniforms.uWarpIntensity.value = warpIntensity
        program.uniforms.uSymmetry.value = symmetry
        program.uniforms.uFlowSpeed.value = flowSpeed
        program.uniforms.uVortexStrength.value = vortexStrength
        program.uniforms.uNoiseScale.value = noiseScale
        program.uniforms.uRippleStrength.value = rippleStrength
    }, [
        spinRotation,
        spinSpeed,
        offsetX,
        offsetY,
        color1Vec,
        color2Vec,
        color3Vec,
        contrast,
        lighting,
        spinAmount,
        pixelFilter,
        spinEase,
        isRotate,
        patternScale,
        warpIntensity,
        symmetry,
        flowSpeed,
        vortexStrength,
        noiseScale,
        rippleStrength,
    ])

    return <div ref={containerRef} className="w-full h-full" />
}

export default memo(Balatro)
