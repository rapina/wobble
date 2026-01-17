import { Container, Graphics } from 'pixi.js'

/**
 * Angel-style geometric enemy graphics
 * Inspired by Evangelion's Angels - abstract, geometric, unsettling
 */

export type AngelShape =
    | 'octahedron'  // Ramiel-style diamond
    | 'prism'       // Sharp triangular prism
    | 'cube'        // Blocky, intimidating
    | 'cross'       // Angel cross symbol
    | 'hexagon'     // Organic but geometric
    | 'ring'        // Hollow ring shape
    | 'spike'       // Spiky star shape

interface AngelConfig {
    size: number
    color: number
    shape?: AngelShape
    coreColor?: number    // Inner core glow
    pulseSpeed?: number   // Animation speed
}

export class AngelGraphics extends Container {
    private body: Graphics
    private core: Graphics
    private config: AngelConfig
    private phase = Math.random() * Math.PI * 2

    constructor(config: AngelConfig) {
        super()
        this.config = {
            shape: 'octahedron',
            coreColor: 0xff0000, // AT-Field red
            pulseSpeed: 2,
            ...config,
        }

        this.body = new Graphics()
        this.core = new Graphics()

        this.addChild(this.body)
        this.addChild(this.core)

        this.draw()
    }

    private draw(): void {
        const { size, color, shape, coreColor } = this.config

        this.body.clear()
        this.core.clear()

        // Draw body based on shape
        switch (shape) {
            case 'octahedron':
                this.drawOctahedron(size, color)
                break
            case 'prism':
                this.drawPrism(size, color)
                break
            case 'cube':
                this.drawCube(size, color)
                break
            case 'cross':
                this.drawCross(size, color)
                break
            case 'hexagon':
                this.drawHexagon(size, color)
                break
            case 'ring':
                this.drawRing(size, color)
                break
            case 'spike':
                this.drawSpike(size, color)
                break
            default:
                this.drawOctahedron(size, color)
        }

        // Draw core (inner glow)
        const coreSize = size * 0.25
        this.core.circle(0, 0, coreSize)
        this.core.fill({ color: coreColor, alpha: 0.9 })
        this.core.circle(0, 0, coreSize * 0.5)
        this.core.fill({ color: 0xffffff, alpha: 0.8 })
    }

    /**
     * Ramiel-style octahedron (diamond shape)
     */
    private drawOctahedron(size: number, color: number): void {
        const h = size * 0.6  // Height multiplier for diamond shape

        // Diamond shape (2D representation of octahedron)
        this.body.moveTo(0, -h)           // Top
        this.body.lineTo(size * 0.5, 0)   // Right
        this.body.lineTo(0, h)            // Bottom
        this.body.lineTo(-size * 0.5, 0)  // Left
        this.body.closePath()

        this.body.fill({ color, alpha: 0.85 })
        this.body.stroke({ color: this.lighten(color, 0.3), width: 2, alpha: 0.9 })

        // Inner facet lines for 3D effect
        this.body.moveTo(0, -h)
        this.body.lineTo(0, h)
        this.body.stroke({ color: this.lighten(color, 0.2), width: 1, alpha: 0.5 })
    }

    /**
     * Sharp triangular prism
     */
    private drawPrism(size: number, color: number): void {
        const h = size * 0.7

        // Downward pointing triangle
        this.body.moveTo(0, h * 0.6)
        this.body.lineTo(-size * 0.5, -h * 0.4)
        this.body.lineTo(size * 0.5, -h * 0.4)
        this.body.closePath()

        this.body.fill({ color, alpha: 0.85 })
        this.body.stroke({ color: this.lighten(color, 0.3), width: 2 })

        // Center line
        this.body.moveTo(0, h * 0.6)
        this.body.lineTo(0, -h * 0.4)
        this.body.stroke({ color: this.lighten(color, 0.2), width: 1, alpha: 0.5 })
    }

    /**
     * Blocky cube representation
     */
    private drawCube(size: number, color: number): void {
        const s = size * 0.4

        // Isometric cube
        // Top face
        this.body.moveTo(0, -s * 0.8)
        this.body.lineTo(s, -s * 0.3)
        this.body.lineTo(0, s * 0.2)
        this.body.lineTo(-s, -s * 0.3)
        this.body.closePath()
        this.body.fill({ color: this.lighten(color, 0.2), alpha: 0.9 })

        // Left face
        this.body.moveTo(-s, -s * 0.3)
        this.body.lineTo(0, s * 0.2)
        this.body.lineTo(0, s * 0.8)
        this.body.lineTo(-s, s * 0.3)
        this.body.closePath()
        this.body.fill({ color: this.darken(color, 0.2), alpha: 0.9 })

        // Right face
        this.body.moveTo(s, -s * 0.3)
        this.body.lineTo(0, s * 0.2)
        this.body.lineTo(0, s * 0.8)
        this.body.lineTo(s, s * 0.3)
        this.body.closePath()
        this.body.fill({ color, alpha: 0.9 })

        // Edges
        this.body.stroke({ color: this.lighten(color, 0.4), width: 1.5 })
    }

    /**
     * Angel cross symbol
     */
    private drawCross(size: number, color: number): void {
        const w = size * 0.15
        const h = size * 0.5

        // Vertical bar
        this.body.rect(-w, -h, w * 2, h * 2)
        this.body.fill({ color, alpha: 0.9 })

        // Horizontal bar (slightly higher)
        this.body.rect(-h * 0.8, -w - h * 0.2, h * 1.6, w * 2)
        this.body.fill({ color, alpha: 0.9 })

        this.body.stroke({ color: this.lighten(color, 0.3), width: 1.5 })
    }

    /**
     * Organic hexagon
     */
    private drawHexagon(size: number, color: number): void {
        const r = size * 0.45
        const points: number[] = []

        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
            points.push(Math.cos(angle) * r)
            points.push(Math.sin(angle) * r)
        }

        this.body.poly(points)
        this.body.fill({ color, alpha: 0.85 })
        this.body.stroke({ color: this.lighten(color, 0.3), width: 2 })

        // Inner hexagon
        const innerPoints: number[] = []
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
            innerPoints.push(Math.cos(angle) * r * 0.5)
            innerPoints.push(Math.sin(angle) * r * 0.5)
        }
        this.body.poly(innerPoints)
        this.body.stroke({ color: this.lighten(color, 0.2), width: 1, alpha: 0.5 })
    }

    /**
     * Hollow ring shape
     */
    private drawRing(size: number, color: number): void {
        const outer = size * 0.45
        const inner = size * 0.25

        // Outer ring
        this.body.circle(0, 0, outer)
        this.body.fill({ color, alpha: 0.8 })

        // Cut out inner circle (draw with background color or use mask)
        this.body.circle(0, 0, inner)
        this.body.cut()

        this.body.circle(0, 0, outer)
        this.body.stroke({ color: this.lighten(color, 0.3), width: 2 })
        this.body.circle(0, 0, inner)
        this.body.stroke({ color: this.lighten(color, 0.2), width: 1.5 })
    }

    /**
     * Spiky star shape
     */
    private drawSpike(size: number, color: number): void {
        const outer = size * 0.5
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
        this.body.fill({ color, alpha: 0.85 })
        this.body.stroke({ color: this.lighten(color, 0.3), width: 2 })
    }

    /**
     * Update animation
     */
    update(delta: number): void {
        const { pulseSpeed } = this.config
        this.phase += delta * 0.01 * (pulseSpeed ?? 2)

        // Subtle pulse effect on core
        const pulse = 1 + Math.sin(this.phase) * 0.15
        this.core.scale.set(pulse)
        this.core.alpha = 0.7 + Math.sin(this.phase * 2) * 0.3

        // Very subtle body rotation for unease
        this.body.rotation = Math.sin(this.phase * 0.5) * 0.05
    }

    /**
     * Scale punch effect for hits
     */
    scalePunch(intensity: number): void {
        this.scale.set(1 + intensity)
    }

    private lighten(color: number, amount: number): number {
        const r = Math.min(255, ((color >> 16) & 0xff) + 255 * amount)
        const g = Math.min(255, ((color >> 8) & 0xff) + 255 * amount)
        const b = Math.min(255, (color & 0xff) + 255 * amount)
        return (r << 16) | (g << 8) | b
    }

    private darken(color: number, amount: number): number {
        const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount))
        const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount))
        const b = Math.max(0, (color & 0xff) * (1 - amount))
        return (r << 16) | (g << 8) | b
    }
}

/**
 * Get angel shape based on tier and variant
 */
export function getAngelShape(tier: string, variant: string): AngelShape {
    // Tier-based default shapes
    const tierShapes: Record<string, AngelShape> = {
        'normal': 'octahedron',
        'elite': 'prism',
        'champion': 'cross',
        'boss': 'spike',
    }

    // Variant overrides
    const variantShapes: Record<string, AngelShape> = {
        'tank': 'cube',
        'swift': 'prism',
        'ghost': 'ring',
        'explosive': 'spike',
        'healer': 'hexagon',
        'splitter': 'cross',
    }

    return variantShapes[variant] ?? tierShapes[tier] ?? 'octahedron'
}

/**
 * Get core color based on variant
 */
export function getAngelCoreColor(variant: string): number {
    const coreColors: Record<string, number> = {
        'normal': 0xff0000,    // Classic red
        'tank': 0xff4400,      // Orange-red
        'swift': 0x00ffff,     // Cyan
        'ghost': 0xaa00ff,     // Purple
        'explosive': 0xffff00, // Yellow
        'healer': 0x00ff00,    // Green
        'splitter': 0xff00ff,  // Magenta
    }
    return coreColors[variant] ?? 0xff0000
}
