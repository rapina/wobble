import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { TextEffect, HitEffect } from './types'

export interface EffectsManagerContext {
    effectContainer: Container
}

export class EffectsManager {
    private effectContainer: Container
    private textEffects: TextEffect[] = []
    private hitEffects: HitEffect[] = []

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
     * Update all effects
     */
    update(delta: number): void {
        // Update text effects
        for (let i = this.textEffects.length - 1; i >= 0; i--) {
            const effect = this.textEffects[i]
            effect.timer -= delta / 60

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
            effect.timer -= delta / 60

            effect.graphics.alpha = effect.timer / 0.2
            effect.graphics.scale.set(1 + (0.2 - effect.timer) * 3)

            if (effect.timer <= 0) {
                this.effectContainer.removeChild(effect.graphics)
                effect.graphics.destroy()
                this.hitEffects.splice(i, 1)
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
    }
}
