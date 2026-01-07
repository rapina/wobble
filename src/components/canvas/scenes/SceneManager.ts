import { Application } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { NewtonScene } from './NewtonScene';
import { MomentumScene } from './MomentumScene';
import { KineticEnergyScene } from './KineticEnergyScene';
import { HookeScene } from './HookeScene';
import { PendulumScene } from './PendulumScene';
import { GravityScene } from './GravityScene';
import { WaveScene } from './WaveScene';
import { IdealGasScene } from './IdealGasScene';
import { OhmScene } from './OhmScene';
import { CoulombScene } from './CoulombScene';
import { PowerScene } from './PowerScene';
import { LorentzScene } from './LorentzScene';
import { CapacitorScene } from './CapacitorScene';
import { MassEnergyScene } from './MassEnergyScene';
import { SnellScene } from './SnellScene';
import { DopplerScene } from './DopplerScene';
import { HeatScene } from './HeatScene';
import { CentripetalScene } from './CentripetalScene';
import { CollisionScene } from './CollisionScene';
import { BuoyancyScene } from './BuoyancyScene';
import { PhotoelectricScene } from './PhotoelectricScene';
import { DeBroglieScene } from './DeBroglieScene';

type SceneConstructor = new (app: Application) => BaseScene;

const sceneMap: Record<string, SceneConstructor> = {
    'newton-second': NewtonScene,
    'momentum': MomentumScene,
    'kinetic-energy': KineticEnergyScene,
    'hooke': HookeScene,
    'pendulum': PendulumScene,
    'gravity': GravityScene,
    'wave': WaveScene,
    'ideal-gas': IdealGasScene,
    'ohm': OhmScene,
    'coulomb': CoulombScene,
    'electric-power': PowerScene,
    'lorentz': LorentzScene,
    'capacitor': CapacitorScene,
    'mass-energy': MassEnergyScene,
    'snell': SnellScene,
    'doppler': DopplerScene,
    'heat': HeatScene,
    'centripetal': CentripetalScene,
    'elastic-collision': CollisionScene,
    'buoyancy': BuoyancyScene,
    'photoelectric': PhotoelectricScene,
    'debroglie': DeBroglieScene,
};

export function getSceneClass(formulaId: string): SceneConstructor | null {
    return sceneMap[formulaId] || null;
}
