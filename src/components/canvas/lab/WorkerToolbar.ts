/**
 * WorkerToolbar
 *
 * Photoshop-style vertical toolbar on the left side of the screen.
 * Contains draggable Wobble workers that can be assigned to stations.
 *
 * Layout:
 * - Position: Left edge, below header (60px), above ad area (98px)
 * - Width: 64px
 * - Background: Semi-transparent panel
 * - Workers arranged vertically with scroll support
 */

import { Container, Graphics, Rectangle } from 'pixi.js'
import { DraggableWorkerItem } from './DraggableWorkerItem'
import { WobbleShape } from '../Wobble'
import type { StationId } from '@/types/lab'

const TOOLBAR_WIDTH = 56
const TOOLBAR_PADDING = 6
const ITEM_SPACING = 6
const ITEM_SIZE = 52 // Total item height including padding
const HEADER_HEIGHT = 60 // Header with safe area
const RESOURCE_BAR_HEIGHT = 90 // Resource bar below header (account for safe area)
const AD_BANNER_HEIGHT = 98

export interface WorkerData {
    id: string
    shape: WobbleShape
    assignedStation: StationId | null
}

export interface WorkerToolbarOptions {
    screenWidth: number
    screenHeight: number
    isAdFree: boolean
    onDragStart?: (workerId: string, globalX: number, globalY: number) => void
    onDragMove?: (globalX: number, globalY: number) => void
    onDragEnd?: (globalX: number, globalY: number) => void
}

export class WorkerToolbar extends Container {
    private background: Graphics
    private itemContainer: Container
    private items: Map<string, DraggableWorkerItem> = new Map()

    private screenWidth: number
    private screenHeight: number
    private isAdFree: boolean
    private toolbarHeight: number

    // Callbacks
    private onDragStart?: (workerId: string, globalX: number, globalY: number) => void
    private onDragMove?: (globalX: number, globalY: number) => void
    private onDragEnd?: (globalX: number, globalY: number) => void

    constructor(options: WorkerToolbarOptions) {
        super()

        this.screenWidth = options.screenWidth
        this.screenHeight = options.screenHeight
        this.isAdFree = options.isAdFree
        this.onDragStart = options.onDragStart
        this.onDragMove = options.onDragMove
        this.onDragEnd = options.onDragEnd

        // Calculate toolbar height
        const topOffset = HEADER_HEIGHT + RESOURCE_BAR_HEIGHT + 10 // Below header and resource bar
        const bottomPadding = this.isAdFree ? 20 : AD_BANNER_HEIGHT + 12
        this.toolbarHeight = this.screenHeight - topOffset - bottomPadding

        // Create background
        this.background = new Graphics()
        this.addChild(this.background)

        // Create item container
        this.itemContainer = new Container()
        this.addChild(this.itemContainer)

        // Position toolbar on left side
        this.x = TOOLBAR_PADDING
        this.y = topOffset

        this.drawBackground()
    }

    private drawBackground(): void {
        const g = this.background
        g.clear()

        // Semi-transparent background panel
        g.roundRect(0, 0, TOOLBAR_WIDTH, this.toolbarHeight, 12)
        g.fill({ color: 0x252538, alpha: 0.9 })

        // Border
        g.roundRect(0, 0, TOOLBAR_WIDTH, this.toolbarHeight, 12)
        g.stroke({ color: 0x1a1a1a, width: 2, alpha: 1 })

        // Inner highlight
        g.roundRect(1, 1, TOOLBAR_WIDTH - 2, this.toolbarHeight - 2, 11)
        g.stroke({ color: 0x4a4a6a, width: 1, alpha: 0.3 })
    }

    /**
     * Update workers list
     */
    syncWorkers(workers: WorkerData[]): void {
        // Remove items for workers that no longer exist
        const currentIds = new Set(workers.map((w) => w.id))
        for (const [id, item] of this.items) {
            if (!currentIds.has(id)) {
                this.itemContainer.removeChild(item)
                item.destroy()
                this.items.delete(id)
            }
        }

        // Add or update items
        workers.forEach((worker, index) => {
            let item = this.items.get(worker.id)

            if (!item) {
                // Create new item
                item = new DraggableWorkerItem({
                    workerId: worker.id,
                    shape: worker.shape,
                    assignedStation: worker.assignedStation,
                    onDragStart: (id, x, y) => this.onDragStart?.(id, x, y),
                    onDragMove: (x, y) => this.onDragMove?.(x, y),
                    onDragEnd: (x, y) => this.onDragEnd?.(x, y),
                })
                this.items.set(worker.id, item)
                this.itemContainer.addChild(item)
            } else {
                // Update existing item with assigned station
                item.assignedStation = worker.assignedStation
            }

            // Position item
            item.x = TOOLBAR_WIDTH / 2
            item.y = TOOLBAR_PADDING + index * (ITEM_SIZE + ITEM_SPACING) + ITEM_SIZE / 2
        })

        // Check if we need scrolling (future enhancement)
        const totalHeight = workers.length * (ITEM_SIZE + ITEM_SPACING) + TOOLBAR_PADDING * 2
        if (totalHeight > this.toolbarHeight) {
            // TODO: Add scroll functionality
        }
    }

    /**
     * Update animation for all items
     */
    update(deltaTime: number): void {
        for (const item of this.items.values()) {
            item.update(deltaTime)
        }
    }

    /**
     * Handle resize
     */
    resize(screenWidth: number, screenHeight: number, isAdFree: boolean): void {
        this.screenWidth = screenWidth
        this.screenHeight = screenHeight
        this.isAdFree = isAdFree

        // Recalculate toolbar height and position
        const topOffset = HEADER_HEIGHT + RESOURCE_BAR_HEIGHT + 10
        const bottomPadding = this.isAdFree ? 20 : AD_BANNER_HEIGHT + 12
        this.toolbarHeight = this.screenHeight - topOffset - bottomPadding
        this.y = topOffset

        this.drawBackground()
    }

    /**
     * Get item by worker ID
     */
    getItem(workerId: string): DraggableWorkerItem | undefined {
        return this.items.get(workerId)
    }

    /**
     * Cancel drag on all items
     */
    cancelAllDrags(): void {
        for (const item of this.items.values()) {
            item.cancelDrag()
        }
    }

    /**
     * Set drag visibility for a specific worker
     */
    setWorkerDragVisibility(workerId: string, visible: boolean): void {
        const item = this.items.get(workerId)
        if (item) {
            item.setDragVisibility(visible)
        }
    }

    destroy(): void {
        for (const item of this.items.values()) {
            item.destroy()
        }
        this.items.clear()
        super.destroy()
    }
}
