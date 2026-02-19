import { Graphics } from 'pixi.js'

/**
 * Draw a hexagon shape
 */
export function drawHexagon(
    g: Graphics,
    x: number,
    y: number,
    size: number,
    fill?: number,
    stroke?: number,
    strokeWidth = 2
): void {
    const points: number[] = []
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        points.push(x + size * Math.cos(angle))
        points.push(y + size * Math.sin(angle))
    }
    g.poly(points)
    if (fill !== undefined) g.fill(fill)
    if (stroke !== undefined) {
        g.poly(points)
        g.stroke({ color: stroke, width: strokeWidth })
    }
}

/**
 * Draw a small hexagon for HUD elements (same as drawHexagon but with different defaults)
 */
export function drawUIHexagon(
    g: Graphics,
    x: number,
    y: number,
    size: number,
    fill?: number,
    stroke?: number,
    strokeWidth = 2
): void {
    drawHexagon(g, x, y, size, fill, stroke, strokeWidth)
}

/**
 * Draw a heart shape
 */
export function drawHeartShape(
    g: Graphics,
    x: number,
    y: number,
    size: number,
    color: number
): void {
    g.moveTo(x, y + size * 0.3)
    g.bezierCurveTo(x, y - size * 0.3, x - size, y - size * 0.3, x - size, y + size * 0.1)
    g.bezierCurveTo(x - size, y + size * 0.6, x, y + size, x, y + size)
    g.bezierCurveTo(x, y + size, x + size, y + size * 0.6, x + size, y + size * 0.1)
    g.bezierCurveTo(x + size, y - size * 0.3, x, y - size * 0.3, x, y + size * 0.3)
    g.fill(color)
}

/**
 * Quadratic ease-out function
 */
export function easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t)
}

/**
 * Back ease-out function (overshoot)
 */
export function easeOutBack(t: number): number {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
