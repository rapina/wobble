import { Container, Text, TextStyle } from 'pixi.js'

export type DamageTextType = 'normal' | 'critical' | 'heal' | 'explosion' | 'combo'

interface DamageTextConfig {
    color: number
    fontSize: number
    prefix: string
    suffix: string
    scale: number
    duration: number
    riseSpeed: number
    wobble: boolean
}

const DAMAGE_TEXT_CONFIGS: Record<DamageTextType, DamageTextConfig> = {
    normal: {
        color: 0xffffff,
        fontSize: 16,
        prefix: '',
        suffix: '',
        scale: 1,
        duration: 0.8,
        riseSpeed: 40,
        wobble: false,
    },
    critical: {
        color: 0xffd700,
        fontSize: 22,
        prefix: '',
        suffix: '!',
        scale: 1.3,
        duration: 1.0,
        riseSpeed: 50,
        wobble: true,
    },
    heal: {
        color: 0x2ecc71,
        fontSize: 16,
        prefix: '+',
        suffix: '',
        scale: 1,
        duration: 0.8,
        riseSpeed: 35,
        wobble: false,
    },
    explosion: {
        color: 0xff6600,
        fontSize: 18,
        prefix: '',
        suffix: '',
        scale: 1.2,
        duration: 0.9,
        riseSpeed: 45,
        wobble: true,
    },
    combo: {
        color: 0x9b59b6,
        fontSize: 20,
        prefix: '',
        suffix: 'x',
        scale: 1.2,
        duration: 1.0,
        riseSpeed: 45,
        wobble: true,
    },
}

interface ActiveDamageText {
    text: Text
    startX: number
    startY: number
    timer: number
    duration: number
    riseSpeed: number
    wobble: boolean
    wobbleOffset: number
    type: DamageTextType
}

export interface FloatingDamageTextOptions {
    poolSize?: number
}

const DEFAULT_OPTIONS: Required<FloatingDamageTextOptions> = {
    poolSize: 30,
}

export class FloatingDamageText {
    private container: Container
    private pool: Text[] = []
    private active: ActiveDamageText[] = []
    private poolSize: number

    constructor(container: Container, options?: FloatingDamageTextOptions) {
        this.container = container
        this.poolSize = options?.poolSize ?? DEFAULT_OPTIONS.poolSize

        // Pre-populate pool
        this.initializePool()
    }

    private initializePool(): void {
        for (let i = 0; i < this.poolSize; i++) {
            const text = this.createTextObject()
            text.visible = false
            this.container.addChild(text)
            this.pool.push(text)
        }
    }

    private createTextObject(): Text {
        return new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xffffff,
                stroke: { color: 0x000000, width: 4 },
                dropShadow: {
                    color: 0x000000,
                    blur: 2,
                    distance: 1,
                    alpha: 0.5,
                },
            }),
        })
    }

    private acquireText(): Text | null {
        if (this.pool.length > 0) {
            return this.pool.pop()!
        }

        // Pool exhausted - recycle oldest active text
        if (this.active.length > 0) {
            const oldest = this.active.shift()!
            oldest.text.visible = false
            return oldest.text
        }

        return null
    }

    private releaseText(text: Text): void {
        text.visible = false
        this.pool.push(text)
    }

    /**
     * Spawn a floating damage text
     */
    spawn(
        x: number,
        y: number,
        damage: number,
        type: DamageTextType = 'normal',
        customColor?: number
    ): void {
        const text = this.acquireText()
        if (!text) return

        const config = DAMAGE_TEXT_CONFIGS[type]

        // Format damage value
        const displayValue = Math.round(damage)
        text.text = `${config.prefix}${displayValue}${config.suffix}`

        // Apply style
        const style = text.style as TextStyle
        style.fontSize = config.fontSize
        style.fill = customColor ?? config.color

        // Random horizontal offset for variety
        const offsetX = (Math.random() - 0.5) * 30

        // Position and show
        text.position.set(x + offsetX, y)
        text.scale.set(config.scale)
        text.alpha = 1
        text.visible = true
        text.anchor.set(0.5)

        // Bring to front
        this.container.removeChild(text)
        this.container.addChild(text)

        // Add to active list
        this.active.push({
            text,
            startX: x + offsetX,
            startY: y,
            timer: 0,
            duration: config.duration,
            riseSpeed: config.riseSpeed,
            wobble: config.wobble,
            wobbleOffset: Math.random() * Math.PI * 2,
            type,
        })
    }

    /**
     * Spawn with custom message (for combo, etc.)
     */
    spawnCustom(x: number, y: number, message: string, type: DamageTextType = 'normal'): void {
        const text = this.acquireText()
        if (!text) return

        const config = DAMAGE_TEXT_CONFIGS[type]

        text.text = message

        const style = text.style as TextStyle
        style.fontSize = config.fontSize
        style.fill = config.color

        const offsetX = (Math.random() - 0.5) * 20

        text.position.set(x + offsetX, y)
        text.scale.set(config.scale)
        text.alpha = 1
        text.visible = true
        text.anchor.set(0.5)

        this.container.removeChild(text)
        this.container.addChild(text)

        this.active.push({
            text,
            startX: x + offsetX,
            startY: y,
            timer: 0,
            duration: config.duration,
            riseSpeed: config.riseSpeed,
            wobble: config.wobble,
            wobbleOffset: Math.random() * Math.PI * 2,
            type,
        })
    }

    /**
     * Update all active damage texts
     */
    update(deltaSeconds: number): void {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const item = this.active[i]
            item.timer += deltaSeconds

            const progress = item.timer / item.duration

            if (progress >= 1) {
                // Animation complete - return to pool
                this.releaseText(item.text)
                this.active.splice(i, 1)
                continue
            }

            // Ease out for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3)

            // Rise animation
            const rise = item.riseSpeed * easeOut
            let currentY = item.startY - rise

            // Wobble effect for criticals
            if (item.wobble) {
                const wobbleX = Math.sin(item.timer * 15 + item.wobbleOffset) * 3 * (1 - progress)
                item.text.position.x = item.startX + wobbleX
            }

            item.text.position.y = currentY

            // Scale pop effect at start
            const scaleProgress = Math.min(1, item.timer / 0.1)
            const popScale = 1 + (0.3 * (1 - scaleProgress))
            const config = DAMAGE_TEXT_CONFIGS[item.type]
            item.text.scale.set(config.scale * popScale)

            // Fade out in last 30%
            if (progress > 0.7) {
                const fadeProgress = (progress - 0.7) / 0.3
                item.text.alpha = 1 - fadeProgress
            }
        }
    }

    /**
     * Get count of active texts
     */
    getActiveCount(): number {
        return this.active.length
    }

    /**
     * Get count of pooled texts
     */
    getPoolCount(): number {
        return this.pool.length
    }

    /**
     * Reset all texts
     */
    reset(): void {
        for (const item of this.active) {
            this.releaseText(item.text)
        }
        this.active = []
    }

    /**
     * Destroy the system
     */
    destroy(): void {
        this.reset()
        for (const text of this.pool) {
            this.container.removeChild(text)
            text.destroy()
        }
        this.pool = []
    }
}
