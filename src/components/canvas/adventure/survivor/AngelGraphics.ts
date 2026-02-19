import { Container, Graphics } from 'pixi.js'

/**
 * Simplified cosmic geometric enemy graphics
 * Clean, minimal shapes for performance
 */

export type AngelShape =
    | 'octahedron' // Diamond
    | 'prism' // Triangle
    | 'cube' // Square
    | 'cross' // Plus sign
    | 'hexagon' // Hexagon
    | 'ring' // Circle
    | 'spike' // Star

interface AngelConfig {
    size: number
    color: number
    shape?: AngelShape
    coreColor?: number
    pulseSpeed?: number // Kept for compatibility but unused
}

export class AngelGraphics extends Container {
    private body: Graphics
    private config: AngelConfig

    constructor(config: AngelConfig) {
        super()
        this.config = {
            shape: 'octahedron',
            coreColor: 0xff0000,
            ...config,
        }

        this.body = new Graphics()
        this.addChild(this.body)

        this.draw()
    }

    private draw(): void {
        const { size, color, shape, coreColor } = this.config

        this.body.clear()

        // Draw simple shape based on type
        switch (shape) {
            case 'octahedron':
                this.drawDiamond(size, color)
                break
            case 'prism':
                this.drawTriangle(size, color)
                break
            case 'cube':
                this.drawSquare(size, color)
                break
            case 'cross':
                this.drawCross(size, color)
                break
            case 'hexagon':
                this.drawHexagon(size, color)
                break
            case 'ring':
                this.drawCircle(size, color)
                break
            case 'spike':
                this.drawStar(size, color)
                break
            default:
                this.drawDiamond(size, color)
        }

        // Simple core dot
        this.body.circle(0, 0, size * 0.15)
        this.body.fill(coreColor ?? 0xff0000)
    }

    private drawDiamond(size: number, color: number): void {
        const h = size * 0.55
        const w = size * 0.4

        this.body.moveTo(0, -h)
        this.body.lineTo(w, 0)
        this.body.lineTo(0, h)
        this.body.lineTo(-w, 0)
        this.body.closePath()
        this.body.fill(color)
        this.body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
    }

    private drawTriangle(size: number, color: number): void {
        const h = size * 0.5

        this.body.moveTo(0, h * 0.6)
        this.body.lineTo(-h * 0.55, -h * 0.4)
        this.body.lineTo(h * 0.55, -h * 0.4)
        this.body.closePath()
        this.body.fill(color)
        this.body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
    }

    private drawSquare(size: number, color: number): void {
        const s = size * 0.4
        this.body.rect(-s, -s, s * 2, s * 2)
        this.body.fill(color)
        this.body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
    }

    private drawCross(size: number, color: number): void {
        const w = size * 0.15
        const h = size * 0.45

        this.body.rect(-w, -h, w * 2, h * 2)
        this.body.rect(-h, -w, h * 2, w * 2)
        this.body.fill(color)
        this.body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
    }

    private drawHexagon(size: number, color: number): void {
        const r = size * 0.42
        const points: number[] = []

        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
            points.push(Math.cos(angle) * r)
            points.push(Math.sin(angle) * r)
        }

        this.body.poly(points)
        this.body.fill(color)
        this.body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
    }

    private drawCircle(size: number, color: number): void {
        this.body.circle(0, 0, size * 0.4)
        this.body.fill(color)
        this.body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
    }

    private drawStar(size: number, color: number): void {
        const outer = size * 0.45
        const inner = size * 0.2
        const spikes = 5
        const points: number[] = []

        for (let i = 0; i < spikes * 2; i++) {
            const angle = (Math.PI * 2 * i) / (spikes * 2) - Math.PI / 2
            const r = i % 2 === 0 ? outer : inner
            points.push(Math.cos(angle) * r)
            points.push(Math.sin(angle) * r)
        }

        this.body.poly(points)
        this.body.fill(color)
        this.body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
    }

    /**
     * Update animation - simplified (no per-frame animation)
     */
    update(_delta: number): void {
        // No animation for performance
    }

    /**
     * Scale punch effect for hits
     */
    scalePunch(intensity: number): void {
        this.scale.set(1 + intensity)
    }
}

/**
 * Get angel shape based on tier and variant
 */
export function getAngelShape(tier: string, variant: string): AngelShape {
    // Tier-based default shapes
    const tierShapes: Record<string, AngelShape> = {
        normal: 'octahedron',
        elite: 'prism',
        champion: 'cross',
        boss: 'spike',
    }

    // Variant overrides
    const variantShapes: Record<string, AngelShape> = {
        tank: 'cube',
        swift: 'prism',
        ghost: 'ring',
        explosive: 'spike',
        healer: 'hexagon',
        splitter: 'cross',
    }

    return variantShapes[variant] ?? tierShapes[tier] ?? 'octahedron'
}

/**
 * Get core color based on variant
 */
export function getAngelCoreColor(variant: string): number {
    const coreColors: Record<string, number> = {
        normal: 0xff0000, // Classic red
        tank: 0xff4400, // Orange-red
        swift: 0x00ffff, // Cyan
        ghost: 0xaa00ff, // Purple
        explosive: 0xffff00, // Yellow
        healer: 0x00ff00, // Green
        splitter: 0xff00ff, // Magenta
    }
    return coreColors[variant] ?? 0xff0000
}
