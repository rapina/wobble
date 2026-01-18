import { Container, Graphics, Ticker } from 'pixi.js'

export interface PhysicsEffect {
    container: Container
    timer: number
    update: (delta: number) => boolean // returns false when effect is done
}

export interface BounceParams {
    x: number
    y: number
    incomingAngle: number
    outgoingAngle: number
    color?: number
}

export interface PierceParams {
    x: number
    y: number
    angle: number
    color?: number
}

export interface ExplosionParams {
    x: number
    y: number
    radius: number
    color?: number
}

export interface FrequencyParams {
    x: number
    y: number
    level: number
}

export interface ImpactParams {
    x: number
    y: number
    angle: number
    force: number
    color?: number
}

export interface GravityParams {
    fromX: number
    fromY: number
    toX: number
    toY: number
    color?: number
}

export interface RefractionParams {
    x: number
    y: number
    angles: number[]
    color?: number
}

export interface CentripetalParams {
    x: number
    y: number
    radius: number
    color?: number
}

/**
 * Physics-based visual effects for survivor mode skills
 */
export class PhysicsSkillVisuals {
    private effectContainer: Container
    private effects: PhysicsEffect[] = []

    constructor(effectContainer: Container) {
        this.effectContainer = effectContainer
    }

    /**
     * 탄성 충돌 (Elastic Bounce) - 운동량 교환 시각화
     * Shows momentum transfer arrows at collision point
     */
    renderElasticBounce(params: BounceParams): void {
        const { x, y, incomingAngle, outgoingAngle, color = 0x3498db } = params

        const container = new Container()
        container.position.set(x, y)
        this.effectContainer.addChild(container)

        // Collision flash circle
        const flash = new Graphics()
        flash.circle(0, 0, 15)
        flash.fill({ color, alpha: 0.8 })
        container.addChild(flash)

        // Incoming arrow (fading in)
        const inArrow = this.createArrow(color, 0.6)
        inArrow.rotation = incomingAngle + Math.PI // Point toward collision
        inArrow.scale.set(0.8)
        container.addChild(inArrow)

        // Outgoing arrow (growing out)
        const outArrow = this.createArrow(color, 0.8)
        outArrow.rotation = outgoingAngle
        outArrow.scale.set(0)
        container.addChild(outArrow)

        // Momentum exchange particles
        const particles: Graphics[] = []
        for (let i = 0; i < 6; i++) {
            const particle = new Graphics()
            particle.circle(0, 0, 3)
            particle.fill({ color: 0xffffff, alpha: 0.7 })
            particle.position.set(0, 0)
            container.addChild(particle)
            particles.push(particle)
        }

        this.effects.push({
            container,
            timer: 0.4,
            update: (delta: number) => {
                const progress =
                    1 - this.effects.find((e) => e.container === container)!.timer / 0.4

                // Flash shrinks
                flash.scale.set(1 - progress * 0.5)
                flash.alpha = (1 - progress) * 0.8

                // Incoming arrow fades
                inArrow.alpha = 1 - progress

                // Outgoing arrow grows
                outArrow.scale.set(progress * 1.2)
                outArrow.alpha = progress < 0.5 ? progress * 2 : 2 - progress * 2

                // Particles fly outward
                particles.forEach((p, i) => {
                    const angle = outgoingAngle + (i - 2.5) * 0.3
                    const dist = progress * 40
                    p.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist)
                    p.alpha = (1 - progress) * 0.7
                })

                return this.effects.find((e) => e.container === container)!.timer > 0
            },
        })
    }

    /**
     * 운동량 관통 (Momentum Pierce) - 질량이 밀고 지나가는 효과
     * Shows heavy mass pushing through
     */
    renderMomentumPierce(params: PierceParams): void {
        const { x, y, angle, color = 0xe74c3c } = params

        const container = new Container()
        container.position.set(x, y)
        this.effectContainer.addChild(container)

        // Heavy impact ring
        const ring = new Graphics()
        ring.circle(0, 0, 20)
        ring.stroke({ color, width: 4, alpha: 0.8 })
        container.addChild(ring)

        // Momentum trail
        const trail = new Graphics()
        trail.moveTo(0, 0)
        trail.lineTo(-Math.cos(angle) * 40, -Math.sin(angle) * 40)
        trail.stroke({ color, width: 6, alpha: 0.6 })
        container.addChild(trail)

        // Push lines radiating outward
        const pushLines: Graphics[] = []
        for (let i = 0; i < 4; i++) {
            const line = new Graphics()
            line.moveTo(0, 0)
            const lineAngle = angle + Math.PI / 2 + (i - 1.5) * 0.4
            line.lineTo(Math.cos(lineAngle) * 25, Math.sin(lineAngle) * 25)
            line.stroke({ color: 0xffffff, width: 2, alpha: 0.5 })
            container.addChild(line)
            pushLines.push(line)
        }

        this.effects.push({
            container,
            timer: 0.3,
            update: () => {
                const progress =
                    1 - this.effects.find((e) => e.container === container)!.timer / 0.3

                // Ring expands and fades
                ring.scale.set(1 + progress * 0.5)
                ring.alpha = (1 - progress) * 0.8

                // Trail fades
                trail.alpha = (1 - progress) * 0.6

                // Push lines expand
                pushLines.forEach((line, i) => {
                    line.scale.set(1 + progress * 0.8)
                    line.alpha = (1 - progress) * 0.5
                })

                return this.effects.find((e) => e.container === container)!.timer > 0
            },
        })
    }

    /**
     * 압력파 (Pressure Wave) - 기체 팽창 폭발
     * Shows concentric pressure waves expanding outward
     */
    renderPressureWave(params: ExplosionParams): void {
        const { x, y, radius, color = 0xf39c12 } = params

        const container = new Container()
        container.position.set(x, y)
        this.effectContainer.addChild(container)

        // Multiple concentric waves
        const waves: Graphics[] = []
        for (let i = 0; i < 3; i++) {
            const wave = new Graphics()
            wave.circle(0, 0, radius * 0.3)
            wave.stroke({ color, width: 3 - i, alpha: 0.6 - i * 0.15 })
            wave.scale.set(0)
            container.addChild(wave)
            waves.push(wave)
        }

        // Particle scatter (gas molecules)
        const particles: Graphics[] = []
        for (let i = 0; i < 12; i++) {
            const particle = new Graphics()
            particle.circle(0, 0, 2 + Math.random() * 3)
            particle.fill({ color: 0xffeaa7, alpha: 0.8 })
            container.addChild(particle)
            particles.push(particle)
        }

        this.effects.push({
            container,
            timer: 0.5,
            update: () => {
                const progress =
                    1 - this.effects.find((e) => e.container === container)!.timer / 0.5

                // Waves expand with delay
                waves.forEach((wave, i) => {
                    const waveProgress = Math.max(0, progress - i * 0.15) / (1 - i * 0.15)
                    wave.scale.set(waveProgress * 3)
                    wave.alpha = (1 - waveProgress) * (0.6 - i * 0.15)
                })

                // Particles fly outward
                particles.forEach((p, i) => {
                    const angle = (i / 12) * Math.PI * 2
                    const dist = progress * radius * (0.8 + Math.random() * 0.4)
                    p.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist)
                    p.alpha = (1 - progress) * 0.8
                    p.scale.set(1 - progress * 0.5)
                })

                return this.effects.find((e) => e.container === container)!.timer > 0
            },
        })
    }

    /**
     * 진동수 증폭 (Frequency Burst) - 파장 색상 변화
     * Shows frequency-based color shift effect
     */
    renderFrequencyBurst(params: FrequencyParams): void {
        const { x, y, level } = params

        const container = new Container()
        container.position.set(x, y)
        this.effectContainer.addChild(container)

        // Color based on frequency level (red to violet)
        const colors = [0xff6b6b, 0xfeca57, 0x48dbfb, 0xa29bfe, 0x9b59b6]
        const color = colors[Math.min(level - 1, colors.length - 1)]

        // Wave rings
        const rings: Graphics[] = []
        for (let i = 0; i < 3; i++) {
            const ring = new Graphics()
            ring.circle(0, 0, 10 + i * 5)
            ring.stroke({ color, width: 2, alpha: 0.7 - i * 0.2 })
            container.addChild(ring)
            rings.push(ring)
        }

        // Frequency shimmer
        const shimmer = new Graphics()
        shimmer.circle(0, 0, 8)
        shimmer.fill({ color, alpha: 0.9 })
        container.addChild(shimmer)

        this.effects.push({
            container,
            timer: 0.25,
            update: () => {
                const progress =
                    1 - this.effects.find((e) => e.container === container)!.timer / 0.25

                // Rings pulse outward with frequency
                rings.forEach((ring, i) => {
                    const freq = 1 + level * 2 // Higher level = faster oscillation
                    const pulse = Math.sin(progress * Math.PI * freq + i * 0.5) * 0.5 + 0.5
                    ring.scale.set(1 + progress * 0.5 + pulse * 0.2)
                    ring.alpha = (1 - progress) * (0.7 - i * 0.2)
                })

                // Shimmer flickers
                shimmer.alpha =
                    (1 - progress) * (0.5 + Math.sin(progress * Math.PI * (2 + level)) * 0.5)
                shimmer.scale.set(1 + progress * 0.3)

                return this.effects.find((e) => e.container === container)!.timer > 0
            },
        })
    }

    /**
     * F=ma 충격 (F=ma Impact) - 무거운 충격파
     * Shows force = mass × acceleration effect
     */
    renderFmaImpact(params: ImpactParams): void {
        const { x, y, angle, force, color = 0x9b59b6 } = params

        const container = new Container()
        container.position.set(x, y)
        this.effectContainer.addChild(container)

        // Heavy impact circle
        const impact = new Graphics()
        impact.circle(0, 0, 25)
        impact.fill({ color, alpha: 0.6 })
        container.addChild(impact)

        // Force arrow (F = ma direction)
        const forceArrow = this.createArrow(color, 1)
        forceArrow.rotation = angle
        forceArrow.scale.set(force * 0.02)
        container.addChild(forceArrow)

        // Acceleration lines
        const accelLines: Graphics[] = []
        for (let i = 0; i < 5; i++) {
            const line = new Graphics()
            const startX = Math.cos(angle) * (20 + i * 10)
            const startY = Math.sin(angle) * (20 + i * 10)
            line.moveTo(startX, startY)
            line.lineTo(startX + Math.cos(angle) * 15, startY + Math.sin(angle) * 15)
            line.stroke({ color: 0xffffff, width: 3 - i * 0.5, alpha: 0.6 - i * 0.1 })
            container.addChild(line)
            accelLines.push(line)
        }

        this.effects.push({
            container,
            timer: 0.35,
            update: () => {
                const progress =
                    1 - this.effects.find((e) => e.container === container)!.timer / 0.35

                // Impact expands and fades
                impact.scale.set(1 + progress * 0.8)
                impact.alpha = (1 - progress) * 0.6

                // Force arrow fades
                forceArrow.alpha = 1 - progress

                // Acceleration lines animate outward
                accelLines.forEach((line, i) => {
                    const offset = progress * 30
                    line.position.set(Math.cos(angle) * offset, Math.sin(angle) * offset)
                    line.alpha = (1 - progress) * (0.6 - i * 0.1)
                })

                return this.effects.find((e) => e.container === container)!.timer > 0
            },
        })
    }

    /**
     * 중력 유도 (Gravity Pull) - 휘어지는 궤적
     * Shows gravitational curve effect
     */
    renderGravityPull(params: GravityParams): void {
        const { fromX, fromY, toX, toY, color = 0x1abc9c } = params

        const container = new Container()
        this.effectContainer.addChild(container)

        // Gravity field lines (curved)
        const fieldLines: Graphics[] = []
        for (let i = 0; i < 3; i++) {
            const line = new Graphics()
            line.alpha = 0.5 - i * 0.15
            container.addChild(line)
            fieldLines.push(line)
        }

        // Target gravity well
        const well = new Graphics()
        well.circle(toX, toY, 15)
        well.stroke({ color, width: 2, alpha: 0.6 })
        container.addChild(well)

        this.effects.push({
            container,
            timer: 0.4,
            update: () => {
                const progress =
                    1 - this.effects.find((e) => e.container === container)!.timer / 0.4

                // Draw curved paths
                fieldLines.forEach((line, i) => {
                    line.clear()
                    const offset = (i - 1) * 10
                    const midX = (fromX + toX) / 2 + offset
                    const midY = (fromY + toY) / 2 - 30 + offset

                    // Bezier curve
                    line.moveTo(fromX, fromY)
                    line.quadraticCurveTo(midX, midY, toX, toY)
                    line.stroke({
                        color,
                        width: 2 - i * 0.5,
                        alpha: (1 - progress) * (0.5 - i * 0.15),
                    })
                })

                // Gravity well pulses
                well.scale.set(1 + Math.sin(progress * Math.PI * 3) * 0.2)
                well.alpha = (1 - progress) * 0.6

                return this.effects.find((e) => e.container === container)!.timer > 0
            },
        })
    }

    /**
     * 굴절 분산 (Refraction Spread) - 프리즘 효과
     * Shows light refraction into multiple beams
     */
    renderRefractionSpread(params: RefractionParams): void {
        const { x, y, angles, color = 0xe67e22 } = params

        const container = new Container()
        container.position.set(x, y)
        this.effectContainer.addChild(container)

        // Prism center
        const prism = new Graphics()
        prism.poly([
            { x: 0, y: -12 },
            { x: 10, y: 10 },
            { x: -10, y: 10 },
        ])
        prism.fill({ color: 0xffffff, alpha: 0.3 })
        prism.stroke({ color: 0xffffff, width: 2, alpha: 0.6 })
        container.addChild(prism)

        // Rainbow colors for refracted beams
        const rainbowColors = [0xff6b6b, 0xfeca57, 0x1dd1a1, 0x54a0ff, 0x9b59b6]

        // Refracted beams
        const beams: Graphics[] = []
        angles.forEach((angle, i) => {
            const beam = new Graphics()
            beam.moveTo(0, 0)
            beam.lineTo(Math.cos(angle) * 50, Math.sin(angle) * 50)
            const beamColor = rainbowColors[i % rainbowColors.length]
            beam.stroke({ color: beamColor, width: 3, alpha: 0.7 })
            container.addChild(beam)
            beams.push(beam)
        })

        this.effects.push({
            container,
            timer: 0.35,
            update: () => {
                const progress =
                    1 - this.effects.find((e) => e.container === container)!.timer / 0.35

                // Prism fades
                prism.alpha = (1 - progress) * 0.3

                // Beams extend outward
                beams.forEach((beam, i) => {
                    beam.scale.set(progress * 1.5)
                    beam.alpha = (1 - progress) * 0.7
                })

                return this.effects.find((e) => e.container === container)!.timer > 0
            },
        })
    }

    /**
     * 원심력 펄스 (Centripetal Pulse) - 회전 밀어내기
     * Shows rotating force pushing outward
     */
    renderCentripetalPulse(params: CentripetalParams): void {
        const { x, y, radius, color = 0x2ecc71 } = params

        const container = new Container()
        container.position.set(x, y)
        this.effectContainer.addChild(container)

        // Rotating ring
        const ring = new Graphics()
        ring.circle(0, 0, radius * 0.5)
        ring.stroke({ color, width: 4, alpha: 0.7 })
        container.addChild(ring)

        // Rotation markers
        const markers: Graphics[] = []
        for (let i = 0; i < 4; i++) {
            const marker = new Graphics()
            marker.circle(0, 0, 6)
            marker.fill({ color, alpha: 0.8 })
            container.addChild(marker)
            markers.push(marker)
        }

        // Outward force lines
        const forceLines: Graphics[] = []
        for (let i = 0; i < 8; i++) {
            const line = new Graphics()
            const angle = (i / 8) * Math.PI * 2
            line.moveTo(Math.cos(angle) * radius * 0.3, Math.sin(angle) * radius * 0.3)
            line.lineTo(Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.6)
            line.stroke({ color, width: 2, alpha: 0.5 })
            container.addChild(line)
            forceLines.push(line)
        }

        let rotation = 0
        this.effects.push({
            container,
            timer: 0.5,
            update: (delta: number) => {
                const progress =
                    1 - this.effects.find((e) => e.container === container)!.timer / 0.5

                // Rotate markers
                rotation += delta * 0.15
                markers.forEach((marker, i) => {
                    const angle = rotation + (i / 4) * Math.PI * 2
                    const dist = radius * 0.4 * (1 + progress * 0.5)
                    marker.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist)
                    marker.alpha = (1 - progress) * 0.8
                })

                // Ring expands
                ring.scale.set(1 + progress * 1.5)
                ring.alpha = (1 - progress) * 0.7

                // Force lines extend
                forceLines.forEach((line, i) => {
                    line.scale.set(1 + progress * 2)
                    line.alpha = (1 - progress) * 0.5
                })

                return this.effects.find((e) => e.container === container)!.timer > 0
            },
        })
    }

    /**
     * Update all active effects
     */
    update(delta: number): void {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i]
            effect.timer -= delta / 60

            const shouldContinue = effect.update(delta)

            if (!shouldContinue || effect.timer <= 0) {
                // Remove from parent and destroy to free GPU memory
                this.effectContainer.removeChild(effect.container)
                effect.container.destroy({ children: true })
                this.effects.splice(i, 1)
            }
        }
    }

    /**
     * Helper: Create an arrow graphic
     */
    private createArrow(color: number, alpha: number): Graphics {
        const arrow = new Graphics()
        // Arrow body
        arrow.moveTo(-20, 0)
        arrow.lineTo(10, 0)
        arrow.stroke({ color, width: 3, alpha })
        // Arrow head
        arrow.moveTo(10, 0)
        arrow.lineTo(0, -5)
        arrow.lineTo(0, 5)
        arrow.lineTo(10, 0)
        arrow.fill({ color, alpha })
        return arrow
    }

    /**
     * Reset all effects
     */
    reset(): void {
        for (const effect of this.effects) {
            this.effectContainer.removeChild(effect.container)
            effect.container.destroy({ children: true })
        }
        this.effects = []
    }

    /**
     * Destroy all effects and cleanup
     */
    destroy(): void {
        this.reset()
    }
}
