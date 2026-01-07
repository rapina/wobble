import { Formula } from './types';
// Mechanics
import { newtonSecond } from './newton-second';
import { kineticEnergy } from './kinetic-energy';
import { momentum } from './momentum';
import { hooke } from './hooke';
import { centripetal } from './centripetal';
import { elasticCollision } from './elastic-collision';
// Gravity & Oscillation
import { gravity } from './gravity';
import { pendulum } from './pendulum';
// Wave
import { wave } from './wave';
import { snell } from './snell';
import { doppler } from './doppler';
// Thermodynamics
import { idealGas } from './ideal-gas';
import { heat } from './heat';
// Electricity
import { ohm } from './ohm';
import { coulomb } from './coulomb';
import { electricPower } from './electric-power';
import { lorentz } from './lorentz';
import { capacitor } from './capacitor';
// Special / Modern Physics
import { massEnergy } from './mass-energy';
import { buoyancy } from './buoyancy';
import { photoelectric } from './photoelectric';
import { debroglie } from './debroglie';

export const formulas: Record<string, Formula> = {
    // Mechanics
    'newton-second': newtonSecond,
    'kinetic-energy': kineticEnergy,
    momentum: momentum,
    hooke: hooke,
    centripetal: centripetal,
    'elastic-collision': elasticCollision,
    // Gravity & Oscillation
    gravity: gravity,
    pendulum: pendulum,
    // Wave & Optics
    wave: wave,
    snell: snell,
    doppler: doppler,
    // Thermodynamics
    'ideal-gas': idealGas,
    heat: heat,
    // Electricity
    ohm: ohm,
    coulomb: coulomb,
    'electric-power': electricPower,
    lorentz: lorentz,
    capacitor: capacitor,
    // Special / Modern Physics
    'mass-energy': massEnergy,
    buoyancy: buoyancy,
    photoelectric: photoelectric,
    debroglie: debroglie,
};

export const formulaList = Object.values(formulas);

export function getFormula(id: string): Formula | undefined {
    return formulas[id];
}
