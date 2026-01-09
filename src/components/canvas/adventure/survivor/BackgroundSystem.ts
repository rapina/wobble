import { Container, Graphics, Text, TextStyle } from 'pixi.js'

interface FormulaSymbol {
    text: Text
    baseX: number
    baseY: number
    broken: boolean
    phase: number
}

interface BackgroundSystemContext {
    bgContainer: Container
    width: number
    height: number
}

export class BackgroundSystem {
    private context: BackgroundSystemContext
    private cracksGraphics: Graphics
    private glitchGraphics: Graphics
    private formulaSymbols: FormulaSymbol[] = []
    private glitchTimer = 0
    private restorationLevel = 0

    constructor(context: BackgroundSystemContext) {
        this.context = context

        // Create graphics layers
        this.cracksGraphics = new Graphics()
        this.context.bgContainer.addChild(this.cracksGraphics)

        this.glitchGraphics = new Graphics()
        this.context.bgContainer.addChild(this.glitchGraphics)
    }

    updateContext(context: Partial<BackgroundSystemContext>): void {
        this.context = { ...this.context, ...context }
    }

    // Initialize background with gradient and formula symbols
    initialize(background: Graphics): void {
        background.clear()
        background.rect(0, 0, this.context.width, this.context.height)
        background.fill(0x0d0a14) // Very dark purple-black

        // Add subtle gradient effect
        const gradient = new Graphics()
        gradient.rect(0, 0, this.context.width, this.context.height)
        gradient.fill({ color: 0x1a0a20, alpha: 0.5 })
        this.context.bgContainer.addChild(gradient)

        // Create floating formula symbols
        this.createFormulaSymbols()
    }

    // Create floating physics formula symbols
    private createFormulaSymbols(): void {
        const formulas = [
            'F=ma',
            'E=mc²',
            'p=mv',
            'KE=½mv²',
            'F=kx',
            'PV=nRT',
            'v=fλ',
            'F=G(m₁m₂)/r²',
        ]

        for (let i = 0; i < 12; i++) {
            const formula = formulas[i % formulas.length]
            const style = new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14 + Math.random() * 8,
                fill: 0x3d2a4d,
                fontWeight: 'bold',
            })

            const text = new Text({ text: formula, style })
            text.anchor.set(0.5)
            const baseX = Math.random() * this.context.width
            const baseY = Math.random() * this.context.height
            text.position.set(baseX, baseY)
            text.alpha = 0.15 + Math.random() * 0.15

            this.context.bgContainer.addChild(text)
            this.formulaSymbols.push({
                text,
                baseX,
                baseY,
                broken: true,
                phase: Math.random() * Math.PI * 2,
            })
        }
    }

    // Update all background effects
    update(delta: number, activePerksCount: number): void {
        this.glitchTimer += delta / 60

        // Calculate restoration level based on active perks
        this.restorationLevel = Math.min(1, activePerksCount / 8)

        this.drawCracks()
        this.updateGlitch()
        this.updateFormulaSymbols(delta)
    }

    // Draw cracks that fade as restoration increases
    private drawCracks(): void {
        this.cracksGraphics.clear()

        const crackIntensity = 1 - this.restorationLevel
        if (crackIntensity < 0.1) return

        const numCracks = Math.floor(8 * crackIntensity)

        for (let i = 0; i < numCracks; i++) {
            const startX = (i * 137) % this.context.width
            const startY = (i * 89) % this.context.height

            this.cracksGraphics.moveTo(startX, startY)

            let x = startX
            let y = startY
            const segments = 3 + Math.floor(Math.random() * 3)

            for (let j = 0; j < segments; j++) {
                const angle = Math.random() * Math.PI * 2
                const length = 20 + Math.random() * 40
                x += Math.cos(angle) * length
                y += Math.sin(angle) * length
                this.cracksGraphics.lineTo(x, y)
            }

            const alpha = 0.3 * crackIntensity * (0.5 + Math.sin(this.glitchTimer * 2 + i) * 0.5)
            this.cracksGraphics.stroke({ color: 0x6a3a7d, width: 2, alpha })
        }
    }

    // Update glitch effect
    private updateGlitch(): void {
        this.glitchGraphics.clear()

        const glitchChance = 0.15 * (1 - this.restorationLevel)
        if (Math.random() > glitchChance) return

        const numGlitches = Math.floor(3 + Math.random() * 5)
        for (let i = 0; i < numGlitches; i++) {
            const x = Math.random() * this.context.width
            const y = Math.random() * this.context.height
            const w = 10 + Math.random() * 50
            const h = 2 + Math.random() * 8

            const colors = [0x6a3a7d, 0x8b4a9d, 0x4a2a5d, 0x9a5aad]
            const color = colors[Math.floor(Math.random() * colors.length)]

            this.glitchGraphics.rect(x, y, w, h)
            this.glitchGraphics.fill({ color, alpha: 0.3 + Math.random() * 0.3 })
        }
    }

    // Update floating formula symbols
    private updateFormulaSymbols(delta: number): void {
        for (const symbol of this.formulaSymbols) {
            symbol.phase += delta / 60

            // Floating motion
            const floatX = Math.sin(symbol.phase * 0.5) * 10
            const floatY = Math.cos(symbol.phase * 0.3) * 8

            // Glitch displacement (less as restoration increases)
            const glitchDisplacement = (1 - this.restorationLevel) * 5
            const glitchX = (Math.random() - 0.5) * glitchDisplacement
            const glitchY = (Math.random() - 0.5) * glitchDisplacement

            symbol.text.position.set(
                symbol.baseX + floatX + glitchX,
                symbol.baseY + floatY + glitchY
            )

            // Color and alpha based on restoration
            const baseAlpha = 0.15 + this.restorationLevel * 0.25
            const flickerAlpha = symbol.broken ? Math.random() * 0.1 : 0
            symbol.text.alpha = baseAlpha - flickerAlpha

            // Change color as restoration increases
            if (this.restorationLevel > 0.3) {
                const restored = this.restorationLevel
                const r = Math.floor(0x3d + (0x5d - 0x3d) * restored)
                const g = Math.floor(0x2a + (0xad - 0x2a) * restored)
                const b = Math.floor(0x4d + (0xe2 - 0x4d) * restored)
                const color = (r << 16) | (g << 8) | b
                symbol.text.style.fill = color
            }
        }
    }

    // Reset background state
    reset(): void {
        this.glitchTimer = 0
        this.restorationLevel = 0

        // Reset formula symbol colors
        for (const symbol of this.formulaSymbols) {
            symbol.text.style.fill = 0x3d2a4d
            symbol.text.alpha = 0.15 + Math.random() * 0.15
        }
    }
}
