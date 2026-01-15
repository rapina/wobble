import { Filter, GlProgram } from 'pixi.js'

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void) {
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
uniform float uWobbleIntensity;
uniform float uWobbleSpeed;
uniform float uEnergyPulse;
uniform float uDistortionStrength;
uniform float uNoiseAmount;
uniform float uVignetteStrength;
uniform float uColorShift;

// Stage-specific effects
uniform int uStageMode; // 0=normal, 1=gravity, 2=elastic, 3=momentum, 4=vortex
uniform float uQuantumWave;
uniform float uParticleField;
uniform float uProbabilityCloud;
uniform vec3 uStageTint;

// World coordinates for camera-relative effects
uniform vec2 uCameraPos;
uniform float uWorldScale; // pixels per unit

// ==================== UTILITY FUNCTIONS ====================

#define PI 3.14159265359
#define TAU 6.28318530718

// Convert screen UV to world UV (for world-space effects)
vec2 screenToWorld(vec2 screenUV) {
    // Screen UV is 0-1, convert to world coordinates
    // Center the UV, scale by screen size, add camera offset
    vec2 worldPos = (screenUV - 0.5) * uDimensions + uCameraPos;
    // Normalize to reasonable scale for effects (divide by world scale)
    return worldPos / uWorldScale;
}

// Diamond grid pattern - world-space card suit diamonds
float diamondGrid(vec2 worldUV, float time) {
    // Grid parameters - larger scale for visibility
    float gridSize = 0.08; // Size of each grid cell (smaller = more diamonds)
    float diamondSize = 0.06; // Size of diamond shape (larger = bigger diamonds)

    // Staggered grid (like brick pattern)
    vec2 gridUV = worldUV / gridSize;
    float rowOffset = mod(floor(gridUV.y), 2.0) * 0.5;
    gridUV.x += rowOffset;

    // Get cell coordinates
    vec2 cellId = floor(gridUV);
    vec2 cellUV = fract(gridUV) - 0.5; // Center in cell (-0.5 to 0.5)

    // Diamond shape (rotated square)
    float diamond = abs(cellUV.x) + abs(cellUV.y);

    // Pulsing based on world position and time
    float pulse = sin(time * 0.5 + cellId.x * 0.3 + cellId.y * 0.4) * 0.5 + 0.5;
    float size = diamondSize * (0.7 + pulse * 0.5);

    // Diamond mask with soft edge
    float mask = smoothstep(size + 0.02, size, diamond);

    // Stronger visibility
    return mask * (0.4 + pulse * 0.6);
}

// Smooth minimum for organic blending
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// ==================== DYNAMIC WAVE FUNCTIONS ====================

// Flowing energy streams - like aurora or plasma
vec3 energyStream(vec2 uv, float time) {
    vec3 stream = vec3(0.0);

    // Multiple flowing streams at different speeds
    for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float speed = 0.3 + fi * 0.15;
        float freq = 3.0 + fi * 1.5;
        float amp = 0.15 - fi * 0.03;

        // Flowing sine wave with time offset
        float wave = sin(uv.x * freq + time * speed + fi * 1.57);
        wave += sin(uv.x * freq * 1.3 - time * speed * 0.7 + fi * 0.8) * 0.5;

        // Distance from wave center
        float dist = abs(uv.y - 0.5 - wave * amp);

        // Glow intensity
        float glow = 0.02 / (dist + 0.02);
        glow *= smoothstep(0.3, 0.0, dist);

        // Color variation along stream
        float hue = fract(fi * 0.25 + time * 0.1 + uv.x * 0.2);
        vec3 col = uStageTint * (0.5 + 0.5 * sin(vec3(0.0, 2.09, 4.18) + hue * TAU));

        stream += col * glow * 0.3;
    }

    return stream;
}

// Pulsing concentric rings - like ripples in quantum field
float quantumRipples(vec2 uv, float time) {
    vec2 center = vec2(0.5, 0.5);
    float dist = length(uv - center);

    // Multiple expanding rings
    float ripples = 0.0;
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float phase = fi * TAU / 3.0;

        // Ring expands outward over time
        float ringRadius = fract(time * 0.2 + fi * 0.33);
        float ringWidth = 0.03 + ringRadius * 0.02;

        // Distance to ring
        float ringDist = abs(dist - ringRadius * 0.6);

        // Ring intensity (fades as it expands)
        float ring = smoothstep(ringWidth, 0.0, ringDist);
        ring *= 1.0 - ringRadius; // Fade out as it expands

        ripples += ring;
    }

    return ripples;
}

// Floating particles with trails
float floatingParticles(vec2 uv, float time) {
    float particles = 0.0;

    for (int i = 0; i < 8; i++) {
        float fi = float(i);

        // Unique motion per particle
        float angle = fi * TAU / 8.0 + time * (0.2 + fi * 0.05);
        float radius = 0.15 + 0.1 * sin(time * 0.5 + fi);

        // Particle position orbiting around center
        vec2 particlePos = vec2(0.5, 0.5) + vec2(cos(angle), sin(angle)) * radius;

        // Add some drift
        particlePos.x += sin(time * 0.3 + fi * 2.0) * 0.1;
        particlePos.y += cos(time * 0.4 + fi * 1.5) * 0.08;

        // Wrap around screen
        particlePos = fract(particlePos);

        // Distance to particle
        float dist = length(uv - particlePos);

        // Particle glow
        float glow = 0.015 / (dist + 0.015);
        glow *= smoothstep(0.1, 0.0, dist);

        // Trail behind particle
        vec2 trailDir = vec2(cos(angle + PI), sin(angle + PI));
        for (int j = 1; j <= 3; j++) {
            float fj = float(j);
            vec2 trailPos = particlePos + trailDir * fj * 0.02;
            float trailDist = length(uv - fract(trailPos));
            glow += (0.008 / (trailDist + 0.008)) * (1.0 - fj * 0.25);
        }

        particles += glow * (0.5 + 0.5 * sin(time * 3.0 + fi * 2.0));
    }

    return particles * 0.15;
}

// Flowing probability wave (Schrodinger-like)
float probabilityWave(vec2 uv, float time) {
    float wave = 0.0;

    // Main wave packet moving across screen
    float packetX = fract(time * 0.15);
    float packetWidth = 0.2;

    // Gaussian envelope
    float envelope = exp(-pow((uv.x - packetX) / packetWidth, 2.0) * 2.0);

    // Oscillating wave inside packet
    float freq = 20.0;
    float oscillation = sin(uv.x * freq - time * 5.0);
    oscillation *= sin(uv.y * 8.0 + time * 2.0); // 2D wave pattern

    wave = envelope * (0.5 + 0.5 * oscillation);

    // Add interference from reflected wave
    float reflectedX = fract(-time * 0.12 + 0.5);
    float envelope2 = exp(-pow((uv.x - reflectedX) / packetWidth, 2.0) * 2.0);
    float oscillation2 = sin(uv.x * freq * 1.2 + time * 4.0);
    oscillation2 *= sin(uv.y * 10.0 - time * 1.5);

    wave += envelope2 * (0.5 + 0.5 * oscillation2) * 0.6;

    return wave;
}

// Electron cloud visualization (dynamic orbitals)
vec3 electronCloud(vec2 uv, float time) {
    vec3 cloud = vec3(0.0);
    vec2 center = vec2(0.5, 0.5);

    // Multiple energy levels
    for (int n = 1; n <= 3; n++) {
        float fn = float(n);
        float orbitalRadius = fn * 0.12;

        // Orbital ring glow (breathing)
        float dist = length(uv - center);
        float ringGlow = exp(-pow((dist - orbitalRadius) / 0.02, 2.0));
        ringGlow *= 0.3 + 0.2 * sin(time * 2.0 + fn);

        // Electrons on this orbital
        int electronCount = n * 2;
        for (int e = 0; e < 6; e++) {
            if (e >= electronCount) break;

            float fe = float(e);
            float electronAngle = fe * TAU / float(electronCount) + time * (1.5 - fn * 0.3);

            vec2 electronPos = center + vec2(cos(electronAngle), sin(electronAngle)) * orbitalRadius;
            float electronDist = length(uv - electronPos);

            // Electron with glow and motion blur
            float electronGlow = 0.02 / (electronDist + 0.01);
            electronGlow *= smoothstep(0.08, 0.0, electronDist);

            // Motion trail
            for (int t = 1; t <= 4; t++) {
                float ft = float(t);
                float trailAngle = electronAngle - ft * 0.15;
                vec2 trailPos = center + vec2(cos(trailAngle), sin(trailAngle)) * orbitalRadius;
                float trailDist = length(uv - trailPos);
                electronGlow += (0.01 / (trailDist + 0.01)) * (1.0 - ft * 0.2);
            }

            cloud += uStageTint * electronGlow * 0.4;
        }

        cloud += uStageTint * ringGlow * 0.2;
    }

    return cloud;
}

// Gravity lens with flowing distortion
vec2 gravityLensFlow(vec2 uv, float time) {
    vec2 center = vec2(0.5 + sin(time * 0.2) * 0.08, 0.5 + cos(time * 0.25) * 0.06);
    vec2 toCenter = uv - center;
    float dist = length(toCenter);

    // Pulsing gravitational strength
    float strength = 0.1 * (1.0 + 0.3 * sin(time * 0.5));
    float bend = strength / (dist * dist + 0.1);

    // Spiral inflow
    float angle = atan(toCenter.y, toCenter.x);
    angle += bend * 0.3 * sin(time * 0.3);

    vec2 newDir = vec2(cos(angle), sin(angle));
    float newDist = dist * (1.0 - bend * 0.3);

    return center + newDir * newDist;
}

// Elastic bounce ripples (spring oscillation)
vec2 elasticBounce(vec2 uv, float time) {
    vec2 offset = vec2(0.0);

    // Multiple bounce points
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float phase = fi * TAU / 3.0;

        // Bounce origin moves around
        vec2 bounceCenter = vec2(
            0.5 + cos(time * 0.4 + phase) * 0.3,
            0.5 + sin(time * 0.3 + phase) * 0.25
        );

        vec2 toBounce = uv - bounceCenter;
        float dist = length(toBounce);

        // Damped oscillation (spring)
        float bounceTime = fract(time * 0.5 + fi * 0.33);
        float damping = exp(-bounceTime * 3.0);
        float oscillation = sin(bounceTime * 20.0) * damping;

        // Ripple effect
        float ripple = sin(dist * 30.0 - time * 8.0) * smoothstep(0.4, 0.0, dist);

        offset += normalize(toBounce + 0.001) * (oscillation * 0.02 + ripple * 0.005);
    }

    return uv + offset;
}

// Momentum flow field
vec2 momentumFlow(vec2 uv, float time) {
    // Direction field that sweeps across screen
    float flowAngle = sin(uv.y * 3.0 + time) * 0.5 + cos(uv.x * 2.0 - time * 0.5) * 0.3;
    vec2 flow = vec2(cos(flowAngle), sin(flowAngle));

    // Intensity varies across screen
    float intensity = 0.5 + 0.5 * sin(uv.x * 5.0 + uv.y * 3.0 + time * 2.0);

    return uv + flow * intensity * 0.01;
}

// Vortex spiral with event horizon
vec2 vortexSpiral(vec2 uv, float time) {
    vec2 center = vec2(0.5, 0.5);
    vec2 toCenter = uv - center;
    float dist = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x);

    // Accelerating spiral toward center
    float spiralStrength = smoothstep(0.6, 0.0, dist);
    float twist = spiralStrength * 2.0;

    // Rotation speed increases toward center
    angle += twist * sin(time * 0.5) + spiralStrength * time * 0.5;

    // Pull toward center (stronger as closer)
    float pull = spiralStrength * 0.15 * (1.0 + 0.3 * sin(time));
    float newDist = dist * (1.0 - pull);

    // Event horizon effect (sharp cutoff)
    newDist = max(newDist, 0.05);

    return center + vec2(cos(angle), sin(angle)) * newDist;
}

// Flowing accretion disk for vortex
vec3 accretionDisk(vec2 uv, float time) {
    vec2 center = vec2(0.5, 0.5);
    vec2 toCenter = uv - center;
    float dist = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x);

    vec3 disk = vec3(0.0);

    // Disk only in certain radius range
    float diskInner = 0.08;
    float diskOuter = 0.35;

    if (dist > diskInner && dist < diskOuter) {
        // Rotating spiral pattern
        float spiral = sin(angle * 3.0 - time * 2.0 - dist * 20.0);
        spiral = spiral * 0.5 + 0.5;

        // Intensity peaks in middle of disk
        float radialFade = smoothstep(diskInner, diskInner + 0.1, dist) *
                          smoothstep(diskOuter, diskOuter - 0.15, dist);

        // Hot spots rotating
        float hotSpot = pow(max(0.0, sin(angle * 2.0 - time * 3.0)), 4.0);

        disk = uStageTint * (spiral * 0.3 + hotSpot * 0.4) * radialFade;
    }

    return disk;
}

// ==================== BASE EFFECTS ====================

vec2 wobbleDistort(vec2 uv, float time) {
    // More flowing, wave-like wobble
    float wobbleX = sin(uv.y * 8.0 + time * uWobbleSpeed) * uWobbleIntensity;
    wobbleX += sin(uv.y * 12.0 - time * uWobbleSpeed * 1.3) * uWobbleIntensity * 0.4;

    float wobbleY = cos(uv.x * 6.0 + time * uWobbleSpeed * 0.9) * uWobbleIntensity;
    wobbleY += cos(uv.x * 10.0 - time * uWobbleSpeed * 1.1) * uWobbleIntensity * 0.3;

    return vec2(wobbleX, wobbleY);
}

// ==================== MAIN ====================

void main() {
    vec2 uv = vTextureCoord;
    vec3 effectColor = vec3(0.0);

    // Calculate world UV for world-space effects
    vec2 worldUV = screenToWorld(vTextureCoord);

    // Stage-specific UV distortion (screen-space for visual consistency)
    if (uStageMode == 1) { // Gravity - flowing lens
        uv = gravityLensFlow(uv, uTime);
    } else if (uStageMode == 2) { // Elastic - bouncy ripples
        uv = elasticBounce(uv, uTime);
    } else if (uStageMode == 3) { // Momentum - flow field
        uv = momentumFlow(uv, uTime);
    } else if (uStageMode == 4) { // Vortex - spiral
        uv = vortexSpiral(uv, uTime);
    }

    // Base wobble distortion (world-based, very sparse)
    vec2 wobble = wobbleDistort(worldUV * 0.1, uTime);
    uv += wobble * 0.006;

    // Clamp UV
    uv = clamp(uv, 0.001, 0.999);

    // Sample main color
    vec4 color = texture(uTexture, uv);

    // ==================== DIAMOND GRID PATTERN (World-space) ====================

    // Diamond grid overlay - pulsing card suit pattern
    // Use screen coordinates for reliable visibility
    float diamonds = diamondGrid(vTextureCoord * 10.0, uTime);
    color.rgb += vec3(1.0, 0.8, 0.3) * diamonds * 0.3; // Bright gold, very visible

    // ==================== WORLD-SPACE VISUAL EFFECTS ====================

    // Energy streams (world-space - fixed in world, sparse)
    if (uQuantumWave > 0.0) {
        effectColor += energyStream(worldUV * 0.15, uTime) * uQuantumWave * 0.7;
    }

    // Quantum ripples (world-space - one ripple per large cell)
    if (uProbabilityCloud > 0.0) {
        // Large cells for sparse ripples
        vec2 cellSize = vec2(3.0);
        vec2 rippleWorldCenter = floor(worldUV / cellSize) * cellSize + cellSize * 0.5;
        vec2 localUV = (worldUV - rippleWorldCenter + cellSize * 0.5) / cellSize;
        float ripples = quantumRipples(localUV, uTime + rippleWorldCenter.x * 0.05 + rippleWorldCenter.y * 0.07);
        effectColor += uStageTint * ripples * uProbabilityCloud * 0.3;
    }

    // Floating particles (world-space - sparse, larger scale)
    if (uParticleField > 0.0) {
        float particles = floatingParticles(worldUV * 0.08, uTime);
        effectColor += uStageTint * particles * uParticleField * 0.8;
    }

    // Stage-specific overlay effects (world-space)
    if (uStageMode == 0) { // Normal - probability wave (sparse)
        float wave = probabilityWave(worldUV * 0.12, uTime);
        effectColor += uStageTint * wave * 0.12;
    } else if (uStageMode == 1) { // Gravity - electron cloud (screen-centered)
        effectColor += electronCloud(vTextureCoord, uTime) * 0.5;
    } else if (uStageMode == 4) { // Vortex - accretion disk (screen-centered)
        effectColor += accretionDisk(vTextureCoord, uTime) * 0.8;
    }

    // Add effects to color
    color.rgb += effectColor;

    // ==================== ENERGY PULSE (World-space, sparse) ====================

    // Pulsing energy waves from sparse world grid points
    float pulse = 0.0;
    float pulseCellSize = 4.0; // Large cells for sparse pulses
    for (int i = 0; i < 2; i++) {
        float fi = float(i);
        // Pulse originates from sparse grid intersections
        vec2 pulseCell = floor(worldUV / pulseCellSize + fi * 0.5);
        vec2 pulseCenter = pulseCell * pulseCellSize + pulseCellSize * 0.5;
        float distFromPulse = length(worldUV - pulseCenter);

        float pulseRadius = fract(uTime * 0.15 + fi * 0.5 + pulseCell.x * 0.1 + pulseCell.y * 0.13);
        float pulseDist = abs(distFromPulse - pulseRadius * pulseCellSize * 0.4);
        pulse += smoothstep(0.15, 0.0, pulseDist) * (1.0 - pulseRadius) * 0.4;
    }
    color.rgb += uStageTint * pulse * uEnergyPulse * 0.25;

    // ==================== CHROMATIC FLOW ====================

    if (uColorShift > 0.0) {
        // Flowing chromatic aberration (world-based wave, gentle)
        float flowOffset = sin(uTime * 1.5 + worldUV.y * 0.8) * uColorShift * 0.002;
        float r = texture(uTexture, uv + vec2(flowOffset, 0.0)).r;
        float b = texture(uTexture, uv - vec2(flowOffset, 0.0)).b;
        color.r = mix(color.r, r, 0.3);
        color.b = mix(color.b, b, 0.3);
    }

    // ==================== VIGNETTE (Screen-space) ====================

    vec2 vignetteUV = vTextureCoord * (1.0 - vTextureCoord);
    float vignette = vignetteUV.x * vignetteUV.y * 15.0;
    vignette = pow(vignette, uVignetteStrength);

    // Pulsing vignette
    float edgePulse = 0.95 + 0.05 * sin(uTime * 1.5);
    vignette *= edgePulse;
    color.rgb *= vignette;

    // ==================== WORLD BREATHING ====================

    float worldPulse = 1.0 + 0.03 * sin(uTime * 1.2);
    color.rgb *= worldPulse;

    // DEBUG: Add visible pulsing tint to verify shader is working
    float debugPulse = sin(uTime * 2.0) * 0.5 + 0.5;
    color.rgb += vec3(0.2, 0.1, 0.0) * debugPulse;

    finalColor = color;
}
`

export interface WobbleWorldFilterOptions {
    wobbleIntensity?: number
    wobbleSpeed?: number
    energyPulse?: number
    distortionStrength?: number
    noiseAmount?: number
    vignetteStrength?: number
    colorShift?: number
    stageMode?: number
    quantumWave?: number
    particleField?: number
    probabilityCloud?: number
    stageTint?: [number, number, number]
}

export class WobbleWorldFilter extends Filter {
    public uniforms: {
        uTime: number
        uDimensions: Float32Array
        uWobbleIntensity: number
        uWobbleSpeed: number
        uEnergyPulse: number
        uDistortionStrength: number
        uNoiseAmount: number
        uVignetteStrength: number
        uColorShift: number
        uStageMode: number
        uQuantumWave: number
        uParticleField: number
        uProbabilityCloud: number
        uStageTint: Float32Array
        uCameraPos: Float32Array
        uWorldScale: number
    }

    constructor(options: WobbleWorldFilterOptions = {}) {
        const {
            wobbleIntensity = 0.3,
            wobbleSpeed = 2.0,
            energyPulse = 0.5,
            distortionStrength = 0.1,
            noiseAmount = 0.3,
            vignetteStrength = 0.25,
            colorShift = 0.5,
            stageMode = 0,
            quantumWave = 0.3,
            particleField = 0.3,
            probabilityCloud = 0.2,
            stageTint = [0.8, 0.9, 1.0],
        } = options

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'wobble-world-filter',
        })

        super({
            glProgram,
            resources: {
                wobbleUniforms: {
                    uTime: { value: 0, type: 'f32' },
                    uDimensions: { value: new Float32Array([100, 100]), type: 'vec2<f32>' },
                    uWobbleIntensity: { value: wobbleIntensity, type: 'f32' },
                    uWobbleSpeed: { value: wobbleSpeed, type: 'f32' },
                    uEnergyPulse: { value: energyPulse, type: 'f32' },
                    uDistortionStrength: { value: distortionStrength, type: 'f32' },
                    uNoiseAmount: { value: noiseAmount, type: 'f32' },
                    uVignetteStrength: { value: vignetteStrength, type: 'f32' },
                    uColorShift: { value: colorShift, type: 'f32' },
                    uStageMode: { value: stageMode, type: 'i32' },
                    uQuantumWave: { value: quantumWave, type: 'f32' },
                    uParticleField: { value: particleField, type: 'f32' },
                    uProbabilityCloud: { value: probabilityCloud, type: 'f32' },
                    uStageTint: { value: new Float32Array(stageTint), type: 'vec3<f32>' },
                    uCameraPos: { value: new Float32Array([0, 0]), type: 'vec2<f32>' },
                    uWorldScale: { value: 800, type: 'f32' }, // 800 pixels per world unit (larger = sparser patterns)
                },
            },
        })

        this.uniforms = this.resources.wobbleUniforms.uniforms
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

    setCameraPosition(x: number, y: number): void {
        this.uniforms.uCameraPos[0] = x
        this.uniforms.uCameraPos[1] = y
    }

    get worldScale(): number {
        return this.uniforms.uWorldScale
    }

    set worldScale(value: number) {
        this.uniforms.uWorldScale = value
    }

    get wobbleIntensity(): number {
        return this.uniforms.uWobbleIntensity
    }

    set wobbleIntensity(value: number) {
        this.uniforms.uWobbleIntensity = value
    }

    get wobbleSpeed(): number {
        return this.uniforms.uWobbleSpeed
    }

    set wobbleSpeed(value: number) {
        this.uniforms.uWobbleSpeed = value
    }

    get energyPulse(): number {
        return this.uniforms.uEnergyPulse
    }

    set energyPulse(value: number) {
        this.uniforms.uEnergyPulse = value
    }

    get distortionStrength(): number {
        return this.uniforms.uDistortionStrength
    }

    set distortionStrength(value: number) {
        this.uniforms.uDistortionStrength = value
    }

    get stageMode(): number {
        return this.uniforms.uStageMode
    }

    set stageMode(value: number) {
        this.uniforms.uStageMode = value
    }

    get quantumWave(): number {
        return this.uniforms.uQuantumWave
    }

    set quantumWave(value: number) {
        this.uniforms.uQuantumWave = value
    }

    get particleField(): number {
        return this.uniforms.uParticleField
    }

    set particleField(value: number) {
        this.uniforms.uParticleField = value
    }

    get probabilityCloud(): number {
        return this.uniforms.uProbabilityCloud
    }

    set probabilityCloud(value: number) {
        this.uniforms.uProbabilityCloud = value
    }

    setStageTint(r: number, g: number, b: number): void {
        this.uniforms.uStageTint[0] = r
        this.uniforms.uStageTint[1] = g
        this.uniforms.uStageTint[2] = b
    }

    // ==================== STAGE PRESETS ====================

    // Stage: Normal - 균형의 세계 (F = ma)
    static stageNormal(): WobbleWorldFilter {
        return new WobbleWorldFilter({
            wobbleIntensity: 0.15,
            wobbleSpeed: 1.5,
            energyPulse: 0.3,
            distortionStrength: 0.02,
            noiseAmount: 0.0,
            vignetteStrength: 0.15,
            colorShift: 0.2,
            stageMode: 0,
            quantumWave: 0.3,
            particleField: 0.4,
            probabilityCloud: 0.3,
            stageTint: [0.6, 0.9, 0.5], // Green energy
        })
    }

    // Stage: Gravity Wells - 끌어당기는 자
    static stageGravity(): WobbleWorldFilter {
        return new WobbleWorldFilter({
            wobbleIntensity: 0.12,
            wobbleSpeed: 0.8,
            energyPulse: 0.5,
            distortionStrength: 0.08,
            noiseAmount: 0.0,
            vignetteStrength: 0.3,
            colorShift: 0.5,
            stageMode: 1,
            quantumWave: 0.2,
            particleField: 0.5,
            probabilityCloud: 0.4,
            stageTint: [0.3, 0.5, 1.0], // Blue cosmic
        })
    }

    // Stage: Elastic - 튕겨내는 자
    static stageElastic(): WobbleWorldFilter {
        return new WobbleWorldFilter({
            wobbleIntensity: 0.25,
            wobbleSpeed: 2.5,
            energyPulse: 0.6,
            distortionStrength: 0.05,
            noiseAmount: 0.0,
            vignetteStrength: 0.18,
            colorShift: 0.6,
            stageMode: 2,
            quantumWave: 0.5,
            particleField: 0.3,
            probabilityCloud: 0.5,
            stageTint: [1.0, 0.4, 0.6], // Pink energy
        })
    }

    // Stage: Momentum - 밀어붙이는 자
    static stageMomentum(): WobbleWorldFilter {
        return new WobbleWorldFilter({
            wobbleIntensity: 0.18,
            wobbleSpeed: 2.0,
            energyPulse: 0.35,
            distortionStrength: 0.04,
            noiseAmount: 0.0,
            vignetteStrength: 0.22,
            colorShift: 0.35,
            stageMode: 3,
            quantumWave: 0.25,
            particleField: 0.6,
            probabilityCloud: 0.3,
            stageTint: [1.0, 0.8, 0.3], // Gold
        })
    }

    // Stage: Vortex - 삼켜버리는 자
    static stageVortex(): WobbleWorldFilter {
        return new WobbleWorldFilter({
            wobbleIntensity: 0.2,
            wobbleSpeed: 1.2,
            energyPulse: 0.55,
            distortionStrength: 0.1,
            noiseAmount: 0.0,
            vignetteStrength: 0.4,
            colorShift: 0.7,
            stageMode: 4,
            quantumWave: 0.35,
            particleField: 0.4,
            probabilityCloud: 0.5,
            stageTint: [1.0, 0.3, 0.2], // Red vortex
        })
    }

    // ==================== LEGACY PRESETS ====================

    static subtle(): WobbleWorldFilter {
        return WobbleWorldFilter.stageNormal()
    }

    static normal(): WobbleWorldFilter {
        return new WobbleWorldFilter({
            wobbleIntensity: 0.3,
            wobbleSpeed: 2.0,
            energyPulse: 0.5,
            distortionStrength: 0.05,
            noiseAmount: 0.0,
            vignetteStrength: 0.25,
            colorShift: 0.5,
            stageMode: 0,
            quantumWave: 0.4,
            particleField: 0.4,
            probabilityCloud: 0.3,
            stageTint: [0.8, 0.9, 1.0],
        })
    }

    static intense(): WobbleWorldFilter {
        return new WobbleWorldFilter({
            wobbleIntensity: 0.5,
            wobbleSpeed: 3.0,
            energyPulse: 0.8,
            distortionStrength: 0.1,
            noiseAmount: 0.0,
            vignetteStrength: 0.35,
            colorShift: 1.0,
            stageMode: 0,
            quantumWave: 0.7,
            particleField: 0.6,
            probabilityCloud: 0.5,
            stageTint: [1.0, 0.8, 0.6],
        })
    }

    static dreamy(): WobbleWorldFilter {
        return new WobbleWorldFilter({
            wobbleIntensity: 0.4,
            wobbleSpeed: 1.0,
            energyPulse: 0.4,
            distortionStrength: 0.08,
            noiseAmount: 0.0,
            vignetteStrength: 0.4,
            colorShift: 0.8,
            stageMode: 0,
            quantumWave: 0.5,
            particleField: 0.3,
            probabilityCloud: 0.6,
            stageTint: [0.7, 0.8, 1.0],
        })
    }

    // Apply preset by stage ID
    applyStagePreset(stageId: string): void {
        let preset: WobbleWorldFilterOptions

        switch (stageId) {
            case 'low-gravity':
                preset = {
                    wobbleIntensity: 0.12,
                    wobbleSpeed: 0.8,
                    energyPulse: 0.5,
                    distortionStrength: 0.08,
                    noiseAmount: 0.0,
                    vignetteStrength: 0.3,
                    colorShift: 0.5,
                    stageMode: 1,
                    quantumWave: 0.2,
                    particleField: 0.5,
                    probabilityCloud: 0.4,
                    stageTint: [0.3, 0.5, 1.0],
                }
                break
            case 'elastic':
                preset = {
                    wobbleIntensity: 0.25,
                    wobbleSpeed: 2.5,
                    energyPulse: 0.6,
                    distortionStrength: 0.05,
                    noiseAmount: 0.0,
                    vignetteStrength: 0.18,
                    colorShift: 0.6,
                    stageMode: 2,
                    quantumWave: 0.5,
                    particleField: 0.3,
                    probabilityCloud: 0.5,
                    stageTint: [1.0, 0.4, 0.6],
                }
                break
            case 'momentum':
                preset = {
                    wobbleIntensity: 0.18,
                    wobbleSpeed: 2.0,
                    energyPulse: 0.35,
                    distortionStrength: 0.04,
                    noiseAmount: 0.0,
                    vignetteStrength: 0.22,
                    colorShift: 0.35,
                    stageMode: 3,
                    quantumWave: 0.25,
                    particleField: 0.6,
                    probabilityCloud: 0.3,
                    stageTint: [1.0, 0.8, 0.3],
                }
                break
            case 'vortex':
                preset = {
                    wobbleIntensity: 0.2,
                    wobbleSpeed: 1.2,
                    energyPulse: 0.55,
                    distortionStrength: 0.1,
                    noiseAmount: 0.0,
                    vignetteStrength: 0.4,
                    colorShift: 0.7,
                    stageMode: 4,
                    quantumWave: 0.35,
                    particleField: 0.4,
                    probabilityCloud: 0.5,
                    stageTint: [1.0, 0.3, 0.2],
                }
                break
            default: // normal
                preset = {
                    wobbleIntensity: 0.15,
                    wobbleSpeed: 1.5,
                    energyPulse: 0.3,
                    distortionStrength: 0.02,
                    noiseAmount: 0.0,
                    vignetteStrength: 0.15,
                    colorShift: 0.2,
                    stageMode: 0,
                    quantumWave: 0.3,
                    particleField: 0.4,
                    probabilityCloud: 0.3,
                    stageTint: [0.6, 0.9, 0.5],
                }
        }

        // Apply all preset values
        this.uniforms.uWobbleIntensity = preset.wobbleIntensity!
        this.uniforms.uWobbleSpeed = preset.wobbleSpeed!
        this.uniforms.uEnergyPulse = preset.energyPulse!
        this.uniforms.uDistortionStrength = preset.distortionStrength!
        this.uniforms.uNoiseAmount = preset.noiseAmount!
        this.uniforms.uVignetteStrength = preset.vignetteStrength!
        this.uniforms.uColorShift = preset.colorShift!
        this.uniforms.uStageMode = preset.stageMode!
        this.uniforms.uQuantumWave = preset.quantumWave!
        this.uniforms.uParticleField = preset.particleField!
        this.uniforms.uProbabilityCloud = preset.probabilityCloud!
        this.uniforms.uStageTint[0] = preset.stageTint![0]
        this.uniforms.uStageTint[1] = preset.stageTint![1]
        this.uniforms.uStageTint[2] = preset.stageTint![2]
    }
}
