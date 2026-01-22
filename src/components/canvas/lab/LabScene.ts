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

import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { WorkStation } from './WorkStation'
import { LabWorkerSprite } from './LabWorkerSprite'
import { ResourcePopupManager } from './ResourcePopup'
import { STATIONS, getCharacterBonus, LAB_COLORS } from '@/config/labConfig'
import { useLabStore } from '@/stores/labStore'
import type { StationId } from '@/types/lab'
import { formatNumber } from '@/utils/numberFormatter'

// Grid animation settings
const GRID_SIZE = 40
const GRID_SPEED = 0.3
const GRID_COLOR = 0x3d3d5c
const GRID_ALPHA = 0.12

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

    // Scene objects
    private stations: Map<StationId, WorkStation> = new Map()
    private workerSprites: Map<string, LabWorkerSprite> = new Map()
    private popupManager: ResourcePopupManager

    // Work progress tracking (per worker)
    private workProgress: Map<string, number> = new Map()

    // Grid animation
    private gridOffsetX = 0
    private gridOffsetY = 0

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

        // Add layers in z-order
        this.container.addChild(this.backgroundLayer)
        this.container.addChild(this.gridLayer)
        this.container.addChild(this.stationLayer)
        this.container.addChild(this.workerLayer)
        this.container.addChild(this.uiLayer)
        this.container.addChild(this.popupManager)

        // Make layers interactive
        this.workerLayer.eventMode = 'static'
        this.stationLayer.eventMode = 'static'
        this.container.eventMode = 'static'

        // Setup scene
        this.drawBackground()
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

        // Floor gradient
        g.rect(0, this.height * 0.5, this.width, this.height * 0.5)
        g.fill({ color: LAB_COLORS.floor, alpha: 0.3 })
    }

    private drawGrid(): void {
        const g = this.gridLayer
        g.clear()

        const startX = -GRID_SIZE + (this.gridOffsetX % GRID_SIZE)
        const startY = -GRID_SIZE + (this.gridOffsetY % GRID_SIZE)

        // Vertical lines
        for (let x = startX; x <= this.width + GRID_SIZE; x += GRID_SIZE) {
            g.moveTo(x, 0)
            g.lineTo(x, this.height)
        }

        // Horizontal lines
        for (let y = startY; y <= this.height + GRID_SIZE; y += GRID_SIZE) {
            g.moveTo(0, y)
            g.lineTo(this.width, y)
        }

        g.stroke({ color: GRID_COLOR, width: 1, alpha: GRID_ALPHA })

        // Corner dots
        for (let x = startX; x <= this.width + GRID_SIZE; x += GRID_SIZE) {
            for (let y = startY; y <= this.height + GRID_SIZE; y += GRID_SIZE) {
                if (x > 0 && x < this.width && y > 0 && y < this.height) {
                    g.circle(x, y, 1.5)
                    g.fill({ color: 0x5a5a7c, alpha: 0.2 })
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

        // Center position for idle workers
        const centerX = this.width * 0.5
        const centerY = this.height * 0.5

        // Add or update sprites for store workers
        for (const worker of storeWorkers) {
            let sprite = this.workerSprites.get(worker.id)

            if (!sprite) {
                // Create new sprite
                sprite = new LabWorkerSprite(worker.id, worker.shape, 45)

                // Set scene bounds for AI wandering
                sprite.setSceneBounds(this.width, this.height)
                sprite.setHomePosition(centerX, centerY)

                // Position at center or at assigned station
                if (worker.assignedStation) {
                    const station = this.stations.get(worker.assignedStation)
                    if (station) {
                        const pos = station.getWorkerPosition()
                        sprite.setPosition(pos.x, pos.y)
                        sprite.goToStation(pos.x, pos.y)
                    }
                } else {
                    // Random position in center area
                    sprite.setPosition(
                        this.width * 0.35 + Math.random() * this.width * 0.3,
                        this.height * 0.35 + Math.random() * this.height * 0.3
                    )
                }

                // Make interactive
                sprite.on('pointertap', () => {
                    console.log('[LabScene] Worker tapped:', worker.id)
                    this.selectedWorkerId = worker.id
                    if (this.onWorkerSelect) {
                        this.onWorkerSelect(worker.id)
                    }
                })
                sprite.on('pointerdown', () => {
                    console.log('[LabScene] Worker pointerdown:', worker.id)
                })

                this.workerSprites.set(worker.id, sprite)
                this.workerLayer.addChild(sprite)
                this.workProgress.set(worker.id, worker.workProgress)
            } else {
                // Update existing sprite's scene bounds (in case of resize)
                sprite.setSceneBounds(this.width, this.height)
                sprite.setHomePosition(centerX, centerY)
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
     * Assign worker to station with animation
     */
    assignWorkerToStation(workerId: string, stationId: StationId | null): void {
        const sprite = this.workerSprites.get(workerId)
        if (!sprite) return

        // Update store
        useLabStore.getState().assignWorker(workerId, stationId)

        if (stationId) {
            // Move to station using AI system
            const station = this.stations.get(stationId)
            if (station) {
                const pos = station.getWorkerPosition()
                sprite.assignedStation = stationId
                sprite.goToStation(pos.x, pos.y)
            }
        } else {
            // Unassign - sprite will return to idle wandering
            sprite.assignedStation = null
            sprite.stopWorking()
        }

        // Reset progress
        this.workProgress.set(workerId, 0)
        this.updateStationStates()
    }

    private updateStationStates(): void {
        const storeWorkers = useLabStore.getState().workers

        for (const [stationId, station] of this.stations) {
            const assignedWorker = storeWorkers.find((w) => w.assignedStation === stationId)
            if (assignedWorker) {
                const sprite = this.workerSprites.get(assignedWorker.id)
                // Station is active only when worker is actually working (not on break)
                station.isActive = sprite?.state === 'working'
            } else {
                station.isActive = false
            }
        }
    }

    private animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 1000 // Convert to seconds

        // Update grid animation
        this.gridOffsetX += GRID_SPEED
        this.gridOffsetY += GRID_SPEED
        this.gridOffsetX %= GRID_SIZE
        this.gridOffsetY %= GRID_SIZE
        this.drawGrid()

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

        // Update worker scene bounds
        const centerX = this.width * 0.5
        const centerY = this.height * 0.5
        for (const sprite of this.workerSprites.values()) {
            sprite.setSceneBounds(this.width, this.height)
            sprite.setHomePosition(centerX, centerY)
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
