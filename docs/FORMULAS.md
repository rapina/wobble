# FORMULAS.md

Complete list of implemented physics formulas in Wobble. Each formula has a dedicated scene in `src/components/canvas/scenes/` and is registered in `src/formulas/registry.ts`.

**Total: 53 formulas across 9 categories**

---

## Mechanics (8 formulas)

| ID | Name | Expression | Layout | Variables |
|----|------|-----------|--------|-----------|
| `newton-second` | Newton's Second Law | F = ma | linear | m (input, kg), a (input, m/s²), F (output, N) |
| `kinetic-energy` | Kinetic Energy | E = ½mv² | linear | m (input, kg), v (input, m/s), E (output, J) |
| `momentum` | Momentum | p = mv | linear | m (input, kg), v (input, m/s), p (output, kg·m/s) |
| `hooke` | Hooke's Law | F = -kx | spring | k (input, N/m), x (input, m), F (output, N) |
| `centripetal` | Centripetal Force | F = mv²/r | circular | m (input, kg), v (input, m/s), r (input, m), F (output, N) |
| `elastic-collision` | Elastic Collision | e = -(v₂'-v₁')/(v₂-v₁) | linear | m₁ (input, kg), m₂ (input, kg), v₁ (input, m/s), e (input), v₁' (output, m/s) |
| `pressure` | Pressure | P = F/A | linear | F (input, N), A (input, cm²), P (output, kPa) |
| `torque` | Torque | τ = rF sin θ | circular | r (input, m), F (input, N), θ (input, °), τ (output, N·m) |

## Gravity (6 formulas)

| ID | Name | Expression | Layout | Variables |
|----|------|-----------|--------|-----------|
| `gravity` | Universal Gravitation | F = Gm₁m₂/r² | orbital | m1 (input, ×10²⁴kg), m2 (input, ×10²²kg), r (input, ×10⁸m), F (output, ×10²⁰N) |
| `pendulum` | Simple Pendulum | T = 2π√(L/g) | pendulum | L (input, m), g (input, m/s²), T (output, s) |
| `free-fall` | Free Fall | h = ½gt² | linear | g (input, m/s²), t (input, s), h (output, m) |
| `projectile` | Projectile Motion | R = v²sin2θ/g | linear | v (input, m/s), θ (input, °), g (input, m/s²), R (output, m) |
| `escape-velocity` | Escape Velocity | v = √(2GM/r) | orbital | M (input, ×10²⁴kg), r (input, ×10⁶m), v (output, km/s) |
| `kepler-third` | Kepler's Third Law | T² = (4π²/GM)r³ | orbital | M (input, ×10²⁴kg), r (input, ×10⁶m), T (output, days) |

## Wave & Optics (5 formulas)

| ID | Name | Expression | Layout | Variables |
|----|------|-----------|--------|-----------|
| `wave` | Wave Velocity | v = fλ | wave | f (input, Hz), λ (input, m), v (output, m/s) |
| `reflection` | Law of Reflection | θᵢ = θᵣ | linear | θᵢ (input, °), θᵣ (output, °) |
| `snell` | Snell's Law | n₁sinθ₁ = n₂sinθ₂ | linear | n₁ (input), θ₁ (input, °), n₂ (input), θ₂ (output, °) |
| `lens` | Thin Lens Equation | 1/f = 1/a + 1/b | linear | a (input, cm), b (input, cm), f (output, cm) |
| `standing-wave` | Standing Wave | L = nλ/2 | linear | L (input, m), n (input), λ (output, m) |

## Thermodynamics (7 formulas)

| ID | Name | Expression | Layout | Variables |
|----|------|-----------|--------|-----------|
| `ideal-gas` | Ideal Gas Law | PV = nRT | container | n (input, mol), T (input, K), V (input, L), P (output, kPa) |
| `heat` | Heat | Q = mcΔT | linear | m (input, kg), c (input, J/kg·K), ΔT (input, K), Q (output, kJ) |
| `first-law` | First Law of Thermodynamics | ΔU = Q - W | container | Q (input, J), W (input, J), ΔU (output, J) |
| `entropy` | Entropy | ΔS = Q/T | container | Q (input, J), T (input, K), ΔS (output, J/K) |
| `thermal-conduction` | Thermal Conduction | Q = kAΔT/L | flow | k (input, W/m·K), A (input, cm²), ΔT (input, °C), L (input, cm), Q (output, W) |
| `stefan-boltzmann` | Stefan-Boltzmann Law | P = σAT⁴ | explosion | A (input, m²), T (input, K), P (output, W) |
| `wien` | Wien's Displacement Law | λmax = b/T | linear | T (input, K), λmax (output, nm) |

## Electricity (6 formulas)

| ID | Name | Expression | Layout | Variables |
|----|------|-----------|--------|-----------|
| `ohm` | Ohm's Law | V = IR | flow | I (input, A), R (input, Ω), V (output, V) |
| `coulomb` | Coulomb's Law | F = kq₁q₂/r² | orbital | q₁ (input, μC), q₂ (input, μC), r (input, cm), F (output, N) |
| `electric-power` | Electric Power | P = VI | flow | V (input, V), I (input, A), P (output, W) |
| `lorentz` | Lorentz Force | F = qvB | circular | q (input, μC), v (input, m/s), B (input, T), F (output, mN) |
| `capacitor` | Capacitor | E = ½CV² | flow | C (input, mF), V (input, kV), E (output, kJ) |
| `electric-discharge` | Electric Discharge | E = V/d | flow | V (input, kV), d (input, mm), E (output, kV/mm) |

## Special / Modern Physics (4 formulas)

| ID | Name | Expression | Layout | Variables |
|----|------|-----------|--------|-----------|
| `buoyancy` | Buoyancy | F = ρVg | float | ρ (input, kg/m³), V (input, L), g (input, m/s²), F (output, N) |
| `photoelectric` | Photoelectric Effect | Ek = hf - W | linear | f (input, ×10¹⁴Hz), W (input, eV), Ek (output, eV) |
| `debroglie` | de Broglie Wavelength | λ = h/p | wave | m (input, ×10⁻³¹kg), v (input, ×10⁶m/s), λ (output, nm) |
| `time-dilation` | Time Dilation | t = t₀/√(1-v²/c²) | linear | t₀ (input, s), v (input, c), t (output, s) |

## Quantum Mechanics (4 formulas)

| ID | Name | Expression | Layout | Variables |
|----|------|-----------|--------|-----------|
| `uncertainty` | Uncertainty Principle | ΔxΔp ≥ ℏ/2 | wave | Δx (input, nm), Δp (output, ×10⁻²⁵kg·m/s) |
| `infinite-well` | Infinite Square Well | Eₙ = n²ℏ²π²/2mL² | container | n (input), L (input, nm), E (output, eV) |
| `tunneling` | Quantum Tunneling | T ≈ e⁻²ᵏᴸ | linear | E (input, eV), V (input, eV), L (input, nm), T (output, %) |
| `bohr` | Bohr Model | Eₙ = -13.6/n² eV | orbital | n (input), E (output, eV), r (output, a₀) |

## Chemistry (3 formulas)

| ID | Name | Expression | Layout | Variables |
|----|------|-----------|--------|-----------|
| `ph` | pH Scale | pH = -log[H⁺] | container | [H⁺] (input, mol/L), pH (output) |
| `dilution` | Dilution | M₁V₁ = M₂V₂ | container | M₁ (input, M), V₁ (input, mL), V₂ (input, mL), M₂ (output, M) |
| `reaction-rate` | Rate Law | r = k[A]ⁿ | container | k (input), [A] (input, M), n (input), r (output, M/s) |

## New Physics (10 formulas)

| ID | Name | Expression | Layout | Variables |
|----|------|-----------|--------|-----------|
| `radioactive-decay` | Radioactive Decay | N = N₀e^(-λt) | container | N₀ (input), λ (input, /s), t (input, s), N (output) |
| `angular-momentum` | Angular Momentum | L = Iω | circular | L (input, kg·m²/s), I (input, kg·m²), ω (output, rad/s) |
| `bernoulli` | Bernoulli's Principle | P + ½ρv² = const | flow | v₁ (input, m/s), A₁ (input, m²), A₂ (input, m²), v₂ (output, m/s) |
| `doppler` | Doppler Effect | f' = f(v/(v-vₛ)) | wave | f (input, Hz), v (input, m/s), vₛ (input, m/s), f' (output, Hz) |
| `faraday` | Faraday's Law | EMF = -NΔΦ/Δt | flow | N (input), ΔΦ (input, Wb), Δt (input, s), EMF (output, V) |
| `magnetic-field` | Magnetic Field (Wire) | B = μ₀I/(2πr) | circular | I (input, A), r (input, cm), B (output, μT) |
| `rotational-energy` | Rotational Energy | E = ½Iω² | circular | I (input, kg·m²), ω (input, rad/s), E (output, J) |
| `inverse-square` | Inverse Square Law | I = P/(4πr²) | linear | P (input, W), r (input, m), I (output, W/m²) |
| `beat-frequency` | Beat Frequency | fbeat = \|f₁ - f₂\| | wave | f₁ (input, Hz), f₂ (input, Hz), fbeat (output, Hz) |
| `beer-lambert` | Beer-Lambert Law | I = I₀e^(-αL) | linear | I₀ (input, W/m²), α (input, /m), L (input, m), I (output, W/m²) |

---

## Layout Types

Each formula uses a `layout.type` that determines the base visualization style:

| Type | Description | Used by |
|------|------------|---------|
| `linear` | Objects moving in a line / direct cause-effect | newton-second, kinetic-energy, momentum, pressure, reflection, snell, lens, standing-wave, heat, wien, photoelectric, time-dilation, tunneling, inverse-square, beer-lambert, elastic-collision, free-fall, projectile |
| `orbital` | Bodies orbiting each other | gravity, coulomb, escape-velocity, kepler-third, bohr |
| `circular` | Circular / rotational motion | centripetal, torque, lorentz, angular-momentum, magnetic-field, rotational-energy |
| `wave` | Wave propagation and oscillation | wave, debroglie, uncertainty, doppler, beat-frequency |
| `flow` | Flow / transfer between points | ohm, electric-power, capacitor, electric-discharge, thermal-conduction, bernoulli, faraday |
| `container` | Enclosed system / state changes | ideal-gas, first-law, entropy, infinite-well, ph, dilution, reaction-rate, radioactive-decay |
| `spring` | Spring / elastic deformation | hooke |
| `pendulum` | Pendulum swing | pendulum |
| `float` | Floating / buoyancy | buoyancy |
| `explosion` | Radiating energy outward | stefan-boltzmann |

## Scene File Mapping

All scenes are in `src/components/canvas/scenes/`. Scene class names follow the pattern `{Name}Scene`:

| Formula ID | Scene Class | File |
|-----------|------------|------|
| `newton-second` | NewtonScene | NewtonScene.ts |
| `kinetic-energy` | KineticEnergyScene | KineticEnergyScene.ts |
| `momentum` | MomentumScene | MomentumScene.ts |
| `hooke` | HookeScene | HookeScene.ts |
| `centripetal` | CentripetalScene | CentripetalScene.ts |
| `elastic-collision` | CollisionScene | CollisionScene.ts |
| `pressure` | PressureScene | PressureScene.ts |
| `torque` | TorqueScene | TorqueScene.ts |
| `gravity` | GravityScene | GravityScene.ts |
| `pendulum` | PendulumScene | PendulumScene.ts |
| `free-fall` | FreeFallScene | FreeFallScene.ts |
| `projectile` | ProjectileScene | ProjectileScene.ts |
| `escape-velocity` | EscapeVelocityScene | EscapeVelocityScene.ts |
| `kepler-third` | KeplerThirdScene | KeplerThirdScene.ts |
| `wave` | WaveScene | WaveScene.ts |
| `reflection` | ReflectionScene | ReflectionScene.ts |
| `snell` | SnellScene | SnellScene.ts |
| `lens` | LensScene | LensScene.ts |
| `standing-wave` | StandingWaveScene | StandingWaveScene.ts |
| `ideal-gas` | IdealGasScene | IdealGasScene.ts |
| `heat` | HeatScene | HeatScene.ts |
| `first-law` | FirstLawScene | FirstLawScene.ts |
| `entropy` | EntropyScene | EntropyScene.ts |
| `thermal-conduction` | ThermalConductionScene | ThermalConductionScene.ts |
| `stefan-boltzmann` | StefanBoltzmannScene | StefanBoltzmannScene.ts |
| `wien` | WienScene | WienScene.ts |
| `ohm` | OhmScene | OhmScene.ts |
| `coulomb` | CoulombScene | CoulombScene.ts |
| `electric-power` | PowerScene | PowerScene.ts |
| `lorentz` | LorentzScene | LorentzScene.ts |
| `capacitor` | CapacitorScene | CapacitorScene.ts |
| `electric-discharge` | ElectricDischargeScene | ElectricDischargeScene.ts |
| `buoyancy` | BuoyancyScene | BuoyancyScene.ts |
| `photoelectric` | PhotoelectricScene | PhotoelectricScene.ts |
| `debroglie` | DeBroglieScene | DeBroglieScene.ts |
| `time-dilation` | TimeDilationScene | TimeDilationScene.ts |
| `uncertainty` | UncertaintyScene | UncertaintyScene.ts |
| `infinite-well` | InfiniteWellScene | InfiniteWellScene.ts |
| `tunneling` | TunnelingScene | TunnelingScene.ts |
| `bohr` | BohrScene | BohrScene.ts |
| `ph` | PhScene | PhScene.ts |
| `dilution` | DilutionScene | DilutionScene.ts |
| `reaction-rate` | ReactionRateScene | ReactionRateScene.ts |
| `radioactive-decay` | RadioactiveDecayScene | RadioactiveDecayScene.ts |
| `angular-momentum` | AngularMomentumScene | AngularMomentumScene.ts |
| `bernoulli` | BernoulliScene | BernoulliScene.ts |
| `doppler` | DopplerScene | DopplerScene.ts |
| `faraday` | FaradayScene | FaradayScene.ts |
| `magnetic-field` | MagneticFieldScene | MagneticFieldScene.ts |
| `rotational-energy` | RotationalEnergyScene | RotationalEnergyScene.ts |
| `inverse-square` | InverseSquareScene | InverseSquareScene.ts |
| `beat-frequency` | BeatFrequencyScene | BeatFrequencyScene.ts |
| `beer-lambert` | BeerLambertScene | BeerLambertScene.ts |

## Adding a New Formula

1. Create `src/formulas/{formula-id}.ts` implementing the `Formula` interface
2. Register in `src/formulas/registry.ts` under the appropriate category
3. Create `src/components/canvas/scenes/{Name}Scene.ts` extending `BaseScene`
4. Register scene in `src/components/canvas/scenes/SceneManager.ts`
5. Update this document with the new formula details
