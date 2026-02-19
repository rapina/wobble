/**
 * Balatro-style Button Component for PixiJS
 * Matches the HomeScreen.tsx button styling exactly
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'

// Theme colors matching HomeScreen.tsx
export const BALATRO_COLORS = {
    gold: 0xc9a227,
    red: 0xe85d4c,
    blue: 0x4a9eff,
    green: 0x2e7d32,
    border: 0x1a1a1a,
    bgPanel: 0x374244,
    bgDark: 0x0f0f1a,
    bgCard: 0x1a1a2e,
    bgCardLight: 0x2a2a3e,
    textPrimary: 0xffffff,
    textSecondary: 0x888899,
    textMuted: 0x555566,
    cyan: 0x00aacc,
}

// Design constants for consistent styling
export const BALATRO_DESIGN = {
    borderWidth: 3,
    shadowOffset: 5,
    radiusSmall: 6,
    radiusMedium: 12,
    radiusLarge: 16,
    letterSpacing: 2,
}

/**
 * Draw a Balatro-style card container
 */
export function drawBalatroCard(
    g: Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
        bgColor?: number
        borderColor?: number
        borderWidth?: number
        radius?: number
        shadow?: boolean
    }
): void {
    const {
        bgColor = BALATRO_COLORS.bgCard,
        borderColor = BALATRO_COLORS.gold,
        borderWidth = BALATRO_DESIGN.borderWidth,
        radius = BALATRO_DESIGN.radiusLarge,
        shadow = true,
    } = options || {}

    // Shadow
    if (shadow) {
        g.roundRect(x + 4, y + 6, width, height, radius)
        g.fill(0x000000)
    }

    // Background
    g.roundRect(x, y, width, height, radius)
    g.fill(bgColor)

    // Border
    g.roundRect(x, y, width, height, radius)
    g.stroke({ color: borderColor, width: borderWidth })
}

/**
 * Draw decorative corner dots (Balatro style)
 */
export function drawCornerDots(
    g: Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = BALATRO_COLORS.gold,
    dotRadius: number = 4,
    margin: number = 20
): void {
    const corners = [
        { cx: x + margin, cy: y + margin },
        { cx: x + width - margin, cy: y + margin },
        { cx: x + margin, cy: y + height - margin },
        { cx: x + width - margin, cy: y + height - margin },
    ]

    for (const corner of corners) {
        g.circle(corner.cx, corner.cy, dotRadius)
        g.fill({ color, alpha: 0.5 })
    }
}

/**
 * Draw a Balatro-style badge (for titles)
 */
export function drawBalatroBadge(
    g: Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = BALATRO_COLORS.gold
): void {
    // Shadow
    g.roundRect(x + 2, y + 4, width, height, 8)
    g.fill(0x000000)

    // Badge
    g.roundRect(x, y, width, height, 8)
    g.fill(color)
    g.roundRect(x, y, width, height, 8)
    g.stroke({ color: BALATRO_COLORS.border, width: 3 })
}

/**
 * Draw a Balatro-style progress bar
 */
export function drawBalatroProgressBar(
    bgGraphics: Graphics,
    fillGraphics: Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number,
    fillColor: number = BALATRO_COLORS.gold
): void {
    // Shadow
    bgGraphics.roundRect(x + 2, y + 3, width, height, 6)
    bgGraphics.fill(0x000000)

    // Background
    bgGraphics.roundRect(x, y, width, height, 6)
    bgGraphics.fill(BALATRO_COLORS.bgCardLight)
    bgGraphics.roundRect(x, y, width, height, 6)
    bgGraphics.stroke({ color: 0x3a3a4e, width: 2 })

    // Fill
    fillGraphics.clear()
    const fillWidth = Math.max(0, (width - 4) * Math.min(1, progress))
    if (fillWidth > 0) {
        fillGraphics.roundRect(x + 2, y + 2, fillWidth, height - 4, 4)
        fillGraphics.fill(fillColor)
    }
}

export interface BalatroButtonOptions {
    label: string
    width?: number
    height?: number
    color: number
    onClick: () => void
}

/**
 * Create a Balatro-style action button
 * Matches HomeScreen.tsx button style:
 * - 3px border
 * - 5px solid shadow (0 5px 0)
 * - 12px border radius
 * - Black text on gold, white text on other colors
 * - Scale 0.97 on press
 */
export function createBalatroButton(options: BalatroButtonOptions): Container {
    const { label, width = 120, height = 44, color, onClick } = options

    const btn = new Container()
    btn.eventMode = 'static'
    btn.cursor = 'pointer'

    // Solid shadow (matching boxShadow: 0 5px 0)
    const shadow = new Graphics()
    shadow.roundRect(-width / 2, -height / 2 + 5, width, height, 12)
    shadow.fill(BALATRO_COLORS.border)
    btn.addChild(shadow)

    // Main button background
    const bg = new Graphics()
    bg.roundRect(-width / 2, -height / 2, width, height, 12)
    bg.fill(color)
    // 3px border (matching HomeScreen)
    bg.roundRect(-width / 2, -height / 2, width, height, 12)
    bg.stroke({ color: BALATRO_COLORS.border, width: 3 })
    btn.addChild(bg)

    // Text color: black on gold, white on others
    const textColor = color === BALATRO_COLORS.gold ? 0x000000 : 0xffffff

    // Button text
    const btnText = new Text({
        text: label,
        style: new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 16,
            fontWeight: 'bold',
            fill: textColor,
            letterSpacing: 2,
        }),
    })
    btnText.anchor.set(0.5)
    btn.addChild(btnText)

    // Interaction (scale 0.97 matching active:scale-[0.97])
    btn.on('pointerdown', () => btn.scale.set(0.97))
    btn.on('pointerup', () => {
        btn.scale.set(1)
        onClick()
    })
    btn.on('pointerupoutside', () => btn.scale.set(1))

    return btn
}

export interface BalatroCircleButtonOptions {
    symbol: string
    size?: number
    color?: number
    onClick: () => void
}

/**
 * Create a Balatro-style circular button (for arrows, etc.)
 * - Gold background with black text
 * - 3px border
 * - Solid shadow
 */
export function createBalatroCircleButton(options: BalatroCircleButtonOptions): Container {
    const { symbol, size = 36, color = BALATRO_COLORS.gold, onClick } = options

    const btn = new Container()
    btn.eventMode = 'static'
    btn.cursor = 'pointer'

    const radius = size / 2

    // Solid shadow (0 5px 0 style)
    const shadow = new Graphics()
    shadow.circle(0, 5, radius)
    shadow.fill(BALATRO_COLORS.border)
    btn.addChild(shadow)

    // Main circle background
    const bg = new Graphics()
    bg.circle(0, 0, radius)
    bg.fill(color)
    bg.circle(0, 0, radius)
    bg.stroke({ color: BALATRO_COLORS.border, width: 3 })
    btn.addChild(bg)

    // Symbol text (black on gold)
    const textColor = color === BALATRO_COLORS.gold ? 0x000000 : 0xffffff
    const arrow = new Text({
        text: symbol,
        style: new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: size * 0.45,
            fontWeight: 'bold',
            fill: textColor,
        }),
    })
    arrow.anchor.set(0.5)
    btn.addChild(arrow)

    // Interaction
    btn.on('pointerdown', () => {
        btn.scale.set(0.9)
        onClick()
    })
    btn.on('pointerup', () => btn.scale.set(1))
    btn.on('pointerupoutside', () => btn.scale.set(1))

    return btn
}
