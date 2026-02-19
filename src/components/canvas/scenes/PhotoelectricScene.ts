import { Ticker, Graphics, Text, TextStyle, BlurFilter } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobExpression } from '../Blob'
import { clamp } from '../../../utils/pixiHelpers'

interface Electron {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    size: number
    energy: number
}

interface Photon {
    x: number
    y: number
    phase: number
    absorbed: boolean
}

interface BlockedParticle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
}

export class PhotoelectricScene extends BaseScene {
    declare private metalBlob: Blob
    declare private metalGraphics: Graphics
    declare private lightGraphics: Graphics
    declare private electronGraphics: Graphics
    declare private glowGraphics: Graphics
    declare private barrierGraphics: Graphics
    declare private electrons: Electron[]
    declare private photons: Photon[]
    declare private blockedParticles: BlockedParticle[]
    declare private time: number
    declare private absorptionFlash: number
    declare private blurFilter: BlurFilter

    // Labels
    declare private statusLabel: Text

    protected setup(): void {
        this.electrons = []
        this.photons = []
        this.blockedParticles = []
        this.time = 0
        this.absorptionFlash = 0

        // Initialize photons
        for (let i = 0; i < 5; i++) {
            this.photons.push({
                x: -50 - i * 80,
                y: this.centerY - 20,
                phase: i * 0.8,
                absorbed: false,
            })
        }

        // Graphics layers
        this.glowGraphics = new Graphics()
        this.blurFilter = new BlurFilter({ strength: 20 })
        this.glowGraphics.filters = [this.blurFilter]
        this.container.addChild(this.glowGraphics)

        this.barrierGraphics = new Graphics()
        this.container.addChild(this.barrierGraphics)

        this.metalGraphics = new Graphics()
        this.container.addChild(this.metalGraphics)

        this.lightGraphics = new Graphics()
        this.container.addChild(this.lightGraphics)

        this.electronGraphics = new Graphics()
        this.container.addChild(this.electronGraphics)

        // Metal surface blob
        this.metalBlob = new Blob({
            size: 55,
            color: 0x7f8c9a,
            shape: 'einstein',
            expression: 'neutral',
            glowIntensity: 0,
        })
        this.metalBlob.setPosition(this.width * 0.55, this.centerY - 20)
        this.container.addChild(this.metalBlob)

        // Status label
        const labelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xffffff,
        })

        this.statusLabel = new Text({ text: '전자 방출!', style: labelStyle })
        this.container.addChild(this.statusLabel)
    }

    protected onVariablesChange(): void {
        // Variables will be updated in animate
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const dt = delta * 0.016
        this.time += dt

        const f = this.variables['f'] ?? 7 // ×10¹⁴ Hz
        const W = this.variables['W'] ?? 2.3 // eV

        // Calculate energies
        const h = 0.4136 // eV per 10¹⁴ Hz
        const hf = h * f
        const canEmit = hf > W
        const Ek = Math.max(0, hf - W)

        // Photon color based on frequency
        const photonColor = this.frequencyToColor(f)

        // Update photons
        this.updatePhotons(delta, canEmit, Ek, photonColor)
        this.updateElectrons(delta)
        this.updateBlockedParticles(delta)

        // Absorption flash decay
        this.absorptionFlash *= 0.92

        // Metal blob expression
        let expression: BlobExpression = 'neutral'
        if (canEmit && this.electrons.length > 0) {
            expression = 'excited'
        } else if (!canEmit && this.absorptionFlash > 0.2) {
            expression = 'struggle'
        }

        this.metalBlob.updateOptions({
            wobblePhase: this.time * 2,
            expression,
            glowIntensity: canEmit ? 0.3 + this.absorptionFlash * 0.4 : this.absorptionFlash * 0.2,
            glowColor: canEmit ? 0x4ecdc4 : 0xff6b6b,
        })

        // Draw all elements
        this.drawGlow(canEmit, photonColor)
        this.drawBarrier(canEmit, hf, W)
        this.drawMetal(canEmit)
        this.drawPhotons(photonColor, f)
        this.drawElectrons(canEmit)
        this.updateStatusLabel(canEmit)
    }

    private updatePhotons(delta: number, canEmit: boolean, Ek: number, photonColor: number): void {
        const metalX = this.width * 0.5
        const photonSpeed = 2.5 + delta * 0.5

        this.photons.forEach((photon) => {
            if (!photon.absorbed) {
                photon.x += photonSpeed * delta
                photon.phase += delta * 0.15

                // Check for metal collision
                if (photon.x >= metalX - 20) {
                    photon.absorbed = true
                    this.absorptionFlash = 1

                    if (canEmit) {
                        // Emit electron with energy proportional to Ek
                        const speed = 2 + Math.sqrt(Ek) * 2.5
                        const angle = (Math.random() - 0.5) * 0.6
                        this.electrons.push({
                            x: metalX + 30,
                            y: this.centerY - 20 + (Math.random() - 0.5) * 40,
                            vx: speed * Math.cos(angle),
                            vy: speed * Math.sin(angle) - 1,
                            life: 1,
                            size: 5 + Ek * 0.8,
                            energy: Ek,
                        })
                    } else {
                        // Create blocked particle effect
                        for (let i = 0; i < 5; i++) {
                            const angle = Math.PI + (Math.random() - 0.5) * 1.2
                            this.blockedParticles.push({
                                x: metalX - 10,
                                y: this.centerY - 20 + (Math.random() - 0.5) * 30,
                                vx: Math.cos(angle) * (1 + Math.random()),
                                vy: Math.sin(angle) * (1 + Math.random()),
                                life: 1,
                            })
                        }
                    }
                }
            }
        })

        // Reset absorbed photons
        this.photons.forEach((photon) => {
            if (photon.absorbed) {
                photon.x = -50 - Math.random() * 100
                photon.absorbed = false
            }
        })
    }

    private updateElectrons(delta: number): void {
        this.electrons.forEach((e) => {
            e.x += e.vx * delta * 2
            e.y += e.vy * delta * 2
            e.vy += 0.03 * delta
            e.life -= 0.012 * delta
        })
        this.electrons = this.electrons.filter((e) => e.life > 0 && e.x < this.width + 20)
    }

    private updateBlockedParticles(delta: number): void {
        this.blockedParticles.forEach((p) => {
            p.x += p.vx * delta
            p.y += p.vy * delta
            p.life -= 0.04 * delta
        })
        this.blockedParticles = this.blockedParticles.filter((p) => p.life > 0)
    }

    private frequencyToColor(f: number): number {
        // f: 4-12 × 10¹⁴ Hz
        // Map to visible spectrum colors
        const normalized = clamp((f - 4) / 8, 0, 1)

        if (normalized < 0.2) {
            return this.lerpColor(0xff3333, 0xff8800, normalized * 5) // Red to Orange
        } else if (normalized < 0.4) {
            return this.lerpColor(0xff8800, 0xffff00, (normalized - 0.2) * 5) // Orange to Yellow
        } else if (normalized < 0.6) {
            return this.lerpColor(0xffff00, 0x00ff88, (normalized - 0.4) * 5) // Yellow to Green
        } else if (normalized < 0.8) {
            return this.lerpColor(0x00ff88, 0x0088ff, (normalized - 0.6) * 5) // Green to Blue
        } else {
            return this.lerpColor(0x0088ff, 0xaa44ff, (normalized - 0.8) * 5) // Blue to Violet
        }
    }

    private lerpColor(c1: number, c2: number, t: number): number {
        t = clamp(t, 0, 1)
        const r1 = (c1 >> 16) & 0xff,
            g1 = (c1 >> 8) & 0xff,
            b1 = c1 & 0xff
        const r2 = (c2 >> 16) & 0xff,
            g2 = (c2 >> 8) & 0xff,
            b2 = c2 & 0xff
        const r = Math.round(r1 + (r2 - r1) * t)
        const g = Math.round(g1 + (g2 - g1) * t)
        const b = Math.round(b1 + (b2 - b1) * t)
        return (r << 16) + (g << 8) + b
    }

    private drawGlow(canEmit: boolean, photonColor: number): void {
        const g = this.glowGraphics
        g.clear()

        const metalX = this.width * 0.55
        const metalY = this.centerY - 20

        // Glow when absorbing photons
        if (this.absorptionFlash > 0.1) {
            const glowSize = 60 + this.absorptionFlash * 40
            g.circle(metalX, metalY, glowSize)
            g.fill({ color: canEmit ? 0x4ecdc4 : 0xff6b6b, alpha: this.absorptionFlash * 0.4 })
        }

        // Electron emission glow
        if (canEmit && this.electrons.length > 0) {
            g.circle(metalX + 30, metalY, 30)
            g.fill({ color: 0x4ecdc4, alpha: 0.2 })
        }
    }

    private drawBarrier(canEmit: boolean, hf: number, W: number): void {
        const g = this.barrierGraphics
        g.clear()

        const metalX = this.width * 0.5
        const barrierX = metalX + 5

        if (!canEmit) {
            // Draw energy barrier visualization
            const barrierHeight = 120
            const barrierY = this.centerY - 20 - barrierHeight / 2

            // Barrier wall effect
            for (let i = 0; i < 3; i++) {
                g.moveTo(barrierX + i * 3, barrierY)
                g.lineTo(barrierX + i * 3, barrierY + barrierHeight)
                g.stroke({ color: 0xff6b6b, width: 2, alpha: 0.3 + i * 0.2 })
            }

            // X mark when blocked
            if (this.absorptionFlash > 0.3) {
                const xSize = 15 * this.absorptionFlash
                const xX = barrierX - 25
                const xY = this.centerY - 20
                g.moveTo(xX - xSize, xY - xSize)
                g.lineTo(xX + xSize, xY + xSize)
                g.moveTo(xX + xSize, xY - xSize)
                g.lineTo(xX - xSize, xY + xSize)
                g.stroke({ color: 0xff6b6b, width: 4, alpha: this.absorptionFlash })
            }

            // Blocked particles
            this.blockedParticles.forEach((p) => {
                g.circle(p.x, p.y, 3 * p.life)
                g.fill({ color: 0xff6b6b, alpha: p.life * 0.6 })
            })
        }
    }

    private drawMetal(canEmit: boolean): void {
        const g = this.metalGraphics
        g.clear()

        const metalX = this.width * 0.5
        const plateHeight = 130
        const plateWidth = 30
        const topY = this.centerY - 20 - plateHeight / 2

        // Metal plate shadow
        g.roundRect(metalX + 4, topY + 4, plateWidth, plateHeight, 6)
        g.fill({ color: 0x000000, alpha: 0.3 })

        // Main plate
        g.roundRect(metalX, topY, plateWidth, plateHeight, 6)
        g.fill(0x5a6a7a)

        // Highlight
        g.roundRect(metalX, topY, 8, plateHeight, 3)
        g.fill(0x7a8a9a)

        // Surface electrons (bound)
        for (let i = 0; i < 4; i++) {
            const y = topY + 25 + i * 28
            const wobble = Math.sin(this.time * 4 + i) * 2
            g.circle(metalX + 10 + wobble, y, 4)
            g.fill({ color: 0x4ecdc4, alpha: 0.5 })
        }

        // Emission zone indicator
        if (canEmit) {
            g.roundRect(metalX + plateWidth - 2, topY + 20, 4, plateHeight - 40, 2)
            g.fill({ color: 0x4ecdc4, alpha: 0.3 + Math.sin(this.time * 5) * 0.2 })
        }
    }

    private drawPhotons(photonColor: number, f: number): void {
        const g = this.lightGraphics
        g.clear()

        // Light source
        const sourceX = 30
        const sourceY = this.centerY - 20

        // Source glow
        g.circle(sourceX, sourceY, 25)
        g.fill({ color: photonColor, alpha: 0.3 })
        g.circle(sourceX, sourceY, 15)
        g.fill({ color: photonColor, alpha: 0.5 })

        // Rays from source
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + this.time * 2
            const x1 = sourceX + Math.cos(angle) * 18
            const y1 = sourceY + Math.sin(angle) * 18
            const x2 = sourceX + Math.cos(angle) * 30
            const y2 = sourceY + Math.sin(angle) * 30
            g.moveTo(x1, y1)
            g.lineTo(x2, y2)
            g.stroke({ color: photonColor, width: 2.5, alpha: 0.6 })
        }

        // Draw photon wave packets
        this.photons.forEach((photon) => {
            if (photon.absorbed) return

            // Wave visualization - wavelength changes with frequency
            const waveLength = 30 - (f - 4) * 1.5 // Higher freq = shorter wavelength
            const amplitude = 10

            // Wave packet envelope
            g.moveTo(photon.x - 30, photon.y)
            for (let dx = -30; dx <= 30; dx += 2) {
                const envelope = Math.exp(-(dx * dx) / 250)
                const wave =
                    Math.sin((dx / waveLength) * Math.PI * 2 + photon.phase) * amplitude * envelope
                g.lineTo(photon.x + dx, photon.y + wave)
            }
            g.stroke({ color: photonColor, width: 2.5, alpha: 0.8 })

            // Photon core - size based on energy
            const coreSize = 6 + (f - 4) * 0.3
            g.circle(photon.x, photon.y, coreSize)
            g.fill({ color: photonColor, alpha: 0.9 })
            g.circle(photon.x, photon.y, coreSize * 0.5)
            g.fill({ color: 0xffffff, alpha: 0.7 })
        })
    }

    private drawElectrons(canEmit: boolean): void {
        const g = this.electronGraphics
        g.clear()

        this.electrons.forEach((e) => {
            // Energy-based trail
            const trailLength = e.vx * 8
            g.moveTo(e.x, e.y)
            g.lineTo(e.x - trailLength, e.y)
            g.stroke({ color: 0x4ecdc4, width: e.size * e.life * 0.6, alpha: e.life * 0.4 })

            // Outer glow based on energy
            const glowSize = e.size * 2 + e.energy * 2
            g.circle(e.x, e.y, glowSize)
            g.fill({ color: 0x4ecdc4, alpha: e.life * 0.2 })

            // Electron body
            g.circle(e.x, e.y, e.size * e.life)
            g.fill({ color: 0x4ecdc4, alpha: e.life * 0.9 })

            // Core highlight
            g.circle(e.x - 1, e.y - 1, e.size * 0.4 * e.life)
            g.fill({ color: 0xffffff, alpha: e.life * 0.8 })
        })
    }

    private updateStatusLabel(canEmit: boolean): void {
        if (canEmit) {
            this.statusLabel.text = '전자 방출!'
            this.statusLabel.style.fill = 0x4ecdc4
        } else {
            this.statusLabel.text = '에너지 부족'
            this.statusLabel.style.fill = 0xff6b6b
        }
        this.statusLabel.position.set(20, 20)
    }
}
