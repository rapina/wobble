import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { TextEffect, HitEffect } from './types'

export interface EffectsManagerContext {
    effectContainer: Container
}

/**
 * Knockback trail effect - visualizes F=ma (lighter objects move more)
 * Trail thickness ∝ 1/√mass (thicker for lighter enemies)
 */
export interface KnockbackTrail {
    graphics: Graphics
    points: Array<{ x: number; y: number }>
    timer: number
    mass: number
    color: number
}

export class EffectsManager {
    private effectContainer: Container
    private textEffects: TextEffect[] = []
    private hitEffects: HitEffect[] = []
    private knockbackTrails: KnockbackTrail[] = []

    constructor(context: EffectsManagerContext) {
        this.effectContainer = context.effectContainer
    }

    /**
     * Add a text effect that floats up and fades out
     */
    addTextEffect(x: number, y: number, text: string, color = 0xffffff, fontSize = 16): void {
        const textObj = new Text({
            text,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize,
                fontWeight: 'bold',
                fill: color,
            }),
        })
        textObj.anchor.set(0.5)
        textObj.position.set(x, y)
        this.effectContainer.addChild(textObj)

        this.textEffects.push({
            timer: 1.0,
            text: textObj,
        })
    }

    /**
     * Add a hit effect (expanding circle)
     */
    addHitEffect(x: number, y: number, color = 0xffffff, radius = 20): void {
        const graphics = new Graphics()
        graphics.circle(0, 0, radius)
        graphics.fill({ color, alpha: 0.5 })
        graphics.position.set(x, y)
        this.effectContainer.addChild(graphics)

        this.hitEffects.push({
            x,
            y,
            timer: 0.2,
            graphics,
        })
    }

    /**
     * Show physics formula text effect
     * Used for merge (momentum conservation) and other physics events
     */
    addFormulaEffect(
        x: number,
        y: number,
        formula: string,
        color = 0x88ccff,
        fontSize = 14
    ): void {
        const textObj = new Text({
            text: formula,
            style: new TextStyle({
                fontFamily: 'monospace, Courier, sans-serif',
                fontSize,
                fontWeight: 'bold',
                fill: color,
                stroke: { color: 0x000000, width: 2 },
                dropShadow: {
                    color: 0x000000,
                    alpha: 0.5,
                    blur: 2,
                    distance: 1,
                },
            }),
        })
        textObj.anchor.set(0.5)
        textObj.position.set(x, y)
        this.effectContainer.addChild(textObj)

        this.textEffects.push({
            timer: 1.5, // Longer duration for formula visibility
            text: textObj,
        })
    }

    /**
     * Show merge formula with mass values
     * Displays: "m₁ + m₂ = M" and "p = mv (보존)"
     */
    showMergeFormula(
        x: number,
        y: number,
        mass1: number,
        mass2: number,
        totalMass: number
    ): void {
        // Show mass equation
        const massFormula = `${mass1} + ${mass2} = ${totalMass}`
        this.addFormulaEffect(x, y - 20, massFormula, 0x9b59b6, 12)

        // Show momentum conservation label
        this.addFormulaEffect(x, y - 5, 'p = mv', 0xaaddff, 10)
    }

    /**
     * Show F = ma formula for strong knockback events
     * Lighter enemies move more (acceleration inversely proportional to mass)
     */
    showForceFormula(x: number, y: number, mass: number, acceleration: number): void {
        // Only show for significant acceleration
        if (acceleration < 5) return

        // Format F = ma with values
        const force = (mass * acceleration).toFixed(0)
        const formula = `F = ${mass}×${acceleration.toFixed(1)} = ${force}`
        this.addFormulaEffect(x, y - 25, formula, 0xff8866, 11)

        // Show simplified formula
        this.addFormulaEffect(x, y - 10, 'F = ma', 0xffaa88, 9)
    }

    /**
     * Show gravity formula near gravity wells/black holes
     * F = Gm₁m₂/r²
     */
    showGravityFormula(x: number, y: number): void {
        this.addFormulaEffect(x, y - 15, 'F = Gm₁m₂/r²', 0x6688ff, 11)
    }

    /**
     * Show kinetic energy formula for high-energy impacts
     * KE = ½mv²
     */
    showKineticEnergyFormula(x: number, y: number, mass: number, speed: number): void {
        const ke = (0.5 * mass * speed * speed).toFixed(0)
        const formula = `KE = ½×${mass}×${speed.toFixed(0)}² = ${ke}`
        this.addFormulaEffect(x, y - 25, formula, 0x44ddff, 10)

        // Show simplified formula
        this.addFormulaEffect(x, y - 10, 'KE = ½mv²', 0x66eeff, 9)
    }

    /**
     * Show momentum conservation formula for elastic collisions
     * p = mv (momentum preserved)
     */
    showMomentumFormula(x: number, y: number): void {
        this.addFormulaEffect(x, y - 15, 'p₁ + p₂ = p₁\' + p₂\'', 0xaaddff, 10)
    }

    /**
     * Show elastic collision formula
     * KE₁ = KE₂ (energy conserved)
     */
    showElasticCollisionFormula(x: number, y: number): void {
        this.addFormulaEffect(x, y - 15, 'KE₁ = KE₂', 0xff88cc, 11)
    }

    /**
     * Show gravity slingshot effect
     * Displays "Slingshot!" with arrow indicating boost direction
     */
    showSlingshotEffect(projX: number, projY: number, wellX: number, wellY: number): void {
        // Calculate midpoint between projectile and well
        const midX = (projX + wellX) / 2
        const midY = (projY + wellY) / 2

        // Show "Slingshot!" text at the projectile position
        const textObj = new Text({
            text: 'Slingshot!',
            style: new TextStyle({
                fontFamily: 'monospace, Courier, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0xffcc00,
                stroke: { color: 0x000000, width: 3 },
                dropShadow: {
                    color: 0xff8800,
                    alpha: 0.8,
                    blur: 4,
                    distance: 0,
                },
            }),
        })
        textObj.anchor.set(0.5)
        textObj.position.set(projX, projY - 20)
        this.effectContainer.addChild(textObj)

        this.textEffects.push({
            timer: 1.0,
            text: textObj,
        })

        // Draw velocity boost arc (curved arrow suggesting the slingshot maneuver)
        const boostGraphics = new Graphics()
        const arcRadius = 25
        const toWellAngle = Math.atan2(wellY - projY, wellX - projX)

        // Draw partial arc showing the curved path
        boostGraphics.arc(midX, midY, arcRadius, toWellAngle - 0.5, toWellAngle + 0.5, false)
        boostGraphics.stroke({ color: 0xffdd44, width: 3, alpha: 0.8 })

        // Arrow head at end of arc
        const arrowX = midX + Math.cos(toWellAngle + 0.5) * arcRadius
        const arrowY = midY + Math.sin(toWellAngle + 0.5) * arcRadius
        const arrowAngle = toWellAngle + 0.5 + Math.PI / 2

        boostGraphics.moveTo(
            arrowX + Math.cos(arrowAngle) * 8,
            arrowY + Math.sin(arrowAngle) * 8
        )
        boostGraphics.lineTo(arrowX, arrowY)
        boostGraphics.lineTo(
            arrowX + Math.cos(arrowAngle + Math.PI * 0.6) * 8,
            arrowY + Math.sin(arrowAngle + Math.PI * 0.6) * 8
        )
        boostGraphics.stroke({ color: 0xffdd44, width: 3, alpha: 0.8 })

        this.effectContainer.addChild(boostGraphics)

        this.hitEffects.push({
            x: midX,
            y: midY,
            timer: 0.5,
            graphics: boostGraphics,
        })
    }

    /**
     * Show absorb effect - particles fly from enemy position toward player
     * Used for Kirby/io-style absorption mechanic
     */
    showAbsorbEffect(
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        color = 0x4ade80
    ): void {
        // Create multiple particles that fly toward player
        const particleCount = 6
        const spreadAngle = Math.PI * 0.5 // 90 degree spread

        const baseAngle = Math.atan2(toY - fromY, toX - fromX)

        for (let i = 0; i < particleCount; i++) {
            const graphics = new Graphics()

            // Small circle particle
            const size = 3 + Math.random() * 3
            graphics.circle(0, 0, size)
            graphics.fill({ color, alpha: 0.8 })

            // Start at enemy position with slight offset
            const offsetAngle = baseAngle + (Math.random() - 0.5) * spreadAngle
            const offsetDist = Math.random() * 15
            const startX = fromX + Math.cos(offsetAngle) * offsetDist
            const startY = fromY + Math.sin(offsetAngle) * offsetDist

            graphics.position.set(startX, startY)
            this.effectContainer.addChild(graphics)

            // Store as hit effect with custom timer
            this.hitEffects.push({
                x: startX,
                y: startY,
                timer: 0.3 + Math.random() * 0.2, // Varied durations
                graphics,
            })

            // Animate toward player using custom update
            // Note: The hit effects update will fade these out
            // For now, just show expanding particles
        }

        // Also show a "sucking" ring effect at enemy position
        const ringGraphics = new Graphics()
        ringGraphics.circle(0, 0, 20)
        ringGraphics.stroke({ color, width: 3, alpha: 0.6 })
        ringGraphics.position.set(fromX, fromY)
        this.effectContainer.addChild(ringGraphics)

        this.hitEffects.push({
            x: fromX,
            y: fromY,
            timer: 0.25,
            graphics: ringGraphics,
        })
    }

    /**
     * Start a knockback trail for an enemy
     * Trail thickness ∝ 1/√mass - visualizes F=ma (lighter objects accelerate more)
     */
    startKnockbackTrail(x: number, y: number, mass: number, color = 0xff6666): KnockbackTrail {
        const graphics = new Graphics()
        this.effectContainer.addChild(graphics)

        const trail: KnockbackTrail = {
            graphics,
            points: [{ x, y }],
            timer: 0.4, // Trail duration
            mass,
            color,
        }

        this.knockbackTrails.push(trail)
        return trail
    }

    /**
     * Add a point to an existing knockback trail
     */
    addTrailPoint(trail: KnockbackTrail, x: number, y: number): void {
        trail.points.push({ x, y })
        // Limit points to prevent memory issues
        if (trail.points.length > 20) {
            trail.points.shift()
        }
    }

    /**
     * Render a knockback trail
     * Thicker trail for lighter masses (F=ma visualization)
     */
    private renderKnockbackTrail(trail: KnockbackTrail): void {
        const { graphics, points, mass, color, timer } = trail

        if (points.length < 2) return

        graphics.clear()

        // Trail thickness inversely proportional to mass
        // Light enemy (mass=2): thickness ~3.5
        // Heavy enemy (mass=20): thickness ~1.1
        const baseThickness = 5 / Math.sqrt(mass)
        const alpha = Math.min(1, timer * 2.5) // Fade out over time

        // Draw trail as a series of segments with decreasing thickness
        for (let i = 1; i < points.length; i++) {
            const p0 = points[i - 1]
            const p1 = points[i]

            // Thickness decreases toward the tail
            const segmentProgress = i / points.length
            const thickness = baseThickness * segmentProgress

            graphics.moveTo(p0.x, p0.y)
            graphics.lineTo(p1.x, p1.y)
            graphics.stroke({
                color,
                width: Math.max(1, thickness),
                alpha: alpha * segmentProgress,
            })
        }
    }

    /**
     * Update all effects
     */
    update(delta: number): void {
        const deltaSeconds = delta / 60

        // Update text effects
        for (let i = this.textEffects.length - 1; i >= 0; i--) {
            const effect = this.textEffects[i]
            effect.timer -= deltaSeconds

            // Fade and rise
            effect.text.alpha = Math.min(1, effect.timer)
            effect.text.y -= delta * 0.5

            if (effect.timer <= 0) {
                this.effectContainer.removeChild(effect.text)
                effect.text.destroy()
                this.textEffects.splice(i, 1)
            }
        }

        // Update hit effects
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i]
            effect.timer -= deltaSeconds

            effect.graphics.alpha = effect.timer / 0.2
            effect.graphics.scale.set(1 + (0.2 - effect.timer) * 3)

            if (effect.timer <= 0) {
                this.effectContainer.removeChild(effect.graphics)
                effect.graphics.destroy()
                this.hitEffects.splice(i, 1)
            }
        }

        // Update knockback trails
        for (let i = this.knockbackTrails.length - 1; i >= 0; i--) {
            const trail = this.knockbackTrails[i]
            trail.timer -= deltaSeconds

            // Render the trail with current state
            this.renderKnockbackTrail(trail)

            if (trail.timer <= 0) {
                this.effectContainer.removeChild(trail.graphics)
                trail.graphics.destroy()
                this.knockbackTrails.splice(i, 1)
            }
        }
    }

    /**
     * Get current effects (for external access if needed)
     */
    getTextEffects(): readonly TextEffect[] {
        return this.textEffects
    }

    getHitEffects(): readonly HitEffect[] {
        return this.hitEffects
    }

    /**
     * Reset all effects
     */
    reset(): void {
        for (const effect of this.textEffects) {
            this.effectContainer.removeChild(effect.text)
            effect.text.destroy()
        }
        this.textEffects = []

        for (const effect of this.hitEffects) {
            this.effectContainer.removeChild(effect.graphics)
            effect.graphics.destroy()
        }
        this.hitEffects = []

        for (const trail of this.knockbackTrails) {
            this.effectContainer.removeChild(trail.graphics)
            trail.graphics.destroy()
        }
        this.knockbackTrails = []
    }
}
