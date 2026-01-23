/**
 * LabScene
 *
 * Main PixiJS scene for the idle factory lab feature.
 * Manages research stations, workers, resource production, and animations.
 *
 * Workers have autonomous AI behavior:
 * - Idle workers wander around the center area
 * - Assigned workers walk to stations, work, take breaks, repeat
 * - Production generates large amounts for idle game feel
 */

import { Application, Container, Graphics, Ticker, Point } from 'pixi.js'
import { WorkStation } from './WorkStation'
import { LabWorkerSprite } from './LabWorkerSprite'
import { ResourcePopupManager } from './ResourcePopup'
import { Wobble, WOBBLE_CHARACTERS } from '../Wobble'
import { STATIONS, getCharacterBonus, LAB_COLORS } from '@/config/labConfig'
import { useLabStore } from '@/stores/labStore'
import type { StationId } from '@/types/lab'

// Isometric grid settings
const ISO_TILE_SIZE = 50 // Size of each isometric tile
const ISO_ANGLE = Math.PI / 6 // 30 degrees for isometric
const GRID_COLOR = 0x4a4a6a
const GRID_ALPHA = 0.15
const GRID_DOT_COLOR = 0x6a6a8a
const GRID_DOT_ALPHA = 0.25

// Worker sizing
const WORKER_SIZE = 18 // Small wobbles (1/3 of original 50-55)
const DRAG_GHOST_SIZE = 25 // Slightly larger when dragging

// Labor market (idle area) settings
const LABOR_MARKET_Y_RATIO = 0.82 // Bottom area of screen
const LABOR_MARKET_HEIGHT_RATIO = 0.12 // Height of idle zone
const LABOR_MARKET_WIDTH_RATIO = 0.7 // Width centered

export class LabScene {
    private app: Application
    public container: Container
    private ticker: Ticker
    private width: number
    private height: number

    // Layers
    private backgroundLayer: Graphics
    private gridLayer: Graphics
    private stationLayer: Container
    private workerLayer: Container
    private uiLayer: Container
    private dragLayer: Container

    // Scene objects
    private stations: Map<StationId, WorkStation> = new Map()
    private workerSprites: Map<string, LabWorkerSprite> = new Map()
    private popupManager: ResourcePopupManager

    // Drag state
    private dragGhost: Wobble | null = null
    private draggedWorkerId: string | null = null
    private dropTargetStation: StationId | null = null
    private dragPhase = 0 // Animation phase for drag ghost

    // Work progress tracking (per worker)
    private workProgress: Map<string, number> = new Map()

    // Selection state
    private selectedWorkerId: string | null = null
    private onWorkerSelect: ((workerId: string | null) => void) | null = null
    private onStationSelect: ((stationId: StationId) => void) | null = null

    // Animation state
    private _destroyed = false
    private boundAnimate: (ticker: Ticker) => void

    constructor(app: Application) {
        this.app = app
        this.container = new Container()
        this.ticker = app.ticker
        this.width = app.screen.width
        this.height = app.screen.height

        // Create layers
        this.backgroundLayer = new Graphics()
        this.gridLayer = new Graphics()
        this.stationLayer = new Container()
        this.workerLayer = new Container()
        this.uiLayer = new Container()
        this.popupManager = new ResourcePopupManager()
        this.dragLayer = new Container()

        // Add layers in z-order
        this.container.addChild(this.backgroundLayer)
        this.container.addChild(this.gridLayer)
        this.container.addChild(this.stationLayer)
        this.container.addChild(this.workerLayer)
        this.container.addChild(this.uiLayer)
        this.container.addChild(this.popupManager)
        this.container.addChild(this.dragLayer) // Drag layer on top of everything

        // Make layers interactive
        this.workerLayer.eventMode = 'static'
        this.stationLayer.eventMode = 'static'
        this.container.eventMode = 'static'

        // Setup scene
        this.drawBackground()
        this.drawGrid()
        this.createStations()
        this.syncWorkersFromStore()

        // Bind animation loop
        this.boundAnimate = (ticker: Ticker) => {
            if (this._destroyed) {
                try {
                    this.ticker.remove(this.boundAnimate)
                } catch {
                    // Ticker may already be destroyed
                }
                return
            }
            this.animate(ticker)
        }

        this.ticker.add(this.boundAnimate)
    }

    /**
     * Set callback for worker selection
     */
    setOnWorkerSelect(callback: (workerId: string | null) => void): void {
        this.onWorkerSelect = callback
    }

    /**
     * Set callback for station selection
     */
    setOnStationSelect(callback: (stationId: StationId) => void): void {
        this.onStationSelect = callback
    }

    /**
     * Select a worker
     */
    selectWorker(workerId: string | null): void {
        this.selectedWorkerId = workerId
    }

    /**
     * Get currently selected worker
     */
    getSelectedWorkerId(): string | null {
        return this.selectedWorkerId
    }

    private drawBackground(): void {
        const g = this.backgroundLayer
        g.clear()
        g.rect(0, 0, this.width, this.height)
        g.fill(LAB_COLORS.background)
    }

    private drawGrid(): void {
        const g = this.gridLayer
        g.clear()

        // Isometric grid - diamond pattern
        // Grid center point (where lines converge)
        const centerX = this.width * 0.5
        const centerY = this.height * 0.55

        // Tile dimensions in isometric view
        const tileWidth = ISO_TILE_SIZE * 2 * Math.cos(ISO_ANGLE)
        const tileHeight = ISO_TILE_SIZE * Math.sin(ISO_ANGLE) * 2

        // Calculate how many tiles we need to cover the screen
        const tilesX = Math.ceil(this.width / tileWidth) + 4
        const tilesY = Math.ceil(this.height / tileHeight) + 4

        // Draw isometric lines going from top-left to bottom-right (/)
        for (let i = -tilesY; i <= tilesY; i++) {
            const startY = centerY + i * tileHeight
            // Line goes from left edge to right edge at 30 degree angle
            const lineLength = this.width * 1.5
            const dx = Math.cos(ISO_ANGLE) * lineLength
            const dy = Math.sin(ISO_ANGLE) * lineLength

            g.moveTo(centerX - dx, startY - dy)
            g.lineTo(centerX + dx, startY + dy)
        }

        // Draw isometric lines going from top-right to bottom-left (\)
        for (let i = -tilesX; i <= tilesX; i++) {
            const offsetX = i * tileWidth
            const lineLength = this.height * 1.5
            const dx = Math.cos(ISO_ANGLE) * lineLength
            const dy = Math.sin(ISO_ANGLE) * lineLength

            g.moveTo(centerX + offsetX - dx, centerY + dy)
            g.lineTo(centerX + offsetX + dx, centerY - dy)
        }

        g.stroke({ color: GRID_COLOR, width: 1, alpha: GRID_ALPHA })

        // Draw dots at intersections
        for (let i = -tilesX; i <= tilesX; i++) {
            for (let j = -tilesY; j <= tilesY; j++) {
                // Convert grid coordinates to isometric screen coordinates
                const isoX = centerX + (i - j) * (tileWidth / 2)
                const isoY = centerY + (i + j) * (tileHeight / 2)

                // Only draw if on screen (with some margin)
                if (isoX > -20 && isoX < this.width + 20 && isoY > -20 && isoY < this.height + 20) {
                    g.circle(isoX, isoY, 2)
                    g.fill({ color: GRID_DOT_COLOR, alpha: GRID_DOT_ALPHA })
                }
            }
        }
    }

    private createStations(): void {
        for (const config of STATIONS) {
            const x = config.position.x * this.width
            const y = config.position.y * this.height

            const station = new WorkStation(config, '')
            station.x = x
            station.y = y

            // Make station interactive
            station.eventMode = 'static'
            station.cursor = 'pointer'
            station.on('pointertap', () => {
                console.log('[LabScene] Station tapped:', config.id)
                if (this.onStationSelect) {
                    this.onStationSelect(config.id)
                }
            })

            this.stations.set(config.id, station)
            this.stationLayer.addChild(station)
        }
    }

    /**
     * Handle drag start from worker sprite in scene
     */
    private handleWorkerSpriteDragStart(workerId: string, globalX: number, globalY: number): void {
        const worker = useLabStore.getState().workers.find((w) => w.id === workerId)
        if (!worker) return

        this.draggedWorkerId = workerId
        this.dragPhase = 0 // Reset animation phase

        // Create drag ghost with panicked expression (slightly larger than normal)
        const character = WOBBLE_CHARACTERS[worker.shape]
        this.dragGhost = new Wobble({
            size: DRAG_GHOST_SIZE,
            color: character.color,
            shape: worker.shape,
            expression: 'surprised', // Panicked look!
            showShadow: true,
            showLegs: true, // Show legs for frantic animation
        })

        // Position at touch point
        const localPos = this.container.toLocal(new Point(globalX, globalY))
        this.dragGhost.x = localPos.x
        this.dragGhost.y = localPos.y

        this.dragLayer.addChild(this.dragGhost)

        // Check for initial station highlight
        this.updateDropTargetHighlight(globalX, globalY)
    }

    /**
     * Handle drag move
     */
    private handleDragMove(globalX: number, globalY: number): void {
        if (!this.dragGhost) return

        // Update ghost position
        const localPos = this.container.toLocal(new Point(globalX, globalY))
        this.dragGhost.x = localPos.x
        this.dragGhost.y = localPos.y

        // Update drop target highlight
        this.updateDropTargetHighlight(globalX, globalY)
    }

    /**
     * Handle drag end from worker sprite in scene
     */
    private handleWorkerSpriteDragEnd(globalX: number, globalY: number): void {
        if (!this.draggedWorkerId) return

        // Find station at drop position
        const stationId = this.findStationAtPosition(globalX, globalY)

        // Get current worker assignment
        const worker = useLabStore.getState().workers.find((w) => w.id === this.draggedWorkerId)
        const currentStation = worker?.assignedStation

        if (stationId) {
            // Dropped on a station
            if (stationId !== currentStation) {
                // Assign immediately (teleport, don't walk)
                this.assignWorkerToStation(this.draggedWorkerId, stationId, true)
            }
        } else if (currentStation) {
            // Dropped outside any station - unassign the worker
            this.assignWorkerToStation(this.draggedWorkerId, null)
        }

        // Reset sprite visibility
        const sprite = this.workerSprites.get(this.draggedWorkerId)
        if (sprite) {
            sprite.cancelDrag()
        }

        // Clean up drag ghost only (not toolbar visibility)
        if (this.dragGhost) {
            this.dragLayer.removeChild(this.dragGhost)
            this.dragGhost.destroy()
            this.dragGhost = null
        }

        this.dropTargetStation = null
        this.draggedWorkerId = null
    }

    /**
     * Find station at global position
     */
    private findStationAtPosition(globalX: number, globalY: number): StationId | null {
        const hitRadius = 70 // Hit detection radius

        for (const [stationId, station] of this.stations) {
            // Convert global position to station's local position
            const localPos = station.toLocal(new Point(globalX, globalY))
            const distance = Math.sqrt(localPos.x * localPos.x + localPos.y * localPos.y)

            if (distance <= hitRadius) {
                return stationId
            }
        }

        return null
    }

    /**
     * Update drop target highlight
     */
    private updateDropTargetHighlight(globalX: number, globalY: number): void {
        const newTarget = this.findStationAtPosition(globalX, globalY)

        if (newTarget !== this.dropTargetStation) {
            // Clear previous highlight
            if (this.dropTargetStation) {
                const prevStation = this.stations.get(this.dropTargetStation)
                if (prevStation) {
                    // Reset station visual (will be handled by update loop)
                }
            }

            this.dropTargetStation = newTarget

            // Apply new highlight
            if (this.dropTargetStation) {
                // Station highlight will be handled in the station's update
            }
        }

        // Update drag ghost expression based on valid drop target
        if (this.dragGhost) {
            this.dragGhost.updateOptions({
                expression: newTarget ? 'excited' : 'surprised', // Excited when over station, panicked otherwise
                glowIntensity: newTarget ? 0.5 : 0,
                glowColor: newTarget ? 0x2ecc71 : 0xffffff,
            })
        }
    }

    /**
     * Clean up drag state
     */
    private cleanupDrag(): void {
        // Remove drag ghost
        if (this.dragGhost) {
            this.dragLayer.removeChild(this.dragGhost)
            this.dragGhost.destroy()
            this.dragGhost = null
        }

        // Clear drop target
        this.dropTargetStation = null
        this.draggedWorkerId = null
    }

    /**
     * Get labor market (idle area) bounds
     */
    private getLaborMarketBounds(): { x: number; y: number; width: number; height: number } {
        const width = this.width * LABOR_MARKET_WIDTH_RATIO
        const height = this.height * LABOR_MARKET_HEIGHT_RATIO
        const x = (this.width - width) / 2
        const y = this.height * LABOR_MARKET_Y_RATIO
        return { x, y, width, height }
    }

    /**
     * Get a clustered position in the labor market for idle workers
     */
    private getIdleWorkerPosition(index: number, total: number): { x: number; y: number } {
        const bounds = this.getLaborMarketBounds()
        const centerX = bounds.x + bounds.width / 2
        const centerY = bounds.y + bounds.height / 2

        // Cluster workers together with slight randomness
        const spreadX = Math.min(bounds.width * 0.6, total * 12)
        const spreadY = bounds.height * 0.4

        // Arrange in a loose cluster
        const offsetX = (Math.random() - 0.5) * spreadX
        const offsetY = (Math.random() - 0.5) * spreadY

        return {
            x: centerX + offsetX,
            y: centerY + offsetY,
        }
    }

    /**
     * Get worker position around a station (for multiple workers)
     * Workers are spread in a row below the station
     */
    private getStationWorkerPosition(stationId: StationId, workerIndex: number): { x: number; y: number } {
        const station = this.stations.get(stationId)
        if (!station) return { x: this.width / 2, y: this.height / 2 }

        const basePos = station.getWorkerPosition()

        // Spread workers in a horizontal row with slight vertical offset
        const spacing = 22 // Space between workers
        const totalOffset = (workerIndex - 0.5) * spacing // Center the row

        return {
            x: basePos.x + totalOffset,
            y: basePos.y + (workerIndex % 2) * 8, // Slight stagger for depth
        }
    }

    /**
     * Count how many workers are already assigned to a station
     */
    private getStationWorkerCount(stationId: StationId): number {
        const storeWorkers = useLabStore.getState().workers
        return storeWorkers.filter((w) => w.assignedStation === stationId).length
    }

    /**
     * Get the index of a worker within its station's worker list
     */
    private getWorkerIndexAtStation(workerId: string, stationId: StationId): number {
        const storeWorkers = useLabStore.getState().workers
        const stationWorkers = storeWorkers.filter((w) => w.assignedStation === stationId)
        return stationWorkers.findIndex((w) => w.id === workerId)
    }

    /**
     * Sync workers from store
     */
    syncWorkersFromStore(): void {
        const storeWorkers = useLabStore.getState().workers

        // Remove sprites for workers that no longer exist
        for (const [id, sprite] of this.workerSprites) {
            if (!storeWorkers.find((w) => w.id === id)) {
                this.workerLayer.removeChild(sprite)
                sprite.destroy()
                this.workerSprites.delete(id)
                this.workProgress.delete(id)
            }
        }

        // Labor market position for idle workers
        const laborMarket = this.getLaborMarketBounds()
        const laborMarketCenterX = laborMarket.x + laborMarket.width / 2
        const laborMarketCenterY = laborMarket.y + laborMarket.height / 2

        // Count workers per station for positioning
        const workersPerStation = new Map<StationId, number>()
        for (const worker of storeWorkers) {
            if (worker.assignedStation) {
                const count = workersPerStation.get(worker.assignedStation) || 0
                workersPerStation.set(worker.assignedStation, count + 1)
            }
        }
        const stationWorkerIndex = new Map<StationId, number>()

        // Count idle workers for positioning
        const idleWorkers = storeWorkers.filter((w) => !w.assignedStation)
        let idleIndex = 0

        // Add or update sprites for store workers
        for (const worker of storeWorkers) {
            let sprite = this.workerSprites.get(worker.id)

            if (!sprite) {
                // Create new sprite with smaller size
                sprite = new LabWorkerSprite(worker.id, worker.shape, WORKER_SIZE)

                // Set scene bounds for AI wandering (labor market area)
                sprite.setSceneBounds(this.width, this.height)
                sprite.setHomePosition(laborMarketCenterX, laborMarketCenterY)

                // Setup drag callbacks for reassignment
                sprite.setDragCallbacks(
                    (workerId, globalX, globalY) => this.handleWorkerSpriteDragStart(workerId, globalX, globalY),
                    (globalX, globalY) => this.handleDragMove(globalX, globalY),
                    (globalX, globalY) => this.handleWorkerSpriteDragEnd(globalX, globalY)
                )

                // Position at station or in labor market
                if (worker.assignedStation) {
                    const currentIndex = stationWorkerIndex.get(worker.assignedStation) || 0
                    stationWorkerIndex.set(worker.assignedStation, currentIndex + 1)
                    const pos = this.getStationWorkerPosition(worker.assignedStation, currentIndex)
                    sprite.setPosition(pos.x, pos.y)
                    sprite.goToStation(pos.x, pos.y)
                } else {
                    // Position in labor market
                    const pos = this.getIdleWorkerPosition(idleIndex, idleWorkers.length)
                    sprite.setPosition(pos.x, pos.y)
                    idleIndex++
                }

                this.workerSprites.set(worker.id, sprite)
                this.workerLayer.addChild(sprite)
                this.workProgress.set(worker.id, worker.workProgress)
            } else {
                // Update existing sprite's scene bounds (in case of resize)
                sprite.setSceneBounds(this.width, this.height)
                sprite.setHomePosition(laborMarketCenterX, laborMarketCenterY)
            }

            // Update sprite state only if not currently doing something
            // (don't override walking/break states from external sync)
            if (sprite.state !== 'walking' && sprite.state !== 'taking_break') {
                sprite.assignedStation = worker.assignedStation
            }
        }

        // Update station active states
        this.updateStationStates()
    }

    /**
     * Assign worker to station
     * @param immediate If true, teleport to station and start working immediately (for drag-drop)
     */
    assignWorkerToStation(workerId: string, stationId: StationId | null, immediate = false): void {
        const sprite = this.workerSprites.get(workerId)
        if (!sprite) return

        // Count existing workers at the station BEFORE updating store
        const existingCount = stationId ? this.getStationWorkerCount(stationId) : 0

        // Update store
        useLabStore.getState().assignWorker(workerId, stationId)

        if (stationId) {
            const station = this.stations.get(stationId)
            if (station) {
                // New worker gets the next index (existingCount = their index since it's 0-based)
                const pos = this.getStationWorkerPosition(stationId, existingCount)

                sprite.assignedStation = stationId

                if (immediate) {
                    // Teleport and start working immediately (drag-drop)
                    sprite.teleportToStation(pos.x, pos.y)
                } else {
                    // Walk to station (normal assignment)
                    sprite.goToStation(pos.x, pos.y)
                }
            }
        } else {
            // Save previous station before unassigning
            const previousStation = sprite.assignedStation

            // Unassign - sprite will return to idle wandering
            sprite.assignedStation = null
            sprite.stopWorking()

            // Reposition remaining workers at the station they left
            if (previousStation) {
                this.repositionWorkersAtStation(previousStation)
            }
        }

        // Reset progress
        this.workProgress.set(workerId, 0)
        this.updateStationStates()
    }

    /**
     * Reposition all workers at a station (e.g., after one leaves)
     */
    private repositionWorkersAtStation(stationId: StationId): void {
        const storeWorkers = useLabStore.getState().workers
        const stationWorkers = storeWorkers.filter((w) => w.assignedStation === stationId)

        stationWorkers.forEach((worker, index) => {
            const sprite = this.workerSprites.get(worker.id)
            if (sprite && sprite.state === 'working') {
                const pos = this.getStationWorkerPosition(stationId, index)
                sprite.setPosition(pos.x, pos.y)
            }
        })
    }

    private updateStationStates(): void {
        const storeWorkers = useLabStore.getState().workers

        for (const [stationId, station] of this.stations) {
            // Find all workers assigned to this station
            const assignedWorkers = storeWorkers.filter((w) => w.assignedStation === stationId)

            if (assignedWorkers.length > 0) {
                // Station is active if any worker is actually working (not on break)
                const anyWorking = assignedWorkers.some((w) => {
                    const sprite = this.workerSprites.get(w.id)
                    return sprite?.state === 'working'
                })
                station.isActive = anyWorking
            } else {
                station.isActive = false
            }
        }
    }

    private animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 1000 // Convert to seconds

        // Update stations
        for (const station of this.stations.values()) {
            station.update(delta)
        }

        // Update workers and production
        const storeWorkers = useLabStore.getState().workers

        for (const worker of storeWorkers) {
            const sprite = this.workerSprites.get(worker.id)
            if (!sprite) continue

            // Update sprite animation (includes AI behavior)
            sprite.update(delta)

            // Update production if working
            if (worker.assignedStation && sprite.state === 'working') {
                const station = this.stations.get(worker.assignedStation)
                if (!station) continue

                const stationConfig = STATIONS.find((s) => s.id === worker.assignedStation)
                if (!stationConfig) continue

                // Get current progress
                let progress = this.workProgress.get(worker.id) || 0

                // Calculate production rate with bonus
                const bonus = getCharacterBonus(worker.shape, stationConfig.resource)
                const productionRate = bonus / stationConfig.productionTime

                progress += delta * productionRate

                // Check if production complete
                if (progress >= 1) {
                    // Collect resource (with the configured amount!)
                    const amount = stationConfig.productionAmount * bonus
                    useLabStore.getState().collectResources(stationConfig.resource, amount)

                    // Spawn popup with formatted number
                    const pos = sprite.getPosition()
                    this.popupManager.spawn(amount, stationConfig.color, pos.x, pos.y - 30)

                    // Check if worker should take a break
                    if (sprite.onWorkCycleComplete()) {
                        sprite.takeBreak()
                    }

                    // Reset progress
                    progress = progress - 1
                }

                // Update progress
                this.workProgress.set(worker.id, progress)
                station.progress = progress
            }
        }

        // Update station active states (worker might be on break)
        this.updateStationStates()

        // Update popups
        this.popupManager.update(delta)

        // Update drag ghost animation (bouncy wobble effect)
        if (this.dragGhost) {
            this.dragPhase += delta * 12 // Fast wobble

            // Bouncy squash and stretch
            const bounce = Math.sin(this.dragPhase * 2) * 0.15
            const wobble = Math.sin(this.dragPhase * 3) * 0.1

            // Frantic leg movement
            const legPhase = this.dragPhase * 8

            // Slight rotation wobble
            const rotation = Math.sin(this.dragPhase * 2.5) * 0.2

            this.dragGhost.updateOptions({
                scaleX: 1.2 + bounce,
                scaleY: 1.2 - bounce * 0.7,
                wobblePhase: this.dragPhase,
                showLegs: true,
                legPhase: legPhase,
            })

            // Apply rotation and vertical bounce
            this.dragGhost.rotation = rotation

            // Small vertical bounce offset
            const yOffset = Math.abs(Math.sin(this.dragPhase * 4)) * 5
            this.dragGhost.pivot.y = yOffset
        }
    }

    /**
     * Handle resize
     */
    resize(): void {
        this.width = this.app.screen.width
        this.height = this.app.screen.height

        this.drawBackground()
        this.drawGrid()

        // Reposition stations
        for (const config of STATIONS) {
            const station = this.stations.get(config.id)
            if (station) {
                station.x = config.position.x * this.width
                station.y = config.position.y * this.height
            }
        }

        // Update worker scene bounds (use labor market center for idle workers)
        const laborMarket = this.getLaborMarketBounds()
        const laborMarketCenterX = laborMarket.x + laborMarket.width / 2
        const laborMarketCenterY = laborMarket.y + laborMarket.height / 2
        for (const sprite of this.workerSprites.values()) {
            sprite.setSceneBounds(this.width, this.height)
            sprite.setHomePosition(laborMarketCenterX, laborMarketCenterY)
        }

        // Cancel any active drag on resize
        this.cleanupDrag()
        for (const sprite of this.workerSprites.values()) {
            sprite.cancelDrag()
        }
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this._destroyed = true

        try {
            if (this.ticker && this.boundAnimate) {
                this.ticker.remove(this.boundAnimate)
            }
        } catch {
            // Ticker may already be destroyed
        }

        // Cleanup workers
        for (const sprite of this.workerSprites.values()) {
            sprite.destroy()
        }
        this.workerSprites.clear()
        this.workProgress.clear()

        // Cleanup stations
        for (const station of this.stations.values()) {
            station.destroy()
        }
        this.stations.clear()

        // Cleanup drag ghost
        if (this.dragGhost) {
            this.dragGhost.destroy()
            this.dragGhost = null
        }

        // Cleanup popup manager
        this.popupManager.clear()

        try {
            this.container.destroy({ children: true })
        } catch {
            // Container may already be destroyed
        }
    }

    /**
     * Get center coordinates
     */
    get centerX(): number {
        return this.width / 2
    }

    get centerY(): number {
        return this.height / 2
    }
}
