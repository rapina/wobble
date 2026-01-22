/**
 * ResourcePopup
 *
 * Floating "+N" text effect that appears when resources are collected.
 * Animates upward while fading out. Supports large formatted numbers (K, M, B).
 */

import { Container, Text, TextStyle, Graphics } from 'pixi.js'
import { formatNumber } from '@/utils/numberFormatter'

export class ResourcePopup extends Container {
    private text: Text
    private glow: Graphics
    private lifetime = 0
    private maxLifetime: number
    private startY: number
    private floatDistance: number
    private _isComplete = false

    constructor(
        amount: number,
        color: number = 0xffffff,
        x: number = 0,
        y: number = 0,
        options: {
            maxLifetime?: number
            floatDistance?: number
            fontSize?: number
        } = {}
    ) {
        super()

        const {
            maxLifetime = 1.2,
            floatDistance = 60,
            fontSize = 24,
        } = options

        this.maxLifetime = maxLifetime
        this.floatDistance = floatDistance
        this.startY = y
        this.x = x
        this.y = y

        // Create glow background
        this.glow = new Graphics()
        this.glow.circle(0, 0, fontSize * 0.8)
        this.glow.fill({ color, alpha: 0.3 })
        this.addChild(this.glow)

        // Create text
        const style = new TextStyle({
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize,
            fontWeight: 'bold',
            fill: color,
            stroke: { color: 0x000000, width: 3 },
            dropShadow: {
                color: 0x000000,
                blur: 4,
                distance: 2,
                angle: Math.PI / 4,
                alpha: 0.5,
            },
        })

        const prefix = amount >= 0 ? '+' : ''
        const formattedAmount = formatNumber(Math.abs(amount))
        this.text = new Text({ text: `${prefix}${formattedAmount}`, style })
        this.text.anchor.set(0.5, 0.5)
        this.addChild(this.text)

        // Initial scale animation
        this.scale.set(0)
    }

    /**
     * Check if animation is complete
     */
    get isComplete(): boolean {
        return this._isComplete
    }

    /**
     * Update animation
     */
    update(deltaTime: number): void {
        if (this._isComplete) return

        this.lifetime += deltaTime

        const progress = Math.min(this.lifetime / this.maxLifetime, 1)

        // Entrance animation (first 20%)
        if (progress < 0.2) {
            const entranceProgress = progress / 0.2
            const easeOut = 1 - Math.pow(1 - entranceProgress, 3)
            const bounce = easeOut * (1 + Math.sin(entranceProgress * Math.PI) * 0.3)
            this.scale.set(bounce)
        } else {
            this.scale.set(1)
        }

        // Float upward
        const floatProgress = this.easeOutCubic(progress)
        this.y = this.startY - floatProgress * this.floatDistance

        // Slight horizontal drift
        this.x += Math.sin(this.lifetime * 5) * 0.3

        // Fade out (last 40%)
        if (progress > 0.6) {
            const fadeProgress = (progress - 0.6) / 0.4
            this.alpha = 1 - this.easeInCubic(fadeProgress)
        }

        // Glow pulse
        const pulse = 0.3 + Math.sin(this.lifetime * 8) * 0.1
        this.glow.alpha = pulse * (1 - progress)

        // Check if complete
        if (progress >= 1) {
            this._isComplete = true
        }
    }

    private easeOutCubic(t: number): number {
        return 1 - Math.pow(1 - t, 3)
    }

    private easeInCubic(t: number): number {
        return t * t * t
    }
}

/**
 * ResourcePopupManager
 *
 * Manages multiple ResourcePopup instances, handling creation and cleanup.
 */
export class ResourcePopupManager extends Container {
    private popups: ResourcePopup[] = []

    /**
     * Spawn a new resource popup
     */
    spawn(
        amount: number,
        color: number,
        x: number,
        y: number,
        options?: {
            maxLifetime?: number
            floatDistance?: number
            fontSize?: number
        }
    ): void {
        const popup = new ResourcePopup(amount, color, x, y, options)
        this.popups.push(popup)
        this.addChild(popup)
    }

    /**
     * Update all popups
     */
    update(deltaTime: number): void {
        // Update and remove completed popups
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const popup = this.popups[i]
            popup.update(deltaTime)

            if (popup.isComplete) {
                this.removeChild(popup)
                popup.destroy()
                this.popups.splice(i, 1)
            }
        }
    }

    /**
     * Clear all popups
     */
    clear(): void {
        for (const popup of this.popups) {
            this.removeChild(popup)
            popup.destroy()
        }
        this.popups = []
    }
}
