# Physics Formulas Documentation

This document tracks all physics formulas implemented in Wobble, their implementation status, and which character shapes are used in scenes.

## Wobble Characters (Shapes)

Each shape has a unique personality and role:

| Shape | Name | Korean | Personality | Role |
|-------|------|--------|-------------|------|
| circle | Wobi | 워비 | Curious and energetic | Protagonist |
| square | Boxy | 박시 | Gentle, often pushed around | Victim |
| triangle | Spike | 스파이크 | Sharp and competitive | Attacker |
| star | Twinkle | 트윙클 | Special, brings luck | Bonus |
| diamond | Gem | 젬 | Precious, goal-oriented | Goal |
| pentagon | Penta | 펜타 | Reliable protector | Defender |

## Implementation Status

- Formula File: `src/formulas/{id}.ts`
- Scene File: `src/components/canvas/scenes/{Name}Scene.ts`
- Shapes Used: Character shapes appearing in the scene animation

---

## Mechanics (역학)

### Newton's Second Law (뉴턴 제2법칙)
- **ID**: `newton-second`
- **Formula**: `F = ma`
- **Shapes Used**: circle, square
- **Description**: Force equals mass times acceleration

### Kinetic Energy (운동 에너지)
- **ID**: `kinetic-energy`
- **Formula**: `E = ½mv²`
- **Shapes Used**: circle
- **Description**: Energy possessed by a moving object

### Momentum (운동량)
- **ID**: `momentum`
- **Formula**: `p = mv`
- **Shapes Used**: circle, square
- **Description**: Physical quantity representing motion state

### Hooke's Law (훅의 법칙)
- **ID**: `hooke`
- **Formula**: `F = -kx`
- **Shapes Used**: circle
- **Description**: Restoring force proportional to displacement

### Centripetal Force (구심력)
- **ID**: `centripetal`
- **Formula**: `F = mv²/r`
- **Shapes Used**: circle, square
- **Description**: Force pulling rotating object toward center

### Elastic Collision (탄성 충돌)
- **ID**: `elastic-collision`
- **Formula**: `e = -(v₂'-v₁')/(v₂-v₁)`
- **Shapes Used**: circle
- **Description**: Coefficient of restitution in collisions

### Pressure (압력) - NEW
- **ID**: `pressure`
- **Formula**: `P = F/A`
- **Shapes Used**: **triangle (Spike)**
- **Description**: Force applied per unit area

### Torque (토크) - NEW
- **ID**: `torque`
- **Formula**: `τ = rF sin θ`
- **Shapes Used**: **pentagon (Penta)**
- **Description**: Rotational effect of a force

---

## Gravity & Oscillation (중력 & 진동)

### Universal Gravitation (만유인력)
- **ID**: `gravity`
- **Formula**: `F = Gm₁m₂/r²`
- **Shapes Used**: circle, square
- **Description**: Gravitational force between two objects

### Simple Pendulum (단진자 주기)
- **ID**: `pendulum`
- **Formula**: `T = 2π√(L/g)`
- **Shapes Used**: circle
- **Description**: Time for one complete swing

### Free Fall (자유낙하)
- **ID**: `free-fall`
- **Formula**: `h = ½gt²`
- **Shapes Used**: circle
- **Description**: Distance traveled in free fall

### Projectile Motion (포물선 운동)
- **ID**: `projectile`
- **Formula**: `R = v₀²sin2θ/g`
- **Shapes Used**: circle
- **Description**: Range of projectile motion

### Escape Velocity (탈출 속도)
- **ID**: `escape-velocity`
- **Formula**: `v = √(2GM/r)`
- **Shapes Used**: circle, square
- **Description**: Minimum velocity to escape gravity

### Kepler's Third Law (케플러 제3법칙)
- **ID**: `kepler-third`
- **Formula**: `T² ∝ a³`
- **Shapes Used**: circle, square
- **Description**: Orbital period related to semi-major axis

---

## Wave & Optics (파동 & 광학)

### Wave Velocity (파동 속도)
- **ID**: `wave`
- **Formula**: `v = fλ`
- **Shapes Used**: circle, square
- **Description**: Speed at which wave propagates

### Snell's Law (스넬의 법칙)
- **ID**: `snell`
- **Formula**: `n₁sinθ₁ = n₂sinθ₂`
- **Shapes Used**: circle
- **Description**: Refraction angle relationship

### Lens Formula (렌즈 공식)
- **ID**: `lens`
- **Formula**: `1/f = 1/a + 1/b`
- **Shapes Used**: circle, square
- **Description**: Relationship of focal length, object and image distance

### Reflection (반사)
- **ID**: `reflection`
- **Formula**: `θᵢ = θᵣ`
- **Shapes Used**: circle
- **Description**: Angle of incidence equals angle of reflection

### Standing Wave (정상파)
- **ID**: `standing-wave`
- **Formula**: `L = nλ/2`
- **Shapes Used**: square
- **Description**: Wavelength in standing wave patterns

---

## Thermodynamics (열역학)

### Ideal Gas Law (이상 기체)
- **ID**: `ideal-gas`
- **Formula**: `PV = nRT`
- **Shapes Used**: circle, square
- **Description**: Relationship of pressure, volume, temperature

### Heat Transfer (열 전달)
- **ID**: `heat`
- **Formula**: `Q = mcΔT`
- **Shapes Used**: circle, square
- **Description**: Heat required to change temperature

### First Law of Thermodynamics (열역학 제1법칙)
- **ID**: `first-law`
- **Formula**: `ΔU = Q - W`
- **Shapes Used**: square, circle
- **Description**: Energy conservation in thermodynamic systems

### Entropy (엔트로피)
- **ID**: `entropy`
- **Formula**: `ΔS = Q/T`
- **Shapes Used**: circle
- **Description**: Change in disorder

### Thermal Conduction (열전도)
- **ID**: `thermal-conduction`
- **Formula**: `Q = kAΔT/L`
- **Shapes Used**: circle, square
- **Description**: Heat flow through materials

### Stefan-Boltzmann Law (슈테판-볼츠만 법칙)
- **ID**: `stefan-boltzmann`
- **Formula**: `P = σAT⁴`
- **Shapes Used**: circle
- **Description**: Thermal radiation power

### Wien's Displacement Law (빈의 변위 법칙) - NEW
- **ID**: `wien`
- **Formula**: `λmax = b/T`
- **Shapes Used**: **star (Twinkle)**
- **Description**: Peak wavelength of blackbody radiation inversely proportional to temperature

---

## Electricity & Magnetism (전기 & 자기)

### Ohm's Law (옴의 법칙)
- **ID**: `ohm`
- **Formula**: `V = IR`
- **Shapes Used**: circle, square
- **Description**: Voltage, current, resistance relationship

### Coulomb's Law (쿨롱의 법칙)
- **ID**: `coulomb`
- **Formula**: `F = kq₁q₂/r²`
- **Shapes Used**: circle, square
- **Description**: Electric force between charges

### Electric Power (전기 전력)
- **ID**: `electric-power`
- **Formula**: `P = IV`
- **Shapes Used**: circle
- **Description**: Power consumed by electrical devices

### Lorentz Force (로렌츠 힘)
- **ID**: `lorentz`
- **Formula**: `F = qvB`
- **Shapes Used**: circle
- **Description**: Force on moving charge in magnetic field

### Capacitor (축전기)
- **ID**: `capacitor`
- **Formula**: `Q = CV`
- **Shapes Used**: circle, square
- **Description**: Charge stored in capacitor

---

## Special & Modern Physics (특수 & 현대물리)

### Time Dilation (시간 지연)
- **ID**: `time-dilation`
- **Formula**: `t = t₀/√(1-v²/c²)`
- **Shapes Used**: circle
- **Description**: Time slows for fast-moving objects

### Photoelectric Effect (광전효과)
- **ID**: `photoelectric`
- **Formula**: `Ek = hf - W`
- **Shapes Used**: square
- **Description**: Electron emission by light

### De Broglie Wavelength (드브로이 파장)
- **ID**: `debroglie`
- **Formula**: `λ = h/p`
- **Shapes Used**: circle
- **Description**: Wave-particle duality of matter

### Buoyancy (부력)
- **ID**: `buoyancy`
- **Formula**: `F = ρVg`
- **Shapes Used**: square
- **Description**: Upward force in fluid

---

## Quantum Mechanics (양자역학)

### Uncertainty Principle (불확정성 원리)
- **ID**: `uncertainty`
- **Formula**: `ΔxΔp ≥ ℏ/2`
- **Shapes Used**: **diamond (Gem)**
- **Description**: Position and momentum cannot both be precisely known simultaneously

### Infinite Square Well (무한 퍼텐셜 우물)
- **ID**: `infinite-well`
- **Formula**: `Eₙ = n²ℏ²π²/2mL²`
- **Shapes Used**: **diamond (Gem)**
- **Description**: Quantized energy levels of a particle confined in a box

### Quantum Tunneling (양자 터널링)
- **ID**: `tunneling`
- **Formula**: `T ≈ e⁻²ᵏᴸ`
- **Shapes Used**: **diamond (Gem)**
- **Description**: Particles can probabilistically pass through classically forbidden barriers

### Bohr Model (보어 모형)
- **ID**: `bohr`
- **Formula**: `Eₙ = -13.6/n² eV`
- **Shapes Used**: circle, **pentagon (Penta)**
- **Description**: Quantized electron orbits in hydrogen atom with photon emission/absorption

---

## Chemistry (화학) - NEW

### pH Scale (pH 산성도)
- **ID**: `ph`
- **Formula**: `pH = -log[H⁺]`
- **Shapes Used**: circle (H+ ions, OH- ions)
- **Description**: Negative logarithm of hydrogen ion concentration. Shows solution color changing from red (acidic) to green (neutral) to blue/purple (basic)

### Dilution Formula (희석 공식)
- **ID**: `dilution`
- **Formula**: `M₁V₁ = M₂V₂`
- **Shapes Used**: circle (solute molecules)
- **Description**: Amount of solute remains constant before and after dilution. Visualizes solute spreading as water is added

### Rate Law (반응 속도 법칙)
- **ID**: `reaction-rate`
- **Formula**: `r = k[A]ⁿ`
- **Shapes Used**: circle (reactants), star (products)
- **Description**: Reaction rate is proportional to concentration raised to a power. Shows particles colliding and transforming

---

## Shape Usage Summary

Current shape usage across all scenes:

| Shape | Count | Used In |
|-------|-------|---------|
| circle | 32 | Most scenes (protagonist), **bohr** (electron), **ph**, **dilution**, **reaction-rate** |
| square | 18 | Many scenes (secondary character) |
| triangle | 1 | **pressure** |
| star | 2 | **wien**, **reaction-rate** (products) |
| diamond | 4 | **uncertainty**, **infinite-well**, **tunneling** (Gem - quantum particle) |
| pentagon | 2 | **torque**, **bohr** (nucleus) |

### Shape-Featured Formulas

These formulas specifically showcase each character shape:

- **triangle (Spike)**: `pressure` - Spike presses down, demonstrating P = F/A
- **star (Twinkle)**: `wien` - Twinkle glows different colors based on temperature
- **pentagon (Penta)**: `torque` - Penta pushes lever arm to create rotation
- **diamond (Gem)**: `uncertainty`, `infinite-well`, `tunneling` - Gem represents the elusive quantum particle
- **pentagon (Penta)**: `bohr` - Penta as the stable nucleus with orbiting electron

---

## Adding New Formulas

To add a new formula:

1. Create `src/formulas/{formula-id}.ts` implementing `Formula` interface
2. Register in `src/formulas/registry.ts`
3. Create `src/components/canvas/scenes/{Name}Scene.ts` extending `BaseScene`
4. Register scene in `SceneManager.ts`
5. Update this document with the new formula details

### Formula Selection Criteria

**Good formulas have:**
- Clear input→output relationship
- Visual causality (users see "why" output changes)
- Appropriate parameter range (noticeable visual differences)
- Simple conceptual model (1-3 key elements)

**Avoid formulas with:**
- Abstract relationships (no clear visual metaphor)
- Too many variables (>3-4 parameters)
- Imperceptible differences
- Requirements for prior knowledge
