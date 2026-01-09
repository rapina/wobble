import { Application } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { NewtonScene } from './NewtonScene'
import { MomentumScene } from './MomentumScene'
import { KineticEnergyScene } from './KineticEnergyScene'
import { HookeScene } from './HookeScene'
import { PendulumScene } from './PendulumScene'
import { GravityScene } from './GravityScene'
import { WaveScene } from './WaveScene'
import { IdealGasScene } from './IdealGasScene'
import { OhmScene } from './OhmScene'
import { CoulombScene } from './CoulombScene'
import { PowerScene } from './PowerScene'
import { LorentzScene } from './LorentzScene'
import { CapacitorScene } from './CapacitorScene'
import { TimeDilationScene } from './TimeDilationScene'
import { SnellScene } from './SnellScene'
import { HeatScene } from './HeatScene'
import { CentripetalScene } from './CentripetalScene'
import { CollisionScene } from './CollisionScene'
import { BuoyancyScene } from './BuoyancyScene'
import { PhotoelectricScene } from './PhotoelectricScene'
import { DeBroglieScene } from './DeBroglieScene'
// New thermodynamics scenes
import { FirstLawScene } from './FirstLawScene'
import { EntropyScene } from './EntropyScene'
import { ThermalConductionScene } from './ThermalConductionScene'
import { StefanBoltzmannScene } from './StefanBoltzmannScene'
// New wave/optics scenes
import { LensScene } from './LensScene'
import { ReflectionScene } from './ReflectionScene'
import { StandingWaveScene } from './StandingWaveScene'
// New gravity scenes
import { FreeFallScene } from './FreeFallScene'
import { ProjectileScene } from './ProjectileScene'
import { EscapeVelocityScene } from './EscapeVelocityScene'
import { KeplerThirdScene } from './KeplerThirdScene'
// New shape-featured scenes (triangle, star, pentagon)
import { PressureScene } from './PressureScene'
import { WienScene } from './WienScene'
import { TorqueScene } from './TorqueScene'

type SceneConstructor = new (app: Application) => BaseScene

const sceneMap: Record<string, SceneConstructor> = {
    'newton-second': NewtonScene,
    momentum: MomentumScene,
    'kinetic-energy': KineticEnergyScene,
    hooke: HookeScene,
    pendulum: PendulumScene,
    gravity: GravityScene,
    wave: WaveScene,
    'ideal-gas': IdealGasScene,
    ohm: OhmScene,
    coulomb: CoulombScene,
    'electric-power': PowerScene,
    lorentz: LorentzScene,
    capacitor: CapacitorScene,
    'time-dilation': TimeDilationScene,
    snell: SnellScene,
    heat: HeatScene,
    centripetal: CentripetalScene,
    'elastic-collision': CollisionScene,
    buoyancy: BuoyancyScene,
    photoelectric: PhotoelectricScene,
    debroglie: DeBroglieScene,
    // New thermodynamics scenes
    'first-law': FirstLawScene,
    entropy: EntropyScene,
    'thermal-conduction': ThermalConductionScene,
    'stefan-boltzmann': StefanBoltzmannScene,
    // New wave/optics scenes
    lens: LensScene,
    reflection: ReflectionScene,
    'standing-wave': StandingWaveScene,
    // New gravity scenes
    'free-fall': FreeFallScene,
    projectile: ProjectileScene,
    'escape-velocity': EscapeVelocityScene,
    'kepler-third': KeplerThirdScene,
    // New shape-featured scenes (triangle, star, pentagon)
    pressure: PressureScene,
    wien: WienScene,
    torque: TorqueScene,
}

export function getSceneClass(formulaId: string): SceneConstructor | null {
    return sceneMap[formulaId] || null
}
