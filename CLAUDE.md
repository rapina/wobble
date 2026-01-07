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

### Scene System (`src/components/canvas/scenes/`)

PixiJS-based animations. Each scene extends `BaseScene`:

- **setup()**: Initialize graphics and objects (called once)
- **animate(ticker)**: Called every frame for animation
- **onVariablesChange()**: React to slider/input changes
- **SceneManager.ts**: Maps formula IDs to scene classes

The `Blob` class (`canvas/Blob.ts`) provides reusable animated character graphics with expressions, shapes, legs, sweat effects, and speed lines.

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

## Scene Enhancements

Notable scene implementations:

- **SnellScene**: Fluid-like lower medium with animated waves and bubble particles
- **IdealGasScene**: Volume visualization with scale bar, piston, flash effects on changes
- **CentripetalScene**: Circular motion with force arrow visualization
- **GravityScene**: Orbital motion between two masses
