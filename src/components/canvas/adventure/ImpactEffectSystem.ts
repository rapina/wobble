import { Container, Graphics } from 'pixi.js'

export type ImpactType = 'hit' | 'critical' | 'kill' | 'explosion' | 'combo'

interface ImpactConfig {
    hitstopFrames: number
    flashAlpha: number
    flashColor: number
    flashDuration: number
    particleCount: number
    particleSpeed: number
    particleSize: number
    particleColor: number
    shakeIntensity: number
    shakeDuration: number
}

const IMPACT_CONFIGS: Record<ImpactType, ImpactConfig> = {
    hit: {
        hitstopFrames: 2,
        flashAlpha: 0,
        flashColor: 0xffffff,
        flashDuration: 0.05,
        particleCount: 6,
        particleSpeed: 8,
        particleSize: 4,
        particleColor: 0xffffff,
        shakeIntensity: 2,
        shakeDuration: 0.08,
    },
    critical: {
        hitstopFrames: 4,
        flashAlpha: 0,
        flashColor: 0xffd700,
        flashDuration: 0.08,
        particleCount: 12,
        particleSpeed: 12,
        particleSize: 6,
        particleColor: 0xffd700,
        shakeIntensity: 5,
        shakeDuration: 0.12,
    },
    kill: {
        hitstopFrames: 3,
        flashAlpha: 0,
        flashColor: 0xff4444,
        flashDuration: 0.06,
        particleCount: 16,
        particleSpeed: 15,
        particleSize: 5,
        particleColor: 0xff6666,
        shakeIntensity: 6,
        shakeDuration: 0.15,
    },
    explosion: {
        hitstopFrames: 5,
        flashAlpha: 0,
        flashColor: 0xff6600,
        flashDuration: 0.1,
        particleCount: 24,
        particleSpeed: 18,
        particleSize: 7,
        particleColor: 0xff8833,
        shakeIntensity: 10,
        shakeDuration: 0.2,
    },
    combo: {
        hitstopFrames: 2,
        flashAlpha: 0,
        flashColor: 0x9b59b6,
        flashDuration: 0.06,
        particleCount: 10,
        particleSpeed: 10,
        particleSize: 5,
        particleColor: 0xbb79d6,
        shakeIntensity: 4,
        shakeDuration: 0.1,
    },
}

interface Particle {
    graphics: Graphics
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    size: number
    rotation: number
    rotationSpeed: number
}

interface ScalePunch {
    target: Container
    timer: number
    duration: number
    intensity: number
    originalScaleX: number
    originalScaleY: number
}

export interface ImpactEffectSystemOptions {
    particlePoolSize?: number
}

export class ImpactEffectSystem {
    private container: Container
    private flashOverlay: Graphics
    private width: number
    private height: number

    // Hitstop
    private hitstopFrames = 0
    private _isHitstopActive = false

    // Flash
    private flashTimer = 0
    private flashDuration = 0
    private flashTargetAlpha = 0

    // Particles (pooled)
    private particlePool: Graphics[] = []
    private activeParticles: Particle[] = []
    private particlePoolSize: number

    // Scale punch effects
    private scalePunches: ScalePunch[] = []

    // Time scale for slow motion
    private _timeScale = 1
    private timeScaleTimer = 0
    private timeScaleTarget = 1
    private timeScaleDuration = 0

    // Callbacks
    onShake?: (intensity: number, duration: number) => void

    constructor(
        container: Container,
        width: number,
        height: number,
        options?: ImpactEffectSystemOptions
    ) {
        this.container = container
        this.width = width
        this.height = height
        this.particlePoolSize = options?.particlePoolSize ?? 100

        // Create flash overlay
        this.flashOverlay = new Graphics()
        this.flashOverlay.rect(0, 0, width, height)
        this.flashOverlay.fill(0xffffff)
        this.flashOverlay.alpha = 0
        this.container.addChild(this.flashOverlay)

        // Initialize particle pool
        this.initParticlePool()
    }

    private initParticlePool(): void {
        for (let i = 0; i < this.particlePoolSize; i++) {
            const particle = this.createParticleGraphic()
            particle.visible = false
            this.container.addChild(particle)
            this.particlePool.push(particle)
        }
    }

    private createParticleGraphic(): Graphics {
        const g = new Graphics()
        // Diamond/shard shape for impact feel
        g.moveTo(0, -5)
        g.lineTo(3, 0)
        g.lineTo(0, 5)
        g.lineTo(-3, 0)
        g.closePath()
        g.fill(0xffffff)
        return g
    }

    private acquireParticle(): Graphics | null {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop()!
        }
        // Pool exhausted - recycle oldest
        if (this.activeParticles.length > 0) {
            const oldest = this.activeParticles.shift()!
            oldest.graphics.visible = false
            return oldest.graphics
        }
        return null
    }

    private releaseParticle(graphics: Graphics): void {
        graphics.visible = false
        this.particlePool.push(graphics)
    }

    /**
     * Trigger an impact effect at position
     */
    trigger(x: number, y: number, type: ImpactType = 'hit', color?: number): void {
        const config = IMPACT_CONFIGS[type]

        // Hitstop
        this.hitstopFrames = config.hitstopFrames
        this._isHitstopActive = true

        // Flash
        this.flashTimer = config.flashDuration
        this.flashDuration = config.flashDuration
        this.flashTargetAlpha = config.flashAlpha
        this.flashOverlay.clear()
        this.flashOverlay.rect(0, 0, this.width, this.height)
        this.flashOverlay.fill(color ?? config.flashColor)
        this.flashOverlay.alpha = config.flashAlpha

        // Particles burst
        this.spawnParticleBurst(x, y, config, color)

        // Shake callback
        if (this.onShake) {
            this.onShake(config.shakeIntensity, config.shakeDuration)
        }
    }

    /**
     * Trigger kill effect (more dramatic)
     */
    triggerKill(x: number, y: number, enemyColor?: number): void {
        this.trigger(x, y, 'kill', enemyColor)

        // Extra particles for kill
        const config = IMPACT_CONFIGS.kill
        this.spawnParticleBurst(x, y, { ...config, particleCount: 8 }, enemyColor ?? 0xffffff)
    }

    /**
     * Trigger physics-based impact with particle count proportional to energy
     * Uses KE = ½mv² to determine visual intensity
     * @param x World X position
     * @param y World Y position
     * @param damage Damage dealt
     * @param projectileSpeed Speed of projectile
     * @param enemyMass Mass of enemy hit
     * @param color Optional particle color
     * @param knockbackDir Optional knockback direction for directional particles
     */
    triggerPhysicsImpact(
        x: number,
        y: number,
        damage: number,
        projectileSpeed: number,
        enemyMass: number,
        color?: number,
        knockbackDir?: { x: number; y: number }
    ): void {
        // Calculate kinetic energy for particle scaling: KE = ½mv²
        // Using damage as proxy for momentum transfer
        const kineticEnergy = 0.5 * damage * projectileSpeed * projectileSpeed
        const normalizedEnergy = Math.min(kineticEnergy / 500, 1) // Normalize to 0-1

        // Base config modified by energy
        const baseConfig = IMPACT_CONFIGS.hit
        const energyMultiplier = 0.5 + normalizedEnergy * 1.5 // 0.5x to 2x

        // Lighter enemies show more knockback effect (F=ma, a∝1/m)
        const massEffect = Math.min(10 / (enemyMass + 1), 2) // Lighter = more particles

        const particleCount = Math.floor(baseConfig.particleCount * energyMultiplier * massEffect)
        const particleSpeed = baseConfig.particleSpeed * (0.8 + normalizedEnergy * 0.6) * massEffect

        // Spawn directional particle burst (in knockback direction)
        if (knockbackDir) {
            this.spawnDirectionalParticleBurst(
                x,
                y,
                particleCount,
                particleSpeed,
                knockbackDir,
                color ?? this.getEnergyColor(normalizedEnergy)
            )
        } else {
            this.spawnParticleBurst(
                x,
                y,
                {
                    ...baseConfig,
                    particleCount,
                    particleSpeed,
                },
                color ?? this.getEnergyColor(normalizedEnergy)
            )
        }

        // Flash based on energy - disabled
        // if (normalizedEnergy > 0.5) {
        //     this.flashTimer = 0.05
        //     this.flashDuration = 0.05
        //     this.flashTargetAlpha = 0.1 + normalizedEnergy * 0.1
        //     this.flashOverlay.clear()
        //     this.flashOverlay.rect(0, 0, this.width, this.height)
        //     this.flashOverlay.fill(color ?? this.getEnergyColor(normalizedEnergy))
        //     this.flashOverlay.alpha = this.flashTargetAlpha
        // }
    }

    /**
     * Get color based on energy level (blue = low, white = medium, yellow = high)
     */
    private getEnergyColor(normalizedEnergy: number): number {
        if (normalizedEnergy < 0.3) {
            return 0x88ccff // Low energy - blue
        } else if (normalizedEnergy < 0.7) {
            return 0xffffff // Medium energy - white
        } else {
            return 0xffdd44 // High energy - yellow/gold
        }
    }

    /**
     * Spawn directional particle burst (particles fly in knockback direction)
     * Visualizes momentum transfer: p = mv
     */
    private spawnDirectionalParticleBurst(
        x: number,
        y: number,
        count: number,
        speed: number,
        direction: { x: number; y: number },
        color: number
    ): void {
        const dirAngle = Math.atan2(direction.y, direction.x)
        const spreadAngle = Math.PI / 3 // 60 degree cone

        for (let i = 0; i < count; i++) {
            const graphics = this.acquireParticle()
            if (!graphics) break

            // Random angle within cone centered on knockback direction
            const angleOffset = (Math.random() - 0.5) * spreadAngle
            const angle = dirAngle + angleOffset
            const particleSpeed = speed * (0.5 + Math.random() * 0.5)

            // Update particle graphics
            graphics.clear()
            const size = 4 * (0.5 + Math.random() * 0.5)
            graphics.moveTo(0, -size)
            graphics.lineTo(size * 0.6, 0)
            graphics.lineTo(0, size)
            graphics.lineTo(-size * 0.6, 0)
            graphics.closePath()
            graphics.fill(color)

            graphics.position.set(x, y)
            graphics.visible = true
            graphics.alpha = 1
            graphics.scale.set(1)

            const maxLife = 0.25 + Math.random() * 0.15

            this.activeParticles.push({
                graphics,
                x,
                y,
                vx: Math.cos(angle) * particleSpeed,
                vy: Math.sin(angle) * particleSpeed,
                life: maxLife,
                maxLife,
                size,
                rotation: angle, // Orient particle in direction of travel
                rotationSpeed: (Math.random() - 0.5) * 10,
            })
        }
    }

    /**
     * Spawn particle burst at position
     */
    private spawnParticleBurst(x: number, y: number, config: ImpactConfig, color?: number): void {
        const particleColor = color ?? config.particleColor

        for (let i = 0; i < config.particleCount; i++) {
            const graphics = this.acquireParticle()
            if (!graphics) break

            // Random direction with some spread
            const angle = (Math.PI * 2 * i) / config.particleCount + (Math.random() - 0.5) * 0.5
            const speed = config.particleSpeed * (0.5 + Math.random() * 0.5)

            // Update particle color
            graphics.clear()
            const size = config.particleSize * (0.5 + Math.random() * 0.5)
            graphics.moveTo(0, -size)
            graphics.lineTo(size * 0.6, 0)
            graphics.lineTo(0, size)
            graphics.lineTo(-size * 0.6, 0)
            graphics.closePath()
            graphics.fill(particleColor)

            graphics.position.set(x, y)
            graphics.visible = true
            graphics.alpha = 1
            graphics.scale.set(1)

            const maxLife = 0.3 + Math.random() * 0.2

            this.activeParticles.push({
                graphics,
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: maxLife,
                maxLife,
                size,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 15,
            })
        }
    }

    /**
     * Add scale punch effect to a target
     */
    addScalePunch(target: Container, intensity: number = 0.3, duration: number = 0.15): void {
        // Skip if target is null or destroyed
        if (!target || target.destroyed) return

        // Remove existing punch on same target
        this.scalePunches = this.scalePunches.filter((p) => p.target !== target)

        this.scalePunches.push({
            target,
            timer: 0,
            duration,
            intensity,
            originalScaleX: target.scale.x,
            originalScaleY: target.scale.y,
        })

        // Initial punch - scale up
        target.scale.set(target.scale.x * (1 + intensity), target.scale.y * (1 + intensity))
    }

    /**
     * Set time scale for slow motion effect
     */
    setTimeScale(scale: number, duration: number = 0): void {
        if (duration > 0) {
            this.timeScaleTarget = scale
            this.timeScaleDuration = duration
            this.timeScaleTimer = 0
        } else {
            this._timeScale = scale
            this.timeScaleTarget = scale
        }
    }

    /**
     * Trigger slow motion on kill
     */
    triggerSlowMotion(scale: number = 0.3, duration: number = 0.1): void {
        this._timeScale = scale
        this.timeScaleTarget = 1
        this.timeScaleDuration = duration
        this.timeScaleTimer = 0
    }

    /**
     * Get current time scale
     */
    get timeScale(): number {
        return this._timeScale
    }

    /**
     * Check if hitstop is active
     */
    get isHitstopActive(): boolean {
        return this._isHitstopActive
    }

    /**
     * Update the system
     * @returns adjusted delta (accounting for hitstop and time scale)
     */
    update(deltaSeconds: number): number {
        // Handle hitstop
        if (this.hitstopFrames > 0) {
            this.hitstopFrames--
            if (this.hitstopFrames <= 0) {
                this._isHitstopActive = false
            }
            // During hitstop, only update visual effects, return 0 for game logic
            this.updateVisuals(deltaSeconds)
            return 0
        }

        // Apply time scale
        const scaledDelta = deltaSeconds * this._timeScale

        // Update time scale transition
        if (this.timeScaleDuration > 0) {
            this.timeScaleTimer += deltaSeconds
            const progress = Math.min(1, this.timeScaleTimer / this.timeScaleDuration)
            this._timeScale = this._timeScale + (this.timeScaleTarget - this._timeScale) * progress
            if (progress >= 1) {
                this.timeScaleDuration = 0
            }
        }

        this.updateVisuals(deltaSeconds)

        return scaledDelta
    }

    private updateVisuals(deltaSeconds: number): void {
        // Update flash
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaSeconds
            const progress = 1 - this.flashTimer / this.flashDuration
            // Fast fade out
            this.flashOverlay.alpha = this.flashTargetAlpha * (1 - this.easeOutQuad(progress))
            if (this.flashTimer <= 0) {
                this.flashOverlay.alpha = 0
            }
        }

        // Update particles
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i]
            p.life -= deltaSeconds

            if (p.life <= 0) {
                this.releaseParticle(p.graphics)
                this.activeParticles.splice(i, 1)
                continue
            }

            // Apply gravity
            p.vy += 20 * deltaSeconds

            // Move
            p.x += p.vx
            p.y += p.vy

            // Slow down
            p.vx *= 0.95
            p.vy *= 0.95

            // Rotate
            p.rotation += p.rotationSpeed * deltaSeconds

            // Update graphics
            p.graphics.position.set(p.x, p.y)
            p.graphics.rotation = p.rotation

            // Fade and shrink
            const lifeRatio = p.life / p.maxLife
            p.graphics.alpha = lifeRatio
            p.graphics.scale.set(lifeRatio)
        }

        // Update scale punches
        for (let i = this.scalePunches.length - 1; i >= 0; i--) {
            const punch = this.scalePunches[i]

            // Check if target was destroyed
            if (!punch.target || punch.target.destroyed) {
                this.scalePunches.splice(i, 1)
                continue
            }

            punch.timer += deltaSeconds

            const progress = punch.timer / punch.duration

            if (progress >= 1) {
                // Reset to original scale
                punch.target.scale.set(punch.originalScaleX, punch.originalScaleY)
                this.scalePunches.splice(i, 1)
                continue
            }

            // Elastic bounce back
            const elastic = this.easeOutElastic(progress)
            const currentIntensity = punch.intensity * (1 - elastic)

            punch.target.scale.set(
                punch.originalScaleX * (1 + currentIntensity),
                punch.originalScaleY * (1 + currentIntensity)
            )
        }
    }

    private easeOutQuad(t: number): number {
        return 1 - (1 - t) * (1 - t)
    }

    private easeOutElastic(t: number): number {
        const c4 = (2 * Math.PI) / 3
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
    }

    /**
     * Update dimensions (for resize)
     */
    updateDimensions(width: number, height: number): void {
        this.width = width
        this.height = height
        this.flashOverlay.clear()
        this.flashOverlay.rect(0, 0, width, height)
        this.flashOverlay.fill(0xffffff)
        this.flashOverlay.alpha = 0
    }

    /**
     * Reset the system
     */
    reset(): void {
        this.hitstopFrames = 0
        this._isHitstopActive = false
        this.flashTimer = 0
        this.flashOverlay.alpha = 0
        this._timeScale = 1
        this.timeScaleTimer = 0
        this.timeScaleDuration = 0

        // Return all particles to pool
        for (const p of this.activeParticles) {
            this.releaseParticle(p.graphics)
        }
        this.activeParticles = []

        // Clear scale punches
        for (const punch of this.scalePunches) {
            // target이 아직 유효한 경우에만 스케일 복원
            if (punch.target && punch.target.scale && !punch.target.destroyed) {
                punch.target.scale.set(punch.originalScaleX, punch.originalScaleY)
            }
        }
        this.scalePunches = []
    }

    /**
     * Destroy the system
     */
    destroy(): void {
        this.reset()
        this.container.removeChild(this.flashOverlay)
        this.flashOverlay.destroy()

        for (const particle of this.particlePool) {
            this.container.removeChild(particle)
            particle.destroy()
        }
        this.particlePool = []
    }
}
