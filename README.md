# Wobble

A physics education app that lets you **feel** physics through interactive animations. Built with React + TypeScript + Vite, packaged as a mobile app with Capacitor.

**[Try the live demo](https://wobble-liart.vercel.app/)**

## What is Wobble?

Wobble visualizes 44+ physics formulas through animated PixiJS scenes. Users manipulate input variables with sliders and observe real-time changes in output — making abstract formulas tangible and intuitive.

## Features

- **Sandbox Mode**: Explore physics formulas with interactive parameter controls
- **Wobblediver**: Dive-and-dodge mini-game with physics-powered upgrades
- **Collection System**: Unlock and collect Wobble characters with unique shapes
- **44+ Formulas**: Mechanics, thermodynamics, optics, electricity, quantum mechanics, and more

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 7 |
| Rendering | PixiJS 8 |
| Animation | GSAP |
| State | Zustand |
| Styling | TailwindCSS 4 |
| i18n | i18next (en, ko, ja, es, pt, zh-CN, zh-TW) |
| Mobile | Capacitor 8 (Android) |

## Getting Started

```bash
npm install
npm run dev        # Start Vite dev server (http://localhost:5173)
```

### Build & Deploy

```bash
npm run build            # TypeScript check + Vite production build
npm run android:build    # Build web + sync Capacitor + Gradle assembleDebug
npm run android:deploy   # Build + install APK to connected device
```

Android builds require `JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-24.jdk/Contents/Home`.

## Project Structure

```
src/
├── formulas/          # 44+ physics formula definitions
├── components/
│   ├── screens/       # App screens (Home, Sandbox, Lab, etc.)
│   ├── canvas/        # PixiJS scenes and rendering
│   │   ├── scenes/    # Per-formula visualization scenes
│   │   ├── minigame/  # Wobblediver
│   │   └── intro/     # Intro sequence
│   ├── controls/      # Parameter sliders, formula display
│   └── ui/            # Modals, banners, shared UI
├── stores/            # Zustand state stores
├── hooks/             # Custom React hooks
├── i18n/              # Internationalization (7 languages)
├── config/            # Game configuration
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Documentation

- **[Formula Audit](./docs/FORMULA_AUDIT.md)** — All 48 formulas verified against textbook equations
- **[CLAUDE.md](./CLAUDE.md)** — AI assistant guidance for this codebase

## License

Proprietary. Copyright 2026 Sputnik Workshop.
