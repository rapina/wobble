import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression, BlobShape } from '../Blob'
import { pixiColors, lerp } from '../../../utils/pixiHelpers'

type AnimationPhase = 'idle' | 'charge' | 'push' | 'run' | 'reset'

interface DustParticle {
    x: number
    y: number
    life: number
    vx: number
    vy: number
}

interface PhysicsState {
    phase: AnimationPhase
    phaseTime: number
    forceX: number
    forceSquash: number
    massX: number
    massVelocity: number
    legPhase: number
    bounceY: number
    massSquashX: number
    massSquashY: number
    impactFlash: number
    dustParticles: DustParticle[]
}

export class NewtonScene extends BaseScene {
    // These are assigned in setup() - declared with 'declare' to avoid useDefineForClassFields overwrite
    declare private forceBlob: Blob
    declare private massBlob: Blob
    declare private particlesGraphics: Graphics
    declare private state: PhysicsState
    declare private forceSize: number
    declare private massSize: number
    declare private acceleration: number
    declare private startX: number
    declare private massStartX: number

    protected setup(): void {
        // Initialize primitive properties (must be done here, not as class property initializers)
        this.forceSize = 60
        this.massSize = 60
        this.acceleration = 5
        this.startX = 100
        this.massStartX = this.width / 2

        this.state = {
            phase: 'idle',
            phaseTime: 0,
            forceX: 100,
            forceSquash: 1,
            massX: this.massStartX,
            massVelocity: 0,
            legPhase: 0,
            bounceY: 0,
            massSquashX: 1,
            massSquashY: 1,
            impactFlash: 0,
            dustParticles: [],
        }

        // Create particles layer
        this.particlesGraphics = new Graphics()
        this.container.addChild(this.particlesGraphics)

        // Create force blob (공격적 역할)
        this.forceBlob = new Blob({
            size: this.forceSize,
            color: pixiColors.force,
            shape: 'circle',
            expression: 'happy',
        })
        this.forceBlob.setPosition(this.state.forceX, this.centerY)
        this.container.addChild(this.forceBlob)

        // Create mass blob (피해자 역할)
        this.massBlob = new Blob({
            size: this.massSize,
            color: pixiColors.mass,
            shape: 'square',
            expression: 'happy',
        })
        this.massBlob.setPosition(this.state.massX, this.centerY)
        this.container.addChild(this.massBlob)
    }

    protected onVariablesChange(): void {
        const mass = this.variables['m'] || 10
        const force = this.variables['F'] || 50
        this.acceleration = force / mass
        this.massSize = 50 + mass * 0.8
    }

    protected animate(ticker: Ticker): void {
        if (!this.state) {
            return
        }

        const deltaTime = ticker.deltaMS / 16.67
        const dt = deltaTime * 0.016
        this.state.phaseTime += dt

        this.updatePhysics(deltaTime)
        this.updateDustParticles(deltaTime)
        this.updateBlobs()
        this.drawParticles()
    }

    private updatePhysics(deltaTime: number): void {
        const state = this.state

        const idleDuration = 1.5
        const chargeDuration = 0.8
        const pushDuration = 0.3
        const runDuration = 2.5
        const resetDuration = 1.0

        switch (state.phase) {
            case 'idle':
                state.forceSquash = 1 + Math.sin(state.phaseTime * 3) * 0.05
                state.massSquashX = 1 + Math.sin(state.phaseTime * 2.5) * 0.03
                state.massSquashY = 1 + Math.cos(state.phaseTime * 2.5) * 0.03

                if (state.phaseTime > idleDuration) {
                    state.phase = 'charge'
                    state.phaseTime = 0
                }
                break

            case 'charge':
                const chargeProgress = state.phaseTime / chargeDuration
                state.forceSquash = 1 - chargeProgress * 0.3
                state.forceX = this.startX - chargeProgress * 30
                state.forceX += Math.sin(state.phaseTime * 30) * chargeProgress * 3

                if (state.phaseTime > chargeDuration) {
                    state.phase = 'push'
                    state.phaseTime = 0
                }
                break

            case 'push':
                const pushProgress = state.phaseTime / pushDuration
                state.forceSquash = 0.7 + pushProgress * 0.5
                state.forceX =
                    this.startX - 30 + pushProgress * (this.massStartX - this.startX - 20)

                if (pushProgress > 0.8 && state.impactFlash === 0) {
                    state.impactFlash = 1
                    state.massSquashX = 1.4
                    state.massSquashY = 0.7
                    state.massVelocity = this.acceleration * 0.5

                    for (let i = 0; i < 8; i++) {
                        state.dustParticles.push({
                            x: state.massX - this.massSize * 0.3,
                            y: this.centerY + this.massSize * 0.3,
                            life: 1,
                            vx: -Math.random() * 3 - 1,
                            vy: -Math.random() * 2,
                        })
                    }
                }

                if (state.phaseTime > pushDuration) {
                    state.phase = 'run'
                    state.phaseTime = 0
                    state.forceX = this.startX
                    state.forceSquash = 1
                }
                break

            case 'run':
                const runSpeed = Math.min(this.acceleration * 0.3, 8)
                state.massX += state.massVelocity * deltaTime
                state.massVelocity = lerp(state.massVelocity, runSpeed, 0.1)

                state.legPhase += deltaTime * 0.3 * (1 + runSpeed * 0.5)
                state.bounceY = Math.abs(Math.sin(state.legPhase)) * 8

                state.massSquashX = lerp(state.massSquashX, 1 + runSpeed * 0.02, 0.1)
                state.massSquashY = lerp(state.massSquashY, 1 - runSpeed * 0.01, 0.1)
                state.impactFlash = lerp(state.impactFlash, 0, 0.1)

                if (Math.sin(state.legPhase) > 0.8 && state.massX < this.width - 100) {
                    state.dustParticles.push({
                        x: state.massX - this.massSize * 0.3,
                        y: this.centerY + this.massSize * 0.35,
                        life: 0.5,
                        vx: -1 - Math.random(),
                        vy: -Math.random() * 0.5,
                    })
                }

                if (state.phaseTime > runDuration || state.massX > this.width + 50) {
                    state.phase = 'reset'
                    state.phaseTime = 0
                    state.massVelocity = 0
                }
                break

            case 'reset':
                state.massX = lerp(state.massX, this.massStartX, 0.05)
                state.massSquashX = lerp(state.massSquashX, 1, 0.1)
                state.massSquashY = lerp(state.massSquashY, 1, 0.1)
                state.bounceY = lerp(state.bounceY, 0, 0.1)
                state.legPhase = 0

                if (state.phaseTime > resetDuration) {
                    state.phase = 'idle'
                    state.phaseTime = 0
                    state.massX = this.massStartX
                }
                break
        }
    }

    private updateDustParticles(_deltaTime: number): void {
        this.state.dustParticles.forEach((p) => {
            p.x += p.vx
            p.y += p.vy
            p.vy += 0.1
            p.life -= 0.02
        })
        this.state.dustParticles = this.state.dustParticles.filter((p) => p.life > 0)
    }

    private drawParticles(): void {
        const g = this.particlesGraphics
        g.clear()

        this.state.dustParticles.forEach((p) => {
            g.circle(p.x, p.y, 3 + p.life * 2)
            g.fill({ color: 0xcccccc, alpha: p.life * 0.5 })
        })
    }

    private updateBlobs(): void {
        const state = this.state
        const mass = this.variables['m'] || 10
        const isRunning = state.phase === 'run'
        const isHeavy = mass > 50
        const isVeryHeavy = mass > 80

        let forceExpression: BlobExpression = 'happy'
        if (state.phase === 'charge') forceExpression = 'charge'
        else if (state.phase === 'push') forceExpression = 'effort'

        let massExpression: BlobExpression = 'happy'
        if (state.phase === 'push' && state.impactFlash > 0.5) {
            massExpression = 'surprised'
        } else if (isRunning) {
            if (isVeryHeavy) massExpression = 'struggle'
            else if (isHeavy) massExpression = 'effort'
            else massExpression = 'happy'
        }

        // Update force blob
        this.forceBlob.setPosition(state.forceX, this.centerY)
        this.forceBlob.updateOptions({
            expression: forceExpression,
            scaleX: state.forceSquash,
            scaleY: 2 - state.forceSquash,
            showSpeedLines: state.phase === 'push',
            speedDirection: 0,
        })

        // Update mass blob
        this.massBlob.setPosition(state.massX, this.centerY - state.bounceY)
        this.massBlob.updateOptions({
            size: this.massSize,
            expression: massExpression,
            scaleX: state.massSquashX,
            scaleY: state.massSquashY,
            showLegs: isRunning,
            legPhase: state.legPhase,
            showSpeedLines: isRunning && state.massVelocity > 3,
            speedDirection: Math.PI,
            showSweat: isRunning && isHeavy,
        })
    }
}
