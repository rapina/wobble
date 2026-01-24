/**
 * DraggableWorkerItem
 *
 * A draggable Wobble icon for the worker toolbar.
 * Supports drag-and-drop to stations with visual feedback.
 *
 * Visual States:
 * - Normal: Full color with subtle breathing animation
 * - Assigned: Grayscale with reduced alpha
 * - Dragging: Hidden (replaced by drag ghost in LabScene)
 */

import { Container, Graphics, ColorMatrixFilter, Rectangle, Text, TextStyle } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../Wobble'
import type { StationId } from '@/types/lab'

const ITEM_SIZE = 40
const PADDING = 6

// Station colors for badge
const STATION_COLORS: Record<StationId, number> = {
    'gravity-lab': 0x9b59b6,
    accelerator: 0x3498db,
    'collision-lab': 0xe74c3c,
    'thermodynamics-lab': 0xe67e22,
}

const STATION_SYMBOLS: Record<StationId, string> = {
    'gravity-lab': 'G',
    accelerator: 'p',
    'collision-lab': 'e',
    'thermodynamics-lab': 'Q',
}

export interface DraggableWorkerItemOptions {
    workerId: string
    shape: WobbleShape
    assignedStation: StationId | null
    onDragStart?: (workerId: string, globalX: number, globalY: number) => void
    onDragMove?: (globalX: number, globalY: number) => void
    onDragEnd?: (globalX: number, globalY: number) => void
}

export class DraggableWorkerItem extends Container {
    public readonly workerId: string
    public readonly shape: WobbleShape

    private wobble: Wobble
    private background: Graphics
    private badge: Graphics
    private badgeText: Text
    private grayscaleFilter: ColorMatrixFilter
    private _assignedStation: StationId | null = null
    private animationPhase = 0

    // Drag state
    private isDragging = false
    private dragStartPos: { x: number; y: number } | null = null
    private dragThreshold = 10 // Pixels before drag starts

    // Callbacks
    private onDragStart?: (workerId: string, globalX: number, globalY: number) => void
    private onDragMove?: (globalX: number, globalY: number) => void
    private onDragEnd?: (globalX: number, globalY: number) => void

    constructor(options: DraggableWorkerItemOptions) {
        super()
        this.workerId = options.workerId
        this.shape = options.shape
        this._assignedStation = options.assignedStation
        this.onDragStart = options.onDragStart
        this.onDragMove = options.onDragMove
        this.onDragEnd = options.onDragEnd

        // Create grayscale filter for assigned state
        this.grayscaleFilter = new ColorMatrixFilter()
        this.grayscaleFilter.desaturate()

        // Create background
        this.background = new Graphics()
        this.addChild(this.background)

        // Create wobble
        const character = WOBBLE_CHARACTERS[this.shape]
        this.wobble = new Wobble({
            size: ITEM_SIZE * 0.75,
            color: character.color,
            shape: this.shape,
            expression: 'neutral',
            showShadow: false,
            showLegs: false,
        })
        this.wobble.y = 0
        this.addChild(this.wobble)

        // Create badge for showing assigned station
        this.badge = new Graphics()
        this.addChild(this.badge)

        // Create badge text
        const badgeStyle = new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 10,
            fontWeight: 'bold',
            fontStyle: 'italic',
            fill: 0xffffff,
        })
        this.badgeText = new Text({ text: '', style: badgeStyle })
        this.badgeText.anchor.set(0.5, 0.5)
        this.addChild(this.badgeText)

        // Make interactive
        this.eventMode = 'static'
        this.cursor = 'pointer'
        this.hitArea = new Rectangle(
            -ITEM_SIZE / 2 - PADDING / 2,
            -ITEM_SIZE / 2 - PADDING / 2,
            ITEM_SIZE + PADDING,
            ITEM_SIZE + PADDING
        )

        // Setup events
        this.on('pointerdown', this.handlePointerDown)
        this.on('globalpointermove', this.handlePointerMove) // Global to track drag outside element
        this.on('pointerup', this.handlePointerUp)
        this.on('pointerupoutside', this.handlePointerUp)

        this.draw()
        this.updateAssignedState()
    }

    get isAssigned(): boolean {
        return this._assignedStation !== null
    }

    get assignedStation(): StationId | null {
        return this._assignedStation
    }

    set assignedStation(value: StationId | null) {
        if (this._assignedStation !== value) {
            this._assignedStation = value
            this.updateAssignedState()
        }
    }

    private updateAssignedState(): void {
        if (this._assignedStation) {
            // Assigned workers: slightly desaturated but still draggable
            this.wobble.filters = [this.grayscaleFilter]
            this.wobble.alpha = 0.8
            this.wobble.updateOptions({ expression: 'effort' })

            // Show badge with station symbol
            const color = STATION_COLORS[this._assignedStation]
            const symbol = STATION_SYMBOLS[this._assignedStation]

            this.badge.clear()
            this.badge.circle(ITEM_SIZE / 2 - 2, -ITEM_SIZE / 2 + 5, 9)
            this.badge.fill({ color })
            this.badge.circle(ITEM_SIZE / 2 - 2, -ITEM_SIZE / 2 + 5, 9)
            this.badge.stroke({ color: 0x000000, width: 1, alpha: 0.3 })
            this.badge.visible = true

            this.badgeText.text = symbol
            this.badgeText.x = ITEM_SIZE / 2 - 2
            this.badgeText.y = -ITEM_SIZE / 2 + 5
            this.badgeText.visible = true
        } else {
            this.wobble.filters = []
            this.wobble.alpha = 1
            this.wobble.updateOptions({ expression: 'neutral' })

            // Hide badge
            this.badge.clear()
            this.badge.visible = false
            this.badgeText.visible = false
        }
        this.draw()
    }

    private draw(): void {
        const g = this.background
        g.clear()

        // Background with rounded corners
        const isAssigned = this._assignedStation !== null
        const bgColor = isAssigned ? 0x1a1a2e : 0x353550
        const bgAlpha = isAssigned ? 0.5 : 0.8

        g.roundRect(
            -ITEM_SIZE / 2 - PADDING / 2,
            -ITEM_SIZE / 2 - PADDING / 2,
            ITEM_SIZE + PADDING,
            ITEM_SIZE + PADDING,
            8
        )
        g.fill({ color: bgColor, alpha: bgAlpha })

        // Border
        g.roundRect(
            -ITEM_SIZE / 2 - PADDING / 2,
            -ITEM_SIZE / 2 - PADDING / 2,
            ITEM_SIZE + PADDING,
            ITEM_SIZE + PADDING,
            8
        )
        g.stroke({ color: 0x4a4a6a, width: 1, alpha: 0.5 })
    }

    /**
     * Update animation
     */
    update(deltaTime: number): void {
        if (this.isDragging) return

        this.animationPhase += deltaTime * 2

        // Subtle breathing animation
        const breathe = Math.sin(this.animationPhase) * 0.02
        this.wobble.updateOptions({
            wobblePhase: this.animationPhase * 0.5,
            scaleX: 1 + breathe,
            scaleY: 1 - breathe * 0.5,
        })
    }

    /**
     * Set visibility for dragging
     */
    setDragVisibility(visible: boolean): void {
        this.alpha = visible ? 1 : 0
    }

    private handlePointerDown = (e: any): void => {
        // Allow dragging both assigned and unassigned workers
        const globalPos = e.global
        this.dragStartPos = { x: globalPos.x, y: globalPos.y }
    }

    private handlePointerMove = (e: any): void => {
        if (!this.dragStartPos) return

        const globalPos = e.global
        const dx = globalPos.x - this.dragStartPos.x
        const dy = globalPos.y - this.dragStartPos.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Check if we've passed the drag threshold
        if (!this.isDragging && distance >= this.dragThreshold) {
            this.isDragging = true
            this.setDragVisibility(false)
            this.onDragStart?.(this.workerId, globalPos.x, globalPos.y)
        }

        if (this.isDragging) {
            this.onDragMove?.(globalPos.x, globalPos.y)
        }
    }

    private handlePointerUp = (e: any): void => {
        if (this.isDragging) {
            const globalPos = e.global
            this.onDragEnd?.(globalPos.x, globalPos.y)
        }

        this.isDragging = false
        this.dragStartPos = null
        this.setDragVisibility(true)
    }

    /**
     * Force end drag (called when drag is cancelled externally)
     */
    cancelDrag(): void {
        this.isDragging = false
        this.dragStartPos = null
        this.setDragVisibility(true)
    }

    destroy(): void {
        this.off('pointerdown', this.handlePointerDown)
        this.off('globalpointermove', this.handlePointerMove)
        this.off('pointerup', this.handlePointerUp)
        this.off('pointerupoutside', this.handlePointerUp)
        this.wobble.destroy()
        super.destroy()
    }
}
