import { Formula } from './types'
// Mechanics
import { newtonSecond } from './newton-second'
import { kineticEnergy } from './kinetic-energy'
import { momentum } from './momentum'
import { hooke } from './hooke'
import { centripetal } from './centripetal'
import { elasticCollision } from './elastic-collision'
import { pressure } from './pressure'
import { torque } from './torque'
// Gravity & Oscillation
import { gravity } from './gravity'
import { pendulum } from './pendulum'
import { freeFall } from './free-fall'
import { projectile } from './projectile'
import { escapeVelocity } from './escape-velocity'
import { keplerThird } from './kepler-third'
// Wave & Optics
import { wave } from './wave'
import { snell } from './snell'
import { lens } from './lens'
import { reflection } from './reflection'
import { standingWave } from './standing-wave'
// Thermodynamics
import { idealGas } from './ideal-gas'
import { heat } from './heat'
import { firstLaw } from './first-law'
import { entropy } from './entropy'
import { thermalConduction } from './thermal-conduction'
import { stefanBoltzmann } from './stefan-boltzmann'
import { wien } from './wien'
// Electricity
import { ohm } from './ohm'
import { coulomb } from './coulomb'
import { electricPower } from './electric-power'
import { lorentz } from './lorentz'
import { capacitor } from './capacitor'
import { electricDischarge } from './electric-discharge'
// Special / Modern Physics
import { buoyancy } from './buoyancy'
import { photoelectric } from './photoelectric'
import { debroglie } from './debroglie'
import { timeDilation } from './time-dilation'
// Quantum Mechanics
import { uncertainty } from './uncertainty'
import { infiniteWell } from './infinite-well'
import { tunneling } from './tunneling'
import { bohr } from './bohr'
// Chemistry
import { ph } from './ph'
import { dilution } from './dilution'
import { reactionRate } from './reaction-rate'
// New Physics
import { radioactiveDecay } from './radioactive-decay'
import { angularMomentum } from './angular-momentum'
import { bernoulli } from './bernoulli'
import { doppler } from './doppler'
import { faraday } from './faraday'
import { magneticField } from './magnetic-field'
import { rotationalEnergy } from './rotational-energy'
import { inverseSquare } from './inverse-square'
import { beatFrequency } from './beat-frequency'
import { beerLambert } from './beer-lambert'

export const formulas: Record<string, Formula> = {
    // Mechanics
    'newton-second': newtonSecond,
    'kinetic-energy': kineticEnergy,
    momentum: momentum,
    hooke: hooke,
    centripetal: centripetal,
    'elastic-collision': elasticCollision,
    pressure: pressure,
    torque: torque,
    // Gravity
    gravity: gravity,
    pendulum: pendulum,
    'free-fall': freeFall,
    projectile: projectile,
    'escape-velocity': escapeVelocity,
    'kepler-third': keplerThird,
    // Wave & Optics
    wave: wave,
    reflection: reflection,
    snell: snell,
    lens: lens,
    'standing-wave': standingWave,
    // Thermodynamics
    'ideal-gas': idealGas,
    heat: heat,
    'first-law': firstLaw,
    entropy: entropy,
    'thermal-conduction': thermalConduction,
    'stefan-boltzmann': stefanBoltzmann,
    wien: wien,
    // Electricity
    ohm: ohm,
    coulomb: coulomb,
    'electric-power': electricPower,
    lorentz: lorentz,
    capacitor: capacitor,
    'electric-discharge': electricDischarge,
    // Special / Modern Physics
    buoyancy: buoyancy,
    photoelectric: photoelectric,
    debroglie: debroglie,
    'time-dilation': timeDilation,
    // Quantum Mechanics
    uncertainty: uncertainty,
    'infinite-well': infiniteWell,
    tunneling: tunneling,
    bohr: bohr,
    // Chemistry
    ph: ph,
    dilution: dilution,
    'reaction-rate': reactionRate,
    // New Physics
    'radioactive-decay': radioactiveDecay,
    'angular-momentum': angularMomentum,
    bernoulli: bernoulli,
    doppler: doppler,
    faraday: faraday,
    'magnetic-field': magneticField,
    'rotational-energy': rotationalEnergy,
    'inverse-square': inverseSquare,
    'beat-frequency': beatFrequency,
    'beer-lambert': beerLambert,
}

export const formulaList = Object.values(formulas)

export function getFormula(id: string): Formula | undefined {
    return formulas[id]
}
