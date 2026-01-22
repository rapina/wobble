/**
 * WorkStation
 *
 * PixiJS graphics class representing a research station in the lab.
 * Each station displays a mini physics simulation:
 * - Gravity Lab: Orbital mechanics (planets orbiting)
 * - Accelerator: Particle ring (momentum)
 * - Collision Lab: Bouncing balls (elasticity)
 * - Thermodynamics Lab: Heat particles (temperature)
 *
 * Redesigned with larger simulation windows and better visual hierarchy.
 */

import { Container, Graphics, Text, TextStyle, Circle } from 'pixi.js'
import type { StationConfig, PhysicsProperty, SimulationType } from '@/types/lab'
import { SIMULATION_CONFIG, STATION_AFFORDANCES } from '@/config/labConfig'

// Station dimensions
const STATION_WIDTH = 110
const STATION_HEIGHT = 90
const SIM_WINDOW_WIDTH = 95
const SIM_WINDOW_HEIGHT = 55

// Physics property symbols
const PHYSICS_SYMBOLS: Record<PhysicsProperty, string> = {
    gravity: 'G',
    momentum: 'p',
    elasticity: 'e',
    thermodynamics: 'Q',
}

// Station short names
const STATION_NAMES: Record<PhysicsProperty, string> = {
    gravity: 'Gravity',
    momentum: 'Momentum',
    elasticity: 'Elasticity',
    thermodynamics: 'Thermo',
}

// Simulation particle state
interface SimParticle {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    color: number
    angle?: number
    orbitRadius?: number
    orbitSpeed?: number
    temperature?: number
}

export class WorkStation extends Container {
    private config: StationConfig
    private platformGraphics: Graphics
    private glowGraphics: Graphics
    private simulationGraphics: Graphics
    private overlayGraphics: Graphics
    private symbolText: Text
    private nameText: Text

    private _isActive = false
    private _progress = 0
    private _glowIntensity = 0
    private _pulsePhase = 0
    private _simTime = 0

    // Simulation state
    private simParticles: SimParticle[] = []

    constructor(config: StationConfig, label: string = '') {
        super()
        this.config = config

        // Set hit area for click detection (PixiJS v8 style)
        this.hitArea = new Circle(0, 0, 60)

        // Create glow layer (behind everything)
        this.glowGraphics = new Graphics()
        this.addChild(this.glowGraphics)

        // Create platform
        this.platformGraphics = new Graphics()
        this.addChild(this.platformGraphics)

        // Create simulation layer
        this.simulationGraphics = new Graphics()
        this.addChild(this.simulationGraphics)

        // Create overlay layer (for progress bar, etc)
        this.overlayGraphics = new Graphics()
        this.addChild(this.overlayGraphics)

        // Create physics symbol (top left corner of station)
        const symbolStyle = new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 20,
            fontWeight: 'bold',
            fontStyle: 'italic',
            fill: 0xffffff,
            align: 'center',
        })
        this.symbolText = new Text({
            text: config.formulaSymbol || PHYSICS_SYMBOLS[config.resource],
            style: symbolStyle,
        })
        this.symbolText.anchor.set(0.5, 0.5)
        this.symbolText.x = -STATION_WIDTH / 2 + 15
        this.symbolText.y = -STATION_HEIGHT / 2 + 15
        this.addChild(this.symbolText)

        // Create station name (bottom)
        const nameStyle = new TextStyle({
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 11,
            fontWeight: 'bold',
            fill: 0xaaaaaa,
            align: 'center',
        })
        this.nameText = new Text({
            text: label || STATION_NAMES[config.resource],
            style: nameStyle,
        })
        this.nameText.anchor.set(0.5, 0)
        this.nameText.y = STATION_HEIGHT / 2 + 8
        this.addChild(this.nameText)

        // Initialize simulation
        this.initializeSimulation()
        this.draw()
    }

    /**
     * Initialize simulation particles based on type
     */
    private initializeSimulation(): void {
        this.simParticles = []

        switch (this.config.simulation) {
            case 'orbital':
                this.initOrbitalSim()
                break
            case 'particle-accelerator':
                this.initAcceleratorSim()
                break
            case 'collision':
                this.initCollisionSim()
                break
            case 'heat-transfer':
                this.initHeatTransferSim()
                break
        }
    }

    private initOrbitalSim(): void {
        const cfg = SIMULATION_CONFIG.orbital
        for (let i = 0; i < cfg.planetCount; i++) {
            const orbitRadius =
                cfg.orbitRadius.min +
                ((cfg.orbitRadius.max - cfg.orbitRadius.min) * (i + 1)) / cfg.planetCount
            this.simParticles.push({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                radius: cfg.planetSize,
                color: i === 0 ? 0x5dade2 : 0xe74c3c,
                angle: (i * Math.PI * 2) / cfg.planetCount + Math.random() * 0.5,
                orbitRadius,
                orbitSpeed:
                    cfg.orbitSpeed.min +
                    Math.random() * (cfg.orbitSpeed.max - cfg.orbitSpeed.min),
            })
        }
    }

    private initAcceleratorSim(): void {
        const cfg = SIMULATION_CONFIG.particleAccelerator
        for (let i = 0; i < cfg.particleCount; i++) {
            const angle = (i / cfg.particleCount) * Math.PI * 2
            this.simParticles.push({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                radius: cfg.particleSize,
                color: 0x5dade2,
                angle,
                orbitRadius: cfg.ringRadius,
                orbitSpeed: cfg.particleSpeed,
            })
        }
    }

    private initCollisionSim(): void {
        const cfg = SIMULATION_CONFIG.collision
        for (let i = 0; i < cfg.ballCount; i++) {
            const angle = (i / cfg.ballCount) * Math.PI * 2
            this.simParticles.push({
                x: Math.cos(angle) * 20,
                y: Math.sin(angle) * 10,
                vx: Math.cos(angle + Math.PI) * cfg.initialSpeed,
                vy: Math.sin(angle + Math.PI) * cfg.initialSpeed * 0.5,
                radius: cfg.ballSize,
                color: i === 0 ? 0xe74c3c : 0xf39c12,
            })
        }
    }

    private initHeatTransferSim(): void {
        const cfg = SIMULATION_CONFIG.heatTransfer
        for (let i = 0; i < cfg.particleCount; i++) {
            const temperature = Math.random()
            const speed = cfg.minSpeed + temperature * (cfg.maxSpeed - cfg.minSpeed)
            const angle = Math.random() * Math.PI * 2
            this.simParticles.push({
                x: (Math.random() - 0.5) * cfg.areaSize,
                y: (Math.random() - 0.5) * cfg.areaSize * 0.6,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: cfg.particleSize,
                color: this.temperatureToColor(temperature),
                temperature,
            })
        }
    }

    private temperatureToColor(t: number): number {
        const r = Math.floor(255 * t)
        const b = Math.floor(255 * (1 - t))
        const g = Math.floor(80 * (1 - Math.abs(t - 0.5) * 2))
        return (r << 16) | (g << 8) | b
    }

    set isActive(value: boolean) {
        this._isActive = value
        this.draw()
    }

    get isActive(): boolean {
        return this._isActive
    }

    set progress(value: number) {
        this._progress = Math.max(0, Math.min(1, value))
    }

    get progress(): number {
        return this._progress
    }

    setLabel(text: string): void {
        this.nameText.text = text
    }

    get stationId(): string {
        return this.config.id
    }

    get resource(): PhysicsProperty {
        return this.config.resource
    }

    get color(): number {
        return this.config.color
    }

    update(deltaTime: number): void {
        this._pulsePhase += deltaTime * 3
        this._simTime += deltaTime

        if (this._isActive) {
            this._glowIntensity = Math.min(1, this._glowIntensity + deltaTime * 3)
        } else {
            this._glowIntensity = Math.max(0, this._glowIntensity - deltaTime * 2)
        }

        const simSpeed = this._isActive ? 1.0 : 0.4
        this.updateSimulation(deltaTime * simSpeed)

        this.drawGlow()
        this.drawSimulation()
        this.drawOverlay()
    }

    private updateSimulation(deltaTime: number): void {
        switch (this.config.simulation) {
            case 'orbital':
                this.updateOrbitalSim(deltaTime)
                break
            case 'particle-accelerator':
                this.updateAcceleratorSim(deltaTime)
                break
            case 'collision':
                this.updateCollisionSim(deltaTime)
                break
            case 'heat-transfer':
                this.updateHeatTransferSim(deltaTime)
                break
        }
    }

    private updateOrbitalSim(deltaTime: number): void {
        for (const p of this.simParticles) {
            if (p.angle !== undefined && p.orbitRadius && p.orbitSpeed) {
                p.angle += deltaTime * p.orbitSpeed
                p.x = Math.cos(p.angle) * p.orbitRadius
                p.y = Math.sin(p.angle) * p.orbitRadius * 0.5
            }
        }
    }

    private updateAcceleratorSim(deltaTime: number): void {
        for (const p of this.simParticles) {
            if (p.angle !== undefined && p.orbitRadius && p.orbitSpeed) {
                p.angle += deltaTime * p.orbitSpeed
                p.x = Math.cos(p.angle) * p.orbitRadius
                p.y = Math.sin(p.angle) * p.orbitRadius * 0.45
            }
        }
    }

    private updateCollisionSim(deltaTime: number): void {
        const cfg = SIMULATION_CONFIG.collision
        const halfW = cfg.bounceArea.width / 2
        const halfH = cfg.bounceArea.height / 2

        for (const p of this.simParticles) {
            p.x += p.vx * deltaTime * 30
            p.y += p.vy * deltaTime * 30

            if (p.x < -halfW || p.x > halfW) {
                p.vx *= -1
                p.x = Math.max(-halfW, Math.min(halfW, p.x))
            }
            if (p.y < -halfH || p.y > halfH) {
                p.vy *= -1
                p.y = Math.max(-halfH, Math.min(halfH, p.y))
            }
        }

        if (this.simParticles.length >= 2) {
            const p1 = this.simParticles[0]
            const p2 = this.simParticles[1]
            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const minDist = p1.radius + p2.radius

            if (dist < minDist && dist > 0) {
                const nx = dx / dist
                const ny = dy / dist
                const dvx = p1.vx - p2.vx
                const dvy = p1.vy - p2.vy
                const dvn = dvx * nx + dvy * ny

                if (dvn > 0) {
                    p1.vx -= dvn * nx
                    p1.vy -= dvn * ny
                    p2.vx += dvn * nx
                    p2.vy += dvn * ny

                    const overlap = minDist - dist
                    p1.x -= (overlap / 2) * nx
                    p1.y -= (overlap / 2) * ny
                    p2.x += (overlap / 2) * nx
                    p2.y += (overlap / 2) * ny
                }
            }
        }
    }

    private updateHeatTransferSim(deltaTime: number): void {
        const cfg = SIMULATION_CONFIG.heatTransfer
        const halfW = cfg.areaSize / 2
        const halfH = cfg.areaSize * 0.35

        for (const p of this.simParticles) {
            p.x += p.vx * deltaTime * 25
            p.y += p.vy * deltaTime * 25

            if (p.x < -halfW || p.x > halfW) {
                p.vx *= -1
                p.x = Math.max(-halfW, Math.min(halfW, p.x))
            }
            if (p.y < -halfH || p.y > halfH) {
                p.vy *= -1
                p.y = Math.max(-halfH, Math.min(halfH, p.y))
            }

            if (p.temperature !== undefined && Math.random() < 0.02) {
                p.temperature = Math.max(0, Math.min(1, p.temperature + (Math.random() - 0.5) * 0.15))
                p.color = this.temperatureToColor(p.temperature)
                const speed = cfg.minSpeed + p.temperature * (cfg.maxSpeed - cfg.minSpeed)
                const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
                if (currentSpeed > 0) {
                    const scale = speed / currentSpeed
                    p.vx *= scale
                    p.vy *= scale
                }
            }
        }
    }

    private draw(): void {
        this.drawPlatform()
        this.drawSimulation()
        this.drawGlow()
        this.drawOverlay()
    }

    private drawPlatform(): void {
        const g = this.platformGraphics
        g.clear()

        const halfW = STATION_WIDTH / 2
        const halfH = STATION_HEIGHT / 2

        // Shadow
        g.ellipse(0, halfH + 8, halfW + 5, 12)
        g.fill({ color: 0x000000, alpha: 0.35 })

        // Main body background
        g.roundRect(-halfW, -halfH, STATION_WIDTH, STATION_HEIGHT, 12)
        const baseColor = this._isActive ? this.config.color : 0x2d2d44
        g.fill({ color: baseColor, alpha: 0.85 })

        // Border
        g.roundRect(-halfW, -halfH, STATION_WIDTH, STATION_HEIGHT, 12)
        g.stroke({
            color: this._isActive ? 0xffffff : 0x4a4a6a,
            width: 2,
            alpha: this._isActive ? 0.8 : 0.4,
        })

        // Simulation window background (larger, centered)
        const simX = -SIM_WINDOW_WIDTH / 2
        const simY = -halfH + 8
        g.roundRect(simX, simY, SIM_WINDOW_WIDTH, SIM_WINDOW_HEIGHT, 8)
        g.fill({ color: 0x0d0d1a, alpha: 0.95 })

        // Simulation window border
        g.roundRect(simX, simY, SIM_WINDOW_WIDTH, SIM_WINDOW_HEIGHT, 8)
        g.stroke({
            color: this.config.color,
            width: 2,
            alpha: this._isActive ? 0.8 : 0.3,
        })

        // Inner glow on simulation window when active
        if (this._isActive) {
            g.roundRect(simX + 2, simY + 2, SIM_WINDOW_WIDTH - 4, SIM_WINDOW_HEIGHT - 4, 6)
            g.stroke({ color: this.config.color, width: 1, alpha: 0.3 })
        }

        // Progress bar background (below simulation)
        const progressY = simY + SIM_WINDOW_HEIGHT + 6
        g.roundRect(-halfW + 10, progressY, STATION_WIDTH - 20, 8, 4)
        g.fill({ color: 0x1a1a2e, alpha: 0.9 })

        // Update symbol color based on active state
        this.symbolText.style.fill = this._isActive ? 0xffffff : 0x888888
        this.symbolText.alpha = this._isActive ? 1 : 0.6

        // Update name color
        this.nameText.style.fill = this._isActive ? this.config.color : 0x666666
    }

    private drawSimulation(): void {
        const g = this.simulationGraphics
        g.clear()

        // Offset to center in simulation window
        const offsetY = -STATION_HEIGHT / 2 + 8 + SIM_WINDOW_HEIGHT / 2

        switch (this.config.simulation) {
            case 'orbital':
                this.drawOrbitalSim(g, 0, offsetY)
                break
            case 'particle-accelerator':
                this.drawAcceleratorSim(g, 0, offsetY)
                break
            case 'collision':
                this.drawCollisionSim(g, 0, offsetY)
                break
            case 'heat-transfer':
                this.drawHeatTransferSim(g, 0, offsetY)
                break
        }
    }

    private drawOrbitalSim(g: Graphics, ox: number, oy: number): void {
        const cfg = SIMULATION_CONFIG.orbital

        // Draw orbit paths
        for (const p of this.simParticles) {
            if (p.orbitRadius) {
                g.ellipse(ox, oy, p.orbitRadius, p.orbitRadius * 0.5)
                g.stroke({ color: 0x4a4a6a, width: 1, alpha: 0.25 })
            }
        }

        // Draw sun with glow
        g.circle(ox, oy, cfg.sunSize + 4)
        g.fill({ color: 0xffdd44, alpha: 0.2 })
        g.circle(ox, oy, cfg.sunSize)
        g.fill({ color: 0xffdd44, alpha: 1 })

        // Draw planets with shadow
        for (const p of this.simParticles) {
            // Shadow
            g.ellipse(ox + p.x + 2, oy + p.y + 2, p.radius, p.radius * 0.5)
            g.fill({ color: 0x000000, alpha: 0.3 })
            // Planet
            g.circle(ox + p.x, oy + p.y, p.radius)
            g.fill({ color: p.color, alpha: 1 })
            // Highlight
            g.circle(ox + p.x - p.radius * 0.3, oy + p.y - p.radius * 0.3, p.radius * 0.3)
            g.fill({ color: 0xffffff, alpha: 0.4 })
        }
    }

    private drawAcceleratorSim(g: Graphics, ox: number, oy: number): void {
        const cfg = SIMULATION_CONFIG.particleAccelerator

        // Draw ring with glow
        g.ellipse(ox, oy, cfg.ringRadius + 3, cfg.ringRadius * 0.45 + 2)
        g.stroke({ color: 0x3498db, width: 4, alpha: 0.15 })
        g.ellipse(ox, oy, cfg.ringRadius, cfg.ringRadius * 0.45)
        g.stroke({ color: 0x3498db, width: 2, alpha: 0.4 })

        // Draw particles with trails
        for (const p of this.simParticles) {
            if (p.angle !== undefined) {
                // Trail
                for (let i = 1; i <= cfg.trailLength; i++) {
                    const trailAngle = p.angle - i * 0.12
                    const tx = Math.cos(trailAngle) * (p.orbitRadius || cfg.ringRadius)
                    const ty = Math.sin(trailAngle) * (p.orbitRadius || cfg.ringRadius) * 0.45
                    const alpha = 0.4 * (1 - i / cfg.trailLength)
                    g.circle(ox + tx, oy + ty, p.radius * 0.5)
                    g.fill({ color: 0x5dade2, alpha })
                }
            }

            // Particle with glow
            g.circle(ox + p.x, oy + p.y, p.radius + 2)
            g.fill({ color: 0x5dade2, alpha: 0.4 })
            g.circle(ox + p.x, oy + p.y, p.radius)
            g.fill({ color: 0x85c1e9, alpha: 1 })
        }
    }

    private drawCollisionSim(g: Graphics, ox: number, oy: number): void {
        const cfg = SIMULATION_CONFIG.collision

        // Draw boundary (subtle)
        g.roundRect(
            ox - cfg.bounceArea.width / 2,
            oy - cfg.bounceArea.height / 2,
            cfg.bounceArea.width,
            cfg.bounceArea.height,
            4
        )
        g.stroke({ color: 0x4a4a6a, width: 1, alpha: 0.2 })

        // Draw balls
        for (const p of this.simParticles) {
            // Shadow
            g.ellipse(ox + p.x + 2, oy + p.y + 3, p.radius * 0.9, p.radius * 0.4)
            g.fill({ color: 0x000000, alpha: 0.3 })
            // Ball
            g.circle(ox + p.x, oy + p.y, p.radius)
            g.fill({ color: p.color, alpha: 1 })
            // Highlight
            g.circle(ox + p.x - p.radius * 0.3, oy + p.y - p.radius * 0.3, p.radius * 0.35)
            g.fill({ color: 0xffffff, alpha: 0.5 })
        }
    }

    private drawHeatTransferSim(g: Graphics, ox: number, oy: number): void {
        // Draw particles
        for (const p of this.simParticles) {
            // Glow based on temperature
            if (p.temperature !== undefined && p.temperature > 0.4) {
                g.circle(ox + p.x, oy + p.y, p.radius + 3)
                g.fill({ color: p.color, alpha: (p.temperature - 0.4) * 0.5 })
            }
            // Particle
            g.circle(ox + p.x, oy + p.y, p.radius)
            g.fill({ color: p.color, alpha: 0.9 })
        }
    }

    private drawOverlay(): void {
        const g = this.overlayGraphics
        g.clear()

        if (this._progress > 0 && this._isActive) {
            const halfW = STATION_WIDTH / 2
            const progressY = -STATION_HEIGHT / 2 + 8 + SIM_WINDOW_HEIGHT + 6
            const progressWidth = (STATION_WIDTH - 20) * this._progress

            // Progress bar fill
            g.roundRect(-halfW + 10, progressY, progressWidth, 8, 4)
            g.fill({ color: this.config.color, alpha: 0.9 })

            // Progress bar shine
            g.roundRect(-halfW + 10, progressY, progressWidth, 4, 2)
            g.fill({ color: 0xffffff, alpha: 0.2 })
        }
    }

    private drawGlow(): void {
        const g = this.glowGraphics
        g.clear()

        if (this._glowIntensity <= 0) return

        const pulse = 0.8 + Math.sin(this._pulsePhase) * 0.2

        // Outer glow
        g.roundRect(
            -STATION_WIDTH / 2 - 15,
            -STATION_HEIGHT / 2 - 15,
            STATION_WIDTH + 30,
            STATION_HEIGHT + 30,
            20
        )
        g.fill({ color: this.config.color, alpha: this._glowIntensity * 0.12 * pulse })

        // Inner glow
        g.roundRect(
            -STATION_WIDTH / 2 - 8,
            -STATION_HEIGHT / 2 - 8,
            STATION_WIDTH + 16,
            STATION_HEIGHT + 16,
            15
        )
        g.fill({ color: this.config.color, alpha: this._glowIntensity * 0.18 * pulse })
    }

    getWorkerPosition(): { x: number; y: number } {
        const affordance = STATION_AFFORDANCES[this.config.id]
        return {
            x: this.x + (affordance?.workerOffset.x || 0),
            y: this.y + (affordance?.workerOffset.y || 45),
        }
    }
}
