import { Container, Graphics, BlurFilter } from 'pixi.js'
import { cssToHex, pixiColors } from '../../utils/pixiHelpers'
import { LocalizedText } from '@/utils/localization'

export type WobbleExpression =
    | 'happy'
    | 'neutral'
    | 'surprised'
    | 'worried'
    | 'effort'
    | 'struggle'
    | 'dizzy'
    | 'hot'
    | 'charge'
    | 'excited'
    | 'sleepy'
    | 'angry'
    | 'eating'
    | 'none'

/**
 * Wobble shape types - 각 shape는 고유한 역할/성격을 가짐
 *
 * - 'circle': Wobi (워비) - 호기심 많고 활발한 주인공
 * - 'square': Boxy (박시) - 순하고 자주 당하는 타입
 * - 'triangle': Spike (스파이크) - 날카롭고 도전적인 성격
 * - 'star': Twinkle (트윙클) - 특별하고 행운을 가져다주는 존재
 * - 'diamond': Gem (젬) - 귀하고 우아한 목표 지향적 성격
 * - 'pentagon': Penta (펜타) - 믿음직하고 든든한 보호자
 * - 'shadow': Shadow (섀도우) - 어둡고 적대적인 적 캐릭터
 * - 'einstein': Albert (알버트) - 천재적이고 호기심 가득한 과학자
 */
export type WobbleShape =
    | 'circle'
    | 'square'
    | 'triangle'
    | 'star'
    | 'diamond'
    | 'pentagon'
    | 'shadow'
    | 'einstein'

/** Shape별 역할 정의 (씬에서 참조용) */
export const SHAPE_ROLES = {
    circle: 'protagonist', // 주인공, 공격자
    square: 'victim', // 피해자, 당하는 역할
    triangle: 'attacker', // 공격자, 위협
    star: 'bonus', // 보너스, 파워업
    diamond: 'goal', // 목표, 수집 대상
    pentagon: 'defender', // 방어자, 지지자
    shadow: 'enemy', // 적, 법칙 파괴자
    einstein: 'scientist', // 과학자, 지식 전달자
} as const

/** 워블 캐릭터 정보 인터페이스 */
export interface WobbleCharacter {
    shape: WobbleShape
    name: LocalizedText
    personality: LocalizedText
    role: string
    color: number
}

/** 워블 캐릭터 메타데이터 */
export const WOBBLE_CHARACTERS: Record<WobbleShape, WobbleCharacter> = {
    circle: {
        shape: 'circle',
        name: { ko: '워비', en: 'Wobi', ja: 'ウォビ' },
        personality: {
            ko: '호기심 많고 활발한 주인공',
            en: 'Curious and energetic protagonist',
            ja: '好奇心旺盛で元気な主人公',
        },
        role: 'protagonist',
        color: 0xf5b041,
    },
    square: {
        shape: 'square',
        name: { ko: '박시', en: 'Boxy', ja: 'ボクシー' },
        personality: {
            ko: '순하고 자주 당하는 타입',
            en: 'Gentle and often gets pushed around',
            ja: '穏やかでよく押されるタイプ',
        },
        role: 'victim',
        color: 0x5dade2,
    },
    triangle: {
        shape: 'triangle',
        name: { ko: '스파이크', en: 'Spike', ja: 'スパイク' },
        personality: {
            ko: '날카롭고 도전적인 성격',
            en: 'Sharp and competitive challenger',
            ja: '鋭くて挑戦的な性格',
        },
        role: 'attacker',
        color: 0xe74c3c,
    },
    star: {
        shape: 'star',
        name: { ko: '트윙클', en: 'Twinkle', ja: 'トゥインクル' },
        personality: {
            ko: '특별하고 행운을 가져다주는 존재',
            en: 'Special and brings good luck',
            ja: '特別で幸運をもたらす存在',
        },
        role: 'bonus',
        color: 0xffd700,
    },
    diamond: {
        shape: 'diamond',
        name: { ko: '젬', en: 'Gem', ja: 'ジェム' },
        personality: {
            ko: '귀하고 우아한 목표 지향적 성격',
            en: 'Precious and goal-oriented',
            ja: '貴重で目標志向の性格',
        },
        role: 'goal',
        color: 0xbb8fce,
    },
    pentagon: {
        shape: 'pentagon',
        name: { ko: '펜타', en: 'Penta', ja: 'ペンタ' },
        personality: {
            ko: '믿음직하고 든든한 보호자',
            en: 'Reliable protector and supporter',
            ja: '頼りになる守護者',
        },
        role: 'defender',
        color: 0x82e0aa,
    },
    shadow: {
        shape: 'shadow',
        name: { ko: '섀도우', en: 'Shadow', ja: 'シャドウ' },
        personality: {
            ko: '어둠에서 온 법칙 파괴자',
            en: 'Dark law destroyer from the void',
            ja: '闇から来た法則の破壊者',
        },
        role: 'enemy',
        color: 0x1a1a1a,
    },
    einstein: {
        shape: 'einstein',
        name: { ko: '알버트', en: 'Albert', ja: 'アルバート' },
        personality: {
            ko: '천재적이고 호기심 가득한 과학자',
            en: 'Genius scientist full of curiosity',
            ja: '天才的で好奇心旺盛な科学者',
        },
        role: 'scientist',
        color: 0xf0e6d3, // Warm beige/cream color
    },
}

/** 공식별 등장 워블 매핑 */
export const FORMULA_WOBBLES: Record<string, WobbleShape[]> = {
    // Mechanics
    'newton-second': ['circle', 'square'],
    'kinetic-energy': ['circle'],
    momentum: ['circle', 'square'],
    centripetal: ['circle'],
    hooke: ['circle'],
    'free-fall': ['circle'],
    projectile: ['circle'],
    power: ['circle', 'square'],
    collision: ['circle', 'square'],
    pendulum: ['circle', 'pentagon'],
    buoyancy: ['circle', 'square'],

    // Wave
    'wave-speed': ['circle', 'square'],
    'standing-wave': ['circle'],
    snell: ['circle'],
    reflection: ['circle'],
    lens: ['circle'],
    'de-broglie': ['einstein', 'circle', 'diamond'],

    // Gravity
    gravity: ['circle', 'diamond'],
    'kepler-third': ['circle'],
    'escape-velocity': ['circle'],

    // Thermodynamics
    'ideal-gas': ['circle', 'square'],
    'heat-transfer': ['circle', 'square'],
    entropy: ['circle', 'square', 'triangle'],
    'stefan-boltzmann': ['circle'],
    'first-law': ['circle'],
    'thermal-conduction': ['circle', 'square'],

    // Electricity
    coulomb: ['circle', 'square'],
    ohm: ['circle', 'square'],
    capacitor: ['circle', 'square'],
    lorentz: ['circle', 'triangle'],

    // Special (Einstein's theories)
    'time-dilation': ['einstein', 'circle'],
    photoelectric: ['einstein', 'star'],
    'mass-energy': ['einstein'], // E = mc²

    // Quantum Mechanics (Einstein contributed to foundations)
    uncertainty: ['einstein', 'circle'],
    'infinite-well': ['einstein', 'circle'],
    tunneling: ['einstein', 'circle'],
    bohr: ['einstein', 'circle'],
    'radioactive-decay': ['einstein', 'circle'],

    // New shape-featured formulas
    pressure: ['triangle'], // Spike pressing down
    wien: ['star'], // Twinkle changing color with temperature
    torque: ['pentagon'], // Penta pushing lever
}

export interface WobbleOptions {
    size: number
    color: string | number
    shape?: WobbleShape
    expression?: WobbleExpression
    scaleX?: number
    scaleY?: number
    lookDirection?: { x: number; y: number }
    showShadow?: boolean
    shadowOffsetY?: number
    showLegs?: boolean
    legPhase?: number
    showSpeedLines?: boolean
    speedDirection?: number
    showSweat?: boolean
    glowColor?: string | number
    glowIntensity?: number
    wobblePhase?: number
    opacity?: number
}

// LocoRoco-style default yellow
const LOCOROCO_YELLOW = 0xf5b041
const LOCOROCO_OUTLINE = 0x2c2c2c
const LOCOROCO_CHEEK = 0xe87e4d

const defaultOptions: Required<WobbleOptions> = {
    size: 60,
    color: LOCOROCO_YELLOW,
    shape: 'circle',
    expression: 'happy',
    scaleX: 1,
    scaleY: 1,
    lookDirection: { x: 0, y: 0 },
    showShadow: true,
    shadowOffsetY: 6,
    showLegs: false,
    legPhase: 0,
    showSpeedLines: false,
    speedDirection: Math.PI,
    showSweat: false,
    glowColor: 0xffffff,
    glowIntensity: 0,
    wobblePhase: 0,
    opacity: 1,
}

export class Wobble extends Container {
    private bodyGraphics: Graphics
    private faceGraphics: Graphics
    private shadowGraphics: Graphics
    private legsGraphics: Graphics
    private glowGraphics: Graphics
    private speedLinesGraphics: Graphics
    private sweatGraphics: Graphics
    private blurFilter: BlurFilter

    private options: Required<WobbleOptions>

    // Gulp animation state
    private gulpPhase = 0 // 0 = not gulping, > 0 = animation progress
    private gulpScale = 1 // Body scale during gulp
    private preGulpExpression: WobbleExpression = 'happy'
    private gulpAnimationId: number | null = null

    constructor(options: WobbleOptions) {
        super()
        this.options = { ...defaultOptions, ...options }

        // Initialize graphics layers (order matters for z-index)
        this.glowGraphics = new Graphics()
        this.shadowGraphics = new Graphics()
        this.speedLinesGraphics = new Graphics()
        this.legsGraphics = new Graphics()
        this.bodyGraphics = new Graphics()
        this.faceGraphics = new Graphics()
        this.sweatGraphics = new Graphics()

        // Setup blur filter for glow
        this.blurFilter = new BlurFilter({ strength: 25 })
        this.glowGraphics.filters = [this.blurFilter]

        // Add in correct z-order
        this.addChild(this.glowGraphics)
        this.addChild(this.shadowGraphics)
        this.addChild(this.speedLinesGraphics)
        this.addChild(this.legsGraphics)
        this.addChild(this.bodyGraphics)
        this.addChild(this.faceGraphics)
        this.addChild(this.sweatGraphics)

        this.draw()
    }

    private getColor(color: string | number): number {
        if (typeof color === 'string') {
            return cssToHex(color)
        }
        return color
    }

    private draw(): void {
        const { opacity } = this.options
        this.alpha = opacity

        this.drawGlow()
        this.drawShadow()
        this.drawSpeedLines()
        this.drawLegs()
        this.drawBody()
        this.drawFace()
        this.drawSweat()
    }

    private drawGlow(): void {
        const { size, glowColor, glowIntensity, scaleX, scaleY, wobblePhase } = this.options
        const g = this.glowGraphics
        g.clear()

        if (glowIntensity <= 0) return

        const color = this.getColor(glowColor)
        g.alpha = glowIntensity * 0.5

        // Simple circular glow
        const r = size * 0.55 * 1.3
        g.ellipse(0, 0, r * scaleX, r * scaleY)
        g.fill(color)
    }

    private drawShadow(): void {
        const { size, showShadow, shadowOffsetY, scaleX, scaleY, wobblePhase } = this.options
        const g = this.shadowGraphics
        g.clear()

        if (!showShadow) return

        // Simple oval shadow - LocoRoco style
        const squashFactor = scaleX / scaleY
        const shadowWidth = size * scaleX * 0.6 * (1 + (squashFactor - 1) * 0.3)
        const shadowHeight = size * 0.06
        const shadowY = size * 0.45 + shadowOffsetY

        // Subtle wobble
        const wobbleOffset = Math.sin(wobblePhase * 1.5) * 1.5

        g.ellipse(wobbleOffset, shadowY, shadowWidth / 2, shadowHeight)
        g.fill({ color: 0x000000, alpha: 0.15 })
    }

    private drawSpeedLines(): void {
        const { size, showSpeedLines, speedDirection } = this.options
        const g = this.speedLinesGraphics
        g.clear()

        if (!showSpeedLines) return

        g.alpha = 0.4

        for (let i = 0; i < 3; i++) {
            const lineOffset = -10 + i * 10
            const startDist = size * 0.55 + 15 + i * 8
            const lineLength = 15 + i * 5

            const x1 = Math.cos(speedDirection) * startDist
            const y1 = Math.sin(speedDirection) * startDist + lineOffset
            const x2 = Math.cos(speedDirection) * (startDist + lineLength)
            const y2 = Math.sin(speedDirection) * (startDist + lineLength) + lineOffset

            g.moveTo(x1, y1)
            g.lineTo(x2, y2)
        }

        g.stroke({ color: 0xffffff, width: 2.5, cap: 'round' })
    }

    private drawLegs(): void {
        const { size, color, showLegs, legPhase, scaleX } = this.options
        const g = this.legsGraphics
        g.clear()

        if (!showLegs) return

        const bodyColor = this.getColor(color)

        ;[-1, 1].forEach((side) => {
            const legLength = size * 0.3
            const legWidth = size * 0.12
            const legBaseY = size * 0.3
            const angle = Math.sin(legPhase + (side === 1 ? Math.PI : 0)) * 0.8

            const baseX = side * size * 0.2 * scaleX
            const baseY = legBaseY

            const footX = baseX + Math.sin(angle) * legLength
            const footY = baseY + Math.abs(Math.cos(angle)) * legLength

            // Simple round foot - LocoRoco style
            g.circle(footX, footY, legWidth)
            g.fill(bodyColor)
            g.stroke({ color: LOCOROCO_OUTLINE, width: 2 })
        })
    }

    private drawBody(): void {
        const { size, color, shape, scaleX, scaleY, wobblePhase } = this.options
        const g = this.bodyGraphics
        g.clear()

        const bodyColor = this.getColor(color)

        // Apply gulp scale effect
        const gulpScaleX = scaleX * this.gulpScale
        const gulpScaleY = scaleY * (2 - this.gulpScale) // Inverse scale for Y to create bulge effect

        // Scale up certain shapes to make room for face
        const shapeScale: Record<WobbleShape, number> = {
            circle: 1,
            square: 1,
            triangle: 1.25,
            star: 1.35,
            diamond: 1.2,
            pentagon: 1.15,
            shadow: 1.1,
            einstein: 1.1,
        }
        const scaledSize = size * (shapeScale[shape] || 1)

        // Draw body based on shape type
        switch (shape) {
            case 'square':
                this.drawSquareBody(g, scaledSize, gulpScaleX, gulpScaleY, wobblePhase)
                break
            case 'triangle':
                this.drawTriangleBody(g, scaledSize, gulpScaleX, gulpScaleY, wobblePhase)
                break
            case 'star':
                this.drawStarBody(g, scaledSize, gulpScaleX, gulpScaleY, wobblePhase)
                break
            case 'diamond':
                this.drawDiamondBody(g, scaledSize, gulpScaleX, gulpScaleY, wobblePhase)
                break
            case 'pentagon':
                this.drawPentagonBody(g, scaledSize, gulpScaleX, gulpScaleY, wobblePhase)
                break
            case 'shadow':
                this.drawShadowBody(g, scaledSize, gulpScaleX, gulpScaleY, wobblePhase)
                break
            case 'einstein':
                this.drawEinsteinBody(g, scaledSize, gulpScaleX, gulpScaleY, wobblePhase)
                break
            default:
                // 원형 워블 (기본)
                this.drawLocoRocoBody(g, size, gulpScaleX, gulpScaleY, wobblePhase)
        }
        g.fill(bodyColor)
        g.stroke({ color: LOCOROCO_OUTLINE, width: 3 })

        // Simple highlight - top left
        const highlightX = -size * 0.15 * scaleX
        const highlightY = -size * 0.2 * scaleY
        g.ellipse(highlightX, highlightY, size * 0.12, size * 0.08)
        g.fill({ color: 0xffffff, alpha: 0.4 })
    }

    private drawLocoRocoBody(
        g: Graphics,
        size: number,
        scaleX: number,
        scaleY: number,
        wobblePhase: number
    ): void {
        const r = size / 2
        const segments = 16
        const wobbleAmount = size * 0.04

        // Smooth, gentle wobble
        const getWobble = (angle: number) => {
            const w1 = Math.sin(wobblePhase * 2.5 + angle * 2) * wobbleAmount
            const w2 = Math.sin(wobblePhase * 1.8 + angle * 3) * wobbleAmount * 0.4
            return w1 + w2
        }

        // Generate points around the wobble
        const points: { x: number; y: number }[] = []
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2 - Math.PI / 2
            const wobble = getWobble(angle)

            // Slightly squashed oval base (LocoRoco are wider than tall)
            const baseX = Math.cos(angle) * r * scaleX * 1.05
            const baseY = Math.sin(angle) * r * scaleY * 0.95

            const nx = Math.cos(angle)
            const ny = Math.sin(angle)

            points.push({
                x: baseX + nx * wobble,
                y: baseY + ny * wobble,
            })
        }

        // Draw smooth curve through points
        g.moveTo(points[0].x, points[0].y)

        for (let i = 0; i < segments; i++) {
            const p0 = points[(i - 1 + segments) % segments]
            const p1 = points[i]
            const p2 = points[(i + 1) % segments]
            const p3 = points[(i + 2) % segments]

            const tension = 0.35
            const cp1x = p1.x + (p2.x - p0.x) * tension
            const cp1y = p1.y + (p2.y - p0.y) * tension
            const cp2x = p2.x - (p3.x - p1.x) * tension
            const cp2y = p2.y - (p3.y - p1.y) * tension

            g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
        }

        g.closePath()
    }

    /**
     * 사각형 워블 - Boxy (박시)
     * 둥근 모서리를 가진 사각형 형태로, 고통받는 표정과 잘 어울림
     */
    private drawSquareBody(
        g: Graphics,
        size: number,
        scaleX: number,
        scaleY: number,
        wobblePhase: number
    ): void {
        const halfSize = size / 2
        const cornerRadius = size * 0.15
        const wobbleAmount = size * 0.03

        const getWobble = (phase: number) => {
            return Math.sin(wobblePhase * 2 + phase) * wobbleAmount
        }

        const topLeftX = -halfSize * scaleX + getWobble(0)
        const topLeftY = -halfSize * scaleY + getWobble(1)
        const topRightX = halfSize * scaleX + getWobble(2)
        const topRightY = -halfSize * scaleY + getWobble(3)
        const bottomRightX = halfSize * scaleX + getWobble(4)
        const bottomRightY = halfSize * scaleY + getWobble(5)
        const bottomLeftX = -halfSize * scaleX + getWobble(6)
        const bottomLeftY = halfSize * scaleY + getWobble(7)

        g.moveTo(topLeftX + cornerRadius, topLeftY)

        g.lineTo(topRightX - cornerRadius, topRightY)
        g.quadraticCurveTo(topRightX, topRightY, topRightX, topRightY + cornerRadius)

        g.lineTo(bottomRightX, bottomRightY - cornerRadius)
        g.quadraticCurveTo(bottomRightX, bottomRightY, bottomRightX - cornerRadius, bottomRightY)

        g.lineTo(bottomLeftX + cornerRadius, bottomLeftY)
        g.quadraticCurveTo(bottomLeftX, bottomLeftY, bottomLeftX, bottomLeftY - cornerRadius)

        g.lineTo(topLeftX, topLeftY + cornerRadius)
        g.quadraticCurveTo(topLeftX, topLeftY, topLeftX + cornerRadius, topLeftY)

        g.closePath()
    }

    /**
     * 삼각형 워블 - Spike (스파이크)
     * 뾰족한 상단이 특징, 적이나 장애물 역할에 적합
     */
    private drawTriangleBody(
        g: Graphics,
        size: number,
        scaleX: number,
        scaleY: number,
        wobblePhase: number
    ): void {
        const halfSize = size / 2
        const wobbleAmount = size * 0.03

        const getWobble = (phase: number) => Math.sin(wobblePhase * 2.5 + phase) * wobbleAmount

        const topX = 0 + getWobble(0)
        const topY = -halfSize * scaleY * 0.9 + getWobble(1)
        const bottomLeftX = -halfSize * scaleX * 0.95 + getWobble(2)
        const bottomLeftY = halfSize * scaleY * 0.7 + getWobble(3)
        const bottomRightX = halfSize * scaleX * 0.95 + getWobble(4)
        const bottomRightY = halfSize * scaleY * 0.7 + getWobble(5)

        const cornerRadius = size * 0.1

        g.moveTo(topX, topY + cornerRadius)
        g.quadraticCurveTo(topX, topY, topX + cornerRadius * 0.5, topY + cornerRadius * 0.3)
        g.lineTo(bottomRightX - cornerRadius, bottomRightY - cornerRadius * 0.5)
        g.quadraticCurveTo(bottomRightX, bottomRightY, bottomRightX - cornerRadius, bottomRightY)
        g.lineTo(bottomLeftX + cornerRadius, bottomLeftY)
        g.quadraticCurveTo(
            bottomLeftX,
            bottomLeftY,
            bottomLeftX + cornerRadius * 0.5,
            bottomLeftY - cornerRadius * 0.5
        )
        g.lineTo(topX - cornerRadius * 0.5, topY + cornerRadius * 0.3)
        g.quadraticCurveTo(topX, topY, topX, topY + cornerRadius)

        g.closePath()
    }

    /**
     * 별 모양 워블 - Twinkle (트윙클)
     * 5개의 뾰족한 끝이 있는 별 모양
     */
    private drawStarBody(
        g: Graphics,
        size: number,
        scaleX: number,
        scaleY: number,
        wobblePhase: number
    ): void {
        const outerRadius = size * 0.5
        const innerRadius = size * 0.25
        const points = 5
        const wobbleAmount = size * 0.025

        const getWobble = (angle: number) => Math.sin(wobblePhase * 3 + angle * 2) * wobbleAmount

        const starPoints: { x: number; y: number }[] = []
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2
            const radius = i % 2 === 0 ? outerRadius : innerRadius
            const wobble = getWobble(angle)
            starPoints.push({
                x: Math.cos(angle) * (radius + wobble) * scaleX,
                y: Math.sin(angle) * (radius + wobble) * scaleY,
            })
        }

        g.moveTo(starPoints[0].x, starPoints[0].y)
        for (let i = 1; i < starPoints.length; i++) {
            const prev = starPoints[i - 1]
            const curr = starPoints[i]
            const cpX = (prev.x + curr.x) / 2
            const cpY = (prev.y + curr.y) / 2
            g.quadraticCurveTo(cpX, cpY, curr.x, curr.y)
        }
        const last = starPoints[starPoints.length - 1]
        const first = starPoints[0]
        g.quadraticCurveTo((last.x + first.x) / 2, (last.y + first.y) / 2, first.x, first.y)

        g.closePath()
    }

    /**
     * 다이아몬드 워블 - Gem (젬)
     * 세로로 긴 마름모 형태
     */
    private drawDiamondBody(
        g: Graphics,
        size: number,
        scaleX: number,
        scaleY: number,
        wobblePhase: number
    ): void {
        const halfWidth = size * 0.4
        const halfHeight = size * 0.55
        const wobbleAmount = size * 0.03

        const getWobble = (phase: number) => Math.sin(wobblePhase * 2 + phase) * wobbleAmount

        const topX = 0 + getWobble(0)
        const topY = -halfHeight * scaleY + getWobble(1)
        const rightX = halfWidth * scaleX + getWobble(2)
        const rightY = 0 + getWobble(3)
        const bottomX = 0 + getWobble(4)
        const bottomY = halfHeight * scaleY + getWobble(5)
        const leftX = -halfWidth * scaleX + getWobble(6)
        const leftY = 0 + getWobble(7)

        const cornerRadius = size * 0.08

        g.moveTo(topX, topY + cornerRadius)
        g.quadraticCurveTo(topX, topY, topX + cornerRadius, topY + cornerRadius * 0.5)
        g.lineTo(rightX - cornerRadius, rightY - cornerRadius * 0.5)
        g.quadraticCurveTo(rightX, rightY, rightX - cornerRadius, rightY + cornerRadius * 0.5)
        g.lineTo(bottomX + cornerRadius, bottomY - cornerRadius * 0.5)
        g.quadraticCurveTo(bottomX, bottomY, bottomX - cornerRadius, bottomY - cornerRadius * 0.5)
        g.lineTo(leftX + cornerRadius, leftY + cornerRadius * 0.5)
        g.quadraticCurveTo(leftX, leftY, leftX + cornerRadius, leftY - cornerRadius * 0.5)
        g.lineTo(topX - cornerRadius, topY + cornerRadius * 0.5)
        g.quadraticCurveTo(topX, topY, topX, topY + cornerRadius)

        g.closePath()
    }

    /**
     * 오각형 워블 - Penta (펜타)
     * 균형 잡힌 5각형 형태
     */
    private drawPentagonBody(
        g: Graphics,
        size: number,
        scaleX: number,
        scaleY: number,
        wobblePhase: number
    ): void {
        const radius = size * 0.48
        const sides = 5
        const wobbleAmount = size * 0.03

        const getWobble = (angle: number) => Math.sin(wobblePhase * 2 + angle * 2) * wobbleAmount

        const pentagonPoints: { x: number; y: number }[] = []
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2
            const wobble = getWobble(angle)
            pentagonPoints.push({
                x: Math.cos(angle) * (radius + wobble) * scaleX,
                y: Math.sin(angle) * (radius + wobble) * scaleY,
            })
        }

        const cornerRadius = size * 0.1

        g.moveTo(pentagonPoints[0].x, pentagonPoints[0].y)
        for (let i = 0; i < sides; i++) {
            const curr = pentagonPoints[i]
            const next = pentagonPoints[(i + 1) % sides]
            const midX = (curr.x + next.x) / 2
            const midY = (curr.y + next.y) / 2
            g.lineTo(midX, midY)
            g.quadraticCurveTo(
                next.x,
                next.y,
                (next.x + pentagonPoints[(i + 2) % sides].x) / 2,
                (next.y + pentagonPoints[(i + 2) % sides].y) / 2
            )
        }

        g.closePath()
    }

    /**
     * 섀도우 워블 - Shadow (섀도우)
     * 뾰족뾰족한 어두운 털이 있는 원형 - 적 캐릭터
     */
    private drawShadowBody(
        g: Graphics,
        size: number,
        scaleX: number,
        scaleY: number,
        wobblePhase: number
    ): void {
        const r = size / 2
        const spikes = 24 // Number of fluffy spikes around the edge
        const spikeDepth = size * 0.12 // How deep the spikes go
        const wobbleAmount = size * 0.02

        const getWobble = (angle: number) => {
            return Math.sin(wobblePhase * 3 + angle * 4) * wobbleAmount
        }

        const points: { x: number; y: number }[] = []

        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
            const isSpike = i % 2 === 0
            const radius = isSpike ? r + spikeDepth : r - spikeDepth * 0.3
            const wobble = getWobble(angle)

            points.push({
                x: Math.cos(angle) * (radius + wobble) * scaleX,
                y: Math.sin(angle) * (radius + wobble) * scaleY,
            })
        }

        // Draw smooth curve through spiky points
        g.moveTo(points[0].x, points[0].y)

        for (let i = 0; i < points.length; i++) {
            const curr = points[i]
            const next = points[(i + 1) % points.length]
            const cpX = (curr.x + next.x) / 2
            const cpY = (curr.y + next.y) / 2
            g.quadraticCurveTo(curr.x, curr.y, cpX, cpY)
        }

        g.closePath()
    }

    /**
     * 아인슈타인 워블 - Albert (알버트)
     * 덥수룩한 흰 머리카락이 특징인 과학자 캐릭터
     */
    private drawEinsteinBody(
        g: Graphics,
        size: number,
        scaleX: number,
        scaleY: number,
        wobblePhase: number
    ): void {
        const r = size / 2
        const wobbleAmount = size * 0.03

        const getWobble = (angle: number) => {
            return Math.sin(wobblePhase * 2.5 + angle * 3) * wobbleAmount
        }

        // Draw wild hair first (behind the face area)
        const hairColor = 0xe8e8e8 // White/gray hair
        const hairSegments = 20
        const hairStartAngle = -Math.PI * 0.85 // Start from upper left
        const hairEndAngle = -Math.PI * 0.15 // End at upper right

        // Hair puffs - multiple layers of wild, frizzy hair
        for (let layer = 0; layer < 3; layer++) {
            const layerOffset = layer * size * 0.08
            const puffSize = size * (0.15 - layer * 0.03)

            for (let i = 0; i <= hairSegments; i++) {
                const t = i / hairSegments
                const angle = hairStartAngle + (hairEndAngle - hairStartAngle) * t
                const hairWobble = Math.sin(wobblePhase * 4 + i * 0.8 + layer) * size * 0.04

                // Hair extends outward from the head
                const baseRadius = r * 0.95 + layerOffset
                const cx = Math.cos(angle) * baseRadius * scaleX
                const cy = Math.sin(angle) * baseRadius * scaleY + hairWobble

                // Draw individual hair puff
                const puffWobble = Math.sin(wobblePhase * 3 + i * 1.2) * puffSize * 0.3
                g.circle(cx, cy, puffSize + puffWobble)
            }
        }
        g.fill(hairColor)
        g.stroke({ color: 0xcccccc, width: 1.5 })

        // Draw side hair tufts (Einstein's signature messy side hair)
        ;[-1, 1].forEach((side) => {
            const sideHairX = side * r * 0.75 * scaleX
            const sideHairY = -size * 0.1

            for (let i = 0; i < 4; i++) {
                const tuftAngle = side * (Math.PI * 0.3 + i * 0.15)
                const tuftLength = size * (0.2 + Math.random() * 0.1)
                const tuftWobble = Math.sin(wobblePhase * 3 + i) * size * 0.03

                const tuftX = sideHairX + Math.cos(tuftAngle) * tuftLength
                const tuftY = sideHairY + Math.sin(tuftAngle) * tuftLength * 0.5 + tuftWobble

                g.circle(tuftX, tuftY, size * 0.08)
            }
        })
        g.fill(hairColor)
        g.stroke({ color: 0xcccccc, width: 1 })

        // Draw main body (egg-shaped, slightly taller)
        const segments = 16
        const points: { x: number; y: number }[] = []

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2 - Math.PI / 2
            const wobble = getWobble(angle)

            // Egg shape - wider at bottom, narrower at top where hair is
            const topSquash = angle < 0 ? 0.9 : 1.0 // Slightly narrower at top
            const baseX = Math.cos(angle) * r * scaleX * topSquash
            const baseY = Math.sin(angle) * r * scaleY * 0.95

            const nx = Math.cos(angle)
            const ny = Math.sin(angle)

            points.push({
                x: baseX + nx * wobble,
                y: baseY + ny * wobble,
            })
        }

        // Draw smooth curve through points
        g.moveTo(points[0].x, points[0].y)

        for (let i = 0; i < segments; i++) {
            const p0 = points[(i - 1 + segments) % segments]
            const p1 = points[i]
            const p2 = points[(i + 1) % segments]
            const p3 = points[(i + 2) % segments]

            const tension = 0.35
            const cp1x = p1.x + (p2.x - p0.x) * tension
            const cp1y = p1.y + (p2.y - p0.y) * tension
            const cp2x = p2.x - (p3.x - p1.x) * tension
            const cp2y = p2.y - (p3.y - p1.y) * tension

            g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
        }

        g.closePath()
    }

    private drawFace(): void {
        const { size, expression, scaleX, scaleY, lookDirection, shape } = this.options
        const g = this.faceGraphics
        g.clear()

        if (expression === 'none') return

        // LocoRoco-style face proportions
        const eyeSize = size * 0.09
        const eyeSpacing = size * 0.16
        const eyeY = -size * 0.05 * scaleY
        const lookX = lookDirection.x * 2
        const lookY = lookDirection.y * 2
        const mouthY = eyeY + eyeSize * 2.8

        // Draw eyes
        this.drawLocoRocoEyes(g, expression, eyeSpacing, eyeSize, eyeY, lookX, lookY)

        // Draw Einstein's iconic mustache (before mouth so mouth can overlap if needed)
        if (shape === 'einstein' && expression !== 'eating') {
            this.drawEinsteinMustache(g, mouthY, eyeSpacing, eyeSize)
        }

        // Draw mouth
        this.drawLocoRocoMouth(g, expression, mouthY, eyeSpacing, eyeSize)

        // Draw cheeks for happy/excited expressions
        if (expression === 'happy' || expression === 'excited' || expression === 'sleepy') {
            const cheekY = eyeY + eyeSize * 1.2
            g.ellipse(-eyeSpacing - eyeSize * 0.3, cheekY, eyeSize * 0.55, eyeSize * 0.4)
            g.ellipse(eyeSpacing + eyeSize * 0.3, cheekY, eyeSize * 0.55, eyeSize * 0.4)
            g.fill({ color: LOCOROCO_CHEEK, alpha: 0.5 })
        }
    }

    /**
     * Draw Einstein's iconic bushy mustache
     */
    private drawEinsteinMustache(
        g: Graphics,
        mouthY: number,
        eyeSpacing: number,
        eyeSize: number
    ): void {
        const mustacheY = mouthY - eyeSize * 0.8
        const mustacheWidth = eyeSpacing * 1.4
        const mustacheHeight = eyeSize * 0.7
        const mustacheColor = 0xd0d0d0 // Light gray mustache

        // Draw bushy mustache with multiple overlapping ellipses
        // Center part
        g.ellipse(0, mustacheY, mustacheWidth * 0.4, mustacheHeight * 0.6)
        g.fill(mustacheColor)

        // Left side - droopy
        g.ellipse(-mustacheWidth * 0.35, mustacheY + eyeSize * 0.15, mustacheWidth * 0.35, mustacheHeight * 0.5)
        g.fill(mustacheColor)

        // Right side - droopy
        g.ellipse(mustacheWidth * 0.35, mustacheY + eyeSize * 0.15, mustacheWidth * 0.35, mustacheHeight * 0.5)
        g.fill(mustacheColor)

        // Add some texture/detail with smaller circles
        ;[-1, 0, 1].forEach((pos) => {
            g.ellipse(pos * mustacheWidth * 0.25, mustacheY - eyeSize * 0.1, eyeSize * 0.3, eyeSize * 0.2)
        })
        g.fill({ color: 0xe0e0e0, alpha: 0.7 })

        // Outline for definition
        g.moveTo(-mustacheWidth * 0.6, mustacheY + eyeSize * 0.3)
        g.quadraticCurveTo(-mustacheWidth * 0.3, mustacheY - eyeSize * 0.2, 0, mustacheY - eyeSize * 0.1)
        g.quadraticCurveTo(mustacheWidth * 0.3, mustacheY - eyeSize * 0.2, mustacheWidth * 0.6, mustacheY + eyeSize * 0.3)
        g.stroke({ color: 0xaaaaaa, width: 1.5, cap: 'round' })
    }

    private drawLocoRocoEyes(
        g: Graphics,
        expression: WobbleExpression,
        eyeSpacing: number,
        eyeSize: number,
        eyeY: number,
        lookX: number,
        lookY: number
    ): void {
        const bigEyeSize = eyeSize * 1.2

        if (expression === 'struggle' || expression === 'dizzy') {
            const xSize = bigEyeSize * 0.6
            ;[-1, 1].forEach((side) => {
                const cx = side * eyeSpacing
                if (expression === 'struggle') {
                    g.moveTo(cx - xSize, eyeY - xSize)
                    g.lineTo(cx + xSize, eyeY + xSize)
                    g.moveTo(cx + xSize, eyeY - xSize)
                    g.lineTo(cx - xSize, eyeY + xSize)
                    g.stroke({ color: LOCOROCO_OUTLINE, width: 2.5, cap: 'round' })
                } else {
                    g.circle(cx, eyeY, bigEyeSize * 0.7)
                    g.stroke({ color: LOCOROCO_OUTLINE, width: 2 })
                    g.circle(cx, eyeY, bigEyeSize * 0.35)
                    g.stroke({ color: LOCOROCO_OUTLINE, width: 2 })
                }
            })
        } else if (expression === 'sleepy') {
            ;[-1, 1].forEach((side) => {
                const cx = side * eyeSpacing
                g.moveTo(cx - bigEyeSize * 0.7, eyeY)
                g.quadraticCurveTo(cx, eyeY + bigEyeSize * 0.3, cx + bigEyeSize * 0.7, eyeY)
                g.stroke({ color: LOCOROCO_OUTLINE, width: 2.5, cap: 'round' })
            })
        } else if (expression === 'surprised') {
            ;[-1, 1].forEach((side) => {
                const cx = side * eyeSpacing + lookX * 0.5
                g.circle(cx, eyeY + lookY * 0.5, bigEyeSize)
                g.fill(LOCOROCO_OUTLINE)
                g.circle(
                    cx - bigEyeSize * 0.3,
                    eyeY - bigEyeSize * 0.3 + lookY * 0.3,
                    bigEyeSize * 0.25
                )
                g.fill(0xffffff)
            })
        } else if (expression === 'effort' || expression === 'charge') {
            ;[-1, 1].forEach((side) => {
                const cx = side * eyeSpacing + lookX * 0.5
                g.ellipse(cx, eyeY + lookY * 0.3, bigEyeSize * 0.8, bigEyeSize * 0.3)
                g.fill(LOCOROCO_OUTLINE)
            })
        } else if (expression === 'worried') {
            ;[-1, 1].forEach((side) => {
                const cx = side * eyeSpacing + lookX * 0.5
                g.circle(cx, eyeY + lookY * 0.5, bigEyeSize * 0.85)
                g.fill(LOCOROCO_OUTLINE)
                g.circle(cx - bigEyeSize * 0.25, eyeY - bigEyeSize * 0.2, bigEyeSize * 0.2)
                g.fill(0xffffff)
                const browY = eyeY - bigEyeSize * 1.3
                g.moveTo(cx - bigEyeSize * 0.5, browY + side * bigEyeSize * 0.35)
                g.lineTo(cx + bigEyeSize * 0.35, browY - side * bigEyeSize * 0.1)
                g.stroke({ color: LOCOROCO_OUTLINE, width: 2.5, cap: 'round' })
            })
        } else if (expression === 'hot') {
            ;[-1, 1].forEach((side) => {
                const cx = side * eyeSpacing
                g.ellipse(cx, eyeY, bigEyeSize * 0.65, bigEyeSize * 0.45)
                g.fill(LOCOROCO_OUTLINE)
            })
        } else if (expression === 'angry') {
            // Angry narrowed eyes with yellow/gold color (like the shadow enemy)
            ;[-1, 1].forEach((side) => {
                const cx = side * eyeSpacing + lookX * 0.5
                // Yellow/gold angry eye
                g.ellipse(cx, eyeY + lookY * 0.3, bigEyeSize * 0.9, bigEyeSize * 0.5)
                g.fill(0xd4a017) // Gold/yellow color
                g.ellipse(cx, eyeY + lookY * 0.3, bigEyeSize * 0.9, bigEyeSize * 0.5)
                g.stroke({ color: LOCOROCO_OUTLINE, width: 2 })
                // Black pupil
                g.circle(cx + lookX * 0.2, eyeY + lookY * 0.3, bigEyeSize * 0.35)
                g.fill(LOCOROCO_OUTLINE)
                // Angry eyebrow - angled inward
                const browY = eyeY - bigEyeSize * 1.2
                g.moveTo(cx - side * bigEyeSize * 0.8, browY - side * bigEyeSize * 0.4)
                g.lineTo(cx + side * bigEyeSize * 0.3, browY + side * bigEyeSize * 0.2)
                g.stroke({ color: LOCOROCO_OUTLINE, width: 3, cap: 'round' })
            })
        } else if (expression === 'eating') {
            // Squinted happy eyes while eating (like >ω<)
            ;[-1, 1].forEach((side) => {
                const cx = side * eyeSpacing
                // Draw as thick arcs - very squinted
                g.moveTo(cx - bigEyeSize * 0.8, eyeY)
                g.quadraticCurveTo(cx, eyeY - bigEyeSize * 0.6, cx + bigEyeSize * 0.8, eyeY)
                g.stroke({ color: LOCOROCO_OUTLINE, width: 3.5, cap: 'round' })
            })
            // Add blush marks
            ;[-1, 1].forEach((side) => {
                const cx = side * (eyeSpacing + bigEyeSize * 0.5)
                g.ellipse(cx, eyeY + bigEyeSize * 0.8, bigEyeSize * 0.5, bigEyeSize * 0.3)
                g.fill({ color: 0xff6b6b, alpha: 0.5 })
            })
        } else {
            ;[-1, 1].forEach((side) => {
                const cx = side * eyeSpacing + lookX * 0.5
                g.circle(cx, eyeY + lookY * 0.5, bigEyeSize * 0.9)
                g.fill(LOCOROCO_OUTLINE)
                g.circle(
                    cx - bigEyeSize * 0.25,
                    eyeY - bigEyeSize * 0.25 + lookY * 0.3,
                    bigEyeSize * 0.25
                )
                g.fill(0xffffff)
            })

            if (expression === 'excited') {
                ;[-1, 1].forEach((side) => {
                    const cx = side * eyeSpacing + lookX * 0.5
                    g.circle(cx + bigEyeSize * 0.1, eyeY + bigEyeSize * 0.1, bigEyeSize * 0.1)
                    g.fill(0xffffff)
                })
            }
        }
    }

    private drawLocoRocoMouth(
        g: Graphics,
        expression: WobbleExpression,
        mouthY: number,
        eyeSpacing: number,
        eyeSize: number
    ): void {
        const mouthWidth = eyeSpacing * 0.9
        const mouthSize = eyeSize * 1.1

        if (expression === 'surprised') {
            g.circle(0, mouthY, mouthSize * 0.8)
            g.fill(LOCOROCO_OUTLINE)
        } else if (expression === 'excited') {
            g.ellipse(0, mouthY, mouthSize * 1.1, mouthSize * 0.7)
            g.fill(LOCOROCO_OUTLINE)
            g.ellipse(0, mouthY + mouthSize * 0.2, mouthSize * 0.5, mouthSize * 0.3)
            g.fill(0xe87e4d)
        } else if (expression === 'struggle') {
            g.moveTo(-mouthWidth * 0.6, mouthY)
            g.bezierCurveTo(
                -mouthWidth * 0.3,
                mouthY - eyeSize * 0.3,
                mouthWidth * 0.3,
                mouthY + eyeSize * 0.3,
                mouthWidth * 0.6,
                mouthY
            )
            g.stroke({ color: LOCOROCO_OUTLINE, width: 2.5, cap: 'round' })
        } else if (expression === 'neutral' || expression === 'sleepy') {
            g.moveTo(-mouthWidth * 0.4, mouthY)
            g.lineTo(mouthWidth * 0.4, mouthY)
            g.stroke({ color: LOCOROCO_OUTLINE, width: 2.5, cap: 'round' })
        } else if (expression === 'hot') {
            g.ellipse(0, mouthY, mouthSize, mouthSize * 0.7)
            g.fill(LOCOROCO_OUTLINE)
            g.ellipse(0, mouthY + mouthSize * 0.4, mouthSize * 0.6, mouthSize * 0.4)
            g.fill(0xe87e4d)
        } else if (expression === 'charge' || expression === 'effort') {
            g.ellipse(0, mouthY, mouthSize * 0.4, mouthSize * 0.3)
            g.fill(LOCOROCO_OUTLINE)
        } else if (expression === 'worried') {
            g.moveTo(-mouthWidth * 0.5, mouthY - mouthSize * 0.2)
            g.quadraticCurveTo(
                0,
                mouthY + mouthSize * 0.5,
                mouthWidth * 0.5,
                mouthY - mouthSize * 0.2
            )
            g.stroke({ color: LOCOROCO_OUTLINE, width: 2.5, cap: 'round' })
        } else if (expression === 'dizzy') {
            g.moveTo(-mouthWidth * 0.5, mouthY)
            g.bezierCurveTo(
                -mouthWidth * 0.25,
                mouthY - mouthSize * 0.4,
                mouthWidth * 0.25,
                mouthY + mouthSize * 0.4,
                mouthWidth * 0.5,
                mouthY
            )
            g.stroke({ color: LOCOROCO_OUTLINE, width: 2.5, cap: 'round' })
        } else if (expression === 'angry') {
            // Small frowning mouth
            g.ellipse(0, mouthY, mouthSize * 0.5, mouthSize * 0.35)
            g.fill(LOCOROCO_OUTLINE)
        } else if (expression === 'eating') {
            // HUGE open mouth like Kirby inhaling - very dramatic!
            const baseSize = mouthSize * 2.5
            const openSize = baseSize * (0.8 + this.gulpPhase * 0.5)

            // Outer mouth (black outline)
            g.circle(0, mouthY + openSize * 0.2, openSize)
            g.fill(LOCOROCO_OUTLINE)

            // Inner mouth (dark red/pink)
            g.circle(0, mouthY + openSize * 0.2, openSize * 0.85)
            g.fill(0x2a0a0a)

            // Tongue at bottom
            g.ellipse(0, mouthY + openSize * 0.5, openSize * 0.6, openSize * 0.35)
            g.fill(0xe87e4d)

            // Highlight on tongue
            g.ellipse(-openSize * 0.15, mouthY + openSize * 0.4, openSize * 0.15, openSize * 0.1)
            g.fill({ color: 0xffaa88, alpha: 0.5 })
        } else {
            g.moveTo(-mouthWidth * 0.6, mouthY - mouthSize * 0.15)
            g.quadraticCurveTo(
                0,
                mouthY + mouthSize * 0.5,
                mouthWidth * 0.6,
                mouthY - mouthSize * 0.15
            )
            g.stroke({ color: LOCOROCO_OUTLINE, width: 3, cap: 'round' })
        }
    }

    private drawSweat(): void {
        const { size, showSweat, scaleY } = this.options
        const g = this.sweatGraphics
        g.clear()

        if (!showSweat) return

        const eyeSize = size * 0.08
        const eyeY = -size * 0.08 * scaleY
        const sweatX = size * 0.35
        const sweatY = eyeY - eyeSize * 1.5

        g.moveTo(sweatX, sweatY - 6)
        g.quadraticCurveTo(sweatX + 5, sweatY, sweatX, sweatY + 6)
        g.quadraticCurveTo(sweatX - 5, sweatY, sweatX, sweatY - 6)
        g.fill(0x87ceeb)
        g.stroke({ color: 0x5dade2, width: 1 })
    }

    /**
     * Update wobble options and redraw
     */
    public updateOptions(options: Partial<WobbleOptions>): void {
        this.options = { ...this.options, ...options }
        this.draw()
    }

    /**
     * Set wobble position
     */
    public setPosition(x: number, y: number): void {
        this.position.set(x, y)
    }

    /**
     * Get current options
     */
    public getOptions(): Required<WobbleOptions> {
        return { ...this.options }
    }

    /**
     * Trigger gulp/eating animation (like Kirby eating)
     * Uses internal timer that persists across draw() calls
     * @param duration Animation duration in milliseconds (default 350ms)
     */
    public gulp(duration: number = 350): void {
        // Store the current expression to restore after
        if (!this.isGulping()) {
            this.preGulpExpression = this.options.expression
        }

        // Start gulp animation timer - very dramatic!
        this.gulpPhase = 1 // Start at peak
        this.gulpScale = 1.5 // Start very expanded (50% bigger)

        // Set eating expression
        this.options.expression = 'eating'

        // Clear any existing timeout
        if (this.gulpAnimationId !== null) {
            clearTimeout(this.gulpAnimationId as unknown as number)
        }

        // Schedule end of animation
        this.gulpAnimationId = setTimeout(() => {
            this.gulpScale = 1
            this.gulpPhase = 0
            this.options.expression = this.preGulpExpression
            this.gulpAnimationId = null
        }, duration) as unknown as number
    }

    /**
     * Update gulp animation state - call this every frame
     * @param deltaTime Time since last frame in seconds
     */
    public updateGulp(deltaTime: number): void {
        if (this.gulpPhase > 0) {
            // Decay gulp phase over time (slower for more visible effect)
            this.gulpPhase = Math.max(0, this.gulpPhase - deltaTime * 3)
            // Scale follows phase with dramatic effect (up to 50% bigger)
            this.gulpScale = 1 + this.gulpPhase * 0.5

            if (this.gulpPhase <= 0) {
                this.gulpScale = 1
                this.options.expression = this.preGulpExpression
            }
        }
    }

    /**
     * Check if currently in gulp animation
     */
    public isGulping(): boolean {
        return this.gulpPhase > 0
    }

    /**
     * Get current gulp phase (0-1) for external animation sync
     */
    public getGulpPhase(): number {
        return this.gulpPhase
    }
}

// Backwards compatibility aliases
export type BlobExpression = WobbleExpression
export type BlobShape = WobbleShape
export type BlobOptions = WobbleOptions
export const Blob = Wobble
