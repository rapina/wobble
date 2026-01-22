# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wobble is a physics education app built with React + TypeScript + Vite, packaged as a mobile app using Capacitor. It visualizes physics formulas through animated PixiJS scenes where users can manipulate input variables and observe real-time outputs.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server

# Build
npm run build        # TypeScript check + Vite build (outputs to dist/)
npm run lint         # ESLint

# Android deployment
npm run android:build   # Build web + sync Capacitor + Gradle assembleDebug
npm run android:deploy  # Build + install APK to connected device
```

## Architecture

### Formula System (`src/formulas/`)

Each physics formula is defined in its own file implementing the `Formula` interface from `types.ts`:

- **Variables**: Defined with `role: 'input'` or `role: 'output'`, ranges, defaults, and visual mappings
- **calculate()**: Computes output values from input values
- **layout**: Defines visualization type (`linear`, `orbital`, `wave`, `spring`, etc.)
- **applications**: Optional array of real-world usage examples (displayed in info popup)
- **displayLayout**: Custom expression rendering for mathematical formulas (supports fractions, groups, operators)
- **registry.ts**: Central registry mapping formula IDs to implementations

To add a new formula:
1. Create `src/formulas/{formula-name}.ts` implementing `Formula`
2. Register in `src/formulas/registry.ts`
3. Create corresponding scene in `src/components/canvas/scenes/`
4. Register scene in `SceneManager.ts`
5. Update `FORMULAS.md` with the new formula details

See `FORMULAS.md` for the complete list of implemented formulas and their status.

### Scene System (`src/components/canvas/scenes/`)

PixiJS-based animations. Each scene extends `BaseScene`:

- **setup()**: Initialize graphics and objects (called once)
- **animate(ticker)**: Called every frame for animation
- **onVariablesChange()**: React to slider/input changes
- **SceneManager.ts**: Maps formula IDs to scene classes

The `Wobble` class (`canvas/Wobble.ts`) provides reusable animated character graphics with expressions, shapes, legs, sweat effects, and speed lines. See `FORMULAS.md` for character shape details and usage.

### Survivor Mode Skill System (`src/components/canvas/adventure/survivor/skills/`)

Physics-based skill system for adventure/survivor mode. Each skill is connected to a physics formula.

- **Skill Categories**: `projectile`, `aura`, `orbital`, `player`, `trigger`
- **Activation Types**: `passive` (always active), `aura` (persistent effect), `active` (cooldown-based)
- **BaseSkillBehavior**: Base class for skill implementations
- **SkillCombiner**: Combines multiple skill stats (multiplicative, max-based, additive)
- **registry.ts**: Central skill registration via `registerSkill()`

See `SKILLS.md` for the complete list of implemented skills with visual characteristics and effects.

### State Management

- **Zustand store** (`stores/simulationStore.ts`): Holds current formula and variable values
- **useSimulation hook**: Convenient access to simulation state and setters

### Screen Flow

`GameScreen` → `HomeScreen` (mode selection) → `SimulationScreen` (canvas + parameter controls)

The UI uses a Balatro-inspired visual theme with card-based parameter controls and a bottom sheet for formula selection.

### Path Aliases

`@/*` maps to `./src/*` (configured in both vite.config.ts and tsconfig.app.json)

### AdMob Integration (`src/hooks/useAdMob.ts`)

Banner ads using `@capacitor-community/admob`:

- **useAdMob hook**: Initializes AdMob and manages banner visibility
- **Test Ad IDs**: Configured for development (Android: `ca-app-pub-3940256099942544/6300978111`)
- **AndroidManifest.xml**: Contains AdMob App ID in meta-data
- **SimulationScreen**: Shows real ads on native, placeholder on web

### UI Components

- **FormulaLayout** (`controls/FormulaLayout.tsx`): Renders mathematical expressions with custom displayLayout
  - Supports: `var`, `op`, `text`, `group`, `fraction` element types
  - Recursive rendering for nested expressions
- **ParameterCard/OutputCard**: Card-based variable display with compact mode for fractions
- **BottomSheet**: Formula list selection with snap points
- **Info Popup**: Shows formula applications (real-world usage examples)

## Key Technical Notes

- **TypeScript class fields**: Uses `useDefineForClassFields: true`. Scene classes use `declare` keyword for properties initialized in `setup()` to avoid overwriting
- **Capacitor**: Android native wrapper. Build output goes to `dist/`, which Capacitor syncs to Android
- **PixiJS v8**: Canvas rendering library for physics visualizations
- **JAVA_HOME**: Android builds require `JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-24.jdk/Contents/Home`

## DisplayLayout Type System

Custom formula expression rendering defined in `src/formulas/types.ts`:

```typescript
type ExpressionElement =
    | { type: 'var'; symbol: string; square?: boolean }  // Variable card
    | { type: 'op'; value: string }                       // Operator (+, -, ×, etc.)
    | { type: 'text'; value: string }                     // Constant text (k, G, etc.)
    | { type: 'group'; items: ExpressionElement[] }       // Grouped expression
    | { type: 'fraction'; numerator: ExpressionElement[]; denominator: ExpressionElement[] }
```

Example for `F = mv²/r`:
```typescript
displayLayout: {
    type: 'custom',
    output: 'F',
    expression: [{
        type: 'fraction',
        numerator: [
            { type: 'var', symbol: 'm' },
            { type: 'var', symbol: 'v', square: true },
        ],
        denominator: [{ type: 'var', symbol: 'r' }],
    }],
}
```

## Formula Selection Criteria

When adding or reviewing physics formulas, apply these criteria to ensure intuitive visualization:

### ✓ Good Formula Characteristics

1. **Clear Input→Output Relationship**: The effect of changing input variables should be immediately visible
   - Example: Snell's Law - changing incident angle directly shows refracted angle change
   - Example: Lens formula - object distance change shows image position/size change

2. **Visual Causality**: Users can see "why" the output changes
   - Example: Reflection - light blob bounces off mirror at same angle
   - Example: Total internal reflection - light dramatically changes behavior at critical angle

3. **Appropriate Parameter Range**: Variable changes produce noticeable visual differences
   - Bad: Sound speed (331-361 m/s, only 9% difference - imperceptible)
   - Good: Snell's Law (angles 0-85° - dramatic visible change)

4. **Simple Conceptual Model**: Can be represented with 1-3 key elements
   - Example: Reflection needs only: light source, mirror, angles
   - Example: Entropy needs: container, particles, temperature

### ✗ Formulas to Avoid

1. **Abstract Relationships**: No clear visual metaphor
   - Diffraction patterns - interference is mathematically beautiful but visually confusing

2. **Too Many Variables**: More than 3-4 input parameters becomes overwhelming
   - Diffraction grating had λ, d, n, θ - too complex for mobile screen

3. **Imperceptible Differences**: Output changes are too subtle
   - Sound speed variation with temperature - speed difference not visible

4. **Requires Prior Knowledge**: Concept isn't self-explanatory from animation
   - Doppler effect - frequency shift concept is abstract without sound

### Reference Implementation

**Snell's Law** is the gold standard for intuitive visualization:
- Light blob travels along actual ray path
- Media density shown through color/opacity
- Angle change is immediate and obvious
- Wavy surface adds life without distracting
- Bubbles provide environmental context

## Scene Enhancements

Notable scene implementations:

- **SnellScene**: Fluid-like lower medium with animated waves and bubble particles
- **IdealGasScene**: Volume visualization with scale bar, piston, flash effects on changes
- **CentripetalScene**: Circular motion with force arrow visualization
- **GravityScene**: Orbital motion between two masses

## Physics Lab System (Idle Factory)

Rimworld-style idle factory where Wobble workers research physics properties. Resources are used to upgrade stats that apply to all mini-games.

### Core Game Loop

```
Worker Assignment → Resource Production (idle) → Stat Upgrades → Mini-game Performance Boost
       ↑                                                                    ↓
       └──────────────── Unlock more Wobbles ←─────────────────────────────┘
```

### File Structure

| File | Purpose |
|------|---------|
| `src/types/lab.ts` | Type definitions for lab system |
| `src/config/labConfig.ts` | Station configs, simulation params, upgrade costs |
| `src/stores/labStore.ts` | Zustand store with persistence + offline calculation |
| `src/components/screens/LabScreen.tsx` | Main React screen with UI |
| `src/components/canvas/lab/LabScene.ts` | PixiJS scene controller |
| `src/components/canvas/lab/WorkStation.ts` | Station with physics simulation |
| `src/components/canvas/lab/LabWorkerSprite.ts` | Worker Wobble with AI behavior |
| `src/components/canvas/lab/ResourcePopup.ts` | +N popup effect |

### Physics Properties

Each property maps to a research station with a mini physics simulation:

| Property | Symbol | Station | Simulation | Effect |
|----------|--------|---------|------------|--------|
| `gravity` | G | Gravity Lab | Orbital (planets) | HP/Mass multiplier |
| `momentum` | p | Accelerator | Particle ring | Speed multiplier |
| `elasticity` | e | Collision Lab | Bouncing balls | Damage multiplier |
| `thermodynamics` | Q | Thermo Lab | Heat particles | Damage reduction |

### Applying Stats in Mini-games

```typescript
import { useLabStore } from '@/stores/labStore'

// Get applied stats (multipliers already calculated from levels)
const labStats = useLabStore.getState().getAppliedStats()

// labStats contains:
// {
//   gravityMultiplier: number,      // 1.0 + (level × 0.05)
//   momentumMultiplier: number,     // 1.0 + (level × 0.03)
//   elasticityMultiplier: number,   // 1.0 + (level × 0.04)
//   thermodynamicsMultiplier: number // 1.0 + (level × 0.02)
// }

// Example usage in a mini-game:
const finalHP = baseHP * labStats.gravityMultiplier
const finalSpeed = baseSpeed * labStats.momentumMultiplier
const finalDamage = baseDamage * labStats.elasticityMultiplier
const damageReduction = labStats.thermodynamicsMultiplier - 1  // Convert to reduction %
```

### Current Implementations

**PhysicsSurvivorScene** (`src/components/canvas/adventure/PhysicsSurvivorScene.ts`):
```typescript
const labStats = useLabStore.getState().getAppliedStats()
this.stats.damageMultiplier = wobbleStats.damageMultiplier * labStats.elasticityMultiplier
this.stats.moveSpeedMultiplier = wobbleStats.moveSpeedMultiplier * labStats.momentumMultiplier
this.labDamageReduction = labStats.thermodynamicsMultiplier - 1
this.maxPlayerHealth = baseMaxHealth * healthMultiplier * labStats.gravityMultiplier
```

**Wobblediver RunStore** (`src/stores/runStore.ts`):
```typescript
const labStats = useLabStore.getState().getAppliedStats()
const startingHP = Math.round(DEFAULT_RUN_HP.startingHP * labStats.gravityMultiplier)
const maxHP = Math.round(DEFAULT_RUN_HP.maxHP * labStats.gravityMultiplier)
```

### Character Specialization Bonuses

Certain Wobble shapes get +100% production bonus at specific stations:

| Shape | Bonus Resource | Rationale |
|-------|---------------|-----------|
| circle (Newton) | gravity | Gravity expert |
| einstein | momentum | Relativity |
| diamond (Maxwell) | thermodynamics | Thermodynamics |
| triangle (Spike) | elasticity | Collision expert |

### Upgrade System

Each physics property can be upgraded using its corresponding resource:

```typescript
// From labConfig.ts
export const UPGRADES: Record<PhysicsProperty, UpgradeConfig> = {
    gravity: { baseCost: 1000, costMultiplier: 1.35, effectPerLevel: 0.05, maxLevel: 100 },
    momentum: { baseCost: 1000, costMultiplier: 1.35, effectPerLevel: 0.03, maxLevel: 100 },
    elasticity: { baseCost: 1000, costMultiplier: 1.35, effectPerLevel: 0.04, maxLevel: 100 },
    thermodynamics: { baseCost: 1000, costMultiplier: 1.35, effectPerLevel: 0.02, maxLevel: 100 },
}

// Cost formula: baseCost × (costMultiplier ^ currentLevel)
// Effect formula: level × effectPerLevel (additive)
```

### Offline Production

The lab store automatically calculates offline production when the app reopens:

```typescript
// In labStore.ts
syncOfflineProgress(): void {
    const now = Date.now()
    const elapsed = (now - this.lastSyncAt) / 1000  // seconds
    // Calculate production for each assigned worker during elapsed time
    // Add to resources
}
```

Call `useSyncLabOnMount()` in LabScreen to trigger sync on mount.
