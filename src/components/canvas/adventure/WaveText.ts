import { Container, Text, TextStyle, TextStyleOptions } from 'pixi.js'

export interface WaveTextOptions {
    text: string
    style: TextStyle | TextStyleOptions
    /** Wave amplitude in pixels (default: 4) */
    amplitude?: number
    /** Wave frequency - how fast the wave moves (default: 6) */
    frequency?: number
    /** Phase offset between characters (default: 0.3) */
    phaseOffset?: number
    /** Letter spacing in pixels (default: 0) */
    letterSpacing?: number
}

/**
 * A text component where each character waves up and down independently.
 * Creates a playful, dynamic text effect.
 */
export class WaveText extends Container {
    private characters: Text[] = []
    private baseY: number[] = []
    private phase = 0

    private amplitude: number
    private frequency: number
    private phaseOffset: number

    constructor(options: WaveTextOptions) {
        super()

        this.amplitude = options.amplitude ?? 4
        this.frequency = options.frequency ?? 6
        this.phaseOffset = options.phaseOffset ?? 0.3

        const style =
            options.style instanceof TextStyle ? options.style : new TextStyle(options.style)
        const letterSpacing = options.letterSpacing ?? 0

        // Create individual text objects for each character
        const chars = options.text.split('')
        let totalWidth = 0

        // First pass: create characters and measure total width
        const charWidths: number[] = []
        for (const char of chars) {
            const charText = new Text({ text: char, style })
            charWidths.push(charText.width + letterSpacing)
            totalWidth += charText.width + letterSpacing
            this.characters.push(charText)
        }
        totalWidth -= letterSpacing // Remove last spacing

        // Second pass: position characters centered
        let x = -totalWidth / 2
        for (let i = 0; i < this.characters.length; i++) {
            const charText = this.characters[i]
            charText.anchor.set(0, 0.5)
            charText.position.set(x, 0)
            this.baseY.push(0)
            x += charWidths[i]
            this.addChild(charText)
        }
    }

    /**
     * Update the wave animation. Call this every frame.
     * @param deltaTime Time since last frame (in seconds or consistent unit)
     */
    update(deltaTime: number): void {
        this.phase += deltaTime * this.frequency

        for (let i = 0; i < this.characters.length; i++) {
            const charPhase = this.phase + i * this.phaseOffset
            const offsetY = Math.sin(charPhase) * this.amplitude
            this.characters[i].position.y = this.baseY[i] + offsetY
        }
    }

    /**
     * Set new text content
     */
    setText(text: string): void {
        // For simplicity, just update existing characters if same length
        const chars = text.split('')
        for (let i = 0; i < Math.min(chars.length, this.characters.length); i++) {
            this.characters[i].text = chars[i]
        }
    }

    /**
     * Set wave parameters
     */
    setWaveParams(amplitude?: number, frequency?: number, phaseOffset?: number): void {
        if (amplitude !== undefined) this.amplitude = amplitude
        if (frequency !== undefined) this.frequency = frequency
        if (phaseOffset !== undefined) this.phaseOffset = phaseOffset
    }
}
