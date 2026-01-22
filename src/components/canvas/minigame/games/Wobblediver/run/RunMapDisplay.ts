/**
 * RunMapDisplay.ts - Eldritch abyss descent visualization for Wobblediver runs
 *
 * Renders an immersive Cthulhu-inspired deep-sea descent with:
 * - Eldritch tentacle creatures as nodes (eyes, tentacles, void cores)
 * - Depth-based color zones (surface → twilight → abyss → hadal)
 * - Floating particles and bioluminescence
 * - Organic, unsettling animations
 */

import { Container, Graphics, Text, TextStyle, Sprite, Texture } from 'pixi.js'
import { RunMap, MapNode, RunRank, parseNodeId } from './RunMapTypes'
import { BalatroFilter } from '@/components/canvas/filters/BalatroFilter'

/**
 * Depth zone definitions
 */
const DEPTH_ZONES = {
    surface: { maxDepth: 2, name: '표층' },
    twilight: { maxDepth: 4, name: '황혼층' },
    midnight: { maxDepth: 7, name: '심야층' },
    abyssal: { maxDepth: 9, name: '심연층' },
    hadal: { maxDepth: 999, name: '해연층' },
}

function getDepthZone(depth: number): keyof typeof DEPTH_ZONES {
    if (depth <= DEPTH_ZONES.surface.maxDepth) return 'surface'
    if (depth <= DEPTH_ZONES.twilight.maxDepth) return 'twilight'
    if (depth <= DEPTH_ZONES.midnight.maxDepth) return 'midnight'
    if (depth <= DEPTH_ZONES.abyssal.maxDepth) return 'abyssal'
    return 'hadal'
}

/**
 * Eldritch visual configuration
 */
const ABYSS_CONFIG = {
    // Layout
    nodeRadius: 24,
    nodeSpacingY: 180, // Increased spacing for better descent feel
    padding: { top: 160, bottom: 200 },

    // Zone colors - increasingly ominous
    zoneColors: {
        surface: {
            primary: 0x00d4aa,
            secondary: 0x008877,
            glow: 0x44ffcc,
            eye: 0x00ffaa,
            tentacle: 0x006655,
            background: [0.0, 0.2, 0.25],
        },
        twilight: {
            primary: 0x6644aa,
            secondary: 0x443377,
            glow: 0x9966ff,
            eye: 0x8855ee,
            tentacle: 0x332255,
            background: [0.05, 0.08, 0.18],
        },
        midnight: {
            primary: 0x9933aa,
            secondary: 0x661177,
            glow: 0xcc44ff,
            eye: 0xaa22ff,
            tentacle: 0x440066,
            background: [0.06, 0.02, 0.12],
        },
        abyssal: {
            primary: 0xaa2244,
            secondary: 0x771133,
            glow: 0xff3366,
            eye: 0xff2255,
            tentacle: 0x550022,
            background: [0.08, 0.01, 0.05],
        },
        hadal: {
            primary: 0x660033,
            secondary: 0x330018,
            glow: 0xaa0044,
            eye: 0xcc0033,
            tentacle: 0x220011,
            background: [0.03, 0.0, 0.02],
        },
    },

    // Particle settings
    bubbleSpeed: 35,

    // Eldritch node configuration
    eldritch: {
        tentacleCount: 6,
        tentacleLength: 35,
        tentacleSegments: 5,
        eyeRadius: 12,
        pupilRadius: 5,
        bodyRadius: 18,
    },

    // Rank colors
    rankColors: {
        S: 0xffd700,
        A: 0x00ffcc,
        B: 0xaa66ff,
        C: 0xff8844,
        D: 0x556677,
    },

    // Animation speeds
    animation: {
        tentacleWave: 2.0,
        eyeBlink: 0.15,
        breathe: 1.5,
        glowPulse: 2.0,
    },
}

/**
 * Particle types for atmosphere
 */
interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    alpha: number
    type: 'bubble' | 'plankton' | 'debris' | 'bioluminescent'
    color: number
    phase: number
}

/**
 * Eldritch node animation state
 */
interface EldritchNodeState {
    nodeId: string
    tentaclePhases: number[]
    eyeOpenness: number
    targetEyeOpenness: number
    breathePhase: number
    pupilOffsetX: number
    pupilOffsetY: number
    glowIntensity: number
}

/**
 * Abyss descent map display
 */
export class RunMapDisplay {
    readonly container: Container
    private width: number
    private height: number

    // Visual layers (back to front)
    private backgroundSprite: Sprite | null = null
    private backgroundFilter: BalatroFilter | null = null
    private depthGradientGraphics: Graphics
    private particleContainer: Container
    private connectionsContainer: Container
    private nodesContainer: Container
    private tentacleContainer: Container
    private uiContainer: Container

    // Map data
    private map: RunMap | null = null
    private currentNodeId: string | null = null
    private completedNodeIds: Set<string> = new Set()
    private availableNodeIds: Set<string> = new Set()

    // Scroll state
    private scrollY: number = 0
    private scrollVelocity: number = 0
    private maxScrollY: number = 0
    private isDragging: boolean = false
    private lastDragY: number = 0

    // Animation state
    private animTime: number = 0
    private nodeGraphics: Map<string, Container> = new Map()
    private eldritchStates: Map<string, EldritchNodeState> = new Map()

    // Particles
    private particles: Particle[] = []

    // Tentacles
    private tentacles: {
        side: 'left' | 'right'
        baseY: number
        length: number
        segments: number
        phase: number
        speed: number
        thickness: number
        color: number
    }[] = []

    // Depth indicator
    private depthText: Text | null = null
    private zoneText: Text | null = null

    // Transition animation state
    private transitionState: {
        active: boolean
        nodeId: string | null
        progress: number
        phase: 'opening' | 'expanding' | 'complete'
    } = { active: false, nodeId: null, progress: 0, phase: 'opening' }
    private transitionOverlay: Graphics | null = null

    // Callbacks
    onNodeSelected: ((nodeId: string) => void) | null = null
    onTransitionComplete: ((nodeId: string) => void) | null = null

    constructor(width: number, height: number) {
        this.width = width
        this.height = height

        this.container = new Container()
        this.container.eventMode = 'static'

        // Create layers (order matters for rendering)
        this.depthGradientGraphics = new Graphics()
        this.particleContainer = new Container()
        this.tentacleContainer = new Container()
        this.connectionsContainer = new Container()
        this.nodesContainer = new Container()
        this.uiContainer = new Container()

        this.container.addChild(this.depthGradientGraphics)
        this.container.addChild(this.particleContainer)
        this.container.addChild(this.tentacleContainer)
        this.container.addChild(this.connectionsContainer)
        this.container.addChild(this.nodesContainer)
        this.container.addChild(this.uiContainer)

        // Transition overlay (on top of everything)
        this.transitionOverlay = new Graphics()
        this.transitionOverlay.visible = false
        this.container.addChild(this.transitionOverlay)

        this.setupBackground()
        this.setupParticles()
        this.setupTentacles()
        this.setupDepthIndicator()
        this.setupInteraction()
    }

    /**
     * Set the map to display
     */
    setMap(
        map: RunMap,
        currentNodeId: string | null,
        completedNodeIds: string[],
        availableNodeIds: string[]
    ): void {
        this.map = map
        this.currentNodeId = currentNodeId
        this.completedNodeIds = new Set(completedNodeIds)
        this.availableNodeIds = new Set(availableNodeIds)

        // Reset scroll state
        this.scrollY = 0
        this.scrollVelocity = 0

        // Calculate scroll bounds
        const totalHeight =
            ABYSS_CONFIG.padding.top +
            map.maxDepth * ABYSS_CONFIG.nodeSpacingY +
            ABYSS_CONFIG.padding.bottom
        this.maxScrollY = Math.max(0, totalHeight - this.height)

        // Auto-scroll to appropriate position
        if (currentNodeId) {
            const { depth } = parseNodeId(currentNodeId)
            this.scrollToDepth(depth)
        } else if (completedNodeIds.length > 0) {
            const lastId = completedNodeIds[completedNodeIds.length - 1]
            const { depth } = parseNodeId(lastId)
            this.scrollToDepth(depth + 1)
        } else {
            this.scrollToDepth(1)
        }

        // Apply scroll immediately
        this.applyScroll()

        // Redraw everything
        this.drawMap()
        this.drawDepthGradient()
    }

    private scrollToDepth(depth: number): void {
        const targetY =
            ABYSS_CONFIG.padding.top + depth * ABYSS_CONFIG.nodeSpacingY - this.height / 2
        this.scrollY = Math.max(0, Math.min(this.maxScrollY, targetY))
    }

    private applyScroll(): void {
        this.connectionsContainer.y = -this.scrollY
        this.nodesContainer.y = -this.scrollY
        this.particleContainer.y = -this.scrollY * 0.3 // Parallax effect
    }

    /**
     * Setup animated background with BalatroFilter
     */
    private setupBackground(): void {
        this.backgroundSprite = new Sprite(Texture.WHITE)
        this.backgroundSprite.width = this.width
        this.backgroundSprite.height = this.height
        this.container.addChildAt(this.backgroundSprite, 0)

        this.backgroundFilter = new BalatroFilter({
            color1: [0.02, 0.08, 0.12, 1.0],
            color2: [0.05, 0.03, 0.1, 1.0],
            color3: [0.01, 0.01, 0.03, 1.0],
            spinSpeed: 1.5,
            contrast: 2.5,
            lighting: 0.08,
            spinAmount: 0.15,
            pixelFilter: 900.0,
            spinEase: 0.6,
        })
        this.backgroundFilter.setDimensions(this.width, this.height)
        this.backgroundSprite.filters = [this.backgroundFilter]
    }

    /**
     * Draw depth-based gradient overlay
     */
    private drawDepthGradient(): void {
        if (!this.map) return

        this.depthGradientGraphics.clear()

        // Draw subtle zone transition overlays
        const maxDepth = this.map.maxDepth

        for (let depth = 1; depth <= maxDepth; depth++) {
            const zone = getDepthZone(depth)
            const colors = ABYSS_CONFIG.zoneColors[zone]
            const y = ABYSS_CONFIG.padding.top + depth * ABYSS_CONFIG.nodeSpacingY

            // Draw a subtle horizontal glow line at each depth
            const glowHeight = 60
            for (let i = 0; i < glowHeight; i++) {
                const alpha = 0.03 * (1 - i / glowHeight)
                const yPos = y - glowHeight / 2 + i
                this.depthGradientGraphics.moveTo(0, yPos)
                this.depthGradientGraphics.lineTo(this.width, yPos)
                this.depthGradientGraphics.stroke({
                    color:
                        (Math.floor(colors.background[0] * 255) << 16) |
                        (Math.floor(colors.background[1] * 255) << 8) |
                        Math.floor(colors.background[2] * 255),
                    width: 1,
                    alpha,
                })
            }
        }
    }

    /**
     * Setup atmospheric particles
     */
    private setupParticles(): void {
        this.particles = []

        // Create particles across the entire map height
        const totalHeight = this.height * 3
        const particleCount = 60

        for (let i = 0; i < particleCount; i++) {
            const y = Math.random() * totalHeight
            const depthAtY = Math.floor(y / ABYSS_CONFIG.nodeSpacingY)
            const zone = getDepthZone(depthAtY)
            const zoneColors = ABYSS_CONFIG.zoneColors[zone]

            // Determine particle type based on zone
            let type: Particle['type']
            let color: number
            let size: number

            const rand = Math.random()
            if (zone === 'surface' || zone === 'twilight') {
                // More bubbles near surface
                if (rand < 0.5) {
                    type = 'bubble'
                    color = 0xaaddff
                    size = 2 + Math.random() * 4
                } else if (rand < 0.8) {
                    type = 'plankton'
                    color = zoneColors.glow
                    size = 1 + Math.random() * 2
                } else {
                    type = 'debris'
                    color = 0x556677
                    size = 1 + Math.random() * 3
                }
            } else {
                // More bioluminescence in deep zones
                if (rand < 0.6) {
                    type = 'bioluminescent'
                    color = zoneColors.glow
                    size = 1 + Math.random() * 3
                } else if (rand < 0.85) {
                    type = 'debris'
                    color = 0x334455
                    size = 1 + Math.random() * 2
                } else {
                    type = 'bubble'
                    color = 0x667788
                    size = 2 + Math.random() * 3
                }
            }

            this.particles.push({
                x: Math.random() * this.width,
                y,
                vx: (Math.random() - 0.5) * 10,
                vy: type === 'bubble' ? -ABYSS_CONFIG.bubbleSpeed * (0.5 + Math.random() * 0.5) : (Math.random() - 0.5) * 5,
                size,
                alpha: 0.3 + Math.random() * 0.5,
                type,
                color,
                phase: Math.random() * Math.PI * 2,
            })
        }
    }

    /**
     * Setup edge tentacles with more organic appearance
     */
    private setupTentacles(): void {
        this.tentacles = []

        const tentacleCount = Math.floor(this.height / 100)

        for (let i = 0; i < tentacleCount; i++) {
            // Left tentacles
            this.tentacles.push({
                side: 'left',
                baseY: 80 + i * 100 + Math.random() * 40,
                length: 50 + Math.random() * 40,
                segments: 6 + Math.floor(Math.random() * 4),
                phase: Math.random() * Math.PI * 2,
                speed: 0.6 + Math.random() * 0.4,
                thickness: 4 + Math.random() * 4,
                color: 0x3a1a30,
            })

            // Right tentacles
            this.tentacles.push({
                side: 'right',
                baseY: 80 + i * 100 + Math.random() * 40,
                length: 50 + Math.random() * 40,
                segments: 6 + Math.floor(Math.random() * 4),
                phase: Math.random() * Math.PI * 2,
                speed: 0.6 + Math.random() * 0.4,
                thickness: 4 + Math.random() * 4,
                color: 0x3a1a30,
            })
        }
    }

    /**
     * Setup depth indicator UI
     */
    private setupDepthIndicator(): void {
        // Depth label (small, thematic)
        const labelText = new Text({
            text: '심도',
            style: new TextStyle({
                fontFamily: 'sans-serif',
                fontSize: 10,
                fill: 0x667788,
                dropShadow: {
                    alpha: 0.6,
                    blur: 2,
                    color: 0x000000,
                    distance: 1,
                },
            }),
        })
        labelText.anchor.set(0, 0)
        labelText.position.set(16, 12)
        this.uiContainer.addChild(labelText)

        // Depth number (large)
        this.depthText = new Text({
            text: '1',
            style: new TextStyle({
                fontFamily: 'monospace',
                fontSize: 32,
                fontWeight: 'bold',
                fill: 0x66ffcc,
                dropShadow: {
                    alpha: 0.8,
                    blur: 6,
                    color: 0x000000,
                    distance: 2,
                },
            }),
        })
        this.depthText.anchor.set(0, 0)
        this.depthText.position.set(16, 24)
        this.uiContainer.addChild(this.depthText)

        // Zone name
        this.zoneText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'sans-serif',
                fontSize: 11,
                fill: 0x88aacc,
                dropShadow: {
                    alpha: 0.6,
                    blur: 2,
                    color: 0x000000,
                    distance: 1,
                },
            }),
        })
        this.zoneText.anchor.set(0, 0)
        this.zoneText.position.set(16, 60)
        this.uiContainer.addChild(this.zoneText)
    }

    /**
     * Setup touch/drag interaction
     */
    private setupInteraction(): void {
        this.container.on('pointerdown', this.onPointerDown.bind(this))
        this.container.on('pointermove', this.onPointerMove.bind(this))
        this.container.on('pointerup', this.onPointerUp.bind(this))
        this.container.on('pointerupoutside', this.onPointerUp.bind(this))
    }

    private onPointerDown(e: any): void {
        this.isDragging = true
        this.lastDragY = e.global.y
        this.scrollVelocity = 0
    }

    private onPointerMove(e: any): void {
        if (!this.isDragging) return

        const deltaY = e.global.y - this.lastDragY
        this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY - deltaY))
        this.scrollVelocity = -deltaY
        this.lastDragY = e.global.y
    }

    private onPointerUp(e: any): void {
        if (!this.isDragging) return
        this.isDragging = false

        // Check for tap (not drag)
        if (Math.abs(this.scrollVelocity) < 5) {
            this.handleTap(e.global.x, e.global.y)
        }
    }

    private handleTap(x: number, y: number): void {
        if (!this.map) return
        if (this.transitionState.active) return // Don't allow selection during transition

        const adjustedY = y + this.scrollY

        for (const nodeId of this.availableNodeIds) {
            const node = this.map.nodes[nodeId]
            if (!node) continue

            const nodePos = this.getNodePosition(node)
            const dist = Math.sqrt((x - nodePos.x) ** 2 + (adjustedY - nodePos.y) ** 2)

            if (dist < ABYSS_CONFIG.nodeRadius * 1.8) {
                // Start transition animation instead of immediate selection
                this.startTransition(nodeId)
                return
            }
        }
    }

    /**
     * Start the abyss opening transition
     */
    private startTransition(nodeId: string): void {
        this.transitionState = {
            active: true,
            nodeId,
            progress: 0,
            phase: 'opening',
        }

        if (this.transitionOverlay) {
            this.transitionOverlay.visible = true
        }

        // Notify that selection started (for sound effects, etc.)
        this.onNodeSelected?.(nodeId)
    }

    /**
     * Update transition animation
     */
    private updateTransition(deltaSeconds: number): void {
        if (!this.transitionState.active || !this.transitionOverlay || !this.map) return

        const state = this.transitionState
        const node = this.map.nodes[state.nodeId!]
        if (!node) return

        // Get node screen position
        const nodePos = this.getNodePosition(node)
        const screenX = nodePos.x
        const screenY = nodePos.y - this.scrollY

        // Update progress
        const speed = state.phase === 'opening' ? 3.0 : 2.5
        state.progress += deltaSeconds * speed

        // Phase transitions
        if (state.phase === 'opening' && state.progress >= 1.0) {
            state.phase = 'expanding'
            state.progress = 0
        } else if (state.phase === 'expanding' && state.progress >= 1.0) {
            state.phase = 'complete'
            state.progress = 1.0
        }

        // Draw transition effect
        this.transitionOverlay.clear()

        const zone = getDepthZone(node.depth)
        const colors = ABYSS_CONFIG.zoneColors[zone]

        if (state.phase === 'opening') {
            // Eye opens wide, void starts to form
            const eyeOpenness = state.progress
            const voidRadius = 10 + state.progress * 30

            // Draw pulsing rings around the node
            for (let i = 3; i >= 0; i--) {
                const ringRadius = voidRadius + i * 15 * state.progress
                const alpha = 0.3 * (1 - state.progress * 0.5) * (1 - i * 0.2)
                this.transitionOverlay.circle(screenX, screenY, ringRadius)
                this.transitionOverlay.stroke({ color: colors.glow, width: 2 + i, alpha })
            }

            // Central void growing
            this.transitionOverlay.circle(screenX, screenY, voidRadius)
            this.transitionOverlay.fill({ color: 0x000000, alpha: 0.8 * state.progress })

            // Inner glow
            this.transitionOverlay.circle(screenX, screenY, voidRadius * 0.6)
            this.transitionOverlay.fill({ color: colors.eye, alpha: 0.5 * eyeOpenness })

        } else if (state.phase === 'expanding') {
            // Void expands to fill screen with swirling effect
            const easeProgress = 1 - Math.pow(1 - state.progress, 3) // Ease out cubic
            const maxRadius = Math.sqrt(this.width * this.width + this.height * this.height)
            const voidRadius = 40 + easeProgress * maxRadius

            // Swirling tendrils
            const tendrilCount = 8
            for (let i = 0; i < tendrilCount; i++) {
                const angle = (i / tendrilCount) * Math.PI * 2 + this.animTime * 2
                const tendrilLength = voidRadius * 0.8
                const endX = screenX + Math.cos(angle) * tendrilLength
                const endY = screenY + Math.sin(angle) * tendrilLength

                // Draw tendril as bezier curve
                const ctrlDist = tendrilLength * 0.5
                const ctrlAngle = angle + Math.sin(this.animTime * 3 + i) * 0.5
                const ctrlX = screenX + Math.cos(ctrlAngle) * ctrlDist
                const ctrlY = screenY + Math.sin(ctrlAngle) * ctrlDist

                this.transitionOverlay.moveTo(screenX, screenY)
                this.transitionOverlay.quadraticCurveTo(ctrlX, ctrlY, endX, endY)
                this.transitionOverlay.stroke({
                    color: colors.tentacle,
                    width: 8 - i * 0.5,
                    alpha: 0.7 * (1 - easeProgress * 0.3),
                })
            }

            // Main void circle
            this.transitionOverlay.circle(screenX, screenY, voidRadius)
            this.transitionOverlay.fill({ color: 0x000000, alpha: 0.95 })

            // Glow edge
            this.transitionOverlay.circle(screenX, screenY, voidRadius)
            this.transitionOverlay.stroke({
                color: colors.glow,
                width: 4,
                alpha: 0.6 * (1 - easeProgress),
            })

            // Central eye effect
            const eyeRadius = 30 * (1 - easeProgress)
            if (eyeRadius > 2) {
                this.transitionOverlay.circle(screenX, screenY, eyeRadius)
                this.transitionOverlay.fill({ color: colors.eye, alpha: 0.8 })
                // Pupil
                this.transitionOverlay.ellipse(screenX, screenY, eyeRadius * 0.2, eyeRadius * 0.6)
                this.transitionOverlay.fill({ color: 0x000000, alpha: 0.9 })
            }

        } else if (state.phase === 'complete') {
            // Full screen black
            this.transitionOverlay.rect(0, 0, this.width, this.height)
            this.transitionOverlay.fill({ color: 0x000000, alpha: 1 })

            // Notify completion
            this.onTransitionComplete?.(state.nodeId!)
            this.transitionState.active = false
            this.transitionOverlay.visible = false
        }
    }

    /**
     * Get node position with organic wavy offset
     */
    private getNodePosition(node: MapNode): { x: number; y: number } {
        // Create organic horizontal offset based on depth
        // Use multiple sine waves for more natural movement
        const seed = (this.map?.runSeed || 12345) * 0.0001
        const depthFactor = node.depth * 0.7 + seed

        // Combine multiple frequencies for organic feel
        const wave1 = Math.sin(depthFactor * 1.3) * 35
        const wave2 = Math.sin(depthFactor * 2.7 + 1.5) * 20
        const wave3 = Math.cos(depthFactor * 0.8 + 0.7) * 15

        const xOffset = wave1 + wave2 + wave3

        const x = this.width / 2 + xOffset
        const y = ABYSS_CONFIG.padding.top + node.depth * ABYSS_CONFIG.nodeSpacingY
        return { x, y }
    }

    /**
     * Draw the complete map
     */
    private drawMap(): void {
        this.drawConnections()
        this.drawNodes()
    }

    /**
     * Draw organic tendril connections between nodes
     */
    private drawConnections(): void {
        this.connectionsContainer.removeChildren()

        if (!this.map) return

        const g = new Graphics()
        this.connectionsContainer.addChild(g)

        const { bodyRadius, tentacleLength } = ABYSS_CONFIG.eldritch

        for (let depth = 1; depth < this.map.maxDepth; depth++) {
            const currentNode = this.map.nodes[`${depth}-0`]
            const nextNode = this.map.nodes[`${depth + 1}-0`]

            if (!currentNode || !nextNode) continue

            // Get actual positions of both nodes
            const pos1 = this.getNodePosition(currentNode)
            const pos2 = this.getNodePosition(nextNode)

            const nodeId = `${depth}-0`
            const isCompleted = this.completedNodeIds.has(nodeId)
            const zone = getDepthZone(depth)
            const colors = ABYSS_CONFIG.zoneColors[zone]

            // Connection start/end points (accounting for node body + tentacles)
            const startX = pos1.x
            const startY = pos1.y + bodyRadius + tentacleLength * 0.4
            const endX = pos2.x
            const endY = pos2.y - bodyRadius - tentacleLength * 0.4
            const connectionLength = endY - startY

            if (connectionLength <= 0) continue

            // Draw multiple organic tendrils connecting the two positions
            const tendrilCount = isCompleted ? 3 : 2

            for (let t = 0; t < tendrilCount; t++) {
                const offsetX = (t - (tendrilCount - 1) / 2) * 6
                const phase = this.animTime * 0.5 + t * 0.5 + depth

                // Draw wavy tendril that curves between the two node positions
                const segments = 10
                const points: { x: number; y: number }[] = []

                for (let s = 0; s <= segments; s++) {
                    const progress = s / segments
                    // Smooth interpolation between start and end X
                    const baseX = startX + (endX - startX) * progress

                    // Add wave motion
                    const waveAmp = isCompleted ? 5 : 3
                    const wave = Math.sin(phase + progress * Math.PI * 2) * waveAmp * Math.sin(progress * Math.PI)

                    points.push({
                        x: baseX + offsetX + wave,
                        y: startY + connectionLength * progress,
                    })
                }

                // Draw tendril
                const tendrilColor = isCompleted ? colors.tentacle : 0x1a1a2a
                const tendrilAlpha = isCompleted ? 0.6 : 0.25

                for (let s = 0; s < points.length - 1; s++) {
                    const thickness = 2.5 - Math.abs(s - segments / 2) * 0.15
                    g.moveTo(points[s].x, points[s].y)
                    g.lineTo(points[s + 1].x, points[s + 1].y)
                    g.stroke({
                        color: tendrilColor,
                        width: Math.max(1, thickness),
                        alpha: tendrilAlpha,
                    })
                }
            }

            // Draw glow line for completed paths
            if (isCompleted) {
                g.moveTo(startX, startY)
                g.quadraticCurveTo(
                    (startX + endX) / 2,
                    (startY + endY) / 2,
                    endX,
                    endY
                )
                g.stroke({ color: colors.glow, width: 1.5, alpha: 0.15 })
            }
        }
    }

    /**
     * Draw eldritch creature nodes
     */
    private drawNodes(): void {
        this.nodesContainer.removeChildren()
        this.nodeGraphics.clear()

        if (!this.map) return

        for (const node of Object.values(this.map.nodes)) {
            const nodeContainer = new Container()
            const pos = this.getNodePosition(node)
            nodeContainer.position.set(pos.x, pos.y)

            // Initialize eldritch state if not exists
            if (!this.eldritchStates.has(node.id)) {
                this.initEldritchState(node.id)
            }

            this.nodesContainer.addChild(nodeContainer)
            this.nodeGraphics.set(node.id, nodeContainer)
        }

        // Initial draw
        this.redrawAllNodes()
    }

    /**
     * Initialize eldritch animation state for a node
     */
    private initEldritchState(nodeId: string): void {
        const tentacleCount = ABYSS_CONFIG.eldritch.tentacleCount
        const tentaclePhases: number[] = []

        for (let i = 0; i < tentacleCount; i++) {
            tentaclePhases.push(Math.random() * Math.PI * 2)
        }

        this.eldritchStates.set(nodeId, {
            nodeId,
            tentaclePhases,
            eyeOpenness: 0.5,
            targetEyeOpenness: 1.0,
            breathePhase: Math.random() * Math.PI * 2,
            pupilOffsetX: 0,
            pupilOffsetY: 0,
            glowIntensity: 0.5,
        })
    }

    /**
     * Redraw all eldritch nodes with current animation state
     */
    private redrawAllNodes(): void {
        if (!this.map) return

        for (const node of Object.values(this.map.nodes)) {
            const container = this.nodeGraphics.get(node.id)
            if (!container) continue

            container.removeChildren()
            this.drawEldritchNode(container, node)
        }
    }

    /**
     * Draw a single eldritch creature node
     */
    private drawEldritchNode(container: Container, node: MapNode): void {
        const isCompleted = this.completedNodeIds.has(node.id)
        const isAvailable = this.availableNodeIds.has(node.id)
        const isCurrent = this.currentNodeId === node.id
        const isLocked = !isAvailable && !isCompleted && !isCurrent

        const zone = getDepthZone(node.depth)
        const colors = ABYSS_CONFIG.zoneColors[zone]
        const state = this.eldritchStates.get(node.id)
        if (!state) return

        const { tentacleCount, tentacleLength, tentacleSegments, eyeRadius, pupilRadius, bodyRadius } =
            ABYSS_CONFIG.eldritch

        const g = new Graphics()

        // Calculate breathing scale
        const breatheScale = 1 + Math.sin(state.breathePhase) * 0.05

        // Determine visual intensity based on state
        let intensity = 0.3
        if (isCurrent) {
            intensity = 1.0
        } else if (isAvailable) {
            intensity = 0.85
        } else if (isCompleted) {
            intensity = 0.5
        }

        // === Draw outer glow ===
        if (!isLocked) {
            const glowColor = isCurrent ? 0xffdd44 : colors.glow
            const glowAlpha = state.glowIntensity * intensity * 0.3
            for (let i = 3; i >= 1; i--) {
                g.circle(0, 0, (bodyRadius + tentacleLength * 0.5) * breatheScale + i * 10)
                g.fill({ color: glowColor, alpha: glowAlpha / i })
            }
        }

        // === Draw tentacles ===
        for (let i = 0; i < tentacleCount; i++) {
            const baseAngle = (i / tentacleCount) * Math.PI * 2 - Math.PI / 2
            const phase = state.tentaclePhases[i]

            // Tentacle color based on state
            let tentacleColor = colors.tentacle
            let tentacleAlpha = 0.4
            if (isCurrent) {
                tentacleColor = 0x997722
                tentacleAlpha = 0.8
            } else if (isAvailable) {
                tentacleColor = colors.tentacle
                tentacleAlpha = 0.7
            } else if (isCompleted) {
                tentacleColor = colors.secondary
                tentacleAlpha = 0.4
            } else {
                tentacleAlpha = 0.2
            }

            // Draw tentacle segments
            const points: { x: number; y: number }[] = []
            for (let s = 0; s <= tentacleSegments; s++) {
                const t = s / tentacleSegments
                const segmentLength = bodyRadius + tentacleLength * t * breatheScale

                // Wave motion
                const waveOffset = Math.sin(phase + t * Math.PI * 2) * 8 * t * intensity
                const angle = baseAngle + waveOffset * 0.05

                points.push({
                    x: Math.cos(angle) * segmentLength,
                    y: Math.sin(angle) * segmentLength + waveOffset,
                })
            }

            // Draw tentacle as connected segments
            for (let s = 0; s < points.length - 1; s++) {
                const thickness = (4 - s * 0.6) * breatheScale
                g.moveTo(points[s].x, points[s].y)
                g.lineTo(points[s + 1].x, points[s + 1].y)
                g.stroke({
                    color: tentacleColor,
                    width: Math.max(1, thickness),
                    alpha: tentacleAlpha * (1 - s * 0.15),
                })
            }

            // Tentacle tip glow for active nodes
            if (isAvailable || isCurrent) {
                const tip = points[points.length - 1]
                g.circle(tip.x, tip.y, 2)
                g.fill({ color: colors.glow, alpha: 0.6 * intensity })
            }
        }

        // === Draw body ===
        const bodyColor = isLocked ? 0x0a0a12 : isCurrent ? 0x2a2a1a : isCompleted ? 0x1a1a2a : 0x0a1a1a
        g.circle(0, 0, bodyRadius * breatheScale)
        g.fill({ color: bodyColor, alpha: 0.95 })

        // Body outline
        const outlineColor = isCurrent ? 0xffdd44 : isAvailable ? colors.primary : isCompleted ? colors.secondary : 0x222233
        g.circle(0, 0, bodyRadius * breatheScale)
        g.stroke({ color: outlineColor, width: isCurrent ? 3 : 2, alpha: intensity })

        // === Draw eye ===
        if (!isLocked || isCompleted) {
            const eyeScale = state.eyeOpenness * breatheScale

            // Eye white (sclera)
            const scleraColor = isLocked ? 0x111122 : 0x112222
            g.ellipse(0, 0, eyeRadius * breatheScale, eyeRadius * eyeScale * 0.8)
            g.fill({ color: scleraColor, alpha: 0.9 })

            // Iris
            const irisColor = isCurrent ? 0xffaa00 : colors.eye
            const irisRadius = eyeRadius * 0.7 * breatheScale
            g.circle(state.pupilOffsetX * 2, state.pupilOffsetY * 2, irisRadius)
            g.fill({ color: irisColor, alpha: intensity })

            // Pupil (vertical slit for eldritch feel)
            const pupilColor = 0x000000
            const pupilHeight = pupilRadius * 2 * eyeScale
            const pupilWidth = pupilRadius * 0.4
            g.ellipse(
                state.pupilOffsetX * 3,
                state.pupilOffsetY * 3,
                pupilWidth * breatheScale,
                pupilHeight * breatheScale
            )
            g.fill({ color: pupilColor, alpha: 0.95 })

            // Eye highlight
            if (isAvailable || isCurrent) {
                g.circle(-eyeRadius * 0.3, -eyeRadius * 0.3, 2)
                g.fill({ color: 0xffffff, alpha: 0.6 })
            }

            // Eyelid effect for locked/completed
            if (isCompleted && !isCurrent) {
                // Half-closed eye
                g.ellipse(0, -eyeRadius * 0.3, eyeRadius * breatheScale * 1.1, eyeRadius * 0.5)
                g.fill({ color: bodyColor, alpha: 0.7 })
            }
        } else {
            // Closed eye for locked
            g.moveTo(-eyeRadius * 0.7, 0)
            g.lineTo(eyeRadius * 0.7, 0)
            g.stroke({ color: 0x333344, width: 2, alpha: 0.5 })
        }

        container.addChild(g)

        // === Depth label (stage number only) ===
        const depthStyle = new TextStyle({
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 'bold',
            fill: colors.glow,
            dropShadow: {
                alpha: 0.8,
                blur: 3,
                color: 0x000000,
                distance: 1,
            },
        })
        const depthLabel = new Text({ text: `${node.depth}`, style: depthStyle })
        depthLabel.anchor.set(0.5, 0)
        depthLabel.position.set(0, bodyRadius + tentacleLength * 0.4 + 8)
        container.addChild(depthLabel)

        // === Rank badge for completed nodes ===
        if (isCompleted && node.rank) {
            this.drawRankBadge(container, node.rank, bodyRadius)
        }
    }

    /**
     * Draw rank badge
     */
    private drawRankBadge(container: Container, rank: RunRank, nodeRadius: number): void {
        const badgeX = nodeRadius * 0.8
        const badgeY = -nodeRadius * 0.8
        const badgeSize = 12

        const g = new Graphics()

        // Badge background
        g.circle(badgeX, badgeY, badgeSize)
        g.fill({ color: ABYSS_CONFIG.rankColors[rank] })
        g.stroke({ color: 0x000000, width: 2, alpha: 0.5 })

        container.addChild(g)

        // Rank letter
        const rankText = new Text({
            text: rank,
            style: new TextStyle({
                fontSize: 12,
                fontWeight: 'bold',
                fill: rank === 'S' ? 0x000000 : 0xffffff,
            }),
        })
        rankText.anchor.set(0.5)
        rankText.position.set(badgeX, badgeY)
        container.addChild(rankText)
    }

    /**
     * Update animation frame
     */
    update(deltaSeconds: number): void {
        this.animTime += deltaSeconds

        // Update scroll momentum
        if (!this.isDragging && Math.abs(this.scrollVelocity) > 0.5) {
            this.scrollY = Math.max(
                0,
                Math.min(this.maxScrollY, this.scrollY + this.scrollVelocity * deltaSeconds * 60)
            )
            this.scrollVelocity *= 0.92
        }

        this.applyScroll()

        // Update background
        if (this.backgroundFilter) {
            this.backgroundFilter.time = this.animTime * 0.5
        }

        // Update depth indicator
        this.updateDepthIndicator()

        // Update node animations
        this.updateNodeAnimations(deltaSeconds)

        // Update particles
        this.updateParticles(deltaSeconds)

        // Update tentacles
        this.updateTentacles(deltaSeconds)

        // Update transition animation
        this.updateTransition(deltaSeconds)
    }

    /**
     * Update depth indicator and background color based on scroll position
     */
    private updateDepthIndicator(): void {
        if (!this.depthText || !this.zoneText) return

        // Calculate current viewed depth (fractional for smooth transitions)
        const viewCenterY = this.scrollY + this.height / 2
        const exactDepth = Math.max(
            1,
            (viewCenterY - ABYSS_CONFIG.padding.top) / ABYSS_CONFIG.nodeSpacingY
        )
        const depth = Math.floor(exactDepth)

        const zone = getDepthZone(depth)
        const zoneName = DEPTH_ZONES[zone].name
        const zoneColors = ABYSS_CONFIG.zoneColors[zone]

        // Update depth text (no units, just depth number)
        this.depthText.text = `${depth}`
        this.depthText.style.fill = zoneColors.primary

        this.zoneText.text = zoneName
        this.zoneText.style.fill = zoneColors.secondary

        // Update background color based on depth zone with smooth interpolation
        this.updateBackgroundForDepth(exactDepth)
    }

    /**
     * Smoothly interpolate background colors based on current depth
     */
    private updateBackgroundForDepth(exactDepth: number): void {
        if (!this.backgroundFilter) return

        // Get current and next zone for interpolation
        const currentZone = getDepthZone(Math.floor(exactDepth))
        const nextZone = getDepthZone(Math.floor(exactDepth) + 1)

        const currentColors = ABYSS_CONFIG.zoneColors[currentZone]
        const nextColors = ABYSS_CONFIG.zoneColors[nextZone]

        // Calculate interpolation factor within current zone
        const zoneProgress = exactDepth - Math.floor(exactDepth)

        // Interpolate background colors
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t
        const lerpedBg = [
            lerp(currentColors.background[0], nextColors.background[0], zoneProgress),
            lerp(currentColors.background[1], nextColors.background[1], zoneProgress),
            lerp(currentColors.background[2], nextColors.background[2], zoneProgress),
        ]

        // Update filter colors using Float32Array indexing
        const uniforms = this.backgroundFilter.uniforms

        // Color 1 - brightest
        uniforms.uColor1[0] = lerpedBg[0] * 1.3
        uniforms.uColor1[1] = lerpedBg[1] * 1.3
        uniforms.uColor1[2] = lerpedBg[2] * 1.3
        uniforms.uColor1[3] = 1.0

        // Color 2 - mid
        uniforms.uColor2[0] = lerpedBg[0] * 0.7
        uniforms.uColor2[1] = lerpedBg[1] * 0.7
        uniforms.uColor2[2] = lerpedBg[2] * 0.7
        uniforms.uColor2[3] = 1.0

        // Color 3 - darkest
        uniforms.uColor3[0] = lerpedBg[0] * 0.2
        uniforms.uColor3[1] = lerpedBg[1] * 0.2
        uniforms.uColor3[2] = lerpedBg[2] * 0.2
        uniforms.uColor3[3] = 1.0
    }

    /**
     * Update eldritch creature animations
     * Only redraws visible nodes for performance
     */
    private updateNodeAnimations(deltaSeconds: number): void {
        if (!this.map) return

        const { tentacleWave, eyeBlink, breathe, glowPulse } = ABYSS_CONFIG.animation

        // Calculate visible depth range
        const visibleTop = this.scrollY - 100
        const visibleBottom = this.scrollY + this.height + 100
        const minVisibleDepth = Math.max(1, Math.floor((visibleTop - ABYSS_CONFIG.padding.top) / ABYSS_CONFIG.nodeSpacingY))
        const maxVisibleDepth = Math.ceil((visibleBottom - ABYSS_CONFIG.padding.top) / ABYSS_CONFIG.nodeSpacingY)

        for (const [nodeId, state] of this.eldritchStates) {
            // Parse depth from nodeId (format: "depth-column")
            const depth = parseInt(nodeId.split('-')[0])

            // Skip nodes outside visible range
            if (depth < minVisibleDepth || depth > maxVisibleDepth) continue

            const isAvailable = this.availableNodeIds.has(nodeId)
            const isCurrent = this.currentNodeId === nodeId
            const isCompleted = this.completedNodeIds.has(nodeId)
            const isActive = isAvailable || isCurrent

            // Update tentacle phases (wave animation)
            const waveSpeed = isActive ? tentacleWave : tentacleWave * 0.3
            for (let i = 0; i < state.tentaclePhases.length; i++) {
                state.tentaclePhases[i] += deltaSeconds * waveSpeed * (0.8 + i * 0.1)
            }

            // Update breathing
            const breatheSpeed = isActive ? breathe : breathe * 0.5
            state.breathePhase += deltaSeconds * breatheSpeed

            // Update glow intensity
            const targetGlow = isActive ? 0.8 + Math.sin(this.animTime * glowPulse) * 0.2 : 0.3
            state.glowIntensity += (targetGlow - state.glowIntensity) * deltaSeconds * 3

            // Update eye openness
            if (isActive) {
                state.targetEyeOpenness = 1.0
                // Random blink (reduced frequency)
                if (Math.random() < eyeBlink * deltaSeconds * 0.5) {
                    state.targetEyeOpenness = 0.1
                    setTimeout(() => {
                        state.targetEyeOpenness = 1.0
                    }, 150)
                }
            } else if (isCompleted) {
                state.targetEyeOpenness = 0.6
            } else {
                state.targetEyeOpenness = 0.0
            }
            state.eyeOpenness += (state.targetEyeOpenness - state.eyeOpenness) * deltaSeconds * 8

            // Update pupil position (follow/wander)
            if (isActive) {
                const wanderX = Math.sin(this.animTime * 0.7 + depth * 1.5) * 2
                const wanderY = Math.cos(this.animTime * 0.5 + depth * 1.5) * 1.5
                state.pupilOffsetX += (wanderX - state.pupilOffsetX) * deltaSeconds * 2
                state.pupilOffsetY += (wanderY - state.pupilOffsetY) * deltaSeconds * 2
            } else {
                state.pupilOffsetX *= 0.95
                state.pupilOffsetY *= 0.95
            }

            // Redraw only this visible node
            const container = this.nodeGraphics.get(nodeId)
            const node = this.map.nodes[nodeId]
            if (container && node) {
                container.removeChildren()
                this.drawEldritchNode(container, node)
            }
        }
    }

    /**
     * Update floating particles
     */
    private updateParticles(deltaSeconds: number): void {
        // Clear and redraw particles
        this.particleContainer.removeChildren()

        const g = new Graphics()
        this.particleContainer.addChild(g)

        for (const particle of this.particles) {
            // Update position
            particle.x += particle.vx * deltaSeconds
            particle.y += particle.vy * deltaSeconds
            particle.phase += deltaSeconds * 2

            // Wrap around screen
            if (particle.x < 0) particle.x = this.width
            if (particle.x > this.width) particle.x = 0
            if (particle.y < -100) particle.y = this.height * 2
            if (particle.y > this.height * 2) particle.y = -100

            // Animate based on type
            let size = particle.size
            let alpha = particle.alpha

            if (particle.type === 'bubble') {
                // Bubbles wobble and shimmer
                const wobble = Math.sin(particle.phase * 3) * 2
                particle.x += wobble * deltaSeconds * 10
                alpha *= 0.5 + Math.sin(particle.phase * 5) * 0.3
            } else if (particle.type === 'bioluminescent') {
                // Bioluminescence pulses
                size *= 0.8 + Math.sin(particle.phase * 2) * 0.4
                alpha *= 0.6 + Math.sin(particle.phase * 1.5) * 0.4
            } else if (particle.type === 'plankton') {
                // Plankton drifts gently
                particle.x += Math.sin(particle.phase) * deltaSeconds * 5
            }

            // Draw particle
            g.circle(particle.x, particle.y, size)
            g.fill({ color: particle.color, alpha })

            // Add glow for bioluminescent
            if (particle.type === 'bioluminescent') {
                g.circle(particle.x, particle.y, size * 2)
                g.fill({ color: particle.color, alpha: alpha * 0.3 })
            }
        }
    }

    /**
     * Update edge tentacles
     */
    private updateTentacles(deltaSeconds: number): void {
        this.tentacleContainer.removeChildren()

        const g = new Graphics()
        this.tentacleContainer.addChild(g)

        for (const tentacle of this.tentacles) {
            tentacle.phase += deltaSeconds * tentacle.speed

            const startX = tentacle.side === 'left' ? 0 : this.width
            const direction = tentacle.side === 'left' ? 1 : -1

            // Draw tentacle with multiple segments
            const points: { x: number; y: number }[] = []
            points.push({ x: startX, y: tentacle.baseY })

            for (let i = 1; i <= tentacle.segments; i++) {
                const t = i / tentacle.segments
                const wave = Math.sin(tentacle.phase + t * Math.PI * 1.5) * 15 * t
                const x = startX + direction * tentacle.length * t * (0.8 + Math.sin(tentacle.phase * 0.5) * 0.2)
                const y = tentacle.baseY + wave + t * 20 // Slight droop

                points.push({ x, y })
            }

            // Draw with gradient thickness
            for (let i = 0; i < points.length - 1; i++) {
                const thickness = tentacle.thickness * (1 - i / points.length)
                g.moveTo(points[i].x, points[i].y)
                g.lineTo(points[i + 1].x, points[i + 1].y)
                g.stroke({
                    color: tentacle.color,
                    width: thickness,
                    alpha: 0.6 - i * 0.05,
                })
            }

            // Add tip glow
            const tip = points[points.length - 1]
            g.circle(tip.x, tip.y, 3)
            g.fill({ color: 0x662244, alpha: 0.4 })
        }
    }

    /**
     * Resize display
     */
    resize(width: number, height: number): void {
        this.width = width
        this.height = height

        if (this.backgroundSprite) {
            this.backgroundSprite.width = width
            this.backgroundSprite.height = height
        }

        if (this.backgroundFilter) {
            this.backgroundFilter.setDimensions(width, height)
        }

        if (this.map) {
            const totalHeight =
                ABYSS_CONFIG.padding.top +
                this.map.maxDepth * ABYSS_CONFIG.nodeSpacingY +
                ABYSS_CONFIG.padding.bottom
            this.maxScrollY = Math.max(0, totalHeight - this.height)
            this.scrollY = Math.min(this.scrollY, this.maxScrollY)
        }

        // Regenerate visual elements
        this.tentacles = []
        this.setupTentacles()
        this.setupParticles()

        if (this.map) {
            this.drawMap()
            this.drawDepthGradient()
        }
    }

    setVisible(visible: boolean): void {
        this.container.visible = visible
    }

    destroy(): void {
        this.container.removeChildren()
        this.container.destroy()
        this.nodeGraphics.clear()
        this.eldritchStates.clear()
        this.particles = []
        this.tentacles = []
    }
}
