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
// Special / Modern Physics
import { buoyancy } from './buoyancy'
import { photoelectric } from './photoelectric'
import { debroglie } from './debroglie'
import { timeDilation } from './time-dilation'

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
    // Special / Modern Physics
    buoyancy: buoyancy,
    photoelectric: photoelectric,
    debroglie: debroglie,
    'time-dilation': timeDilation,
}

export const formulaList = Object.values(formulas)

export function getFormula(id: string): Formula | undefined {
    return formulas[id]
}
