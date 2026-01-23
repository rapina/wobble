/**
 * LabScreen
 *
 * Main screen for the physics research lab feature.
 * Displays the PixiJS scene with stations (each showing a physics simulation)
 * and workers, plus UI for resources, upgrades, and worker management.
 *
 * Redesigned with improved visual hierarchy and cleaner UI.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Application } from 'pixi.js'
import {
    ArrowLeft,
    FlaskConical,
    Users,
    TrendingUp,
    Plus,
    X,
    ChevronUp,
} from 'lucide-react'
import Balatro from '@/components/Balatro'
import { WobbleDisplay } from '@/components/canvas/WobbleDisplay'
import { LabScene } from '@/components/canvas/lab/LabScene'
import { useLabStore, useSyncLabOnMount } from '@/stores/labStore'
import { usePurchaseStore } from '@/stores/purchaseStore'
import { useAdMob } from '@/hooks/useAdMob'
import { STATIONS, UPGRADES } from '@/config/labConfig'
import { labPreset } from '@/config/backgroundPresets'
import { WOBBLE_CHARACTERS } from '@/components/canvas/Wobble'
import type { StationId, PhysicsProperty } from '@/types/lab'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/numberFormatter'

// Theme
const theme = {
    bg: '#1a1a2e',
    bgPanel: '#252538',
    bgPanelLight: '#353550',
    border: '#1a1a1a',
    gold: '#c9a227',
    red: '#e85d4c',
    blue: '#4a9eff',
    orange: '#ff8c42',
    green: '#2ecc71',
    purple: '#9b59b6',
}

// Physics property colors (matching station colors)
const PHYSICS_COLORS: Record<PhysicsProperty, string> = {
    gravity: '#9b59b6',
    momentum: '#3498db',
    elasticity: '#e74c3c',
    thermodynamics: '#e67e22',
}

// Physics property symbols
const PHYSICS_SYMBOLS: Record<PhysicsProperty, string> = {
    gravity: 'G',
    momentum: 'p',
    elasticity: 'e',
    thermodynamics: 'Q',
}

// Physics property descriptions
const PHYSICS_NAMES: Record<PhysicsProperty, string> = {
    gravity: 'Gravity',
    momentum: 'Momentum',
    elasticity: 'Elasticity',
    thermodynamics: 'Thermo',
}

interface LabScreenProps {
    onBack: () => void
}

export function LabScreen({ onBack }: LabScreenProps) {
    const { t } = useTranslation()
    const canvasRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)
    const sceneRef = useRef<LabScene | null>(null)

    // Store state
    const resources = useLabStore((s) => s.resources)
    const stats = useLabStore((s) => s.stats)
    const workers = useLabStore((s) => s.workers)
    const upgradeStat = useLabStore((s) => s.upgradeStat)
    const getUpgradeCost = useLabStore((s) => s.getUpgradeCost)

    // AdMob
    const { isAdFree } = usePurchaseStore()
    const { isBannerVisible, hideBanner, isNative } = useAdMob()

    // UI state
    const [mounted, setMounted] = useState(false)
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)
    const [showUpgradePanel, setShowUpgradePanel] = useState(false)

    // Refs for callbacks
    const selectedWorkerIdRef = useRef<string | null>(null)
    const workersRef = useRef(workers)

    useEffect(() => {
        selectedWorkerIdRef.current = selectedWorkerId
    }, [selectedWorkerId])

    useEffect(() => {
        workersRef.current = workers
    }, [workers])

    useEffect(() => {
        useSyncLabOnMount()
    }, [])

    // Hide banner when unmounting
    useEffect(() => {
        return () => {
            if (isBannerVisible) {
                hideBanner()
            }
        }
    }, [isBannerVisible, hideBanner])

    // Initialize PixiJS
    useEffect(() => {
        if (!canvasRef.current) return

        const initPixi = async () => {
            const app = new Application()
            await app.init({
                background: 0x1a1a2e,
                resizeTo: canvasRef.current!,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            })

            const canvas = app.canvas as HTMLCanvasElement
            canvas.style.position = 'absolute'
            canvas.style.top = '0'
            canvas.style.left = '0'
            canvas.style.width = '100%'
            canvas.style.height = '100%'
            canvas.style.touchAction = 'none'
            canvasRef.current!.appendChild(canvas)
            appRef.current = app

            app.stage.eventMode = 'static'

            const scene = new LabScene(app)
            app.stage.addChild(scene.container)
            sceneRef.current = scene

            scene.setOnWorkerSelect((workerId) => {
                setSelectedWorkerId(workerId)
            })

            scene.setOnStationSelect((stationId) => {
                const currentSelectedId = selectedWorkerIdRef.current
                const currentWorkers = workersRef.current

                if (currentSelectedId) {
                    const worker = currentWorkers.find((w) => w.id === currentSelectedId)
                    if (worker) {
                        if (worker.assignedStation === stationId) {
                            scene.assignWorkerToStation(currentSelectedId, null)
                        } else {
                            scene.assignWorkerToStation(currentSelectedId, stationId)
                        }
                    }
                    setSelectedWorkerId(null)
                }
            })
        }

        initPixi()

        return () => {
            if (sceneRef.current) {
                sceneRef.current.destroy()
                sceneRef.current = null
            }
            if (appRef.current) {
                appRef.current.destroy(true)
                appRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        if (sceneRef.current) {
            sceneRef.current.syncWorkersFromStore()
        }
    }, [workers])

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    const handleUpgrade = useCallback(
        (property: PhysicsProperty) => {
            upgradeStat(property)
        },
        [upgradeStat]
    )

    const handleWorkerClick = useCallback((workerId: string) => {
        setSelectedWorkerId((prev) => (prev === workerId ? null : workerId))
        if (sceneRef.current) {
            sceneRef.current.selectWorker(workerId)
        }
    }, [])

    const physicsProperties: PhysicsProperty[] = ['gravity', 'momentum', 'elasticity', 'thermodynamics']

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: theme.bg }}>
            {/* Balatro Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <Balatro
                    color1={labPreset.color1}
                    color2={labPreset.color2}
                    color3={labPreset.color3}
                    spinSpeed={labPreset.spinSpeed}
                    spinRotation={labPreset.spinRotation}
                    contrast={labPreset.contrast}
                    lighting={labPreset.lighting}
                    spinAmount={labPreset.spinAmount}
                    pixelFilter={labPreset.pixelFilter}
                    isRotate={labPreset.isRotate}
                    mouseInteraction={false}
                />
            </div>

            {/* PixiJS Canvas */}
            <div ref={canvasRef} className="absolute inset-0 z-10" style={{ touchAction: 'none' }} />

            {/* Header */}
            <div
                className="absolute z-20 flex items-center gap-3"
                style={{
                    top: 'max(env(safe-area-inset-top, 0px), 12px)',
                    left: 'max(env(safe-area-inset-left, 0px), 12px)',
                    right: 'max(env(safe-area-inset-right, 0px), 12px)',
                }}
            >
                <button
                    onClick={onBack}
                    className="h-9 w-9 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: theme.bgPanel,
                        border: `2px solid ${theme.border}`,
                    }}
                >
                    <ArrowLeft className="w-4 h-4 text-white/80" />
                </button>

                {/* Title */}
                <div className="flex-1 flex items-center justify-center">
                    <div
                        className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                        style={{
                            background: `${theme.purple}dd`,
                            border: `2px solid ${theme.border}`,
                        }}
                    >
                        <FlaskConical className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                            {t('lab.title', 'Physics Lab')}
                        </span>
                    </div>
                </div>

                {/* Upgrade button */}
                <button
                    onClick={() => setShowUpgradePanel(true)}
                    className="h-9 w-9 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: theme.green,
                        border: `2px solid ${theme.border}`,
                    }}
                >
                    <TrendingUp className="w-4 h-4 text-white" />
                </button>
            </div>

            {/* Resource Bar - Compact with levels */}
            <div
                className={cn(
                    'absolute z-10 transition-all duration-500',
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                )}
                style={{
                    top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 48px)',
                    left: 'max(env(safe-area-inset-left, 0px), 12px)',
                    right: 'max(env(safe-area-inset-right, 0px), 12px)',
                }}
            >
                <div
                    className="rounded-lg p-2 flex gap-1.5"
                    style={{
                        background: `${theme.bgPanel}dd`,
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    {physicsProperties.map((property) => {
                        const level = stats[property]
                        const cost = getUpgradeCost(property)
                        const canAfford = resources[property] >= cost

                        return (
                            <div
                                key={property}
                                className="flex-1 rounded-md px-2 py-1.5 flex flex-col items-center gap-0.5"
                                style={{
                                    background: `${PHYSICS_COLORS[property]}15`,
                                    border: `1px solid ${PHYSICS_COLORS[property]}40`,
                                }}
                            >
                                {/* Symbol and amount */}
                                <div className="flex items-center gap-1.5 w-full">
                                    <span
                                        className="text-sm font-bold italic"
                                        style={{ color: PHYSICS_COLORS[property], fontFamily: 'Georgia, serif' }}
                                    >
                                        {PHYSICS_SYMBOLS[property]}
                                    </span>
                                    <span className="text-xs font-bold text-white flex-1 text-right">
                                        {formatNumber(Math.floor(resources[property]))}
                                    </span>
                                </div>
                                {/* Level indicator */}
                                <div className="flex items-center gap-1 w-full">
                                    <span className="text-[9px] text-white/40">Lv.</span>
                                    <span className="text-[10px] font-bold" style={{ color: PHYSICS_COLORS[property] }}>
                                        {level}
                                    </span>
                                    {canAfford && level < UPGRADES[property].maxLevel && (
                                        <ChevronUp className="w-2.5 h-2.5 text-green-400 ml-auto animate-bounce" />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Worker Panel (bottom) */}
            <div
                className={cn(
                    'absolute z-10 left-0 right-0 transition-all duration-500',
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                )}
                style={{
                    bottom: `calc(max(env(safe-area-inset-bottom, 0px), 8px) + ${isAdFree ? 12 : 110}px)`,
                    paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                    paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                }}
            >
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        background: `${theme.bgPanel}f0`,
                        border: `2px solid ${theme.border}`,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    {/* Header */}
                    <div
                        className="px-3 py-2 flex items-center gap-2"
                        style={{ background: `${theme.bgPanelLight}80` }}
                    >
                        <Users className="w-3.5 h-3.5 text-white/50" />
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                            {t('lab.workers', 'Researchers')}
                        </span>
                        <span className="text-[10px] text-white/30">
                            {workers.length}/8
                        </span>
                        {selectedWorkerId && (
                            <span className="ml-auto text-[10px] text-yellow-400 animate-pulse">
                                {t('lab.tapStation', 'Tap station to assign')}
                            </span>
                        )}
                    </div>

                    {/* Worker list */}
                    <div className="p-2 flex gap-2 overflow-x-auto">
                        {workers.map((worker) => {
                            const isSelected = selectedWorkerId === worker.id
                            const isAssigned = !!worker.assignedStation
                            const station = worker.assignedStation
                                ? STATIONS.find((s) => s.id === worker.assignedStation)
                                : null

                            return (
                                <button
                                    key={worker.id}
                                    onClick={() => handleWorkerClick(worker.id)}
                                    className={cn(
                                        'shrink-0 rounded-lg transition-all relative',
                                        isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent' : ''
                                    )}
                                    style={{
                                        background: isAssigned
                                            ? `linear-gradient(135deg, ${theme.bgPanelLight}, ${(station?.color ? `#${station.color.toString(16).padStart(6, '0')}` : theme.bgPanelLight)}40)`
                                            : theme.bgPanelLight,
                                        border: isSelected
                                            ? '2px solid #fbbf24'
                                            : `2px solid ${theme.border}`,
                                        padding: '8px 12px',
                                    }}
                                >
                                    <WobbleDisplay
                                        size={40}
                                        shape={worker.shape}
                                        color={WOBBLE_CHARACTERS[worker.shape].color}
                                        expression={isAssigned ? 'effort' : isSelected ? 'happy' : 'neutral'}
                                    />
                                    {/* Assignment indicator */}
                                    {isAssigned && station && (
                                        <div
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold text-white"
                                            style={{ background: station.color ? `#${station.color.toString(16).padStart(6, '0')}` : theme.purple }}
                                        >
                                            {PHYSICS_SYMBOLS[station.resource]}
                                        </div>
                                    )}
                                </button>
                            )
                        })}

                        {/* Empty slots */}
                        {Array.from({ length: Math.max(0, 4 - workers.length) }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="shrink-0 w-16 h-14 rounded-lg border-2 border-dashed flex items-center justify-center"
                                style={{ borderColor: `${theme.bgPanelLight}`, background: `${theme.bg}40` }}
                            >
                                <Plus className="w-4 h-4 text-white/20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Upgrade Panel Modal */}
            {showUpgradePanel && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setShowUpgradePanel(false)}
                    />

                    <div
                        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
                        style={{
                            background: theme.bgPanel,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
                        }}
                    >
                        {/* Header */}
                        <div
                            className="px-4 py-3 flex items-center justify-between"
                            style={{ background: theme.bgPanelLight }}
                        >
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                <h2 className="text-base font-bold text-white">
                                    {t('lab.upgrades', 'Research Upgrades')}
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowUpgradePanel(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        </div>

                        {/* Upgrade list */}
                        <div className="p-3 space-y-2">
                            {physicsProperties.map((property) => {
                                const level = stats[property]
                                const cost = getUpgradeCost(property)
                                const canAfford = resources[property] >= cost
                                const maxLevel = UPGRADES[property].maxLevel
                                const isMaxed = level >= maxLevel
                                const effect = UPGRADES[property].effectPerLevel * 100
                                const totalEffect = level * effect

                                return (
                                    <div
                                        key={property}
                                        className="rounded-xl overflow-hidden"
                                        style={{
                                            background: `linear-gradient(135deg, ${PHYSICS_COLORS[property]}15, ${theme.bg})`,
                                            border: `1px solid ${PHYSICS_COLORS[property]}30`,
                                        }}
                                    >
                                        <div className="p-3 flex items-center gap-3">
                                            {/* Symbol */}
                                            <div
                                                className="w-12 h-12 rounded-lg flex items-center justify-center"
                                                style={{ background: PHYSICS_COLORS[property] }}
                                            >
                                                <span className="text-white font-bold italic text-xl" style={{ fontFamily: 'Georgia, serif' }}>
                                                    {PHYSICS_SYMBOLS[property]}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white">
                                                        {PHYSICS_NAMES[property]}
                                                    </span>
                                                    <span
                                                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                                                        style={{ background: PHYSICS_COLORS[property], color: 'white' }}
                                                    >
                                                        Lv.{level}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-white/40 mt-0.5">
                                                    +{effect.toFixed(0)}% per level
                                                    <span className="text-white/60 ml-2">
                                                        (Total: +{totalEffect.toFixed(0)}%)
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Upgrade button */}
                                            <button
                                                onClick={() => handleUpgrade(property)}
                                                disabled={!canAfford || isMaxed}
                                                className={cn(
                                                    'px-3 py-2 rounded-lg font-bold text-xs transition-all flex flex-col items-center gap-0.5',
                                                    canAfford && !isMaxed ? 'active:scale-95' : 'opacity-50'
                                                )}
                                                style={{
                                                    background: canAfford && !isMaxed ? theme.green : theme.bgPanelLight,
                                                    border: `2px solid ${theme.border}`,
                                                    minWidth: 70,
                                                }}
                                            >
                                                {isMaxed ? (
                                                    <span className="text-white/80">MAX</span>
                                                ) : (
                                                    <>
                                                        <span className="flex items-center gap-1 text-white">
                                                            <Plus className="w-3 h-3" />
                                                            {formatNumber(cost)}
                                                        </span>
                                                        <span className="text-[9px] text-white/60">{PHYSICS_SYMBOLS[property]}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Progress bar to next level */}
                                        {!isMaxed && (
                                            <div className="px-3 pb-2">
                                                <div
                                                    className="h-1.5 rounded-full overflow-hidden"
                                                    style={{ background: `${theme.bg}80` }}
                                                >
                                                    <div
                                                        className="h-full rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min(100, (resources[property] / cost) * 100)}%`,
                                                            background: canAfford
                                                                ? theme.green
                                                                : PHYSICS_COLORS[property],
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Current resources footer */}
                        <div
                            className="px-4 py-2 flex justify-between items-center"
                            style={{ background: `${theme.bg}80` }}
                        >
                            <span className="text-[10px] text-white/40 uppercase">Current Resources</span>
                            <div className="flex gap-3">
                                {physicsProperties.map((property) => (
                                    <div key={property} className="flex items-center gap-1">
                                        <span
                                            className="text-xs font-bold italic"
                                            style={{ color: PHYSICS_COLORS[property], fontFamily: 'Georgia, serif' }}
                                        >
                                            {PHYSICS_SYMBOLS[property]}
                                        </span>
                                        <span className="text-xs text-white/80">
                                            {formatNumber(Math.floor(resources[property]))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ad Banner Area (Web placeholder) */}
            {!isNative && !isAdFree && (
                <div
                    className="absolute left-0 right-0 z-10 flex items-center justify-center"
                    style={{
                        bottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
                        height: '98px', // Banner height + button spacing
                        paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
                        paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
                    }}
                >
                    <div
                        className="w-full h-14 rounded-lg flex items-center justify-center"
                        style={{
                            background: `${theme.bgPanel}cc`,
                            border: `2px dashed ${theme.border}`,
                        }}
                    >
                        <span className="text-white/30 text-xs font-bold">AD BANNER (WEB)</span>
                    </div>
                </div>
            )}
        </div>
    )
}
