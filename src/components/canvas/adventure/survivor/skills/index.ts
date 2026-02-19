// ============================================
// SKILLS MODULE
// Extensible, modular skill system
// ============================================

// Core types
export * from './types'

// Registry
export * from './registry'

// Base behavior class
export * from './base/BaseSkillBehavior'

// Skill combiner utility
export * from './utils/SkillCombiner'

// Import all behaviors to register them
// Projectile skills - base
import './behaviors/projectile/KineticShot'

// Projectile skills - modifiers
import './behaviors/projectile/ElasticBounce'
import './behaviors/projectile/MomentumPierce'
import './behaviors/projectile/PressureWave'
import './behaviors/projectile/FrequencyBurst'
import './behaviors/projectile/FmaImpact'
import './behaviors/projectile/GravityPull'
import './behaviors/projectile/RefractionSpread'
import './behaviors/projectile/CentripetalPulse'
import './behaviors/projectile/ElasticReturn'

// Aura skills
import './behaviors/aura/RadiantAura'
import './behaviors/aura/ChaosField'
import './behaviors/aura/MagneticShield'
import './behaviors/aura/StaticRepulsion'
import './behaviors/aura/TimeWarp'
import './behaviors/aura/FlowStream'
import './behaviors/aura/MagneticPull'

// Orbital skills
import './behaviors/orbital/OrbitalStrike'
import './behaviors/orbital/TorqueSlash'
import './behaviors/orbital/PlasmaDischarge'

// Player skills
import './behaviors/player/QuantumTunnel'
import './behaviors/player/PendulumRhythm'
import './behaviors/player/BuoyantBomb'
import './behaviors/player/WavePulse'
import './behaviors/player/BeatPulse'

// Trigger skills
import './behaviors/trigger/DecayChain'
import './behaviors/trigger/HeatChain'
import './behaviors/trigger/FrequencyShift'
import './behaviors/trigger/EscapeBurst'

// Re-export behavior types for convenience
export type { ElasticBounceEffect } from './behaviors/projectile/ElasticBounce'
export type { MomentumPierceEffect } from './behaviors/projectile/MomentumPierce'
export type { PressureWaveEffect } from './behaviors/projectile/PressureWave'
export type { FrequencyBurstEffect } from './behaviors/projectile/FrequencyBurst'
export type { FmaImpactEffect } from './behaviors/projectile/FmaImpact'
export type { GravityPullEffect } from './behaviors/projectile/GravityPull'
export type { RefractionSpreadEffect } from './behaviors/projectile/RefractionSpread'
export type { CentripetalPulseEffect } from './behaviors/projectile/CentripetalPulse'
export type { ElasticReturnEffect } from './behaviors/projectile/ElasticReturn'
