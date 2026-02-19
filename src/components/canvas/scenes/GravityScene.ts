import { Ticker, Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobShape } from '../Blob'
import { pixiColors } from '../../../utils/pixiHelpers'

type Phase = 'falling' | 'impact' | 'rising' | 'apex'

export class GravityScene extends BaseScene {
    declare private planetBlob: Blob
    declare private fallingBlob: Blob
    declare private fieldGraphics: Graphics
    declare private uiGraphics: Graphics
    declare private trailGraphics: Graphics

    declare private blobY: number
    declare private velocity: number
    declare private phase: Phase
    declare private time: number
    declare private impactTimer: number
    declare private gravity: number
    declare private startY: number
    declare private groundY: number
    declare private trails: { x: number; y: number; life: number }[]

    protected setup(): void {
        this.time = 0
        this.impactTimer = 0
        this.gravity = 0.2
        this.velocity = 0
        this.phase = 'falling'
        this.trails = []

        this.startY = 60
        this.groundY = this.height - 90
        this.blobY = this.startY

        // Trail graphics
        this.trailGraphics = new Graphics()
        this.container.addChild(this.trailGraphics)

        // Field visualization
        this.fieldGraphics = new Graphics()
        this.container.addChild(this.fieldGraphics)

        // UI
        this.uiGraphics = new Graphics()
        this.container.addChild(this.uiGraphics)

        // Planet (large mass at bottom - 공격자/강한 역할)
        this.planetBlob = new Blob({
            size: 120,
            color: 0x3498db,
            shape: 'circle',
            expression: 'happy',
        })
        this.planetBlob.setPosition(this.centerX, this.groundY + 30)
        this.container.addChild(this.planetBlob)

        // Falling object (피해자 - 떨어지는 역할)
        this.fallingBlob = new Blob({
            size: 40,
            color: 0xe74c3c,
            shape: 'diamond',
            expression: 'happy',
        })
        this.container.addChild(this.fallingBlob)
    }

    protected onVariablesChange(): void {
        const m1 = this.variables['m1'] || 100 // Planet mass
        const m2 = this.variables['m2'] || 50 // Falling object mass
        const r = this.variables['r'] || 1 // Distance factor

        // Planet size based on mass
        this.planetBlob.updateOptions({ size: 80 + m1 * 0.5 })

        // Falling blob size
        this.fallingBlob.updateOptions({ size: 25 + m2 * 0.3 })

        // Gravity strength: g = G * M / r^2 (simplified)
        // Larger planet mass = stronger gravity
        // Larger distance = weaker gravity
        this.gravity = (m1 * 0.003) / (r * r)

        // Adjust ground position based on planet size
        const planetSize = 80 + m1 * 0.5
        this.groundY = this.height - 50 - planetSize * 0.4
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        const m1 = this.variables['m1'] || 100
        const m2 = this.variables['m2'] || 50

        this.updatePhysics(delta)
        this.updateTrails(delta)
        this.drawField(m1)
        this.drawTrails()
        this.updateBlobs(m1, m2)
        this.drawUI(m1)
    }

    private updatePhysics(delta: number): void {
        const planetSize = 80 + (this.variables['m1'] || 100) * 0.5
        const blobSize = 25 + (this.variables['m2'] || 50) * 0.3
        const impactY = this.groundY - blobSize / 2

        switch (this.phase) {
            case 'falling':
                // Apply gravity - accelerate downward
                this.velocity += this.gravity * delta
                this.blobY += this.velocity * delta

                // Add motion trail
                if (this.velocity > 2 && Math.random() < 0.4) {
                    this.trails.push({
                        x: this.centerX + (Math.random() - 0.5) * 10,
                        y: this.blobY - 20,
                        life: 1,
                    })
                }

                // Check for impact
                if (this.blobY >= impactY) {
                    this.blobY = impactY
                    this.phase = 'impact'
                    this.impactTimer = 1
                    // Bounce with energy loss
                    this.velocity = -this.velocity * 0.6
                }
                break

            case 'impact':
                this.impactTimer -= 0.15 * delta
                if (this.impactTimer <= 0) {
                    this.phase = 'rising'
                }
                break

            case 'rising':
                // Still affected by gravity while rising
                this.velocity += this.gravity * delta
                this.blobY += this.velocity * delta

                // Check if reached apex (velocity becomes positive = starting to fall)
                if (this.velocity >= 0) {
                    this.phase = 'apex'
                }
                break

            case 'apex':
                // Brief pause at apex, then reset
                this.velocity += this.gravity * delta
                this.blobY += this.velocity * delta

                // Reset when too low or just continue falling
                if (this.blobY >= impactY) {
                    this.blobY = impactY
                    // Reset to top after a few bounces
                    if (Math.abs(this.velocity) < 2) {
                        this.blobY = this.startY
                        this.velocity = 0
                        this.phase = 'falling'
                    } else {
                        this.velocity = -this.velocity * 0.6
                        this.phase = 'rising'
                    }
                }
                break
        }
    }

    private updateTrails(delta: number): void {
        this.trails.forEach((t) => {
            t.life -= 0.05 * delta
        })
        this.trails = this.trails.filter((t) => t.life > 0)
    }

    private updateBlobs(m1: number, m2: number): void {
        const speed = Math.abs(this.velocity)
        const blobSize = 25 + m2 * 0.3

        // Falling blob
        let expr: 'happy' | 'excited' | 'surprised' | 'worried' = 'happy'
        if (this.phase === 'impact') {
            expr = 'surprised'
        } else if (speed > 8) {
            expr = 'worried'
        } else if (speed > 4) {
            expr = 'excited'
        }

        // Stretch based on velocity
        const stretchY = 1 + speed * 0.02
        const stretchX = 1 / Math.sqrt(stretchY)

        // Squash on impact
        let finalStretchX = stretchX
        let finalStretchY = stretchY
        if (this.phase === 'impact') {
            finalStretchX = 1 + this.impactTimer * 0.3
            finalStretchY = 1 - this.impactTimer * 0.2
        }

        this.fallingBlob.setPosition(this.centerX, this.blobY)
        this.fallingBlob.updateOptions({
            wobblePhase: this.time * 3,
            scaleX: finalStretchX,
            scaleY: finalStretchY,
            expression: expr,
        })

        // Planet blob
        const planetExpr = this.phase === 'impact' ? 'surprised' : 'happy'
        const planetSize = 80 + m1 * 0.5

        this.planetBlob.setPosition(this.centerX, this.groundY + planetSize * 0.3)
        this.planetBlob.updateOptions({
            wobblePhase: this.time * 0.5,
            expression: planetExpr,
            // Slight squash when impacted
            scaleY: this.phase === 'impact' ? 1 - this.impactTimer * 0.05 : 1,
            scaleX: this.phase === 'impact' ? 1 + this.impactTimer * 0.03 : 1,
        })
    }

    private drawField(m1: number): void {
        const g = this.fieldGraphics
        g.clear()

        // Draw gravity field lines pointing downward
        const numLines = 7
        const fieldWidth = 200
        const startX = this.centerX - fieldWidth / 2

        // Field intensity based on gravity
        const intensity = Math.min(this.gravity / 0.5, 1)

        for (let i = 0; i < numLines; i++) {
            const x = startX + (i / (numLines - 1)) * fieldWidth
            const lineLength = 30 + intensity * 40

            // Animated downward arrows
            const offset = (this.time * 3 + i * 0.3) % 1

            for (let j = 0; j < 3; j++) {
                const yBase = 30 + j * 60
                const y = yBase + offset * 60
                const alpha = (0.2 + intensity * 0.3) * (1 - offset)

                // Arrow line
                g.moveTo(x, y)
                g.lineTo(x, y + 15)
                g.stroke({ color: 0xf39c12, width: 2, alpha })

                // Arrow head
                g.moveTo(x, y + 15)
                g.lineTo(x - 4, y + 10)
                g.moveTo(x, y + 15)
                g.lineTo(x + 4, y + 10)
                g.stroke({ color: 0xf39c12, width: 2, alpha })
            }
        }

        // Gravity strength indicator (big G arrow on the side)
        const arrowX = 40
        const arrowStartY = 80
        const arrowLength = 40 + intensity * 60

        g.moveTo(arrowX, arrowStartY)
        g.lineTo(arrowX, arrowStartY + arrowLength)
        g.stroke({ color: 0xf39c12, width: 3 + intensity * 3 })

        // Arrow head
        g.moveTo(arrowX, arrowStartY + arrowLength)
        g.lineTo(arrowX - 6, arrowStartY + arrowLength - 10)
        g.lineTo(arrowX + 6, arrowStartY + arrowLength - 10)
        g.closePath()
        g.fill(0xf39c12)
    }

    private drawTrails(): void {
        const g = this.trailGraphics
        g.clear()

        this.trails.forEach((t) => {
            g.circle(t.x, t.y, 3 * t.life)
            g.fill({ color: 0xe74c3c, alpha: t.life * 0.5 })
        })

        // Impact effect
        if (this.impactTimer > 0) {
            const impactY = this.groundY - (25 + (this.variables['m2'] || 50) * 0.3) / 2
            const radius = (1 - this.impactTimer) * 40 + 10

            g.circle(this.centerX, impactY, radius)
            g.stroke({ color: 0xffffff, width: 2, alpha: this.impactTimer * 0.6 })

            // Dust particles
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI + Math.PI
                const dist = radius * 0.8
                const px = this.centerX + Math.cos(angle) * dist
                const py = impactY + Math.sin(angle) * dist * 0.5

                g.circle(px, py, 3)
                g.fill({ color: 0xcccccc, alpha: this.impactTimer * 0.5 })
            }
        }
    }

    private drawUI(m1: number): void {
        const g = this.uiGraphics
        g.clear()

        const barX = this.width - 130
        const barWidth = 110
        const barHeight = 14

        // Velocity bar
        const velBarY = 20
        g.roundRect(barX, velBarY, barWidth, barHeight, 4)
        g.fill({ color: 0x333333 })
        g.stroke({ color: 0x555555, width: 1 })

        const maxVel = 15
        const velRatio = Math.min(Math.abs(this.velocity) / maxVel, 1)
        const velFill = velRatio * (barWidth - 4)

        if (velFill > 0) {
            g.roundRect(barX + 2, velBarY + 2, velFill, barHeight - 4, 3)
            g.fill(0xe74c3c)
        }

        g.circle(barX - 10, velBarY + barHeight / 2, 4)
        g.fill(0xe74c3c)

        // Gravity strength bar
        const gravBarY = 45
        g.roundRect(barX, gravBarY, barWidth, barHeight, 4)
        g.fill({ color: 0x333333 })
        g.stroke({ color: 0x555555, width: 1 })

        const maxGrav = 0.6
        const gravRatio = Math.min(this.gravity / maxGrav, 1)
        const gravFill = gravRatio * (barWidth - 4)

        if (gravFill > 0) {
            g.roundRect(barX + 2, gravBarY + 2, gravFill, barHeight - 4, 3)
            g.fill(0xf39c12)
        }

        g.circle(barX - 10, gravBarY + barHeight / 2, 4)
        g.fill(0xf39c12)

        // Height indicator
        const heightBarX = this.width - 25
        const heightBarTop = 80
        const heightBarHeight = this.groundY - heightBarTop - 20

        g.roundRect(heightBarX - 4, heightBarTop, 8, heightBarHeight, 4)
        g.fill({ color: 0x333333 })
        g.stroke({ color: 0x555555, width: 1 })

        // Current height marker
        const heightRatio = 1 - (this.blobY - this.startY) / (this.groundY - this.startY)
        const markerY = heightBarTop + (1 - heightRatio) * heightBarHeight

        g.circle(heightBarX, markerY, 6)
        g.fill(0x3498db)
    }
}
