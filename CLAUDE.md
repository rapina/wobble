# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wobble is a physics education app built with React 19 + TypeScript + Vite 7, packaged as a mobile app using Capacitor 8 (Android). It visualizes 44+ physics formulas through animated PixiJS scenes where users can manipulate input variables and observe real-time outputs. The app also features a survivor roguelike mode, a dive mini-game, and an idle research lab — all themed around physics.

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
- **registry.ts**: Central registry mapping formula IDs to implementations (44 formulas across 9 categories)

To add a new formula:
1. Create `src/formulas/{formula-name}.ts` implementing `Formula`
2. Register in `src/formulas/registry.ts`
3. Create corresponding scene in `src/components/canvas/scenes/`
4. Register scene in `SceneManager.ts`
5. Update `FORMULAS.md` with the new formula details

See `FORMULAS.md` for the complete list of implemented formulas and their status.

### Scene System (`src/components/canvas/scenes/`)

PixiJS-based animations (57 scene files). Each scene extends `BaseScene`:

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

- **Zustand stores** (`stores/`): Multiple persisted stores for simulation, purchases, collection, progress, achievements, lab, challenges, etc.
- **useSimulation hook**: Convenient access to simulation state and setters

### Screen Flow

`GameScreen` → `HomeScreen` (mode selection) → `SandboxScreen` / `GameSelectScreen` / `LabScreen` / etc.

The UI uses a Balatro-inspired visual theme with card-based parameter controls.

### Path Aliases

`@/*` maps to `./src/*` (configured in both vite.config.ts and tsconfig.app.json)

### Platform-Specific Behavior

The app detects native vs. web via `Capacitor.isNativePlatform()`:

- **Ads**: Native shows AdMob banners; web shows a Google Play Store link banner (`PlayStoreBanner` component)
- **Mobile Frame**: Web defaults to fullscreen (no device frame). Users can enable a 9:16 mobile simulation via Settings toggle (`useMobileFrameStore` in `DevOptionsModal.tsx`)
- **Language**: Web defaults to English; native defaults to Korean (configured in `src/i18n/index.ts`)
- **useAdMob hook** (`src/hooks/useAdMob.ts`): Initializes AdMob and manages banner visibility on native

### UI Components

- **FormulaLayout** (`controls/FormulaLayout.tsx`): Renders mathematical expressions with custom displayLayout
  - Supports: `var`, `op`, `text`, `group`, `fraction` element types
  - Recursive rendering for nested expressions
- **ParameterCard/OutputCard**: Card-based variable display with compact mode for fractions
- **SettingsModal**: Music toggle, mobile simulation toggle (web only), data reset
- **PlayStoreBanner**: Google Play download link shown on web in place of ad banners

## Key Technical Notes

- **TypeScript class fields**: Uses `useDefineForClassFields: true`. Scene classes use `declare` keyword for properties initialized in `setup()` to avoid overwriting
- **Capacitor**: Android native wrapper. Build output goes to `dist/`, which Capacitor syncs to Android
- **PixiJS v8**: Canvas rendering library for physics visualizations
- **JAVA_HOME**: Android builds require `JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-24.jdk/Contents/Home`
- **i18n**: 7 languages supported (en, ko, ja, es, pt, zh-CN, zh-TW). Web fallback is English, native fallback is Korean.

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

### Good Formula Characteristics

1. **Clear Input-Output Relationship**: The effect of changing input variables should be immediately visible
2. **Visual Causality**: Users can see "why" the output changes
3. **Appropriate Parameter Range**: Variable changes produce noticeable visual differences
4. **Simple Conceptual Model**: Can be represented with 1-3 key elements

### Formulas to Avoid

1. **Abstract Relationships**: No clear visual metaphor
2. **Too Many Variables**: More than 3-4 input parameters becomes overwhelming
3. **Imperceptible Differences**: Output changes are too subtle
4. **Requires Prior Knowledge**: Concept isn't self-explanatory from animation

### Reference Implementation

**Snell's Law** is the gold standard for intuitive visualization:
- Light blob travels along actual ray path
- Media density shown through color/opacity
- Angle change is immediate and obvious
- Wavy surface adds life without distracting
- Bubbles provide environmental context

## Physics Lab System (Idle Factory)

Rimworld-style idle factory where Wobble workers research physics properties. Resources are used to upgrade stats that apply to all mini-games.

### Core Game Loop

```
Worker Assignment → Resource Production (idle) → Stat Upgrades → Mini-game Performance Boost
       ↑                                                                    ↓
       └──────────────── Unlock more Wobbles ←─────────────────────────────┘
```

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

const labStats = useLabStore.getState().getAppliedStats()
// { gravityMultiplier, momentumMultiplier, elasticityMultiplier, thermodynamicsMultiplier }

const finalHP = baseHP * labStats.gravityMultiplier
const finalSpeed = baseSpeed * labStats.momentumMultiplier
const finalDamage = baseDamage * labStats.elasticityMultiplier
const damageReduction = labStats.thermodynamicsMultiplier - 1
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
// From labConfig.ts — Cost: baseCost × (costMultiplier ^ level), Effect: level × effectPerLevel
export const UPGRADES: Record<PhysicsProperty, UpgradeConfig> = {
    gravity: { baseCost: 1000, costMultiplier: 1.35, effectPerLevel: 0.05, maxLevel: 100 },
    momentum: { baseCost: 1000, costMultiplier: 1.35, effectPerLevel: 0.03, maxLevel: 100 },
    elasticity: { baseCost: 1000, costMultiplier: 1.35, effectPerLevel: 0.04, maxLevel: 100 },
    thermodynamics: { baseCost: 1000, costMultiplier: 1.35, effectPerLevel: 0.02, maxLevel: 100 },
}
```

### Offline Production

The lab store automatically calculates offline production when the app reopens. Call `useSyncLabOnMount()` in LabScreen to trigger sync on mount.
