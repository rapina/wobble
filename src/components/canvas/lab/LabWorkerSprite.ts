/**
 * LabWorkerSprite
 *
 * PixiJS wrapper for a Wobble character working in the lab.
 * Handles movement, working animation, and autonomous AI behavior.
 *
 * AI States:
 * - idle: Wandering around the center area when not assigned
 * - walking: Moving toward a destination (station or wander point)
 * - working: At station with station-specific affordance animations
 * - taking_break: Brief rest near station before returning to work
 *
 * Station Affordances (Sims-like unique animations):
 * - observe_orbit: Watching orbital simulation, bobbing head
 * - track_particles: Following accelerator particles, leaning side to side
 * - test_collision: Testing collision mechanics, recoil animation
 * - measure_heat: Measuring temperature, shivering/warming reactions
 */

import { Container, Circle } from 'pixi.js'
import { Wobble, WobbleShape, WobbleExpression, WOBBLE_CHARACTERS } from '../Wobble'
import type { WorkerState, StationId } from '@/types/lab'
import {
    WORKER_SPEED,
    WORKER_AI,
    STATION_AFFORDANCES,
    type AffordanceType,
} from '@/config/labConfig'

// Random helper
function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min)
}

export class LabWorkerSprite extends Container {
    public readonly workerId: string
    public readonly shape: WobbleShape

    private wobble: Wobble
    private _state: WorkerState = 'idle'
    private _assignedStation: StationId | null = null

    // Movement
    private targetPosition: { x: number; y: number } | null = null
    private onReachTarget: (() => void) | null = null
    private homePosition: { x: number; y: number } = { x: 0, y: 0 }

    // Animation state
    private animationPhase = 0
    private legPhase = 0
    private workPhase = 0
    private affordancePhase = 0

    // AI behavior timers
    private aiTimer = 0
    private nextAiAction = 0
    private workCyclesCompleted = 0
    private workCyclesUntilBreak = 0

    // Scene dimensions (set by LabScene)
    private sceneWidth = 400
    private sceneHeight = 600

    // Station position (for returning after break)
    private stationPosition: { x: number; y: number } | null = null

    // Current affordance type for station-specific animations
    private currentAffordance: AffordanceType | null = null
    private affordanceSpeed = 1.0

    // Drag state
    private isDragging = false
    private dragStartPos: { x: number; y: number } | null = null
    private dragThreshold = 10

    // Drag callbacks
    private onDragStartCallback?: (workerId: string, globalX: number, globalY: number) => void
    private onDragMoveCallback?: (globalX: number, globalY: number) => void
    private onDragEndCallback?: (globalX: number, globalY: number) => void

    constructor(workerId: string, shape: WobbleShape, size: number = 18) {
        super()
        this.workerId = workerId
        this.shape = shape

        const character = WOBBLE_CHARACTERS[shape]

        // Set hit area for click detection (PixiJS v8 style) - larger hit area for smaller sprites
        this.hitArea = new Circle(0, 0, Math.max(size * 1.2, 20))

        this.wobble = new Wobble({
            size,
            color: character.color,
            shape,
            expression: 'happy',
            showShadow: true,
            showLegs: false,
        })

        this.addChild(this.wobble)

        // Make interactive for selection and dragging
        this.eventMode = 'static'
        this.cursor = 'pointer'

        // Setup drag events
        this.on('pointerdown', this.handlePointerDown)
        this.on('globalpointermove', this.handlePointerMove) // Global to track drag outside element
        this.on('pointerup', this.handlePointerUp)
        this.on('pointerupoutside', this.handlePointerUp)

        // Initialize AI timing
        this.scheduleNextIdleAction()
        this.resetWorkCycleCounter()
    }

    /**
     * Set drag callbacks
     */
    setDragCallbacks(
        onDragStart?: (workerId: string, globalX: number, globalY: number) => void,
        onDragMove?: (globalX: number, globalY: number) => void,
        onDragEnd?: (globalX: number, globalY: number) => void
    ): void {
        this.onDragStartCallback = onDragStart
        this.onDragMoveCallback = onDragMove
        this.onDragEndCallback = onDragEnd
    }

    private handlePointerDown = (e: any): void => {
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
            this.alpha = 0.3 // Dim the original sprite
            this.onDragStartCallback?.(this.workerId, globalPos.x, globalPos.y)
        }

        if (this.isDragging) {
            this.onDragMoveCallback?.(globalPos.x, globalPos.y)
        }
    }

    private handlePointerUp = (e: any): void => {
        if (this.isDragging) {
            const globalPos = e.global
            this.onDragEndCallback?.(globalPos.x, globalPos.y)
        }

        this.isDragging = false
        this.dragStartPos = null
        this.alpha = 1
    }

    /**
     * Cancel drag externally
     */
    cancelDrag(): void {
        this.isDragging = false
        this.dragStartPos = null
        this.alpha = 1
    }

    /**
     * Check if currently being dragged
     */
    get dragging(): boolean {
        return this.isDragging
    }

    /**
     * Set scene dimensions for AI wandering bounds
     */
    setSceneBounds(width: number, height: number): void {
        this.sceneWidth = width
        this.sceneHeight = height
    }

    /**
     * Set home position (center area for idle workers)
     */
    setHomePosition(x: number, y: number): void {
        this.homePosition = { x, y }
    }

    /**
     * Get current state
     */
    get state(): WorkerState {
        return this._state
    }

    /**
     * Set worker state
     */
    set state(value: WorkerState) {
        if (this._state !== value) {
            this._state = value
            this.updateExpression()
        }
    }

    /**
     * Get assigned station
     */
    get assignedStation(): StationId | null {
        return this._assignedStation
    }

    /**
     * Set assigned station
     */
    set assignedStation(value: StationId | null) {
        const wasAssigned = this._assignedStation !== null
        this._assignedStation = value

        // Update affordance type when station changes
        if (value) {
            const affordance = STATION_AFFORDANCES[value]
            this.currentAffordance = affordance.type
            this.affordanceSpeed = affordance.animationSpeed
        } else {
            this.currentAffordance = null
            this.affordanceSpeed = 1.0
        }

        if (value === null && wasAssigned) {
            // Unassigned - return to idle behavior
            this._state = 'idle'
            this.stationPosition = null
            this.scheduleNextIdleAction()
        }
    }

    /**
     * Move to a target position
     */
    moveTo(x: number, y: number, onComplete?: () => void): void {
        this.targetPosition = { x, y }
        this.onReachTarget = onComplete || null
        this._state = 'walking'
        this.updateExpression()
    }

    /**
     * Move to station and start working
     * Position is the final target position (already includes any offsets)
     */
    goToStation(targetX: number, targetY: number): void {
        this.stationPosition = { x: targetX, y: targetY }
        this.moveTo(this.stationPosition.x, this.stationPosition.y, () => {
            this.startWorking()
        })
    }

    /**
     * Teleport to station and start working immediately (for drag-drop)
     * Position is the final target position (already includes any offsets)
     */
    teleportToStation(targetX: number, targetY: number): void {
        this.stationPosition = { x: targetX, y: targetY }
        this.setPosition(this.stationPosition.x, this.stationPosition.y)
        this.startWorking()
    }

    /**
     * Start working animation
     */
    startWorking(): void {
        this._state = 'working'
        this.targetPosition = null
        this.onReachTarget = null
        this.workPhase = 0
        this.affordancePhase = 0
        this.updateExpression()
    }

    /**
     * Take a break near the station
     */
    takeBreak(): void {
        if (!this.stationPosition) return

        // Wander slightly away from station
        const wanderDistance = this.sceneWidth * WORKER_AI.breakWanderRadius
        const angle = Math.random() * Math.PI * 2
        const targetX = this.stationPosition.x + Math.cos(angle) * wanderDistance
        const targetY = this.stationPosition.y + Math.sin(angle) * wanderDistance

        this.moveTo(
            Math.max(50, Math.min(this.sceneWidth - 50, targetX)),
            Math.max(100, Math.min(this.sceneHeight - 150, targetY)),
            () => {
                // After reaching break position, start the break timer
                this._state = 'taking_break'
                this.aiTimer = 0
                this.nextAiAction = randomRange(WORKER_AI.breakDuration.min, WORKER_AI.breakDuration.max)
                this.updateExpression()
            }
        )

        this.resetWorkCycleCounter()
    }

    /**
     * Return to station after break
     */
    returnToStation(): void {
        if (this.stationPosition) {
            this.moveTo(this.stationPosition.x, this.stationPosition.y, () => {
                this.startWorking()
            })
        }
    }

    /**
     * Stop and go idle
     */
    stopWorking(): void {
        this._state = 'idle'
        this.targetPosition = null
        this.onReachTarget = null
        this.stationPosition = null
        this.currentAffordance = null
        this.scheduleNextIdleAction()
        this.updateExpression()
    }

    /**
     * Called when a work cycle completes - returns true if should take break
     */
    onWorkCycleComplete(): boolean {
        this.workCyclesCompleted++
        if (this.workCyclesCompleted >= this.workCyclesUntilBreak) {
            return true // Time for a break
        }
        return false
    }

    /**
     * Update animation frame
     */
    update(deltaTime: number): void {
        this.animationPhase += deltaTime * 3
        this.legPhase += deltaTime * 8
        this.aiTimer += deltaTime

        // Handle AI behavior
        this.updateAI(deltaTime)

        // Handle movement
        if (this.targetPosition && (this._state === 'walking' || this._state === 'taking_break')) {
            const dx = this.targetPosition.x - this.x
            const dy = this.targetPosition.y - this.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const speed = WORKER_SPEED * deltaTime

            if (dist < WORKER_AI.arrivalThreshold) {
                // Reached target
                this.x = this.targetPosition.x
                this.y = this.targetPosition.y
                this.targetPosition = null

                if (this.onReachTarget) {
                    const callback = this.onReachTarget
                    this.onReachTarget = null
                    callback()
                }
            } else {
                // Move towards target
                const vx = (dx / dist) * speed
                const vy = (dy / dist) * speed
                this.x += vx
                this.y += vy
            }
        }

        // Update wobble animation based on state
        switch (this._state) {
            case 'walking':
                this.updateWalkingAnimation()
                break
            case 'working':
                this.updateWorkingAnimation(deltaTime)
                break
            case 'taking_break':
                this.updateBreakAnimation()
                break
            case 'idle':
            default:
                this.updateIdleAnimation()
                break
        }
    }

    private updateAI(deltaTime: number): void {
        // Idle wandering behavior
        if (this._state === 'idle' && !this.targetPosition) {
            if (this.aiTimer >= this.nextAiAction) {
                this.performIdleAction()
            }
        }

        // Break behavior - return to station after break duration
        if (this._state === 'taking_break' && !this.targetPosition) {
            if (this.aiTimer >= this.nextAiAction) {
                this.returnToStation()
            }
        }
    }

    private performIdleAction(): void {
        // Random chance to just pause
        if (Math.random() < WORKER_AI.idlePauseChance) {
            this.scheduleNextIdleAction()
            return
        }

        // Wander to a random point in the center area
        const wanderRadius = this.sceneWidth * WORKER_AI.idleWanderRadius
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * wanderRadius

        const targetX = this.homePosition.x + Math.cos(angle) * distance
        const targetY = this.homePosition.y + Math.sin(angle) * distance

        // Clamp to scene bounds
        const clampedX = Math.max(50, Math.min(this.sceneWidth - 50, targetX))
        const clampedY = Math.max(100, Math.min(this.sceneHeight - 150, targetY))

        this.moveTo(clampedX, clampedY, () => {
            this._state = 'idle'
            this.scheduleNextIdleAction()
        })
    }

    private scheduleNextIdleAction(): void {
        this.aiTimer = 0
        this.nextAiAction = randomRange(WORKER_AI.idleWanderInterval.min, WORKER_AI.idleWanderInterval.max)
    }

    private resetWorkCycleCounter(): void {
        this.workCyclesCompleted = 0
        this.workCyclesUntilBreak = Math.floor(
            randomRange(WORKER_AI.workCyclesBeforeBreak.min, WORKER_AI.workCyclesBeforeBreak.max)
        )
    }

    private updateExpression(): void {
        let expression: WobbleExpression = 'happy'

        switch (this._state) {
            case 'walking':
                expression = 'happy'
                break
            case 'working':
                // Different expressions based on affordance
                switch (this.currentAffordance) {
                    case 'observe_orbit':
                        expression = 'surprised' // Watching orbit
                        break
                    case 'track_particles':
                        expression = 'happy' // Fascinated by particles
                        break
                    case 'test_collision':
                        expression = 'effort' // Testing collisions
                        break
                    case 'measure_heat':
                        expression = 'worried' // Temperature reactions
                        break
                    default:
                        expression = 'effort'
                }
                break
            case 'taking_break':
                expression = 'happy'
                break
            case 'idle':
                expression = 'neutral'
                break
        }

        this.wobble.updateOptions({ expression })
    }

    private updateIdleAnimation(): void {
        // Gentle breathing animation
        const breathe = Math.sin(this.animationPhase * 0.5) * 0.03

        this.wobble.updateOptions({
            wobblePhase: this.animationPhase * 0.5,
            scaleX: 1 + breathe,
            scaleY: 1 - breathe * 0.5,
            showLegs: false,
        })
        this.wobble.y = 0
        this.wobble.x = 0
        this.wobble.rotation = 0
    }

    private updateWalkingAnimation(): void {
        // Walking animation with legs
        const bounce = Math.abs(Math.sin(this.legPhase)) * 0.1

        this.wobble.updateOptions({
            wobblePhase: this.animationPhase,
            scaleX: 1,
            scaleY: 1 - bounce * 0.3,
            showLegs: true,
            legPhase: this.legPhase,
        })

        // Slight vertical bounce
        this.wobble.y = -bounce * 5
        this.wobble.x = 0
        this.wobble.rotation = 0
    }

    private updateWorkingAnimation(deltaTime: number): void {
        // Update affordance-specific phase
        this.workPhase += deltaTime * this.affordanceSpeed
        this.affordancePhase += deltaTime * this.affordanceSpeed * 2

        // Apply station-specific animation based on affordance type
        switch (this.currentAffordance) {
            case 'observe_orbit':
                this.animateObserveOrbit()
                break
            case 'track_particles':
                this.animateTrackParticles()
                break
            case 'test_collision':
                this.animateTestCollision()
                break
            case 'measure_heat':
                this.animateMeasureHeat()
                break
            default:
                this.animateDefaultWork()
                break
        }
    }

    /**
     * Gravity Lab Animation
     * Worker watches orbital simulation, bobbing head to follow planets
     */
    private animateObserveOrbit(): void {
        // Slow, floaty bouncing motion
        const floatPhase = this.workPhase * 1.5
        const floatY = Math.sin(floatPhase) * 15 // Big vertical float
        const squash = Math.sin(floatPhase * 2) * 0.05

        // Occasional big jump
        const jumpCycle = Math.floor(this.workPhase / 4) % 2
        const jumpBonus = jumpCycle === 0 ? Math.abs(Math.sin(this.workPhase * 2)) * 10 : 0

        this.wobble.updateOptions({
            wobblePhase: this.animationPhase,
            scaleX: 1 - squash,
            scaleY: 1 + squash,
            showLegs: false,
            showSweat: false,
        })

        this.wobble.y = -floatY - jumpBonus - 5
        this.wobble.x = Math.sin(this.workPhase * 0.7) * 3 // Gentle sway
        this.wobble.rotation = Math.sin(this.workPhase * 0.5) * 0.1 // Slight tilt
    }

    /**
     * Accelerator Animation
     * Worker watches particles zoom by, head tracking left to right
     */
    private animateTrackParticles(): void {
        // Fast head tracking motion - watching particles zoom past
        const trackPhase = this.workPhase * 3
        const trackX = Math.sin(trackPhase) * 8 // Side to side tracking
        const lean = Math.sin(trackPhase) * 0.15 // Body lean

        // Occasional excited bounce when particle passes
        const exciteBounce = Math.abs(Math.sin(this.workPhase * 5)) > 0.95 ? 5 : 0

        this.wobble.updateOptions({
            wobblePhase: this.animationPhase * 2,
            scaleX: 1 + Math.sin(trackPhase * 2) * 0.02,
            scaleY: 1 - Math.sin(trackPhase * 2) * 0.02,
            showLegs: false,
            showSweat: false,
        })

        this.wobble.y = -exciteBounce - 2
        this.wobble.x = trackX
        this.wobble.rotation = lean
    }

    /**
     * Collision Lab Animation
     * Worker punches/pushes forward, with recoil
     */
    private animateTestCollision(): void {
        // Punching/pushing cycle
        const punchCycle = this.workPhase * 2
        const punchPhase = punchCycle % (Math.PI * 2)
        const isPunching = punchPhase < Math.PI * 0.3

        let forwardPush = 0
        let squashX = 1
        let squashY = 1
        let showSweat = false

        if (isPunching) {
            // Wind up and punch
            const punchProgress = punchPhase / (Math.PI * 0.3)
            if (punchProgress < 0.3) {
                // Wind up - pull back
                forwardPush = -5 * (punchProgress / 0.3)
                squashX = 1 + 0.1 * (punchProgress / 0.3)
                squashY = 1 - 0.05 * (punchProgress / 0.3)
            } else if (punchProgress < 0.6) {
                // Punch forward
                const punch = (punchProgress - 0.3) / 0.3
                forwardPush = -5 + 15 * punch
                squashX = 1.1 - 0.2 * punch
                squashY = 0.95 + 0.1 * punch
                showSweat = true
            } else {
                // Recoil
                const recoil = (punchProgress - 0.6) / 0.4
                forwardPush = 10 - 10 * recoil
                squashX = 0.9 + 0.1 * recoil
                squashY = 1.05 - 0.05 * recoil
            }
        } else {
            // Recovery/rest
            const restPhase = (punchPhase - Math.PI * 0.3) / (Math.PI * 1.7)
            forwardPush = Math.sin(restPhase * Math.PI) * -2
            squashX = 1 + Math.sin(restPhase * Math.PI * 2) * 0.02
            squashY = 1 - Math.sin(restPhase * Math.PI * 2) * 0.02
        }

        this.wobble.updateOptions({
            wobblePhase: this.animationPhase,
            scaleX: squashX,
            scaleY: squashY,
            showLegs: false,
            showSweat,
        })

        this.wobble.y = Math.abs(Math.sin(punchCycle)) * -3
        this.wobble.x = forwardPush
        this.wobble.rotation = forwardPush * 0.01
    }

    /**
     * Insulation Research Animation
     * Worker shivers and hugs self as if testing cold/heat
     */
    private animateMeasureHeat(): void {
        // Shivering effect - rapid small movements
        const shiverPhase = this.workPhase * 15
        const shiverX = Math.sin(shiverPhase) * 2
        const shiverY = Math.cos(shiverPhase * 1.3) * 1

        // Temperature cycle - gets colder then warms up
        const tempCycle = (this.workPhase * 0.5) % (Math.PI * 2)
        const isCold = tempCycle < Math.PI

        let squash = 1
        let showSweat = false

        if (isCold) {
            // Cold - hugging self, compressed
            const coldIntensity = Math.sin(tempCycle)
            squash = 1 - coldIntensity * 0.1
        } else {
            // Warming up - relieved, slight expansion
            const warmProgress = (tempCycle - Math.PI) / Math.PI
            squash = 0.9 + warmProgress * 0.15
            showSweat = warmProgress > 0.5 // Sweating when it gets warm
        }

        this.wobble.updateOptions({
            wobblePhase: this.animationPhase * 3,
            scaleX: squash + Math.sin(shiverPhase) * 0.03,
            scaleY: squash - Math.sin(shiverPhase) * 0.02,
            showLegs: false,
            showSweat,
        })

        this.wobble.y = shiverY - 2
        this.wobble.x = shiverX
        this.wobble.rotation = Math.sin(shiverPhase * 0.5) * 0.05
    }

    /**
     * Default work animation (fallback)
     */
    private animateDefaultWork(): void {
        const bounce = Math.abs(Math.sin(this.workPhase * 2)) * 0.15
        const squash = Math.sin(this.workPhase * 2)

        this.wobble.updateOptions({
            wobblePhase: this.animationPhase * 2,
            scaleX: 1 + squash * 0.08,
            scaleY: 1 - squash * 0.08,
            showLegs: false,
            showSweat: Math.sin(this.workPhase) > 0.5,
        })

        this.wobble.y = -bounce * 8
        this.wobble.x = 0
        this.wobble.rotation = 0
    }

    private updateBreakAnimation(): void {
        // Relaxed animation during break
        const breathe = Math.sin(this.animationPhase * 0.3) * 0.02

        this.wobble.updateOptions({
            wobblePhase: this.animationPhase * 0.3,
            scaleX: 1 + breathe,
            scaleY: 1 - breathe * 0.5,
            showLegs: this.targetPosition !== null,
            legPhase: this.legPhase,
            showSweat: false,
        })

        if (this.targetPosition) {
            const bounce = Math.abs(Math.sin(this.legPhase)) * 0.05
            this.wobble.y = -bounce * 3
        } else {
            this.wobble.y = 0
        }
        this.wobble.x = 0
        this.wobble.rotation = 0
    }

    /**
     * Get current position
     */
    getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y }
    }

    /**
     * Set position directly
     */
    setPosition(x: number, y: number): void {
        this.x = x
        this.y = y
    }

    /**
     * Check if currently moving
     */
    get isMoving(): boolean {
        return this.targetPosition !== null
    }

    /**
     * Get current affordance type (for external effects)
     */
    getCurrentAffordance(): AffordanceType | null {
        return this.currentAffordance
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.off('pointerdown', this.handlePointerDown)
        this.off('globalpointermove', this.handlePointerMove)
        this.off('pointerup', this.handlePointerUp)
        this.off('pointerupoutside', this.handlePointerUp)
        this.wobble.destroy()
        super.destroy()
    }
}
