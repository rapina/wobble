import { Container, Graphics, FederatedPointerEvent } from 'pixi.js'

export interface VirtualJoystickOptions {
    maxRadius?: number
    baseColor?: number
    knobColor?: number
    baseAlpha?: number
    knobAlpha?: number
}

export interface JoystickInput {
    dirX: number // -1 to 1
    dirY: number // -1 to 1
    magnitude: number // 0 to 1
    active: boolean
}

const DEFAULT_OPTIONS: Required<VirtualJoystickOptions> = {
    maxRadius: 60,
    baseColor: 0x000000,
    knobColor: 0xffffff,
    baseAlpha: 0.2,
    knobAlpha: 0.5,
}

export class VirtualJoystick extends Container {
    private options: Required<VirtualJoystickOptions>
    private joystickBase: Graphics
    private joystickKnob: Graphics

    private active = false
    private centerX = 0
    private centerY = 0
    private dirX = 0
    private dirY = 0
    private magnitude = 0

    private attachedContainer: Container | null = null

    // Callback for input changes
    onInputChange?: (input: JoystickInput) => void

    constructor(options?: VirtualJoystickOptions) {
        super()

        this.options = { ...DEFAULT_OPTIONS, ...options }

        // Create joystick base (outer ring)
        this.joystickBase = new Graphics()
        this.joystickBase.circle(0, 0, this.options.maxRadius)
        this.joystickBase.fill({ color: this.options.baseColor, alpha: this.options.baseAlpha })
        this.joystickBase.circle(0, 0, this.options.maxRadius)
        this.joystickBase.stroke({ color: this.options.knobColor, width: 2, alpha: 0.4 })
        this.addChild(this.joystickBase)

        // Create joystick knob (inner circle)
        this.joystickKnob = new Graphics()
        this.joystickKnob.circle(0, 0, 20)
        this.joystickKnob.fill({ color: this.options.knobColor, alpha: this.options.knobAlpha })
        this.joystickKnob.circle(0, 0, 20)
        this.joystickKnob.stroke({ color: this.options.knobColor, width: 2, alpha: 0.8 })
        this.addChild(this.joystickKnob)

        // Initially hidden
        this.visible = false
    }

    /**
     * Attach joystick to a container for pointer events
     */
    attachTo(container: Container): void {
        if (this.attachedContainer) {
            this.detach()
        }

        this.attachedContainer = container
        container.eventMode = 'static'
        container.hitArea = { contains: () => true }

        container.on('pointerdown', this.onPointerDown)
        container.on('pointermove', this.onPointerMove)
        container.on('pointerup', this.onPointerUp)
        container.on('pointerupoutside', this.onPointerUp)
    }

    /**
     * Detach joystick from current container
     */
    detach(): void {
        if (this.attachedContainer) {
            this.attachedContainer.off('pointerdown', this.onPointerDown)
            this.attachedContainer.off('pointermove', this.onPointerMove)
            this.attachedContainer.off('pointerup', this.onPointerUp)
            this.attachedContainer.off('pointerupoutside', this.onPointerUp)
            this.attachedContainer = null
        }
    }

    /**
     * Get current joystick input state
     */
    getInput(): JoystickInput {
        return {
            dirX: this.dirX,
            dirY: this.dirY,
            magnitude: this.magnitude,
            active: this.active,
        }
    }

    /**
     * Check if joystick is currently active
     */
    isActive(): boolean {
        return this.active
    }

    /**
     * Reset joystick state
     */
    reset(): void {
        this.active = false
        this.visible = false
        this.dirX = 0
        this.dirY = 0
        this.magnitude = 0
        this.joystickKnob.position.set(0, 0)
    }

    private onPointerDown = (e: FederatedPointerEvent): void => {
        if (!this.attachedContainer) return

        const pos = e.getLocalPosition(this.attachedContainer)

        // Set joystick center at touch position
        this.active = true
        this.centerX = pos.x
        this.centerY = pos.y

        // Show joystick at touch position
        this.visible = true
        this.position.set(pos.x, pos.y)
        this.joystickKnob.position.set(0, 0)

        // Reset input
        this.dirX = 0
        this.dirY = 0
        this.magnitude = 0

        this.notifyInputChange()
    }

    private onPointerMove = (e: FederatedPointerEvent): void => {
        if (!this.active || !this.attachedContainer) return

        const pos = e.getLocalPosition(this.attachedContainer)

        // Calculate offset from joystick center
        const dx = pos.x - this.centerX
        const dy = pos.y - this.centerY
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Calculate input magnitude (0-1)
        this.magnitude = Math.min(1, dist / this.options.maxRadius)

        // Calculate normalized direction
        if (dist > 0.1) {
            this.dirX = dx / dist
            this.dirY = dy / dist
        } else {
            this.dirX = 0
            this.dirY = 0
        }

        // Update knob position (clamped to max radius)
        const clampedDist = Math.min(dist, this.options.maxRadius)
        if (dist > 0) {
            this.joystickKnob.position.set((dx / dist) * clampedDist, (dy / dist) * clampedDist)
        }

        this.notifyInputChange()
    }

    private onPointerUp = (_e: FederatedPointerEvent): void => {
        this.active = false
        this.visible = false

        // Clear input direction
        this.dirX = 0
        this.dirY = 0
        this.magnitude = 0

        this.notifyInputChange()
    }

    private notifyInputChange(): void {
        if (this.onInputChange) {
            this.onInputChange(this.getInput())
        }
    }
}
