import { Ticker, Graphics, Text, TextStyle } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { Blob, BlobShape } from '../Blob'

const SHAPES: BlobShape[] = ['circle', 'square']

interface GasBlob {
    blob: Blob
    x: number
    y: number
    vx: number
    vy: number
}

export class IdealGasScene extends BaseScene {
    declare private containerGraphics: Graphics
    declare private uiGraphics: Graphics
    declare private scaleGraphics: Graphics
    declare private gasBlobs: GasBlob[]
    declare private containerWidth: number
    declare private maxContainerHeight: number
    declare private containerX: number
    declare private containerBottomY: number
    declare private temperature: number
    declare private pressure: number
    declare private wallHits: number
    declare private time: number
    declare private pistonY: number
    declare private targetPistonY: number
    declare private volumeRatio: number
    declare private volumeText: Text
    declare private prevVolumeRatio: number
    declare private volumeChangeFlash: number

    protected setup(): void {
        this.gasBlobs = []
        this.temperature = 300
        this.pressure = 0
        this.wallHits = 0
        this.time = 0
        this.volumeRatio = 0.5
        this.prevVolumeRatio = 0.5
        this.volumeChangeFlash = 0

        // Container dimensions - larger and bottom-anchored
        this.containerWidth = 200
        this.maxContainerHeight = 280
        this.containerX = this.centerX - this.containerWidth / 2
        this.containerBottomY = this.height - 60
        this.pistonY = this.containerBottomY - this.maxContainerHeight * 0.5
        this.targetPistonY = this.pistonY

        // Scale graphics (behind container)
        this.scaleGraphics = new Graphics()
        this.container.addChild(this.scaleGraphics)

        // Container graphics
        this.containerGraphics = new Graphics()
        this.container.addChild(this.containerGraphics)

        // Create gas molecule blobs
        this.createGasBlobs(8)

        // UI graphics (on top)
        this.uiGraphics = new Graphics()
        this.container.addChild(this.uiGraphics)

        // Volume text
        const style = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xffffff,
        })
        this.volumeText = new Text({ text: '50 L', style })
        this.volumeText.anchor.set(0.5, 0.5)
        this.volumeText.x = this.containerX + this.containerWidth + 45
        this.volumeText.y = this.centerY
        this.container.addChild(this.volumeText)
    }

    private createGasBlobs(count: number): void {
        // Clear existing blobs
        this.gasBlobs.forEach((gb) => {
            this.container.removeChild(gb.blob)
        })
        this.gasBlobs = []

        const speed = Math.sqrt(this.temperature) * 0.15
        const colors = [0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xdfe6e9]

        // Calculate actual container bounds
        const innerLeft = this.containerX + 20
        const innerRight = this.containerX + this.containerWidth - 20
        const currentHeight = this.maxContainerHeight * this.volumeRatio
        const innerTop = this.containerBottomY - currentHeight + 40
        const innerBottom = this.containerBottomY - 20

        for (let i = 0; i < count; i++) {
            const blob = new Blob({
                size: 24,
                color: colors[i % colors.length],
                shape: SHAPES[i % SHAPES.length],
                expression: 'happy',
            })

            const x = innerLeft + Math.random() * (innerRight - innerLeft)
            const y = innerTop + Math.random() * Math.max(10, innerBottom - innerTop)

            blob.setPosition(x, y)
            this.container.addChild(blob)

            this.gasBlobs.push({
                blob,
                x,
                y,
                vx: (Math.random() - 0.5) * speed * 2,
                vy: (Math.random() - 0.5) * speed * 2,
            })
        }
    }

    protected onVariablesChange(): void {
        const n = this.variables['n'] || 1
        this.temperature = this.variables['T'] || 300
        const volume = this.variables['V'] || 50

        // Normalize volume: 10-100L maps to 0.15-1.0 ratio
        this.prevVolumeRatio = this.volumeRatio
        this.volumeRatio = 0.15 + ((volume - 10) / 90) * 0.85

        // Flash effect when volume changes significantly
        if (Math.abs(this.volumeRatio - this.prevVolumeRatio) > 0.01) {
            this.volumeChangeFlash = 1
        }

        // Calculate piston position (from bottom)
        const currentHeight = this.maxContainerHeight * this.volumeRatio
        this.targetPistonY = this.containerBottomY - currentHeight

        // Update volume text
        this.volumeText.text = `${Math.round(volume)} L`

        // Adjust number of particles based on n
        const targetCount = Math.max(3, Math.min(36, Math.round(n * 3)))
        if (targetCount !== this.gasBlobs.length) {
            this.createGasBlobs(targetCount)
        }
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        this.time += delta * 0.02

        // Decay volume change flash
        this.volumeChangeFlash *= 0.92

        // Smoothly move piston
        const pistonDiff = this.targetPistonY - this.pistonY
        this.pistonY += pistonDiff * 0.12 * delta

        const speed = Math.sqrt(this.temperature) * 0.15
        const currentHeight = this.containerBottomY - this.pistonY

        // Track wall hits for pressure
        let frameHits = 0

        // Current container bounds
        const blobRadius = 12
        const left = this.containerX + blobRadius + 8
        const right = this.containerX + this.containerWidth - blobRadius - 8
        const top = this.pistonY + blobRadius + 20
        const bottom = this.containerBottomY - blobRadius - 8

        this.gasBlobs.forEach((gb, index) => {
            // Update position
            gb.x += gb.vx * delta
            gb.y += gb.vy * delta

            // Wall collisions
            if (gb.x < left) {
                gb.x = left
                gb.vx *= -1
                frameHits++
            }
            if (gb.x > right) {
                gb.x = right
                gb.vx *= -1
                frameHits++
            }
            if (gb.y < top) {
                gb.y = top
                gb.vy *= -1
                frameHits += 2 // Piston hits count more
            }
            if (gb.y > bottom) {
                gb.y = bottom
                gb.vy *= -1
                frameHits++
            }

            // Blob-blob collisions (simple)
            this.gasBlobs.forEach((other, otherIndex) => {
                if (index >= otherIndex) return
                const dx = other.x - gb.x
                const dy = other.y - gb.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const minDist = 24

                if (dist < minDist && dist > 0) {
                    // Push apart
                    const nx = dx / dist
                    const ny = dy / dist
                    const overlap = minDist - dist

                    gb.x -= nx * overlap * 0.5
                    gb.y -= ny * overlap * 0.5
                    other.x += nx * overlap * 0.5
                    other.y += ny * overlap * 0.5

                    // Exchange velocities
                    const tempVx = gb.vx
                    const tempVy = gb.vy
                    gb.vx = other.vx
                    gb.vy = other.vy
                    other.vx = tempVx
                    other.vy = tempVy
                }
            })

            // Maintain temperature-based speed
            const currentSpeed = Math.sqrt(gb.vx * gb.vx + gb.vy * gb.vy)
            if (currentSpeed > 0.1) {
                const targetSpeed = speed * (0.8 + Math.random() * 0.4)
                const scale = targetSpeed / currentSpeed
                gb.vx = gb.vx * 0.95 + gb.vx * scale * 0.05
                gb.vy = gb.vy * 0.95 + gb.vy * scale * 0.05
            } else {
                gb.vx = (Math.random() - 0.5) * speed
                gb.vy = (Math.random() - 0.5) * speed
            }

            // Update blob position and appearance
            gb.blob.setPosition(gb.x, gb.y)

            const blobSpeed = Math.sqrt(gb.vx * gb.vx + gb.vy * gb.vy)
            const tempRatio = Math.min(this.temperature / 500, 1)

            // Expression based on temperature
            let expression: 'happy' | 'excited' | 'hot' | 'neutral' = 'happy'
            if (tempRatio > 0.7) {
                expression = 'hot'
            } else if (tempRatio > 0.4) {
                expression = 'excited'
            }

            // Color shifts with temperature
            const baseColor = [0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xdfe6e9][index % 5]
            const hotColor = this.lerpColor(baseColor, 0xff6b6b, tempRatio * 0.6)

            gb.blob.updateOptions({
                wobblePhase: this.time * (2 + tempRatio * 3) + index,
                expression,
                color: hotColor,
                scaleX: 1 + blobSpeed * 0.02,
                scaleY: 1 - blobSpeed * 0.01,
            })
        })

        // Calculate pressure
        this.wallHits = this.wallHits * 0.9 + frameHits * 0.1
        this.pressure =
            (this.wallHits * this.gasBlobs.length * this.temperature) / (currentHeight * 10)

        // Update volume text position
        const midY = this.pistonY + (this.containerBottomY - this.pistonY) / 2
        this.volumeText.y = midY

        this.drawScale()
        this.drawContainer()
        this.drawUI()
    }

    private drawScale(): void {
        const g = this.scaleGraphics
        g.clear()

        const scaleX = this.containerX - 35
        const minY = this.containerBottomY - this.maxContainerHeight
        const maxY = this.containerBottomY

        // Background ruler
        g.roundRect(scaleX - 8, minY - 10, 20, this.maxContainerHeight + 20, 4)
        g.fill({ color: 0x2a2a3a, alpha: 0.8 })

        // Scale markings (10 divisions)
        for (let i = 0; i <= 10; i++) {
            const y = maxY - (this.maxContainerHeight * i) / 10
            const isMain = i % 2 === 0
            const lineWidth = isMain ? 12 : 6

            g.moveTo(scaleX - lineWidth / 2, y)
            g.lineTo(scaleX + lineWidth / 2, y)
            g.stroke({ color: 0x888888, width: isMain ? 2 : 1 })
        }

        // Current volume indicator (arrow pointing to piston level)
        const currentY = this.pistonY
        const arrowSize = 8

        // Pulsing effect based on volume change
        const pulse = 1 + this.volumeChangeFlash * 0.3
        const arrowColor = this.lerpColor(0x4ecdc4, 0xffd700, this.volumeChangeFlash)

        g.moveTo(scaleX + 15, currentY)
        g.lineTo(scaleX + 15 + arrowSize * pulse, currentY - arrowSize * 0.6 * pulse)
        g.lineTo(scaleX + 15 + arrowSize * pulse, currentY + arrowSize * 0.6 * pulse)
        g.closePath()
        g.fill({ color: arrowColor })

        // Volume zone highlighting
        const zoneAlpha = 0.15 + this.volumeChangeFlash * 0.2
        g.rect(
            this.containerX,
            this.pistonY,
            this.containerWidth,
            this.containerBottomY - this.pistonY
        )
        g.fill({ color: 0x4ecdc4, alpha: zoneAlpha })
    }

    private drawContainer(): void {
        const g = this.containerGraphics
        g.clear()

        const effectiveTop = this.pistonY

        // Container walls with depth effect
        // Back wall (darker)
        g.rect(
            this.containerX + 4,
            effectiveTop + 4,
            this.containerWidth - 8,
            this.containerBottomY - effectiveTop - 8
        )
        g.fill({ color: 0x1a1a2a, alpha: 0.5 })

        // Container walls (left, right, bottom) - thicker
        const wallThickness = 8

        // Left wall
        g.rect(
            this.containerX - wallThickness,
            effectiveTop,
            wallThickness,
            this.containerBottomY - effectiveTop + wallThickness
        )
        g.fill(0x555566)

        // Right wall
        g.rect(
            this.containerX + this.containerWidth,
            effectiveTop,
            wallThickness,
            this.containerBottomY - effectiveTop + wallThickness
        )
        g.fill(0x555566)

        // Bottom wall
        g.rect(
            this.containerX - wallThickness,
            this.containerBottomY,
            this.containerWidth + wallThickness * 2,
            wallThickness
        )
        g.fill(0x555566)

        // Wall highlights
        g.rect(
            this.containerX - wallThickness,
            effectiveTop,
            2,
            this.containerBottomY - effectiveTop + wallThickness
        )
        g.fill({ color: 0x888899 })

        // Piston (top, movable)
        const pistonPulse = Math.sin(this.time * 5) * this.pressure * 0.2
        const pistonHeight = 18

        // Piston shadow
        g.roundRect(
            this.containerX - 8,
            effectiveTop - 2 + pistonPulse,
            this.containerWidth + 16,
            pistonHeight + 4,
            4
        )
        g.fill({ color: 0x000000, alpha: 0.3 })

        // Piston body
        g.roundRect(
            this.containerX - 6,
            effectiveTop - 4 + pistonPulse,
            this.containerWidth + 12,
            pistonHeight,
            4
        )
        g.fill(0x777788)

        // Piston highlight
        g.roundRect(
            this.containerX - 4,
            effectiveTop - 2 + pistonPulse,
            this.containerWidth + 8,
            4,
            2
        )
        g.fill({ color: 0x9999aa })

        // Piston handle
        const handleWidth = 40
        const handleHeight = 30
        g.roundRect(
            this.centerX - handleWidth / 2,
            effectiveTop - handleHeight - 4 + pistonPulse,
            handleWidth,
            handleHeight,
            6
        )
        g.fill(0x666677)
        g.stroke({ color: 0x555566, width: 2 })

        // Handle grip lines
        for (let i = 0; i < 3; i++) {
            const ly = effectiveTop - handleHeight + 8 + i * 8 + pistonPulse
            g.moveTo(this.centerX - 12, ly)
            g.lineTo(this.centerX + 12, ly)
            g.stroke({ color: 0x555566, width: 2 })
        }

        // Volume change indicator arrows on sides
        if (this.volumeChangeFlash > 0.1) {
            const arrowAlpha = this.volumeChangeFlash * 0.8
            const expanding = this.volumeRatio > this.prevVolumeRatio
            const arrowY = this.pistonY + 30

            // Left arrow
            if (expanding) {
                // Down arrows when expanding
                this.drawArrow(g, this.containerX - 25, arrowY, 'down', arrowAlpha)
                this.drawArrow(
                    g,
                    this.containerX + this.containerWidth + 25,
                    arrowY,
                    'down',
                    arrowAlpha
                )
            } else {
                // Up arrows when compressing
                this.drawArrow(g, this.containerX - 25, arrowY, 'up', arrowAlpha)
                this.drawArrow(
                    g,
                    this.containerX + this.containerWidth + 25,
                    arrowY,
                    'up',
                    arrowAlpha
                )
            }
        }
    }

    private drawArrow(
        g: Graphics,
        x: number,
        y: number,
        direction: 'up' | 'down',
        alpha: number
    ): void {
        const size = 12
        const yDir = direction === 'down' ? 1 : -1

        g.moveTo(x, y)
        g.lineTo(x - size * 0.6, y - size * yDir)
        g.lineTo(x + size * 0.6, y - size * yDir)
        g.closePath()
        g.fill({ color: 0x4ecdc4, alpha })
    }

    private drawUI(): void {
        const g = this.uiGraphics
        g.clear()

        const barWidth = 100
        const barHeight = 14
        const barX = 20

        // Temperature bar
        const tempBarY = 20
        g.roundRect(barX, tempBarY, barWidth, barHeight, 4)
        g.fill({ color: 0x333333 })
        g.stroke({ color: 0x555555, width: 1 })

        const tempRatio = Math.min(this.temperature / 600, 1)
        const tempFill = tempRatio * (barWidth - 4)
        if (tempFill > 0) {
            g.roundRect(barX + 2, tempBarY + 2, tempFill, barHeight - 4, 3)
            g.fill(this.lerpColor(0x4ecdc4, 0xff6b6b, tempRatio))
        }

        g.circle(barX - 10, tempBarY + barHeight / 2, 4)
        g.fill(0xff6b6b)

        // Pressure bar
        const pressBarY = 45
        g.roundRect(barX, pressBarY, barWidth, barHeight, 4)
        g.fill({ color: 0x333333 })
        g.stroke({ color: 0x555555, width: 1 })

        const pressRatio = Math.min(this.pressure / 100, 1)
        const pressFill = pressRatio * (barWidth - 4)
        if (pressFill > 0) {
            g.roundRect(barX + 2, pressBarY + 2, pressFill, barHeight - 4, 3)
            g.fill(0xf39c12)
        }

        g.circle(barX - 10, pressBarY + barHeight / 2, 4)
        g.fill(0xf39c12)

        // Particle count indicator
        const countY = 70
        for (let i = 0; i < this.gasBlobs.length; i++) {
            g.circle(barX + i * 12, countY + 7, 4)
            g.fill(0x4ecdc4)
        }
    }

    private lerpColor(c1: number, c2: number, t: number): number {
        const r1 = (c1 >> 16) & 0xff
        const g1 = (c1 >> 8) & 0xff
        const b1 = c1 & 0xff
        const r2 = (c2 >> 16) & 0xff
        const g2 = (c2 >> 8) & 0xff
        const b2 = c2 & 0xff

        const r = Math.round(r1 + (r2 - r1) * t)
        const g = Math.round(g1 + (g2 - g1) * t)
        const b = Math.round(b1 + (b2 - b1) * t)

        return (r << 16) + (g << 8) + b
    }
}
