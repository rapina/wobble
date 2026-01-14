import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob } from '../Blob'

interface EnergyParticle {
    angle: number
    distance: number
    alpha: number
}

export class RotationalEnergyScene extends BaseScene {
    declare private graphics: Graphics
    declare private wheelBlob: Blob
    declare private rotation: number
    declare private energyParticles: EnergyParticle[]
    declare private time: number

    protected setup(): void {
        this.time = 0
        this.rotation = 0
        this.energyParticles = []

        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        this.wheelBlob = new Blob({
            size: 50,
            color: 0x3498db,
            shape: 'circle',
            expression: 'happy',
        })
        this.wheelBlob.setPosition(this.centerX, this.centerY - 20)
        this.container.addChild(this.wheelBlob)
    }

    protected onVariablesChange(): void {
        const omega = this.variables['ω'] || 10
        const E = this.variables['E'] || 100

        // Spawn energy particles when energy is high
        if (E > 500 && this.energyParticles.length < 20) {
            this.energyParticles.push({
                angle: Math.random() * Math.PI * 2,
                distance: 50 + Math.random() * 30,
                alpha: 1,
            })
        }
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const I = this.variables['I'] || 2
        const omega = this.variables['ω'] || 10
        const E = 0.5 * I * omega * omega

        // Rotate based on angular velocity
        this.rotation += omega * 0.03 * delta

        // Update blob
        const expression =
            omega > 40 ? 'dizzy' : omega > 20 ? 'excited' : omega > 10 ? 'happy' : 'neutral'
        const blobSize = 40 + I * 3

        this.wheelBlob.setPosition(this.centerX, this.centerY - 20)
        this.wheelBlob.updateOptions({
            size: blobSize,
            wobblePhase: this.rotation,
            expression,
        })

        // Update energy particles
        this.energyParticles.forEach((particle) => {
            particle.angle += omega * 0.02 * delta
            particle.distance += 0.5 * delta
            particle.alpha -= 0.01 * delta
        })
        this.energyParticles = this.energyParticles.filter((p) => p.alpha > 0)

        this.drawScene(I, omega, E)
    }

    private drawScene(I: number, omega: number, E: number): void {
        const g = this.graphics
        g.clear()

        const cx = this.centerX
        const cy = this.centerY - 20

        // Flywheel/disc visualization
        const wheelRadius = 50 + I * 5

        // Outer ring
        g.circle(cx, cy, wheelRadius)
        g.stroke({ color: 0x3498db, width: 8, alpha: 0.6 })

        // Spokes - draw all lines first, then all circles to avoid path issues
        const spokeCount = 6
        const spokeEnds: { x: number; y: number }[] = []

        for (let i = 0; i < spokeCount; i++) {
            const angle = (i / spokeCount) * Math.PI * 2 + this.rotation
            const endX = cx + Math.cos(angle) * wheelRadius
            const endY = cy + Math.sin(angle) * wheelRadius
            spokeEnds.push({ x: endX, y: endY })

            // Draw spoke line
            g.moveTo(cx, cy)
            g.lineTo(endX, endY)
        }
        g.stroke({ color: 0x3498db, width: 3, alpha: 0.5 })

        // Spoke end weights (drawn after all lines to avoid path connection)
        for (const end of spokeEnds) {
            g.circle(end.x, end.y, 6)
            g.fill({ color: 0x2980b9, alpha: 0.8 })
        }

        // Center hub
        g.circle(cx, cy, 15)
        g.fill({ color: 0x2c3e50, alpha: 0.9 })
        g.circle(cx, cy, 8)
        g.fill({ color: 0x3498db, alpha: 0.8 })

        // Rotation blur effect at high speed
        if (omega > 20) {
            const blurAlpha = Math.min((omega - 20) / 30, 0.4)
            g.circle(cx, cy, wheelRadius)
            g.fill({ color: 0x3498db, alpha: blurAlpha })
        }

        // Energy particles
        this.energyParticles.forEach((particle) => {
            const px = cx + Math.cos(particle.angle) * particle.distance
            const py = cy + Math.sin(particle.angle) * particle.distance
            g.circle(px, py, 4)
            g.fill({ color: 0xf1c40f, alpha: particle.alpha * 0.8 })
        })

        // Energy indicator
        this.drawEnergyMeter(g, E, omega)

        // RPM display
        this.drawRPMIndicator(g, omega)
    }

    private drawEnergyMeter(g: Graphics, E: number, omega: number): void {
        const meterX = this.centerX - 60
        const meterY = this.height - 40
        const meterWidth = 120
        const meterHeight = 16

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.fill({ color: 0x222222, alpha: 0.7 })

        // Fill
        const maxE = 3000
        const fillRatio = Math.min(E / maxE, 1)
        const fillColor = E > 2000 ? 0xe74c3c : E > 500 ? 0xf39c12 : 0x3498db

        if (fillRatio > 0) {
            g.roundRect(meterX, meterY, meterWidth * fillRatio, meterHeight, 5)
            g.fill({ color: fillColor, alpha: 0.85 })
        }

        // Border
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
    }

    private drawRPMIndicator(g: Graphics, omega: number): void {
        const rpm = (omega * 60) / (2 * Math.PI)
        const indicatorX = this.centerX + 80
        const indicatorY = this.centerY - 20
        const arcRadius = 30
        const startAngle = -Math.PI * 0.75

        // RPM arc background - move to arc start point first to avoid connecting lines
        const bgStartX = indicatorX + Math.cos(startAngle) * arcRadius
        const bgStartY = indicatorY + Math.sin(startAngle) * arcRadius
        g.moveTo(bgStartX, bgStartY)
        g.arc(indicatorX, indicatorY, arcRadius, startAngle, Math.PI * 0.75)
        g.stroke({ color: 0x333333, width: 6, alpha: 0.5 })

        // RPM arc fill - move to arc start point first
        const maxRPM = 500
        const rpmRatio = Math.min(rpm / maxRPM, 1)
        const arcEnd = startAngle + rpmRatio * Math.PI * 1.5

        if (rpmRatio > 0) {
            g.moveTo(bgStartX, bgStartY)
            g.arc(indicatorX, indicatorY, arcRadius, startAngle, arcEnd)
            g.stroke({
                color: rpm > 300 ? 0xe74c3c : rpm > 150 ? 0xf39c12 : 0x2ecc71,
                width: 6,
                alpha: 0.9,
            })
        }

        // Needle
        const needleAngle = startAngle + rpmRatio * Math.PI * 1.5
        g.moveTo(indicatorX, indicatorY)
        g.lineTo(
            indicatorX + Math.cos(needleAngle) * 25,
            indicatorY + Math.sin(needleAngle) * 25
        )
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.9 })

        // Center
        g.circle(indicatorX, indicatorY, 5)
        g.fill({ color: 0xffffff, alpha: 0.9 })
    }
}
