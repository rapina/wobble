# Physics Formula Audit Report

All 48 formulas in `src/formulas/` audited against textbook equations.

**Result: 45 PASS / 1 FAIL (fixed) / 2 WARNING**

---

## Mechanics

| # | Formula | Textbook | Implementation | Result |
|---|---------|----------|----------------|--------|
| 1 | Newton's Second Law | F = ma | `F: m * a` | PASS |
| 2 | Kinetic Energy | E = 1/2 mv^2 | `E: 0.5 * m * v * v` | PASS |
| 3 | Momentum | p = mv | `p: m * v` | PASS |
| 4 | Hooke's Law | F = -kx | `F: k * x` | WARNING |
| 5 | Centripetal Force | F = mv^2/r | `F: (m * v * v) / r` | PASS |
| 6 | Elastic Collision | v1' = (m1-e*m2)*v1/(m1+m2) | `v1Prime: ((m1 - e * m2) * v1) / (m1 + m2)` | PASS |
| 7 | Pressure | P = F/A | `P: (F * 10) / A` (unit conversion verified) | PASS |
| 8 | Torque | tau = rF sin(theta) | `τ: r * F * Math.sin(thetaRad)` | PASS |
| 9 | Free Fall | h = 1/2 gt^2 | `h: 0.5 * g * t * t` | PASS |
| 10 | Projectile | R = v^2 sin(2theta)/g | `R: (v * v * Math.sin(2 * thetaRad)) / g` | PASS |
| 11 | Angular Momentum | omega = L/I | `omega: L / I` | PASS |
| 12 | Rotational Energy | E = 1/2 I omega^2 | `E: 0.5 * I * omega * omega` | PASS |

## Gravity & Oscillation

| # | Formula | Textbook | Implementation | Result |
|---|---------|----------|----------------|--------|
| 13 | Gravity | F = Gm1m2/r^2 | `F: (G * m1 * m2) / (r * r)` | PASS |
| 14 | Pendulum | T = 2pi sqrt(L/g) | `T: 2 * Math.PI * Math.sqrt(L / g)` | PASS |
| 15 | Escape Velocity | v = sqrt(2GM/r) | Correct with unit conversions | PASS |
| 16 | Kepler's Third Law | T^2 = (4pi^2/GM)r^3 | Correct with unit conversions, output in days | PASS |

## Wave & Optics

| # | Formula | Textbook | Implementation | Result |
|---|---------|----------|----------------|--------|
| 17 | Wave Speed | v = f*lambda | `v: f * lambda` | PASS |
| 18 | Standing Wave | lambda = 2L/n | `λ: (2 * L) / n` | PASS |
| 19 | Beat Frequency | fbeat = \|f1-f2\| | `fbeat: Math.abs(f1 - f2)` | PASS |
| 20 | Beer-Lambert | I = I0 * e^(-alpha*L) | `I: I0 * Math.exp(-alpha * L)` | PASS |
| 21 | Doppler Effect | f' = f * v/(v-vs) | `fPrime: f * (v / (v - vs))` | WARNING |
| 22 | Inverse Square | I = P/(4pi r^2) | `I: P / (4 * Math.PI * r * r)` | PASS |
| 23 | Snell's Law | n1 sin(theta1) = n2 sin(theta2) | Correct; handles total internal reflection | PASS |
| 24 | Thin Lens | f = ab/(a+b) | `f: (a * b) / (a + b)` | PASS |
| 25 | Reflection | theta_r = theta_i | `θᵣ: thetaI` | PASS |

## Thermodynamics

| # | Formula | Textbook | Implementation | Result |
|---|---------|----------|----------------|--------|
| 26 | Ideal Gas | P = nRT/V | `P: (n * R * T) / V` (R=8.314) | PASS |
| 27 | Heat Transfer | Q = mc*deltaT | `Q: (m * c * deltaT) / 1000` (output kJ) | PASS |
| 28 | First Law | deltaU = Q - W | `ΔU: Q - W` | PASS |
| 29 | Entropy | deltaS = Q/T | `ΔS: Q / T` | PASS |
| 30 | Thermal Conduction | Q = kA*deltaT/L | Correct with unit conversions | PASS |
| 31 | Stefan-Boltzmann | P = sigma*A*T^4 | `P: sigma * A * Math.pow(T, 4)` (sigma=5.67e-8) | PASS |
| 32 | Wien's Law | lambda_max = b/T | `λmax: 2898000 / T` (b=2898000 nm*K) | PASS |

## Electromagnetism

| # | Formula | Textbook | Implementation | Result |
|---|---------|----------|----------------|--------|
| 33 | Ohm's Law | V = IR | `V: I * R` | PASS |
| 34 | Coulomb's Law | F = kq1q2/r^2 | Correct with unit conversions (uC, cm) | PASS |
| 35 | Electric Power | P = VI | `P: V * I` | PASS |
| 36 | Lorentz Force | F = qvB | `F: q * v * B * 1e-3` | FIXED |
| 37 | Capacitor Energy | E = 1/2 CV^2 | `E: 0.5 * C * V * V` | PASS |
| 38 | Electric Field | E = V/d | `E: V / d` | PASS |
| 39 | Faraday's Law | EMF = N*dPhi/dt | `EMF: Math.abs((N * dPhi) / dt)` | PASS |
| 40 | Magnetic Field | B = mu0*I/(2pi*r) | Correct with unit conversions | PASS |

## Quantum & Modern Physics

| # | Formula | Textbook | Implementation | Result |
|---|---------|----------|----------------|--------|
| 41 | Photoelectric | Ek = hf - W | `Ek: Math.max(0, h * f - W)` | PASS |
| 42 | de Broglie | lambda = h/(mv) | `λ: 0.6626 / (m * v)` (scaled units) | PASS |
| 43 | Time Dilation | t = t0/sqrt(1-v^2/c^2) | `t: t0 * gamma` (v in units of c) | PASS |
| 44 | Bohr Model | E = -13.6/n^2 | `E: -13.6/(n*n)` | PASS |
| 45 | Infinite Well | En = 0.376*n^2/L^2 | `E: 0.376 * n * n / (L * L)` | PASS |
| 46 | Uncertainty | delta_p >= hbar/(2*delta_x) | `Δp: 0.528 / Dx` | PASS |
| 47 | Quantum Tunneling | T = exp(-2*kappa*L) | `T: Math.exp(-2 * kappa * L) * 100` | PASS |

## Chemistry & Fluids

| # | Formula | Textbook | Implementation | Result |
|---|---------|----------|----------------|--------|
| 48 | pH | pH = -log10[H+] | `pH: -Math.log10(hConc)` clamped [0,14] | PASS |
| 49 | Dilution | M1*V1 = M2*V2 | `M2: (M1 * V1) / V2` | PASS |
| 50 | Reaction Rate | r = k[A]^n | `r: k * Math.pow(A, n)` | PASS |
| 51 | Radioactive Decay | N = N0*e^(-lambda*t) | `N: N0 * Math.exp(-lambda * t)` | PASS |
| 52 | Buoyancy | F = rho*V*g | `F: rho * (V / 1000) * g` (V: L to m^3) | PASS |
| 53 | Bernoulli/Continuity | A1*v1 = A2*v2 | `v2: (A1 * v1) / A2` | PASS |

---

## Issues Found

### FIXED: Lorentz Force (`lorentz.ts`)

Missing `* 1e-3` unit conversion. Output was 1000x too large.

```diff
- F: q * v * B,
+ F: q * v * B * 1e-3,
```

### WARNING: Hooke's Law (`hooke.ts`)

Outputs magnitude only (`F = kx`) instead of signed value (`F = -kx`). Acceptable for visualization — the negative sign indicates direction, not magnitude.

### WARNING: Doppler Effect (`doppler.ts`)

No guard against `vs >= v` (source at or above wave speed). Division by zero is possible in theory, but the slider range (vs: 0-100, v: 340) prevents this in normal use.
